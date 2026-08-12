import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useLocale } from '@/contexts/LocaleContext';
import { ADMIN_NAV_ITEMS } from './adminNav';

interface AdminSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Global admin command-palette: searches all navigation destinations and
 * lets the admin jump directly to any section.  Opens via the navbar
 * search button or Ctrl/Cmd+K.
 */
export function AdminSearchDialog({ open, onOpenChange }: AdminSearchDialogProps) {
  const { t } = useLocale();
  const [, navigate] = useLocation();

  const run = useCallback(
    (href: string) => {
      onOpenChange(false);
      navigate(href);
    },
    [navigate, onOpenChange],
  );

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={t('admin.search.placeholder')}
        data-testid="input-admin-search"
      />
      <CommandList>
        <CommandEmpty>{t('admin.search.empty')}</CommandEmpty>
        <CommandGroup heading={t('admin.search.navigation')}>
          {ADMIN_NAV_ITEMS.map((item) => {
            const label = t(`admin.nav.${item.key}`);
            return (
              <CommandItem
                key={item.key}
                value={label}
                onSelect={() => run(item.href)}
                data-testid={`search-item-${item.key}`}
              >
                <item.icon className="me-2 h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
