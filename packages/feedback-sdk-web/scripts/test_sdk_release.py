import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("sdk_release.py")
SPEC = importlib.util.spec_from_file_location("sdk_release", MODULE_PATH)
sdk_release = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(sdk_release)

CLEANUP_MODULE_PATH = Path(__file__).with_name("cleanup-bucket-root.py")
CLEANUP_SPEC = importlib.util.spec_from_file_location("cleanup_bucket_root", CLEANUP_MODULE_PATH)
cleanup_bucket_root = importlib.util.module_from_spec(CLEANUP_SPEC)
assert CLEANUP_SPEC and CLEANUP_SPEC.loader
CLEANUP_SPEC.loader.exec_module(cleanup_bucket_root)


class SDKReleaseTest(unittest.TestCase):
    def test_release_manifest_requires_matching_public_base(self):
        with tempfile.TemporaryDirectory() as temporary:
            dist = Path(temporary)
            (dist / "assets").mkdir()
            (dist / "assets" / "main.js").write_text("console.log('ok')", encoding="utf-8")
            (dist / "index.html").write_text(
                '<script src="/sdk-releases/3.0.0/assets/main.js"></script>', encoding="utf-8"
            )

            manifest = sdk_release.build_release_manifest(dist, "3.0.0", ["v1", "v2", "v3"], "abc")

            self.assertEqual(manifest["release_path"], "/sdk-releases/3.0.0")
            self.assertEqual(manifest["compatible_contracts"], ["v1", "v2", "v3"])
            self.assertIn("index.html", manifest["files"])
            self.assertEqual(set(manifest["spa_aliases"]), {"submit", "status", "chat"})
            self.assertEqual(
                manifest["spa_aliases"]["chat"]["sha256"],
                manifest["files"]["index.html"]["sha256"],
            )

    def test_channel_rejects_unsupported_alias_contract(self):
        release = {
            "version": "2.0.0",
            "release_path": "/sdk-releases/2.0.0",
            "artifact_sha256": "digest",
            "compatible_contracts": ["v1", "v2"],
        }

        with self.assertRaises(SystemExit):
            sdk_release.build_channel_manifest("stable", release, {"sdk-v3": "v3"}, "2.0.0", None)

    def test_aliases_cannot_overwrite_non_sdk_product_paths(self):
        with self.assertRaises(SystemExit):
            sdk_release.parse_aliases(["console:v2"])

        self.assertEqual(sdk_release.parse_aliases(["sdk:v1", "sdk-v2:v2"]), {
            "sdk": "v1",
            "sdk-v2": "v2",
        })

    def test_remote_release_manifest_must_match_version_and_path(self):
        manifest = {
            "schema_version": "feedback-sdk-release/v1",
            "version": "2.0.0",
            "release_path": "/sdk-releases/2.0.0",
            "artifact_sha256": "a" * 64,
            "compatible_contracts": ["v1", "v2"],
            "spa_aliases": {
                route: {"sha256": "b" * 64, "size": 1} for route in sdk_release.ROUTES
            },
        }
        sdk_release.validate_remote_release_manifest(manifest, "2.0.0")

        manifest["release_path"] = "https://example.invalid/sdk-releases/2.0.0"
        with self.assertRaises(SystemExit):
            sdk_release.validate_remote_release_manifest(manifest, "2.0.0")

    def test_force_upgrade_deadline_requires_timezone(self):
        with self.assertRaises(SystemExit):
            sdk_release.validate_force_upgrade_after("2026-11-01T00:00:00")

        self.assertEqual(
            sdk_release.validate_force_upgrade_after("2026-11-01T00:00:00+08:00"),
            "2026-11-01T00:00:00+08:00",
        )

    def test_alias_loader_preserves_query_and_has_fallback(self):
        loader = sdk_release.build_alias_loader(
            "sdk-v2", "stable", "status", "/sdk-releases/2.0.0"
        ).decode("utf-8")

        self.assertIn("/sdk-channels/stable.json", loader)
        self.assertIn("/sdk-releases/2.0.0", loader)
        self.assertIn('const suffix = "/status"', loader)
        self.assertIn("location.search + location.hash", loader)
        self.assertIn('const alias = "sdk-v2"', loader)

    def test_release_files_put_index_last(self):
        with tempfile.TemporaryDirectory() as temporary:
            dist = Path(temporary)
            (dist / "assets").mkdir()
            (dist / "index.html").write_text("index", encoding="utf-8")
            (dist / "favicon.svg").write_text("icon", encoding="utf-8")
            (dist / "assets" / "main.js").write_text("js", encoding="utf-8")

            relatives = [path.relative_to(dist).as_posix() for path in sdk_release.release_files(dist)]

            self.assertEqual(relatives, ["assets/main.js", "favicon.svg", "index.html"])

    def test_legacy_cleanup_always_protects_managed_sdk_namespaces(self):
        self.assertTrue(cleanup_bucket_root.is_protected_key("sdk-channels/stable.json", []))
        self.assertTrue(cleanup_bucket_root.is_protected_key("sdk-releases/3.0.0/index.html", []))
        self.assertTrue(cleanup_bucket_root.is_protected_key("sdk-v2-canary/index.html", []))
        self.assertFalse(cleanup_bucket_root.is_protected_key("legacy-root.js", []))


if __name__ == "__main__":
    unittest.main()
