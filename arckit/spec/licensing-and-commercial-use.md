# Arckit 与 ArcOrbit 许可及商业使用

## 适用范围

仓库使用组件级许可证。组件目录中的许可证优先于仓库根许可证，第三方组件继续适用其自身许可证。

许可规则适用于包含对应许可文件的仓库版本。早期版本继续适用其分发时附带的条款和声明。

## Arckit 开源许可

Arckit skills、协议文档、schemas、trusted entrypoints、示例及没有更具体许可证的仓库内容采用 Apache License 2.0。

Apache License 2.0 下的 Arckit 内容支持个人、团队和企业使用、复制、修改和分发。使用者保留适用的许可证副本、版权、专利、商标和归属声明，并在修改文件上标记变更。

每个可被独立安装或分发的 Arckit skill 携带 Apache License 2.0。ArcOrbit 安装包内的 Arckit skill payload 同样携带各 skill 的许可证副本。

Apache License 2.0 不授予 Arckit、ArcOrbit 名称、Logo 或其他商标的使用权。

## ArcOrbit 源码许可

`runtime/arcorbit/` 下的 ArcOrbit Desktop 与 Runtime 源码采用 PolyForm Perimeter License 1.0.1。

该许可支持以下用途：

- 个人使用、研究、测试和修改；
- 团队或企业内部使用；
- 团队或企业为自身内部需要进行修改和个性化适配；
- 不与 ArcOrbit 竞争的集成、分发和衍生使用。

该许可不允许向他人提供与 ArcOrbit 竞争的产品或服务。竞争性产品可以采用不同界面、技术平台或交付形态，也可以免费提供。

使用或分发 ArcOrbit 时，接收者获得 PolyForm Perimeter License 1.0.1 或其官方 URL，并保留全部 `Required Notice:` 声明。

## 商业授权边界

以下用途要求取得独立书面商业授权：

- 将 ArcOrbit 作为替代性产品对外提供；
- 提供托管、SaaS 或 managed service 形态的 ArcOrbit 替代服务；
- 白标、OEM、嵌入式或面向客户的 ArcOrbit 竞争性分发；
- 以免费或收费方式提供与 ArcOrbit 功能或价值竞争的产品；
- 使用 Arckit、ArcOrbit 品牌开展超出准确来源说明或兼容性说明的产品分发。

商业协议可以授予公共许可证以外的使用、分发、品牌、支持或交付权利。商业授权联系地址为 `hi@feitianchengzi.com`。

## 商业产品与服务

托管服务、企业专属模块、官方支持、实施服务、定制开发和客户交付物分别受适用的服务协议、订阅协议或商业许可协议约束。

公共仓库许可证不自动授予未包含在公共仓库中的商业模块、服务端软件、凭据、账号、托管服务或客户交付物的权利。

## 商标与官方身份

修改版和独立产品可以准确说明其来源及兼容性，但不得使用 Arckit、ArcOrbit 名称、Logo、视觉身份或域名使他人误认为该产品由飞天橙子官方维护、认可、赞助或发布。

白标、产品命名、Logo、官方关系声明和超出准确归属说明的品牌使用需要取得书面许可。

## 分发完整性

仓库根包含 Apache License 2.0、NOTICE、许可范围说明和商标规则。

ArcOrbit 源码包和应用包包含 PolyForm Perimeter License 1.0.1 与第三方组件声明。Arckit skill payload、ArcForge Embedded Provider 和第三方依赖分别保留各自许可证。

构建和分发验证确认：

- ArcOrbit 包元数据指向包内许可证，而不声明 MIT 或 Apache-2.0；
- ArcOrbit 应用文件包含 `LICENSE` 和 `THIRD_PARTY_NOTICES.md`；
- 每个 Arckit skill 目录包含 Apache License 2.0；
- ArcForge Embedded Provider 保留其 MIT License；
- 仓库 README 明确区分 Arckit 开源许可和 ArcOrbit 源码可见许可。
