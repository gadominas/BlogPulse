// TL;DR: without AI (extracted), with AI (Claude), inline, Full screen, Summarise with AI, an unreadable page, Try again
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  // A: no AI key
  let { E, p } = await seeded({ ai: false }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  let P = page(E), a = P.idOf("Scaling Java");
  P.tap(`[data-act="tldr"][data-id="${a}"]`);
  console.log("A loading:", P.text(`#c-${a} .tli-load`));
  await until(() => P.$(`#c-${a} .tli-lead`), 3000);
  console.log("  without AI:", P.text(`#c-${a} .badge-ex`), "| lead:", P.text(`#c-${a} .tli-lead`).slice(0, 70), "| points:", P.$$(`#c-${a} .tli ul li`).length, "| AI asked:", E.log.aiBodies.length);
  E.finish(); await p;
  // B: with a Claude key
  ({ E, p } = await seeded({ article: { a3: "403" } })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  P = page(E); a = P.idOf("Scaling Java");
  P.tap(`[data-act="tldr"][data-id="${a}"]`);
  await until(() => P.$(`#c-${a} .tli-lead`), 3000);
  const body = E.log.aiBodies.find(b => /TL;DRs/.test(b.system)) || {};
  console.log("B with AI:", P.text(`#c-${a} .badge-ai`), "| lead:", P.text(`#c-${a} .tli-lead`).slice(0, 60), "| why:", P.text(`#c-${a} .tli-why`).slice(0, 50));
  console.log("  prompt has the article's text:", /pinning|ReentrantLock/.test(body.user || ""), "| model:", body.model);
  console.log("  buttons:", P.$$(`#c-${a} .tli-act button`).map(b => b.textContent.trim()).join(" · "));
  P.tap(`#c-${a} [data-act="tldrfull"]`); await wait(40);
  console.log("C Full screen:", P.$("#tldr").classList.contains("open"), "|", P.text("#tldr h2, #tldr h1").slice(0, 60));
  P.tap('[data-act="tldrclose"]'); await wait(30);
  P.tap(`#c-${a} .tli-act [data-act="tldr"]`); await wait(30);
  console.log("D Hide:", !P.$(`#c-${a} .tli`), "| reopens from memory, no new request:", (P.tap(`[data-act="tldr"][data-id="${a}"]`), await wait(30), !!P.$(`#c-${a} .tli-lead`)), E.log.aiBodies.filter(b => /TL;DRs/.test(b.system)).length === 1);
  // E: a page that answers 403: the feed excerpt is used, with a note
  const b3 = P.idOf("Bond markets");
  P.tap(`[data-act="tldr"][data-id="${b3}"]`);
  await until(() => P.$(`#c-${b3} .tli-lead, #c-${b3} .err`), 3000);
  console.log("E unreadable page:", P.text(`#c-${b3} .tli .note`) || P.text(`#c-${b3} .err`));
  E.finish(); await p;
  // F: the AI fails: an error and Try again
  ({ E, p } = await seeded({ aiFail: true })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  P = page(E); a = P.idOf("Scaling Java");
  P.tap(`[data-act="tldr"][data-id="${a}"]`);
  await until(() => P.$(`#c-${a} .tli-lead, #c-${a} .err`), 3000);
  console.log("F AI down:", P.text(`#c-${a} .err`) || ("falls back: " + P.text(`#c-${a} .badge-ex`)), "| Try again:", !!P.$(`#c-${a} [data-act="tldrretry"]`));
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
