// Renders the icon row and the detail panel on character.html from
// CHARACTERS (js/characters.js), based on the ?id= in the URL. Clicking an
// icon swaps the content in place (history.pushState) instead of doing a
// full page navigation, so the page never reloads or jumps back to the top.
(function () {
  const track = document.getElementById("charSelectTrack");
  const detail = document.getElementById("characterDetail");
  if (!track || !detail || typeof CHARACTERS === "undefined") return;

  function getActive(id) {
    return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
  }

  function render(id) {
    const active = getActive(id);

    track.innerHTML = CHARACTERS.map((c) => {
      const activeClass = c.id === active.id ? " active" : "";
      return (
        '<a class="char-item char-select-item' + activeClass + '" href="character.html?id=' + c.id + '" data-id="' + c.id + '">' +
        '<div class="char-frame"><div class="char-placeholder"><img src="' + c.icon + '" alt="' + c.name + '"></div></div>' +
        '<p class="char-name">' + c.name + "</p>" +
        "</a>"
      );
    }).join("");

    const mediaImage = active.image || active.icon;
    let mediaHTML;
    if (active.cutout) {
      const effects = (active.effects || [])
        .map(
          (fx) =>
            '<img class="character-effect-img" src="' + fx.src + '" alt="" ' +
            'style="left:' + fx.left + ';top:' + fx.top + ';width:' + fx.width + '">'
        )
        .join("");
      const floatClass = active.float ? " floating" : "";
      let cutoutStyle = "";
      if (active.float) {
        if (active.floatDuration) cutoutStyle += "animation-duration:" + active.floatDuration + ";";
        if (active.floatAmplitude) cutoutStyle += "--cutout-float-amplitude:" + active.floatAmplitude + ";";
      }
      const cutoutStyleAttr = cutoutStyle ? ' style="' + cutoutStyle + '"' : "";
      const translateParts = [];
      if (active.offsetX) translateParts.push("translateX(" + active.offsetX + ")");
      if (active.offsetY) translateParts.push("translateY(" + active.offsetY + ")");
      if (active.scale) translateParts.push("scale(" + active.scale + ")");
      const mediaBoxStyle = "aspect-ratio:" + (active.imageAspect || "3 / 4") + (translateParts.length ? ";transform:" + translateParts.join(" ") : "");
      mediaHTML =
        '<div class="character-detail-media cutout' + floatClass + '" style="' + mediaBoxStyle + '">' +
        '<img class="character-cutout-img" src="' + mediaImage + '" alt="' + active.name + '"' + cutoutStyleAttr + ">" +
        effects +
        "</div>";
    } else {
      mediaHTML = '<div class="character-detail-media"><img src="' + mediaImage + '" alt="' + active.name + '"></div>';
    }

    function stat(label, value) {
      return (
        '<div class="character-stat"><span class="character-stat-label">' + label + ":</span> " +
        '<span class="character-stat-value">' + (value || "—") + "</span></div>"
      );
    }

    detail.innerHTML =
      '<div class="character-glow" aria-hidden="true"></div>' +
      mediaHTML +
      '<div class="character-detail-info">' +
      '<div class="character-stat-grid">' +
      stat("Name", active.name) +
      stat("CV", active.cv) +
      stat("Age", active.age) +
      stat("Height", active.height) +
      stat("Birthday", active.birthday) +
      stat("Weight", active.weight) +
      "</div>" +
      '<p class="character-detail-bio">' + active.bio + "</p>" +
      "</div>";

    document.title = active.name + " | 異世界コレクション";
  }

  // Event delegation on the (stable) track element, so this still works
  // after render() replaces the <a> icons inside it.
  track.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-id]");
    if (!link) return;
    e.preventDefault();
    const id = link.dataset.id;
    if (id === new URLSearchParams(location.search).get("id")) return;
    history.pushState(null, "", "character.html?id=" + id);
    render(id);
  });

  // Browser back/forward between characters should also update in place.
  window.addEventListener("popstate", () => {
    render(new URLSearchParams(location.search).get("id"));
  });

  render(new URLSearchParams(location.search).get("id"));
})();

// ===== "Character" title entrance animation =====
// Runs once when the page loads/navigates in (not on character switches,
// since this title isn't part of what render() above touches). Change
// timing by editing these three numbers — no percentage math needed.
(function () {
  const content = document.querySelector(".title-content");
  const cover = document.querySelector(".title-cover");
  if (!content || !cover) return;

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
})();
