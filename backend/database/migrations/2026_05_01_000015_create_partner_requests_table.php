<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_requests', function (Blueprint $table) {
            $table->id();

            $table->string('company_name');
            $table->string('country_region')->nullable();
            $table->string('state')->nullable();
            $table->string('city')->nullable();
            $table->string('sub_city')->nullable();
            $table->string('street')->nullable();
            $table->string('building')->nullable();
            $table->string('po_box')->nullable();
            $table->string('website')->nullable();
            $table->string('company_email');
            $table->string('field_of_interest')->nullable();
            $table->string('phone')->nullable();
            $table->string('contact_person')->nullable();
            $table->text('message')->nullable();

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('decision_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();

            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->dateTime('rejected_at')->nullable();

            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['company_email', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_requests');
    }
};

