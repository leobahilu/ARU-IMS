<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Company;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $departments = collect([
            ['code' => 'IT', 'name' => 'Information Technology'],
            ['code' => 'IS', 'name' => 'Information Systems'],
            ['code' => 'CS', 'name' => 'Computer Science'],
            ['code' => 'MED', 'name' => 'Medicine'],
            ['code' => 'HEALTH', 'name' => 'Health Sciences'],
            ['code' => 'LAW', 'name' => 'Law'],
            ['code' => 'AGRI', 'name' => 'Agriculture'],
            ['code' => 'ECON', 'name' => 'Economics'],
        ])->map(function (array $dept) {
            return Department::firstOrCreate(['code' => $dept['code']], ['name' => $dept['name']]);
        })->keyBy('code');

        $dept = $departments->get('CS');

        $company = Company::firstOrCreate(
            ['contact_email' => 'hr@acme.test'],
            [
                'name' => 'Acme Ltd',
                'industry' => 'Technology',
                'description' => 'Demo company',
                'website' => 'https://example.com',
                'address' => 'Demo Address',
                'city' => 'Demo City',
                'country' => 'Demo Country',
                'contact_person' => 'HR',
                'contact_phone' => '0000000000',
                'is_verified' => true,
            ]
        );

        // Create Super-Admin (no department needed)
        User::updateOrCreate(
            ['email' => 'superadmin@aru.test'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'password' => Hash::make('password123'),
                'role' => 'super_admin',
                'department_id' => null,
                'is_active' => true,
            ]
        );

        // Create users for each department to demonstrate Super-Admin capabilities
        $departments->each(function ($department) use ($company) {
            // Department Coordinator
            User::updateOrCreate(
                ['email' => "coordinator_{$department->code}@aru.test"],
                [
                    'first_name' => ucfirst(strtolower($department->code)),
                    'last_name' => 'Coordinator',
                    'password' => Hash::make('password123'),
                    'role' => 'coordinator',
                    'department_id' => $department->id,
                    'is_active' => true,
                ]
            );

            // Students in each department
            for ($i = 1; $i <= 3; $i++) {
                User::updateOrCreate(
                    ['email' => "student_{$i}_{$department->code}@aru.test"],
                    [
                        'first_name' => "Student{$i}",
                        'last_name' => ucfirst(strtolower($department->code)),
                        'password' => Hash::make('password123'),
                        'role' => 'student',
                        'department_id' => $department->id,
                        'is_active' => true,
                    ]
                );
            }

            // Examiner in each department
            User::updateOrCreate(
                ['email' => "examiner_{$department->code}@aru.test"],
                [
                    'first_name' => 'Examiner',
                    'last_name' => ucfirst(strtolower($department->code)),
                    'password' => Hash::make('password123'),
                    'role' => 'examiner',
                    'department_id' => $department->id,
                    'is_active' => true,
                ]
            );

            // Advisor in each department
            User::updateOrCreate(
                ['email' => "advisor_{$department->code}@aru.test"],
                [
                    'first_name' => 'Advisor',
                    'last_name' => ucfirst(strtolower($department->code)),
                    'password' => Hash::make('password123'),
                    'role' => 'advisor',
                    'department_id' => $department->id,
                    'is_active' => true,
                ]
            );
        });

        // Additional companies for testing
        $companies = [
            ['name' => 'Tech Solutions Inc', 'email' => 'hr@techsolutions.test'],
            ['name' => 'Digital Innovations', 'email' => 'contact@digitalinnovations.test'],
            ['name' => 'Healthcare Systems', 'email' => 'recruitment@healthcare.test'],
        ];

        foreach ($companies as $companyData) {
            Company::firstOrCreate(
                ['contact_email' => $companyData['email']],
                [
                    'name' => $companyData['name'],
                    'industry' => 'Technology',
                    'description' => 'Demo company for testing',
                    'website' => 'https://example.com',
                    'address' => 'Demo Address',
                    'city' => 'Demo City',
                    'country' => 'Demo Country',
                    'contact_person' => 'HR Department',
                    'contact_phone' => '0000000000',
                    'is_verified' => true,
                ]
            );
        }

        // Company users
        $companyIndex = 1;
        Company::all()->each(function ($company) use (&$companyIndex) {
            User::updateOrCreate(
                ['email' => "company_{$companyIndex}@aru.test"],
                [
                    'first_name' => 'Company',
                    'last_name' => 'User' . $companyIndex,
                    'password' => Hash::make('password123'),
                    'role' => 'company',
                    'company_id' => $company->id,
                    'is_active' => true,
                ]
            );
            $companyIndex++;
        });
    }
}
