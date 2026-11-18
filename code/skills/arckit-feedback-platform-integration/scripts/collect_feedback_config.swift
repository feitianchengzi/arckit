#!/usr/bin/env swift
import AppKit
import Foundation
import Security

struct FeedbackConfigResult: Codable {
    let integrationMode: String
    let sdkAuthMode: String?
    let notificationsEnabled: Bool
    let nativeApiVersion: String?
    let nativeAuthMode: String?
    let nativeNotificationsEnabled: Bool
    let gatewayUrl: String
    let sessionEndpoint: String?
    let versionSelectionReason: String?
    let credentialStrategy: String
    let projectId: Int?
    let apiKeyStatus: String
    let apiKeyHandle: String?
    let apiKeyOutputPath: String?
    let customUserIdMode: String?
    let customUserIdSource: String?
    let configuredByUser: Bool
    let message: String?
}

enum Collector {
    static let service = "feedback-platform-sdk"

    static func main() {
        let options = parseOptions()
        let result = collect(options: options)
        emit(result, outputPath: options.outputPath)
    }

    private struct Options {
        let outputPath: String?
        let staticSwiftOutputPath: String?
        let localJSONOutputPath: String?
    }

    enum CredentialStrategy: String {
        case sourceStatic = "source-static"
        case localIgnored = "local-ignored"
        case secretStore = "secret-store"
        case backendRuntime = "backend-runtime"

        var title: String {
            switch self {
            case .sourceStatic:
                return "源码静态配置"
            case .localIgnored:
                return "本地忽略配置"
            case .secretStore:
                return "安全 UI / secret store"
            case .backendRuntime:
                return "后端运行时配置"
            }
        }

        var description: String {
            switch self {
            case .sourceStatic:
                return "写入指定 Swift 配置文件；客户端包内可被提取。"
            case .localIgnored:
                return "写入指定本地配置文件；应加入 .gitignore。"
            case .secretStore:
                return "写入 macOS Keychain；Codex 只收到 secret handle。"
            case .backendRuntime:
                return "不采集 API Key；由后端运行时接口返回会话参数。"
            }
        }

        var requiresAPIKey: Bool {
            self != .backendRuntime
        }
    }

    enum IntegrationMode: String {
        case sdkWebView = "sdk-webview"
        case nativeAPI = "native-api"

        var title: String {
            switch self {
            case .sdkWebView:
                return "SDK WebView"
            case .nativeAPI:
                return "原生 API"
            }
        }

        var description: String {
            switch self {
            case .sdkWebView:
                return "加载反馈平台 SDK 页面，调用 openSubmit/openStatus。"
            case .nativeAPI:
                return "默认 V2，支持提交、消息、附件和通知；V1 仅用于明确的兼容需求。"
            }
        }
    }

    enum SDKAuthMode: String {
        case apiKey
        case session

        var title: String {
            switch self {
            case .apiKey:
                return "客户端直连 API Key"
            case .session:
                return "宿主服务 Session"
            }
        }

        var description: String {
            switch self {
            case .apiKey:
                return "项目专用且可轮换的 API Key 会进入客户端。"
            case .session:
                return "API Key 留在宿主服务；客户端只短期持有 Session token。"
            }
        }
    }

    private static func parseOptions() -> Options {
        let args = CommandLine.arguments
        return Options(
            outputPath: value(after: "--output", in: args),
            staticSwiftOutputPath: value(after: "--static-swift-output", in: args),
            localJSONOutputPath: value(after: "--local-json-output", in: args)
        )
    }

    private static func value(after flag: String, in args: [String]) -> String? {
        guard let index = args.firstIndex(of: flag),
              args.indices.contains(index + 1) else {
            return nil
        }
        return args[index + 1]
    }

