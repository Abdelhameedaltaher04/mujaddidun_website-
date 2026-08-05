import { useMemo, useState } from 'react';
import { ChevronDown, Phone } from 'lucide-react';
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js';
import { useLocale } from '@/contexts/LocaleContext';
import { IconInput } from '@/components/ui/icon-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export type PhoneCountry = {
  code: CountryCode;
  dialCode: string;
  flag: string;
};

const COUNTRIES: PhoneCountry[] = getCountries().map((code) => ({
  code,
  dialCode: `+${getCountryCallingCode(code)}`,
  flag: code.replace(/./g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))),
}));

const DEFAULT_COUNTRY = COUNTRIES.find((country) => country.code === 'JO') ?? COUNTRIES[0];
const displayNameCache = new Map<string, Intl.DisplayNames>();

function getCountryName(code: CountryCode, locale: string) {
  const language = locale === 'ar' ? 'ar' : 'en';
  const key = `${language}-${code}`;
  let displayNames = displayNameCache.get(language);
  if (!displayNames) {
    displayNames = new Intl.DisplayNames([language], { type: 'region' });
    displayNameCache.set(language, displayNames);
  }
  return displayNames.of(code) ?? key;
}

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
}

/**
 * Shared international phone field with searchable country selection.
 * The parent receives the complete international number, while the visible
 * input contains only the local digits after the selected calling code.
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
}: CountryPhoneFieldProps) {
  const { dir, locale, t } = useLocale();
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [open, setOpen] = useState(false);

  const valueCountry = useMemo(
    () => COUNTRIES.find((country) => value.startsWith(country.dialCode)),
    [value],
  );
  const activeCountry = valueCountry ?? selectedCountry;

  const localDigits = value.startsWith(activeCountry.dialCode)
    ? value.slice(activeCountry.dialCode.length).replace(/\D/g, '')
    : value.replace(/\D/g, '');

  const countryOptions = useMemo(
    () => COUNTRIES.map((country) => ({
      ...country,
      name: getCountryName(country.code, locale),
    })),
    [locale],
  );

  const selectCountry = (country: PhoneCountry) => {
    const currentDigits = value.startsWith(activeCountry.dialCode)
      ? value.slice(activeCountry.dialCode.length).replace(/\D/g, '')
      : value.replace(/\D/g, '');
    setSelectedCountry(country);
    setOpen(false);
    onCountryChange?.(country);
    onChange(currentDigits ? `${country.dialCode}${currentDigits}` : '');
  };

  return (
    <div className={cn('flex gap-2', className)} dir="ltr">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground shadow-none transition-colors hover:border-primary focus-ring-standard disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={t('auth.selectCountry')}
            data-testid={selectorTestId}
          >
            <span className="w-7 text-center text-lg leading-none" aria-hidden="true">{activeCountry.flag}</span>
            <span>{activeCountry.dialCode}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[300px] p-0" dir={dir}>
          <Command>
            <CommandInput placeholder={t('auth.countrySearch')} />
            <CommandList>
              <CommandEmpty>{t('auth.noCountriesFound')}</CommandEmpty>
              {countryOptions.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code} ${country.dialCode}`}
                  onSelect={() => selectCountry(country)}
                  className="gap-3 py-2.5"
                >
                  <span className="w-7 text-center text-lg leading-none" aria-hidden="true">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-xs text-muted-foreground" dir="ltr">{country.dialCode}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <IconInput
        icon={Phone}
        id={id}
        type="tel"
        value={localDigits}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '');
          onChange(digits ? `${activeCountry.dialCode}${digits}` : '');
        }}
        autoComplete="tel"
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        data-testid={inputTestId}
        disabled={disabled}
        className="h-12 min-w-0 flex-1 rounded-xl border-border bg-white text-base shadow-none"
      />
    </div>
  );
}

export { COUNTRIES };