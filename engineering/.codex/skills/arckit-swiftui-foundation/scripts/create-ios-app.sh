#!/usr/bin/env bash

set -e

# Default values
PROJECT_NAME=""
PACKAGE_NAME=""
BUNDLE_IDENTIFIER=""
ORGANIZATION_NAME=""
IOS_VERSION="18.0"
MACOS_VERSION="15.0"
WATCHOS_VERSION="11.0"
TVOS_VERSION="18.0"
VISIONOS_VERSION="2.0"
OUTPUT_DIR=""

# Parse command line arguments
i=1
while [ $i -le $# ]; do
    arg="${!i}"
    case "$arg" in
        --name)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --name requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --name requires a value' >&2
                exit 1
            fi
            PROJECT_NAME="$next_arg"
            ;;
        --package)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --package requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --package requires a value' >&2
                exit 1
            fi
            PACKAGE_NAME="$next_arg"
            ;;
        --bundle-id)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --bundle-id requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --bundle-id requires a value' >&2
                exit 1
            fi
            BUNDLE_IDENTIFIER="$next_arg"
            ;;
        --organization)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --organization requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --organization requires a value' >&2
                exit 1
            fi
            ORGANIZATION_NAME="$next_arg"
            ;;
        --ios-version)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --ios-version requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --ios-version requires a value' >&2
                exit 1
            fi
            IOS_VERSION="$next_arg"
            ;;
        --macos-version)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --macos-version requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --macos-version requires a value' >&2
                exit 1
            fi
            MACOS_VERSION="$next_arg"
            ;;
        --watchos-version)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --watchos-version requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --watchos-version requires a value' >&2
                exit 1
            fi
            WATCHOS_VERSION="$next_arg"
            ;;
        --tvos-version)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --tvos-version requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --tvos-version requires a value' >&2
                exit 1
            fi
            TVOS_VERSION="$next_arg"
            ;;
        --visionos-version)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --visionos-version requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --visionos-version requires a value' >&2
                exit 1
            fi
            VISIONOS_VERSION="$next_arg"
            ;;
        --output)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --output requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --output requires a value' >&2
                exit 1
            fi
            OUTPUT_DIR="$next_arg"
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Create a new iOS app project from template."
            echo ""
            echo "Required options:"
            echo "  --name <name>              Project name (required)"
            echo ""
            echo "Optional options:"
            echo "  --package <name>           Package name (default: \${PROJECT_NAME}Package)"
            echo "  --bundle-id <id>          Bundle identifier (default: com.example.\${PROJECT_NAME})"
            echo "  --organization <name>     Organization name"
            echo "  --ios-version <version>   Minimum iOS version (default: 18.0)"
            echo "  --macos-version <version> Minimum macOS version (default: 15.0)"
            echo "  --watchos-version <version> Minimum watchOS version (default: 11.0)"
            echo "  --tvos-version <version>  Minimum tvOS version (default: 18.0)"
            echo "  --visionos-version <version> Minimum visionOS version (default: 2.0)"
            echo "  --output <path>           Output directory (default: current directory)"
            echo "  --help, -h                Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --name MyApp --bundle-id com.example.MyApp"
            echo "  $0 --name MyApp --ios-version 17.0 --output ~/Projects"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg" >&2
            echo "Use --help for usage information" >&2
            exit 1
            ;;
    esac
    i=$((i + 1))
done

# Validate required parameters
if [ -z "$PROJECT_NAME" ]; then
    echo "Error: --name is required" >&2
    echo "Use --help for usage information" >&2
    exit 1
fi

# Set defaults
if [ -z "$PACKAGE_NAME" ]; then
    PACKAGE_NAME="${PROJECT_NAME}Package"
fi

if [ -z "$BUNDLE_IDENTIFIER" ]; then
    BUNDLE_IDENTIFIER="com.example.${PROJECT_NAME}"
fi

# Get script directory and skill root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_DIR="$SKILL_ROOT/templates/ios-app-template"

# Check if template directory exists
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo "Error: Template directory not found: $TEMPLATE_DIR" >&2
    exit 1
fi

# Check prerequisites
echo "Checking prerequisites..."

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "Error: Xcode is not installed or not in PATH" >&2
    echo "Please install Xcode from the App Store" >&2
    exit 1
fi

