#!/usr/bin/env python3

import os
import sys
import json
from pathlib import Path
import warnings
from datetime import datetime, timezone
from urllib.parse import urlsplit

warnings.filterwarnings(
    "ignore",
    message="urllib3 v2 only supports OpenSSL 1.1.1+",
    category=Warning,
)

import oss2
from dotenv import dotenv_values

APP_NAME = "feedback-console-web"
DEFAULT_PREFIX = "console"
HTML_CACHE_HEADERS = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


def log(msg: str):
    print(msg)


def fail(msg: str):
    print(f"ERROR: {msg}")
    sys.exit(1)


def format_size(size_bytes: int) -> str:
    size = float(size_bytes)
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024
    return f"{size:.2f} TB"


def normalize_prefix(prefix: str) -> str:
    return prefix.strip().strip("/")


def parse_bool(value) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "on"}


def normalize_root_index_target(target: str) -> str:
    t = (target or "").strip()
    if not t:
        return "/console"
    if not t.startswith("/"):
        t = "/" + t

    return t


def append_cache_buster(target: str, version: str) -> str:
    if "deploy_v=" in target:
        return target

    path_and_query, sep, fragment = target.partition("#")
    query_sep = "&" if "?" in path_and_query else "?"
    return f"{path_and_query}{query_sep}deploy_v={version}{sep}{fragment}"


def build_root_index_html(target: str, app_shell_html: str) -> str:
    now_dt = datetime.now(timezone.utc)
    redirect_target = append_cache_buster(target, now_dt.strftime("%Y%m%d%H%M%S"))
    app_base_path = urlsplit(target).path.rstrip("/") or "/"
    redirect_json = json.dumps(redirect_target, ensure_ascii=False).replace("</", "<\\/")
    base_json = json.dumps(app_base_path, ensure_ascii=False).replace("</", "<\\/")
    guard = f"""<script>
      (function () {{
        var appBase = {base_json};
        var isAppRoute = location.pathname === appBase || location.pathname.indexOf(appBase + "/") === 0;
        if (!isAppRoute) location.replace({redirect_json});
      }})();
    </script>"""

    if "<head>" not in app_shell_html:
        fail("Built index.html does not contain <head>.")

    return app_shell_html.replace("<head>", f"<head>\n    {guard}", 1)


def load_config() -> dict:
    project_dir = Path(__file__).resolve().parent.parent
    dist_dir = project_dir / "dist"
    env_file = project_dir / ".env"

    if not env_file.exists():
        fail(f"Missing .env file: {env_file}")

    env = dotenv_values(env_file)

    access_key_id = (env.get("OSS_ACCESS_KEY_ID") or "").strip()
    access_key_secret = (env.get("OSS_ACCESS_KEY_SECRET") or "").strip()
    endpoint = (env.get("OSS_ENDPOINT") or "").strip()
    bucket_name = (env.get("OSS_BUCKET_NAME") or "").strip()
    custom_domain = (env.get("OSS_CUSTOM_DOMAIN") or "").strip()
    prefix = normalize_prefix((env.get("OSS_PREFIX") or DEFAULT_PREFIX))
    allow_root = parse_bool(env.get("ALLOW_ROOT_DEPLOY"))
    sync_root_index = parse_bool(env.get("SYNC_ROOT_INDEX"))
    root_index_target = normalize_root_index_target(env.get("ROOT_INDEX_TARGET") or "/console")

    if not all([access_key_id, access_key_secret, endpoint, bucket_name]):
        fail("Missing required OSS config in .env")

    if not dist_dir.exists() or not (dist_dir / "index.html").exists():
        fail(f"Missing build output: {dist_dir}/index.html")

    if not prefix and not allow_root:
        fail("OSS_PREFIX is empty. Set OSS_PREFIX or ALLOW_ROOT_DEPLOY=1.")

    return {
        "project_dir": project_dir,
        "dist_dir": dist_dir,
        "access_key_id": access_key_id,
        "access_key_secret": access_key_secret,
        "endpoint": endpoint,
        "bucket_name": bucket_name,
        "custom_domain": custom_domain,
        "prefix": prefix,
        "allow_root": allow_root,
        "sync_root_index": sync_root_index,
        "root_index_target": root_index_target,
    }


