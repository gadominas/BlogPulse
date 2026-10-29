// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: rss;

/*
 * BlogPulse — a Feedly-style reader for tech company blogs, for Scriptable on iPhone.
 * https://github.com/gadominas/BlogPulse
 *
 *  - Checks every followed blog each time the app opens and highlights what's new
 *  - Add blogs by searching (built-in list + Feedly's public feed search) or by pasting any address
 *  - Mark read, rate 1–3 stars (ratings train Picks), group by day or week, topic pages
 *  - Optional Claude or OpenAI: summaries, categories, the Story, TL;DRs and invites to read
 *  - Home Screen widget in the shared frame (app-blueprints · widgets), in-app updates from GitHub
 *
 *  - Opens on a 2.4 s launch screen with the BlogPulse logo (app-blueprints · launch-screen)
 *  - The BLUEPRINTS block below lists every shared blueprint this app follows (Settings › Built with)
 *
 * Data lives in iCloud Drive › Scriptable › BlogPulse (JSON files). Keys live in the iOS Keychain.
 */

// This build's version. When releasing, bump it and add a matching entry to releases.json.
const VERSION = '1.9.2';
const APP_ID = 'blogpulse';   // unique per app, never changes
const REPO_RAW = 'https://raw.githubusercontent.com/gadominas/BlogPulse/main/';
const SCRIPT_FILE = 'BlogPulse.js';   // the script's file name in the repository
// No snooze: "Later" only hides the offer until BlogPulse is opened again.
// Up to 1.4.0 "Later" (or a tap outside the sheet) hid it for 2 days under this Keychain key; it's cleared at start.
const KC_UPDATE_SNOOZE = 'blogpulse-update-snooze';

// ───────── Blueprints ─────────
// Shared blueprints this app was built with (github.com/gadominas/app-blueprints). One line per blueprint, in this exact shape:
// inventory tools read it without running the script, and Settings › Built with shows it.
const BLUEPRINTS_REPO = 'https://github.com/gadominas/app-blueprints';
const BLUEPRINTS = [
  { id: 'in-app-updates', name: 'In-app updates', version: '1.0.0', since: '1.0.0' },
  { id: 'settings', name: 'Settings', version: '1.0.0', since: '1.2.0' },
  { id: 'ai-configuration', name: 'AI configuration', version: '1.0.0', since: '1.0.0' },
  { id: 'launch-screen', name: 'Launch screen', version: '1.0.0', since: '1.6.0' },
  { id: 'widgets', name: 'Widgets', version: '1.0.0', since: '1.8.0' },
];

// ---------- config ----------
const APP = "BlogPulse";
const SCHEME = "blogpulse://";
const AI = {
  anthropic: { key: "BLOGPULSE_ANTHROPIC_KEY", model: "claude-haiku-5-5" },
  openai: { key: "BLOGPULSE_OPENAI_KEY", model: "gpt-4o-mini" },
};
const DAY = 864e5;
const DEFAULT_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 BlogPulse/1.0";

// Everything tunable lives here; the Settings screen edits these (stored in settings.cfg, defaults below).
const CONFIG = [
  ["Checking blogs", [
    { k: "fetchTimeout", label: "Time limit per blog", help: "How long to wait for one blog before giving up", unit: "s", def: 15, min: 5, max: 60, step: 1 },
    { k: "pullHold", label: "Pull-to-refresh hold", help: "After pulling the list down, hold this long to check for new posts; 0 checks as soon as you let go", unit: "s", def: 1.5, min: 0, max: 5, step: 0.5 },
    { k: "concurrency", label: "Blogs checked at once", help: "Higher is faster but heavier on the network", unit: "", def: 6, min: 1, max: 12, step: 1 },
    { k: "userAgent", label: "Browser identity", help: "The User-Agent sent to blogs; some sites block unknown readers", type: "text", def: DEFAULT_UA },
  ]],
  ["Keeping posts", [
    { k: "maxAgeDays", label: "Keep posts for", help: "Older posts are removed unless you rated them", unit: "days", def: 90, min: 7, max: 365, step: 7 },
    { k: "maxArticles", label: "Keep at most", help: "Rated posts are kept first, then the newest", unit: "posts", def: 2000, min: 200, max: 10000, step: 100 },
    { k: "seedFreshDays", label: "New blog backlog", help: "When you follow a blog, posts older than this arrive already read", unit: "days", def: 3, min: 0, max: 30, step: 1 },
    { k: "pageSize", label: "Posts per page", help: "Shown before the Show more button", unit: "posts", def: 250, min: 50, max: 1000, step: 50 },
  ]],
  ["Picks", [
    { k: "picksMinRatings", label: "Ratings before Picks starts", unit: "ratings", def: 4, min: 1, max: 50, step: 1 },
    { k: "picksThreshold", label: "Picks strictness", help: "Higher means fewer, closer matches", unit: "", def: 0.8, min: 0.2, max: 3, step: 0.1 },
  ]],
  ["Categories", [
    { k: "kwStrictness", label: "Keyword strictness", help: "Without AI: how strong a keyword match must be to move a post out of its blog's usual topic", unit: "", def: 2.5, min: 1, max: 8, step: 0.5 },
  ]],
  ["AI limits", [
    { k: "aiBatch", label: "New posts summarised per check", unit: "posts", def: 25, min: 5, max: 50, step: 5 },
    { k: "aiBackfillDays", label: "Also sort unsorted posts from the last", help: "0 turns this off", unit: "days", def: 14, min: 0, max: 60, step: 1 },
    { k: "excerptChars", label: "Excerpt kept per post", help: "Text the Story and invites can draw on; applies to newly found posts", unit: "chars", def: 600, min: 200, max: 1500, step: 100 },
    { k: "tldrChars", label: "Article text sent for a TL;DR", unit: "chars", def: 9000, min: 2000, max: 30000, step: 1000 },
    { k: "storyMaxPosts", label: "Posts per Story", unit: "posts", def: 40, min: 5, max: 80, step: 5 },
    { k: "storyFallbackDays", label: "“Since last visit” fallback", help: "If little is new, Story uses unread posts from this many days", unit: "days", def: 2, min: 1, max: 14, step: 1 },
  ]],
  ["Widget", [
    { k: "widgetRefreshMin", label: "Ask iOS to refresh every", help: "iOS decides the exact timing", unit: "min", def: 30, min: 15, max: 240, step: 15 },
    { k: "widgetStaleMin", label: "Mark the widget as out of date after", help: "Older data shows \"Updated …\" in amber", unit: "min", def: 720, min: 60, max: 2880, step: 60 },
    { k: "widgetScanAfterMin", label: "Widget checks blogs if the last check is older than", unit: "min", def: 30, min: 10, max: 720, step: 10 },
    { k: "widgetScanBudget", label: "Time the widget may spend checking", unit: "s", def: 18, min: 5, max: 25, step: 1 },
    { k: "widgetStoryHours", label: "Show the AI story summary if newer than", unit: "h", def: 48, min: 1, max: 168, step: 1 },
  ]],
  ["Invites", [
    { k: "invitePresets", label: "Quick instructions", help: "One per line; shown as chips in the invite composer", type: "lines", def: ["Short and casual", "For my team on Slack", "For an executive: lead with business impact", "As a LinkedIn post", "Ask what they think"] },
  ]],
];
const CFG_FLAT = CONFIG.flatMap(([, items]) => items);
const cfgDef = k => CFG_FLAT.find(x => x.k === k);
const cfg = k => { const v = settings.cfg && settings.cfg[k]; return v === undefined ? cfgDef(k).def : v; };
function setCfg(k, v) {
  const d = cfgDef(k);
  if (!d) return;
  settings.cfg = settings.cfg || {};
  if (v === null) { delete settings.cfg[k]; return; }
  if (d.type === "text") v = String(v || "").trim() || d.def;
  else if (d.type === "lines") { v = String(Array.isArray(v) ? v.join("\n") : v || "").split("\n").map(x => x.trim()).filter(Boolean).slice(0, 20); if (!v.length) v = d.def; }
  else {
    v = Number(String(v).replace(",", "."));
    if (!isFinite(v)) v = d.def;
    v = Math.min(d.max, Math.max(d.min, v));
    v = d.step < 1 ? Math.round(v / d.step) * d.step : Math.round(v);
    v = Number(v.toFixed(2));
  }
  if (JSON.stringify(v) === JSON.stringify(d.def)) delete settings.cfg[k]; else settings.cfg[k] = v;
}

const PALETTES = {
  ink:      { paper: "#f6f7f9", sheet: "#ffffff", ink: "#0f172a", ink2: "#334155", muted: "#5b6475", rule: "#dde2ea", signal: "#1d4ed8", signalWash: "#e5edff", amber: "#b45309", amberWash: "#fdf0dc", danger: "#b91c1c", scheme: "light" },
  sepia:    { paper: "#f3ead6", sheet: "#fbf5e6", ink: "#2a1f14", ink2: "#4b3b2a", muted: "#73604a", rule: "#e1d3b5", signal: "#8a3b12", signalWash: "#f3dfc8", amber: "#a16207", amberWash: "#f6e5bf", danger: "#9f1239", scheme: "light" },
  mint:     { paper: "#f1f6f3", sheet: "#ffffff", ink: "#0d2318", ink2: "#2c4a3b", muted: "#556d60", rule: "#d3e2d9", signal: "#15803d", signalWash: "#dcf3e4", amber: "#b45309", amberWash: "#fbeed8", danger: "#b91c1c", scheme: "light" },
  contrast: { paper: "#ffffff", sheet: "#ffffff", ink: "#000000", ink2: "#111111", muted: "#333333", rule: "#9a9a9a", signal: "#0033cc", signalWash: "#e0e8ff", amber: "#7a4b00", amberWash: "#ffeec2", danger: "#a30000", scheme: "light" },
  slate:    { paper: "#1c2128", sheet: "#22272e", ink: "#e6edf3", ink2: "#c5ced8", muted: "#9aa5b1", rule: "#373e47", signal: "#6cb6ff", signalWash: "#1d3350", amber: "#e3b341", amberWash: "#3a2f12", danger: "#ff8a7a", scheme: "dark" },
  night:    { paper: "#05070b", sheet: "#0f141c", ink: "#f3f6fa", ink2: "#d0d7e1", muted: "#9aa4b2", rule: "#1f2733", signal: "#7ab4ff", signalWash: "#132640", amber: "#f5c04a", amberWash: "#2d240c", danger: "#ff8f7a", scheme: "dark" },
};

// Categories: [id, label, colour, keyword pattern]. AI picks one of these ids; without AI the keywords decide.
const CATS = [
  ["tech", "Tech", "#3b82f6", /\b(software|engineer(ing)?|api|apis|kubernetes|k8s|cloud|database|postgres|java|jvm|kotlin|python|javascript|typescript|rust|golang|devops|infrastructure|latency|microservices?|frontend|backend|open[- ]source|github|servers?|deploy(ment)?|compiler|security|vulnerabilit(y|ies)|cve|linux|spring boot|aws|azure|gcp|sdk|developers?|programming|code ?base|observability)\b/gi],
  ["ai", "AI", "#8b5cf6", /\b(ai|a\.i\.|llms?|gpt-?\d*|genai|generative|machine learning|ml|neural|transformers?|agents?|agentic|inference|fine-?tun(e|ing)|embeddings?|rag|diffusion|chatbots?|claude|gemini|openai|anthropic|deepmind|copilot|prompt(s|ing)?)\b/gi],
  ["finance", "Finance", "#10b981", /\b(finance|financial|banks?|banking|payments?|stocks?|markets?|invest(ing|ment|ors?)?|funds?|crypto|bitcoin|interest rates?|inflation|earnings|ipo|fintech|trading|portfolios?|etfs?|bonds?|insurance|insurers?|fed|central bank|valuation|dividends?)\b/gi],
  ["business", "Business", "#f59e0b", /\b(startups?|ceo|cfo|acquisitions?|acquires?|mergers?|layoffs?|hiring|revenue|profits?|customers?|enterprise|retail|marketing|sales|leadership|strategy|growth|funding round|series [abc])\b/gi],
  ["health", "Health & Medicine", "#ef4444", /\b(health|healthcare|medical|medicine|clinical|patients?|diseases?|drugs?|fda|vaccines?|hospitals?|doctors?|cancer|diabetes|therap(y|ies)|biotech|genom(e|ics)|mental health|nutrition|fitness|surgery|pharma)\b/gi],
  ["science", "Science", "#06b6d4", /\b(research(ers)?|scientists?|physics|chemistry|biology|space|nasa|esa|astronom(y|ers)|climate|quantum|experiments?|universe|planets?|fusion|telescope|species)\b/gi],
  ["fashion", "Fashion & Style", "#ec4899", /\b(fashion|runway|couture|clothing|outfits?|luxury|beauty|makeup|skincare|vogue|apparel|sneakers?|wardrobe|menswear|womenswear|stylists?)\b/gi],
  ["design", "Design", "#f97316", /\b(design(ers)?|ux|ui|typography|figma|branding|illustration|interfaces?|usability|accessibility)\b/gi],
  ["world", "World & Politics", "#64748b", /\b(elections?|government|polic(y|ies)|president|ministers?|war|eu|regulation|regulators?|laws?|courts?|senate|parliament|sanctions?|geopolitic(s|al)|tariffs?)\b/gi],
  ["sports", "Sports", "#22c55e", /\b(football|soccer|nba|nfl|tennis|olympics?|league|championship|athletes?|formula 1|f1|marathon|cycling|world cup|transfer window)\b/gi],
  ["culture", "Culture", "#a855f7", /\b(films?|movies?|music|albums?|books?|novels?|art|museums?|tv series|theat(er|re)|video games?|gaming|celebrit(y|ies)|festival)\b/gi],
  ["other", "Other", "#94a3b8", null],
];
const CAT_IDS = CATS.map(c => c[0]);
function kwClassify(title, text) {
  let best = "", bestScore = 0;
  for (const [id, , , re] of CATS) {
    if (!re) continue;
    const t = (String(title).match(re) || []).length, b = (String(text).match(re) || []).length;
    const score = t * 2 + Math.min(b, 6) * 0.6 * (id === "business" || id === "design" ? 0.7 : 1);
    if (score > bestScore) { best = id; bestScore = score; }
  }
  return { cat: best, score: bestScore };
}

const CATALOG = [
  ["Netflix TechBlog", "https://netflixtechblog.com/feed", "streaming infrastructure data java"],
  ["Cloudflare Blog", "https://blog.cloudflare.com/rss/", "network security edge"],
  ["GitHub Blog", "https://github.blog/feed/", "devtools copilot ai"],
  ["Engineering at Meta", "https://engineering.fb.com/feed/", "infrastructure ai"],
  ["AWS News Blog", "https://aws.amazon.com/blogs/aws/feed/", "cloud"],
  ["Stripe Blog", "https://stripe.com/blog/feed.rss", "payments fintech api"],
  ["Spotify Engineering", "https://engineering.atspotify.com/feed/", "backstage platform"],
  ["Airbnb Engineering", "https://medium.com/feed/airbnb-engineering", "data mobile"],
  ["Pinterest Engineering", "https://medium.com/feed/pinterest-engineering", "ml data"],
  ["Dropbox Tech", "https://dropbox.tech/feed", "infrastructure storage"],
  ["Slack Engineering", "https://slack.engineering/feed/", "backend reliability"],
  ["Shopify Engineering", "https://shopify.engineering/blog.atom", "commerce ruby scale"],
  ["Microsoft DevBlogs", "https://devblogs.microsoft.com/feed/", "dotnet azure"],
  ["Spring Blog", "https://spring.io/blog.atom", "java spring boot"],
  ["JetBrains Blog", "https://blog.jetbrains.com/feed/", "java kotlin ide"],
  ["Docker Blog", "https://www.docker.com/blog/feed/", "containers"],
  ["Kubernetes Blog", "https://kubernetes.io/feed.xml", "cloud native"],
  ["Hugging Face Blog", "https://huggingface.co/blog/feed.xml", "ai ml llm", "ai"],
  ["OpenAI News", "https://openai.com/news/rss.xml", "ai llm", "ai"],
  ["Google DeepMind", "https://deepmind.google/blog/rss.xml", "ai research", "ai"],
  ["Martin Fowler", "https://martinfowler.com/feed.atom", "architecture refactoring"],
  ["InfoQ", "https://feed.infoq.com/", "architecture java enterprise"],
  ["Vercel", "https://vercel.com/atom", "frontend nextjs"],
];

