# Licensing

English | [简体中文](LICENSING.zh-CN.md)

This repository contains components under different licenses. A license in a
component directory takes precedence over the repository-level license.

## Arckit

Unless a more specific license is present, the repository source, Arckit
skills, protocol documents, schemas, trusted entrypoints, examples, and
supporting materials are licensed under the Apache License 2.0 in [LICENSE](LICENSE).

Apache-2.0 permits personal, team, and enterprise use, modification, and
distribution subject to its notice, attribution, and other conditions. It does
not grant rights to the Arckit or ArcOrbit names, logos, or other trademarks.
An unofficial Simplified Chinese reference translation is available in
[LICENSE.zh-CN.md](LICENSE.zh-CN.md); the English license text controls.

## Product Applications and Service

The following product surfaces are licensed under the PolyForm Perimeter
License 1.0.1 found in their nearest `LICENSE` file:

- `runtime/arcorbit/` — ArcOrbit Desktop and Runtime;
- `apps/todo-web/` — Todo browser application;
- `apps/feedback-console/` — Feedback administration console;
- `services/workshop-api/` — shared Todo and Feedback service.

That license permits use, modification, and distribution for permitted
purposes, including personal use, team and enterprise internal use, and
internal customization. It does not permit providing a product or service that
competes with the applicable product, even if the competing product or service
is free of charge.

An unofficial Simplified Chinese reference translation is available in
[`runtime/arcorbit/LICENSE.zh-CN.md`](runtime/arcorbit/LICENSE.zh-CN.md); the
English license text controls.

A separate written commercial license is required to use these product
surfaces for a competing product or service, including a substitute, hosted or
managed offering, white-label distribution, OEM distribution, or another
externally provided product whose functionality or value competes with them.

## Public SDKs and Examples

`packages/feedback-sdk-web/`, `examples/feedback-ios/`, and `docs/workshop/`
are licensed under Apache-2.0 through their nearest license or the repository
root license. Their package metadata and local license files make this boundary
explicit so SDK consumers do not inherit a product application license.

## Private Operations

The sibling `arckit-ops` workspace is not part of this repository and is not
open source. It is all-rights-reserved and contains operational/customer
overlays, secret references, and Git-ignored local quarantine material. Public
Arckit builds and tests do not depend on it.

Commercial licensing and authorized distribution inquiries: `hi@feitianchengzi.com`.

## Commercial Products and Services

Commercial agreements may grant rights beyond the public licenses. Hosted
services, enterprise-only modules, official support, implementation services,
custom development, and customer deliverables are governed by their applicable
service, subscription, or commercial license agreements.

## Trademarks

The software licenses do not grant trademark rights. See
[TRADEMARKS.md](TRADEMARKS.md) for the public trademark policy.

## Third-Party Components

Third-party components retain their own copyright and license terms. Their
licenses are not replaced by either the Apache License 2.0 or the PolyForm
Perimeter License 1.0.1. ArcOrbit distribution notices are recorded in
[`runtime/arcorbit/THIRD_PARTY_NOTICES.md`](runtime/arcorbit/THIRD_PARTY_NOTICES.md).

## Earlier Versions

These terms apply to repository versions that contain this licensing notice.
Earlier versions remain subject to the terms and notices distributed with
those versions.
