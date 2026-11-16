// Synced lyrics for music.html (used by js/music-page.js).
//
// Where a song's lyrics come from (set in js/songs.js):
//   lyrics: true        -> looked up on LRCLIB (lrclib.net, a free synced-
//                          lyrics database) by title + artist, then saved in
//                          this browser so it's only fetched once.
//   lyrics: "x.lrc"     -> your own .lrc file instead.
// lyricsOffset: -0.5 shifts all of a song's lines by that many seconds
// (negative = sooner), for when LRCLIB's timing runs early/late for the
// file on this site.
const Lyrics = (function () {
  const CACHE_KEY = "isekai.music.lyricsCache.";

  function store(fn) {
    try {
      return fn(localStorage);
    } catch (e) {
      return null; // private mode / storage blocked: just don't cache
    }
  }

  // "[01:23.45]text" -> { t: 83.45, text }, sorted by time. A line can
  // carry several timestamps (a repeated chorus); each becomes a line.
  function parse(src) {
    const lines = [];
    src.split(/\r?\n/).forEach((raw) => {
      const stamps = Array.from(raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g));
      if (!stamps.length) return;
      const text = raw.replace(/\[[^\]]*\]/g, "").trim();
      stamps.forEach((m) => lines.push({ t: Number(m[1]) * 60 + Number(m[2]), text }));
    });
    return lines.sort((a, b) => a.t - b.t);
  }

  // LRCLIB search: of the results that have synced lyrics, the one whose
  // length is closest to the song's (skips live/TV-size versions).
  // lyricsSearch: { title, artist } in songs.js overrides what's searched
  // for — e.g. artist: "" to search by title only, when LRCLIB lists the
  // singers differently (in Japanese, or by character name).
  function fetchLRCLIB(song, artistName) {
    const q = song.lyricsSearch || {};
    const artist = q.artist !== undefined ? q.artist : artistName;
    const url =
      "https://lrclib.net/api/search?track_name=" +
      encodeURIComponent(q.title || song.title) +
      (artist ? "&artist_name=" + encodeURIComponent(artist) : "");
    // LRCLIB sometimes answers "503 busy" and then works a moment later,
    // so a server error is retried a couple of times before giving up.
    const get = (tries) =>
      fetch(url).then((r) => {
        if (r.status >= 500 && tries > 0)
          return new Promise((ok) => setTimeout(ok, 800)).then(() => get(tries - 1));
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
    return get(2).then((results) => {
      const synced = results.filter((x) => x.syncedLyrics);
      if (!synced.length) throw new Error("no synced lyrics");
      const len = song.duration || 0;
      synced.sort((a, b) => Math.abs(a.duration - len) - Math.abs(b.duration - len));
      return synced[0].syncedLyrics;
    });
  }

  // The song's .lrc text.
  function text(song, artistName) {
    if (typeof song.lyrics === "string") {
      return fetch(song.lyrics).then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      });
    }
    // lyricsId pins one LRCLIB entry (e.g. when the closest-length match
    // mixes in romaji). It's part of the cache key, so changing it replaces
    // whatever version this browser saved before.
    const key = CACHE_KEY + song.id + (song.lyricsId ? "#" + song.lyricsId : "");
    const cached = store((s) => s.getItem(key));
    if (cached) return Promise.resolve(cached);
    const get = song.lyricsId
      ? fetch("https://lrclib.net/api/get/" + song.lyricsId)
          .then((r) => {
            if (!r.ok) throw new Error(r.status);
            return r.json();
          })
          .then((r) => r.syncedLyrics)
      : fetchLRCLIB(song, artistName);
    return get.then((src) => {
      if (!src) throw new Error("no synced lyrics");
      store((s) => s.setItem(key, src));
      return src;
    });
  }

  // lyricsEdits: [{ find, replace }] in songs.js fixes small mistakes in
  // the downloaded words (every match, on every line). Only the few
  // characters being fixed are written down, never whole lines.
  function applyEdits(lines, edits) {
    (edits || []).forEach((e) => {
      if (!e || !e.find) return;
      lines.forEach((l) => (l.text = l.text.split(e.find).join(e.replace || "")));
    });
    return lines;
  }

  // Lines ready to show: { t, text }[].
  function load(song, artistName) {
    return text(song, artistName).then((src) => {
      const lines = applyEdits(parse(src), song.lyricsEdits);
      if (song.lyricsOffset) lines.forEach((l) => (l.t = Math.max(0, l.t + song.lyricsOffset)));
      return lines;
    });
  }

  return { load };
})();
