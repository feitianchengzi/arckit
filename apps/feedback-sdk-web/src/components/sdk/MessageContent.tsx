import ReactMarkdown from 'react-markdown'

export function MessageContent({ content, markdown }: { content: string; markdown: boolean }) {
  if (!markdown) return <p className="whitespace-pre-wrap">{content}</p>
  return <div className="sdk-message-markdown"><ReactMarkdown
    skipHtml
    components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}
  >{content}</ReactMarkdown></div>
}
