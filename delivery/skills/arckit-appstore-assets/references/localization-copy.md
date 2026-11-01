# 语言与商店文案

## 语言发现

从目标版本的 String Catalog、资源本地化、Info.plist/归档或用户提供的可信版本资料读取实际支持语言，排除依赖库语言和空占位。当前工作区与目标版本不一致时，不把工作区新功能或新语言当作目标版本事实。

将应用 UI 语言映射至 Apple 当前支持的商店 locale。映射歧义时明确选择地区变体；不支持的语言记录回退原因。用户可要求额外的商店翻译，但清单必须区分 UI 语言、标题/文案语言与新增翻译范围。全球发行不要求制作所有语言。

已有 locale 资料优先复用；不能为省工作自动删除语言。送审方传入的语言和 display type 是当前任务的输入要求，发现与实际实现不符时回传冲突，不能擅自降低覆盖范围。

## 文案

按请求输出各 locale 的名称/副标题建议、Promotional Text、Description、Keywords、版本更新说明和截图标题。已有正式名称优先沿用；改名属于建议，不能自行修改后台。首次版本更新说明按当前要求处理。

所有卖点必须可追溯到对应版本实际功能。用户范围未知、内容版权、合作关系、覆盖地区、服务可用性、付费权益等不可凭空承诺。截图标题与画面表达同一功能，不以翻译标题宣称应用已经有该语言 UI。

执行时查询 Apple 官方字段限制并记录核对来源/日期。关键词按当前字段计数规则检查，不用字节数替代字符数；emoji、组合字符等差异以 ASC 实际校验为准。名称、描述、关键词等分别记录实际长度、采用限制及检查结果。

支持/隐私政策等链接只使用已有真实地址；需要新增隐私政策或组织声明时交回送审任务，不在素材文案中虚构。审核账号、审核操作 Notes、隐私/加密/年龄分级声明和拒审回复由正式送审 skill 管理。

文案写入 metadata/<locale>.json 或用户既有目录，并在 manifest 记录文件摘要与字段校验。素材 skill 只做本地产物，不保存 App Store Connect 字段。

官方入口（执行时复核）：
- https://developer.apple.com/help/app-store-connect/manage-app-information/localize-app-information
- https://developer.apple.com/help/app-store-connect/reference/app-information/app-store-localizations
- https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
