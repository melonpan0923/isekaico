// music.html: the artist icon row (ARTISTS, js/artists.js), the song table
// (SONGS, js/songs.js) and the "now playing" stage between them.
//
// - Artist icons filter the table. Clicking the active artist again goes
//   back to all songs.
// - Sort menu: Custom order / Title / Artist. Picking Title or Artist starts
//   ascending; picking the same one again flips to descending. Title/artist
//   sorting uses a Japanese collator, so hiragana, katakana and kanji sort
//   properly alongside English (with titleKana/nameKana as the reading).
// - In Custom order, drag a song (press and hold on touch) to a new spot. That
//   order is saved in this browser (localStorage) on top of the order in
//   js/songs.js.
// - Clicking a song plays it (or pauses it if it's already playing). The
//   stage opens on the first play. .mp4 songs get a Song/Video switch.
// - Songs with `lyrics` get a Lyrics (歌詞) on/off switch: synced lyrics open
//   beside the player, Spotify-style (see "Lyrics").
(function () {
  const track = document.getElementById("artistSelectTrack");
  const list = document.getElementById("songList");
  if (!track || !list || typeof ARTISTS === "undefined" || typeof SONGS === "undefined") return;

  const panelTitle = document.getElementById("songPanelTitle");
  const panelCount = document.getElementById("songPanelCount");
  const hint = document.getElementById("songHint");
  const sortBtn = document.getElementById("songSortBtn");
  const sortLabel = document.getElementById("songSortLabel");
  const sortMenu = document.getElementById("songSortMenu");

  const stage = document.getElementById("musicStage");
  const stageMedia = document.getElementById("stageMedia");
  const stageCover = document.getElementById("stageCover");
  const stageModes = document.getElementById("stageModes");
  const stageTitle = document.getElementById("stageTitle");
  const stageArtist = document.getElementById("stageArtist");
  const stageCurrent = document.getElementById("stageCurrent");
  const stageDuration = document.getElementById("stageDuration");
  const stageSeek = document.getElementById("stageSeek");
  const stagePlay = document.getElementById("stagePlay");
  // The sound always comes from this <audio>, never the <video>: phones keep
  // an <audio> playing with the screen locked or the browser in the
  // background (like Spotify), but stop a <video>. The <video> is just a
  // muted picture that follows the audio's time (see "Video follows audio").
  const media = document.getElementById("songAudio");
  const video = document.getElementById("songMedia");
  const bgm = document.getElementById("bgm");

  const ORDER_KEY = "isekai.music.customOrder";
  const SORT_KEY = "isekai.music.sort";

  const collator = new Intl.Collator("ja", { sensitivity: "base", numeric: true });

  // ===== Helpers =====
  // EN / JP (js/i18n.js): a data field / a fixed string in the current
  // language, plain English if i18n.js isn't loaded. Song titles never
  // change; only the voice-actor singers' names have a Japanese version.
  const L = (item, key) => (window.I18N ? I18N.field(item, key) : item[key]);
  const T = (key, english) => (window.I18N ? I18N.t(key) : english);
  const isJa = () => !!(window.I18N && I18N.lang === "ja");

  function esc(str) {
    return String(str).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  }

  function fmt(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  // Songs by singers without an icon in js/artists.js just leave `artist`
  // out: they show under "All songs" only, with artistLabel as the name
  // (and artistKana, if given, for sorting).
  function artistOf(song) {
    return (
      ARTISTS.find((a) => a.id === song.artist) || {
        name: L(song, "artistLabel") || song.artist || "Unknown",
        nameKana: L(song, "artistKana"),
        icon: "",
      }
    );
  }

  // What's shown as the song's artist: the optional artistLabel (e.g. a
  // duet) or else the artist's name. Filtering/sorting still use `artist`.
  function artistLabelOf(song) {
    return L(song, "artistLabel") || L(artistOf(song), "name");
  }

  // Artist line under a title: the singer, then the optional series
  // (e.g. "nonoc · Re:ZERO Music") in a softer color.
  function artistLineHTML(song) {
    return (
      esc(artistLabelOf(song)) +
      (song.series ? '<span class="song-series"> · ' + esc(song.series) + "</span>" : "")
    );
  }

  // Small (128px) cover for the 44px list/mini-player images, made by
  // tools/song-meta.py; the full cover is kept for the big player.
  function thumbOf(song) {
    return song.thumb || coverOf(song);
  }

  function coverOf(song) {
    return song.cover || artistOf(song).icon;
  }

  function hasVideo(song) {
    return /\.(mp4|webm)(\?|#|$)/i.test(song.src || "");
  }

  function load(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* private mode etc. — the order just won't persist */
    }
  }

  // ===== State =====
  // Custom order: whatever was saved, minus songs since removed from
  // songs.js, plus any newly added songs at the end.
  let customOrder = (function () {
    const saved = load(ORDER_KEY);
    const ids = SONGS.map((s) => s.id);
    if (!Array.isArray(saved)) return ids;
    const kept = saved.filter((id) => ids.includes(id));
    return kept.concat(ids.filter((id) => !kept.includes(id)));
  })();

  let sort = (function () {
    const saved = load(SORT_KEY);
    if (saved && ["custom", "title", "artist"].includes(saved.key)) {
      return { key: saved.key, dir: saved.dir === "desc" ? "desc" : "asc" };
    }
    return { key: "custom", dir: "asc" };
  })();

  let filterArtist = null; // artist id, or null for all songs
  let currentId = null; // song loaded into the player
  let wantVideo = false; // last Song/Video pick — kept across songs
  const durations = new Map();

  function songById(id) {
    return SONGS.find((s) => s.id === id);
  }

  // The songs currently shown in the table, in display order.
  function visibleSongs() {
    let songs = customOrder.map(songById).filter(Boolean);
    if (filterArtist) songs = songs.filter((s) => s.artist === filterArtist);

    if (sort.key !== "custom") {
      const sign = sort.dir === "desc" ? -1 : 1;
      const titleKey = (s) => s.titleKana || s.title;
      const artistKey = (s) => L(artistOf(s), "nameKana") || L(artistOf(s), "name");
      songs = songs.slice().sort((a, b) => {
        let r;
        if (sort.key === "title") {
          r = collator.compare(titleKey(a), titleKey(b));
        } else {
          // Artist, then title (always A→Z) within the same artist.
          r = collator.compare(artistKey(a), artistKey(b));
          if (r === 0) return collator.compare(titleKey(a), titleKey(b));
        }
        return r * sign;
      });
    }
    return songs;
  }

  // ===== Artist row =====
  function renderArtists() {
    track.innerHTML = ARTISTS.map((a) => {
      const activeClass = a.id === filterArtist ? " active" : "";
      return (
        '<a class="char-item char-select-item' +
        activeClass +
        '" href="music.html?id=' +
        a.id +
        '" data-id="' +
        a.id +
        '">' +
        '<div class="char-frame"><div class="char-placeholder"><img src="' +
        a.icon +
        '" alt="' +
        esc(L(a, "name")) +
        '"></div></div>' +
        '<p class="char-name">' +
        esc(L(a, "name")) +
        "</p>" +
        "</a>"
      );
    }).join("");
  }

  function setFilter(id, push) {
    filterArtist = ARTISTS.some((a) => a.id === id) ? id : null;
    if (push)
      history.pushState(null, "", filterArtist ? "music.html?id=" + filterArtist : "music.html");
    renderHeading();
    renderArtists();
    renderSongs();
  }

  // The song panel's heading (the selected artist, or "All songs") and the
  // tab title
  function renderHeading() {
    const artist = ARTISTS.find((a) => a.id === filterArtist);
    document.title =
      (artist ? L(artist, "name") : T("page.music", "Music")) + " | 異世界コレクション";
    panelTitle.textContent = artist ? L(artist, "name") : T("music.allSongs", "All songs");
  }

  track.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-id]");
    if (!link) return;
    e.preventDefault();
    setFilter(link.dataset.id === filterArtist ? null : link.dataset.id, true);
  });

  window.addEventListener("popstate", () => {
    setFilter(new URLSearchParams(location.search).get("id"), false);
  });

  // ===== Song table =====
  const ICON_PLAY =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
  const ICON_PAUSE =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';

  // "Has a music video" marker. Drawn directly on a 16px grid (not a
  // scaled-down 24px icon) so its edges stay sharp on scaled displays.
  const MV_BADGE =
    '<svg class="song-badge" width="16" height="16" viewBox="0 0 16 16" role="img" aria-label="Music video">' +
    "<title>Has a music video</title>" +
    '<rect width="16" height="16" rx="3.5" fill="#e6e2fd"/><path d="M6 4.5v7l6-3.5z" fill="#7c6df0"/></svg>';

  function renderSongs() {
    const songs = visibleSongs();
    const playable = songs.filter((s) => s.src).length;
    const soon = songs.length - playable;

    panelCount.textContent = isJa()
      ? songs.length + "曲" + (soon ? " · " + soon + "曲は近日公開" : "")
      : songs.length +
        (songs.length === 1 ? " song" : " songs") +
        (soon ? " · " + soon + " coming soon" : "");
    const badge = isJa()
      ? MV_BADGE.replace("Music video", "MVあり").replace("Has a music video", "MVあり")
      : MV_BADGE;

    list.classList.toggle("is-custom", sort.key === "custom");
    hint.hidden = sort.key === "custom" || songs.length < 2;

    if (!songs.length) {
      list.innerHTML = '<li class="song-empty">' + T("music.noSongs", "No songs yet.") + "</li>";
      return;
    }

    list.innerHTML = songs
      .map((s, i) => {
        const cover = thumbOf(s);
        const classes = ["song-row"];
        if (!s.src) classes.push("is-unavailable");
        return (
          '<li class="' +
          classes.join(" ") +
          '" data-id="' +
          s.id +
          '"' +
          (s.src ? ' tabindex="0"' : ' aria-disabled="true"') +
          ">" +
          '<span class="song-num"><span class="song-num-text">' +
          (i + 1) +
          "</span>" +
          '<span class="song-num-icon song-num-play">' +
          ICON_PLAY +
          "</span>" +
          '<span class="song-num-icon song-num-pause">' +
          ICON_PAUSE +
          "</span>" +
          '<span class="song-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></span>' +
          '<span class="song-main">' +
          '<span class="song-cover">' +
          (cover ? '<img src="' + cover + '" alt="" draggable="false" loading="lazy">' : "") +
          "</span>" +
          '<span class="song-text">' +
          '<span class="song-title"><span class="song-title-text">' +
          esc(s.title) +
          "</span>" +
          (hasVideo(s) ? badge : "") +
          "</span>" +
          '<span class="song-artist">' +
          artistLineHTML(s) +
          "</span>" +
          "</span></span>" +
          '<span class="song-time">' +
          (s.src
            ? durations.has(s.id)
              ? fmt(durations.get(s.id))
              : "–:––"
            : T("music.soon", "Soon")) +
          "</span>" +
          "</li>"
        );
      })
      .join("");

    updatePlayingRows();
  }

  // Mid-drag, only the rows between the old and new spot change number,
  // so just those are updated (from/to are indexes into drag.rows).
  function renumber(from, to) {
    drag.rows.slice(from, to + 1).forEach((row, i) => {
      row.querySelector(".song-num-text").textContent = from + i + 1;
    });
  }

  function updatePlayingRows() {
    list.querySelectorAll(".song-row").forEach((row) => {
      const isCurrent = row.dataset.id === currentId;
      row.classList.toggle("is-playing", isCurrent);
      row.classList.toggle("is-paused", isCurrent && media.paused);
      if (isCurrent) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    });
  }

  // Song lengths come from songs.js (`duration`, filled in by
  // tools/song-meta.py). Only a song that doesn't have one yet gets its
  // file opened to read the length, so opening the page doesn't touch
  // every file.
  SONGS.forEach((s) => {
    if (!s.src) return;
    if (s.duration) {
      durations.set(s.id, s.duration);
      return;
    }
    const probe = document.createElement(hasVideo(s) ? "video" : "audio");
    probe.preload = "metadata";
    probe.addEventListener("loadedmetadata", () => {
      durations.set(s.id, probe.duration);
      const cell = list.querySelector('.song-row[data-id="' + s.id + '"] .song-time');
      if (cell) cell.textContent = fmt(probe.duration);
      probe.removeAttribute("src");
      probe.load();
    });
    probe.src = s.src;
  });

  // ===== Sort menu =====
  const SORT_KEYS = {
    custom: ["music.sortCustom", "Custom order"],
    title: ["music.sortTitle", "Title"],
    artist: ["music.sortArtist", "Artist"],
  };
  const sortName = (key) => T(SORT_KEYS[key][0], SORT_KEYS[key][1]);
  const ARROW_UP =
    '<svg class="sort-dir" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  const ARROW_DOWN =
    '<svg class="sort-dir" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';

  function renderSortUI() {
    sortLabel.textContent = sortName(sort.key);
    sortMenu.querySelectorAll(".song-sort-option").forEach((opt) => {
      const active = opt.dataset.sort === sort.key;
      opt.classList.toggle("active", active);
      opt.setAttribute("aria-checked", active ? "true" : "false");
      const arrow =
        active && sort.key !== "custom" ? (sort.dir === "asc" ? ARROW_UP : ARROW_DOWN) : "";
      opt.innerHTML = "<span>" + sortName(opt.dataset.sort) + "</span>" + arrow;
    });
    colTitle.classList.toggle("active", sort.key === "title");
    colNum.classList.toggle("active", sort.key === "custom");
    colArrow.innerHTML = sort.key === "title" ? (sort.dir === "asc" ? ARROW_UP : ARROW_DOWN) : "";
  }

  // Column headers, Spotify-style: "Title" sorts A→Z, then Z→A on the next
  // click; "#" goes back to Custom order. Unlike the sort menu, these keep
  // the current artist filter — they only change the order.
  const colTitle = document.getElementById("songColTitle");
  const colNum = document.getElementById("songColNum");
  const colArrow = document.getElementById("songColArrow");

  function applySort(next) {
    sort = next;
    save(SORT_KEY, sort);
    renderSortUI();
    renderSongs();
  }

  colTitle.addEventListener("click", () => {
    applySort(
      sort.key === "title"
        ? { key: "title", dir: sort.dir === "asc" ? "desc" : "asc" }
        : { key: "title", dir: "asc" },
    );
  });

  colNum.addEventListener("click", () => {
    if (sort.key !== "custom") applySort({ key: "custom", dir: "asc" });
  });

  function openSortMenu(open) {
    sortMenu.hidden = !open;
    sortBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  sortBtn.addEventListener("click", () => openSortMenu(sortMenu.hidden));

  sortMenu.addEventListener("click", (e) => {
    const opt = e.target.closest(".song-sort-option");
    if (!opt) return;
    const key = opt.dataset.sort;
    if (filterArtist) {
      // Inside an artist's list, picking any option jumps back to all
      // songs in that order. Re-picking the current option keeps its
      // direction here (it's a "take me back" click, not a flip).
      if (key !== sort.key) sort = { key, dir: "asc" };
    } else if (key === sort.key && key !== "custom") {
      sort.dir = sort.dir === "asc" ? "desc" : "asc";
    } else {
      sort = { key, dir: "asc" };
    }
    save(SORT_KEY, sort);
    renderSortUI();
    if (filterArtist)
      setFilter(null, true); // re-renders the songs too
    else renderSongs();
    // Keep the menu open, like Spotify, so the direction can be flipped
    // right away. It closes on an outside click or Escape.
  });

  // composedPath() rather than e.target.closest(): picking an option
  // re-renders its contents, so by now e.target may be detached.
  const sortWrap = sortBtn.closest(".song-sort");
  document.addEventListener("click", (e) => {
    if (!sortMenu.hidden && !e.composedPath().includes(sortWrap)) openSortMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !sortMenu.hidden) {
      openSortMenu(false);
      sortBtn.focus();
    }
  });

  // ===== Drag to reorder (Custom order only) =====
  // Drag a row with the mouse, or press and hold it on touch, to pick it
  // up. The row itself stays in the list as a faded placeholder that
  // slides between the other rows, while a floating copy follows the
  // pointer. On release the new order is saved.
  const HOLD_MS_TOUCH = 350;
  const MOVE_TOLERANCE = 6;

  let press = null; // pending press before a drag starts
  let drag = null; // active drag
  let suppressClick = false;

  list.addEventListener("pointerdown", (e) => {
    if (sort.key !== "custom" || e.button !== 0) return;
    const row = e.target.closest(".song-row");
    if (!row) return;
    press = {
      row,
      pointerId: e.pointerId,
      type: e.pointerType,
      x: e.clientX,
      y: e.clientY,
      // A mouse picks the row up as soon as it moves (see pointermove), so
      // a slow click still plays the song; touch needs a hold instead.
      timer: e.pointerType === "mouse" ? 0 : setTimeout(() => startDrag(), HOLD_MS_TOUCH),
    };
  });

  function cancelPress() {
    if (press) clearTimeout(press.timer);
    press = null;
  }

  function startDrag() {
    if (!press) return;
    const row = press.row;
    const rect = row.getBoundingClientRect();

    const ghost = row.cloneNode(true);
    ghost.classList.add("song-drag-ghost");
    ghost.removeAttribute("tabindex");
    ghost.style.width = rect.width + "px";
    ghost.style.left = rect.left + "px";
    ghost.style.top = rect.top + "px";
    document.body.appendChild(ghost);

    row.classList.add("song-drag-placeholder");
    document.body.classList.add("is-dragging-song");

    // Every row is the same height, so the row "slots" never move while
    // dragging — only which row sits in which slot changes. Measure each
    // slot's middle once (in page coordinates, so scrolling doesn't
    // matter) instead of re-measuring every row on every mouse move.
    const rows = Array.from(list.querySelectorAll(".song-row"));
    const slotMids = rows.map((r) => {
      const b = r.getBoundingClientRect();
      return b.top + window.scrollY + b.height / 2;
    });
    const index = rows.indexOf(row);

    drag = {
      row,
      ghost,
      rows, // current order, kept in sync with the DOM
      slotMids,
      index, // slot the placeholder is in now
      pitch: rows.length > 1 ? slotMids[1] - slotMids[0] : rect.height,
      offsetY: press.y - rect.top,
      lastY: press.y,
      scrollRaf: 0,
    };
    const isTouch = press.type !== "mouse";
    clearTimeout(press.timer);
    press = null;
    if (isTouch && navigator.vibrate) navigator.vibrate(10);
    autoScroll();
  }

  window.addEventListener("pointermove", (e) => {
    if (press && e.pointerId === press.pointerId) {
      const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_TOLERANCE;
      if (moved) {
        // A mouse drag picks the row up straight away; a finger that moves
        // before the hold completes is scrolling the page instead.
        if (press.type === "mouse") startDrag();
        else cancelPress();
      }
    }
    if (drag) {
      drag.lastY = e.clientY;
      moveDrag();
    }
  });

  // Once a touch drag has started, stop the page from scrolling under it.
  list.addEventListener(
    "touchmove",
    (e) => {
      if (drag) e.preventDefault();
    },
    { passive: false },
  );

  // Long-press on mobile would otherwise open the image/context menu.
  list.addEventListener("contextmenu", (e) => {
    if (sort.key === "custom" && e.target.closest(".song-row")) e.preventDefault();
  });

  function moveDrag() {
    drag.ghost.style.top = drag.lastY - drag.offsetY + "px";

    // above = how many slot middles the pointer is below (binary search,
    // so it's the same cost for 25 songs or 500). Same rule as before:
    // moving down, the song swaps once the pointer passes the middle of
    // the row below; moving up, the middle of the row above — so it
    // doesn't flicker back and forth right at a boundary.
    const y = drag.lastY + window.scrollY;
    let above = 0;
    let hi = drag.slotMids.length;
    while (above < hi) {
      const mid = (above + hi) >> 1;
      if (drag.slotMids[mid] < y) above = mid + 1;
      else hi = mid;
    }
    const from = drag.index;
    let dest = from;
    if (above - 1 > from) dest = above - 1;
    else if (above < from) dest = above;
    dest = Math.min(Math.max(dest, 0), drag.rows.length - 1);
    if (dest === from) return;

    // Only the rows between the old and new slot shift, by exactly one
    // slot — animate just those (FLIP), not the whole list.
    drag.rows.splice(from, 1);
    drag.rows.splice(dest, 0, drag.row);
    list.insertBefore(drag.row, drag.rows[dest + 1] || null);
    const lo2 = Math.min(from, dest);
    const hi2 = Math.max(from, dest);
    const shift = dest > from ? drag.pitch : -drag.pitch; // where they came from
    for (let i = lo2; i <= hi2; i++) {
      const r = drag.rows[i];
      if (r === drag.row) continue;
      r.animate([{ transform: "translateY(" + shift + "px)" }, { transform: "translateY(0)" }], {
        duration: 180,
        easing: "cubic-bezier(0.2, 0, 0, 1)",
      });
    }
    drag.index = dest;
    renumber(lo2, hi2);
  }

  // Scroll the page while holding a song near the top/bottom edge. Speed
  // ramps up the deeper into the edge zone the pointer is (and past the
  // window edge counts as fully in), and keeps building the longer it's
  // held there. Time-based (px per ms), so it's the same speed on 60Hz and
  // 144Hz screens.
  const SCROLL_EDGE = 140; // px from the top/bottom where scrolling starts
  const SCROLL_MIN = 0.25; // px/ms at the inner edge of the zone
  const SCROLL_MAX = 1.2; // px/ms right at the window edge
  const SCROLL_BOOST = 0.5; // up to +50% after holding for SCROLL_BOOST_MS
  const SCROLL_BOOST_MS = 1200;

  function autoScroll(now) {
    if (!drag) return;
    now = now || performance.now();
    const dt = Math.min(now - (drag.lastFrame || now), 50);
    drag.lastFrame = now;

    let depth = 0;
    let dir = 0;
    if (drag.lastY < SCROLL_EDGE) {
      depth = (SCROLL_EDGE - drag.lastY) / SCROLL_EDGE;
      dir = -1;
    } else if (drag.lastY > innerHeight - SCROLL_EDGE) {
      depth = (drag.lastY - (innerHeight - SCROLL_EDGE)) / SCROLL_EDGE;
      dir = 1;
    }

    if (dir) {
      if (!drag.edgeSince) drag.edgeSince = now;
      const ratio = Math.min(depth, 1);
      const boost = 1 + SCROLL_BOOST * Math.min((now - drag.edgeSince) / SCROLL_BOOST_MS, 1);
      const speed = (SCROLL_MIN + (SCROLL_MAX - SCROLL_MIN) * ratio * ratio) * boost;
      // behavior "instant": the site sets scroll-behavior: smooth on
      // <html>, which otherwise turns every per-frame nudge into its own
      // smooth-scroll animation that the next frame cancels, so the page
      // barely moved.
      window.scrollBy({ top: dir * speed * dt, behavior: "instant" });
      moveDrag();
    } else {
      drag.edgeSince = 0;
    }
    drag.scrollRaf = requestAnimationFrame(autoScroll);
  }

  // Scrolling with the mouse wheel mid-drag moves the rows under the
  // (fixed) floating copy, so re-check where the drop spot is.
  window.addEventListener(
    "scroll",
    () => {
      if (drag) moveDrag();
    },
    { passive: true },
  );

  function endDrag() {
    const { row, ghost } = drag;
    cancelAnimationFrame(drag.scrollRaf);
    drag = null;

    const target = row.getBoundingClientRect();
    ghost.animate([{ top: ghost.style.top }, { top: target.top + "px" }], {
      duration: 150,
      easing: "ease-out",
      fill: "forwards",
    });
    // A timer rather than the animation's onfinish: animations can stall
    // (e.g. a background tab), and the row must never stay stuck faded.
    setTimeout(() => {
      ghost.remove();
      row.classList.remove("song-drag-placeholder");
    }, 160);
    document.body.classList.remove("is-dragging-song");

    // Put the reordered (visible) songs back into the full custom order.
    // When filtered to one artist, the other artists' songs keep their
    // slots and only the visible songs swap among the slots they held.
    const newVisible = Array.from(list.querySelectorAll(".song-row")).map((r) => r.dataset.id);
    const visibleSet = new Set(newVisible);
    let k = 0;
    customOrder = customOrder.map((id) => (visibleSet.has(id) ? newVisible[k++] : id));
    save(ORDER_KEY, customOrder);

    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
  }

  window.addEventListener("pointerup", () => {
    cancelPress();
    if (drag) endDrag();
  });
  window.addEventListener("pointercancel", () => {
    cancelPress();
    if (drag) endDrag();
  });

  // ===== Playback =====
  function openStage() {
    if (stage.classList.contains("is-open")) return;
    stage.classList.add("is-open");
    stage.setAttribute("aria-hidden", "false");
  }

  // Shows the video if it was picked last and this song has one; otherwise
  // the cover. Audio-only songs don't reset the pick, so the next .mp4 song
  // opens straight in video mode again.
  // animate: fade out -> swap cover/video (and the box's size) -> fade in,
  // so the page re-lays-out once instead of on every frame. Used for the
  // Song/Video tabs; song changes and fullscreen swap instantly.
  const SWITCH_FADE_MS = 150;
  let switchTimer = 0;

  function applyMode(animate) {
    const current = songById(currentId);
    const mode = wantVideo && current && hasVideo(current) ? "video" : "cover";
    stageModes.querySelectorAll(".stage-mode").forEach((b) => {
      const active = b.dataset.mode === mode;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });

    syncVideo();
    clearTimeout(switchTimer);
    if (!animate || stageMedia.dataset.mode === mode || reduceMotion.matches) {
      stageMedia.classList.remove("is-switching");
      stageMedia.dataset.mode = mode;
      return;
    }
    stageMedia.classList.add("is-switching");
    switchTimer = setTimeout(() => {
      stageMedia.dataset.mode = mode;
      stageMedia.classList.remove("is-switching");
    }, SWITCH_FADE_MS);
  }

  stageModes.addEventListener("click", (e) => {
    const b = e.target.closest(".stage-mode");
    if (!b) return;
    wantVideo = b.dataset.mode === "video";
    applyMode(true);
  });

  function loadSong(song) {
    currentId = song.id;
    media.src = song.src;
    stageCover.src = coverOf(song);
    stageTitle.textContent = song.title;
    stageArtist.innerHTML = artistLineHTML(song);
    stageModes.hidden = !hasVideo(song);
    stageSeek.value = 0;
    stageCurrent.textContent = "0:00";
    stageDuration.textContent = durations.has(song.id) ? fmt(durations.get(song.id)) : "0:00";
    applyMode();
    // Moving on to an audio-only song while the video is fullscreen: leave
    // fullscreen, since there's nothing to show.
    if (!hasVideo(song) && isFullscreen()) exitFullscreen();
    miniCover.src = thumbOf(song);
    miniTitle.textContent = song.title;
    miniArtist.innerHTML = artistLineHTML(song);
    miniFill.style.width = "0%";
    refreshMarquees();
    loadLyrics(song);
    updateSession(song);
  }

  // ===== Shuffle / repeat (same behavior as the top-right player) =====
  // Shuffle: "next" picks a random song from the table that hasn't played
  // yet this round; once every song has played, a new round starts.
  // "Previous" walks back through what actually played.
  // Repeat: the current song starts over when it ends.
  let shuffle = false;
  let repeat = false;
  let shuffleSeen = new Set();
  const playHistory = []; // not "history" — that would hide window.history

  const shuffleBtn = document.getElementById("stageShuffle");
  const repeatBtn = document.getElementById("stageRepeat");

  // The big player and the mini player each have a shuffle and a repeat
  // button; both pairs always show the same on/off state.
  const shuffleBtns = [shuffleBtn, document.getElementById("miniShuffle")];
  const repeatBtns = [repeatBtn, document.getElementById("miniRepeat")];

  function paintToggle(btns, on) {
    btns.forEach((b) => {
      b.classList.toggle("toggle-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  function toggleShuffle() {
    shuffle = !shuffle;
    shuffleSeen = new Set(currentId ? [currentId] : []);
    paintToggle(shuffleBtns, shuffle);
  }

  function toggleRepeat() {
    repeat = !repeat;
    paintToggle(repeatBtns, repeat);
  }

  shuffleBtns.forEach((b) => b.addEventListener("click", toggleShuffle));
  repeatBtns.forEach((b) => b.addEventListener("click", toggleRepeat));

  // fromHistory: going back via "previous", so don't record it again.
  function playSong(id, fromHistory) {
    const song = songById(id);
    if (!song || !song.src) return;
    if (id === currentId) {
      if (media.paused) media.play().catch(() => {});
      else media.pause();
      return;
    }
    if (currentId && !fromHistory) playHistory.push(currentId);
    shuffleSeen.add(id);
    loadSong(song);
    openStage();
    media.play().catch(() => {});
  }

  // Next/previous follow the table as it's currently shown (sort + filter),
  // skipping songs that don't have a file yet.
  function step(direction) {
    const songs = visibleSongs().filter((s) => s.src);
    if (!songs.length) return null;
    const i = songs.findIndex((s) => s.id === currentId);
    if (i === -1) return songs[0];
    return songs[i + direction] || null;
  }

  function shufflePick() {
    const playable = visibleSongs().filter((s) => s.src && s.id !== currentId);
    if (!playable.length) return null;
    let pool = playable.filter((s) => !shuffleSeen.has(s.id));
    if (!pool.length) {
      shuffleSeen = new Set([currentId]); // everything played — new round
      pool = playable;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function next() {
    const song = shuffle ? shufflePick() : step(1);
    if (song) playSong(song.id);
  }

  // always: skip the "restart the song if it's past 3s" step — a swipe on
  // the mini player always changes song, like Spotify's
  function prev(always) {
    if (always !== true && media.currentTime > 3) {
      media.currentTime = 0;
      return;
    }
    if (shuffle && playHistory.length) {
      playSong(playHistory.pop(), true);
      return;
    }
    const song = step(-1);
    if (song) playSong(song.id);
    else media.currentTime = 0;
  }

  // Scrolls the page so the cover/video sits at the top of the window. The
  // mini player's cover/title does this every time; the table does it only
  // for the FIRST song started after the page loads (or is refreshed), so
  // you see the player open — after that, table clicks leave the page
  // where it is.
  const REVEAL_GAP = 16; // px between the window top and the cover/video
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let revealedFromTable = false;

  function revealStage() {
    const top = stageMedia.getBoundingClientRect().top + window.scrollY - REVEAL_GAP;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  function playFromRow(row) {
    playSong(row.dataset.id);
    // Only once a song has actually started (not for "Soon" rows).
    if (!revealedFromTable && currentId === row.dataset.id) {
      revealedFromTable = true;
      revealStage();
    }
  }

  list.addEventListener("click", (e) => {
    if (suppressClick) return;
    const row = e.target.closest(".song-row");
    if (row) playFromRow(row);
  });

  list.addEventListener("keydown", (e) => {
    const row = e.target.closest(".song-row");
    if (!row) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      playFromRow(row);
    }
  });

  function togglePlay() {
    if (!currentId) return;
    if (media.paused) media.play().catch(() => {});
    else media.pause();
  }

  stagePlay.addEventListener("click", togglePlay);

  // ===== Video-style controls =====
  // Clicking the cover or the video pauses/plays it. Anywhere on the page
  // (once a song is loaded), ← / → jump back/forward 10 seconds, Space
  // pauses/plays and F toggles fullscreen (video songs), YouTube-style. A quick icon flashes over the cover/video
  // so it's clear what happened.
  const SEEK_STEP = 10;
  const stageFlash = document.getElementById("stageFlash");
  const ICON_BACK =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 6v12L2.5 12zM21 6v12l-8.5-6z"/></svg>';
  const ICON_FWD =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 6v12l8.5-6zM3 6v12l8.5-6z"/></svg>';

  function flash(side, html) {
    stageFlash.dataset.side = side;
    stageFlash.innerHTML = '<span class="stage-flash-bubble">' + html + "</span>";
    stageFlash.classList.remove("show");
    void stageFlash.offsetWidth; // restart the animation on repeated presses
    stageFlash.classList.add("show");
  }

  function togglePlayWithFlash() {
    togglePlay();
    flash("center", media.paused ? ICON_PAUSE : ICON_PLAY);
  }

  function seekBy(seconds) {
    if (!currentId || !media.duration) return;
    media.currentTime = Math.min(Math.max(media.currentTime + seconds, 0), media.duration - 0.25);
    flash(
      seconds < 0 ? "left" : "right",
      (seconds < 0 ? ICON_BACK : ICON_FWD) + "<span>" + Math.abs(seconds) + "s</span>",
    );
  }

  // Closing iPhone's fullscreen player (or its picture-in-picture window)
  // can leave a stray tap landing on the video box right after, which
  // paused the song as it came back — so taps there are ignored for a
  // moment afterwards (see onFullscreenEnd / syncPip below).
  const GHOST_TAP_MS = 700;
  let ignoreTapsUntil = 0;

  stageMedia.addEventListener("click", () => {
    if (performance.now() < ignoreTapsUntil) return;
    if (currentId) togglePlayWithFlash();
  });

  const nowPlayingView = document.getElementById("nowPlayingView");
  document.addEventListener("keydown", (e) => {
    if (!currentId || e.altKey || e.ctrlKey || e.metaKey) return;
    // Leave typing fields and the seek slider (which has its own arrow
    // keys) alone, and don't fight the site's Now Playing overlay.
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (nowPlayingView && !nowPlayingView.hidden) return;

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      seekBy(e.key === "ArrowLeft" ? -SEEK_STEP : SEEK_STEP);
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === " " && !e.target.closest("button, a, .song-row")) {
      // Space on a focused button/row already activates that element.
      e.preventDefault();
      togglePlayWithFlash();
    }
  });
  document.getElementById("stageNext").addEventListener("click", next);
  document.getElementById("stagePrev").addEventListener("click", prev);

  function syncPlayState() {
    const playing = !media.paused;
    stage.classList.toggle("is-playing", playing);
    const playLabel = playing ? T("music.pause", "Pause") : T("music.play", "Play");
    stagePlay.setAttribute("aria-label", playLabel);
    miniPlayer.classList.toggle("is-playing", playing);
    miniPlay.setAttribute("aria-label", playLabel);
    updatePlayingRows();
  }

  media.addEventListener("play", () => {
    // Only one thing plays at a time: pause the site's background music.
    if (bgm && !bgm.paused) bgm.pause();
    syncPlayState();
    startLyricsLoop();
  });
  media.addEventListener("pause", syncPlayState);
  media.addEventListener("ended", () => {
    if (repeat) {
      media.currentTime = 0;
      media.play().catch(() => {});
    } else {
      next();
    }
  });

  if (bgm) {
    bgm.addEventListener("play", () => {
      if (!media.paused) media.pause();
    });
  }

  // ===== Video follows audio =====
  // The <video> only loads while Video mode is showing (so Song mode never
  // downloads the picture), stays muted, and is kept on the audio's time.
  // When the phone locks or the browser goes to the background, the phone
  // pauses the <video> but the <audio> carries on; coming back catches the
  // picture up. (Plain functions + var: applyMode can call this early.)
  var ownVideoChangeAt = -Infinity; // when syncVideo itself last paused/switched it
  video.muted = true;
  // iPhone's fullscreen player has a mute button; the sound is the <audio>'s
  // job, so the picture never gets its own (it would echo).
  video.addEventListener("volumechange", () => {
    if (!video.muted) video.muted = true;
  });

  function videoWanted() {
    const song = songById(currentId);
    return !!(song && wantVideo && hasVideo(song));
  }

  function syncVideo() {
    if (!videoWanted()) {
      if (video.getAttribute("src")) {
        ownVideoChangeAt = performance.now();
        video.pause();
        video.removeAttribute("src");
        video.load(); // stops the download
      }
      return;
    }
    const song = songById(currentId);
    if (video.getAttribute("src") !== song.src) {
      ownVideoChangeAt = performance.now();
      video.src = song.src;
    }
    if (Math.abs(video.currentTime - media.currentTime) > 0.25) video.currentTime = media.currentTime;
    if (!media.paused && !document.hidden) video.play().catch(() => {});
    else if (media.paused && !video.paused) {
      ownVideoChangeAt = performance.now();
      video.pause();
    }
  }

  ["play", "pause", "seeked"].forEach((ev) => media.addEventListener(ev, syncVideo));
  video.addEventListener("loadedmetadata", syncVideo);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncVideo();
  });

  // Small drift while both play: nudge the picture back onto the sound.
  media.addEventListener("timeupdate", () => {
    if (!videoWanted() || document.hidden || video.seeking || video.readyState < 2) return;
    if (Math.abs(video.currentTime - media.currentTime) > 0.3) video.currentTime = media.currentTime;
  });

  // iPhone's own fullscreen player / picture-in-picture window control the
  // <video> directly, so their play, pause and scrubbing are passed on to
  // the <audio>. A pause the phone makes itself (screen locking, the player
  // closing, a song change) is not.
  function isPip() {
    return (
      document.pictureInPictureElement === video ||
      video.webkitPresentationMode === "picture-in-picture"
    );
  }

  function nativePlayer() {
    return !!video.webkitDisplayingFullscreen || isPip();
  }

  video.addEventListener("play", () => {
    if (nativePlayer() && media.paused) media.play().catch(() => {});
  });

  video.addEventListener("pause", () => {
    if (!nativePlayer() || media.paused) return;
    if (performance.now() - ownVideoChangeAt < 1000) return;
    setTimeout(() => {
      if (video.paused && nativePlayer() && !media.paused && (!document.hidden || isPip()))
        media.pause();
    }, 300);
  });

  video.addEventListener("seeked", () => {
    if (nativePlayer() && Math.abs(video.currentTime - media.currentTime) > 1)
      media.currentTime = video.currentTime;
  });

  // ===== Lock screen / notification controls =====
  // Media Session: the phone's lock screen, notification shade and
  // headphone buttons show the cover, title and artist and get play/pause,
  // previous/next and a seek bar — Spotify-style. (No ±10s buttons: on
  // iPhone those would replace previous/next.)
  function plainText(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent.trim();
  }

  function updateSession(song) {
    if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: plainText(artistLineHTML(song)),
        album: "異世界コレクション",
        artwork: [{ src: new URL(coverOf(song), location.href).href }],
      });
    } catch (e) {
      /* old browser: no lock screen details */
    }
  }

  function updatePosition() {
    const ms = navigator.mediaSession;
    if (!ms || !ms.setPositionState || !isFinite(media.duration) || !media.duration) return;
    try {
      ms.setPositionState({
        duration: media.duration,
        playbackRate: media.playbackRate || 1,
        position: Math.min(media.currentTime, media.duration),
      });
    } catch (e) {
      /* ignore */
    }
  }

  if ("mediaSession" in navigator) {
    const ms = navigator.mediaSession;
    const actions = {
      play: () => media.play().catch(() => {}),
      pause: () => media.pause(),
      previoustrack: () => prev(),
      nexttrack: () => next(),
      seekto: (d) => {
        if (media.duration) media.currentTime = Math.min(Math.max(d.seekTime, 0), media.duration);
      },
    };
    Object.keys(actions).forEach((name) => {
      try {
        ms.setActionHandler(name, actions[name]);
      } catch (e) {
        /* this browser doesn't offer that button */
      }
    });
    media.addEventListener("play", () => {
      ms.playbackState = "playing";
      updatePosition();
    });
    media.addEventListener("pause", () => {
      ms.playbackState = "paused";
      updatePosition();
    });
    ["loadedmetadata", "seeked", "ratechange"].forEach((ev) =>
      media.addEventListener(ev, updatePosition),
    );
  }

  // ===== Seek bar =====
  let seeking = false;

  function paintSeek() {
    stageSeek.style.setProperty("--fill", stageSeek.value / 10 + "%");
  }

  media.addEventListener("loadedmetadata", () => {
    stageDuration.textContent = fmt(media.duration);
    durations.set(currentId, media.duration);
  });

  media.addEventListener("timeupdate", () => {
    if (seeking || !media.duration) return;
    stageSeek.value = Math.round((media.currentTime / media.duration) * 1000);
    stageCurrent.textContent = fmt(media.currentTime);
    paintSeek();
    miniFill.style.width = (media.currentTime / media.duration) * 100 + "%";
  });

  stageSeek.addEventListener("input", () => {
    seeking = true;
    paintSeek();
    if (media.duration) stageCurrent.textContent = fmt((stageSeek.value / 1000) * media.duration);
  });

  stageSeek.addEventListener("change", () => {
    if (media.duration) media.currentTime = (stageSeek.value / 1000) * media.duration;
    seeking = false;
  });

  // ===== Fullscreen (songs with a video) =====
  // Fullscreens the whole cover/video box (not just the <video>), so
  // click-to-pause, the ← / → / Space flashes and this button keep working
  // inside it. iPhones can't fullscreen a page element, so they fall back
  // to the <video>'s own native fullscreen player.
  const stageFs = document.getElementById("stageFs");

  function isFullscreen() {
    return (document.fullscreenElement || document.webkitFullscreenElement) === stageMedia;
  }

  function exitFullscreen() {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) exit.call(document);
  }

  function toggleFullscreen() {
    const song = songById(currentId);
    if (!song || !hasVideo(song)) return;
    if (isFullscreen()) {
      exitFullscreen();
      return;
    }
    if (stageMedia.dataset.mode !== "video") {
      wantVideo = true;
      applyMode();
    }
    // fullscreenEnabled, not just "the method exists": an iPhone can expose
    // requestFullscreen yet refuse it for anything but a <video>, which
    // would make the button silently do nothing.
    const canFsElement = document.fullscreenEnabled || document.webkitFullscreenEnabled;
    if (canFsElement && stageMedia.requestFullscreen)
      stageMedia.requestFullscreen().catch(() => {});
    else if (canFsElement && stageMedia.webkitRequestFullscreen)
      stageMedia.webkitRequestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  }

  stageFs.addEventListener("click", (e) => {
    e.stopPropagation(); // don't also pause/play via the video click
    toggleFullscreen();
  });

  stageMedia.addEventListener("dblclick", () => {
    if (stageMedia.dataset.mode === "video") toggleFullscreen();
  });

  // Leaving fullscreen keeps the song playing. Some browsers (iPhone's
  // native player especially) pause the video as it closes; if a pause
  // lands right as fullscreen ends, it's undone. A pause you make yourself
  // earlier than that stays paused.
  const FS_PAUSE_WINDOW_MS = 500;
  let lastPauseAt = -Infinity;
  let fsEndedAt = -Infinity;
  let playingWhenFsEnded = false;
  let wasFullscreen = false;
  // playing as far as the play/pause events have told us — a pause shows
  // up in media.paused straight away but its event a moment later
  let heardPlaying = false;

  media.addEventListener("play", () => {
    heardPlaying = true;
  });

  media.addEventListener("pause", () => {
    const t = performance.now();
    if (playingWhenFsEnded && !media.ended && t - fsEndedAt < FS_PAUSE_WINDOW_MS) {
      media.play().catch(() => {});
      return;
    }
    heardPlaying = false;
    lastPauseAt = t;
  });

  function onFullscreenEnd() {
    const t = performance.now();
    fsEndedAt = t;
    ignoreTapsUntil = t + GHOST_TAP_MS;
    // still playing, or paused only a moment ago by the closing player
    // (its pause event may not even have arrived yet)
    playingWhenFsEnded =
      !media.ended && (!media.paused || heardPlaying || t - lastPauseAt < FS_PAUSE_WINDOW_MS);
    if (playingWhenFsEnded && media.paused) media.play().catch(() => {});
    syncVideo(); // the closing player may have paused the picture
  }
  video.addEventListener("webkitendfullscreen", onFullscreenEnd); // iPhone

  // Picture in picture (the button in iPhone's fullscreen player that
  // shrinks the video into a floating window): the video box on the page
  // would sit empty meanwhile, so it shows the song's cover instead.
  function syncPip() {
    const pip = isPip();
    if (stageMedia.classList.contains("is-pip") && !pip)
      ignoreTapsUntil = performance.now() + GHOST_TAP_MS;
    stageMedia.classList.toggle("is-pip", pip);
  }
  video.addEventListener("enterpictureinpicture", syncPip);
  video.addEventListener("leavepictureinpicture", syncPip);
  video.addEventListener("webkitpresentationmodechanged", syncPip);

  function onFullscreenChange() {
    const fs = isFullscreen();
    if (wasFullscreen && !fs) onFullscreenEnd();
    wasFullscreen = fs;
    stageMedia.classList.toggle("is-fullscreen", fs);
    const fsLabel = fs
      ? T("music.exitFullscreen", "Exit full screen")
      : T("music.fullscreen", "Full screen");
    stageFs.setAttribute("aria-label", fsLabel);
    stageFs.title = fsLabel + " (F)";
    updateMini();
  }
  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);

  // ===== Mini player =====
  // Once you've scrolled down past the big player's controls (the song
  // list can get long), a small player slides up at the bottom of the
  // screen. Only when they're ABOVE you: when the controls are still below
  // (e.g. at the top of the page on a short screen) there's no mini player.
  // Clicking its cover/title scrolls back up to the big player.
  const miniPlayer = document.getElementById("miniPlayer");
  const miniCover = document.getElementById("miniCover");
  const miniTitle = document.getElementById("miniTitle");
  const miniArtist = document.getElementById("miniArtist");
  const miniPlay = document.getElementById("miniPlay");
  const miniFill = document.getElementById("miniFill");
  const miniProgress = document.getElementById("miniProgress");
  let scrolledPastControls = false;

  function updateMini() {
    const show =
      !!currentId && stage.classList.contains("is-open") && scrolledPastControls && !isFullscreen();
    const wasShown = miniPlayer.classList.contains("is-visible");
    miniPlayer.classList.toggle("is-visible", show);
    miniPlayer.inert = !show;
    // Each time it slides in, long text starts again from the beginning;
    // while it's hidden, the scrolling pauses.
    if (show && !wasShown) refreshMarquees();
    else if (!show) marquees.forEach((m) => m.anim && m.anim.pause());
    if (show && !wasShown && typeof startLyricsLoop === "function") {
      syncLyrics(true);
      startLyricsLoop();
    }
  }

  // ----- Scrolling text (Spotify-style) -----
  // A line that's too long for the mini player holds at the start, slides
  // left until its end is visible, holds, then slides back to the start —
  // on repeat. Lines that fit stay still. Title and artist are measured
  // separately, so only the one that's cut off moves.
  const MARQUEE_SPEED = 30; // px per second while sliding
  const MARQUEE_HOLD = 2000; // ms paused at each end
  const marquees = [miniTitle, miniArtist].map((inner) => ({
    inner,
    box: inner.parentElement,
    anim: null,
  }));

  function runMarquee(m) {
    if (m.anim) m.anim.cancel();
    m.anim = null;
    m.box.classList.add("is-marquee");
    const distance = m.box.scrollWidth - m.box.clientWidth;
    if (distance <= 1 || reduceMotion.matches) {
      // Fits (or the device asks for less motion): no scrolling — a line
      // that still doesn't fit just ends in "…".
      m.box.classList.remove("is-marquee");
      return;
    }
    const move = (distance / MARQUEE_SPEED) * 1000;
    const total = MARQUEE_HOLD * 2 + move * 2;
    const at = (ms) => ms / total;
    const start = "translateX(0)";
    const end = "translateX(" + -distance + "px)";
    m.anim = m.inner.animate(
      [
        { transform: start, offset: 0 },
        { transform: start, offset: at(MARQUEE_HOLD), easing: "ease-in-out" },
        { transform: end, offset: at(MARQUEE_HOLD + move) },
        { transform: end, offset: at(MARQUEE_HOLD * 2 + move), easing: "ease-in-out" },
        { transform: start, offset: 1 },
      ],
      { duration: total, iterations: Infinity },
    );
    if (!miniPlayer.classList.contains("is-visible")) m.anim.pause();
  }

  // JP / EN switched: relabel everything built here (fixed text marked
  // data-i18n in music.html is swapped by i18n.js). Playback isn't touched.
  document.addEventListener("langchange", () => {
    renderHeading();
    renderArtists();
    renderSongs();
    renderSortUI();
    syncPlayState();
    onFullscreenChange();
    const song = SONGS.find((x) => x.id === currentId);
    if (song) {
      stageArtist.innerHTML = artistLineHTML(song);
      miniArtist.innerHTML = artistLineHTML(song);
      refreshMarquees();
    }
  });

  function refreshMarquees() {
    marquees.forEach(runMarquee);
  }

  // Widths change with the window size, and once the web font finishes
  // loading.
  let marqueeResizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(marqueeResizeTimer);
    marqueeResizeTimer = setTimeout(refreshMarquees, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshMarquees);

  new IntersectionObserver(([entry]) => {
    // Off screen AND above the window's top edge = scrolled past them.
    scrolledPastControls = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
    updateMini();
  }).observe(stage.querySelector(".stage-controls"));

  miniPlay.addEventListener("click", togglePlay);
  document.getElementById("miniPrev").addEventListener("click", prev);
  document.getElementById("miniNext").addEventListener("click", next);
  document.getElementById("miniArt").addEventListener("click", revealStage);

  // ----- Swipe the mini player to change song (phones) -----
  // Phones have no ⏮ / ⏭ in the mini player (style.css); instead, like
  // Spotify, drag the cover + title sideways: left for the next song, right
  // for the previous one. They follow the finger, slide out, and the new
  // song's slide in from the other side. Taps still go back to the player.
  const phoneMini = window.matchMedia("(max-width: 700px)");
  const swipeParts = [document.getElementById("miniArt"), document.getElementById("miniInfo")];
  const SWIPE_COMMIT_PX = 60;
  const SWIPE_OUT_MS = 180;
  let swipeTracking = false;
  let swiping = false;
  let swallowClick = false;
  let swipeX = 0;
  let swipeY = 0;
  let swipeDx = 0;

  function setSwipe(dx, ms) {
    swipeParts.forEach((el) => {
      el.style.transition = ms ? "transform " + ms + "ms ease, opacity " + ms + "ms ease" : "none";
      el.style.transform = dx ? "translateX(" + dx + "px)" : "";
      el.style.opacity = dx ? String(Math.max(0, 1 - Math.abs(dx) / 160)) : "";
    });
  }

  miniPlayer.addEventListener("pointerdown", (e) => {
    swallowClick = false;
    if (!phoneMini.matches || e.button !== 0) return;
    if (e.target.closest(".mini-controls, .mini-progress, .mini-lyrics-btn, .mini-lyrics")) return;
    swipeTracking = true;
    swiping = false;
    swipeX = e.clientX;
    swipeY = e.clientY;
    swipeDx = 0;
  });

  miniPlayer.addEventListener("pointermove", (e) => {
    if (!swipeTracking) return;
    const dx = e.clientX - swipeX;
    const dy = e.clientY - swipeY;
    if (!swiping) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        swipeTracking = false; // up/down: leave it to the page's scrolling
        return;
      }
      swiping = true;
      try {
        miniPlayer.setPointerCapture(e.pointerId);
      } catch (err) {
        // not a live pointer (shouldn't happen): the drag still works
      }
    }
    swipeDx = dx;
    setSwipe(dx, 0);
  });

  function endSwipe() {
    if (!swipeTracking) return;
    swipeTracking = false;
    if (!swiping) return;
    swiping = false;
    swallowClick = true; // the lift after a drag isn't a tap
    const dir = swipeDx <= -SWIPE_COMMIT_PX ? 1 : swipeDx >= SWIPE_COMMIT_PX ? -1 : 0;
    if (!dir) {
      setSwipe(0, 200); // not far enough: spring back
      return;
    }
    setSwipe(dir * -140, SWIPE_OUT_MS);
    setTimeout(() => {
      if (dir === 1) next();
      else prev(true);
      setSwipe(dir * 140, 0);
      void miniPlayer.offsetWidth; // start the slide-in from the far side
      setSwipe(0, 220);
    }, SWIPE_OUT_MS);
  }

  miniPlayer.addEventListener("pointerup", endSwipe);
  miniPlayer.addEventListener("pointercancel", endSwipe);
  miniPlayer.addEventListener(
    "click",
    (e) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.stopPropagation();
      e.preventDefault();
    },
    true,
  );
  document.getElementById("miniInfo").addEventListener("click", revealStage);

  // The thin bar along the bottom doubles as a seek bar.
  miniProgress.addEventListener("click", (e) => {
    if (!media.duration) return;
    const box = miniProgress.getBoundingClientRect();
    media.currentTime =
      Math.min(Math.max((e.clientX - box.left) / box.width, 0), 1) * media.duration;
  });

  // ===== Lyrics =====
  // Songs with `lyrics` in songs.js get the Lyrics (歌詞) slide switch
  // under the player. ON opens the lyrics beside the player (the two stay
  // centered together); they start at the top, the current line lights up
  // and, once it's a third of the way down, the list scrolls to keep it
  // there, like Spotify. Clicking a line jumps there. Scrolling the
  // lyrics yourself pauses the auto-scroll for a few seconds. Scrolled
  // down, the mini player shows the current + next line, with its own
  // switch beside it. ON/OFF is remembered.
  //
  // Loading (LRCLIB or your own .lrc, lyricsOffset, lyricsEdits) lives in
  // js/lyrics.js.
  const LYRICS_KEY = "isekai.music.lyrics";
  const LYRICS_USER_SCROLL_MS = 3000;
  const LYRICS_INTRO_GAP = 4; // s before the first line that earns intro dots
  // Light a line up a bit before its timestamp: LRC times mark when the
  // first word is sung, and a line lit exactly then already reads as late.
  const LYRICS_LEAD = 0.2;
  // Clicking a line starts the song this much before it, so its first
  // word is never clipped.
  const LYRICS_PREROLL = 0.3;
  const LYRICS_ANCHOR = 0.3; // where the current line sits, from the top of the panel
  const lyricsToggle = document.getElementById("lyricsToggle");
  const stageLyrics = document.getElementById("stageLyrics");
  const lyricsScroll = document.getElementById("lyricsScroll");
  const lyricsLines = document.getElementById("lyricsLines");
  const miniLyricsBtn = document.getElementById("miniLyricsBtn");
  const miniLyricNow = document.getElementById("miniLyricNow");
  const miniLyricNext = document.getElementById("miniLyricNext");

  // Phones: the lyrics card sits under the mini player, which moves up by
  // the card's height, and the page gets that much extra room at the
  // bottom so the last songs can scroll clear of both (see --mini-h /
  // --mini-lyrics-h in style.css). Card height changes with line length.
  if ("ResizeObserver" in window) {
    const miniLyricsCard = document.getElementById("miniLyrics");
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--mini-h", miniPlayer.offsetHeight + "px");
      document.documentElement.style.setProperty(
        "--mini-lyrics-h",
        miniLyricsCard.offsetHeight + "px",
      );
    });
    ro.observe(miniPlayer);
    ro.observe(miniLyricsCard);
  }
  const lyricsLoads = new Map(); // song id -> Promise of its lines

  let lyricsOn = load(LYRICS_KEY) === true;
  let lyrics = null; // lines of the current song, or null
  let lyricRows = [];
  let activeLine = -2; // -2 = nothing painted yet
  let userScrollUntil = 0;
  let lyricsRaf = 0;
  let lyricsPanelOnScreen = false;

  function loadLyrics(song) {
    lyrics = null;
    renderLyrics();
    if (!song.lyrics || typeof Lyrics === "undefined") return;
    const id = song.id;
    let p = lyricsLoads.get(id);
    if (!p) {
      p = Lyrics.load(song, artistOf(song).name);
      lyricsLoads.set(id, p);
    }
    p.then((loaded) => {
      if (currentId !== id || !loaded.length) return;
      // Copy: the intro-dots line below mustn't end up in the cached list.
      const lines = loaded.slice();
      // An empty line (instrumental break) shows as dots, and so does a
      // long intro before the first line.
      if (lines[0].t >= LYRICS_INTRO_GAP && lines[0].text) lines.unshift({ t: 0, text: "" });
      lyrics = lines;
      renderLyrics();
    }).catch(() => lyricsLoads.delete(id)); // not found / offline: no switch, try again next time
  }

  const DOTS = '<span class="lyric-dots" aria-hidden="true"><i></i><i></i><i></i></span>';

  function renderLyrics() {
    lyricsLines.innerHTML = (lyrics || [])
      .map((l, i) =>
        l.text
          ? '<li class="lyric-line" data-i="' + i + '">' + esc(l.text) + "</li>"
          : '<li class="lyric-line is-gap" data-i="' + i + '">' + DOTS + "</li>",
      )
      .join("");
    lyricRows = Array.from(lyricsLines.children);
    activeLine = -2;
    lyricsScroll.scrollTop = 0;
    updateLyricsUI();
  }

  function lyricsShown() {
    return !!lyrics && lyricsOn;
  }

  function updateLyricsUI() {
    const has = !!lyrics;
    const open = lyricsShown();
    lyricsToggle.hidden = !has;
    miniLyricsBtn.hidden = !has;
    [lyricsToggle, miniLyricsBtn].forEach((b) => b.setAttribute("aria-checked", String(lyricsOn)));
    stage.classList.toggle("lyrics-open", open);
    miniPlayer.classList.toggle("lyrics-open", open);
    stageLyrics.inert = !open;
    stageLyrics.setAttribute("aria-hidden", String(!open));
    if (open) {
      syncLyrics(true);
      startLyricsLoop();
    }
  }

  function setLyricsOn(on) {
    if (lyricsOn === on) return;
    lyricsOn = on;
    save(LYRICS_KEY, on);
    if (on) userScrollUntil = 0;
    updateLyricsUI();
  }

  [lyricsToggle, miniLyricsBtn].forEach((b) =>
    b.addEventListener("click", () => setLyricsOn(!lyricsOn)),
  );

  // The line being sung: the last one whose time has come (-1 = before
  // the first). Starts from the current line (usually a step or two
  // away) rather than counting from the top every frame.
  function lineAt(time) {
    const now = time + LYRICS_LEAD;
    let i = Math.min(Math.max(activeLine, -1), lyrics.length - 1);
    while (i >= 0 && lyrics[i].t > now) i--;
    while (i + 1 < lyrics.length && lyrics[i + 1].t <= now) i++;
    return i;
  }

  // instant: jump straight there (the panel just opened, or a new song)
  // instead of gliding.
  function syncLyrics(instant) {
    if (!lyricsShown()) return;
    const i = lineAt(media.currentTime || 0);
    if (i === activeLine && !instant) return;
    const prevLine = activeLine;
    activeLine = i;
    lyricRows.forEach((row, k) => {
      row.classList.toggle("is-active", k === i);
      row.classList.toggle("is-past", k < i);
    });

    const now = lyrics[i];
    const nextLine = lyrics[i + 1];
    miniLyricNow.innerHTML = now && now.text ? esc(now.text) : DOTS;
    miniLyricNext.textContent = nextLine ? nextLine.text : "";

    if (performance.now() < userScrollUntil) return;
    const row = lyricRows[Math.max(i, 0)];
    if (!row) return;
    const top = row.offsetTop - lyricsScroll.clientHeight * LYRICS_ANCHOR;
    // A jump of more than a couple of lines (seeking) snaps instead of
    // scrolling through everything in between.
    const far = Math.abs(i - prevLine) > 2;
    lyricsScroll.scrollTo({
      top: Math.max(0, top),
      behavior: instant || far || reduceMotion.matches ? "auto" : "smooth",
    });
  }

  // timeupdate only fires ~4 times a second — too coarse for lyrics — so
  // while playing, check every frame (cheap: the page only changes when
  // the line does).
  // Only while the lyrics can actually be seen: the panel is on screen or
  // the mini player is up. Otherwise the loop stops, and restarts (and
  // catches up) as soon as either comes into view.
  function lyricsVisible() {
    return lyricsShown() && (lyricsPanelOnScreen || miniPlayer.classList.contains("is-visible"));
  }

  function lyricsTick() {
    lyricsRaf = 0;
    syncLyrics();
    if (!media.paused && lyricsVisible()) lyricsRaf = requestAnimationFrame(lyricsTick);
  }

  function startLyricsLoop() {
    if (!lyricsRaf && !media.paused && lyricsVisible())
      lyricsRaf = requestAnimationFrame(lyricsTick);
  }

  new IntersectionObserver(([entry]) => {
    lyricsPanelOnScreen = entry.isIntersecting;
    if (lyricsPanelOnScreen) {
      syncLyrics(true);
      startLyricsLoop();
    }
  }).observe(stageLyrics);

  // Paused seeks (seek bar, ← / →) still move the highlight.
  media.addEventListener("seeked", () => syncLyrics());

  lyricsLines.addEventListener("click", (e) => {
    const row = e.target.closest(".lyric-line");
    if (!row || !lyrics) return;
    userScrollUntil = 0;
    media.currentTime = Math.max(0, lyrics[Number(row.dataset.i)].t - LYRICS_PREROLL);
    if (media.paused) media.play().catch(() => {});
  });

  // The panel's height changes while the stage opens (and on resizing the
  // window); re-place the current line once it settles.
  new ResizeObserver(() => syncLyrics(true)).observe(lyricsScroll);

  // Top edge fades only once the list has scrolled, so the first lines
  // aren't faded at the start.
  lyricsScroll.addEventListener(
    "scroll",
    () => lyricsScroll.classList.toggle("is-scrolled", lyricsScroll.scrollTop > 4),
    { passive: true },
  );

  ["wheel", "touchmove"].forEach((type) =>
    lyricsScroll.addEventListener(
      type,
      () => (userScrollUntil = performance.now() + LYRICS_USER_SCROLL_MS),
      { passive: true },
    ),
  );

  // ===== Start =====
  renderSortUI();
  setFilter(new URLSearchParams(location.search).get("id"), false);
})();
