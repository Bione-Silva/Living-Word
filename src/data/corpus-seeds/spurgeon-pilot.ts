// Spurgeon Pilot — 50 Metropolitan Tabernacle Pulpit sermons
// Fonte: https://archive.spurgeon.org/sermons/NNNN.php (HTML estável)
// Cada sermão tem ID de 4 dígitos. Selecionados os 50 mais influentes/representativos.

interface SeedJob {
  mind: string;
  source_url: string;
  title: string;
  source_format: "html";
  language: "en";
  target_language: "en" | "pt";
  themes?: string[];
  metadata?: Record<string, unknown>;
}

const SPURGEON_SERMONS: Array<{ id: string; title: string; theme: string; ref?: string }> = [
  { id: "0001", title: "The Immutability of God",            theme: "theology",   ref: "Mal 3:6" },
  { id: "0007", title: "The Personality of the Holy Ghost",  theme: "spirit",     ref: "1Co 2:11" },
  { id: "0028", title: "The Eternal Name",                   theme: "theology",   ref: "Ps 72:17" },
  { id: "0029", title: "Songs in the Night",                 theme: "comfort",    ref: "Job 35:10" },
  { id: "0035", title: "The Bible",                          theme: "scripture",  ref: "Hos 8:12" },
  { id: "0042", title: "Christ Crucified",                   theme: "cross",      ref: "1Co 1:23-24" },
  { id: "0052", title: "A Mighty Saviour",                   theme: "salvation",  ref: "Isa 63:1" },
  { id: "0073", title: "The Carnal Mind Enmity Against God", theme: "doctrine",   ref: "Rom 8:7" },
  { id: "0080", title: "Salvation of the Lord",              theme: "salvation",  ref: "Jonah 2:9" },
  { id: "0094", title: "Comfort for the Desponding",         theme: "comfort",    ref: "Ps 42:5" },
  { id: "0107", title: "Confession of Sin — A Sermon with Seven Texts", theme: "repentance" },
  { id: "0149", title: "Looking unto Jesus",                 theme: "faith",      ref: "Heb 12:2" },
  { id: "0168", title: "The Form of Sound Words",            theme: "doctrine",   ref: "2Ti 1:13" },
  { id: "0173", title: "The Throne of Grace",                theme: "prayer",     ref: "Heb 4:16" },
  { id: "0181", title: "The Tabernacle of the Most High",    theme: "worship",    ref: "Ps 91:1" },
  { id: "0211", title: "A Free Salvation",                   theme: "salvation",  ref: "Isa 55:1" },
  { id: "0241", title: "The Sin of Unbelief",                theme: "faith",      ref: "2Ki 7:2" },
  { id: "0248", title: "Heart Disease Spiritually Considered", theme: "sanctification", ref: "Pro 4:23" },
  { id: "0286", title: "Faith",                              theme: "faith",      ref: "Heb 11:1" },
  { id: "0289", title: "Particular Redemption",              theme: "doctrine",   ref: "Mt 20:28" },
  { id: "0291", title: "Christ Our Passover",                theme: "cross",      ref: "1Co 5:7" },
  { id: "0295", title: "Election",                           theme: "doctrine",   ref: "Eph 1:4" },
  { id: "0309", title: "Faith and Regeneration",             theme: "new-birth",  ref: "1Jn 5:1" },
  { id: "0376", title: "The Wailing of Risca",               theme: "providence", ref: "Lk 13:1-5" },
  { id: "0468", title: "Compel Them to Come In",             theme: "evangelism", ref: "Lk 14:23" },
  { id: "0530", title: "Heavenly Worship",                   theme: "worship",    ref: "Rev 7:9-12" },
  { id: "0573", title: "Joy in Christ's Presence",           theme: "joy",        ref: "Ps 16:11" },
  { id: "0670", title: "Real Contact with Jesus",            theme: "communion",  ref: "Lk 8:45-46" },
  { id: "0771", title: "Pleading, Not Contradicting",        theme: "prayer",     ref: "Jer 12:1" },
  { id: "0848", title: "The Lord's Own View of His Church and People", theme: "ecclesiology", ref: "Song 4:7" },
  { id: "0921", title: "All of Grace",                       theme: "grace",      ref: "Eph 2:5" },
  { id: "0968", title: "Life in Christ",                     theme: "salvation",  ref: "Jn 14:19" },
  { id: "0969", title: "Rest, Rest",                         theme: "comfort",    ref: "Mt 11:28-30" },
  { id: "1014", title: "Forward!",                           theme: "discipleship", ref: "Ex 14:15" },
  { id: "1099", title: "Independence of Christianity",       theme: "apologetics", ref: "Ps 119:99" },
  { id: "1183", title: "The Saint's Horror at the Sinner's Hell", theme: "judgment",  ref: "Ps 119:53" },
  { id: "1242", title: "Light, Natural and Spiritual",       theme: "regeneration", ref: "Gen 1:3" },
  { id: "1339", title: "The Ministry of Gladness",           theme: "joy",        ref: "Neh 8:10" },
  { id: "1500", title: "All Comfort for All Saints",         theme: "comfort",    ref: "2Co 1:3-4" },
  { id: "1668", title: "What is Your Life?",                 theme: "mortality",  ref: "Jas 4:14" },
  { id: "1700", title: "The Best Cloak",                     theme: "righteousness", ref: "Isa 61:10" },
  { id: "1900", title: "The Sweet Uses of Adversity",        theme: "trials",     ref: "Ps 119:71" },
  { id: "2000", title: "The Sword of the Spirit",            theme: "scripture",  ref: "Eph 6:17" },
  { id: "2167", title: "How to Become Full of Joy",          theme: "joy",        ref: "Jn 15:11" },
  { id: "2236", title: "Filling the Empty Vessels",          theme: "ministry",   ref: "2Ki 4:1-7" },
  { id: "2400", title: "Light at Evening Time",              theme: "hope",       ref: "Zec 14:7" },
  { id: "2522", title: "The Holy Spirit's Chief Office",     theme: "spirit",     ref: "Jn 16:14" },
  { id: "2700", title: "Knowledge Commended",                theme: "wisdom",     ref: "Pro 11:9" },
  { id: "2800", title: "The Glory of the Forgiving God",     theme: "grace",      ref: "Mic 7:18" },
  { id: "3000", title: "The Final Perseverance of the Saints", theme: "doctrine", ref: "Php 1:6" },
];

const baseUrl = (id: string) => `https://archive.spurgeon.org/sermons/${id}.php`;

export const SPURGEON_PILOT: SeedJob[] = SPURGEON_SERMONS.flatMap((s) => [
  {
    mind: "spurgeon",
    source_url: baseUrl(s.id),
    source_format: "html" as const,
    title: `MTP #${s.id} — ${s.title}`,
    language: "en" as const,
    target_language: "en" as const,
    themes: [s.theme, "spurgeon", "metropolitan-tabernacle"],
    metadata: {
      author: "C.H. Spurgeon",
      collection: "Metropolitan Tabernacle Pulpit",
      sermon_number: s.id,
      bible_reference: s.ref ?? null,
    },
  },
  {
    mind: "spurgeon",
    source_url: baseUrl(s.id),
    source_format: "html" as const,
    title: `MTP #${s.id} — ${s.title} (PT)`,
    language: "en" as const,
    target_language: "pt" as const,
    themes: [s.theme, "spurgeon", "metropolitan-tabernacle"],
    metadata: {
      author: "C.H. Spurgeon",
      collection: "Metropolitan Tabernacle Pulpit",
      sermon_number: s.id,
      bible_reference: s.ref ?? null,
      translated: true,
    },
  },
]);
