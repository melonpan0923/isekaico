// Game roster for games.html. Add a new game by adding one object here
// (and uploading its image under assets/images/game/<folder>/) — it becomes
// reachable at games.html?id=<id> and automatically appears in the bottom
// browse drawer. No other file needs to change.
//
// title   - shown as the heading inside the white panel.
// ja      - optional Japanese versions of the text fields (title, summary,
//           and the same on team/party/roster entries), shown when JP is
//           selected (js/i18n.js); anything missing stays in English.
// image   - the 16:9 (1920x1080) key art shown under the title. Folder
//           names contain spaces, so they're written URL-encoded (%20).
// thumb   - the preview shown in the bottom browse drawer — the same
//           images as the Home page's Game row (assets/images/home/games/),
//           matching how js/animes.js picks its drawer thumbs.
// summary - a few sentences shown right below the image.
// team    - optional. Favourite units shown in a "Team" block under the
//           summary (see js/game-page.js). Each unit needs icon (the
//           404x456 portrait), full (the transparent full-body art) and
//           its profile facts. Icons sit in a 4-column grid; `col` pins a
//           unit to a specific column so a short second row can be centred.
//           school is the short name shown at the top of the team panel;
//           logo is that school's emblem (a copy trimmed of the original's
//           empty edges, so all three line up), drawn as a faint grey
//           watermark behind the panel's content.
//           bodyX is where the body's centre sits across the full-body art
//           (% of its width): the art is shifted so that point lands at 75%
//           of the panel's width, even when the character isn't centred in
//           their own image.
// party   - optional, the Pokémon version of `team`: a Switch-style party
//           screen (see js/game-page.js). Six rows on the left use `icon`
//           (the 128x128 PNG), the right side shows the animated `sprite`
//           (GIF/WebP pixel art, scaled up by whole pixels so it stays
//           crisp). no = National Dex number, sex = "m" / "f" / "n"
//           (genderless), hp = the level-`lv` HP stat, types use the colours
//           in PARTY_TYPE_COLORS (js/game-page.js), stone = the held Mega
//           Stone, shown with stoneIcon (the official item art, cropped
//           to the stone).
//           bodyX (optional) is where the body's centre sits across the
//           animated sprite (% of its width, default 50), so a lopsided
//           sprite still stands centred. (Row icons need nothing like
//           this: their feet are found automatically, see js/game-page.js.)
// roster  - optional, the Genshin version of `team`: a column of character
//           icons (the 256x256 `icon`) down the left side of a panel whose
//           whole background is the selected character's `namecard` (the
//           840x400 namecard art). Clicking an icon crossfades the panel to
//           that character's namecard (see js/game-page.js). element is
//           "Pyro" / "Hydro" / "Cryo" etc., shown as a badge on the icon
//           (the icons live in assets/images/game/genshin impact/elements/,
//           see ROSTER_ELEMENTS in js/game-page.js). profile is optional:
//           the character's transparent profile art, cut off flat at the
//           bottom; it slides in from the right into the panel's
//           bottom-right corner (its bottom edge on the panel's bottom
//           edge) while they're selected.
//           intro is the official character blurb (genshin.hoyoverse.com),
//           shown under the character's name: a list of paragraphs. item
//           (optional) is the character's card item, shown beside the name.
//           profileFit is optional, for art that isn't already cut off at
//           the bottom (e.g. a full-figure portrait): { height, right,
//           bottom } as CSS lengths — height in % of the panel's height
//           (default 80%), right/bottom negative to push the art past the
//           panel's right/bottom edges so it's cropped there like the
//           profile art is.
const GAMES = [
  {
    id: "blue-archive",
    title: "Blue Archive",
    image: "assets/images/game/blue%20archive/BlueArchive.webp",
    thumb: "assets/images/home/games/BlueArchive.webp",
    summary:
      "Embark on an adventure with the girls of this epic anime fantasy RPG, Blue Archive, and dive into its world of strategic combat, brought to life by stunning animations. Your journey through Kivotos will be one filled with victory and loss, love and heartbreak, all alongside an unforgettable, touching story. Build strong, deep relationships and get to know each student's unique story while leading your squad. So let's go, Sensei!",
    ja: {
      title: "ブルーアーカイブ",
      summary:
        "――何気ない日常で、ほんの少しの奇跡を見つける物語。ここは学園都市キヴォトス。数千の学園からなる超巨大学園都市では、日々トラブルが絶えない。この問題に対応すべく、連邦生徒会長によって連邦捜査部【シャーレ】が設立された。この物語は【シャーレ】の顧問となる先生とそれに協力する生徒たちと学園都市での日常を描いた物語である。",
    },
    team: [
      {
        name: "Karin",
        bodyX: 45,
        school: "Millennium",
        logo: "assets/images/game/blue%20archive/logos/Millennium_Icon_trim.png",
        icon: "assets/images/game/blue%20archive/Karin_%28Bunny_Girl%29.webp",
        full: "assets/images/game/blue%20archive/Karin_(Bunny_Girl)_00.png",
        academy: "Millennium Science School",
        year: "2nd Year",
        birthday: "February 2nd",
        height: "5'7\"",
        ja: {
          name: "カリン",
          school: "ミレニアム",
          academy: "ミレニアムサイエンススクール",
          year: "2年",
          birthday: "2月2日",
          height: "170cm",
        },
      },
      {
        name: "Asuna",
        bodyX: 55,
        school: "Millennium",
        logo: "assets/images/game/blue%20archive/logos/Millennium_Icon_trim.png",
        icon: "assets/images/game/blue%20archive/Asuna_%28Bunny_Girl%29.webp",
        full: "assets/images/game/blue%20archive/Asuna_(Bunny_Girl)_00.png",
        academy: "Millennium Science School",
        year: "3rd Year",
        birthday: "March 24th",
        height: "5'6\"",
        ja: {
          name: "アスナ",
          school: "ミレニアム",
          academy: "ミレニアムサイエンススクール",
          year: "3年",
          birthday: "3月24日",
          height: "167cm",
        },
      },
      {
        name: "Neru",
        bodyX: 66,
        school: "Millennium",
        logo: "assets/images/game/blue%20archive/logos/Millennium_Icon_trim.png",
        icon: "assets/images/game/blue%20archive/Neru_%28Bunny_Girl%29.webp",
        full: "assets/images/game/blue%20archive/Neru_(Bunny_Girl)_00.png",
        academy: "Millennium Science School",
        year: "3rd Year",
        birthday: "August 17th",
        height: "4'9\"",
        ja: {
          name: "ネル",
          school: "ミレニアム",
          academy: "ミレニアムサイエンススクール",
          year: "3年",
          birthday: "8月17日",
          height: "146cm",
        },
      },
      {
        name: "Hoshino",
        bodyX: 50,
        school: "Abydos",
        logo: "assets/images/game/blue%20archive/logos/Abydos_Icon_trim.png",
        icon: "assets/images/game/blue%20archive/Hoshino_%28Swimsuit%29.webp",
        full: "assets/images/game/blue%20archive/Hoshino_(Swimsuit)_diorama_00.png",
        academy: "Abydos High School",
        year: "3rd Year",
        birthday: "January 2nd",
        height: "4'9\"",
        ja: {
          name: "ホシノ",
          school: "アビドス",
          academy: "アビドス高等学校",
          year: "3年",
          birthday: "1月2日",
          height: "145cm",
        },
      },
      {
        name: "Koyuki",
        bodyX: 52,
        school: "Millennium",
        logo: "assets/images/game/blue%20archive/logos/Millennium_Icon_trim.png",
        icon: "assets/images/game/blue%20archive/Koyuki_%28Pajama%29.webp",
        full: "assets/images/game/blue%20archive/Koyuki_(Pajama)_00.png",
        academy: "Millennium Science School",
        year: "1st Year",
        birthday: "February 14th",
        height: "4'11\"",
        col: 2,
        ja: {
          name: "コユキ",
          school: "ミレニアム",
          academy: "ミレニアムサイエンススクール",
          year: "1年",
          birthday: "2月14日",
          height: "149cm",
        },
      },
      {
        name: "Miyu",
        bodyX: 64,
        school: "SRT",
        logo: "assets/images/game/blue%20archive/logos/SRT_Icon_trim.png",
        icon: "assets/images/game/blue%20archive/Miyu_%28Swimsuit%29.webp",
        full: "assets/images/game/blue%20archive/Miyu_(Swimsuit)_00.png",
        academy: "SRT Special Academy",
        year: "1st Year",
        birthday: "July 12th",
        height: "4'11\"",
        col: 3,
        ja: {
          name: "ミユ",
          school: "SRT",
          academy: "SRT特殊学園",
          year: "1年",
          birthday: "7月12日",
          height: "149cm",
        },
      },
    ],
  },
  {
    id: "nier-automata",
    title: "NieR:Automata",
    image: "assets/images/game/nier%20automata/NierAutomata.webp",
    thumb: "assets/images/home/games/NierAutomata.webp",
    summary:
      "Earth has been overrun by machine lifeforms sent by alien invaders, driving humanity to take refuge on the Moon. The android 2B of the YoRHa unit is sent to the surface alongside 9S to fight the machines — but as they cross paths with machines that seem to think, feel and even dream, the line between what is alive and what is not begins to blur.",
    ja: {
      title: "ニーア オートマタ",
      summary:
        "これは呪いか。それとも罰か。舞台は、宇宙人が繰り出す「機械生命体」の圧倒的戦力を前に、人類が月へと敗走している遥か未来。プレイヤーは、新たに組織されたアンドロイド部隊「ヨルハ」所属の「2B」となり、地球奪還のための熾烈な戦いに身を投じることになります。",
    },
  },
  {
    id: "stellar-blade",
    title: "Stellar Blade",
    image: "assets/images/game/stellar%20blade/stellar%20blade.webp",
    thumb: "assets/images/home/games/StellarBlade.webp",
    summary:
      "Humanity has been driven from a ruined Earth by the monstrous Naytiba. EVE, a soldier of the 7th Airborne Squad, descends to reclaim the planet and, after her squad is wiped out, continues on alone. Joined by new allies in the last human city of Xion, she fights through deadly Naytiba while uncovering the truth behind humanity's fall.",
    ja: {
      title: "Stellar Blade",
      summary:
        "地球は未知の凶悪なクリーチャーに占領され、地上は荒廃し、残された僅かな人類は宇宙コロニーへと押しやられている。敵対勢力ネイティブによって壊滅した地球を取り戻し、人類を救う使命を果たすため、コロニーの部隊に所属するイヴは、荒れ果てた地上へと降り立つ。彼女は立ちはだかるネイティブを駆逐し、人類の文明の跡を巡る。そして隠された真実のピースをつなぎ合わせ、この任務が一筋縄ではいかないことに気づく。その行く手には、幾重もの困難が待ち受けていた……。",
    },
  },
  {
    id: "genshin-impact",
    title: "Genshin Impact",
    image: "assets/images/game/genshin%20impact/GenshinImpact1.webp",
    thumb: "assets/images/home/games/GenshinImpact1.webp",
    summary:
      "Separated from their twin by an unknown god, a traveler from another world wakes up in Teyvat — a land where seven nations each worship one of the seven elemental Archons. Together with their guide Paimon, the Traveler sets out across mountains, cities and ruins in search of their lost sibling and the answers the gods have kept hidden.",
    ja: {
      title: "原神",
      summary:
        "無数の生命が集まり繁栄する広大な地「テイワット」、天地万象が集いし大陸。ここは七神に統治された、七つの元素が絡み合う世界……見知らぬ空の下、旅人は砂浜に立っていた。あなたは旅をする双子の片割れ、外の世界から漂流をしてきた者。見知らぬ神に唯一の血縁者を奪われたあなたは、自身もその神に封印され、眠りに落ちていた。再び目を覚ました時、天地の情景は一変していた……",
    },
    roster: [
      {
        name: "Hu Tao",
        intro: [
          "Hu Tao is the 77th Director of the Wangsheng Funeral Parlor, a person vital to managing Liyue's funerary affairs.",
          "She does her utmost to flawlessly carry out a person's last rites and preserve the world's balance of yin and yang.",
          'Aside from this, she is also a talented poet whose many "masterpieces" have passed around Liyue\'s populace by word of mouth.',
        ],
        element: "Pyro",
        item: "assets/images/game/genshin%20impact/hutao/Hu_Tao_Item.webp",
        icon: "assets/images/game/genshin%20impact/hutao/Hu_Tao_Icon.webp",
        namecard:
          "assets/images/game/genshin%20impact/hutao/Namecard_Background_Hu_Tao_Spirit_Soother.webp",
        profile: "assets/images/game/genshin%20impact/hutao/Hu_Tao_Profile.webp",
        ja: {
          name: "胡桃",
          intro: [
            "胡桃——「往生堂」七十七代目堂主であり、璃月の葬儀を取り仕切る重要人物。",
            "心を尽くし、人のため送別の儀式を執り行い、陰と陽の秩序を維持する。",
            "また彼女は奇妙な詩人としても名を馳せている。その詩の多くが璃月の人々に歌われ、「傑作」と名高い。",
          ],
        },
      },
      {
        name: "Furina",
        intro: [
          'The "Regina of All Waters, Kindreds, Peoples and Laws" is deeply loved by her people.',
          'She follows each and every trial held at the Opera Epiclese with an inextinguishable passion, and is always acutely aware of how the "audience" sees things.',
        ],
        element: "Hydro",
        item: "assets/images/game/genshin%20impact/furina/Furina_Item.webp",
        icon: "assets/images/game/genshin%20impact/furina/Furina_Icon.webp",
        namecard:
          "assets/images/game/genshin%20impact/furina/Namecard_Background_Furina_Banquet.opt.webp",
        profile: "assets/images/game/genshin%20impact/furina/Furina_Profile.webp?v=2",
        profileFit: { height: "82.1%" },
        ja: {
          name: "フリーナ",
          intro: [
            "「あらゆる水、あらゆる土地、あらゆる民と法律の女王」。民に深く愛されている。",
            "エピクレシス歌劇場で上演されるあらゆる審判に熱中し、いつも「観衆」の視線を気にしている。",
          ],
        },
      },
      {
        name: "Columbina",
        intro: [
          "Kuutar, the Moon Goddess of Nod-Krai, and formerly The Damselette, Third of the Fatui Harbingers. Still, her friends all call her Columbina Hyposelenia, and she prefers it that way.",
        ],
        element: "Hydro",
        item: "assets/images/game/genshin%20impact/columbina/Columbina_Item.webp",
        icon: "assets/images/game/genshin%20impact/columbina/Columbina_Icon.webp",
        namecard:
          "assets/images/game/genshin%20impact/columbina/Namecard_Background_Columbina_Someday.webp",
        profile: "assets/images/game/genshin%20impact/columbina/Columbina_Profile.webp?v=3",
        profileFit: { height: "81.1%" },
        ja: {
          name: "コロンビーナ",
          intro: [
            "ナド・クライの月神「クータル」、元ファデュイ執行官第三位「少女」…様々な呼び名がある中で、仲間たちは決まってこう呼んでくれる——コロンビーナ・ハイポセレニア。この名前が、一番好きだ。",
          ],
        },
      },
      {
        name: "Sandrone",
        intro: [
          'The seventh of the Fatui Harbingers, "Marionette." Interprets all phenomena through the prism of mathematics, and is an elegant lady who is never absent from a tea party.',
        ],
        element: "Cryo",
        item: "assets/images/game/genshin%20impact/sandrone/Sandrone_Item.webp",
        icon: "assets/images/game/genshin%20impact/sandrone/Sandrone_Icon.webp",
        namecard:
          "assets/images/game/genshin%20impact/sandrone/Namecard_Background_Sandrone_Tea_Break.webp",
        profile: "assets/images/game/genshin%20impact/sandrone/Sandrone_Profile.webp",
        ja: {
          name: "サンドローネ",
          intro: [
            "ファデュイ執行官第七位「傀儡」。数理をもって万象を解析し、お茶会には決まって顔を出す優雅な淑女。",
          ],
        },
      },
    ],
  },
  {
    id: "pokemon-za",
    title: "Pokémon Legends: Z-A",
    image: "assets/images/game/pokemon/PokemonZA.webp",
    thumb: "assets/images/home/games/PokemonZA.webp",
    summary:
      "Set entirely in Lumiose City, an urban redevelopment plan is reshaping the city into a place where people and Pokémon can live side by side. Trainers battle in real time across its streets and rooftops, climb the ranks of the Z-A Royale, and investigate the mysterious Mega Evolution appearing throughout the city.",
    ja: {
      title: "Pokémon LEGENDS Z-A",
      summary:
        "冒険の舞台は、人とポケモンが共存する街を目指し、都市再開発が進む「ミアレシティ」です。旅行でミアレシティを訪れた主人公は、「ホテルＺ」という古びたホテルに滞在することになり、ミアレシティで出会う仲間たちと共に、街で起こる様々な出来事や事件に挑みます。",
    },
    party: [
      {
        name: "Gardevoir",
        icon: "assets/images/game/pokemon/gardevoir.png",
        sprite: "assets/images/game/pokemon/gardevoir.gif",
        no: 282,
        sex: "f",
        lv: 66,
        hp: 183,
        types: ["Psychic", "Fairy"],
        stone: "Gardevoirite",
        stoneIcon: "assets/images/game/pokemon/items/gardevoirite.png",
        ja: { name: "サーナイト", stone: "サーナイトナイト" },
      },
      {
        name: "Garchomp",
        bodyX: 39,
        icon: "assets/images/game/pokemon/garchomp.png",
        sprite: "assets/images/game/pokemon/garchomp.gif",
        no: 445,
        sex: "m",
        lv: 76,
        hp: 276,
        types: ["Dragon", "Ground"],
        stone: "Garchompite",
        stoneIcon: "assets/images/game/pokemon/items/garchompite.png",
        ja: { name: "ガブリアス", stone: "ガブリアスナイト" },
      },
      {
        name: "Altaria",
        icon: "assets/images/game/pokemon/altaria.png",
        sprite: "assets/images/game/pokemon/altaria.gif",
        no: 334,
        sex: "f",
        lv: 100,
        hp: 354,
        types: ["Dragon", "Fairy"],
        stone: "Altarianite",
        stoneIcon: "assets/images/game/pokemon/items/altarianite.png",
        ja: { name: "チルタリス", stone: "チルタリスナイト" },
      },
      {
        name: "Mawile",
        bodyX: 81,
        icon: "assets/images/game/pokemon/mawile.png",
        sprite: "assets/images/game/pokemon/mawile.webp",
        no: 303,
        sex: "f",
        lv: 96,
        hp: 274,
        types: ["Steel", "Fairy"],
        stone: "Mawilite",
        stoneIcon: "assets/images/game/pokemon/items/mawilite.png",
        ja: { name: "クチート", stone: "クチートナイト" },
      },
      {
        name: "Lucario",
        icon: "assets/images/game/pokemon/lucario.png",
        sprite: "assets/images/game/pokemon/lucario.webp",
        no: 448,
        sex: "m",
        lv: 86,
        hp: 239,
        types: ["Fighting", "Steel"],
        stone: "Lucarionite",
        stoneIcon: "assets/images/game/pokemon/items/lucarionite.png",
        ja: { name: "ルカリオ", stone: "ルカリオナイト" },
      },
      {
        name: "Metagross",
        bodyX: 55,
        icon: "assets/images/game/pokemon/metagross.png",
        sprite: "assets/images/game/pokemon/metagross.gif",
        no: 376,
        sex: "n",
        lv: 73,
        hp: 234,
        types: ["Steel", "Psychic"],
        stone: "Metagrossite",
        stoneIcon: "assets/images/game/pokemon/items/metagrossite.png",
        ja: { name: "メタグロス", stone: "メタグロスナイト" },
      },
    ],
  },
];
