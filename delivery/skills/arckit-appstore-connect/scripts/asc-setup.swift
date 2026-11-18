import AppKit
import Foundation
import UniformTypeIdentifiers

final class Setup: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow!
    let name = NSTextField(string: "")
    let key = NSTextField(string: "")
    let issuer = NSTextField(string: "")
    let fileLabel = NSTextField(labelWithString: "尚未选择 .p8 文件")
    let status = NSTextField(wrappingLabelWithString: "")
    var keyPath = ""
    var finished = false
    var busy = false
    var saveButton: NSButton!
    let form = NSStackView()

    func button(_ title: String, _ action: Selector) -> NSButton {
        return NSButton(title: title, target: self, action: action)
    }
    func note(_ text: String) -> NSTextField {
        let label = NSTextField(wrappingLabelWithString: text)
        label.font = NSFont.systemFont(ofSize: 12)
        label.textColor = .secondaryLabelColor
        label.widthAnchor.constraint(equalToConstant: 540).isActive = true
        return label
    }
    func applicationDidFinishLaunching(_ notification: Notification) {
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 600, height: 760),
                          styleMask: [.titled, .closable], backing: .buffered, defer: false)
        window.title = "连接 App Store Connect"
        window.delegate = self
        let stack = NSStackView()
        stack.orientation = .vertical; stack.alignment = .leading; stack.spacing = 14
        stack.translatesAutoresizingMaskIntoConstraints = false
        window.contentView!.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: window.contentView!.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: window.contentView!.trailingAnchor, constant: -24),
            stack.topAnchor.constraint(equalTo: window.contentView!.topAnchor, constant: 24)
        ])
        stack.addArrangedSubview(note(
            "连接后可复用此账号发布应用，无需每次重新提供密钥。请在此窗口填写，AI 只收到本机连接名称和验证结果。"))
        let choices = NSStackView(views: [
            button("还没有密钥，去 Apple 后台申请", #selector(applyKey)),
            button("已有密钥，填写连接信息", #selector(showForm))
        ])
        stack.addArrangedSubview(choices)
        form.orientation = .vertical; form.alignment = .leading; form.spacing = 10
        for (label, field, placeholder, help) in [
            ("本机连接名称", name, "例如 personal 或 company",
             "自己起一个便于区分账号的名称，不需要去 Apple 后台查找。以字母或数字开头，最多 64 位，可包含下划线和短横线。"),
            ("Key ID（密钥编号）", key, "粘贴 Apple 后台显示的 Key ID",
             "在团队密钥列表中找到要使用的密钥，复制其 Key ID。必须与下面选择的 .p8 文件对应。"),
            ("Issuer ID（签发者编号）", issuer, "粘贴完整的 Issuer ID",
             "从 App Store Connect API 的团队密钥页面复制 Issuer ID。它不是 Developer Team ID，也不是 Apple 登录邮箱。")
        ] {
            form.addArrangedSubview(NSTextField(labelWithString: label))
            field.placeholderString = placeholder
            form.addArrangedSubview(field)
            field.widthAnchor.constraint(equalToConstant: 540).isActive = true
            form.addArrangedSubview(note(help))
        }
        form.addArrangedSubview(button("选择从 Apple 下载的 .p8 私钥文件…", #selector(chooseFile)))
        form.addArrangedSubview(fileLabel)
        form.addArrangedSubview(note("请选择此 Key ID 对应的文件，通常名为 AuthKey_密钥编号.p8。无需打开文件或复制其中的内容。"))
        form.addArrangedSubview(note(
            "点击下方按钮将验证 Apple 连接并保存到本机，供以后复用。保存位置：~/.config/arckit/appstore-connect；仅当前用户可访问，文件未加密，原 .p8 文件保留。"))
        saveButton = button("验证并保存", #selector(save))
        form.addArrangedSubview(saveButton)
        form.isHidden = true; stack.addArrangedSubview(form)
        status.widthAnchor.constraint(equalToConstant: 540).isActive = true
        stack.addArrangedSubview(status)
        stack.addArrangedSubview(button("取消", #selector(cancel)))
        window.center(); window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
    @objc func showForm() { form.isHidden = false; status.stringValue = "" }
    @objc func applyKey() {
        showForm()
        status.stringValue = "在 Users and Access → Integrations → App Store Connect API 中申请团队密钥。记录 Key ID、Issuer ID，下载仅可下载一次的 .p8，然后回到此窗口保存。权限不足时联系账号管理员。"
        NSWorkspace.shared.open(URL(string: "https://appstoreconnect.apple.com/access/integrations/api")!)
    }
    @objc func chooseFile() {
        guard !busy else { return }
        let picker = NSOpenPanel()
        picker.canChooseDirectories = false; picker.allowsMultipleSelection = false
        picker.allowedContentTypes = [UTType(filenameExtension: "p8") ?? .data]
        if picker.runModal() == .OK, let url = picker.url {
            keyPath = url.path; fileLabel.stringValue = url.lastPathComponent
        }
    }
    @objc func save() {
        guard !busy else { return }
        let values = ["profile":name.stringValue.trimmingCharacters(in: .whitespacesAndNewlines),
                      "keyId":key.stringValue.trimmingCharacters(in: .whitespacesAndNewlines),
                      "issuerId":issuer.stringValue.trimmingCharacters(in: .whitespacesAndNewlines),
                      "keyPath":keyPath]
        guard values.values.allSatisfy({ !$0.isEmpty }), CommandLine.arguments.count == 3 else {
            status.stringValue = "请填写全部字段并选择 .p8 文件。"; return
        }
        guard values["profile"]!.range(of: "^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$", options: .regularExpression) != nil else {
            status.stringValue = "本机连接名称请使用 1–64 位字母、数字、下划线或短横线，以字母或数字开头，例如 company。"
            return
        }
        busy = true; saveButton.isEnabled = false; status.stringValue = "正在验证连接并保存…"
        DispatchQueue.global().async {
            let task = Process()
            task.executableURL = URL(fileURLWithPath: CommandLine.arguments[1])
            task.arguments = [CommandLine.arguments[2], "--receive"]
            let input = Pipe(), output = Pipe()
            task.standardInput = input; task.standardOutput = output
            task.standardError = FileHandle.nullDevice
            var result: [String:Any] = ["status":"error"]
            do {
                try task.run()
                input.fileHandleForWriting.write(try JSONSerialization.data(withJSONObject: values))
                try input.fileHandleForWriting.close()
                let data = output.fileHandleForReading.readDataToEndOfFile()
                task.waitUntilExit()
                result = (try? JSONSerialization.jsonObject(with: data)) as? [String:Any] ?? result
            } catch {}
            let receipt = result
            DispatchQueue.main.async {
                self.busy = false; self.saveButton.isEnabled = true
                if receipt["status"] as? String == "saved" {
                    self.key.stringValue = ""; self.issuer.stringValue = ""; self.keyPath = ""
                    self.finish(receipt)
                } else {
                    let messages = [
                        "profile_exists":"此本机连接名称已被使用。请换一个名称，例如 company-new，已有连接不会被覆盖。",
                        "invalid_profile":"本机连接名称格式不正确，请参照字段下方说明填写。",
                        "authentication_failed":"鉴权失败，请检查 Key ID、Issuer ID 和 .p8 是否匹配。",
                        "permission_denied":"该密钥没有所需访问权限，请检查 Apple 后台权限。",
                        "network_error":"网络连接失败，请检查网络后重试。",
                        "rate_limited":"Apple 暂时限流，请稍后重试。"
                    ]
                    self.status.stringValue = messages[receipt["code"] as? String ?? ""] ?? "配置未保存，请检查名称、密钥文件格式和本机存储权限后重试。"
                }
            }
        }
    }
    func finish(_ result: [String:Any]) {
        guard !finished else { return }; finished = true
        if let data = try? JSONSerialization.data(withJSONObject: result) {
            FileHandle.standardOutput.write(data)
        }
        NSApp.terminate(nil)
    }
    @objc func cancel() {
        if busy { status.stringValue = "验证保存进行中，请等待结果后关闭。"; return }
        finish(["status":"cancelled"])
    }
    func windowShouldClose(_ sender: NSWindow) -> Bool { cancel(); return false }
}
let app = NSApplication.shared
app.setActivationPolicy(.regular)
// Native field editors receive editing actions through the responder chain.
let mainMenu = NSMenu()
let appItem = NSMenuItem()
let appMenu = NSMenu()
appMenu.addItem(withTitle: "关于连接配置", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
appItem.submenu = appMenu
mainMenu.addItem(appItem)
let editItem = NSMenuItem()
let editMenu = NSMenu(title: "编辑")
editMenu.addItem(withTitle: "剪切", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
editMenu.addItem(withTitle: "复制", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
editMenu.addItem(withTitle: "粘贴", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
editMenu.addItem(.separator())
editMenu.addItem(withTitle: "全选", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
editItem.submenu = editMenu
mainMenu.addItem(editItem)
app.mainMenu = mainMenu
let delegate = Setup()
app.delegate = delegate
app.run()
