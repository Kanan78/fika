import importlib.util
import json
import pathlib
import tempfile
import time
import unittest
import urllib.request
import zipfile

HERE = pathlib.Path(__file__).resolve().parent


class OfflineRuntimeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory()
        cls.root = pathlib.Path(cls.temporary.name)
        with zipfile.ZipFile(HERE / 'app/src/main/assets/fika-runtime.zip') as archive:
            archive.extractall(cls.root)
        spec = importlib.util.spec_from_file_location('fika_server', HERE / 'app/src/main/python/fika_server.py')
        cls.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.module)
        cls.port = cls.module.start(str(cls.root), 0)

    @classmethod
    def tearDownClass(cls):
        cls.module._server.shutdown()
        cls.module._server.server_close()
        cls.temporary.cleanup()

    def request(self, route, payload=None):
        data = None if payload is None else json.dumps(payload).encode('utf-8')
        request = urllib.request.Request(f'http://127.0.0.1:{self.port}{route}', data=data,
                                         headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(request) as response:
            return response.read()

    def test_web_assets_and_original_build(self):
        self.assertIn(b'<title>Fika</title>', self.request('/'))
        self.assertIn(b'<svg', self.request('/assets/task-brands/redbull.svg'))
        self.assertIn(b'<svg', self.request('/assets/task-brands/snickers.svg'))

    def test_engine_receipt_reward_and_replay(self):
        seed = json.loads(self.request('/api/demo/profiles'))
        now = int(time.time() * 1000)
        self.assertLess(now - max(r['purchased_at_ms'] for p in seed['profiles'] for r in p['receipts']), 2 * 86_400_000)
        payload = json.loads((self.root / 'recsys/contract/examples/decision-request-seeded.json').read_text())
        profile = seed['profiles'][1]
        profile['issued_rewards'] = []
        snapshot = json.loads((HERE / 'game-test-snapshot.json').read_text())
        profile['inventory'] = snapshot['inventory']
        payload['game'] = snapshot['game']
        payload['game_features'] = snapshot['features']
        payload.update(now_ms=now, profile=profile, budget=seed['budget'], ads=seed['ads'])
        decision = json.loads(self.request('/api/demo/decision', payload))
        self.assertEqual(decision['status'], 'offer', decision.get('reason_codes'))
        challenge = decision['challenge']
        profile['outstanding_promise'] = dict(challenge_id=challenge['challenge_id'],
            challenge_version=challenge['challenge_version'], decision_id=decision['decision_id'],
            published_at_ms=now, deadline_ms=challenge['target']['deadline_ms'], fulfilled=False)
        receipt = dict(receipt_id='offline-test', purchased_at_ms=now, store_id='offline-store', returned=False,
            lines=[dict(sku_id=challenge['target']['sku_ids'][0], category=challenge['target']['category'],
                        quantity=challenge['target']['quantity'], paid=True, amount_kopecks=9900)])
        event = dict(contract_version=2, request_id='offline-event', now_ms=now,
                     idempotency_key='offline-once', profile=profile, challenge=challenge, receipt=receipt)
        result = json.loads(self.request('/api/demo/event', event))
        self.assertEqual(result['qualification'], 'qualified')
        self.assertIsNotNone(result['grant'])
        profile['processed_event_ids'].append('offline-once')
        replay = json.loads(self.request('/api/demo/event', event))
        self.assertEqual(replay['qualification'], 'duplicate')
        self.assertIsNone(replay['grant'])

    def test_collection_title_and_evaluation(self):
        title = json.loads((self.root / 'recsys/contract/examples/title-request-seeded.json').read_text())
        result = json.loads(self.request('/api/demo/title', title))
        self.assertTrue(result['title'])
        evaluation = json.loads(self.request('/api/demo/evaluation'))
        self.assertEqual(evaluation['contract_version'], 1)


if __name__ == '__main__':
    unittest.main()
