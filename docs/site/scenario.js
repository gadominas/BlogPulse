// Screenshot scenario for BlogPulse: invented sample data and the steps behind every card in the README.
// Regenerate: node app-blueprints/repo-site/tools/capture.js .   (see app-blueprints/repo-site/REBUILD.md)
//
// The blogs are real entries from BlogPulse's built-in list of engineering blogs; every post, summary,
// TL;DR, story and invite below is invented. Nothing here comes from the real feeds or from anyone's account.

'use strict';
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');
// The emulator's DateFormatter and the script's own Date use Node's zone: make it the scenario's (widget "Scanned 08:00").
process.env.TZ = 'Europe/Vilnius';
const NOW = Date.UTC(2026, 9, 29, 6, 12);            // Thursday 29 October 2026, 08:12 in Vilnius
const H = 3600e3, DAY = 24 * H;

// The app's own id hash (BlogPulse.js › hash), so seeded posts match what a feed check would find.
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ───────── Blogs (from the app's built-in catalog) ─────────
const BLOGS = {
  netflix: { title: 'Netflix TechBlog', feed: 'https://netflixtechblog.com/feed', site: 'https://netflixtechblog.com', base: 'https://netflixtechblog.com/' },
  cloudflare: { title: 'Cloudflare Blog', feed: 'https://blog.cloudflare.com/rss/', site: 'https://blog.cloudflare.com', base: 'https://blog.cloudflare.com/' },
  github: { title: 'GitHub Blog', feed: 'https://github.blog/feed/', site: 'https://github.blog', base: 'https://github.blog/engineering/' },
  stripe: { title: 'Stripe Blog', feed: 'https://stripe.com/blog/feed.rss', site: 'https://stripe.com/blog', base: 'https://stripe.com/blog/' },
  spotify: { title: 'Spotify Engineering', feed: 'https://engineering.atspotify.com/feed/', site: 'https://engineering.atspotify.com', base: 'https://engineering.atspotify.com/2026/10/' },
  hf: { title: 'Hugging Face Blog', feed: 'https://huggingface.co/blog/feed.xml', site: 'https://huggingface.co/blog', base: 'https://huggingface.co/blog/' },
  shopify: { title: 'Shopify Engineering', feed: 'https://shopify.engineering/blog.atom', site: 'https://shopify.engineering', base: 'https://shopify.engineering/' },
  k8s: { title: 'Kubernetes Blog', feed: 'https://kubernetes.io/feed.xml', site: 'https://kubernetes.io/blog', base: 'https://kubernetes.io/blog/2026/10/' },
  dropbox: { title: 'Dropbox Tech', feed: 'https://dropbox.tech/feed', site: 'https://dropbox.tech', base: 'https://dropbox.tech/infrastructure/' },
  deepmind: { title: 'Google DeepMind', feed: 'https://deepmind.google/blog/rss.xml', site: 'https://deepmind.google/blog', base: 'https://deepmind.google/discover/blog/' },
};
for (const [k, b] of Object.entries(BLOGS)) b.id = hash(b.feed);

// ───────── Posts (invented) ─────────
// at: hours before NOW. seenAt: when BlogPulse found it (default: 25 min after publishing).
// Last visit was yesterday at 17:12, so posts found after that are "New".
const LAST_SESSION = NOW - 15 * H;
const POSTS = [
  // Today
  { k: 'telemetry', b: 'netflix', cat: 'tech', at: 1.6, title: 'Rebuilding our playback telemetry pipeline on streaming tables',
    ai: 'Netflix moved playback events from nightly batch jobs to streaming tables, cutting the delay before dashboards update from hours to under a minute.' },
  { k: 'reranker', b: 'hf', cat: 'ai', at: 2.8, title: 'Small rerankers that run on a laptop',
    ai: 'A family of compact reranking models that keeps most of the quality of larger ones while running on a CPU, with recipes for search and RAG.' },
  { k: 'ledger', b: 'stripe', cat: 'finance', at: 4.5, title: 'How we reconcile billions of ledger entries every night',
    ai: 'How a double-entry ledger is checked against bank files every night, and how mismatches are grouped so people only look at the real problems.' },
  { k: 'dnsparser', b: 'cloudflare', cat: 'tech', at: 6.9, title: 'Moving our DNS resolver to a memory-safe parser',
    ai: 'The resolver’s packet parser was rewritten in Rust behind a feature flag and compared with the old one on live traffic before the switch.' },
  // Yesterday evening (still new)
  { k: 'agents', b: 'github', cat: 'ai', at: 13.2, title: 'Agent sessions in pull requests: what we learned in the beta',
    ai: 'Lessons from letting coding agents open and update pull requests: short tasks, clear review checkpoints and logs that reviewers can follow.' },
  { k: 'oceanheat', b: 'deepmind', cat: 'science', at: 14.1, title: 'Forecasting marine heatwaves weeks ahead',
    ai: 'A weather model trained on decades of sea-surface data that warns of marine heatwaves up to four weeks ahead, with data released for researchers.' },
  // Yesterday, before the last visit
  { k: 'gateway', b: 'k8s', cat: 'tech', at: 19.5, title: 'Gateway API: weighted traffic shifting is now stable',
    ai: 'Weighted routing between backends graduates to stable in Gateway API, making gradual rollouts possible without a service mesh.' },
  { k: 'devex', b: 'spotify', cat: 'business', at: 21.0, title: 'Measuring developer experience with fewer surveys',
    ai: 'Spotify replaced most of its quarterly developer survey with signals from build, review and deploy tools, and kept one short question.' },
  { k: 'peak', b: 'shopify', cat: 'tech', at: 23.4, title: 'Load testing checkout for the holiday peak',
    ai: 'How checkout is load tested with recorded traffic shapes ahead of the holiday season, and which bottlenecks showed up first.', pinned: NOW - 20 * H },
  // Tuesday
  { k: 'erasure', b: 'dropbox', cat: 'tech', at: 34.0, title: 'Cutting cold storage costs with erasure-coded tiers',
    ai: 'Rarely read data moves to an erasure-coded tier with lower overhead than replication; the post covers repair times and the migration plan.' },
  { k: 'forms', b: 'stripe', cat: 'design', at: 37.5, title: 'Designing payment forms people finish',
    ai: 'Findings from testing checkout forms: fewer fields, inline validation and clear error text raised the share of people who complete payment.', pinned: NOW - 30 * H },
  { k: 'codereview', b: 'hf', cat: 'ai', at: 40.0, title: 'An open dataset of annotated code reviews',
    ai: 'A new open dataset of pull-request review comments labelled by intent, for training and evaluating models that help with code review.' },
  { k: 'consistency', b: 'netflix', cat: 'tech', at: 44.0, title: 'Choosing a consistency model for our feature store', read: 1, rating: 3,
    ai: 'Why the feature store reads from replicas with bounded staleness instead of strong consistency, and how freshness is measured.' },
  // Monday
  { k: 'ratelimit', b: 'cloudflare', cat: 'tech', at: 59.0, title: 'Rate limiting at the edge, explained with queues', read: 1, rating: 3,
    ai: 'An illustrated walk through rate-limiting algorithms as queues, and why counters are kept per data centre instead of globally.' },
  { k: 'pqkeys', b: 'cloudflare', cat: 'tech', at: 62.0, title: 'Post-quantum key agreement for internal services', read: 1, rating: 3,
    ai: 'Internal service-to-service connections now use a hybrid post-quantum key agreement; the post measures the cost in handshake time.' },
  { k: 'backstage', b: 'spotify', cat: 'tech', at: 65.0, title: 'Backstage plugins we retired, and why', pinned: NOW - 50 * H, read: 1,
    ai: 'A review of internal developer portal plugins that saw little use, how they were retired and what replaced them.' },
  { k: 'search', b: 'github', cat: 'tech', at: 68.0, title: 'Code search now understands monorepos', read: 1, rating: 2,
    ai: 'Code search can now scope queries to a package inside a monorepo, using ownership files and build metadata to find the boundaries.' },
  // Last week
  { k: 'shadow', b: 'netflix', cat: 'tech', at: 120, title: 'Shadow traffic for safer database migrations', read: 1, rating: 3,
    ai: 'Copying live reads and writes to a new database before the switch, comparing results and only cutting over once they match.' },
  { k: 'chaos', b: 'netflix', cat: 'tech', at: 160, title: 'Failure injection for stateful services', read: 1, rating: 3,
    ai: 'How failure experiments were extended from stateless services to databases and caches, with guardrails that stop an experiment early.' },
  { k: 'tlsrotation', b: 'cloudflare', cat: 'tech', at: 140, title: 'Rotating certificates for a million origins without a restart', read: 1, rating: 3,
    ai: 'Certificates are reloaded in place across the fleet, with staged rollouts and automatic rollback when error rates move.' },
  { k: 'yjit', b: 'shopify', cat: 'tech', at: 150, title: 'A year of Ruby YJIT in production', read: 1, rating: 1,
    ai: 'Latency and memory numbers after a year of running the Ruby JIT compiler on the main application, and the settings that mattered.' },
];
for (const p of POSTS) {
  const b = BLOGS[p.b];
  p.link = b.base + slug(p.title);
  p.pub = NOW - p.at * H;
  p.id = hash(b.id + '|' + p.link);
}
const post = (k) => POSTS.find((p) => p.k === k);

// What the app keeps in articles.json (BlogPulse.js › ingest, aiSummaries)
function articlesJSON() {
  const out = {};
  for (const p of POSTS) {
    const a = { id: p.id, src: BLOGS[p.b].id, title: p.title, link: p.link, desc: p.ai.split('. ')[0] + '.', pub: p.pub, seen: p.pub + 25 * 60e3,
      ex: p.ai, ai: p.ai, aiCat: p.cat, kw: '', kw0: p.cat };
    if (p.read) a.read = 1;
    if (p.rating) a.rating = p.rating;
    if (p.pinned) a.pinned = p.pinned;
    out[p.id] = a;
  }
  return out;
}
function sourcesJSON() {
  return Object.values(BLOGS).map((b, i) => ({ defCat: b === BLOGS.hf || b === BLOGS.deepmind ? 'ai' : 'tech', id: b.id, title: b.title, feed: b.feed, site: b.site,
    added: NOW - (60 - i * 3) * DAY, lastFetched: NOW - 15 * H }));
}

// Token usage over the last weeks (AI settings › Token usage)
function usageJSON() {
  const days = {};
  const dk = (t) => { const d = new Date(t + 2 * H); return d.toISOString().slice(0, 10); };
  const pattern = [9.1, 4.2, 0, 12.6, 7.3, 5.0, 15.8, 3.1, 0, 8.4, 11.2, 6.7, 14.9, 4.4];   // thousand tokens per day, oldest first
  let tin = 0, tout = 0, calls = 0;
  pattern.forEach((k, i) => {
    if (!k) return;
    const t = NOW - (13 - i) * DAY, n = Math.round(k * 1000), o = Math.round(n * 0.18), c = Math.max(2, Math.round(k / 1.6));
    days[dk(t)] = { calls: c, in: n - o, out: o };
    tin += n - o; tout += o; calls += c;
  });
  const split = [['summaries', 0.46, 0.4], ['story', 0.28, 0.12], ['tldr', 0.18, 0.33], ['invite', 0.07, 0.1], ['test', 0.01, 0.05]];
  const features = {};
  split.forEach(([f, share, cshare]) => { features[f] = { calls: Math.max(1, Math.round(calls * cshare)), in: Math.round(tin * share), out: Math.round(tout * share) }; });
  return { since: NOW - 41 * DAY, p: { anthropic: { calls, in: tin, out: tout, models: { 'claude-haiku-5-5': { calls, in: tin, out: tout } }, features, days } } };
}

function settingsJSON(over) {
  return Object.assign({
    groupBy: 'day', view: 'unread', readOnOpen: false, ai: true, aiProvider: 'anthropic', lastSession: LAST_SESSION, lastScan: NOW - 15 * H,
    checkUpdates: true, speechEngine: 'device', ttsModel: 'gpt-4o-mini-tts', ttsVoice: 'coral', ttsInstructions: '',
    theme: 'auto', density: 'comfortable', font: 'sans', textSize: 1, storyScope: 'new', category: 'all',
    models: { anthropic: { at: NOW - 6 * DAY, list: [
      { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5' }, { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5' }, { id: 'claude-opus-5-5', name: 'Claude Opus 5.5' },
    ] } },
  }, over || {});
}

// ───────── Network fixtures ─────────
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function feedXML(b) {
  const items = POSTS.filter((p) => BLOGS[p.b] === b).map((p) => `<item><title>${xmlEsc(p.title)}</title><link>${p.link}</link><guid>${p.link}</guid>
    <pubDate>${new Date(p.pub).toUTCString()}</pubDate><description>${xmlEsc(p.ai)}</description></item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xmlEsc(b.title)}</title><link>${b.site}</link>\n${items}\n</channel></rss>`;
}
// The article pages the TL;DR and "Listen" read (only their paragraphs matter)
const ARTICLE_TEXT = {
  telemetry: [
    'Every time someone presses play, the player sends a stream of small events: start-up time, bitrate changes, rebuffers and errors. For years these landed in hourly files that a nightly batch job turned into the tables behind our playback dashboards.',
    'That worked until the questions got faster than the data. When a new encoder or a device update went out, teams wanted to know within minutes whether rebuffering moved, not the next morning.',
    'We now write the events into streaming tables that are queryable as soon as they land. A compaction service merges small files in the background, so readers see one table instead of thousands of fragments.',
    'The change brought the delay before dashboards update from several hours to under a minute, and it removed the nightly job that used to be the most common cause of missing data on Monday mornings.',
    'The cost moved rather than disappeared: compaction now runs all day. We cover how we sized it, how we handle late events from devices that were offline, and what we would do differently.',
  ],
  ledger: [
    'Every payment moves money through several accounts, and each movement is recorded twice, once on each side. At the end of each day the ledger has to agree with the files banks send us, line by line.',
    'Most entries match on the first pass. The hard part is the small share that does not: timing differences, partial refunds, fees reported in a different currency, and banks that change their file format without notice.',
    'Instead of sending every mismatch to a person, we group them by cause. A timing difference that resolves itself the next day is parked, a known fee pattern is matched automatically, and only the groups nobody has seen before reach the operations team.',
    'This cut the number of items people review each morning by more than half, and made the remaining ones easier to act on because each group arrives with the entries that explain it.',
  ],
};
function articleHTML(p) {
  const paras = ARTICLE_TEXT[p.k] || [p.ai,
    'This post walks through the problem we started with, the options we compared, and the approach we chose, with the measurements we used to decide.',
    'We also cover what did not work on the first attempt, how we rolled the change out gradually, and the follow-up work we have planned for next year.'];
  return `<!doctype html><html><head><title>${xmlEsc(p.title)}</title><meta name="description" content="${xmlEsc(p.ai)}"></head>
    <body><header><nav>Home Blog</nav></header><article><h1>${xmlEsc(p.title)}</h1>${paras.map((x) => `<p>${xmlEsc(x)}</p>`).join('')}</article><footer>Footer</footer></body></html>`;
}

// AI replies, picked by the request's system prompt. Citations use the numbers the app sent ([n] Title — Blog, …).
function aiReply(req) {
  const j = req.json() || {};
  const system = j.system || (j.messages && j.messages[0] && j.messages[0].content) || '';
  const user = (j.messages || []).map((m) => m.content).join('\n');
  let text = 'OK', usage = { input_tokens: 12, output_tokens: 2 };
  if (/personal tech briefing/.test(system)) {
    const idx = {};
    for (const m of user.matchAll(/^\[(\d+)\] (.+?) — /gm)) idx[m[2]] = +m[1];
    const c = (k) => `[${idx[post(k).title]}]`;
    text = JSON.stringify({
      headline: 'Doing the heavy work once, close to the data',
      dek: 'Six posts from five blogs share one idea: move expensive work out of the hot path, and make the result easy to check.',
      tldr: [
        `Netflix's playback dashboards now update in under a minute after moving events to streaming tables ${c('telemetry')}.`,
        `Stripe groups ledger mismatches by cause, so people only review the new ones ${c('ledger')}.`,
        `Smaller models keep showing up where latency matters: CPU-sized rerankers ${c('reranker')} and agents working in short, reviewable steps ${c('agents')}.`,
      ],
      sections: [
        { title: 'Fresher data, fewer batch jobs', body: `Netflix replaced a nightly job with streaming tables that are queryable as events land, so a bad encoder rollout shows up in minutes instead of the next morning ${c('telemetry')}. The cost moved to a compaction service that runs all day.\n\nStripe tackles a different kind of freshness: reconciling a double-entry ledger against bank files every night, and grouping mismatches so the obvious ones resolve themselves ${c('ledger')}.` },
        { title: 'Safer rewrites on live traffic', body: `Cloudflare rewrote the DNS resolver's packet parser in a memory-safe language and ran it beside the old one on real queries before switching ${c('dnsparser')}. It is the same pattern as comparing two systems on shadow traffic: change the engine, keep the answers identical.` },
        { title: 'Smaller models, tighter loops', body: `Hugging Face shows rerankers small enough for a laptop CPU that keep most of the quality of larger models ${c('reranker')}. GitHub's beta of agent sessions in pull requests points the same way: short tasks and clear review checkpoints worked better than long autonomous runs ${c('agents')}.\n\nOutside software, DeepMind's ocean model gives weeks of warning for marine heatwaves ${c('oceanheat')}.` },
      ],
      mustRead: [
        { n: idx[post('telemetry').title], why: 'A clear before and after for anyone still running nightly aggregation jobs.' },
        { n: idx[post('agents').title], why: 'Practical review rules if your team is trying coding agents.' },
      ],
    });
    usage = { input_tokens: 3820, output_tokens: 760 };
  } else if (/TL;DRs of engineering blog posts/.test(system)) {
    const title = (user.match(/^Title: (.+)$/m) || [])[1] || '';
    const p = POSTS.find((x) => x.title === title) || POSTS[0];
    const T = {
      telemetry: { tldr: 'Netflix moved playback events from hourly files and a nightly job to streaming tables that can be queried as soon as events arrive.',
        points: ['Dashboards now update in under a minute instead of several hours', 'A background compaction service merges small files into one readable table', 'Removing the nightly job also removed the most common cause of missing data', 'Late events from offline devices are merged as they arrive'],
        why: 'Shows the real trade-off of streaming over batch: fresher data in exchange for compaction that runs all day.' },
      ledger: { tldr: 'Stripe checks its double-entry ledger against bank files every night and groups the mismatches by cause.',
        points: ['Most entries match on the first pass', 'Timing differences are parked until the next day', 'Known fee patterns are matched automatically', 'Items reviewed each morning fell by more than half'],
        why: 'A reusable pattern for any reconciliation job: classify exceptions before a person sees them.' },
    }[p.k] || { tldr: p.ai, points: ['What changed and why', 'How it was rolled out', 'What comes next'], why: 'Useful background for teams facing the same problem.' };
    text = JSON.stringify(T);
    usage = { input_tokens: 1450, output_tokens: 190 };
  } else if (/invite someone to read/.test(system)) {
    text = 'Worth ten minutes before Monday: Stripe groups ledger mismatches by cause, so people only review the new ones. Close to the exception queue we want for our own backlog.';
    usage = { input_tokens: 610, output_tokens: 95 };
  } else if (/summarise and categorise blog posts/.test(system)) {
    text = '[]';
    usage = { input_tokens: 300, output_tokens: 4 };
  }
  return { json: { id: 'msg_demo', type: 'message', role: 'assistant', content: [{ type: 'text', text }], usage } };
}

const FEEDLY = { results: [
  { feedId: 'feed/https://engineering.northwind-freight.example/feed', title: 'Northwind Freight Engineering', website: 'https://engineering.northwind-freight.example', description: 'Routing, maps and the data platform behind same-day delivery.', subscribers: 4120 },
  { feedId: 'feed/https://tech.lumenbank.example/rss', title: 'Lumen Bank Data Blog', website: 'https://tech.lumenbank.example', description: 'How a small bank runs its data warehouse and models in the cloud.', subscribers: 1870 },
  { feedId: 'feed/https://blog.harborcloud.example/data.xml', title: 'Harbor Cloud: Data', website: 'https://blog.harborcloud.example', description: 'Databases, storage engines and data pipelines at scale.', subscribers: 960 },
] };

// The update sheet shows the real highlights of the latest release, offered to someone still on the one before.
const RELEASES = JSON.parse(fs.readFileSync(path.join(ROOT, 'releases.json'), 'utf8'));

// The page reads aloud with Web Speech; headless Chromium has no voices, so give it a few that "speak" slowly.
const SPEECH_STUB = `(() => {
  const voices = [
    { name: 'Ava (Premium)', lang: 'en-US', voiceURI: 'com.apple.voice.premium.en-US.Ava', default: true, localService: true },
    { name: 'Daniel (Enhanced)', lang: 'en-GB', voiceURI: 'com.apple.voice.enhanced.en-GB.Daniel', default: false, localService: true },
    { name: 'Samantha', lang: 'en-US', voiceURI: 'com.apple.voice.compact.en-US.Samantha', default: false, localService: true },
    { name: 'Moira', lang: 'en-IE', voiceURI: 'com.apple.voice.compact.en-IE.Moira', default: false, localService: true },
  ];
  let timer = null;
  const syn = {
    speaking: false, paused: false, pending: false,
    getVoices: () => voices,
    speak(u) { clearInterval(timer); let i = 0; syn.speaking = true;
      timer = setInterval(() => { i = Math.min(String(u.text).length - 1, i + 9); if (u.onboundary) u.onboundary({ charIndex: i, name: 'word' }); }, 120); },
    cancel() { clearInterval(timer); syn.speaking = false; }, pause() { clearInterval(timer); }, resume() {},
    addEventListener() {}, removeEventListener() {}, onvoiceschanged: null,
  };
  Object.defineProperty(window, 'speechSynthesis', { value: syn, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; this.rate = 1; this.pitch = 1; };
})();`;

// ───────── Scenario ─────────
const DOCS = '/var/mobile/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents/BlogPulse/';

module.exports = {
  app: { name: 'BlogPulse', script: 'BlogPulse.js', accent: '#A78BFA' },
  now: NOW,
  locale: 'en_US', timezone: 'Europe/Vilnius',
  // Past the launch screen and past the "No new articles" toast of the check that runs on open.
  settle: 4800,
  fixtures: (shot) => {
    const files = {
      [DOCS + 'sources.json']: sourcesJSON(),
      [DOCS + 'articles.json']: articlesJSON(),
      [DOCS + 'usage.json']: usageJSON(),
      [DOCS + 'settings.json']: settingsJSON(shot.settings),
    };
    if (shot.widget) {
      files[DOCS + 'settings.json'] = settingsJSON({ lastScan: NOW - 12 * 60e3 });
      files[DOCS + 'stories.json'] = { 'new|all': { scope: 'new', cat: 'all', sig: 'x', at: NOW - 40 * 60e3, ids: [], provider: 'anthropic',
        headline: 'Doing the heavy work once, close to the data',
        dek: 'Fresher dashboards at Netflix, smarter reconciliation at Stripe and smaller models that run on a laptop.', tldr: [], sections: [], mustRead: [] } };
    }
    const routes = [
      { match: /raw\.githubusercontent\.com\/gadominas\/BlogPulse\/main\/releases\.json/, respond: () => ({ json: RELEASES }) },
      { match: /icon-1024\.png/, respond: { file: path.join(ROOT, 'docs', 'icon-1024.png') } },
      { match: 'api.anthropic.com/v1/messages', respond: aiReply },
      { match: 'api.anthropic.com/v1/models', respond: { json: { data: settingsJSON().models.anthropic.list.map((m) => ({ id: m.id, display_name: m.name, created_at: '2026-09-01T00:00:00Z' })) } } },
      { match: 'cloud.feedly.com/v3/search/feeds', respond: { json: FEEDLY } },
    ];
    for (const b of Object.values(BLOGS)) routes.push({ match: (u) => u === b.feed, respond: () => ({ body: feedXML(b), contentType: 'application/rss+xml' }) });
    for (const p of POSTS) routes.push({ match: (u) => u === p.link, respond: () => ({ body: articleHTML(p), contentType: 'text/html' }) });
    return { files, keychain: { BLOGPULSE_ANTHROPIC_KEY: 'sk-ant-demo-0000000000001234' }, routes, pageInit: SPEECH_STUB };
  },
  shots: [
    { id: '01-unread', label: 'Every blog, checked on open', caption: 'New posts grouped by day, with AI summaries, topics, ratings and picks.' },
    { id: '02-story', label: 'The Story', caption: 'The latest posts blended into one short, cited briefing.',
      run: async (h) => { await h.tap('.tab.story-tab'); await h.wait(1800); } },
    { id: '03-tldr', label: 'TL;DR in place', caption: 'The gist of a post right in the list, without opening it.',
      run: async (h) => { await h.tap(`#c-${post('telemetry').id} .tlbtn`); await h.wait(1600); } },
    { id: '04-topics', label: 'Topic pages', caption: 'Posts sort themselves into topics. Tap one or swipe between them.',
      run: async (h) => { await h.tap('.cat-pill[data-v="ai"]'); await h.wait(600); } },
    { id: '05-invite', label: 'Invite someone to read', caption: 'A short note in your words, written by AI from your instructions.',
      run: async (h) => {
        await h.tap(`#c-${post('ledger').id} .tlbtn`); await h.wait(1500);
        await h.tap(`#c-${post('ledger').id} [data-act="tldrpanel"]`); await h.wait(600);
        await h.type('#invWho', 'my platform team');
        await h.type('#invInstr', 'Casual, two sentences, link it to our reconciliation backlog');
        await h.tap('[data-act="invgo"]'); await h.wait(1500);
        await h.eval(() => { const s = document.querySelector('#tldr'); const r = document.querySelector('.inv-actions').getBoundingClientRect(); s.scrollTop += r.bottom - (innerHeight - 8); });
        await h.wait(400);
      } },
    { id: '06-read-later', label: 'Read it later', caption: 'Bookmark a post, tap Done when you have read it.',
      run: async (h) => { await h.tap('.tab[data-v="later"]'); await h.wait(600); } },
    { id: '07-listen', label: 'Listen instead of reading', caption: 'A day of posts, a story or a whole article, read aloud.',
      run: async (h) => { await h.tap('.gh-listen >> nth=0'); await h.wait(2200); } },
    { id: '08-add-blogs', label: 'Follow any blog', caption: 'Search by name or paste an address; the feed is found for you.',
      run: async (h) => { await h.tap('[data-act="sheet"]'); await h.type('#q', 'data'); await h.tap('#findBtn'); await h.wait(1200); } },
    { id: '09-launch', label: 'Launch screen', caption: 'The pulse draws itself, then Scan. Read. Rate. Tap to skip.', settle: 1700, after: 0 },
    { id: '10-settings', label: 'Settings', caption: 'Colours, layout, text size and every limit, saved at once.',
      run: async (h) => { await h.tap('[data-act="cfgopen"]'); await h.wait(500); } },
    { id: '11-ai-settings', label: 'AI on your own key', caption: 'Claude or OpenAI, any model, with token usage per day and feature.',
      run: async (h) => {
        await h.tap('[data-act="cfgopen"]'); await h.wait(400);
        await h.tap('#cfgsheet [data-act="aiopen"]'); await h.wait(900);
        await h.eval(() => { const s = document.querySelector('#aisheet'); const r = document.querySelector('#aisheet .aicard').getBoundingClientRect(); s.scrollTop += r.top - 62; });
        await h.wait(400);
      } },
    { id: '12-update', label: 'Updates itself', caption: 'A new version shows its three best features and installs in one tap.',
      run: async (h) => {
        const [latest, prev] = RELEASES.releases;
        await h.eval((u) => window.__showUpdate(u), { current: prev.version, latest: latest.version, title: latest.title, date: latest.date, skipped: 1, highlights: latest.highlights, script: 'BlogPulse.js' });
        await h.wait(900);
      } },
    { id: '13-dark', label: 'Dark mode', caption: 'Auto colours follow the iPhone; Picks learn from your ★★★ ratings.', dark: true,
      run: async (h) => { await h.tap('.tab[data-v="picks"]'); await h.wait(600); } },
    { id: '14-widget', label: 'Home Screen widget', caption: 'Your top pick, the latest story line and what else is unread.', widget: 'medium' },
  ],
};
