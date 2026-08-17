//
//  ContentView.swift
//  TestFeedBack
//
//  Created by crispydog on 2026/3/11.
//

import SwiftUI
import WebKit

struct ContentView: View {
    @AppStorage(FeedbackThemeStorage.themeKey) private var sdkThemeRawValue = FeedbackSDKTheme.system.rawValue

    private var sdkTheme: FeedbackSDKTheme {
        FeedbackThemeStorage.theme(rawValue: sdkThemeRawValue)
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                Text("Test Playground")
                    .font(.title2.bold())

                Text("点击下面入口，直接打开线上 Feedback 组件页面。")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Text("当前 customUserId: \(FeedbackWebConfig.customUserId ?? "-")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .textSelection(.enabled)

                VStack(alignment: .leading, spacing: 10) {
                    Text("SDK 主题")
                        .font(.headline)

                    Picker("SDK 主题", selection: $sdkThemeRawValue) {
                        ForEach(FeedbackSDKTheme.allCases, id: \.rawValue) { theme in
                            Text(theme.title).tag(theme.rawValue)
                        }
                    }
                    .pickerStyle(.segmented)

                    Text(sdkTheme.callDescription)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(14)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                NavigationLink {
                    FeedbackWebContainerView(entry: .submit)
                } label: {
                    HStack {
                        Image(systemName: "square.and.pencil")
                            .font(.headline)
                        Text("提交反馈")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.blue)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }

                NavigationLink {
                    FeedbackWebContainerView(entry: .status)
                } label: {
                    HStack {
                        Image(systemName: "list.bullet.rectangle")
                            .font(.headline)
                        Text("我的反馈")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.green)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }

                Spacer()
            }
            .padding(20)
            .navigationTitle("测试页面")
        }
    }
}

private enum FeedbackSDKTheme: String, CaseIterable {
    case system
    case light
    case dark

    var title: String {
        switch self {
        case .system:
            return "跟随系统"
        case .light:
            return "浅色"
        case .dark:
            return "深色"
        }
    }

    var callDescription: String {
        switch self {
        case .system:
            return "通过 window.FeedbackSDK.useSystemTheme() 跟随系统外观"
        case .light, .dark:
            return "通过 window.FeedbackSDK.setTheme('\(rawValue)') 切换"
        }
    }

    var next: FeedbackSDKTheme {
        switch self {
        case .system:
            return .dark
        case .dark:
            return .light
        case .light:
            return .system
        }
    }

    var nextTitle: String {
        switch next {
        case .system:
            return "跟随系统"
        case .light:
            return "切到浅色"
        case .dark:
            return "切到深色"
        }
    }
}

private enum FeedbackThemeStorage {
    static let themeKey = "feedback_sdk_theme"

    static func theme(rawValue: String) -> FeedbackSDKTheme {
        FeedbackSDKTheme(rawValue: rawValue) ?? .system
    }
}

private enum FeedbackWebConfig {
    // Load the deployed SPA entry. Direct /sdk/submit and /sdk/status are history routes
    // and can 404 on OSS before the React app has a chance to handle them.
    static let sdkEntryURL = URL(string: "https://feedback.feitianchengzi.com/sdk/index.html")!

    // 如需在 iOS 端直接注入配置，填入值即可；留空则只做纯展示。
    static let apiKey: String? = "ak_633eab98dd6fcfea50f433ed01534be2f769598f5ebf4f23ef6540ec2470b2cd"
    static let projectId: Int? = 85
    static let customUserId: String? = FeedbackGuestIdentity.resolveCustomUserId()
}

private enum FeedbackGuestIdentity {
    private static let storageKey = "feedback_guest_custom_user_id_v1"

    static func resolveCustomUserId() -> String {
        let defaults = UserDefaults.standard
        let existing = defaults.string(forKey: storageKey)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !existing.isEmpty {
            return existing
        }

#if os(iOS)
        let prefix = "ios_guest_"
#elseif os(macOS)
        let prefix = "mac_guest_"
#else
        let prefix = "guest_"
#endif

        let generated = prefix + UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
        defaults.set(generated, forKey: storageKey)
        return generated
    }
}

private enum FeedbackEntry {
    case submit
    case status

    var url: URL {
        FeedbackWebConfig.sdkEntryURL
    }

    var title: String {
        switch self {
        case .submit:
            return "提交反馈"
        case .status:
            return "我的反馈"
        }
    }

    var bridgeMethod: String {
        switch self {
        case .submit:
            return "openSubmit"
        case .status:
            return "openStatus"
        }
    }
}

