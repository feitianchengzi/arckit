# 头像上传（STS + OSS Browser SDK）

### 适用文件
- `frontend/src/lib/api/endpoints/upload.ts`（STS 获取与字段映射）
- `frontend/src/lib/utils/ossUpload.ts`（OSS SDK 加载、client、上传）
- `frontend/src/components/ui/AvatarCropUpload.tsx` / `frontend/src/components/ui/AvatarUpload.tsx`（头像入口）
- `frontend/OSS_CORS_CONFIG.md`（CORS 排查）

### 后端 STS 响应（必须字段，snake_case）
```json
{"access_key_id":"STS.xxx","access_key_secret":"xxx","security_token":"xxx","expiration":"2026-01-23T12:34:56Z","bucket_name":"bkt","region":"oss-cn-beijing","root_path":"tenant/env","authorization_v4":true,"secure":true}
```

### 只保留最核心的修改点（必须做）
- **对象 Key**：对象 Key 必须由 `root_path` 决定根目录，头像业务固定拼 `avatars/` 子目录（测试用 `workshop/` 仅示例）。
- **Region**：`region` 直接使用接口返回值（应为完整 `oss-cn-beijing`），禁止 `'oss-' + region` / 从 endpoint 解析等二次拼接。
- **签名/HTTPS**：`authorization_v4`、`secure` 必须使用接口返回值，禁止前端写死。
- **URL **：禁止手拼 `https://{bucket}.{region}.aliyuncs.com/{key}`；用 SDK 传输不需要明文url。
- **STS 自动刷新**：刷新时间必须按接口 `expiration` 计算（`expiration - safetyWindow`），禁止写死“55 分钟/每小时”。
- **SDK 版本**：OSS Browser SDK 统一到 `aliyun-oss-sdk-6.23.0.min.js`（与测试基线一致）。

### 关键代码演示（对齐本页 STS 结构 + 测试代码写法）
```ts
type GetOSSTempCredentialsResponse = {
  access_key_id: string
  access_key_secret: string
  security_token: string
  expiration: string
  bucket_name: string
  region: string            // 例：oss-cn-beijing（已拼好，直接用）
  root_path: string         // 例：tenant/env
  authorization_v4: boolean
  secure: boolean
}

function joinPath(a: string, b: string) {
  const left = (a || '').replace(/\/+$/g, '')
  const right = (b || '').replace(/^\/+/, '')
  return left ? `${left}/${right}` : right
}

async function uploadAvatarToOSS(file: File, sts: GetOSSTempCredentialsResponse) {
  const OSS = (window as any).OSS
  if (!OSS) throw new Error('OSS SDK not loaded')

  const client = new OSS({
    region: sts.region,
    authorizationV4: sts.authorization_v4,
    secure: sts.secure,
    accessKeyId: sts.access_key_id,
    accessKeySecret: sts.access_key_secret,
    stsToken: sts.security_token,
    bucket: sts.bucket_name,
  })

  // objectKey = root_path + avatars/（替代测试的 workshop/）
  const objectKey = joinPath(sts.root_path, `avatars/${Date.now()}_${file.name}`)

  const result = await client.put(objectKey, file)
  if (result?.res?.status !== 200) throw new Error(`OSS upload failed: ${result?.res?.status}`)

  // 传输不需要“明文 URL 拼接”；需要展示/访问时由 SDK 或后端策略决定
  return { objectKey }
}
```
 <!-- 引入阿里云OSS SDK (最新版本 6.23.0) -->
  <script src="https://gosspublic.alicdn.com/aliyun-oss-sdk-6.23.0.min.js"></script>


获取图片，获取后需要自己缓存，会过期
```
const url = client.signatureUrl("workshop/sss.jpg", {
  // 如果需要应用图片样式，可取消注释以下行
  // process: "style/imagestyle",
});
```