<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect($this->redirectBasedOnRole(Auth::user()->role));
        }

        return Inertia::render('Login');
    }

    public function showRegister()
    {
        if (Auth::check()) {
            return redirect($this->redirectBasedOnRole(Auth::user()->role));
        }

        return Inertia::render('Register');
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'role' => 'required|in:super_admin,admin,coordinator,student,company,examiner,advisor',
            'department_id' => 'nullable|exists:departments,id',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        if ($validator->fails()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            return back()->withErrors($validator);
        }

        // Validate department requirements for department-scoped roles
        $departmentScopedRoles = ['student', 'coordinator', 'examiner', 'advisor'];
        if (in_array($request->role, $departmentScopedRoles) && !$request->department_id) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['error' => 'Department ID is required for this role'], 422);
            }
            return back()->withErrors(['department_id' => 'Department ID is required for this role']);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'address' => $request->address,
            'role' => $request->role,
            'department_id' => $request->department_id,
            'company_id' => $request->company_id,
        ]);

        Auth::login($user);

        if ($request->expectsJson() || $request->is('api/*')) {
            $token = auth('api')->login($user);
            return response()->json([
                'user' => $user,
                'token' => $token,
            ], 201);
        }

        return redirect($this->redirectBasedOnRole($user->role));
    }

    public function login(Request $request)
    {
        $credentials = [
            'email' => strtolower(trim((string) $request->input('email'))),
            'password' => (string) $request->input('password'),
        ];

        $validator = Validator::make($credentials, [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['error' => 'Invalid login data'], 422);
            }
            return back()->withErrors($validator);
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            if (!$token = auth('api')->attempt($credentials)) {
                return response()->json(['error' => 'Invalid credentials'], 401);
            }

            $user = auth('api')->user();

            if ($user && !$user->is_active) {
                auth('api')->logout();
                return response()->json(['error' => 'Account is deactivated'], 403);
            }

            return response()->json([
                'user' => $user,
                'token' => $token,
            ]);
        }

        if (!Auth::attempt($credentials)) {
            return back()->withErrors(['email' => 'Invalid credentials']);
        }

        $user = auth()->user();

        if (!$user->is_active) {
            Auth::logout();
            return back()->withErrors(['email' => 'Account is deactivated']);
        }

        return redirect($this->redirectBasedOnRole($user->role));
    }

    public function logout(Request $request)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            auth('api')->logout();
            return response()->json(['message' => 'Logged out successfully']);
        }

        Auth::logout();
        return redirect('/');
    }

    public function me(Request $request)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(auth('api')->user());
        }

        return redirect('/');
    }

    public function refresh(Request $request)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            $token = auth('api')->refresh();
            return response()->json(['token' => $token]);
        }

        return redirect('/');
    }

    private function redirectBasedOnRole($role)
    {
        return '/dashboard';
    }
}
