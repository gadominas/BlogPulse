// Safe start-up: the empty first window, reopening, a slow iCloud, a damaged file (a copy is kept, then it starts fresh), no iCloud, a second window, the start-up log
const { run, seeded, page, wait, until, finish } = require("../harness");
const DIR = "/icloud/Documents/BlogPulse";
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded(); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  console.log("A first window empty, then the app:", !!E.log.blankFirst, "| cards after the first check:", page(E).$$(".card").length);
  E.finish(); await p;
  const files = E.files, kc = E.kc, articles = files[DIR + "/articles.json"];
  console.log("  saved:", ["sources", "articles", "settings", "usage"].map(n => n + (files[DIR + "/" + n + ".json"] ? "✓" : "✗")).join(" "), "| widget snapshot on the phone:", Object.keys(files).some(k => k.startsWith("/local/") && /widget/.test(k)));
  // B: reopen: the posts come from the files before any check
  ({ E, p } = await run({ files, kc, speech: true })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 4000);
  console.log("B reopened: cards straight away:", page(E).$$(".card").length, "| feeds asked so far:", E.log.requests.filter(u => /feed|atom/.test(u)).length);
  E.finish(); await p;
  // C: iCloud never delivers articles.json: the app still opens, and nothing is saved over it
  ({ E, p } = await run({ files, kc, speech: true, slowCloud: "articles.json" })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 15000);
  console.log("C slow iCloud: opened:", !!page(E).w.__booted, "| note:", page(E).text("#toast") || page(E).text(".booting"));
  E.finish(); await p;
  console.log("  articles.json untouched:", E.files[DIR + "/articles.json"] === articles);
  // D: a damaged sources.json: the app opens and doesn't write over it
  const files2 = Object.assign({}, files);
  ({ E, p } = await run({ files: files2, kc, speech: true, damaged: "sources.json" })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 6000);
  console.log("D damaged sources.json: opened:", !!page(E).w.__booted, "| posts still there:", page(E).$$(".card").length);
  E.finish(); await p;
  const copy = Object.keys(E.files).find(k => /sources\.broken-\d+\.json$/.test(k));
  console.log("  a copy kept:", copy ? copy.split("/").pop().replace(/\d+/, "…") : "none", "| started fresh and saving again:", E.files[DIR + "/sources.json"] !== files[DIR + "/sources.json"]);
  // E: a phone without iCloud: data on the phone, iCloud never touched
  ({ E, p } = await seeded({ noICloud: true })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  E.finish(); await p;
  console.log("E no iCloud: cards", "✓", "| sources on the phone:", Object.keys(E.files).some(k => k.startsWith("/local/Documents/BlogPulse/")), "| iCloud touched:", E.log.icloudTouched || "never");
  // F: another BlogPulse window is still open: wait at most a moment, then open anyway
  const files3 = Object.assign({}, files, { "/local/tmp/blogpulse-running": String(Date.now()) });
  const t0 = Date.now();
  ({ E, p } = await run({ files: files3, kc, speech: true })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 6000);
  console.log("F run lock held by another window: opened after", ((Date.now() - t0) / 1000).toFixed(1), "s");
  // G: the start-up log, in Settings › Updates
  const P = page(E); P.tap('[data-act="cfgopen"]'); await wait(30); P.tap('[data-act="startlog"]'); await until(() => !P.$("#startlog").hidden, 2000);
  console.log("G start-up log:", P.$("#startlog").textContent.split("\n").filter(Boolean).slice(-3).map(l => l.slice(10, 70)).join(" / "));
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
