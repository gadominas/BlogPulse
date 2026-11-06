// Pages behind walls: Yahoo's consent (answered once, cookies kept), Google News links (Google's consent, then the publisher),
// a cookie banner the reader can't get past (Jina Reader), Jina asking for a key, and the Jina key in Settings
const { seeded, page, wait, until, finish } = require("../harness");
const YAHOO = { id: "s-yahoo", title: "Yahoo Tech", site: "https://tech.yahoo.com", feed: "https://tech.yahoo.com/rss", added: Date.now() - 864e6 };
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded({ sources: [YAHOO], article: { a3: "consent" } }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length >= 7, 5000);
  let P = page(E);
  const open = async t => { P.tap(`#c-${P.idOf(t)} h3`); await until(() => P.$("#reader .rd-p, #reader .rd-blocked"), 4000); };
  await open("Chipmakers race");
  console.log("A Yahoo: steps", (E.log.consent || []).join(" → "), "| agreed:", /agree=agree/.test(E.log.consentBody || ""), "| paragraphs:", P.$$("#reader .rd-p").length);
  P.tap('[data-act="rdclose"]'); await wait(30);
  E.finish(); await p;
  const st = JSON.parse(E.files["/icloud/Documents/BlogPulse/settings.json"]);
  console.log("  cookies kept for next time:", st.yahooCookie);
  // B: next time the cookies go along: no wall
  ({ E, p } = await seeded({ files: E.files, kc: E.kc, article: { a3: "consent" } })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length >= 7, 5000); P = page(E);
  await open("Chipmakers race");
  console.log("B reopened: walls met:", (E.log.consent || []).length, "| paragraphs:", P.$$("#reader .rd-p").length);
  P.tap('[data-act="rdclose"]'); await wait(30);
  // C: a Google News link
  await open("Google News: Netflix");
  console.log("C Google News: steps", (E.log.consent || []).join(" → "), "| publisher asked:", E.log.gnDecoded, "| paragraphs:", P.$$("#reader .rd-p").length, "| Original goes to:", (P.tap('[data-act="rdorig"]'), await until(() => E.log.opened.length, 1500), E.log.opened.slice(-1)[0]));
  P.tap('[data-act="rdclose"]'); await wait(30);
  // D: a cookie banner with no form to answer: Jina Reader reads it instead
  await open("Bond markets");
  console.log("D cookie banner → Jina Reader:", E.log.jina || 0, "call | paragraphs:", P.$$("#reader .rd-p").length, "| source note:", P.text("#reader .rd-foot, #reader .rd-trace").slice(0, 70));
  P.tap('[data-act="rdclose"]'); await wait(30);
  E.finish(); await p;
  // E: Jina wants a key: the reader says so; with a key in Settings it goes along
  ({ E, p } = await seeded({ article: { a3: "consent" }, jinaNeedsKey: true })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000); P = page(E);
  await open("Bond markets");
  console.log("E Jina without a key:", P.text("#reader .rd-blocked").slice(0, 90));
  P.tap('[data-act="rdclose"]'); await wait(30);
  P.tap('[data-act="cfgopen"]'); await wait(30);
  const set = P.$('[data-act="secret-set"][data-v="jina"], [data-act="secret-set"]');
  console.log("  Settings › Jina Reader key:", !!set);
  E.log.pushAlert({ fields: ["jina_FAKEKEY0123456789"] });
  P.tap(null, set); await until(() => E.kc.BLOGPULSE_JINA_KEY, 2000);
  console.log("  saved in the Keychain:", !!E.kc.BLOGPULSE_JINA_KEY, "| shown masked:", !P.text("#cfg").includes("jina_FAKEKEY0123456789"));
  P.tap('[data-act="cfgclose"]'); await wait(30);
  P.tap(`#c-${P.idOf("Bond markets")} h3`); await wait(30); P.tap('[data-act="rdrefetch"]'); await until(() => P.$$("#reader .rd-p").length, 3000);
  console.log("  Try again with the key:", P.$$("#reader .rd-p").length, "paragraphs | key sent:", (E.log.jinaAuth || "").replace(/jina_\w+/, "jina_…"));
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
