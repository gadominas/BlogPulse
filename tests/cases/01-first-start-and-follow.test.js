// First start on a new phone: the empty state, following a blog by address and by name, the first check, topics
const { run, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  const { E, p } = await run({ speech: true, kc: {} });
  p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => E.getDom() && E.getDom().window.__booted, 5000);
  let P = page(E);
  console.log("A empty first window:", !!E.log.blankFirst, "| booted:", !!P.w.__booted, "| empty state:", P.text(".empty h2") || P.text(".empty"), "| blogs sheet opens by itself:", !!P.$("#sheet.open"));
  // B: follow by address (a site page that links its feed)
  if (!P.$("#sheet.open")) P.tap('[data-act="sheet"]');
  await wait(50);
  const input = P.$("#q");
  console.log("B the blogs sheet:", !!P.$("#sheet.open"), "| search box:", !!input);
  const results = () => /Results/.test(P.text("#sheet .sec-row"));
  input.value = "https://spring.io/blog"; P.tap('#sheet [data-act="find"]');
  await until(results, 3000);
  console.log("  found:", P.text("#sheet .sec-row"), "| first:", P.$('#sheet [data-act="add"]').dataset.title, P.$('#sheet [data-act="add"]').dataset.feed);
  P.tap('#sheet [data-act="add"]');
  await until(() => JSON.parse(E.files["/icloud/Documents/BlogPulse/sources.json"] || "[]").length === 1, 3000);
  console.log("  following:", JSON.parse(E.files["/icloud/Documents/BlogPulse/sources.json"] || "[]").map(s => s.title).join(", "));
  // C: follow by name (Feedly search)
  P.tap('#sheet [data-act="clearres"]'); await wait(20);
  input.value = "inkitt"; P.tap('#sheet [data-act="find"]');
  await until(results, 3000);
  console.log("C search by name:", P.text("#sheet .sec-row"), "| first:", P.$('#sheet [data-act="add"]').dataset.title, "| Feedly asked:", E.log.requests.some(u => u.includes("cloud.feedly.com")));
  P.tap('#sheet [data-act="add"]');
  await until(() => JSON.parse(E.files["/icloud/Documents/BlogPulse/sources.json"] || "[]").length === 2, 3000);
  console.log("  following:", JSON.parse(E.files["/icloud/Documents/BlogPulse/sources.json"]).map(s => s.title).join(", "));
  // D: the posts, grouped by day, with topic pills
  P.tap('#sheet [data-act="sheet"]');
  await wait(300);
  P = page(E);
  console.log("D cards:", P.$$(".card").length, "| groups:", P.$$("section .gh h2").map(h => h.textContent).join(", "), "| topics:", P.$$(".cat-pill").map(x => x.textContent.replace(/\s+/g, " ").trim()).join(" · "));
  console.log("  without AI the summaries are excerpts:", !P.$(".card .desc .ai"), "| no AI requests:", !E.log.aiBodies.length);
  E.finish(); await p;
  console.log("E saved: articles", Object.keys(JSON.parse(E.files["/icloud/Documents/BlogPulse/articles.json"] || "{}")).length, "| settings:", !!E.files["/icloud/Documents/BlogPulse/settings.json"]);
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
