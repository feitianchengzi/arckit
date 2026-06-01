// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "{{PACKAGE_NAME}}",
    platforms: [
        .iOS(.v{{IOS_VERSION_MAJOR}}),
        .macOS(.v{{MACOS_VERSION_MAJOR}}),
        .watchOS(.v{{WATCHOS_VERSION_MAJOR}}),
        .tvOS(.v{{TVOS_VERSION_MAJOR}}),
        .visionOS(.v{{VISIONOS_VERSION_MAJOR}})
    ],
    products: [
        .library(
            name: "{{PACKAGE_NAME}}",
            targets: ["{{PACKAGE_NAME}}"]),
    ],
    targets: [
        .target(
            name: "{{PACKAGE_NAME}}",
            resources: [
                .process("Resources")
            ]
        ),
        .testTarget(
            name: "{{PACKAGE_NAME}}Tests",
            dependencies: ["{{PACKAGE_NAME}}"]
        )
    ]
)

