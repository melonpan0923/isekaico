// ===== Music Player (full-screen Now Playing view + quick switch) =====
(function () {
  const bgm = document.getElementById("bgm");
  const musicControl = document.querySelector(".music-control");
  const musicToggle = document.getElementById("musicToggle");
  const musicSwitch = document.getElementById("musicSwitch");
  const view = document.getElementById("nowPlayingView");
  const npClose = document.getElementById("npClose");
  const artEl = document.getElementById("playerArt");
  const titleEl = document.getElementById("playerTitle");
  const artistEl = document.getElementById("playerArtist");
  const trackEl = document.getElementById("playerTrack");
  const fillEl = document.getElementById("playerFill");
  const thumbEl = document.getElementById("playerThumb");
  const curEl = document.getElementById("playerCurrent");
  const remEl = document.getElementById("playerRemaining");
  const playBtn = document.getElementById("playBtn");
  const restartBtn = document.getElementById("restartBtn");
  const nextBtn = document.getElementById("nextBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const repeatBtn = document.getElementById("repeatBtn");
  const visCanvas = document.getElementById("visualizerCanvas");

  if (!bgm || !musicControl || !view) return;

  // Add more tracks here as they're placed in assets/audio/home/ — shuffle,
  // next and the Now Playing view all already loop over this list.
  const songs = [
    {
      title: "Constant Moderato",
      artist: "ブルアカ",
      src: "assets/audio/home/Constant%20Moderato.mp3",
      art: "assets/audio/home/babg2.webp",
    },
    {
      title: "Connected Sky",
      artist: "ブルアカ",
      src: "assets/audio/home/Connected%20Sky.mp3",
      art: "assets/audio/home/babg1.webp",
    },
    {
      title: "Clear Morning",
      artist: "小倉 唯",
      src: "assets/audio/home/Clear%20Morning.mp3",
      art: "assets/audio/home/babg3.webp",
    },
  ];

  let currentIndex = 0;
  let shuffle = false;
  let repeat = false;
  let dragging = false;

  function fmt(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function artImgHTML(song) {
    return '<img src="' + song.art + '" alt="">';
  }

  function loadSong(index, forcePlay) {
    currentIndex = index;
    const song = songs[currentIndex];
    const wasPlaying = forcePlay || !bgm.paused;

    bgm.src = song.src;
    bgm.load();
    titleEl.textContent = song.title;
    artistEl.textContent = song.artist;
    artEl.innerHTML = artImgHTML(song);
    curEl.textContent = "0:00";
    remEl.textContent = "-0:00";
    fillEl.style.width = "0%";
    thumbEl.style.left = "0%";

    if (wasPlaying) bgm.play().catch(() => {});
  }

  // Sync art/title/artist to the track already set in the HTML/audio tag,
  // without touching bgm.src or calling bgm.load() — playback stays fully
  // lazy (preload="none") until the user actually presses play.
  artEl.innerHTML = artImgHTML(songs[currentIndex]);
  titleEl.textContent = songs[currentIndex].title;
  artistEl.textContent = songs[currentIndex].artist;

  // direction: -1/+1 to step through the playlist, wrapping at either end
  // (so "next" past the last track loops to the first, and vice versa).
  // forcePlay: used when a track just finished on its own (bgm.paused is
  // already true by the time "ended" fires, so the normal
  // was-it-playing check would wrongly leave the next track paused).
  function goToSong(direction, forcePlay) {
    if (songs.length > 1 && shuffle) {
      const choices = songs.map((_, i) => i).filter((i) => i !== currentIndex);
      loadSong(choices[Math.floor(Math.random() * choices.length)], forcePlay);
    } else {
      loadSong((currentIndex + direction + songs.length) % songs.length, forcePlay);
    }
  }

  // ----- Playback UI sync (audio element is the single source of truth) -----
  function updatePlayingUI(playing) {
    playBtn.classList.toggle("is-playing", playing);
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    musicToggle.classList.toggle("active", playing);
    musicSwitch.checked = playing;
    if (playing && !view.hidden) startVisualizer();
    if (!playing) stopVisualizer();
  }

  bgm.addEventListener("play", () => updatePlayingUI(true));
  bgm.addEventListener("pause", () => updatePlayingUI(false));

  bgm.addEventListener("timeupdate", () => {
    if (dragging || !bgm.duration) return;
    const pct = (bgm.currentTime / bgm.duration) * 100;
    fillEl.style.width = pct + "%";
    thumbEl.style.left = pct + "%";
    curEl.textContent = fmt(bgm.currentTime);
    remEl.textContent = "-" + fmt(bgm.duration - bgm.currentTime);
  });

  bgm.addEventListener("ended", () => {
    if (repeat) {
      bgm.currentTime = 0;
      bgm.play().catch(() => {});
    } else {
      // The track just finished on its own, so keep the playlist going —
      // force playback rather than relying on the (now-paused) audio
      // element's own state. Wraps back to the first track after the last.
      goToSong(1, true);
    }
  });

  function requestPlay() {
    ensureAudioGraph();
    bgm.play().catch(() => {});
  }

  playBtn.addEventListener("click", () => {
    if (bgm.paused) requestPlay();
    else bgm.pause();
  });

  musicSwitch.addEventListener("change", () => {
    if (musicSwitch.checked) requestPlay();
    else bgm.pause();
  });

  restartBtn.addEventListener("click", () => {
    // Spotify-style behavior: early into a track, "restart" instead acts
    // like "previous" and steps back a track (wrapping to the last track
    // from the first). Only once you're a few seconds in does it just
    // restart the current one — so pressing it twice in a row (the second
    // press landing back near 0:00 from the first) walks back through the
    // playlist one track per press.
    if (bgm.currentTime < 3) {
      goToSong(-1);
    } else {
      bgm.currentTime = 0;
    }
  });

  nextBtn.addEventListener("click", () => goToSong(1));

  shuffleBtn.addEventListener("click", () => {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle("toggle-on", shuffle);
    shuffleBtn.setAttribute("aria-pressed", String(shuffle));
  });

  repeatBtn.addEventListener("click", () => {
    repeat = !repeat;
    repeatBtn.classList.toggle("toggle-on", repeat);
    repeatBtn.setAttribute("aria-pressed", String(repeat));
  });

  // ----- Scrubber drag -----
  function ratioFromEvent(e) {
    const rect = trackEl.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return Math.min(1, Math.max(0, x / rect.width));
  }

  function moveDrag(e) {
    if (!bgm.duration) return;
    const ratio = ratioFromEvent(e);
    fillEl.style.width = ratio * 100 + "%";
    thumbEl.style.left = ratio * 100 + "%";
    curEl.textContent = fmt(ratio * bgm.duration);
    remEl.textContent = "-" + fmt(bgm.duration * (1 - ratio));
    bgm.currentTime = ratio * bgm.duration;
  }

  trackEl.addEventListener("pointerdown", (e) => {
    dragging = true;
    trackEl.classList.add("dragging");
    moveDrag(e);
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", endDrag);
  });

  function endDrag() {
    dragging = false;
    trackEl.classList.remove("dragging");
    window.removeEventListener("pointermove", moveDrag);
    window.removeEventListener("pointerup", endDrag);
  }

  // ----- Now Playing view open/close -----
  // The visualizer canvas lives inside this view, so it's only ever drawn
  // while the view itself is open — closing it stops the bars even if the
  // track keeps playing in the background.
  function openView() {
    view.hidden = false;
    musicToggle.setAttribute("aria-expanded", "true");
    if (!bgm.paused) startVisualizer();
  }
  function closeView() {
    view.hidden = true;
    musicToggle.setAttribute("aria-expanded", "false");
    stopVisualizer();
  }

  musicToggle.addEventListener("click", () => {
    if (view.hidden) openView();
    else closeView();
  });

  npClose.addEventListener("click", closeView);

  view.addEventListener("click", (e) => {
    if (e.target === view) closeView();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !view.hidden) closeView();
  });

  // ----- Real audio visualizer (Web Audio API), drawn in white -----
  let audioCtx = null;
  let analyser = null;
  let dataArray = null;
  let rafId = null;

  function ensureAudioGraph() {
    if (audioCtx) {
      if (audioCtx.state === "suspended") audioCtx.resume();
      return;
    }
    // Opening the page via file:// (rather than a server) makes Chrome treat
    // the audio file as a different origin from the page. Routing that kind
    // of "tainted" source through a MediaElementSource doesn't throw — it
    // silently reroutes the element's output through the Web Audio graph
    // and makes it play back as all zeroes, i.e. actual silence, even
    // though bgm.play() reports success. There's no fix for that short of
    // serving the page over http, so skip building the graph entirely here
    // and let the element play through its normal (audible) path instead;
    // the visualizer just won't have data to draw (already a no-op with
    // analyser left null).
    if (location.protocol === "file:") return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(bgm);
      analyser = audioCtx.createAnalyser();
      // Bigger fftSize gives more distinct frequency bins to pick from, and
      // a lower smoothingTimeConstant (default is 0.8, quite sluggish) lets
      // each bar react to the current instant instead of blending several
      // frames together — both needed for a snappy, spiky look rather than
      // a slow uniform wave.
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch (err) {
      audioCtx = null;
      analyser = null;
    }
  }

  function resizeVisCanvas() {
    const rect = visCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    visCanvas.width = rect.width * dpr;
    visCanvas.height = rect.height * dpr;
    const ctx = visCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", () => {
    if (!view.hidden) resizeVisCanvas();
  });

  function stopVisualizer() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    const ctx = visCanvas.getContext("2d");
    ctx.clearRect(0, 0, visCanvas.width, visCanvas.height);
  }

  function startVisualizer() {
    if (rafId) return;
    resizeVisCanvas();
    const ctx = visCanvas.getContext("2d");

    function draw() {
      if (bgm.paused || view.hidden) {
        rafId = null;
        ctx.clearRect(0, 0, visCanvas.width, visCanvas.height);
        return;
      }
      rafId = requestAnimationFrame(draw);

      const rect = visCanvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);

      // Bars fill the left/right thirds only — a gap sized off the control
      // row's own current width (not a guessed fixed number) sits between
      // them, so the strip never draws behind the buttons at any window
      // size, and stays correct if that row's width ever changes.
      const controlsRect = document.querySelector(".player-controls").getBoundingClientRect();
      const margin = 16;

      const gapLeft = Math.max(0, controlsRect.left - margin);
      const gapRight = Math.min(w, controlsRect.right + margin);
      const leftWidth = gapLeft;
      const rightWidth = w - gapRight;
      const totalWidth = leftWidth + rightWidth;
      const phoneBars = controlsRect.width > w * 0.6;
      if (totalWidth <= 0 && !phoneBars) return;

      const gap = 2.5;
      const totalBars = 16;
      const leftBars = Math.max(1, Math.round(totalBars * (leftWidth / totalWidth)));
      const rightBars = Math.max(1, totalBars - leftBars);

      // Spread the totalBars logical bars across most of the frequency
      // range (not just the lowest bins) so bass, mids and highs are all
      // represented — bass alone moves as one slow wave, while including
      // the higher bins is what gives the sharp, independent per-bar spikes
      // (cymbals, hi-hats, transients) rather than everything rising and
      // falling together.
      const spreadBins = Math.floor(dataArray.length * 0.65);
      function binForBar(barGlobalIndex) {
        return Math.min(
          dataArray.length - 1,
          Math.floor((barGlobalIndex / (totalBars - 1)) * spreadBins),
        );
      }

      // Bars are rooted to the bottom edge (0 there) and grow upward, each
      // fading from solid white at the base to transparent at its tip so
      // the visualizer blends into whatever sits behind it instead of
      // reading as a separate panel. binStart lets the left/right zones
      // pull sequential bars from that spread, so together they read as one
      // continuous spectrum with a gap punched out, not two mirrored halves.
      // maxRatio caps how tall a bar can grow, as a fraction of h — the
      // left/right zones pass 0.92 (effectively uncapped), the middle zone
      // passes 0.1 so it's reactive to the same music but can never grow
      // past 10% height.
      // mirror: bass at both ends and the highs meeting in the middle (each
      // half runs the whole spread), so the shape is even, tall at the
      // sides and lower in the middle, instead of tall left / short right.
      function drawZone(xStart, zoneWidth, barCount, binStart, maxRatio, mirror) {
        const bw = (zoneWidth - gap * (barCount - 1)) / barCount;
        if (bw <= 0) return;
        const maxH = h * maxRatio;
        for (let i = 0; i < barCount; i++) {
          const bar = mirror
            ? Math.round(
                (Math.min(i, barCount - 1 - i) / Math.max(1, (barCount - 1) / 2)) * (totalBars - 1),
              )
            : binStart + i;
          const value = dataArray[binForBar(bar)] || 0;
          const barH = Math.min(maxH, Math.max(2, (value / 255) * h * 0.92));
          const x = xStart + i * (bw + gap);
          const grad = ctx.createLinearGradient(0, h, 0, h - barH);
          const peakAlpha = 0.45 + (value / 255) * 0.55;
          grad.addColorStop(0, "rgba(255,255,255," + peakAlpha + ")");
          grad.addColorStop(1, "rgba(255,255,255,0.2)");
          ctx.fillStyle = grad;
          ctx.fillRect(x, h - barH, bw, barH);
        }
      }

      // Phones: the controls fill nearly the whole width, leaving no room
      // either side of them, so the bars run the full width along the
      // bottom of the screen instead, only as tall as the space below the
      // controls (so they never grow up behind the buttons).
      if (phoneBars) {
        const room = h - Math.max(0, controlsRect.bottom + margin - rect.top);
        drawZone(0, w, totalBars, 0, Math.max(0.1, room / h), true);
        return;
      }

      drawZone(0, leftWidth, leftBars, 0, 0.92);
      drawZone(gapRight, rightWidth, rightBars, leftBars, 0.92);

      // Middle zone (the gap behind the controls) — fills the whole width
      // between the left/right zones, reacts to the same music data, but
      // capped at 10% height so it never grows past a subtle strip.
      const middleWidth = gapRight - gapLeft;
      if (middleWidth > 0) {
        const pitch = totalWidth / totalBars;
        const middleBars = Math.max(1, Math.round(middleWidth / pitch));
        drawZone(gapLeft, middleWidth, middleBars, 0, 0.1);
      }
    }
    draw();
  }
})();