// ---------- pure helpers (no Scriptable APIs) ----------
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", copy: "©" };
function decode(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const c = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(c); } catch (_) { return m; }
    }
    return ENT[e.toLowerCase()] ?? m;
  });
}
const cdata = s => String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
const stripTags = s => s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ");
function toText(s, max) {
  if (!s) return "";
  let t = decode(stripTags(decode(stripTags(cdata(s))))).replace(/\s+/g, " ").trim();
  t = t.replace(/The post .{0,240}? appeared first on .{0,160}$/i, "")
       .replace(/(Continue reading|Read more)\s*(on Medium)?\s*[»›…]*\s*$/i, "").trim();
  if (max && t.length > max) {
    t = t.slice(0, max);
    t = t.slice(0, Math.max(t.lastIndexOf(" "), max - 25)).replace(/[,;:.\s]+$/, "") + "…";
  }
  return t;
}
function tag(block, names) {
  for (const n of names) {
    const m = block.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i"));
    if (m && m[1].trim()) return m[1];
  }
  return "";
}
function attr(t, name) {
  const m = t.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[1] ?? m[2] ?? m[3] ?? "") : "";
}
const originOf = u => (String(u).match(/^https?:\/\/[^\/?#]+/i) || [""])[0];
const hostOf = u => originOf(u).replace(/^https?:\/\/(www\.)?/i, "");
function resolve(base, href) {
  href = String(href || "").trim();
  if (/^https?:\/\//i.test(href)) return href;
  const m = String(base || "").match(/^(https?):\/\/([^\/?#]+)([^?#]*)/i);
  if (!m || !href) return href;
  if (href.startsWith("//")) return m[1] + ":" + href;
  if (href.startsWith("/")) return `${m[1]}://${m[2]}${href}`;
  return `${m[1]}://${m[2]}${(m[3] || "/").replace(/[^\/]*$/, "")}${href}`;
}
const catalogCat = feed => { const c = CATALOG.find(x => x[1] === feed || hostOf(x[1]) === hostOf(feed)); return c ? (c[3] || "tech") : ""; };
const looksLikeFeed = t => /<(rss|feed|rdf:RDF)[\s>]/i.test(String(t).slice(0, 4000));

function parseFeed(xml, base) {
  const atom = /<feed[\s>]/i.test(xml.slice(0, 4000)) && !/<rss[\s>]/i.test(xml.slice(0, 4000));
  const head = xml.split(atom ? /<entry[\s>]/i : /<item[\s>]/i)[0];
  const title = toText(tag(head, ["title"]), 120);
  let site = "";
  if (atom) {
    for (const l of head.match(/<link\b[^>]*>/gi) || []) {
      const rel = attr(l, "rel");
      if (!rel || rel === "alternate") { site = attr(l, "href"); break; }
    }
  } else site = toText(tag(head, ["link"]));
  const items = [];
  for (const b of xml.match(atom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || []) {
    let link = "";
    if (atom) {
      const ls = b.match(/<link\b[^>]*>/gi) || [];
      const alt = ls.find(l => !attr(l, "rel") || attr(l, "rel") === "alternate") || ls[0];
      link = alt ? attr(alt, "href") : "";
    } else {
      link = toText(tag(b, ["link"]));
      if (!link) { const g = toText(tag(b, ["guid"])); if (/^https?:/i.test(g)) link = g; }
    }
    if (link) link = resolve(base, link);
    const t = toText(tag(b, ["title"]), 300);
    if (!t && !link) continue;
    const summary = tag(b, ["description", "summary"]);
    const full = tag(b, ["content:encoded", "content"]);
    const d = new Date(toText(tag(b, ["pubDate", "published", "updated", "dc:date", "issued"])));
    let desc = toText(summary || full, 260);
    if (desc === t) desc = toText(full, 260) === t ? "" : toText(full, 260);
    items.push({
      guid: toText(tag(b, ["guid", "id"])) || link || t,
      title: t || "(untitled)", link, desc,
      body: toText(full || summary, 1500),
      pub: isNaN(d) ? 0 : d.getTime(),
    });
  }
  return { title, site: site ? resolve(base, site) : "", items };
}

async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; try { out[k] = await fn(items[k], k); } catch (e) { out[k] = null; } }
  }));
  return out;
}

const STOP = new Set("the and for with from into your you our are was were this that what how why when new using use via about over more than their its have has will can not but all out just how-to part introducing announcing".split(" "));
const toks = s => [...new Set((String(s).toLowerCase().match(/[a-z0-9][a-z0-9+#.-]{2,}/g) || []).map(w => w.replace(/[.-]+$/, "")).filter(w => w.length > 2 && !STOP.has(w)))];

function computePicks(list, minN = 4, thr = 0.8) {
  const rated = list.filter(a => a.rating);
  if (rated.length < minN) return { ready: false, n: rated.length, picks: {} };
  const bySrc = {}, kw = {};
  for (const a of rated) {
    const w = a.rating - 2;                       // ★ = -1, ★★ = 0, ★★★ = +1
    (bySrc[a.src] = bySrc[a.src] || []).push(w);
    for (const t of toks(a.title)) kw[t] = (kw[t] || 0) + w;
  }
  const srcScore = {};
  for (const k in bySrc) { const v = bySrc[k]; srcScore[k] = (v.reduce((x, y) => x + y, 0) / v.length) * Math.min(1, v.length / 3); }
  const picks = {};
  for (const a of list) {
    if (a.read || a.rating) continue;
    const ts = toks(a.title);
    const k = ts.reduce((s, t) => s + (kw[t] || 0), 0) / Math.sqrt(ts.length || 1);
    const score = (srcScore[a.src] || 0) + 0.6 * k;
    if (score >= thr) picks[a.id] = Math.round(score * 10) / 10;
  }
  return { ready: true, n: rated.length, picks };
}
// ---------- end pure helpers ----------

// ---------- storage ----------
const fm = (() => { try { return FileManager.iCloud(); } catch (e) { return FileManager.local(); } })();
const DIR = fm.joinPath(fm.documentsDirectory(), APP);
if (!fm.fileExists(DIR)) fm.createDirectory(DIR, true);
const P = n => fm.joinPath(DIR, n + ".json");
const loadIssues = [];   // files iCloud didn't hand over in time
async function load(n, def, waitMs = 10000) {
  const p = P(n);
  if (!fm.fileExists(p)) return def;
  try {
    if (fm.isFileStoredIniCloud(p) && !fm.isFileDownloaded(p)) {
      // iCloud can take a long time (or forever, offline): never let start-up hang on it
      await Promise.race([fm.downloadFileFromiCloud(p), new Promise(r => Timer.schedule(waitMs, false, r))]);
      if (!fm.isFileDownloaded(p)) { loadIssues.push(n); startLog(`iCloud didn't deliver ${n}.json in ${waitMs / 1000} s`); return def; }
    }
    return JSON.parse(fm.readString(p));
  } catch (e) { loadIssues.push(n); startLog(`Couldn't read ${n}.json: ${e}`); return def; }
}
// Data files are only written once they were read, so a slow start can never save an empty list over them.
const write = (n, v) => {
  if (n === "settings" ? !settingsOk : !dataLoaded) return;
  fm.writeString(P(n), JSON.stringify(v));
};

// A short start-up log on the phone (local, not iCloud), shown if BlogPulse gets stuck while opening.
const LOG_PATH = FileManager.local().joinPath(FileManager.local().documentsDirectory(), "blogpulse-startup.log");
function startLog(msg) {
  try {
    const lfm = FileManager.local(), line = new Date().toISOString().slice(11, 19) + "  " + msg;
    const old = lfm.fileExists(LOG_PATH) ? lfm.readString(LOG_PATH).split("\n").slice(-60) : [];
    lfm.writeString(LOG_PATH, old.concat(line).join("\n"));
  } catch (e) {}
}

// Blogs, posts, stories and usage are read in loadData(): the app shows its first screen before
// reading them, because iCloud can be slow to hand files over (a black screen when opened from the widget).
let sources = [], articles = {}, stories = {}, dataLoaded = false;
async function loadData() {
  loadIssues.length = 0;
  sources = await load("sources", []);
  articles = await load("articles", {});
  stories = await load("stories", {});   // AI story per "scope|category"
  for (const k of Object.keys(stories)) if (!k.includes("|")) delete stories[k];
  usage = await load("usage", usage);
  dataLoaded = loadIssues.length === 0;   // anything missing: show what we have, save nothing over it
}
const settings = Object.assign(
  { groupBy: "day", view: "unread", readOnOpen: false, ai: true, aiProvider: "anthropic", lastSession: 0, lastScan: 0,
    checkUpdates: true,   // offer new versions from GitHub each time BlogPulse opens
    speechEngine: "device", ttsModel: "gpt-4o-mini-tts", ttsVoice: "coral", ttsInstructions: "",   // read aloud: iPhone voices or OpenAI
    theme: "auto", density: "comfortable", font: "sans", textSize: 1, storyScope: "new" },
  await load("settings", {})
);
const settingsOk = !loadIssues.includes("settings");   // settings that were never read are never saved over
const prevSession = settings.lastSession || 0;   // everything first seen after this is "new"

function saveAll(touchSession = true) {
  if (touchSession && dataLoaded) settings.lastSession = Date.now();
  write("sources", sources); write("articles", articles);   // write() skips these until the data was read
  write("settings", settings);
}

// ---------- network ----------
async function fetchText(url, timeout = cfg("fetchTimeout")) {
  const r = new Request(url);
  r.timeoutInterval = timeout;
  r.headers = { "User-Agent": cfg("userAgent"), "Accept": "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, text/html;q=0.8, */*;q=0.5" };
  const text = await r.loadString();
  const code = r.response && r.response.statusCode;
  if (code && code >= 400) throw new Error(`HTTP ${code}`);
  return { text: text || "", url: (r.response && r.response.url) || url };
}

function feedInfo(text, url) {
  const f = parseFeed(text, url);
  return f.items.length ? { feed: url, title: f.title || hostOf(url), site: f.site || originOf(url), count: f.items.length, latest: f.items[0].title } : null;
}
async function probe(u) {
  try { const r = await fetchText(u, 10); return looksLikeFeed(r.text) ? feedInfo(r.text, r.url) : null; } catch (e) { return null; }
}

const COMMON_PATHS = ["/feed", "/rss", "/feed.xml", "/rss.xml", "/atom.xml", "/index.xml", "/feed/", "/blog/feed", "/blog/rss.xml", "/blog/feed.xml", "/blog/atom.xml", "/engineering/feed"];

async function discoverUrl(input) {
  const url = /^https?:\/\//i.test(input) ? input : "https://" + input;
  let page = null;
  try { page = await fetchText(url, 12); } catch (e) {}
  if (page && looksLikeFeed(page.text)) { const i = feedInfo(page.text, page.url); return i ? [i] : []; }
  const cands = new Set();
  if (page) {
    for (const l of page.text.match(/<link\b[^>]*>/gi) || []) {
      const type = attr(l, "type").toLowerCase(), rel = attr(l, "rel").toLowerCase();
      if (rel.includes("alternate") && /(rss|atom)\+xml/.test(type) && attr(l, "href")) cands.add(resolve(page.url, attr(l, "href")));
    }
  }
  if (!cands.size) {
    const base = page ? page.url : url, o = originOf(base);
    const p = base.slice(o.length).split(/[?#]/)[0].replace(/\/$/, "");
    for (const c of COMMON_PATHS) { if (p) cands.add(o + p + c); cands.add(o + c); }
  }
  const found = (await pool([...cands].slice(0, 18), cfg("concurrency"), probe)).filter(Boolean);
  const seen = new Set();
  return found.filter(f => !seen.has(f.feed) && seen.add(f.feed));
}

async function searchFeeds(q) {
  const ql = q.toLowerCase();
  const local = CATALOG.filter(c => (c[0] + " " + c[2] + " " + c[1]).toLowerCase().includes(ql))
    .map(c => ({ feed: c[1], title: c[0], desc: "Popular tech blog · " + c[2] }));
  let remote = [];
  try {
    const r = new Request(`https://cloud.feedly.com/v3/search/feeds?query=${encodeURIComponent(q)}&count=20&locale=en`);
    r.timeoutInterval = 12;
    const j = await r.loadJSON();
    remote = (j.results || []).filter(x => x.feedId && x.feedId.startsWith("feed/")).map(x => ({
      feed: x.feedId.slice(5), title: x.title || hostOf(x.website || x.feedId.slice(5)),
      desc: toText(x.description || "", 140), subs: x.subscribers || 0,
    }));
  } catch (e) {}
  const seen = new Set();
  return [...local, ...remote].filter(r => { const k = r.feed.toLowerCase().replace(/\/$/, ""); return !seen.has(k) && seen.add(k); });
}

function discover(q) {
  q = q.trim();
  const isUrl = /^https?:\/\//i.test(q) || /^[^\s\/]+\.[a-z]{2,}(\/\S*)?$/i.test(q);
  return isUrl ? discoverUrl(q) : searchFeeds(q);
}

// ---------- articles ----------
function classifyKw(a) {
  const r = kwClassify(a.title, (a.desc || "") + " " + (a.ex || ""));
  a.kw = r.score >= cfg("kwStrictness") ? r.cat : "";      // strong signal: can override the blog's usual category
  a.kw0 = r.cat || "";                     // weak signal: only used to learn a blog's usual category
}
function sourceDefaults() {
  const votes = {};
  for (const a of Object.values(articles)) {
    if (a.kw === undefined) classifyKw(a);
    const c = a.kw || a.kw0; if (!c) continue;
    const v = votes[a.src] = votes[a.src] || {}; v[c] = (v[c] || 0) + 1;
  }
  const out = {};
  for (const s of sources) {
    if (s.defCat === undefined) s.defCat = catalogCat(s.feed);
    const v = votes[s.id] || {}, top = Object.keys(v).sort((x, y) => v[y] - v[x])[0];
    out[s.id] = s.catLock || s.defCat || top || "other";
  }
  return out;
}
function catOf(a, defs) {
  const s = sources.find(x => x.id === a.src) || {};
  return s.catLock || a.aiCat || a.kw || defs[a.src] || "other";
}
function ingest(src, items, seeding) {
  const now = Date.now(), cutoff = now - cfg("maxAgeDays") * DAY, fresh = [];
  for (const it of items) {
    const id = hash(src.id + "|" + it.guid);
    if (articles[id]) continue;
    const pub = it.pub && it.pub <= now + DAY ? it.pub : now;
    if (pub < cutoff) continue;
    const a = { id, src: src.id, title: it.title, link: it.link, desc: it.desc, pub, seen: now };
    if (seeding && now - pub > cfg("seedFreshDays") * DAY) { a.seeded = 1; a.read = 1; }
    else if (it.body) a.ex = it.body.slice(0, cfg("excerptChars"));   // excerpt kept for the AI story
    classifyKw(a);
    articles[id] = a;
    if (!a.seeded) fresh.push({ a, body: it.body });
  }
  return fresh;
}

function prune() {
  const cutoff = Date.now() - cfg("maxAgeDays") * DAY, ids = new Set(sources.map(s => s.id));
  let list = Object.values(articles).filter(a => ids.has(a.src) && (a.rating || a.pub >= cutoff));
  if (list.length > cfg("maxArticles")) list = list.sort((x, y) => (y.rating ? 1 : 0) - (x.rating ? 1 : 0) || y.pub - x.pub).slice(0, cfg("maxArticles"));
  articles = Object.fromEntries(list.map(a => [a.id, a]));
}

async function addSource(feedUrl, titleHint, depth = 0) {
  const r = await fetchText(feedUrl, 15);
  if (!looksLikeFeed(r.text)) {
    if (depth) throw new Error("No feed found at that address");
    const d = await discoverUrl(feedUrl);
    if (!d.length) throw new Error("No RSS or Atom feed found at that address");
    return addSource(d[0].feed, titleHint, 1);
  }
  if (sources.some(s => s.feed === r.url || s.feed === feedUrl)) throw new Error("You already follow this blog");
  const f = parseFeed(r.text, r.url);
  if (!f.items.length) throw new Error("The feed has no articles yet");
  const src = { defCat: catalogCat(feedUrl) || catalogCat(r.url), id: hash(r.url), title: titleHint || (f.title || "").replace(/\s+[-–—|]\s+Medium$/i, "") || hostOf(r.url), feed: r.url, site: f.site || originOf(r.url), added: Date.now(), lastFetched: Date.now() };
  sources.push(src);
  const fresh = ingest(src, f.items, true);
  return { src, count: f.items.length, fresh };
}

async function scanAll(onProgress) {
  const active = sources.filter(s => !s.paused);
  let done = 0; const fresh = [];
  await pool(active, cfg("concurrency"), async s => {
    try {
      const r = await fetchText(s.feed);
      if (!looksLikeFeed(r.text)) throw new Error("Feed address no longer returns a feed");
      fresh.push(...ingest(s, parseFeed(r.text, r.url).items, false));
      s.lastFetched = Date.now(); s.err = null;
    } catch (e) { s.err = String(e.message || e).slice(0, 120); }
    onProgress(++done, active.length);
  });
  prune();
  settings.lastScan = Date.now();
  return fresh;
}

// ---------- optional AI summaries ----------
const PROVIDERS = { anthropic: "Claude", openai: "OpenAI" };
const keyFor = p => Keychain.contains(AI[p].key) ? Keychain.get(AI[p].key) : null;
const aiKey = () => keyFor(settings.aiProvider);
const modelFor = p => (settings.model && settings.model[p]) || AI[p].model;
const maskKey = k => k ? (k.length > 14 ? k.slice(0, 7) + "…" + k.slice(-4) : "…" + k.slice(-4)) : null;

// token usage, kept per provider, model, feature and day
let usage = { since: Date.now(), p: {} };   // read in loadData()
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function recordUsage(provider, model, feature, tin, tout, chars = 0) {   // chars: text sent for speech
  const P = usage.p[provider] = usage.p[provider] || { calls: 0, in: 0, out: 0, models: {}, features: {}, days: {} };
  const b = (o, k) => o[k] = o[k] || { calls: 0, in: 0, out: 0 };
  for (const x of [P, b(P.models, model), b(P.features, feature), b(P.days, dayKey())]) { x.calls++; x.in += tin; x.out += tout; if (chars) x.chars = (x.chars || 0) + chars; }
  const days = Object.keys(P.days).sort();
  while (days.length > 400) delete P.days[days.shift()];
  write("usage", usage);
}

async function fetchModels(p) {
  const key = keyFor(p);
  if (!key) throw new Error(`Add a ${PROVIDERS[p]} key first`);
  const r = new Request(p === "openai" ? "https://api.openai.com/v1/models" : "https://api.anthropic.com/v1/models?limit=100");
  r.headers = p === "openai" ? { "Authorization": "Bearer " + key } : { "x-api-key": key, "anthropic-version": "2023-06-01" };
  r.timeoutInterval = 20;
  const j = await r.loadJSON();
  if (j.error) throw new Error(j.error.message || "Couldn't load models");
  let list = (j.data || []).map(m => ({ id: m.id, name: m.display_name || m.id, t: m.created_at ? Date.parse(m.created_at) : (m.created || 0) * 1000 }));
  if (p === "openai") {   // speech models get their own list, for Settings › Listening
    settings.ttsModels = { at: Date.now(), list: list.filter(m => /tts/.test(m.id)).sort((a, b) => b.t - a.t).map(m => ({ id: m.id, name: m.id })) };
  }
  if (p === "openai") list = list.filter(m => /^(gpt-|o\d|chatgpt-)/.test(m.id) && !/(audio|realtime|tts|transcribe|image|search|embedding|instruct|moderation)/.test(m.id));
  list.sort((a, b) => b.t - a.t);
  settings.models = settings.models || {};
  settings.models[p] = { at: Date.now(), list: list.map(m => ({ id: m.id, name: m.name })) };
  return list.length;
}

async function askKey(p) {
  const cur = keyFor(p);
  const al = new Alert();
  al.title = `${PROVIDERS[p]} API key`;
  al.message = cur ? `The saved key ends in …${cur.slice(-4)}. Paste a new key to replace it.` : "Paste your API key. It's stored in the iOS Keychain on this device only.";
  al.addSecureTextField(p === "openai" ? "sk-…" : "sk-ant-…", "");
  al.addAction("Save key");
  al.addCancelAction("Cancel");
  if (await al.present() !== 0) return false;
  const v = al.textFieldValue(0).trim();
  if (!v) return false;
  Keychain.set(AI[p].key, v);
  if (!aiKey()) settings.aiProvider = p;
  return true;
}

async function aiCall(system, user, maxTokens = 2500, feature = "other", provider = settings.aiProvider) {
  const key = keyFor(provider);
  if (!key) throw new Error(`No ${PROVIDERS[provider]} key saved`);
  const openai = provider === "openai", model = modelFor(provider);
  const r = new Request(openai ? "https://api.openai.com/v1/chat/completions" : "https://api.anthropic.com/v1/messages");
  r.method = "POST";
  r.timeoutInterval = 90;
  if (openai) {
    r.headers = { "Authorization": "Bearer " + key, "Content-Type": "application/json" };
    r.body = JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }] });
  } else {
    r.headers = { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" };
    r.body = JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] });
  }
  const j = await r.loadJSON();
  if (j.error) throw new Error(j.error.message || "AI request failed");
  const u = j.usage || {};
  recordUsage(provider, model, feature,
    openai ? (u.prompt_tokens || 0) : (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0),
    openai ? (u.completion_tokens || 0) : (u.output_tokens || 0));
  return openai ? ((j.choices && j.choices[0] && j.choices[0].message.content) || "") : (j.content || []).map(c => c.text || "").join("");
}
function parseJSON(txt) {
  const s = String(txt).replace(/```json|```/g, "").trim();
  const a = s.search(/[\[{]/), b = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  return JSON.parse(s.slice(a, b + 1));
}

async function aiSummaries(fresh) {
  if (!aiKey() || !settings.ai) return 0;
  const ids = new Set(fresh.map(x => x.a.id));
  const back = Object.values(articles).filter(a => !a.seeded && !a.aiCat && !ids.has(a.id) && a.pub > Date.now() - cfg("aiBackfillDays") * DAY)
    .sort((a, b) => b.pub - a.pub).slice(0, cfg("aiBackfillDays") ? Math.max(0, cfg("aiBatch") + 5 - Math.min(fresh.length, cfg("aiBatch"))) : 0).map(a => ({ a, body: a.ex || a.desc }));
  const batch = fresh.slice(0, cfg("aiBatch")).concat(back);
  if (!batch.length) return 0;
  const system = `You summarise and categorise blog posts for a senior software architect. For each numbered article: write one neutral sentence (max 30 words) saying what it covers and why it matters, and choose its category by the article's subject (not by who published it), exactly one of: ${CAT_IDS.join(", ")}. Reply with ONLY a JSON array like [{"i":0,"s":"...","c":"tech"}], no prose, no code fences.`;
  const user = batch.map((x, i) => `[${i}] ${x.a.title}\n${x.body || x.a.desc}`).join("\n\n");
  const arr = parseJSON(await aiCall(system, user, 2500, "summaries"));
  let n = 0;
  for (const o of Array.isArray(arr) ? arr : []) {
    const x = batch[o.i]; if (!x) continue;
    if (o.s && !x.a.ai) x.a.ai = String(o.s).slice(0, 300);
    if (CAT_IDS.includes(o.c)) x.a.aiCat = o.c;
    n++;
  }
  return n;
}

// ---------- AI story: the latest posts blended into one read ----------
function storyPool(scope, cat) {
  const now = Date.now(), defs = sourceDefaults();
  const list = Object.values(articles).filter(a => !a.seeded && (cat === "all" || catOf(a, defs) === cat)).sort((a, b) => b.pub - a.pub);
  let pick;
  if (scope === "today") pick = list.filter(a => a.pub >= now - DAY);
  else if (scope === "week") pick = list.filter(a => a.pub >= now - 7 * DAY);
  else {
    pick = list.filter(a => a.seen > prevSession);
    if (pick.length < 3) pick = list.filter(a => !a.read && a.pub >= now - cfg("storyFallbackDays") * DAY);
  }
  if (pick.length < 3) pick = list.slice(0, 12);
  return pick.slice(0, cfg("storyMaxPosts"));
}
const storySig = (scope, cat) => hash(storyPool(scope, cat).map(a => a.id).join(","));
const storyKey = () => settings.storyScope + "|" + (settings.category || "all");

async function makeStory(scope, cat) {
  const pool = storyPool(scope, cat);
  if (!pool.length) throw new Error(cat === "all" ? "No posts to write about yet" : "No posts in this category yet");
  const srcName = id => (sources.find(s => s.id === id) || {}).title || "";
  const liked = Object.values(articles).filter(a => a.rating === 3).sort((a, b) => b.pub - a.pub).slice(0, 12).map(a => "- " + a.title);
  const system = `You edit a personal tech briefing for a senior software architect. Blend the numbered posts into ONE readable story: group related posts into themes, explain what happened and why it matters, and connect posts from different companies only where they genuinely relate. Plain, direct language; no hype, no filler. Cite posts as [n] right after the sentence that uses them; every post you mention must be cited. Use only facts in the excerpts.
Reply with ONLY JSON, no code fences:
{"headline":"...","dek":"one-sentence overview","tldr":["3 bullet points, each one sentence with [n] citations"],"sections":[{"title":"...","body":"2-4 short paragraphs separated by a blank line"}],"mustRead":[{"n":0,"why":"one sentence"}]}
Use 3-6 sections and at most 3 mustRead posts.`;
  const user = (liked.length ? `Posts the reader rated highest — favour similar themes:\n${liked.join("\n")}\n\n` : "") +
    "Posts:\n\n" + pool.map((a, i) => `[${i}] ${a.title} — ${srcName(a.src)}, ${new Date(a.pub).toDateString()}\n${a.ex || a.ai || a.desc || ""}`).join("\n\n");
  const j = parseJSON(await aiCall(system, user, 4000, "story"));
  const ids = pool.map(a => a.id);
  stories[scope + "|" + cat] = {
    scope, cat, sig: storySig(scope, cat), at: Date.now(), ids,
    headline: String(j.headline || "Your tech briefing"), dek: String(j.dek || ""), provider: settings.aiProvider,
    tldr: (Array.isArray(j.tldr) ? j.tldr : []).map(String).slice(0, 5),
    sections: (j.sections || []).map(x => ({ title: String(x.title || ""), body: String(x.body || "") })).filter(x => x.body),
    mustRead: (j.mustRead || []).filter(x => ids[x.n]).map(x => ({ id: ids[x.n], why: String(x.why || "") })),
  };
  write("stories", stories);
}

// ---------- TL;DR for a single post: AI when a key is saved, otherwise extracted from the page ----------
function extractArticle(html) {
  const meta = name => { const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, "i")); return m ? toText(attr(m[0], "content")) : ""; };
  const desc = meta("og:description") || meta("description");
  let h = html.replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe|figure|button)\b[\s\S]*?<\/\1>/gi, " ");
  const main = h.match(/<article[\s>][\s\S]*<\/article>/i) || h.match(/<main[\s>][\s\S]*<\/main>/i);
  if (main) h = main[0];
  const blocks = (h.match(/<(p|h2|h3)\b[^>]*>[\s\S]*?<\/\1>/gi) || []).map(x => ({ tag: x.slice(1, 3).replace(/\W/g, "").toLowerCase(), text: toText(x) }));
  const paras = blocks.filter(b => b.tag === "p" && b.text.length >= 60).map(b => b.text);
  const heads = blocks.filter(b => b.tag !== "p" && b.text.length > 2 && b.text.length < 90).map(b => b.text);
  const text = paras.join("\n\n");
  return { desc, paras, heads, text, words: text ? text.split(/\s+/).length : 0 };
}

function extractiveTldr(a, art) {
  if (!art || !art.paras.length) return { lead: a.desc || a.title, points: [], sections: [] };
  const sents = [];
  art.paras.slice(0, 40).forEach((p, pi) => (p.match(/[^.!?]+[.!?]+["”’)]?(\s|$)/g) || [p]).forEach(x => {
    x = x.trim(); if (x.length >= 50 && x.length <= 300) sents.push({ s: x, pi });
  }));
  const freq = {};
  sents.forEach(x => toks(x.s).forEach(t => freq[t] = (freq[t] || 0) + 1));
  const inTitle = new Set(toks(a.title));
  sents.forEach((x, i) => {
    const ts = toks(x.s); x.i = i;
    x.score = ts.reduce((n, t) => n + Math.min(freq[t], 6) + (inTitle.has(t) ? 3 : 0), 0) / Math.sqrt(ts.length || 1) + (x.pi < 2 ? 2 : 0);
  });
  const lead = art.desc && art.desc.length > 40 ? art.desc : (sents[0] ? sents[0].s : a.desc || a.title);
  const points = sents.filter(x => x.s !== lead && !lead.includes(x.s.slice(0, 40)))
    .sort((x, y) => y.score - x.score).slice(0, 4).sort((x, y) => x.i - y.i).map(x => x.s);
  return { lead, points, sections: art.heads.slice(0, 6) };
}

async function makeTldr(a) {
  let art = null;
  try { const r = await fetchText(a.link, 15); art = extractArticle(r.text); } catch (e) {}
  const usable = art && art.words > 80;
  const text = usable ? art.text : (a.ex || a.ai || a.desc || "");
  const mins = Math.max(1, Math.round((usable ? art.words : text.split(/\s+/).length) / 230));
  let note = "";
  if (aiKey()) {
    try {
      const system = 'You write TL;DRs of engineering blog posts for a senior software architect. Use only facts in the text. Reply with ONLY JSON, no code fences: {"tldr":"one sentence","points":["3-5 short bullets with concrete facts"],"why":"one sentence on why it matters to an architect"}';
      const j = parseJSON(await aiCall(system, `Title: ${a.title}\n\n${text.slice(0, cfg("tldrChars"))}`, 900, "tldr"));
      return { kind: "ai", provider: settings.aiProvider, at: Date.now(), lead: String(j.tldr || ""), points: (j.points || []).map(String).slice(0, 6), why: String(j.why || ""), mins, partial: !usable };
    } catch (e) { note = "AI summary failed (" + String(e.message || e).slice(0, 60) + "), so this was extracted instead."; }
  }
  if (!usable && !text) throw new Error("This article couldn't be loaded");
  return Object.assign({ kind: "extract", at: Date.now(), mins, partial: !usable, note }, extractiveTldr(a, usable ? art : null));
}

// ---------- invite someone to read a post ----------
async function makeInvite(a, who, instr) {
  const src = (sources.find(s => s.id === a.src) || {}).title || hostOf(a.link);
  const t = a.tldr || {};
  if (!aiKey()) {
    const lead = t.lead || a.ai || a.desc || "";
    return { kind: "template", text: `${who ? "Hi " + who + ", t" : "T"}hought you'd find this worth a read: “${a.title}” from ${src}.${lead ? " " + lead : ""}\n\n${a.link}` };
  }
  const system = `You write short personal messages that invite someone to read an article. Write in the first person as the sender. Make the reader want to open it: lead with the most interesting point and say briefly why it matters to them. Be specific, not salesy. No hashtags, emojis or subject line unless the instructions ask for them. Do not include the link; it is added after your message. The sender's instructions on tone, language, length, format and audience override these defaults. Reply with only the message text.`;
  const user = `Sender's instructions: ${instr || "(none) — 2–3 friendly, specific sentences."}
Recipient: ${who || "not specified"}

Article: ${a.title}
Published by: ${src}
${t.lead ? "TL;DR: " + t.lead + "\n" : ""}${t.points && t.points.length ? "Key points:\n" + t.points.map(x => "- " + x).join("\n") + "\n" : ""}${t.why ? "Why it matters: " + t.why + "\n" : ""}Excerpt: ${(a.ex || a.ai || a.desc || "").slice(0, 1500)}`;
  const msg = (await aiCall(system, user, 700, "invite")).trim().replace(/^["“]+|["”]+$/g, "").trim();
  if (!msg) throw new Error("the AI returned an empty message");
  return { kind: "ai", provider: settings.aiProvider, text: msg + "\n\n" + a.link };
}

// ---------- AI voice: OpenAI's speech endpoint (Claude's API has no speech output) ----------
const TTS_LEGACY_VOICES = ["alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"];   // all tts-1 and tts-1-hd can use
async function aiSpeech(text) {
  const key = keyFor("openai");
  if (!key) throw new Error("AI voices need an OpenAI key");
  const model = settings.ttsModel || "gpt-4o-mini-tts", legacy = /^tts-1/.test(model);
  let voice = settings.ttsVoice || "coral";
  if (legacy && !TTS_LEGACY_VOICES.includes(voice)) voice = "coral";
  const body = { model, voice, input: String(text).slice(0, 4096), response_format: "mp3" };
  if (!legacy && settings.ttsInstructions) body.instructions = String(settings.ttsInstructions).slice(0, 500);
  const speed = Number(settings.voiceRate) || 1;
  if (speed !== 1) body.speed = speed;
  const r = new Request("https://api.openai.com/v1/audio/speech");
  r.method = "POST"; r.timeoutInterval = 60;
  r.headers = { "Authorization": "Bearer " + key, "Content-Type": "application/json" };
  r.body = JSON.stringify(body);
  const data = await r.load();
  const code = r.response && r.response.statusCode;
  if (code !== 200) {
    let msg = `HTTP ${code}`;
    try { msg = JSON.parse(data.toRawString()).error.message || msg; } catch (e) {}
    throw new Error(msg);
  }
  recordUsage("openai", model, "speech", 0, 0, body.input.length);
  return data.toBase64String();
}

// ---------- in-app updates (pattern from StravaFeed) ----------
// Compares "1.10.0" and "1.9.2" as numbers: returns 1, 0 or -1.
function cmpVer(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}
function clearUpdateSnooze() { try { if (Keychain.contains(KC_UPDATE_SNOOZE)) Keychain.remove(KC_UPDATE_SNOOZE); } catch (e) {} }
clearUpdateSnooze();   // a two-day "Later" left by an older version must not block offers

async function checkForUpdate(force = false) {
  if (!force && settings.checkUpdates === false) return null;
  try {
    const req = new Request(`${REPO_RAW}releases.json?t=${Date.now()}`);
    req.timeoutInterval = 10;
    const data = await req.loadJSON();
    if (!data || !Array.isArray(data.releases)) return null;
    const newer = data.releases
      .filter(r => r && r.version && cmpVer(r.version, VERSION) > 0)
      .sort((x, y) => cmpVer(y.version, x.version));
    if (!newer.length) return null;
    // The newest release's highlights first, topped up from older versions the user skipped.
    const highlights = [];
    newer.forEach(r => (r.highlights || []).forEach(h => {
      if (highlights.length < 3 && h && h.title) highlights.push(h);
    }));
    return {
      current: VERSION, latest: newer[0].version, title: newer[0].title || '', date: newer[0].date || '',
      skipped: newer.length, highlights, script: data.script || SCRIPT_FILE,
    };
  } catch (e) {
    console.log('Update check skipped: ' + e);
    return null;
  }
}

async function applyUpdate(info) {
  const req = new Request(`${REPO_RAW}${encodeURI((info && info.script) || SCRIPT_FILE)}?t=${Date.now()}`);
  req.timeoutInterval = 30;
  const code = await req.loadString();
  const okStatus = req.response && req.response.statusCode === 200;
  const m = code && code.match(/const VERSION = '([^']+)'/);
  // 1. A real script for THIS app, not an error page or another project's file
  if (!okStatus || !m || !code.includes(`const APP_ID = '${APP_ID}'`)) {
    throw new Error("The download didn't look right. Try again later.");
  }
  // 2. Actually newer: GitHub's cache can serve the old file for a few minutes after a release
  if (cmpVer(m[1], VERSION) <= 0) {
    throw new Error('GitHub is still serving the old version. Try again in a few minutes.');
  }
  // 3. Write it where the running script lives (iCloud or on the phone)
  const path = module.filename;
  let lfm = FileManager.local();
  try {
    const ic = FileManager.iCloud();
    if (path.startsWith(ic.documentsDirectory())) lfm = ic;
  } catch (e) {}
  lfm.writeString(path, code);
  return m[1];   // the version now installed
}

let pendingUpdate = null, updateChecked = false;
const offerUpdate = () => { if (pendingUpdate) call("__showUpdate", pendingUpdate); };

// ---------- state sent to the UI ----------
function clientState() {
  const list = Object.values(articles).sort((a, b) => b.pub - a.pub);
  const defs = sourceDefaults();
  const pk = computePicks(list, cfg("picksMinRatings"), cfg("picksThreshold"));
  return {
    articles: list.map(a => ({
      id: a.id, src: a.src, title: a.title, link: a.link, desc: a.ai || a.desc || "", ai: !!a.ai, pub: a.pub,
      read: !!a.read, rating: a.rating || 0, cat: catOf(a, defs), catBy: a.aiCat ? "ai" : "kw", isNew: !a.seeded && a.seen > prevSession, pick: pk.picks[a.id] || 0,
    })),
    sources: sources.map(s => ({ id: s.id, title: s.title, feed: s.feed, site: s.site, err: s.err || null, paused: !!s.paused, lastFetched: s.lastFetched || 0, cat: defs[s.id], catLock: s.catLock || "" })),
    ai: {
      provider: settings.aiProvider,
      keys: Object.fromEntries(Object.keys(PROVIDERS).map(p => [p, maskKey(keyFor(p))])),
      model: Object.fromEntries(Object.keys(PROVIDERS).map(p => [p, modelFor(p)])),
      models: settings.models || {}, usage, today: dayKey(),
    },
    cfg: Object.fromEntries(CFG_FLAT.map(d => [d.k, cfg(d.k)])),
    cfgSchema: CONFIG.map(([title, items]) => ({ title, items })),
    categories: CATS.map(c => ({ id: c[0], label: c[1], color: c[2] })),
    settings: {
      groupBy: settings.groupBy, view: settings.view, readOnOpen: settings.readOnOpen, ai: settings.ai, aiProvider: settings.aiProvider, hasKey: !!aiKey(), checkUpdates: settings.checkUpdates !== false,
      voiceURI: settings.voiceURI || "", voiceRate: settings.voiceRate || 1, voicePitch: settings.voicePitch || 1, voiceGender: settings.voiceGender || "all",
      speechEngine: settings.speechEngine || "device", ttsModel: settings.ttsModel || "gpt-4o-mini-tts", ttsVoice: settings.ttsVoice || "coral",
      ttsInstructions: settings.ttsInstructions || "", hasOpenAI: !!keyFor("openai"),
      theme: settings.theme, density: settings.density, font: settings.font, textSize: settings.textSize, storyScope: settings.storyScope, category: settings.category || "all", inviteInstr: settings.inviteInstr || "",
    },
    story: (() => { const st = stories[storyKey()]; return st ? Object.assign({}, st, { stale: st.sig !== storySig(st.scope, st.cat) }) : null; })(),
    picksReady: pk.ready, rated: pk.n, lastScan: settings.lastScan, palettes: PALETTES, version: VERSION,
    ttsModels: settings.ttsModels || null,
    blueprints: BLUEPRINTS, blueprintsRepo: BLUEPRINTS_REPO,
    catalog: CATALOG.map(c => ({ title: c[0], feed: c[1], tags: c[2] })),
  };
}

const safeJSON = x => JSON.stringify(x === undefined ? null : x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029").replace(/<\//g, "<\\/");

// ---------- UI ----------
// The WebView is built in main() only, so a widget run never builds one (app-blueprints · widgets, Step 4).
let wv = null;
const call = (fn, ...args) => wv ? wv.evaluateJavaScript(`window.${fn} && window.${fn}(${args.map(safeJSON).join(",")})`, false).catch(() => {}) : Promise.resolve();
const toast = msg => call("toast", msg);
const push = () => call("recv", clientState());

let storyBusy = false;
async function storyAction(m) {
  if (!aiKey()) return toast("Add a Claude or OpenAI key to use Story");
  if (m.scope) settings.storyScope = m.scope;
  if (m.cat && (m.cat === "all" || CAT_IDS.includes(m.cat))) settings.category = m.cat;
  const scope = settings.storyScope, cat = settings.category || "all";
  if ((stories[storyKey()] && !m.force) || storyBusy) { saveAll(); push(); return call("onStory", storyBusy); }
  storyBusy = true; call("onStory", true);
  try { await makeStory(scope, cat); saveWidget(widgetSnapshot()); }   // the widget's ✦ story line
  catch (e) { toast("Story not written: " + String(e.message || e).slice(0, 90)); }
  storyBusy = false; saveAll(); push(); call("onStory", false);
}

let scanning = false;
async function runScan() {
  if (scanning) return;
  scanning = true;
  call("onProgress", 0, sources.filter(s => !s.paused).length);
  const fresh = await scanAll((d, t) => call("onProgress", d, t));
  call("onProgress", 0, 0);
  saveAll(); push();
  saveWidget(widgetSnapshot());   // the widget shows what this scan found
  const failed = sources.filter(s => s.err && !s.paused).length;
  toast((fresh.length ? `${fresh.length} new article${fresh.length > 1 ? "s" : ""}` : "No new articles") + (failed ? ` · ${failed} source${failed > 1 ? "s" : ""} failed` : ""));
  if (settings.ai && aiKey()) {
    try { if (await aiSummaries(fresh)) { saveAll(); push(); } }
    catch (e) { toast("Summaries skipped: " + String(e.message || e).slice(0, 80)); }
  }
  scanning = false;
}

async function handle(m) {
  const a = m.id && articles[m.id];
  switch (m.type) {
    case "read": if (a) a.read = m.v ? 1 : 0; break;
    case "rate": if (a) { a.rating = m.v || 0; if (a.rating) a.read = 1; }
      { const pk = computePicks(Object.values(articles), cfg("picksMinRatings"), cfg("picksThreshold")); call("onPicks", pk); } break;
    case "markAll": for (const id of m.ids || []) if (articles[id]) articles[id].read = 1; break;
    case "open": if (a && a.link) { if (settings.readOnOpen) { a.read = 1; saveWidget(widgetSnapshot()); } saveAll(); await Safari.openInApp(a.link, false); } return;
    case "set": if (["groupBy", "view", "readOnOpen", "ai", "theme", "density", "font", "textSize", "storyScope", "category", "checkUpdates", "voiceURI", "voiceRate", "voicePitch", "voiceGender", "speechEngine", "ttsModel", "ttsVoice", "ttsInstructions"].includes(m.k)) settings[m.k] = m.v; break;
    case "refresh": return runScan();
    case "discover": {
      let res = [];
      try { res = await discover(m.q); } catch (e) {}
      return call("onDiscover", res.map(r => ({ ...r, following: sources.some(s => s.feed === r.feed) })));
    }
    case "add":
      try {
        const { src, count, fresh } = await addSource(m.feed, m.title);
        saveAll(); push(); call("addDone", m.feed, true); saveWidget(widgetSnapshot());
        toast(`Following ${src.title} · ${count} recent posts`);
        if (fresh.length && settings.ai && aiKey()) aiSummaries(fresh).then(n => { if (n) { saveAll(); push(); } }).catch(() => {});
      } catch (e) { call("addDone", m.feed, false); toast(String(e.message || e)); }
      return;
    case "remove":
      sources = sources.filter(s => s.id !== m.id);
      for (const id in articles) if (articles[id].src === m.id) delete articles[id];
      saveAll(); saveWidget(widgetSnapshot()); return push();
    case "srccat": { const s = sources.find(x => x.id === m.id); if (s) s.catLock = CAT_IDS.includes(m.v) ? m.v : ""; saveAll(); return push(); }
    case "pause": { const s = sources.find(x => x.id === m.id); if (s) s.paused = !s.paused; saveAll(); return push(); }
    case "story": return storyAction(m);
    case "invite": {
      if (!a) return;
      const instr = String(m.instr || "").trim().slice(0, 1000);
      if (instr) settings.inviteInstr = instr;
      let res;
      try { res = await makeInvite(a, String(m.who || "").trim().slice(0, 120), instr); }
      catch (e) { res = { error: String(e.message || e) }; }
      saveAll(); return call("onInvite", a.id, res);
    }
    case "share": if (m.text) await ShareSheet.present([m.text]); return;
    case "copy": if (m.text) { Pasteboard.copy(m.text); toast("Invite copied"); } return;
    case "tldr": {
      if (!a) return;
      const wantAI = m.force && aiKey();
      if (a.tldr && !m.force) return call("onTldr", a.id, a.tldr);
      if (a.tldr && m.force && !wantAI && a.tldr.kind === "extract") return call("onTldr", a.id, a.tldr);
      try { a.tldr = await makeTldr(a); }
      catch (e) { return call("onTldr", a.id, { error: String(e.message || e) }); }
      saveAll(); return call("onTldr", a.id, a.tldr);
    }
    case "articletext": {   // the article's own text, for "Listen to the full article"
      if (!a) return;
      const excerpt = a.ex || a.ai || a.desc || "";
      let res;
      try {
        const r = await fetchText(a.link, 20), art = extractArticle(r.text);
        res = art.words > 80 ? { paras: art.paras.slice(0, 80) } : excerpt ? { paras: [excerpt], partial: true } : { error: "This article couldn't be read" };
      } catch (e) { res = excerpt ? { paras: [excerpt], partial: true } : { error: "This article couldn't be loaded" }; }
      return call("onArticleText", a.id, res);
    }
    case "state": return push();
    case "ttsaudio":   // one piece of AI speech, returned to the page as base64 MP3
      try { return call("__done", m.req, true, await aiSpeech(m.text)); }
      catch (e) { return call("__done", m.req, false, String(e.message || e)); }
    case "speak": if (m.text) Speech.speak(String(m.text).slice(0, 8000)); return;   // fallback when the page can't speak
    case "update-later": pendingUpdate = null; return;   // asked again next time BlogPulse opens
    case "update-now": {
      let ok = false, msg = "";
      try { msg = await applyUpdate(pendingUpdate); ok = true; pendingUpdate = null; }
      catch (e) { msg = String(e.message || e); }
      return call("__done", m.req, ok, msg);
    }
    case "startlog": {
      let txt = "";
      try { txt = FileManager.local().readString(LOG_PATH).split("\n").slice(-40).join("\n"); } catch (e) {}
      return call("__done", m.req, true, txt);
    }
    case "openurl":   // Settings › Built with: only the blueprints repository opens from here
      if (m.v === BLUEPRINTS_REPO || String(m.v).startsWith(BLUEPRINTS_REPO + "/")) await Safari.openInApp(m.v, false);
      return;
    case "update-check": {
      const u = await checkForUpdate(true);
      await call("__done", m.req, true, u ? `Version ${u.latest} is available` : `You're on the latest version (${VERSION})`);
      if (u) { pendingUpdate = u; offerUpdate(); }
      return;
    }
    case "aikey": {
      const p = PROVIDERS[m.v] ? m.v : settings.aiProvider;
      if (await askKey(p)) {
        settings.ai = true; saveAll(); push();
        try { const n = await fetchModels(p); toast(`${PROVIDERS[p]} key saved — ${n} models available`); }
        catch (e) { toast(`Key saved, but checking it failed: ${String(e.message || e).slice(0, 70)}`); }
      }
      saveAll(); return push();
    }
    case "airm": { const p = m.v; if (PROVIDERS[p] && Keychain.contains(AI[p].key)) Keychain.remove(AI[p].key); toast(`${PROVIDERS[p]} key removed`); saveAll(); return push(); }
    case "aiprov": if (PROVIDERS[m.v]) settings.aiProvider = m.v; saveAll(); return push();
    case "aimodels":
      try { const n = await fetchModels(m.v); toast(`${n} ${PROVIDERS[m.v]} models found`); }
      catch (e) { toast(String(e.message || e).slice(0, 90)); }
      saveAll(); return push();
    case "aimodel": if (PROVIDERS[m.p] && m.v) { settings.model = settings.model || {}; settings.model[m.p] = m.v; toast(`${PROVIDERS[m.p]} now uses ${m.v}`); } saveAll(); return push();
    case "aitest": {
      const p = m.v, t0 = Date.now();
      try { await aiCall("Reply with the single word OK.", "Connection test.", 10, "test", p); toast(`${PROVIDERS[p]} works — ${modelFor(p)} answered in ${((Date.now() - t0) / 1000).toFixed(1)} s`); }
      catch (e) { toast(`${PROVIDERS[p]} test failed: ${String(e.message || e).slice(0, 80)}`); }
      return push();
    }
    case "cfg": {
      const before = cfg("kwStrictness");
      if (m.k === "*") settings.cfg = {}; else setCfg(m.k, m.v);
      if (cfg("kwStrictness") !== before) Object.values(articles).forEach(classifyKw);
      if (m.k === "*" || m.k === "maxAgeDays" || m.k === "maxArticles") prune();
      saveAll(); saveWidget(widgetSnapshot()); return push();
    }
    case "usagereset": usage = { since: Date.now(), p: {} }; write("usage", usage); toast("Usage counters reset"); return push();
  }
  saveAll();
  if (m.type === "read" || m.type === "rate" || m.type === "markAll") saveWidget(widgetSnapshot());   // unread count, pick and rows change
}

function buildWebView() {
  wv = new WebView();
  wv.shouldAllowRequest = req => {
    const u = req.url || "";
    if (u.startsWith(SCHEME)) {
      let m = {};
      try { m = JSON.parse(decodeURIComponent(u.split("?d=")[1] || "%7B%7D")); } catch (e) {}
      handle(m).catch(e => toast(String(e.message || e)));
      return false;
    }
    if (/^https?:/i.test(u)) { Safari.openInApp(u, false); return false; }
    return true;
  };
}

function clientApp() {
  let S = window.__INIT;
  const look = { theme: S.settings.theme || "auto", density: S.settings.density || "comfortable", font: S.settings.font || "sans", textSize: +S.settings.textSize || 1 };
  let view = S.settings.view || "unread", group = S.settings.groupBy || "day", storyScope = S.settings.storyScope || "new";
  if (view === "story" && !S.settings.hasKey) view = "unread";
  let tldrId = null; const tl = {}, expanded = new Set();
  let cfgOpen = false, cfgArmed = false;
  const cfgItem = k => { for (const sec of S.cfgSchema) for (const d of sec.items) if (d.k === k) return d; return null; };
  const cfgChanged = k => { const d = cfgItem(k); return d && JSON.stringify(S.cfg[k]) !== JSON.stringify(d.def); };
  const fmtCfg = (d, v) => d.step && d.step < 1 ? Number(v).toFixed(String(d.step).split(".")[1].length) : String(v);
  // Settings › Built with: the shared blueprints this app follows, each linked at the version it follows.
  const bpLink = b => `${S.blueprintsRepo}/blob/${b.id}-v${b.version}/blueprints/${b.id}.md`;
  function builtWithHTML() {
    return `<h3 class="sec">Built with</h3><p class="hint">BlogPulse is built from shared blueprints that the other apps use too. Tap one to read how that part works.</p>
      ${S.blueprints.map(b => `<button class="srow bp" data-act="openurl" data-v="${esc(bpLink(b))}"><div class="grow"><b>${esc(b.name)}</b><small class="muted">Blueprint ${esc(b.version)} · since BlogPulse ${esc(b.since)}</small></div><span class="go" aria-hidden="true">›</span></button>`).join("")}
      <button class="srow bp" data-act="openurl" data-v="${esc(S.blueprintsRepo)}"><div class="grow"><b>All blueprints</b><small class="muted">${esc(S.blueprintsRepo.replace("https://", ""))}</small></div><span class="go" aria-hidden="true">›</span></button>`;
  }
  const vseg = (k, opts) => `<div class="seg wide">${opts.map(([v, l]) => `<button class="${String(S.settings[k]) === String(v) ? "on" : ""}" data-act="voiceset" data-k="${k}" data-v="${v}">${l}</button>`).join("")}</div>`;
  function listenHTML() {
    const eng = S.settings.speechEngine === "ai" ? "ai" : "device";
    return `<div class="lk-row"><span class="lk-l">Voice engine</span>${vseg("speechEngine", [["device", "iPhone voice"], ["ai", "✦ AI voice"]])}</div>` + (eng === "ai" ? aiListenHTML() : deviceListenHTML());
  }
  function aiListenHTML() {
    if (!S.settings.hasOpenAI) return `<p class="note">AI voices come from OpenAI, so they need an OpenAI key, even when Claude writes your summaries (Claude's API doesn't offer speech).</p>
      <div class="aic-btns"><button class="sm primary" data-act="aiopen">Add an OpenAI key</button></div>`;
    const model = S.settings.ttsModel || "gpt-4o-mini-tts", legacy = /^tts-1/.test(model), g = S.settings.voiceGender || "all";
    const vs = OAI_VOICES.filter(([v, gg]) => (!legacy || LEGACY_TTS.has(v)) && (g === "all" || gg === g || v === S.settings.ttsVoice));
    const loaded = ((S.ttsModels || {}).list || []).map(m => m.id);
    const mlist = [model].concat(loaded.length ? loaded : ["gpt-4o-mini-tts", "tts-1-hd", "tts-1"]).filter((x, i, a) => a.indexOf(x) === i);
    const gl = { f: " (female)", m: " (male)", n: " (neutral)" };
    return `<div class="lk-row"><span class="lk-l">Voice</span>${vseg("voiceGender", [["all", "All"], ["f", "Female"], ["m", "Male"]])}
        <select class="ttsvoicesel voicesel" aria-label="AI voice">${vs.map(([v, gg]) => `<option value="${v}" ${v === S.settings.ttsVoice ? "selected" : ""}>${v[0].toUpperCase() + v.slice(1)}${gl[gg]}</option>`).join("")}</select></div>
      <div class="lk-row"><span class="lk-l">Speech model</span><select class="ttsmodelsel voicesel" aria-label="Speech model">${mlist.map(m => `<option value="${esc(m)}" ${m === model ? "selected" : ""}>${esc(m)}</option>`).join("")}</select></div>
      ${legacy ? "" : `<div class="lk-row"><span class="lk-l">How it should sound</span><textarea class="ttsinstr cfgin wide" rows="2" placeholder="e.g. Calm, clear newsreader. Neutral accent.">${esc(S.settings.ttsInstructions || "")}</textarea></div>`}
      <div class="lk-row"><span class="lk-l">Speed</span>${vseg("voiceRate", [[0.85, "Slow"], [1, "Normal"], [1.15, "Fast"], [1.3, "Faster"]])}</div>
      <div class="aic-btns"><button class="sm" data-act="voicetest">${SPK}Test the voice</button></div>
      <p class="note">✦ Spoken by OpenAI with your key, one post or section at a time; the first piece takes a few seconds. OpenAI bills each use; BlogPulse counts the characters under AI settings › Token usage as “Read aloud”. Voice labels describe how each voice usually sounds.${loaded.length ? "" : " Load your OpenAI models in AI settings to see every speech model your key can use."}</p>`;
  }
  function deviceListenHTML() {
    if (!SYN || !voices.length) return `<p class="note">This device reads aloud with the system voice. Choose it in iOS Settings › Accessibility › Spoken Content.</p>`;
    const g = S.settings.voiceGender || "all", cur = currentVoice();
    const shown = voices.filter(v => g === "all" || genderOf(v) === g || v === cur);
    const langs = {};
    shown.forEach(v => (langs[v.lang] = langs[v.lang] || []).push(v));
    const mine = (navigator.languages || [navigator.language || "en"]).map(l => l.toLowerCase().split("-")[0]);
    const rankLang = l => { const b = l.toLowerCase().split(/[-_]/)[0]; const i = mine.indexOf(b); return i >= 0 ? i : b === "en" ? 50 : 100; };
    const order = Object.keys(langs).sort((x, y) => rankLang(x) - rankLang(y) || langName(x).localeCompare(langName(y)));
    const label = v => `${baseName(v)}${quality(v) ? " — " + quality(v) : ""}${genderOf(v) ? (genderOf(v) === "f" ? " (female)" : " (male)") : ""}`;
    const seg = (k, opts) => `<div class="seg wide">${opts.map(([v, l]) => `<button class="${String(S.settings[k]) === String(v) ? "on" : ""}" data-act="voiceset" data-k="${k}" data-v="${v}">${l}</button>`).join("")}</div>`;
    return `<div class="lk-row"><span class="lk-l">Voice</span>${seg("voiceGender", [["all", "All"], ["f", "Female"], ["m", "Male"]])}
      <select class="voicesel" aria-label="Voice">${order.map(l => `<optgroup label="${esc(langName(l))} (${esc(l)})">${langs[l].map(v => `<option value="${esc(v.voiceURI)}" ${cur && v.voiceURI === cur.voiceURI ? "selected" : ""}>${esc(label(v))}</option>`).join("")}</optgroup>`).join("")}</select></div>
      <div class="lk-row"><span class="lk-l">Speed</span>${seg("voiceRate", [[0.85, "Slow"], [1, "Normal"], [1.15, "Fast"], [1.3, "Faster"]])}</div>
      <div class="lk-row"><span class="lk-l">Pitch</span>${seg("voicePitch", [[0.85, "Lower"], [1, "Normal"], [1.15, "Higher"]])}</div>
      <div class="aic-btns"><button class="sm" data-act="voicetest">${SPK}Test the voice</button><span class="note">${voices.length} voices on this ${/iPad/.test(navigator.userAgent) ? "iPad" : "iPhone"}</span></div>
      <p class="note">More natural voices: iOS Settings › Accessibility › Spoken Content › Voices. Download an Enhanced or Premium voice and it appears here.</p>`;
  }
  function renderCfg() {
    const el = $("#cfgsheet"), keepTop = el.scrollTop;
    el.classList.toggle("open", cfgOpen); lockBody();
    if (!cfgOpen) return;
    const field = d => {
      const v = S.cfg[d.k], ch = cfgChanged(d.k);
      const reset = ch ? `<button class="link small" data-act="cfgreset" data-k="${d.k}">Reset</button>` : "";
      const head = `<div class="cfg-h"><b>${esc(d.label)}</b>${reset}</div>${d.help ? `<small class="muted">${esc(d.help)}</small>` : ""}`;
      if (d.type === "text") return `<div class="cfg ${ch ? "ch" : ""}">${head}<input class="cfgin wide" data-k="${d.k}" value="${esc(v)}" autocapitalize="off" autocorrect="off" spellcheck="false"></div>`;
      if (d.type === "lines") return `<div class="cfg ${ch ? "ch" : ""}">${head}<textarea class="cfgin wide" data-k="${d.k}" rows="${Math.max(4, v.length + 1)}">${esc(v.join("\n"))}</textarea></div>`;
      return `<div class="cfg ${ch ? "ch" : ""}">${head}
        <div class="stepper"><button data-act="cfgstep" data-k="${d.k}" data-v="-1" aria-label="Decrease" ${v <= d.min ? "disabled" : ""}>−</button>
        <input class="cfgin" data-k="${d.k}" value="${fmtCfg(d, v)}" inputmode="decimal" aria-label="${esc(d.label)}">
        <button data-act="cfgstep" data-k="${d.k}" data-v="1" aria-label="Increase" ${v >= d.max ? "disabled" : ""}>+</button>
        <span class="unit">${esc(d.unit || "")}</span><span class="range">${fmtCfg(d, d.min)}–${fmtCfg(d, d.max)}${ch ? ` — original ${fmtCfg(d, d.def)}` : ""}</span></div></div>`;
    };
    const changed = Object.keys(S.cfg).filter(cfgChanged).length;
    el.innerHTML = `<div class="sh-head"><h2>Settings</h2><button class="link" data-act="cfgclose">Done</button></div><div class="sh-body">
      <p class="hint">Changes apply right away and are kept on this iPhone.</p>
      <h3 class="sec">Appearance</h3>${lookHTML()}
      <h3 class="sec">Reading</h3>
      <div class="srow"><div class="grow"><b>Mark as read when opened</b><small class="muted">Off: you mark posts read yourself</small></div><button class="switch ${S.settings.readOnOpen ? "on" : ""}" data-act="toggle" data-v="readOnOpen" aria-label="Mark as read when opened"></button></div>
      <div class="srow"><div class="grow"><b>Picks</b><small class="muted">${S.picksReady ? `Learning from ${S.rated} ratings` : `Rate ${Math.max(0, S.cfg.picksMinRatings - S.rated)} more post${S.cfg.picksMinRatings - S.rated === 1 ? "" : "s"} to switch on`}</small></div></div>
      <h3 class="sec">Listening</h3>${listenHTML()}
      <h3 class="sec">Updates</h3>
      <div class="srow"><div class="grow"><b>Offer new versions</b><small class="muted">You have BlogPulse ${esc(S.version)}. Checked each time BlogPulse opens.</small></div><button class="switch ${S.settings.checkUpdates ? "on" : ""}" data-act="toggle" data-v="checkUpdates" aria-label="Offer new versions"></button></div>
      <div class="srow"><div class="grow"><b>Check for updates now</b><small id="updmsg" class="muted" aria-live="polite"></small></div><button class="sm" data-act="updcheck">Check</button></div>
      <div class="srow"><div class="grow"><b>Start-up log</b><small class="muted">What happened the last times BlogPulse opened</small></div><button class="sm" data-act="startlog">Show</button></div>
      <pre id="startlog" class="startlog" hidden></pre>
      <h3 class="sec">AI</h3>
      <div class="srow"><div class="grow"><b>Keys, models and token usage</b><small class="muted">${S.settings.hasKey ? `${PN[S.ai.provider]} — ${esc(S.ai.model[S.ai.provider])}${S.ai.usage.p[S.ai.provider] ? " — " + fmtN(S.ai.usage.p[S.ai.provider].in + S.ai.usage.p[S.ai.provider].out) + " tokens used" : ""}` : "Add a Claude or OpenAI key for summaries, Story and TL;DR"}</small></div>
        <button class="sm ${S.settings.hasKey ? "" : "primary"}" data-act="aiopen">AI settings</button></div>
      ${S.cfgSchema.map(sec => `<h3 class="sec">${esc(sec.title)}</h3>${sec.items.map(field).join("")}`).join("")}
      <div class="aic-btns cfg-foot"><span class="note">${changed ? changed + " setting" + (changed === 1 ? "" : "s") + " changed" : "All settings are at their original values"}</span>
        ${changed ? `<button class="sm danger ${cfgArmed ? "armed" : ""}" data-act="cfgall">${cfgArmed ? "Confirm reset" : "Reset all"}</button>` : ""}</div>
      ${builtWithHTML()}
    </div>`;
    el.scrollTop = keepTop;
  }
  let aiOpen = false, aiArmed = null; const aiLoading = new Set();
  const PN = { anthropic: "Claude", openai: "OpenAI" };
  const FEAT = { summaries: "Summaries and categories", story: "Story", tldr: "TL;DR", invite: "Invites", test: "Connection tests", speech: "Read aloud", other: "Other" };
  const fmtN = n => n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e4 ? Math.round(n / 1e3) + "k" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n);
  function arm(key) { aiArmed = key; renderAI(); setTimeout(() => { if (aiArmed === key) { aiArmed = null; renderAI(); } }, 3500); }
  function usageBlock(p, P) {
    const days = [], now = new Date();
    for (let i = 13; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`); }
    const tot = k => { const x = P.days[k]; return x ? x.in + x.out : 0; };
    const max = Math.max(1, ...days.map(tot));
    const month = S.ai.today.slice(0, 7);
    const monthTot = Object.entries(P.days).filter(([k]) => k.startsWith(month)).reduce((n, [, x]) => n + x.in + x.out, 0);
    const rows = (obj, label) => Object.entries(obj).sort((x, y) => (y[1].in + y[1].out) - (x[1].in + x[1].out))
      .map(([k, x]) => `<tr><td>${esc(label(k))}</td><td>${x.calls}</td>${x.chars && !x.in ? `<td>${fmtN(x.chars)} chars</td><td>—</td>` : `<td>${fmtN(x.in)}</td><td>${fmtN(x.out)}</td>`}</tr>`).join("");
    return `<div class="ucard"><div class="aic-h"><b>${PN[p]}</b><span class="muted small">${P.calls} request${P.calls === 1 ? "" : "s"}</span></div>
      <div class="ustat"><div><b>${fmtN(P.in + P.out)}</b><small>total tokens</small></div><div><b>${fmtN(P.in)}</b><small>input</small></div><div><b>${fmtN(P.out)}</b><small>output</small></div></div>
      <p class="note">Today ${fmtN(tot(S.ai.today))} tokens — this month ${fmtN(monthTot)} tokens${P.chars ? ` — read aloud ${fmtN(P.chars)} characters` : ""}</p>
      <div class="ubars" aria-label="Tokens per day, last 14 days">${days.map(k => `<span style="height:${Math.max(tot(k) ? 6 : 2, tot(k) / max * 100)}%" class="${tot(k) ? "" : "zero"}" title="${k}: ${tot(k)} tokens"></span>`).join("")}</div>
      <div class="ubars-l"><span>2 weeks ago</span><span>Today</span></div>
      <table class="utab"><tr><th>Feature</th><th>Requests</th><th>In</th><th>Out</th></tr>${rows(P.features, k => FEAT[k] || k)}</table>
      <table class="utab"><tr><th>Model</th><th>Requests</th><th>In</th><th>Out</th></tr>${rows(P.models, k => k)}</table></div>`;
  }
  function renderAI() {
    const el = $("#aisheet"), keep = el.scrollTop;
    el.classList.toggle("open", aiOpen); lockBody();
    if (!aiOpen) return;
    const A = S.ai;
    const card = p => {
      const key = A.keys[p], ml = (A.models[p] || {}).list || [], cur = A.model[p];
      const opts = ml.some(m => m.id === cur) ? ml : [{ id: cur, name: cur }].concat(ml);
      return `<div class="aicard ${A.provider === p ? "active" : ""}">
        <div class="aic-h"><b>${PN[p]}</b>${A.provider === p ? `<span class="badge-ai">In use</span>` : key ? `<button class="sm" data-act="aiprov" data-v="${p}">Use ${PN[p]}</button>` : ""}</div>
        <div class="aic-row"><span class="lbl">API key</span>${key ? `<code>${esc(key)}</code>` : `<span class="muted">Not set</span>`}</div>
        <div class="aic-btns"><button class="sm ${key ? "" : "primary"}" data-act="aikey" data-v="${p}">${key ? "Change key" : "Add key"}</button>
          ${key ? `<button class="sm" data-act="aitest" data-v="${p}">Test connection</button><button class="sm danger ${aiArmed === "rm" + p ? "armed" : ""}" data-act="airm" data-v="${p}">${aiArmed === "rm" + p ? "Confirm" : "Remove"}</button>` : ""}</div>
        <label class="aic-row lbl" for="ms-${p}">Model</label>
        <select id="ms-${p}" class="modelsel" data-p="${p}">${opts.map(m => `<option value="${esc(m.id)}" ${m.id === cur ? "selected" : ""}>${esc(m.name)}${m.name !== m.id ? " — " + esc(m.id) : ""}</option>`).join("")}</select>
        <div class="aic-btns"><button class="sm" data-act="aimodels" data-v="${p}" ${key && !aiLoading.has(p) ? "" : "disabled"}>${aiLoading.has(p) ? "Loading…" : ml.length ? "Refresh model list" : "Load my models"}</button>
          <span class="note">${ml.length ? `${ml.length} models, updated ${rel(A.models[p].at)}` : key ? "Loads the models your key can use" : "Add a key to load models"}</span></div>
      </div>`;
    };
    const used = Object.keys(A.usage.p).filter(p => A.usage.p[p].calls);
    el.innerHTML = `<div class="sh-head"><h2>AI</h2><button class="link" data-act="aiclose">Done</button></div><div class="sh-body">
      <p class="hint">Keys stay in this iPhone's Keychain. Only the provider marked “In use” is called.</p>
      ${card("anthropic")}${card("openai")}
      <h3 class="sec">What AI does</h3>
      <div class="srow"><div class="grow"><b>Summarise and categorise new posts</b><small class="muted">One request per check; TL;DR, Story and invites run only when you ask</small></div><button class="switch ${S.settings.ai ? "on" : ""}" data-act="toggle" data-v="ai" aria-label="Summarise and categorise new posts"></button></div>
      <h3 class="sec">Token usage</h3>
      ${used.length ? used.map(p => usageBlock(p, A.usage.p[p])).join("") : `<p class="muted pad">No AI requests yet.</p>`}
      ${used.length ? `<div class="aic-btns"><span class="note">Counting since ${new Date(A.usage.since).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
        <button class="sm danger ${aiArmed === "reset" ? "armed" : ""}" data-act="usagereset">${aiArmed === "reset" ? "Confirm reset" : "Reset counters"}</button></div>` : ""}
    </div>`;
    el.scrollTop = keep;
  }
  let category = S.settings.category || "all";
  const catInfo = id => (S.categories || []).find(c => c.id === id) || { id, label: "Other", color: "#94a3b8" };
  function catsPresent() {
    const n = {};
    for (const a of S.articles) { const x = n[a.cat] = n[a.cat] || { n: 0, un: 0 }; x.n++; if (!a.read) x.un++; }
    return S.categories.filter(c => n[c.id]).map(c => Object.assign({}, c, n[c.id]));
  }
  const inCat = a => category === "all" || a.cat === category;
  function setCat(v) {
    if (v === category) return;
    category = v; srcFilter = null; keep.clear(); limit = pageSize();
    send("set", { k: "category", v });
    if (view === "story") requestStory(false);
    render(); scrollTo(0, 0);
    const el = document.querySelector(`#cats [data-v="${v}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: "center", block: "nearest" });
  }
  const TL_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h8M2.5 12h5"/></svg>`;
  const CHEV = `<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>`;
  const tlBtn = (a, mini) => `<button class="tlbtn ${mini ? "mini" : ""} ${expanded.has(a.id) ? "on" : ""}" data-act="tldr" data-id="${a.id}" aria-expanded="${expanded.has(a.id)}" aria-label="${expanded.has(a.id) ? "Hide" : "Show"} TL;DR">${TL_ICON}TL;DR${CHEV}</button>`;
  function inlineTldr(a) {
    if (!expanded.has(a.id)) return "";
    const d = tl[a.id];
    if (!d || d === "loading") return `<div class="tli"><div class="tli-load" role="status"><span class="busy-dot"></span>${S.settings.hasKey ? "Reading and summarising the article…" : "Reading the article…"}</div></div>`;
    if (d.error) return `<div class="tli"><p class="err">${esc(d.error)}.</p><div class="tli-act"><button class="sm" data-act="tldrretry" data-id="${a.id}">Try again</button><button class="hide" data-act="tldr" data-id="${a.id}">Hide</button></div></div>`;
    return `<div class="tli">
      <div class="tli-top">${d.kind === "ai" ? `<span class="badge-ai">✦ AI summary by ${d.provider === "openai" ? "OpenAI" : "Claude"}</span>` : `<span class="badge-ex">Extracted — no AI</span>`}${d.mins ? `<span>${d.mins} min read</span>` : ""}</div>
      ${d.partial ? `<p class="note">The full page couldn't be read, so this uses the feed excerpt.</p>` : ""}
      <p class="tli-lead">${esc(d.lead)}</p>
      ${d.points && d.points.length ? `<ul>${d.points.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${d.why ? `<p class="tli-why"><b>Why it matters:</b> ${esc(d.why)}</p>` : ""}
      ${!d.why && d.sections && d.sections.length ? `<p class="tli-why"><b>Covers:</b> ${d.sections.map(esc).join(" / ")}</p>` : ""}
      <div class="tli-act">
        <button class="sm" data-act="listentldr" data-id="${a.id}">${SPK}Listen</button>
        <button class="sm" data-act="tldrpanel" data-id="${a.id}">${S.settings.hasKey ? "✦ " : ""}Invite to read</button>
        ${d.kind !== "ai" && S.settings.hasKey ? `<button class="sm" data-act="tldrretry" data-id="${a.id}">✦ Summarise with AI</button>` : ""}
        <button class="hide" data-act="tldr" data-id="${a.id}">Hide</button>
      </div>
    </div>`;
  }
  function refreshInline(id) {
    if (view === "story") return renderStory();
    const a = byId(id); if (a) refreshCard(a);
  }
  const inv = { open: false, who: "", instr: "", busy: false, out: {} };
  const presets = () => S.cfg.invitePresets || [];
  const pageSize = () => S.cfg.pageSize || 250;
  let srcFilter = null, sheetOpen = false, results = null, searching = false, progress = null, armed = null, limit = S.cfg.pageSize || 250, storyBusy = false;
  const keep = new Set(), adding = new Set(), added = new Set();
  let groupIdx = {};
  const DAY = 864e5;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = id => S.articles.find(a => a.id === id);
  const srcMap = () => Object.fromEntries(S.sources.map(s => [s.id, s]));
  const host = u => String(u).replace(/^https?:\/\/(www\.)?/i, "").split(/[\/?#]/)[0];

  // ---- appearance ----
  const THEMES = [["auto", "Auto"]].concat(Object.keys(S.palettes).map(k => [k, k[0].toUpperCase() + k.slice(1)]));
  const dark = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  function applyLook() {
    const root = document.documentElement;
    root.dataset.theme = look.theme === "auto" ? (dark.matches ? "night" : "ink") : look.theme;
    root.dataset.font = look.font;
    root.style.setProperty("--ts", look.textSize);
    document.body.classList.remove("d-comfortable", "d-compact", "d-tiny");
    document.body.classList.add("d-" + look.density);
  }
  const onDark = () => { if (look.theme === "auto") applyLook(); };
  if (dark.addEventListener) dark.addEventListener("change", onDark); else if (dark.addListener) dark.addListener(onDark);
  const segRow = (k, opts) => `<div class="seg wide">${opts.map(([v, l]) => `<button class="${String(look[k]) === String(v) ? "on" : ""}" data-act="look" data-k="${k}" data-v="${v}">${l}</button>`).join("")}</div>`;
  function lookHTML() {
    return `
      <div class="lk-row"><span class="lk-l">Colours</span><div class="sws">${THEMES.map(t => `
        <button class="sw ${look.theme === t[0] ? "on" : ""}" data-act="look" data-k="theme" data-v="${t[0]}" aria-label="${t[1]} colours">
          <span class="prev" style="${t[0] === "auto" ? `background:linear-gradient(135deg,${S.palettes.ink.paper} 50%,${S.palettes.night.sheet} 50%);color:${S.palettes.night.signal}` : `background:${S.palettes[t[0]].paper};color:${S.palettes[t[0]].ink}`}">Aa<i style="background:${(S.palettes[t[0]] || S.palettes.night).signal}"></i></span>
          <small>${t[1]}</small></button>`).join("")}</div></div>
      <div class="lk-row"><span class="lk-l">Layout</span>${segRow("density", [["comfortable", "Comfortable"], ["compact", "Compact"], ["tiny", "Tiny"]])}</div>
      <div class="lk-row"><span class="lk-l">Text size</span>${segRow("textSize", [[0.92, "Small"], [1, "Default"], [1.12, "Large"], [1.25, "Larger"]])}</div>
      <div class="lk-row"><span class="lk-l">Headline font</span>${segRow("font", [["sans", "Sans serif"], ["serif", "Serif"]])}</div>`;
  }

  // ---- bridge → Scriptable (queued so rapid taps aren't lost) ----
  const q = []; let flushing = false;
  const pending = {}; let reqN = 0;
  function send(type, data, cb) {
    const m = Object.assign({ type }, data);
    if (cb) { m.req = "r" + (++reqN); pending[m.req] = cb; }
    q.push(m); if (!flushing) flush();
  }
  window.__done = (req, ok, msg) => { const cb = pending[req]; delete pending[req]; if (cb) cb(ok, msg); };
  function flush() {
    const m = q.shift();
    if (!m) { flushing = false; return; }
    flushing = true;
    location.href = "blogpulse://a?d=" + encodeURIComponent(JSON.stringify(m));
    setTimeout(flush, 80);
  }

  // ---- bridge ← Scriptable ----
  window.recv = st => {
    S = st;
    if (view === "story" && !S.settings.hasKey) view = "unread";
    adding.forEach(f => { if (S.sources.some(s => s.feed === f)) adding.delete(f); });
    aiLoading.clear();
    render(); renderSheet(); renderAI(); renderCfg();
  };
  // ── update pitch ──
  window.__showUpdate = function (u) {
    if (!u || document.getElementById("upd")) return;
    var ov = document.createElement("div"); ov.id = "upd";
    var cards = (u.highlights || []).map(function (h) {
      return '<div class="updi"><span class="updic">' + escH(h.icon || "✨") + "</span><div><b>" +
        escH(h.title) + "</b><span>" + escH(h.text || "") + "</span></div></div>";
    }).join("");
    var more = u.skipped > 1 ? " (and " + (u.skipped - 1) + " more update" + (u.skipped > 2 ? "s" : "") + ")" : "";
    ov.innerHTML = '<div class="updp" role="dialog" aria-label="Update available">' +
      '<div class="updtag">New version ' + escH(u.latest) + "</div>" +
      '<h2 class="updt">' + escH(u.title || "An update is ready") + "</h2>" +
      '<div class="upds">You have ' + escH(u.current) + more + ". Here’s what you get:</div>" +
      '<div class="updl">' + cards + "</div>" +
      '<div class="updmsg" aria-live="polite"></div>' +
      '<button class="primary updgo" data-act="upd-now">Update now</button>' +
      '<button class="updlater" data-act="upd-later">Later</button></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov) updLater(); });   // outside = Later
  };
  function escH(t) { var d = document.createElement("div"); d.textContent = String(t == null ? "" : t); return d.innerHTML; }
  function updLater() { var ov = document.getElementById("upd"); if (!ov) return; ov.remove(); send("update-later", {}); }
  function updNow(btn) {
    var ov = document.getElementById("upd"), msg = ov.querySelector(".updmsg"), later = ov.querySelector(".updlater");
    btn.disabled = true; btn.textContent = "Updating…"; later.hidden = true; msg.textContent = "";
    send("update-now", {}, function (ok, res) {
      if (ok) {
        ov.querySelector(".updtag").textContent = "Updated to " + res;
        msg.innerHTML = "<b>✓ Done.</b> Close BlogPulse and open it again to start using the new version.";
        btn.disabled = false; btn.textContent = "Got it"; btn.dataset.act = "upd-close";
      } else {
        msg.textContent = res || "Update failed"; btn.disabled = false; btn.textContent = "Try again"; later.hidden = false;
      }
    });
  }
  window.onProgress = (d, t) => {
    progress = t ? [d, t] : null; renderStatus();
    if (!progress && ptr.busy) setTimeout(() => ptrReset(), 350);
  };
  window.onDiscover = res => { results = res; searching = false; renderSheet(); };
  window.addDone = (feed, ok) => { adding.delete(feed); if (ok) added.add(feed); renderSheet(); };
  window.onInvite = (id, r) => {
    inv.busy = false;
    if (r.error) toast("Invite not written: " + r.error); else inv.out[id] = r;
    if (tldrId === id) renderTldr();
  };
  // ── Read aloud: system voices through the Web Speech API ──
  const SYN = window.speechSynthesis;
  const SPK = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>`;
  const GENDER = {};
  ("Samantha Karen Moira Tessa Fiona Veena Victoria Allison Ava Susan Zoe Nicky Kate Serena Martha Catherine Isha Agnes Kathy Princess Vicki Joelle Flo Sandy Shelley Grandma " +
   "Amélie Audrey Aurélie Marie Anna Petra Helena Alice Federica Paulina Mónica Monica Marisol Luciana Joana Milena Katya Yuna Kyoko Ting-Ting Tingting Sin-ji Mei-Jia Meijia " +
   "Lekha Sara Nora Ellen Laura Zuzana Ioana Mariska Melina Yelda Damayanti Kanya Lesya Carmit Laila Amira Tünde Linh Montse Ewa Zosia Iveta Lana Satu Klara Alva Kristina Ellen Soumya Vani")
    .split(" ").forEach(n => GENDER[n] = "f");
  ("Daniel Alex Fred Aaron Arthur Rishi Oliver Tom Gordon Lee Evan Nathan Rocko Eddy Reed Ralph Grandpa Thomas Jacques Markus Yannick Luca Diego Jorge Juan Carlos Felipe Xander " +
   "Maged Majed Tarik Otoya Hattori Li-mu Yu-shu Aman Neel Dariush Rodrigo Martin Henrik Magnus Oskar Viktor Tünde")
    .split(" ").forEach(n => GENDER[n] = GENDER[n] || "m");
  const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Pipe Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Deranged|Hysterical)\b/i;
  const baseName = v => v.name.replace(/\s*\((Enhanced|Premium|Compact)\)/i, "").replace(/\s*\(.*\)\s*$/, "").trim();
  const quality = v => /premium/i.test(v.name + v.voiceURI) ? "Premium" : /enhanced/i.test(v.name + v.voiceURI) ? "Enhanced" : "";
  const genderOf = v => GENDER[baseName(v)] || "";
  let voices = [];
  function loadVoices() { voices = SYN ? SYN.getVoices().filter(v => !NOVELTY.test(v.name)) : []; if (cfgOpen) renderCfg(); }
  if (SYN) { loadVoices(); SYN.addEventListener ? SYN.addEventListener("voiceschanged", loadVoices) : (SYN.onvoiceschanged = loadVoices); }
  function currentVoice() {
    if (!voices.length) return null;
    const saved = voices.find(v => v.voiceURI === S.settings.voiceURI);
    if (saved) return saved;
    const en = voices.filter(v => /^en(-|_|$)/i.test(v.lang));   // posts are mostly English
    const rank = v => (quality(v) === "Premium" ? 3 : quality(v) === "Enhanced" ? 2 : 0) + (v.default ? 1 : 0) + (/en-(US|GB)/i.test(v.lang) ? 0.5 : 0);
    return (en.length ? en : voices).slice().sort((x, y) => rank(y) - rank(x))[0];
  }
  const langName = code => { try { return new Intl.DisplayNames([navigator.language || "en"], { type: "language" }).of(code) || code; } catch (e) { return code; } };
  const clean = t => String(t || "").replace(/\s*\[\d+(?:\s*,\s*\d+)*\]/g, "").replace(/\*\*|__/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  function chunks(t) {   // short pieces: long utterances can stop early in WebKit
    const out = [];
    for (let sen of clean(t).match(/[^.!?…]+[.!?…]+["”’)]*\s*|[^.!?…]+$/g) || []) {
      sen = sen.trim(); if (!sen) continue;
      while (sen.length > 220) { let cut = sen.lastIndexOf(", ", 220); if (cut < 80) cut = sen.lastIndexOf(" ", 220); if (cut < 40) cut = 220; out.push(sen.slice(0, cut + 1).trim()); sen = sen.slice(cut + 1).trim(); }
      if (out.length && out[out.length - 1].length + sen.length < 160) out[out.length - 1] += " " + sen; else out.push(sen);
    }
    return out;
  }
  const tts = { parts: [], i: 0, label: "", items: [], token: 0, paused: false, on: false, timer: null, engine: "device", loading: false };
  // AI voice: OpenAI speech, played through one <audio> element that a tap unlocks first
  const OAI_VOICES = [["alloy", "n"], ["ash", "m"], ["ballad", "m"], ["coral", "f"], ["echo", "m"], ["fable", "m"], ["nova", "f"], ["onyx", "m"], ["sage", "f"], ["shimmer", "f"], ["verse", "m"], ["marin", "f"], ["cedar", "m"]];
  const LEGACY_TTS = new Set(["alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"]);
  const aiTTS = () => S.settings.speechEngine === "ai" && S.settings.hasOpenAI;
  const au = new Audio(); au.preload = "auto"; au.setAttribute("playsinline", "");
  const SILENT = (() => {   // 0.1 s of silence as a WAV, to unlock audio inside the tap
    const n = 800, buf = new Uint8Array(44 + n), dv = new DataView(buf.buffer);
    const w = (o, t) => { for (let i = 0; i < t.length; i++) buf[o + i] = t.charCodeAt(i); };
    w(0, "RIFF"); dv.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); w(36, "data"); dv.setUint32(40, n, true); buf.fill(128, 44);
    let str = ""; buf.forEach(b => { str += String.fromCharCode(b); }); return "data:audio/wav;base64," + btoa(str);
  })();
  function unlockAudio() { try { au.src = SILENT; const p = au.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
  function aiChunks(t) {   // split at sentences: a short first piece so audio starts quickly, then up to ~2,000 characters
    const out = []; let cur = "";
    for (const sen of clean(t).match(/[^.!?…]+[.!?…]+["”’)]*\s*|[^.!?…]+$/g) || []) {
      if (cur && (cur + sen).length > (out.length ? 2000 : 700)) { out.push(cur.trim()); cur = ""; }
      cur += sen;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function aiFetch(part) {
    if (part.audio) return Promise.resolve(part.audio);
    if (!part.pending) part.pending = new Promise((res, rej) => send("ttsaudio", { text: part.t }, (ok, msg) => ok ? res(part.audio = msg) : rej(msg)));
    return part.pending;
  }
  function aiPlayPart() {
    const my = ++tts.token, part = tts.parts[tts.i];
    if (!part) return stopSpeaking();
    tts.loading = !part.audio; renderPlayer();
    aiFetch(part).then(b64 => {
      if (my !== tts.token) return;
      tts.loading = false;
      au.onended = () => { if (my !== tts.token) return; part.audio = null; tts.i++; aiPlayPart(); };
      au.src = "data:audio/mpeg;base64," + b64;
      if (!tts.paused) {
        const pr = au.play();
        if (pr && pr.catch) pr.catch(() => { if (my === tts.token) { tts.paused = true; renderPlayer(); toast("Tap play to start the AI voice"); } });
      }
      renderPlayer();
      const nx = tts.parts[tts.i + 1]; if (nx) aiFetch(nx).catch(() => {});   // the next piece is ready before this one ends
    }).catch(err => {
      if (my !== tts.token) return;
      const rest = tts.items.slice(part.k), label = tts.label;
      toast(`AI voice failed: ${String(err || "").slice(0, 70)}. Using the iPhone voice.`);
      if (SYN && voices.length) speak(label, rest, "device"); else stopSpeaking();
    });
  }
  const playSoon = () => { clearTimeout(tts.timer); tts.timer = setTimeout(playPart, 60); };   // iOS needs a beat after cancel()
  function speak(label, items, engine) {
    const ai = engine ? engine === "ai" : aiTTS();
    if (!ai && (!SYN || !voices.length)) {   // no Web Speech: hand the text to Scriptable's system voice
      send("speak", { text: items.map(x => clean(x.text)).join(" ") });
      return toast("Reading aloud with the system voice");
    }
    stopSpeaking(true);
    if (ai) unlockAudio();   // has to happen inside the tap, before any waiting
    tts.engine = ai ? "ai" : "device";
    tts.items = items; tts.label = label; tts.i = 0; tts.paused = false; tts.on = true;
    tts.parts = [];
    items.forEach((it, k) => (ai ? aiChunks : chunks)(it.text).forEach(t => tts.parts.push({ t, k })));
    if (!tts.parts.length) return stopSpeaking();
    playSoon();
  }
  function playPart() {
    if (tts.engine === "ai") return aiPlayPart();
    const my = ++tts.token, part = tts.parts[tts.i];
    if (!part) return stopSpeaking();
    const u = new SpeechSynthesisUtterance(part.t), v = currentVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = Number(S.settings.voiceRate) || 1; u.pitch = Number(S.settings.voicePitch) || 1;
    const next = () => { if (my !== tts.token) return; tts.i++; playPart(); };
    u.onend = next; u.onerror = e => { if (e.error !== "interrupted" && e.error !== "canceled") next(); };
    SYN.speak(u); renderPlayer();
  }
  function stopSpeaking(quiet) {
    tts.token++; tts.on = false; tts.paused = false; tts.loading = false; clearTimeout(tts.timer);
    au.onended = null; try { au.pause(); } catch (e) {}
    if (SYN) SYN.cancel();
    if (!quiet) renderPlayer();
  }
  function togglePause() {
    if (!tts.on) return;
    if (tts.engine === "ai") {
      if (tts.paused) { tts.paused = false; if (!tts.loading) { const pr = au.play(); if (pr && pr.catch) pr.catch(() => {}); } }
      else { tts.paused = true; au.pause(); }
    } else if (tts.paused) { SYN.resume(); tts.paused = false; } else { SYN.pause(); tts.paused = true; }
    renderPlayer();
  }
  function skipItem() {
    if (!tts.on) return;
    const k = (tts.parts[tts.i] || {}).k, j = tts.parts.findIndex((p, n) => n > tts.i && p.k !== k);
    if (j < 0) return stopSpeaking();
    tts.token++; if (tts.engine === "ai") { au.onended = null; au.pause(); } else SYN.cancel();
    tts.i = j; tts.paused = false; playSoon();
  }
  function renderPlayer() {
    const pl = $("#player"), on = tts.on;
    pl.hidden = !on; document.body.classList.toggle("playing", on);
    document.querySelectorAll(".speaking").forEach(el => el.classList.remove("speaking"));
    if (!on) return;
    const part = tts.parts[tts.i] || {}, it = tts.items[part.k] || {};
    $("#plTitle").textContent = it.title || tts.label;
    $("#plSub").textContent = (tts.engine === "ai" ? "✦ AI voice — " : "") + tts.label + (tts.items.length > 1 ? ` — ${part.k + 1} of ${tts.items.length}` : "")
      + (tts.loading ? " — preparing…" : tts.paused ? " — paused" : "");
    pl.classList.toggle("paused", tts.paused);
    $("#plPause").innerHTML = tts.paused ? PLAY_ICO : PAUSE_ICO;
    $("#plPause").setAttribute("aria-label", tts.paused ? "Resume" : "Pause");
    if (it.id) { const c = document.getElementById("c-" + it.id); if (c) c.classList.add("speaking"); }
  }
  const PLAY_ICO = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`, PAUSE_ICO = `<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>`;
  const srcTitle = a => (srcMap()[a.src] || {}).title || "";
  const postItem = a => ({ id: a.id, title: a.title, text: `${a.title}. From ${srcTitle(a)}. ${a.desc || ""}` });
  function tldrItems(a, d) {
    const parts = [d.lead].concat(d.points || []).concat(d.why ? ["Why it matters: " + d.why] : []);
    return [{ id: a.id, title: a.title, text: `${a.title}. From ${srcTitle(a)}. ${parts.map(x => /[.!?]$/.test(x) ? x : x + ".").join(" ")}` }];
  }
  function storyItems(st) {
    const items = [{ title: st.headline, text: `${st.headline}. ${st.dek || ""}` }];
    if (st.tldr && st.tldr.length) items.push({ title: "In short", text: "In short. " + st.tldr.map(x => clean(x).replace(/[.!?]?$/, ".")).join(" ") });
    st.sections.forEach(x => items.push({ title: x.title, text: `${x.title}. ${x.body}` }));
    return items;
  }
  window.onArticleText = (id, r) => {
    const a = byId(id); if (!a) return;
    if (r.error) return toast(r.error);
    speak("Full article", [{ id, title: a.title, text: `${a.title}. From ${srcTitle(a)}. ${r.paras.join(" ")}` }]);
    if (r.partial) toast("The full page couldn't be read, so this is the excerpt");
  };

  window.onTldr = (id, d) => { tl[id] = d; if (tldrId === id) renderTldr(); if (expanded.has(id)) refreshInline(id); };
  window.onStory = busy => { storyBusy = !!busy; if (view === "story") render(); };
  window.onPicks = pk => {
    for (const a of S.articles) a.pick = pk.picks[a.id] || 0;
    S.picksReady = pk.ready; S.rated = pk.n;
    if (view !== "story") render(); else renderChrome();
  };
  window.toast = msg => {
    const t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(window.__tt); window.__tt = setTimeout(() => t.classList.remove("on"), 3000);
  };

  // ---- time helpers ----
  const sod = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const sow = ts => { const d = new Date(sod(ts)); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); };
  function isoWeek(ts) {
    const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const w1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - w1) / DAY - 3 + (w1.getDay() + 6) % 7) / 7);
  }
  function rel(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    if (s < 7 * 86400) return Math.floor(s / 86400) + " d ago";
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  const md = (ts, o) => new Date(ts).toLocaleDateString(undefined, o || { month: "short", day: "numeric" });
  function label(k) {
    if (group === "day") {
      const t = sod(Date.now()), y = new Date(t); y.setDate(y.getDate() - 1);
      if (k === t) return ["Today", md(k, { weekday: "long", month: "long", day: "numeric" })];
      if (k === y.getTime()) return ["Yesterday", md(k, { weekday: "long", month: "long", day: "numeric" })];
      return [md(k, { weekday: "long" }), md(k, { month: "long", day: "numeric" })];
    }
    const w = sow(Date.now()), lw = new Date(w); lw.setDate(lw.getDate() - 7);
    const range = md(k) + " – " + md(k + 6 * DAY);
    if (k === w) return ["This week", range];
    if (k === lw.getTime()) return ["Last week", range];
    return ["Week " + isoWeek(k), range];
  }
  const keyOf = ts => group === "week" ? sow(ts) : sod(ts);

  // ---- filtering ----
  const visible = a => !a.read || keep.has(a.id);
  function match(a) {
    if (!inCat(a)) return false;
    if (srcFilter && a.src !== srcFilter) return false;
    if (view === "unread") return visible(a);
    if (view === "new") return a.isNew;
    if (view === "picks") return !!a.pick && visible(a);
    if (view === "rated") return a.rating > 0;
    return true;
  }
  function counts() {
    const c = { unread: 0, new: 0, picks: 0, rated: 0, all: 0 };
    for (const a of S.articles) {
      if (!inCat(a) || (srcFilter && a.src !== srcFilter)) continue;
      c.all++; if (!a.read) c.unread++; if (a.isNew && !a.read) c.new++; if (a.pick && !a.read) c.picks++; if (a.rating) c.rated++;
    }
    return c;
  }

  // ---- chrome ----
  const TABS = () => (S.settings.hasKey ? [["story", "Story"]] : []).concat([["unread", "Unread"], ["new", "New"], ["picks", "Picks"], ["rated", "Rated"], ["all", "All"]]);
  function renderStatus() {
    const st = $("#status"), bar = $("#bar");
    st.textContent = progress ? `Checking ${progress[0]} of ${progress[1]} blogs…` : S.lastScan ? `Checked ${rel(S.lastScan)}` : "Not checked yet";
    bar.style.width = progress ? Math.max(4, progress[0] / Math.max(1, progress[1]) * 100) + "%" : "0";
    $("#top").classList.toggle("busy", !!progress);
  }
  function renderCats() {
    const present = catsPresent();
    if (category !== "all" && !present.some(c => c.id === category)) category = "all";
    const un = S.articles.filter(a => !a.read).length;
    $("#cats").innerHTML = present.length < 2 ? "" :
      `<button class="cat-pill ${category === "all" ? "on" : ""}" data-act="cat" data-v="all">All topics${un ? `<i>${un}</i>` : ""}</button>` +
      present.map(c => `<button class="cat-pill ${category === c.id ? "on" : ""}" data-act="cat" data-v="${c.id}" style="--c:${c.color}"><span class="cdot"></span>${esc(c.label)}${c.un ? `<i>${c.un}</i>` : ""}</button>`).join("");
  }
  function renderChrome() {
    renderCats();
    const c = counts();
    $("#top").classList.toggle("storymode", view === "story");
    $("#tabs").innerHTML = TABS().map(([k, l]) =>
      `<button class="tab ${k === "story" ? "story-tab" : ""} ${view === k ? "on" : ""}" data-act="view" data-v="${k}">${l}${c[k] && ["unread", "new", "picks"].includes(k) ? `<i>${c[k]}</i>` : ""}</button>`).join("");
    $("#grp").innerHTML = ["day", "week"].map(g => `<button class="${group === g ? "on" : ""}" data-act="group" data-v="${g}">${g === "day" ? "By day" : "By week"}</button>`).join("");
    const un = {};
    for (const a of S.articles) if (!a.read) un[a.src] = (un[a.src] || 0) + 1;
    const inThis = new Set(S.articles.filter(inCat).map(a => a.src));
    const srcs = S.sources.filter(s => inThis.has(s.id));
    $("#chips").innerHTML = srcs.length < 2 ? "" :
      `<button class="chip ${!srcFilter ? "on" : ""}" data-act="chip" data-v="">All blogs</button>` +
      srcs.slice().sort((x, y) => (un[y.id] || 0) - (un[x.id] || 0)).map(s =>
        `<button class="chip ${srcFilter === s.id ? "on" : ""}" data-act="chip" data-v="${s.id}">${esc(s.title)}${un[s.id] ? `<i>${un[s.id]}</i>` : ""}</button>`).join("");
    document.documentElement.style.setProperty("--hh", $("#top").offsetHeight + "px");
  }

  // ---- list ----
  function card(a, sm) {
    const s = sm[a.src] || {};
    const stars = [1, 2, 3].map(n => `<button class="star ${a.rating >= n ? "on" : ""}" data-act="rate" data-id="${a.id}" data-v="${n}" aria-label="Rate ${n} of 3">★</button>`).join("");
    const ci = catInfo(a.cat);
    const ctag = category === "all" ? `<span class="ctag" style="--c:${ci.color}" title="${a.catBy === "ai" ? "Category by AI" : "Category by keywords"}">${esc(ci.label)}</span>` : "";
    const cls = ["card", a.read ? "read" : "unread", a.isNew && !a.read ? "new" : "", a.pick ? "pick" : ""].join(" ");
    if (look.density === "tiny") return `<article class="${cls} tiny" id="c-${a.id}">
      <button class="tick" data-act="read" data-id="${a.id}" aria-label="${a.read ? "Mark unread" : "Mark read"}"></button>
      <div class="tmain" data-act="open" data-id="${a.id}"><h3>${a.pick ? `<span class="pk" aria-label="Pick for you">✦</span>` : ""}${esc(a.title)}</h3>
        <div class="meta"><span class="ml"><span class="src">${esc(s.title || "Removed blog")}</span>${ctag}</span><span class="when">${rel(a.pub)}</span></div></div>
      ${tlBtn(a, true)}
      <div class="stars mini ${a.rating ? "rated" : ""}">${stars}</div>${inlineTldr(a)}</article>`;
    return `<article class="${cls}" id="c-${a.id}">
      <div class="meta"><span class="ml"><span class="src">${esc(s.title || "Removed blog")}</span>${ctag}</span><span class="when">${rel(a.pub)}</span></div>
      <h3 data-act="open" data-id="${a.id}">${esc(a.title)}</h3>
      ${a.desc ? `<p class="desc" data-act="open" data-id="${a.id}">${a.ai ? `<span class="ai">AI summary</span>` : ""}${esc(a.desc)}</p>` : ""}
      ${inlineTldr(a)}
      <div class="row">
        <div class="stars ${a.rating ? "rated" : ""}">${stars}</div>
        ${a.isNew && !a.read ? `<span class="flag new">New</span>` : ""}${a.pick ? `<span class="flag pick">✦ Pick</span>` : ""}
        <span class="acts">${tlBtn(a)}<button class="readbtn" data-act="read" data-id="${a.id}">${a.read ? "Mark unread" : "Mark read"}</button></span>
      </div>
    </article>`;
  }
  function emptyState() {
    if (!S.sources.length) return `<div class="empty"><svg class="idleMark" viewBox="0 0 240 240" role="img" aria-label="BlogPulse logo"><path d="M52 72 H188 M136 168 H172" fill="none" stroke="#F6F7F9" stroke-opacity="0.35" stroke-width="7" stroke-linecap="round"/><path d="M46 120 H82 L98 88 L120 152 L138 102 L150 120 H166" fill="none" stroke="#F6F7F9" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><circle cx="186" cy="120" r="13" fill="#A78BFA"/><path d="M52 168 H116" fill="none" stroke="#2DD4BF" stroke-width="7" stroke-linecap="round"/></svg><h2>Follow your first blog</h2><p>Search for a company or paste any blog address. Every followed blog is checked each time you open the app.</p><button class="primary" data-act="sheet">Add blogs</button></div>`;
    const msg = {
      unread: ["You're all caught up", "New posts appear here after the next check."],
      new: ["Nothing new since your last visit", "Tap refresh to check again."],
      picks: S.picksReady ? ["No picks right now", "Picks are unread posts similar to the ones you rated ★★★."] : ["Picks learn from your ratings", `Rate at least 4 posts to switch Picks on. You've rated ${S.rated}.`],
      rated: ["No ratings yet", "Tap the stars under any post — ★★★ means you'd like more like it."],
      all: ["No posts yet", "Check your blogs with the refresh button."],
    }[view];
    return `<div class="empty"><h2>${msg[0]}</h2><p>${msg[1]}</p></div>`;
  }
  function render() {
    applyLook(); renderStatus(); renderChrome();
    if (view === "story") return renderStory();
    const list = S.articles.filter(match);
    if (!list.length) { $("#list").innerHTML = emptyState(); return; }
    const sm = srcMap(); groupIdx = {};
    const groups = [];
    for (const a of list.slice(0, limit)) {
      const k = keyOf(a.pub);
      if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, items: [] });
      groups[groups.length - 1].items.push(a);
    }
    groups.forEach(g => groupIdx[g.k] = g.items);
    const toMark = markAllIds();
    $("#list").innerHTML = (toMark.length ? `<div class="listbar"><span>${toMark.length} ${scopeName()}</span>
      <button class="sm" data-act="markallask">${CHECK_ICO}Mark all read</button></div>` : "") + groups.map(g => {
      const [big, small] = label(g.k), unread = g.items.filter(a => !a.read).length;
      return `<section><header class="gh"><div><h2>${big}</h2><span>${esc(small)}</span></div>
        <div class="gh-r"><span class="n">${g.items.length} post${g.items.length > 1 ? "s" : ""}</span><div class="gh-acts"><button class="gh-listen" data-act="listengroup" data-v="${g.k}" aria-label="Listen to ${esc(big)}">${SPK}Listen</button>${unread ? `<button data-act="markgroup" data-v="${g.k}">Mark ${unread} read</button>` : ""}</div></div></header>
        ${g.items.map(a => card(a, sm)).join("")}</section>`;
    }).join("") + (list.length > limit ? `<button class="more" data-act="more">Show ${Math.min(pageSize(), list.length - limit)} more</button>` : "");
  }
  // "Mark all read": every unread post on this page (topic, blog and tab), after a warning
  const CHECK_ICO = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none"/></svg>`;
  function markAllIds() {
    if (view === "story" || view === "rated") return [];
    return S.articles.filter(a => !a.read && inCat(a) && (!srcFilter || a.src === srcFilter)
      && (view !== "new" || a.isNew) && (view !== "picks" || a.pick)).map(a => a.id);
  }
  function scopeName() {   // "unread across all topics", "new in Finance", "picked in Finance, Helix AI Research"
    const word = view === "new" ? "new" : view === "picks" ? "picked" : "unread";
    const where = [category !== "all" ? catInfo(category).label : "", srcFilter ? (srcMap()[srcFilter] || {}).title || "" : ""].filter(Boolean);
    return `${word} ${where.length ? "in " + esc(where.join(", ")) : "across all topics"}`;
  }
  function confirmMarkAll() {
    const ids = markAllIds();
    if (!ids.length || document.getElementById("confirm")) return;
    const where = [category !== "all" ? catInfo(category).label : "", srcFilter ? (srcMap()[srcFilter] || {}).title || "" : ""].filter(Boolean);
    const scope = view === "new" ? "every new post" : view === "picks" ? "every picked post" : "every unread post";
    const ov = document.createElement("div"); ov.id = "confirm";
    ov.innerHTML = `<div class="updp" role="alertdialog" aria-labelledby="cft" aria-describedby="cfd">
      <div class="updtag warn">Heads up</div>
      <h2 class="updt" id="cft">Mark ${ids.length} post${ids.length === 1 ? "" : "s"} as read?</h2>
      <div class="upds" id="cfd">This marks ${scope}${where.length ? " in " + esc(where.join(", ")) : ", across all topics and blogs,"} as read, not only the day you're looking at. There's no single undo: you'd have to mark them unread one by one.</div>
      <button class="primary updgo danger-fill" data-act="markallgo">Mark ${ids.length} as read</button>
      <button class="updlater" data-act="markallcancel">Cancel</button></div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click", e => { if (e.target === ov) ov.remove(); });   // outside = Cancel
  }
  function refreshCard(a) {
    const el = document.getElementById("c-" + a.id);
    if (el) el.outerHTML = card(a, srcMap());
    renderChrome();
  }

  // ---- story ----
  function storyText(t, ids) {
    return String(t).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => {
      const h = esc(p).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\s*\[(\d+(?:\s*,\s*\d+)*)\]([.,;:!?)]?)/g, (m, g, punct) => `<span class="refw">${g.split(/\s*,\s*/).map(n =>
          ids[+n] ? `<button class="ref" data-act="open" data-id="${ids[+n]}" aria-label="Open post ${+n + 1}">${+n + 1}</button>` : "").join("")}${punct}</span>`);
      return `<p>${h}</p>`;
    }).join("");
  }
  function renderStory() {
    const st = S.story && S.story.scope === storyScope && (S.story.cat || "all") === category ? S.story : null;
    const scopes = [["new", "Since last visit"], ["today", "Today"], ["week", "This week"]];
    let h = `<div class="story-bar"><div class="seg">${scopes.map(([k, l]) => `<button class="${storyScope === k ? "on" : ""}" data-act="scope" data-v="${k}">${l}</button>`).join("")}</div></div>`;
    if (storyBusy || !st) {
      h += storyBusy
        ? `<div class="writing" role="status"><h2>Writing your story…</h2><p>Reading the latest posts and connecting the threads. This usually takes 20–40 seconds.</p><div class="ln"></div><div class="ln"></div><div class="ln s"></div></div>`
        : `<div class="empty"><h2>No story yet</h2><p>Blend the latest ${category !== "all" ? esc(catInfo(category).label) + " " : ""}posts from your blogs into one read.</p><button class="primary" data-act="rewrite">Write the story</button></div>`;
      $("#list").innerHTML = h; return;
    }
    const am = Object.fromEntries(S.articles.map(a => [a.id, a])), sm = srcMap();
    const posts = st.ids.map(id => am[id]).filter(Boolean);
    const blogs = new Set(posts.map(a => a.src)).size, unread = posts.filter(a => !a.read).length;
    h += `<article class="story">
      <p class="kicker"><span class="badge-ai">✦ AI-written${st.provider ? " by " + (st.provider === "openai" ? "OpenAI" : "Claude") : ""}</span> ${rel(st.at)} from ${posts.length} posts across ${blogs} blog${blogs === 1 ? "" : "s"}${category !== "all" ? " in " + esc(catInfo(category).label) : ""}</p>
      <h1 class="st-h">${esc(st.headline)}</h1>
      ${st.dek ? `<p class="dek">${esc(st.dek)}</p>` : ""}
      <button class="listen" data-act="listenstory">${SPK}Listen to the story</button>
      ${st.tldr && st.tldr.length ? `<div class="st-tldr"><div class="st-tldr-h"><b>TL;DR</b><span class="badge-ai">✦ AI</span></div><ul>${st.tldr.map(x => `<li>${storyText(x, st.ids).replace(/^<p>|<\/p>$/g, "")}</li>`).join("")}</ul></div>` : ""}
      ${st.stale ? `<div class="stale"><span>New posts arrived after this was written.</span><button data-act="rewrite">Rewrite</button></div>` : ""}
      ${st.mustRead && st.mustRead.length ? `<div class="must"><h2>Start with these</h2>${st.mustRead.map(m => { const a = am[m.id]; return a ? `<button class="mr" data-act="open" data-id="${a.id}"><b>${esc(a.title)}</b><small>${esc((sm[a.src] || {}).title || "")}</small><span>${esc(m.why)}</span></button>` : ""; }).join("")}</div>` : ""}
      ${st.sections.map(s => `<section class="st-sec"><h2>${esc(s.title)}</h2>${storyText(s.body, st.ids)}</section>`).join("")}
      <div class="st-src"><div class="st-src-h"><h2>Posts in this story</h2>${unread ? `<button class="sm" data-act="storyread">Mark ${unread} read</button>` : ""}</div>
        ${posts.map(a => `<div class="st-item"><div class="st-row ${a.read ? "read" : ""}"><i>${st.ids.indexOf(a.id) + 1}</i><button class="st-open" data-act="open" data-id="${a.id}"><b>${esc(a.title)}</b><small>${esc((sm[a.src] || {}).title || "")}</small></button>${tlBtn(a, true)}</div>${inlineTldr(a)}</div>`).join("")}
      </div>
      <button class="more" data-act="rewrite">Rewrite this story</button>
    </article>`;
    $("#list").innerHTML = h;
  }
  function requestStory(force) {
    if (!force && S.story && S.story.scope === storyScope && (S.story.cat || "all") === category) return;
    storyBusy = true; send("story", { scope: storyScope, cat: category, force: !!force });
  }

  // ---- TL;DR sheet ----
  const lockBody = () => document.body.classList.toggle("locked", sheetOpen || !!tldrId || aiOpen || cfgOpen);
  function openTldr(id, force) {
    if (tldrId !== id) Object.assign(inv, { open: false, who: "", instr: "", busy: false, out: {} });   // fresh invite for each article
    tldrId = id;
    if (force || !tl[id] || tl[id].error) { tl[id] = "loading"; send("tldr", { id, force: !!force }); }
    renderTldr();
  }
  function renderTldr() {
    const el = $("#tldr"), keepScroll = el.scrollTop;
    el.classList.toggle("open", !!tldrId); lockBody();
    const a = tldrId && byId(tldrId);
    if (!a) return;
    const d = tl[tldrId], s = srcMap()[a.src] || {};
    const stars = [1, 2, 3].map(n => `<button class="star ${a.rating >= n ? "on" : ""}" data-act="rate" data-id="${a.id}" data-v="${n}" aria-label="Rate ${n} of 3">★</button>`).join("");
    let h = `<div class="sh-head"><h2>TL;DR</h2><button class="link" data-act="tldrclose">Done</button></div><div class="tl">
      <p class="kicker">${esc(s.title || "")} — ${rel(a.pub)}${d && d.mins ? ` — ${d.mins} min read` : ""}</p>
      <h1 class="tl-h">${esc(a.title)}</h1>`;
    if (!d || d === "loading") {
      h += `<div class="writing tight" role="status"><p>${S.settings.hasKey ? "Reading the article and summarising it…" : "Reading the article…"}</p><div class="ln"></div><div class="ln"></div><div class="ln s"></div></div>`;
    } else if (d.error) {
      h += `<p class="err">${esc(d.error)}.</p><p class="muted">Open the article to read it in full, or try again.</p><button class="sm" data-act="tldrretry" data-id="${a.id}">Try again</button>`;
    } else {
      h += d.kind === "ai"
        ? `<p><span class="badge-ai">✦ AI summary by ${d.provider === "openai" ? "OpenAI" : "Claude"}</span></p>`
        : `<p><span class="badge-ex">Extracted from the article — no AI</span></p>`;
      if (d.note) h += `<p class="note">${esc(d.note)}</p>`;
      if (d.partial) h += `<p class="note">The full page couldn't be read, so this uses the excerpt from the blog's feed.</p>`;
      h += `<p class="tl-lead">${esc(d.lead)}</p>`;
      if (d.points && d.points.length) h += `<ul class="tl-pts">${d.points.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
      if (d.why) h += `<div class="tl-why"><b>Why it matters</b><p>${esc(d.why)}</p></div>`;
      if (d.sections && d.sections.length) h += `<div class="tl-secs"><b>What the article covers</b><ul>${d.sections.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
      h += d.kind === "ai" ? `<button class="sm" data-act="tldrretry" data-id="${a.id}">Summarise again</button>`
        : S.settings.hasKey ? `<button class="sm" data-act="tldrretry" data-id="${a.id}">✦ Summarise with AI</button>`
        : `<p class="muted small">Add a Claude or OpenAI key in Settings › AI settings to get AI summaries.</p>`;
      h += `<div class="tl-listen"><button class="sm" data-act="listentldr" data-id="${a.id}">${SPK}Listen to the TL;DR</button><button class="sm" data-act="listenarticle" data-id="${a.id}">${SPK}Listen to the full article</button></div>`;
      h += inviteBlock(a);
    }
    h += `<div class="tl-actions"><div class="stars ${a.rating ? "rated" : ""}">${stars}</div>
      <button class="readbtn" data-act="read" data-id="${a.id}">${a.read ? "Mark unread" : "Mark read"}</button></div>
      <button class="primary block" data-act="open" data-id="${a.id}">Read the full article</button></div>`;
    el.innerHTML = h;
    el.scrollTop = keepScroll;
  }
  function inviteBlock(a) {
    if (!inv.open) return `<button class="inv-open" data-act="invtoggle">${S.settings.hasKey ? "✦ " : ""}Invite someone to read this</button>`;
    const ai = S.settings.hasKey, out = inv.out[a.id];
    return `<div class="inv">
      <div class="inv-h"><b>Invite to read</b><button class="link small" data-act="invtoggle">Hide</button></div>
      <label class="inv-l">Who it's for<input id="invWho" value="${esc(inv.who)}" placeholder="Optional — e.g. my team, a colleague" autocapitalize="off"></label>
      ${ai ? `<label class="inv-l">Your instructions<textarea id="invInstr" rows="3" placeholder="e.g. Casual, two sentences, say how it relates to our platform work">${esc(inv.instr)}</textarea></label>
      <div class="inv-presets">${S.settings.inviteInstr && !inv.instr.trim() ? `<button class="chip last" data-act="invlast">↺ Use my last instructions</button>` : ""}${presets().map(p => `<button class="chip" data-act="invpreset" data-v="${esc(p)}">+ ${esc(p)}</button>`).join("")}</div>
`
      : `<p class="note">Without an AI key this uses a simple template. Add a Claude or OpenAI key under Blogs to write invites from your own instructions.</p>`}
      <button class="primary block" data-act="invgo" data-id="${a.id}" ${inv.busy ? "disabled" : ""}>${inv.busy ? "Writing…" : (out ? "Write again" : (ai ? "✦ Write invite" : "Write invite"))}</button>
      ${out ? `<div class="inv-out">
        ${out.kind === "ai" ? `<span class="badge-ai">✦ AI-written by ${out.provider === "openai" ? "OpenAI" : "Claude"}</span>` : `<span class="badge-ex">Template — no AI</span>`}
        <textarea id="invText" rows="7">${esc(out.text)}</textarea>
        <div class="inv-actions"><button class="primary" data-act="invshare" data-id="${a.id}">Share…</button><button class="sm" data-act="invcopy" data-id="${a.id}">Copy</button></div>
      </div>` : ""}
    </div>`;
  }

  // ---- blogs sheet ----
  function renderSheet() {
    $("#sheet").classList.toggle("open", sheetOpen);
    lockBody();
    if (!sheetOpen) return;
    $("#findBtn").textContent = searching ? "Searching…" : "Find";
    const following = f => added.has(f) || S.sources.some(s => s.feed === f);
    const addBtn = r => following(r.feed) ? `<span class="ok">Following</span>`
      : adding.has(r.feed) ? `<span class="muted">Adding…</span>`
      : `<button class="primary sm" data-act="add" data-feed="${esc(r.feed)}" data-title="${esc(r.title)}">Follow</button>`;
    const un = {};
    for (const a of S.articles) if (!a.read) un[a.src] = (un[a.src] || 0) + 1;
    let h = "";
    if (results) {
      h += `<div class="sec-row"><h3 class="sec">Results <span class="muted">${results.length}</span></h3><button class="link small" data-act="clearres">Clear results</button></div>` + (results.length ? results.map(r => `<div class="srow"><div class="grow"><b>${esc(r.title)}</b>
        <small>${esc(host(r.feed))}${r.subs ? ` — ${r.subs.toLocaleString()} Feedly followers` : ""}${r.count ? ` — ${r.count} posts in feed` : ""}</small>
        ${r.latest ? `<small class="muted">Latest: ${esc(r.latest)}</small>` : r.desc ? `<small class="muted">${esc(r.desc)}</small>` : ""}</div>${addBtn(r)}</div>`).join("")
        : `<p class="muted pad">No feeds found. Try the blog's home page address, or a different name.</p>`);
    }
    h += `<h3 class="sec">Following <span class="muted">${S.sources.length}</span></h3>` + (S.sources.length ? S.sources.map(s => `
      <div class="srow ${s.paused ? "paused" : ""}"><div class="grow"><button class="sinfo" data-act="sfilter" data-id="${s.id}" aria-label="Show posts from ${esc(s.title)}"><b>${esc(s.title)}</b>
        <small>${un[s.id] || 0} unread — ${s.paused ? "paused" : s.lastFetched ? "checked " + rel(s.lastFetched) : "not checked yet"}</small>
        ${s.err ? `<small class="err">Last check failed: ${esc(s.err)}</small>` : ""}</button>
        <select class="catsel" data-id="${s.id}" aria-label="Category for ${esc(s.title)}"><option value="">${s.catLock ? "Auto-detect per post" : "Auto: " + esc(catInfo(s.cat).label) + " (per post)"}</option>${S.categories.map(c => `<option value="${c.id}" ${s.catLock === c.id ? "selected" : ""}>Always ${esc(c.label)}</option>`).join("")}</select></div>
        <button class="sm" data-act="pause" data-id="${s.id}">${s.paused ? "Resume" : "Pause"}</button>
        <button class="sm danger ${armed === s.id ? "armed" : ""}" data-act="remove" data-id="${s.id}">${armed === s.id ? "Confirm" : "Remove"}</button></div>`).join("")
      : `<p class="muted pad">Nothing yet — pick a few below.</p>`);
    const pop = S.catalog.filter(c => !following(c.feed));
    if (pop.length) h += `<h3 class="sec">Popular tech blogs</h3>` + pop.map(c => `<div class="srow"><div class="grow"><b>${esc(c.title)}</b><small class="muted">${esc(c.tags)}</small></div>${addBtn(c)}</div>`).join("");
    $("#sh-dyn").innerHTML = h;
  }
  function doFind() {
    const v = $("#q").value.trim();
    if (!v || searching) return;
    searching = true; results = null; $("#q").blur();
    send("discover", { q: v }); renderSheet();
  }

  // ---- interactions ----
  document.addEventListener("click", e => {
    if (e.target.closest("select, option, input, textarea")) return;   // form controls handle themselves
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const act = t.dataset.act, id = t.dataset.id, v = t.dataset.v, a = id ? byId(id) : null;
    switch (act) {
      case "open":
        if (!a) return;
        if (S.settings.readOnOpen && !a.read) { a.read = true; keep.add(a.id); setTimeout(() => view === "story" ? render() : refreshCard(a), 300); }
        send("open", { id }); break;
      case "read": a.read = !a.read; keep.add(a.id); send("read", { id, v: a.read }); refreshCard(a); if (tldrId) renderTldr(); break;
      case "listengroup": { const items = (groupIdx[v] || []).map(postItem); if (items.length) speak(label(+v)[0], items); break; }
      case "listenstory": if (S.story) speak("Story", storyItems(S.story)); break;
      case "listentldr": { const d = tl[id]; if (a && d && d !== "loading" && !d.error) speak("TL;DR", tldrItems(a, d)); break; }
      case "listenarticle":   // speak right away (iOS only lets speech start from a tap), then the article follows
        if (a) { speak("Full article", [{ id, title: a.title, text: "Loading the article." }]); send("articletext", { id }); } break;
      case "plpause": togglePause(); break;
      case "plnext": skipItem(); break;
      case "plstop": stopSpeaking(); break;
      case "voiceset": {
        const k = t.dataset.k, val = k === "voiceGender" || k === "speechEngine" ? v : +v;
        if (k === "speechEngine" && tts.on) stopSpeaking();
        S.settings[k] = val; send("set", { k, v: val }); renderCfg(); break;
      }
      case "voicetest": speak("Voice test", [{ title: "Voice test", text: "Hello! This is how BlogPulse will read your news and stories to you." }]); break;
      case "tldr":
        if (expanded.has(id)) expanded.delete(id);
        else { expanded.add(id); if (!tl[id] || tl[id].error) { tl[id] = "loading"; send("tldr", { id }); } }
        refreshInline(id); break;
      case "tldrpanel": openTldr(id, false); inv.open = true; renderTldr(); break;
      case "invtoggle": inv.open = !inv.open; renderTldr(); break;
      case "invpreset": {
        inv.instr = (inv.instr.trim() ? inv.instr.trim().replace(/[.;,]?$/, ". ") : "") + v + ".";
        const ta = $("#invInstr"); if (ta) ta.value = inv.instr; break;
      }
      case "invlast": { inv.instr = S.settings.inviteInstr || ""; const ta = $("#invInstr"); if (ta) ta.value = inv.instr; t.remove(); break; }
      case "upd-now": updNow(t); break;
      case "upd-later": updLater(); break;
      case "upd-close": { const uo = document.getElementById("upd"); if (uo) uo.remove(); break; }
      case "openurl": send("openurl", { v }); break;
      case "startlog": {
        const pre = $("#startlog");
        if (!pre.hidden) { pre.hidden = true; t.textContent = "Show"; break; }
        send("startlog", {}, (ok, txt) => { pre.textContent = txt || "Nothing logged yet."; pre.hidden = false; t.textContent = "Hide"; });
        break;
      }
      case "updcheck": {
        const um = $("#updmsg"); t.disabled = true; um.textContent = "Checking…";
        send("update-check", {}, (ok, res) => { t.disabled = false; um.textContent = res || ""; if (/available/.test(res || "")) { cfgOpen = false; renderCfg(); } });
        break;
      }
      case "invgo":
        if (inv.busy) return;
        if (inv.instr.trim()) S.settings.inviteInstr = inv.instr.trim();
        inv.busy = true; send("invite", { id, who: inv.who, instr: inv.instr }); renderTldr(); break;
      case "invshare": if (inv.out[id]) send("share", { text: inv.out[id].text }); break;
      case "invcopy": if (inv.out[id]) send("copy", { text: inv.out[id].text }); break;
      case "tldrretry":
        if (tldrId === id) openTldr(id, true);
        else { tl[id] = "loading"; expanded.add(id); send("tldr", { id, force: true }); refreshInline(id); }
        break;
      case "tldrclose": tldrId = null; renderTldr(); if (view === "story") render(); break;
      case "rate": {
        const n = +v; a.rating = a.rating === n ? 0 : n;
        if (a.rating) a.read = true;
        keep.add(a.id); send("rate", { id, v: a.rating }); refreshCard(a); if (tldrId) renderTldr(); break;
      }
      case "view":
        view = v; keep.clear(); limit = pageSize(); send("set", { k: "view", v });
        if (v === "story") requestStory(false);
        render(); scrollTo(0, 0); break;
      case "group": group = v; send("set", { k: "groupBy", v }); render(); break;
      case "cat": setCat(v); break;
      case "chip": srcFilter = v || null; keep.clear(); render(); scrollTo(0, 0); break;
      case "markallask": confirmMarkAll(); break;
      case "markallcancel": { const cf = document.getElementById("confirm"); if (cf) cf.remove(); break; }
      case "markallgo": {
        const cf = document.getElementById("confirm"); if (cf) cf.remove();
        const ids = markAllIds();
        ids.forEach(id => { const x = byId(id); if (x) x.read = true; });
        keep.clear(); send("markAll", { ids }); render();
        toast(`${ids.length} post${ids.length === 1 ? "" : "s"} marked as read`);
        break;
      }
      case "markgroup": {
        const ids = (groupIdx[v] || []).filter(x => !x.read).map(x => { x.read = true; keep.add(x.id); return x.id; });
        send("markAll", { ids }); render(); break;
      }
      case "more": limit += pageSize(); render(); break;
      case "refresh": if (!progress) send("refresh", {}); break;
      case "look": {
        const k = t.dataset.k, val = k === "textSize" ? +v : v;
        look[k] = val; send("set", { k, v: val }); render(); renderCfg(); break;
      }
      case "scope": storyScope = v; requestStory(false); render(); break;
      case "rewrite": requestStory(true); render(); scrollTo(0, 0); break;
      case "storyread": {
        const ids = (S.story ? S.story.ids : []).map(byId).filter(x => x && !x.read).map(x => { x.read = true; return x.id; });
        send("markAll", { ids }); render(); break;
      }
      case "sheet":
        sheetOpen = !sheetOpen; armed = null;
        if (sheetOpen) { results = null; searching = false; $("#q").value = ""; }
        renderSheet(); if (sheetOpen) $("#sheet").scrollTop = 0; break;
      case "clearres": results = null; $("#q").value = ""; renderSheet(); break;
      case "find": doFind(); break;
      case "add": adding.add(t.dataset.feed); send("add", { feed: t.dataset.feed, title: t.dataset.title }); renderSheet(); break;
      case "remove":
        if (armed === id) { armed = null; if (srcFilter === id) srcFilter = null; send("remove", { id }); }
        else { armed = id; renderSheet(); setTimeout(() => { if (armed === id) { armed = null; renderSheet(); } }, 3500); }
        break;
      case "pause": send("pause", { id }); break;
      case "toggle": S.settings[v] = !S.settings[v]; send("set", { k: v, v: S.settings[v] }); renderCfg(); renderAI(); break;
      case "aiopen": aiOpen = true; renderAI(); send("state", {}); break;   // fresh token counts
      case "cfgopen": cfgOpen = true; renderCfg(); break;
      case "cfgclose": cfgOpen = false; cfgArmed = false; renderCfg(); renderSheet(); break;
      case "cfgreset": { const d = cfgItem(t.dataset.k); S.cfg[d.k] = d.def; send("cfg", { k: d.k, v: null }); renderCfg(); break; }
      case "cfgstep": {
        const d = cfgItem(t.dataset.k), step = d.step || 1;
        const nv = Number(Math.min(d.max, Math.max(d.min, Number(S.cfg[d.k]) + step * +v)).toFixed(2));
        S.cfg[d.k] = nv; send("cfg", { k: d.k, v: nv }); renderCfg(); break;
      }
      case "cfgall":
        if (cfgArmed) { cfgArmed = false; send("cfg", { k: "*" }); }
        else { cfgArmed = true; renderCfg(); setTimeout(() => { if (cfgArmed) { cfgArmed = false; renderCfg(); } }, 3500); }
        break;
      case "aiclose": aiOpen = false; renderAI(); break;
      case "aikey": send("aikey", { v }); break;
      case "aitest": send("aitest", { v }); break;
      case "aiprov": send("aiprov", { v }); break;
      case "aimodels": aiLoading.add(v); renderAI(); send("aimodels", { v }); break;
      case "airm": if (aiArmed === "rm" + v) { aiArmed = null; send("airm", { v }); } else arm("rm" + v); break;
      case "usagereset": if (aiArmed === "reset") { aiArmed = null; send("usagereset", {}); } else arm("reset"); break;
      case "sfilter": srcFilter = id; sheetOpen = false; keep.clear(); if (view === "story") view = "unread"; renderSheet(); render(); scrollTo(0, 0); break;
    }
  });
  // lock the UI scale: no pinch-zoom (double-tap zoom is off via touch-action in CSS)
  ["gesturestart", "gesturechange", "gestureend"].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
  document.addEventListener("touchmove", e => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
  document.addEventListener("change", e => {
    if (e.target.classList && e.target.classList.contains("catsel")) send("srccat", { id: e.target.dataset.id, v: e.target.value });
    if (e.target.classList && e.target.classList.contains("ttsvoicesel")) { S.settings.ttsVoice = e.target.value; send("set", { k: "ttsVoice", v: e.target.value }); return; }
    if (e.target.classList && e.target.classList.contains("ttsmodelsel")) { S.settings.ttsModel = e.target.value; send("set", { k: "ttsModel", v: e.target.value }); renderCfg(); return; }
    if (e.target.classList && e.target.classList.contains("ttsinstr")) { S.settings.ttsInstructions = e.target.value.trim(); send("set", { k: "ttsInstructions", v: S.settings.ttsInstructions }); return; }
    if (e.target.classList && e.target.classList.contains("voicesel")) {
      S.settings.voiceURI = e.target.value; send("set", { k: "voiceURI", v: e.target.value });
      if (tts.on && tts.engine === "device") { tts.token++; SYN.cancel(); playSoon(); }   // switch voice mid-sentence
    }
    if (e.target.classList && e.target.classList.contains("modelsel")) send("aimodel", { p: e.target.dataset.p, v: e.target.value });
    if (e.target.classList && e.target.classList.contains("cfgin")) {
      const d = cfgItem(e.target.dataset.k);
      send("cfg", { k: d.k, v: d.type === "lines" ? e.target.value.split("\n") : e.target.value });
    }
  });
  // pull the list down at the top, hold, and every blog is checked again
  const PULL = 72, RING = 69.1;   // pull distance in px; ring circumference (r = 11)
  const ptr = { on: false, y0: 0, x0: 0, dist: 0, armed: false, busy: false, timer: null };
  const ptrEl = $("#ptr"), ptrText = $("#ptrtext"), ptrPull = $("#ptrpull"), ptrHold = $("#ptrhold");
  const holdMs = () => Math.max(0, Number(S.cfg.pullHold == null ? 1.5 : S.cfg.pullHold)) * 1000;
  const canPull = () => !progress && !ptr.busy && !document.body.classList.contains("locked") && window.scrollY <= 0;
  function ptrDisarm() {
    clearTimeout(ptr.timer); ptr.armed = false;
    ptrHold.style.transition = "none"; ptrHold.style.strokeDashoffset = RING;
    ptrEl.classList.remove("armed");
  }
  function ptrReset() {
    ptrDisarm(); ptr.on = false; ptr.busy = false; ptr.dist = 0;
    ptrEl.classList.remove("dragging", "busy"); ptrEl.style.height = "0px";
  }
  function ptrGo() {
    ptrDisarm(); ptr.busy = true; ptr.on = false;
    ptrEl.classList.remove("dragging"); ptrEl.classList.add("busy"); ptrEl.style.height = "56px";
    ptrText.textContent = "Checking for new posts…";
    send("refresh", {});
    setTimeout(() => { if (ptr.busy && !progress) ptrReset(); }, 8000);   // never leave it hanging
  }
  function ptrArm() {
    ptr.armed = true; ptrEl.classList.add("armed");
    const ms = holdMs();
    if (!ms) { ptrText.textContent = "Release to check for new posts"; return; }
    ptrText.textContent = "Keep holding…";
    void ptrHold.getBoundingClientRect();   // restart the ring from empty
    ptrHold.style.transition = `stroke-dashoffset ${ms}ms linear`; ptrHold.style.strokeDashoffset = 0;
    ptr.timer = setTimeout(ptrGo, ms);
  }
  $("#list").addEventListener("touchstart", e => {
    if (!canPull()) return;
    const t = e.touches[0]; Object.assign(ptr, { on: true, y0: t.clientY, x0: t.clientX, dist: 0 });
  }, { passive: true });
  $("#list").addEventListener("touchmove", e => {
    if (!ptr.on || ptr.busy) return;
    const t = e.touches[0], dy = t.clientY - ptr.y0, dx = t.clientX - ptr.x0;
    if (dy <= 0 || window.scrollY > 0) { if (ptr.dist) ptrReset(); ptr.on = dy > 0; return; }
    if (!ptr.dist && Math.abs(dx) > dy) { ptr.on = false; return; }   // a sideways swipe, not a pull
    e.preventDefault();
    ptr.dist = Math.min(150, dy * 0.55);
    ptrEl.classList.add("dragging"); ptrEl.style.height = ptr.dist + "px";
    ptrPull.style.strokeDashoffset = RING * (1 - Math.min(1, ptr.dist / PULL));
    if (ptr.dist >= PULL && !ptr.armed) ptrArm();
    else if (ptr.dist < PULL && ptr.armed) ptrDisarm();
    if (!ptr.armed) ptrText.textContent = "Pull down to check for new posts";
  }, { passive: false });
  const ptrEnd = () => {
    if (!ptr.on || ptr.busy) return;
    if (ptr.armed && !holdMs()) return ptrGo();
    ptrReset();   // let go before the ring filled: nothing happens
  };
  $("#list").addEventListener("touchend", ptrEnd, { passive: true });
  $("#list").addEventListener("touchcancel", ptrEnd, { passive: true });

  // swipe left/right on the list to move between category pages
  let sx = 0, sy = 0, st0 = 0;
  $("#list").addEventListener("touchstart", e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st0 = Date.now(); }, { passive: true });
  $("#list").addEventListener("touchend", e => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 80 || Math.abs(dy) > 50 || Date.now() - st0 > 700) return;
    const ids = ["all"].concat(catsPresent().map(c => c.id));
    if (ids.length < 3) return;
    const i = ids.indexOf(category), j = Math.max(0, Math.min(ids.length - 1, i + (dx < 0 ? 1 : -1)));
    if (j !== i) { setCat(ids[j]); toast(j ? catInfo(ids[j]).label : "All topics"); }
  }, { passive: true });
  document.addEventListener("input", e => {
    const t = e.target;
    if (t.id === "q" && !t.value.trim() && results && !searching) { results = null; renderSheet(); }
    if (t.id === "invWho") inv.who = t.value;
    else if (t.id === "invInstr") inv.instr = t.value;
    else if (t.id === "invText" && tldrId && inv.out[tldrId]) inv.out[tldrId].text = t.value;
  });
  $("#q").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); doFind(); } });
  addEventListener("resize", renderChrome);

  if (view === "story") requestStory(false);
  render();
  if (!S.sources.length) { sheetOpen = true; renderSheet(); }
  setInterval(renderStatus, 30000);
}

