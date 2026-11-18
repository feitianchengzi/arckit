// AppKit controls are exercised without presenting windows or touching Keychain.
extension ConfigFormView {
    static func checkModes() -> ConfigFormView {
        let form = ConfigFormView()
        assert(form.sdkAuthMode == "apiKey" && form.nativeApiVersion == nil)
        form.integrationPopup.selectItem(at: 1)
        form.integrationChanged()
        assert(form.nativeApiVersion == "v2" && form.nativeAuthMode == "apiKey")
        assert(form.sdkAuthMode == nil && form.requiresAPIKey && form.requiresProjectId)
        form.notificationsCheckbox.state = .on
        assert(form.nativeNotificationsEnabled && !form.notificationsEnabled)
        form.apiKeyField.stringValue = "test-secret-must-be-cleared"
        form.authModePopup.selectItem(at: 1)
        form.authModeChanged()
        assert(form.isSession && form.credentialStrategy == .backendRuntime)
        assert(!form.requiresAPIKey && !form.requiresProjectId)
        assert(!form.apiKeyField.isEnabled && form.apiKeyField.stringValue.isEmpty)
        assert(form.customUserIdSource == "server-authenticated-user")
        assert(form.validationError != nil) // Host endpoint required.
        form.sessionEndpointField.stringValue = "https://app.example.com/api/feedback/session"
        assert(form.validationError == nil)
        form.gatewayField.stringValue = "https://api.example.com/"
        assert(form.gatewayUrl == "https://api.example.com")
        form.nativeVersionPopup.selectItem(at: 1)
        form.integrationChanged()
        assert(form.nativeAuthMode == "apiKey" && !form.isSession)
        assert(!form.nativeNotificationsEnabled && !form.authModePopup.isEnabled)
        assert(form.sessionEndpoint == nil && form.requiresProjectId)
        assert(form.validationError != nil) // V1 justification required.
        form.versionReasonField.stringValue = "用户明确指定 V1"
        assert(form.validationError == nil)
        form.nativeVersionPopup.selectItem(at: 0)
        form.integrationChanged()
        assert(form.versionSelectionReason == nil && form.authModePopup.isEnabled)
        form.authModePopup.selectItem(at: 1)
        form.authModeChanged()
        form.integrationPopup.selectItem(at: 0)
        form.integrationChanged()
        assert(form.sdkAuthMode == "session" && form.nativeAuthMode == nil)
        assert(!form.nativeNotificationsEnabled && form.isSession)
        form.integrationPopup.selectItem(at: 1)
        form.integrationChanged()
        assert(form.nativeApiVersion == "v2" && form.isSession)
        return form
    }
}

extension Collector {
    static func checkOutputs(directory: String, form: ConfigFormView) throws {
        let result = missingOutputResult(strategy: .backendRuntime, projectId: nil, form: form, message: "test")
        let data = try JSONEncoder().encode(result)
        let summary = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        assert(summary["nativeApiVersion"] as? String == "v2")
        assert(summary["nativeAuthMode"] as? String == "session")
        assert(summary["sessionEndpoint"] as? String == "https://app.example.com/api/feedback/session")
        assert(summary["apiKey"] == nil && summary["token"] == nil)
        assert(!String(decoding: data, as: UTF8.self).contains("test-secret"))
        for version in ["v1", "v2"] {
            let jsonPath = directory + "/\(version).json"
            let swiftPath = directory + "/\(version).swift"
            try writeLocalJSONConfig(projectId: 78, apiKey: "fixture-only", integrationMode: "native-api", sdkAuthMode: nil, notificationsEnabled: false, nativeApiVersion: version, nativeAuthMode: "apiKey", nativeNotificationsEnabled: version == "v2", gatewayUrl: "https://example.com", sessionEndpoint: nil, versionSelectionReason: version == "v1" ? "用户明确指定" : nil, to: jsonPath)
            let local = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: jsonPath))) as! [String: Any]
            assert(local["nativeApiVersion"] as? String == version)
            assert(local["nativeAuthMode"] as? String == "apiKey")
            assert(local["nativeNotificationsEnabled"] as? Bool == (version == "v2"))
            assert(local["sessionEndpoint"] == nil && local["sdkAuthMode"] == nil)
            try writeStaticSwiftConfig(projectId: 78, apiKey: "fixture-only", integrationMode: "native-api", sdkAuthMode: nil, notificationsEnabled: false, nativeApiVersion: version, nativeAuthMode: "apiKey", nativeNotificationsEnabled: version == "v2", gatewayUrl: "https://example.com", sessionEndpoint: nil, versionSelectionReason: version == "v1" ? "用户明确指定" : nil, to: swiftPath)
        }
    }
}

_ = NSApplication.shared
let form = ConfigFormView.checkModes()
assert(ConfigFormView.validAddress("https://api.example.com", gateway: true))
assert(ConfigFormView.validAddress("http://localhost:8081", gateway: true))
assert(ConfigFormView.validAddress("http://[::1]:8081", gateway: true))
for address in ["http://external.example.com", "https://user:secret@example.com", "https://example.com?token=secret", "https://example.com/#secret", "https://example.com/workshop/v2"] {
    assert(!ConfigFormView.validAddress(address, gateway: true))
}
try Collector.checkOutputs(directory: CommandLine.arguments[1], form: form)
print("PASS: mode transitions, V1 gate, Session credential isolation, address validation and configuration outputs")
