#!/usr/bin/env python3

import argparse
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path

warnings.filterwarnings(
    "ignore",
    message="urllib3 v2 only supports OpenSSL 1.1.1+",
    category=Warning,
)

import oss2
from dotenv import dotenv_values

HTML_CACHE_HEADERS = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


def fail(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)


def info(msg):
    print(msg)


def normalize_target(target):
    t = (target or "").strip()
    if not t:
        return "/console"
    if not t.startswith("/"):
        t = "/" + t

    return t


def append_cache_buster(target, version):
    if "deploy_v=" in target:
        return target

    path_and_query, sep, fragment = target.partition("#")
    query_sep = "&" if "?" in path_and_query else "?"
    return f"{path_and_query}{query_sep}deploy_v={version}{sep}{fragment}"


def build_root_index_html(target):
    now_dt = datetime.now(timezone.utc)
    now = now_dt.strftime("%Y-%m-%d %H:%M:%S UTC")
    target = append_cache_buster(target, now_dt.strftime("%Y%m%d%H%M%S"))
    escaped = target.replace('"', "&quot;")
    return f"""<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="pragma" content="no-cache" />
    <meta http-equiv="expires" content="0" />
    <title>Feedback Console Redirect</title>
    <script>
      location.replace("{escaped}");
    </script>
  </head>
  <body>
    <noscript>
      <p>正在跳转到控制台… <a href="{escaped}">点击进入</a></p>
    </noscript>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #666;">
      Redirecting to <a href="{escaped}">{escaped}</a>
    </p>
    <!-- generated at {now} -->
  </body>
</html>
"""


def load_config():
    project_dir = Path(__file__).resolve().parent.parent
    env_file = project_dir / ".env"
    if not env_file.exists():
        fail(f"Missing .env file: {env_file}")

    env = dotenv_values(env_file)
    access_key_id = (env.get("OSS_ACCESS_KEY_ID") or "").strip()
    access_key_secret = (env.get("OSS_ACCESS_KEY_SECRET") or "").strip()
    endpoint = (env.get("OSS_ENDPOINT") or "").strip()
    bucket_name = (env.get("OSS_BUCKET_NAME") or "").strip()
    default_target = (env.get("ROOT_INDEX_TARGET") or "").strip()

    if not all([access_key_id, access_key_secret, endpoint, bucket_name]):
        fail("Missing required OSS config in .env")

    return {
        "project_dir": project_dir,
        "access_key_id": access_key_id,
        "access_key_secret": access_key_secret,
        "endpoint": endpoint,
        "bucket_name": bucket_name,
        "default_target": default_target,
    }


def connect_bucket(cfg):
    try:
        auth = oss2.Auth(cfg["access_key_id"], cfg["access_key_secret"])
        bucket = oss2.Bucket(auth, cfg["endpoint"], cfg["bucket_name"])
        bucket.get_bucket_info()
        return bucket
    except Exception as exc:
        fail(f"OSS connection failed: {exc}")


def main():
    parser = argparse.ArgumentParser(description="Publish a root index.html redirect in OSS bucket.")
    parser.add_argument("--target", default="", help="Redirect target path. Example: /console")
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually upload to OSS. Default is dry-run.",
    )
    args = parser.parse_args()

    cfg = load_config()
    target = normalize_target(args.target or cfg["default_target"] or "/console")
    html = build_root_index_html(target)

    info("== publish root index redirect ==")
    info(f"project: {cfg['project_dir']}")
    info(f"bucket: {cfg['bucket_name']}")
    info(f"target: {target}")
    info("object key: index.html")

    if not args.execute:
        info("dry-run only. pass --execute to upload.")
        return

    bucket = connect_bucket(cfg)
    try:
        bucket.put_object(
            "index.html",
            html.encode("utf-8"),
            headers=HTML_CACHE_HEADERS,
        )
    except Exception as exc:
        fail(f"Upload failed: {exc}")

    info("Upload success: index.html")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        fail("Interrupted by user")
