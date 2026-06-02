---
name: arckit-swiftui-media-pipeline
description: SwiftUI 图片、音频、视频媒体管线 skill。用于远程图片加载、缓存、占位、失败、重试、fallback URL、图片查看器、双指缩放、以触点为中心缩放、上传前压缩、头像上传、分享封面、Widget 图片、基础音频/视频播放。用户提到图片加载失败、图片重试、缓存、头像、上传、缩放、查看大图、封面、音频播放、视频播放、媒体资源时使用。
---

# ArcKit SwiftUI Media Pipeline

## 目标

把图片、封面、头像、上传、查看器、Widget/分享媒体做成稳定管线。Agent 执行时不要只把图片显示出来，而要处理加载状态、失败重试、缓存、fallback、内存、上传前处理和手势边界。

## 执行流程

1. 先分类媒体场景：列表缩略图、详情大图、头像、上传、分享封面、Widget 图片、图片查看器、基础音频/视频。
2. 查找项目是否已有统一图片组件、缓存、上传 payload、查看器；已有时优先修补统一入口。
3. 定义媒体状态：无资源、loading、success、failure、fallback success、retrying。
4. 建立或复用缓存策略：内存、URLCache/磁盘、App Group 文件缓存；分享/Widget 优先读取可访问缓存。
5. 对远程图片补 fallback URL、失败占位、用户重试或自动重试边界。
6. 对上传补格式识别、方向处理、尺寸限制、大小限制、压缩质量回退，输出稳定 payload。
7. 对图片查看器处理缩放、平移、最小/最大比例、触点/双指中心锚点、缩放态和翻页/滚动互斥。
8. 检查滚动列表、大图解码和内存峰值；必要时配合 performance skill。

## 读取资源

- 图片加载、缓存、失败/重试、fallback、上传压缩、Widget/分享封面：`references/media-pipeline-rules.md`
- 缩放、翻页、拖拽互斥：`arckit-swiftui-interaction-motion`
- 上传接口和网络错误：`arckit-swiftui-networking-api`
- 相册、ShareSheet、Widget/App Group：`arckit-swiftui-system-integration`
- 图片内存和列表滚动：`arckit-swiftui-performance-quality`

## 核心规则

| 场景 | 执行要求 |
| --- | --- |
| 远程图片 | 不散落 `AsyncImage`，优先统一组件 |
| 加载失败 | 有占位、fallback 或重试，不长期空白 |
| 上传 | 网络层只接收 `Data/URL/fileName/mimeType` |
| 分享/Widget | 图片路径必须目标进程可访问 |
| 查看大图 | 缩放以触点/双指中心为锚点 |
| 滚动列表 | 控制解码、尺寸、缓存和并发 |

## 最低交付标准

- 媒体状态覆盖 loading/success/failure/retry/empty。
- 图片失败可解释、可恢复，或有合理 fallback。
- 缓存策略服务列表、详情、分享、Widget 中至少一个真实场景。
- 上传前处理尺寸、格式、大小，且不让 UI 类型进入网络层。
- 图片查看器缩放、平移、翻页互斥路径明确。

## 降级/停止条件

- 静态 asset、图标、小装饰图不建立媒体管线。
- 已有统一媒体组件的小样式调整，只改组件内相关参数。
- 复杂音频引擎、录音、低延迟播放多次出现后再拆专门音频 skill；本 skill 只覆盖基础播放。