const PALETTE_CSS = Object.entries(PALETTES).map(([k, p]) => `[data-theme=${k}]{--paper:${p.paper};--sheet:${p.sheet};--ink:${p.ink};--ink-2:${p.ink2};--muted:${p.muted};--rule:${p.rule};--signal:${p.signal};--signal-wash:${p.signalWash};--amber:${p.amber};--amber-wash:${p.amberWash};--danger:${p.danger};color-scheme:${p.scheme}}`).join("\n");
const CSS = `
:root{
  --ts:1; --serif: ui-serif, "New York", Georgia, serif; --sans: -apple-system, system-ui, "SF Pro Text", sans-serif; --display: var(--sans);
  --t:19px; --d:16px; --m:13.5px; --pad:16px;
}
html[data-font=serif]{--display:var(--serif)}
${PALETTE_CSS}
body.d-compact{--t:16.5px;--d:14.5px;--m:12.5px;--pad:11px}
body.d-tiny{--t:15.5px;--m:12px;--pad:9px}

*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{touch-action:pan-x pan-y;-webkit-user-select:none;user-select:none}
input,textarea,.tl,.story{-webkit-user-select:text;user-select:text}
html,body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:calc(16px * var(--ts));line-height:1.5;-webkit-text-size-adjust:100%}
body.locked{overflow:hidden}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit}
button:focus-visible{outline:2px solid var(--signal);outline-offset:2px;border-radius:6px}

#top{position:sticky;top:0;z-index:5;background:var(--paper);padding:calc(env(safe-area-inset-top) + 12px) 18px 0;border-bottom:1px solid var(--rule)}
.tb{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
.brand{font:700 calc(28px * var(--ts))/1 var(--display);letter-spacing:-.02em;margin:0}
.status{color:var(--muted);font-size:calc(13.5px * var(--ts));margin-top:6px}
.tb-a{display:flex;gap:6px}
.icon{width:40px;height:40px;border-radius:20px;display:grid;place-items:center;background:var(--sheet);border:1px solid var(--rule);font:700 15px/1 var(--display);text-align:center}
.icon.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.icon svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#top.busy .rf-spin svg{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.lk-row{margin-bottom:14px}
.lk-l{display:block;font-size:calc(13px * var(--ts));font-weight:600;color:var(--ink-2);margin-bottom:6px}
.sws{display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;padding:3px 3px 2px}
.sws::-webkit-scrollbar{display:none}
.sw{display:flex;flex-direction:column;align-items:center;gap:5px;flex:none}
.sw .prev{position:relative;width:50px;height:50px;border-radius:13px;display:grid;place-items:center;border:1px solid rgba(127,127,127,.35);font:700 18px/1 var(--display)}
.sw .prev i{position:absolute;right:6px;bottom:6px;width:9px;height:9px;border-radius:5px}
.sw.on .prev{outline:2.5px solid var(--signal);outline-offset:2px}
.sw small{font-size:12px;color:var(--ink-2)}
.sw.on small{color:var(--ink);font-weight:600}

.tabs{display:flex;gap:20px;overflow-x:auto;scrollbar-width:none;margin-top:8px}
.tabs::-webkit-scrollbar,.chips::-webkit-scrollbar{display:none}
.tab{padding:10px 0;color:var(--muted);font-weight:600;font-size:calc(15px * var(--ts));white-space:nowrap;border-bottom:2.5px solid transparent}
.tab.on{color:var(--ink);border-color:var(--signal)}
.tab.story-tab:not(.on){color:var(--signal)}
.tab i,.chip i{font-style:normal;font-size:.8em;font-weight:700;margin-left:5px;color:var(--signal)}
.sub{display:flex;align-items:center;gap:10px;padding:8px 0 10px}
#top.storymode .sub{display:none}
.chips{display:flex;gap:6px;overflow-x:auto;flex:1;scrollbar-width:none}
.chip{white-space:nowrap;font-size:calc(13.5px * var(--ts));padding:5px 12px;border-radius:15px;border:1px solid var(--rule);background:var(--sheet);color:var(--ink-2)}
.chip.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.chip.on i{color:inherit;opacity:.8}
.seg{display:flex;border:1px solid var(--rule);border-radius:9px;overflow:hidden;flex:none;background:var(--sheet)}
.sub .seg{margin-left:auto}
.seg button{font-size:calc(12.5px * var(--ts));padding:6px 10px;color:var(--ink-2);white-space:nowrap}
.seg button.on{background:var(--ink);color:var(--paper);font-weight:600}
.seg.wide button{flex:1;text-align:center;padding:9px 4px;font-size:calc(13.5px * var(--ts))}
.prog{height:2px;margin:0 -18px}
#bar{height:2px;width:0;background:var(--signal);transition:width .3s}

.gh{position:sticky;top:var(--hh,150px);z-index:2;background:var(--paper);display:flex;justify-content:space-between;align-items:flex-end;padding:22px 18px 8px;gap:10px}
body.d-compact .gh,body.d-tiny .gh{padding-top:14px}
.gh h2{font:700 calc(21px * var(--ts))/1.15 var(--display);margin:0}
.gh div>span{display:block;color:var(--muted);font-size:calc(13px * var(--ts));margin-top:3px}
.gh-r{display:flex;flex-direction:column;align-items:flex-end;gap:3px;font-size:calc(12.5px * var(--ts));color:var(--muted)}
.gh-r button{color:var(--signal);font-weight:600;font-size:calc(13.5px * var(--ts))}

.card{background:var(--sheet);padding:var(--pad) 18px calc(var(--pad) - 6px);border-top:1px solid var(--rule);position:relative}
section .card:last-child{border-bottom:1px solid var(--rule)}
.card.new::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--signal)}
.card.pick{box-shadow:inset 0 3px 0 var(--amber)}
.meta{display:flex;justify-content:space-between;gap:10px;font-size:calc(var(--m) * var(--ts));color:var(--muted)}
.src{font-weight:600;color:var(--ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.when{flex:none}
.card h3{font:600 calc(var(--t) * var(--ts))/1.3 var(--display);margin:5px 0;letter-spacing:-.005em;max-width:70ch}
.card.read h3{font-weight:500;color:var(--muted)}
.desc{margin:0;color:var(--ink-2);font-size:calc(var(--d) * var(--ts));line-height:1.55;max-width:68ch;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
body.d-compact .desc{-webkit-line-clamp:2;line-height:1.45}
.card.read .desc{color:var(--muted)}
.ai{font-size:.72em;font-weight:700;color:var(--signal);background:var(--signal-wash);border-radius:4px;padding:1px 5px;margin-right:6px;vertical-align:.1em}
.row{display:flex;align-items:center;flex-wrap:wrap;gap:4px 8px;margin-top:4px}
.stars{display:flex}
.star{font-size:calc(21px * var(--ts));line-height:1;padding:6px 3px;color:var(--rule)}
body.d-compact .star{font-size:calc(17px * var(--ts));padding:4px 2px}
.star.on{color:var(--amber)}
.flag{font-size:calc(12.5px * var(--ts));font-weight:600;border-radius:5px;padding:2px 7px;white-space:nowrap}
.flag.new{color:var(--signal);background:var(--signal-wash)}
.flag.pick{color:var(--amber);background:var(--amber-wash)}
.readbtn{margin-left:auto;font-size:calc(13.5px * var(--ts));color:var(--muted);padding:6px 0 6px 10px;white-space:nowrap}
.card.unread .readbtn{color:var(--signal);font-weight:600}

.card.tiny{display:flex;align-items:center;gap:8px;padding:var(--pad) 10px var(--pad) 10px}
.tick{width:28px;height:28px;flex:none;display:grid;place-items:center}
.tick::after{content:"";width:9px;height:9px;border-radius:5px;background:var(--signal)}
.card.read .tick::after{background:transparent;box-shadow:inset 0 0 0 1.5px var(--muted)}
.tmain{flex:1;min-width:0}
.card.tiny h3{margin:0 0 2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card.tiny .meta{justify-content:flex-start}
.pk{color:var(--amber);margin-right:5px}
.stars.mini .star{font-size:calc(15px * var(--ts));padding:6px 1px}

.more{display:block;margin:18px auto 40px;padding:10px 18px;border:1px solid var(--rule);border-radius:10px;background:var(--sheet);font-weight:600}
.empty{padding:70px 28px;text-align:center;color:var(--ink-2)}
.empty h2{font:700 calc(24px * var(--ts))/1.2 var(--display);color:var(--ink);margin:0 0 8px}
.empty p{max-width:34ch;margin:0 auto 20px}
#list{padding-bottom:28px}

.story-bar{max-width:720px;margin:0 auto;padding:16px 18px 0}
.story-bar .seg button{flex:1;text-align:center;padding:9px 4px;font-size:calc(13.5px * var(--ts))}
.story{max-width:720px;margin:0 auto;padding:12px 20px 30px}
.kicker{color:var(--muted);font-size:calc(13.5px * var(--ts));margin:10px 0}
.st-h{font:700 calc(30px * var(--ts))/1.15 var(--display);letter-spacing:-.02em;margin:0 0 10px}
.dek{font-size:calc(18.5px * var(--ts));line-height:1.5;color:var(--ink-2);margin:0 0 18px}
.stale{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--signal-wash);border-radius:10px;padding:10px 14px;font-size:calc(14px * var(--ts));margin-bottom:18px}
.stale button{color:var(--signal);font-weight:700;flex:none}
.must{border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:2px 0 10px;margin:6px 0 10px}
.must h2,.st-sec h2,.st-src h2{font:700 calc(20px * var(--ts))/1.25 var(--display);margin:20px 0 8px}
.mr{display:block;width:100%;padding:8px 0 8px 14px;border-left:3px solid var(--amber);margin:10px 0}
.mr b{display:block;font-size:calc(16.5px * var(--ts));line-height:1.35}
.mr small{display:block;color:var(--muted);font-size:calc(13px * var(--ts));margin:2px 0 4px}
.mr span{display:block;color:var(--ink-2);font-size:calc(15px * var(--ts))}
.st-sec p{font-size:calc(17.5px * var(--ts));line-height:1.65;margin:0 0 14px;max-width:66ch}
html[data-font=serif] .st-sec p{font-family:var(--serif)}
.refw{white-space:nowrap}
.ref{display:inline-block;min-width:1.6em;margin-left:3px;padding:0 .35em;border-radius:6px;background:var(--signal-wash);color:var(--signal);font:700 calc(12px * var(--ts))/1.7 var(--sans);text-align:center;vertical-align:.15em}
.st-src{margin-top:28px;border-top:1px solid var(--rule)}
.st-src-h{display:flex;justify-content:space-between;align-items:center;gap:10px}
.st-row{display:flex;gap:12px;width:100%;padding:10px 0;border-bottom:1px solid var(--rule)}
.st-row i{font:700 calc(12px * var(--ts))/1 var(--sans);font-style:normal;color:var(--signal);background:var(--signal-wash);border-radius:6px;min-width:1.9em;height:1.9em;display:grid;place-items:center;flex:none;margin-top:2px}
.st-row b{display:block;font-weight:600;font-size:calc(15.5px * var(--ts));line-height:1.35}
.st-row small{color:var(--muted);font-size:calc(13px * var(--ts))}
.st-row.read b{font-weight:500;color:var(--muted)}
.writing{max-width:720px;margin:0 auto;padding:36px 20px}
.writing h2{font:700 calc(24px * var(--ts))/1.2 var(--display);margin:0 0 8px}
.writing p{color:var(--ink-2);margin:0 0 20px}
.ln{height:14px;border-radius:7px;background:var(--rule);margin:14px 0;animation:pulse 1.4s ease-in-out infinite}
.ln.s{width:60%}
@keyframes pulse{50%{opacity:.4}}

.primary{background:var(--ink);color:var(--paper);font-weight:600;border-radius:10px;padding:10px 16px}
.sm{font-size:calc(13px * var(--ts));padding:6px 11px;border-radius:8px;border:1px solid var(--rule);background:var(--sheet);white-space:nowrap}
.primary.sm{border-color:var(--ink);background:var(--ink)}
.danger{color:var(--danger)}
.danger.armed{background:var(--danger);color:#fff;border-color:var(--danger)}
.ok{font-size:calc(13px * var(--ts));color:var(--signal);font-weight:600}
.muted{color:var(--muted)}
.err{color:var(--danger)}

.sheet{position:fixed;inset:0;z-index:10;background:var(--paper);transform:translateY(102%);transition:transform .28s ease;overflow-y:auto;-webkit-overflow-scrolling:touch}
.sheet.open{transform:none}
.sh-head{position:sticky;top:0;z-index:2;background:var(--paper);display:flex;justify-content:space-between;align-items:center;padding:calc(env(safe-area-inset-top) + 14px) 18px 12px;border-bottom:1px solid var(--rule)}
.sh-head h2{font:700 calc(24px * var(--ts))/1 var(--display);margin:0}
.link{color:var(--signal);font-weight:600;font-size:16px}
.sh-body{padding:16px 18px calc(env(safe-area-inset-bottom) + 40px)}
.field{display:flex;gap:8px}
.field input{flex:1;min-width:0;font:16px var(--sans);padding:11px 13px;border-radius:10px;border:1px solid var(--rule);background:var(--sheet);color:var(--ink)}
.field input:focus{outline:2px solid var(--signal);outline-offset:-1px}
.hint{font-size:calc(13px * var(--ts));color:var(--muted);margin:8px 2px 0}
.sec{font:700 calc(17px * var(--ts))/1.2 var(--display);margin:26px 0 6px}
.srow{display:flex;align-items:center;gap:8px;padding:11px 0;border-bottom:1px solid var(--rule)}
.srow.paused{opacity:.55}
button.srow.bp{width:100%;background:none;border:0;border-bottom:1px solid var(--rule);font:inherit;color:inherit;text-align:left;cursor:pointer}
.srow .go{color:var(--muted);font-size:calc(20px * var(--ts));line-height:1;padding:0 2px}
.grow{flex:1;min-width:0}
.grow b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.grow small{display:block;font-size:calc(13px * var(--ts));color:var(--ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pad{padding:8px 0}
.switch{width:46px;height:28px;border-radius:14px;background:var(--rule);position:relative;flex:none;transition:background .2s}
.switch::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:11px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .2s}
.switch.on{background:var(--signal)}
.switch.on::after{transform:translateX(18px)}

.ico{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px;margin-right:5px;flex:none}
.ico path:first-child{fill:currentColor;stroke:none}
.gh-acts{display:flex;gap:14px;align-items:center}
.gh-listen{display:inline-flex;align-items:center;color:var(--signal);font-weight:600;font-size:calc(13.5px * var(--ts))}
.listen{display:inline-flex;align-items:center;margin:0 0 18px;padding:9px 14px;border-radius:20px;background:var(--signal-wash);color:var(--signal);border:1.5px solid var(--signal);font-weight:700;font-size:calc(14.5px * var(--ts))}
.tl-listen{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 4px}
.sm .ico,.tl-listen .ico{width:15px;height:15px}
.card.speaking{box-shadow:inset 4px 0 0 var(--amber)}
.voicesel{display:block;width:100%;margin-top:8px;font:16px var(--sans);color:var(--ink);background:var(--paper);border:1px solid var(--rule);border-radius:9px;padding:9px 10px}
#player{position:fixed;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom) + 10px);z-index:30;display:flex;align-items:center;gap:8px;padding:10px 10px 10px 14px;border-radius:16px;background:var(--ink);color:var(--paper);box-shadow:0 8px 28px rgba(0,0,0,.28)}
#player[hidden]{display:none}
.pl-info{flex:1;min-width:0}
.pl-info b,.pl-info small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-info b{font-size:14.5px}
.pl-info small{font-size:12px;opacity:.75}
.pl-btn{width:40px;height:40px;border-radius:20px;display:grid;place-items:center;flex:none;background:rgba(127,127,127,.22)}
.pl-btn svg{width:20px;height:20px;fill:currentColor}
.eq{display:flex;align-items:flex-end;gap:2px;height:16px;flex:none}
.eq i{width:3px;height:100%;background:currentColor;border-radius:2px;animation:eq 1s ease-in-out infinite}
.eq i:nth-child(2){animation-delay:-.35s}.eq i:nth-child(3){animation-delay:-.7s}
#player.paused .eq i{animation:none;height:40%}
@keyframes eq{0%,100%{height:30%}50%{height:100%}}
body.playing #list{padding-bottom:96px}
body.playing #toast{bottom:calc(env(safe-area-inset-bottom) + 84px)}
#toast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 22px);transform:translate(-50%,20px);opacity:0;pointer-events:none;z-index:20;
  background:var(--ink);color:var(--paper);padding:10px 16px;border-radius:12px;font-size:14px;font-weight:500;max-width:88vw;text-align:center;transition:opacity .2s,transform .2s}
#toast.on{opacity:1;transform:translate(-50%,0)}
.tlbtn{display:inline-flex;align-items:center;gap:4px;flex:none;min-height:32px;padding:4px 10px 4px 9px;border-radius:16px;background:var(--signal-wash);color:var(--signal);border:1.5px solid var(--signal);font-weight:700;font-size:calc(13px * var(--ts));letter-spacing:.01em;white-space:nowrap;transition:transform .1s,background .15s}
.tlbtn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.tlbtn .chev{width:12px;height:12px;transition:transform .2s}
.tlbtn.on{background:var(--signal);color:var(--sheet)}
.tlbtn.on .chev{transform:rotate(180deg)}
.tlbtn:active{transform:scale(.95)}
.tlbtn.mini{min-height:28px;padding:2px 7px;font-size:calc(12px * var(--ts));gap:3px}
.tlbtn.mini .chev{display:none}
.tli{margin:10px 0 4px;padding:12px 14px;border-radius:12px;background:var(--paper);border:1px solid var(--rule);border-left:3px solid var(--signal);-webkit-user-select:text;user-select:text}
.card.tiny{flex-wrap:wrap}
.card.tiny .tli{flex-basis:100%;margin:6px 0 2px 36px}
.st-item .tli{margin:0 0 12px 2.4em}
.tli-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:calc(12.5px * var(--ts));color:var(--muted)}
.tli-lead{font-weight:600;font-size:calc(15.5px * var(--ts));line-height:1.45;margin:8px 0 6px;color:var(--ink)}
.tli ul{margin:0 0 6px;padding-left:1.15em}
.tli li{font-size:calc(14.5px * var(--ts));line-height:1.5;margin-bottom:4px;color:var(--ink-2)}
.tli-why{font-size:calc(14px * var(--ts));line-height:1.5;color:var(--ink-2);margin:6px 0}
.tli-act{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}
.tli-act .hide{margin-left:auto;color:var(--muted);font-weight:600;font-size:calc(13.5px * var(--ts));padding:6px 2px}
.tli-load{display:flex;align-items:center;gap:10px;color:var(--ink-2);font-size:calc(14px * var(--ts))}
#ptr{height:0;overflow:hidden;display:flex;align-items:flex-end;justify-content:center;transition:height .25s ease}
#ptr.dragging{transition:none}
.ptr-in{display:flex;align-items:center;gap:10px;padding:0 0 16px;color:var(--ink-2);font-size:calc(14px * var(--ts));font-weight:600}
.ptr-ring{width:26px;height:26px;transform:rotate(-90deg)}
.ptr-ring circle{fill:none;stroke-width:3;stroke-linecap:round;stroke-dasharray:69.1;stroke-dashoffset:69.1}
.ptr-ring .trk{stroke:var(--rule);stroke-dashoffset:0}
.ptr-ring .pull{stroke:var(--muted)}
.ptr-ring .hold{stroke:var(--signal)}
#ptr.armed .ptr-in{color:var(--signal)}
#ptr .busy-dot{display:none}
#ptr.busy .busy-dot{display:block}
#ptr.busy .ptr-ring{display:none}
.booting{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px 20px;color:var(--muted);font-size:calc(14px * var(--ts))}
.startlog{white-space:pre-wrap;font:12px/1.45 ui-monospace,Menlo,monospace;background:var(--sheet);border:1px solid var(--rule);border-radius:10px;padding:10px;margin:8px 0;color:var(--ink-2);-webkit-user-select:text;user-select:text;max-height:260px;overflow:auto}
.booting.note{flex-direction:column;text-align:center;color:var(--ink-2);padding:60px 24px}
.booting.note b{font-size:calc(18px * var(--ts));color:var(--ink)}
.booting.note pre{max-width:100%;overflow:auto;text-align:left;font:12px/1.45 ui-monospace,Menlo,monospace;background:var(--sheet);border:1px solid var(--rule);border-radius:10px;padding:10px;color:var(--muted);white-space:pre-wrap;-webkit-user-select:text;user-select:text}
.busy-dot{width:15px;height:15px;flex:none;border-radius:50%;border:2px solid var(--rule);border-top-color:var(--signal);animation:spin .8s linear infinite}
.readbtn{margin-left:auto}
.acts{margin-left:auto;display:flex;align-items:center;gap:6px}
.acts .readbtn{margin-left:0}
.badge-ai{display:inline-block;font-size:calc(12px * var(--ts));font-weight:700;color:var(--signal);background:var(--signal-wash);border-radius:6px;padding:2px 8px}
.badge-ex{display:inline-block;font-size:calc(12px * var(--ts));font-weight:600;color:var(--ink-2);border:1px dashed var(--muted);border-radius:6px;padding:1px 8px}
#tldr{z-index:12}
.tl{max-width:680px;margin:0 auto;padding:6px 20px calc(env(safe-area-inset-bottom) + 40px)}
.tl-h{font:700 calc(24px * var(--ts))/1.2 var(--display);margin:0 0 12px}
.tl-lead{font-size:calc(18px * var(--ts));line-height:1.55;font-weight:500;margin:10px 0 12px}
.tl-pts{padding-left:1.2em;margin:0 0 16px}
.tl-pts li{font-size:calc(16.5px * var(--ts));line-height:1.55;margin-bottom:8px}
.tl-why{background:var(--sheet);border-left:3px solid var(--signal);border-radius:0 10px 10px 0;padding:10px 14px;margin:0 0 16px}
.tl-why p{margin:4px 0 0;color:var(--ink-2)}
.tl-secs{margin:0 0 16px}
.tl-secs ul{margin:6px 0 0;padding-left:1.2em;color:var(--ink-2)}
.note{font-size:calc(13.5px * var(--ts));color:var(--muted);margin:6px 0}
.small{font-size:calc(13.5px * var(--ts))}
.tl-actions{display:flex;align-items:center;gap:8px;margin:22px 0 12px;border-top:1px solid var(--rule);padding-top:10px}
.primary.block{display:block;width:100%;text-align:center;padding:13px 16px}
.writing.tight{padding:12px 0}
.st-tldr{background:var(--sheet);border:1px solid var(--rule);border-radius:12px;padding:12px 16px;margin:0 0 18px}
.st-tldr-h{display:flex;align-items:center;gap:8px}
.st-tldr ul{margin:8px 0 0;padding-left:1.2em}
.st-tldr li{font-size:calc(16.5px * var(--ts));line-height:1.55;margin-bottom:6px}
.inv-open{display:block;width:100%;text-align:center;margin:22px 0 4px;padding:12px;border:1px dashed var(--signal);border-radius:10px;color:var(--signal);font-weight:600}
.inv{margin:22px 0 4px;padding:14px;border:1px solid var(--rule);border-radius:12px;background:var(--sheet)}
.inv-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.inv-l{display:block;font-size:calc(13px * var(--ts));font-weight:600;color:var(--ink-2);margin:10px 0 0}
.inv input,.inv textarea{display:block;width:100%;margin-top:5px;font:16px/1.45 var(--sans);padding:10px 12px;border-radius:9px;border:1px solid var(--rule);background:var(--paper);color:var(--ink);-webkit-user-select:text;user-select:text}
.inv textarea{resize:vertical}
.inv input:focus,.inv textarea:focus{outline:2px solid var(--signal);outline-offset:-1px}
.inv-presets{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 2px}
.inv .primary.block{margin-top:12px}
.inv .primary[disabled]{opacity:.6}
.inv-out{margin-top:14px}
.inv-out textarea{margin-top:8px}
.inv-actions{display:flex;gap:8px;margin-top:10px}
.inv-actions .primary{flex:1;text-align:center}
.link.small{font-size:calc(14px * var(--ts))}
.cats{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:12px -18px 0;padding:0 18px}
.cats:empty{display:none}
.cats::-webkit-scrollbar{display:none}
.cat-pill{display:inline-flex;align-items:center;gap:6px;flex:none;white-space:nowrap;padding:7px 13px;border-radius:18px;background:var(--sheet);border:1px solid var(--rule);font-weight:600;font-size:calc(14px * var(--ts));color:var(--ink-2)}
.cat-pill i{font-style:normal;font-size:.8em;font-weight:700;color:var(--muted)}
.cat-pill .cdot{width:9px;height:9px;border-radius:5px;background:var(--c)}
.cat-pill.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.cat-pill.on i{color:inherit;opacity:.75}
.ml{display:flex;align-items:center;gap:8px;min-width:0}
.ctag{flex:none;display:inline-flex;align-items:center;gap:5px;font-size:.92em;font-weight:600;color:var(--ink-2)}
.ctag::before{content:"";width:7px;height:7px;border-radius:4px;background:var(--c)}
.catsel{margin-top:6px;max-width:100%;font:calc(13px * var(--ts)) var(--sans);color:var(--ink);background:var(--paper);border:1px solid var(--rule);border-radius:8px;padding:5px 8px}
.chip.last{border-color:var(--signal);color:var(--signal)}
#cfgsheet{z-index:13}
#upd,#confirm{position:fixed;inset:0;z-index:48;background:rgba(0,0,0,.55);display:flex;align-items:flex-end}
.updtag.warn{background:var(--danger);color:#fff}
.danger-fill{background:var(--danger);color:#fff}
.listbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 18px 0;color:var(--ink-2);font-size:calc(13.5px * var(--ts))}
.listbar .sm{display:inline-flex;align-items:center;font-weight:600}
.listbar .ico{width:15px;height:15px;stroke-width:2.4}
.listbar .ico path:first-child{fill:none;stroke:currentColor}
.updp{width:100%;background:var(--sheet);color:var(--ink);border-radius:22px 22px 0 0;padding:20px 18px calc(16px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px;animation:updup .25s ease-out}
@keyframes updup{from{transform:translateY(40px);opacity:.4}}
.updtag{align-self:flex-start;background:var(--signal);color:var(--sheet);font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:.02em}
.updt{margin:6px 0 0;font:700 calc(22px * var(--ts))/1.2 var(--display);letter-spacing:-.01em}
.upds{color:var(--muted);font-size:calc(14px * var(--ts))}
.updl{display:flex;flex-direction:column;gap:10px;margin:8px 0 6px}
.updi{display:flex;gap:12px;align-items:flex-start;background:var(--paper);border-radius:14px;padding:12px}
.updic{font:24px/1.1 "Apple Color Emoji","Noto Color Emoji",sans-serif;flex:none;width:30px;text-align:center}
.updi b{display:block;font-size:calc(15px * var(--ts))}
.updi span{display:block;color:var(--muted);font-size:calc(13px * var(--ts));line-height:1.35;margin-top:2px}
.updmsg{font-size:calc(14px * var(--ts))}
.updmsg:empty{display:none}
.updgo{padding:13px;font-size:16px;text-align:center}
.updgo[disabled]{opacity:.6}
.updlater{padding:11px;background:var(--paper);border-radius:10px;text-align:center;font-weight:600;color:var(--ink-2)}
.ver{text-align:center;color:var(--muted);font-size:12px;margin:0;padding:0 0 calc(env(safe-area-inset-bottom) + 24px)}
#aisheet{z-index:14}
.sec-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.sinfo{display:block;width:100%;text-align:left}
.sinfo b,.sinfo small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sinfo small{font-size:calc(13px * var(--ts));color:var(--ink-2)}
#cfgsheet .lk-row{margin:10px 0 14px}
.cfg{padding:12px 0;border-bottom:1px solid var(--rule)}
.cfg.ch .cfg-h b::after{content:"";display:inline-block;width:7px;height:7px;border-radius:4px;background:var(--signal);margin-left:7px;vertical-align:2px}
.cfg-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.cfg-h b{font-weight:600}
.cfg small{display:block;font-size:calc(13px * var(--ts));margin-top:2px}
.stepper{display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap}
.stepper button{width:38px;height:36px;border-radius:9px;border:1px solid var(--rule);background:var(--sheet);font-size:20px;font-weight:600;text-align:center}
.stepper button[disabled]{opacity:.35}
.stepper input{width:86px;text-align:center;font:600 16px var(--sans);padding:7px 6px;border-radius:9px;border:1px solid var(--rule);background:var(--paper);color:var(--ink);-webkit-user-select:text;user-select:text}
.stepper .unit{font-size:calc(14px * var(--ts));color:var(--ink-2);min-width:2.5em}
.stepper .range{flex-basis:100%;font-size:calc(12px * var(--ts));color:var(--muted)}
.cfgin.wide{display:block;width:100%;margin-top:8px;font:15px/1.45 var(--sans);padding:9px 11px;border-radius:9px;border:1px solid var(--rule);background:var(--paper);color:var(--ink);-webkit-user-select:text;user-select:text}
textarea.cfgin.wide{resize:vertical}
.cfgin:focus{outline:2px solid var(--signal);outline-offset:-1px}
.cfg-foot{margin-top:18px}
.aicard,.ucard{background:var(--sheet);border:1px solid var(--rule);border-radius:14px;padding:14px;margin:14px 0}
.aicard.active{border-color:var(--signal);box-shadow:0 0 0 1px var(--signal)}
.aic-h{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:calc(17px * var(--ts))}
.aic-row{display:flex;align-items:center;gap:10px;margin-top:10px;font-size:calc(14px * var(--ts))}
.aic-row.lbl,.aic-row .lbl{font-weight:600;color:var(--ink-2)}
.aicard code{font:calc(13px * var(--ts)) ui-monospace,Menlo,monospace;background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:2px 6px}
.aic-btns{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px}
.aic-btns .note{margin:0}
.sm[disabled]{opacity:.5}
.modelsel{display:block;width:100%;margin-top:6px;font:16px var(--sans);color:var(--ink);background:var(--paper);border:1px solid var(--rule);border-radius:9px;padding:9px 10px}
.ustat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 4px}
.ustat div{background:var(--paper);border-radius:10px;padding:8px 10px}
.ustat b{display:block;font:700 calc(20px * var(--ts))/1.2 var(--display)}
.ustat small{color:var(--muted);font-size:calc(12px * var(--ts))}
.ubars{display:flex;align-items:flex-end;gap:3px;height:56px;margin-top:10px}
.ubars span{flex:1;background:var(--signal);border-radius:3px 3px 0 0;min-height:2px}
.ubars span.zero{background:var(--rule)}
.ubars-l{display:flex;justify-content:space-between;font-size:calc(11.5px * var(--ts));color:var(--muted);margin-top:4px}
.utab{width:100%;border-collapse:collapse;margin-top:12px;font-size:calc(13px * var(--ts))}
.utab th{text-align:left;font-weight:600;color:var(--muted);padding:4px 4px 4px 0;border-bottom:1px solid var(--rule)}
.utab td{padding:6px 4px 6px 0;border-bottom:1px solid var(--rule);color:var(--ink-2);word-break:break-word}
.utab th:not(:first-child),.utab td:not(:first-child){text-align:right;white-space:nowrap}
.st-row{align-items:flex-start}
.st-open{flex:1;min-width:0;display:block}
.st-row .tlbtn{flex:none;margin-top:2px}
/* BlogPulse logo: pulse feed (header mark, first-run screen, launch screen) */
.brand{display:flex;align-items:center;gap:10px}
.brand .x{color:#6D28D9}
[data-theme=slate] .brand .x,[data-theme=night] .brand .x{color:#A78BFA}
.brand-mark{width:calc(32px * var(--ts));height:calc(32px * var(--ts));border-radius:calc(8px * var(--ts));background:#0E1116;flex:none;box-shadow:inset 0 0 0 1px rgba(246,247,249,.14)}
.idleMark{display:block;width:76px;height:76px;margin:0 auto 18px;border-radius:18px;background:#0E1116}
/* Launch screen (app-blueprints · launch-screen 1.0.0) */
.splash{--sp-bg:#0E1116;--sp-ink:#F6F7F9;--sp-accent:#A78BFA;--sp-accent2:#2DD4BF;--sp-muted:#9AA3AE;--sp-font:var(--display);
  position:fixed;inset:0;z-index:90;background:var(--sp-bg);color:var(--sp-ink);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;cursor:pointer;
  animation:spOut .4s ease 2.4s forwards}
.splash.gone{display:none}
.spIcon{width:148px;height:148px;opacity:0;transform:scale(.86);animation:spIn .5s cubic-bezier(.2,.9,.3,1.2) .05s forwards}
.spIcon svg{width:100%;height:100%;display:block;overflow:visible}
.spFrame{fill:none;stroke:var(--sp-ink);stroke-opacity:.35;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;opacity:0;animation:spFade .4s ease .25s forwards}
.spDraw{fill:none;stroke:var(--sp-ink);stroke-width:13;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:100;stroke-dashoffset:100;animation:spDraw .8s ease-in-out .15s forwards}
.spPop{fill:var(--sp-accent);transform-box:fill-box;transform-origin:center;transform:scale(0);animation:spPop .45s cubic-bezier(.3,1.7,.5,1) .75s forwards}
.spDetail{fill:var(--sp-ink);opacity:0;animation:spFade .3s ease 1.05s forwards}
.spSweep{fill:none;stroke:var(--sp-accent2);stroke-width:7;stroke-linecap:round;opacity:0;transform:translateX(var(--sp-sweep-from,-120px));animation:spSweep 1s ease-in-out .95s forwards}
.spWord{font:800 40px/1 var(--sp-font,ui-rounded,-apple-system,system-ui,sans-serif);letter-spacing:-.02em;opacity:0;transform:translateY(10px);animation:spUp .45s ease 1.05s forwards}
.spWord span{color:var(--sp-accent)}
.spTag{font:600 15px/1.3 -apple-system,system-ui,sans-serif;letter-spacing:.06em;color:var(--sp-muted);opacity:0;transform:translateY(8px);animation:spUp .45s ease 1.4s forwards}
@keyframes spIn{to{opacity:1;transform:scale(1)}}
@keyframes spFade{to{opacity:1}}
@keyframes spDraw{to{stroke-dashoffset:0}}
@keyframes spPop{to{transform:scale(1)}}
@keyframes spSweep{0%{opacity:0}15%{opacity:1}100%{opacity:1;transform:translateX(0)}}
@keyframes spUp{to{opacity:1;transform:none}}
@keyframes spOut{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion:reduce){
  .splash *{animation:none!important;opacity:1!important;transform:none!important;stroke-dashoffset:0!important}
  .splash{animation:spOut .3s ease 1.6s forwards!important}
}
@media (prefers-reduced-motion: reduce){.eq i{animation:none;height:60%}#ptr{transition:none}.updp{animation:none}.busy-dot{animation-duration:2.4s}.tlbtn,.tlbtn .chev{transition:none}#top.busy .rf-spin svg,.ln{animation:none}.sheet,#toast,#bar{transition:none}}
`;

