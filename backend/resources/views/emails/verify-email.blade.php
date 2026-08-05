<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify your email</title>
</head>
<body style="margin:0;background:#f4fafb;color:#173044;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f4fafb;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(0,64,86,.10);">
                    <tr>
                        <td style="padding:28px 32px;background:#0071A0;text-align:center;">
                            <img src="{{ $logoUrl }}" alt="Mujaddidun" width="86" height="86" style="display:inline-block;border-radius:16px;background:#ffffff;padding:8px;object-fit:contain;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 40px 32px;text-align:center;">
                            <p style="margin:0 0 12px;color:#FF5810;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Welcome to Mujaddidun</p>
                            <h1 style="margin:0;color:#173044;font-size:28px;line-height:1.35;">Welcome, {{ $user->first_name }}!</h1>
                            <p style="margin:20px auto 0;max-width:440px;color:#607583;font-size:16px;line-height:1.8;">
                                Thank you for joining our community. Please verify your email address to activate your account and continue.
                            </p>
                            <p style="margin:30px 0;">
                                <a href="{{ $verificationUrl }}" style="display:inline-block;padding:15px 30px;border-radius:10px;background:#0071A0;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">Verify Email Address</a>
                            </p>
                            <p style="margin:0;color:#80919a;font-size:13px;line-height:1.7;">
                                This verification link expires in {{ $expiresInMinutes }} minutes.
                            </p>
                            <p style="margin:22px 0 0;color:#9aa8ae;font-size:12px;line-height:1.7;">
                                If you did not create an account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 32px;background:#f7fbfc;text-align:center;color:#71848d;font-size:12px;">
                            Mujaddidun Charity Development Association · Jordan
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>