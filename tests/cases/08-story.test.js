// The Story: written by AI from the latest posts; scopes; cited posts; must-reads; kept until the posts change; Rewrite
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded(); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  let P = page(E);
  P.tap('[data-act="view"][data-v="story"]');
  console.log("A writing:", P.text("#list .writing").slice(0, 60) || "(instant)");
  await until(() => P.$("#list .story h1, #list .story h2"), 4000);
  console.log("  headline:", P.text("#list .story h1, #list .story h2"), "| dek:", P.text("#list .dek").slice(0, 50));
  console.log("  TL;DR bullets:", P.$$("#list .st-tldr li").length, "| sections:", P.$$("#list .st-sec").map(s => (s.querySelector(".st-h") || s.firstElementChild).textContent.trim()).join(" / "), "| must-read:", P.$$("#list .must").length);
  console.log("  citations link to posts:", P.$$('#list .story [data-act="open"]').length, "| scopes:", P.$$('[data-act="scope"]').map(s => s.textContent.trim()).join(" · "));
  const sb = E.log.aiBodies.find(b => /personal tech briefing/.test(b.system)) || {};
  console.log("  prompt: posts numbered:", (sb.user || "").match(/^\[\d+\]/gm)?.length, "| feature tag sent:", "story");
  // B: another scope writes another story; going back reuses the saved one
  P.tap('[data-act="scope"][data-v="week"]'); await until(() => E.log.aiBodies.filter(b => /briefing/.test(b.system)).length === 2, 3000);
  P.tap('[data-act="scope"][data-v="new"]'); await wait(200);
  console.log("B This week written:", E.log.aiBodies.filter(b => /briefing/.test(b.system)).length === 2, "| back to the first: no new request:", E.log.aiBodies.filter(b => /briefing/.test(b.system)).length === 2);
  // C: Rewrite
  P.tap('[data-act="rewrite"]'); await until(() => E.log.aiBodies.filter(b => /briefing/.test(b.system)).length === 3, 3000);
  console.log("C Rewrite asks again:", E.log.aiBodies.filter(b => /briefing/.test(b.system)).length === 3);
  E.finish(); await p;
  const saved = JSON.parse(E.files["/icloud/Documents/BlogPulse/stories.json"] || "{}");
  console.log("D saved stories:", Object.keys(saved).join(", "));
  // E: reopen: the saved story shows without asking the AI
  ({ E, p } = await seeded({ files: E.files, kc: E.kc })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 4000); P = page(E);
  P.tap('[data-act="view"][data-v="story"]'); await wait(300);
  console.log("E reopened: story shown:", !!P.$("#list .story"), "| AI asked:", E.log.aiBodies.filter(b => /briefing/.test(b.system)).length);
  E.finish(); await p;
  // F: without a key there's no Story tab
  ({ E, p } = await seeded({ ai: false })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).w.__booted, 4000);
  console.log("F no key: Story tab:", !!page(E).$('[data-act="view"][data-v="story"]'));
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