def clear_target(bucket: oss2.Bucket, prefix: str, allow_root: bool):
    if prefix:
        target = f"{prefix}/"
        log(f"Clearing OSS prefix: {target}")
        bucket.delete_object(prefix)
        log(f"  deleted alias if existed: {prefix}")
        iterator = oss2.ObjectIterator(bucket, prefix=target)
    else:
        if not allow_root:
            fail("Root deploy is blocked.")
        target = "(bucket root)"
        log(f"Clearing OSS target: {target}")
        iterator = oss2.ObjectIterator(bucket)

    deleted = 0
    for obj in iterator:
        bucket.delete_object(obj.key)
        deleted += 1
        log(f"  deleted: {obj.key}")

    log(f"Cleared objects: {deleted}")


def upload_dist(bucket: oss2.Bucket, dist_dir: Path, prefix: str):
    uploaded = 0
    total_size = 0
    prefix_path = f"{prefix}/" if prefix else ""

    for root, _, files in os.walk(dist_dir):
        for filename in files:
            local_file = Path(root) / filename
            relative = str(local_file.relative_to(dist_dir)).replace("\\", "/")
            object_key = f"{prefix_path}{relative}"
            size = local_file.stat().st_size

            headers = HTML_CACHE_HEADERS if relative.endswith(".html") else None

            bucket.put_object_from_file(object_key, str(local_file), headers=headers)
            uploaded += 1
            total_size += size
            log(f"  uploaded: {object_key} ({format_size(size)})")

    log(f"Uploaded files: {uploaded}")
    log(f"Uploaded size: {format_size(total_size)}")


def upload_spa_aliases(bucket: oss2.Bucket, dist_dir: Path, prefix: str):
    if not prefix:
        return

    index_file = dist_dir / "index.html"
    index_html = index_file.read_bytes()
    bucket.put_object(prefix, index_html, headers=HTML_CACHE_HEADERS)
    log(f"  uploaded SPA alias: {prefix} ({format_size(len(index_html))})")


def sync_root_index(bucket: oss2.Bucket, dist_dir: Path, target: str):
    app_shell_html = (dist_dir / "index.html").read_text(encoding="utf-8")
    html = build_root_index_html(target, app_shell_html).encode("utf-8")
    bucket.put_object(
        "index.html",
        html,
        headers=HTML_CACHE_HEADERS,
    )
    log(f"  synced root SPA fallback (deep links preserved; root -> {target}) ({format_size(len(html))})")


def build_access_url(custom_domain: str, endpoint: str, bucket_name: str, prefix: str) -> str:
    if custom_domain:
        base = custom_domain.rstrip("/")
        if not base.startswith("http://") and not base.startswith("https://"):
            base = f"https://{base}"
    else:
        endpoint_host = endpoint.replace("https://", "").replace("http://", "")
        base = f"https://{bucket_name}.{endpoint_host}"

    if prefix:
        return f"{base}/{prefix}"
    return f"{base}/"


def main():
    cfg = load_config()

    log(f"Deploying {APP_NAME}")
    log(f"project_dir: {cfg['project_dir']}")
    log(f"dist_dir: {cfg['dist_dir']}")
    log(f"bucket: {cfg['bucket_name']}")
    log(f"prefix: {cfg['prefix'] or '(root)'}")

    try:
        auth = oss2.Auth(cfg["access_key_id"], cfg["access_key_secret"])
        bucket = oss2.Bucket(auth, cfg["endpoint"], cfg["bucket_name"])
        bucket.get_bucket_info()
    except Exception as exc:
        fail(f"OSS connection failed: {exc}")

    clear_target(bucket, cfg["prefix"], cfg["allow_root"])
    upload_dist(bucket, cfg["dist_dir"], cfg["prefix"])
    upload_spa_aliases(bucket, cfg["dist_dir"], cfg["prefix"])
    if cfg["sync_root_index"]:
        sync_root_index(bucket, cfg["dist_dir"], cfg["root_index_target"])
    else:
        log("Root index sync skipped. Set SYNC_ROOT_INDEX=1 to enable.")

    access_url = build_access_url(
        cfg["custom_domain"],
        cfg["endpoint"],
        cfg["bucket_name"],
        cfg["prefix"],
    )
    log(f"Deploy finished: {access_url}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        fail("Interrupted by user")
