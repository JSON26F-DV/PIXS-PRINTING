<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Employee;
use App\Services\MailService;
use App\Services\VerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChangeEmailController extends Controller
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

        if ($this->verificationService->wasRecentlySent($email, 'change_email', 5)) {
            return response()->json([
                'status' => 'success',
                'message' => 'Verification code sent to your email.',
            ]);
        }

        $canResend = $this->verificationService->canResend($email, 'change_email');
        if (! $canResend['can_resend']) {
            return response()->json([
                'status' => 'error',
                'message' => "Please wait {$canResend['cooldown_remaining']} seconds before requesting a new code.",
            ], 429);
        }

        $code = $this->verificationService->generateCode($email, 'change_email');

        $sent = $this->mailService->sendVerificationCode($email, $code, 'change_email');

        if (! $sent) {
            $this->verificationService->clearCode($email, 'change_email');

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send verification code. Please try again.',
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Verification code sent to your old email address.',
        ]);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $email = strtolower($request->email);
        $result = $this->verificationService->verifyCode($email, 'change_email', $request->code);

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

    public function updateEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'new_email' => 'required|email|unique:customers,email|unique:employees,email',
        ], [
            'new_email.unique' => 'The requested email address is already in use by another account.',
        ]);

        $email = strtolower($request->email);
        $newEmail = strtolower($request->new_email);

        $result = $this->verificationService->checkCode($email, 'change_email', $request->code);
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

        $user->email = $newEmail;
        $user->save();

        $this->verificationService->clearCode($email, 'change_email');

        // Optional: send success notification to both the old and new email
        $this->mailService->sendVerificationCode($email, '', 'email_changed');
        $this->mailService->sendVerificationCode($newEmail, '', 'email_changed');

        return response()->json([
            'status' => 'success',
            'message' => 'Email address has been successfully updated.',
        ]);
    }
}
