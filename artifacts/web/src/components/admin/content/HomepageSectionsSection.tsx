import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import {
  HOMEPAGE_SECTION_KEYS,
  type HomepageSection,
  type HomepageSectionKey,
} from '@/services/adminContent';
import { useUpdateHomepageSections } from '@/hooks/useAdminContent';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';

interface Props {
  sections: HomepageSection[];
  onDirtyChange: (dirty: boolean) => void;
}

interface Row {
  section_key: HomepageSectionKey;
  is_visible: boolean;
}

/** Build the ordered, deduplicated row list from the API payload. */
function toRows(sections: HomepageSection[]): Row[] {
  const byKey = new Map<HomepageSectionKey, HomepageSection>();
  sections.forEach((section) => byKey.set(section.section_key, section));
  const present = [...sections]
    .filter((section) => HOMEPAGE_SECTION_KEYS.includes(section.section_key))
    .sort((a, b) => a.display_order - b.display_order)
    .map((section) => section.section_key);
  const missing = HOMEPAGE_SECTION_KEYS.filter((key) => !byKey.has(key));
  const ordered = [...new Set([...present, ...missing])];
  return ordered.map((key) => ({
    section_key: key,
    is_visible: byKey.get(key)?.is_visible ?? true,
  }));
}

export function HomepageSectionsSection({ sections, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateHomepageSections();

  const initial = useMemo(() => toRows(sections), [sections]);
  const [rows, setRows] = useState<Row[]>(initial);

  const isDirty = JSON.stringify(rows) !== JSON.stringify(initial);
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const reset = () => setRows(initial);

  const toggle = (key: HomepageSectionKey, is_visible: boolean) =>
    setRows((prev) =>
      prev.map((row) =>
        row.section_key === key ? { ...row, is_visible } : row,
      ),
    );

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = () => {
    mutation.mutate(
      rows.map((row) => ({
        section_key: row.section_key,
        is_visible: row.is_visible,
      })),
      {
        onSuccess: () => toast({ description: t('admin.content.saveSuccess') }),
        onError: (error) =>
          toast({
            variant: 'destructive',
            description:
              getApiError(error).message || t('admin.content.saveError'),
          }),
      },
    );
  };

  return (
    <SettingsSectionShell
      title={t('admin.content.tabs.homepageSections')}
      description={t('admin.content.homepageSections.description')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="content-section-homepage-sections"
    >
      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li
            key={row.section_key}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
            data-testid={`row-section-${row.section_key}`}
          >
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                data-testid={`button-move-up-section-${row.section_key}`}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
                data-testid={`button-move-down-section-${row.section_key}`}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <Label className="flex-1 font-medium">
              {t(`admin.content.homepageSections.keys.${row.section_key}`)}
            </Label>
            <Switch
              checked={row.is_visible}
              onCheckedChange={(is_visible) =>
                toggle(row.section_key, is_visible)
              }
              data-testid={`switch-section-${row.section_key}`}
            />
          </li>
        ))}
      </ul>
    </SettingsSectionShell>
  );
}
