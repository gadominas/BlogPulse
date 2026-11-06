// Read aloud with the iPhone's voice: Article, the player (mode, progress, pause, next, stop), the post lit while speaking,
// the read-along text view, jumping to a sentence, the reader's Listen, Summaries for a day, Stop while the article loads
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  const { E, p } = await seeded({ manualSpeech: true }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000);
  const P = page(E), ss = P.w.speechSynthesis;
  const next = () => { const u = ss._cur; ss._cur = null; u && u.onend && u.onend(); };
  const boundary = i => { const u = ss._cur; u && u.onboundary && u.onboundary({ charIndex: i }); };
  const a = P.idOf("Scaling Java");
  P.tap(`[data-act="listenarticle"][data-id="${a}"]`); await wait(100);
  console.log("A tap Article: player:", !P.$("#player").hidden, "| mode:", P.text("#plMode"), "| sub:", P.text("#plSub"), "| media session:", P.w.navigator.audioSession.type);
  await until(() => E.log.spoken.length >= 2, 3000);   // "Loading the article.", then the article itself
  console.log("  speaking:", E.log.spoken.slice(0, 2).map(t => t.slice(0, 40)).join(" / "), "| voice is English:", /en/.test(ss._cur.voice ? ss._cur.voice.lang : "en"), "| post lit:", P.card(a).classList.contains("speaking"));
  for (let i = 0; i < 3; i++) { next(); await wait(15); }
  boundary(5); await wait(10);
  console.log("B after 3 parts: progress:", P.text("#plTime"), "| bar:", P.$("#plBar").style.width, "| mode:", P.text("#plMode"));
  P.tap('[data-act="plpause"]'); await wait(20);
  console.log("C pause:", P.$("#player").classList.contains("paused"), "| sub:", P.text("#plSub").slice(-12), "| resume:", (P.tap('[data-act="plpause"]'), await wait(20), !P.$("#player").classList.contains("paused")));
  P.tap('[data-act="plread"]'); await wait(40);
  console.log("D read-along view:", P.$("#readsheet").classList.contains("open"), "| sentences:", P.$$("#readsheet .rs").length, "| current lit:", P.$$("#readsheet .rs-now").length, "| read dimmed:", P.$$("#readsheet .rs-done, #readsheet .rs.done").length);
  const target = P.$$("#readsheet .rs")[12];
  P.tap(null, target); await wait(150);
  const said = E.log.spoken.slice(-1)[0];
  console.log("  tap a sentence → speaks from it:", said.startsWith(target.textContent.trim().slice(0, 20)) ? true : "said: " + said.slice(0, 40) + " | tapped: " + target.textContent.slice(0, 40));
  P.tap('[data-act="raclose"]'); await wait(20);
  P.tap('[data-act="plstop"]'); await wait(40);
  console.log("E stop: player hidden:", P.$("#player").hidden, "| media session back to auto:", P.w.navigator.audioSession.type, "| post unlit:", !P.$(".card.speaking"));
  // F: the reader's Listen highlights the reader's own paragraphs
  P.tap(`#c-${a} h3`); await until(() => P.$$("#reader .rd-p").length, 3000);
  P.tap('[data-act="rdlisten"]'); await until(() => E.log.spoken.slice(-1)[0] !== "Loading the article.", 2000); await wait(100);
  next(); await wait(100); boundary(3); await wait(20);
  console.log("F reader Listen: mode", P.text("#plMode"), "| the sentence being read lit in the reader:", P.text("#reader .rs-now").slice(0, 50), "| Listen became Stop:", /Stop/.test(P.text('[data-act="rdlisten"]')));
  P.tap('[data-act="plstop"]'); await wait(30); P.tap('[data-act="rdclose"]'); await wait(30);
  // G: Summaries for a day
  P.tap('[data-act="listengroup"]'); await until(() => !P.$("#player").hidden, 1000);
  console.log("G Summaries: mode", P.text("#plMode"), "| sub:", P.text("#plSub"));
  P.tap('[data-act="plnext"]'); await wait(150);
  console.log("  next post:", P.text("#plSub"));
  P.tap('[data-act="plstop"]'); await wait(30);
  // H: Stop while the article is still loading: nothing starts afterwards
  const b = P.idOf("Spring AI"), before = E.log.spoken.length;
  P.tap(`[data-act="listenarticle"][data-id="${b}"]`); P.tap('[data-act="plstop"]'); await wait(400);
  console.log("H stop while loading: nothing spoken after:", E.log.spoken.length === before, "| player hidden:", P.$("#player").hidden);
  // I: "Loading the article." ends before the text arrives (a slow page): the player waits, then reads the article (fixed in 1.21.1)
  const c = P.idOf("Spring Boot"), n0 = E.log.spoken.length;
  P.tap(`[data-act="listenarticle"][data-id="${c}"]`); await until(() => ss._cur && ss._cur.text === "Loading the article.", 1000);
  next(); await wait(10);
  console.log("I loading phrase ended first: player still on:", !P.$("#player").hidden, "| sub:", P.text("#plSub"));
  await until(() => E.log.spoken.length > n0 + 1, 2000);
  console.log("  then the article:", (E.log.spoken.slice(-1)[0] || "").slice(0, 30));
  if (!/Spring Boot/.test(E.log.spoken.slice(-1)[0] || "")) errors.push("the article never played after the loading phrase ended (1.21.1 regression)");
  P.tap('[data-act="plstop"]'); await wait(30);
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
