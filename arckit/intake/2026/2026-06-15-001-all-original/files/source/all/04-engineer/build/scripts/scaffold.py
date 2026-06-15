#!/usr/bin/env python3
"""
scaffold.py — TDD 项目脚手架

根据语言和框架快速创建 TDD 项目结构，包含测试配置和示例测试。

用法:
  python3 scaffold.py --language typescript --framework jest --project-name my-app
  python3 scaffold.py --language python --framework pytest --project-name my-service
"""

import argparse
import json
from pathlib import Path


FRAMEWORKS = {
    "typescript": {
        "jest": {
            "init": "npm init -y && npm install -D jest ts-jest @types/jest typescript",
            "config": '{"preset":"ts-jest","testEnvironment":"node","testMatch":["**/__tests__/**/*.test.ts"]}',
            "config_file": "jest.config.json",
            "test_dir": "__tests__",
            "test_ext": ".test.ts",
            "test_template": 'import {{ describe, test, expect }} from "@jest/globals";\n\ndescribe("Example", () => {{\n  test("should work", () => {{\n    expect(1 + 1).toBe(2);\n  }});\n}});\n',
        },
        "vitest": {
            "init": "npm init -y && npm install -D vitest typescript",
            "config": '{"test":{"globals":true,"environment":"node"}}',
            "config_file": "vitest.config.json",
            "test_dir": "__tests__",
            "test_ext": ".test.ts",
            "test_template": 'import {{ describe, test, expect }} from "vitest";\n\ndescribe("Example", () => {{\n  test("should work", () => {{\n    expect(1 + 1).toBe(2);\n  }});\n}});\n',
        },
    },
    "python": {
        "pytest": {
            "init": "pip install pytest",
            "config": "[pytest]\ntestpaths = tests\npython_files = test_*.py",
            "config_file": "pytest.ini",
            "test_dir": "tests",
            "test_ext": ".py",
            "test_template": 'def test_example():\n    assert 1 + 1 == 2\n',
        },
    },
    "go": {
        "testing": {
            "init": "go mod init {project}",
            "config": "",
            "config_file": "",
            "test_dir": "",
            "test_ext": "_test.go",
            "test_template": 'package main\n\nimport "testing"\n\nfunc TestExample(t *testing.T) {\n\tif 1+1 != 2 {\n\t\tt.Error("expected 2")\n\t}\n}\n',
        },
    },
}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TDD 项目脚手架")
    parser.add_argument("--language", required=True, choices=list(FRAMEWORKS.keys()))
    parser.add_argument("--framework", default="", help="测试框架（默认取语言第一个）")
    parser.add_argument("--project-name", required=True)
    parser.add_argument("--output-dir", default="")
    args = parser.parse_args()

    lang_frameworks = FRAMEWORKS[args.language]
    fw_name = args.framework if args.framework in lang_frameworks else next(iter(lang_frameworks))
    fw = lang_frameworks[fw_name]

    base = Path(args.output_dir) if args.output_dir else Path(args.project_name)
    src_dir = base / "src"
    test_dir = base / fw["test_dir"] if fw["test_dir"] else src_dir

    src_dir.mkdir(parents=True, exist_ok=True)
    if str(test_dir) != str(src_dir):
        test_dir.mkdir(parents=True, exist_ok=True)

    # 写测试配置
    if fw["config_file"] and fw["config"]:
        (base / fw["config_file"]).write_text(fw["config"], encoding="utf-8")

    # 写示例测试
    if fw["test_ext"]:
        example_test = test_dir / f"example{fw['test_ext']}"
        template = fw["test_template"].replace("{project}", args.project_name)
        example_test.write_text(template, encoding="utf-8")

    # 输出指引
    print(f"✅ TDD 项目已初始化: {base}")
    print(f"   语言: {args.language} | 框架: {fw_name}")
    print(f"   安装: {fw['init'].replace('{project}', args.project_name)}")
    print(f"   测试: {example_test if fw['test_ext'] else '(inline)'}")
    print()
    print("   🔴 RED: 写一个失败测试")
    print("   🟢 GREEN: 写最小实现使测试通过")
    print("   🔵 REFACTOR: 在测试保护下重构")
