import { PhoneInput, type ParsedCountry } from 'react-international-phone';
import 'react-international-phone/style.css';
import type { CountryCode } from 'libphonenumber-js';
import type { CSSProperties, InputHTMLAttributes } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

export type PhoneCountry = {
  code: CountryCode;
  dialCode: string;
  name: string;
};

interface CountryPhoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (country: PhoneCountry) => void;
  id: string;
  placeholder?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  inputTestId?: string;
  selectorTestId?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

function toPhoneCountry(country: ParsedCountry): PhoneCountry {
  return {
    code: country.iso2.toUpperCase() as CountryCode,
    dialCode: `+${country.dialCode}`,
    name: country.name,
  };
}

/**
 * Shared professional international phone field.
 *
 * react-international-phone owns the country selector, real flag assets,
 * searchable country list, country names, dial codes, and international
 * formatting. Parents receive the complete E.164 phone value.
 */
export function CountryPhoneField({
  value,
  onChange,
  onCountryChange,
  id,
  placeholder,
  ariaInvalid,
  ariaDescribedBy,
  inputTestId,
  selectorTestId,
  className,
  disabled,
  required,
}: CountryPhoneFieldProps) {
  const { dir, t } = useLocale();

  return (
    <div
      className={cn('country-phone-field w-full', className)}
      dir="ltr"
      data-testid={`${inputTestId ?? id}-wrapper`}
      data-country-selector-testid={selectorTestId}
      data-country-selector-library="react-international-phone"
    >
      <PhoneInput
        defaultCountry="jo"
        preferredCountries={['jo', 'sa', 'ae', 'eg']}
        value={value ?? ''}
        forceDialCode
        disableDialCodeAndPrefix={false}
        onChange={(phone, meta) => {
          onChange(phone);
          onCountryChange?.(toPhoneCountry(meta.country));
        }}
        inputProps={{
          id,
          name: id,
          dir: 'ltr',
          required,
          placeholder,
          autoComplete: 'tel',
          'aria-invalid': ariaInvalid,
          'aria-describedby': ariaDescribedBy,
          'aria-label': t('auth.phone'),
          'data-testid': inputTestId,
        } as InputHTMLAttributes<HTMLInputElement> & { 'data-testid'?: string }}
        disabled={disabled}
        inputClassName="country-phone-input"
        className="country-phone-input-container"
        countrySelectorStyleProps={{
          buttonClassName: 'country-phone-selector',
          flagClassName: 'country-phone-flag',
          dropdownStyleProps: {
            className: 'country-phone-dropdown',
          },
        }}
        style={{
          '--react-international-phone-height': '48px',
          '--react-international-phone-border-radius': '0.75rem',
          '--react-international-phone-border-color': 'hsl(var(--border))',
          '--react-international-phone-background-color': 'white',
          '--react-international-phone-text-color': 'hsl(var(--foreground))',
          '--react-international-phone-font-size': '1rem',
          '--react-international-phone-dropdown-item-font-size': '0.875rem',
          '--react-international-phone-flag-width': '24px',
          '--react-international-phone-flag-height': '18px',
        } as CSSProperties}
      />
      <span className="sr-only" dir={dir}>
        {t('auth.countrySelectorDescription')}
      </span>
    </div>
  );
}
