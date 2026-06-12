<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Employee;
use App\Services\MailService;
use App\Services\VerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ForgotPasswordController extends Controller
{
    public function __construct(
        private MailService $mailService,
        private VerificationCodeService $verificationService
    ) {}

    public function sendCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower($request->email);

        $user = Employee::where('email', $email)->first()
            ?? Customer::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'status' => 'success',
                'message' => 'If an account with that email exists, a verification code has been sent.',
            ]);
        }

        if ($this->verificationService->wasRecentlySent($email, 'forgot_password', 5)) {
            return response()->json([
                'status' => 'success',
                'message' => 'Verification code sent to your email.',
            ]);
        }

        $canResend = $this->verificationService->canResend($email, 'forgot_password');
        if (! $canResend['can_resend']) {
            return response()->json([
                'status' => 'error',
                'message' => "Please wait {$canResend['cooldown_remaining']} seconds before requesting a new code.",
            ], 429);
        }

        $code = $this->verificationService->generateCode($email, 'forgot_password');

        $sent = $this->mailService->sendVerificationCode($email, $code, 'forgot_password');

        if (! $sent) {
            $this->verificationService->clearCode($email, 'forgot_password');

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send verification code. Please try again.',
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Verification code sent to your email.',
        ]);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $email = strtolower($request->email);
        $result = $this->verificationService->verifyCode($email, 'forgot_password', $request->code);

        if (! $result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'locked' => $result['locked'] ?? false,
                'locked_until' => $result['locked_until'] ?? null,
            ], $result['locked'] ? 429 : 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Code verified successfully.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $email = strtolower($request->email);

        $result = $this->verificationService->checkCode($email, 'forgot_password', $request->code);
        if (! $result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
            ], 400);
        }

        $user = Employee::where('email', $email)->first()
            ?? Customer::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found.',
            ], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        $this->verificationService->clearCode($email, 'forgot_password');

        $this->mailService->sendVerificationCode($email, '', 'password_changed');

        return response()->json([
            'status' => 'success',
            'message' => 'Password has been reset successfully.',
        ]);
    }
}
