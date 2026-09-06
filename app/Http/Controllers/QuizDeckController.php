<?php

namespace App\Http\Controllers;

use App\Models\QuizDeck;
use App\Models\QuizAttempt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class QuizDeckController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $decks = QuizDeck::query()
            ->where('user_id', $user->id)
            ->with(['owner:id,name'])
            ->with([
                'attempts' => function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->latest('taken_at');
                },
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (QuizDeck $deck) {
                $attempt = $deck->attempts->first();

                return [
                    'id' => $deck->id,
                    'title' => $deck->title,
                    'image_url' => $this->resolveImageUrl($deck->image_path),
                    'is_public' => (bool) $deck->is_public,
                    'owner' => [
                        'id' => $deck->owner->id,
                        'name' => $deck->owner->name,
                    ],
                    'has_attempted' => $attempt !== null,
                    'latest_score' => $attempt?->score,
                    'latest_passed' => $attempt?->passed,
                    'latest_correct_count' => $attempt?->correct_count,
                    'latest_total_questions' => $attempt?->total_questions,
                    'latest_taken_at' => $attempt?->taken_at?->toDateTimeString(),
                ];
            })
            ->values();

        return Inertia::render('QuizDecks/Index', [
            'decks' => $decks,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:10240'],
        ]);

        $payload = [
            'title' => $validated['title'],
        ];

        if ($request->hasFile('image')) {
            $payload['image_path'] = $this->uploadQuizImage(
                $request->file('image')
            );
        }

        $request->user()->quizDecks()->create($payload);

        return redirect()->route('quiz-decks.index');
    }

    public function update(Request $request, QuizDeck $quizDeck): RedirectResponse
    {
        if ($quizDeck->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:10240'],
        ]);

        $payload = [
            'title' => $validated['title'],
        ];

        if ($request->hasFile('image')) {
            $payload['image_path'] = $this->uploadQuizImage(
                $request->file('image')
            );
        }

        $quizDeck->update($payload);

        return redirect()->route('quiz-decks.index');
    }

    public function destroy(Request $request, QuizDeck $quizDeck): RedirectResponse
    {
        if ($quizDeck->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($quizDeck->image_path && !str_starts_with($quizDeck->image_path, 'http')) {
            Storage::disk('public')->delete($quizDeck->image_path);
        }

        $quizDeck->flashCards()->delete();
        $quizDeck->attempts()->delete();
        $quizDeck->delete();

        return redirect()->route('quiz-decks.index');
    }

    public function publish(Request $request, QuizDeck $quizDeck): RedirectResponse
    {
        if ($quizDeck->user_id !== $request->user()->id) {
            abort(403);
        }

        $isPublic = $request->has('is_public')
            ? (bool) $request->boolean('is_public')
            : ! $quizDeck->is_public;

        $quizDeck->update([
            'is_public' => $isPublic,
        ]);

        return redirect()->back();
    }

    public function storeAttempt(Request $request, QuizDeck $quizDeck): RedirectResponse
    {
        $validated = $request->validate([
            'score' => ['required', 'integer', 'min:0', 'max:100'],
            'correct_count' => ['required', 'integer', 'min:0'],
            'total_questions' => ['required', 'integer', 'min:0'],
        ]);

        $passingPercentage = (int) ($quizDeck->passing_percentage ?? 70);
        $passed = $validated['score'] >= $passingPercentage;

        QuizAttempt::create([
            'quiz_deck_id' => $quizDeck->id,
            'user_id' => $request->user()->id,
            'score' => $validated['score'],
            'correct_count' => $validated['correct_count'],
            'total_questions' => $validated['total_questions'],
            'passed' => $passed,
            'taken_at' => now(),
        ]);

        return redirect()->back();
    }

    public function updateSettings(Request $request, QuizDeck $quizDeck): RedirectResponse
    {
        if ($quizDeck->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'passing_percentage' => ['required', 'integer', 'min:0', 'max:100'],
            'allow_multiple' => ['required', 'boolean'],
            'allow_fill' => ['required', 'boolean'],
            'allow_swipe' => ['required', 'boolean'],
        ]);

        if (!($validated['allow_multiple'] || $validated['allow_fill'] || $validated['allow_swipe'])) {
            throw ValidationException::withMessages([
                'quiz_modes' => 'Select at least one quiz mode.',
            ]);
        }

        $quizDeck->update([
            'passing_percentage' => $validated['passing_percentage'],
            'allow_multiple' => $validated['allow_multiple'],
            'allow_fill' => $validated['allow_fill'],
            'allow_swipe' => $validated['allow_swipe'],
        ]);

        return redirect()->back();
    }

    private function resolveImageUrl(?string $imagePath): ?string
    {
        if ($imagePath === null) {
            return null;
        }

        if (str_starts_with($imagePath, 'http')) {
            return $imagePath;
        }

        return Storage::disk('public')->url($imagePath);
    }

    private function uploadQuizImage(UploadedFile $file): string
    {
        $cloudName = config('services.cloudinary.cloud_name');
        $apiKey = config('services.cloudinary.api_key');
        $apiSecret = config('services.cloudinary.api_secret');
        $folder = 'quiz-decks';

        if (!$cloudName || !$apiKey || !$apiSecret) {
            return $file->store('quiz-decks', 'public');
        }

        $endpoint = sprintf(
            'https://api.cloudinary.com/v1_1/%s/image/upload',
            $cloudName
        );

        $multipart = [
            [
                'name' => 'file',
                'contents' => fopen($file->getRealPath(), 'r'),
                'filename' => $file->getClientOriginalName(),
            ],
            ['name' => 'folder', 'contents' => $folder],
        ];

        $timestamp = time();
        $signature = $this->cloudinarySignature(
            ['folder' => $folder, 'timestamp' => $timestamp],
            $apiSecret
        );

        $multipart[] = ['name' => 'api_key', 'contents' => $apiKey];
        $multipart[] = ['name' => 'timestamp', 'contents' => $timestamp];
        $multipart[] = ['name' => 'signature', 'contents' => $signature];

        $response = Http::asMultipart()->post($endpoint, $multipart);

        if (!$response->successful()) {
            Log::warning('Cloudinary upload failed.', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw ValidationException::withMessages([
                'image' => 'Image upload failed. Please try again.',
            ]);
        }

        $payload = $response->json();
        $url = $payload['secure_url'] ?? $payload['url'] ?? null;

        if (!$url) {
            Log::warning('Cloudinary upload returned no URL.', [
                'payload' => $payload,
            ]);
            throw ValidationException::withMessages([
                'image' => 'Image upload failed. Please try again.',
            ]);
        }

        return $url;
    }

    private function cloudinarySignature(array $params, string $secret): string
    {
        ksort($params);

        $pairs = [];
        foreach ($params as $key => $value) {
            $pairs[] = $key.'='.$value;
        }

        return sha1(implode('&', $pairs).$secret);
    }
}
