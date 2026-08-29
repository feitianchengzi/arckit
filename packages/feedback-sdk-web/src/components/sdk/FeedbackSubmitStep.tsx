import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

export interface FeedbackSubmitImage {
  id: string
  name: string
  previewUrl: string
  status: 'uploading' | 'uploaded' | 'error'
  progress: number
  error?: string
}

interface Props {
  value: string
  images: FeedbackSubmitImage[]
  maxImages: number
  disabled?: boolean
  submitError?: string
  uploadError?: string
  uploading?: boolean
  pickerWarning?: string
  onChange: (value: string) => void
  onUpload: (files: File[]) => void
  onRemoveImage: (imageID: string) => void
  onRetryImage: (imageID: string) => void
  onPickerStarted?: (mode: 'web' | 'native') => void
  onRequestNativeImage?: () => boolean
  onNext: () => void
}

export function FeedbackSubmitStep({
  value,
  images,
  maxImages,
  disabled = false,
  submitError,
  uploadError,
  uploading = false,
  pickerWarning,
  onChange,
  onUpload,
  onRemoveImage,
  onRetryImage,
  onPickerStarted,
  onRequestNativeImage,
  onNext,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewImageID, setPreviewImageID] = useState('')
  const previewImage = images.find((image) => image.id === previewImageID)
  const uploadedCount = images.filter((image) => image.status === 'uploaded').length
  const uploadingImages = images.filter((image) => image.status === 'uploading')
  const averageProgress = uploadingImages.length
    ? uploadingImages.reduce((sum, image) => sum + image.progress, 0) / uploadingImages.length
    : 0

  useEffect(() => {
    if (previewImageID && !previewImage) setPreviewImageID('')
  }, [previewImage, previewImageID])

  useEffect(() => {
    if (!previewImage) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewImageID('')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewImage])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onUpload(Array.from(event.target.files || []))
    event.target.value = ''
  }

  const handlePickFile = () => {
    if (disabled || uploading || images.length >= maxImages) return

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

      <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-foreground-secondary transition-colors hover:border-border-hover">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="block text-sm font-semibold text-foreground">可选：上传截图</span>
            <span className="mt-1 block text-xs text-foreground-tertiary">支持 png / jpg / webp / gif，单张 10MB、总计 20MB</span>
          </div>
          <span className="shrink-0 rounded-full bg-surface-elevated px-2 py-1 text-xs font-semibold text-foreground-secondary">
            {images.length}/{maxImages}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={maxImages > 1}
          disabled={disabled}
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground-secondary">
          <button
            type="button"
            disabled={disabled || uploading || images.length >= maxImages}
            onClick={handlePickFile}
            className="rounded-full bg-surface-elevated px-3 py-1.5 font-semibold text-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {images.length ? '继续添加' : '选择图片'}
          </button>
          <span>{images.length ? `已选择 ${images.length} 张，最多 ${maxImages} 张` : `最多选择 ${maxImages} 张图片`}</span>
        </div>
        {images.length ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {images.map((image) => (
              <div key={image.id} className="min-w-0">
                <div className="group relative aspect-square overflow-hidden rounded-xl border border-divider bg-surface-elevated shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPreviewImageID(image.id)}
                    className="block h-full w-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40"
                    aria-label={`查看大图：${image.name}`}
                  >
                    <img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(image.id)}
                    disabled={disabled}
                    className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/65 text-base leading-none text-white shadow-md hover:bg-black/80 disabled:opacity-50"
                    aria-label={`移除图片：${image.name}`}
                    title="移除图片"
                  >
                    ×
                  </button>
                  {image.status === 'uploading' ? (
                    <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1.5 text-center text-[11px] font-semibold text-white">
                      上传 {Math.round(image.progress * 100)}%
                    </div>
                  ) : image.status === 'error' ? (
                    <div className="absolute inset-x-0 bottom-0 bg-error/90 px-2 py-1.5 text-center text-[11px] font-semibold text-white">上传失败</div>
                  ) : (
                    <div className="absolute bottom-1.5 left-1.5 rounded-full bg-success/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">完成</div>
                  )}
                </div>
                <p className="mt-1 truncate text-[11px] text-foreground-tertiary" title={image.name}>{image.name}</p>
                {image.status === 'error' ? (
                  <button type="button" onClick={() => onRetryImage(image.id)} disabled={disabled || uploading} className="mt-0.5 text-[11px] font-semibold text-error hover:underline disabled:opacity-50">
                    重试上传
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {pickerWarning ? <div className="rounded-lg bg-warning-light px-3 py-2 text-xs text-warning">{pickerWarning}</div> : null}

      {uploading ? (
        <div className="rounded-lg bg-primary-lighter px-3 py-2 text-xs text-primary">
          正在上传 {uploadingImages.length} 张图片：{Math.round(averageProgress * 100)}%
        </div>
      ) : null}

      {!uploading && uploadedCount > 0 && uploadedCount === images.length ? (
        <div className="rounded-lg bg-success-light px-3 py-2 text-xs text-success">{uploadedCount} 张图片上传完成</div>
      ) : null}

      {uploadError ? <div className="rounded-lg bg-error-light px-3 py-2 text-xs text-error">{uploadError}</div> : null}

      {submitError ? <div className="rounded-lg bg-error-light px-3 py-2 text-xs text-error">{submitError}</div> : null}

      <Button fullWidth disabled={disabled || uploading} onClick={onNext}>
        提交反馈
      </Button>

      {previewImage ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={`${previewImage.name}大图预览`}
          onClick={() => setPreviewImageID('')}
        >
          <div className="relative flex max-h-[92dvh] max-w-[94vw] flex-col items-center" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImageID('')}
              className="absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/65 text-2xl leading-none text-white shadow-lg transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-label="关闭图片预览"
              title="关闭图片预览"
            >
              ×
            </button>
            <img
              src={previewImage.previewUrl}
              alt={previewImage.name}
              className="max-h-[84dvh] max-w-[90vw] rounded-xl bg-black/20 object-contain shadow-2xl"
            />
            <p className="mt-3 max-w-[90vw] truncate text-sm font-medium text-white/90">{previewImage.name}</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
