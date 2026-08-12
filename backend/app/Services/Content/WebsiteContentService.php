<?php

namespace App\Services\Content;

use App\Models\HomepageSection;
use App\Models\SiteCtaSection;
use App\Models\SiteStatistic;
use App\Models\WebsiteSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Central store for editable public website content. Singleton sections
 * (hero, about, vision/mission, footer) each occupy one row in
 * `website_settings` (setting_key = "content.{section}") mirroring the
 * SettingsService pattern; repeatable content (statistics, CTA sections)
 * and homepage section visibility/order live in dedicated tables.
 *
 * Defaults reproduce the values previously hardcoded on the public
 * homepage so an untouched install renders identically.
 */
class WebsiteContentService
{
    public const SECTIONS = ['hero', 'about', 'vision_mission', 'footer'];

    private const UPLOAD_DIR = 'content-images';

    /** Image fields per section: input file key => stored path key. */
    private const IMAGE_FIELDS = [
        'hero' => ['background_image' => 'background_image_path'],
        'about' => ['image' => 'image_path'],
    ];

    public static function defaults(): array
    {
        return [
            'hero' => [
                'title_ar' => 'نُطعِم . نُسكِن . نُمكِّن',
                'title_en' => 'We Feed . We Shelter . We Empower',
                'description_ar' => 'مجتمع أردني متماسك، واعٍ، ومبادر، يشارك أفراده في التنمية المستدامة وصناعة الأثر الإيجابي.',
                'description_en' => 'A cohesive, aware, and proactive Jordanian society whose members participate in sustainable development and in creating positive impact.',
                'primary_button_text_ar' => 'تبرع الآن',
                'primary_button_text_en' => 'Donate Now',
                'primary_button_url' => '/donate',
                'secondary_button_text_ar' => 'قصتنا',
                'secondary_button_text_en' => 'Our Story',
                'secondary_button_url' => '/about',
                'background_image_path' => null,
                'is_active' => true,
            ],
            'about' => [
                'title_ar' => 'من نحن',
                'title_en' => 'About Us',
                'description_ar' => "تأسست جمعية مجددون الخيرية التنموية في الأردن عام ٢٠٠٩ ومسجلة لدى وزارة التنمية الاجتماعية برقم (١٩٢٤). بدأنا بمبادرات شبابية صغيرة، ومع تزايد التحديات، كبرت رؤيتنا لتشمل مشاريع شاملة في مجالات الإطعام، الإيواء، والتمكين. نحن نؤمن بأن كل فرد يمتلك طاقة للتغيير، وأن بتكاتفنا نحدث أثراً يمتد لأجيال تحت شعار 'نُطعِم . نُسكِن . نُمكِّن'.",
                'description_en' => "Mujaddidun Charity Development Association was established in Jordan in 2009 and is registered with the Ministry of Social Development under No. (1924). We started with small youth initiatives, and as challenges grew, our vision expanded to include comprehensive projects in feeding, housing, and empowerment. We believe that every individual has the power to create change, and together we make an impact that spans generations under the motto 'We Feed . We Shelter . We Empower'.",
                'image_path' => null,
                'is_active' => true,
            ],
            'vision_mission' => [
                'vision_ar' => 'مجتمع أردني متماسك، واعٍ، ومبادر، يشارك أفراده في التنمية المستدامة وصناعة الأثر الإيجابي.',
                'vision_en' => 'A cohesive, aware, and proactive Jordanian society whose members participate in sustainable development and in creating positive impact.',
                'mission_ar' => 'تمكين الأفراد والمجتمعات عبر برامج تنموية وإنسانية مستدامة، وتعزيز ثقافة التطوع والمبادرة لخدمة المجتمع الأردني.',
                'mission_en' => 'Empowering individuals and communities through sustainable developmental and humanitarian programs, and promoting a culture of volunteering and initiative in service of Jordanian society.',
                'is_active' => true,
            ],
            'footer' => [
                'description_ar' => 'جمعية مجددون الخيرية التنموية - الأردن',
                'description_en' => 'Mujaddidun Charity Development Association - Jordan',
                'copyright_ar' => '© {year} جمعية مجددون. جميع الحقوق محفوظة.',
                'copyright_en' => '© {year} Mujaddidun Association. All rights reserved.',
            ],
        ];
    }

    /** Raw stored section (defaults merged under stored values). */
    public function section(string $section): array
    {
        $stored = WebsiteSetting::where('setting_key', "content.{$section}")->value('value_json') ?? [];

        return array_replace(self::defaults()[$section], $stored);
    }

    /** Full admin payload: all sections + repeatable content + ordering. */
    public function all(): array
    {
        $out = ['sections' => []];
        foreach (self::SECTIONS as $section) {
            $out['sections'][$section] = $this->present($section, $this->section($section));
        }

        $out['statistics'] = SiteStatistic::orderBy('display_order')->orderBy('id')->get()->toArray();
        $out['ctas'] = SiteCtaSection::orderBy('display_order')->orderBy('id')->get()
            ->map(fn (SiteCtaSection $cta) => $this->presentCta($cta))->all();
        $out['homepage_sections'] = HomepageSection::orderBy('display_order')->orderBy('id')
            ->get(['id', 'section_key', 'is_visible', 'display_order'])->toArray();

        return $out;
    }

    /**
     * Sanitized payload for the public website: inactive singleton
     * sections are flagged, inactive rows are excluded, everything is
     * returned in display order.
     */
    public function publicContent(): array
    {
        $out = ['sections' => []];
        foreach (self::SECTIONS as $section) {
            $values = $this->section($section);

            // Deactivated singleton sections must not leak their content
            // (text or image URLs) publicly — only the flag is exposed.
            if (array_key_exists('is_active', $values) && ! $values['is_active']) {
                $out['sections'][$section] = ['is_active' => false];
                continue;
            }

            $out['sections'][$section] = $this->present($section, $values);
        }

        $out['statistics'] = SiteStatistic::where('is_active', true)
            ->orderBy('display_order')->orderBy('id')
            ->get(['id', 'number', 'label_ar', 'label_en', 'icon'])->toArray();
        $out['ctas'] = SiteCtaSection::where('is_active', true)
            ->orderBy('display_order')->orderBy('id')->get()
            ->map(fn (SiteCtaSection $cta) => $this->presentCta($cta))->all();
        $out['homepage_sections'] = HomepageSection::orderBy('display_order')->orderBy('id')
            ->get(['section_key', 'is_visible', 'display_order'])->toArray();

        return $out;
    }

    /**
     * Persists a singleton section (same contract as SettingsService).
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
            ['setting_key' => "content.{$section}"],
            [
                'setting_group' => "content_{$section}",
                'value_json' => $next,
                'value_type' => 'json',
                'is_public' => true,
                'description' => "Website content: {$section}",
                'updated_by' => $userId,
            ],
        );

        return $this->present($section, $next);
    }

    /** Stores a CTA image and returns its path. */
    public function storeCtaImage(UploadedFile $file): string
    {
        return $file->store(self::UPLOAD_DIR, 'public');
    }

    public function deleteFile(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
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

    public function presentCta(SiteCtaSection $cta): array
    {
        $data = $cta->only(['id', 'title_ar', 'title_en', 'description_ar', 'description_en', 'button_text_ar', 'button_text_en', 'button_url', 'display_order', 'is_active']);
        $data['image_url'] = $cta->image_path ? '/api/v1/files/'.$cta->image_path : null;

        return $data;
    }
}