// ===== Favorites Carousel (main frame + edge peeks, infinite loop) =====
(function () {
  const frame = document.querySelector(".carousel-frame");
  const track = document.getElementById("favTrack");
  if (!frame || !track) return;
  if (track.dataset.carouselInit) return; // guard against double-init
  track.dataset.carouselInit = "true";

  const dots = Array.from(document.querySelectorAll("#favDots .dot"));
  const titleEl = document.getElementById("favTitle");

  // The caption under the carousel is the slide's data-category, in
  // Japanese when JP is selected (js/i18n.js)
  const CATEGORY_JA = { Anime: "アニメ", Character: "キャラクター", Music: "楽曲", Game: "ゲーム" };
  function categoryLabel(category) {
    return window.I18N && I18N.lang === "ja" ? CATEGORY_JA[category] || category : category;
  }
  document.addEventListener("langchange", () => {
    const i = Math.max(
      0,
      dots.findIndex((d) => d.classList.contains("active")),
    );
    if (titleEl && realSlides[i])
      titleEl.textContent = categoryLabel(realSlides[i].dataset.category);
  });
  const prevBtn = document.getElementById("favPrev");
  const nextBtn = document.getElementById("favNext");

  const realSlides = Array.from(track.children);
  const realCount = realSlides.length;

  // Prepend/append several full extra copies of the whole sequence (not just
  // one edge slide) so that a fast burst of clicks - which can arrive faster
  // than a single deferred correction can run - always has correctly-labeled
  // neighboring slides to render no matter how far "pos" drifts in the
  // meantime. The eventual quiet-period snap-back then corrects it in one go.
  const CYCLES = 12;

  function buildCycles() {
    const fragment = document.createDocumentFragment();
    for (let c = 0; c < CYCLES; c++) {
      realSlides.forEach((s) => {
        const clone = s.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        fragment.appendChild(clone);
      });
    }
    return fragment;
  }

  track.insertBefore(buildCycles(), track.firstChild);
  track.appendChild(buildCycles());

  const slides = Array.from(track.children); // repeating cycles either side of the real slides
  const realStart = CYCLES * realCount;

  let pos = realStart;
  let timer = null;
  const AUTO_DELAY = 3000;
  const TRANSITION_MS = 500;
  let snapTimer = null;

  function render(withTransition) {
    track.style.transition = withTransition ? "" : "none";
    // Force the browser to commit the transition change above before the
    // transform below changes. Without this, the move right after an
    // invisible no-transition snap can be dropped/stuttered instead of
    // animating, since the two style writes would otherwise get batched.
    void track.offsetWidth;

    // Clamp defensively to the buffered range: only reachable if something
    // (an inhumanly fast/long burst) outruns the buffer above. Without this,
    // an out-of-range "pos" would index past the array and throw, silently
    // freezing every future render() call since the throw happens before
    // scheduleSnap() ever runs again.
    const maxPos = slides.length - 1;
    const clampedPos = Math.min(Math.max(pos, 0), maxPos);

    // Exact (fractional) widths: offsetWidth rounds to whole pixels, and that
    // error gets multiplied by "pos" (dozens of slides in), which left the
    // slide sitting ~20px off the left edge on phones. The slides are never
    // scaled, and the track's translate doesn't change widths.
    const frameWidth = frame.getBoundingClientRect().width;
    const slideWidth = slides[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const offset = clampedPos * (slideWidth + gap) - (frameWidth - slideWidth) / 2;
    track.style.transform = `translateX(-${offset}px)`;

    // realIndex is always derived via modulo, so it - and the slide it reads -
    // stay valid no matter how far "pos" itself has drifted.
    const realIndex = (((pos - realStart) % realCount) + realCount) % realCount;
    dots.forEach((d, i) => d.classList.toggle("active", i === realIndex));
    if (titleEl)
      titleEl.textContent = categoryLabel(slides[realStart + realIndex].dataset.category);
  }

  function scheduleSnap() {
    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const realIndex = (((pos - realStart) % realCount) + realCount) % realCount;
      const target = realStart + realIndex;
      if (pos !== target) {
        pos = target;
        render(false);
      }
    }, TRANSITION_MS + 50);
  }

  function goTo(newPos) {
    pos = newPos;
    render(true);
    scheduleSnap();
  }

  function next() {
    goTo(pos + 1);
  }

  function prev() {
    goTo(pos - 1);
  }

  function goToReal(realIndex) {
    goTo(realStart + realIndex);
  }

  function resetTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, AUTO_DELAY);
  }

  nextBtn.addEventListener("click", () => {
    next();
    resetTimer();
  });

  prevBtn.addEventListener("click", () => {
    prev();
    resetTimer();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      goToReal(i);
      resetTimer();
    });
  });

  // Each slide links to its page, but the side slides peeking in on either
  // side are visible too: clicking one of those brings it to the center
  // first (like the arrows) instead of opening its page. Only the centered
  // slide's click follows its link.
  track.addEventListener("click", (e) => {
    const slide = e.target.closest(".carousel-slide");
    if (!slide) return;
    const index = slides.indexOf(slide);
    if (index === -1 || index === pos) return;
    e.preventDefault();
    goTo(index);
    resetTimer();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      prev();
      resetTimer();
    } else if (e.key === "ArrowRight") {
      next();
      resetTimer();
    }
  });

  window.addEventListener("resize", () => render(false));

  render(false);
  resetTimer();
})();

