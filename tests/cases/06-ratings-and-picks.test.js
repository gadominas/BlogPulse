// Stars: rate, change, clear; the Rated tab; Picks once enough posts are rated; ratings in the Story prompt
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  const { E, p } = await seeded(); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  const P = page(E);
  const rate = (id, n) => P.tap(`[data-act="rate"][data-id="${id}"][data-v="${n}"]`);
  const a = P.idOf("Scaling Java");
  rate(a, 3); await wait(30);
  console.log("A ★★★:", P.card(a).querySelectorAll(".star.on").length, "lit | marked read but not folded:", P.card(a).classList.contains("read"), !P.card(a).classList.contains("collapsed"));
  if (P.card(a).classList.contains("collapsed")) errors.push("rating folded the post and hid its stars (1.21.1 regression)");
  rate(a, 2); await wait(30); console.log("B change to ★★:", P.card(a).querySelectorAll(".star.on").length);
  rate(a, 2); await wait(30); console.log("C tap the same star clears it:", P.card(a).querySelectorAll(".star.on").length);
  const ids = P.$$(".card").map(c => c.id.slice(2));
  rate(ids[0], 3); rate(ids[1], 3); rate(ids[2], 1); rate(ids[3], 3); await wait(600);   // the page sends one message every 80 ms
  P.tap('[data-act="view"][data-v="rated"]'); await wait(30);
  console.log("D Rated tab:", P.$$(".card").length, "cards");
  P.tap('[data-act="view"][data-v="picks"]'); await wait(30);
  console.log("E Picks:", P.$$(".card").length ? P.$$(".card").length + " pick(s)" : P.text("#list").slice(0, 110));
  E.finish(); await p;
  const arts = Object.values(JSON.parse(E.files["/icloud/Documents/BlogPulse/articles.json"]));
  console.log("F saved ratings:", arts.filter(x => x.rating).map(x => x.rating).sort().join(","));
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
