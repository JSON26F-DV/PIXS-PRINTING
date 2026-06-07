<?php

namespace App\Services;

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

class MailService
{
    private PHPMailer $mail;

    public function __construct()
    {
        $this->mail = new PHPMailer(true);
        $this->configureMail();
    }

    private function configureMail(): void
    {
        if (env('MAIL_MAILER') === 'smtp') {
            $this->mail->isSMTP();
            $this->mail->Host = env('MAIL_HOST');
            $this->mail->SMTPAuth = true;
            $this->mail->Username = env('MAIL_USERNAME');
            $this->mail->Password = env('MAIL_PASSWORD');
            $this->mail->SMTPSecure = env('MAIL_ENCRYPTION', PHPMailer::ENCRYPTION_STARTTLS);
            $this->mail->Port = env('MAIL_PORT', 587);
        }

        $this->mail->setFrom(
            env('MAIL_FROM_ADDRESS', 'noreply@pixsprinting.com'),
            env('MAIL_FROM_NAME', 'PIXS Printing')
        );
        $this->mail->isHTML(true);
        $this->mail->CharSet = 'UTF-8';
    }

    public function sendVerificationCode(string $email, string $code, string $purpose): bool
    {
        $subject = $this->getSubjectForPurpose($purpose);
        $body = $this->getBodyForPurpose($purpose, $code);
        $altBody = $this->getAltBodyForPurpose($purpose, $code);

        if (env('MAIL_MAILER') === 'log') {
            logger()->info("[MAIL] To: {$email} | Subject: {$subject} | Body: {$altBody}");

            return true;
        }

        try {
            $this->mail->addAddress($email);
            $this->mail->Subject = $subject;
            $this->mail->Body = $body;
            $this->mail->AltBody = $altBody;

            $this->mail->send();

            return true;
        } catch (Exception $e) {
            logger()->error('Mail send failed: '.$e->getMessage());

            return false;
        } finally {
            $this->mail->clearAddresses();
            $this->mail->clearAttachments();
        }
    }

    private function getSubjectForPurpose(string $purpose): string
    {
        return match ($purpose) {
            'forgot_password' => 'PIXS Printing - Password Reset Code',
            'delete_order' => 'PIXS Printing - Order Deletion Verification',
            'delete_account' => 'PIXS Printing - Account Deletion Verification',
            'password_changed' => 'PIXS Printing - Password Changed',
            default => 'PIXS Printing - Verification Code',
        };
    }

    private function getBodyForPurpose(string $purpose, string $code): string
    {
        $styles = $this->getEmailStyles();

        return match ($purpose) {
            'forgot_password' => $this->getForgotPasswordTemplate($code, $styles),
            'delete_order' => $this->getDeleteOrderTemplate($code, $styles),
            'delete_account' => $this->getDeleteAccountTemplate($code, $styles),
            'password_changed' => $this->getPasswordChangedTemplate($styles),
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

    private function getDeleteAccountTemplate(string $code, array $s): string
    {
        return "
            <div style='{$s['container']}'>
                <div style='{$s['card']}'>
                    <div style='{$s['header']}'>
                        <div style='{$s['logo']}'>PIXS Printing</div>
                    </div>
                    <h2 style='{$s['title']}'>Account Deletion Verification</h2>
                    <p style='{$s['subtitle']}'>A request was made to delete an account. Enter this code to confirm:</p>
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

    private function getAltBodyForPurpose(string $purpose, string $code): string
    {
        return match ($purpose) {
            'forgot_password' => "Your password reset code is: {$code}\n\nThis code expires in 10 minutes. If you didn't request this, please ignore this email.",
            'delete_order' => "Your order deletion verification code is: {$code}\n\nThis action is irreversible.",
            'delete_account' => "Your account deletion verification code is: {$code}\n\nThis action is irreversible.",
            'password_changed' => 'Your password was changed on '.now()->format('F j, Y g:i A').".\n\nIf you did not make this change, please contact support immediately.",
            default => "Your verification code is: {$code}",
        };
    }
}
