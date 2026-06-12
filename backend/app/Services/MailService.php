<?php

namespace App\Services;

use App\Models\Employee;
use Resend;
use Resend\Client;

class MailService
{
    private ?Client $resend = null;

    private function getClient(): Client
    {
        if ($this->resend === null) {
            $this->resend = Resend::client(env('RESEND_API_KEY'));
        }

        return $this->resend;
    }

    public function sendVerificationCode(string $email, string $code, string $purpose, mixed $target = null): bool
    {
        $subject = $this->getSubjectForPurpose($purpose);
        $body = $this->getBodyForPurpose($purpose, $code, $target);
        $text = $this->getAltBodyForPurpose($purpose, $code, $target);

        if (env('MAIL_MAILER') === 'log') {
            logger()->info("[MAIL] To: {$email} | Subject: {$subject} | Body: {$text}");

            return true;
        }

        try {
            $this->getClient()->emails->send([
                'from' => env('MAIL_FROM_ADDRESS', 'noreply@pixsprinting.com'),
                'to' => [$email],
                'subject' => $subject,
                'html' => $body,
                'text' => $text,
            ]);

            return true;
        } catch (\Exception $e) {
            logger()->error('Mail send failed: '.$e->getMessage());

            return false;
        }
    }

    private function getSubjectForPurpose(string $purpose): string
    {
        return match ($purpose) {
            'forgot_password' => 'PIXS Printing - Password Reset Code',
            'delete_order' => 'PIXS Printing - Order Deletion Verification',
            'delete_account' => 'PIXS Printing - Account Deletion Verification',
            'password_changed' => 'PIXS Printing - Password Changed',
            'change_email' => 'PIXS Printing - Email Change Verification',
            'email_changed' => 'PIXS Printing - Email Changed',
            default => 'PIXS Printing - Verification Code',
        };
    }

    private function getBodyForPurpose(string $purpose, string $code, mixed $target = null): string
    {
        $styles = $this->getEmailStyles();

        return match ($purpose) {
            'forgot_password' => $this->getForgotPasswordTemplate($code, $styles),
            'delete_order' => $this->getDeleteOrderTemplate($code, $styles),
            'delete_account' => $this->getDeleteAccountTemplate($code, $styles, $target),
            'password_changed' => $this->getPasswordChangedTemplate($styles),
            'change_email' => $this->getChangeEmailTemplate($code, $styles),
            'email_changed' => $this->getEmailChangedTemplate($styles),
            default => "<div style='{$styles['container']}'><p style='{$styles['code']}'>{$code}</p></div>",
        };
    }

    private function getEmailStyles(): array
    {
        return [
            'container' => 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;',
            'card' => 'background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);',
            'header' => 'text-align: center; margin-bottom: 24px;',
            'logo' => 'font-size: 28px; font-weight: bold; color: #1e293b;',
            'title' => 'font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 8px;',
            'subtitle' => 'color: #64748b; font-size: 14px; margin-bottom: 24px;',
            'code' => 'font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #1e293b; padding: 20px; background: #f1f5f9; border-radius: 12px; margin: 24px 0;',
            'warning' => 'background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; color: #dc2626; font-size: 14px; margin-top: 24px;',
            'footer' => 'text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;',
        ];
    }

    private function getForgotPasswordTemplate(string $code, array $s): string
    {
        return "
            <div style='{$s['container']}'>
                <div style='{$s['card']}'>
                    <div style='{$s['header']}'>
                        <div style='{$s['logo']}'>PIXS Printing</div>
                    </div>
                    <h2 style='{$s['title']}'>Password Reset Request</h2>
                    <p style='{$s['subtitle']}'>We received a request to reset your password. Use the code below:</p>
                    <div style='{$s['code']}'>{$code}</div>
                    <p style='color: #64748b; font-size: 14px;'>This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
                    <div style='{$s['warning']}'>Never share this code with anyone. Our team will never ask for your verification code.</div>
                </div>
                <p style='{$s['footer']}'>".date('Y').' PIXS Printing. All rights reserved.</p>
            </div>
        ';
    }

    private function getDeleteOrderTemplate(string $code, array $s): string
    {
        return "
            <div style='{$s['container']}'>
                <div style='{$s['card']}'>
                    <div style='{$s['header']}'>
                        <div style='{$s['logo']}'>PIXS Printing</div>
                    </div>
                    <h2 style='{$s['title']}'>Order Deletion Verification</h2>
                    <p style='{$s['subtitle']}'>A request was made to delete an order. Enter this code to confirm:</p>
                    <div style='{$s['code']}'>{$code}</div>
                    <div style='{$s['warning']}'>This action is irreversible. The order and all associated data will be permanently deleted.</div>
                </div>
                <p style='{$s['footer']}'>".date('Y').' PIXS Printing. Admin Portal</p>
            </div>
        ';
    }

