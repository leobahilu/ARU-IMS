<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\PartnerRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PartnerRequestController extends Controller
{
    public function store(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'country_region' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'city' => 'required|string|max:100',
            'sub_city' => 'nullable|string|max:100',
            'street' => 'nullable|string|max:100',
            'building' => 'nullable|string|max:100',
            'po_box' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:255',
            'company_email' => 'required|email|max:255',
            'field_of_interest' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'contact_person' => 'required|string|max:255',
            'message' => 'nullable|string|max:2000',
        ])->validate();

        $partnerRequest = PartnerRequest::create([
            ...$validated,
            'status' => PartnerRequest::STATUS_PENDING,
        ]);

        return response()->json([
            'message' => 'Partner request submitted successfully.',
            'request' => $partnerRequest,
        ], 201);
    }

    public function index(Request $request)
    {
        $this->ensureSuperAdmin();

        $query = PartnerRequest::query()->with(['reviewer:id,first_name,last_name,email', 'company:id,name,is_verified']);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        } else {
            $query->where('status', PartnerRequest::STATUS_PENDING);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function show(int $id)
    {
        $this->ensureSuperAdmin();

        $partnerRequest = PartnerRequest::with(['reviewer:id,first_name,last_name,email', 'company:id,name,is_verified'])
            ->findOrFail($id);

        return response()->json($partnerRequest);
    }

    public function approve(Request $request, int $id)
    {
        $this->ensureSuperAdmin();

        $validated = Validator::make($request->all(), [
            'notes' => 'nullable|string|max:2000',
        ])->validate();

        $actor = $request->user();

        $result = DB::transaction(function () use ($id, $validated, $actor) {
            $partnerRequest = PartnerRequest::lockForUpdate()->findOrFail($id);
            if ($partnerRequest->status !== PartnerRequest::STATUS_PENDING) {
                abort(422, 'This request has already been processed.');
            }

            $contactName = $partnerRequest->contact_person ?: $partnerRequest->company_name;
            [$firstName, $lastName] = $this->splitFullName($contactName);

            $company = Company::create([
                'name' => $partnerRequest->company_name,
                'industry' => $partnerRequest->field_of_interest ?: 'General',
                'description' => $partnerRequest->message ?: 'Created from partner request approval',
                'website' => $partnerRequest->website,
                'address' => trim(implode(', ', array_filter([
                    $partnerRequest->street,
                    $partnerRequest->building,
                    $partnerRequest->sub_city,
                ]))),
                'city' => $partnerRequest->city,
                'country' => $partnerRequest->country_region ?: 'Ethiopia',
                'contact_person' => $contactName,
                'contact_email' => $partnerRequest->company_email,
                'contact_phone' => $partnerRequest->phone ?: '',
                'is_verified' => true,
                'meta' => [
                    'state' => $partnerRequest->state,
                    'po_box' => $partnerRequest->po_box,
                    'sub_city' => $partnerRequest->sub_city,
                    'street' => $partnerRequest->street,
                    'building' => $partnerRequest->building,
                    'approved_from_partner_request' => true,
                ],
            ]);

            $plainPassword = Str::password(12, true, true, true, false);
            $loginEmail = $partnerRequest->company_email;

            if (User::where('email', $loginEmail)->exists()) {
                abort(422, 'A user with this email already exists. Please resolve the conflict before approving.');
            }

            $user = User::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $loginEmail,
                'password' => Hash::make($plainPassword),
                'phone' => $partnerRequest->phone,
                'company_id' => $company->id,
                'role' => 'company',
                'is_active' => true,
                'profile_data' => [
                    'company_name' => $partnerRequest->company_name,
                    'field_of_interest' => $partnerRequest->field_of_interest,
                    'company_email' => $partnerRequest->company_email,
                    'partner_request_id' => $partnerRequest->id,
                ],
            ]);

            $partnerRequest->update([
                'status' => PartnerRequest::STATUS_APPROVED,
                'decision_reason' => $validated['notes'] ?? null,
                'reviewed_by' => $actor?->id,
                'reviewed_at' => now(),
                'company_id' => $company->id,
                'approved_at' => now(),
            ]);

            return [
                'company' => $company,
                'user' => $user,
                'credentials' => [
                    'email' => $loginEmail,
                    'password' => $plainPassword,
                ],
            ];
        });

        return response()->json([
            'message' => 'Partner request approved successfully.',
            ...$result,
        ]);
    }

    public function reject(Request $request, int $id)
    {
        $this->ensureSuperAdmin();

        $validated = Validator::make($request->all(), [
            'reason' => 'required|string|max:2000',
        ])->validate();

        $partnerRequest = PartnerRequest::findOrFail($id);
        if ($partnerRequest->status !== PartnerRequest::STATUS_PENDING) {
            return response()->json(['message' => 'This request has already been processed.'], 422);
        }

        $actor = $request->user();
        $partnerRequest->update([
            'status' => PartnerRequest::STATUS_REJECTED,
            'decision_reason' => $validated['reason'],
            'reviewed_by' => $actor?->id,
            'reviewed_at' => now(),
            'rejected_at' => now(),
        ]);

        return response()->json([
            'message' => 'Partner request rejected successfully.',
            'request' => $partnerRequest->fresh(['reviewer', 'company']),
        ]);
    }

    private function ensureSuperAdmin(): void
    {
        $user = auth()->user();
        abort_unless($user && $user->role === 'super_admin', 403, 'Only super admins can access partner approvals.');
    }

    private function splitFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];
        $firstName = $parts[0] ?? 'Unknown';
        $lastName = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : 'User';

        return [$firstName, $lastName];
    }
}

