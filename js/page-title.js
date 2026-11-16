// ===== Page title entrance animation =====
// Shared by anime.html, character.html, games.html and music.html: their big
// page title (.title-content) is hidden behind a coloured block
// (.title-cover) that grows in from the left, then empties out to the right
// to reveal the text. Runs once when the page loads. Change the timing by
// editing the three numbers below — no percentage math needed.
(function () {
  const content = document.querySelector(".title-content");
  const cover = document.querySelector(".title-cover");
  if (!content || !cover) return;

  // Wait for the loading screen (js/loader.js), if one is showing, so the
  // title builds in as the page is revealed instead of behind it.
  const loaderDone = window.isekaiLoader ? window.isekaiLoader.done : Promise.resolve();
  loaderDone.then(() => {
    const BUILD_SECONDS = 0.5; // block growing in, left to right
    const HOLD_SECONDS = 0; // fully-formed pause before it recedes
    const WIPE_SECONDS = 0.5; // block emptying out, revealing the text

    const buildMs = BUILD_SECONDS * 1000;
    const holdMs = HOLD_SECONDS * 1000;
    const wipeMs = WIPE_SECONDS * 1000;
    const totalMs = buildMs + holdMs + wipeMs;
    const revealOffset = (buildMs + holdMs) / totalMs;
    const easing = "cubic-bezier(0.65, 0, 0.35, 1)";

    // easing is set per-keyframe (applies to the segment from that keyframe
    // to the next) rather than once in the options — a single top-level
    // easing would warp the *overall* 0-1 timeline before mapping it to
    // these offsets, which stretches the build/wipe phases unevenly instead
    // of giving each its own independent slow-fast-slow shape.
    cover.animate(
      [
        { left: "0%", width: "0%", offset: 0, easing },
        { left: "0%", width: "100%", offset: buildMs / totalMs, easing },
        { left: "0%", width: "100%", offset: revealOffset, easing },
        { left: "100%", width: "0%", offset: 1 },
      ],
      { duration: totalMs, fill: "forwards" },
    );

    // Content flips from invisible to fully opaque in the same instant the
    // cover starts receding — since the cover is still at full width right
    // up to that point, the flip itself is never visible, only the reveal
    // that follows as the cover empties out.
    content.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: Math.max(0, revealOffset - 0.001) },
        { opacity: 1, offset: revealOffset },
        { opacity: 1, offset: 1 },
      ],
      { duration: totalMs, fill: "forwards" },
    );
  });
})();
