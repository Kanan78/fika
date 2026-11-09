"""On-device adapter for the unmodified Fika web build and Python engine."""
import functools
import json
import os
import pathlib
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

_server = None
_lock = threading.Lock()
MAX_BODY = 1_000_000


def start(runtime_directory, port=8754):
    global _server
    with _lock:
        if _server is not None:
            return _server.server_port
        root = pathlib.Path(runtime_directory).resolve()
        sys.path.insert(0, str(root))
        os.environ["LLM_PROVIDER"] = "template"
        os.environ["X5_DEMO_ROLLING_DATES"] = "1"
        from recsys.engine.decision import handle_decision
        from recsys.engine.event import handle_event
        from recsys.engine.title import handle_title
        handlers = {"/api/demo/decision": handle_decision,
                    "/api/demo/event": handle_event, "/api/demo/title": handle_title}

        class Handler(SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(root / "web"), **kwargs)

            def log_message(self, *args):
                pass

            def send_json(self, data, status=200):
                body = json.dumps(data, ensure_ascii=False).encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def do_GET(self):
                route = urlsplit(self.path).path
                if route == "/api/demo/profiles":
                    examples = root / "recsys" / "contract" / "examples"
                    read = lambda name: json.loads((examples / name).read_text(encoding="utf-8"))
                    profiles = [read("profile-empty.json"), read("profile-breakfast-seeded.json")]
                    latest = max(receipt["purchased_at_ms"] for profile in profiles for receipt in profile["receipts"])
                    day = 86_400_000
                    shift = (int(time.time() * 1000) // day) * day - day - latest
                    for profile in profiles:
                        for receipt in profile["receipts"]:
                            receipt["purchased_at_ms"] += shift
                        for reward in profile["issued_rewards"]:
                            reward["issued_at_ms"] += shift
                    return self.send_json({"contract_version": 2, "profiles": profiles,
                                           "budget": read("budget.json"), "ads": read("ads.json")})
                if route == "/api/demo/evaluation":
                    return self.send_json(json.loads((root / "evaluation.json").read_text(encoding="utf-8")))
                if route.startswith("/api/"):
                    return self.send_json({"error": "not_found"}, 404)
                return super().do_GET()

            def do_POST(self):
                route = urlsplit(self.path).path
                request_id = "unknown"
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                    if not 0 < length <= MAX_BODY:
                        raise ValueError("Invalid request size")
                    payload = json.loads(self.rfile.read(length))
                    if not isinstance(payload, dict) or payload.get("contract_version") != 2:
                        raise ValueError("Unsupported request contract")
                    request_id = payload.get("request_id", "unknown")
                    if route not in handlers:
                        return self.send_json({"error": "not_found"}, 404)
                    return self.send_json(handlers[route](payload))
                except (KeyError, TypeError, ValueError) as error:
                    return self.send_json({"contract_version": 2, "request_id": request_id,
                                           "error": {"code": "bad_request", "message": str(error)}}, 400)
                except Exception as error:
                    return self.send_json({"contract_version": 2, "request_id": request_id,
                                           "error": {"code": "engine_failed", "message": str(error)}}, 500)

        server = ThreadingHTTPServer(("127.0.0.1", int(port)), Handler)
        thread = threading.Thread(target=server.serve_forever, name="Fika-local-api", daemon=True)
        thread.start()
        _server = server
        return server.server_port


if __name__ == "__main__":
    start(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 8754)
    threading.Event().wait()