// BlogPulse logo (pulse feed), drawn on its dark tile: header mark and the first-run screen
const LOGO_SVG = '<path d="M52 72 H188 M136 168 H172" fill="none" stroke="#F6F7F9" stroke-opacity="0.35" stroke-width="7" stroke-linecap="round"/><path d="M46 120 H82 L98 88 L120 152 L138 102 L150 120 H166" fill="none" stroke="#F6F7F9" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><circle cx="186" cy="120" r="13" fill="#A78BFA"/><path d="M52 168 H116" fill="none" stroke="#2DD4BF" stroke-width="7" stroke-linecap="round"/>';
const REFRESH_SVG = `<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>`;
const ADD_SVG = `<svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h10M4 18h7M18 14v8M14 18h8"/></svg>`;
const SETTINGS_SVG = `<svg viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>`;
const THEME_IDS = ["ink", "sepia", "mint", "contrast", "slate", "night"];
const initTheme = THEME_IDS.includes(settings.theme) ? settings.theme : (Device.isUsingDarkAppearance() ? "night" : "ink");

const buildHTML = () => `<!doctype html><html data-theme="${initTheme}" data-font="${settings.font === "serif" ? "serif" : "sans"}" style="--ts:${+settings.textSize || 1}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<style>${CSS}</style></head><body class="d-${["compact", "tiny"].includes(settings.density) ? settings.density : "comfortable"}">
<div class="splash" id="splash" role="img" aria-label="BlogPulse. Scan. Read. Rate.">
  <div class="spIcon"><svg viewBox="0 0 240 240" aria-hidden="true">
    <path class="spFrame" d="M52 72 H188 M136 168 H172"></path>
    <path class="spDraw" pathLength="100" d="M46 120 H82 L98 88 L120 152 L138 102 L150 120 H166"></path>
    <circle class="spPop" cx="186" cy="120" r="13"></circle>
    <path class="spSweep" d="M52 168 H116"></path>
  </svg></div>
  <div class="spWord">Blog<span>Pulse</span></div>
  <div class="spTag">Scan. Read. Rate.</div>
</div>
<header id="top">
  <div class="tb"><div><h1 class="brand"><svg class="brand-mark" viewBox="0 0 240 240" aria-hidden="true">${LOGO_SVG}</svg><span>Blog<span class="x">Pulse</span></span></h1><div id="status" class="status"></div></div>
    <div class="tb-a"><button class="icon" data-act="cfgopen" aria-label="Settings">${SETTINGS_SVG}</button>
    <button class="icon" data-act="sheet" aria-label="Add and manage blogs">${ADD_SVG}</button>
    <button class="icon rf-spin" data-act="refresh" aria-label="Check for new posts">${REFRESH_SVG}</button></div></div>
  <nav id="cats" class="cats" aria-label="Categories"></nav>
  <nav id="tabs" class="tabs"></nav>
  <div class="sub"><div id="chips" class="chips"></div><div id="grp" class="seg"></div></div>
  <div class="prog"><div id="bar"></div></div>
</header>
<div id="ptr" aria-live="polite"><div class="ptr-in">
  <svg class="ptr-ring" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="11" class="trk"/><circle id="ptrpull" cx="14" cy="14" r="11" class="pull"/><circle id="ptrhold" cx="14" cy="14" r="11" class="hold"/></svg>
  <span class="busy-dot"></span><span id="ptrtext">Pull down to check for new posts</span></div></div>
<main id="list"><div class="booting" role="status"><span class="busy-dot"></span>Loading your posts…</div></main>
<p class="ver">BlogPulse v${VERSION}</p>
<div id="sheet" class="sheet" aria-label="Manage blogs">
  <div class="sh-head"><h2>Blogs</h2><button class="link" data-act="sheet">Done</button></div>
  <div class="sh-body">
    <div class="field"><input id="q" type="search" placeholder="Company name or blog address" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search"><button id="findBtn" class="primary" data-act="find">Find</button></div>
    <p class="hint">Try “kubernetes” or “netflix”, or paste any blog address — the feed is found for you.</p>
    <div id="sh-dyn"></div>
  </div>
</div>
<div id="tldr" class="sheet" aria-label="TL;DR"></div>
<div id="aisheet" class="sheet" aria-label="AI settings"></div>
<div id="cfgsheet" class="sheet" aria-label="Settings"></div>
<div id="player" hidden role="region" aria-label="Reading aloud">
  <span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>
  <div class="pl-info"><b id="plTitle"></b><small id="plSub"></small></div>
  <button id="plPause" class="pl-btn" data-act="plpause" aria-label="Pause"></button>
  <button class="pl-btn" data-act="plnext" aria-label="Next"><svg viewBox="0 0 24 24"><path d="M6 5l9 7-9 7zM16 5h3v14h-3z"/></svg></button>
  <button class="pl-btn" data-act="plstop" aria-label="Stop"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg></button>
</div>
<div id="toast" role="status"></div>
<script>
// Launch screen (app-blueprints · launch-screen 1.0.0): first, self-contained
(function () {
  var sp = document.getElementById("splash");
  if (!sp) return;
  function gone() { sp.classList.add("gone"); sp.setAttribute("aria-hidden", "true"); }
  sp.addEventListener("click", gone);   // tap to skip
  setTimeout(gone, 2900);               // out of the page once the CSS fade is done
})();
// The page goes on screen first; Scriptable hands over the data once it has read it.
window.__parts = [];
window.__bootNote = function (title, detail) {
  var b = document.querySelector(".booting"); if (!b) return;
  b.className = "booting note";
  b.innerHTML = "<b></b><span></span>" + (detail ? "<pre></pre>" : "");
  b.querySelector("b").textContent = title;
  b.querySelector("span").textContent = "Close BlogPulse and open it again. If it keeps happening, run the installer once more.";
  if (detail) b.querySelector("pre").textContent = detail;
};
setTimeout(function () { if (!window.__booted) window.__bootNote("Still loading…"); }, 25000);
document.addEventListener("visibilitychange", function () {   // coming back into view: redraw
  if (document.visibilityState !== "visible") return;
  var d = document.documentElement; d.style.transform = "translateZ(0)"; void d.offsetHeight; d.style.transform = "";
});
window.__boot = function (st) {
  if (window.__booted) return;
  if (!st.articles || !st.articles.length) st.articles = [].concat.apply([], window.__parts);
  window.__parts = [];
  window.__booted = true; window.__INIT = st;
  // make WebKit draw again once the posts are in (helps if the window came up black)
  requestAnimationFrame(function () {
    var d = document.documentElement; d.style.transform = "translateZ(0)"; void d.offsetHeight;
    requestAnimationFrame(function () { d.style.transform = ""; });
  });
  (${clientApp.toString()})();
};</script>
</body></html>`;