# Check for Swift
if ! command -v swift &> /dev/null; then
    echo "Error: Swift is not installed or not in PATH" >&2
    exit 1
fi

echo "✓ Prerequisites check passed"

# Determine output directory
if [ -z "$OUTPUT_DIR" ]; then
    OUTPUT_DIR="$(pwd)"
else
    # Expand tilde and relative paths
    OUTPUT_DIR="${OUTPUT_DIR/#\~/$HOME}"
    # Create directory if it doesn't exist
    if [ ! -d "$OUTPUT_DIR" ]; then
        echo "Creating output directory: $OUTPUT_DIR"
        mkdir -p "$OUTPUT_DIR"
        if [ $? -ne 0 ]; then
            echo "Error: Failed to create output directory: $OUTPUT_DIR" >&2
            exit 1
        fi
    fi
fi

# Convert to absolute path
OUTPUT_DIR="$(cd "$OUTPUT_DIR" && pwd)"
PROJECT_DIR="$OUTPUT_DIR/$PROJECT_NAME"

# Check if project directory already exists
if [ -d "$PROJECT_DIR" ]; then
    echo "Error: Project directory already exists: $PROJECT_DIR" >&2
    exit 1
fi

echo "Creating project: $PROJECT_NAME"
echo "Output directory: $OUTPUT_DIR"

# Extract version major numbers for Package.swift
IOS_VERSION_MAJOR=$(echo "$IOS_VERSION" | cut -d. -f1)
MACOS_VERSION_MAJOR=$(echo "$MACOS_VERSION" | cut -d. -f1)
WATCHOS_VERSION_MAJOR=$(echo "$WATCHOS_VERSION" | cut -d. -f1)
TVOS_VERSION_MAJOR=$(echo "$TVOS_VERSION" | cut -d. -f1)
VISIONOS_VERSION_MAJOR=$(echo "$VISIONOS_VERSION" | cut -d. -f1)

# Copy template directory
echo "Copying template files..."
cp -R "$TEMPLATE_DIR" "$PROJECT_DIR"

# Function to replace placeholders in file content
replace_placeholders_in_file() {
    local file="$1"
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Detect OS for sed compatibility
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS requires an extension argument (even if empty)
        sed -i '' \
            -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
            -e "s/{{PACKAGE_NAME}}/$PACKAGE_NAME/g" \
            -e "s/{{BUNDLE_IDENTIFIER}}/$BUNDLE_IDENTIFIER/g" \
            -e "s/{{ORGANIZATION_NAME}}/$ORGANIZATION_NAME/g" \
            -e "s/{{IOS_VERSION}}/$IOS_VERSION/g" \
            -e "s/{{IOS_VERSION_MAJOR}}/$IOS_VERSION_MAJOR/g" \
            -e "s/{{MACOS_VERSION}}/$MACOS_VERSION/g" \
            -e "s/{{MACOS_VERSION_MAJOR}}/$MACOS_VERSION_MAJOR/g" \
            -e "s/{{WATCHOS_VERSION}}/$WATCHOS_VERSION/g" \
            -e "s/{{WATCHOS_VERSION_MAJOR}}/$WATCHOS_VERSION_MAJOR/g" \
            -e "s/{{TVOS_VERSION}}/$TVOS_VERSION/g" \
            -e "s/{{TVOS_VERSION_MAJOR}}/$TVOS_VERSION_MAJOR/g" \
            -e "s/{{VISIONOS_VERSION}}/$VISIONOS_VERSION/g" \
            -e "s/{{VISIONOS_VERSION_MAJOR}}/$VISIONOS_VERSION_MAJOR/g" \
            "$file"
    else
        # Linux
        sed -i \
            -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
            -e "s/{{PACKAGE_NAME}}/$PACKAGE_NAME/g" \
            -e "s/{{BUNDLE_IDENTIFIER}}/$BUNDLE_IDENTIFIER/g" \
            -e "s/{{ORGANIZATION_NAME}}/$ORGANIZATION_NAME/g" \
            -e "s/{{IOS_VERSION}}/$IOS_VERSION/g" \
            -e "s/{{IOS_VERSION_MAJOR}}/$IOS_VERSION_MAJOR/g" \
            -e "s/{{MACOS_VERSION}}/$MACOS_VERSION/g" \
            -e "s/{{MACOS_VERSION_MAJOR}}/$MACOS_VERSION_MAJOR/g" \
            -e "s/{{WATCHOS_VERSION}}/$WATCHOS_VERSION/g" \
            -e "s/{{WATCHOS_VERSION_MAJOR}}/$WATCHOS_VERSION_MAJOR/g" \
            -e "s/{{TVOS_VERSION}}/$TVOS_VERSION/g" \
            -e "s/{{TVOS_VERSION_MAJOR}}/$TVOS_VERSION_MAJOR/g" \
            -e "s/{{VISIONOS_VERSION}}/$VISIONOS_VERSION/g" \
            -e "s/{{VISIONOS_VERSION_MAJOR}}/$VISIONOS_VERSION_MAJOR/g" \
            "$file"
    fi
}

