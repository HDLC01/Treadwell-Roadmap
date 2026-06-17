"""
Audit trail — one JSON object per line answering "who did what / who saw what".

Sinks: ALWAYS stdout (greppable via `AUDIT ` prefix, so `docker logs` captures it),
AND a rotating file at <AUDIT_DIR>/audit.log ONLY if a writable persistent dir is
configured (env AUDIT_DIR). The app container has no volume mount today, so stdout
is the live sink; set AUDIT_DIR (e.g. /app/data) once a volume exists.

Additive + safe: callers must wrap audit_log() in try/except — it never raises.
We record method+path+user+status+ip only; never bodies, query strings, headers,
or tokens, to avoid capturing PII/secrets.
"""

from __future__ import annotations

import json
import logging
import os
from logging.handlers import RotatingFileHandler

# Dedicated logger so audit lines stay separate from app logs and don't double-emit.
_audit = logging.getLogger("roadmap.audit")
_audit.setLevel(logging.INFO)
_audit.propagate = False

# ALWAYS-on stdout sink, prefixed so it's greppable in `docker logs`.
_stream = logging.StreamHandler()
_stream.setFormatter(logging.Formatter("AUDIT %(message)s"))
_audit.addHandler(_stream)

# Optional persistent file sink — only if a writable data dir is configured.
_AUDIT_DIR = os.getenv("AUDIT_DIR", "").strip()
if _AUDIT_DIR and os.path.isdir(_AUDIT_DIR) and os.access(_AUDIT_DIR, os.W_OK):
    try:
        _fileh = RotatingFileHandler(
            os.path.join(_AUDIT_DIR, "audit.log"),
            maxBytes=5_000_000, backupCount=5, encoding="utf-8",
        )
        _fileh.setFormatter(logging.Formatter("%(message)s"))
        _audit.addHandler(_fileh)
    except Exception as exc:  # noqa: BLE001 — file sink is best-effort; stdout still works
        logging.getLogger("roadmap.audit").warning("audit file sink disabled: %s", exc)


def audit_log(record: dict) -> None:
    """Emit one compact JSON line. Best-effort: never raises."""
    try:
        _audit.info(json.dumps(record, separators=(",", ":"), default=str))
    except Exception:  # noqa: BLE001 — auditing must never break the request
        pass
