<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'company_name',
        'country_region',
        'state',
        'city',
        'sub_city',
        'street',
        'building',
        'po_box',
        'website',
        'company_email',
        'field_of_interest',
        'phone',
        'contact_person',
        'message',
        'status',
        'decision_reason',
        'reviewed_by',
        'reviewed_at',
        'company_id',
        'approved_at',
        'rejected_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}

