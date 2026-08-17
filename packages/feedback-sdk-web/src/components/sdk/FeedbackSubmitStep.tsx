import { ChangeEvent, useRef } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  value: string
  imageName: string
  disabled?: boolean
  submitError?: string
  uploadError?: string
  uploading?: boolean
  uploadProgress?: number
  uploadedFileKey?: string
  pickerWarning?: string
  onChange: (value: string) => void
  onUpload: (file: File | null) => void
  onPickerStarted?: (mode: 'web' | 'native') => void
  onRequestNativeImage?: () => boolean
  onNext: () => void
}

export function FeedbackSubmitStep({
  value,
  imageName,
  disabled = false,
  submitError,
  uploadError,
  uploading = false,
  uploadProgress = 0,
  uploadedFileKey,
  pickerWarning,
  onChange,
  onUpload,
  onPickerStarted,
  onRequestNativeImage,
  onNext,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    onUpload(file || null)
    event.target.value = ''
  }

  const handlePickFile = () => {
    if (disabled || uploading) return

    if (onRequestNativeImage?.()) {
      onPickerStarted?.('native')
      return
    }

    onPickerStarted?.('web')
    inputRef.current?.click()
  }

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Feedback SDK</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">反馈建议</h2>
        <p className="mt-1 text-sm text-foreground-secondary">请描述你遇到的问题或希望新增的能力，我们会尽快处理并同步进展。</p>
      </header>

      <div className="space-y-2">
        <label htmlFor="feedback-content" className="text-sm font-semibold text-foreground">
          反馈内容
        </label>
        <textarea
          id="feedback-content"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="示例：搜索历史记录时要等待 5-10 秒，想要像 Google 一样快速返回结果..."
          rows={6}
          disabled={disabled}
          className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-foreground placeholder:text-foreground-tertiary focus:border-primary focus:outline-none"
        />
        <p className="text-right text-xs text-foreground-tertiary">{value.length}/500</p>
      </div>

      <label className="block rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-foreground-secondary transition-colors hover:border-border-hover">
        <span className="block text-sm font-semibold text-foreground">可选：上传截图</span>
        <span className="mt-1 block text-xs text-foreground-tertiary">用于帮助定位问题，支持 png / jpg / webp</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={disabled}
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground-secondary">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={handlePickFile}
            className="rounded-full bg-surface-elevated px-3 py-1.5 font-semibold text-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            选取文件
          </button>
          <span>{imageName || '未选择文件'}</span>
        </div>
      </label>

      {imageName ? (
        <div className="rounded-lg bg-surface px-3 py-2 text-xs text-foreground-secondary">
          已选择图片：{imageName}
        </div>
      ) : null}

      {pickerWarning ? <div className="rounded-lg bg-warning-light px-3 py-2 text-xs text-warning">{pickerWarning}</div> : null}

      {uploading ? (
        <div className="rounded-lg bg-primary-lighter px-3 py-2 text-xs text-primary">
          图片上传中：{Math.round(uploadProgress * 100)}%
        </div>
      ) : null}

      {!uploading && uploadedFileKey ? (
        <div className="rounded-lg bg-success-light px-3 py-2 text-xs text-success">图片上传完成</div>
      ) : null}

      {uploadError ? <div className="rounded-lg bg-error-light px-3 py-2 text-xs text-error">{uploadError}</div> : null}

      {submitError ? <div className="rounded-lg bg-error-light px-3 py-2 text-xs text-error">{submitError}</div> : null}

      <Button fullWidth disabled={disabled || uploading} onClick={onNext}>
        提交反馈
      </Button>
    </section>
  )
}
