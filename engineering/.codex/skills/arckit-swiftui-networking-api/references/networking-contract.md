# 网络 API 契约与质量规则

## API 分层

推荐分层：

```text
View
-> Feature Service Protocol
-> Service Implementation
-> API Client
-> URLSession
```

View 不直接拼 URL，不直接处理 HTTP 状态码。

## DTO 与领域模型

DTO 反映接口结构，领域模型反映 App 内使用方式。需要显式转换：

- 字段重命名。
- 时间格式。
- 可选字段兜底。
- 后端枚举到本地枚举。
- 兼容旧字段。

不要把后端 DTO 直接扩散到所有 View。

## 错误分类

至少区分：

- cancelled。
- timeout。
- offline。
- unauthorized。
- forbidden。
- rateLimited。
- server。
- decoding。
- validation。
- business(code:)。

UI 文案可以后续映射，但底层错误必须可分类。

## 请求生命周期

每个请求明确：

- 是否可取消。
- 超时时间。
- 是否重试。
- 是否幂等。
- 是否需要鉴权。
- 是否影响计费或额度。
- 是否可并发。

## 分页状态

分页服务应返回：

- items。
- next cursor/page。
- hasMore。
- total，如接口提供。

页面状态区分：

- 首次加载。
- 刷新。
- 加载更多。
- 加载更多失败。
- 空结果。

## 鉴权与刷新

- Token 存储使用 Keychain。
- 401 后刷新 token 要防并发风暴。
- refresh 失败进入统一失效态。
- 登出要清理敏感缓存。

## 上传下载

上传输入使用 `Data` / file URL / mimeType / fileName。上传前的图片压缩归媒体管线，网络层只负责传输。

下载要明确：

- 目标位置。
- 临时文件清理。
- 是否需要进度。
- 是否需要后台下载。

## 检查清单

- 是否有统一 API client？
- DTO 是否未泄漏到无关 View？
- 错误是否分类？
- 请求是否有取消和超时？
- 重试是否只用于安全场景？
- 鉴权刷新是否防并发？
- 上传是否不依赖 UI 类型？

## 推荐代码骨架

### Endpoint

Endpoint 只描述 HTTP 契约，不承载业务判断。

```swift
struct APIEndpoint<Response: Decodable & Sendable>: Sendable {
    enum Method: String, Sendable {
        case get = "GET"
        case post = "POST"
        case put = "PUT"
        case delete = "DELETE"
    }

    var path: String
    var method: Method = .get
    var queryItems: [URLQueryItem] = []
    var body: Data?
    var requiresAuth = true
    var timeout: TimeInterval = 30
}
```

### API 错误

底层错误分类稳定，UI 文案在 View 或 display 层映射。

```swift
enum APIError: Error, Sendable {
    case cancelled
    case timeout
    case offline
    case unauthorized
    case forbidden
    case rateLimited(retryAfter: TimeInterval?)
    case server(statusCode: Int, body: Data?)
    case decoding(underlying: Error)
    case validation(String)
    case business(code: String, message: String?)
    case transport(underlying: Error)
}
```

### APIClient

APIClient 统一构造 request、鉴权、状态码映射和解码。不要在每个 service 重复写 URL 拼装。

```swift
struct APIClient: Sendable {
    var baseURL: URL
    var session: URLSession
    var tokenProvider: any AccessTokenProviding

    func send<Response: Decodable & Sendable>(
        _ endpoint: APIEndpoint<Response>
    ) async throws -> Response {
        var request = try makeRequest(endpoint)

        if endpoint.requiresAuth {
            let token = try await tokenProvider.validAccessToken()
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        do {
            let (data, response) = try await session.data(for: request)
            try Task.checkCancellation()
            try validate(response: response, data: data)
            return try decode(Response.self, from: data)
        } catch is CancellationError {
            throw APIError.cancelled
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.transport(underlying: error)
        }
    }

    private func makeRequest<Response>(_ endpoint: APIEndpoint<Response>) throws -> URLRequest {
        var components = URLComponents(
            url: baseURL.appending(path: endpoint.path),
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = endpoint.queryItems.isEmpty ? nil : endpoint.queryItems

        guard let url = components?.url else {
            throw APIError.validation("Invalid endpoint URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.httpBody = endpoint.body
        request.timeoutInterval = endpoint.timeout
        return request
    }
}
```

### DTO 到领域模型

DTO 贴近后端，领域模型贴近 App。转换位置要集中，失败要可测试。

```swift
struct SongDTO: Decodable, Sendable {
    var id: String
    var title: String?
    var coverURL: URL?
}

struct Song: Identifiable, Sendable {
    var id: String
    var title: String
    var coverURL: URL?
}

extension Song {
    init(dto: SongDTO) throws {
        guard !dto.id.isEmpty else {
            throw APIError.validation("Song id is empty")
        }
        id = dto.id
        let trimmedTitle = dto.title?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        title = trimmedTitle.isEmpty ? "未命名" : trimmedTitle
        coverURL = dto.coverURL
    }
}
```

### Feature Service

View 依赖 feature service，不依赖 APIClient 细节。

```swift
protocol SongServiceProtocol: Sendable {
    func fetchSongs(cursor: String?) async throws -> Page<Song>
}

struct SongService: SongServiceProtocol {
    var apiClient: APIClient

    func fetchSongs(cursor: String?) async throws -> Page<Song> {
        let endpoint = APIEndpoint<SongPageDTO>(
            path: "/songs",
            queryItems: cursor.map { [URLQueryItem(name: "cursor", value: $0)] } ?? []
        )
        let dto = try await apiClient.send(endpoint)
        return try Page(
            items: dto.items.map(Song.init(dto:)),
            nextCursor: dto.nextCursor,
            hasMore: dto.hasMore
        )
    }
}
```

### Refresh Token Single-Flight

刷新 token 必须防并发风暴。用 `actor` 保护共享刷新任务。

```swift
actor TokenVault: AccessTokenProviding {
    private var token: AuthToken?
    private var refreshTask: Task<String, Error>?

    func validAccessToken() async throws -> String {
        if let token, !token.isExpired {
            return token.accessToken
        }

        if let refreshTask {
            return try await refreshTask.value
        }

        let task = Task { try await refreshAccessToken() }
        refreshTask = task
        defer { refreshTask = nil }

        return try await task.value
    }
}
```

## 验证要求

- DTO mapping：缺字段、空 id、未知枚举、旧字段兼容。
- APIClient：2xx、401、403、429、5xx、解码失败、取消。
- TokenVault：并发 401 时只发起一次 refresh。
- Pagination：空结果、最后一页、加载更多失败后重试。
- Upload：超限文件、错误 mimeType、取消上传。