    private static func collect(options: Options) -> FeedbackConfigResult {
        let app = NSApplication.shared
        app.setActivationPolicy(.regular)

        let form = ConfigFormView()
        while true {
            let alert = NSAlert()
            alert.messageText = "反馈平台接入参数"
            alert.informativeText = "请选择接入方案、凭证策略并填写平台参数。API Key 不会写入 stdout。"
            alert.accessoryView = form
            alert.addButton(withTitle: "保存配置")
            alert.addButton(withTitle: "取消")
            alert.window.initialFirstResponder = form.projectIdField
            NSApp.activate(ignoringOtherApps: true)

            let response = alert.runModal()
            guard response == .alertFirstButtonReturn else {
                return FeedbackConfigResult(
                    integrationMode: form.integrationMode.rawValue,
                    sdkAuthMode: form.sdkAuthMode,
                    notificationsEnabled: form.notificationsEnabled,
                    nativeApiVersion: form.nativeApiVersion,
                    nativeAuthMode: form.nativeAuthMode,
                    nativeNotificationsEnabled: form.nativeNotificationsEnabled,
                    gatewayUrl: form.gatewayUrl,
                    sessionEndpoint: form.sessionEndpoint,
                    versionSelectionReason: form.versionSelectionReason,
                    credentialStrategy: form.credentialStrategy.rawValue,
                    projectId: nil,
                    apiKeyStatus: "cancelled",
                    apiKeyHandle: nil,
                    apiKeyOutputPath: nil,
                    customUserIdMode: nil,
                    customUserIdSource: nil,
                    configuredByUser: false,
                    message: "User cancelled feedback platform configuration."
                )
            }

            if let error = form.validationError {
                showValidationError(error)
                continue
            }

            let projectIdText = form.projectIdField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
            let apiKey = form.apiKeyField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
            let strategy = form.credentialStrategy

            let projectId: Int?
            if projectIdText.isEmpty && !form.requiresProjectId {
                projectId = nil
            } else if let parsedProjectId = Int(projectIdText), parsedProjectId > 0 {
                projectId = parsedProjectId
            } else {
                showValidationError("Project ID 必须是正整数。")
                continue
            }

            guard !form.requiresAPIKey || !apiKey.isEmpty else {
                showValidationError("API Key 不能为空。")
                continue
            }

            if form.isSession,
               strategy != .backendRuntime {
                showValidationError("Session 模式必须使用宿主服务运行时配置。")
                continue
            }

            if !form.isSession,
               strategy == .backendRuntime {
                showValidationError("客户端直连请选择源码、本地忽略配置或 secret store；宿主服务请改选 Session 模式。")
                continue
            }

            switch strategy {
            case .sourceStatic:
                guard let projectId, let outputPath = options.staticSwiftOutputPath else {
                    return missingOutputResult(strategy: strategy, projectId: projectId, form: form, message: "源码静态配置需要 --static-swift-output。")
                }
                do {
                    try writeStaticSwiftConfig(
                        projectId: projectId,
                        apiKey: apiKey,
                        integrationMode: form.integrationMode.rawValue,
                        sdkAuthMode: form.sdkAuthMode,
                        notificationsEnabled: form.notificationsEnabled,
                        nativeApiVersion: form.nativeApiVersion,
                        nativeAuthMode: form.nativeAuthMode,
                        nativeNotificationsEnabled: form.nativeNotificationsEnabled,
                        gatewayUrl: form.gatewayUrl,
                        sessionEndpoint: form.sessionEndpoint,
                        versionSelectionReason: form.versionSelectionReason,
                        to: outputPath
                    )
                    return FeedbackConfigResult(
                        integrationMode: form.integrationMode.rawValue,
                        sdkAuthMode: form.sdkAuthMode,
                        notificationsEnabled: form.notificationsEnabled,
                        nativeApiVersion: form.nativeApiVersion,
                        nativeAuthMode: form.nativeAuthMode,
                        nativeNotificationsEnabled: form.nativeNotificationsEnabled,
                        gatewayUrl: form.gatewayUrl,
                        sessionEndpoint: form.sessionEndpoint,
                        versionSelectionReason: form.versionSelectionReason,
                        credentialStrategy: strategy.rawValue,
                        projectId: projectId,
                        apiKeyStatus: "written",
                        apiKeyHandle: nil,
                        apiKeyOutputPath: outputPath,
                        customUserIdMode: form.customUserIdMode,
                        customUserIdSource: form.customUserIdSource,
                        configuredByUser: true,
                        message: "API Key written to static Swift config."
                    )
                } catch {
                    return FeedbackConfigResult(
                        integrationMode: form.integrationMode.rawValue,
                        sdkAuthMode: form.sdkAuthMode,
                        notificationsEnabled: form.notificationsEnabled,
                        nativeApiVersion: form.nativeApiVersion,
                        nativeAuthMode: form.nativeAuthMode,
                        nativeNotificationsEnabled: form.nativeNotificationsEnabled,
                        gatewayUrl: form.gatewayUrl,
                        sessionEndpoint: form.sessionEndpoint,
                        versionSelectionReason: form.versionSelectionReason,
                        credentialStrategy: strategy.rawValue,
                        projectId: projectId,
                        apiKeyStatus: "invalid",
                        apiKeyHandle: nil,
                        apiKeyOutputPath: outputPath,
                        customUserIdMode: form.customUserIdMode,
                        customUserIdSource: form.customUserIdSource,
                        configuredByUser: false,
                        message: "Static config write failed: \(error.localizedDescription)"
                    )
                }

            case .localIgnored:
                guard let projectId, let outputPath = options.localJSONOutputPath else {
                    return missingOutputResult(strategy: strategy, projectId: projectId, form: form, message: "本地忽略配置需要 --local-json-output。")
                }
                do {
                    try writeLocalJSONConfig(
                        projectId: projectId,
                        apiKey: apiKey,
                        integrationMode: form.integrationMode.rawValue,
                        sdkAuthMode: form.sdkAuthMode,
                        notificationsEnabled: form.notificationsEnabled,
                        nativeApiVersion: form.nativeApiVersion,
                        nativeAuthMode: form.nativeAuthMode,
                        nativeNotificationsEnabled: form.nativeNotificationsEnabled,
                        gatewayUrl: form.gatewayUrl,
                        sessionEndpoint: form.sessionEndpoint,
                        versionSelectionReason: form.versionSelectionReason,
                        to: outputPath
                    )
                    return FeedbackConfigResult(
                        integrationMode: form.integrationMode.rawValue,
                        sdkAuthMode: form.sdkAuthMode,
                        notificationsEnabled: form.notificationsEnabled,
                        nativeApiVersion: form.nativeApiVersion,
                        nativeAuthMode: form.nativeAuthMode,
                        nativeNotificationsEnabled: form.nativeNotificationsEnabled,
                        gatewayUrl: form.gatewayUrl,
                        sessionEndpoint: form.sessionEndpoint,
                        versionSelectionReason: form.versionSelectionReason,
                        credentialStrategy: strategy.rawValue,
                        projectId: projectId,
                        apiKeyStatus: "written",
                        apiKeyHandle: nil,
                        apiKeyOutputPath: outputPath,
                        customUserIdMode: form.customUserIdMode,
                        customUserIdSource: form.customUserIdSource,
                        configuredByUser: true,
                        message: "API Key written to local ignored config."
                    )
                } catch {
                    return FeedbackConfigResult(
                        integrationMode: form.integrationMode.rawValue,
                        sdkAuthMode: form.sdkAuthMode,
                        notificationsEnabled: form.notificationsEnabled,
                        nativeApiVersion: form.nativeApiVersion,
                        nativeAuthMode: form.nativeAuthMode,
                        nativeNotificationsEnabled: form.nativeNotificationsEnabled,
                        gatewayUrl: form.gatewayUrl,
                        sessionEndpoint: form.sessionEndpoint,
                        versionSelectionReason: form.versionSelectionReason,
                        credentialStrategy: strategy.rawValue,
                        projectId: projectId,
                        apiKeyStatus: "invalid",
                        apiKeyHandle: nil,
                        apiKeyOutputPath: outputPath,
                        customUserIdMode: form.customUserIdMode,
                        customUserIdSource: form.customUserIdSource,
                        configuredByUser: false,
                        message: "Local config write failed: \(error.localizedDescription)"
                    )
                }

            case .secretStore:
                guard let projectId else {
                    showValidationError("Project ID 必须是正整数。")
                    continue
                }
                let account = "project-\(projectId)-api-key"
                let status = saveToKeychain(service: service, account: account, value: apiKey)
                guard status == errSecSuccess else {
                    return FeedbackConfigResult(
                        integrationMode: form.integrationMode.rawValue,
                        sdkAuthMode: form.sdkAuthMode,
                        notificationsEnabled: form.notificationsEnabled,
                        nativeApiVersion: form.nativeApiVersion,
                        nativeAuthMode: form.nativeAuthMode,
                        nativeNotificationsEnabled: form.nativeNotificationsEnabled,
                        gatewayUrl: form.gatewayUrl,
                        sessionEndpoint: form.sessionEndpoint,
                        versionSelectionReason: form.versionSelectionReason,
                        credentialStrategy: strategy.rawValue,
                        projectId: projectId,
                        apiKeyStatus: "invalid",
                        apiKeyHandle: nil,
                        apiKeyOutputPath: nil,
                        customUserIdMode: form.customUserIdMode,
                        customUserIdSource: form.customUserIdSource,
                        configuredByUser: false,
                        message: "Keychain save failed with OSStatus \(status)."
                    )
                }

                return FeedbackConfigResult(
                    integrationMode: form.integrationMode.rawValue,
                    sdkAuthMode: form.sdkAuthMode,
                    notificationsEnabled: form.notificationsEnabled,
                    nativeApiVersion: form.nativeApiVersion,
                    nativeAuthMode: form.nativeAuthMode,
                    nativeNotificationsEnabled: form.nativeNotificationsEnabled,
                    gatewayUrl: form.gatewayUrl,
                    sessionEndpoint: form.sessionEndpoint,
                    versionSelectionReason: form.versionSelectionReason,
                    credentialStrategy: strategy.rawValue,
                    projectId: projectId,
                    apiKeyStatus: "stored",
                    apiKeyHandle: "secret://macos-keychain/\(service)/\(account)",
                    apiKeyOutputPath: nil,
                    customUserIdMode: form.customUserIdMode,
                    customUserIdSource: form.customUserIdSource,
                    configuredByUser: true,
                    message: nil
                )

            case .backendRuntime:
                return FeedbackConfigResult(
                    integrationMode: form.integrationMode.rawValue,
                    sdkAuthMode: form.sdkAuthMode,
                    notificationsEnabled: form.notificationsEnabled,
                    nativeApiVersion: form.nativeApiVersion,
                    nativeAuthMode: form.nativeAuthMode,
                    nativeNotificationsEnabled: form.nativeNotificationsEnabled,
                    gatewayUrl: form.gatewayUrl,
                    sessionEndpoint: form.sessionEndpoint,
                    versionSelectionReason: form.versionSelectionReason,
                    credentialStrategy: strategy.rawValue,
                    projectId: projectId,
                    apiKeyStatus: "not-collected",
                    apiKeyHandle: nil,
                    apiKeyOutputPath: nil,
                    customUserIdMode: form.customUserIdMode,
                    customUserIdSource: form.customUserIdSource,
                    configuredByUser: true,
                    message: "Backend runtime strategy selected; API Key was not collected."
                )
            }
        }
    }