// ---------- home-screen widget: BlogPulse's content for the shared frame below ----------
function latestStory() {
  const st = Object.values(stories).sort((a, b) => b.at - a.at)[0];
  return st && Date.now() - st.at < cfg("widgetStoryHours") * 3600e3 ? st : null;
}
function topPick(list, unread, fresh) {
  const pk = computePicks(list, cfg("picksMinRatings"), cfg("picksThreshold"));
  const best = unread.filter(a => pk.picks[a.id]).sort((a, b) => pk.picks[b.id] - pk.picks[a.id])[0];
  if (best) return { a: best, why: "Top pick for you" };
  const st = latestStory();
  const mr = st && (st.mustRead || []).map(m => articles[m.id]).find(a => a && !a.read);
  if (mr) return { a: mr, why: "Top pick from your story" };
  if (fresh[0]) return { a: fresh[0], why: "Newest post" };
  if (unread[0]) return { a: unread[0], why: "Newest unread" };
  return null;
}
// The snapshot the widget reads (saveWidget): counts, the top pick, the stored ✦ story line and a few unread posts,
// as titles, blog names and links only. Saved after scans, reads, Mark all read, ratings, blog changes and a new story.
// "New" means first seen after BlogPulse was last open (settings.lastSession), as before 1.8.0.
function widgetSnapshot() {
  const list = Object.values(articles).sort((a, b) => b.pub - a.pub);
  const unread = list.filter(a => !a.read);
  const fresh = unread.filter(a => !a.seeded && a.seen > (settings.lastSession || 0));
  const pick = topPick(list, unread, fresh);
  const st = Object.values(stories).sort((a, b) => b.at - a.at)[0];
  const post = a => ({ title: a.title, blog: (sources.find(s => s.id === a.src) || {}).title || hostOf(a.link), link: a.link || "" });
  return {
    blogs: sources.length, unread: unread.length, fresh: fresh.length, scanned: settings.lastScan || 0,
    pick: pick ? Object.assign(post(pick.a), { why: pick.why }) : null,
    story: st && (st.dek || st.headline) ? { text: st.dek || st.headline, at: st.at } : null,
    posts: unread.filter(a => !pick || a.id !== pick.a.id).slice(0, 6).map(post),
  };
}
// The widget's content (app-blueprints · widgets, Step 7). As before 1.8.0, the widget checks the blogs itself when the
// last check is older than "widgetScanAfterMin", within "widgetScanBudget"; otherwise, or when the budget runs out, it
// shows the saved snapshot. The scan stays in memory: a widget run writes only the widget snapshot, never BlogPulse's files.
// The ✦ line is the story already written in the app; the widget never calls AI.
async function widgetModel() {
  let d = readWidget();
  const last = Math.max(settings.lastScan || 0, (d && d.scanned) || 0);
  if (sources.length && Date.now() - last > cfg("widgetScanAfterMin") * 60e3) {
    const done = await Promise.race([
      scanAll(() => {}).then(() => true, () => false),
      new Promise(r => Timer.schedule(cfg("widgetScanBudget") * 1000, false, () => r(false))),
    ]);
    if (done) { d = widgetSnapshot(); saveWidget(d); }
  }
  if (!d) d = widgetSnapshot();   // no snapshot yet (first run after updating): from BlogPulse's own files, read only
  if (!d.blogs) return { empty: "Open BlogPulse to follow your first blogs." };
  const story = d.story && Date.now() - d.story.at < cfg("widgetStoryHours") * 3600e3 ? [{ icon: "✦", text: d.story.text, lines: 3 }] : [];
  const rows = story.concat((d.posts || []).map(p => ({ text: p.title, sub: p.blog, url: p.link })));
  const footer = d.scanned ? "Scanned " + wWhen(d.scanned) : "";
  if (!d.pick) {
    return { kicker: "All caught up", title: "Nothing unread", caption: "Following " + d.blogs + (d.blogs === 1 ? " blog" : " blogs"), rows, footer, at: d.scanned };
  }
  return {
    badge: d.fresh ? d.fresh + " new" : d.unread + " unread",
    kicker: d.pick.why,
    title: d.pick.title,
    caption: d.pick.blog,
    rows,
    footer,
    at: d.scanned,
  };
}

