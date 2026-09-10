# Third-Party Notices

English | [简体中文](THIRD_PARTY_NOTICES.zh-CN.md)

ArcOrbit distributions include third-party software governed by its own
license terms. Those terms are not replaced by the PolyForm Perimeter License.

The principal directly distributed components include:

| Component | License | Source |
| --- | --- | --- |
| Electron | MIT | https://github.com/electron/electron |
| `ali-oss` | MIT | https://github.com/ali-sdk/ali-oss |
| `ws` | MIT | https://github.com/websockets/ws |
| xterm.js and addons | MIT | https://github.com/xtermjs/xterm.js |
| node-pty | MIT | https://github.com/microsoft/node-pty |
| simple-git | MIT | https://github.com/steveukx/git-js |
| Monaco Editor | MIT | https://github.com/microsoft/monaco-editor |
| Lazygit (optional binary) | MIT | https://github.com/jesseduffield/lazygit |
| ArcForge Embedded Provider | MIT | https://github.com/feitianchengzi/arcforge |

Transitive packages and platform components retain the license declarations
and notices shipped with their package metadata or binary distribution. The
ArcForge Embedded Provider carries its own `LICENSE` file inside the governed
ArcOrbit provisioning resources.

Browser dependency licenses are included in `desktop/renderer/vendor/THIRD_PARTY_LICENSES.txt` and `MONACO_THIRD_PARTY_NOTICES.txt`. An optional bundled Lazygit carries its upstream `LICENSE` and SHA-256 receipt. Native Git is supplied by the local developer environment.
