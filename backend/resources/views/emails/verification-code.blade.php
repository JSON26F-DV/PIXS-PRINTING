<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f7; margin: 0; padding: 40px 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 15px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; text-align: center; }
        .code-box { background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 10px; padding: 25px; margin: 20px 0; }
        .auth-code { font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #3b82f6; font-family: monospace; }
        .warning { font-size: 13px; color: #64748b; background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $title }}</h1>
        </div>
        <div class="content">
            <p>{{ $subtitle }}</p>
            <div class="code-box">
                <div class="auth-code">{{ $code }}</div>
            </div>
            @if(isset($expirationText))
                <p><strong>{{ $expirationText }}</strong></p>
            @endif
            <div class="warning">
                ⚠️ {{ $warningText }}
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply.</p>
            <p>© {{ date('Y') }} PIXS Printing</p>
        </div>
    </div>
</body>
</html>
