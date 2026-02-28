#!/usr/bin/env python3
"""Extract frames from WebM videos into runtime/ PNGs for game rendering.

Videos in assets/videos/ are the pipeline source of truth.
This script extracts each frame, applies flood-fill alpha removal
to cut out the black background, and saves as RGBA PNGs.
"""

import os
import glob
import subprocess
import tempfile
from PIL import Image, ImageDraw


def floodfill_alpha(img):
    """Flood-fill from corners to make connected black background transparent."""
    img = img.convert("RGBA")
    w, h = img.size
    corners = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]
    for corner in corners:
        ImageDraw.floodfill(img, corner, (255, 0, 255, 0), thresh=0)

    pixels = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r == 255 and g == 0 and b == 255 and a == 0:
                pixels[x, y] = (0, 0, 0, 0)
    return img


def extract_frames(webm_path, output_dir):
    """Extract frames from a WebM video, apply alpha, save as PNGs."""
    name = os.path.splitext(os.path.basename(webm_path))[0]

    with tempfile.TemporaryDirectory() as tmpdir:
        frame_pattern = os.path.join(tmpdir, "frame_%04d.png")
        subprocess.run([
            "ffmpeg", "-i", webm_path,
            "-vsync", "vfr",
            frame_pattern
        ], capture_output=True, check=True)

        frame_files = sorted(glob.glob(os.path.join(tmpdir, "frame_*.png")))
        for i, frame_file in enumerate(frame_files):
            img = Image.open(frame_file)
            img = floodfill_alpha(img)
            out_path = os.path.join(output_dir, f"{name}_{i}.png")
            img.save(out_path)

        print(f"  {name}: {len(frame_files)} frames")


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    runtime_dir = os.path.join(script_dir, "runtime")
    os.makedirs(runtime_dir, exist_ok=True)

    # Clear old runtime frames
    for old in glob.glob(os.path.join(runtime_dir, "*.png")):
        os.remove(old)

    webm_files = sorted(glob.glob(os.path.join(script_dir, "*.webm")))
    for webm_path in webm_files:
        extract_frames(webm_path, runtime_dir)

    print(f"Done! Frames in {runtime_dir}/")
