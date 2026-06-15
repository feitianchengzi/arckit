#!/usr/bin/env python3
"""
scaffold_fe.py — 前端项目脚手架

根据框架/样式/状态管理快速创建前端项目结构，包含测试配置、组件模板、样式变量。

用法:
  python3 scaffold_fe.py --framework react --style css-modules --state zustand --project-name my-app
  python3 scaffold_fe.py --framework vue --style tailwind --state pinia --project-name my-app
  python3 scaffold_fe.py --help
"""

import argparse
import json
from pathlib import Path


FRAMEWORKS = {
    "react": {
        "init": "npm create vite@latest {project} -- --template react-ts",
        "deps": "npm install && npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom msw",
        "config_file": "vitest.config.ts",
        "config": """import {{ defineConfig }} from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({{
  plugins: [react()],
  test: {{
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
  }},
}});
""",
        "setup_file": "src/test-setup.ts",
        "setup": """import '@testing-library/jest-dom';
""",
    },
    "vue": {
        "init": "npm create vite@latest {project} -- --template vue-ts",
        "deps": "npm install && npm install -D vitest @vue/test-utils happy-dom msw",
        "config_file": "vitest.config.ts",
        "config": """import {{ defineConfig }} from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({{
  plugins: [vue()],
  test: {{
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
  }},
}});
""",
        "setup_file": "src/test-setup.ts",
        "setup": "",
    },
}

STYLE_CONFIGS = {
    "css-modules": {
        "globals_css": """:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-primary-light: #93c5fd;
  --color-primary-dark: #1d4ed8;
  --color-accent: #8b5cf6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  --color-background: #ffffff;
  --color-surface: #f9fafb;

  /* Typography */
  --font-display: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
""",
    },
    "tailwind": {
        "globals_css": """@tailwind base;
@tailwind components;
@tailwind utilities;

/* Design system tokens as CSS custom properties for non-Tailwind usage */
:root {
  --color-primary: theme('colors.blue.500');
  --color-accent: theme('colors.violet.500');
  --font-display: theme('fontFamily.sans');
  --font-body: theme('fontFamily.sans');
}
""",
    },
}

STATE_CONFIGS = {
    "zustand": {
        "template": """import {{ create }} from 'zustand';

interface {Name}State {{
  items: {Name}[];
  loading: boolean;
  error: Error | null;
  fetchItems: () => Promise<void>;
}}

export const use{Name}Store = create<{Name}State>((set) => ({{
  items: [],
  loading: false,
  error: null,
  fetchItems: async () => {{
    set({{ loading: true, error: null }});
    try {{
      // TODO: replace with actual API call
      const res = await fetch('/api/{name}s');
      const data = await res.json();
      set({{ items: data, loading: false }});
    }} catch (e) {{
      set({{ error: e as Error, loading: false }});
    }}
  }},
}}));
""",
        "ext": ".ts",
    },
    "pinia": {
        "template": """import {{ defineStore }} from 'pinia';

export const use{Name}Store = defineStore('{name}', {{
  state: () => ({{
    items: [] as {Name}[],
    loading: false,
    error: null as Error | null,
  }}),
  actions: {{
    async fetchItems() {{
      this.loading = true;
      this.error = null;
      try {{
        // TODO: replace with actual API call
        const res = await fetch('/api/{name}s');
        this.items = await res.json();
      }} catch (e) {{
        this.error = e as Error;
      }} finally {{
        this.loading = false;
      }}
    }},
  }},
}});
""",
        "ext": ".ts",
    },
    "none": {
        "template": "// State management: use local component state (useState / ref)\n",
        "ext": ".ts",
    },
}

COMPONENT_TEMPLATES = {
    "react": {
        "component": """import {{ type FC }} from 'react';
import styles from './{Name}.module.css';

interface {Name}Props {{
  className?: string;
  children?: React.ReactNode;
}}

export const {Name}: FC<{Name}Props> = ({{ className, children }}) => {{
  return (
    <div className={{[styles.container, className].filter(Boolean).join(' ')}} role="region" aria-label="{{name}}">
      {{children}}
    </div>
  );
}};
""",
        "test": """import {{ render, screen }} from '@testing-library/react';
import {{ describe, test, expect }} from 'vitest';
import {{ {Name} }} from './{Name}';

describe('{Name}', () => {{
  test('renders children', () => {{
    render(<{Name}>Hello</{Name}>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  }});

  test('has aria-label', () => {{
    render(<{Name}>Content</{Name}>);
    expect(screen.getByRole('region', {{ name: '{name}' }})).toBeInTheDocument();
  }});
}});
""",
        "css": """.container {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
""",
    },
    "vue": {
        "component": """<template>
  <div :class="[styles.container, className]" role="region" :aria-label="ariaLabel">
    <slot />
  </div>
</template>

<script setup lang="ts">
import styles from './{Name}.module.css';

interface Props {
  className?: string;
  ariaLabel?: string;
}

withDefaults(defineProps<Props>(), {{
  ariaLabel: '{name}',
}});
</script>
""",
        "test": """import {{ mount }} from '@vue/test-utils';
import {{ describe, test, expect }} from 'vitest';
import {Name} from './{Name}.vue';

describe('{Name}', () => {{
  test('renders slot content', () => {{
    const wrapper = mount({Name}, {{
      slots: {{ default: 'Hello' }},
    }});
    expect(wrapper.text()).toContain('Hello');
  }});
}});
""",
        "css": """.container {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
""",
    },
}


