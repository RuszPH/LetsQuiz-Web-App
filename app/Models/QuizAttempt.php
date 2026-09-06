<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttempt extends Model
{
    protected $fillable = [
        'quiz_deck_id',
        'user_id',
        'score',
        'correct_count',
        'total_questions',
        'passed',
        'taken_at',
    ];

    protected $casts = [
        'taken_at' => 'datetime',
        'passed' => 'boolean',
    ];

    public function deck(): BelongsTo
    {
        return $this->belongsTo(QuizDeck::class, 'quiz_deck_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
