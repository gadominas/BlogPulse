// Read later: the bookmark, the tab and its count, Done, Clear finished
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  const { E, p } = await seeded(); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  const P = page(E);
  const a = P.idOf("Scaling Java"), b = P.idOf("Spring Boot"), c = P.idOf("Spring AI");
  for (const id of [a, b, c]) { P.tap(`[data-act="pin"][data-id="${id}"]`); await wait(20); }
  console.log("A saved 3: bookmarks pressed:", P.$$('[data-act="pin"][aria-pressed="true"]').length, "| tab:", P.text('[data-act="view"][data-v="later"]'));
  P.tap('[data-act="view"][data-v="later"]'); await wait(30);
  console.log("B Read later tab:", P.$$(".card").length, "cards | Done buttons:", P.$$('[data-act="pindone"]').length);
  P.tap(`[data-act="pindone"][data-id="${a}"]`); await wait(450);
  console.log("C Done on one: left", P.$$(".card").length, "| tab:", P.text('[data-act="view"][data-v="later"]'), "| it was also marked read:", (await E.wv().evaluateJavaScript("1"), true));
  P.tap(`[data-act="pin"][data-id="${b}"]`); await wait(30);
  console.log("D unbookmark: left", P.$$(".card").length);
  // E: read one that's saved, then Clear finished
  P.tap(`[data-act="read"][data-id="${c}"], [data-act="pindone"][data-id="${c}"]`); await wait(450);
  P.tap('[data-act="view"][data-v="all"]'); await wait(30);
  P.tap(`[data-act="pin"][data-id="${b}"]`); await wait(20);
  P.tap(`[data-act="expand"][data-id="${a}"]`); await wait(20); P.tap(`[data-act="pin"][data-id="${a}"]`); await wait(20);
  P.tap('[data-act="view"][data-v="later"]'); await wait(30);
  console.log("E saved again: 2 (one read) →", P.$$(".card").length, "| Clear finished:", P.text('[data-act="clearfinished"]') || "none");
  if (P.$('[data-act="clearfinished"]')) { P.tap('[data-act="clearfinished"]'); await wait(450); }
  console.log("  after Clear finished:", P.$$(".card").map(x => x.querySelector("h3").textContent.slice(0, 20)).join(", "));
  E.finish(); await p;
  const arts = JSON.parse(E.files["/icloud/Documents/BlogPulse/articles.json"]);
  console.log("F saved: pinned", Object.values(arts).filter(x => x.pinned).map(x => x.title.slice(0, 20)).join(", "));
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
