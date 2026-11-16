"""Fill in each song's `duration` and `thumb` in js/songs.js.

Run from the project folder after adding songs:

    python tools/song-meta.py

For every song with a file (`src`), it:
  - measures the length with ffprobe and writes `duration: <seconds>`, so
    music.html doesn't have to open every file just to show its length;
  - makes a small 128x128 thumbnail of its cover in
    assets/music/cover/thumbs/<id>.webp and writes `thumb: "<path>"`, so the
    song list and mini player don't load full-size covers for 44px images.

Existing values are refreshed, so it's safe to run any time (e.g. after
replacing a song's file or cover). Needs ffmpeg/ffprobe on PATH.
"""
import os
import re
import subprocess
import sys
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SONGS_JS = os.path.join(ROOT, "js", "songs.js")
THUMB_DIR = "assets/music/cover/thumbs"
THUMB_SIZE = 128


def field(block, name):
    m = re.search(r'^\s*%s:\s*"([^"]*)",?\s*$' % name, block, re.M)
    return m.group(1) if m else ""


def set_field(block, name, value_js, after):
    """Replace `name: ...` in the block, or add it on the line after `after`."""
    line_re = re.compile(r"^(\s*)%s:.*$" % name, re.M)
    if line_re.search(block):
        return line_re.sub(lambda m: "%s%s: %s," % (m.group(1), name, value_js), block, count=1)
    after_re = re.compile(r"^(\s*)%s:.*$" % after, re.M)
    m = after_re.search(block)
    indent = m.group(1)
    return block[: m.end()] + "\n%s%s: %s," % (indent, name, value_js) + block[m.end() :]


def duration_of(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return round(float(out), 2)


def make_thumb(cover_path, out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", cover_path,
         "-vf", "scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d" % ((THUMB_SIZE,) * 4),
         "-frames:v", "1", "-c:v", "libwebp", "-quality", "82", out_path],
        check=True,
    )


def main():
    src = open(SONGS_JS, encoding="utf-8").read()
    head, sep, body = src.partition("const SONGS = [")
    if not sep:
        sys.exit("Couldn't find `const SONGS = [` in js/songs.js")

    problems = []

    def fix(match):
        block = match.group(0)
        sid = field(block, "id")
        song_src = field(block, "src")
        cover = field(block, "cover")
        if not sid or not song_src:
            return block
        file_path = os.path.join(ROOT, unquote(song_src.split("?")[0]))
        if not os.path.exists(file_path):
            problems.append("%s: file not found (%s)" % (sid, song_src))
            return block
        block = set_field(block, "duration", str(duration_of(file_path)), "src")
        if cover:
            cover_path = os.path.join(ROOT, unquote(cover))
            if os.path.exists(cover_path):
                thumb_rel = "%s/%s.webp" % (THUMB_DIR, sid)
                make_thumb(cover_path, os.path.join(ROOT, thumb_rel))
                block = set_field(block, "thumb", '"%s"' % thumb_rel, "cover")
            else:
                problems.append("%s: cover not found (%s)" % (sid, cover))
        print("ok  %s" % sid)
        return block

    # Each song is one { ... } object; it may hold one level of nested
    # braces (lyricsSearch: { ... }, lyricsEdits: [{ ... }]).
    body = re.sub(r"\{(?:[^{}]|\{[^{}]*\})*\}", fix, body)
    open(SONGS_JS, "w", encoding="utf-8").write(head + sep + body)
    for p in problems:
        print("!!  " + p)


if __name__ == "__main__":
    main()
