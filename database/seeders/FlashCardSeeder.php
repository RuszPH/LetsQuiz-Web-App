<?php

namespace Database\Seeders;

use App\Models\FlashCardModel;
use App\Models\QuizDeck;
use App\Models\User;
use Illuminate\Database\Seeder;

class FlashCardSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();

        if ($user === null) {
            $user = User::factory()->create([
                'name' => 'Sample User',
                'email' => 'sample@example.com',
            ]);
        }

        $deck = QuizDeck::create([
            'user_id' => $user->id,
            'title' => 'Sample Quiz',
        ]);

        $cards = [
            [
                'title' => 'Biology Basics',
                'question' => 'What is the powerhouse of the cell?',
                'answer' => 'The mitochondria.',
                'image_path' => null,
            ],
            [
                'title' => 'World Capitals',
                'question' => 'What is the capital of Japan?',
                'answer' => 'Tokyo.',
                'image_path' => null,
            ],
            [
                'title' => 'Math Quick Check',
                'question' => 'Solve: 7 x 8.',
                'answer' => '56.',
                'image_path' => 'flashcards/sample-math.png',
            ],
        ];

        foreach ($cards as $card) {
            FlashCardModel::create([
                'user_id' => $user->id,
                'quiz_deck_id' => $deck->id,
                'title' => $card['title'],
                'question' => $card['question'],
                'answer' => $card['answer'],
                'image_path' => $card['image_path'],
            ]);
        }
    }
}
