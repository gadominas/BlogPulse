// The reader: a post opens in BlogPulse with its own text; blocks; Original; Done; reopening from memory; Safari when the reader is off
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded(); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  let P = page(E);
  const a = P.idOf("Scaling Java");
  P.tap(`#c-${a} h3`);
  console.log("A opens at once:", P.$("#reader").classList.contains("open"), "| title:", P.text("#reader .rd-title").slice(0, 40), "| waiting:", !!P.$("#reader .rd-skel, #reader .rd-wait"));
  await until(() => P.$$("#reader .rd-p").length, 3000);
  console.log("  blocks: paragraphs", P.$$("#reader .rd-p").length, "| headings", P.$$("#reader .rd-h").length, "| list items", P.$$("#reader .rd-ul li").length, "| code", P.$$("#reader .rd-pre").length, "| image", P.$$("#reader .rd-img").length, "| nav/footer dropped:", !/menu/.test(P.text("#reader .rd-text")));
  console.log("  meta:", P.text("#reader .rd-meta").slice(0, 80));
  console.log("  tools:", P.$$("#reader .rd-tools button, #reader .rd-hbtns button").map(b => b.textContent.trim() || b.getAttribute("aria-label")).join(" · "));
  P.tap('[data-act="rdorig"]'); await until(() => E.log.opened.length, 1500);   // the page sends one message every 80 ms
  console.log("B Original opens Safari:", E.log.opened.slice(-1)[0]);
  P.tap('[data-act="rdclose"]'); await wait(450);
  console.log("C closed: stays unread (Mark read when opened is off):", P.card(a).classList.contains("unread"));
  const fetched = E.log.requests.filter(u => u.endsWith("/a1")).length;
  P.tap(`#c-${a} h3`); await until(() => P.$$("#reader .rd-p").length, 2000);
  console.log("D reopened from memory, no new fetch:", E.log.requests.filter(u => u.endsWith("/a1")).length === fetched);
  P.tap('[data-act="rdclose"]'); await wait(50);
  P.tap(`[data-act="read"][data-id="${a}"]`); await wait(450);
  console.log("  marked read from the list: folded:", P.card(a).classList.contains("collapsed"), "| its title still opens the reader:", (P.tap(`#c-${a} h3`), await wait(30), P.$("#reader").classList.contains("open")));
  P.tap('[data-act="rdclose"]'); await wait(30);
  // E: Settings › Reading › Open posts in the reader: off → Safari
  P.tap('[data-act="cfgopen"]'); await wait(30); P.tap('[data-act="toggle"][data-v="openInReader"]'); await wait(40); P.tap('[data-act="cfgclose"]'); await wait(30);
  const b = P.idOf("Spring Boot");
  P.tap(`#c-${b} h3`); await wait(300);
  console.log("E reader off: Safari:", E.log.opened.slice(-1)[0], "| reader stays closed:", !P.$("#reader").classList.contains("open"));
  E.finish(); await p;
  // F: a page with nothing readable (paywall) and an unreachable one (403), with the Jina fallback turned off
  ({ E, p } = await seeded({ article: { a1: "paywall", a3: "403" }, settings: { readerProxy: false } })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000); P = page(E);
  for (const t of ["Scaling Java", "Bond markets"]) {
    P.tap(`#c-${P.idOf(t)} h3`); await until(() => P.$("#reader .rd-blocked, #reader .rd-p"), 3000);
    console.log("F", t + ":", P.text("#reader .rd-blocked").slice(0, 110) || "(read " + P.$$("#reader .rd-p").length + " paragraphs)", "| Open the article:", !!P.$('#reader .rd-blocked [data-act="rdorig"]'));
    if (P.$('[data-act="rdrefetch"]')) { const n = E.log.requests.length; P.tap('[data-act="rdrefetch"]'); await until(() => P.$("#reader .rd-blocked"), 2000); console.log("  Try again fetched again:", E.log.requests.length > n); }
    P.tap('[data-act="rdclose"]'); await wait(40);
  }
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
