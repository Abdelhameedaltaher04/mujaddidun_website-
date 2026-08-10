import { useEffect } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** Direction of the content being edited (not the UI locale). */
  dir: 'rtl' | 'ltr';
  placeholder?: string;
  testId?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const { t } = useLocale();

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(t('admin.news.editor.linkPrompt'), previous ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        label={t('admin.news.editor.bold')}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        label={t('admin.news.editor.italic')}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={editor.isActive('heading', { level: 2 })}
        label={t('admin.news.editor.heading2')}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        active={editor.isActive('heading', { level: 3 })}
        label={t('admin.news.editor.heading3')}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        label={t('admin.news.editor.bulletList')}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        label={t('admin.news.editor.orderedList')}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        label={t('admin.news.editor.quote')}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton
        onClick={setLink}
        active={editor.isActive('link')}
        label={t('admin.news.editor.link')}
      >
        <Link2 className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        label={t('admin.news.editor.alignRight')}
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        label={t('admin.news.editor.alignCenter')}
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        label={t('admin.news.editor.alignLeft')}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        label={t('admin.news.editor.undo')}
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        label={t('admin.news.editor.redo')}
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

/**
 * Tiptap-based rich text editor producing clean HTML — the same HTML the
 * Laravel API will store and the public site will render.
 */
export function RichTextEditor({
  value,
  onChange,
  dir,
  testId,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {
        dir,
        class: cn(
          'prose prose-sm max-w-none min-h-48 px-4 py-3 focus:outline-none',
          'prose-headings:text-foreground prose-p:text-foreground/90',
        ),
      },
    },
  });

  /** Keep the editor in sync when a different article loads. */
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className="overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring"
      data-testid={testId}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
