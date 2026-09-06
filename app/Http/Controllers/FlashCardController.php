<?php

namespace App\Http\Controllers;

use App\Models\FlashCardModel;
use App\Models\QuizDeck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FlashCardController extends Controller
{
    public function index(Request $request, QuizDeck $quizDeck): Response
    {
        $this->ensureOwner($request, $quizDeck);
        $canEdit = true;

        $cards = $quizDeck->flashCards()
            ->orderBy('created_at')
            ->get()
            ->map(function (FlashCardModel $card) {
                return [
                    'id' => $card->id,
                    'title' => $card->title,
                    'question' => $card->question,
                    'answer' => $card->answer,
                    'image_url' => $this->resolveImageUrl($card->image_path),
                ];
            })
            ->values();

        return Inertia::render('Quizzes/Add_View_Card', [
            'deck' => [
                'id' => $quizDeck->id,
                'title' => $quizDeck->title,
                'image_url' => $this->resolveImageUrl($quizDeck->image_path),
                'is_public' => (bool) $quizDeck->is_public,
                'passing_percentage' => (int) ($quizDeck->passing_percentage ?? 70),
                'allow_multiple' => (bool) ($quizDeck->allow_multiple ?? true),
                'allow_fill' => (bool) ($quizDeck->allow_fill ?? true),
                'allow_swipe' => (bool) ($quizDeck->allow_swipe ?? true),
            ],
            'canEdit' => (bool) $canEdit,
            'cards' => $cards,
        ]);
    }

    public function play(Request $request, QuizDeck $quizDeck): Response
    {
        $user = $request->user();
        $canView = $quizDeck->is_public
            || ($user && $quizDeck->user_id === $user->id);

        if (!$canView) {
            abort(403);
        }

        $attempt = null;
        if ($user) {
            $attempt = $quizDeck->attempts()
                ->where('user_id', $user->id)
                ->latest('taken_at')
                ->first();
        }

        $cards = $quizDeck->flashCards()
            ->orderBy('created_at')
            ->get()
            ->map(function (FlashCardModel $card) {
                return [
                    'id' => $card->id,
                    'title' => $card->title,
                    'question' => $card->question,
                    'answer' => $card->answer,
                    'image_url' => $this->resolveImageUrl($card->image_path),
                ];
            })
            ->values();

        return Inertia::render('Quizzes/Public_Quizzes', [
            'deck' => [
                'id' => $quizDeck->id,
                'title' => $quizDeck->title,
                'image_url' => $this->resolveImageUrl($quizDeck->image_path),
                'is_public' => (bool) $quizDeck->is_public,
                'passing_percentage' => (int) ($quizDeck->passing_percentage ?? 70),
                'allow_multiple' => (bool) ($quizDeck->allow_multiple ?? true),
                'allow_fill' => (bool) ($quizDeck->allow_fill ?? true),
                'allow_swipe' => (bool) ($quizDeck->allow_swipe ?? true),
                'owner' => [
                    'id' => $quizDeck->owner->id,
                    'name' => $quizDeck->owner->name,
                ],
                'attempt' => $attempt ? [
                    'score' => $attempt->score,
                    'passed' => $attempt->passed,
                    'correct_count' => $attempt->correct_count,
                    'total_questions' => $attempt->total_questions,
                    'taken_at' => $attempt->taken_at?->toDateTimeString(),
                ] : null,
            ],
            'cards' => $cards,
        ]);
    }

    public function store(Request $request, QuizDeck $quizDeck): RedirectResponse
    {
        $this->ensureOwner($request, $quizDeck);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'question' => ['required', 'string'],
            'answer' => ['required', 'string'],
            'image' => ['nullable', 'image', 'max:10240'],
        ]);

        $payload = [
            'user_id' => $request->user()->id,
            'title' => $validated['title'] ?? null,
            'question' => $validated['question'],
            'answer' => $validated['answer'],
        ];

        if ($request->hasFile('image')) {
            $payload['image_path'] = $this->uploadCardImage(
                $request->file('image')
            );
        }

        $quizDeck->flashCards()->create($payload);

        return redirect()->route('quiz-decks.cards', $quizDeck->id);
    }

    public function update(
        Request $request,
        QuizDeck $quizDeck,
        FlashCardModel $flashCard
    ): RedirectResponse {
        $this->ensureOwner($request, $quizDeck);

        if ($flashCard->quiz_deck_id !== $quizDeck->id) {
            abort(404);
        }

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'question' => ['required', 'string'],
            'answer' => ['required', 'string'],
            'image' => ['nullable', 'image', 'max:10240'],
        ]);

        $payload = [
            'title' => $validated['title'] ?? null,
            'question' => $validated['question'],
            'answer' => $validated['answer'],
        ];

        if ($request->hasFile('image')) {
            $payload['image_path'] = $this->uploadCardImage(
                $request->file('image')
            );
        }

        $flashCard->update($payload);

        return redirect()->route('quiz-decks.cards', $quizDeck->id);
    }

    public function destroy(Request $request, QuizDeck $quizDeck, FlashCardModel $flashCard): RedirectResponse
    {
        $this->ensureOwner($request, $quizDeck);

        if ($flashCard->quiz_deck_id !== $quizDeck->id) {
            abort(404);
        }

        $flashCard->delete();

        return redirect()->route('quiz-decks.cards', $quizDeck->id);
    }

    private function ensureOwner(Request $request, QuizDeck $quizDeck): void
    {
        if ($quizDeck->user_id !== $request->user()->id) {
            abort(403);
        }
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

    private function uploadCardImage(UploadedFile $file): string
    {
        $cloudName = config('services.cloudinary.cloud_name');
        $apiKey = config('services.cloudinary.api_key');
        $apiSecret = config('services.cloudinary.api_secret');
        $folder = 'flash-cards';

        if (!$cloudName || !$apiKey || !$apiSecret) {
            return $file->store('flash-cards', 'public');
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
