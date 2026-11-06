// The widget: small, medium and large from the snapshot the app saves; a widget run that checks feeds when the last check is old;
// the empty widget before any blog is followed; nothing written to iCloud from a widget run
const { seeded, run, page, wait, until, finish } = require("../harness");
const texts = w => { const out = []; (function walk(n) { if (!n) return; if (n.kind === "text") out.push(n.text); (n.children || []).forEach(walk); })(w); return out; };
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded(); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000); await wait(200);
  E.finish(); await p;
  const files = E.files, kc = E.kc;
  for (const family of ["small", "medium", "large"]) {
    const r = await run({ files, kc, widget: true, family }); await r.p.catch(e => errors.push("SCRIPT " + e.stack));
    const w = r.E.log.widgets[0], t = texts(w);
    console.log(`A ${family}: widget set:`, !!w, "| texts:", t.length, "|", t.slice(0, 5).map(x => x.slice(0, 26)).join(" / "), "| tap opens:", w && (w.url || "").slice(0, 34), "| feeds asked:", r.E.log.requests.filter(u => /feed|atom/.test(u)).length);
    if (r.E.log.unknownUrls.length) errors.push("unmocked in widget: " + r.E.log.unknownUrls.join(", "));
  }
  // B: last check two hours ago: the widget checks the feeds itself, within its time budget, and saves a new snapshot
  const old = Object.assign({}, files); const st = JSON.parse(old["/icloud/Documents/BlogPulse/settings.json"]); st.lastScan = Date.now() - 2 * 3600e3;
  old["/icloud/Documents/BlogPulse/settings.json"] = JSON.stringify(st);
  const snapKey = Object.keys(old).find(k => k.startsWith("/local/") && /widget/.test(k)), snap = JSON.parse(old[snapKey]); snap.scanned = st.lastScan; old[snapKey] = JSON.stringify(snap);
  const before = JSON.stringify(Object.fromEntries(Object.entries(old).filter(([k]) => k.startsWith("/icloud/"))));
  const r2 = await run({ files: old, kc, widget: true, family: "medium" }); await r2.p.catch(e => errors.push("SCRIPT " + e.stack));
  console.log("B old check: feeds asked:", r2.E.log.requests.filter(u => /feed|atom/.test(u)).length, "| snapshot renewed:", JSON.parse(r2.E.files[snapKey]).scanned > st.lastScan, "| iCloud files untouched:", JSON.stringify(Object.fromEntries(Object.entries(r2.E.files).filter(([k]) => k.startsWith("/icloud/")))) === before);
  // C: before any blog is followed
  const r3 = await run({ files: {}, kc: {}, widget: true, family: "small" }); await r3.p.catch(e => errors.push("SCRIPT " + e.stack));
  console.log("C empty widget:", texts(r3.E.log.widgets[0]).join(" / ").slice(0, 90));
  E = r3.E;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
