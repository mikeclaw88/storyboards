#!/usr/bin/env python3
"""Encode WebM videos with alpha from the pre-cutout PNG frames in assets/moves/."""

import os
import glob
import subprocess
import tempfile
from PIL import Image

# Target video size
SIZE = 128

def collect_animations(moves_dir):
    """Group PNGs by character_animation, e.g. Alex_Walking -> [0.png, 1.png]."""
    animations = {}
    for path in sorted(glob.glob(os.path.join(moves_dir, "*.png"))):
        name = os.path.splitext(os.path.basename(path))[0]
        # e.g. "Alex_Walking_0" -> parts = ["Alex", "Walking", "0"]
        parts = name.rsplit("_", 1)
        anim_key = parts[0]  # "Alex_Walking"
        frame_idx = int(parts[1])
        if anim_key not in animations:
            animations[anim_key] = []
        animations[anim_key].append((frame_idx, path))
    # Sort frames by index
    for key in animations:
        animations[key].sort()
    return animations


def encode_webm(anim_key, frames, output_dir, fps=6):
    """Scale frames to target size and encode as WebM with alpha."""
    with tempfile.TemporaryDirectory() as tmpdir:
        for i, (frame_idx, path) in enumerate(frames):
            img = Image.open(path).convert("RGBA")
            img = img.resize((SIZE, SIZE), Image.NEAREST)
            img.save(os.path.join(tmpdir, f"frame_{i+1:04d}.png"))

        webm_path = os.path.join(output_dir, anim_key + ".webm")
        result = subprocess.run([
            "ffmpeg", "-y",
            "-framerate", str(fps),
            "-i", os.path.join(tmpdir, "frame_%04d.png"),
            "-c:v", "libvpx-vp9",
            "-pix_fmt", "yuva420p",
            "-lossless", "1",
            webm_path
        ], capture_output=True)

        if result.returncode != 0:
            print(f"  ERROR: {result.stderr.decode()}")
            return

    print(f"  {anim_key}: {len(frames)} frames -> {webm_path}")


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    moves_dir = os.path.join(os.path.dirname(script_dir), "moves")

    animations = collect_animations(moves_dir)

    # Only encode the animations we need for the game
    needed = ["Walking", "Punching", "Kicking", "Hurt", "Standing"]
    characters = ["Alex", "Ryan"]

    for char in characters:
        for anim in needed:
            key = f"{char}_{anim}"
            if key in animations:
                encode_webm(key, animations[key], script_dir)
            else:
                print(f"  WARNING: {key} not found in moves/")

    print("Done!")
