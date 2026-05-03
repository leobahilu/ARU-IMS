<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'college_id',
    ];

    public function college()
    {
        return $this->belongsTo(College::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function routedInternships()
    {
        return $this->belongsToMany(
            Internship::class,
            'internship_department_routes',
            'department_id',
            'internship_id'
        )->withTimestamps();
    }
}

