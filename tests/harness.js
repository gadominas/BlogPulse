// BlogPulse test harness: runs the real BlogPulse.js in Node with Scriptable's APIs stubbed (see docs/TESTING.md).
// The page runs in jsdom; its blogpulse:// bridge calls reach the script's shouldAllowRequest, as on the phone.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const SRC = fs.readFileSync(process.env.BLOGPULSE_SCRIPT || path.join(__dirname, "..", "BlogPulse.js"), "utf8");
const BRIDGE_HOOK = 'window.__hostBridge(url)';   // portable-bridge recipe: the page hands bridge URLs to __hostBridge when it exists

const H = 3600e3, DAY = 24 * H;
// A Google News article id of the newer kind: the publisher's address isn't inside, it has to be asked for
const GN_ID = Buffer.from("\x08\x13\x22\x00AU_yqLtestNetflixVirtualThreads").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const rfc = t => new Date(t).toUTCString(), iso = t => new Date(t).toISOString();

// ---------- fixtures: the smallest realistic answers ----------
function feeds(now) {
  return {
    // RSS 2.0 with HTML descriptions and content:encoded
    "https://netflixtechblog.com/feed": `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>Netflix TechBlog - Medium</title><link>https://netflixtechblog.com</link>
<item><title><![CDATA[Scaling Java services with virtual threads]]></title><link>https://netflixtechblog.com/a1</link><guid>a1</guid><pubDate>${rfc(now - H)}</pubDate><description>&lt;p&gt;How we moved &amp;amp; scaled &lt;b&gt;Java&lt;/b&gt; services to virtual threads and cut tail latency.&lt;/p&gt;</description></item>
<item><title>Data mesh at Netflix</title><link>https://netflixtechblog.com/a2</link><guid>a2</guid><pubDate>${rfc(now - 10 * DAY)}</pubDate><content:encoded><![CDATA[<p>How teams own their data products.</p>]]></content:encoded></item>
<item><title>Bond markets and inflation: what investors should watch</title><link>https://netflixtechblog.com/a3</link><guid>a3</guid><pubDate>${rfc(now - 2 * H)}</pubDate><description>Interest rates, the Fed and bond funds explained for investors.</description></item>
</channel></rss>`,
    // Atom with relative links
    "https://spring.io/blog.atom": `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title type="text">Spring</title><link rel="self" href="https://spring.io/blog.atom"/><link href="https://spring.io/blog"/>
<entry><title>Spring Boot 4.1 released</title><link rel="alternate" href="/blog/2026/10/boot"/><id>tag:spring,1</id><published>${iso(now - 2 * H)}</published><summary type="html">&lt;p&gt;Spring Boot 4.1 brings virtual threads by default and faster start-up.&lt;/p&gt;</summary></entry>
<entry><title>Spring AI 2.0 brings agents to Spring apps</title><link rel="alternate" href="/blog/2026/10/ai"/><id>tag:spring,2</id><published>${iso(now - 5 * H)}</published><summary type="html">&lt;p&gt;Agent workflows, tools and model routing for Spring developers.&lt;/p&gt;</summary></entry>
</feed>`,
    "https://medium.com/feed/inkitt-tech": `<?xml version="1.0"?><rss version="2.0"><channel><title>Inkitt Engineering - Medium</title><link>https://medium.com/inkitt-tech</link>
<item><title>How we orchestrate resumable agents</title><link>https://medium.com/inkitt-tech/agents-1</link><guid>ik1</guid><pubDate>${rfc(now - 4 * H)}</pubDate><description>Agents that pause, resume and open pull requests.</description></item>
</channel></rss>`,
    // a Yahoo site (consent wall in Europe) and a Google News link (publisher hidden behind Google's consent)
    "https://tech.yahoo.com/rss": `<?xml version="1.0"?><rss version="2.0"><channel><title>Yahoo Tech</title><link>https://tech.yahoo.com</link>
<item><title>Chipmakers race to ship AI PCs before the holidays</title><link>https://tech.yahoo.com/ai/articles/ai-pcs.html</link><guid>yt1</guid><pubDate>${rfc(now - 2 * H)}</pubDate><description>AI PCs arrive in stores.</description></item>
<item><title>Google News: Netflix scales Java with virtual threads</title><link>https://news.google.com/rss/articles/${GN_ID}?oc=5</link><guid>gn1</guid><pubDate>${rfc(now - 3 * H)}</pubDate><description>Via Google News.</description></item>
</channel></rss>`,
    "https://feed.infoq.com/": `<?xml version="1.0"?><rss version="2.0"><channel><title>InfoQ</title><link>https://www.infoq.com</link>
<item><title>Inkitt Builds a One-Shot PR Creator with Resumable Agent Orchestration</title><link>https://www.infoq.com/news/2026/11/inkitt</link><guid>iq1</guid><pubDate>${rfc(now - 3 * H)}</pubDate><description>An agent writes, tests and opens pull requests, and resumes after failures.</description></item>
</channel></rss>`,
  };
}
const ARTICLE = `<html><head><meta property="og:description" content="Netflix moved its Java fleet to virtual threads and cut tail latency."><meta name="author" content="Maya Chen"><meta property="og:image" content="https://netflixtechblog.com/cover.jpg"></head><body><nav>menu</nav><article><h1>Scaling Java</h1>
<p>Virtual threads arrived in JDK 21 and we spent a year rolling them across hundreds of Java services in production at Netflix.</p>
<h2>Why we moved</h2><p>Our thread-per-request services were hitting thread pool exhaustion during traffic spikes, which caused cascading timeouts across the fleet.</p>
<p>With virtual threads, blocking calls no longer pin carrier threads in most cases, so Java services handle far more concurrent requests.</p>
<h2>Pitfalls</h2><p>Synchronized blocks still pin carrier threads, so we replaced them with ReentrantLock in hot paths before enabling virtual threads.</p>
<ul><li>Find pinning with -Djdk.tracePinnedThreads=full first.</li><li>Replace synchronized on hot paths with ReentrantLock.</li></ul>
<pre><code>var ex = Executors.newVirtualThreadPerTaskExecutor();</code></pre>
<p>The result was a forty percent drop in p99 latency for Java services and simpler code than the reactive alternatives we had tried before.</p>
<p>${"More detail on rollout, metrics and the team's lessons along the way. ".repeat(8)}</p></article><footer>f</footer></body></html>`;
const CONSENT_PAGE = `<html><head><title>Before you continue</title></head><body><div class="cmp"><h2>We value your privacy</h2><p>We and our partners use cookies. Accept all or manage your consent preferences.</p><button>Accept all</button></div></body></html>`;
const PAYWALL_PAGE = `<html><body><article><h1>Members only</h1><p>Subscribe to continue reading this story.</p></article></body></html>`;
const YAHOO_CONSENT = `<html><body><form method="post" action="https://consent.yahoo.com/v2/collectConsent?sessionId=3_cc-session_abc"><input type="hidden" name="csrfToken" value="tok"><input type="hidden" name="sessionId" value="3_cc-session_abc"><button name="agree" value="agree">Accept all</button><button name="reject" value="reject">Reject all</button></form></body></html>`;
const GOOGLE_CONSENT = `<html><body><form action="https://consent.google.com/save" method="POST"><input type="hidden" name="gl" value="LT"><input type="hidden" name="set_eom" value="true"><button>Reject all</button></form><form action="https://consent.google.com/save" method="POST"><input type="hidden" name="set_eom" value="false"><button>Accept all</button></form></body></html>`;
const SITE_WITH_FEED = `<html><head><title>Spring</title><link rel="alternate" type="application/atom+xml" title="Spring" href="https://spring.io/blog.atom"></head><body>Spring blog</body></html>`;

