/**
 * 任务内容详情弹窗组件
 * 用于显示任务的完整内容（支持Markdown）
 */

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Dialog } from '@/components/ui'

export interface TaskContentDialogProps {
  open: boolean
  onClose: () => void
  content: string
  title?: string
}

export function TaskContentDialog({
  open,
  onClose,
  content,
  title = '任务详情',
}: TaskContentDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="lg"
    >
      <div 
        className="prose prose-sm max-w-none overflow-y-auto max-h-[70vh]"
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        <ReactMarkdown
          components={{
            // 自定义样式组件
            p: ({ children }: { children?: React.ReactNode }) => (
              <p className="text-foreground mb-3 last:mb-0">{children}</p>
            ),
            h1: ({ children }: { children?: React.ReactNode }) => (
              <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0">{children}</h1>
            ),
            h2: ({ children }: { children?: React.ReactNode }) => (
              <h2 className="text-lg font-bold text-foreground mb-2 mt-4 first:mt-0">{children}</h2>
            ),
            h3: ({ children }: { children?: React.ReactNode }) => (
              <h3 className="text-base font-bold text-foreground mb-2 mt-3 first:mt-0">{children}</h3>
            ),
            code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
              inline ? (
                <code className="bg-surface-active text-foreground px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <code className="block bg-surface-active text-foreground p-3 rounded text-sm font-mono overflow-x-auto mb-3">
                  {children}
                </code>
              ),
            pre: ({ children }: { children?: React.ReactNode }) => (
              <pre className="bg-surface-active text-foreground p-3 rounded text-sm font-mono overflow-x-auto mb-3">
                {children}
              </pre>
            ),
            ul: ({ children }: { children?: React.ReactNode }) => (
              <ul className="list-disc list-inside mb-3 space-y-1 text-foreground">{children}</ul>
            ),
            ol: ({ children }: { children?: React.ReactNode }) => (
              <ol className="list-decimal list-inside mb-3 space-y-1 text-foreground">{children}</ol>
            ),
            li: ({ children }: { children?: React.ReactNode }) => (
              <li className="text-foreground">{children}</li>
            ),
            blockquote: ({ children }: { children?: React.ReactNode }) => (
              <blockquote className="border-l-4 border-border pl-4 italic text-foreground mb-3">
                {children}
              </blockquote>
            ),
            a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
              <a
                href={href}
                className="text-blue-600 hover:text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            strong: ({ children }: { children?: React.ReactNode }) => (
              <strong className="font-bold text-foreground">{children}</strong>
            ),
            em: ({ children }: { children?: React.ReactNode }) => (
              <em className="italic text-foreground">{children}</em>
            ),
            hr: () => <hr className="border-border my-4" />,
            table: ({ children }: { children?: React.ReactNode }) => (
              <div className="overflow-x-auto mb-3">
                <table className="min-w-full border-collapse border border-border">{children}</table>
              </div>
            ),
            th: ({ children }: { children?: React.ReactNode }) => (
              <th className="border border-border px-3 py-2 bg-surface-active text-foreground font-semibold text-left">
                {children}
              </th>
            ),
            td: ({ children }: { children?: React.ReactNode }) => (
              <td className="border border-border px-3 py-2 text-foreground">{children}</td>
            ),
          }}
        >
          {content || '无内容'}
        </ReactMarkdown>
      </div>
    </Dialog>
  )
}