// ===== Reusable gradient scrub bar (Anime / Character previews) =====
function initScrubber({ barEl, thumbEl, trackEl, visible }) {
  if (!barEl || !thumbEl || !trackEl) return;

  // the real cards — the looping copies added for phones (below) aren't
  // part of the desktop slider
  const realItems = Array.from(trackEl.children);
  const total = realItems.length;
  const maxIndex = Math.max(total - visible, 0);
  const TRANSITION_MS = 400; // keep in sync with .preview-track's transition duration
  // -1 (not a valid index) so the initial setIndex(0) call below always
  // runs its setup instead of getting no-op'd by the "already there" guard.
  let current = -1;
  let dragging = false;
  let hideTimer = null;
  // Phones: the window is a native sideways scroller with snap points
  // (style.css), so the transform sliding, hiding and card drag below are
  // desktop-only — same split as js/browse-drawer.js.
  const phoneLayout = window.matchMedia("(max-width: 700px)");

  function layoutThumb() {
    const thumbPercent = Math.min(visible / total, 1) * 100;
    thumbEl.style.width = `${thumbPercent}%`;
    const travelPercent = 100 - thumbPercent;
    const leftPercent = maxIndex === 0 ? 0 : (current / maxIndex) * travelPercent;
    thumbEl.style.left = `${leftPercent}%`;
  }

  function moveTrack() {
    if (phoneLayout.matches) {
      trackEl.style.transform = "";
      return;
    }
    const firstCard = realItems[0];
    const gap = parseFloat(getComputedStyle(trackEl).gap) || 0;
    // offsetWidth avoids picking up a hover scale transform on the card.
    const cardWidth = firstCard.offsetWidth;
    const offset = current * (cardWidth + gap);
    trackEl.style.transform = `translateX(-${offset}px)`;
  }

  // Hides cards outside the visible window via JS instead of relying on the
  // track's overflow clip, so the clip boundary can stay loose enough for
  // hover-tilt without letting off-screen cards peek through. Newly-visible
  // cards show immediately (so they're visible as they slide in), but
  // newly-hidden cards stay visible until the slide transition finishes, so
  // they slide out of view instead of snapping invisible mid-slide.
  function updateVisibility() {
    if (hideTimer) clearTimeout(hideTimer);
    if (phoneLayout.matches) {
      realItems.forEach((child) => {
        child.style.visibility = "";
      });
      return;
    }
    realItems.forEach((child, i) => {
      if (i >= current && i < current + visible) child.style.visibility = "";
    });
    hideTimer = setTimeout(() => {
      realItems.forEach((child, i) => {
        if (i < current || i >= current + visible) child.style.visibility = "hidden";
      });
    }, TRANSITION_MS);
  }

  function setIndex(i) {
    const next = Math.min(Math.max(Math.round(i), 0), maxIndex);
    if (next === current) return;
    current = next;
    layoutThumb();
    moveTrack();
    updateVisibility();
  }

  function indexFromClientX(clientX) {
    const barRect = barEl.getBoundingClientRect();
    const thumbWidth = thumbEl.getBoundingClientRect().width;
    const usable = barRect.width - thumbWidth;
    const raw = clientX - barRect.left - thumbWidth / 2;
    const fraction = usable <= 0 ? 0 : Math.min(Math.max(raw / usable, 0), 1);
    return fraction * maxIndex;
  }

  thumbEl.addEventListener("pointerdown", (e) => {
    dragging = true;
    thumbEl.setPointerCapture(e.pointerId);
  });

  barEl.addEventListener("pointerdown", (e) => {
    if (e.target === thumbEl) return;
    setIndex(indexFromClientX(e.clientX));
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setIndex(indexFromClientX(e.clientX));
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  window.addEventListener("resize", () => {
    layoutThumb();
    moveTrack();
  });

  phoneLayout.addEventListener("change", () => {
    moveTrack();
    updateVisibility();
    if (phoneLayout.matches) placePhone();
  });

  // ----- Phones: swiping loops (Frieren → Re:ZERO and back) -----
  // A copy of every card on each side (hidden on desktop, style.css). When
  // a swipe settles on a copy, the scroller jumps — instantly, to the same
  // picture — onto the matching real card, so there's always another card
  // either way.
  const viewport = trackEl.parentElement;
  function copies() {
    const fragment = document.createDocumentFragment();
    realItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.classList.add("loop-clone");
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");
      fragment.appendChild(clone);
    });
    return fragment;
  }
  trackEl.insertBefore(copies(), trackEl.firstChild);
  trackEl.appendChild(copies());

  let phoneIndex = 0; // which real card is showing
  let settleTimer = null;

  function slideW() {
    return realItems[0].getBoundingClientRect().width;
  }

  function placePhone() {
    const w = slideW();
    if (w) viewport.scrollLeft = (total + phoneIndex) * w;
  }

  viewport.addEventListener(
    "scroll",
    () => {
      if (!phoneLayout.matches) return;
      const w = slideW();
      if (!w) return;
      const i = Math.round(viewport.scrollLeft / w);
      phoneIndex = (((i - total) % total) + total) % total;
      // wait for the swipe (and its snap) to finish before jumping
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const at = Math.round(viewport.scrollLeft / w);
        if (at < total || at >= 2 * total) placePhone();
      }, 150);
    },
    { passive: true },
  );

  window.addEventListener("resize", () => {
    if (phoneLayout.matches) placePhone();
  });
  if (phoneLayout.matches) placePhone();

  // ----- Drag the cards themselves (not just the scrub bar) -----
  // Follows the pointer 1:1 while dragging (transition off), then hands
  // off to setIndex on release, which snaps to the nearest card and
  // re-enables the transition for that final settle.
  function stepPx() {
    const gap = parseFloat(getComputedStyle(trackEl).gap) || 0;
    return realItems[0].offsetWidth + gap;
  }

  let pointerActive = false;
  let dragStarted = false;
  let activePointerId = null;
  let dragStartX = 0;
  let dragStartOffset = 0;
  // Pointermove can fire many times per animation frame; writing the
  // transform straight from every event was the main source of the
  // choppiness — batching to one write per frame (rAF) is what actually
  // smooths it out.
  let latestDelta = 0;
  let dragRAF = null;

  function applyDragFrame() {
    trackEl.style.transform = `translateX(-${dragStartOffset - latestDelta}px)`;
    dragRAF = null;
  }

  // Past this many px of pointer travel from pointerdown, the gesture reads
  // as "dragging the carousel" rather than "clicking a card" — matters now
  // that some tracks (Anime) hold real <a> links. Everything drag-specific
  // (pointer capture included) is deferred until this threshold is crossed
  // instead of happening unconditionally on pointerdown: setPointerCapture
  // also redirects the *click* that follows pointerup away from whatever
  // card is under the cursor, which was harmless while these cards were
  // plain divs but would otherwise swallow every plain click/tap on a card
  // link before it ever gets called.
  const DRAG_THRESHOLD_PX = 6;

  function beginDrag() {
    dragStarted = true;
    dragStartOffset = current * stepPx();
    trackEl.style.transition = "none";
    trackEl.style.cursor = "grabbing";
    // Stops the card hover tilt (scale/rotate, its own 0.3s transition)
    // from firing as the pointer crosses cards mid-drag — that fight
    // between two animations was the other big contributor to the jitter.
    trackEl.classList.add("track-dragging");
    trackEl.setPointerCapture(activePointerId);
    // Cards outside the current window are normally visibility:hidden (see
    // updateVisibility below) so they don't peek past the clip boundary at
    // rest. Reveal everything for the duration of the drag so whichever
    // neighbor you're dragging toward is actually visible sliding in,
    // instead of popping in only once the index officially changes.
    if (hideTimer) clearTimeout(hideTimer);
    realItems.forEach((child) => {
      child.style.visibility = "";
    });
  }

  trackEl.addEventListener("pointerdown", (e) => {
    // Primary button only — see the identical guard in js/browse-drawer.js.
    if (e.button !== 0 || phoneLayout.matches) return;
    pointerActive = true;
    dragStarted = false;
    activePointerId = e.pointerId;
    dragStartX = e.clientX;
    latestDelta = 0;
  });

  trackEl.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    // Missed release (see js/browse-drawer.js): end instead of hover-dragging.
    if (e.buttons === 0) {
      endCardDrag(e);
      return;
    }
    latestDelta = e.clientX - dragStartX;
    if (!dragStarted) {
      if (Math.abs(latestDelta) < DRAG_THRESHOLD_PX) return;
      beginDrag();
    }
    if (dragRAF === null) dragRAF = requestAnimationFrame(applyDragFrame);
  });

  function endCardDrag(e) {
    if (!pointerActive) return;
    pointerActive = false;
    if (dragRAF !== null) {
      cancelAnimationFrame(dragRAF);
      dragRAF = null;
    }
    // Never crossed the drag threshold: this was a plain click/tap, and
    // pointer capture was never engaged, so the resulting click event is
    // free to reach whatever card is under the cursor and navigate as
    // normal — nothing to unwind here.
    if (!dragStarted) return;
    dragStarted = false;
    trackEl.style.transition = "";
    trackEl.style.cursor = "grab";
    trackEl.classList.remove("track-dragging");
    const delta = e.clientX - dragStartX;
    const target = current - delta / stepPx();
    const before = current;
    setIndex(target);
    // setIndex no-ops when the dragged distance isn't enough to change the
    // index, which would otherwise leave the track sitting at the mid-drag
    // offset (and every card still revealed) instead of snapping back to
    // its current card and re-hiding whatever's outside the window again.
    if (current === before) {
      moveTrack();
      updateVisibility();
    }
  }

  trackEl.addEventListener("pointerup", endCardDrag);
  trackEl.addEventListener("pointercancel", endCardDrag);

  // ----- Arrow key navigation (while hovering this row or its scrub bar) -----
  let hovering = false;
  let barHovering = false;
  trackEl.addEventListener("mouseenter", () => {
    hovering = true;
  });
  trackEl.addEventListener("mouseleave", () => {
    hovering = false;
  });
  barEl.addEventListener("mouseenter", () => {
    barHovering = true;
  });
  barEl.addEventListener("mouseleave", () => {
    barHovering = false;
  });
  window.addEventListener("keydown", (e) => {
    // Also allow arrow keys mid-drag even if the pointer (under capture)
    // has moved outside the bar/thumb bounds, so a drag started on the
    // slider doesn't get silently cut off by a stray mouseleave.
    if (!hovering && !barHovering && !dragging && !dragStarted) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex(current - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setIndex(current + 1);
    }
  });

  setIndex(0);
}

