import datetime as dt
import os
import unittest
from unittest.mock import patch

from recsys.engine.policy import load_campaigns


class RollingCampaignTests(unittest.TestCase):
    def test_interactive_demo_shifts_flights_without_changing_duration_or_budget(self):
        with patch.dict(os.environ, {"X5_DEMO_ROLLING_DATES": "0"}):
            original = load_campaigns()
        with patch.dict(os.environ, {"X5_DEMO_ROLLING_DATES": "1"}):
            rolling = load_campaigns()
        shift = dt.datetime.now(dt.timezone.utc).date() - dt.date(2026, 9, 7)
        for before, after in zip(original["campaigns"], rolling["campaigns"]):
            for field in ("flight_start", "flight_end"):
                self.assertEqual(dt.date.fromisoformat(after[field]) - dt.date.fromisoformat(before[field]), shift)
            self.assertEqual({key: value for key, value in before.items() if key not in {"flight_start", "flight_end"}},
                             {key: value for key, value in after.items() if key not in {"flight_start", "flight_end"}})
