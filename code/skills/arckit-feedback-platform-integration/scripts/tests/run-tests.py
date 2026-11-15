#!/usr/bin/env python3
"""Run local collector regression checks in a disposable directory; no secrets/network."""
from pathlib import Path
import subprocess
import tempfile

here = Path(__file__).resolve().parent
source = (here.parent / 'collect_feedback_config.swift').read_text()
assert source.endswith('Collector.main()\n')
with tempfile.TemporaryDirectory(prefix='feedback-collector-tests-') as directory:
    root = Path(directory)
    harness = root / 'collector.swift'
    harness.write_text(source.removesuffix('Collector.main()\n') + (here / 'collector-tests.swift').read_text())
    subprocess.run(['swift', str(harness), directory], check=True)
    stub = '''
protocol FeedbackPlatformCredentialProviding {}
struct FeedbackPlatformCredentials { let projectId: Int; let apiKey: String }
'''
    for version in ('v1', 'v2'):
        generated = root / f'{version}.swift'
        generated.write_text(stub + generated.read_text())
        subprocess.run(['swiftc', '-typecheck', str(generated)], check=True)
    print('PASS: generated Swift configurations compile')
