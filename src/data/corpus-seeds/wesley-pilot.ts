// Wesley Pilot — 52 Standard Sermons via CCEL
// Cada sermão é ingerido em EN (original) e PT (traduzido via Gemini)
// Fonte: https://ccel.org/ccel/wesley/sermons/  (Sermons on Several Occasions, 1771)

interface SeedJob {
  mind: string;
  source_url: string;
  title: string;
  source_format: "html" | "txt";
  language: "en";
  target_language: "en" | "pt";
  themes?: string[];
  metadata?: Record<string, unknown>;
}

// As URLs seguem o padrão CCEL: sermons.iv.html (Sermon 1), sermons.v.html (Sermon 2)...
// Os "Standard Sermons" são os 52 primeiros da coletânea.
const WESLEY_SERMONS: Array<{ slug: string; title: string; theme: string }> = [
  { slug: "sermons.iv",     title: "Sermon 1 — Salvation by Faith",                       theme: "salvation" },
  { slug: "sermons.v",      title: "Sermon 2 — The Almost Christian",                     theme: "discipleship" },
  { slug: "sermons.vi",     title: "Sermon 3 — Awake, Thou That Sleepest",                theme: "repentance" },
  { slug: "sermons.vii",    title: "Sermon 4 — Scriptural Christianity",                  theme: "doctrine" },
  { slug: "sermons.viii",   title: "Sermon 5 — Justification by Faith",                   theme: "justification" },
  { slug: "sermons.ix",     title: "Sermon 6 — The Righteousness of Faith",               theme: "righteousness" },
  { slug: "sermons.x",      title: "Sermon 7 — The Way to the Kingdom",                   theme: "kingdom" },
  { slug: "sermons.xi",     title: "Sermon 8 — The First-fruits of the Spirit",           theme: "spirit" },
  { slug: "sermons.xii",    title: "Sermon 9 — The Spirit of Bondage and of Adoption",    theme: "spirit" },
  { slug: "sermons.xiii",   title: "Sermon 10 — The Witness of the Spirit, I",            theme: "spirit" },
  { slug: "sermons.xiv",    title: "Sermon 11 — The Witness of the Spirit, II",           theme: "spirit" },
  { slug: "sermons.xv",     title: "Sermon 12 — The Witness of Our Own Spirit",           theme: "assurance" },
  { slug: "sermons.xvi",    title: "Sermon 13 — On Sin in Believers",                     theme: "sanctification" },
  { slug: "sermons.xvii",   title: "Sermon 14 — The Repentance of Believers",             theme: "repentance" },
  { slug: "sermons.xviii",  title: "Sermon 15 — The Great Assize",                        theme: "judgment" },
  { slug: "sermons.xix",    title: "Sermon 16 — The Means of Grace",                      theme: "grace" },
  { slug: "sermons.xx",     title: "Sermon 17 — The Circumcision of the Heart",           theme: "sanctification" },
  { slug: "sermons.xxi",    title: "Sermon 18 — The Marks of the New Birth",              theme: "new-birth" },
  { slug: "sermons.xxii",   title: "Sermon 19 — The Great Privilege of Those Born of God",theme: "new-birth" },
  { slug: "sermons.xxiii",  title: "Sermon 20 — The Lord Our Righteousness",              theme: "righteousness" },
  { slug: "sermons.xxiv",   title: "Sermon 21 — Sermon on the Mount, I",                  theme: "sermon-on-mount" },
  { slug: "sermons.xxv",    title: "Sermon 22 — Sermon on the Mount, II",                 theme: "sermon-on-mount" },
  { slug: "sermons.xxvi",   title: "Sermon 23 — Sermon on the Mount, III",                theme: "sermon-on-mount" },
  { slug: "sermons.xxvii",  title: "Sermon 24 — Sermon on the Mount, IV",                 theme: "sermon-on-mount" },
  { slug: "sermons.xxviii", title: "Sermon 25 — Sermon on the Mount, V",                  theme: "sermon-on-mount" },
  { slug: "sermons.xxix",   title: "Sermon 26 — Sermon on the Mount, VI",                 theme: "sermon-on-mount" },
  { slug: "sermons.xxx",    title: "Sermon 27 — Sermon on the Mount, VII",                theme: "sermon-on-mount" },
  { slug: "sermons.xxxi",   title: "Sermon 28 — Sermon on the Mount, VIII",               theme: "sermon-on-mount" },
  { slug: "sermons.xxxii",  title: "Sermon 29 — Sermon on the Mount, IX",                 theme: "sermon-on-mount" },
  { slug: "sermons.xxxiii", title: "Sermon 30 — Sermon on the Mount, X",                  theme: "sermon-on-mount" },
  { slug: "sermons.xxxiv",  title: "Sermon 31 — Sermon on the Mount, XI",                 theme: "sermon-on-mount" },
  { slug: "sermons.xxxv",   title: "Sermon 32 — Sermon on the Mount, XII",                theme: "sermon-on-mount" },
  { slug: "sermons.xxxvi",  title: "Sermon 33 — Sermon on the Mount, XIII",               theme: "sermon-on-mount" },
  { slug: "sermons.xxxvii", title: "Sermon 34 — The Original, Nature, Properties, and Use of the Law", theme: "law" },
  { slug: "sermons.xxxviii",title: "Sermon 35 — The Law Established Through Faith, I",    theme: "law" },
  { slug: "sermons.xxxix",  title: "Sermon 36 — The Law Established Through Faith, II",   theme: "law" },
  { slug: "sermons.xl",     title: "Sermon 37 — The Nature of Enthusiasm",                theme: "discernment" },
  { slug: "sermons.xli",    title: "Sermon 38 — A Caution Against Bigotry",               theme: "unity" },
  { slug: "sermons.xlii",   title: "Sermon 39 — Catholic Spirit",                          theme: "unity" },
  { slug: "sermons.xliii",  title: "Sermon 40 — Christian Perfection",                     theme: "sanctification" },
  { slug: "sermons.xliv",   title: "Sermon 41 — Wandering Thoughts",                       theme: "prayer" },
  { slug: "sermons.xlv",    title: "Sermon 42 — Satan's Devices",                          theme: "spiritual-warfare" },
  { slug: "sermons.xlvi",   title: "Sermon 43 — The Scripture Way of Salvation",           theme: "salvation" },
  { slug: "sermons.xlvii",  title: "Sermon 44 — Original Sin",                             theme: "doctrine" },
  { slug: "sermons.xlviii", title: "Sermon 45 — The New Birth",                            theme: "new-birth" },
  { slug: "sermons.xlix",   title: "Sermon 46 — The Wilderness State",                     theme: "spiritual-life" },
  { slug: "sermons.l",      title: "Sermon 47 — Heaviness Through Manifold Temptations",   theme: "trials" },
  { slug: "sermons.li",     title: "Sermon 48 — Self-denial",                              theme: "discipleship" },
  { slug: "sermons.lii",    title: "Sermon 49 — The Cure of Evil-speaking",                theme: "ethics" },
  { slug: "sermons.liii",   title: "Sermon 50 — The Use of Money",                         theme: "stewardship" },
  { slug: "sermons.liv",    title: "Sermon 51 — The Good Steward",                         theme: "stewardship" },
  { slug: "sermons.lv",     title: "Sermon 52 — The Reformation of Manners",               theme: "ethics" },
];

const baseUrl = (slug: string) => `https://ccel.org/ccel/wesley/sermons/${slug}.html`;

export const WESLEY_PILOT: SeedJob[] = WESLEY_SERMONS.flatMap((s) => [
  {
    mind: "wesley",
    source_url: baseUrl(s.slug),
    source_format: "html" as const,
    title: s.title,
    language: "en" as const,
    target_language: "en" as const,
    themes: [s.theme, "wesley", "standard-sermons"],
    metadata: { author: "John Wesley", year: 1771, collection: "Standard Sermons" },
  },
  {
    mind: "wesley",
    source_url: baseUrl(s.slug),
    source_format: "html" as const,
    title: `${s.title} (PT)`,
    language: "en" as const,
    target_language: "pt" as const,
    themes: [s.theme, "wesley", "standard-sermons"],
    metadata: { author: "John Wesley", year: 1771, collection: "Standard Sermons", translated: true },
  },
]);
