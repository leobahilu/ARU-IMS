<?php

namespace App\Http\Controllers;

use App\Models\College;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AssignmentController extends Controller
{
    public function colleges(Request $request)
    {
        $this->ensureSuperAdmin();

        return response()->json(
            College::query()->orderBy('name')->get(['id', 'name', 'code'])
        );
    }

    public function departments(Request $request)
    {
        $this->ensureSuperAdmin();

        $validated = Validator::make($request->all(), [
            'college_id' => 'required|exists:colleges,id',
        ])->validate();

        return response()->json(
            Department::query()
                ->where('college_id', $validated['college_id'])
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'college_id'])
        );
    }

    public function studentsUnassigned(Request $request)
    {
        $this->ensureSuperAdmin();

        $validated = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,id',
            'include_assigned' => 'sometimes|boolean',
            'q' => 'sometimes|string|max:255',
            'sort' => 'sometimes|in:name,id,status',
            'dir' => 'sometimes|in:asc,desc',
        ])->validate();

        $departmentId = (int) $validated['department_id'];
        $includeAssigned = (bool) ($validated['include_assigned'] ?? false);
        $dir = $validated['dir'] ?? 'asc';

        $query = User::query()
            ->with(['advisor:id,first_name,last_name,email', 'examiner:id,first_name,last_name,email'])
            ->where('role', 'student')
            ->where('department_id', $departmentId);

        if (!$includeAssigned) {
            $query->where(function ($q) {
                $q->whereNull('advisor_id')->orWhereNull('examiner_id');
            });
        }

        if (!empty($validated['q'])) {
            $term = trim((string) $validated['q']);
            $query->where(function ($q) use ($term) {
                $q->where('student_id', 'like', "%{$term}%")
                    ->orWhere('first_name', 'like', "%{$term}%")
                    ->orWhere('last_name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%");
            });
        }

        $sort = $validated['sort'] ?? 'name';
        if ($sort === 'id') {
            $query->orderBy('student_id', $dir);
        } elseif ($sort === 'status') {
            $query->orderByRaw("CASE WHEN examiner_id IS NULL OR advisor_id IS NULL THEN 0 ELSE 1 END {$dir}");
        } else {
            $query->orderBy('first_name', $dir)->orderBy('last_name', $dir);
        }

        return response()->json($query->paginate(25));
    }

    public function examinersAvailable(Request $request)
    {
        $this->ensureSuperAdmin();

        $validated = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,id',
        ])->validate();

        $departmentId = (int) $validated['department_id'];

        $examiners = User::query()
            ->where('role', 'examiner')
            ->where('department_id', $departmentId)
            ->select(['id', 'first_name', 'last_name', 'email', 'department_id'])
            ->withCount(['assignedStudentsAsExaminer as workload' => function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId)->where('role', 'student');
            }])
            ->orderBy('first_name')
            ->get();

        return response()->json($examiners);
    }

    public function advisorsAvailable(Request $request)
    {
        $this->ensureSuperAdmin();

        $validated = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,id',
        ])->validate();

        $departmentId = (int) $validated['department_id'];

        $advisors = User::query()
            ->where('role', 'advisor')
            ->where('department_id', $departmentId)
            ->select(['id', 'first_name', 'last_name', 'email', 'department_id'])
            ->withCount(['assignedStudentsAsAdvisor as workload' => function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId)->where('role', 'student');
            }])
            ->orderBy('first_name')
            ->get();

        return response()->json($advisors);
    }

    public function assignExaminer(Request $request)
    {
        return $this->assign($request, 'assign_examiner');
    }

    public function assignAdvisor(Request $request)
    {
        return $this->assign($request, 'assign_advisor');
    }

    public function assignBoth(Request $request)
    {
        return $this->assign($request, 'assign_both');
    }

    private function assign(Request $request, string $action)
    {
        $this->ensureSuperAdmin();

        $rules = [
            'department_id' => 'required|exists:departments,id',
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|integer|exists:users,id',
        ];

        if ($action === 'assign_examiner' || $action === 'assign_both') {
            $rules['examiner_id'] = 'required|integer|exists:users,id';
        }

        if ($action === 'assign_advisor' || $action === 'assign_both') {
            $rules['advisor_id'] = 'required|integer|exists:users,id';
        }

        $validated = Validator::make($request->all(), $rules)->validate();

        $departmentId = (int) $validated['department_id'];
        $studentIds = array_values(array_unique($validated['student_ids']));
        $examinerId = isset($validated['examiner_id']) ? (int) $validated['examiner_id'] : null;
        $advisorId = isset($validated['advisor_id']) ? (int) $validated['advisor_id'] : null;

        $actor = $request->user();

        $result = DB::transaction(function () use ($departmentId, $studentIds, $examinerId, $advisorId, $action, $actor) {
            $students = User::query()
                ->whereIn('id', $studentIds)
                ->where('role', 'student')
                ->where('department_id', $departmentId)
                ->lockForUpdate()
                ->get();

            if ($students->count() !== count($studentIds)) {
                abort(422, 'Some students are invalid for this department.');
            }

            if ($examinerId) {
                $examiner = User::query()->where('id', $examinerId)->where('role', 'examiner')->first();
                abort_unless($examiner, 422, 'Selected examiner is invalid.');
                abort_unless((int) $examiner->department_id === $departmentId, 422, 'Examiner must belong to the selected department.');
            }

            if ($advisorId) {
                $advisor = User::query()->where('id', $advisorId)->where('role', 'advisor')->first();
                abort_unless($advisor, 422, 'Selected advisor is invalid.');
                abort_unless((int) $advisor->department_id === $departmentId, 422, 'Advisor must belong to the selected department.');
            }

            foreach ($students as $student) {
                $payload = [];
                if ($action === 'assign_examiner' || $action === 'assign_both') {
                    $payload['examiner_id'] = $examinerId;
                }
                if ($action === 'assign_advisor' || $action === 'assign_both') {
                    $payload['advisor_id'] = $advisorId;
                }

                $student->update($payload);

                DB::table('student_assignment_histories')->insert([
                    'student_id' => $student->id,
                    'assigned_by' => $actor?->id,
                    'department_id' => $departmentId,
                    'examiner_id' => $payload['examiner_id'] ?? null,
                    'advisor_id' => $payload['advisor_id'] ?? null,
                    'action' => $action,
                    'assigned_at' => now(),
                    'meta' => json_encode([
                        'student_student_id' => $student->student_id,
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return [
                'count' => $students->count(),
            ];
        });

        return response()->json([
            'message' => 'Assignment saved successfully.',
            ...$result,
        ]);
    }

    private function ensureSuperAdmin(): void
    {
        $user = auth()->user();
        abort_unless($user && $user->role === 'super_admin', 403, 'Only super admins can assign examiners/advisors.');
    }
}

