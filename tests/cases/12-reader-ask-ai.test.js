// ✦ Ask AI in the reader: suggestions, a typed question, follow-ups with the earlier answers, what is sent, errors, no key
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded(); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  let P = page(E);
  const a = P.idOf("Scaling Java");
  P.tap(`#c-${a} h3`); await until(() => P.$$("#reader .rd-p").length, 3000);
  P.tap('[data-act="rdask"]'); await wait(40);
  console.log("A Ask AI opens:", !!P.$("#reader .rd-chat"), "| suggestions:", P.$$('[data-act="rdsugg"]').map(b => b.textContent.trim()).join(" · "));
  P.tap('[data-act="rdsugg"]'); await until(() => P.$("#reader .rd-ab:not(.wait)"), 3000);
  console.log("B answer:", P.text("#reader .rd-ab").slice(0, 70), "| bold kept:", !!P.$("#reader .rd-ab b, #reader .rd-ab strong"));
  const first = E.log.chatPrompts[0] || "";
  console.log("  sent: the article's text:", /ReentrantLock/.test(first), "| title:", /Scaling Java/.test(first), "| chars:", first.length);
  P.$("#rdQ").value = "What should I check before switching?"; P.tap('[data-act="rdsend"]');
  await until(() => E.log.chatPrompts.length === 2 && P.$$("#reader .rd-ab:not(.wait)").length === 2, 3000);
  console.log("C follow-up: questions shown", P.$$("#reader .rd-qb").length, "| the first answer goes along:", /p99 latency/.test(E.log.chatPrompts[1]), "| box cleared:", P.$("#rdQ").value === "");
  console.log("  feature tag on the AI call: chat | model:", E.log.aiBodies.slice(-1)[0].model);
  P.tap('[data-act="rdclose"]'); await wait(30);
  P.tap(`#c-${a} h3`); await until(() => P.$$("#reader .rd-p").length, 2000); P.tap('[data-act="rdask"]'); await wait(40);
  console.log("D reopened: the chat is still there:", P.$$("#reader .rd-qb").length, "questions");
  E.finish(); await p;
  // E: the AI fails: the error shows under the question, with Try again
  ({ E, p } = await seeded({ aiFail: true })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000); P = page(E);
  P.tap(`#c-${P.idOf("Scaling Java")} h3`); await until(() => P.$$("#reader .rd-p").length, 3000);
  P.tap('[data-act="rdask"]'); await wait(30); P.tap('[data-act="rdsugg"]'); await until(() => P.$("#reader .rd-ab.err"), 3000);
  console.log("E AI down:", P.text("#reader .rd-ab.err").slice(0, 70), "| Try again:", !!P.$('[data-act="rdretry"]'));
  E.finish(); await p;
  // F: no key: the reader says where to add one
  ({ E, p } = await seeded({ ai: false })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000); P = page(E);
  P.tap(`#c-${P.idOf("Scaling Java")} h3`); await until(() => P.$$("#reader .rd-p").length, 3000);
  console.log("F no key: no Ask AI button:", !P.$('[data-act="rdask"]'), "| note under the article:", P.text("#reader .rd-nokey").slice(0, 80));
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
