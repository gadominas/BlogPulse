// Anonymous usage (opt-in): the one-time question, No (nothing sent), Yes (events sent in one batch, only counts and
// fixed fields), the Settings › Privacy switch and Send a test
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  // A: No
  let { E, p } = await seeded({ settings: { usageAsked: false } }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$("#usageask"), 5000);
  let P = page(E);
  console.log("A asked once:", P.text("#usageask b"), "|", P.$$("#usageask button").map(b => b.textContent.trim()).join(" · "));
  P.tap('[data-act="usage-no"]'); await wait(200);
  P.tap(`#c-${P.idOf("Scaling Java")} h3`); await wait(300); P.tap('[data-act="rdclose"]');
  E.finish(); await p;
  console.log("  No: question gone, nothing sent:", !E.log.analytics.length, "| saved:", JSON.stringify((({ usageAsked, shareUsage }) => ({ usageAsked, shareUsage }))(JSON.parse(E.files["/icloud/Documents/BlogPulse/settings.json"]))));
  // B: Yes
  ({ E, p } = await seeded({ settings: { usageAsked: false } })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$("#usageask"), 5000); P = page(E);
  P.tap('[data-act="usage-yes"]'); await wait(200);
  const a = P.idOf("Scaling Java");
  P.tap(`#c-${a} h3`); await until(() => P.$$("#reader .rd-p").length, 3000); P.tap('[data-act="rdclose"]'); await wait(100);
  P.tap(`[data-act="rate"][data-id="${a}"][data-v="3"]`); await wait(200);
  await until(() => E.log.analytics.length >= 2, 3000);
  const ev = E.log.analytics;
  console.log("B Yes: events:", ev.map(e => e.event).join(", "));
  const keys = [...new Set(ev.flatMap(e => Object.keys(e.properties)))];
  console.log("  fields:", keys.join(", "));
  const all = JSON.stringify(ev);
  console.log("  no titles, links or keys in them:", !/Scaling Java|netflixtechblog|sk-ant/.test(all), "| same anonymous id:", new Set(ev.map(e => e.properties.distinct_id)).size === 1, "| id saved in the Keychain:", !!E.kc["blogpulse-install-id"]);
  // C: Settings › Privacy: the switch and Send a test
  P.tap('[data-act="cfgopen"]'); await wait(30);
  P.tap('[data-act="usage-test"]'); await until(() => /✓|✗/.test(P.text("#usagemsg")), 3000);
  console.log("C Send a test:", P.text("#usagemsg").slice(0, 70));
  P.tap('[data-act="toggle"][data-v="shareUsage"]'); await wait(100);
  const n = E.log.analytics.length;
  P.tap('[data-act="cfgclose"]'); await wait(20);
  P.tap(`[data-act="rate"][data-id="${P.idOf("Spring Boot")}"][data-v="2"]`); await wait(400);
  console.log("  switched off: nothing more sent:", E.log.analytics.length === n);
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