initScrubber({
  barEl: document.getElementById("animeScrub"),
  thumbEl: document.getElementById("animeScrubThumb"),
  trackEl: document.getElementById("animeTrack"),
  visible: 3,
});

initScrubber({
  barEl: document.getElementById("gameScrub"),
  thumbEl: document.getElementById("gameScrubThumb"),
  trackEl: document.getElementById("gameTrack"),
  visible: 3,
});

// ===== Music hover visualizer (rectangular bars around the circle) =====
// Items with a data-audio clip play that clip (looped) on hover, fading in/out
// via a GainNode, and the bars are driven by the clip's real frequency data.
// Items without a clip yet fall back to randomized bars so the effect is still
// visible before every song has a trimmed preview.
(function () {
  const items = document.querySelectorAll("#musicTrack .music-item");
  if (!items.length) return;

  // Mouse only: on phones a tap counts as a hover, so tapping an artist
  // started their clip (and the bars) instead of just opening their page.
  // Touch screens skip the whole effect, clip downloads included.
  const mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!mouse.matches) return;

  const BAR_COUNT = 44;
  const BAR_WIDTH = 4;
  const INNER_RADIUS = 66;
  // Bars can reach INNER_RADIUS + ~32 (max amplitude) + a few px of shadow
  // blur, so the canvas needs a half-size comfortably past that or the
  // tallest bars get clipped flat at the canvas's own edge.
  const CANVAS_SIZE = 240;
  const CENTER = CANVAS_SIZE / 2;
  const FADE_SECONDS = 0.2;

  // A fresh AudioContext always starts "suspended", and resume() only takes
  // effect when called from inside a genuine user gesture (click/keydown) —
  // hovering doesn't count. Once createMediaElementSource() reroutes an
  // <audio> element into the graph, it plays back silent until the context
  // is running, no matter how many times play()/resume() are called from a
  // hover handler. So: one shared context, unlocked by the first real click
  // anywhere on the page, and every item's graph runs through it.
  let sharedCtx = null;
  function getSharedCtx() {
    if (!sharedCtx && location.protocol !== "file:") {
      try {
        sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (err) {
        sharedCtx = null;
      }
    }
    return sharedCtx;
  }
  document.addEventListener(
    "pointerdown",
    () => {
      const c = getSharedCtx();
      if (c && c.state === "suspended") c.resume();
    },
    { once: true },
  );

  // ----- Duck the background music while a preview clip is hovered -----
  // hoverCount (rather than reacting to each item in isolation) is what lets
  // moving the cursor directly from one music circle to another stay ducked
  // the whole time, instead of the bgm blipping back up in the gap between
  // them. The restore itself waits a short beat after the real mouseleave —
  // long enough to absorb that gap, short enough to still feel immediate.
  const bgm = document.getElementById("bgm");
  const BGM_FULL_VOLUME = 1;
  const BGM_DUCK_VOLUME = 0.15;
  const DUCK_FADE_MS = 200;
  const RESTORE_DELAY_MS = 300;
  let hoverCount = 0;
  let restoreTimer = null;
  let volumeRampRAF = null;

  function rampBgmVolume(target, durationMs) {
    if (!bgm) return;
    cancelAnimationFrame(volumeRampRAF);
    const start = bgm.volume;
    const startTime = performance.now();
    function step(now) {
      // rAF's timestamp can land slightly before the performance.now() taken
      // above (it reflects frame start, not handler-run time), which can
      // make this go negative for the first frame — clamp both ends, since
      // .volume throws (rather than clamping) when set outside [0, 1].
      const t = Math.max(0, Math.min((now - startTime) / durationMs, 1));
      bgm.volume = Math.max(0, Math.min(start + (target - start) * t, 1));
      if (t < 1) volumeRampRAF = requestAnimationFrame(step);
    }
    volumeRampRAF = requestAnimationFrame(step);
  }

  function duckBgm() {
    if (!bgm) return;
    hoverCount++;
    if (hoverCount !== 1) return;
    if (restoreTimer) {
      clearTimeout(restoreTimer);
      restoreTimer = null;
    }
    rampBgmVolume(BGM_DUCK_VOLUME, DUCK_FADE_MS);
  }

  function unduckBgm() {
    if (!bgm) return;
    hoverCount = Math.max(0, hoverCount - 1);
    if (hoverCount !== 0) return;
    restoreTimer = setTimeout(() => {
      restoreTimer = null;
      rampBgmVolume(BGM_FULL_VOLUME, DUCK_FADE_MS);
    }, RESTORE_DELAY_MS);
  }

  items.forEach((item) => {
    const canvas = item.querySelector(".music-viz");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const clipSrc = item.dataset.audio;

    const amps = new Array(BAR_COUNT).fill(0);
    const target = new Array(BAR_COUNT).fill(0);
    let raf = null;
    let lastTargetTime = 0;
    let audioState = null;
    let fadeOutTimer = null;

    // Created immediately (not on first hover) so the browser starts
    // fetching the clip as soon as the page loads — otherwise the fetch +
    // decode only begins the moment you hover, which is the delay you'd feel
    // on a fresh page load.
    let preloadedAudio = null;
    if (clipSrc) {
      preloadedAudio = new Audio(clipSrc);
      preloadedAudio.loop = true;
      preloadedAudio.preload = "auto";
    }

    function drawBars() {
      const step = (Math.PI * 2) / BAR_COUNT;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 3;
      for (let i = 0; i < BAR_COUNT; i++) {
        const angle = i * step - Math.PI / 2;
        ctx.save();
        ctx.translate(CENTER, CENTER);
        ctx.rotate(angle);
        ctx.fillRect(-BAR_WIDTH / 2, -(INNER_RADIUS + amps[i]), BAR_WIDTH, amps[i]);
        ctx.restore();
      }
    }

    function randomTargets() {
      for (let i = 0; i < BAR_COUNT; i++) target[i] = 6 + Math.random() * 26;
    }

    // Per-bar wobble layered onto the real analyser data (see analyserTargets
    // below). This only gets refreshed on the same 90ms cadence as
    // randomTargets — refreshing it every frame instead let the amps
    // smoothing average it back out to flat, since a new random value every
    // ~16ms never gives amps[i] time to actually reach it before it moves
    // again.
    const jitterOffsets = new Array(BAR_COUNT).fill(0);
    function refreshJitter() {
      for (let i = 0; i < BAR_COUNT; i++) jitterOffsets[i] = (Math.random() - 0.5) * 10;
    }

    // Spreads the analyser's frequency bins across most of the range (not
    // just the bass end) so the ring reacts to mids/highs too, same approach
    // as the Now Playing visualizer above. Runs every frame so the overall
    // shape stays driven by the actual, real-time audio energy; only the
    // jitter riding on top of it is throttled.
    function analyserTargets(state) {
      state.analyser.getByteFrequencyData(state.dataArray);
      const spreadBins = Math.floor(state.dataArray.length * 0.65);
      for (let i = 0; i < BAR_COUNT; i++) {
        const bin = Math.min(
          state.dataArray.length - 1,
          Math.floor((i / (BAR_COUNT - 1)) * spreadBins),
        );
        const base = 6 + (state.dataArray[bin] / 255) * 26;
        target[i] = Math.max(4, base + jitterOffsets[i]);
      }
    }

    function tick(ts) {
      const usingRealAudio =
        audioState && audioState.analyser && audioState.ctx.state === "running";
      if (ts - lastTargetTime > 90) {
        lastTargetTime = ts;
        refreshJitter();
        if (!usingRealAudio) randomTargets();
      }
      if (usingRealAudio) analyserTargets(audioState);
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      for (let i = 0; i < BAR_COUNT; i++) amps[i] += (target[i] - amps[i]) * 0.25;
      drawBars();
      raf = requestAnimationFrame(tick);
    }

    // The <audio> element itself is created eagerly above (see
    // preloadedAudio); only the Web Audio graph (context/analyser/gain) is
    // built lazily here, on first hover.
    function ensureAudioState() {
      if (audioState) return audioState;
      const audio = preloadedAudio;
      let ctxA = null;
      let gainNode = null;
      let analyser = null;
      let dataArray = null;
      // Same file:// caveat as the Now Playing visualizer: routing a local
      // file through the Web Audio graph plays back silent, so skip the
      // graph there and just let the element play normally (no bars).
      ctxA = getSharedCtx();
      if (ctxA) {
        try {
          const source = ctxA.createMediaElementSource(audio);
          gainNode = ctxA.createGain();
          gainNode.gain.value = 0;
          analyser = ctxA.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.4;
          dataArray = new Uint8Array(analyser.frequencyBinCount);
          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(ctxA.destination);
        } catch (err) {
          gainNode = null;
          analyser = null;
        }
      }
      audioState = { audio, ctx: ctxA, gainNode, analyser, dataArray };
      return audioState;
    }

    function playClip() {
      const state = ensureAudioState();
      if (fadeOutTimer) {
        clearTimeout(fadeOutTimer);
        fadeOutTimer = null;
      }
      if (state.ctx && state.ctx.state === "suspended") state.ctx.resume();
      state.audio.currentTime = 0;
      state.audio.play().catch(() => {});
      if (state.gainNode) {
        const now = state.ctx.currentTime;
        state.gainNode.gain.cancelScheduledValues(now);
        state.gainNode.gain.setValueAtTime(state.gainNode.gain.value, now);
        state.gainNode.gain.linearRampToValueAtTime(1, now + FADE_SECONDS);
      }
    }

    function stopClip() {
      const state = audioState;
      if (!state) return;
      if (state.gainNode) {
        const now = state.ctx.currentTime;
        state.gainNode.gain.cancelScheduledValues(now);
        state.gainNode.gain.setValueAtTime(state.gainNode.gain.value, now);
        state.gainNode.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
      }
      fadeOutTimer = setTimeout(
        () => {
          state.audio.pause();
          state.audio.currentTime = 0;
        },
        FADE_SECONDS * 1000 + 20,
      );
    }

    item.addEventListener("mouseenter", () => {
      if (clipSrc) {
        playClip();
        duckBgm();
      }
      if (raf) return;
      lastTargetTime = 0;
      raf = requestAnimationFrame(tick);
    });

    item.addEventListener("mouseleave", () => {
      if (clipSrc) {
        stopClip();
        unduckBgm();
      }
      cancelAnimationFrame(raf);
      raf = null;
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      amps.fill(0);
      target.fill(0);
    });
  });
})();

