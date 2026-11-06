// AI settings: adding a Claude key (models checked), choosing a model, Test, adding an OpenAI key and switching provider,
// usage, removing a key (AI features go away)
const { seeded, page, wait, until, finish, KEY } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  const { E, p } = await seeded({ ai: false }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  const P = page(E);
  P.tap('[data-act="cfgopen"]'); await wait(20); P.tap('[data-act="aiopen"]'); await wait(30);
  console.log("A AI settings:", P.$("#aisheet").classList.contains("open"), "| provider cards:", P.$$("#aisheet .aicard h3, #aisheet .aicard b").slice(0, 2).map(b => b.textContent.trim()).join(" · "), "| Story tab:", !!P.$('[data-act="view"][data-v="story"]'));
  E.log.pushAlert({ fields: [KEY] });
  P.tap('#aisheet [data-act="aikey"][data-v="anthropic"]');
  await until(() => /models available/.test(P.text("#toast")), 3000);
  console.log("B key saved:", !!E.kc.BLOGPULSE_ANTHROPIC_KEY, "| toast:", P.text("#toast"), "| shown as:", (P.text("#aisheet").match(/…\w{4}/) || ["?"])[0], "| full key on the page:", P.text("#aisheet").includes(KEY));
  console.log("  Story tab now:", !!P.$('[data-act="view"][data-v="story"]'), "| models in the picker:", P.$$("#ms-anthropic option").map(o => o.value).join(", "));
  const sel = P.$("#ms-anthropic"); sel.value = "claude-opus-5-5"; sel.dispatchEvent(new P.w.Event("change", { bubbles: true }));
  await until(() => /now uses/.test(P.text("#toast")), 2000);
  console.log("C model:", P.text("#toast"));
  P.tap('#aisheet [data-act="aitest"][data-v="anthropic"]'); await until(() => /works/.test(P.text("#toast")), 2000);
  console.log("D Test:", P.text("#toast"), "| model used:", E.log.aiBodies.slice(-1)[0].model);
  E.log.pushAlert({ fields: ["sk-proj-ABCDEFGHIJKLMNOP1234"] });
  P.tap('#aisheet [data-act="aikey"][data-v="openai"]'); await until(() => E.kc.BLOGPULSE_OPENAI_KEY, 2000); await wait(100);
  P.tap('#aisheet [data-act="aiprov"][data-v="openai"]'); await wait(200);
  console.log("E OpenAI key, provider OpenAI:", P.$('#aisheet .aicard.active [data-act="aikey"]')?.dataset.v, "| chat models only:", P.$$("#ms-openai option").map(o => o.value).join(", "));
  P.tap('[data-act="aiclose"]'); await wait(20); P.tap('[data-act="cfgclose"]'); await wait(20);
  const a = P.idOf("Scaling Java");
  P.tap(`[data-act="tldr"][data-id="${a}"]`); await until(() => P.$(`#c-${a} .badge-ai`), 3000);
  console.log("  a TL;DR now comes from:", P.text(`#c-${a} .badge-ai`), "| sent to:", E.log.aiBodies.slice(-1)[0].provider);
  P.tap('[data-act="cfgopen"]'); await wait(20); P.tap('[data-act="aiopen"]'); await wait(30);
  console.log("F token usage:", P.text("#aisheet").split("Token usage")[1].slice(0, 120));
  // G: Remove asks for a second tap (Confirm), then the key goes
  const rm = v => P.$(`#aisheet [data-act="airm"][data-v="${v}"]`);
  P.tap(null, rm("openai")); await wait(20);
  console.log("G first tap arms it:", rm("openai").textContent.trim(), "| key still there:", !!E.kc.BLOGPULSE_OPENAI_KEY);
  P.tap(null, rm("openai")); await until(() => !E.kc.BLOGPULSE_OPENAI_KEY, 2000);
  P.tap(null, rm("anthropic")); await wait(20); P.tap(null, rm("anthropic")); await until(() => !E.kc.BLOGPULSE_ANTHROPIC_KEY, 2000); await wait(100);
  console.log("  both removed:", !E.kc.BLOGPULSE_OPENAI_KEY && !E.kc.BLOGPULSE_ANTHROPIC_KEY, "| Story tab gone:", !P.$('[data-act="view"][data-v="story"]'));
  E.finish(); await p;
  console.log("  AI invitation comes back next launch:", JSON.parse(E.files["/icloud/Documents/BlogPulse/settings.json"]).aiInvite?.next === 0);
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
