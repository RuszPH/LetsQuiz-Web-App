<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->unsignedSmallInteger('correct_count')
                ->default(0)
                ->after('score');
            $table->unsignedSmallInteger('total_questions')
                ->default(0)
                ->after('correct_count');
            $table->boolean('passed')
                ->default(false)
                ->after('total_questions');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropColumn(['correct_count', 'total_questions', 'passed']);
        });
    }
};