    private static func showValidationError(_ message: String) {
        let alert = NSAlert()
        alert.alertStyle = .warning
        alert.messageText = "参数无效"
        alert.informativeText = message
        alert.addButton(withTitle: "重新填写")
        alert.runModal()
    }

    private static func missingOutputResult(
        strategy: CredentialStrategy,
        projectId: Int?,
        form: ConfigFormView,
        message: String
    ) -> FeedbackConfigResult {
        FeedbackConfigResult(
            integrationMode: form.integrationMode.rawValue,
            sdkAuthMode: form.sdkAuthMode,
            notificationsEnabled: form.notificationsEnabled,
            nativeApiVersion: form.nativeApiVersion,
            nativeAuthMode: form.nativeAuthMode,
            nativeNotificationsEnabled: form.nativeNotificationsEnabled,
            gatewayUrl: form.gatewayUrl,
            sessionEndpoint: form.sessionEndpoint,
            versionSelectionReason: form.versionSelectionReason,
            credentialStrategy: strategy.rawValue,
            projectId: projectId,
            apiKeyStatus: "missing-output",
            apiKeyHandle: nil,
            apiKeyOutputPath: nil,
            customUserIdMode: form.customUserIdMode,
            customUserIdSource: form.customUserIdSource,
            configuredByUser: false,
            message: message
        )
    }

