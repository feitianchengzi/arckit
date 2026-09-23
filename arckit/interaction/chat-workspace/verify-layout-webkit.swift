import AppKit
import WebKit
let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
final class Probe: NSObject, WKNavigationDelegate {
 let web = WKWebView(frame: NSRect(x: 0, y: 0, width: 1500, height: 800))
 func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
  DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
   self.web.evaluateJavaScript("""
   (()=>{
    ChatNativeInput.open();
    const buttons=['#gc-sync>summary','#gc-runtime>summary','.gc-feedback','#gc-refresh','[data-account-open]'].map(s=>{const r=GlobalShell.header.querySelector(s).getBoundingClientRect();return {y:r.y,bottom:r.bottom,height:r.height}});
    const p=document.querySelector('#native-picker').getBoundingClientRect(),list=document.querySelector('#native-options'),l=list.getBoundingClientRect(),f=document.querySelector('.native-picker-footer').getBoundingClientRect();
    const reached=[...list.querySelectorAll('button')].every(b=>{b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect();return r.top>=l.top-1&&r.bottom<=l.bottom+1&&b.contains(document.elementFromPoint(r.left+20,r.top+r.height/2))});
    return JSON.stringify({ok:buttons.every(r=>r.height>0&&Math.abs(r.y-buttons[0].y)<2&&r.bottom<=54)&&p.height>500&&l.height>300&&f.bottom<=p.bottom&&reached,buttons,menuHeight:p.height,listHeight:l.height,allEntriesReachable:reached});
   })()
   """) { result, error in
    if let error = error { print(error); exit(1) }
    let report = result as? String ?? "missing result"
    print(report)
    exit(report.contains("\"ok\":true") ? 0 : 1)
   }
  }
 }
}
let probe = Probe()
probe.web.navigationDelegate = probe
let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
probe.web.loadFileURL(root.appendingPathComponent("arckit/interaction/chat-workspace/default.html"), allowingReadAccessTo: root)
DispatchQueue.main.asyncAfter(deadline: .now()+30) { print("WebKit probe timed out"); exit(1) }
app.run()
