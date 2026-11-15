#!/usr/bin/env python3

"""Publish immutable Feedback SDK releases and atomically promote OSS channels."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


RELEASE_ROOT = "sdk-releases"
CHANNEL_ROOT = "sdk-channels"
ROUTES = ("submit", "status", "chat")
SEMVER_RE = re.compile(
    r"^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)"
    r"(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$"
)
NAME_RE = re.compile(r"^[a-z][a-z0-9-]*$")

IMMUTABLE_HEADERS = {"Cache-Control": "public, max-age=31536000, immutable"}
NO_CACHE_HTML_HEADERS = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}
NO_CACHE_JSON_HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
}


def fail(message: str) -> None:
    raise SystemExit(f"ERROR: {message}")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def validate_version(version: str) -> str:
    value = version.strip()
    if not SEMVER_RE.fullmatch(value):
        fail(f"unsupported SDK version {version!r}; expected semantic version such as 2.1.0")
    return value


def validate_name(value: str, label: str) -> str:
    normalized = value.strip()
    if not NAME_RE.fullmatch(normalized):
        fail(f"invalid {label} {value!r}; use lowercase letters, digits, and hyphens")
    return normalized


def validate_alias_name(value: str) -> str:
    alias = validate_name(value, "alias")
    if alias != "sdk" and not alias.startswith("sdk-"):
        fail("SDK aliases must be named sdk or start with sdk-")
    return alias


def validate_force_upgrade_after(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip()
    try:
        parsed = datetime.fromisoformat(normalized.replace("Z", "+00:00"))
    except ValueError:
        fail("force-upgrade-after must be an ISO-8601 timestamp")
    if parsed.tzinfo is None:
        fail("force-upgrade-after must include a timezone offset")
    return normalized


def parse_contracts(raw: str) -> list[str]:
    contracts = sorted({item.strip() for item in raw.split(",") if item.strip()})
    if not contracts or any(not re.fullmatch(r"v[1-9][0-9]*", item) for item in contracts):
        fail("compatible contracts must be a comma-separated list such as v1,v2")
    return contracts


def parse_aliases(values: list[str]) -> dict[str, str]:
    aliases: dict[str, str] = {}
    for value in values:
        alias, separator, contract = value.partition(":")
        if not separator:
            fail(f"invalid alias mapping {value!r}; expected alias:contract")
        alias = validate_alias_name(alias)
        contract = contract.strip()
        if not re.fullmatch(r"v[1-9][0-9]*", contract):
            fail(f"invalid contract {contract!r} for alias {alias}")
        if alias in aliases:
            fail(f"duplicate alias {alias}")
        aliases[alias] = contract
    if not aliases:
        fail("at least one --alias alias:contract mapping is required")
    return aliases


def release_prefix(version: str) -> str:
    return f"{RELEASE_ROOT}/{validate_version(version)}"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def release_files(dist_dir: Path) -> list[Path]:
    files = [path for path in dist_dir.rglob("*") if path.is_file()]

    def priority(path: Path) -> tuple[int, str]:
        relative = path.relative_to(dist_dir).as_posix()
        if relative.startswith("assets/"):
            return 0, relative
        if relative == "index.html":
            return 2, relative
        return 1, relative

    return sorted(files, key=priority)


def build_release_manifest(
    dist_dir: Path,
    version: str,
    compatible_contracts: list[str],
    source_commit: str,
) -> dict[str, Any]:
    prefix = release_prefix(version)
    index_file = dist_dir / "index.html"
    if not index_file.is_file():
        fail(f"missing build output: {index_file}")
    index_text = index_file.read_text(encoding="utf-8")
    if f"/{prefix}/assets/" not in index_text:
        fail(f"dist/index.html was not built with VITE_PUBLIC_BASE=/{prefix}")

    file_records: dict[str, dict[str, Any]] = {}
    artifact_digest = hashlib.sha256()
    for path in release_files(dist_dir):
        relative = path.relative_to(dist_dir).as_posix()
        digest = sha256_file(path)
        size = path.stat().st_size
        file_records[relative] = {"sha256": digest, "size": size}
        artifact_digest.update(f"{relative}\0{digest}\0{size}\n".encode("utf-8"))

    # React Router deep links are real OSS objects. They contain the exact same
    # immutable HTML as index.html and are included in the release digest.
    index_record = file_records["index.html"]
    spa_aliases: dict[str, dict[str, Any]] = {}
    for route in ROUTES:
        spa_aliases[route] = dict(index_record)
        artifact_digest.update(
            f"{route}\0{index_record['sha256']}\0{index_record['size']}\n".encode("utf-8")
        )

    return {
        "schema_version": "feedback-sdk-release/v1",
        "version": validate_version(version),
        "release_path": f"/{prefix}",
        "compatible_contracts": compatible_contracts,
        "source_commit": source_commit.strip(),
        "artifact_sha256": artifact_digest.hexdigest(),
        "files": file_records,
        "spa_aliases": spa_aliases,
        "published_at": utc_now(),
    }


def build_channel_manifest(
    channel: str,
    release_manifest: dict[str, Any],
    aliases: dict[str, str],
    minimum_version: str,
    force_upgrade_after: str | None,
) -> dict[str, Any]:
    channel = validate_name(channel, "channel")
    minimum_version = validate_version(minimum_version)
    compatible = set(release_manifest.get("compatible_contracts") or [])
    unsupported = sorted({contract for contract in aliases.values() if contract not in compatible})
    if unsupported:
        fail(
            f"release {release_manifest.get('version')} does not support alias contracts: "
            + ", ".join(unsupported)
        )

    release_path = str(release_manifest["release_path"])
    return {
        "schema_version": "feedback-sdk-channel/v1",
        "channel": channel,
        "recommended_version": release_manifest["version"],
        "minimum_version": minimum_version,
        "force_upgrade_after": validate_force_upgrade_after(force_upgrade_after),
        "release_path": release_path,
        "artifact_sha256": release_manifest["artifact_sha256"],
        "aliases": {
            alias: {"contract": contract, "release_path": release_path}
            for alias, contract in sorted(aliases.items())
        },
        "promoted_at": utc_now(),
    }


def validate_remote_release_manifest(manifest: dict[str, Any], expected_version: str) -> None:
    expected_version = validate_version(expected_version)
    expected_path = f"/{release_prefix(expected_version)}"
    if manifest.get("schema_version") != "feedback-sdk-release/v1":
        fail("remote release has an unsupported manifest schema")
    if manifest.get("version") != expected_version or manifest.get("release_path") != expected_path:
        fail("remote release manifest does not match the requested version")
    if not re.fullmatch(r"[0-9a-f]{64}", str(manifest.get("artifact_sha256") or "")):
        fail("remote release manifest has an invalid artifact digest")
    contracts = manifest.get("compatible_contracts")
    if not isinstance(contracts, list) or any(not isinstance(item, str) for item in contracts):
        fail("remote release manifest has invalid compatible contracts")
    parse_contracts(",".join(contracts))
    spa_aliases = manifest.get("spa_aliases")
    if not isinstance(spa_aliases, dict) or set(spa_aliases) != set(ROUTES):
        fail("remote release manifest has invalid SPA aliases")
    for record in spa_aliases.values():
        if not isinstance(record, dict) or not re.fullmatch(
            r"[0-9a-f]{64}", str(record.get("sha256") or "")
        ) or not isinstance(record.get("size"), int):
            fail("remote release manifest has invalid SPA alias metadata")


def build_alias_loader(alias: str, channel: str, route: str, fallback_release_path: str) -> bytes:
    alias = validate_alias_name(alias)
    channel = validate_name(channel, "channel")
    if route not in {"index.html", *ROUTES}:
        fail(f"unsupported SDK route {route}")
    target_suffix = "/index.html" if route == "index.html" else f"/{route}"
    channel_url = f"/{CHANNEL_ROOT}/{channel}.json"
    fallback = fallback_release_path.rstrip("/")
    alias_json = json.dumps(alias)
    channel_url_json = json.dumps(channel_url)
    suffix_json = json.dumps(target_suffix)
    fallback_json = json.dumps(fallback)
    html = f"""<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate" />
    <title>Feedback SDK</title>
  </head>
  <body>
    <p id="status">正在加载反馈组件…</p>
    <script>
      (() => {{
        const alias = {alias_json};
        const suffix = {suffix_json};
        const fallback = {fallback_json};
        const forward = (base) => location.replace(base.replace(/\/$/, '') + suffix + location.search + location.hash);
        fetch({channel_url_json}, {{ cache: 'no-store', credentials: 'omit' }})
          .then((response) => {{ if (!response.ok) throw new Error('channel ' + response.status); return response.json(); }})
          .then((manifest) => {{
            const target = manifest && manifest.aliases && manifest.aliases[alias];
            if (!target || typeof target.release_path !== 'string' || !target.release_path.startsWith('/sdk-releases/')) throw new Error('alias missing');
            forward(target.release_path);
          }})
          .catch(() => forward(fallback));
      }})();
    </script>
  </body>