// ===== Section heading letter-reveal on scroll =====
// Splits each section's title (Favorite, Anime, Character, Music, Game) into
// per-letter spans (once, on load) and fades them in left-to-right when the
// title scrolls into view — a reveal, not a slide, so each letter appears in
// place rather than moving into position.
//
// Reveal fires only on downward entry (a title scrolling up into view from
// below shows nothing new happening — no re-trigger, no hide). Reset only
// fires on upward exit (a title leaving the viewport because you scrolled
// down past it stays revealed, since you just saw it) — so a title only
// resets once you've scrolled back up past it, ready to replay the next time
// you scroll back down to it. This also makes Favorite behave correctly
// without any special-casing: it can only ever exit by being scrolled down
// past (never by an upward exit, since there's nothing above it to scroll up
// into first), so it reveals once on load and simply stays revealed.
(function () {
  const targets = [];
  document.querySelectorAll(".section-header").forEach((header) => {
    const h2 = header.querySelector("h2");
    if (h2) targets.push({ container: header, heading: h2 });
  });
  document.querySelectorAll(".section-label").forEach((label) => {
    targets.push({ container: label, heading: label });
  });
  if (!targets.length) return;

  targets.forEach(({ heading }) => {
    const text = heading.textContent;
    heading.textContent = "";
    text.split("").forEach((char, i) => {
      const span = document.createElement("span");
      span.className = "letter";
      span.textContent = char === " " ? " " : char;
      span.style.transitionDelay = `${i * 40}ms`;
      heading.appendChild(span);
    });
  });

  let lastScrollY = window.scrollY;
  let scrollingDown = true;
  window.addEventListener("scroll", () => {
    const currentY = window.scrollY;
    scrollingDown = currentY >= lastScrollY;
    lastScrollY = currentY;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (scrollingDown) entry.target.classList.add("revealed");
        } else if (!scrollingDown) {
          entry.target.classList.remove("revealed");
        }
      });
    },
    { threshold: 0.3 },
  );

  // "Favourite" is the page's very first title, so it should always show up
  // the moment the page finishes loading — even if the browser restores an
  // earlier scroll position that leaves it off-screen on reload. It can
  // never be scrolled *down* into (nothing sits above it), so the observer
  // would otherwise never reveal it in that case; just reveal it
  // unconditionally instead of depending on where the page happens to load
  // scrolled to.
  document.querySelectorAll(".section-label").forEach((label) => {
    label.classList.add("revealed");
  });

  // The other section titles (Anime/Character/Music/Game) still reveal
  // immediately only if already on screen at load time — content already
  // visible there has nothing left to scroll past, so it would never get
  // an IntersectionObserver callback reporting a fresh entry otherwise.
  targets.forEach(({ container }) => {
    const rect = container.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      container.classList.add("revealed");
    }
    observer.observe(container);
  });
})();

