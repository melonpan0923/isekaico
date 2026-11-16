// Renders the hero/summary panel on anime.html from ANIMES (js/animes.js),
// based on the ?id= in the URL. Mirrors js/character-page.js: clicking a
// drawer item swaps the content in place (history.pushState) instead of a
// full page navigation.
(function () {
  const detail = document.getElementById("animeDetail");
  if (!detail || typeof ANIMES === "undefined") return;

  function getActive(id) {
    return ANIMES.find((a) => a.id === id) || ANIMES[0];
  }

  // Reveals .anime-summary-heading (bottom-to-top, see that class and
  // .revealed in style.css) the first time it actually scrolls into view
  // — not on page load, which fired the animation while the heading was
  // still off-screen below the fold, so it was already finished by the
  // time anyone scrolled down to see it. One shared observer, re-pointed
  // at whichever heading is current each time render() rebuilds it below.
  const headingObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                headingObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.4 },
        )
      : null;

  const PLACEHOLDER_HTML =
    '<div class="anime-video-placeholder">' +
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14l11-7z"/></svg>' +
    "<span>Preview video coming soon</span>" +
    "</div>";

  function videoSlotHTML(active) {
    if (!active.video) {
      return '<div class="anime-video-slot">' + PLACEHOLDER_HTML + "</div>";
    }
    return (
      '<div class="anime-video-slot">' +
      '<video class="anime-preview-video" controls preload="none"' +
      (active.videoPoster ? ' poster="' + active.videoPoster + '"' : "") +
      ">" +
      '<source src="' + active.video + '" type="video/mp4">' +
      "</video>" +
      "</div>"
    );
  }

  function render(id) {
    const active = getActive(id);

    detail.innerHTML =
      '<div class="anime-hero-panel">' +
      '<div class="anime-hero-inner">' +
      '<div class="anime-cover"' + (active.posterAspect ? ' style="aspect-ratio:' + active.posterAspect + '"' : "") + '><img src="' + active.poster + '" alt="' + active.title + '"></div>' +
      '<div class="anime-hero-body">' +
      '<h2 class="anime-title">' + active.title + "</h2>" +
      videoSlotHTML(active) +
      "</div>" +
      "</div>" +
      "</div>" +
      '<h2 class="anime-summary-heading">Summary</h2>' +
      '<div class="anime-summary-panel"><div class="anime-summary-inner"><p class="anime-summary">' + active.summary + "</p></div></div>";

    const summaryHeading = detail.querySelector(".anime-summary-heading");
    if (summaryHeading) {
      if (headingObserver) headingObserver.observe(summaryHeading);
      else summaryHeading.classList.add("revealed"); // no IntersectionObserver support: just show it
    }

    // If the configured preview clip 404s (or isn't there yet), fall back
    // to the same "coming soon" placeholder instead of a broken player.
    const video = detail.querySelector(".anime-preview-video");
    if (video) {
      video.addEventListener(
        "error",
        () => {
          const slot = video.closest(".anime-video-slot");
          if (slot) slot.innerHTML = PLACEHOLDER_HTML;
        },
        { once: true },
      );
    }

    document.title = active.title + " | 異世界コレクション";

    fitVideoSlot();
  }

  // Caps the video slot's height to whatever's left below the title
  // within .anime-cover's own height, so a 16:9 box (see .anime-video-slot
  // in style.css) never runs taller than the cover next to it — a plain
  // CSS max-height can't reference "another element's height minus this
  // column's title," so it's measured here instead. Only matters in the
  // side-by-side layout; below the 700px breakpoint the cover and the
  // title+video stack instead of sharing a row, so there's nothing to fit
  // within there.
  function fitVideoSlot() {
    const cover = detail.querySelector(".anime-cover");
    const titleEl = detail.querySelector(".anime-title");
    const videoSlot = detail.querySelector(".anime-video-slot");
    const body = detail.querySelector(".anime-hero-body");
    if (!cover || !titleEl || !videoSlot || !body) return;
    if (window.innerWidth <= 700) {
      videoSlot.style.width = "";
      videoSlot.style.height = "";
      body.style.width = "";
      return;
    }
    // Reset the column's own width back to its CSS default before
    // measuring anything below — otherwise a previous call's shrink (see
    // body.style.width at the bottom) would compound: each subsequent
    // call would measure an already-narrowed column as "the available
    // width," ratcheting the video smaller every time this runs (e.g. on
    // resize).
    body.style.width = "";
    // Measured as "cover's bottom minus wherever the video slot currently
    // starts" rather than re-deriving that start position by adding up
    // the title's own height/margin and the body's padding-top by hand —
    // this way it's automatically correct no matter what ends up above
    // the video slot (title wrapping to a 2nd line, padding tweaks,
    // etc.), since the video slot's own current top already reflects all
    // of that. .anime-title's own min-height (style.css) reserves 2 lines
    // worth of space even when the title only needs 1, so heightBudget
    // comes out the same regardless of how many lines the title actually
    // wraps to — that's what keeps the video landing on the cover's
    // bottom edge instead of stopping short for a short title.
    const heightBudget = Math.max(cover.getBoundingClientRect().bottom - videoSlot.getBoundingClientRect().top, 0);
    // As wide as the column allows, translated to the height that would
    // need at 16:9 — the smaller of that and heightBudget is the actual
    // limiting dimension, so computing both in real px (rather than
    // leaning on CSS max-height + aspect-ratio, which didn't reliably
    // grow the box back up to fill the space when nothing else was
    // sizing it) is what makes this land exactly at "as large as
    // possible without exceeding either the cover's height or the
    // column's width."
    const columnWidth = body.getBoundingClientRect().width;
    const widthBudgetHeight = (columnWidth * 9) / 16;
    const height = Math.min(heightBudget, widthBudgetHeight);
    const width = (height * 16) / 9;
    videoSlot.style.width = width + "px";
    videoSlot.style.height = height + "px";
    // Shrinks the column itself down to the video's actual width (rather
    // than leaving it at the wider CSS default) so the title wraps at
    // that same width and, more importantly, so .anime-hero-inner's
    // justify-content: center is centering the pair against its real
    // visible width instead of a wider invisible box with dead space
    // trailing off its right edge.
    body.style.width = width + "px";
  }

  window.addEventListener("popstate", () => {
    render(new URLSearchParams(location.search).get("id"));
  });

  window.addEventListener("resize", fitVideoSlot);

  render(new URLSearchParams(location.search).get("id"));

  // The browse drawer (below) re-renders this same panel on click instead
  // of doing a full navigation, so it needs a way to call back in here.
  window.renderAnimePage = render;
})();

