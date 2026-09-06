<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_decks', function (Blueprint $table) {
            $table->boolean('allow_multiple')->default(true)->after('passing_percentage');
            $table->boolean('allow_fill')->default(true)->after('allow_multiple');
            $table->boolean('allow_swipe')->default(true)->after('allow_fill');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_decks', function (Blueprint $table) {
            $table->dropColumn(['allow_multiple', 'allow_fill', 'allow_swipe']);
        });
    }
};
