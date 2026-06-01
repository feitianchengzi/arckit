# AI 生成链路规则

## 生成契约

每个 AI 生成功能应定义：

- 输入参数。
- Prompt 结构。
- 模型和配置。
- 输出 schema。
- 解析规则。
- 领域校验。
- 重试和取消。
- 成本/额度影响。
- UI 状态机。

不要把这些散落在 View。

## Prompt 管理

Prompt 应集中管理：

- 系统角色。
- 任务描述。
- 输出格式。
- 领域约束。
- 用户参数。
- 多样性参数。
- 禁止事项。

Prompt 修改应能被 review。重要 prompt 不应由多个页面拼接。

## 输出解析

模型输出必须经过：

1. 文本收集。
2. 结构抽取。
3. JSON decode 或格式解析。
4. 领域模型转换。
5. 领域校验。
6. 质量检查。

解析失败、解码失败和校验失败要区分。

## 流式处理

SSE/streaming 要定义：

- 首包超时。
- 总超时。
- chunk 累积。
- 完成标记。
- 取消。
- 中断恢复或失败。
- 部分内容是否展示。

## 质量门

按项目定义：

- 不为空。
- 不越界。
- 符合用户选择。
- 不重复。
- 可持久化。
- 可展示。
- 可执行下一步业务。

质量门应在代码里实现，不能只依赖 prompt。

## 成本和权益

如果生成涉及积分、额度、订阅或付费：

- 生成前确认代价。
- 防止重复点击。
- 明确失败后权益状态。
- 区分扣费前失败和扣费后失败。
- 记录可追溯 id，如项目需要。

复杂权益场景成熟后可拆独立 skill。

## UI 状态机

至少考虑：

- idle。
- validating。
- waiting first token。
- streaming。
- parsing。
- validating output。
- success。
- failed。
- retrying。
- cancelled。

不可中断任务要在交互规范中明确，不要只靠禁用关闭按钮。

## 检查清单

- Prompt 是否集中？
- 输出 schema 是否明确？
- 是否有解析和领域校验？
- 流式和超时是否处理？
- 是否防重复请求？
- 成本/权益是否解释清楚？
- 失败是否可恢复或可理解？

## 推荐代码骨架

### PromptBuilder

Prompt 集中管理，View 只传用户选择和上下文。

```swift
struct GenerationInput: Sendable {
    var topic: String
    var style: String
    var language: String
}

struct PromptBuilder: Sendable {
    func build(input: GenerationInput) -> String {
        """
        你是内容生成器。
        主题：\(input.topic)
        风格：\(input.style)
        语言：\(input.language)
        只输出 JSON，格式为：
        {"title":"...","items":["..."]}
        """
    }
}
```

### 输出 Schema 和领域校验

模型输出先解码为 schema，再转领域模型。

```swift
struct GeneratedContentSchema: Decodable, Sendable {
    var title: String
    var items: [String]
}

struct GeneratedContent: Equatable, Sendable {
    var title: String
    var items: [String]
}

struct GeneratedContentValidator: Sendable {
    func validate(_ schema: GeneratedContentSchema) throws -> GeneratedContent {
        let title = schema.title.trimmingCharacters(in: .whitespacesAndNewlines)
        let items = schema.items
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        guard !title.isEmpty else { throw GenerationError.validation("empty title") }
        guard !items.isEmpty else { throw GenerationError.validation("empty items") }

        return GeneratedContent(title: title, items: items)
    }
}
```

### 状态机

UI 状态显式化，避免多个 bool 混杂。

```swift
enum GenerationState: Equatable {
    case idle
    case validatingInput
    case waitingFirstToken
    case streaming(partialText: String)
    case parsing
    case validatingOutput
    case success(GeneratedContent)
    case failed(GenerationError)
    case cancelled
}

enum GenerationError: Error, Equatable, Sendable {
    case invalidInput(String)
    case network
    case timeout
    case cancelled
    case parsing
    case validation(String)
    case emptyResult
    case quotaExceeded
}
```

### Service

Service 负责生成链路，View 负责触发和展示状态。

```swift
protocol ContentGenerationServiceProtocol: Sendable {
    func generate(input: GenerationInput) async throws -> GeneratedContent
}

struct ContentGenerationService: ContentGenerationServiceProtocol {
    var promptBuilder: PromptBuilder
    var client: AIClient
    var validator: GeneratedContentValidator

    func generate(input: GenerationInput) async throws -> GeneratedContent {
        let prompt = promptBuilder.build(input: input)
        let text = try await client.complete(prompt: prompt)
        let schema = try extractJSON(GeneratedContentSchema.self, from: text)
        return try validator.validate(schema)
    }
}
```

### View 中防重复任务

```swift
struct GenerateView: View {
    @Environment(\.contentGenerationService) private var service
    @State private var state: GenerationState = .idle
    @State private var task: Task<Void, Never>?

    var body: some View {
        Button("生成") {
            startGeneration()
        }
        .disabled(task != nil)
    }

    private var currentInput: GenerationInput {
        GenerationInput(topic: "当前主题", style: "默认", language: "zh-Hans")
    }

    @MainActor
    private func startGeneration() {
        task?.cancel()
        task = Task {
            await runGeneration()
            await MainActor.run {
                task = nil
            }
        }
    }

    @MainActor
    private func runGeneration() async {
        state = .validatingInput
        do {
            let result = try await service.generate(input: currentInput)
            state = .success(result)
        } catch is CancellationError {
            state = .cancelled
        } catch let error as GenerationError {
            state = .failed(error)
        } catch {
            state = .failed(.network)
        }
    }
}
```

## 验证要求

- PromptBuilder：不同输入生成稳定结构。
- Parser：纯 JSON、带前后文本的 JSON、空文本、非法 JSON。
- Validator：空标题、空列表、重复项、越界字段。
- 任务：重复点击不会并发多次生成，取消后不覆盖结果。
- 成本：扣费前失败和扣费后失败状态能区分。