// AI answers, by the kind of prompt
function aiAnswer(system, user, log) {
  if (/single word OK/.test(system)) return "OK";
  if (/summarise and categorise blog posts/.test(system)) {
    const ids = [...user.matchAll(/^\[(\d+)\] (.*)$/gm)].map(m => [+m[1], m[2]]);
    return JSON.stringify(ids.map(([i, t]) => ({ i, s: "AI: " + t.slice(0, 60) + " — what changed and why it matters.", c: /bond|invest|market/i.test(t) ? "finance" : /AI|agent/.test(t) ? "ai" : "tech" })));
  }
  if (/personal tech briefing/.test(system)) return JSON.stringify({ headline: "Virtual threads go mainstream", dek: "Java teams move to virtual threads while Spring makes them the default.",
    tldr: ["Netflix cut p99 latency with virtual threads [0].", "Spring Boot 4.1 turns them on by default [1].", "Agents arrive in Spring AI 2.0 [2]."],
    sections: [{ title: "Java's new concurrency", body: "Netflix rolled virtual threads across its fleet [0].\n\nSpring follows with new defaults [1]." }, { title: "Agents in Spring", body: "Spring AI 2.0 adds agent workflows [2]." }],
    mustRead: [{ n: 0, why: "Real numbers from production." }] });
  if (/TL;DRs of engineering blog posts/.test(system)) return JSON.stringify({ tldr: "Netflix moved its Java services to virtual threads and cut p99 latency by forty percent.", points: ["Thread pools ran dry during spikes.", "Synchronized blocks were replaced with ReentrantLock.", "p99 latency fell 40%."], why: "A low-risk change most JDK 21 services can make.", mins: 6 });
  if (/invite someone to read an article/.test(system)) { log.invitePrompts.push(user); return "Hi! This one is worth five minutes: Netflix halved tail latency with virtual threads."; }
  if (/answer questions about one article/.test(system)) { log.chatPrompts.push(user); return "- It cuts **p99 latency** by 40%.\n- Synchronized blocks had to go first."; }
  return "OK";
}

