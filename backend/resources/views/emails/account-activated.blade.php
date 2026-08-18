{{-- Account activation notice. Mirrors emails/verify-email.blade.php: table
     layout with inline styles for mail-client compatibility. Renders RTL
     Arabic or LTR English from the member's own `locale`. --}}
@php($dir = $isArabic ? 'rtl' : 'ltr')
@php($font = $isArabic ? "'Segoe UI',Tahoma,Arial,Helvetica,sans-serif" : "Arial,Helvetica,sans-serif")
<!doctype html>
<html lang="{{ $isArabic ? 'ar' : 'en' }}" dir="{{ $dir }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $isArabic ? 'تم تفعيل حسابك' : 'Your account has been activated' }}</title>
</head>
<body style="margin:0;background:#f4fafb;color:#173044;font-family:{{ $font }};" dir="{{ $dir }}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f4fafb;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="{{ $dir }}" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(0,64,86,.10);">
                    <tr>
                        <td style="padding:28px 32px;background:#0071A0;text-align:center;">
                            <img src="{{ $logoUrl }}" alt="{{ $isArabic ? 'مجددون' : 'Mujaddidun' }}" width="86" height="86" style="display:inline-block;border-radius:16px;background:#ffffff;padding:8px;object-fit:contain;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 40px 32px;text-align:center;">
                            <p style="margin:0 0 12px;color:#FF5810;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                                {{ $isArabic ? 'جمعية مجددون الخيرية التنموية' : 'Mujaddidun Charity Development Association' }}
                            </p>
                            <h1 style="margin:0;color:#173044;font-size:28px;line-height:1.35;">
                                @if ($isArabic)
                                    مرحباً {{ $user->first_name }}، تم تفعيل حسابك!
                                @else
                                    Welcome {{ $user->first_name }}, your account is active!
                                @endif
                            </h1>
                            <p style="margin:20px auto 0;max-width:460px;color:#607583;font-size:16px;line-height:1.9;">
                                @if ($isArabic)
                                    يسعدنا إعلامك بأنه تمت مراجعة حسابك على منصة مجددون وتفعيله بنجاح.
                                    يمكنك الآن تسجيل الدخول والاستفادة من كامل خدمات المنصة.
                                @else
                                    We are pleased to let you know that your Mujaddidun account has been
                                    reviewed and successfully activated. You can now sign in and use all
                                    of the platform's services.
                                @endif
                            </p>
                            <p style="margin:30px 0;">
                                <a href="{{ $loginUrl }}" style="display:inline-block;padding:15px 34px;border-radius:10px;background:#0071A0;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">
                                    {{ $isArabic ? 'تسجيل الدخول' : 'Sign in to your account' }}
                                </a>
                            </p>
                            <p style="margin:0;color:#80919a;font-size:13px;line-height:1.8;">
                                {{ $isArabic ? 'أو انسخ الرابط التالي والصقه في المتصفح:' : 'Or copy and paste this link into your browser:' }}<br>
                                <a href="{{ $loginUrl }}" style="color:#0071A0;word-break:break-all;" dir="ltr">{{ $loginUrl }}</a>
                            </p>
                            <p style="margin:22px 0 0;color:#9aa8ae;font-size:12px;line-height:1.8;">
                                @if ($isArabic)
                                    استخدم البريد الإلكتروني وكلمة المرور اللذين سجّلت بهما. إذا لم تطلب إنشاء
                                    هذا الحساب، يرجى التواصل معنا.
                                @else
                                    Sign in with the email address and password you registered with. If you did
                                    not create this account, please contact us.
                                @endif
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 32px;background:#f7fbfc;text-align:center;color:#71848d;font-size:12px;">
                            {{ $isArabic ? 'جمعية مجددون الخيرية التنموية · الأردن' : 'Mujaddidun Charity Development Association · Jordan' }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
