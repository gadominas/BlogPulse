// Topics: by keywords without AI, by AI with a key (summaries in the same call), a blog's own topic
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded({ ai: false }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  let P = page(E);
  const tags = () => P.$$(".card").map(c => (c.querySelector("h3").textContent.slice(0, 14) + "→" + (c.querySelector(".ctag") || {}).textContent)).join(" | ");
  console.log("A by keywords:", tags());
  console.log("  tag says how:", (P.$(".ctag") || {}).title);
  E.finish(); await p;
  ({ E, p } = await seeded()); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => E.log.aiBodies.some(b => /summarise and categorise/.test(b.system)), 5000); await wait(300);
  P = page(E);
  const call = E.log.aiBodies.find(b => /summarise and categorise/.test(b.system));
  console.log("B with AI: one call for", (call.user.match(/^\[\d+\]/gm) || []).length, "posts | AI summaries on cards:", P.$$(".card .desc .ai").length);
  console.log("  topics:", tags());
  console.log("  tag says how:", P.$$(".ctag").map(t => t.title).filter((x, i, a) => a.indexOf(x) === i).join(" / "));
  E.finish(); await p;
  const arts = Object.values(JSON.parse(E.files["/icloud/Documents/BlogPulse/articles.json"]));
  console.log("C saved aiCat:", arts.map(a => a.aiCat || "-").join(","), "| no second call on reopen:", await (async () => {
    const r = await seeded({ files: E.files, kc: E.kc }); await until(() => page(r.E).w.__booted, 4000); await wait(400); r.E.finish(); await r.p; return !r.E.log.aiBodies.some(b => /categorise/.test(b.system)); })());
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