// ───────── Widget ─────────
// Shared widget frame (github.com/gadominas/app-blueprints › blueprints/widgets.md).
// An app changes only WIDGET and widgetModel(); everything below WB is the same in every app.
const WIDGET = {
  name: ['Blog', 'Pulse'],                // as on the launch screen: plain part, highlighted part, optional rest
  accent: '#A78BFA',                      // the logo's focal colour (the launch screen's --sp-accent)
  icon: REPO_RAW + 'docs/icon-1024.png',  // the app icon, cached on the phone after the first fetch
  words: { open: 'Tap to open', nothing: 'Nothing to show yet.', updated: 'Updated', yesterday: 'yesterday' },   // in the app's language
};
// Brand colours, the same in every app and in light and dark mode: the logo tile's ground and lines.
const WB = { ground: '#0E1116', raised: '#171B22', ink: '#F6F7F9', ink2: '#C9CED6', muted: '#9AA3AE', good: '#2DD4BF', warn: '#FBBF24' };
const wfm = FileManager.local();
const wPath = (n) => wfm.joinPath(wfm.documentsDirectory(), APP_ID + '-' + n);

// What the widget shows is saved by the app and only read by the widget: fast, offline, no sign-in.
function saveWidget(data) {
  try { wfm.writeString(wPath('widget.json'), JSON.stringify(Object.assign({}, data, { at: Date.now() }))); }
  catch (e) { console.log('Widget: not saved: ' + e); }
}
function readWidget() {
  try { const p = wPath('widget.json'); return wfm.fileExists(p) ? JSON.parse(wfm.readString(p)) : null; }
  catch (e) { return null; }
}

