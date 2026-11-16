// Song list for music.html. The order here is the default "Custom order"
// (dragging songs around on the page saves your own order in this browser
// on top of it). Add a song by adding one object here.
//
// id        - unique, lowercase, no spaces.
// title     - shown in the list.
// titleKana - OPTIONAL reading in hiragana/katakana, used only for sorting
//             so kanji titles land where they're pronounced (打上花火 →
//             うちあげはなび) instead of by kanji code order.
// artist    - an id from js/artists.js (which icon it's filed under).
//             Leave it out for a singer with no icon: the song then only
//             shows under "All songs".
// ja          - OPTIONAL Japanese artistLabel (+ artistKana reading for
//               sorting), shown when JP is selected (js/i18n.js). Only the
//               voice-actor singers have one; titles never change.
// artistLabel - OPTIONAL text shown as the artist instead, e.g. for a duet
//             ("Rie Takahashi, Aki Toyosaki"). Required when there's no
//             `artist`.
// series    - OPTIONAL show/franchise shown after the artist, e.g.
//             "Re:ZERO Music" → "nonoc · Re:ZERO Music".
// cover     - square cover image. Leave "" to use the artist's photo.
// src       - the song file. .mp3 = audio only. .mp4 = plays the same way,
//             but also unlocks the Song/Video switch under the cover.
//             Leave "" for a song you haven't got yet (shown greyed out).
//             Spaces are written %20 and "&" as %26 in paths.
// lyrics    - OPTIONAL synced lyrics: true = looked up online (LRCLIB) by
//             title + artist; or a path to your own .lrc file. Adds the
//             歌詞 ON/OFF switch under the player. lyricsOffset (seconds)
//             shifts them all if they run early/late for this file.
// lyricsSearch - OPTIONAL { title, artist } to search LRCLIB with instead
//             of the song's own (artist: "" = by title only).
// lyricsId  - OPTIONAL LRCLIB entry id to use instead of searching, for
//             when the search picks a bad version (e.g. one with romaji).
// lyricsEdits - OPTIONAL [{ find, replace }] to fix small mistakes in
//             the downloaded lyrics, e.g. a missing particle.
// duration, thumb - filled in automatically: after adding or changing
//             songs, run `python tools/song-meta.py` (length in seconds,
//             and a small cover thumbnail for the list/mini player).
const SONGS = [
  {
    id: "styx-helix",
    title: "STYX HELIX",
    artist: "myth-and-roid",
    series: "Re:ZERO Music",
    cover: "assets/music/cover/myth%26roid.webp",
    thumb: "assets/music/cover/thumbs/styx-helix.webp",
    src: "assets/music/mp4/STYX%20HELIX.mp4",
    lyrics: true,
    lyricsOffset: -0.5, // LRCLIB's timing runs ~0.5s late for this video's audio
    duration: 285.33,
  },
  {
    id: "paradisus-paradoxum",
    title: "Paradisus-Paradoxum",
    artist: "myth-and-roid",
    series: "Re:ZERO Music",
    cover: "assets/music/cover/myth%26roid.webp",
    thumb: "assets/music/cover/thumbs/paradisus-paradoxum.webp",
    src: "assets/music/mp3/Paradisus-Paradoxum.mp3",
    duration: 230.0,
  },
  {
    id: "nox-lux",
    title: "NOX LUX",
    artist: "myth-and-roid",
    series: "Re:ZERO Music",
    cover: "assets/music/cover/noxlux.jpg",
    thumb: "assets/music/cover/thumbs/nox-lux.webp",
    src: "assets/music/mp4/NOX%20LUX.mp4",
    duration: 270.9,
  },
  {
    id: "ender-ember",
    title: "Ender Ember",
    artist: "myth-and-roid",
    artistLabel: "MYTH & ROID feat. TK from 凛として時雨",
    series: "Re:ZERO Music",
    cover: "assets/music/cover/Ender_Ember_Cover.webp",
    thumb: "assets/music/cover/thumbs/ender-ember.webp",
    src: "assets/music/mp4/Ender%20Ember.mp4",
    duration: 239.74,
  },
  {
    id: "believe-in-you",
    title: "Believe in you",
    artist: "nonoc",
    series: "Re:ZERO Music",
    cover: "assets/music/cover/believe%20in%20you.webp",
    thumb: "assets/music/cover/thumbs/believe-in-you.webp",
    src: "assets/music/mp3/Believe%20in%20you.mp3",
    lyrics: true,
    duration: 278.14,
  },
  {
    id: "memento",
    title: "Memento",
    artist: "nonoc",
    series: "Re:ZERO Music",
    cover: "assets/music/cover/nonoc.webp",
    thumb: "assets/music/cover/thumbs/memento.webp",
    src: "assets/music/mp4/Memento.mp4",
    lyrics: true,
    duration: 301.55,
  },
  {
    id: "white-white-snow",
    title: "White White Snow",
    artist: "nonoc",
    series: "Re:ZERO Music",
    cover: "assets/music/cover/whitewhitesnow.webp",
    thumb: "assets/music/cover/thumbs/white-white-snow.webp",
    src: "assets/music/mp3/White%20White%20Snow.mp3",
    lyrics: true,
    duration: 232.53,
  },
  {
    id: "what-you-dont-know",
    title: "あなたの知らないこと",
    titleKana: "あなたのしらないこと",
    artistLabel: "Rie Murakawa",
    ja: { artistLabel: "村川梨衣", artistKana: "むらかわりえ" },
    series: "Re:ZERO Music",
    cover:
      "assets/music/cover/TV-Anime-Re-Zero-kara-Hajimeru-Isekai-Seikatsu-Character-Song-Album.webp",
    thumb: "assets/music/cover/thumbs/what-you-dont-know.webp",
    src: "assets/music/mp3/他の/web/What%20you%20don't%20know.mp3",
    duration: 308.04,
  },
  {
    id: "stay-alive",
    title: "Stay Alive ~REGAIN~",
    artist: "rie-takahashi",
    series: "Re:ZERO Music",
    cover: "assets/music/cover/Stay_Alive_Cover.opt.webp",
    thumb: "assets/music/cover/thumbs/stay-alive.webp",
    src: "assets/music/mp4/Stay%20Alive%20REGAIN.mp4",
    duration: 272.02,
  },
  {
    id: "stay-alive-original",
    title: "Stay Alive",
    artist: "rie-takahashi",
    series: "Re:ZERO Music",
    cover: "assets/music/cover/Stay_Alive_Cover.opt.webp",
    thumb: "assets/music/cover/thumbs/stay-alive-original.webp",
    src: "assets/audio/Music/ReZEROMusic/高橋李依/Stay%20Alive.mp3",
    duration: 263.17,
  },
  {
    id: "jump-in",
    title: "JUMP IN",
    artist: "rie-takahashi",
    artistLabel: "Rie Takahashi, Aki Toyosaki",
    ja: { artistLabel: "高橋李依、豊崎愛生", artistKana: "たかはしりえ" },
    cover: "assets/music/cover/JUMP_IN_Cover.webp",
    thumb: "assets/music/cover/thumbs/jump-in.webp",
    src: "assets/music/mp3/JUMP%20IN%20(normalized).mp3",
    duration: 194.13,
  },
  {
    id: "idol",
    title: "アイドル",
    artist: "rie-takahashi",
    cover: "assets/music/cover/idol.webp",
    thumb: "assets/music/cover/thumbs/idol.webp",
    src: "assets/music/mp4/Idol.mp4",
    duration: 213.21,
    lyrics: true,
    // A cover of YOASOBI's song, so LRCLIB lists it under YOASOBI
    lyricsSearch: { title: "アイドル", artist: "YOASOBI" },
    lyricsId: 18001988, // the closest-length match (2116394) mixes in romaji lines
  },
  {
    id: "uni-verse",
    title: "Uni-Verse",
    artistLabel: "Masayoshi Oishi",
    ja: { artistLabel: "オーイシマサヨシ", artistKana: "おーいしまさよし" },
    cover: "assets/music/cover/uni-verse.opt.webp",
    thumb: "assets/music/cover/thumbs/uni-verse.webp",
    src: "assets/music/mp4/uni-verse.mp4",
    duration: 265.01,
  },
  {
    id: "uchiage-hanabi",
    title: "打上花火",
    titleKana: "うちあげはなび",
    artist: "daoko",
    cover: "assets/music/cover/daoko.jpg",
    thumb: "assets/music/cover/thumbs/uchiage-hanabi.webp",
    src: "assets/music/mp4/Uchiage%20Hanabi.mp4",
    duration: 283.03,
  },
  {
    id: "haikei-goodbye-sayonara",
    title: "拝啓グッバイさようなら",
    titleKana: "はいけいぐっばいさようなら",
    artist: "daoko",
    cover: "assets/music/cover/daoko.jpg",
    thumb: "assets/music/cover/thumbs/haikei-goodbye-sayonara.webp",
    src: "assets/music/mp3/Haikei%20Goodbye%20Sayonara.mp3",
    duration: 222.0,
  },
  {
    id: "cinderella-step",
    title: "Cinderella Step",
    artist: "daoko",
    cover: "assets/music/cover/daoko.jpg",
    thumb: "assets/music/cover/thumbs/cinderella-step.webp",
    src: "assets/music/mp3/Cinderella%20Step.mp3",
    duration: 239.1,
  },
  {
    id: "beautiful-world",
    title: "Beautiful World",
    artistLabel: "XX:me",
    cover: "assets/music/cover/ダリフラカーバー.jpg",
    thumb: "assets/music/cover/thumbs/beautiful-world.webp",
    src: "assets/music/mp3/他の/web/Beautiful%20World.mp3",
    duration: 258.96,
  },
  {
    id: "escape",
    title: "Escape",
    artistLabel: "XX:me",
    cover: "assets/music/cover/ダリフラカーバー.jpg",
    thumb: "assets/music/cover/thumbs/escape.webp",
    src: "assets/music/mp3/他の/web/Escape.mp3",
    duration: 221.56,
  },
  {
    id: "hitori",
    title: "ひとり",
    artistLabel: "XX:me",
    cover: "assets/music/cover/ダリフラカーバー.jpg",
    thumb: "assets/music/cover/thumbs/hitori.webp",
    src: "assets/music/mp3/他の/web/ひとり.mp3",
    duration: 239.5,
  },
  {
    id: "darling",
    title: "ダーリン",
    artistLabel: "XX:me",
    cover: "assets/music/cover/ダリフラカーバー.jpg",
    thumb: "assets/music/cover/thumbs/darling.webp",
    src: "assets/music/mp3/他の/web/ダーリン.mp3",
    duration: 249.5,
  },
  {
    id: "torikago",
    title: "トリカゴ",
    artistLabel: "XX:me",
    cover: "assets/music/cover/ダリフラカーバー.jpg",
    thumb: "assets/music/cover/thumbs/torikago.webp",
    src: "assets/music/mp3/他の/web/トリカゴ.mp3",
    lyrics: true,
    lyricsEdits: [
      { find: "才能(チカラ)", replace: "チカラ" },
      { find: "才能チカラ", replace: "チカラ" },
    ], // sung as just チカラ
    duration: 219.59,
  },
  {
    id: "manatsu-no-setsuna",
    title: "真夏のセツナ",
    titleKana: "まなつのせつな",
    artistLabel: "XX:me",
    cover: "assets/music/cover/ダリフラカーバー.jpg",
    thumb: "assets/music/cover/thumbs/manatsu-no-setsuna.webp",
    src: "assets/music/mp3/他の/web/真夏のセツナ.mp3",
    duration: 222.05,
  },
  {
    id: "prism-communicate",
    title: "ぷりずむコミュニケート",
    artistLabel: "Hisako Kanemoto, Nao Toyama, Risa Taneda",
    ja: { artistLabel: "金元寿子、東山奈央、種田梨沙", artistKana: "かねもとひさこ" },
    cover: "assets/music/cover/ぷりコミ.webp",
    thumb: "assets/music/cover/thumbs/prism-communicate.webp",
    src: "assets/music/mp3/他の/web/ぷりずむコミュニケート.mp3",
    lyrics: true,
    lyricsSearch: { title: "ぷりずむコミュニケート", artist: "" },
    lyricsEdits: [{ find: "魔法かける", replace: "魔法をかける" }], // LRCLIB dropped the を
    duration: 262.2,
  },
  {
    id: "prism-communicate-tuka",
    title: "ぷりずむコミュニケート (テュカ ソロver.)",
    artistLabel: "Hisako Kanemoto",
    ja: { artistLabel: "金元寿子", artistKana: "かねもとひさこ" },
    cover: "assets/music/cover/ぷりコミテュカ.webp",
    thumb: "assets/music/cover/thumbs/prism-communicate-tuka.webp",
    src: "assets/music/mp3/他の/web/ぷりずむコミュニケート%20(テュカ%20ソロver.).mp3",
    lyrics: true,
    lyricsSearch: { title: "ぷりずむコミュニケート", artist: "" },
    lyricsEdits: [{ find: "魔法かける", replace: "魔法をかける" }], // LRCLIB dropped the を
    duration: 262.1,
  },
  {
    id: "prism-communicate-lelei",
    title: "ぷりずむコミュニケート (レレイ ソロver.)",
    artistLabel: "Nao Toyama",
    ja: { artistLabel: "東山奈央", artistKana: "とうやまなお" },
    cover: "assets/music/cover/ぷりコミレレイ.jpg",
    thumb: "assets/music/cover/thumbs/prism-communicate-lelei.webp",
    src: "assets/music/mp3/他の/web/ぷりずむコミュニケート%20(レレイ%20ソロver.).mp3",
    lyrics: true,
    lyricsSearch: { title: "ぷりずむコミュニケート", artist: "" },
    lyricsEdits: [{ find: "魔法かける", replace: "魔法をかける" }], // LRCLIB dropped the を
    duration: 262.2,
  },
  {
    id: "prism-communicate-rory",
    title: "ぷりずむコミュニケート (ロゥリィ ソロver.)",
    artistLabel: "Risa Taneda",
    ja: { artistLabel: "種田梨沙", artistKana: "たねだりさ" },
    cover: "assets/music/cover/ぷりコミロゥリィ_fixed.jpg",
    thumb: "assets/music/cover/thumbs/prism-communicate-rory.webp",
    src: "assets/music/mp3/他の/web/ぷりずむコミュニケート%20(ロゥリィ%20ソロver.).mp3",
    lyrics: true,
    lyricsSearch: { title: "ぷりずむコミュニケート", artist: "" },
    lyricsEdits: [{ find: "魔法かける", replace: "魔法をかける" }], // LRCLIB dropped the を
    duration: 262.1,
  },
];
