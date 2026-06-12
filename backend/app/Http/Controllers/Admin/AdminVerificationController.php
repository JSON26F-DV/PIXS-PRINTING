<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Employee;
use App\Services\MailService;
use App\Services\VerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminVerificationController extends Controller
{
    public function __construct(
        private MailService $mailService,
        private VerificationCodeService $verificationService
    ) {}

    public function sendOrderDeleteCode(Request $request): JsonResponse
    {
        $user = Auth::user();
        $adminEmail = $user->email;

        if ($this->verificationService->wasRecentlySent($adminEmail, 'delete_order', 5)) {
            return response()->json([
                'status' => 'success',
                'message' => 'Verification code sent to admin email.',
            ]);
        }

        $isResend = $request->input('is_resend', false);

        if ($isResend) {
            $canResend = $this->verificationService->canResend($adminEmail, 'delete_order');
            if (! $canResend['can_resend']) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Please wait {$canResend['cooldown_remaining']} seconds.",
                ], 429);
            }
        }

        $code = $this->verificationService->generateCode($adminEmail, 'delete_order');
        $sent = $this->mailService->sendVerificationCode($adminEmail, $code, 'delete_order');

        if (! $sent) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send verification code.',
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Verification code sent to admin email.',
        ]);
    }

    public function sendAccountDeleteCode(Request $request): JsonResponse
    {
        $user = Auth::user();
        $adminEmail = $user->email;

        if ($this->verificationService->wasRecentlySent($adminEmail, 'delete_account', 5)) {
            return response()->json([
                'status' => 'success',
                'message' => 'Verification code sent to admin email.',
            ]);
        }

        $isResend = $request->input('is_resend', false);

        if ($isResend) {
            $canResend = $this->verificationService->canResend($adminEmail, 'delete_account');
            if (! $canResend['can_resend']) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Please wait {$canResend['cooldown_remaining']} seconds.",
                ], 429);
            }
        }

        $targetId = $request->input('target_id');
        $targetUser = null;
        if ($targetId) {
            $targetUser = Employee::find($targetId);
            if (! $targetUser) {
                $targetUser = Customer::find($targetId);
            }
        }

        $code = $this->verificationService->generateCode($adminEmail, 'delete_account');
        $sent = $this->mailService->sendVerificationCode($adminEmail, $code, 'delete_account', $targetUser);

        if (! $sent) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send verification code.',
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Verification code sent to admin email.',
        ]);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $request->validate([
            'code_type' => 'required|in:delete_order,delete_account',
            'code' => 'required|string|size:6',
        ]);

        $user = Auth::user();
        $adminEmail = $user->email;
        $codeType = $request->code_type;

        $result = $this->verificationService->verifyCode($adminEmail, $codeType, $request->code);

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
            'message' => 'Verification successful.',
        ]);
    }
}
