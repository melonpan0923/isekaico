// Renders the white panel on games.html from GAMES (js/games.js), based on
// the ?id= in the URL: title, then the 16:9 key art, then the summary —
// all in one panel. The bottom browse drawer (js/browse-drawer.js) swaps
// games in place via render() instead of a full page navigation.
(function () {
  const detail = document.getElementById("gameDetail");
  if (!detail || typeof GAMES === "undefined") return;

  function getActive(id) {
    return GAMES.find((g) => g.id === id) || GAMES[0];
  }

  // EN / JP (js/i18n.js): a text field of a data item in the current
  // language, and a fixed UI string. Plain English if i18n.js isn't loaded.
  const L = (item, key) => (window.I18N ? I18N.field(item, key) : item[key]);
  const T = (key, english) => (window.I18N ? I18N.t(key) : english);

  // Which game is showing and which unit/Pokémon/character is selected in
  // its Team block, so switching language re-renders the same view
  let currentId = null;
  let selected = 0;

  // Reveals the "Team" heading the same way anime.html reveals "Summary":
  // .revealed is added the first time it actually scrolls into view (see
  // .team-heading in style.css). One shared observer, re-pointed at the new
  // heading each time render() rebuilds it.
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

  // keep: re-rendering the same game (language switch) — keep the
  // selected unit and show the Team heading without replaying its reveal
  function render(id, keep) {
    const active = getActive(id);
    if (!keep) selected = 0;
    currentId = active.id;
    const title = L(active, "title");
    // A Pokémon party or a Genshin roster takes the Team block's place
    // (same heading, same spot)
    const hasTeam = !!(active.team || active.party || active.roster);

    // The previous game's Team block is about to be replaced: stop its
    // resize handling, which would otherwise keep measuring removed elements
    if (teamResizeObserver) teamResizeObserver.disconnect();
    window.removeEventListener("resize", teamAlignDecor);
    if (partyResizeObserver) partyResizeObserver.disconnect();

    // With a team, the white panel gets fully rounded corners and the Team
    // block sits below it on the page's polka-dot background; without one
    // the panel stays the flush last element of the page.
    detail.innerHTML =
      '<div class="anime-hero-panel game-panel' +
      (hasTeam ? " game-panel--has-team" : "") +
      '">' +
      '<div class="game-hero-inner">' +
      '<h2 class="game-title">' +
      title +
      "</h2>" +
      '<div class="game-shot"><img src="' +
      active.image +
      '" alt="' +
      title +
      '"></div>' +
      '<p class="anime-summary game-summary">' +
      L(active, "summary") +
      "</p>" +
      "</div>" +
      "</div>" +
      (active.team
        ? teamHtml(active.team)
        : active.party
          ? partyHtml(active.party)
          : active.roster
            ? rosterHtml(active.roster)
            : "");

    document.title = title + " | 異世界コレクション";

    // A Team panel is its own rounded panel, so the game drawer that embeds
    // below it at the page end becomes a separate panel too (style.css)
    const drawer = document.getElementById("animeDrawer");
    if (drawer) drawer.classList.toggle("drawer-separate", hasTeam);

    if (hasTeam) {
      if (active.team) initTeam(active.team);
      else if (active.party) initParty(active.party);
      else initRoster(active.roster);
      const teamHeading = detail.querySelector(".team-heading");
      if (keep || !headingObserver)
        teamHeading.classList.add("revealed"); // already seen / no IntersectionObserver support: just show it
      else headingObserver.observe(teamHeading);
    }
  }

  // Blue Archive's "lock-on" hover frame: four corner brackets with a ▼ on
  // top and ▲ underneath, drawn in the square-cropped icon's own 404x404
  // units. The brackets sit 28 units (~6px at the 81px icon width)
  // outside the picture with true arcs for the corners; the viewBox is
  // padded 60 units to fit the markers.
  const TEAM_FRAME =
    '<svg class="team-frame" viewBox="-60 -60 524 524" fill="none" stroke-width="16" stroke-linecap="round" shape-rendering="geometricPrecision" aria-hidden="true">' +
    '<path d="M-28 150 L-28 36 A64 64 0 0 1 36 -28 L140 -28"/>' +
    '<path d="M264 -28 L368 -28 A64 64 0 0 1 432 36 L432 150"/>' +
    '<path d="M432 254 L432 368 A64 64 0 0 1 368 432 L264 432"/>' +
    '<path d="M140 432 L36 432 A64 64 0 0 1 -28 368 L-28 254"/>' +
    '<polygon points="178,-50 226,-50 202,-18"/>' +
    '<polygon points="178,454 226,454 202,422"/>' +
    "</svg>";

  // Same markup as character.html's stat rows so the font sizing matches
  function teamStat(label, id) {
    return (
      '<div class="character-stat"><span class="character-stat-label">' +
      label +
      (window.I18N && I18N.lang === "ja" ? "：</span>" : ":</span> ") +
      '<span class="character-stat-value" id="' +
      id +
      '"></span></div>'
    );
  }

  // Panel decoration (design "B"): the unit's school emblem as a faint
  // grey watermark near the top (like the one on Blue Archive's own student
  // frame), a barcode bottom-right and Blue
  // Archive's split triangle (one triangle cut into four, the middle one
  // left hollow, the other three in three tints) hanging from the top edge
  // top-right and standing on the bottom edge bottom-left. The selected
  // unit's school name sits at the top of the left column (.team-main).
  const TEAM_BARCODE_BARS = [
    [0, 2],
    [5, 4],
    [12, 1],
    [16, 3],
    [22, 2],
    [27, 5],
    [35, 1],
    [39, 3],
    [45, 2],
    [50, 4],
    [57, 2],
    [62, 3],
    [67, 1],
    [71, 4],
    [77, 1],
  ];
  const TEAM_DECOR =
    '<img class="team-logo" id="teamLogo" alt="" aria-hidden="true">' +
    '<svg class="team-tri team-tri--tr" viewBox="0 0 60 52" aria-hidden="true">' +
    '<path class="team-tri-light" d="M0 0 L30 0 L15 26 Z"/>' +
    '<path class="team-tri-dark" d="M30 0 L60 0 L45 26 Z"/>' +
    '<path class="team-tri-mid" d="M15 26 L45 26 L30 52 Z"/>' +
    "</svg>" +
    '<svg class="team-tri team-tri--bl" viewBox="0 0 60 52" aria-hidden="true">' +
    '<path class="team-tri-light" d="M0 52 L30 52 L15 26 Z"/>' +
    '<path class="team-tri-dark" d="M30 52 L60 52 L45 26 Z"/>' +
    '<path class="team-tri-mid" d="M15 26 L45 26 L30 0 Z"/>' +
    "</svg>" +
    '<svg class="team-barcode" viewBox="0 0 78 14" aria-hidden="true">' +
    TEAM_BARCODE_BARS.map(([x, w]) => '<rect x="' + x + '" width="' + w + '" height="14"/>').join(
      "",
    ) +
    "</svg>";

  // Tick ruler between the profile and the icon grid: major ticks at the ends and quarters,
  // minor ticks in between (x in % so it stretches with the grid width)
  const TEAM_RULER =
    '<svg class="team-ruler" aria-hidden="true">' +
    // ends exactly on the first/last tick so the line doesn't poke out
    '<line x1="0.6%" y1="50%" x2="99.4%" y2="50%"/>' +
    [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100]
      .map((x, i) => {
        const len = i % 2 === 0 ? 9 : 5;
        const px = (x === 100 ? 99.4 : x === 0 ? 0.6 : x) + "%";
        return (
          '<line x1="' + px + '" x2="' + px + '" y1="' + (11 - len) + '" y2="' + (11 + len) + '"/>'
        );
      })
      .join("") +
    "</svg>";

  function teamHtml(team) {
    const icons = team
      .map(
        (unit, i) =>
          '<button class="team-icon' +
          (unit.col ? " team-col-" + unit.col : "") +
          '" data-index="' +
          i +
          '" aria-label="' +
          L(unit, "name") +
          '">' +
          '<img src="' +
          unit.icon +
          '" alt="">' +
          TEAM_FRAME +
          "</button>",
      )
      .join("");

    return (
      '<div class="team" id="gameTeam">' +
      '<h3 class="team-heading">' +
      T("game.team", "Team") +
      "</h3>" +
      '<div class="team-panel">' +
      TEAM_DECOR +
      '<div class="team-stage">' +
      '<div class="team-main">' +
      '<p class="team-school" id="teamSchool"></p>' +
      '<div class="team-profile">' +
      '<div class="team-portrait"><img id="teamPortrait" alt=""></div>' +
      '<div class="team-info">' +
      '<p class="team-name" id="teamName"></p>' +
      teamStat(T("team.academy", "Academy"), "teamAcademy") +
      teamStat(T("team.year", "Year"), "teamYear") +
      teamStat(T("team.birthday", "Birthday"), "teamBirthday") +
      teamStat(T("team.height", "Height"), "teamHeight") +
      "</div>" +
      "</div>" +
      TEAM_RULER +
      '<div class="team-icons" id="teamIcons">' +
      icons +
      "</div>" +
      "</div>" +
      '<div class="team-full">' +
      '<div class="team-figure" id="teamFigure">' +
      '<img class="team-full-art" id="teamFull" alt="">' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  // Clicking an icon swaps the profile + full-body art using the official
  // site's sequence: drop .team-loaded (everything transitions back out
  // over 0.5s), swap the content once that's finished, then re-add
  // .team-loaded 100ms later so it all transitions back in. The block is
  // rebuilt on every render(), so listeners are re-attached each time.
  const TEAM_OUT_MS = 500;
  const TEAM_IN_DELAY_MS = 100;

  let teamResizeObserver = null;
  let teamAlignDecor = () => {};

  // ----- Phones: desktop panels, just smaller -----
  // The Team / Pokémon / Genshin panels keep their desktop layout on
  // phones: style.css lays each out at a fixed desktop width, and this
  // shrinks the finished panel down to the screen's width, edge to edge,
  // like a picture (the CSS scale property, from its top-left corner). Off
  // phones (or with el missing) it's cleared and the normal CSS applies.
  //
  // scale, not zoom: CSS zoom re-lays the panel out at the smaller size,
  // and iPhone Safari does that differently from Chrome — it measured
  // positions inside it differently (Karin's full-body art, lined up by
  // alignBody, ended up past the screen edge) and inflated small text
  // (Genshin names spilling out). A scaled panel is laid out at full size
  // first, so every browser gets the same picture.
  const miniPhone = window.matchMedia("(max-width: 700px)");
  const miniFitters = new WeakMap();

  // the scale fitMini applied (1 when none): the panel's screen rects
  // (getBoundingClientRect) are scaled, its layout sizes and styles aren't
  function miniScale(el) {
    return (el && parseFloat(el.dataset.miniScale)) || 1;
  }

  function fitMini(el, designW) {
    if (!el) return false;
    el.style.scale = "";
    el.style.transformOrigin = "";
    el.style.marginLeft = "";
    el.style.marginBottom = "";
    delete el.dataset.miniScale;
    if (!miniPhone.matches) return false;
    const left = el.getBoundingClientRect().left;
    const baseBottom = parseFloat(getComputedStyle(el).marginBottom) || 0;
    const z = (document.documentElement.clientWidth + 2) / designW;
    el.dataset.miniScale = z;
    el.style.transformOrigin = "0 0";
    el.style.scale = String(z);
    el.style.marginLeft = -(left + 1) + "px";
    // a scaled panel still takes up its full-size height in the page, so
    // the space it no longer fills is taken back underneath it — kept up
    // to date as its content changes height (e.g. switching characters)
    const fitHeight = () => {
      if (!el.dataset.miniScale) return;
      el.style.marginBottom = baseBottom - el.offsetHeight * (1 - miniScale(el)) + "px";
    };
    fitHeight();
    if (miniFitters.has(el)) miniFitters.get(el).disconnect();
    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(fitHeight);
      ro.observe(el);
      miniFitters.set(el, ro);
    }
    return true;
  }

  // The Team panel's mini version is a class (.team-mini) since its phone
  // layout is a different design, not just a smaller one. To go back to
  // that phone layout instead, set TEAM_MINI to false.
  const TEAM_MINI = true;
  const TEAM_DESIGN_W = 880;

  function fitTeamPanel() {
    const panel = document.querySelector("#gameTeam .team-panel");
    if (!panel) return;
    panel.classList.toggle("team-mini", TEAM_MINI && miniPhone.matches);
    if (TEAM_MINI) fitMini(panel, TEAM_DESIGN_W);
  }

  // Pokémon: .party-wrap at the width it has on a 1100px-wide screen
  // (style.css); everything inside is sized in % of it, so it simply
  // scales down
  const PARTY_DESIGN_W = 880;
  let partyPlace = () => {};
  window.addEventListener("resize", () => {
    fitMini(document.querySelector(".party-wrap"), PARTY_DESIGN_W);
    partyPlace();
  });
  window.addEventListener("resize", () => {
    fitTeamPanel();
    teamAlignDecor();
  });

  function initTeam(team) {
    const stage = document.querySelector("#gameTeam .team-panel");
    const icons = document.getElementById("teamIcons");
    let current = -1;
    let swapTimer = 0;
    let inTimer = 0;

    function fill(unit) {
      document.getElementById("teamPortrait").src = unit.icon;
      document.getElementById("teamFull").src = unit.full;
      document.getElementById("teamFull").alt = L(unit, "name");
      document.getElementById("teamName").textContent = L(unit, "name");
      document.getElementById("teamSchool").textContent = L(unit, "school") || "";
      document.getElementById("teamLogo").src = unit.logo || "";
      document.getElementById("teamAcademy").textContent = L(unit, "academy");
      document.getElementById("teamYear").textContent = L(unit, "year");
      document.getElementById("teamBirthday").textContent = L(unit, "birthday");
      document.getElementById("teamHeight").textContent = L(unit, "height");
    }

    function select(i, instant) {
      if (i === current) return;
      current = i;
      selected = i;
      icons.querySelectorAll(".team-icon").forEach((b, j) => b.classList.toggle("active", i === j));

      clearTimeout(swapTimer);
      clearTimeout(inTimer);
      stage.classList.remove("team-loaded");

      swapTimer = setTimeout(
        () => {
          fill(team[i]);
          // Fade back in only once the new full-body art is decoded and
          // lined up (or after 1.5s at worst), so it never fades in empty
          // and then pops in / jumps sideways on a slow connection.
          const ready = art.decode ? art.decode().catch(() => {}) : Promise.resolve();
          const timeout = new Promise((r) => setTimeout(r, 1500));
          Promise.race([ready, timeout]).then(() => {
            if (current !== i) return; // another student was picked meanwhile
            alignBody();
            inTimer = setTimeout(() => stage.classList.add("team-loaded"), TEAM_IN_DELAY_MS);
          });
        },
        instant ? 0 : TEAM_OUT_MS,
      );
    }

    // Download every student's pictures in the background as soon as the
    // panel exists, so switching never has to wait for the network.
    team.forEach((unit) =>
      [unit.icon, unit.full, unit.logo].forEach((src) => {
        if (src) new Image().src = src;
      }),
    );

    icons.addEventListener("click", (e) => {
      const btn = e.target.closest(".team-icon");
      if (btn) select(Number(btn.dataset.index));
    });

    // The corner triangles line up with the content's outer edges: the
    // bottom-left one with the left column's start (same line as the
    // school name, portrait, ruler and icons), the top-right one the same
    // distance in from the right — which, since the content is centred,
    // is where the full-body column ends. That distance depends on the
    // layout, so it's measured and kept up to date on resize.
    const main = stage.querySelector(".team-main");
    const figure = document.getElementById("teamFigure");
    const art = document.getElementById("teamFull");

    // Shift the full-body art sideways so the character's body centre
    // (bodyX, % across their art) sits at 75% of the panel's width when
    // the art is in the right-hand column, or the panel's centre once the
    // layout stacks. The current shift is subtracted first so the
    // measurement is of the art's natural, unshifted position.
    const BODY_TARGET = 0.75;
    const alignBody = () => {
      const unit = team[current];
      if (!unit || !art.naturalWidth) return;
      // the phone "mini" panel is scaled (fitTeamPanel): screen rects come
      // back scaled, layout offsets and styles don't — z converts between
      const z = miniScale(stage);
      const panel = stage.getBoundingClientRect();
      // layout offsets (not getBoundingClientRect) for the figure/art, so
      // the slide-in transform on .team-figure doesn't skew the reading
      const column = figure.offsetParent.getBoundingClientRect();
      const shiftNow = (parseFloat(figure.style.left) || 0) * z;
      const stacked =
        getComputedStyle(stage.querySelector(".team-stage")).gridTemplateColumns.split(" ").length <
        2;
      const target = panel.left + panel.width * (stacked ? 0.5 : BODY_TARGET);
      const body =
        column.left +
        (figure.offsetLeft + art.offsetWidth * ((unit.bodyX || 50) / 100)) * z -
        shiftNow;
      figure.style.left = Math.round((target - body) / z) + "px";
    };
    art.addEventListener("load", alignBody);

    fitTeamPanel();
    const alignDecor = () => {
      const z = miniScale(stage);
      const edge = (main.getBoundingClientRect().left - stage.getBoundingClientRect().left) / z;
      stage.style.setProperty("--team-edge", Math.max(0, Math.round(edge)) + "px");
      alignBody();
    };
    if (teamResizeObserver) teamResizeObserver.disconnect();
    if ("ResizeObserver" in window) {
      teamResizeObserver = new ResizeObserver(alignDecor);
      teamResizeObserver.observe(stage);
      teamResizeObserver.observe(main);
    }
    window.removeEventListener("resize", teamAlignDecor);
    teamAlignDecor = alignDecor;
    window.addEventListener("resize", teamAlignDecor);
    alignDecor();

    select(Math.min(selected, team.length - 1), true);
  }

  // ===== Pokémon "party" block (Pokémon Legends: Z-A) =====
  // Clean white panel with a faint Poké Ball pattern: the selected
  // Pokémon's animated sprite on a Poké Ball stand on the left (spinning
  // Poké Ball behind it, Dex card under it), the six party members as a
  // 2x3 grid of cards on the right. The background is tinted with the
  // selected Pokémon's two type colours (--t1 / --t2), so it changes mood
  // as you click through. Sized in cqw (container units of .party-wrap) so
  // the whole panel scales as one picture; below 640px it stacks (see
  // .party in style.css).
  const PARTY_TYPE_COLORS = {
    Psychic: "#f9558a",
    Fairy: "#ef7ee6",
    Dragon: "#5263de",
    Ground: "#d39348",
    Fighting: "#e3653b",
    Steel: "#5aa2b8",
  };
  // the official Japanese type names
  const PARTY_TYPE_JA = {
    Psychic: "エスパー",
    Fairy: "フェアリー",
    Dragon: "ドラゴン",
    Ground: "じめん",
    Fighting: "かくとう",
    Steel: "はがね",
  };
  const typeName = (t) => (window.I18N && I18N.lang === "ja" ? PARTY_TYPE_JA[t] || t : t);
  const PARTY_SEX = { m: "♂", f: "♀", n: "" };

  const PARTY_BALL =
    '<svg class="party-ball" viewBox="0 0 100 100" aria-hidden="true">' +
    '<circle cx="50" cy="50" r="45" fill="#fff"/>' +
    '<path d="M5 50a45 45 0 0 1 90 0Z" fill="#ff3d5e"/>' +
    '<circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="7"/>' +
    '<path d="M5 50H36M64 50H95" stroke="currentColor" stroke-width="7"/>' +
    '<circle cx="50" cy="50" r="13" fill="#fff" stroke="currentColor" stroke-width="7"/>' +
    '<circle cx="50" cy="50" r="5.5" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".35"/>' +
    "</svg>";

  // Big outlined Poké Ball slowly turning behind the showcase
  const PARTY_WATERMARK =
    '<svg class="party-watermark" viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden="true">' +
    '<circle cx="50" cy="50" r="44" stroke-width="8"/>' +
    '<path d="M6 50H35M65 50H94" stroke-width="8"/>' +
    '<circle cx="50" cy="50" r="13" stroke-width="7"/>' +
    "</svg>";

  // The held Mega Stone: the official item art
  function partyStone(mon) {
    return '<img class="party-stone" src="' + mon.stoneIcon + '" alt="">';
  }

  function partyHtml(party) {
    const slots = party
      .map(
        (mon, i) =>
          '<li><button class="party-slot" data-index="' +
          i +
          '" aria-label="' +
          L(mon, "name") +
          ", Lv. " +
          mon.lv +
          '">' +
          '<span class="party-icon"><img class="party-mon" src="' +
          mon.icon +
          '" alt="">' +
          partyStone(mon) +
          "</span>" +
          '<span class="party-meta">' +
          '<span class="party-name">' +
          L(mon, "name") +
          "</span>" +
          '<span class="party-sex party-sex--' +
          mon.sex +
          '">' +
          PARTY_SEX[mon.sex] +
          "</span>" +
          '<span class="party-bar"><i></i></span>' +
          '<span class="party-stats"><span>' +
          mon.hp +
          "/" +
          mon.hp +
          "</span><span><small>Lv.</small>" +
          mon.lv +
          "</span></span>" +
          "</span>" +
          "</button></li>",
      )
      .join("");

    return (
      '<div class="team" id="gameTeam">' +
      '<h3 class="team-heading">' +
      T("game.team", "Team") +
      "</h3>" +
      '<div class="party-wrap">' +
      '<section class="party" id="gameParty" aria-label="Pokémon party">' +
      '<div class="party-bg party-bg--tint"></div><div class="party-bg party-bg--pattern"></div>' +
      '<div class="party-head">' +
      PARTY_BALL +
      "<h4>" +
      T("party.heading", "POKÉMON") +
      "</h4></div>" +
      '<div class="party-stage">' +
      PARTY_WATERMARK +
      '<div class="party-stand"></div><img class="party-sprite" id="partySprite" alt=""></div>' +
      '<div class="party-plate" aria-live="polite">' +
      '<div><div class="party-no" id="partyNo"></div>' +
      '<div class="party-full"><span id="partyName"></span><img class="party-plate-stone" id="partyStone" alt=""></div></div>' +
      '<div class="party-types" id="partyTypes"></div>' +
      "</div>" +
      '<ol class="party-list" id="partyList">' +
      slots +
      "</ol>" +
      "</section>" +
      "</div>" +
      "</div>"
    );
  }

  let partyResizeObserver = null;

  // How many CSS px each pixel of the showcase sprite covers on desktop.
  // The sprites are only ~60-150px, so bigger means blockier. It's rounded
  // to whole SCREEN pixels (see place()), so 1.6 lands on 2 screen px per
  // art pixel at 100%/125%/150% display scaling and 3 at 175%/200%.
  const PARTY_SPRITE_SCALE = 1.6;

  function initParty(party) {
    const panel = document.getElementById("gameParty");
    const list = document.getElementById("partyList");
    const sprite = document.getElementById("partySprite");
    const slots = [...list.querySelectorAll(".party-slot")];
    let current = -1;

    // warm the cache so switching doesn't flash an empty stage
    party.forEach((mon) => {
      new Image().src = mon.sprite;
    });

    function select(i) {
      if (i === current) return;
      current = i;
      selected = i;
      slots.forEach((s, j) => s.classList.toggle("on", i === j));
      const mon = party[i];

      // The sprite's size and position depend on its natural size, so
      // it's measured before being shown
      const probe = new Image();
      probe.onload = () => {
        if (current !== i) return;
        natural = { w: probe.naturalWidth, h: probe.naturalHeight, bodyX: (mon.bodyX || 50) / 100 };
        place();
        sprite.src = mon.sprite;
        sprite.alt = T("party.mega", "Mega ") + L(mon, "name");
        sprite.classList.remove("enter");
        void sprite.offsetWidth; // restart the pop-in animation
        sprite.classList.add("enter");
      };
      probe.src = mon.sprite;

      document.getElementById("partyNo").textContent = "No. " + String(mon.no).padStart(4, "0");
      document.getElementById("partyName").textContent = L(mon, "name");
      document.getElementById("partyTypes").innerHTML = mon.types
        .map(
          (t) =>
            '<span class="party-type" style="background:' +
            PARTY_TYPE_COLORS[t] +
            '">' +
            typeName(t) +
            "</span>",
        )
        .join("");
      const stone = document.getElementById("partyStone");
      stone.src = mon.stoneIcon;
      stone.alt = L(mon, "stone");
      stone.title = L(mon, "stone");

      // tint the background with this Pokémon's types (single-type: both the same)
      panel.style.setProperty("--t1", PARTY_TYPE_COLORS[mon.types[0]]);
      panel.style.setProperty("--t2", PARTY_TYPE_COLORS[mon.types[1] || mon.types[0]]);
    }

    list.addEventListener("click", (e) => {
      const btn = e.target.closest(".party-slot");
      if (btn) select(Number(btn.dataset.index));
    });
    // Arrow keys move through the grid: left/right one card, up/down one
    // row (two cards; one on phones, where the cards stack in a single column)
    const STEP = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -2, ArrowDown: 2 };
    list.addEventListener("keydown", (e) => {
      let step = STEP[e.key];
      if (!step) return;
      e.preventDefault();
      if (getComputedStyle(list).gridTemplateColumns.split(" ").length < 2) step = Math.sign(step);
      const n = (current + step + party.length) % party.length;
      select(n);
      slots[n].focus();
    });

    // Pixel art only stays crisp when each art pixel covers a whole number
    // of SCREEN pixels. On a scaled display (devicePixelRatio 1.25, 1.75...)
    // "2px" is 2.5 or 3.5 screen pixels and gets smoothed, so the scale is
    // picked in screen pixels and converted back: PARTY_SPRITE_SCALE CSS px
    // per art pixel (1.5 on phones, where the stage is short), rounded to
    // whole screen pixels.
    // The top-left corner is snapped to the screen grid the same way, so
    // the sprite's bottom-centre stands at --party-ax / --party-ay. "Centre"
    // is the body's centre (bodyX, % across the art), not the image's, so
    // a lopsided sprite like Mawile (jaws trailing off to one side) still
    // stands in the middle.
    const stageEl = panel.querySelector(".party-stage");
    let natural = null;
    function place() {
      // the phone "mini" panel is scaled (fitMini): one CSS px inside it is
      // z screen px, so the crisp-pixel maths runs at dpr × z, and screen
      // positions are divided by z to become CSS px inside it
      const z = miniScale(panel.parentElement);
      const screenDpr = window.devicePixelRatio || 1;
      const dpr = screenDpr * z;
      const w = panel.getBoundingClientRect().width / z;
      const phone = w <= 640;
      // scaled: aim for the 2 CSS px per art pixel that PARTY_SPRITE_SCALE
      // works out to on a desktop screen, else the shrunk panel's
      // rounding can halve the sprite
      const target = phone ? 1.5 : z < 1 ? 2 : PARTY_SPRITE_SCALE;
      const device = Math.round(target * dpr);
      const scale = Math.max(1, device) / dpr;
      panel.style.setProperty("--party-px", scale + "px");
      if (!natural) return;

      sprite.style.setProperty("--w", natural.w);
      const box = stageEl.getBoundingClientRect();
      const cs = getComputedStyle(stageEl);
      const ax = parseFloat(cs.getPropertyValue("--party-ax")) || 0.5;
      const ay = parseFloat(cs.getPropertyValue("--party-ay")) || 0.7;
      // snapped in page coordinates — the screen grid moves with the page
      // when it scrolls, the window-relative position doesn't
      const snap = (v) => Math.round(v * screenDpr) / screenDpr;
      const x0 = box.left + window.scrollX;
      const y0 = box.top + window.scrollY;
      const left = snap(x0 + box.width * ax - natural.w * scale * z * natural.bodyX) - x0;
      const top = snap(y0 + box.height * ay - natural.h * scale * z) - y0;
      sprite.style.setProperty("--sx", left / z + "px");
      sprite.style.setProperty("--sy", top / z + "px");
    }
    fitMini(panel.parentElement, PARTY_DESIGN_W);
    partyPlace = place;
    if (partyResizeObserver) partyResizeObserver.disconnect();
    if ("ResizeObserver" in window) {
      partyResizeObserver = new ResizeObserver(place);
      partyResizeObserver.observe(panel);
    }
    place();

    // Each card's icon stands with its feet in the platform's bottom half.
    // The icons leave different amounts of empty space under their feet
    // (Mawile's art stops a quarter of the way up), so the lowest
    // non-transparent row is found and passed to CSS as --gap, a fraction
    // of the icon's width (see .party-mon).
    list.querySelectorAll(".party-mon").forEach((img) => {
      const measure = () => {
        const w = img.naturalWidth,
          h = img.naturalHeight;
        if (!w) return;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        let data;
        try {
          data = ctx.getImageData(0, 0, w, h).data;
        } catch {
          return;
        } // tainted canvas: leave it as is
        let y = h - 1;
        rows: for (; y >= 0; y--) {
          for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 20) break rows;
        }
        img.style.setProperty("--gap", ((h - 1 - y) / w).toFixed(4));
      };
      if (img.complete) measure();
      else img.addEventListener("load", measure, { once: true });
    });

    select(Math.min(selected, party.length - 1));
  }

  // ===== Genshin "roster" block =====
  // A panel whose whole background is the selected character's namecard,
  // with the character icons in a column down the left side, styled like
  // genshin.gg's character list: the portrait on the 5★ tile, the element
  // in a navy circle hanging off the top-right corner, the name below. The
  // namecard sits on two stacked layers so switching characters
  // crossfades: the new card loads into the hidden layer, which then
  // fades in on top.
  // The game's own element symbols (64x64, from Project Amber's copy of
  // the game UI: UI_Buff_Element_Fire / _Water / _Ice)
  const ROSTER_ELEMENTS = {
    Pyro: "assets/images/game/genshin%20impact/elements/Pyro.png",
    Hydro: "assets/images/game/genshin%20impact/elements/Hydro.png",
    Cryo: "assets/images/game/genshin%20impact/elements/Cryo.png",
  };

  function rosterHtml(roster) {
    const icons = roster
      .map(
        (c, i) =>
          '<button class="roster-icon" data-index="' +
          i +
          '" aria-label="' +
          L(c, "name") +
          (c.element ? ", " + c.element : "") +
          '" aria-pressed="false">' +
          '<span class="roster-pic"><img src="' +
          c.icon +
          '" alt=""></span>' +
          (ROSTER_ELEMENTS[c.element]
            ? '<img class="roster-element" src="' + ROSTER_ELEMENTS[c.element] + '" alt="">'
            : "") +
          '<span class="roster-name">' +
          L(c, "name") +
          "</span>" +
          "</button>",
      )
      .join("");

    return (
      '<div class="team" id="gameTeam">' +
      '<h3 class="team-heading">' +
      T("game.team", "Team") +
      "</h3>" +
      '<section class="roster" id="gameRoster" aria-label="Genshin Impact team">' +
      '<div class="roster-bg"></div><div class="roster-bg"></div>' +
      '<img class="roster-profile" id="rosterProfile" alt="">' +
      // icons and info side by side, so the info runs exactly from the
      // top of the first icon to the bottom of the last (see .roster-side)
      '<div class="roster-side">' +
      '<div class="roster-icons" id="rosterIcons">' +
      icons +
      "</div>" +
      '<div class="roster-info" id="rosterInfo" aria-live="polite">' +
      '<div class="roster-head">' +
      '<span class="roster-line"></span>' +
      '<h4 class="roster-title" id="rosterTitle"></h4>' +
      '<img class="roster-item" id="rosterItem" alt="">' +
      "</div>" +
      '<div class="roster-intro" id="rosterIntro"></div>' +
      "</div>" +
      "</div>" +
      "</section>" +
      "</div>"
    );
  }

  // Phones: the roster keeps its desktop layout at a fixed 720px (style.css)
  // and is scaled down to the screen's width, edge to edge — the same
  // panel, just smaller. Off phones, back to the normal CSS sizing.
  const ROSTER_DESIGN_W = 720;

  function fitRoster() {
    fitMini(document.getElementById("gameRoster"), ROSTER_DESIGN_W);
  }
  window.addEventListener("resize", fitRoster);

  function initRoster(roster) {
    const panel = document.getElementById("gameRoster");
    fitRoster();
    const layers = panel.querySelectorAll(".roster-bg");
    const buttons = [...panel.querySelectorAll(".roster-icon")];
    const profile = document.getElementById("rosterProfile");
    const info = document.getElementById("rosterInfo");
    let current = -1;

    // Name + official blurb, laid out like genshin.hoyoverse.com's
    // character pages; it fades and slides in afresh on every switch (.shown)
    function showInfo(c) {
      info.classList.remove("shown");
      document.getElementById("rosterTitle").textContent = L(c, "name");
      const item = document.getElementById("rosterItem");
      if (c.item) item.src = c.item;
      else item.removeAttribute("src");
      item.hidden = !c.item;
      const intro = document.getElementById("rosterIntro");
      intro.replaceChildren(
        ...(L(c, "intro") || []).map((text) => {
          const p = document.createElement("p");
          p.textContent = text;
          return p;
        }),
      );
      intro.hidden = !(c.intro && c.intro.length);
      intro.scrollTop = 0;
      void info.offsetWidth;
      info.classList.add("shown");
    }
    let front = 0;

    // warm the cache so the first switch to each card doesn't fade in blank
    roster.forEach((c) => {
      new Image().src = c.namecard;
      if (c.profile) new Image().src = c.profile;
    });

    // A character without profile art: the current one slides back out to
    // the right. One with: it's snapped back past the right edge (no
    // animation) and then slides in from there (.up), fresh on every switch.
    function showProfile(c) {
      if (!c.profile) {
        profile.classList.remove("up");
        return;
      }
      const img = new Image();
      img.onload = () => {
        if (roster[current] !== c) return;
        profile.style.transition = "none";
        profile.classList.remove("up");
        profile.src = c.profile;
        profile.alt = L(c, "name");
        // per-character size/offset (profileFit in js/games.js), else the CSS defaults
        const fit = c.profileFit || {};
        profile.style.setProperty("--profile-h", fit.height || "");
        profile.style.setProperty("--profile-right", fit.right || "");
        profile.style.setProperty("--profile-bottom", fit.bottom || "");
        void profile.offsetWidth;
        profile.style.transition = "";
        profile.classList.add("up");
      };
      img.src = c.profile;
    }

    function select(i) {
      if (i === current) return;
      current = i;
      selected = i;
      buttons.forEach((b, j) => {
        b.classList.toggle("active", i === j);
        b.setAttribute("aria-pressed", String(i === j));
      });
      showProfile(roster[i]);
      showInfo(roster[i]);

      const next = layers[1 - front];
      const img = new Image();
      img.onload = () => {
        if (current !== i) return;
        // start the incoming layer from fully hidden, without animating
        // it out from wherever it was
        next.style.transition = "none";
        next.classList.remove("under", "on");
        next.style.backgroundImage = 'url("' + roster[i].namecard + '")';
        void next.offsetWidth;
        next.style.transition = "";
        layers[front].classList.replace("on", "under");
        next.classList.add("on");
        front = 1 - front;
      };
      img.src = roster[i].namecard;
    }

    panel.addEventListener("click", (e) => {
      const btn = e.target.closest(".roster-icon");
      if (btn) select(Number(btn.dataset.index));
    });

    select(Math.min(selected, roster.length - 1));
  }

  // JP / EN switched: redraw the same game with the same selection
  document.addEventListener("langchange", () => render(currentId, true));

  window.addEventListener("popstate", () => {
    render(new URLSearchParams(location.search).get("id"));
  });

  render(new URLSearchParams(location.search).get("id"));

  initBrowseDrawer({ items: GAMES, page: "games.html", onSelect: render });
})();
