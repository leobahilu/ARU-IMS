<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InternshipController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\SuperAdminRegistrationController;
use App\Http\Controllers\PartnerRequestController;
use App\Http\Controllers\AdminApprovalController;
use App\Http\Controllers\AssignmentController;

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register']);

// Public routes
Route::get('/', function () {
    return Inertia::render('LandingPage');
});
Route::get('/public/internships', [InternshipController::class, 'publicIndex']);
Route::post('/public/partner-requests', [PartnerRequestController::class, 'store']);

// Protected routes
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        $user = auth()->user();
        switch ($user->role) {
            case 'super_admin':
                return Inertia::render('SuperAdminDashboard');
            case 'admin':
                return Inertia::render('AdminDashboard');
            case 'coordinator':
                return Inertia::render('CoordinatorDashboard');
            case 'student':
                return Inertia::render('StudentDashboard');
            case 'company':
                return Inertia::render('CompanyDashboard');
            case 'examiner':
                return Inertia::render('ExaminerDashboard');
            case 'advisor':
                return Inertia::render('AdvisorDashboard');
            default:
                return Inertia::render('Dashboard');
        }
    });

    Route::get('/internships', [InternshipController::class, 'index']);
    Route::post('/internships', [InternshipController::class, 'store']);
    Route::get('/internships/{id}', [InternshipController::class, 'show']);
    Route::put('/internships/{id}', [InternshipController::class, 'update']);
    Route::delete('/internships/{id}', [InternshipController::class, 'destroy']);
    Route::post('/internships/{id}/apply', [InternshipController::class, 'apply']);
    Route::get('/internships/approval-queue/list', [InternshipController::class, 'approvalQueue']);
    Route::post('/internships/{id}/review-submission', [InternshipController::class, 'reviewSubmission']);

    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::get('/applications/{id}', [ApplicationController::class, 'show']);
    Route::put('/applications/{id}', [ApplicationController::class, 'update']);
    Route::delete('/applications/{id}', [ApplicationController::class, 'destroy']);

    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports', [ReportController::class, 'store']);
    Route::get('/reports/{id}', [ReportController::class, 'show']);
    Route::put('/reports/{id}', [ReportController::class, 'update']);
    Route::delete('/reports/{id}', [ReportController::class, 'destroy']);

    Route::get('/evaluations', [EvaluationController::class, 'index']);
    Route::post('/evaluations', [EvaluationController::class, 'store']);
    Route::get('/evaluations/{id}', [EvaluationController::class, 'show']);
    Route::put('/evaluations/{id}', [EvaluationController::class, 'update']);
    Route::delete('/evaluations/{id}', [EvaluationController::class, 'destroy']);

    Route::prefix('/admin')->group(function () {
        Route::get('/departments', [SuperAdminRegistrationController::class, 'departments']);
        Route::get('/users', [SuperAdminRegistrationController::class, 'users']);
        Route::put('/users/{id}', [SuperAdminRegistrationController::class, 'updateUser']);
        Route::post('/users/{id}/suspend', [SuperAdminRegistrationController::class, 'suspendUser']);
        Route::post('/users/{id}/reset-password', [SuperAdminRegistrationController::class, 'resetUserPassword']);
        Route::delete('/users/{id}', [SuperAdminRegistrationController::class, 'deleteUser']);
        Route::post('/register/student', [SuperAdminRegistrationController::class, 'registerStudent']);
        Route::post('/register/students/bulk', [SuperAdminRegistrationController::class, 'registerStudentsBulk']);
        Route::post('/register/company', [SuperAdminRegistrationController::class, 'registerCompany']);
        Route::post('/register/examiner', [SuperAdminRegistrationController::class, 'registerExaminer']);
        Route::post('/register/advisor', [SuperAdminRegistrationController::class, 'registerAdvisor']);

        Route::get('/approvals/summary', [AdminApprovalController::class, 'summary']);

        Route::get('/partner-requests', [PartnerRequestController::class, 'index']);
        Route::get('/partner-requests/{id}', [PartnerRequestController::class, 'show']);
        Route::post('/partner-requests/{id}/approve', [PartnerRequestController::class, 'approve']);
        Route::post('/partner-requests/{id}/reject', [PartnerRequestController::class, 'reject']);

        // Assignments (Super Admin)
        Route::get('/colleges', [AssignmentController::class, 'colleges']);
        Route::get('/departments/by-college', [AssignmentController::class, 'departments']);
        Route::get('/students/unassigned', [AssignmentController::class, 'studentsUnassigned']);
        Route::get('/examiners/available', [AssignmentController::class, 'examinersAvailable']);
        Route::get('/advisors/available', [AssignmentController::class, 'advisorsAvailable']);
        Route::post('/assign/examiner', [AssignmentController::class, 'assignExaminer']);
        Route::post('/assign/advisor', [AssignmentController::class, 'assignAdvisor']);
        Route::post('/assign/both', [AssignmentController::class, 'assignBoth']);
    });
});