// Tones: ink, soft, muted, accent, good, warn, or a hex colour.
const wColor = (c, a = 1) => {
  const k = c === 'soft' ? 'ink2' : c;
  return new Color(k === 'accent' ? WIDGET.accent : (WB[k] || k), a);
};
// Rounded system fonts, falling back to the plain system font on older Scriptable versions.
function wFont(weight, size) {
  const name = { bold: 'boldRoundedSystemFont', semi: 'semiboldRoundedSystemFont', med: 'mediumRoundedSystemFont' }[weight] || 'regularRoundedSystemFont';
  if (typeof Font[name] === 'function') return Font[name](size);
  return weight === 'bold' ? Font.boldSystemFont(size) : weight === 'semi' ? Font.semiboldSystemFont(size) : weight === 'med' ? Font.mediumSystemFont(size) : Font.systemFont(size);
}
function wText(stack, s, size, weight, tone, lines = 1) {
  const t = stack.addText(String(s));
  t.font = wFont(weight, size);
  t.textColor = wColor(tone);
  t.lineLimit = lines;
  if (lines === 1) t.minimumScaleFactor = 0.75;
  return t;
}
function wWhen(ts) {
  const d = new Date(ts), now = new Date(), f = new DateFormatter();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ago = Math.round((day(now) - day(d)) / 864e5);
  if (ago === 1) return WIDGET.words.yesterday;
  f.dateFormat = ago === 0 ? 'HH:mm' : 'd MMM';
  return f.string(d);
}