private struct FeedbackWebContainerView: View {
    let entry: FeedbackEntry
    @AppStorage(FeedbackThemeStorage.themeKey) private var sdkThemeRawValue = FeedbackSDKTheme.system.rawValue
    @State private var reloadToken = UUID()
    @State private var loadingProgress: Double = 0
    @State private var isLoading = false

    private var sdkTheme: FeedbackSDKTheme {
        FeedbackThemeStorage.theme(rawValue: sdkThemeRawValue)
    }

    var body: some View {
        ZStack(alignment: .top) {
            FeedbackWebView(
                url: entry.url,
                entry: entry,
                apiKey: FeedbackWebConfig.apiKey,
                projectId: FeedbackWebConfig.projectId,
                customUserId: FeedbackWebConfig.customUserId,
                theme: sdkTheme,
                reloadToken: reloadToken,
                loadingProgress: $loadingProgress,
                isLoading: $isLoading
            )

            if isLoading {
                ProgressView(value: loadingProgress, total: 1.0)
                    .progressViewStyle(.linear)
                    .padding(.horizontal, 12)
                    .padding(.top, 6)
                    .transition(.opacity)
            }
        }
#if !os(macOS)
        .ignoresSafeArea(edges: .bottom)
#endif

        .navigationTitle(entry.title)
#if !os(macOS)
        .navigationBarTitleDisplayMode(.inline)
#endif

        .toolbar {
            ToolbarItem {
                Button(sdkTheme.nextTitle) {
                    sdkThemeRawValue = sdkTheme.next.rawValue
                }
            }

            ToolbarItem {
                Button("刷新") {
                    reloadToken = UUID()
                }
            }
        }
    }
}

