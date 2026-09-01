#!/usr/bin/env python3

import argparse
import json
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

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


def build_root_index_html(target, app_shell_html):
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
    dist_index = cfg["project_dir"] / "dist" / "index.html"
    if not dist_index.exists():
        fail(f"Missing build output: {dist_index}")
    html = build_root_index_html(target, dist_index.read_text(encoding="utf-8"))

    info("== publish root SPA fallback ==")
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
