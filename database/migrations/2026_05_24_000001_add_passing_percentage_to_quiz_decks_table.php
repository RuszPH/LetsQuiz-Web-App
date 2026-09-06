<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_decks', function (Blueprint $table) {
            $table->unsignedTinyInteger('passing_percentage')
                ->default(70)
                ->after('is_public');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_decks', function (Blueprint $table) {
            $table->dropColumn('passing_percentage');
        });
    }
};
