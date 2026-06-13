import type { ReactNode } from 'react';

// Lightweight rich-text renderer used by both the user-facing support chat
// widget and the admin transcript viewer. Handles headings (#), bold (**),
// italic (*), bullets (• / - / *), absolute URLs, and in-app /paths. Links
// render orange and open in a new tab when external; bold renders navy.
// Kept dependency-free so it can be used inside any chat bubble.
export function renderRichText(content: string): ReactNode {
  const normalised = content
    .replace(/\r\n/g, '\n')
    .replace(/[•◦▪]/g, '•');

  const lines = normalised.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      return (
        <p key={i} className="font-bold text-[#1e3a8a] uppercase tracking-wide text-[11px] mt-2 mb-1">
          {renderInline(headingMatch[2])}
        </p>
      );
    }
    const bulletMatch = trimmed.match(/^[•\-*]\s+(.*)$/);
    if (bulletMatch) {
      return (
        <div key={i} className="flex gap-1.5 my-0.5">
          <span className="text-[#f97316] font-bold flex-shrink-0">•</span>
          <span>{renderInline(bulletMatch[1])}</span>
        </div>
      );
    }
    if (trimmed === '') return <div key={i} className="h-2" />;
    return (
      <p key={i} className="my-0.5">
        {renderInline(line)}
      </p>
    );
  });
}

function renderInline(text: string): ReactNode {
  const tokens: Array<{ type: 'text' | 'bold' | 'italic' | 'link'; value: string }> = [];
  const re = /(\*\*([^*\n]+?)\*\*|__([^_\n]+?)__|\*([^*\n]+?)\*|_([^_\n]+?)_|https?:\/\/[^\s)]+|\/[a-zA-Z0-9_\-/?=&%.]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ type: 'text', value: text.slice(last, m.index) });
    const full = m[0];
    if (full.startsWith('**') || full.startsWith('__')) {
      tokens.push({ type: 'bold', value: m[2] || m[3] || '' });
    } else if (full.startsWith('*') || full.startsWith('_')) {
      tokens.push({ type: 'italic', value: m[4] || m[5] || '' });
    } else {
      // Strip trailing sentence punctuation off the URL — periods, commas,
      // semicolons, etc. at the very end of a URL are almost always sentence
      // punctuation, not part of the link. Letting them stick to the href
      // sends users to a 404 (e.g. "/login." doesn't exist; "/login" does).
      // We push the punctuation back as a separate text token so the sentence
      // still reads correctly. Closing brackets ) ] are excluded from this
      // strip since they sometimes legitimately appear in URLs.
      let url = full;
      let trailing = '';
      while (url.length > 0 && /[.,;:!?]/.test(url[url.length - 1])) {
        trailing = url[url.length - 1] + trailing;
        url = url.slice(0, -1);
      }
      tokens.push({ type: 'link', value: url });
      if (trailing) tokens.push({ type: 'text', value: trailing });
    }
    last = m.index + full.length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });

  return tokens.map((t, i) => {
    if (t.type === 'bold') return <strong key={i} className="font-bold text-[#1e3a8a]">{t.value}</strong>;
    if (t.type === 'italic') return <em key={i}>{t.value}</em>;
    if (t.type === 'link') return (
      <a
        key={i}
        href={t.value}
        target={t.value.startsWith('http') ? '_blank' : '_self'}
        rel="noreferrer"
        className="text-[#f97316] underline font-medium break-all hover:text-[#ea580c]"
      >
        {t.value}
      </a>
    );
    return <span key={i}>{t.value}</span>;
  });
}
