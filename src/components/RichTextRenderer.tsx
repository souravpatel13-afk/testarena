import React from 'react';

interface RichTextProps {
  content?: string | null;
  className?: string;
  as?: 'div' | 'span' | 'p' | 'h3';
}

/**
 * RichTextRenderer seamlessly renders both HTML (with <br>, <b>, <p>, tables, etc.)
 * and plain text (with \n newlines), ensuring that line breaks and styling
 * display correctly everywhere in the UI without breaking or escaping.
 */
export const RichTextRenderer: React.FC<RichTextProps> = ({
  content,
  className = '',
  as = 'div',
}) => {
  if (!content) return null;

  let text = String(content);

  // If content contains escaped HTML tags like &lt;br&gt; or &lt;b&gt;, decode them safely
  if (text.includes('&lt;') && /&lt;\/?(?:br|p|b|i|u|strong|em|span|div|table|tr|td|th|tbody|thead|ul|ol|li)\b/i.test(text)) {
    text = text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  }

  // Check if string contains HTML tags like <br>, <p>, <b>, <span>, <strong>, <div>, etc.
  const hasHtml = /<\/?(?:br|p|b|i|u|strong|em|span|div|table|tr|td|th|tbody|thead|ul|ol|li|sub|sup|mark|small|hr)\b[^>]*>/i.test(text);

  const Component = as as any;

  if (hasHtml) {
    return (
      <Component
        className={`rich-html-content ${className}`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  // Plain text fallback with newline support
  return (
    <Component className={`whitespace-pre-line leading-relaxed ${className}`}>
      {text}
    </Component>
  );
};

export default RichTextRenderer;
