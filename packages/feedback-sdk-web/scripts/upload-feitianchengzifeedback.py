#!/usr/bin/env python3

import subprocess
import sys
from pathlib import Path


def main():
    script_dir = Path(__file__).resolve().parent
    target = script_dir / "deploy-feedback-sdk.py"
    result = subprocess.run([sys.executable, str(target)], check=False)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
