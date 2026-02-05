"""Split a cubemap cross-layout image into 6 individual face JPGs."""

import sys
from pathlib import Path
from PIL import Image

TARGET_SIZE = 1024

# Cross layout positions (col, row) — each unit = one face
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
    if len(sys.argv) < 2:
        print(f"Usage: python {Path(__file__).name} <source_image> [output_folder_name]")
        sys.exit(1)

    source_path = Path(__file__).parent / sys.argv[1]
    if not source_path.exists():
        print(f"Error: {source_path} not found")
        sys.exit(1)

    if len(sys.argv) >= 3:
        folder_name = sys.argv[2]
    else:
        # Derive folder name from filename: "nycriver_cubemap_4k.jpeg" -> "nycriver"
        folder_name = source_path.stem.split("_")[0]

    output_dir = Path(__file__).parent / folder_name
    output_dir.mkdir(parents=True, exist_ok=True)

    img = Image.open(source_path)
    width, height = img.size
    face_w = width // 4
    face_h = height // 3

    print(f"Source: {source_path} ({width}x{height})")
    print(f"Face size: {face_w}x{face_h}")
    print(f"Output: {output_dir}/")

    for name, (col, row) in LAYOUT.items():
        left = col * face_w
        upper = row * face_h
        right = left + face_w
        lower = upper + face_h

        face = img.crop((left, upper, right, lower))
        face = face.resize((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)

        out_path = output_dir / f"{name}.jpg"
        face.save(out_path, "JPEG", quality=95)
        print(f"  saved {name} (col={col} row={row}) -> {out_path}")

    print(f"Done — 6 faces saved to {output_dir}/")


if __name__ == "__main__":
    main()
