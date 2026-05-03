<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'advisor_id')) {
                $table->foreignId('advisor_id')
                    ->nullable()
                    ->after('employee_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('users', 'examiner_id')) {
                $table->foreignId('examiner_id')
                    ->nullable()
                    ->after('advisor_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'examiner_id')) {
                $table->dropConstrainedForeignId('examiner_id');
            }
            if (Schema::hasColumn('users', 'advisor_id')) {
                $table->dropConstrainedForeignId('advisor_id');
            }
        });
    }
};

