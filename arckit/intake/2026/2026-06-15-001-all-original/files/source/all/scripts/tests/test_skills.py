#!/usr/bin/env python3
"""
Skill 体系核心脚本单元测试

覆盖：route_tool / check_yagni / check_flattery / check_prerequisite / validate_handoff
"""

import sys
import json
import tempfile
from pathlib import Path

# 将脚本目录加入 path
SCRIPTS_DIR = Path(__file__).parent.parent
PROJECT_DIR = SCRIPTS_DIR.parent
sys.path.insert(0, str(SCRIPTS_DIR))
# 添加各 Skill 脚本目录
sys.path.insert(0, str(PROJECT_DIR / "01-pm" / "decide" / "scripts"))
sys.path.insert(0, str(PROJECT_DIR / "05-lead" / "review" / "scripts"))

# ─── route_tool 测试 ─────────────────────────────────────

def test_route_import():
    """route_tool 可导入"""
    import route_tool
    assert hasattr(route_tool, "route")

def test_route_first_principles():
    """'全新领域'类问题路由到第一性原理"""
    import route_tool
    result = route_tool.route("我们要进入一个全新赛道，从零开始做AI助手")
    assert result["tool"] == "first-principles"

def test_route_value_assessment():
    """'值不值得做'类问题路由到产品价值评估"""
    import route_tool
    result = route_tool.route("这个需求值不值得做？有多个候选方案")
    assert result["tool"] == "value-assessment"

def test_route_socratic():
    """'拷问方案'类问题路由到苏格拉底追问"""
    import route_tool
    result = route_tool.route("帮我拷问一下这个方案的逻辑，看看有没有漏洞")
    assert result["tool"] == "socratic"

def test_route_returns_dict():
    """route 返回包含 tool 和 label 的字典"""
    import route_tool
    result = route_tool.route("随便一个问题")
    assert "tool" in result
    assert "label" in result


# ─── check_yagni 测试 ────────────────────────────────────

def test_yagni_import():
    """check_yagni 可导入"""
    import check_yagni
    assert hasattr(check_yagni, "check_yagni")

def test_yagni_no_violation():
    """正常代码无 YAGNI 违规"""
    import check_yagni
    diff = "+def hello():\n+    return 'world'\n"
    result = check_yagni.check_yagni(diff)
    assert result == []

def test_yagni_future_proof():
    """'future-proof' 触发 YAGNI 违规"""
    import check_yagni
    diff = "+def process(data):\n+    # future-proof implementation\n+    pass\n"
    result = check_yagni.check_yagni(diff)
    assert len(result) > 0

def test_yagni_only_additions():
    """只检查新增行（+开头），不检查删除行"""
    import check_yagni
    diff = "-def old():\n-    # future-proof old code\n+def new():\n+    pass\n"
    result = check_yagni.check_yagni(diff)
    assert result == []


# ─── check_flattery 测试 ─────────────────────────────────

def test_flattery_import():
    """check_flattery 可导入"""
    import check_flattery
    assert hasattr(check_flattery, "check")

def test_flattery_no_violation():
    """技术性审查意见无谄媚"""
    import check_flattery
    text = "This function has a bug on line 42. The null check is missing."
    result = check_flattery.check(text)
    assert result == []

def test_flattery_detects_lgtm():
    """'LGTM' 触发谄媚检测"""
    import check_flattery
    text = "LGTM, ship it!"
    result = check_flattery.check(text)
    assert len(result) > 0

def test_flattery_detects_emoji():
    """表情符号触发谄媚检测"""
    import check_flattery
    text = "Looks good 👍"
    result = check_flattery.check(text)
    assert len(result) > 0


# ─── check_prerequisite 增强检测测试 ─────────────────────

def test_prerequisite_import():
    """check_prerequisite 可导入"""
    import check_prerequisite
    assert hasattr(check_prerequisite, "check_prerequisite")
    assert hasattr(check_prerequisite, "CONTENT_CHECKS")

def test_prerequisite_insight_with_operate():
    """insight 有 operate 作为上游增强（闭环）"""
    import check_prerequisite
    assert "operate" in [p["skill"] for p in check_prerequisite.PREREQUISITES["insight"]["upstream"]]

def test_prerequisite_content_checks_count():
    """CONTENT_CHECKS 覆盖全部 11 个衔接点"""
    import check_prerequisite
    assert len(check_prerequisite.CONTENT_CHECKS) == 11

def test_prerequisite_all_skills_independent():
    """所有Skill在空目录下均可独立运行（ok=True）"""
    import check_prerequisite
    with tempfile.TemporaryDirectory() as tmpdir:
        for skill_name in check_prerequisite.PREREQUISITES:
            result = check_prerequisite.check_prerequisite(skill_name, tmpdir)
            assert result["ok"], f"{skill_name} should be independently runnable, got: {result['verdict']}"

