#!/usr/bin/env python3
"""
data_source.py — 数据源抽象层

为 prd-gen 提供统一的数据获取接口，解耦具体平台依赖。
支持两种数据源：
  - local: 从本地 JSON/Markdown 文件读取（默认，零外部依赖）
  - github: 通过 gh CLI 读取 GitHub Issues/Projects（可选，需安装 gh）

设计原则：
  - 默认零依赖（local 模式）
  - 所有外部依赖可选，缺失时降级而非报错
  - 统一接口，调用方无需关心具体数据源实现
  - 如需对接内部平台，在外部项目中继承 DataSource 基类实现即可
"""

import argparse
import json
import os
import subprocess
import sys
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


# ─── 时区工具 ──────────────────────────────────────────────

def get_local_tz():
    """获取系统本地时区，不硬编码任何特定时区"""
    return datetime.now().astimezone().tzinfo


CST = get_local_tz()


# ─── 数据源基类 ────────────────────────────────────────────

class DataSource(ABC):
    """数据源抽象基类，定义 prd-gen 所需的全部数据操作接口

    如需对接内部平台（如企业项目管理工具），在外部项目中继承此类并实现各接口即可，
    无需修改本文件。例如：

        from data_source import DataSource

        class MyPlatformDataSource(DataSource):
            @property
            def name(self): return "my-platform"
            ...
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """数据源名称"""
        ...

    @property
    def capabilities(self) -> Dict[str, bool]:
        """数据源能力声明，调用方可据此判断哪些操作可用"""
        return {
            "get_card": False,
            "search_cards": False,
            "get_project_schema": False,
            "get_repo_file": False,
            "write_back_card": False,
            "write_back_wiki": False,
        }

    @abstractmethod
    def get_card(self, card_id: str) -> Dict[str, Any]:
        """
        获取单张卡片详情

        Args:
            card_id: 卡片标识（格式由具体数据源定义）

        Returns:
            dict: 卡片数据，至少包含 title, content, type, priority, seq_num
                  获取失败返回空 dict
        """
        ...

    @abstractmethod
    def search_cards(self, project_id: str, queries: List[Dict],
                     fields: List[str], page_size: int = 50) -> List[Dict]:
        """
        搜索卡片（分页拉取全量）

        Args:
            project_id: 项目标识
            queries: 查询条件列表，格式: [{"type": "in", "field": "status", "values": [...]}]
            fields: 需要返回的字段列表
            page_size: 每页数量

        Returns:
            list: 卡片列表
        """
        ...

    @abstractmethod
    def get_project_schema(self, project_id: str) -> Dict[str, Any]:
        """
        获取项目 Schema（状态列表等元数据）

        Args:
            project_id: 项目标识

        Returns:
            dict: Schema 数据，至少包含 statusList
                  获取失败返回空 dict
        """
        ...

    @abstractmethod
    def get_repo_file(self, repo_key: str, file_path: str) -> Optional[str]:
        """
        读取代码仓库中的文件内容

        Args:
            repo_key: 仓库标识（格式由具体数据源定义）
            file_path: 文件路径（相对于仓库根目录）

        Returns:
            str: 文件内容，获取失败返回 None
        """
        ...

    def write_back(self, card_id: str, content: str,
                   output_target: str = "local",
                   prd_path: Optional[Path] = None,
                   **kwargs) -> Dict[str, Any]:
        """
        将生成内容写回指定目标

        Args:
            card_id: 卡片标识
            content: 要写入的内容
            output_target: 写入目标 (local|card_content|wiki)
            prd_path: PRD 文件路径（local 模式使用）
            **kwargs: 额外参数（如 doc_title 等）

        Returns:
            dict: {"ok": bool, "target": str, ...}
        """
        if output_target == "local":
            return {"ok": True, "target": "local", "path": str(prd_path) if prd_path else ""}
        return {"ok": False, "target": output_target, "error": f"数据源 {self.name} 不支持写入目标 {output_target}"}

    def load_user_config(self, user_id: str, config_dir: Optional[Path] = None) -> Dict[str, Any]:
        """
        加载用户配置

        Args:
            user_id: 用户标识
            config_dir: 配置文件目录（默认使用 SKILL_DIR/config/）

        Returns:
            dict: 用户配置数据
        """
        if config_dir is None:
            config_dir = Path(__file__).resolve().parents[1] / "config"
        config_path = config_dir / f"user_{user_id}.json"
        if config_path.exists():
            try:
                return json.loads(config_path.read_text(encoding="utf-8"))
            except Exception:
                pass
        return {}


# ─── Local 数据源 ──────────────────────────────────────────

class LocalDataSource(DataSource):
    """
    本地文件数据源 — 默认，零外部依赖

    数据组织方式：
      config/
        user_{user_id}.json         — 用户配置
      data/
        {project_id}/
          cards/
            {card_id}.json          — 单张卡片数据
          schema.json               — 项目 Schema
          overview.md               — 项目概览
        {repo_key}/
          {file_path}               — 仓库文件
    """

    def __init__(self, data_dir: Optional[Path] = None):
        if data_dir is None:
            self.data_dir = Path(__file__).resolve().parents[1] / "data"
        else:
            self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    @property
    def name(self) -> str:
        return "local"

    @property
    def capabilities(self) -> Dict[str, bool]:
        return {
            "get_card": True,
            "search_cards": True,
            "get_project_schema": True,
            "get_repo_file": True,
            "write_back_card": False,
            "write_back_wiki": False,
        }

    def get_card(self, card_id: str) -> Dict[str, Any]:
        for schema_dir in self.data_dir.glob("*/cards"):
            card_file = schema_dir / f"{card_id}.json"
            if card_file.exists():
                try:
                    data = json.loads(card_file.read_text(encoding="utf-8"))
                    return data.get("card", data)
                except Exception:
                    pass
        card_path = Path(card_id)
        if card_path.exists() and card_path.suffix == ".json":
            try:
                data = json.loads(card_path.read_text(encoding="utf-8"))
                return data.get("card", data)
            except Exception:
                pass
        return {}

    def search_cards(self, project_id: str, queries: List[Dict],
                     fields: List[str], page_size: int = 50) -> List[Dict]:
        project_dir = self.data_dir / project_id / "cards"
        if not project_dir.exists():
            return []
        items = []
        for card_file in sorted(project_dir.glob("*.json")):
            try:
                data = json.loads(card_file.read_text(encoding="utf-8"))
                card = data.get("card", data)
                match = True
                for q in queries:
                    field = q.get("field", "")
                    values = q.get("values", [])
                    card_val = str(card.get(field, ""))
                    if q.get("type") == "in" and card_val not in [str(v) for v in values]:
                        match = False
                        break
                if match:
                    if fields:
                        filtered = {f: card.get(f) for f in fields if f in card}
                        filtered["id"] = card.get("id", card_file.stem)
                        items.append(filtered)
                    else:
                        items.append(card)
            except Exception:
                continue
        return items

    def get_project_schema(self, project_id: str) -> Dict[str, Any]:
        schema_file = self.data_dir / project_id / "schema.json"
        if schema_file.exists():
            try:
                return json.loads(schema_file.read_text(encoding="utf-8"))
            except Exception:
                pass
        return {}

    def get_repo_file(self, repo_key: str, file_path: str) -> Optional[str]:
        repo_dir = self.data_dir / repo_key
        target = repo_dir / file_path
        if target.exists():
            try:
                return target.read_text(encoding="utf-8")
            except Exception:
                pass
        return None


# ─── GitHub 数据源（可选） ─────────────────────────────────

class GitHubDataSource(DataSource):
    """
    GitHub 数据源 — 可选，需安装 gh CLI

    将 GitHub Issues 映射为卡片，Projects 映射为项目。
    gh CLI 未安装时，所有操作降级返回空数据。
    """

    def __init__(self, repo: str = ""):
        self.repo = repo  # owner/repo 格式
        self._gh_available = self._check_gh()

    def _check_gh(self) -> bool:
        try:
            result = subprocess.run(
                ["which", "gh"], capture_output=True, text=True, timeout=5
            )
            return result.returncode == 0
        except Exception:
            return False

    @property
    def name(self) -> str:
        return "github"

    @property
    def capabilities(self) -> Dict[str, bool]:
        available = self._gh_available and bool(self.repo)
        return {
            "get_card": available,
            "search_cards": available,
            "get_project_schema": False,
            "get_repo_file": available,
            "write_back_card": False,
            "write_back_wiki": False,
        }

    def get_card(self, card_id: str) -> Dict[str, Any]:
        if not self._gh_available or not self.repo:
            return {}
        try:
            result = subprocess.run(
                ["gh", "issue", "view", card_id, "--repo", self.repo, "--json",
                 "title,body,labels,state,number"],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return {
                    "title": data.get("title", ""),
                    "content": data.get("body", ""),
                    "type": "issue",
                    "status": data.get("state", ""),
                    "seq_num": data.get("number", ""),
                    "labels": [l.get("name", "") for l in data.get("labels", [])],
                }
        except Exception:
            pass
        return {}

    def search_cards(self, project_id: str, queries: List[Dict],
                     fields: List[str], page_size: int = 50) -> List[Dict]:
        if not self._gh_available or not self.repo:
            return []
        try:
            search_parts = [f"repo:{self.repo}"]
            for q in queries:
                if q.get("type") == "in" and q.get("field") == "state":
                    values = q.get("values", [])
                    if any("closed" in str(v).lower() or "done" in str(v).lower() for v in values):
                        search_parts.append("is:closed")
                    else:
                        search_parts.append("is:open")
            search_query = " ".join(search_parts)
            result = subprocess.run(
                ["gh", "issue", "list", "--repo", self.repo, "--search", search_query,
                 "--limit", str(page_size), "--json", "title,number,state,labels"],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                items = json.loads(result.stdout)
                return [{
                    "title": i.get("title", ""),
                    "seq_num": i.get("number", ""),
                    "status": i.get("state", ""),
                    "type": "issue",
                    "priority": next((l.get("name", "") for l in i.get("labels", [])
                                     if "p" in l.get("name", "").lower()), ""),
                } for i in items]
        except Exception:
            pass
        return []

    def get_project_schema(self, project_id: str) -> Dict[str, Any]:
        return {}

    def get_repo_file(self, repo_key: str, file_path: str) -> Optional[str]:
        repo = repo_key or self.repo
        if not self._gh_available or not repo:
            return None
        try:
            result = subprocess.run(
                ["gh", "api", f"repos/{repo}/contents/{file_path}", "--jq", ".content"],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0 and result.stdout.strip():
                import base64
                return base64.b64decode(result.stdout.strip()).decode("utf-8", errors="replace")
        except Exception:
            pass
        return None


# ─── 数据源工厂 ────────────────────────────────────────────

def create_data_source(source_type: str = "local", **kwargs) -> DataSource:
    """
    创建数据源实例

    Args:
        source_type: 数据源类型 (local|github)
        **kwargs: 数据源特定参数
            - local: data_dir (Path)
            - github: repo (str, owner/repo 格式)

    Returns:
        DataSource 实例
    """
    if source_type == "github":
        return GitHubDataSource(repo=kwargs.get("repo", ""))
    else:
        return LocalDataSource(data_dir=kwargs.get("data_dir"))


# ─── CLI 入口（用于测试数据源连通性） ──────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="数据源连通性检测")
    parser.add_argument("--source", choices=["local", "github"],
                        default="local", help="数据源类型")
    parser.add_argument("--repo", default="", help="GitHub 仓库 (owner/repo)")
    parser.add_argument("--data-dir", default="", help="Local 数据目录")
    args = parser.parse_args()

    kwargs = {}
    if args.source == "github":
        kwargs["repo"] = args.repo
    elif args.source == "local" and args.data_dir:
        kwargs["data_dir"] = Path(args.data_dir)

    ds = create_data_source(args.source, **kwargs)
    result = {
        "source": ds.name,
        "capabilities": ds.capabilities,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
