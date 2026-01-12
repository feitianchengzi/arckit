'use client'

/**
 * 图片裁切对话框
 * 用于上传前裁切头像
 */

import { useState, useRef, useEffect } from 'react'
import { Dialog } from './Dialog'
import { Button } from './Button'

interface ImageCropDialogProps {
  open: boolean
  onClose: () => void
  imageSrc: string
  onCropComplete: (croppedImage: string) => void
  aspectRatio?: number
  outputSize?: number
}

export function ImageCropDialog({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1, // 1:1 默认正方形
  outputSize = 200, // 输出尺寸（像素）
}: ImageCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [imageLoaded, setImageLoaded] = useState(false)

  // 加载图片
  useEffect(() => {
    if (!imageSrc || !open) return

    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
      
      // 初始化裁切区域（居中）
      const canvas = canvasRef.current
      if (canvas) {
        const containerWidth = canvas.width
        const containerHeight = canvas.height
        
        // 计算初始裁切大小（占容器的 80%）
        const initialSize = Math.min(containerWidth, containerHeight) * 0.8
        
        setCrop({
          x: (containerWidth - initialSize) / 2,
          y: (containerHeight - initialSize) / 2,
          width: initialSize,
          height: initialSize / aspectRatio,
        })
        
        // 计算缩放比例以适应容器
        const scaleX = containerWidth / img.width
        const scaleY = containerHeight / img.height
        setScale(Math.min(scaleX, scaleY) * 0.9)
      }
      
      drawCanvas()
    }
    img.src = imageSrc
  }, [imageSrc, open, aspectRatio])

  // 绘制 Canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空 canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制图片（缩放并居中）
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale
    const offsetX = (canvas.width - scaledWidth) / 2
    const offsetY = (canvas.height - scaledHeight) / 2

    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)

    // 绘制遮罩层
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 清空裁切区域（显示原图）
    ctx.clearRect(crop.x, crop.y, crop.width, crop.height)
    ctx.drawImage(
      img,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    )

    // 绘制裁切区域边框
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height)

    // 绘制九宫格辅助线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    
    // 垂直线
    ctx.beginPath()
    ctx.moveTo(crop.x + crop.width / 3, crop.y)
    ctx.lineTo(crop.x + crop.width / 3, crop.y + crop.height)
    ctx.moveTo(crop.x + (crop.width * 2) / 3, crop.y)
    ctx.lineTo(crop.x + (crop.width * 2) / 3, crop.y + crop.height)
    
    // 水平线
    ctx.moveTo(crop.x, crop.y + crop.height / 3)
    ctx.lineTo(crop.x + crop.width, crop.y + crop.height / 3)
    ctx.moveTo(crop.x, crop.y + (crop.height * 2) / 3)
    ctx.lineTo(crop.x + crop.width, crop.y + (crop.height * 2) / 3)
    ctx.stroke()
  }

  useEffect(() => {
    drawCanvas()
  }, [crop, scale, imageLoaded])

  // 鼠标拖拽
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 检查是否点击在裁切区域内
    if (
      x >= crop.x &&
      x <= crop.x + crop.width &&
      y >= crop.y &&
      y <= crop.y + crop.height
    ) {
      setIsDragging(true)
      setDragStart({ x: x - crop.x, y: y - crop.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newX = Math.max(0, Math.min(x - dragStart.x, canvas.width - crop.width))
    const newY = Math.max(0, Math.min(y - dragStart.y, canvas.height - crop.height))

    setCrop((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 缩放
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, 0.1))
  }

  // 裁切并输出
  const handleCrop = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    // 创建输出 canvas
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = outputSize
    outputCanvas.height = outputSize / aspectRatio
    const outputCtx = outputCanvas.getContext('2d')
    if (!outputCtx) return

    // 计算裁切区域在原图中的位置
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale
    const offsetX = (canvas.width - scaledWidth) / 2
    const offsetY = (canvas.height - scaledHeight) / 2

    // 裁切区域对应原图的坐标
    const sourceX = (crop.x - offsetX) / scale
    const sourceY = (crop.y - offsetY) / scale
    const sourceWidth = crop.width / scale
    const sourceHeight = crop.height / scale

    // 绘制裁切后的图片
    outputCtx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputCanvas.width,
      outputCanvas.height
    )

    // 转换为 base64
    const croppedImage = outputCanvas.toDataURL('image/jpeg', 0.9)
    onCropComplete(croppedImage)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="裁切头像" maxWidth="lg" showCloseButton={false}>
      <div className="space-y-4">
        {/* Canvas 预览区域 */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="w-full border border-gray-300 rounded-lg cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">缩放:</span>
            <Button type="button" size="sm" variant="secondary" onClick={handleZoomOut}>
              -
            </Button>
            <span className="text-sm text-gray-700 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button type="button" size="sm" variant="secondary" onClick={handleZoomIn}>
              +
            </Button>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button type="button" variant="primary" onClick={handleCrop}>
              确认裁切
            </Button>
          </div>
        </div>

        {/* 使用提示 */}
        <p className="text-xs text-gray-500 text-center">
          拖动蓝色方框调整裁切区域，使用 +/- 按钮缩放图片
        </p>
      </div>
    </Dialog>
  )
}