// ===== "Anime" title entrance animation =====
// Identical timing/technique to character.html's title (js/character-page.js)
// — duplicated rather than shared so each page's script stays self-contained.
(function () {
  const content = document.querySelector(".title-content");
  const cover = document.querySelector(".title-cover");
  if (!content || !cover) return;

  const BUILD_SECONDS = 0.5;
  const HOLD_SECONDS = 0;
  const WIPE_SECONDS = 0.5;

  const buildMs = BUILD_SECONDS * 1000;
  const holdMs = HOLD_SECONDS * 1000;
  const wipeMs = WIPE_SECONDS * 1000;
  const totalMs = buildMs + holdMs + wipeMs;
  const revealOffset = (buildMs + holdMs) / totalMs;
  const easing = "cubic-bezier(0.65, 0, 0.35, 1)";

  cover.animate(
    [
      { left: "0%", width: "0%", offset: 0, easing },
      { left: "0%", width: "100%", offset: buildMs / totalMs, easing },
      { left: "0%", width: "100%", offset: revealOffset, easing },
      { left: "100%", width: "0%", offset: 1 },
    ],
    { duration: totalMs, fill: "forwards" },
  );

  content.animate(
    [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: Math.max(0, revealOffset - 0.001) },
      { opacity: 1, offset: revealOffset },
      { opacity: 1, offset: 1 },
    ],
    { duration: totalMs, fill: "forwards" },
  );
})();