#if os(macOS)
private struct FeedbackWebView: NSViewRepresentable {
    let url: URL
    let entry: FeedbackEntry
    let apiKey: String?
    let projectId: Int?
    let customUserId: String?
    let theme: FeedbackSDKTheme
    let reloadToken: UUID
    @Binding var loadingProgress: Double
    @Binding var isLoading: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        context.coordinator.startObserving(webView)
        context.coordinator.setLoading(true, progress: 0.05)
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        context.coordinator.parent = self
        if context.coordinator.lastTheme != theme {
            context.coordinator.lastTheme = theme
            context.coordinator.applyTheme(to: webView, theme: theme)
        }
        if context.coordinator.lastReloadToken != reloadToken {
            context.coordinator.lastReloadToken = reloadToken
            context.coordinator.setLoading(true, progress: 0.05)
            webView.load(URLRequest(url: url))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var parent: FeedbackWebView
        var lastReloadToken: UUID
        var lastTheme: FeedbackSDKTheme
        var progressObservation: NSKeyValueObservation?

        init(_ parent: FeedbackWebView) {
            self.parent = parent
            self.lastReloadToken = parent.reloadToken
            self.lastTheme = parent.theme
        }

        func startObserving(_ webView: WKWebView) {
            progressObservation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] _, change in
                guard let self else { return }
                let value = min(max(change.newValue ?? 0, 0), 1)
                DispatchQueue.main.async {
                    self.parent.loadingProgress = value
                    if value < 1 {
                        self.parent.isLoading = true
                    }
                }
            }
        }

        func setLoading(_ loading: Bool, progress: Double) {
            DispatchQueue.main.async {
                self.parent.isLoading = loading
                self.parent.loadingProgress = min(max(progress, 0), 1)
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            setLoading(false, progress: 1)
            guard let script = configureScript() else { return }
            webView.evaluateJavaScript(script, completionHandler: nil)
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            setLoading(true, progress: max(parent.loadingProgress, 0.05))
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            setLoading(false, progress: 1)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            setLoading(false, progress: 1)
        }

        func applyTheme(to webView: WKWebView, theme: FeedbackSDKTheme) {
            let script: String
            if theme == .system {
                script = "window.FeedbackSDK?.useSystemTheme?.();"
            } else {
                script = "window.FeedbackSDK?.setTheme?.('\(theme.rawValue)');"
            }
            webView.evaluateJavaScript(script, completionHandler: nil)
        }

        private func configureScript() -> String? {
            var payload: [String: Any] = [:]
            payload["theme"] = parent.theme.rawValue

            if let apiKey = parent.apiKey?.trimmingCharacters(in: .whitespacesAndNewlines), !apiKey.isEmpty {
                payload["apiKey"] = apiKey
            }
            if let projectId = parent.projectId {
                payload["projectId"] = projectId
            }
            if let customUserId = parent.customUserId?.trimmingCharacters(in: .whitespacesAndNewlines), !customUserId.isEmpty {
                payload["customUserId"] = customUserId
            }

            guard !payload.isEmpty else { return nil }
            guard let data = try? JSONSerialization.data(withJSONObject: payload),
                  let json = String(data: data, encoding: .utf8)
            else { return nil }

            return """
            (function () {
              const config = \(json);
              if (window.FeedbackSDK && typeof window.FeedbackSDK.configure === 'function') {
                window.FeedbackSDK.configure(config);
                if (typeof window.FeedbackSDK.\(parent.entry.bridgeMethod) === 'function') {
                  window.FeedbackSDK.\(parent.entry.bridgeMethod)();
                }
              }
            })();
            """
        }
    }
}
#else
private struct FeedbackWebView: UIViewRepresentable {
    let url: URL
    let entry: FeedbackEntry
    let apiKey: String?
    let projectId: Int?
    let customUserId: String?
    let theme: FeedbackSDKTheme
    let reloadToken: UUID
    @Binding var loadingProgress: Double
    @Binding var isLoading: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        context.coordinator.startObserving(webView)
        context.coordinator.setLoading(true, progress: 0.05)
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.parent = self
        if context.coordinator.lastTheme != theme {
            context.coordinator.lastTheme = theme
            context.coordinator.applyTheme(to: webView, theme: theme)
        }
        if context.coordinator.lastReloadToken != reloadToken {
            context.coordinator.lastReloadToken = reloadToken
            context.coordinator.setLoading(true, progress: 0.05)
            webView.load(URLRequest(url: url))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var parent: FeedbackWebView
        var lastReloadToken: UUID
        var lastTheme: FeedbackSDKTheme
        var progressObservation: NSKeyValueObservation?

        init(_ parent: FeedbackWebView) {
            self.parent = parent
            self.lastReloadToken = parent.reloadToken
            self.lastTheme = parent.theme
        }

        func startObserving(_ webView: WKWebView) {
            progressObservation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] _, change in
                guard let self else { return }
                let value = min(max(change.newValue ?? 0, 0), 1)
                DispatchQueue.main.async {
                    self.parent.loadingProgress = value
                    if value < 1 {
                        self.parent.isLoading = true
                    }
                }
            }
        }

        func setLoading(_ loading: Bool, progress: Double) {
            DispatchQueue.main.async {
                self.parent.isLoading = loading
                self.parent.loadingProgress = min(max(progress, 0), 1)
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            setLoading(false, progress: 1)
            guard let script = configureScript() else { return }
            webView.evaluateJavaScript(script, completionHandler: nil)
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            setLoading(true, progress: max(parent.loadingProgress, 0.05))
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            setLoading(false, progress: 1)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            setLoading(false, progress: 1)
        }

        func applyTheme(to webView: WKWebView, theme: FeedbackSDKTheme) {
            let script: String
            if theme == .system {
                script = "window.FeedbackSDK?.useSystemTheme?.();"
            } else {
                script = "window.FeedbackSDK?.setTheme?.('\(theme.rawValue)');"
            }
            webView.evaluateJavaScript(script, completionHandler: nil)
        }

        private func configureScript() -> String? {
            var payload: [String: Any] = [:]
            payload["theme"] = parent.theme.rawValue

            if let apiKey = parent.apiKey?.trimmingCharacters(in: .whitespacesAndNewlines), !apiKey.isEmpty {
                payload["apiKey"] = apiKey
            }
            if let projectId = parent.projectId {
                payload["projectId"] = projectId
            }
            if let customUserId = parent.customUserId?.trimmingCharacters(in: .whitespacesAndNewlines), !customUserId.isEmpty {
                payload["customUserId"] = customUserId
            }

            guard !payload.isEmpty else { return nil }
            guard let data = try? JSONSerialization.data(withJSONObject: payload),
                  let json = String(data: data, encoding: .utf8)
            else { return nil }

            return """
            (function () {
              const config = \(json);
              if (window.FeedbackSDK && typeof window.FeedbackSDK.configure === 'function') {
                window.FeedbackSDK.configure(config);
                if (typeof window.FeedbackSDK.\(parent.entry.bridgeMethod) === 'function') {
                  window.FeedbackSDK.\(parent.entry.bridgeMethod)();
                }
              }
            })();
            """
        }
    }
}
#endif
