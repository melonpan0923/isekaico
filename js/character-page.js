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

  // EN / JP (js/i18n.js): a data field / a fixed string in the current
  // language, plain English if i18n.js isn't loaded
  const L = (item, key) => (window.I18N ? I18N.field(item, key) : item[key]);
  const T = (key, english) => (window.I18N ? I18N.t(key) : english);
  const isJa = () => !!(window.I18N && I18N.lang === "ja");
  let currentId = null;

  function render(id) {
    const active = getActive(id);
    currentId = active.id;
    const name = L(active, "name");

    // Every time a character's panel is (re)drawn — switching to them, or
    // switching back — their voice cycle starts over at sequence[0], and
    // whatever was playing for the previous character stops. A full page
    // reload/leave already resets this for free, since voiceStep and
    // voiceAudio are recreated from scratch on script load.
    voiceAudio.pause();
    voiceStep.delete(active.id);

    track.innerHTML = CHARACTERS.map((c) => {
      const activeClass = c.id === active.id ? " active" : "";
      return (
        '<a class="char-item char-select-item' +
        activeClass +
        '" href="character.html?id=' +
        c.id +
        '" data-id="' +
        c.id +
        '">' +
        '<div class="char-frame"><div class="char-placeholder"><img loading="lazy" decoding="async" src="' +
        c.icon +
        '" alt="' +
        L(c, "name") +
        '"></div></div>' +
        '<p class="char-name">' +
        L(c, "name") +
        "</p>" +
        "</a>"
      );
    }).join("");

    const mediaImage = active.image || active.icon;
    let mediaHTML;
    if (active.cutout) {
      const effects = (active.effects || [])
        .map(
          (fx) =>
            '<img class="character-effect-img" src="' +
            fx.src +
            '" alt="" ' +
            'style="left:' +
            fx.left +
            ";top:" +
            fx.top +
            ";width:" +
            fx.width +
            '">',
        )
        .join("");
      const floatClass = active.float ? " floating" : "";
      let cutoutStyle = "";
      if (active.float) {
        if (active.floatDuration) cutoutStyle += "animation-duration:" + active.floatDuration + ";";
        if (active.floatAmplitude)
          cutoutStyle += "--cutout-float-amplitude:" + active.floatAmplitude + ";";
      }
      const cutoutStyleAttr = cutoutStyle ? ' style="' + cutoutStyle + '"' : "";
      const translateParts = [];
      if (active.offsetX) translateParts.push("translateX(" + active.offsetX + ")");
      if (active.offsetY) translateParts.push("translateY(" + active.offsetY + ")");
      if (active.scale) translateParts.push("scale(" + active.scale + ")");
      // --ar: the same ratio as a number for style.css, which works the box's
      // width out from its height itself (see .character-detail-media.cutout)
      const aspect = active.imageAspect || "3 / 4";
      const mediaBoxStyle =
        "aspect-ratio:" +
        aspect +
        ";--ar:" +
        aspect +
        (active.headX ? ";--head-x:" + active.headX : "") +
        (translateParts.length ? ";transform:" + translateParts.join(" ") : "");
      mediaHTML =
        '<div class="character-detail-media cutout' +
        floatClass +
        '" data-id="' +
        active.id +
        '" style="' +
        mediaBoxStyle +
        '">' +
        '<img class="character-cutout-img" src="' +
        mediaImage +
        '" alt="' +
        name +
        '"' +
        cutoutStyleAttr +
        ">" +
        effects +
        "</div>";
    } else {
      mediaHTML =
        '<div class="character-detail-media"><img src="' +
        mediaImage +
        '" alt="' +
        name +
        '"></div>';
    }

    function stat(label, value) {
      return (
        '<div class="character-stat"><span class="character-stat-label">' +
        label +
        (isJa() ? "：</span>" : ":</span> ") +
        '<span class="character-stat-value">' +
        (value || "—") +
        "</span></div>"
      );
    }

    detail.innerHTML =
      '<div class="character-glow" aria-hidden="true"></div>' +
      mediaHTML +
      '<div class="character-detail-info">' +
      '<div class="character-stat-grid">' +
      stat(T("char.name", "Name"), name) +
      stat(T("char.cv", "CV"), L(active, "cv")) +
      stat(T("char.age", "Age"), L(active, "age")) +
      stat(T("char.height", "Height"), L(active, "height")) +
      stat(T("char.birthday", "Birthday"), L(active, "birthday")) +
      '<div class="character-stat"><span class="character-stat-label">' +
      T("char.voice", "Voice") +
      (isJa() ? "：</span>" : ":</span> ") +
      '<button class="voice-play-btn" type="button" data-char="' +
      active.id +
      '" aria-label="' +
      (isJa() ? name + T("char.playVoice", "") : "Play " + name + " voice line") +
      '">' +
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>' +
      "</svg></button></div>" +
      "</div>" +
      '<p class="character-detail-bio">' +
      L(active, "bio") +
      "</p>" +
      "</div>";

    document.title = name + " | 異世界コレクション";
  }

  // JP / EN switched: redraw the same character in the new language
  document.addEventListener("langchange", () => render(currentId));

  // ===== Voice line playback =====
  // Each click on a character's Voice icon advances one step through that
  // character's CHARACTERS[].voice.sequence, then (once exhausted) into its
  // randomAfter pool or chance-based secret line if it has one, before
  // looping back to sequence[0]. Progress is tracked per character id, but
  // render() resets it back to 0 on every (re)draw, so switching away from
  // a character and back always starts that character's cycle over at
  // sequence[0] rather than resuming mid-cycle.
  const voiceAudio = new Audio();
  const voiceStep = new Map();

  function playVoiceLine(id) {
    const voice = getActive(id).voice;
    if (!voice) return;

    const step = voiceStep.get(id) || 0;
    let file, nextStep;

    if (step < voice.sequence.length) {
      file = voice.sequence[step];
      nextStep = step + 1;
    } else if (voice.randomAfter) {
      file = voice.randomAfter[Math.floor(Math.random() * voice.randomAfter.length)];
      nextStep = 0;
    } else if (voice.secret && Math.random() < voice.secret.chance) {
      file = voice.secret.file;
      nextStep = 0;
    } else {
      file = voice.sequence[0];
      nextStep = 1;
    }

    voiceStep.set(id, nextStep);
    voiceAudio.pause();
    voiceAudio.src = voice.folder + "/" + encodeURIComponent(file);
    voiceAudio.currentTime = 0;
    voiceAudio.play();
  }

  detail.addEventListener("click", (e) => {
    const voiceBtn = e.target.closest(".voice-play-btn");
    if (voiceBtn) playVoiceLine(voiceBtn.dataset.char);
  });

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

  // Drawn once more as soon as the page (every picture included) has
  // finished loading. iPhone Safari left Emilia's crystal and axe off their
  // spots after a fresh page load — the first draw happens while those
  // pictures are still downloading — until something drew the panel again
  // (switching character or language put them right). This is that redraw,
  // done while the loading screen still covers the page.
  if (document.readyState !== "complete") {
    window.addEventListener("load", () => render(currentId), { once: true });
  }
})();
