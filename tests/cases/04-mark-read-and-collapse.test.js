// Mark read, read posts folded to their title (⌄ ⌃), Mark N read for a day, Mark all read with its warning, the setting
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  const { E, p } = await seeded(); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  const P = page(E);
  P.tap('[data-act="view"][data-v="all"]'); await wait(30);
  const id = P.$$(".card")[0].id.slice(2);
  P.tap(`[data-act="read"][data-id="${id}"]`); await wait(450);
  let c = P.card(id);
  console.log("A marked read:", c.classList.contains("read"), "| folded to its title:", c.classList.contains("collapsed"), "| title:", c.querySelector("h3").textContent.slice(0, 40), "| buttons left:", [...c.querySelectorAll("button")].map(b => b.dataset.act).join(","));
  P.tap(`[data-act="expand"][data-id="${id}"]`); await wait(30); c = P.card(id);
  console.log("B ⌄ opens it:", !c.classList.contains("collapsed"), "| ⌃ there:", !!c.querySelector('[data-act="collapse"]'), "| actions back:", !!c.querySelector('[data-act="listenarticle"]'));
  P.tap(`[data-act="collapse"][data-id="${id}"]`); await wait(450); c = P.card(id);
  console.log("C ⌃ folds it again:", c.classList.contains("collapsed"));
  // D: the setting off: read posts stay whole
  P.tap('[data-act="cfgopen"]'); await wait(30);
  const sw = () => P.$('[data-act="toggle"][data-v="collapseRead"]');
  console.log("D Settings › Reading › Collapse read posts:", !!sw(), "| on by default:", sw().classList.contains("on"));
  P.tap(null, sw()); await wait(60);
  P.tap('[data-act="cfgclose"]'); await wait(30);
  console.log("  off → read post whole:", !P.card(id).classList.contains("collapsed"), "| no ⌃:", !P.card(id).querySelector('[data-act="collapse"]'));
  P.tap('[data-act="cfgopen"]'); await wait(30); P.tap(null, sw()); await wait(60); P.tap('[data-act="cfgclose"]'); await wait(30);
  // E: Mark N read for a day
  P.tap('[data-act="view"][data-v="unread"]'); await wait(30);
  const mg = P.$('[data-act="markgroup"]');
  const before = P.$$(".card.unread").length;
  console.log("E", mg && mg.textContent.trim(), "| unread before:", before);
  P.tap(null, mg); await wait(500);
  console.log("  unread after:", P.$$(".card.unread").length, "| undo toast:", P.text("#toast").slice(0, 60));
  // F: Mark all read asks first
  P.tap('[data-act="view"][data-v="all"]'); await wait(30);
  P.$$('[data-act="read"]').forEach(() => {});
  const markAll = P.$('[data-act="markallask"]');
  if (markAll) { P.tap(null, markAll); await wait(30); console.log("F warning:", P.text("#confirm, .confirm, #markall").slice(0, 90)); P.tap('[data-act="markallcancel"]'); await wait(30); console.log("  cancel keeps unread:", P.$$(".card.unread").length); }
  else console.log("F Mark all read: no unread left on this page");
  // G: Mark unread on a folded post
  P.tap(`[data-act="expand"][data-id="${id}"]`); await wait(30);
  P.tap(`[data-act="read"][data-id="${id}"]`); await wait(60);
  console.log("G marked unread again:", P.card(id).classList.contains("unread"), "| whole:", !P.card(id).classList.contains("collapsed"));
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
