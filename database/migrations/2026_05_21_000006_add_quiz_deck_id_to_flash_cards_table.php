<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flash_cards', function (Blueprint $table) {
            $table->foreignId('quiz_deck_id')
                ->nullable()
                ->after('user_id')
                ->constrained('quiz_decks')
                ->cascadeOnDelete();

            $table->index(['quiz_deck_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('flash_cards', function (Blueprint $table) {
            $table->dropForeign(['quiz_deck_id']);
            $table->dropColumn('quiz_deck_id');
        });
    }
};
