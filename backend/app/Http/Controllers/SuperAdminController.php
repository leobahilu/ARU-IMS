<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Company;
use App\Models\Department;
use App\Models\Internship;
use App\Models\Application;
use App\Models\PartnerRequest;
use App\Models\College;
use App\Services\CredentialGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{
    protected $credentialGenerator;

    public function __construct(CredentialGenerator $credentialGenerator)
    {
        $this->credentialGenerator = $credentialGenerator;
    }

    /**
     * Dashboard statistics
     */
    public function getDashboardStats()
    {
        $stats = [
            'total_users' => User::count(),
            'students' => User::where('role', 'student')->count(),
            'examiners' => User::where('role', 'examiner')->count(),
            'advisors' => User::where('role', 'advisor')->count(),
            'companies' => User::where('role', 'company')->count(),
            'coordinators' => User::where('role', 'coordinator')->count(),
            'pending_approvals' => PartnerRequest::where('status', 'pending')->count() + Internship::where('submission_status', 'pending')->count(),
            'placement_rate' => $this->calculatePlacementRate(),
        ];

        return response()->json($stats);
    }

    /**
     * AI insights for dashboard
     */
    public function getAIInsights()
    {
        // Mock AI insights - in real implementation, this would call an AI service
        $insights = [
            [
                'type' => 'info',
                'message' => 'Student registration up 15% this month',
                'icon' => '📈'
            ],
            [
                'type' => 'warning',
                'message' => '3 partnership requests pending for 5+ days',
                'icon' => '⚠️'
            ],
            [
                'type' => 'info',
                'message' => 'College of Business has highest internship demand',
                'icon' => '🏢'
            ],
            [
                'type' => 'warning',
                'message' => '8 students unassigned to examiners',
                'icon' => '👥'
            ],
            [
                'type' => 'prediction',
                'message' => 'Predicted: 50 new registrations next week',
                'icon' => '🔮'
            ]
        ];

        return response()->json($insights);
    }

    /**
     * Register student with auto-generated credentials
     */
    public function registerStudent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'department_id' => 'required|exists:departments,id',
            'year' => 'required|integer|min:1|max:4',
            'student_id' => 'required|string|max:50|unique:users,student_id',
            'cgpa' => 'required|numeric|min:0|max:4',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $fullName = $request->first_name . ' ' . $request->last_name;
        $credentials = $this->credentialGenerator->generateCredentials($fullName, 'student');

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $credentials['email'],
            'password' => $credentials['hashed_password'],
            'phone' => $request->phone,
            'role' => 'student',
            'department_id' => $request->department_id,
            'student_id' => $request->student_id,
            'profile_data' => json_encode([
                'cgpa' => $request->cgpa,
                'year' => $request->year,
                'registration_date' => now(),
            ]),
            'is_active' => true,
        ]);

        $this->credentialGenerator->logCredentialGeneration(
            $credentials['email'],
            auth()->user()->email,
            'Student registration'
        );

        return response()->json([
            'user' => $user,
            'credentials' => [
                'email' => $credentials['email'],
                'password' => $credentials['password'],
            ],
            'expires_in_days' => 90,
        ], 201);
    }

    /**
     * Register company with auto-generated credentials
     */
    public function registerCompany(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'contact_email' => 'required|email|unique:companies',
            'contact_phone' => 'required|string|max:20',
            'website' => 'nullable|url',
            'industry' => 'required|string|max:100',
            'contact_person' => 'required|string|max:255',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'country' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company = Company::create($request->all());

        $credentials = $this->credentialGenerator->generateCompanyCredentials($company->name);

        $user = User::create([
            'first_name' => $company->contact_person,
            'last_name' => 'Company',
            'email' => $credentials['email'],
            'password' => $credentials['hashed_password'],
            'phone' => $company->contact_phone,
            'role' => 'company',
            'company_id' => $company->id,
            'is_active' => true,
        ]);

        $this->credentialGenerator->logCredentialGeneration(
            $credentials['email'],
            auth()->user()->email,
            'Company registration'
        );

        return response()->json([
            'company' => $company,
            'user' => $user,
            'credentials' => [
                'email' => $credentials['email'],
                'password' => $credentials['password'],
            ],
            'expires_in_days' => 90,
        ], 201);
    }

    /**
     * Register examiner with auto-generated credentials
     */
    public function registerExaminer(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'employee_id' => 'required|string|max:50|unique:users,employee_id',
            'department_id' => 'required|exists:departments,id',
            'qualification' => 'required|string|max:255',
            'specialization' => 'required|string|max:255',
            'experience_years' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $fullName = $request->first_name . ' ' . $request->last_name;
        $credentials = $this->credentialGenerator->generateCredentials($fullName, 'examiner');

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $credentials['email'],
            'password' => $credentials['hashed_password'],
            'phone' => $request->phone,
            'role' => 'examiner',
            'department_id' => $request->department_id,
            'employee_id' => $request->employee_id,
            'profile_data' => json_encode([
                'qualification' => $request->qualification,
                'specialization' => $request->specialization,
                'experience_years' => $request->experience_years,
                'registration_date' => now(),
            ]),
            'is_active' => true,
        ]);

        $this->credentialGenerator->logCredentialGeneration(
            $credentials['email'],
            auth()->user()->email,
            'Examiner registration'
        );

        return response()->json([
            'user' => $user,
            'credentials' => [
                'email' => $credentials['email'],
                'password' => $credentials['password'],
            ],
            'expires_in_days' => 90,
        ], 201);
    }

    /**
     * Register advisor with auto-generated credentials
     */
    public function registerAdvisor(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'employee_id' => 'required|string|max:50|unique:users,employee_id',
            'department_id' => 'required|exists:departments,id',
            'qualification' => 'required|string|max:255',
            'specialization' => 'required|string|max:255',
            'advising_specialization' => 'required|string|max:255',
            'experience_years' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $fullName = $request->first_name . ' ' . $request->last_name;
        $credentials = $this->credentialGenerator->generateCredentials($fullName, 'advisor');

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $credentials['email'],
            'password' => $credentials['hashed_password'],
            'phone' => $request->phone,
            'role' => 'advisor',
            'department_id' => $request->department_id,
            'employee_id' => $request->employee_id,
            'profile_data' => json_encode([
                'qualification' => $request->qualification,
                'specialization' => $request->specialization,
                'advising_specialization' => $request->advising_specialization,
                'experience_years' => $request->experience_years,
                'registration_date' => now(),
            ]),
            'is_active' => true,
        ]);

        $this->credentialGenerator->logCredentialGeneration(
            $credentials['email'],
            auth()->user()->email,
            'Advisor registration'
        );

        return response()->json([
            'user' => $user,
            'credentials' => [
                'email' => $credentials['email'],
                'password' => $credentials['password'],
            ],
            'expires_in_days' => 90,
        ], 201);
    }

    /**
     * Get colleges
     */
    public function getColleges()
    {
        $colleges = College::with('departments')->get();
        return response()->json($colleges);
    }

    /**
     * Get departments by college
     */
    public function getDepartmentsByCollege($collegeId)
    {
        $departments = Department::where('college_id', $collegeId)->get();
        return response()->json($departments);
    }

    /**
     * Get unassigned students
     */
    public function getUnassignedStudents(Request $request)
    {
        $query = User::where('role', 'student')
            ->where('is_active', true)
            ->with(['department', 'examinerAssignments', 'advisorAssignments']);

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('show_assigned') && $request->show_assigned === 'false') {
            $query->whereDoesntHave('examinerAssignments')
                  ->whereDoesntHave('advisorAssignments');
        }

        $students = $query->paginate(20);
        return response()->json($students);
    }

    /**
     * Get available examiners
     */
    public function getAvailableExaminers(Request $request)
    {
        $query = User::where('role', 'examiner')
            ->where('is_active', true)
            ->with(['department', 'examinerAssignments'])
            ->withCount('examinerAssignments');

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $examiners = $query->get()->map(function ($examiner) {
            $workload = $examiner->examiner_assignments_count;
            $workloadStatus = $workload <= 5 ? 'low' : ($workload <= 10 ? 'medium' : 'high');

            return [
                'id' => $examiner->id,
                'name' => $examiner->first_name . ' ' . $examiner->last_name,
                'department' => $examiner->department->name ?? 'N/A',
                'workload' => $workload,
                'workload_status' => $workloadStatus,
                'specialization' => json_decode($examiner->profile_data ?? '{}', true)['specialization'] ?? 'General',
            ];
        });

        return response()->json($examiners);
    }

    /**
     * Get available advisors
     */
    public function getAvailableAdvisors(Request $request)
    {
        $query = User::where('role', 'advisor')
            ->where('is_active', true)
            ->with(['department', 'advisorAssignments'])
            ->withCount('advisorAssignments');

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $advisors = $query->get()->map(function ($advisor) {
            $workload = $advisor->advisor_assignments_count;
            $workloadStatus = $workload <= 5 ? 'low' : ($workload <= 10 ? 'medium' : 'high');

            return [
                'id' => $advisor->id,
                'name' => $advisor->first_name . ' ' . $advisor->last_name,
                'department' => $advisor->department->name ?? 'N/A',
                'workload' => $workload,
                'workload_status' => $workloadStatus,
                'specialization' => json_decode($advisor->profile_data ?? '{}', true)['advising_specialization'] ?? 'General',
            ];
        });

        return response()->json($advisors);
    }

    /**
     * Assign examiner to students
     */
    public function assignExaminer(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'examiner_id' => 'required|exists:users,id',
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $examiner = User::find($request->examiner_id);
        if (!$examiner || $examiner->role !== 'examiner') {
            return response()->json(['error' => 'Invalid examiner'], 422);
        }

        $students = User::whereIn('id', $request->student_ids)
            ->where('role', 'student')
            ->get();

        $assigned = 0;
        foreach ($students as $student) {
            // Check if already assigned
            $existing = DB::table('examiner_student_assignments')
                ->where('student_id', $student->id)
                ->first();

            if (!$existing) {
                DB::table('examiner_student_assignments')->insert([
                    'examiner_id' => $examiner->id,
                    'student_id' => $student->id,
                    'assigned_at' => now(),
                    'assigned_by' => auth()->id(),
                ]);
                $assigned++;
            }
        }

        return response()->json([
            'message' => "Assigned examiner to {$assigned} students",
            'assigned_count' => $assigned,
        ]);
    }

    /**
     * Assign advisor to students
     */
    public function assignAdvisor(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'advisor_id' => 'required|exists:users,id',
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $advisor = User::find($request->advisor_id);
        if (!$advisor || $advisor->role !== 'advisor') {
            return response()->json(['error' => 'Invalid advisor'], 422);
        }

        $students = User::whereIn('id', $request->student_ids)
            ->where('role', 'student')
            ->get();

        $assigned = 0;
        foreach ($students as $student) {
            // Check if already assigned
            $existing = DB::table('advisor_student_assignments')
                ->where('student_id', $student->id)
                ->first();

            if (!$existing) {
                DB::table('advisor_student_assignments')->insert([
                    'advisor_id' => $advisor->id,
                    'student_id' => $student->id,
                    'assigned_at' => now(),
                    'assigned_by' => auth()->id(),
                ]);
                $assigned++;
            }
        }

        return response()->json([
            'message' => "Assigned advisor to {$assigned} students",
            'assigned_count' => $assigned,
        ]);
    }

    /**
     * Get users with filters
     */
    public function getUsers(Request $request)
    {
        $query = User::with(['department', 'company']);

        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(20);
        return response()->json($users);
    }

    /**
     * Update user
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($request->only(['first_name', 'last_name', 'phone', 'is_active']));
        return response()->json($user);
    }

    /**
     * Suspend user
     */
    public function suspendUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
            'duration_days' => 'nullable|integer|min:1|max:365',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update([
            'is_active' => false,
            'profile_data' => array_merge(
                json_decode($user->profile_data ?? '{}', true),
                [
                    'suspension_reason' => $request->reason,
                    'suspended_at' => now(),
                    'suspension_duration_days' => $request->duration_days,
                ]
            )
        ]);

        return response()->json(['message' => 'User suspended successfully']);
    }

    /**
     * Activate user
     */
    public function activateUser($id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => true]);
        return response()->json(['message' => 'User activated successfully']);
    }

    /**
     * Delete user
     */
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Reset user password
     */
    public function resetUserPassword($id)
    {
        $user = User::findOrFail($id);
        $password = $this->credentialGenerator->generatePassword();

        $user->update([
            'password' => Hash::make($password),
            'password_changed_at' => null, // Force password change on next login
        ]);

        $this->credentialGenerator->logCredentialGeneration(
            $user->email,
            auth()->user()->email,
            'Password reset'
        );

        return response()->json([
            'message' => 'Password reset successfully',
            'new_password' => $password,
        ]);
    }

    /**
     * Calculate placement rate (mock implementation)
     */
    private function calculatePlacementRate()
    {
        $totalStudents = User::where('role', 'student')->count();
        $placedStudents = Application::where('status', 'approved')->distinct('student_id')->count();

        return $totalStudents > 0 ? round(($placedStudents / $totalStudents) * 100, 1) : 0;
    }
}