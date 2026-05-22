# iOS App Template

This is a template for creating new iOS applications based on the YueYaMelody project structure.

## Structure

- `{{PROJECT_NAME}}.xcodeproj/` - Xcode project file
- `{{PROJECT_NAME}}/` - Main application directory
- `{{PACKAGE_NAME}}/` - Swift Package directory

## Usage

Use the `create-ios-app.sh` (Bash) or `create-ios-app.ps1` (PowerShell) script to generate a new project from this template.

```
bash scripts/bash/create-ios-app.sh --name HelloWorld --package HelloWorldPackage --bundle-id com.example.HelloWorld --ios-version 18.0 --macos-version 15.0 --watchos-version 11.0 --tvos-version 18.0 --visionos-version 2.0 --output ios
```

## Placeholders

The following placeholders will be replaced when generating a new project:

- `{{PROJECT_NAME}}` - Project name
- `{{PACKAGE_NAME}}` - Package name (default: `{{PROJECT_NAME}}Package`)
- `{{BUNDLE_IDENTIFIER}}` - Bundle identifier
- `{{ORGANIZATION_NAME}}` - Organization name
- `{{IOS_VERSION}}` - Minimum iOS version
- `{{MACOS_VERSION}}` - Minimum macOS version
- `{{WATCHOS_VERSION}}` - Minimum watchOS version
- `{{TVOS_VERSION}}` - Minimum tvOS version
- `{{VISIONOS_VERSION}}` - Minimum visionOS version

