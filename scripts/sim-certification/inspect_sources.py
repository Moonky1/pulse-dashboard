"""Read-only PDF inspection; all rendered private evidence stays Git-ignored."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw
from pypdf import PdfReader


def inspect(source, output, renderer):
    reader = PdfReader(source)
    output.mkdir(parents=True, exist_ok=True)
    subprocess.run([str(renderer), "-jpeg", "-r", "96", str(source), str(output / "page")], check=True)
    pages = sorted(output.glob("page-*.jpg"))
    if len(pages) != len(reader.pages):
        raise SystemExit("Rendered page count differs from source; use a fresh evidence directory")
    metadata = {"source_name": source.name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "pages": []}
    for index, page in enumerate(reader.pages):
        metadata["pages"].append({"page": index + 1, "text": page.extract_text() or "", "images": [{"name": image.name, "bytes": len(image.data)} for image in page.images]})
    (output / "inspection.private.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    for start in range(0, len(pages), 12):
        sheet = Image.new("RGB", (1800, 1480), "#e3e5e9")
        draw = ImageDraw.Draw(sheet)
        for offset, path in enumerate(pages[start:start + 12]):
            frame = Image.open(path).convert("RGB")
            frame.thumbnail((590, 332))
            x, y = (offset % 3) * 600 + 5, (offset // 3) * 370 + 27
            sheet.paste(frame, (x, y))
            draw.text((x, y - 20), f"{source.stem} / page {start + offset + 1}", fill="#101018")
        sheet.save(output / f"overview-{start // 12 + 1:02d}.jpg", quality=90)
    print(json.dumps({"source": source.name, "sha256": metadata["sha256"], "pages": len(reader.pages), "rendered": len(pages), "output": str(output)}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--renderer", required=True, type=Path)
    args = parser.parse_args()
    if "review-evidence.local" not in args.output.resolve().parts:
        raise SystemExit("Private source inspection must stay in Git-ignored review-evidence.local")
    inspect(args.source, args.output, args.renderer)
