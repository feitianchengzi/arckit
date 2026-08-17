#!/usr/bin/env python3

import argparse
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

DEFAULT_KEEP_PREFIXES = ["console", "sdk"]


def fail(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)


def info(msg):
    print(msg)


def normalize_prefix(prefix):
    return prefix.strip().strip("/")


def parse_keep_prefixes(raw):
    if raw is None:
        return DEFAULT_KEEP_PREFIXES
    parts = [normalize_prefix(item) for item in raw.split(",")]
    return [item for item in parts if item]


def is_protected_key(key, keep_prefixes):
    for prefix in keep_prefixes:
        if key == prefix or key.startswith(f"{prefix}/"):
            return True
    return False


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

    if not all([access_key_id, access_key_secret, endpoint, bucket_name]):
        fail("Missing required OSS config in .env")

    return {
        "project_dir": project_dir,
        "access_key_id": access_key_id,
        "access_key_secret": access_key_secret,
        "endpoint": endpoint,
        "bucket_name": bucket_name,
    }


def connect_bucket(cfg):
    try:
        auth = oss2.Auth(cfg["access_key_id"], cfg["access_key_secret"])
        bucket = oss2.Bucket(auth, cfg["endpoint"], cfg["bucket_name"])
        bucket.get_bucket_info()
        return bucket
    except Exception as exc:
        fail(f"OSS connection failed: {exc}")


def collect_delete_candidates(bucket, keep_prefixes):
    to_delete = []
    protected = []

    for obj in oss2.ObjectIterator(bucket):
        key = obj.key
        if is_protected_key(key, keep_prefixes):
            protected.append(key)
        else:
            to_delete.append(key)

    return to_delete, protected


def main():
    parser = argparse.ArgumentParser(
        description="Cleanup legacy bucket root objects while keeping selected prefixes."
    )
    parser.add_argument(
        "--keep-prefixes",
        default=None,
        help="Comma-separated prefixes to keep. Default: console,sdk",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually delete objects. Default is dry-run.",
    )
    parser.add_argument(
        "--confirm-root-cleanup",
        action="store_true",
        help="Safety confirmation flag required together with --execute.",
    )
    parser.add_argument(
        "--show-limit",
        type=int,
        default=30,
        help="Max number of keys to print for preview.",
    )

    args = parser.parse_args()
    keep_prefixes = parse_keep_prefixes(args.keep_prefixes)

    cfg = load_config()
    info("== cleanup bucket root (safe mode) ==")
    info(f"project: {cfg['project_dir']}")
    info(f"bucket: {cfg['bucket_name']}")
    info(f"keep prefixes: {', '.join(keep_prefixes) if keep_prefixes else '(none)'}")

    bucket = connect_bucket(cfg)
    to_delete, protected = collect_delete_candidates(bucket, keep_prefixes)

    info(f"total objects: {len(to_delete) + len(protected)}")
    info(f"protected objects: {len(protected)}")
    info(f"delete candidates: {len(to_delete)}")

    show_limit = max(0, args.show_limit)
    if to_delete:
        info("preview delete keys:")
        for key in to_delete[:show_limit]:
            info(f"  - {key}")
        if len(to_delete) > show_limit:
            info(f"  ... and {len(to_delete) - show_limit} more")

    if not args.execute:
        info("dry-run only. pass --execute --confirm-root-cleanup to apply.")
        return

    if not args.confirm_root_cleanup:
        fail("Missing confirmation: add --confirm-root-cleanup with --execute.")

    deleted = 0
    failed = 0
    for key in to_delete:
        try:
            bucket.delete_object(key)
            deleted += 1
        except Exception as exc:
            failed += 1
            info(f"delete failed: {key} ({exc})")

    info(f"cleanup finished. deleted={deleted}, failed={failed}")
    if failed > 0:
        sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        fail("Interrupted by user")