# Function to rename files and directories with placeholders
rename_placeholders() {
    local dir="$1"
    
    # Process multiple times to handle nested renames
    # We need to rename from deepest to shallowest, so we iterate until no more changes
    local max_iterations=10
    local iteration=0
    
    while [ $iteration -lt $max_iterations ]; do
        local changed=false
        
        # Collect all items with placeholders first (to avoid issues with find during iteration)
        # Use a temporary file to store items since arrays in subshells don't work well
        local temp_file=$(mktemp)
        find "$dir" -name "*{{*}}" -print0 2>/dev/null > "$temp_file"
        
        if [ ! -s "$temp_file" ]; then
            rm -f "$temp_file"
            break
        fi
        
        # Process items, sorting by path length (longest first) to handle nested directories
        while IFS= read -r -d '' old_path; do
            [ -z "$old_path" ] && continue
            if [ ! -e "$old_path" ]; then
                continue
            fi
            
            local old_name=$(basename "$old_path")
            local new_name=$(echo "$old_name" | sed \
                -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
                -e "s/{{PACKAGE_NAME}}/$PACKAGE_NAME/g")
            
            if [ "$new_name" != "$old_name" ]; then
                local new_path="$(dirname "$old_path")/$new_name"
                if mv "$old_path" "$new_path" 2>/dev/null; then
                    changed=true
                fi
            fi
        done < "$temp_file"
        
        rm -f "$temp_file"
        
        if [ "$changed" = false ]; then
            break
        fi
        
        iteration=$((iteration + 1))
    done
}

# Replace placeholders in all files (before renaming)
echo "Replacing placeholders in files..."
find "$PROJECT_DIR" -type f ! -path "*/.*" | while read -r file; do
    replace_placeholders_in_file "$file"
done

# Rename files and directories with placeholders
echo "Renaming files and directories..."
rename_placeholders "$PROJECT_DIR"
# Manually rename .xcodeproj directory if it still has placeholder
if [ -d "$PROJECT_DIR/{{PROJECT_NAME}}.xcodeproj" ]; then
    mv "$PROJECT_DIR/{{PROJECT_NAME}}.xcodeproj" "$PROJECT_DIR/$PROJECT_NAME.xcodeproj"
fi

# Replace placeholders again after renaming (in case some files were renamed)
echo "Replacing placeholders in renamed files..."
find "$PROJECT_DIR" -type f ! -path "*/.*" | while read -r file; do
    replace_placeholders_in_file "$file"
done

