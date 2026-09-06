<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlashCardModel extends Model
{
    protected $table = 'flash_cards';

    protected $fillable = [
        'user_id',
        'quiz_deck_id',
        'title',
        'image_path',
        'question',
        'answer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function deck(): BelongsTo
    {
        return $this->belongsTo(QuizDeck::class, 'quiz_deck_id');
    }
}