    private static func writeStaticSwiftConfig(
        projectId: Int,
        apiKey: String,
        integrationMode: String,
        sdkAuthMode: String?,
        notificationsEnabled: Bool,
        nativeApiVersion: String?,
        nativeAuthMode: String?,
        nativeNotificationsEnabled: Bool,
        gatewayUrl: String,
        sessionEndpoint: String?,
        versionSelectionReason: String?,
        to path: String
    ) throws {
        let url = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        let sdkAuthModeLiteral = sdkAuthMode.map { "\"\(swiftEscaped($0))\"" } ?? "nil"
        let content = """
        import Foundation

        /// Client-side static feedback platform credentials.
        /// This file intentionally embeds the API Key in the app bundle; migrate to runtime credentials for production hardening.
        struct FeedbackPlatformStaticConfig {
            static let preferredIntegrationMode = "\(swiftEscaped(integrationMode))"
            static let sdkAuthMode: String? = \(sdkAuthModeLiteral)
            static let notificationsEnabled = \(notificationsEnabled)
            static let nativeApiVersion: String? = \(nativeApiVersion.map { "\"\(swiftEscaped($0))\"" } ?? "nil")
            static let nativeAuthMode: String? = \(nativeAuthMode.map { "\"\(swiftEscaped($0))\"" } ?? "nil")
            static let nativeNotificationsEnabled = \(nativeNotificationsEnabled)
            static let gatewayUrl = "\(swiftEscaped(gatewayUrl))"
            static let sessionEndpoint: String? = \(sessionEndpoint.map { "\"\(swiftEscaped($0))\"" } ?? "nil")
            static let versionSelectionReason: String? = \(versionSelectionReason.map { "\"\(swiftEscaped($0))\"" } ?? "nil")
            static let projectId = \(projectId)
            static let apiKey = "\(swiftEscaped(apiKey))"
        }

        struct StaticFeedbackPlatformCredentialProvider: FeedbackPlatformCredentialProviding {
            func loadFeedbackPlatformCredentials() async throws -> FeedbackPlatformCredentials {
                FeedbackPlatformCredentials(
                    projectId: FeedbackPlatformStaticConfig.projectId,
                    apiKey: FeedbackPlatformStaticConfig.apiKey
                )
            }
        }
        """
        try content.write(to: url, atomically: true, encoding: .utf8)
    }