# Final pass: rename any remaining files/directories with placeholders
echo "Final pass: renaming remaining items..."
while true; do
    remaining=$(find "$PROJECT_DIR" -name "*{{*" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$remaining" -eq 0 ]; then
        break
    fi
    find "$PROJECT_DIR" -name "*{{*" 2>/dev/null | while read -r old_path; do
        [ -z "$old_path" ] && continue
        if [ ! -e "$old_path" ]; then
            continue
        fi
        new_path=$(echo "$old_path" | sed "s/{{PROJECT_NAME}}/$PROJECT_NAME/g; s/{{PACKAGE_NAME}}/$PACKAGE_NAME/g")
        if [ "$old_path" != "$new_path" ]; then
            mv "$old_path" "$new_path" 2>/dev/null || true
        fi
    done
    # Safety check to avoid infinite loop
    new_count=$(find "$PROJECT_DIR" -name "*{{*" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$new_count" -eq "$remaining" ] || [ "$new_count" -ge "$remaining" ]; then
        break
    fi
done

# Generate unique IDs for project.pbxproj (using hash, format: AF + 22 hex chars = 24 chars total)
generate_id() {
    local prefix="$1"
    local input="$2"
    local hash=$(echo -n "$prefix$input" | shasum | cut -c1-22 | tr '[:lower:]' '[:upper:]')
    echo "${prefix}${hash}"
}

PBX_BUILD_FILE_ID=$(generate_id "AF" "$PROJECT_NAME$PACKAGE_NAME")
PBX_PRODUCT_REF_ID=$(generate_id "AF" "$PACKAGE_NAME")
PBX_FILE_REF_ID=$(generate_id "AF" "$PROJECT_NAME.app")
PBX_EXCEPTION_SET_ID=$(generate_id "AF" "$PROJECT_NAME.exceptions")
PBX_ROOT_GROUP_ID=$(generate_id "AF" "$PROJECT_NAME.root")
PBX_FRAMEWORKS_PHASE_ID=$(generate_id "AF" "$PROJECT_NAME.frameworks")
PBX_MAIN_GROUP_ID=$(generate_id "AF" "$PROJECT_NAME.main")
PBX_PRODUCTS_GROUP_ID=$(generate_id "AF" "$PROJECT_NAME.products")
PBX_TARGET_ID=$(generate_id "AF" "$PROJECT_NAME.target")
PBX_TARGET_CONFIG_LIST_ID=$(generate_id "AF" "$PROJECT_NAME.target.config")
PBX_PROJECT_ID=$(generate_id "AF" "$PROJECT_NAME.project")
PBX_PROJECT_CONFIG_LIST_ID=$(generate_id "AF" "$PROJECT_NAME.project.config")
PBX_RESOURCES_PHASE_ID=$(generate_id "AF" "$PROJECT_NAME.resources")
PBX_SOURCES_PHASE_ID=$(generate_id "AF" "$PROJECT_NAME.sources")
PBX_TARGET_CONFIG_DEBUG_ID=$(generate_id "AF" "$PROJECT_NAME.debug")
PBX_TARGET_CONFIG_RELEASE_ID=$(generate_id "AF" "$PROJECT_NAME.release")
PBX_PROJECT_CONFIG_DEBUG_ID=$(generate_id "AF" "$PROJECT_NAME.project.debug")
PBX_PROJECT_CONFIG_RELEASE_ID=$(generate_id "AF" "$PROJECT_NAME.project.release")
PBX_PACKAGE_REF_ID=$(generate_id "AF" "$PACKAGE_NAME.package")

# Replace PBX IDs in project.pbxproj
# First try the expected path, then search for the file
PBX_PROJECT_FILE="$PROJECT_DIR/$PROJECT_NAME.xcodeproj/project.pbxproj"
if [ ! -f "$PBX_PROJECT_FILE" ]; then
    # Try to find project.pbxproj in any .xcodeproj directory
    PBX_PROJECT_FILE=$(find "$PROJECT_DIR" -path "*.xcodeproj/project.pbxproj" | head -1)
fi
if [ -f "$PBX_PROJECT_FILE" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' \
            -e "s/{{PBX_BUILD_FILE_ID}}/$PBX_BUILD_FILE_ID/g" \
            -e "s/{{PBX_PRODUCT_REF_ID}}/$PBX_PRODUCT_REF_ID/g" \
            -e "s/{{PBX_FILE_REF_ID}}/$PBX_FILE_REF_ID/g" \
            -e "s/{{PBX_EXCEPTION_SET_ID}}/$PBX_EXCEPTION_SET_ID/g" \
            -e "s/{{PBX_ROOT_GROUP_ID}}/$PBX_ROOT_GROUP_ID/g" \
            -e "s/{{PBX_FRAMEWORKS_PHASE_ID}}/$PBX_FRAMEWORKS_PHASE_ID/g" \
            -e "s/{{PBX_MAIN_GROUP_ID}}/$PBX_MAIN_GROUP_ID/g" \
            -e "s/{{PBX_PRODUCTS_GROUP_ID}}/$PBX_PRODUCTS_GROUP_ID/g" \
            -e "s/{{PBX_TARGET_ID}}/$PBX_TARGET_ID/g" \
            -e "s/{{PBX_TARGET_CONFIG_LIST_ID}}/$PBX_TARGET_CONFIG_LIST_ID/g" \
            -e "s/{{PBX_PROJECT_ID}}/$PBX_PROJECT_ID/g" \
            -e "s/{{PBX_PROJECT_CONFIG_LIST_ID}}/$PBX_PROJECT_CONFIG_LIST_ID/g" \
            -e "s/{{PBX_RESOURCES_PHASE_ID}}/$PBX_RESOURCES_PHASE_ID/g" \
            -e "s/{{PBX_SOURCES_PHASE_ID}}/$PBX_SOURCES_PHASE_ID/g" \
            -e "s/{{PBX_TARGET_CONFIG_DEBUG_ID}}/$PBX_TARGET_CONFIG_DEBUG_ID/g" \
            -e "s/{{PBX_TARGET_CONFIG_RELEASE_ID}}/$PBX_TARGET_CONFIG_RELEASE_ID/g" \
            -e "s/{{PBX_PROJECT_CONFIG_DEBUG_ID}}/$PBX_PROJECT_CONFIG_DEBUG_ID/g" \
            -e "s/{{PBX_PROJECT_CONFIG_RELEASE_ID}}/$PBX_PROJECT_CONFIG_RELEASE_ID/g" \
            -e "s/{{PBX_PACKAGE_REF_ID}}/$PBX_PACKAGE_REF_ID/g" \
            "$PBX_PROJECT_FILE"
    else
        # Linux
        sed -i \
            -e "s/{{PBX_BUILD_FILE_ID}}/$PBX_BUILD_FILE_ID/g" \
            -e "s/{{PBX_PRODUCT_REF_ID}}/$PBX_PRODUCT_REF_ID/g" \
            -e "s/{{PBX_FILE_REF_ID}}/$PBX_FILE_REF_ID/g" \
            -e "s/{{PBX_EXCEPTION_SET_ID}}/$PBX_EXCEPTION_SET_ID/g" \
            -e "s/{{PBX_ROOT_GROUP_ID}}/$PBX_ROOT_GROUP_ID/g" \
            -e "s/{{PBX_FRAMEWORKS_PHASE_ID}}/$PBX_FRAMEWORKS_PHASE_ID/g" \
            -e "s/{{PBX_MAIN_GROUP_ID}}/$PBX_MAIN_GROUP_ID/g" \
            -e "s/{{PBX_PRODUCTS_GROUP_ID}}/$PBX_PRODUCTS_GROUP_ID/g" \
            -e "s/{{PBX_TARGET_ID}}/$PBX_TARGET_ID/g" \
            -e "s/{{PBX_TARGET_CONFIG_LIST_ID}}/$PBX_TARGET_CONFIG_LIST_ID/g" \
            -e "s/{{PBX_PROJECT_ID}}/$PBX_PROJECT_ID/g" \
            -e "s/{{PBX_PROJECT_CONFIG_LIST_ID}}/$PBX_PROJECT_CONFIG_LIST_ID/g" \
            -e "s/{{PBX_RESOURCES_PHASE_ID}}/$PBX_RESOURCES_PHASE_ID/g" \
            -e "s/{{PBX_SOURCES_PHASE_ID}}/$PBX_SOURCES_PHASE_ID/g" \
            -e "s/{{PBX_TARGET_CONFIG_DEBUG_ID}}/$PBX_TARGET_CONFIG_DEBUG_ID/g" \
            -e "s/{{PBX_TARGET_CONFIG_RELEASE_ID}}/$PBX_TARGET_CONFIG_RELEASE_ID/g" \
            -e "s/{{PBX_PROJECT_CONFIG_DEBUG_ID}}/$PBX_PROJECT_CONFIG_DEBUG_ID/g" \
            -e "s/{{PBX_PROJECT_CONFIG_RELEASE_ID}}/$PBX_PROJECT_CONFIG_RELEASE_ID/g" \
            -e "s/{{PBX_PACKAGE_REF_ID}}/$PBX_PACKAGE_REF_ID/g" \
            "$PBX_PROJECT_FILE"
    fi
fi

echo ""
echo "✓ Project created successfully!"
echo ""
echo "Project location: $PROJECT_DIR"
echo ""
echo "Next steps:"
echo "  1. cd $PROJECT_DIR"
echo "  2. open $PROJECT_NAME.xcodeproj"
echo ""

