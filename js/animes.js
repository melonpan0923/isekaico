// Anime roster for anime.html. Add a new anime by adding one object here
// (and uploading its poster under assets/images/anime/) — it becomes
// reachable at anime.html?id=<id> and automatically appears in the bottom
// browse drawer. No other file needs to change.
//
// title   - shown as the big heading and in the drawer's caption.
// poster  - the tall cover art shown in the main hero panel. Lives under
//           assets/images/anime/<id>/ per anime.
// posterAspect - the poster file's own width/height (e.g. "1500 / 2127").
//           These official posters are NOT all the same ratio (checked:
//           they range ~0.70-0.80), so the cover box uses each one's own
//           ratio instead of a single fixed shape — that's what keeps
//           object-fit: cover from cropping any of them; with the box
//           already matching the image exactly, cover never needs to cut
//           anything off. Omit to fall back to .anime-cover's plain 2/3
//           default in style.css.
// thumb   - the wide preview thumbnail shown in the bottom browse drawer —
//           deliberately the SAME images already used in the Home page's
//           Anime carousel (assets/images/home/anime/), not the poster,
//           so the two rows of art stay visually consistent site-wide.
// video   - optional path to a preview clip (mp4). Left out (or empty)
//           shows a "Preview video coming soon" placeholder instead of a
//           broken player — add the file under assets/videos/anime/ and
//           set this once you have one, no other change needed.
// videoPoster - optional poster frame for the <video> element above.
// summary - a few sentences shown in the Summary panel.
// ja      - optional Japanese title/summary, shown when JP is selected
//           (js/i18n.js); the official Japanese synopsis where one exists.
const ANIMES = [
  {
    id: "rezero",
    title: "Re:ZERO -Starting Life in Another World-",
    poster: "assets/images/anime/rezero/rezeroposter.webp",
    posterAspect: "1500 / 2127",
    thumb: "assets/images/home/anime/リゼロ.webp",
    video: "assets/videos/anime/rezero.mp4",
    videoPoster: "assets/images/anime/rezero/rezero-videoposter.jpg",
    summary:
      "Subaru Natsuki is abruptly pulled from his ordinary life into a fantasy world, where he discovers he can return from death by dying — reliving the same stretch of time until he finds a way through it alive. Determined to protect the people he comes to care about, especially the half-elf Emilia, he fights through despair after despair, even when no one else remembers what he's already lived through.",
    ja: {
      title: "Re:ゼロから始める異世界生活",
      summary:
        "コンビニからの帰り道、突如として異世界へと召喚されてしまった少年・菜月昴。頼れるものなど何一つない異世界で、無力な少年が手にした唯一の力……それは死して時間を巻き戻す《死に戻り》の力だった。大切な人たちを守るため、そして確かにあったかけがえのない時間を取り戻すため、少年は絶望に抗い、過酷な運命に立ち向かっていく。",
    },
  },
  {
    id: "konosuba",
    title: "KONOSUBA -God's Blessing on This Wonderful World!",
    poster: "assets/images/anime/konosuba/konosubaposter.jpg",
    posterAspect: "870 / 1200",
    thumb: "assets/images/home/anime/このすば.webp",
    video: "assets/videos/anime/konosuba.mp4",
    videoPoster: "assets/images/anime/konosuba/konosuba-videoposter.webp",
    summary:
      "After a needless death sends him to another world, Kazuma Satou is handed a second life alongside a hopeless goddess named Aqua, a socially inept archwizard, and a masochistic crusader. Rather than heroic destiny, the four mostly bicker their way through odd jobs and small-time monster hunts, turning what should be an epic isekai adventure into a chaotic comedy of errors.",
    ja: {
      title: "この素晴らしい世界に祝福を！",
      summary:
        "ゲームをこよなく愛するひきこもり・佐藤和真（カズマ）の人生は、交通事故（!?）によりあっけなく幕を閉じた……はずだった。だが、目を覚ますと女神を名乗る美少女・アクアは告げる。「ねぇ、ちょっといい話があるんだけど。異世界に行かない？１つだけあなたの好きなものを持って行っていいわよ」「……じゃあ、あんたで」RPGゲームのような異世界で、憧れの冒険者生活エンジョイ！めざせ勇者！……と舞い上がったのも束の間、異世界に転生したカズマの目下緊急の難問は、なんと生活費の工面だった！さらに、トラブルメーカーの駄女神・アクア、中二病をこじらせた魔法使い・めぐみん、妄想ノンストップな女騎士・ダクネスという、能力だけは高いのにとんでもなく残念な３人とパーティを組むことになって、カズマの受難は続く。そして、そんなある日、カズマ達パーティはついに魔王軍に目をつけられてしまい―――!?平凡な冒険者・カズマが過ごす異世界ライフの明日はどっち!?",
    },
  },
  {
    id: "tensura",
    title: "That Time I Got Reincarnated as a Slime",
    poster: "assets/images/anime/tensura/tensuraposter.webp",
    posterAspect: "1811 / 2560",
    thumb: "assets/images/home/anime/転生スライム.jpg",
    video: "assets/videos/anime/tensura.mp4",
    videoPoster: "assets/images/anime/tensura/tensura-videoposter.jpg",
    summary:
      "Salaryman Satoru Mikami dies in an incident and wakes up reincarnated as a slime in another world. His unique skill quickly evolves into something far more powerful, and as he befriends monsters and humans alike, he rises to become Rimuru, ruler of the Jura Tempest Federation and one of the Demon Lords who shape the fate of the continent.",
    ja: {
      title: "転生したらスライムだった件",
      summary:
        "通り魔に刺されて死んだと思ったら、異世界でスライムに転生しちゃってた！？相手の能力を奪う「捕食者」と世界の理を知る「大賢者」、2つのユニークスキルを武器に、スライムの大冒険が今始まる！",
    },
  },
  {
    id: "danmachi",
    title: "Is It Wrong to Try to Pick Up Girls in a Dungeon?",
    poster: "assets/images/anime/danmachi/danmachiposter.webp",
    posterAspect: "1000 / 1414",
    thumb: "assets/images/home/anime/ダンまち.webp",
    video: "assets/videos/anime/danmachi.mp4",
    videoPoster: "assets/images/anime/danmachi/danmachi-videoposter.webp",
    summary:
      "In the city of Orario, adventurers descend into a vast dungeon in search of glory, seeking the blessing of the gods who live openly among mortals. Bell Cranel, an earnest young novice under the goddess Hestia, pushes himself to grow stronger level by level, drawing the attention of rival factions and legendary adventurers along the way.",
    ja: {
      title: "ダンジョンに出会いを求めるのは間違っているだろうか",
      summary:
        "迷宮都市オラリオ──『ダンジョン』と通称される壮大な地下迷宮を保有する巨大都市。未知という名の興奮、輝かしい栄誉、そして可愛い女の子とのロマンス。人の夢と欲望全てが息を潜めるこの場所で、少年は一人の小さな「神様」に出会った。どの【ファミリア】にも門前払いだった冒険者志望の少年と、構成員ゼロの神様が果たした運命の出会い。これは、少年が歩み、女神が記す、──【眷族の物語（ファミリア・ミィス）】──",
    },
  },
  {
    id: "frieren",
    title: "Frieren: Beyond Journey's End",
    poster: "assets/images/anime/frieren/frierenposter.jpg",
    posterAspect: "848 / 1199",
    thumb: "assets/images/home/anime/葬送のフリーレン.webp",
    video: "assets/videos/anime/frieren.mp4",
    videoPoster: "assets/images/anime/frieren/frieren-videoposter.jpg",
    summary:
      "After the party of heroes defeated the Demon King, they restored peace to the land and returned to lives of solitude. Generations pass, and the elven mage Frieren comes face to face with humanity's mortality. She takes on a new apprentice and promises to fulfill old friends' dying wishes. Can an elven mind make peace with the nature of life and death? Frieren embarks on her quest to find out.",
    ja: {
      title: "葬送のフリーレン",
      summary:
        "勇者とそのパーティーによって魔王が倒された“その後”の世界を舞台に、勇者と共に魔王を打倒した千年以上生きる魔法使い・フリーレンと、彼女が新たに出会う人々の旅路が描かれていく。",
    },
  },
];