    private static func writeLocalJSONConfig(
        projectId: Int,
        apiKey: String,
        integrationMode: String,
        sdkAuthMode: String?,
        notificationsEnabled: Bool,
        nativeApiVersion: String?,
        nativeAuthMode: String?,
        nativeNotificationsEnabled: Bool,
        gatewayUrl: String,
        sessionEndpoint: String?,
        versionSelectionReason: String?,
        to path: String
    ) throws {
        let url = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        var payload: [String: Any] = [
            "preferredIntegrationMode": integrationMode,
            "notificationsEnabled": notificationsEnabled,
            "projectId": projectId,
            "apiKey": apiKey
        ]
        if let sdkAuthMode {
            payload["sdkAuthMode"] = sdkAuthMode
        }
        payload["nativeApiVersion"] = nativeApiVersion
        payload["nativeAuthMode"] = nativeAuthMode
        payload["nativeNotificationsEnabled"] = nativeNotificationsEnabled
        payload["gatewayUrl"] = gatewayUrl
        payload["sessionEndpoint"] = sessionEndpoint
        payload["versionSelectionReason"] = versionSelectionReason
        let data = try JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys])
        try data.write(to: url, options: [.atomic])
    }

    private static func swiftEscaped(_ value: String) -> String {
        value
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
    }

    private static func saveToKeychain(service: String, account: String, value: String) -> OSStatus {
        guard let data = value.data(using: .utf8) else {
            return errSecParam
        }
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        return SecItemAdd(addQuery as CFDictionary, nil)
    }

    private static func emit(_ result: FeedbackConfigResult, outputPath: String?) {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        do {
            let data = try encoder.encode(result)
            if let outputPath {
                try data.write(to: URL(fileURLWithPath: outputPath), options: [.atomic])
            }
            FileHandle.standardOutput.write(data)
            FileHandle.standardOutput.write(Data("\n".utf8))
        } catch {
            fputs("Failed to encode feedback config result: \(error)\n", stderr)
            exit(1)
        }
    }
}

