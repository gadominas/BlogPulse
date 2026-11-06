// Sound with the Ring/Silent switch on (audio-playback blueprint): the media session and the silence loop, on while reading, off after
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  const { E, p } = await seeded({ manualSpeech: true }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  const P = page(E), ss = P.w.speechSynthesis;
  const loop = () => (E.log.audios || []).find(x => x.loop);
  console.log("A at rest: session", P.w.navigator.audioSession.type, "| silence loop playing:", !!(loop() && !loop().paused));
  const a = P.idOf("Scaling Java");
  P.tap(`[data-act="tldr"][data-id="${a}"]`); await until(() => P.$(`#c-${a} [data-act="listentldr"]`), 3000);
  P.tap(`#c-${a} [data-act="listentldr"]`); await wait(100);
  console.log("B Listen to TL;DR: session", P.w.navigator.audioSession.type, "| silence loop:", !!(loop() && !loop().paused), loop() && loop().src.slice(0, 20), "| mode:", P.text("#plMode"));
  P.tap('[data-act="plpause"]'); await wait(20);
  console.log("C paused: loop paused too:", loop().paused);
  P.tap('[data-act="plpause"]'); await wait(20);
  console.log("D resumed: loop playing:", !loop().paused, "| session:", P.w.navigator.audioSession.type);
  for (let i = 0; i < 30 && ss._cur; i++) { const u = ss._cur; ss._cur = null; u.onend(); await wait(5); }
  await wait(60);
  console.log("E finished by itself: player hidden:", P.$("#player").hidden, "| session back to auto:", P.w.navigator.audioSession.type, "| loop stopped:", loop().paused);
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
