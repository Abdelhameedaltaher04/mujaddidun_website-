<?php

namespace App\Services\Settings;

use App\Models\WebsiteSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Central store for website settings. Each section is one row in
 * `website_settings` (setting_key = "site.{section}") whose value_json
 * holds the section payload. Images are kept as storage paths and only
 * turned into routed public URLs when building responses.
 *
 * Email settings hold display configuration only (sender name /
 * addresses). SMTP credentials live exclusively in the server
 * environment and are never stored here nor returned by the API.
 */
class SettingsService
{
    public const SECTIONS = ['general', 'contact', 'social', 'branding', 'seo', 'email', 'controls'];

    private const UPLOAD_DIR = 'site-branding';

    /** Sections whose stored payload is safe for the public endpoint. */
    private const PUBLIC_SECTIONS = ['general', 'contact', 'social', 'branding', 'seo', 'controls'];

    /** Image fields per section: input file key => stored path key. */
    private const IMAGE_FIELDS = [
        'general' => ['logo' => 'logo_path', 'favicon' => 'favicon_path'],
        'branding' => ['primary_logo' => 'primary_logo_path', 'footer_logo' => 'footer_logo_path', 'favicon' => 'favicon_path'],
        'seo' => ['og_image' => 'og_image_path'],
    ];

    public static function defaults(): array
    {
        return [
            'general' => [
                'site_name_ar' => 'منصة مجددون',
                'site_name_en' => 'Mujaddidun Platform',
                'description_ar' => 'منصة مجددون التطوعية — مبادرات وبرامج مجتمعية تصنع أثراً مستداماً.',
                'description_en' => 'Mujaddidun volunteer platform — community programs and initiatives creating lasting impact.',
                'logo_path' => null,
                'favicon_path' => null,
            ],
            'contact' => [
                'phone' => '+96265001122',
                'whatsapp' => '+962790001122',
                'email' => 'info@mujaddidun.org',
                'address_ar' => 'عمّان، الأردن',
                'address_en' => 'Amman, Jordan',
                'maps_url' => 'https://maps.google.com/?q=Amman+Jordan',
                'working_hours_ar' => '',
                'working_hours_en' => '',
            ],
            'social' => [
                'facebook' => ['value' => '', 'enabled' => false],
                'instagram' => ['value' => '', 'enabled' => false],
                'linkedin' => ['value' => '', 'enabled' => false],
                'youtube' => ['value' => '', 'enabled' => false],
                'whatsapp' => ['value' => '', 'enabled' => false],
            ],
            'branding' => [
                'primary_logo_path' => null,
                'footer_logo_path' => null,
                'favicon_path' => null,
                'website_title' => 'Mujaddidun | مجددون',
                'default_language' => 'ar',
            ],
            'seo' => [
                'meta_title_ar' => 'منصة مجددون — مبادرات تطوعية وبرامج مجتمعية',
                'meta_title_en' => 'Mujaddidun — Volunteer Programs & Community Impact',
                'meta_description_ar' => 'انضم إلى منصة مجددون: برامج تطوعية، فعاليات مجتمعية، وفرص للعطاء.',
                'meta_description_en' => 'Join Mujaddidun: volunteer programs, community events, and giving opportunities.',
                'keywords' => 'تطوع, مجددون, مبادرات, volunteer, community, Jordan',
                'og_image_path' => null,
            ],
            'email' => [
                'sender_name' => 'Mujaddidun Platform',
                'sender_email' => 'no-reply@mujaddidun.org',
                'reply_to_email' => 'info@mujaddidun.org',
            ],
            'controls' => [
                'maintenance_mode' => false,
                'allow_registrations' => true,
                'allow_event_registrations' => true,
                'allow_volunteer_applications' => true,
                'show_donations' => true,
                'show_partners' => true,
                'show_faqs' => true,
            ],
        ];
    }

    /** Raw stored section (defaults merged under stored values). */
    public function section(string $section): array
    {
        $stored = WebsiteSetting::where('setting_key', "site.{$section}")->value('value_json') ?? [];

        return array_replace(self::defaults()[$section], $stored);
    }

    /** Full admin payload (all sections, image paths as public URLs). */
    public function all(): array
    {
        $out = [];
        foreach (self::SECTIONS as $section) {
            $out[$section] = $this->present($section, $this->section($section));
        }

        return $out;
    }

    /** Sanitized payload for the public website (no email section). */
    public function publicSettings(): array
    {
        $out = [];
        foreach (self::PUBLIC_SECTIONS as $section) {
            $out[$section] = $this->present($section, $this->section($section));
        }

        return $out;
    }

    /**
     * Persists a section: merges scalar fields, then applies uploads and
     * removals for the section's image fields.
     *
     * @param  array<string, UploadedFile|null>  $files
     * @param  array<string, bool>  $removals  keyed by "remove_{field}"
     */
    public function save(string $section, array $fields, array $files = [], array $removals = [], ?int $userId = null): array
    {
        $current = $this->section($section);
        $next = array_replace($current, $fields);

        foreach (self::IMAGE_FIELDS[$section] ?? [] as $fileKey => $pathKey) {
            $upload = $files[$fileKey] ?? null;
            if ($upload instanceof UploadedFile) {
                $this->deleteFile($current[$pathKey] ?? null);
                $next[$pathKey] = $upload->store(self::UPLOAD_DIR, 'public');
            } elseif (! empty($removals["remove_{$fileKey}"])) {
                $this->deleteFile($current[$pathKey] ?? null);
                $next[$pathKey] = null;
            }
        }

        WebsiteSetting::updateOrCreate(
            ['setting_key' => "site.{$section}"],
            [
                'setting_group' => $section,
                'value_json' => $next,
                'value_type' => 'json',
                'is_public' => in_array($section, self::PUBLIC_SECTIONS, true),
                'description' => "Website {$section} settings",
                'updated_by' => $userId,
            ],
        );

        return $this->present($section, $next);
    }

    /** Converts stored *_path keys into routed *_url keys. */
    private function present(string $section, array $values): array
    {
        foreach (self::IMAGE_FIELDS[$section] ?? [] as $pathKey) {
            $urlKey = str_replace('_path', '_url', $pathKey);
            $values[$urlKey] = $values[$pathKey] ? '/api/v1/files/'.$values[$pathKey] : null;
            unset($values[$pathKey]);
        }

        return $values;
    }

    private function deleteFile(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
