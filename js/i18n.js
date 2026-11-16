// EN / JP switch shared by every page. Load it before the page's own
// scripts (right after main.js).
//
// - The choice is remembered in this browser (localStorage), so the next
//   page opens in the same language. English is the default.
// - Fixed text in the HTML is marked with data-i18n="key" (its text is
//   replaced), data-i18n-html="key" (for the few strings with markup in
//   them, all written here in STRINGS), data-i18n-aria="key" (its
//   aria-label) or data-i18n-alt="key" (an image's alt). In English the
//   element gets STRINGS.en[key], or if there's none, the text the HTML
//   itself was written with (remembered the first time), so English-only
//   content like home-page titles needs only a Japanese entry here.
// - Data files (js/games.js etc.) give an item its Japanese text in a `ja`
//   object next to the English fields, e.g.
//     { title: "Genshin Impact", ja: { title: "原神" }, ... }
//   and the page reads them through I18N.field(item, "title"), which falls
//   back to the English field when there's no Japanese one.
// - Switching fires a "langchange" event on document; pages listen for it
//   to re-render their own content.
(function () {
  const STORE_KEY = "lang";

  // Japanese for the site's fixed text. Official terms are used where the
  // games/series have them; the rest are plain translations.
  const STRINGS = {
    ja: {
      // header / navigation
      "nav.home": "ホーム",
      "nav.anime": "アニメ",
      "nav.character": "キャラクター",
      "nav.music": "楽曲",
      "nav.game": "ゲーム",
      "aria.backToTop": "トップへ戻る",
      // games.html
      "page.game": "ゲーム",
      "game.team": "チーム",
      "game.browse": "ゲーム一覧",
      "game.prev": "前のゲーム",
      "game.next": "次のゲーム",
      "team.academy": "学園",
      "team.year": "学年",
      "team.birthday": "誕生日",
      "team.height": "身長",
      "party.heading": "ポケモン",
      "party.mega": "メガ",
      // anime.html
      "page.anime": "アニメ",
      "anime.summary": "ストーリー",
      "anime.comingSoon": "予告映像は近日公開",
      "anime.playPreview": "予告映像を再生",
      "anime.browse": "アニメ一覧",
      "anime.prev": "前のアニメ",
      "anime.next": "次のアニメ",
      // character.html
      "page.character": "キャラクター",
      "char.name": "名前",
      "char.cv": "CV",
      "char.age": "年齢",
      "char.height": "身長",
      "char.birthday": "誕生日",
      "char.voice": "ボイス",
      "char.playVoice": "のボイスを再生",
      // music.html
      "page.music": "楽曲",
      "music.chooseArtist": "アーティストを選択",
      "music.allSongs": "全曲",
      "music.sortBy": "並べ替え",
      "music.sortCustom": "カスタム順",
      "music.sortTitle": "タイトル",
      "music.sortArtist": "アーティスト",
      "music.colTitle": "タイトル",
      "music.hint":
        "ヒント：<strong>カスタム順</strong>に切り替えると、曲をドラッグして並べ替えられます。",
      "music.noSongs": "まだ曲がありません。",
      "music.soon": "近日",
      "music.modeSong": "オーディオ",
      "music.modeVideo": "ビデオ",
      "music.play": "再生",
      "music.pause": "一時停止",
      "music.prev": "前の曲",
      "music.next": "次の曲",
      "music.shuffle": "シャッフル",
      "music.repeat": "リピート",
      "music.seek": "再生位置",
      "music.fullscreen": "全画面表示",
      "music.exitFullscreen": "全画面表示を終了",
      "music.backToPlayer": "プレイヤーに戻る",
      "music.lyrics": "歌詞",
      // index.html — titles/names are the same Japanese as on each page
      "home.favourite": "お気に入り",
      "home.more": "もっと見る",
      "home.anime.rezero": "Re:ゼロから始める異世界生活",
      "home.anime.konosuba": "この素晴らしい世界に祝福を！",
      "home.anime.tensura": "転生したらスライムだった件",
      "home.anime.danmachi": "ダンジョンに出会いを求めるのは間違っているだろうか",
      "home.anime.frieren": "葬送のフリーレン",
      "home.char.emilia": "エミリア",
      "home.char.zerotwo": "ゼロツー",
      "home.char.rimuru": "リムル",
      "home.char.ram": "ラム",
      "home.char.frieren": "フリーレン",
      "home.music.rie": "高橋李依",
      "home.game.bluearchive": "ブルーアーカイブ",
      "home.game.nier": "ニーア オートマタ",
      "home.game.genshin": "原神",
      "home.game.pokemon": "Pokémon LEGENDS Z-A",
    },
    en: {
      "nav.home": "Home",
      "nav.anime": "Anime",
      "nav.character": "Character",
      "nav.music": "Music",
      "nav.game": "Game",
      "aria.backToTop": "Back to top",
      "page.game": "Game",
      "game.team": "Team",
      "game.browse": "Browse games",
      "game.prev": "Previous game",
      "game.next": "Next game",
      "team.academy": "Academy",
      "team.year": "Year",
      "team.birthday": "Birthday",
      "team.height": "Height",
      "party.heading": "POKÉMON",
      "party.mega": "Mega ",
      "page.anime": "Anime",
      "anime.summary": "Summary",
      "anime.comingSoon": "Preview video coming soon",
      "anime.playPreview": "Play preview",
      "anime.browse": "Browse anime",
      "anime.prev": "Previous anime",
      "anime.next": "Next anime",
      "page.character": "Character",
      "char.name": "Name",
      "char.cv": "CV",
      "char.age": "Age",
      "char.height": "Height",
      "char.birthday": "Birthday",
      "char.voice": "Voice",
      "char.playVoice": " voice line",
      "page.music": "Music",
      "music.chooseArtist": "Choose an artist",
      "music.allSongs": "All songs",
      "music.sortBy": "Sort by",
      "music.sortCustom": "Custom order",
      "music.sortTitle": "Title",
      "music.sortArtist": "Artist",
      "music.colTitle": "Title",
      "music.hint": "Tip: switch to <strong>Custom order</strong> to drag songs around.",
      "music.noSongs": "No songs yet.",
      "music.soon": "Soon",
      "music.modeSong": "Song",
      "music.modeVideo": "Video",
      "music.play": "Play",
      "music.pause": "Pause",
      "music.prev": "Previous song",
      "music.next": "Next song",
      "music.shuffle": "Toggle shuffle",
      "music.repeat": "Toggle repeat",
      "music.seek": "Seek",
      "music.fullscreen": "Full screen",
      "music.exitFullscreen": "Exit full screen",
      "music.backToPlayer": "Back to the player",
      "music.lyrics": "Lyrics",
    },
  };

  function stored() {
    try {
      return localStorage.getItem(STORE_KEY);
    } catch {
      return null;
    }
  }

  let lang = stored() === "ja" ? "ja" : "en";

  const I18N = {
    get lang() {
      return lang;
    },
    t(key) {
      const v = STRINGS[lang][key];
      return v != null ? v : STRINGS.en[key] != null ? STRINGS.en[key] : key;
    },
    // item[key], or its Japanese version (item.ja[key]) when JP is on
    field(item, key) {
      if (!item) return "";
      if (lang === "ja" && item.ja && item.ja[key] != null) return item.ja[key];
      return item[key];
    },
    set(next) {
      next = next === "ja" ? "ja" : "en";
      if (next === lang) return;
      lang = next;
      try {
        localStorage.setItem(STORE_KEY, lang);
      } catch {}
      applyStatic();
      document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
    },
  };
  window.I18N = I18N;

  // The string for key in the current language; in English without an
  // English entry, the element's original (remembered) value
  function textFor(key, original) {
    if (lang === "ja" && STRINGS.ja[key] != null) return STRINGS.ja[key];
    return STRINGS.en[key] != null ? STRINGS.en[key] : original;
  }

  // Applies the right language to every element marked with attr, keeping
  // its original value in data-i18n-orig-<what> the first time
  function swap(attr, what, read, write) {
    document.querySelectorAll("[" + attr + "]").forEach((el) => {
      const store = "i18nOrig" + what;
      if (!(store in el.dataset)) el.dataset[store] = read(el);
      write(el, textFor(el.getAttribute(attr), el.dataset[store]));
    });
  }

  function applyStatic() {
    document.documentElement.lang = lang;
    swap(
      "data-i18n",
      "Text",
      (el) => el.textContent,
      (el, v) => {
        el.textContent = v;
      },
    );
    swap(
      "data-i18n-html",
      "Html",
      (el) => el.innerHTML,
      (el, v) => {
        el.innerHTML = v;
      },
    );
    swap(
      "data-i18n-aria",
      "Aria",
      (el) => el.getAttribute("aria-label") || "",
      (el, v) => el.setAttribute("aria-label", v),
    );
    swap(
      "data-i18n-alt",
      "Alt",
      (el) => el.getAttribute("alt") || "",
      (el, v) => el.setAttribute("alt", v),
    );
    document.querySelectorAll(".lang-option").forEach((opt) => {
      const on = opt.dataset.lang === lang;
      opt.classList.toggle("active", on);
      opt.setAttribute("aria-pressed", String(on));
    });
  }

  // The header's "EN | JP" spans become working buttons
  function initToggle() {
    const toggle = document.querySelector(".lang-toggle");
    if (!toggle) return;
    toggle.removeAttribute("aria-hidden");
    toggle.setAttribute("role", "group");
    toggle.setAttribute("aria-label", "Language / 言語");
    toggle.querySelectorAll(".lang-option").forEach((opt) => {
      opt.dataset.lang = opt.textContent.trim() === "JP" ? "ja" : "en";
      opt.setAttribute("role", "button");
      opt.tabIndex = 0;
      opt.addEventListener("click", () => I18N.set(opt.dataset.lang));
      opt.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          I18N.set(opt.dataset.lang);
        }
      });
    });
  }

  initToggle();
  applyStatic();
})();
