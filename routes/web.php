<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuizDeckController;
use App\Http\Controllers\FlashCardController;
use App\Http\Controllers\HomeController;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return Inertia::render('Landing');
});

Route::get('/logout', function (Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
})->name('landing');

Route::get('/Applayout', function () {
    return Inertia::render('Applayout');
})->name('applayout');
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [HomeController::class, 'index'])
        ->name('dashboard');
    Route::get('/home', [HomeController::class, 'index'])
        ->name('home');

    Route::get('/quiz-decks', [QuizDeckController::class, 'index'])
        ->name('quiz-decks.index');
    Route::post('/quiz-decks', [QuizDeckController::class, 'store'])
        ->name('quiz-decks.store');
    Route::patch('/quiz-decks/{quizDeck}', [QuizDeckController::class, 'update'])
        ->name('quiz-decks.update');
    Route::delete('/quiz-decks/{quizDeck}', [QuizDeckController::class, 'destroy'])
        ->name('quiz-decks.destroy');
    Route::patch('/quiz-decks/{quizDeck}/publish', [QuizDeckController::class, 'publish'])
        ->name('quiz-decks.publish');
    Route::patch('/quiz-decks/{quizDeck}/settings', [QuizDeckController::class, 'updateSettings'])
        ->name('quiz-decks.settings');
    Route::post('/quiz-decks/{quizDeck}/attempts', [QuizDeckController::class, 'storeAttempt'])
        ->name('quiz-decks.attempts.store');

    Route::get('/quiz-decks/{quizDeck}/cards', [FlashCardController::class, 'index'])
        ->name('quiz-decks.cards');
    Route::get('/quiz-decks/{quizDeck}/play', [FlashCardController::class, 'play'])
        ->name('quiz-decks.play');
    Route::post('/quiz-decks/{quizDeck}/cards', [FlashCardController::class, 'store'])
        ->name('quiz-decks.cards.store');
    Route::patch('/quiz-decks/{quizDeck}/cards/{flashCard}', [FlashCardController::class, 'update'])
        ->name('quiz-decks.cards.update');
    Route::delete('/quiz-decks/{quizDeck}/cards/{flashCard}', [FlashCardController::class, 'destroy'])
        ->name('quiz-decks.cards.destroy');
});


require __DIR__.'/auth.php';
