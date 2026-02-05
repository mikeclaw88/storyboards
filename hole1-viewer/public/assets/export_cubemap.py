"""Combine 6 cubemap face images into a single 4K PNG cross layout."""

from pathlib import Path
from PIL import Image

FACE_SIZE = 1024
CANVAS_W = FACE_SIZE * 4  # 4096
CANVAS_H = FACE_SIZE * 3  # 3072

MARS_DIR = Path(__file__).parent / "mars"
OUTPUT = Path(__file__).parent / "mars_cubemap_4k.png"

# Cross layout positions (col, row) — each unit = FACE_SIZE
#          [py]
# [nx] [pz] [px] [nz]
#          [ny]
LAYOUT = {
    "py": (1, 0),
    "nx": (0, 1),
    "pz": (1, 1),
    "px": (2, 1),
    "nz": (3, 1),
    "ny": (1, 2),
}


def main():
    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), (0, 0, 0))

    for name, (col, row) in LAYOUT.items():
        path = MARS_DIR / f"{name}.jpg"
        face = Image.open(path).resize((FACE_SIZE, FACE_SIZE), Image.LANCZOS)
        canvas.paste(face, (col * FACE_SIZE, row * FACE_SIZE))
        print(f"  placed {name} at col={col} row={row}")

    canvas.save(OUTPUT)
    print(f"Saved {OUTPUT} ({CANVAS_W}x{CANVAS_H})")


if __name__ == "__main__":
    main()
