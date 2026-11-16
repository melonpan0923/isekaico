// Loading screen, on every page. Loaded right after <body> opens (a plain,
// non-deferred script), so it covers the page before anything else is
// drawn.
//
// Every page load (first visit, clicking to another page, refreshing):
// a summoning circle draws itself on the "floor" (a dotted inner ring and
// a Pleiades-style constellation, すばる, inside), sparkles rise from its
// stars and forge the starlight card above it (purple, with a turning
// magic circle), which then flips to a random chibi with a burst of
// sparkles and dissolves into the page.
//
// It waits for the page to actually finish loading (images too),
// shows for at least a moment so it doesn't just flash, and never holds
// the page longer than MAX_MS. With "reduce motion" turned on in the
// device's settings, it's a plain fade.
//
// Chibis: the images in assets/images/loadingscreen/ — add or remove one
// in CHIBIS below. Pages that animate their title in wait for
// window.isekaiLoader.done, so the title builds in as the page appears.
(function () {
  const CHIBIS = ["albedo", "beako", "emilia", "megumin", "ram", "rem", "shalltear"];
  const DIR = "assets/images/loadingscreen/";
  const MAX_MS = 3000; // never hold the page longer than this
  const CARD_MIN_MS = 1450; // circle + forge play out at least this long before the flip

  let resolveDone;
  window.isekaiLoader = { done: new Promise((r) => (resolveDone = r)) };

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chibi = DIR + CHIBIS[Math.floor(Math.random() * CHIBIS.length)] + ".png";
  const root = document.documentElement;
  root.classList.add("is-loading");

  const loader = document.createElement("div");
  loader.className = "loader";
  loader.setAttribute("aria-hidden", "true");
  loader.innerHTML =
    '<div class="loader-stage">' +
    '<div class="loader-card"><div class="loader-card-inner">' +
    '<div class="loader-card-back"><svg class="loader-circle" viewBox="0 0 100 100">' +
    '<g class="loader-circle-spin"><circle cx="50" cy="50" r="38" fill="none" stroke="#cecbf6" stroke-width="1.2"/>' +
    '<circle cx="50" cy="50" r="31" fill="none" stroke="#afa9ec" stroke-width="1" stroke-dasharray="3 4"/>' +
    '<path d="M50 12 L83 69 L17 69 Z M50 88 L17 31 L83 31 Z" fill="none" stroke="#eeedfe" stroke-width="1.2"/></g>' +
    '<circle cx="50" cy="50" r="6" fill="#eeedfe"/></svg></div>' +
    '<div class="loader-card-front"><img src="' +
    chibi +
    '" alt=""></div>' +
    "</div></div>" +
    '<svg class="loader-floor" viewBox="0 0 260 56" aria-hidden="true"></svg>' +
    '<p class="loader-title">異世界コレクション</p>' +
    '<p class="loader-sub">isekaicollection</p>' +
    '<div class="loader-fx"></div>' +
    "</div>";
  // document.body exists: this script sits right after <body>.
  document.body.prepend(loader);

  const $ = (sel) => loader.querySelector(sel);
  const fx = $(".loader-fx");
  const title = $(".loader-title");
  const sub = $(".loader-sub");
  const start = performance.now();
  const anim = (el, frames, opts) => el.animate(frames, Object.assign({ fill: "forwards" }, opts));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // The page is "ready" once everything (images included) has loaded, or
  // MAX_MS has passed — whichever comes first.
  const pageReady = new Promise((r) => {
    if (document.readyState === "complete") r();
    else window.addEventListener("load", r, { once: true });
    setTimeout(r, MAX_MS);
  });
  const readyAfter = (minMs) =>
    Promise.all([pageReady, wait(Math.max(0, minMs - (performance.now() - start)))]);

  // Positions on the stage: x from its centre line, y from its top.
  const CARD_CY = 105; // middle of the card (it's 210px tall)
  const FLOOR_CY = 228; // middle of the floor circle

  function spark(x, y, color, size) {
    const s = document.createElement("i");
    s.style.cssText =
      "left:calc(50% + " +
      x +
      "px);top:" +
      y +
      "px;background:" +
      color +
      (size ? ";width:" + size + "px;height:" + size + "px;margin:-" + size / 2 + "px" : "");
    fx.appendChild(s);
    return s;
  }

  // Sparkles flying out from the middle of the card.
  function burst(count, dist, color) {
    for (let i = 0; i < count; i++) {
      const s = spark(0, CARD_CY, color);
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const d = dist * (0.6 + Math.random() * 0.5);
      anim(
        s,
        [
          { transform: "translate(0,0)", opacity: 1 },
          {
            transform: "translate(" + Math.cos(a) * d + "px," + Math.sin(a) * d + "px) scale(.3)",
            opacity: 0,
          },
        ],
        { duration: 600, easing: "ease-out" },
      ).onfinish = () => s.remove();
    }
  }

  // The summoning circle on the floor: the outer ring drawn round in one
  // stroke, a dotted inner ring, then seven stars (a stylised Pleiades)
  // and the lines joining them. Returns the stars' positions (stage
  // coordinates) so the sparkles can rise from them.
  const SVGNS = "http://www.w3.org/2000/svg";
  const STARS = [
    [22, 46, 2],
    [38, 38, 2.6],
    [52, 50, 4],
    [66, 42, 2.8],
    [78, 56, 3],
    [60, 68, 2.6],
    [34, 62, 2.2],
  ];
  const LINES = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 2],
    [1, 6],
    [6, 5],
  ];

  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  function drawFloor() {
    const svg = $(".loader-floor");
    // pathLength 100: the dash always covers the whole ring, so it closes fully
    const ring = svgEl(
      "ellipse",
      {
        cx: 130,
        cy: 28,
        rx: 117,
        ry: 24,
        fill: "none",
        stroke: "#7c6df0",
        "stroke-width": 2,
        pathLength: 100,
        "stroke-dasharray": 100,
        "stroke-dashoffset": 100,
      },
      svg,
    );
    anim(ring, [{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
      duration: 420,
      easing: "ease-in-out",
    });
    const dotted = svgEl(
      "ellipse",
      {
        cx: 130,
        cy: 28,
        rx: 90,
        ry: 18.5,
        fill: "none",
        stroke: "#afa9ec",
        "stroke-width": 1.2,
        "stroke-dasharray": "4 6",
        opacity: 0,
      },
      svg,
    );
    anim(dotted, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 280 });
    // the 0-100 star layout squashed flat onto the floor
    const pts = STARS.map(([x, y, r]) => [130 + (x - 50) * 1.8, 28 + (y - 53) * 0.63, r * 2.2]);
    LINES.forEach(([a, b], i) => {
      const l = svgEl(
        "line",
        {
          x1: pts[a][0],
          y1: pts[a][1],
          x2: pts[b][0],
          y2: pts[b][1],
          stroke: "#afa9ec",
          "stroke-width": 1.2,
          pathLength: 1,
          "stroke-dasharray": 1,
          "stroke-dashoffset": 1,
        },
        svg,
      );
      anim(l, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: 110,
        delay: 420 + i * 45,
      });
    });
    pts.forEach(([x, y, r], i) => {
      const k = r * 0.27;
      const star = svgEl(
        "path",
        {
          d:
            "M0 -" +
            r +
            " L" +
            k +
            " -" +
            k +
            " L" +
            r +
            " 0 L" +
            k +
            " " +
            k +
            " L0 " +
            r +
            " L-" +
            k +
            " " +
            k +
            " L-" +
            r +
            " 0 L-" +
            k +
            " -" +
            k +
            " Z",
          fill: "#7c6df0",
          transform: "translate(" + x + " " + y + ")",
          opacity: 0,
        },
        svg,
      );
      anim(star, [{ opacity: 0 }, { opacity: 1 }], { duration: 100, delay: 320 + i * 55 });
    });
    return { svg, stars: pts.map(([x, y]) => [x - 130, FLOOR_CY - 28 + y]) };
  }

  // Sparkles rising from the floor's stars into the card's shape.
  function rise(stars, count) {
    for (let i = 0; i < count; i++) {
      const [x, y] = stars[i % stars.length];
      const s = spark(x, y, i % 3 ? "#afa9ec" : "#7c6df0", i % 4 ? 6 : 8);
      const tx = (Math.random() - 0.5) * 150;
      const ty = CARD_CY + (Math.random() - 0.5) * 210;
      anim(
        s,
        [
          { transform: "translate(0,0)", opacity: 1 },
          { transform: "translate(" + (tx - x) + "px," + (ty - y) + "px)", opacity: 0 },
        ],
        { duration: 440, delay: Math.random() * 220, easing: "ease-out" },
      ).onfinish = () => s.remove();
    }
  }

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    resolveDone(); // page titles start building in as the page shows through
    root.classList.remove("is-loading");
    anim(loader, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "ease-out" });
    // A timer rather than onfinish: animations can stall (e.g. in a
    // background tab), and the overlay must never be left behind.
    setTimeout(() => loader.remove(), 350);
  }

  async function runCard() {
    const card = $(".loader-card");
    const inner = $(".loader-card-inner");
    const spin = $(".loader-circle-spin");
    // The magic circle on the card's back keeps turning until it flips.
    const spinning = spin.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      { duration: 4000, iterations: Infinity },
    );

    const floor = drawFloor();
    await wait(820);
    rise(floor.stars, 34);
    await wait(260);
    // The card forms out of the sparkles: a quick bright flash, then settles.
    anim(
      card,
      [
        { opacity: 0, transform: "scale(.6)", filter: "brightness(2)" },
        { opacity: 1, transform: "scale(1.05)", filter: "brightness(1.4)", offset: 0.6 },
        { opacity: 1, transform: "none", filter: "none" },
      ],
      { duration: 380, easing: "ease-out" },
    );

    await readyAfter(CARD_MIN_MS);
    anim(inner, [{ transform: "rotateY(0deg)" }, { transform: "rotateY(180deg)" }], {
      duration: 380,
      easing: "cubic-bezier(.5,0,.2,1)",
    });
    await wait(200);
    spinning.cancel();
    burst(16, 110, "#afa9ec");
    anim(title, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    anim(sub, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    await wait(450);
    anim(
      card,
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "scale(1.12)" },
      ],
      { duration: 260 },
    );
    anim(floor.svg, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 });
    burst(20, 150, "#cecbf6");
    await wait(120);
    finish();
  }

  async function runReduced() {
    loader.classList.add("is-static");
    await readyAfter(300);
    finish();
  }

  (reduce ? runReduced() : runCard()).catch(finish);
})();
