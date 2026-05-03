<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Internship;
use App\Models\Application;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class InternshipController extends Controller
{
    private const FIELD_DEPARTMENT_MAP = [
        'technology' => ['IT', 'IS', 'CS'],
        'tech' => ['IT', 'IS', 'CS'],
        'it' => ['IT', 'IS', 'CS'],
        'is' => ['IT', 'IS', 'CS'],
        'cs' => ['IT', 'IS', 'CS'],
        'health' => ['MED', 'HEALTH'],
        'medical' => ['MED', 'HEALTH'],
        'law' => ['LAW', 'LEGAL'],
        'agriculture' => ['AGRI', 'AG'],
        'agri' => ['AGRI', 'AG'],
        'economics' => ['ECON'],
        'econ' => ['ECON'],
    ];

    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('internships.viewAny');
        }

        $query = Internship::with(['company', 'coordinator', 'routingDepartment', 'routingDepartments', 'reviewer']);

        // Company can only view its own internships.
        if ($user && $user->isCompany()) {
            $query->where('company_id', $user->company_id);
        }

        // Coordinator (department admin) can only view requests routed to their department.
        if ($user && $user->isCoordinator() && $user->department_id) {
            $query->where(function ($q) use ($user) {
                $q->where('routing_department_id', $user->department_id)
                    ->orWhereHas('routingDepartments', fn ($routeQ) => $routeQ->where('departments.id', $user->department_id));
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('submission_status')) {
            $query->where('submission_status', $request->submission_status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        $internships = $query->paginate(10);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($internships);
        }

        return Inertia::render('Internships/Index', ['internships' => $internships]);
    }

    public function publicIndex(Request $request)
    {
        $query = Internship::with(['company'])
            ->where('status', 'active')
            ->where('submission_status', Internship::SUBMISSION_STATUS_APPROVED)
            ->where('start_date', '>', now());

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        $internships = $query->paginate(12);

        return Inertia::render('Public/Internships', ['internships' => $internships]);
    }

    public function store(Request $request)
    {
        $this->authorize('internships.create');

        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'program_field' => 'required|string|max:100',
            'work_modality' => 'required|in:on-site,remote,hybrid',
            'location' => 'required_if:work_modality,on-site,hybrid|nullable|string|max:255',
            'type' => 'required|in:full-time,part-time,remote,hybrid',
            'duration_weeks' => 'required|integer|min:1',
            'stipend' => 'nullable|numeric|min:0',
            'start_date' => 'required|date|after:today',
            'end_date' => 'required|date|after:start_date',
            'requirements' => 'nullable|string',
            'responsibilities' => 'nullable|string',
            'required_skills' => 'nullable|string',
            'opportunities_during_program' => 'nullable|string',
            'post_program_opportunities' => 'nullable|string',
            'sla_deadline_at' => 'nullable|date|before:start_date',
            'max_applicants' => 'required|integer|min:1',
            'company_id' => ($user && $user->isCompany())
                ? 'nullable|exists:companies,id'
                : 'required|exists:companies,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payload = $request->all();

        // For company users, force ownership to their company_id.
        if ($user && $user->isCompany()) {
            $payload['company_id'] = $user->company_id;
        }

        $routingDepartments = $this->resolveRoutingDepartments($payload['program_field'] ?? null);
        $payload['routing_department_id'] = $routingDepartments->first()?->id;
        $payload['submission_date'] = now();
        $payload['submission_status'] = Internship::SUBMISSION_STATUS_PENDING;
        // Submitted programs stay private until approved.
        $payload['status'] = 'draft';

        $internship = Internship::create($payload);
        $this->syncRoutingDepartments($internship, $routingDepartments);

        return redirect()->back()->with('success', 'Internship created successfully');
    }

    public function approvalQueue(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('internships.approvePost');
        }

        $query = Internship::with(['company', 'routingDepartment', 'routingDepartments', 'reviewer'])
            ->whereIn('submission_status', [
                Internship::SUBMISSION_STATUS_PENDING,
                Internship::SUBMISSION_STATUS_IMPROVEMENT,
            ]);

        if ($user && $user->isCoordinator() && $user->department_id) {
            $query->where(function ($q) use ($user) {
                $q->where('routing_department_id', $user->department_id)
                    ->orWhereHas('routingDepartments', fn ($routeQ) => $routeQ->where('departments.id', $user->department_id));
            });
        }

        $internships = $query->latest('submission_date')->paginate(15);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($internships);
        }

        return Inertia::render('Internships/ApprovalQueue', ['internships' => $internships]);
    }

    public function reviewSubmission(Request $request, $id)
    {
        $this->authorize('internships.approvePost');

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject,improvement',
            'review_notes' => 'required_if:action,reject,improvement|nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        $internship = Internship::findOrFail($id);
        $user = $request->user();
        if (!$this->canUserReviewInternship($user, $internship)) {
            return back()->withErrors(['error' => 'Forbidden']);
        }

        $action = $request->input('action');
        $internship->review_notes = $request->input('review_notes');
        $internship->reviewed_by = $user?->id;
        $internship->reviewed_at = now();

        if ($action === 'approve') {
            $internship->submission_status = Internship::SUBMISSION_STATUS_APPROVED;
            $internship->status = 'active';
            $internship->published_at = now();
        } elseif ($action === 'reject') {
            $internship->submission_status = Internship::SUBMISSION_STATUS_REJECTED;
            $internship->status = 'closed';
        } else {
            $internship->submission_status = Internship::SUBMISSION_STATUS_IMPROVEMENT;
            $internship->status = 'draft';
        }

        $internship->save();
        $this->notifyCompanyReviewOutcome($internship, $action, (string) $request->input('review_notes', ''));

        return redirect()->back()->with('success', 'Program review submitted successfully');
    }

    public function show($id)
    {
        $internship = Internship::with(['company', 'coordinator', 'routingDepartment', 'routingDepartments', 'applications.student'])
            ->findOrFail($id);

        return Inertia::render('Internships/Show', ['internship' => $internship]);
    }

    public function update(Request $request, $id)
    {
        $this->authorize('internships.edit');

        $internship = Internship::findOrFail($id);
        $user = auth()->user();

        if ($user && $user->isCompany() && (int) $internship->company_id !== (int) $user->company_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'program_field' => 'sometimes|required|string|max:100',
            'work_modality' => 'sometimes|required|in:on-site,remote,hybrid',
            'location' => 'nullable|string|max:255',
            'type' => 'sometimes|required|in:full-time,part-time,remote,hybrid',
            'duration_weeks' => 'sometimes|required|integer|min:1',
            'stipend' => 'sometimes|nullable|numeric|min:0',
            'start_date' => 'sometimes|required|date|after:today',
            'end_date' => 'sometimes|required|date|after:start_date',
            'requirements' => 'sometimes|nullable|string',
            'responsibilities' => 'sometimes|nullable|string',
            'required_skills' => 'sometimes|nullable|string',
            'opportunities_during_program' => 'sometimes|nullable|string',
            'post_program_opportunities' => 'sometimes|nullable|string',
            'sla_deadline_at' => 'sometimes|nullable|date|before:start_date',
            'max_applicants' => 'sometimes|required|integer|min:1',
            'status' => 'sometimes|required|in:draft,active,closed,completed',
            'coordinator_id' => 'sometimes|nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        $payload = $request->all();
        if ($user && $user->isCompany()) {
            unset($payload['company_id'], $payload['coordinator_id'], $payload['status']);
            $payload['submission_status'] = Internship::SUBMISSION_STATUS_PENDING;
            $payload['submission_date'] = now();
            $payload['reviewed_by'] = null;
            $payload['reviewed_at'] = null;
            $payload['review_notes'] = null;
            $payload['published_at'] = null;
            $payload['status'] = 'draft';
        }

        if (array_key_exists('program_field', $payload)) {
            $routingDepartments = $this->resolveRoutingDepartments($payload['program_field']);
            $payload['routing_department_id'] = $routingDepartments->first()?->id;
            $this->syncRoutingDepartments($internship, $routingDepartments);
        }

        $internship->update($payload);

        return redirect()->back()->with('success', 'Internship updated successfully');
    }

    private function resolveRoutingDepartments(?string $programField)
    {
        if (!$programField) {
            return collect();
        }

        $normalized = strtolower(trim($programField));
        $codes = self::FIELD_DEPARTMENT_MAP[$normalized] ?? null;
        if (!$codes) {
            return collect();
        }

        return Department::whereIn('code', $codes)->orderBy('code')->get();
    }

    private function syncRoutingDepartments(Internship $internship, $routingDepartments): void
    {
        $ids = $routingDepartments->pluck('id')->values()->all();
        $internship->routingDepartments()->sync($ids);
    }

    private function canUserReviewInternship(?User $user, Internship $internship): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        if (!$user->isCoordinator() || !$user->department_id) {
            return false;
        }

        $internship->loadMissing('routingDepartments');

        if ((int) $internship->routing_department_id === (int) $user->department_id) {
            return true;
        }

        return $internship->routingDepartments->contains(fn ($department) => (int) $department->id === (int) $user->department_id);
    }

    private function notifyCompanyReviewOutcome(Internship $internship, string $action, string $reviewNotes = ''): void
    {
        $internship->loadMissing('company.users');

        $title = match ($action) {
            'approve' => 'Internship program approved',
            'reject' => 'Internship program rejected',
            default => 'Internship program needs improvement',
        };

        $message = match ($action) {
            'approve' => "Your internship program \"{$internship->title}\" has been approved and published.",
            'reject' => "Your internship program \"{$internship->title}\" was rejected by the department administrator.",
            default => "Your internship program \"{$internship->title}\" requires improvements before approval.",
        };

        if ($reviewNotes !== '') {
            $message .= " Review notes: {$reviewNotes}";
        }

        $companyUsers = $internship->company?->users()
            ->where('role', 'company')
            ->get() ?? collect();

        foreach ($companyUsers as $companyUser) {
            Notification::create([
                'user_id' => $companyUser->id,
                'type' => 'internship_submission',
                'title' => $title,
                'message' => $message,
                'meta' => [
                    'internship_id' => $internship->id,
                    'action' => $action,
                    'submission_status' => $internship->submission_status,
                ],
            ]);
        }

        $superAdmins = User::where('role', 'super_admin')->get();
        foreach ($superAdmins as $superAdmin) {
            Notification::create([
                'user_id' => $superAdmin->id,
                'type' => 'internship_submission_audit',
                'title' => 'Internship review action recorded',
                'message' => "Program \"{$internship->title}\" was reviewed with action: {$action}.",
                'meta' => [
                    'internship_id' => $internship->id,
                    'action' => $action,
                    'submission_status' => $internship->submission_status,
                    'reviewed_by' => $internship->reviewed_by,
                    'routing_department_id' => $internship->routing_department_id,
                ],
            ]);
        }
    }

    public function destroy($id)
    {
        $this->authorize('internships.delete');

        $internship = Internship::findOrFail($id);
        $user = auth()->user();

        if ($user && $user->isCompany() && (int) $internship->company_id !== (int) $user->company_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($internship->applications()->exists()) {
            return response()->json([
                'error' => 'Cannot delete internship with existing applications'
            ], 422);
        }

        $internship->delete();

        return redirect()->back()->with('success', 'Internship deleted successfully');
    }

    public function apply(Request $request, $id)
    {
        $this->authorize('applications.apply');

        $internship = Internship::findOrFail($id);
        $student = auth()->user();

        if (!$internship->isAvailable()) {
            return back()->withErrors(['internship' => 'Internship is not available for application']);
        }

        $existingApplication = Application::where('student_id', $student->id)
            ->where('internship_id', $internship->id)
            ->first();

        if ($existingApplication) {
            return back()->withErrors(['internship' => 'You have already applied for this internship']);
        }

        $validator = Validator::make($request->all(), [
            'cover_letter' => 'required|string',
            'resume_path' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        $application = Application::create([
            'cover_letter' => $request->cover_letter,
            'resume_path' => $request->resume_path,
            'applied_date' => now(),
            'student_id' => $student->id,
            'internship_id' => $internship->id,
        ]);

        $internship->incrementApplicants();

        return redirect()->back()->with('success', 'Application submitted successfully');
    }
}
