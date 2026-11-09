"""Loading the policy, the synthetic SKU catalog and the campaigns.

Thresholds are not invented at the moment a challenge is issued: they are read from
`data/policy.json`. A missing required parameter forbids a new promise.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import pathlib
from typing import Any

ENGINE_ROOT = pathlib.Path(__file__).resolve().parent
RECSYS_ROOT = ENGINE_ROOT.parent


class PolicyError(Exception):
    """A required policy parameter is missing or invalid."""


def load_policy(path: pathlib.Path | None = None) -> dict[str, Any]:
    policy = _read_json(path or ENGINE_ROOT / "data" / "policy.json")
    missing = [name for name in policy.get("required_parameters", []) if name not in policy]
    if missing:
        raise PolicyError(f"missing required policy parameters: {', '.join(sorted(missing))}")
    if policy.get("insufficient_history_policy") not in {"refuse", "fixed_challenge"}:
        raise PolicyError("insufficient_history_policy must be refuse or fixed_challenge")
    if policy.get("first_cycle_funding_policy") not in {
        "advertiser_only",
        "advertiser_or_positive_margin",
    }:
        raise PolicyError(
            "first_cycle_funding_policy must be advertiser_only "
            "or advertiser_or_positive_margin"
        )
    return policy


def load_sku_catalog(path: pathlib.Path | None = None) -> dict[str, Any]:
    return _read_json(path or ENGINE_ROOT / "data" / "sku_catalog.json")


def load_campaigns(path: pathlib.Path | None = None) -> dict[str, Any]:
    catalog = _read_json(path or RECSYS_ROOT / "catalog" / "campaigns.json")
    if os.environ.get("X5_DEMO_ROLLING_DATES") == "1" and path is None:
        # Only the interactive local demo rolls synthetic flights forward. Fixed-date
        # experiments and tests retain their original campaign dates and constraints.
        shift = dt.datetime.now(dt.timezone.utc).date() - dt.date(2026, 9, 7)
        for campaign in catalog["campaigns"]:
            for field in ("flight_start", "flight_end"):
                campaign[field] = (dt.date.fromisoformat(campaign[field]) + shift).isoformat()
    return catalog


def rubles_to_kopecks(value: float | int) -> int:
    """Campaign catalog amounts are given in rubles; we store and compute kopecks only."""
    return int(round(float(value) * 100))


def _read_json(path: pathlib.Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise PolicyError(f"policy file not found: {path}") from error
    except json.JSONDecodeError as error:
        raise PolicyError(f"corrupted policy file {path}: {error}") from error