// ===== Back to Top =====
(function () {
  const backToTop = document.getElementById("backToTop");
  if (!backToTop) return;

  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("visible", window.scrollY > 400);
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// ===== Fullscreen video: turn sideways on phones =====
// Any video going fullscreen (the music player's expand button, the anime
// preview's own fullscreen button, …) flips a phone to landscape, the way
// the YouTube app does — then follows the sensor between the two landscape
// sides, and goes back to normal on exit. Only for wide videos (a portrait
// video stays upright) and only on touch screens.
//
// iPhones can't be rotated by a web page: they use Apple's own fullscreen
// video player instead, which fills the screen and turns sideways when you
// turn the phone (if Portrait Orientation Lock is off).
(function () {
  const orientation = screen.orientation;
  if (!orientation || typeof orientation.lock !== "function") return;
  const touch = window.matchMedia("(pointer: coarse)");
  let locked = false;

  function fullscreenVideo() {
    const el = document.fullscreenElement || document.webkitFullscreenElement;
    if (!el) return null;
    return el.tagName === "VIDEO" ? el : el.querySelector("video");
  }

  function isWide(video) {
    // size not known yet (still loading): assume a normal widescreen video
    return !video.videoWidth || video.videoWidth >= video.videoHeight;
  }

  function onChange() {
    const video = fullscreenVideo();
    if (video && touch.matches && isWide(video)) {
      orientation.lock("landscape").then(
        () => (locked = true),
        () => {},
      );
    } else if (locked && !video) {
      locked = false;
      if (typeof orientation.unlock === "function") orientation.unlock();
    }
  }

  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
})();

// ===== Home: keep the sparkle dots off the panels' edges =====
// The dots behind Anime/Character/Music/Game (style.css, --sparkle-dots,
// one 900px tile repeated down .preview-sections-wrap) land wherever the
// tile puts them, and one sitting on a white panel's edge shows as half a
// dot. This slides the whole pattern up/down to the offset that leaves the
// fewest dots cut by a panel edge, redone whenever the layout changes size.
(function () {
  const wrap = document.querySelector(".preview-sections-wrap");
  if (!wrap) return;
  const TILE = 900;

  // [x%, y%, size%] of each dot, read from the CSS so it stays in sync
  const dots = [];
  const re = /circle at ([\d.]+)% ([\d.]+)%.*?([\d.]+)%\)/g;
  let m;
  const bg = getComputedStyle(wrap).backgroundImage;
  while ((m = re.exec(bg))) dots.push([+m[1] / 100, +m[2] / 100, +m[3] / 100]);
  if (!dots.length) return;

  // how many dots a panel edge slices, and how many show whole
  function score(offset, panels, w, h) {
    let cut = 0;
    let whole = 0;
    dots.forEach(([dx, dy, ds]) => {
      const cx = dx * w;
      // the circle's size is a share of the distance to the tile's farthest
      // corner; it fades out towards that edge, so ~3/4 of it actually shows
      const r = 0.75 * ds * Math.hypot(Math.max(cx, w - cx), Math.max(dy * TILE, TILE - dy * TILE));
      for (let cy = dy * TILE + offset - TILE; cy - r < h; cy += TILE) {
        if (cy + r < 0) continue;
        // sliced by the top/bottom of the area itself
        if (cy - r < 0 || cy + r > h) {
          cut++;
          continue;
        }
        let state = "whole";
        for (const p of panels) {
          const nx = Math.max(p.left, Math.min(cx, p.right));
          const ny = Math.max(p.top, Math.min(cy, p.bottom));
          if (cx - r >= p.left && cx + r <= p.right && cy - r >= p.top && cy + r <= p.bottom) {
            state = "hidden";
            break;
          }
          if (Math.hypot(cx - nx, cy - ny) < r) state = "cut";
        }
        if (state === "cut") cut++;
        else if (state === "whole") whole++;
      }
    });
    return [cut, whole];
  }

  function place() {
    const box = wrap.getBoundingClientRect();
    const panels = Array.from(wrap.querySelectorAll(".section-panel")).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - box.left,
        right: r.right - box.left,
        top: r.top - box.top,
        bottom: r.bottom - box.top,
      };
    });
    let best = 0;
    let bestCut = Infinity;
    let bestWhole = -1;
    for (let offset = 0; offset < TILE; offset += 2) {
      const [cut, whole] = score(offset, panels, box.width, box.height);
      if (cut < bestCut || (cut === bestCut && whole > bestWhole)) {
        bestCut = cut;
        bestWhole = whole;
        best = offset;
      }
    }
    wrap.style.backgroundPosition = "0 " + best + "px";
  }

  let timer = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(place, 150);
  }
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(wrap);
  window.addEventListener("load", schedule);
  schedule();
})();