final class ConfigFormView: NSStackView {
    private let integrationPopup = NSPopUpButton()
    private let authModePopup = NSPopUpButton()
    private let nativeVersionPopup = NSPopUpButton()
    private let versionReasonField = NSTextField()
    private let gatewayField = NSTextField(string: "https://api.feitianchengzi.com")
    private let sessionEndpointField = NSTextField()
    private let notificationsCheckbox = NSButton(checkboxWithTitle: "启用 V2 未读角标", target: nil, action: nil)
    private let strategyPopup = NSPopUpButton()
    let projectIdField = NSTextField()
    let apiKeyField = NSSecureTextField()
    let modePopup = NSPopUpButton()
    private let integrationHelpLabel = NSTextField(labelWithString: "")
    private let authModeHelpLabel = NSTextField(labelWithString: "")
    private let strategyHelpLabel = NSTextField(labelWithString: "")

    var integrationMode: Collector.IntegrationMode {
        switch integrationPopup.indexOfSelectedItem {
        case 0:
            return .sdkWebView
        default:
            return .nativeAPI
        }
    }

    var credentialStrategy: Collector.CredentialStrategy {
        switch strategyPopup.indexOfSelectedItem {
        case 0:
            return .sourceStatic
        case 1:
            return .localIgnored
        case 2:
            return .secretStore
        default:
            return .backendRuntime
        }
    }

    var sdkAuthMode: String? {
        guard integrationMode == .sdkWebView else { return nil }
        switch authModePopup.indexOfSelectedItem {
        case 0:
            return Collector.SDKAuthMode.apiKey.rawValue
        default:
            return Collector.SDKAuthMode.session.rawValue
        }
    }

    var notificationsEnabled: Bool {
        integrationMode == .sdkWebView && notificationsCheckbox.state == .on
    }

    var nativeApiVersion: String? {
        integrationMode == .nativeAPI ? (nativeVersionPopup.indexOfSelectedItem == 0 ? "v2" : "v1") : nil
    }

    var nativeAuthMode: String? {
        guard integrationMode == .nativeAPI else { return nil }
        return nativeApiVersion == "v1" ? "apiKey" : (authModePopup.indexOfSelectedItem == 0 ? "apiKey" : "session")
    }

    var nativeNotificationsEnabled: Bool {
        nativeApiVersion == "v2" && notificationsCheckbox.state == .on
    }

