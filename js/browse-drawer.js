// ===== Bottom Browse Drawer (shared by anime.html and games.html) =====
// A bottom sheet that always peeks its round handle above the fold
// (see .anime-drawer in style.css) and slides open to a compact 3-up,
// looping, draggable carousel over every item in the page's roster — the same
// clone-cycle + pointer-drag technique as the Favourite carousel and the
// Anime/Game preview tracks on Home (js/main.js), adapted for a 3-wide
// window instead of one centered slide. Clicking an item switches the
// page in place (pushState) instead of a full reload.
//
// items    - the page's roster (ANIMES / GAMES); each needs id, title, thumb.
// page     - the page's own file name, e.g. "anime.html".
// onSelect - re-renders the page's main panel for a given id.
function initBrowseDrawer({ items, page, onSelect }) {
  const drawer = document.getElementById("animeDrawer");
  const handle = document.getElementById("animeDrawerHandle");
  const track = document.getElementById("animeDrawerTrack");
  const prevBtn = document.getElementById("drawerPrev");
  const nextBtn = document.getElementById("drawerNext");
  if (!drawer || !handle || !track || !prevBtn || !nextBtn || !items || !items.length) return;

  function currentId() {
    return new URLSearchParams(location.search).get("id") || items[0].id;
  }

  function itemNode(item) {
    const a = document.createElement("a");
    a.className = "drawer-item";
    a.href = page + "?id=" + item.id;
    a.dataset.id = item.id;
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
      '<div class="drawer-item-frame"><img loading="lazy" decoding="async" src="' +
      item.thumb +
      '" alt="' +
      titleOf(item) +
      '" draggable="false"></div>' +
      '<p class="drawer-item-title">' +
      titleOf(item) +
      "</p>";
    return a;
  }

  // the title in the current language (js/i18n.js), English otherwise
  function titleOf(item) {
    return window.I18N ? I18N.field(item, "title") : item.title;
  }

  // JP / EN switched: relabel every card, the looping copies included
  document.addEventListener("langchange", () => {
    track.querySelectorAll(".drawer-item").forEach((card) => {
      const item = items.find((it) => it.id === card.dataset.id);
      if (!item) return;
      card.querySelector(".drawer-item-title").textContent = titleOf(item);
      card.querySelector("img").alt = titleOf(item);
    });
  });

  items.forEach((item) => track.appendChild(itemNode(item)));
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
  const initialRealIndex = Math.max(
    0,
    items.findIndex((a) => a.id === currentId()),
  );

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

  // Phones: the viewport is a native sideways scroller with snap points
  // (style.css), so swiping is the browser's own touch scrolling — momentum,
  // snapping, and a mouse drag in DevTools' phone mode all just work. The
  // transform-based sliding and custom drag below are desktop-only.
  const viewport = track.parentElement;
  const phoneLayout = window.matchMedia("(max-width: 700px)");

  // Once a swipe settles outside the real items (on one of the copies),
  // jump instantly to the matching real one — the same picture, so it
  // can't be seen — so swiping loops forever instead of running out after
  // the copies.
  let settleTimer = null;

  viewport.addEventListener(
    "scroll",
    () => {
      if (!phoneLayout.matches) return;
      const w = slides[0].getBoundingClientRect().width;
      if (!w) return;
      pos = Math.round(viewport.scrollLeft / w); // so a resize keeps your place
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const at = Math.round(viewport.scrollLeft / w);
        if (at >= realStart && at < realStart + realCount) return;
        pos = realStart + ((((at - realStart) % realCount) + realCount) % realCount);
        viewport.scrollLeft = pos * w;
      }, 150);
    },
    { passive: true },
  );

  // card width the last time the scroller was positioned: on a resize the
  // scroll offset is still in those old pixels, which gives where you were
  let phoneSlideW = 0;

  function render(withTransition) {
    if (phoneLayout.matches) {
      track.style.transform = "";
      if (phoneSlideW) pos = Math.round(viewport.scrollLeft / phoneSlideW);
      const slide = slides[Math.min(Math.max(pos, 0), slides.length - 1)];
      viewport.scrollLeft +=
        slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left;
      phoneSlideW = slide.getBoundingClientRect().width;
      return;
    }
    phoneSlideW = 0;
    viewport.scrollLeft = 0; // left over from phone width (e.g. after rotating)

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
    // Primary button only: a right-click's pointerup goes to the context
    // menu instead of the track, which left pointerActive stuck on and the
    // track following a plain hover afterwards.
    if (e.button !== 0) return;
    if (phoneLayout.matches) return; // native scrolling handles it (see render)
    pointerActive = true;
    dragStarted = false;
    activePointerId = e.pointerId;
    dragStartX = e.clientX;
    latestDelta = 0;
  });

  track.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    // No button held any more: the release happened somewhere this track
    // never heard about (e.g. over a nav arrow before the drag threshold
    // engaged capture). Treat it as the end of the gesture instead of
    // dragging on a plain hover.
    if (e.buttons === 0) {
      endDrag();
      return;
    }
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
    history.pushState(null, "", page + "?id=" + id);
    if (typeof onSelect === "function") onSelect(id);
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
    // Matches .anime-drawer's own closed transform (style.css): the gap
    // between the handle and the panel comes along for the ride too, not
    // just the panel, so a drag settles at the exact same "closed" spot
    // the CSS default (and the click-to-toggle path) already use.
    const gap = parseFloat(getComputedStyle(drawer).rowGap) || 0;
    return drawer.getBoundingClientRect().height - handle.getBoundingClientRect().height - gap;
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
    if (e.button !== 0) return; // see the card drag's pointerdown above
    handlePointerActive = true;
    handleDragStarted = false;
    handleActivePointerId = e.pointerId;
    handleStartY = e.clientY;
  });

  handle.addEventListener("pointermove", (e) => {
    if (!handlePointerActive) return;
    if (e.buttons === 0) {
      endHandleDrag();
      return;
    }
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

  // Clicking anywhere outside the open drawer closes it — skipped once
  // .embedded (see the big comment on .anime-drawer.embedded in
  // style.css), since at that point it's a normal in-page section rather
  // than a floating overlay sitting on top of the rest of the page.
  document.addEventListener("click", (e) => {
    if (!drawer.classList.contains("open") || drawer.classList.contains("embedded")) return;
    if (drawer.contains(e.target)) return;
    drawer.classList.remove("open");
    handle.setAttribute("aria-expanded", "false");
  });

  window.addEventListener("popstate", updateActive);
  window.addEventListener("resize", () => render(false));

  updateActive();
  render(false);

  // ----- Embed the drawer in the page once scrolled past the summary -----
  // .anime-drawer-anchor (style.css) is a zero-height marker sitting in
  // the normal page flow right after <main>, i.e. right below the summary
  // panel. Watching its position directly on scroll (rather than an
  // IntersectionObserver) is deliberate — see the scroll-clamp reasoning
  // by minScrollYToReembed below, which needs a plain scrollY read that
  // an IntersectionObserver doesn't hand you.
  //
  // Embedding adds a few hundred px of real height to the page (the
  // carousel). A first attempt tried to dodge the resulting scrollbar
  // jump with a *big* exit buffer (only leave once scrolled much further
  // up than enter) — that backfired: on a page short enough that
  // scrolling all the way to the very top still doesn't cover that big a
  // buffer, exit could never trigger at all, permanently stuck embedded.
  // Buffer size was never really the issue anyway: when un-embedding
  // shrinks the page enough that the current scroll position no longer
  // fits, the browser clamps it straight down to the new max — which
  // lands (by construction) almost exactly back on the boundary,
  // satisfying basically any positive entry threshold immediately and
  // re-triggering embedding right back. No buffer fixes that, since the
  // clamped position is the same regardless of how big the buffer is.
  //
  // So entry/exit both use the same small, always-reachable margin, and
  // the clamp-loop is broken separately: whenever exiting forces a clamp,
  // minScrollYToReembed records where it landed, and embedding is
  // refused until the user has actually scrolled down past that point
  // again — the clamp itself can't satisfy that, only a real further
  // scroll can.
  const anchor = document.getElementById("animeDrawerAnchor");
  const MARGIN_PX = 100;
  let minScrollYToReembed = -Infinity;

  // Phones: always part of the page, right below the last panel, instead
  // of a floating pull-up sheet that only settles in over the last 100px
  // of scrolling. Pages like a game's with a tall Team panel made it easy
  // to stop short of that and think the carousel was missing.
  const phone = window.matchMedia("(max-width: 700px)");

  function embedIfNeeded() {
    const isEmbedded = drawer.classList.contains("embedded");

    if (phone.matches) {
      if (!isEmbedded) {
        drawer.classList.add("embedded");
        window.dispatchEvent(new Event("resize")); // re-align the cards, see below
      }
      return;
    }

    const distanceBelowViewport = anchor.getBoundingClientRect().top - window.innerHeight;

    if (!isEmbedded && distanceBelowViewport <= MARGIN_PX && window.scrollY > minScrollYToReembed) {
      drawer.classList.add("embedded");
      // .embedded changes .anime-drawer-panel's own padding (style.css),
      // which changes how wide each card actually renders — the
      // carousel's transform offset (js below, in the "Bottom Browse
      // Anime Drawer" IIFE) was computed against the old width at page
      // load and doesn't know to redo that math on its own, so without
      // this nudge the cards drift out of their 3-up alignment (one
      // peeking in extra on either edge) the moment embedding resizes
      // them. Reusing the resize event rather than reaching into that
      // other closure directly, since it already listens for one and
      // recomputes correctly on it.
      window.dispatchEvent(new Event("resize"));
      return;
    }

    if (isEmbedded && distanceBelowViewport > MARGIN_PX) {
      // Scrolled back up away from it: jump straight to the default
      // closed/peeking handle instead of fading into it. Without forcing
      // the transition off first, removing .embedded here hands the
      // transform change to .anime-drawer's own 0.35s transition (the
      // one meant for manually opening/closing the sheet) — which then
      // visibly slides the whole panel through its "open" position while
      // it's freshly pinned to the viewport, reading as a broken
      // flash-of-the-drawer before it settles closed.
      drawer.style.transition = "none";
      drawer.classList.remove("embedded", "open");
      drawer.style.transform = "";
      // Commits the transition:none + the class/transform changes above
      // before re-enabling the transition below — same "force a reflow
      // in between" technique as beginDrag/beginHandleDrag further up,
      // so THIS reset stays instant without turning off the transition
      // for the drag/click interactions that come after it.
      void drawer.offsetHeight;
      drawer.style.transition = "";
      handle.setAttribute("aria-expanded", "false");
      // Same reasoning as the embed branch above: unembedding reverts
      // .anime-drawer-panel's padding back too, so the carousel needs
      // the same nudge to re-align to 3-up again.
      window.dispatchEvent(new Event("resize"));
      // Whatever scrollY the shrink (and any resulting clamp) left us at,
      // require scrolling down past that again before re-embedding — see
      // the big comment above embedIfNeeded for why this is what actually
      // breaks the clamp/re-trigger loop, not the margin size.
      minScrollYToReembed = window.scrollY;
    }
  }

  if (anchor) {
    window.addEventListener("scroll", embedIfNeeded, { passive: true });
    window.addEventListener("resize", embedIfNeeded);
    embedIfNeeded();
  }
}