def create_project(framework: str, style: str, state: str, project_name: str, output_dir: str) -> dict:
    """创建前端项目结构"""
    base = Path(output_dir) if output_dir else Path(project_name)
    fw = FRAMEWORKS[framework]
    st = STYLE_CONFIGS[style]
    sc = STATE_CONFIGS[state]
    ct = COMPONENT_TEMPLATES[framework]

    dirs = [
        "src/components/ui",
        "src/components/feedback",
        "src/components/layout",
        "src/hooks",
        "src/stores",
        "src/services",
        "src/types",
        "src/utils",
        "src/styles",
        "src/app",
        "src/__tests__/integration",
        "src/__tests__/msw",
    ]

    created_dirs = []
    for d in dirs:
        p = base / d
        p.mkdir(parents=True, exist_ok=True)
        created_dirs.append(str(p))

    # Vitest 配置
    config_path = base / fw["config_file"]
    config_path.write_text(fw["config"], encoding="utf-8")

    # 测试 setup
    if fw.get("setup_file") and fw.get("setup"):
        setup_path = base / fw["setup_file"]
        setup_path.write_text(fw["setup"], encoding="utf-8")

    # 全局样式
    globals_path = base / "src/styles/globals.css"
    globals_path.write_text(st["globals_css"], encoding="utf-8")

    # 变量文件
    variables_path = base / "src/styles/variables.css"
    if style == "css-modules":
        variables_path.write_text(st["globals_css"], encoding="utf-8")
    else:
        variables_path.write_text("/* Tailwind config handles design tokens */\n", encoding="utf-8")

    # 示例 Store
    if state != "none":
        store_name = "Example"
        store_path = base / "src/stores" / f"use{store_name}Store{sc['ext']}"
        store_content = sc["template"].format(Name=store_name, name=store_name.lower())
        store_path.write_text(store_content, encoding="utf-8")

    # 示例组件 + 测试
    comp_name = "Example"
    comp_path = base / "src/components/ui" / f"{comp_name}{'.tsx' if framework == 'react' else '.vue'}"
    comp_content = ct["component"].format(Name=comp_name, name=comp_name.lower())
    comp_path.write_text(comp_content, encoding="utf-8")

    test_path = base / "src/components/ui" / f"{comp_name}.test{'.tsx' if framework == 'react' else '.ts'}"
    test_content = ct["test"].format(Name=comp_name, name=comp_name.lower())
    test_path.write_text(test_content, encoding="utf-8")

    css_path = base / "src/components/ui" / f"{comp_name}.module.css"
    css_path.write_text(ct["css"], encoding="utf-8")

    # API 服务层模板
    api_path = base / "src/services/api.ts"
    api_path.write_text("""/**
 * API 请求封装
 *
 * 所有 API 调用通过此模块，统一处理：
 * - baseURL
 * - 认证 Token 注入
 * - 错误映射
 * - 请求/响应拦截
 */

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { params, ...init } = config;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message ?? `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(url: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(url, { method: 'GET', params }),
  post: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(url: string) =>
    request<T>(url, { method: 'DELETE' }),
};
""", encoding="utf-8")

    # MSW handlers 模板
    msw_path = base / "src/__tests__/msw/handlers.ts"
    msw_path.write_text("""import { http, HttpResponse } from 'msw';

export const handlers = [
  // 在此添加 API mock
  // http.get('/api/examples', () => HttpResponse.json({ data: [], total: 0 })),
];
""", encoding="utf-8")

    # tsconfig
    tsconfig_path = base / "tsconfig.json"
    tsconfig_path.write_text(json.dumps({
        "compilerOptions": {
            "target": "ES2022",
            "module": "ESNext",
            "moduleResolution": "bundler",
            "strict": True,
            "strictNullChecks": True,
            "jsx": "react-jsx" if framework == "react" else "preserve",
            "esModuleInterop": True,
            "skipLibCheck": True,
            "forceConsistentCasingInFileNames": True,
            "resolveJsonModule": True,
            "isolatedModules": True,
            "noEmit": True,
            "paths": {"@/*": ["./src/*"]},
        },
        "include": ["src"],
    }, indent=2, ensure_ascii=False), encoding="utf-8")

    return {
        "project": project_name,
        "framework": framework,
        "style": style,
        "state": state,
        "base_dir": str(base),
        "init_command": fw["init"].format(project=project_name),
        "deps_command": fw["deps"],
        "test_command": "npx vitest",
        "directories_created": len(created_dirs),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="前端项目脚手架")
    parser.add_argument("--framework", required=True, choices=list(FRAMEWORKS.keys()), help="前端框架")
    parser.add_argument("--style", default="css-modules", choices=list(STYLE_CONFIGS.keys()), help="样式方案")
    parser.add_argument("--state", default="zustand", choices=list(STATE_CONFIGS.keys()), help="状态管理")
    parser.add_argument("--project-name", required=True, help="项目名称")
    parser.add_argument("--output-dir", default="", help="输出目录（默认为项目名称）")
    args = parser.parse_args()

    result = create_project(args.framework, args.style, args.state, args.project_name, args.output_dir)

    print(json.dumps(result, ensure_ascii=False, indent=2))
    print()
    print("📋 下一步：")
    print(f"   1. cd {result['base_dir']}")
    print(f"   2. {result['init_command']}")
    print(f"   3. {result['deps_command']}")
    print(f"   4. {result['test_command']}")
    print()
    print("🔴 RED:  写一个失败测试（组件交互测试）")
    print("🟢 GREEN: 写最小组件实现使测试通过")
    print("🔵 REFACTOR: 在测试保护下重构")
