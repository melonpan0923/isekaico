// Character roster for character.html. Add a new character by adding one
// object here (and uploading its image under assets/images/) — it will
// automatically appear in the icon row and become reachable at
// character.html?id=<id>. No other file needs to change.
//
// icon  - small headshot used in the circle selector row.
// image - the picture shown in the big detail panel. Defaults to `icon`
//         when omitted.
// cutout - true for a transparent full-body PNG: the detail panel drops the
//          card frame/background so the art floats directly on the page,
//          like the frieren-anime.jp character pages.
// imageAspect - width/height of the `image` file, so the cutout's box
//               matches it exactly with no letterboxing. Only needed when
//               cutout is true.
// effects - an optional list of extra transparent PNGs (props, weapons,
//           spell effects) layered on/around `image`. Each entry's
//           left/top position its center as a percentage of the media box
//           (matching the pixel position on the `image` file itself, since
//           the box is sized to imageAspect) — values past 0-100% place it
//           outside the box, e.g. beside the character rather than on them.
//           width is a percentage of the box's width, height follows
//           automatically. All entries render above the character art and
//           below the info text, same as the art itself.
// float - true adds the same slow idle bob Emilia's art has. Opt-in per
//         character since most cutout art just sits still.
// floatDuration - overrides how long one float cycle takes (default 3.2s,
//                 same as the crystal effect). Only used when float is true.
// floatAmplitude - overrides how far it moves, e.g. "-10px" (default -6px).
//                  Negative moves up. Only used when float is true.
// cv, age, height, weight, birthday - optional strings shown in the stat
//                                  grid (cv = voice actor, next to Name).
//                                  Left out (or "") shows "—". Some are left
//                                  blank below where I wasn't confident
//                                  enough in the exact figure to state it as
//                                  fact — fill those in yourself when you
//                                  have the real number.
// offsetX - nudges the art horizontally, as a percentage of its own
//           rendered width (e.g. "10%" shifts it right by 10% of its own
//           width). For lining up characters whose source file has extra
//           empty margin baked in on one side, so they don't visually jump
//           left/right compared to characters cropped tight to the art.
// offsetY - same idea as offsetX but vertical, as a percentage of the art's
//           own rendered height. Negative moves up, positive moves down
//           (same convention as floatAmplitude).
// scale - enlarges/shrinks the art around its own center, e.g. 1.4 for 40%
//         bigger, 0.8 for 20% smaller (default 1). The media box's HEIGHT
//         stays the shared clamp() value either way — scale is a purely
//         visual zoom on top of that, useful for characters whose source
//         file is a much narrower crop than the others (their rendered
//         width, and so apparent size, ends up small even at equal height).
const CHARACTERS = [
  {
    id: "emilia",
    name: "Emilia",
    icon: "assets/images/home/char/エミリア.jpg",
    image: "assets/images/chara/emilia/pic/EmiliaTransparent1.png",
    imageAspect: "1265 / 1693",
    cutout: true,
    offsetX: "17%",
    offsetY: "-3%",
    float: true,
    cv: "Rie Takahashi",
    age: "115",
    height: "164cm",
    weight: "Like a feather",
    birthday: "September 23",
    effects: [
      {
        src: "assets/images/chara/emilia/pic/Ice crystal.png",
        left: "23%",
        top: "2%",
        width: "24%",
      },
      {
        src: "assets/images/chara/emilia/pic/Ice axe.png",
        left: "112%",
        top: "33%",
        width: "75%",
      },
    ],
    bio: "A beautiful half-elf girl with silver hair and deep purple eyes—features identical to those of the \"Witch of Envy,\" who once nearly destroyed the world. Although she is kind-hearted and caring, for some reason, she refuses to openly admit it. She is accompanied by Puck, a spirit in the form of a small cat. She is one of the candidates in the Royal Selection to determine the next ruler of the Kingdom of Lugnica.",
  },
  {
    id: "zero-two",
    name: "Zero Two",
    icon: "assets/images/home/char/ゼロツー.jpg",
    image: "assets/images/chara/zerotwo/pic/zerotwo.png",
    imageAspect: "193 / 625",
    cutout: true,
    offsetX: "120%",
    offsetY: "-7%",
    scale: 1.4, 
    cv: "Haruka Tomatsu",
    age: "18",
    height: "170cm",
    weight: "53kg",
    birthday: "February 27",
    bio: "A mysterious girl with red horns. An elite Parasite known by the epithet \"Partner Killer.\"",
  },
  {
    id: "rimuru",
    name: "Rimuru",
    icon: "assets/images/home/char/リムル.jpg",
    image: "assets/images/chara/rimuru/pic/rimuru.png",
    imageAspect: "900 / 1497",
    cutout: true,
    offsetX: "26%",
    offsetY: "-9%",
    cv: "Miho Okasaki",
    age: "",
    height: "160cm",
    weight: "",
    birthday: "February 20",
    bio: "Satoru Mikami, a salaryman, was caught up in an incident and reincarnated into another world as a slime. The unique skill \"Great Sage\" he acquired upon reincarnation evolved into \"Wisdom King\"; he awakened as a True Demon Lord, serving as the leader of the Jura Tempest Federation and one of the \"Octagram\" (Eight Star Demon Lords).",
  },
  {
    id: "ram",
    name: "Ram",
    icon: "assets/images/home/char/ラム.jpg",
    image: "assets/images/chara/ram/pic/Ram1.png",
    imageAspect: "1000 / 1571",
    cutout: true,
    offsetX: "33%",
    offsetY: "-9%",
    cv: "Rie Murakawa",
    age: "19",
    height: "154cm",
    weight: "Light enough to sit on<br>someone's lap",
    birthday: "February 2",
    bio: "She is Rem's twin sister and, like Rem, works as a maid at Roswaal's mansion; however, she is inferior to her younger sister in every respect—cooking, laundry, sewing, and cleaning. Although she once possessed unparalleled power as a prodigy of the Oni clan, she lost that strength after losing her horn.",
  },
  {
    id: "frieren",
    name: "Frieren",
    icon: "assets/images/home/char/フリーレン.jpg",
    image: "assets/images/chara/frieren/pic/frieren.png",
    imageAspect: "553 / 680",
    cutout: true,
    offsetX: "13%",
    offsetY: "-3%",
    float: true,
    floatDuration: "2.5s",
    floatAmplitude: "-10px",
    cv: "Atsumi Tanezaki",
    age: "1,000+",
    height: "150cm",
    weight: "",
    birthday: "",
    bio: "An elf who has lived for over a thousand years and a mage who defeated the Demon King as part of the Hero's party. She is a magic enthusiast interested in any form of magic and possesses a slovenly, pragmatic personality. Following Himmel's death, she came to desire a deeper understanding of humans. She is currently traveling with Fern and Stark, aiming to reach Aureole, the land where souls rest.",
  },
];
