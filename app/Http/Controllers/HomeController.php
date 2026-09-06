<?php

namespace App\Http\Controllers;

use App\Models\QuizDeck;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $decks = QuizDeck::query()
            ->where('is_public', true)
            ->with(['owner:id,name'])
            ->when($user, function ($query) use ($user) {
                $query->with([
                    'attempts' => function ($attemptQuery) use ($user) {
                        $attemptQuery->where('user_id', $user->id)
                            ->latest('taken_at');
                    },
                ]);
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(function (QuizDeck $deck) {
                $attempt = $deck->attempts->first();

                return [
                    'id' => $deck->id,
                    'title' => $deck->title,
                    'image_url' => $this->resolveImageUrl($deck->image_path),
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

        return Inertia::render('Dashboard', [
            'publicDecks' => $decks,
        ]);
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
}