    private function getDeleteAccountTemplate(string $code, array $s, mixed $target = null): string
    {
        $targetInfoHtml = '';
        if ($target) {
            $name = ($target->first_name ?? '').' '.($target->last_name ?? '');
            $email = $target->email ?? 'N/A';
            $role = $target->role ?? 'customer';
            $type = ($target instanceof Employee) ? 'Employee' : 'Customer';
            $company = $target->company_name ?? 'N/A';

            $targetInfoHtml = "
                <div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: left;'>
                    <h3 style='font-size: 14px; font-weight: bold; color: #475569; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;'>Account to be Deleted</h3>
                    <p style='margin: 6px 0; font-size: 14px; color: #1e293b;'><strong>Name:</strong> {$name}</p>
                    <p style='margin: 6px 0; font-size: 14px; color: #1e293b;'><strong>Email:</strong> {$email}</p>
                    <p style='margin: 6px 0; font-size: 14px; color: #1e293b;'><strong>Role:</strong> {$role}</p>
                    <p style='margin: 6px 0; font-size: 14px; color: #1e293b;'><strong>Type:</strong> {$type}</p>
                    <p style='margin: 6px 0; font-size: 14px; color: #1e293b;'><strong>Company:</strong> {$company}</p>
                </div>
            ";
        }

        return "
            <div style='{$s['container']}'>
                <div style='{$s['card']}'>
                    <div style='{$s['header']}'>
                        <div style='{$s['logo']}'>PIXS Printing</div>
                    </div>
                    <h2 style='{$s['title']}'>Account Deletion Verification</h2>
                    <p style='{$s['subtitle']}'>A request was made to delete the following account. Enter this code to confirm:</p>
                    {$targetInfoHtml}
                    <div style='{$s['code']}'>{$code}</div>
                    <div style='{$s['warning']}'>This action is irreversible. The account and all associated data will be permanently deleted.</div>
                </div>
                <p style='{$s['footer']}'>".date('Y').' PIXS Printing. Admin Portal</p>
            </div>
        ';
    }

    private function getPasswordChangedTemplate(array $s): string
    {
        $timestamp = now()->format('F j, Y g:i A');
        $ip = request()->ip() ?? 'Unknown';

        return "
            <div style='{$s['container']}'>
                <div style='{$s['card']}'>
                    <div style='{$s['header']}'>
                        <div style='{$s['logo']}'>PIXS Printing</div>
                    </div>
                    <h2 style='{$s['title']}'>Password Changed Successfully</h2>
                    <p style='{$s['subtitle']}'>Your account password was recently changed.</p>
                    <div style='background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0;'>
                        <p style='margin: 8px 0; color: #475569;'><strong>Date:</strong> {$timestamp}</p>
                        <p style='margin: 8px 0; color: #475569;'><strong>IP Address:</strong> {$ip}</p>
                    </div>
                    <div style='{$s['warning']}'>If you did not make this change, please contact support immediately.</div>
                </div>
                <p style='{$s['footer']}'>".date('Y').' PIXS Printing. All rights reserved.</p>
            </div>
        ';
    }

    private function getChangeEmailTemplate(string $code, array $s): string
    {
        return "
            <div style='{$s['container']}'>
                <div style='{$s['card']}'>
                    <div style='{$s['header']}'>
                        <div style='{$s['logo']}'>PIXS Printing</div>
                    </div>
                    <h2 style='{$s['title']}'>Email Change Request</h2>
                    <p style='{$s['subtitle']}'>We received a request to change the email address associated with your account. Use the code below to verify your identity:</p>
                    <div style='{$s['code']}'>{$code}</div>
                    <p style='color: #64748b; font-size: 14px;'>This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
                    <div style='{$s['warning']}'>Never share this code with anyone. Our team will never ask for your verification code.</div>
                </div>
                <p style='{$s['footer']}'>".date('Y').' PIXS Printing. All rights reserved.</p>
            </div>
        ';
    }

    private function getEmailChangedTemplate(array $s): string
    {
        $timestamp = now()->format('F j, Y g:i A');
        $ip = request()->ip() ?? 'Unknown';

        return "
            <div style='{$s['container']}'>
                <div style='{$s['card']}'>
                    <div style='{$s['header']}'>
                        <div style='{$s['logo']}'>PIXS Printing</div>
                    </div>
                    <h2 style='{$s['title']}'>Email Changed Successfully</h2>
                    <p style='{$s['subtitle']}'>Your account email address was recently updated.</p>
                    <div style='background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0;'>
                        <p style='margin: 8px 0; color: #475569;'><strong>Date:</strong> {$timestamp}</p>
                        <p style='margin: 8px 0; color: #475569;'><strong>IP Address:</strong> {$ip}</p>
                    </div>
                    <div style='{$s['warning']}'>If you did not make this change, please contact support immediately to secure your account.</div>
                </div>
                <p style='{$s['footer']}'>".date('Y').' PIXS Printing. All rights reserved.</p>
            </div>
        ';
    }

    private function getAltBodyForPurpose(string $purpose, string $code, mixed $target = null): string
    {
        return match ($purpose) {
            'forgot_password' => "Your password reset code is: {$code}\n\nThis code expires in 10 minutes. If you didn't request this, please ignore this email.",
            'delete_order' => "Your order deletion verification code is: {$code}\n\nThis action is irreversible.",
            'delete_account' => "Your account deletion verification code is: {$code}\n\nThis action is irreversible.".($target ? "\n\nAccount to be deleted:\nName: ".($target->first_name ?? '').' '.($target->last_name ?? '')."\nEmail: ".($target->email ?? 'N/A')."\nRole: ".($target->role ?? 'customer') : ''),
            'password_changed' => 'Your password was changed on '.now()->format('F j, Y g:i A').".\n\nIf you did not make this change, please contact support immediately.",
            'change_email' => "Your email change verification code is: {$code}\n\nThis code expires in 10 minutes. If you didn't request this, please ignore this email.",
            'email_changed' => 'Your account email address was successfully changed on '.now()->format('F j, Y g:i A').".\n\nIf you did not make this change, please contact support immediately.",
            default => "Your verification code is: {$code}",
        };
    }
}
