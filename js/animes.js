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
const ANIMES = [
  {
    id: "rezero",
    title: "Re:ZERO -Starting Life in Another World-",
    poster: "assets/images/anime/rezero/rezeroposter.jpg",
    posterAspect: "1500 / 2127",
    thumb: "assets/images/home/anime/リゼロ.jpg",
    video: "",
    summary: "Subaru Natsuki is abruptly pulled from his ordinary life into a fantasy world, where he discovers he can return from death by dying — reliving the same stretch of time until he finds a way through it alive. Determined to protect the people he comes to care about, especially the half-elf Emilia, he fights through despair after despair, even when no one else remembers what he's already lived through.",
  },
  {
    id: "konosuba",
    title: "KONOSUBA -God's Blessing on This Wonderful World!",
    poster: "assets/images/anime/konosuba/konosubaposter.jpg",
    posterAspect: "870 / 1200",
    thumb: "assets/images/home/anime/このすば.jpg",
    video: "",
    summary: "After a needless death sends him to another world, Kazuma Satou is handed a second life alongside a hopeless goddess named Aqua, a socially inept archwizard, and a masochistic crusader. Rather than heroic destiny, the four mostly bicker their way through odd jobs and small-time monster hunts, turning what should be an epic isekai adventure into a chaotic comedy of errors.",
  },
  {
    id: "tensura",
    title: "That Time I Got Reincarnated as a Slime",
    poster: "assets/images/anime/tensura/tensuraposter.jpg",
    posterAspect: "1811 / 2560",
    thumb: "assets/images/home/anime/転生スライム.jpg",
    video: "",
    summary: "Salaryman Satoru Mikami dies in an incident and wakes up reincarnated as a slime in another world. His unique skill quickly evolves into something far more powerful, and as he befriends monsters and humans alike, he rises to become Rimuru, ruler of the Jura Tempest Federation and one of the Demon Lords who shape the fate of the continent.",
  },
  {
    id: "danmachi",
    title: "Is It Wrong to Try to Pick Up Girls in a Dungeon?",
    poster: "assets/images/anime/danmachi/danmachiposter.jpg",
    posterAspect: "1000 / 1414",
    thumb: "assets/images/home/anime/ダンまち.jpg",
    video: "",
    summary: "In the city of Orario, adventurers descend into a vast dungeon in search of glory, seeking the blessing of the gods who live openly among mortals. Bell Cranel, an earnest young novice under the goddess Hestia, pushes himself to grow stronger level by level, drawing the attention of rival factions and legendary adventurers along the way.",
  },
  {
    id: "frieren",
    title: "Frieren: Beyond Journey's End",
    poster: "assets/images/anime/frieren/frierenposter.jpg",
    posterAspect: "848 / 1199",
    thumb: "assets/images/home/anime/葬送のフリーレン.jpg",
    video: "",
    summary: "After the decade-long journey that defeated the Demon King, the elven mage Frieren watches her human companions grow old and pass away in what feels, to her thousand-year lifespan, like a single blink. Left to reckon with a grief she never let herself feel in time, she sets out on a quieter journey to understand the people she traveled with — and the humanity she never quite understood.",
  },
];
