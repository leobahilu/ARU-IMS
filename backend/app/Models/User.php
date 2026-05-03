<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'phone',
        'address',
        'department_id',
        'company_id',
        'student_id',
        'employee_id',
        'advisor_id',
        'examiner_id',
        'role',
        'is_active',
        'profile_data',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'profile_data' => 'array',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function applications()
    {
        return $this->hasMany(Application::class, 'student_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function advisedStudents()
    {
        return $this->belongsToMany(
            User::class,
            'advisor_student_assignments',
            'advisor_id',
            'student_id'
        );
    }

    public function assignedInternships()
    {
        return $this->hasMany(Internship::class, 'coordinator_id');
    }

    public function supervisedApplications()
    {
        return $this->hasMany(Application::class, 'coordinator_id');
    }

    public function evaluatedReports()
    {
        return $this->hasMany(Report::class, 'examiner_id');
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class, 'examiner_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function isAdmin()
    {
        return in_array($this->role, ['admin', 'super_admin'], true);
    }

    public function isSuperAdmin()
    {
        return $this->role === 'super_admin';
    }

    public function isCoordinator()
    {
        return $this->role === 'coordinator';
    }

    public function isDepartmentAdmin()
    {
        return $this->role === 'admin';
    }

    public function isStudent()
    {
        return $this->role === 'student';
    }

    public function isCompany()
    {
        return $this->role === 'company';
    }

    public function isExaminer()
    {
        return $this->role === 'examiner';
    }

    public function isAdvisor()
    {
        return $this->role === 'advisor';
    }

    public function advisor()
    {
        return $this->belongsTo(User::class, 'advisor_id');
    }

    public function examiner()
    {
        return $this->belongsTo(User::class, 'examiner_id');
    }

    public function assignedStudentsAsAdvisor()
    {
        return $this->hasMany(User::class, 'advisor_id');
    }

    public function assignedStudentsAsExaminer()
    {
        return $this->hasMany(User::class, 'examiner_id');
    }
}
