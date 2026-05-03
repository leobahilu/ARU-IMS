<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    private array $collegeDepartmentMap = [
        'College of Agriculture and Environmental Science' => [
            'Animal Science',
            'Horticulture',
            'Plant Science',
            'Natural Resource Management',
            'Agricultural Economics',
            'Agribusiness and Value Chain Management',
            'Food Science and Post-Harvest Technology',
            'Rural Development and Agricultural Extension',
            'Statistics',
        ],
        'College of Business and Economics' => [
            'Accounting and Finance',
            'Economics',
            'Logistics and Supply Chain Management',
            'Management',
            'Management Information System',
            'Marketing Management',
            'Tourism and Hospitality Management',
            'International Trade and Investment Management',
        ],
        'College of Education and Behavioral Science' => [
            'Educational Leadership and Management',
            'Psychology',
            'Curriculum and Teachers\' Professional Development Studies',
            'Adult Education and Community Development',
            'Special Needs and Inclusive Education',
            'Early Childhood Care and Education',
        ],
        'College of Health Sciences' => [
            'Medicine',
            'Public Health',
            'Animal Health Science',
            'Nursing',
            'Midwifery',
            'Pharmacy',
            'Medical Laboratory',
        ],
        'College of Social Sciences and Humanities' => [
            'English Language and Literature',
            'Oromo Language and Literature',
            'Amharic Language and Literature',
            'History and Heritage Management',
            'Geography and Environmental Studies',
            'Sociology',
            'Social Anthropology',
            'Civics and Ethical Studies',
            'Journalism and Communication',
        ],
        'College of Law' => [
            'Law',
        ],
        'College Computational Sciences' => [
            'Information Technology',
            'Information Systems',
            'Computer Science',
        ],
        'Institute of Oromo Studies' => [
            'Oromo Studies',
            'Oromo Folklore and Literature',
            'Oromo History and Culture',
        ],
    ];

    public function up(): void
    {
        Schema::create('colleges', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code')->unique();
            $table->timestamps();
        });

        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'college_id')) {
                $table->foreignId('college_id')
                    ->nullable()
                    ->after('code')
                    ->constrained('colleges')
                    ->nullOnDelete();
            }
        });

        $this->seedCollegesAndDepartments();
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'college_id')) {
                $table->dropConstrainedForeignId('college_id');
            }
        });

        Schema::dropIfExists('colleges');
    }

    private function seedCollegesAndDepartments(): void
    {
        foreach ($this->collegeDepartmentMap as $collegeName => $departments) {
            $collegeId = DB::table('colleges')->where('name', $collegeName)->value('id');
            if (!$collegeId) {
                $collegeCode = $this->uniqueCode('colleges', $this->makeCode($collegeName));
                $collegeId = DB::table('colleges')->insertGetId([
                    'name' => $collegeName,
                    'code' => $collegeCode,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            foreach ($departments as $deptName) {
                $deptId = DB::table('departments')->where('name', $deptName)->value('id');
                if ($deptId) {
                    DB::table('departments')->where('id', $deptId)->update([
                        'college_id' => $collegeId,
                        'updated_at' => now(),
                    ]);
                    continue;
                }

                $deptCode = $this->uniqueCode('departments', $this->makeCode($deptName));
                DB::table('departments')->insert([
                    'name' => $deptName,
                    'code' => $deptCode,
                    'college_id' => $collegeId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function makeCode(string $name): string
    {
        $slug = Str::upper(Str::slug($name, '_'));
        $slug = preg_replace('/[^A-Z0-9_]/', '', $slug) ?: 'CODE';
        return Str::substr($slug, 0, 12);
    }

    private function uniqueCode(string $table, string $baseCode): string
    {
        $code = $baseCode;
        $i = 1;
        while (DB::table($table)->where('code', $code)->exists()) {
            $suffix = (string) $i;
            $code = Str::substr($baseCode, 0, max(1, 12 - (strlen($suffix) + 1))) . '_' . $suffix;
            $i++;
        }
        return $code;
    }
};

