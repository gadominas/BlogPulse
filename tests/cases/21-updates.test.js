// Updates: a newer release offered at start (what's new), Later (not offered again for two days), Update now (written where the script
// lives, checked first), a bad download refused, Check for updates in Settings when up to date
const { seeded, run, page, wait, until, finish } = require("../harness");
const NEW = { releases: [{ version: "99.0.0", date: "2026-11-06", title: "A big one", highlights: [{ icon: "⚡", title: "Faster checks", text: "Feeds load in parallel." }, { icon: "🧩", title: "A new widget", text: "Story on the Home Screen." }] }] };
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded({ releases: NEW, kc: {} }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$("#upd"), 6000);
  let P = page(E);
  console.log("A offered:", P.text("#upd .updt, #upd h2").slice(0, 40), "| what's new:", ["Faster checks", "A new widget"].filter(t => P.text("#upd").includes(t)).join(" / "), "| buttons:", P.$$("#upd button").map(b => b.textContent.trim()).join(" · "));
  P.tap('[data-act="upd-later"]'); await wait(200);
  console.log("B Later: dialog gone:", !P.$("#upd"));
  E.finish(); await p;
  ({ E, p } = await run({ files: E.files, kc: E.kc, speech: true, releases: NEW })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 4000); await wait(800);
  console.log("  next launch: offered again:", !!page(E).$("#upd"));
  E.finish(); await p;
  // C: Update now
  ({ E, p } = await seeded({ releases: NEW, kc: {} })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$("#upd"), 6000); P = page(E);
  P.tap('[data-act="upd-now"]'); await until(() => Object.keys(E.files).some(k => k.endsWith("Documents/BlogPulse.js")), 3000); await wait(100);
  const path = Object.keys(E.files).find(k => k.endsWith("Documents/BlogPulse.js"));
  console.log("C Update now: written to", path && path.replace(/^.*Mobile Documents/, "…/Mobile Documents"), "| version in it:", (E.files[path] || "").match(/const VERSION = '([^']+)'/)?.[1], "| says:", P.text("#upd").slice(0, 70));
  E.finish(); await p;
  // D: the download isn't BlogPulse (a GitHub error page): refused, nothing written
  ({ E, p } = await seeded({ releases: NEW, kc: {}, newScript: "404: Not Found" })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$("#upd"), 6000); P = page(E);
  P.tap('[data-act="upd-now"]'); await until(() => /didn't look right/.test(P.text("#upd") + P.text("#toast")), 3000);
  console.log("D bad download:", (P.text("#upd") + " " + P.text("#toast")).match(/The download[^.]*\./)?.[0], "| nothing written:", !Object.keys(E.files).some(k => k.endsWith("Documents/BlogPulse.js")));
  E.finish(); await p;
  // E: Settings › Updates › Check now when up to date
  ({ E, p } = await seeded()); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 4000); P = page(E);
  P.tap('[data-act="cfgopen"]'); await wait(30); P.tap('[data-act="updcheck"]'); await until(() => P.text("#updmsg") && P.text("#updmsg") !== "Checking…", 3000);
  console.log("E Check now:", P.text("#updmsg").slice(0, 70), "| releases.json asked:", E.log.requests.filter(u => u.includes("releases.json")).length);
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
