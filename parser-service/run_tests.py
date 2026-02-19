#!/usr/bin/env python3
import subprocess
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

tests = [
    "tests/test_classifier.py",
    "tests/test_prc_extractor.py",
    "tests/test_bill_extractor.py",
]

passed = 0
failed = 0
errors = []

print("=" * 60)
print("PARSER SERVICE TEST SUITE")
print("=" * 60)

for test in tests:
    print(f"\n--- Running {test} ---")
    result = subprocess.run([sys.executable, test], capture_output=True, text=True)
    if result.returncode == 0:
        passed += 1
        print(result.stdout.strip())
    else:
        failed += 1
        errors.append(test)
        print(f"FAILED!")
        print(result.stdout)
        print(result.stderr)

print("\n" + "=" * 60)
print(f"RESULTS: {passed} passed, {failed} failed")
if errors:
    print(f"FAILED: {', '.join(errors)}")
print("=" * 60)

sys.exit(1 if failed > 0 else 0)
