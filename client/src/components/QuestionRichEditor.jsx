import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

const toolbarBtn =
  'inline-flex h-8 min-w-[2rem] items-center justify-center rounded border border-transparent px-2 text-sm font-semibold text-gray-700 hover:bg-gray-200/80 data-[active=true]:border-[#673ab7]/40 data-[active=true]:bg-[#ede7f6] data-[active=true]:text-[#5e35b1]';

export default function QuestionRichEditor({ value, onChange, disabled = false, id }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        code: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: value || '<p></p>',
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[88px] px-3 py-2 text-sm text-gray-900',
        ...(id ? { id } : {}),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor || value === undefined) return;
    const cur = editor.getHTML();
    if (value !== cur) {
      editor.commands.setContent(value && value.trim() ? value : '<p></p>', false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="question-rich-editor rounded-lg border border-gray-200 bg-gray-50 px-3 py-8 text-center text-sm text-gray-500">
        Đang tải trình soạn thảo…
      </div>
    );
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href || 'https://';
    const url = window.prompt('Đường dẫn liên kết', prev);
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const clearFormat = () => {
    editor.chain().focus().unsetAllMarks().run();
  };

  return (
    <div className="question-rich-editor overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm focus-within:border-[#673ab7] focus-within:ring-2 focus-within:ring-[#673ab7]/20">
      <div
        className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-1.5 py-1"
        role="toolbar"
        aria-label="Định dạng câu hỏi"
      >
        <button
          type="button"
          className={toolbarBtn}
          data-active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="In đậm"
          title="In đậm"
        >
          B
        </button>
        <button
          type="button"
          className={`${toolbarBtn} italic`}
          data-active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="In nghiêng"
          title="In nghiêng"
        >
          I
        </button>
        <button
          type="button"
          className={`${toolbarBtn} underline`}
          data-active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Gạch chân"
          title="Gạch chân"
        >
          U
        </button>
        <button
          type="button"
          className={toolbarBtn}
          data-active={editor.isActive('link')}
          onClick={setLink}
          aria-label="Chèn liên kết"
          title="Liên kết"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={clearFormat}
          aria-label="Xóa định dạng"
          title="Xóa định dạng"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
