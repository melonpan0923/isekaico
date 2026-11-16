// Artist roster for music.html. Add an artist by adding one object here —
// it becomes reachable at music.html?id=<id> and appears in the icon row.
//
// name     - shown under the round icon and as each song's artist.
// nameKana - OPTIONAL reading (hiragana/katakana) used when sorting songs
//            by artist, for artists written in kanji.
// ja       - OPTIONAL Japanese name/nameKana, shown when JP is selected
//            (js/i18n.js) — only for voice-actor singers.
// icon     - square-ish photo cropped to a circle (same images as the Home
//            page's Music row, assets/images/home/music/). "&" is written
//            as %26 since it's part of a URL.
const ARTISTS = [
  {
    id: "nonoc",
    name: "nonoc",
    icon: "assets/images/home/music/nonoc.webp",
  },
  {
    id: "myth-and-roid",
    name: "MYTH & ROID",
    icon: "assets/images/home/music/myth%26roid.webp",
  },
  {
    id: "rie-takahashi",
    name: "Rie Takahashi",
    ja: { name: "高橋李依", nameKana: "たかはしりえ" },
    icon: "assets/images/home/music/rie.webp",
  },
  {
    id: "daoko",
    name: "Daoko",
    icon: "assets/images/home/music/daoko.jpg",
  },
];
