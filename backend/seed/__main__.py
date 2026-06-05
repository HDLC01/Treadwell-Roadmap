"""Allow `python -m seed [--force-docs]` (seed is a package)."""
import sys

from seed import run

run(force_docs="--force-docs" in sys.argv)
