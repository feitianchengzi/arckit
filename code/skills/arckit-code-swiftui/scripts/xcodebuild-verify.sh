#!/usr/bin/env bash

set -euo pipefail

PROJECT=""
WORKSPACE=""
SCHEME=""
DESTINATION="generic/platform=iOS"
DERIVED_DATA_PATH=""
CONFIGURATION=""
SCM_PROVIDER="system"
RESOLVE_PACKAGES="auto"
RUN_TEST_BUILD=1
EXTRA_XCODEBUILD_ARGS=()

print_help() {
    cat <<'EOF'
Usage: xcodebuild-verify.sh [OPTIONS] [-- EXTRA_XCODEBUILD_ARGS...]

Resolve Swift Package dependencies when needed, then run xcodebuild build and
build-for-testing.

Options:
  --project <path>             .xcodeproj path
  --workspace <path>           .xcworkspace path
  --scheme <name>              Scheme name
  --destination <destination>  xcodebuild destination (default: generic/platform=iOS)
  --derived-data <path>        DerivedData path
  --configuration <name>       Build configuration
  --scm-provider <provider>    Package resolution SCM provider (default: system)
  --always-resolve-packages    Always run -resolvePackageDependencies
  --skip-package-resolution    Do not run -resolvePackageDependencies
  --skip-test-build            Skip build-for-testing
  --help, -h                   Show this help

Examples:
  scripts/xcodebuild-verify.sh --project MyApp.xcodeproj --scheme MyApp
  scripts/xcodebuild-verify.sh --workspace MyApp.xcworkspace --scheme MyApp -- CODE_SIGNING_ALLOWED=NO
EOF
}

require_value() {
    local option="$1"
    local value="${2:-}"
    if [[ -z "$value" || "$value" == --* ]]; then
        echo "Error: $option requires a value" >&2
        exit 1
    fi
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --project)
            require_value "$1" "${2:-}"
            PROJECT="$2"
            shift 2
            ;;
        --workspace)
            require_value "$1" "${2:-}"
            WORKSPACE="$2"
            shift 2
            ;;
        --scheme)
            require_value "$1" "${2:-}"
            SCHEME="$2"
            shift 2
            ;;
        --destination)
            require_value "$1" "${2:-}"
            DESTINATION="$2"
            shift 2
            ;;
        --derived-data)
            require_value "$1" "${2:-}"
            DERIVED_DATA_PATH="$2"
            shift 2
            ;;
        --configuration)
            require_value "$1" "${2:-}"
            CONFIGURATION="$2"
            shift 2
            ;;
        --scm-provider)
            require_value "$1" "${2:-}"
            SCM_PROVIDER="$2"
            shift 2
            ;;
        --always-resolve-packages)
            RESOLVE_PACKAGES="always"
            shift
            ;;
        --skip-package-resolution)
            RESOLVE_PACKAGES="skip"
            shift
            ;;
        --skip-test-build)
            RUN_TEST_BUILD=0
            shift
            ;;
        --help|-h)
            print_help
            exit 0
            ;;
        --)
            shift
            EXTRA_XCODEBUILD_ARGS=("$@")
            break
            ;;
        *)
            echo "Unknown option: $1" >&2
            echo "Use --help for usage information" >&2
            exit 1
            ;;
    esac
done

if [[ -n "$PROJECT" && -n "$WORKSPACE" ]]; then
    echo "Error: use either --project or --workspace, not both" >&2
    exit 1
fi

discover_single_path() {
    local pattern="$1"
    local label="$2"
    local matches=()

    while IFS= read -r path; do
        matches+=("$path")
    done < <(find . -maxdepth 1 -name "$pattern" -print | sort)

    if [[ ${#matches[@]} -eq 1 ]]; then
        echo "${matches[0]}"
        return 0
    fi

    if [[ ${#matches[@]} -gt 1 ]]; then
        echo "Error: found multiple $label files. Pass --project or --workspace explicitly." >&2
        exit 1
    fi

    return 1
}

if [[ -z "$PROJECT" && -z "$WORKSPACE" ]]; then
    if WORKSPACE="$(discover_single_path "*.xcworkspace" "workspace")"; then
        :
    elif PROJECT="$(discover_single_path "*.xcodeproj" "project")"; then
        :
    else
        echo "Error: no .xcworkspace or .xcodeproj found in current directory" >&2
        exit 1
    fi
fi

if [[ -z "$SCHEME" ]]; then
    if [[ -n "$WORKSPACE" ]]; then
        SCHEME="$(basename "$WORKSPACE" .xcworkspace)"
    else
        SCHEME="$(basename "$PROJECT" .xcodeproj)"
    fi
fi

XCODEBUILD_TARGET_ARGS=()
if [[ -n "$WORKSPACE" ]]; then
    XCODEBUILD_TARGET_ARGS+=("-workspace" "$WORKSPACE")
else
    XCODEBUILD_TARGET_ARGS+=("-project" "$PROJECT")
fi
XCODEBUILD_TARGET_ARGS+=("-scheme" "$SCHEME")

COMMON_BUILD_ARGS=("${XCODEBUILD_TARGET_ARGS[@]}")
if [[ -n "$DESTINATION" ]]; then
    COMMON_BUILD_ARGS+=("-destination" "$DESTINATION")
fi
if [[ -n "$DERIVED_DATA_PATH" ]]; then
    COMMON_BUILD_ARGS+=("-derivedDataPath" "$DERIVED_DATA_PATH")
fi
if [[ -n "$CONFIGURATION" ]]; then
    COMMON_BUILD_ARGS+=("-configuration" "$CONFIGURATION")
fi

RESOLVE_ARGS=("${XCODEBUILD_TARGET_ARGS[@]}")
if [[ -n "$DERIVED_DATA_PATH" ]]; then
    RESOLVE_ARGS+=("-derivedDataPath" "$DERIVED_DATA_PATH")
fi
if [[ -n "$CONFIGURATION" ]]; then
    RESOLVE_ARGS+=("-configuration" "$CONFIGURATION")
fi

has_package_dependencies() {
    if [[ -f "Package.swift" ]]; then
        return 0
    fi

    if find . -maxdepth 5 -name Package.resolved -print -quit | grep -q .; then
        return 0
    fi

    if find . -maxdepth 5 -name project.pbxproj -print0 | xargs -0 grep -q "XCRemoteSwiftPackageReference"; then
        return 0
    fi

    return 1
}

echo "Verifying scheme: $SCHEME"
if [[ -n "$WORKSPACE" ]]; then
    echo "Workspace: $WORKSPACE"
else
    echo "Project: $PROJECT"
fi

if [[ "$RESOLVE_PACKAGES" == "always" ]] || { [[ "$RESOLVE_PACKAGES" == "auto" ]] && has_package_dependencies; }; then
    echo "Resolving Swift Package dependencies..."
    xcodebuild "${RESOLVE_ARGS[@]}" -resolvePackageDependencies -scmProvider "$SCM_PROVIDER"
else
    echo "Skipping Swift Package dependency resolution."
fi

echo "Building..."
xcodebuild "${COMMON_BUILD_ARGS[@]}" "${EXTRA_XCODEBUILD_ARGS[@]}" build

if [[ "$RUN_TEST_BUILD" -eq 1 ]]; then
    echo "Building tests..."
    xcodebuild "${COMMON_BUILD_ARGS[@]}" "${EXTRA_XCODEBUILD_ARGS[@]}" build-for-testing
fi

echo "Verification succeeded."
