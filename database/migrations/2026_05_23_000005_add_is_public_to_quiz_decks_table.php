<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_decks', function (Blueprint $table) {
            $table->boolean('is_public')->default(false)->after('image_path');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_decks', function (Blueprint $table) {
            $table->dropColumn('is_public');
        });
    }
};
