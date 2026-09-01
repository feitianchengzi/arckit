#!/usr/bin/env python3

"""Non-destructive isolated deployment for the feedback SDK V2."""

import os
import sys
from pathlib import Path
import warnings

warnings.filterwarnings(
    "ignore",
    message="urllib3 v2 only supports OpenSSL 1.1.1+",
    category=Warning,
)

import oss2
from dotenv import dotenv_values

APP_NAME = "feedback-sdk-web V2"
V2_PREFIX = "sdk-v2"
HTML_CACHE_HEADERS = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


def fail(message: str):
    print(f"ERROR: {message}")
    sys.exit(1)


def format_size(size_bytes: int) -> str:
    size = float(size_bytes)
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024
    return f"{size:.2f} TB"


def build_access_url(custom_domain: str, endpoint: str, bucket_name: str) -> str:
    if custom_domain:
        base = custom_domain.rstrip("/")
        if not base.startswith(("http://", "https://")):
            base = f"https://{base}"
    else:
        endpoint_host = endpoint.replace("https://", "").replace("http://", "")
        base = f"https://{bucket_name}.{endpoint_host}"
    return f"{base}/{V2_PREFIX}/index.html?embed=web"


def load_config() -> dict:
    project_dir = Path(__file__).resolve().parent.parent
    dist_dir = project_dir / "dist"
    env_file = project_dir / ".env"
    if not env_file.exists():
        fail(f"Missing .env file: {env_file}")
    if not (dist_dir / "index.html").exists():
        fail(f"Missing build output: {dist_dir}/index.html")

    env = dotenv_values(env_file)
    required = {
        "access_key_id": (env.get("OSS_ACCESS_KEY_ID") or "").strip(),
        "access_key_secret": (env.get("OSS_ACCESS_KEY_SECRET") or "").strip(),
        "endpoint": (env.get("OSS_ENDPOINT") or "").strip(),
        "bucket_name": (env.get("OSS_BUCKET_NAME") or "").strip(),
    }
    if not all(required.values()):
        fail("Missing required OSS config in .env")

    index_html = (dist_dir / "index.html").read_text(encoding="utf-8")
    if f"/{V2_PREFIX}/assets/" not in index_html:
        fail(
            f"dist/index.html is not a {V2_PREFIX} build. "
            f"Run with VITE_PUBLIC_BASE=/{V2_PREFIX}."
        )

    return {
        "project_dir": project_dir,
        "dist_dir": dist_dir,
        "custom_domain": (env.get("OSS_CUSTOM_DOMAIN") or "").strip(),
        **required,
    }


def list_dist_files(dist_dir: Path) -> list[Path]:
    return sorted(path for path in dist_dir.rglob("*") if path.is_file())


def upload_file(bucket: oss2.Bucket, dist_dir: Path, local_file: Path):
    relative = local_file.relative_to(dist_dir).as_posix()
    object_key = f"{V2_PREFIX}/{relative}"
    headers = HTML_CACHE_HEADERS if relative.endswith(".html") else None
    bucket.put_object_from_file(object_key, str(local_file), headers=headers)
    print(f"  uploaded: {object_key} ({format_size(local_file.stat().st_size)})")


def upload_dist_non_destructively(bucket: oss2.Bucket, dist_dir: Path):
    files = list_dist_files(dist_dir)
    static_files = [path for path in files if path.suffix.lower() != ".html"]
    html_files = [path for path in files if path.suffix.lower() == ".html"]

    # New immutable assets arrive first; the HTML entry is published only after
    # every referenced asset is available. Deliberately do not delete stale V2
    # objects: they can still be referenced by clients with cached HTML.
    for local_file in [*static_files, *html_files]:
        upload_file(bucket, dist_dir, local_file)

    index_html = (dist_dir / "index.html").read_bytes()
    for object_key in [V2_PREFIX, f"{V2_PREFIX}/submit", f"{V2_PREFIX}/status"]:
        bucket.put_object(object_key, index_html, headers=HTML_CACHE_HEADERS)
        print(f"  uploaded SPA alias: {object_key} ({format_size(len(index_html))})")


def main():
    cfg = load_config()
    print(f"Deploying {APP_NAME}")
    print(f"dist_dir: {cfg['dist_dir']}")
    print(f"bucket: {cfg['bucket_name']}")
    print(f"prefix: {V2_PREFIX} (fixed, isolated)")
    print("safety: no delete operations; root index and /sdk are untouched")

    try:
        auth = oss2.Auth(cfg["access_key_id"], cfg["access_key_secret"])
        bucket = oss2.Bucket(auth, cfg["endpoint"], cfg["bucket_name"])
        bucket.get_bucket_info()
    except Exception as exc:
        fail(f"OSS connection failed: {exc}")

    upload_dist_non_destructively(bucket, cfg["dist_dir"])
    print(f"Deploy finished: {build_access_url(cfg['custom_domain'], cfg['endpoint'], cfg['bucket_name'])}")


if __name__ == "__main__":
    main()
