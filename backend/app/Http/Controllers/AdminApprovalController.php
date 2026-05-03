<?php

namespace App\Http\Controllers;

use App\Models\Internship;
use App\Models\PartnerRequest;
use Illuminate\Http\Request;

class AdminApprovalController extends Controller
{
    public function summary(Request $request)
    {
        $this->ensureSuperAdmin();

        $partnerPending = PartnerRequest::query()
            ->where('status', PartnerRequest::STATUS_PENDING)
            ->count();

        $internshipPending = Internship::query()
            ->where('submission_status', Internship::SUBMISSION_STATUS_PENDING)
            ->count();

        return response()->json([
            'partner_requests_pending' => $partnerPending,
            'internship_posts_pending' => $internshipPending,
            'total_pending' => $partnerPending + $internshipPending,
        ]);
    }

    private function ensureSuperAdmin(): void
    {
        $user = auth()->user();
        abort_unless($user && $user->role === 'super_admin', 403, 'Only super admins can access approvals.');
    }
}

