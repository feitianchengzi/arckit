# 许可说明

[English](LICENSING.md) | 简体中文

本仓库包含适用不同许可证的组件。组件目录中的许可证优先于仓库根许可证。

## Arckit

除非组件目录包含更具体的许可证，仓库源码、Arckit skills、协议文档、schemas、trusted entrypoints、示例和配套材料均采用仓库根目录 [`LICENSE`](LICENSE) 中的 Apache License 2.0。

Apache License 2.0 允许个人、团队和企业使用、修改和分发，但使用者需要遵守许可证中关于许可证副本、归属声明、修改声明和其他事项的条件。该许可证不授予 Arckit、ArcOrbit 名称、Logo 或其他商标的使用权。

简体中文参考译文见 [`LICENSE.zh-CN.md`](LICENSE.zh-CN.md)。该译文仅为方便理解，具有法律约束力的许可条款以英文原文为准。

## 产品应用与服务

以下产品源码采用各自最近目录中 `LICENSE` 所载的 PolyForm Perimeter License 1.0.1：

- `runtime/arcorbit/`：ArcOrbit Desktop 与 Runtime；
- `apps/todo-web/`：Todo Web 客户端；
- `apps/feedback-console/`：Feedback 管理控制台；
- `services/workshop-api/`：Todo 与 Feedback 共用服务。

该许可证允许用于许可目的，包括个人使用、团队和企业内部使用、内部定制，以及为上述用途进行修改。它不允许向他人提供与对应产品竞争的产品或服务，即使该竞争性产品或服务免费提供。

将上述产品源码用于竞争性产品或服务时需要另行取得书面商业授权，包括替代产品、托管或 managed service、白标分发、OEM 分发，以及功能或价值与对应产品竞争的其他对外产品。

## 公共 SDK 与示例

`packages/feedback-sdk-web/`、`examples/feedback-ios/` 和 `docs/workshop/` 通过最近目录或仓库根许可证采用 Apache-2.0。目录许可证与 package metadata 会明确该边界，避免 SDK 消费者继承产品应用许可证。

## 私有运维工作区

同级 `arckit-ops` 不属于本公开仓库，也不是开源内容。它采用保留全部权利的私有许可，保存环境/客户覆盖层、秘密引用和 Git ignored 的本地隔离材料。Arckit 的公开构建与测试不依赖该目录。

简体中文参考译文见 [`runtime/arcorbit/LICENSE.zh-CN.md`](runtime/arcorbit/LICENSE.zh-CN.md)。该译文仅为方便理解，具有法律约束力的许可条款以英文原文为准。

商业授权及受控分发联系地址：`hi@feitianchengzi.com`。

## 商业产品与服务

商业协议可以授予公共许可证以外的权利。托管服务、企业专属模块、官方支持、实施服务、定制开发和客户交付物分别受适用的服务协议、订阅协议或商业许可协议约束。

## 商标

软件许可证不授予商标权。公开商标规则见 [`TRADEMARKS.zh-CN.md`](TRADEMARKS.zh-CN.md)。

## 第三方组件

第三方组件继续适用其自身著作权和许可条款。Apache License 2.0 和 PolyForm Perimeter License 1.0.1 均不替代这些条款。ArcOrbit 分发中的主要第三方声明记录于 [`runtime/arcorbit/THIRD_PARTY_NOTICES.zh-CN.md`](runtime/arcorbit/THIRD_PARTY_NOTICES.zh-CN.md)。

## 早期版本

上述条款适用于包含对应许可文件和许可说明的仓库版本。早期版本继续适用其分发时附带的条款和声明。
