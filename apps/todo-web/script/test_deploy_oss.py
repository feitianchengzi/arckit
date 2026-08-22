import importlib.util
import sys
import tempfile
import types
import unittest
from pathlib import Path


if 'oss2' not in sys.modules:
    sys.modules['oss2'] = types.ModuleType('oss2')
if 'dotenv' not in sys.modules:
    dotenv = types.ModuleType('dotenv')
    dotenv.load_dotenv = lambda _path: None
    sys.modules['dotenv'] = dotenv

MODULE_PATH = Path(__file__).with_name('deploy-oss.py')
SPEC = importlib.util.spec_from_file_location('deploy_oss', MODULE_PATH)
deploy_oss = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(deploy_oss)


class FakeBucket:
    def __init__(self, fail_key=None):
        self.fail_key = fail_key
        self.calls = []

    def put_object_from_file(self, key, local_file, headers=None):
        self.calls.append((key, Path(local_file).name, headers))
        if key == self.fail_key:
            raise RuntimeError('simulated upload failure')


class DeployOssTest(unittest.TestCase):
    def make_dist(self):
        temporary = tempfile.TemporaryDirectory()
        root = Path(temporary.name)
        (root / 'assets').mkdir()
        (root / 'assets' / 'app-hash.js').write_text('asset', encoding='utf-8')
        (root / 'manifest.webmanifest').write_text('manifest', encoding='utf-8')
        (root / 'index.html').write_text('index', encoding='utf-8')
        return temporary, root

    def test_plan_uploads_immutable_assets_first_and_index_last(self):
        temporary, root = self.make_dist()
        self.addCleanup(temporary.cleanup)

        plan = deploy_oss.build_upload_plan(root, 'site')
        self.assertEqual([item[1] for item in plan], [
            'site/assets/app-hash.js',
            'site/manifest.webmanifest',
            'site/index.html',
        ])
        self.assertEqual(plan[0][2]['Cache-Control'], 'public, max-age=31536000, immutable')
        self.assertEqual(plan[-1][2]['Cache-Control'], 'no-cache, max-age=0, must-revalidate')

    def test_failed_resource_upload_never_switches_index(self):
        temporary, root = self.make_dist()
        self.addCleanup(temporary.cleanup)
        bucket = FakeBucket(fail_key='assets/app-hash.js')

        with self.assertRaisesRegex(RuntimeError, 'assets/app-hash.js'):
            deploy_oss.upload_files(bucket, root, '')

        self.assertEqual([call[0] for call in bucket.calls], ['assets/app-hash.js'])
        self.assertNotIn('index.html', [call[0] for call in bucket.calls])

    def test_successful_publish_replaces_index_only_after_every_resource(self):
        temporary, root = self.make_dist()
        self.addCleanup(temporary.cleanup)
        bucket = FakeBucket()

        deploy_oss.upload_files(bucket, root, '')

        self.assertEqual(bucket.calls[-1][0], 'index.html')
        self.assertEqual(len(bucket.calls), 3)


if __name__ == '__main__':
    unittest.main()
