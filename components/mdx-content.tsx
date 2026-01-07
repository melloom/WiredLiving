import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MDXContentProps {
  content: string;
}

export function MDXContent({ content }: MDXContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="markdown-content"
    >
      {content}
    </ReactMarkdown>
  );
}

