// Invite to read: the dialog (who, instructions, presets, ↺ last), the AI invitation with the post's card, editing,
// Copy and Share only on a tap, written text kept when reopened, the template without AI, from a TL;DR
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded(); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  let P = page(E);
  const a = P.idOf("Scaling Java");
  P.tap(`[data-act="quickinvite"][data-id="${a}"]`); await wait(30);
  console.log("A dialog:", P.text("#invdlg .updtag"), "|", P.text("#invdlg .qi-t").slice(0, 30), "| fields:", !!P.$("#qiWho"), !!P.$("#qiInstr"), "| presets:", P.$$('[data-act="qipreset"]').length, "| button:", P.text('[data-act="qigo"]'));
  P.$("#qiWho").value = "my platform team";
  P.tap('[data-act="qipreset"]'); await wait(10);
  P.$("#qiInstr").value += " Mention our JDK 21 upgrade.";
  console.log("  instructions after a preset:", P.$("#qiInstr").value);
  P.tap('[data-act="qigo"]');
  console.log("B tapped: button says", P.text('[data-act="qigo"]'), "| disabled while writing:", P.$('[data-act="qigo"]').disabled);
  await until(() => P.$("#qiText"), 3000);
  const txt = P.$("#qiText").value, prompt = E.log.invitePrompts[0] || "";
  console.log("  label:", P.text("#invdlg .qi-lbl"), "| buttons now:", P.text('[data-act="qigo"]'), "/", P.text('[data-act="qicancel"]'));
  console.log("  text ends with the post's card (title — blog, description, link):", /“Scaling Java services with virtual threads” — Netflix TechBlog/.test(txt), txt.trim().endsWith("https://netflixtechblog.com/a1"));
  console.log("  prompt: who:", /my platform team/.test(prompt), "| instructions:", /JDK 21 upgrade/.test(prompt), "| title:", /Scaling Java/.test(prompt));
  console.log("  nothing shared or copied yet:", !E.log.shares.length && !E.log.copied.length);
  P.$("#qiText").value = txt.replace("Hi!", "Hi team!");
  P.tap('[data-act="qicopy"]'); await until(() => E.log.copied.length, 1000);
  P.tap('[data-act="qishare"]'); await until(() => E.log.shares.length, 1000);
  console.log("C Copy:", E.log.copied[0].slice(0, 20), "| Share:", E.log.shares[0].slice(0, 20), "| edits kept:", /Hi team!/.test(E.log.shares[0]), "| dialog still open:", !!P.$("#invdlg"));
  P.tap('[data-act="qicancel"]'); await wait(20);
  P.tap(`[data-act="quickinvite"][data-id="${a}"]`); await wait(30);
  console.log("D reopened: the invitation is still there:", !!P.$("#qiText"), "| button:", P.text('[data-act="qigo"]'));
  P.tap('[data-act="qicancel"]'); await wait(20);
  const b = P.idOf("Spring Boot");
  P.tap(`[data-act="quickinvite"][data-id="${b}"]`); await wait(30);
  console.log("E another post: ↺ Use my last instructions:", !!P.$('[data-act="qilast"]'));
  P.tap('[data-act="qilast"]'); await wait(10);
  console.log("  filled:", P.$("#qiInstr").value.slice(0, 50));
  P.tap('[data-act="qicancel"]'); await wait(20);
  // F: from the TL;DR
  P.tap(`[data-act="tldr"][data-id="${b}"]`); await until(() => P.$(`#c-${b} .tli [data-act="quickinvite"]`), 3000);
  P.tap(`#c-${b} .tli [data-act="quickinvite"]`); await wait(30);
  console.log("F from the TL;DR: same dialog:", !!P.$("#invdlg"), P.text("#invdlg .qi-t").slice(0, 25));
  P.tap('[data-act="qicancel"]'); await wait(20);
  E.finish(); await p;
  console.log("  last instructions saved:", JSON.parse(E.files["/icloud/Documents/BlogPulse/settings.json"]).inviteInstr.slice(0, 40));
  // G: without AI: a template, no AI call
  ({ E, p } = await seeded({ ai: false })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000); P = page(E);
  P.tap(`[data-act="quickinvite"][data-id="${P.idOf("Scaling Java")}"]`); await wait(30);
  console.log("G without AI: note:", P.text("#invdlg .note").slice(0, 60), "| no instructions box:", !P.$("#qiInstr"));
  P.$("#qiWho").value = "Ana"; P.tap('[data-act="qigo"]'); await until(() => P.$("#qiText"), 2000);
  console.log("  template:", P.text("#invdlg .qi-lbl"), "|", P.$("#qiText").value.split("\n")[0].slice(0, 60), "| AI calls:", E.log.aiBodies.length);
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