// ===== Top bar height, for style.css (--topbar-h) =====
// Phones size the Favourite section to fill the rest of the first screen
// below the top bar, and the top bar's height changes with the screen
// width and the language.
(function () {
  const bar = document.querySelector(".topbar");
  if (!bar) return;
  const set = () =>
    document.documentElement.style.setProperty("--topbar-h", bar.offsetHeight + "px");
  set();
  if (window.ResizeObserver) new ResizeObserver(set).observe(bar);
})();

// ===== Home video banner: only play while on screen =====
// A looping 1080p video keeps the graphics chip decoding frames even when
// it's scrolled out of view; pausing it there frees that work for smooth
// scrolling (and saves battery on phones/laptops). It resumes from where it
// was the moment any part of it comes back into view.
(function () {
  const video = document.querySelector(".video-banner__media");
  if (!video || !("IntersectionObserver" in window)) return;
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
  }).observe(video);
})();

// ===== Finish loading the rest of the images in the background =====
// Images further down the page are lazy (they don't hold up the first
// screen or the loading card). But on the live site each one takes a
// moment to arrive, so waiting until you scroll to them showed empty
// spots that filled in late. Once the page has finished loading, start
// all of them, so they're ready before you get there.
window.addEventListener("load", () => {
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.loading = "eager";
  });
});