    var isSession: Bool { (sdkAuthMode ?? nativeAuthMode) == "session" }
    var gatewayUrl: String {
        let value = gatewayField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
        return value.hasSuffix("/") ? String(value.dropLast()) : value
    }
    var sessionEndpoint: String? {
        isSession ? sessionEndpointField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines) : nil
    }
    var versionSelectionReason: String? {
        nativeApiVersion == "v1" ? versionReasonField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines) : nil
    }
    var requiresAPIKey: Bool { !isSession }
    var requiresProjectId: Bool { !isSession }

    // Configuration addresses must not contain credentials, query strings or fragments.
    static func validAddress(_ value: String, gateway: Bool) -> Bool {
        guard let url = URLComponents(string: value),
              let host = url.host, !host.isEmpty,
              url.user == nil, url.password == nil, url.query == nil, url.fragment == nil,
              url.scheme == "https" || (url.scheme == "http" && ["localhost", "127.0.0.1", "::1", "[::1]"].contains(host)) else { return false }
        return !gateway || url.path.isEmpty || url.path == "/"
    }

    var validationError: String? {
        if !Self.validAddress(gatewayUrl, gateway: true) { return "网关必须是 HTTPS 域名（本机允许 HTTP），不能含路径、凭证、查询或片段。" }
        if isSession && !Self.validAddress(sessionEndpoint ?? "", gateway: false) { return "请填写宿主 Session 接口的完整 HTTPS 地址（本机允许 HTTP），不能含凭证、查询或片段。" }
        if nativeApiVersion == "v1" && (versionSelectionReason ?? "").isEmpty { return "使用 V1 必须填写用户明确指定或已确认兼容约束的依据。" }
        return nil
    }

    var customUserIdMode: String {
        switch modePopup.indexOfSelectedItem {
        case 0:
            return "business-user-id"
        default:
            return "persistent-guest-id"
        }
    }

    var customUserIdSource: String {
        if isSession {
            return "server-authenticated-user"
        }
        switch modePopup.indexOfSelectedItem {
        case 0:
            return "AuthService.currentUser.id.uuidString"
        default:
            return "Keychain:feedback.customUserId"
        }
    }

    init() {
        super.init(frame: NSRect(x: 0, y: 0, width: 460, height: 560))
        orientation = .vertical
        alignment = .leading
        spacing = 10
        translatesAutoresizingMaskIntoConstraints = false

        integrationPopup.addItems(withTitles: [
            Collector.IntegrationMode.sdkWebView.title,
            Collector.IntegrationMode.nativeAPI.title
        ])
        integrationPopup.target = self
        integrationPopup.action = #selector(integrationChanged)

        authModePopup.addItems(withTitles: [
            Collector.SDKAuthMode.apiKey.title,
            Collector.SDKAuthMode.session.title
        ])
        authModePopup.target = self
        authModePopup.action = #selector(authModeChanged)

        nativeVersionPopup.addItems(withTitles: ["V2（默认）", "V1（兼容）"])
        nativeVersionPopup.target = self
        nativeVersionPopup.action = #selector(integrationChanged)
        versionReasonField.placeholderString = "用户明确指定或已确认的兼容约束"
        sessionEndpointField.placeholderString = "https://your-app.example.com/api/feedback/session"

        strategyPopup.addItems(withTitles: [
            Collector.CredentialStrategy.sourceStatic.title,
            Collector.CredentialStrategy.localIgnored.title,
            Collector.CredentialStrategy.secretStore.title,
            Collector.CredentialStrategy.backendRuntime.title
        ])
        strategyPopup.target = self
        strategyPopup.action = #selector(strategyChanged)

        projectIdField.placeholderString = "例如 1"
        apiKeyField.placeholderString = "不会显示或输出到 stdout"
        modePopup.addItems(withTitles: ["业务用户 ID", "设备级游客 ID"])

        integrationHelpLabel.font = .systemFont(ofSize: NSFont.smallSystemFontSize)
        integrationHelpLabel.textColor = .secondaryLabelColor
        integrationHelpLabel.lineBreakMode = .byWordWrapping
        integrationHelpLabel.maximumNumberOfLines = 2

        authModeHelpLabel.font = .systemFont(ofSize: NSFont.smallSystemFontSize)
        authModeHelpLabel.textColor = .secondaryLabelColor
        authModeHelpLabel.lineBreakMode = .byWordWrapping
        authModeHelpLabel.maximumNumberOfLines = 2

        strategyHelpLabel.font = .systemFont(ofSize: NSFont.smallSystemFontSize)
        strategyHelpLabel.textColor = .secondaryLabelColor
        strategyHelpLabel.lineBreakMode = .byWordWrapping
        strategyHelpLabel.maximumNumberOfLines = 2

        addArrangedSubview(row(label: "接入方案", control: integrationPopup))
        addArrangedSubview(integrationHelpLabel)
        addArrangedSubview(row(label: "原生 API 版本", control: nativeVersionPopup))
        addArrangedSubview(row(label: "V1 使用依据", control: versionReasonField))
        addArrangedSubview(row(label: "认证方式", control: authModePopup))
        addArrangedSubview(authModeHelpLabel)
        addArrangedSubview(row(label: "通知能力", control: notificationsCheckbox))
        addArrangedSubview(row(label: "凭证策略", control: strategyPopup))
        addArrangedSubview(strategyHelpLabel)
        addArrangedSubview(row(label: "网关地址", control: gatewayField))
        addArrangedSubview(row(label: "Session 接口", control: sessionEndpointField))
        addArrangedSubview(row(label: "Project ID", control: projectIdField))
        addArrangedSubview(row(label: "API Key", control: apiKeyField))
        addArrangedSubview(row(label: "用户 ID 模式", control: modePopup))
        widthAnchor.constraint(equalToConstant: 460).isActive = true
        updateForSelectedIntegration()
        updateForSelectedStrategy()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    @objc private func integrationChanged() {
        updateForSelectedIntegration()
    }

    @objc private func authModeChanged() {
        updateForSelectedAuthMode()
    }

    @objc private func strategyChanged() {
        updateForSelectedStrategy()
    }

    private func updateForSelectedIntegration() {
        integrationHelpLabel.stringValue = integrationMode.description
        nativeVersionPopup.isEnabled = integrationMode == .nativeAPI
        versionReasonField.isEnabled = nativeApiVersion == "v1"
        let supportsV2 = nativeApiVersion != "v1"
        authModePopup.isEnabled = supportsV2
        notificationsCheckbox.isEnabled = supportsV2
        if !supportsV2 {
            authModePopup.selectItem(at: 0)
            notificationsCheckbox.state = .off
        }
        updateForSelectedAuthMode()
    }

    private func updateForSelectedAuthMode() {
        let mode: Collector.SDKAuthMode = authModePopup.indexOfSelectedItem == 0 ? .apiKey : .session
        authModeHelpLabel.stringValue = mode.description
        if mode == .session {
            strategyPopup.selectItem(at: 3)
            strategyPopup.isEnabled = false
            modePopup.selectItem(at: 0)
            modePopup.isEnabled = false
        } else {
            if credentialStrategy == .backendRuntime {
                strategyPopup.selectItem(at: 0)
            }
            strategyPopup.isEnabled = true
            modePopup.isEnabled = true
        }
        sessionEndpointField.isEnabled = isSession
        projectIdField.placeholderString = isSession ? "可留空，由宿主服务管理" : "例如 1（必填）"
        updateForSelectedStrategy()
    }

    private func updateForSelectedStrategy() {
        let strategy = credentialStrategy
        strategyHelpLabel.stringValue = strategy.description
        apiKeyField.isEnabled = requiresAPIKey
        apiKeyField.placeholderString = requiresAPIKey ? "不会显示或输出到 stdout" : "由宿主服务或后端运行时配置"
        if !requiresAPIKey {
            apiKeyField.stringValue = ""
        }
    }

    private func row(label: String, control: NSView) -> NSStackView {
        let labelView = NSTextField(labelWithString: label)
        labelView.widthAnchor.constraint(equalToConstant: 120).isActive = true
        control.translatesAutoresizingMaskIntoConstraints = false
        control.widthAnchor.constraint(equalToConstant: 320).isActive = true

        let stack = NSStackView(views: [labelView, control])
        stack.orientation = .horizontal
        stack.alignment = .centerY
        stack.spacing = 12
        return stack
    }
}

Collector.main()