</html>
"""
    return html.encode("utf-8")


def load_oss_config(env_file: Path) -> dict[str, str]:
    try:
        from dotenv import dotenv_values
    except ImportError:
        fail("python-dotenv is required; install it before publishing")

    if not env_file.is_file():
        fail(f"missing OSS environment file: {env_file}")
    env = dotenv_values(env_file)
    config = {
        "access_key_id": (env.get("OSS_ACCESS_KEY_ID") or "").strip(),
        "access_key_secret": (env.get("OSS_ACCESS_KEY_SECRET") or "").strip(),
        "endpoint": (env.get("OSS_ENDPOINT") or "").strip(),
        "bucket_name": (env.get("OSS_BUCKET_NAME") or "").strip(),
        "custom_domain": (env.get("OSS_CUSTOM_DOMAIN") or "").strip().rstrip("/"),
    }
    if not all(config[key] for key in ("access_key_id", "access_key_secret", "endpoint", "bucket_name")):
        fail(f"incomplete OSS configuration in {env_file}")
    return config


def connect_bucket(config: dict[str, str]):
    try:
        import oss2
    except ImportError:
        fail("oss2 is required; install it before publishing")
    bucket = oss2.Bucket(
        oss2.Auth(config["access_key_id"], config["access_key_secret"]),
        config["endpoint"],
        config["bucket_name"],
    )
    bucket.get_bucket_info()
    return bucket


def read_json_object(bucket, key: str) -> dict[str, Any] | None:
    if not bucket.object_exists(key):
        return None
    return json.loads(bucket.get_object(key).read().decode("utf-8"))


def put_json(bucket, key: str, payload: dict[str, Any], headers: dict[str, str]) -> None:
    body = (json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")
    bucket.put_object(key, body, headers=headers)
    print(f"uploaded: {key}")


def publish_release(args: argparse.Namespace) -> None:
    version = validate_version(args.version)
    contracts = parse_contracts(args.compatible_contracts)
    dist_dir = Path(args.dist_dir).resolve()
    manifest = build_release_manifest(dist_dir, version, contracts, args.source_commit)
    config = load_oss_config(Path(args.env_file).resolve())
    bucket = connect_bucket(config)
    prefix = release_prefix(version)
    manifest_key = f"{prefix}/release.json"
    existing = read_json_object(bucket, manifest_key)
    if existing:
        immutable_fields = (
            "artifact_sha256",
            "compatible_contracts",
            "source_commit",
            "release_path",
            "spa_aliases",
        )
        if any(existing.get(field) != manifest.get(field) for field in immutable_fields):
            fail(f"immutable release {version} already exists with different contents or metadata")
        print(f"release already exists unchanged: {config['bucket_name']}/{prefix}")
        return

    for path in release_files(dist_dir):
        relative = path.relative_to(dist_dir).as_posix()
        headers = dict(IMMUTABLE_HEADERS)
        if path.suffix == ".html":
            headers["Content-Type"] = "text/html; charset=utf-8"
        bucket.put_object_from_file(f"{prefix}/{relative}", str(path), headers=headers)
        print(f"uploaded: {prefix}/{relative}")
    index_html = (dist_dir / "index.html").read_bytes()
    for route in ROUTES:
        bucket.put_object(
            f"{prefix}/{route}",
            index_html,
            headers={**IMMUTABLE_HEADERS, "Content-Type": "text/html; charset=utf-8"},
        )
        print(f"uploaded immutable SPA route: {prefix}/{route}")
    put_json(bucket, manifest_key, manifest, {**IMMUTABLE_HEADERS, "Content-Type": "application/json; charset=utf-8"})
    print(f"published immutable release {version} to {config['bucket_name']}")


def promote_channel(args: argparse.Namespace) -> None:
    version = validate_version(args.version)
    channel = validate_name(args.channel, "channel")
    expected_confirmation = f"{channel}:{version}"
    if args.confirm_promote != expected_confirmation:
        fail(f"promotion requires --confirm-promote {expected_confirmation}")
    aliases = parse_aliases(args.alias)
    config = load_oss_config(Path(args.env_file).resolve())
    bucket = connect_bucket(config)
    release_manifest = read_json_object(bucket, f"{release_prefix(version)}/release.json")
    if not release_manifest:
        fail(f"release {version} is not published in bucket {config['bucket_name']}")
    validate_remote_release_manifest(release_manifest, version)
    channel_manifest = build_channel_manifest(
        channel,
        release_manifest,
        aliases,
        args.minimum_version or version,
        args.force_upgrade_after,
    )
    channel_key = f"{CHANNEL_ROOT}/{channel}.json"
    existing_channel = read_json_object(bucket, channel_key)

    def upload_loaders() -> None:
        for alias in aliases:
            for route in ROUTES:
                bucket.put_object(
                    f"{alias}/{route}",
                    build_alias_loader(alias, channel, route, release_manifest["release_path"]),
                    headers=NO_CACHE_HTML_HEADERS,
                )
                print(f"uploaded channel loader: {alias}/{route}")
            index_loader = build_alias_loader(alias, channel, "index.html", release_manifest["release_path"])
            bucket.put_object(f"{alias}/index.html", index_loader, headers=NO_CACHE_HTML_HEADERS)
            bucket.put_object(alias, index_loader, headers=NO_CACHE_HTML_HEADERS)
            print(f"uploaded channel loaders: {alias}/index.html and {alias}")

    # First installation publishes a valid channel before replacing a legacy alias.
    # Later promotions refresh the stable loaders first, then switch one JSON object.
    if existing_channel is None:
        put_json(bucket, channel_key, channel_manifest, NO_CACHE_JSON_HEADERS)
        upload_loaders()
    else:
        upload_loaders()
        put_json(bucket, channel_key, channel_manifest, NO_CACHE_JSON_HEADERS)
    print(f"promoted {channel} -> {version} in {config['bucket_name']}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    publish = subparsers.add_parser("publish", help="upload one immutable SDK release")
    publish.add_argument("--version", required=True)
    publish.add_argument("--dist-dir", required=True)
    publish.add_argument("--env-file", required=True)
    publish.add_argument("--compatible-contracts", default="v1,v2")
    publish.add_argument("--source-commit", default="")
    publish.set_defaults(handler=publish_release)

    promote = subparsers.add_parser("promote", help="point a channel and its aliases at a release")
    promote.add_argument("--version", required=True)
    promote.add_argument("--channel", required=True)
    promote.add_argument("--env-file", required=True)
    promote.add_argument("--alias", action="append", default=[])
    promote.add_argument("--minimum-version")
    promote.add_argument("--force-upgrade-after")
    promote.add_argument("--confirm-promote")
    promote.set_defaults(handler=promote_channel)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.handler(args)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("Interrupted")