function makeEnv(opts = {}) {
  const now = Date.now();
  const files = opts.files || {};
  const kc = opts.kc || {};
  const log = { feedHits: {}, requests: [], unknownUrls: [], opened: [], shares: [], copied: [], spoken: [], widgets: [], alerts: [], aiBodies: [], invitePrompts: [], chatPrompts: [], speech: [], analytics: [], jsErrors: null };
  // Two managers on one store: iCloud Drive and the phone. Paths say which one wrote a file.
  const ICLOUD = "/icloud/Documents", LOCAL = "/local/Documents", TMP = "/local/tmp";
  const ICLOUD_ERR = "iCloud is not supported. Make sure that you are logged into iCloud in the device settings.";
  const mkFm = (docs) => ({
    documentsDirectory: () => docs, temporaryDirectory: () => TMP, libraryDirectory: () => "/local/Library",
    joinPath: (a, b) => a + "/" + b,
    fileExists: p => p in files || Object.keys(files).some(k => k.startsWith(p + "/")) || p === docs + "/BlogPulse",
    isDirectory: p => !(p in files), createDirectory: () => {},
    readString: p => { if (!(p in files)) return null; if (opts.damaged && p.endsWith(opts.damaged)) return "{ not json"; return files[p]; },
    writeString: (p, s) => { files[p] = String(s); },
    remove: p => { delete files[p]; },
    listContents: d => Object.keys(files).filter(k => k.startsWith(d + "/")).map(k => k.slice(d.length + 1)),
    isFileStoredIniCloud: p => !!(opts.slowCloud && p.endsWith(opts.slowCloud)),
    isFileDownloaded: p => !(opts.slowCloud && p.endsWith(opts.slowCloud)),
    downloadFileFromiCloud: p => (opts.slowCloud && p.endsWith(opts.slowCloud)) ? new Promise(() => {}) : Promise.resolve(),
    modificationDate: p => (p in files ? new Date(now) : null), creationDate: () => new Date(now),
    readImage: () => ({ size: { width: 96, height: 96 } }), writeImage: (p) => { files[p] = "IMG"; },
  });
  const icloudFm = mkFm(ICLOUD), localFm = mkFm(LOCAL);
  // A phone not signed in to iCloud: the manager exists, every call on it throws (and is recorded, caught or not)
  const noICloudFm = new Proxy({}, { get: (_, k) => (k === "joinPath" ? icloudFm.joinPath : () => { (log.icloudTouched = log.icloudTouched || []).push(String(k)); throw new Error(ICLOUD_ERR); }) });

  // ---------- network: fixtures only ----------
  const FEEDS = feeds(now);
  const rel = opts.releases || { releases: [{ version: "1.0.0", date: "2026-01-01", title: "Old", highlights: [] }] };
  function route(url, req) {
    log.requests.push(url);
    const u = new URL(url);
    const body = () => { try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; } };
    const feedUrl = FEEDS[url] ? url : url.replace(/\?.*$/, "");
    if (FEEDS[feedUrl]) {
      log.feedHits[feedUrl] = (log.feedHits[feedUrl] || 0) + 1;
      if (opts.feedDown && feedUrl.includes(opts.feedDown)) return [503, "Service Unavailable", "text/html"];
      let xml = FEEDS[feedUrl];
      if (opts.newPost && feedUrl.includes("netflix") && log.feedHits[feedUrl] >= 2)   // a post published between two checks
        xml = xml.replace("<item>", `<item><title>Netflix open-sources its chaos testing toolkit</title><link>https://netflixtechblog.com/a4</link><guid>a4</guid><pubDate>${rfc(Date.now() - 60e3)}</pubDate><description>Chaos testing for every team.</description></item><item>`);
      return [200, xml, "application/rss+xml"];
    }
    if (u.hostname === "spring.io" && (u.pathname === "/" || u.pathname === "/blog")) return [200, SITE_WITH_FEED, "text/html"];
    if (u.hostname === "cloud.feedly.com" && u.pathname === "/v3/search/feeds") {
      const q = (u.searchParams.get("query") || "").toLowerCase();
      const R = [{ feedId: "feed/https://medium.com/feed/inkitt-tech", title: "Inkitt Engineering", website: "https://medium.com/inkitt-tech", description: "How Inkitt builds", subscribers: 1200 },
        { feedId: "feed/https://spring.io/blog.atom", title: "Spring", website: "https://spring.io/blog", description: "News from the Spring team", subscribers: 40000 },
        { feedId: "feed/https://feed.infoq.com/", title: "InfoQ", website: "https://www.infoq.com", description: "Software development news", subscribers: 90000 }];
      return [200, JSON.stringify({ results: R.filter(r => r.title.toLowerCase().includes(q) || q.includes(r.title.toLowerCase())) })];
    }
    // article pages
    if (u.hostname === "netflixtechblog.com" && /^\/a\d$/.test(u.pathname)) {
      const mode = (opts.article || {})[u.pathname.slice(1)] || "ok";
      if (mode === "consent") return [200, CONSENT_PAGE, "text/html"];
      if (mode === "paywall") return [200, PAYWALL_PAGE, "text/html"];
      if (mode === "403") return [403, "Forbidden", "text/html"];
      return [200, ARTICLE, "text/html"];
    }
    if (u.hostname === "netflixtechblog.com" && u.pathname === "/cover.jpg") return [200, "JPEG", "image/jpeg"];
    if (/^(spring\.io|www\.infoq\.com)$/.test(u.hostname)) return [200, ARTICLE.replace(/Netflix/g, "the team"), "text/html"];
    // Yahoo: the article redirects to the consent page until the consent cookies come with it
    if (u.hostname === "tech.yahoo.com" && u.pathname.startsWith("/ai/")) {
      if (!/A1=/.test((req.headers || {}).Cookie || "")) { log.consent = (log.consent || []).concat("yahoo-wall"); return { code: 200, body: YAHOO_CONSENT, url: "https://consent.yahoo.com/v2/collectConsent?sessionId=3_cc-session_abc" }; }
      return [200, ARTICLE.replace(/Netflix/g, "Yahoo"), "text/html"];
    }
    if (u.hostname === "consent.yahoo.com" && req.method === "POST") { log.consent = (log.consent || []).concat("yahoo-agree"); log.consentBody = req.body; return { code: 200, body: "ok", cookies: [{ name: "A1", value: "y1", domain: ".yahoo.com" }] }; }
    if (u.hostname === "guce.yahoo.com" && u.pathname === "/copyConsent") { log.consent = (log.consent || []).concat("yahoo-copy"); return { code: 200, body: "ok", cookies: [{ name: "GUCS", value: "g1", domain: ".yahoo.com" }] }; }
    // Google News: Google's consent first (without the SOCS cookie Google sets), then the signed article page, then the publisher's address
    if (u.hostname === "news.google.com" && u.pathname.startsWith("/rss/articles/")) {
      if (!/SOCS=CAESNQ/.test((req.headers || {}).Cookie || "")) { log.consent = (log.consent || []).concat("google-wall"); return { code: 200, body: GOOGLE_CONSENT, url: "https://consent.google.com/ml?continue=" + encodeURIComponent(url) }; }
      return [200, `<html><body><c-wiz><div jscontroller="x" data-n-a-id="${GN_ID}" data-n-a-ts="1730000000" data-n-a-sg="SiGnAtUrE"></div></c-wiz></body></html>`, "text/html"];
    }
    if (u.hostname === "consent.google.com" && u.pathname === "/save") { log.consent = (log.consent || []).concat("google-" + (/set_eom=true/.test(req.body) ? "reject" : "accept")); return { code: 200, body: "ok", cookies: [{ name: "SOCS", value: "CAESNQ", domain: ".google.com" }] }; }
    if (u.hostname === "news.google.com" && u.pathname === "/_/DotsSplashUi/data/batchexecute") {
      log.gnDecoded = (log.gnDecoded || 0) + 1;
      return [200, ")]}'\n\n" + JSON.stringify([["wrb.fr", "Fbv4je", JSON.stringify(["garturlres", "https://netflixtechblog.com/a1", 1]), null, null, null, "generic"]])];
    }
    if (u.hostname === "r.jina.ai") {
      log.jina = (log.jina || 0) + 1; log.jinaAuth = (req.headers || {}).Authorization || null;
      if (opts.jinaNeedsKey && !log.jinaAuth) return [401, JSON.stringify({ readableMessage: "Too many requests without an API key" })];
      return [200, "Title: Scaling Java\n\nMarkdown Content:\nVirtual threads arrived in JDK 21 and we spent a year rolling them across hundreds of services.\n\n" + "More detail on rollout and metrics. ".repeat(40), "text/plain"];
    }
    // AI
    if (u.hostname === "api.anthropic.com" && u.pathname === "/v1/messages") {
      const b = body(); log.aiBodies.push({ provider: "anthropic", model: b.model, system: b.system, user: (b.messages || [])[0] && b.messages[0].content });
      if (opts.aiFail) return [500, JSON.stringify({ error: { message: "Overloaded" } })];
      const text = aiAnswer(String(b.system || ""), String(((b.messages || [])[0] || {}).content || ""), log);
      return [200, JSON.stringify({ content: [{ type: "text", text }], usage: { input_tokens: 1200, output_tokens: 300 } })];
    }
    if (u.hostname === "api.anthropic.com" && u.pathname === "/v1/models") return [200, JSON.stringify({ data: [{ id: "claude-haiku-5-5", display_name: "Claude Haiku 5.5", created_at: "2026-05-01T00:00:00Z" }, { id: "claude-opus-5-5", display_name: "Claude Opus 5.5", created_at: "2026-06-01T00:00:00Z" }] })];
    if (u.hostname === "api.openai.com" && u.pathname === "/v1/chat/completions") {
      const b = body(), sys = ((b.messages || [])[0] || {}).content || "", usr = ((b.messages || [])[1] || {}).content || "";
      log.aiBodies.push({ provider: "openai", model: b.model, system: sys, user: usr });
      if (opts.aiFail) return [500, JSON.stringify({ error: { message: "Server error" } })];
      return [200, JSON.stringify({ choices: [{ message: { content: aiAnswer(String(sys), String(usr), log) } }], usage: { prompt_tokens: 900, completion_tokens: 200 } })];
    }
    if (u.hostname === "api.openai.com" && u.pathname === "/v1/models") return [200, JSON.stringify({ data: [{ id: "gpt-5", created: 1750000000 }, { id: "gpt-4o-mini", created: 1720000000 }, { id: "gpt-4o-mini-tts", created: 1745000000 }, { id: "tts-1-hd", created: 1700000000 }, { id: "text-embedding-3-small", created: 1 }] })];
    if (u.hostname === "api.openai.com" && u.pathname === "/v1/audio/speech") { log.speech.push(body()); return opts.ttsFail ? [401, JSON.stringify({ error: { message: "Incorrect API key provided" } })] : [200, "MP3DATA", "audio/mpeg"]; }
    if (u.hostname === "raw.githubusercontent.com" && /\.png$/.test(u.pathname)) return [200, "PNG", "image/png"];   // the widget's icon
    // updates
    if (u.hostname === "raw.githubusercontent.com" && u.pathname.endsWith("/releases.json")) return [200, JSON.stringify(rel)];
    if (u.hostname === "raw.githubusercontent.com" && u.pathname.endsWith("/BlogPulse.js")) return [200, opts.newScript || SRC.replace(/const VERSION = '[0-9.]+';/, "const VERSION = '99.0.0';")];
    // usage analytics
    if (u.hostname === "us.i.posthog.com") { const b = body(); log.analytics.push(...(b.batch || [b])); return [200, '{"status":1}']; }
    log.unknownUrls.push(url);
    return [404, "not mocked: " + url];
  }
  class Request {
    constructor(url) { this.url = url; this.headers = {}; this.method = "GET"; this.timeoutInterval = 60; }
    async _go() {
      let r = route(this.url, this);
      if (Array.isArray(r)) r = { code: r[0], body: r[1], type: r[2] };
      this.response = { statusCode: r.code, url: r.url || this.url, headers: { "Content-Type": r.type || "application/json" }, cookies: r.cookies || [] };
      return r.body;
    }
    async loadString() { return this._go(); }
    async loadJSON() { return JSON.parse(await this._go()); }
    async load() { const b = await this._go(); return { toBase64String: () => Buffer.from(String(b)).toString("base64"), toRawString: () => String(b) }; }
    async loadImage() { await this._go(); return { size: { width: 96, height: 96 } }; }
  }
  // ---------- dialogs ----------
  const alertValues = opts.alertValues || [];
  log.pushAlert = v => alertValues.push(v);
  class Alert {
    constructor() { this.fields = []; this.actions = []; }
    addTextField() { this.fields.push(null); return {}; } addSecureTextField() { this.fields.push(null); return {}; }
    addAction(t) { this.actions.push(t); } addCancelAction(t) { this.actions.push(t); } addDestructiveAction(t) { this.actions.push(t); }
    async present() { log.alerts.push(this.title); this.vals = alertValues.shift() || {}; return this.vals.cancel ? -1 : (this.vals.action || 0); }
    async presentAlert() { return this.present(); } async presentSheet() { return this.present(); }
    textFieldValue(i) { return (this.vals.fields || [])[i] || ""; }
  }
  // ---------- the page ----------
  let dom = null, wvRef = null, resolvePresent;
  const presented = new Promise(r => { resolvePresent = r; });
  class WebView {
    constructor() { wvRef = this; log.webviews = (log.webviews || 0) + 1; }
    async loadHTML(html) {
      if (!html.includes(BRIDGE_HOOK)) { if (/clientApp|blogpulse:\/\//.test(html)) throw new Error("bridge hook not found"); log.blankFirst = true; dom = new JSDOM(html); return; }
      dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://local.test/",
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
          w.scrollTo = () => {};
          w.HTMLElement.prototype.scrollIntoView = function () { (log.scrolledTo = log.scrolledTo || []).push(this.className || this.id); };
          w.__nav = u => { Promise.resolve(wvRef.shouldAllowRequest({ url: u })).catch(e => { log.jsErrors = (log.jsErrors || []).concat("bridge: " + (e.stack || e)); }); };
          w.__hostBridge = w.__nav;   // as a native shell does: bridge URLs go straight to shouldAllowRequest
          w.addEventListener("error", e => { log.jsErrors = (log.jsErrors || []).concat(String(e.error && e.error.stack || e.message)); });
          // iOS media session (silent-switch handling)
          w.navigator.audioSession = { type: "auto" };
          // a fake Web Speech API (opts.speech: true), driven by the test: u.onboundary / u.onend
          if (opts.speech) {
            const V = (name, lang, uri) => ({ name, lang, voiceURI: uri || ("com.apple.voice." + name), default: false, localService: true });
            w.SpeechSynthesisUtterance = function (t) { this.text = t; };
            w.speechSynthesis = { paused: false, _cur: null, addEventListener() {},
              getVoices: () => [V("Samantha", "en-US"), V("Ava (Premium)", "en-US", "com.apple.voice.premium.en-US.Ava"), V("Daniel (Enhanced)", "en-GB", "com.apple.voice.enhanced.en-GB.Daniel"), V("Rytis", "lt-LT")],
              speak(u) { log.spoken.push(u.text); this._cur = u; if (!opts.manualSpeech) setTimeout(() => { if (this._cur === u && !this.paused) { u.onboundary && u.onboundary({ charIndex: 1 }); u.onend && u.onend(); } }, 5); },
              cancel() { const u = this._cur; this._cur = null; u && u.onerror && u.onerror({ error: "interrupted" }); },
              pause() { this.paused = true; }, resume() { this.paused = false; } };
          }
          w.Audio = class { constructor() { this.src = ""; this.paused = true; (log.audios = log.audios || []).push(this); } setAttribute() {} play() { this.paused = false; (log.plays = log.plays || []).push(String(this.src).slice(0, 22)); return Promise.resolve(); } pause() { this.paused = true; } };
        } });
    }
    async present() { return presented; }
    async evaluateJavaScript(code) { try { return dom.window.eval(code); } catch (e) { log.jsErrors = (log.jsErrors || []).concat(String(e.stack || e)); throw e; } }
  }
  // ---------- widgets ----------
  class Stack { constructor() { this.children = []; this.kind = "stack"; }
    addStack() { const s = new Stack(); this.children.push(s); return s; }
    addText(t) { const x = { kind: "text", text: String(t), centerAlignText() {}, leftAlignText() {}, rightAlignText() {} }; this.children.push(x); return x; }
    addImage(img) { const x = { kind: "image", img, centerAlignImage() {}, applyFittingContentMode() {} }; this.children.push(x); return x; }
    addSpacer(n) { this.children.push({ kind: "spacer", n: n == null ? null : n }); }
    addDate(d) { const x = { kind: "date", d, applyRelativeStyle() {}, applyTimeStyle() {} }; this.children.push(x); return x; }
    setPadding() {} centerAlignContent() {} topAlignContent() {} bottomAlignContent() {} layoutVertically() { this.vertical = true; } layoutHorizontally() { this.vertical = false; } }
  class ListWidget extends Stack { constructor() { super(); this.kind = "widget"; } async presentSmall() {} async presentMedium() {} async presentLarge() {} }
  const noop = () => {};
  const env = {
    FileManager: { iCloud: () => (opts.noICloud ? noICloudFm : icloudFm), local: () => localFm },
    Keychain: { contains: k => k in kc, get: k => { if (!(k in kc)) throw new Error("Keychain item not found: " + k); return kc[k]; }, set: (k, v) => { kc[k] = String(v); }, remove: k => { delete kc[k]; } },
    Request, Alert, WebView,
    Safari: { openInApp: async u => { log.opened.push(u); }, open: u => { log.opened.push(u); } },
    ShareSheet: { present: async a => { log.shares.push(a[0]); return { completed: true }; } },
    Pasteboard: { copy: t => { log.copied.push(t); }, paste: () => "" },
    Speech: { speak: t => { log.spoken.push("[native] " + t); } },
    // Scriptable's JavaScriptCore has none of these browser APIs: shadow them so native code that uses one fails here too
    URL: undefined, URLSearchParams: undefined, setTimeout: undefined, setInterval: undefined, clearTimeout: undefined, clearInterval: undefined,
    atob: undefined, btoa: undefined, fetch: undefined, TextEncoder: undefined, TextDecoder: undefined, structuredClone: undefined, queueMicrotask: undefined,
    Data: { fromBase64String: b => ({ toRawString: () => Buffer.from(String(b), "base64").toString("latin1") }), fromString: s => ({ toBase64String: () => Buffer.from(String(s)).toString("base64") }) },
    DrawContext: class { constructor() { this.size = null; } setFillColor() {} fillRect() {} fillEllipse() {} setFont() {} setTextColor() {} setTextAlignedCenter() {} drawTextInRect() {} drawImageInRect() {} drawText() {} addPath() {} strokePath() {} fillPath() {} setStrokeColor() {} setLineWidth() {} getImage() { return { size: { width: 96, height: 96 } }; } },
    Path: class { move() {} addLine() {} addCurve() {} closeSubpath() {} addEllipse() {} addRoundedRect() {} addRect() {} },
    Size: class { constructor(w, h) { this.width = w; this.height = h; } }, Rect: class { constructor(x, y, w, h) { Object.assign(this, { x, y, width: w, height: h }); } }, Point: class { constructor(x, y) { this.x = x; this.y = y; } },
    LinearGradient: class { constructor() { this.colors = []; this.locations = []; } },
    Color: Object.assign(class { constructor(h, a) { this.hex = h; this.alpha = a == null ? 1 : a; } }, { dynamic: (a) => a, white: () => ({ hex: "#fff" }), black: () => ({ hex: "#000" }), clear: () => ({ hex: "clear" }) }),
    Font: new Proxy({}, { get: (t, name) => size => ({ name: String(name), size }) }),
    Device: { isUsingDarkAppearance: () => !!opts.dark, locale: () => "en_US", language: () => "en" },
    config: { runsInApp: !opts.widget, runsInWidget: !!opts.widget, runsInAccessoryWidget: false, widgetFamily: opts.family || "medium" },
    args: { widgetParameter: opts.widgetParameter || "", shortcutParameter: opts.shortcutParameter, queryParameters: opts.queryParameters || {} },
    Script: { setShortcutOutput: v => { log.shortcutOutput = v; }, complete: noop, setWidget: w => { log.widgets.push(w); }, name: () => "BlogPulse" },
    ListWidget, URLScheme: { forRunningScript: () => "scriptable:///run/BlogPulse" },
    DateFormatter: class { string(d) { return new Date(d).toISOString(); } },
    Timer: { schedule: (ms, rep, fn) => { const id = (rep ? setInterval : setTimeout)(fn, Math.min(ms, 50)); return { invalidate: () => (rep ? clearInterval : clearTimeout)(id) }; } },
    UUID: { string: () => require("crypto").randomUUID().toUpperCase() },
    Notification: class { schedule() { (log.notifications = log.notifications || []).push(this.title); } },
    // The script lives in iCloud Drive unless the test says otherwise (opts.noICloud: a phone without iCloud)
    module: { filename: opts.noICloud ? LOCAL + "/BlogPulse.js" : "/var/mobile/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents/BlogPulse.js", exports: {} },
  };
  return { env, files, kc, log, ICLOUD, LOCAL, TMP, getDom: () => dom, finish: () => resolvePresent(), wv: () => wvRef };
}

