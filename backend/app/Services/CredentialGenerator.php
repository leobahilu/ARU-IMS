<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class CredentialGenerator
{
    /**
     * Generate email for a user
     */
    public function generateEmail(string $fullName, string $role = 'student', array $existingEmails = []): string
    {
        $cleanName = strtolower(trim($fullName));
        $cleanName = preg_replace('/[^a-z\s]/', '', $cleanName);
        $nameParts = preg_split('/\s+/', $cleanName);

        $firstName = $nameParts[0] ?? 'user';
        $lastName = count($nameParts) > 1 ? end($nameParts) : $firstName;

        $baseEmail = $firstName . '.' . $lastName;
        $email = $baseEmail . '@arsi.edu.et';

        // Handle duplicates
        $counter = 2;
        while (in_array($email, $existingEmails) || User::where('email', $email)->exists()) {
            $email = $baseEmail . $counter . '@arsi.edu.et';
            $counter++;
        }

        return $email;
    }

    /**
     * Generate secure password
     */
    public function generatePassword(int $length = 12): string
    {
        $uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding O
        $lowercase = 'abcdefghjkmnpqrstuvwxyz'; // Excluding l
        $numbers = '23456789'; // Excluding 0,1
        $specials = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        // Ensure minimum requirements
        $chars = [
            $uppercase[rand(0, strlen($uppercase) - 1)],
            $lowercase[rand(0, strlen($lowercase) - 1)],
            $numbers[rand(0, strlen($numbers) - 1)],
            $numbers[rand(0, strlen($numbers) - 1)],
            $specials[rand(0, strlen($specials) - 1)],
            $specials[rand(0, strlen($specials) - 1)],
        ];

        // Fill remaining characters
        $allChars = $uppercase . $lowercase . $numbers . $specials;
        for ($i = 6; $i < $length; $i++) {
            $chars[] = $allChars[rand(0, strlen($allChars) - 1)];
        }

        // Shuffle the array
        shuffle($chars);

        return implode('', $chars);
    }

    /**
     * Generate company email
     */
    public function generateCompanyEmail(string $companyName, array $existingEmails = []): string
    {
        $cleanName = strtolower(trim($companyName));
        $cleanName = preg_replace('/[^a-z0-9\s]/', '', $cleanName);
        $nameParts = preg_split('/\s+/', $cleanName);

        $baseName = implode('.', $nameParts);
        $email = 'contact@' . $baseName . '.com';

        // Handle duplicates
        $counter = 2;
        while (in_array($email, $existingEmails) || User::where('email', $email)->exists()) {
            $email = 'contact' . $counter . '@' . $baseName . '.com';
            $counter++;
        }

        return $email;
    }

    /**
     * Generate credentials for a user
     */
    public function generateCredentials(string $fullName, string $role = 'student'): array
    {
        $existingEmails = User::pluck('email')->toArray();
        $email = $this->generateEmail($fullName, $role, $existingEmails);
        $password = $this->generatePassword();

        return [
            'email' => $email,
            'password' => $password,
            'hashed_password' => Hash::make($password),
        ];
    }

    /**
     * Generate credentials for a company
     */
    public function generateCompanyCredentials(string $companyName): array
    {
        $existingEmails = User::pluck('email')->toArray();
        $email = $this->generateCompanyEmail($companyName, $existingEmails);
        $password = $this->generatePassword();

        return [
            'email' => $email,
            'password' => $password,
            'hashed_password' => Hash::make($password),
        ];
    }

    /**
     * Validate email uniqueness
     */
    public function isEmailUnique(string $email): bool
    {
        return !User::where('email', $email)->exists();
    }

    /**
     * Log credential generation
     */
    public function logCredentialGeneration(string $email, string $generatedBy, string $purpose): void
    {
        Log::info('Credential generated', [
            'email' => $email,
            'generated_by' => $generatedBy,
            'purpose' => $purpose,
            'timestamp' => now(),
        ]);
    }
}