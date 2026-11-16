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

  // EN / JP (js/i18n.js): a data field / a fixed string in the current
  // language, plain English if i18n.js isn't loaded
  const L = (item, key) => (window.I18N ? I18N.field(item, key) : item[key]);
  const T = (key, english) => (window.I18N ? I18N.t(key) : english);
  let currentId = null;

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
    '<span data-i18n="anime.comingSoon">' +
    T("anime.comingSoon", "Preview video coming soon") +
    "</span>" +
    "</div>";

  // No "controls" here on purpose — the native scrubber/volume bar would
  // sit on top of the poster before anyone's even pressed play, clashing
  // with .anime-video-play below. render() below flips video.controls on
  // once playback actually starts, and back off if it ends (see the
  // wiring after detail.innerHTML further down).
  function videoSlotHTML(active) {
    if (!active.video) {
      return '<div class="anime-video-slot">' + PLACEHOLDER_HTML + "</div>";
    }
    return (
      '<div class="anime-video-slot">' +
      '<video class="anime-preview-video" preload="metadata" playsinline disablePictureInPicture' +
      (active.videoPoster ? ' poster="' + active.videoPoster + '"' : "") +
      ">" +
      '<source src="' +
      active.video +
      '" type="video/mp4">' +
      "</video>" +
      // shown over the slot while the video is off in its picture-in-picture
      // window, so the slot isn't left empty — the anime's landscape
      // carousel picture (see the "Picture in picture" wiring below)
      '<img class="anime-video-pip" src="' +
      active.thumb +
      '" alt="" draggable="false" hidden>' +
      // tap/click layer over the picture (not the control bar) — see below
      '<div class="anime-video-tap" hidden></div>' +
      '<button type="button" class="anime-video-play" aria-label="' +
      T("anime.playPreview", "Play preview") +
      '" data-i18n-aria="anime.playPreview">' +
      '<span class="anime-video-play-icon">' +
      '<svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor"><path d="M8,6.5 L8,17.5 Q8,19 9.27,18.19 L17.74,12.81 Q19,12 17.74,11.19 L9.27,5.81 Q8,5 8,6.5 Z"/></svg>' +
      "</span>" +
      "</button>" +
      "</div>"
    );
  }

  function render(id) {
    const active = getActive(id);
    currentId = active.id;

    detail.innerHTML =
      '<div class="anime-hero-panel">' +
      '<div class="anime-hero-inner">' +
      '<div class="anime-cover"' +
      (active.posterAspect ? ' style="aspect-ratio:' + active.posterAspect + '"' : "") +
      '><img src="' +
      active.poster +
      '" alt="' +
      L(active, "title") +
      '"></div>' +
      '<div class="anime-hero-body">' +
      '<h2 class="anime-title">' +
      L(active, "title") +
      "</h2>" +
      videoSlotHTML(active) +
      "</div>" +
      "</div>" +
      "</div>" +
      '<h2 class="anime-summary-heading" data-i18n="anime.summary">' +
      T("anime.summary", "Summary") +
      "</h2>" +
      '<div class="anime-summary-panel"><div class="anime-summary-inner"><p class="anime-summary">' +
      L(active, "summary") +
      "</p></div></div>";

    // The summary paragraph gets the same bottom-to-top reveal as its
    // heading (see #animeDetail .anime-summary in style.css)
    detail.querySelectorAll(".anime-summary-heading, .anime-summary").forEach((el) => {
      if (headingObserver) headingObserver.observe(el);
      else el.classList.add("revealed"); // no IntersectionObserver support: just show it
    });

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

    // The custom play button (poster + centered circle, see
    // .anime-video-play in style.css) stands in for the native controls
    // until playback actually starts — a native scrubber sitting on top of
    // the poster before anyone's pressed play would fight the custom
    // button visually. Once clicked, native controls take over completely
    // (so seeking/volume/fullscreen all still work); "ended" swaps back to
    // the poster + button rather than leaving a frozen last frame with a
    // stuck control bar.
    const playBtn = detail.querySelector(".anime-video-play");
    // Click / tap anywhere on the picture to pause or play, like the music
    // page's video. An invisible layer over the picture (everything but the
    // native control bar along the bottom) takes the tap itself: on phones
    // the browser keeps taps on the video for showing/hiding its own
    // controls, so a click handler on the <video> never heard them.
    //
    // Mouse only, though: on phones the browser's own controls sit ON the
    // picture (iPhone: fullscreen top left, sound top right, skip back /
    // forward beside play), so the layer swallowed every tap meant for
    // them and only ever played/paused. There the native controls handle
    // everything, tap-to-pause included.
    const mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
    const tapLayer = mouse.matches ? detail.querySelector(".anime-video-tap") : null;
    if (video && playBtn) {
      playBtn.addEventListener("click", () => {
        video.controls = true;
        video.play();
        playBtn.classList.add("is-hidden");
        if (tapLayer) tapLayer.hidden = false;
      });
      video.addEventListener("ended", () => {
        video.controls = false;
        playBtn.classList.remove("is-hidden");
        if (tapLayer) tapLayer.hidden = true;
      });
      if (tapLayer) {
        tapLayer.addEventListener("click", () => {
          if (video.paused) video.play().catch(() => {});
          else video.pause();
        });
      }

      // In fullscreen (the native control bar's own button, bottom right)
      // only the <video> is on screen, so the tap layer above is left
      // behind: there, a tap on the picture (not the control bar, and not
      // a drag) pauses/plays from here — mouse only, a finger tap is left
      // to the browser's own controls. A mouse click is often toggled by
      // the browser itself, so it checks a moment later and only steps in
      // if the browser didn't.
      // (also marks it .is-fullscreen: whole video + black bars, style.css)
      // Leaving fullscreen keeps it playing: iPhone's player (and some
      // others) pause the video as it closes. A pause that lands right as
      // fullscreen ends is undone; one you made earlier stays.
      const FS_PAUSE_WINDOW_MS = 500;
      let heardPlaying = false;
      let lastPauseAt = -Infinity;
      let fsEndedAt = -Infinity;
      let resumeAfterFs = false;
      let wasFs = false;
      video.addEventListener("play", () => {
        heardPlaying = true;
      });
      video.addEventListener("pause", () => {
        const t = performance.now();
        if (resumeAfterFs && !video.ended && t - fsEndedAt < FS_PAUSE_WINDOW_MS) {
          video.play().catch(() => {});
          return;
        }
        heardPlaying = false;
        lastPauseAt = t;
      });
      const onFsEnd = () => {
        const t = performance.now();
        fsEndedAt = t;
        resumeAfterFs =
          !video.ended && (!video.paused || heardPlaying || t - lastPauseAt < FS_PAUSE_WINDOW_MS);
        if (resumeAfterFs && video.paused) video.play().catch(() => {});
      };
      video.addEventListener("webkitendfullscreen", onFsEnd); // iPhone

      // Picture in picture: the slot shows the anime's carousel picture
      // instead of sitting empty while the video plays in its little window
      const pipImg = detail.querySelector(".anime-video-pip");
      const syncPip = () => {
        const pip =
          document.pictureInPictureElement === video ||
          video.webkitPresentationMode === "picture-in-picture";
        if (pipImg) pipImg.hidden = !pip;
      };
      video.addEventListener("enterpictureinpicture", syncPip);
      video.addEventListener("leavepictureinpicture", syncPip);
      video.addEventListener("webkitpresentationmodechanged", syncPip);

      const markFullscreen = () => {
        const fs = document.fullscreenElement || document.webkitFullscreenElement;
        video.classList.toggle("is-fullscreen", fs === video);
        if (wasFs && fs !== video) onFsEnd();
        wasFs = fs === video;
      };
      video.addEventListener("fullscreenchange", markFullscreen);
      video.addEventListener("webkitfullscreenchange", markFullscreen);
      const CONTROL_BAR_PX = 56;
      let downX = 0;
      let downY = 0;
      video.addEventListener("pointerdown", (e) => {
        downX = e.clientX;
        downY = e.clientY;
      });
      video.addEventListener("pointerup", (e) => {
        const fs = document.fullscreenElement || document.webkitFullscreenElement;
        if (fs !== video) return;
        if (Math.abs(e.clientX - downX) > 10 || Math.abs(e.clientY - downY) > 10) return;
        if (e.clientY > video.getBoundingClientRect().bottom - CONTROL_BAR_PX) return;
        // touch: the browser's fullscreen controls handle taps themselves
        // (a tap shows them; pausing here would fight that, see above)
        if (e.pointerType !== "mouse") return;
        const wasPaused = video.paused;
        setTimeout(() => {
          if (video.paused !== wasPaused) return; // the browser already did it
          if (wasPaused) video.play().catch(() => {});
          else video.pause();
        }, 300);
      });
    }

    document.title = L(active, "title") + " | 異世界コレクション";

    fitVideoSlot();
  }

  // JP / EN switched: swap the text in place rather than re-rendering, so
  // a preview video that's playing keeps playing (the fixed strings marked
  // data-i18n are already swapped by i18n.js)
  document.addEventListener("langchange", () => {
    const active = getActive(currentId);
    const title = L(active, "title");
    const titleEl = detail.querySelector(".anime-title");
    if (titleEl) titleEl.textContent = title;
    const cover = detail.querySelector(".anime-cover img");
    if (cover) cover.alt = title;
    const summary = detail.querySelector(".anime-summary");
    if (summary) summary.textContent = L(active, "summary");
    document.title = title + " | 異世界コレクション";
    fitVideoSlot(); // a longer/shorter title changes the room left for the video
  });

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
    const heightBudget = Math.max(
      cover.getBoundingClientRect().bottom - videoSlot.getBoundingClientRect().top,
      0,
    );
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

initBrowseDrawer({
  items: typeof ANIMES === "undefined" ? [] : ANIMES,
  page: "anime.html",
  onSelect: (id) => window.renderAnimePage && window.renderAnimePage(id),
});
