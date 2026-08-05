import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'wouter';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ImagePlus,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/AuthLayout';
import { CountryPhoneField, type PhoneCountry } from '@/components/forms/CountryPhoneField';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { authApi, type AuthUser } from '@/services/auth';
import { getApiError } from '@/services/api';
import type { CountryCode } from 'libphonenumber-js';

const PROFILE_COUNTRIES = ['JO', 'SA', 'AE', 'EG', 'IQ', 'KW', 'QA', 'BH', 'OM', 'TR', 'GB', 'US', 'CA', 'AU', 'DE', 'FR'] as const;

const PASSWORD_RULES = [
  { key: 'length', test: (value: string) => value.length >= 8 },
  { key: 'uppercase', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'lowercase', test: (value: string) => /[a-z]/.test(value) },
  { key: 'number', test: (value: string) => /\d/.test(value) },
  { key: 'special', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

function ProfilePageContent() {
  const { t, locale, dir } = useLocale();
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [countryCode, setCountryCode] = useState<CountryCode>(
    (user?.country_code as CountryCode) || 'JO',
  );
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileMessage, setProfileMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    void refreshUser().then((currentUser) => {
      if (!currentUser) return;
      setProfile(currentUser);
      setFirstName(currentUser.first_name);
      setLastName(currentUser.last_name);
      setPhone(currentUser.phone ?? '');
      setCountryCode((currentUser.country_code as CountryCode) || 'JO');
    });
  }, [refreshUser]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const avatarSrc = previewUrl || profile?.avatar_url || null;
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
  const passwordRules = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, valid: rule.test(newPassword) })),
    [newPassword],
  );

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) || file.size > 2 * 1024 * 1024) {
      setProfileMessage({ kind: 'error', text: t('profile.avatarInvalid') });
      event.target.value = '';
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedAvatar(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveAvatar(false);
    setProfileMessage(null);
  };

  const handleRemoveAvatar = async () => {
    if (selectedAvatar) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedAvatar(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (!profile?.avatar_url) return;

    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      const updated = await authApi.removeAvatar();
      setProfile(updated);
      await refreshUser();
      setProfileMessage({ kind: 'success', text: t('profile.avatarRemoved') });
    } catch (error) {
      setProfileMessage({ kind: 'error', text: getApiError(error).message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!firstName.trim()) nextErrors.first_name = t('profile.validation.firstName');
    if (!lastName.trim()) nextErrors.last_name = t('profile.validation.lastName');
    if (!phone.trim()) nextErrors.phone = t('profile.validation.phone');
    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || isSavingProfile) return;

    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      const updated = await authApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        country_code: countryCode,
        avatar: selectedAvatar ?? undefined,
        remove_avatar: removeAvatar,
      });
      setProfile(updated);
      setSelectedAvatar(null);
      setPreviewUrl(null);
      setRemoveAvatar(false);
      await refreshUser();
      setProfileMessage({ kind: 'success', text: t('profile.profileSaved') });
    } catch (error) {
      const apiError = getApiError(error);
      setProfileErrors((current) => ({ ...current, ...apiError.fields }));
      setProfileMessage({ kind: 'error', text: apiError.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setPasswordMessage(null);
    if (!currentPassword) {
      setCurrentPasswordError(t('profile.validation.currentPassword'));
      return;
    }
    if (PASSWORD_RULES.some((rule) => !rule.test(newPassword))) {
      setNewPasswordError(t('auth.validation.passwordWeak'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t('auth.validation.passwordMismatch'));
      return;
    }
    if (isChangingPassword) return;

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ kind: 'success', text: t('profile.passwordSaved') });
    } catch (error) {
      const apiError = getApiError(error);
      setCurrentPasswordError(apiError.fields.current_password || '');
      setNewPasswordError(apiError.fields.new_password || '');
      setConfirmPasswordError(apiError.fields.password_confirmation || '');
      setPasswordMessage({ kind: 'error', text: apiError.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const countryName = profile?.country_code
    ? t(`auth.countryNames.${profile.country_code}`)
    : t('profile.notAvailable');
  const roleName = profile?.role
    ? locale === 'ar' && profile.role.slug === 'user'
      ? t('profile.roles.user')
      : profile.role.name
    : t('profile.notAvailable');
  const accountStatus = profile?.status === 'active' ? t('profile.status.active') : profile?.status || t('profile.notAvailable');
  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-JO' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(profile.created_at))
    : t('profile.notAvailable');

  return (
    <div dir={dir} className="min-h-screen bg-[#f7fbfc] text-foreground">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-secondary">{t('profile.eyebrow')}</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t('profile.title')}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{t('profile.description')}</p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary focus-ring-standard">
            {dir === 'rtl' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {t('profile.backHome')}
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-white">
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <CircleUserRound className="h-5 w-5 text-primary" aria-hidden="true" />
                  {t('profile.informationTitle')}
                </CardTitle>
                <CardDescription>{t('profile.informationDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
                <InfoItem icon={UserRound} label={t('profile.name')} value={displayName || t('profile.notAvailable')} />
                <InfoItem icon={Mail} label={t('auth.email')} value={profile?.email || t('profile.notAvailable')} />
                <InfoItem icon={Phone} label={t('auth.phone')} value={profile?.phone || t('profile.notAvailable')} />
                <InfoItem icon={MapPin} label={t('profile.country')} value={countryName} />
                <InfoItem icon={ShieldCheck} label={t('profile.role')} value={roleName} />
                <InfoItem icon={CheckCircle2} label={t('profile.accountStatus')} value={accountStatus} badge={profile?.status === 'active'} />
                <InfoItem icon={Mail} label={t('profile.emailVerification')} value={profile?.email_verified_at ? t('profile.verified') : t('profile.notVerified')} badge={Boolean(profile?.email_verified_at)} />
                <InfoItem icon={CalendarDays} label={t('profile.memberSince')} value={memberSince} />
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-xl">{t('profile.editTitle')}</CardTitle>
                <CardDescription>{t('profile.editDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6" noValidate>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-[28px] bg-primary/10 text-primary">
                      {avatarSrc ? <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" /> : <ImagePlus className="h-9 w-9" aria-hidden="true" />}
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">{t('profile.profilePicture')}</p>
                      <p className="text-sm text-muted-foreground">{t('profile.avatarHint')}</p>
                      <div className="flex flex-wrap gap-2">
                        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="sr-only" />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSavingProfile} className="rounded-xl">
                          <Upload className="h-4 w-4" aria-hidden="true" />
                          {t('profile.upload')}
                        </Button>
                        {(avatarSrc || selectedAvatar) && (
                          <Button type="button" variant="ghost" onClick={() => void handleRemoveAvatar()} disabled={isSavingProfile} className="rounded-xl text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            {t('profile.remove')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileField id="profile-first-name" label={t('auth.firstName')} value={firstName} onChange={setFirstName} error={profileErrors.first_name} />
                    <ProfileField id="profile-last-name" label={t('auth.lastName')} value={lastName} onChange={setLastName} error={profileErrors.last_name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">{t('auth.email')}</Label>
                    <Input id="profile-email" value={profile?.email || ''} disabled className="h-12 rounded-xl bg-muted/50" />
                    <p className="text-xs text-muted-foreground">{t('profile.emailLocked')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">{t('auth.phone')}</Label>
                    <CountryPhoneField value={phone} onChange={setPhone} onCountryChange={(country: PhoneCountry) => setCountryCode(country.code)} id="profile-phone" placeholder={t('auth.phonePlaceholder')} ariaInvalid={Boolean(profileErrors.phone)} ariaDescribedBy={profileErrors.phone ? 'profile-phone-error' : undefined} inputTestId="input-profile-phone" selectorTestId="button-profile-country" />
                    {profileErrors.phone && <FieldErrorText id="profile-phone-error" message={profileErrors.phone} />}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-country">{t('profile.country')}</Label>
                    <select id="profile-country" value={countryCode} onChange={(event) => setCountryCode(event.target.value as CountryCode)} className="flex h-12 w-full rounded-xl border border-input bg-white px-3 text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      {PROFILE_COUNTRIES.map((country) => <option key={country} value={country}>{t(`auth.countryNames.${country}`)}</option>)}
                    </select>
                  </div>
                  {profileMessage && <Message kind={profileMessage.kind} text={profileMessage.text} />}
                  <Button type="submit" disabled={isSavingProfile} className="h-12 rounded-xl px-7 font-bold">
                    {isSavingProfile ? t('common.loading') : t('profile.saveChanges')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />
                {t('profile.passwordTitle')}
              </CardTitle>
              <CardDescription>{t('profile.passwordDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
                <PasswordField id="profile-current-password" label={t('profile.currentPassword')} value={currentPassword} onChange={setCurrentPassword} error={currentPasswordError} autoComplete="current-password" placeholder={t('auth.passwordPlaceholder')} testId="field-profile-current-password" inputTestId="input-profile-current-password" />
                <PasswordField id="profile-new-password" label={t('auth.newPassword')} value={newPassword} onChange={setNewPassword} error={newPasswordError} autoComplete="new-password" placeholder={t('auth.passwordPlaceholder')} testId="field-profile-new-password" inputTestId="input-profile-new-password" />
                <div className="grid gap-2 rounded-xl border border-border/70 bg-muted/30 p-3 sm:grid-cols-2">
                  {passwordRules.map((rule) => <div key={rule.key} className={`flex items-center gap-2 text-xs ${rule.valid ? 'text-primary' : 'text-muted-foreground'}`}><CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>{t(`auth.passwordRules.${rule.key}`)}</span></div>)}
                </div>
                <PasswordField id="profile-confirm-password" label={t('auth.confirmPassword')} value={confirmPassword} onChange={setConfirmPassword} error={confirmPasswordError} autoComplete="new-password" placeholder={t('auth.confirmPasswordPlaceholder')} testId="field-profile-confirm-password" inputTestId="input-profile-confirm-password" />
                {passwordMessage && <Message kind={passwordMessage.kind} text={passwordMessage.text} />}
                <Button type="submit" disabled={isChangingPassword} className="h-12 w-full rounded-xl font-bold">
                  {isChangingPassword ? t('common.loading') : t('profile.changePassword')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, badge }: { icon: typeof UserRound; label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted/30 p-3.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        {badge === undefined ? <p className="mt-1 break-words text-sm font-semibold">{value}</p> : <Badge variant={badge ? 'default' : 'outline'} className="mt-1">{value}</Badge>}
      </div>
    </div>
  );
}

function ProfileField({ id, label, value, onChange, error }: { id: string; label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl bg-white" aria-invalid={Boolean(error)} />
      {error && <FieldErrorText id={`${id}-error`} message={error} />}
    </div>
  );
}

function FieldErrorText({ id, message }: { id: string; message: string }) {
  return <p id={id} className="text-xs font-medium text-destructive" role="alert">{message}</p>;
}

function Message({ kind, text }: { kind: 'success' | 'error'; text: string }) {
  return <p role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm font-medium ${kind === 'success' ? 'bg-[#e5f4ef] text-primary' : 'bg-[#fff0eb] text-secondary'}`}>{text}</p>;
}

export default function ProfilePage() {
  return <ProtectedRoute component={ProfilePageContent} />;
}