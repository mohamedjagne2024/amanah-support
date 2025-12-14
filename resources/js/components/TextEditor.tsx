import { Editor } from '@tinymce/tinymce-react';

interface TextEditorProps {
  placeholder?: string;
  onChange?: (content: string) => void;
  showToolbar?: boolean;
  className?: string;
  initialValue?: string;
}

export default function TextEditor({
  placeholder = 'Enter some text...',
  onChange,
  showToolbar = true,
  className = '',
  initialValue = '',
}: TextEditorProps) {
  const handleEditorChange = (content: string, editor: any) => {
    if (onChange) {
      onChange(content);
    }
  };

  return (
    <div className={className}>
      <Editor
        apiKey='ba9dk9kk4lidr4vbqipwnayl47dd1prfy9y6xqgc21svgcgu'
        init={{
          height: 300,
          menubar: false,
          plugins: showToolbar
            ? 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount'
            : 'visualblocks',
          toolbar: showToolbar
            ? 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat'
            : false,
          placeholder: placeholder,
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; }',
          branding: false,
          promotion: false,
        }}
        initialValue={initialValue}
        onEditorChange={handleEditorChange}
      />
    </div>
  );
}