// ===== Make room for the "Powered by Netlify" badge =====
// On the live site Netlify adds a small badge (an <iframe>) to the
// bottom-right corner after the page loads. This measures how far its
// visible part reaches up from the bottom and stores that (+ a 4px gap,
// about 0.1cm) in --badge-space; style.css uses it as the bottom offset of
// the crystal and the mini player, so they sit just on top of the badge.
// Running locally there's no badge, so nothing moves.
(function () {
  const root = document.documentElement;
  const GAP = 4;
  let badge = null;

  // The iframe is a little taller than the badge you see: its clip-path
  // ("M 3 3 H …") trims a few transparent pixels off the top.
  function clipTop(el) {
    const m = /M\s*[\d.]+[\s,]+([\d.]+)/.exec(el.style.clipPath || "");
    return m ? parseFloat(m[1]) : 0;
  }

  function measure() {
    let space = 0;
    if (badge && badge.isConnected) {
      const top = badge.getBoundingClientRect().top + clipTop(badge);
      space = Math.max(0, Math.round(innerHeight - top));
    }
    root.style.setProperty("--badge-space", space ? space + GAP + "px" : "0px");
  }

  function findBadge() {
    const found = document.getElementById("nl-badge-frame");
    if (found === badge) return;
    badge = found;
    if (badge) {
      if (window.ResizeObserver) new ResizeObserver(measure).observe(badge);
      // the clip-path changes if the badge expands/collapses
      new MutationObserver(measure).observe(badge, { attributes: true, attributeFilter: ["style"] });
    }
    measure();
  }

  new MutationObserver(findBadge).observe(document.body, { childList: true });
  window.addEventListener("resize", measure);
  findBadge();
})();

/* ===== Top bar: centre the title on ホーム, not on the menu's box =====
   The menu's two side groups are made equal width so キャラクター sits in the
   exact middle; when the right group is longer (JP: ミュージック), there's empty
   space before ホーム. Hand that width to the CSS as --nav-lead so the title
   can centre between the screen edge and ホーム itself. */
(function () {
  const bar = document.querySelector(".topbar");
  const nav = bar && bar.querySelector(".main-nav");
  const start = nav && nav.querySelector(".nav-group-start .nav-link");
  if (!start) return;

  function measure() {
    const lead = start.getBoundingClientRect().left - nav.getBoundingClientRect().left;
    bar.style.setProperty("--nav-lead", Math.max(0, Math.round(lead)) + "px");
  }

  if (window.ResizeObserver) new ResizeObserver(measure).observe(nav);
  // EN/JP swaps the link text, which can change the groups' widths
  new MutationObserver(measure).observe(nav, { subtree: true, characterData: true, childList: true });
  window.addEventListener("resize", measure);
  if (document.fonts) document.fonts.ready.then(measure);
  measure();
})();