// ===== Bottom "Browse Anime" Drawer =====
// A bottom sheet that always peeks its round handle above the fold
// (see .anime-drawer in style.css) and slides open to a compact 3-up,
// looping, draggable carousel over every anime in ANIMES — the same
// clone-cycle + pointer-drag technique as the Favourite carousel and the
// Anime/Game preview tracks on Home (js/main.js), adapted for a 3-wide
// window instead of one centered slide. Clicking an item switches the
// page in place (pushState) instead of a full reload.
(function () {
  const drawer = document.getElementById("animeDrawer");
  const handle = document.getElementById("animeDrawerHandle");
  const track = document.getElementById("animeDrawerTrack");
  const prevBtn = document.getElementById("drawerPrev");
  const nextBtn = document.getElementById("drawerNext");
  if (!drawer || !handle || !track || !prevBtn || !nextBtn || typeof ANIMES === "undefined") return;

  function currentId() {
    return new URLSearchParams(location.search).get("id") || ANIMES[0].id;
  }

  function itemNode(anime) {
    const a = document.createElement("a");
    a.className = "drawer-item";
    a.href = "anime.html?id=" + anime.id;
    a.dataset.id = anime.id;
    // A plain <a> (and the <img> inside it) is natively draggable in every
    // browser by default — starting that native "drag this link/image"
    // gesture fires pointercancel for the custom carousel drag below,
    // aborting it before it ever sees real movement, which is what made
    // dragging a card feel like nothing happened except a link preview
    // popping out. draggable="false" on both is the actual, reliable fix
    // (the CSS -webkit-user-drag/user-drag properties below are a
    // Chromium-only backstop, not a substitute — Firefox ignores them).
    a.draggable = false;
    a.innerHTML =
      '<div class="drawer-item-frame"><img src="' + anime.thumb + '" alt="' + anime.title + '" draggable="false"></div>' +
      '<p class="drawer-item-title">' + anime.title + "</p>";
    return a;
  }

  ANIMES.forEach((anime) => track.appendChild(itemNode(anime)));
  const realSlides = Array.from(track.children);
  const realCount = realSlides.length;

  // Several full extra copies either side (not just one edge item) so the
  // real 5-item list still has correctly-labeled neighbors to slide
  // through several drags/clicks in a row before the quiet-period snap-back
  // (scheduleSnap below) re-centers it onto the real range.
  const CYCLES = 6;

  function buildCycles() {
    const fragment = document.createDocumentFragment();
    for (let c = 0; c < CYCLES; c++) {
      realSlides.forEach((s) => {
        const clone = s.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("tabindex", "-1");
        fragment.appendChild(clone);
      });
    }
    return fragment;
  }

  track.insertBefore(buildCycles(), track.firstChild);
  track.appendChild(buildCycles());

  const slides = Array.from(track.children);
  const realStart = CYCLES * realCount;
  const initialRealIndex = Math.max(0, ANIMES.findIndex((a) => a.id === currentId()));

  let pos = realStart + initialRealIndex;
  const TRANSITION_MS = 400;
  let snapTimer = null;

  function updateActive() {
    const id = currentId();
    slides.forEach((el) => el.classList.toggle("active", el.dataset.id === id));
  }

  // getBoundingClientRect() (fractional/subpixel) rather than offsetWidth
  // (rounded to a whole pixel) — this gets multiplied by a large index
  // (deep into the cloned cycles, see realStart above), so even a
  // fraction-of-a-pixel rounding error compounds into a visible several-px
  // drift. That drift was landing the visible window slightly short on the
  // left (a gap of background peeking in before the first card) while the
  // right card ran past the clipped edge instead — looking like only the
  // left side was "blocked."
  function slideStepPx() {
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return slides[0].getBoundingClientRect().width + gap;
  }

  function render(withTransition) {
    track.style.transition = withTransition ? "" : "none";
    // Forces the browser to commit the transition change above before the
    // transform below changes — see the identical comment on the
    // Favourite carousel (js/main.js) for why this matters.
    void track.offsetWidth;

    const maxPos = slides.length - 1;
    const clampedPos = Math.min(Math.max(pos, 0), maxPos);
    const offset = clampedPos * slideStepPx();
    track.style.transform = `translateX(-${offset}px)`;
  }

  function scheduleSnap() {
    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const realIndex = ((pos - realStart) % realCount + realCount) % realCount;
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

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  // ----- Drag the cards themselves -----
  // Same deferred-pointer-capture pattern as js/main.js's card drag: drag
  // mode (and pointer capture) only actually engages once the pointer has
  // moved past a small threshold, so a plain click on a card still reaches
  // its <a> and navigates normally — setting pointer capture unconditionally
  // on pointerdown would otherwise retarget the click that follows away
  // from the card and silently swallow it.
  let pointerActive = false;
  let dragStarted = false;
  let activePointerId = null;
  let dragStartX = 0;
  let dragStartPos = 0;
  let latestDelta = 0;
  let dragRAF = null;
  const DRAG_THRESHOLD_PX = 6;

  function applyDragFrame() {
    const basePx = dragStartPos * slideStepPx();
    track.style.transform = `translateX(-${basePx - latestDelta}px)`;
    dragRAF = null;
  }

  function beginDrag() {
    dragStarted = true;
    dragStartPos = pos;
    track.style.transition = "none";
    track.classList.add("track-dragging");
    track.setPointerCapture(activePointerId);
  }

  track.addEventListener("pointerdown", (e) => {
    pointerActive = true;
    dragStarted = false;
    activePointerId = e.pointerId;
    dragStartX = e.clientX;
    latestDelta = 0;
  });

  track.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    latestDelta = e.clientX - dragStartX;
    if (!dragStarted) {
      if (Math.abs(latestDelta) < DRAG_THRESHOLD_PX) return;
      beginDrag();
    }
    if (dragRAF === null) dragRAF = requestAnimationFrame(applyDragFrame);
  });

  function endDrag() {
    if (!pointerActive) return;
    pointerActive = false;
    if (dragRAF !== null) {
      cancelAnimationFrame(dragRAF);
      dragRAF = null;
    }
    // Never crossed the drag threshold: a plain click/tap, pointer capture
    // was never engaged, so its own click reaches the card and navigates —
    // nothing to unwind here.
    if (!dragStarted) return;
    dragStarted = false;
    track.style.transition = "";
    track.classList.remove("track-dragging");
    // Uses the running latestDelta (kept current by pointermove) rather
    // than re-deriving it from whichever event ended the drag — pointerup
    // isn't the only way a drag can end (see lostpointercapture below), and
    // some of those don't carry a meaningful clientX of their own.
    goTo(Math.round(dragStartPos - latestDelta / slideStepPx()));
  }

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
  // Fires whenever capture is released for any reason — the reliable
  // signal that a drag is over, regardless of whether pointerup itself
  // made it back to this element (e.g. a fast synthetic/automated drag,
  // or the pointer straying outside the window mid-gesture).
  track.addEventListener("lostpointercapture", endDrag);

  // A real drag retargets its trailing click to `track` itself (see
  // above), so this only ever runs for a plain click that lands on a card.
  track.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-id]");
    if (!link) return;
    e.preventDefault();
    const id = link.dataset.id;
    if (id === currentId()) return;
    history.pushState(null, "", "anime.html?id=" + id);
    if (typeof window.renderAnimePage === "function") window.renderAnimePage(id);
    updateActive();
  });

  // ----- Drag the handle to open/close the drawer -----
  // Same deferred-pointer-capture pattern as the card drag above: dragging
  // is only actually engaged once the pointer crosses a small threshold,
  // so a plain click still reaches the click handler further down (a real
  // drag's trailing click retargets to `handle` via pointer capture, same
  // element the click listener is already on, so it'd otherwise also fire
  // and re-toggle right back — guarded against below with justDragged).
  function closedOffsetPx() {
    return drawer.getBoundingClientRect().height - handle.getBoundingClientRect().height;
  }

  let handlePointerActive = false;
  let handleDragStarted = false;
  let handleJustDragged = false;
  let handleActivePointerId = null;
  let handleStartY = 0;
  let handleBaseOffset = 0;
  let handleLastOffset = 0;
  const HANDLE_DRAG_THRESHOLD_PX = 4;

  function beginHandleDrag() {
    handleDragStarted = true;
    handleBaseOffset = drawer.classList.contains("open") ? 0 : closedOffsetPx();
    drawer.style.transition = "none";
    handle.setPointerCapture(handleActivePointerId);
  }

  handle.addEventListener("pointerdown", (e) => {
    handlePointerActive = true;
    handleDragStarted = false;
    handleActivePointerId = e.pointerId;
    handleStartY = e.clientY;
  });

  handle.addEventListener("pointermove", (e) => {
    if (!handlePointerActive) return;
    const delta = e.clientY - handleStartY;
    if (!handleDragStarted) {
      if (Math.abs(delta) < HANDLE_DRAG_THRESHOLD_PX) return;
      beginHandleDrag();
    }
    const max = closedOffsetPx();
    handleLastOffset = Math.min(Math.max(handleBaseOffset + delta, 0), max);
    drawer.style.transform = `translateY(${handleLastOffset}px)`;
  });

  function endHandleDrag() {
    if (!handlePointerActive) return;
    handlePointerActive = false;
    if (!handleDragStarted) return; // plain click/tap — the click handler below runs instead
    handleDragStarted = false;
    handleJustDragged = true;
    drawer.style.transition = "";
    drawer.style.transform = "";
    const isOpen = handleLastOffset < closedOffsetPx() / 2;
    drawer.classList.toggle("open", isOpen);
    handle.setAttribute("aria-expanded", String(isOpen));
  }

  handle.addEventListener("pointerup", endHandleDrag);
  handle.addEventListener("pointercancel", endHandleDrag);
  handle.addEventListener("lostpointercapture", endHandleDrag);

  handle.addEventListener("click", () => {
    if (handleJustDragged) {
      handleJustDragged = false;
      return;
    }
    const isOpen = drawer.classList.toggle("open");
    handle.setAttribute("aria-expanded", String(isOpen));
  });

  window.addEventListener("popstate", updateActive);
  window.addEventListener("resize", () => render(false));

  updateActive();
  render(false);
})();