// Start the script. Returns { E, p }: E is the environment (page, files, Keychain, log), p the script's promise.
async function run(opts = {}) {
  const E = makeEnv(opts);
  const names = Object.keys(E.env);
  const fn = new Function(...names, "console", `return (async () => {\n${SRC}\n})();`);
  const quiet = { log: () => {}, warn: () => {}, error: (...a) => { E.log.consoleErrors = (E.log.consoleErrors || []).concat(a.join(" ")); } };
  const p = fn(...names.map(n => E.env[n]), quiet);
  return { E, p };
}

// Shared helpers for the scenarios
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms = 4000, step = 20) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch (e) {} await wait(step); } return false; }
function page(E) {
  const w = E.getDom().window, d = w.document;
  const $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
  const tap = (s, el) => { const x = el || $(s); if (!x) throw new Error("nothing to tap: " + s); x.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); };
  const text = s => (($(s) || {}).textContent || "").replace(/\s+/g, " ").trim();
  // a finger on the screen: touch("start", "#list", x, y) … touch("end", "#list", x, y)
  const touch = (kind, s, x, y) => { const ev = new w.Event("touch" + kind, { bubbles: true, cancelable: true }); const t = [{ clientX: x, clientY: y }]; ev.touches = kind === "end" ? [] : t; ev.changedTouches = t; (typeof s === "string" ? $(s) : s).dispatchEvent(ev); };
  const card = id => $("#c-" + id);
  const idOf = t => { const c = $$(".card").find(x => (x.querySelector("h3") || {}).textContent.includes(t)); if (!c) throw new Error("no card: " + t); return c.id.slice(2); };
  return { w, d, $, $$, tap, text, touch, card, idOf };
}
// A phone with blogs followed and posts checked: the starting point of most scenarios
const KEY = "sk-ant-api03-ABCDEFGHIJKLMNOP1234";
async function seeded(opts = {}) {
  const kc = Object.assign({}, opts.ai === false ? {} : { BLOGPULSE_ANTHROPIC_KEY: KEY }, opts.kc || {});
  const files = opts.files || {};
  const now = Date.now();
  if (!opts.files) {
    const dir = "/icloud/Documents/BlogPulse";
    files[dir + "/sources.json"] = JSON.stringify([
      { id: "s-netflix", title: "Netflix TechBlog", site: "https://netflixtechblog.com", feed: "https://netflixtechblog.com/feed", added: now - 30 * DAY },
      { id: "s-spring", title: "Spring", site: "https://spring.io/blog", feed: "https://spring.io/blog.atom", added: now - 30 * DAY },
    ].concat(opts.sources || []));
    files[dir + "/settings.json"] = JSON.stringify(Object.assign({ usageAsked: true, shareUsage: false, aiInvite: { off: true }, lastSession: now - 3 * H }, opts.settings || {}));
  }
  return run(Object.assign({ speech: true }, opts, { files, kc }));
}
// The end of every scenario: run.js fails on anything after "errors:" other than "none"
function finish(E, errors) {
  const unknown = E.log.unknownUrls.length ? E.log.unknownUrls : null;
  console.log("errors:", errors.length ? errors.join("\n") : "none", "| unmocked URLs:", unknown ? unknown.join(", ") : "none", "| console.error:", E.log.consoleErrors || "none", "| JS errors:", E.log.jsErrors || "none");
}
module.exports = { run, makeEnv, seeded, page, wait, until, finish, KEY, H, DAY };
