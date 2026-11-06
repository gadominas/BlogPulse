// The launch screen (shown at once, gone by itself or on a tap) and the AI invitation (after the launch screen, without a key):
// Later (again in 3 days), Turn on AI (AI settings with Add key highlighted), Don't remind me again, never with a key
const { seeded, run, page, wait, until, finish } = require("../harness");
const DIR = "/icloud/Documents/BlogPulse";
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded({ ai: false, settings: { aiInvite: {} } }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 4000);
  let P = page(E);
  console.log("A launch screen:", !!P.$("#splash"), "| showing:", !P.$("#splash").classList.contains("gone"), "| label:", P.$("#splash").getAttribute("aria-label"), "| invitation over it:", !!P.$("#aiinv"));
  await until(() => P.$("#splash").classList.contains("gone"), 4000);
  console.log("  gone by itself after about 3 s:", P.$("#splash").classList.contains("gone"));
  await until(() => P.$("#aiinv"), 4000);
  console.log("B AI invitation:", P.text("#aiinv-t"), "| perks:", P.$$(".aiinv-perks li").length, "| buttons:", P.$$("#aiinv button").map(b => b.textContent).join(" · "));
  P.tap("#aiinv .aiinv-later"); await wait(400);
  E.finish(); await p;
  let inv = JSON.parse(E.files[DIR + "/settings.json"]).aiInvite;
  console.log("C Later: next in", Math.round((inv.next - Date.now()) / 864e5), "days | shown/later counted:", JSON.stringify(inv).slice(0, 80));
  ({ E, p } = await run({ files: E.files, kc: E.kc, speech: true })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 4000); P = page(E); P.tap("#splash"); await wait(1800);
  console.log("D reopened the same day: tap skips the launch screen:", P.$("#splash").classList.contains("gone"), "| invitation:", !!P.$("#aiinv"));
  E.finish(); await p;
  // E: Turn on AI
  ({ E, p } = await seeded({ ai: false, settings: { aiInvite: {} } })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 4000); P = page(E); P.tap("#splash");
  await until(() => P.$("#aiinv"), 4000);
  P.tap("#aiinv .aiinv-go"); await wait(500);
  console.log("E Turn on AI: AI settings open:", P.$("#aisheet").classList.contains("open"), "| Add key highlighted:", !!P.$("#aisheet .aiinv-nudge"), "| for:", P.$("#aisheet .aiinv-nudge")?.dataset.v);
  E.finish(); await p;
  // F: Don't remind me again
  ({ E, p } = await seeded({ ai: false, settings: { aiInvite: {} } })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 4000); P = page(E); P.tap("#splash");
  await until(() => P.$("#aiinv"), 4000); P.tap("#aiinv .aiinv-never"); await wait(400);
  E.finish(); await p;
  inv = JSON.parse(E.files[DIR + "/settings.json"]).aiInvite;
  console.log("F Don't remind me again: off:", !!inv.off);
  // G: with a key it never shows
  ({ E, p } = await seeded({ settings: { aiInvite: {} } })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 4000); P = page(E); P.tap("#splash"); await wait(1800);
  console.log("G with a key: invitation:", !!P.$("#aiinv"));
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