def test_prerequisite_quality_warnings_on_missing():
    """缺失上游交付物时，quality_warnings 有内容"""
    import check_prerequisite
    with tempfile.TemporaryDirectory() as tmpdir:
        # design 缺少 PRD 时应有质量警告
        result = check_prerequisite.check_prerequisite("design", tmpdir)
        assert result["ok"]  # 可独立运行
        assert len(result["quality_warnings"]) > 0  # 但有质量影响提示

def test_prerequisite_content_check_pass():
    """内容契约校验通过场景"""
    import check_prerequisite
    # PRD 包含验收标准 → 契约通过
    ok = check_prerequisite._check_prdgen_to_design("## 验收标准\n- [ ] 用户可以注册")
    assert ok

def test_prerequisite_content_check_fail():
    """内容契约校验失败场景"""
    import check_prerequisite
    # PRD 不包含验收标准 → 契约失败
    ok = check_prerequisite._check_prdgen_to_design("# 标题\n## 背景\n一些背景描述")
    assert not ok

def test_prerequisite_fallback_defined():
    """所有上游增强项都有 fallback 降级方式"""
    import check_prerequisite
    for skill_name, prereqs in check_prerequisite.PREREQUISITES.items():
        for prereq in prereqs["upstream"]:
            assert "fallback" in prereq and prereq["fallback"], \
                f"{skill_name}←{prereq['skill']} missing fallback"
            assert "quality_impact" in prereq and prereq["quality_impact"], \
                f"{skill_name}←{prereq['skill']} missing quality_impact"


# ─── detect_enhancement 增强注入测试 ─────────────────────

def test_detect_enhancement_import():
    """detect_enhancement 可导入"""
    import check_prerequisite
    assert hasattr(check_prerequisite, "detect_enhancement")
    assert hasattr(check_prerequisite, "ENHANCEMENT_SPECS")

def test_detect_enhancement_empty_dir():
    """空目录下增强不可用，但返回结构完整"""
    import check_prerequisite
    with tempfile.TemporaryDirectory() as tmpdir:
        result = check_prerequisite.detect_enhancement("build", tmpdir)
        assert result["available_count"] == 0
        assert result["total_count"] == 2  # model + arch
        assert len(result["enhancements"]) == 2
        # 每个增强项都有 extract_fields 和 inject_to
        for e in result["enhancements"]:
            assert "extract_fields" in e
            assert "inject_to" in e
            assert "effect" in e
            assert "fallback" in e

def test_detect_enhancement_all_skills():
    """所有Skill的detect_enhancement在空目录下均可运行"""
    import check_prerequisite
    with tempfile.TemporaryDirectory() as tmpdir:
        for skill_name in check_prerequisite.PREREQUISITES:
            result = check_prerequisite.detect_enhancement(skill_name, tmpdir)
            assert "enhancements" in result
            assert "summary" in result

def test_enhancement_specs_coverage():
    """ENHANCEMENT_SPECS 覆盖所有衔接点"""
    import check_prerequisite
    # 每个 PREREQUISITES 中的上游关系都应有对应的 ENHANCEMENT_SPEC
    for skill_name, prereqs in check_prerequisite.PREREQUISITES.items():
        for prereq in prereqs["upstream"]:
            key = (prereq["skill"], skill_name)
            assert key in check_prerequisite.ENHANCEMENT_SPECS, \
                f"ENHANCEMENT_SPECS missing {key}"


# ─── validate_handoff 测试 ───────────────────────────────

def test_handoff_import():
    """validate_handoff 可导入"""
    import validate_handoff
    assert hasattr(validate_handoff, "validate_chain")

def test_handoff_empty_dir_independent():
    """空目录下全链路仍可独立运行（ok=True，quality_level=空）"""
    import validate_handoff
    with tempfile.TemporaryDirectory() as tmpdir:
        result = validate_handoff.validate_chain(tmpdir)
        assert result["ok"]  # 永远 True，衔接是增强不是阻断
        assert result["quality_level"] == "空"
        assert result["total"] == 11
        assert result["enhanced"] == 0


if __name__ == "__main__":
    # 简易运行器（无 pytest 依赖时可用）
    import importlib
    failures = []
    current_module = sys.modules[__name__]
    test_funcs = [v for k, v in vars(current_module).items() if k.startswith("test_")]
    for func in test_funcs:
        try:
            func()
            print(f"  ✅ {func.__name__}")
        except Exception as e:
            failures.append(func.__name__)
            print(f"  ❌ {func.__name__}: {e}")
    print(f"\n通过: {len(test_funcs) - len(failures)}/{len(test_funcs)}")
    sys.exit(1 if failures else 0)
