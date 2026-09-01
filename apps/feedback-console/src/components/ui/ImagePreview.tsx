import { Fragment, useEffect, useState } from 'react'
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react'

export interface ImageItem {
  url: string
  key?: string
}

export interface ImagePreviewProps {
  open: boolean
  onClose: () => void
  images: ImageItem[]
  currentIndex?: number
  onIndexChange?: (index: number) => void
}

export function ImagePreview({
  open,
  onClose,
  images,
  currentIndex = 0,
  onIndexChange,
}: ImagePreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex)

  useEffect(() => {
    setCurrentImageIndex(currentIndex)
  }, [currentIndex])

  const handlePrevious = () => {
    const newIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
    setCurrentImageIndex(newIndex)
    onIndexChange?.(newIndex)
  }

  const handleNext = () => {
    const newIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
    setCurrentImageIndex(newIndex)
    onIndexChange?.(newIndex)
  }

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, currentImageIndex, images.length])

  const currentImage = images[currentImageIndex]
  const hasMultipleImages = images.length > 1

  return (
    <Transition appear show={open} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/90" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel className="relative w-full h-full flex items-center justify-center">
                <button
                  type="button"
                  className="fixed top-4 right-4 z-50 p-2 text-white/80 hover:text-white transition-colors bg-black/30 hover:bg-black/50 rounded-full"
                  onClick={onClose}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      className="absolute left-4 z-10 p-2 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={handlePrevious}
                      disabled={!hasMultipleImages}
                    >
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="absolute right-4 z-10 p-2 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={handleNext}
                      disabled={!hasMultipleImages}
                    >
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                <img
                  src={currentImage?.url}
                  alt="预览图片"
                  className="max-w-[90vw] max-h-[90vh] object-contain"
                />

                {hasMultipleImages && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  )
}
