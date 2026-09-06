<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\FlashCardModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizDeck extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'image_path',
        'is_public',
        'passing_percentage',
        'allow_multiple',
        'allow_fill',
        'allow_swipe',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'allow_multiple' => 'boolean',
        'allow_fill' => 'boolean',
        'allow_swipe' => 'boolean',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function flashCards(): HasMany
    {
        return $this->hasMany(FlashCardModel::class, 'quiz_deck_id');
    }
}
