<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\MailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PasswordChangeNotificationController extends Controller
{
    public function __construct(
        private MailService $mailService
    ) {}

    public function sendNotification(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $sent = $this->mailService->sendVerificationCode(
            $request->email,
            '',
            'password_changed'
        );

        if (! $sent) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send notification email.',
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Password change notification sent.',
        ]);
    }
}
