// Read aloud with an AI voice (OpenAI speech): what is sent, the player, pieces in order, the iPhone voice when it fails, no OpenAI key
const { seeded, page, wait, until, finish } = require("../harness");
const OAI = "sk-proj-ABCDEFGHIJKLMNOP1234";
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  let { E, p } = await seeded({ kc: { BLOGPULSE_OPENAI_KEY: OAI }, settings: { speechEngine: "ai", ttsVoice: "marin", voiceRate: 1.25 } }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  let P = page(E);
  const au = () => (E.log.audios || []).find(x => /^data:audio\/mpeg/.test(x.src));
  const a = P.idOf("Scaling Java");
  P.tap(`[data-act="listenarticle"][data-id="${a}"]`);
  await until(() => au(), 3000);
  const b0 = E.log.speech[0] || {};
  console.log("A AI voice: sub:", P.text("#plSub"), "| model:", b0.model, "| voice:", b0.voice, "| speed:", b0.speed, "| text:", (b0.input || "").slice(0, 22));
  console.log("  playing MP3 from OpenAI:", !au().paused, "| media session:", P.w.navigator.audioSession.type, "| no silence loop next to it:", !(E.log.plays || []).some(x => /audio\/wav/.test(x) && x !== (E.log.plays || [])[0]));
  // the article arrives, pieces play one after another
  await until(() => E.log.speech.length >= 2, 3000);
  await wait(200); { const el = au(); el.onended && el.onended(); } await wait(150);   // the first piece of the article ends
  console.log("B pieces asked:", E.log.speech.length, "| next piece fetched ahead:", E.log.speech.length >= 3, "| progress:", P.text("#plTime"));
  P.tap('[data-act="plpause"]'); await wait(20);
  console.log("C pause: audio paused:", au().paused, "| resume plays:", (P.tap('[data-act="plpause"]'), await until(() => !au().paused, 1500)));   // or as soon as the piece being fetched arrives
  P.tap('[data-act="plstop"]'); await wait(30);
  E.finish(); await p;
  const usage = JSON.parse(E.files["/icloud/Documents/BlogPulse/usage.json"] || "{}");
  console.log("D usage recorded for OpenAI:", JSON.stringify((usage.p || {}).openai || {}).slice(0, 120));
  // E: OpenAI refuses the key: the iPhone voice takes over, with a note
  ({ E, p } = await seeded({ kc: { BLOGPULSE_OPENAI_KEY: OAI }, settings: { speechEngine: "ai" }, ttsFail: true })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000); P = page(E);
  P.tap(`[data-act="listenarticle"][data-id="${P.idOf("Scaling Java")}"]`);
  await until(() => E.log.spoken.length, 3000);
  console.log("E AI voice fails:", P.text("#toast").slice(0, 80), "| iPhone voice speaking:", E.log.spoken[0].slice(0, 25), "| sub:", P.text("#plSub"));
  P.tap('[data-act="plstop"]'); await wait(30);
  E.finish(); await p;
  // F: AI voice chosen but no OpenAI key: Settings says so; reading uses the iPhone voice
  ({ E, p } = await seeded({ settings: { speechEngine: "ai" } })); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000); P = page(E);
  P.tap('[data-act="cfgopen"]'); await wait(40);
  console.log("F no OpenAI key: Settings › Listening says:", (P.$$("#cfg .note, #cfgsheet .note").map(n => n.textContent).find(t => /OpenAI/.test(t)) || "").slice(0, 90));
  P.tap('[data-act="cfgclose"]'); await wait(20);
  P.tap(`[data-act="listenarticle"][data-id="${P.idOf("Scaling Java")}"]`); await until(() => E.log.spoken.length || E.log.speech.length, 2000);
  console.log("  reads with:", E.log.spoken.length ? "the iPhone voice" : "AI (" + E.log.speech.length + ")");
  P.tap('[data-act="plstop"]'); await wait(30);
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
