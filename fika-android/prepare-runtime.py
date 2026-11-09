"""Package a read-only snapshot of Fika assets and required engine modules."""
import hashlib
import json
import pathlib
import zipfile

HERE = pathlib.Path(__file__).resolve().parent
SOURCE = HERE.parent / "x5-loyalty-system"
ASSETS = HERE / "app" / "src" / "main" / "assets"


def prepare():
    ASSETS.mkdir(parents=True, exist_ok=True)
    entries = []
    for path in (SOURCE / "webapp" / "dist").rglob("*"):
        if path.is_file():
            entries.append((path, "web/" + path.relative_to(SOURCE / "webapp" / "dist").as_posix()))
    for folder in ("engine", "llm", "catalog", "contract/examples"):
        for path in (SOURCE / "recsys" / folder).rglob("*"):
            if path.is_file() and path.suffix in {".py", ".json"} and "tests" not in path.parts and "__pycache__" not in path.parts:
                entries.append((path, path.relative_to(SOURCE).as_posix()))
    init = SOURCE / "recsys" / "__init__.py"
    if init.exists():
        entries.append((init, "recsys/__init__.py"))
    for name in ("LICENSE", "NOTICE"):
        path = SOURCE / name
        if path.exists():
            entries.append((path, "licenses/" + name))
    evaluation = HERE / "evaluation.json"
    entries.append((evaluation, "evaluation.json"))
    manifest = {}
    with zipfile.ZipFile(ASSETS / "fika-runtime.zip", "w", zipfile.ZIP_DEFLATED) as archive:
        for path, name in sorted(entries, key=lambda entry: entry[1]):
            data = path.read_bytes()
            archive.writestr(name, data)
            manifest[name] = hashlib.sha256(data).hexdigest()
    (HERE / "runtime-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Bundled {len(entries)} unchanged runtime files")


if __name__ == "__main__":
    prepare()
