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
// ja - optional Japanese versions of name, cv, age, height, birthday and
//      bio, shown when JP is selected (js/i18n.js). The bios are the
//      official Japanese character profiles (the English ones are
//      translations of them, except Zero Two's).
// cv, age, height, birthday - optional strings shown in the stat grid
//                              (cv = voice actor, next to Name). Left out
//                              (or "") shows "—". Some are left blank below
//                              where I wasn't confident enough in the exact
//                              figure to state it as fact — fill those in
//                              yourself when you have the real number.
// voice - drives the Voice icon's click-to-cycle playback. Shape:
//   folder     - path to the character's voice-line folder.
//   sequence   - filenames played in order, one per click, before any of
//                the below kicks in.
//   randomAfter - optional. Once `sequence` is exhausted, each click plays
//                a random file from this pool (equal probability) and then
//                the cycle restarts at sequence[0] on the next click.
//   secret     - optional. Once `sequence` is exhausted, each click has a
//                `chance` (0-1) probability of playing `file`; on a miss it
//                immediately plays sequence[0] instead (that click counts
//                as consuming the first slot, so the following click plays
//                sequence[1]). Mutually exclusive with randomAfter.
//   With neither randomAfter nor secret, exhausting `sequence` just loops
//   back to sequence[0] on the next click.
// headX - where the character's face is, as a % across the `image` file
//         (measured on each picture). Phones centre the art on this point
//         instead of on the picture's box, so the face sits in the middle
//         of the screen even when a pose, a weapon or hair reaches out to
//         one side. Desktop uses offsetX/offsetY below instead.
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
    image: "assets/images/chara/emilia/pic/EmiliaTransparent1.webp",
    imageAspect: "1265 / 1693",
    headX: "54.5%",
    cutout: true,
    offsetX: "17%",
    offsetY: "-3%",
    float: true,
    cv: "Rie Takahashi",
    age: "115",
    height: "164cm",
    birthday: "September 23",
    voice: {
      folder: "assets/audio/Char/EmiliaVoiceLines",
      sequence: ["1.wav", "2.wav", "3.wav"],
      randomAfter: ["4.0.wav", "4.1.wav", "4.2.wav"],
    },
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
    bio: 'A beautiful half-elf girl with silver hair and deep purple eyes—features identical to those of the "Witch of Envy," who once nearly destroyed the world. Although she is kind-hearted and caring, for some reason, she refuses to openly admit it. She is accompanied by Puck, a spirit in the form of a small cat. She is one of the candidates in the Royal Selection to determine the next ruler of the Kingdom of Lugnica.',
    ja: {
      name: "エミリア",
      cv: "高橋李依",
      age: "115歳",
      birthday: "9月23日",
      bio: "かつて世界を滅ぼしかけた『嫉妬の魔女』と同じ、銀髪に紫紺の瞳を持つ美しいハーフエルフの少女。お人好しで面倒見の良い性格だが、当人はなぜかそれを素直に認めようとしない。小さな猫の姿をした精霊のパックをお供に連れている。ルグニカ王国の次代の王を決める王選の候補者の一人。",
    },
  },
  {
    id: "zero-two",
    name: "Zero Two",
    icon: "assets/images/home/char/ゼロツー.webp",
    image: "assets/images/chara/zerotwo/pic/zerotwo.png",
    imageAspect: "193 / 625",
    headX: "48%",
    cutout: true,
    offsetX: "120%",
    offsetY: "-7%",
    scale: 1.4,
    cv: "Haruka Tomatsu",
    age: "18",
    height: "170cm",
    birthday: "February 27",
    voice: {
      folder: "assets/audio/Char/ZeroTwoVoiceLines",
      sequence: ["1.mp3", "2.mp3", "3.mp3"],
      secret: { file: "秘密.mp3", chance: 1 / 3 },
    },
    bio: 'Zero Two is an elite Klaxosaur-human hybrid known as a Parasite, marked by her distinctive red horns and the ominous epithet "Partner Killer"—every partner she has piloted a FranXX with has died shortly after. Blunt, impulsive, and unapologetically herself, she hides a quiet longing to become fully human beneath her confident, teasing exterior. When she\'s paired with Hiro, a boy the rest of the squad has written off, the two form a bond that finally lets her mecha, Strelizia, fight at its full potential. Whether that bond can break the curse tied to her past remains the question driving her story.',
    ja: {
      name: "ゼロツー",
      cv: "戸松遥",
      age: "18歳",
      birthday: "2月27日",
      bio: "赤いツノの生えた謎の少女。「パートナー殺し」の異名を持つ、エリートパラサイト。",
    },
  },
  {
    id: "rimuru",
    name: "Rimuru",
    icon: "assets/images/home/char/リムル.webp",
    image: "assets/images/chara/rimuru/pic/rimuru1.png",
    imageAspect: "900 / 1497",
    headX: "57%",
    cutout: true,
    offsetX: "28%",
    offsetY: "-16%",
    float: true,
    floatDuration: "2.5s",
    cv: "Miho Okasaki",
    age: "",
    height: "160cm",
    birthday: "February 20",
    voice: {
      folder: "assets/audio/Char/RimuruVoiceLines",
      sequence: ["1.mp3", "2.mp3", "3.mp3"],
    },
    bio: 'Satoru Mikami, a salaryman, was caught up in an incident and reincarnated into another world as a slime. The unique skill "Great Sage" he acquired upon reincarnation evolved into "Wisdom King"; he awakened as a True Demon Lord, serving as the leader of the Jura Tempest Federation and one of the "Octagram" (Eight Star Demon Lords).',
    ja: {
      name: "リムル",
      cv: "岡咲美保",
      birthday: "2月20日",
      bio: "サラリーマン三上悟は、事件に巻き込まれ、異世界に転生してスライムに。転生時に身についたユニークスキル「大賢者」は「知慧之王」へと進化を遂げ、ジュラ・テンペスト連邦国の盟主、そして「八星魔王（オクタグラム）」の一柱として、真なる魔王へ覚醒した。",
    },
  },
  {
    id: "ram",
    name: "Ram",
    icon: "assets/images/home/char/ラム.webp",
    image: "assets/images/chara/ram/pic/Ram1.png",
    imageAspect: "1000 / 1571",
    headX: "47.5%",
    cutout: true,
    offsetX: "33%",
    offsetY: "-9%",
    cv: "Rie Murakawa",
    age: "19",
    height: "154cm",
    birthday: "February 2",
    voice: {
      folder: "assets/audio/Char/RamVoiceLines",
      sequence: ["1.wav", "2.wav", "3.wav"],
      secret: { file: "秘密.wav", chance: 1 / 3 },
    },
    bio: "She is Rem's twin sister and, like Rem, works as a maid at Roswaal's mansion; however, she is inferior to her younger sister in every respect—cooking, laundry, sewing, and cleaning. Although she once possessed unparalleled power as a prodigy of the Oni clan, she lost that strength after losing her horn.",
    ja: {
      name: "ラム",
      cv: "村川梨衣",
      age: "19歳",
      birthday: "2月2日",
      bio: "レムの双子の姉で、レムと同じくロズワールの屋敷でメイドを務めているが、炊事・洗濯・裁縫・掃除、全てにおいて妹に劣るステータスの持ち主。かつては鬼族の神童として比類なき力を有していたが、角を失った現在、その力は失われている。",
    },
  },
  {
    id: "frieren",
    name: "Frieren",
    icon: "assets/images/home/char/フリーレン.jpg",
    image: "assets/images/chara/frieren/pic/frieren.png",
    imageAspect: "553 / 680",
    headX: "51%",
    cutout: true,
    offsetX: "13%",
    offsetY: "-3%",
    float: true,
    floatDuration: "2.5s",
    floatAmplitude: "-10px",
    cv: "Atsumi Tanezaki",
    age: "1,000+",
    height: "150cm",
    birthday: "",
    voice: {
      folder: "assets/audio/Char/FrierenVoiceLines",
      sequence: ["1.mp3", "2.mp3", "3.mp3"],
    },
    bio: "An elf who has lived for over a thousand years and a mage who defeated the Demon King as part of the Hero's party. She is a magic enthusiast interested in any form of magic and possesses a slovenly, pragmatic personality. Following Himmel's death, she came to desire a deeper understanding of humans. She is currently traveling with Fern and Stark, aiming to reach Aureole, the land where souls rest.",
    ja: {
      name: "フリーレン",
      cv: "種﨑敦美",
      age: "1000歳以上",
      bio: "千年以上生きるエルフで、勇者パーティーとして魔王を倒した魔法使い。魔法であればどんなものでも興味を持つ魔法オタク。性格はずぼらでドライ。ヒンメルの死をきっかけに「人間を知りたい」と思うようになる。現在は魂の眠る地＜オレオール＞を目指して、フェルンとシュタルクと共に旅をしている。",
    },
  },
];
