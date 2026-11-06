// The list: tabs, day and week groups, blog chips, topics (tapped and swiped), New, Show more
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  const { E, p } = await seeded(); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  const P = page(E);
  const view = v => { P.tap(`[data-act="view"][data-v="${v}"]`); };
  console.log("A tabs:", P.$$(".tab").map(t => t.textContent).join(" | "));
  console.log("  Unread groups:", P.$$("section .gh h2").map(h => h.textContent).join(", "), "| cards:", P.$$(".card").length, "| New flags:", P.$$(".flag.new").length);
  view("new"); await wait(30);
  console.log("B New:", P.$$(".card").length, "| All:", (view("all"), await wait(30), P.$$(".card").length), "| Rated:", (view("rated"), await wait(30), P.$$(".card").length || P.text("#list .empty, #list .muted")));
  view("unread"); await wait(30);
  P.tap('[data-act="group"][data-v="week"]'); await wait(30);
  console.log("C by week:", P.$$("section .gh h2").map(h => h.textContent).join(", "), "| saved:", JSON.parse(E.files["/icloud/Documents/BlogPulse/settings.json"] || "{}").groupBy || "(saved on close)");
  P.tap('[data-act="group"][data-v="day"]'); await wait(30);
  const chip = P.$$('[data-act="chip"]').find(c => /Spring/.test(c.textContent));
  P.tap(null, chip); await wait(30);
  console.log("D blog chip Spring:", P.$$(".card").length, "cards, all Spring:", P.$$(".card .src").every(s => s.textContent === "Spring"));
  P.tap('[data-act="chip"][data-v=""]'); await wait(30);
  const pills = P.$$('[data-act="cat"]').map(c => c.dataset.v);
  console.log("E topics:", pills.join(", "));
  P.tap(`[data-act="cat"][data-v="${pills[1]}"]`); await wait(30);
  console.log("  tapped", pills[1] + ":", P.$$(".card").length, "cards");
  P.touch("start", "#list", 300, 300); P.touch("end", "#list", 80, 305); await wait(60);
  console.log("  swiped left → topic:", (P.$('[data-act="cat"].on') || {}).dataset?.v, "| swiped right →", (P.touch("start", "#list", 80, 300), P.touch("end", "#list", 320, 305), await wait(60), (P.$('[data-act="cat"].on') || {}).dataset?.v));
  P.tap('[data-act="cat"][data-v="all"]'); await wait(30);
  E.finish(); await p;
  // F: Show more, with Settings › Values › Posts per page at 2
  const r2 = await seeded({ settings: { cfg: { pageSize: 2 } } }); r2.p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(r2.E).$$(".card").length, 5000); await wait(200);
  const Q = page(r2.E);
  console.log("F page of 2:", Q.$$(".card").length, "| button:", Q.text('[data-act="more"]') || "none");
  if (Q.$('[data-act="more"]')) { Q.tap('[data-act="more"]'); await wait(30); console.log("  after Show more:", Q.$$(".card").length); }
  r2.E.finish(); await r2.p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