// The app's logo tile, from the repository's icon, cached per app version; a monogram until then.
async function widgetIcon() {
  const p = wPath('widget-icon-' + VERSION + '.png');
  try {
    if (wfm.fileExists(p)) return wfm.readImage(p);
    const r = new Request(WIDGET.icon);
    r.timeoutInterval = 8;
    const dc = new DrawContext();
    dc.size = new Size(96, 96); dc.opaque = false; dc.respectScreenScale = false;
    dc.drawImageInRect(await r.loadImage(), new Rect(0, 0, 96, 96));
    const img = dc.getImage();
    const dir = wfm.documentsDirectory();
    wfm.listContents(dir).filter((f) => f.startsWith(APP_ID + '-widget-icon-')).forEach((f) => { try { wfm.remove(wfm.joinPath(dir, f)); } catch (e) {} });
    wfm.writeImage(p, img);
    return img;
  } catch (e) {
    return widgetMonogram();
  }
}
function widgetMonogram() {
  const dc = new DrawContext();
  dc.size = new Size(96, 96); dc.opaque = false; dc.respectScreenScale = false;
  dc.setFillColor(wColor('raised')); dc.fillRect(new Rect(0, 0, 96, 96));
  dc.setFont(wFont('bold', 54)); dc.setTextColor(wColor('accent')); dc.setTextAlignedCenter();
  dc.drawTextInRect(WIDGET.name.join('').charAt(0), new Rect(0, 14, 96, 70));
  return dc.getImage();
}

// Rows that fit: a line counts 1, a sub line 0.8; medium holds 5.5 (3 rows at most), large 12 (6 at most).
function wFit(rows, budget, max) {
  const out = [];
  let used = 0;
  for (const r of rows || []) {
    const n = (r.lines || 1) + (r.sub ? 0.8 : 0);
    if (out.length >= max || used + n > budget + 1e-9) break;   // 1e-9: 3 + 5 × 1.8 must still fit in 12
    used += n;
    out.push(r);
  }
  return out;
}
function wRows(stack, rows) {
  rows.forEach((r, i) => {
    if (i) stack.addSpacer(5);
    const row = stack.addStack();
    row.topAlignContent(); row.spacing = 6;
    if (r.url) row.url = r.url;
    if (r.icon) { const ic = row.addStack(); ic.size = new Size(15, 0); wText(ic, r.icon, 11.5, 'reg', 'ink'); }
    const tx = row.addStack();
    tx.layoutVertically();
    wText(tx, r.text, 12.5, r.lines ? 'reg' : 'med', r.tone || (r.lines ? 'soft' : 'ink'), r.lines || 1);
    if (r.sub) wText(tx, r.sub, 11, 'reg', 'muted');
  });
}

async function renderWidget(m) {
  const fam = config.widgetFamily || 'medium';
  const w = new ListWidget();
  w.url = m.url || URLScheme.forRunningScript();
  w.refreshAfterDate = new Date(Date.now() + cfg('widgetRefreshMin') * 60e3);
  if (fam.startsWith('accessory')) return renderAccessory(w, fam, m);
  const small = fam === 'small', medium = fam === 'medium', large = !small && !medium;
  const g = new LinearGradient();
  g.colors = [wColor('raised'), wColor('ground')]; g.locations = [0, 1];
  g.startPoint = new Point(0, 0); g.endPoint = new Point(0, 1);
  w.backgroundGradient = g;
  w.setPadding(14, 14, 14, 14);

  // 1. Header: logo tile, name (highlighted part in the accent), badge
  const hd = w.addStack();
  hd.centerAlignContent();
  const icon = hd.addImage(await widgetIcon());
  const is = small ? 18 : 20;
  icon.imageSize = new Size(is, is); icon.cornerRadius = is * 0.225;
  hd.addSpacer(6);
  WIDGET.name.forEach((part, i) => {
    if (!part) return;
    const t = hd.addText(part);
    t.font = wFont('bold', small ? 13 : 14); t.textColor = wColor(i === 1 ? 'accent' : 'ink'); t.lineLimit = 1;
  });
  hd.addSpacer();
  if (m.badge && !small) {
    const b = hd.addStack();
    b.setPadding(2, 7, 2, 7); b.cornerRadius = 8;
    b.backgroundColor = wColor(m.badgeTone || 'accent', 0.16);
    wText(b, m.badge, 11.5, 'semi', m.badgeTone || 'accent');
  }
  w.addSpacer(small ? 8 : 10);

  // Empty state: what to do next, never an error
  if (m.empty) {
    wText(w, m.empty, 13, 'semi', 'soft', 3);
    w.addSpacer();
    wText(w, m.footer || WIDGET.words.open, 11, 'reg', 'muted');
    Script.setWidget(w);
    return;
  }

  // 2. Hero: kicker, then a big value with its caption, or a title with its caption
  const body = w.addStack();
  body.topAlignContent();
  const left = body.addStack();
  left.layoutVertically();
  if (medium) left.size = new Size(136, 0);
  if (m.kicker) wText(left, m.kicker, 11, 'semi', m.kickerTone || 'accent');
  if (m.value != null && m.value !== '') {
    wText(left, m.value, small ? 40 : 42, 'bold', m.valueTone || 'ink');
    if (m.caption) wText(left, m.caption, 13, 'semi', 'ink');
  } else {
    if (m.title) wText(left, m.title, small ? 16 : 18, 'bold', 'ink', 2);
    if (m.caption) { left.addSpacer(2); wText(left, m.caption, 12, 'reg', 'soft', 2); }
  }

  // 3. Rows: beside the hero on medium, under it on large, none on small
  const rows = m.rows || [];
  if (medium && wFit(rows, 5.5, 3).length) {
    body.addSpacer(12);
    const right = body.addStack();
    right.layoutVertically();
    wRows(right, wFit(rows, 5.5, 3));
  }
  body.addSpacer();
  if (large && wFit(rows, 12, 6).length) { w.addSpacer(14); wRows(w, wFit(rows, 12, 6)); }

  // 4. Footer: one muted line; amber when the data is stale. Small shows the badge here if there's no footer.
  w.addSpacer();
  const ft = small ? (m.footer || m.badge) : m.footer;
  if (ft) wText(w, (m.stale ? '⟳ ' : '') + ft, 11, 'reg', m.stale ? 'warn' : 'muted');
  Script.setWidget(w);
}

// Lock Screen: iOS tints these, so text only, no colours or logo.
function renderAccessory(w, fam, m) {
  const name = WIDGET.name.join('');
  const a = m.accessory || {};
  const hasValue = m.value != null && m.value !== '';
  const hero = m.empty || (hasValue ? (m.value + ' ' + (m.caption || '')).trim() : (m.title || ''));
  if (fam === 'accessoryInline') {
    w.addText(a.inline || (hero ? name + ': ' + hero : name));
  } else if (fam === 'accessoryCircular') {
    w.addAccessoryWidgetBackground = true;
    const c = w.addStack();
    c.layoutVertically(); c.centerAlignContent();
    const gl = c.addText(a.glyph || name.charAt(0)); gl.font = Font.systemFont(11); gl.centerAlignText();
    const v = c.addText(String(a.value != null ? a.value : hasValue ? m.value : '–'));
    v.font = wFont('bold', 20); v.minimumScaleFactor = 0.5; v.centerAlignText();
  } else {
    const lines = [
      [[name, m.badge || m.kicker].filter(Boolean).join(' · '), 'semi', 12],
      [hero, 'bold', 15],
      [m.empty ? '' : hasValue ? (m.footer || '') : (m.caption || m.footer || ''), 'reg', 12],
    ];
    lines.forEach(([s, wt, size]) => { if (!s) return; const t = w.addText(s); t.font = wFont(wt, size); t.lineLimit = 1; t.minimumScaleFactor = 0.7; });
  }
  Script.setWidget(w);
}

// Widget runs come here and only here: no WebView, Alert or QuickLook may be built or presented.
async function runWidget() {
  const name = WIDGET.name.join('');
  let m = null;
  try { m = await widgetModel(args.widgetParameter || '', config.widgetFamily || 'medium'); }
  catch (e) { console.error('Widget model: ' + e); }
  if (!m) m = { empty: WIDGET.words.nothing };
  try {
    if (m.at && !m.empty && Date.now() - m.at > cfg('widgetStaleMin') * 60e3) {
      m.stale = true;
      m.footer = WIDGET.words.updated + ' ' + wWhen(m.at);
    }
    await renderWidget(m);
  } catch (e) {
    console.error('Widget render: ' + e);
    const w = new ListWidget();
    w.backgroundColor = wColor('ground');
    w.url = URLScheme.forRunningScript();
    wText(w, name, 14, 'bold', 'ink');
    w.addSpacer(4);
    wText(w, WIDGET.words.open, 12, 'reg', 'muted');
    Script.setWidget(w);
  }
}
// ───────── end of Widget ─────────

// ---------- run ----------
// A run marks itself as open while its window is on screen. A new run waits at most 1.5 s for an older
// window to close, then opens anyway: it must never refuse to open (1.9.0 could, if an earlier run hung).
const lockFm = FileManager.local();
const RUN_LOCK = lockFm.joinPath(lockFm.temporaryDirectory(), APP_ID + '-running');
let lockTimer = null;
const lockAge = () => { try { return lockFm.fileExists(RUN_LOCK) ? Date.now() - Number(lockFm.readString(RUN_LOCK)) : Infinity; } catch (e) { return Infinity; } };
const pause = (ms) => new Promise(r => Timer.schedule(ms, false, r));
async function waitForOtherWindow() {
  for (let waited = 0; lockAge() < 2500 && waited < 1500; waited += 300) await pause(300);
}
function holdLock() {
  const beat = () => { try { lockFm.writeString(RUN_LOCK, String(Date.now())); } catch (e) {} };
  beat(); lockTimer = Timer.schedule(1000, true, beat);
}
function releaseLock() {
  if (lockTimer) { lockTimer.invalidate(); lockTimer = null; }
  try { if (lockFm.fileExists(RUN_LOCK)) lockFm.remove(RUN_LOCK); } catch (e) {}
}
// Talks to the page with a time limit, so a stuck page can't stall the app.
const ev = (js, ms = 20000) => Promise.race([
  wv.evaluateJavaScript(js, false),
  pause(ms).then(() => { throw new Error("the page didn't respond in " + ms / 1000 + " s"); }),
]);

async function bootApp(isClosed) {
  const t0 = Date.now();
  startLog(`BlogPulse ${VERSION}: reading data`);
  await loadData();
  startLog(`data read in ${((Date.now() - t0) / 1000).toFixed(1)} s: ${sources.length} blogs, ${Object.keys(articles).length} posts${loadIssues.length ? "; missing: " + loadIssues.join(", ") : ""}`);
  if (isClosed()) return;
  const st = clientState(), arts = st.articles;
  st.articles = [];
  for (let i = 0; i < arts.length; i += 300) await ev(`window.__parts.push(${safeJSON(arts.slice(i, i + 300))})`);   // in pieces: one huge message can stall WebKit
  await ev(`window.__boot(${safeJSON(st)})`);
  let seen = "";
  try { seen = await ev(`document.visibilityState + ", " + innerWidth + "x" + innerHeight + ", splash " + (document.getElementById("splash") || {}).className`, 5000); } catch (e) { seen = String(e.message || e); }
  startLog(`screen ready in ${((Date.now() - t0) / 1000).toFixed(1)} s (page: ${seen})`);
  if (loadIssues.length) toast("Some of your data is still coming from iCloud. Nothing will be saved until you reopen BlogPulse.");
  // Deferred work, once the first screen is drawn: checking blogs, then updates, then the widget's icon.
  Timer.schedule(700, false, () => { if (!isClosed() && dataLoaded && sources.length) runScan().catch(e => toast(String(e.message || e))); });
  Timer.schedule(3500, false, () => {
    if (isClosed() || updateChecked) return;
    updateChecked = true;
    checkForUpdate().then(u => { pendingUpdate = u; offerUpdate(); });
  });
  Timer.schedule(6000, false, () => { widgetIcon(); });
}

async function main() {
  await waitForOtherWindow();
  buildWebView();
  // A page built before its window is on screen can stay black on some iPhones (the page runs, nothing is drawn).
  // So: show an empty dark window first, then build the real page inside it while it's visible.
  await wv.loadHTML('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#0E1116"></body></html>');
  const presented = wv.present(true);
  holdLock();
  await pause(300);                          // let the window finish appearing
  startLog("window on screen");
  await Promise.race([wv.loadHTML(buildHTML()), pause(15000)]);   // the launch screen, drawn on screen
  let closed = false;
  presented.then(() => { closed = true; releaseLock(); });
  bootApp(() => closed).catch(e => {         // runs beside the window: closing it never waits on this
    startLog("start-up failed: " + (e.message || e));
    let log = "";
    try { log = FileManager.local().readString(LOG_PATH).split("\n").slice(-12).join("\n"); } catch (x) {}
    if (!closed) wv.evaluateJavaScript(`window.__bootNote("BlogPulse couldn't open", ${safeJSON(log)})`, false).catch(() => {});
  });
  await presented;
  closed = true;
  releaseLock();
  saveAll();                                 // skips data that was never read
  if (dataLoaded) saveWidget(widgetSnapshot());   // leaving BlogPulse: nothing is "new" for the widget any more
}

// Settings are loaded at the top of the script (load("settings")), before every branch: app and widget runs both use the saved choices.
if (config.runsInWidget || config.runsInAccessoryWidget) {
  await loadData();
  await runWidget();             // never builds or presents a WebView, Alert or QuickLook
} else {
  await main();
}
Script.complete();
