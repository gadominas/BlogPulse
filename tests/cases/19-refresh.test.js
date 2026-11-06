// Checking for new posts: the refresh button, pull-and-hold, a new post marked New, a blog whose feed fails, blogs in the sheet
const { seeded, page, wait, until, finish } = require("../harness");
(async () => {
  const errors = []; process.on("unhandledRejection", e => errors.push("UNHANDLED " + (e.stack || e)));
  const { E, p } = await seeded({ newPost: true, feedDown: "spring.io", files: undefined }); p.catch(e => errors.push("SCRIPT " + e.stack));
  await until(() => page(E).$$(".card").length, 5000); await wait(200);
  const P = page(E);
  const hits = () => Object.values(E.log.feedHits).reduce((a, b) => a + b, 0);
  console.log("A after the first check:", P.$$(".card").length, "cards | feeds asked:", hits(), "| Spring is down, its posts:", P.$$(".card .src").filter(s => s.textContent === "Spring").length);
  const h0 = hits();
  P.tap('[data-act="refresh"]'); await until(() => hits() > h0, 2000); await until(() => P.$$(".card").length > 3, 2000);
  console.log("B refresh: feeds asked again:", hits() - h0, "| new post:", P.text(`#c-${P.idOf("chaos testing")} h3`), "| marked New:", !!P.$(`#c-${P.idOf("chaos testing")} .flag.new`));
  console.log("  toast:", P.text("#toast").slice(0, 60));
  // C: pull down past the ring and hold until it fills
  const h1 = hits();
  P.touch("start", "#list", 200, 120); P.touch("move", "#list", 200, 300); await wait(30);
  console.log("C pulling:", P.text("#ptr, .ptr").slice(0, 50));
  await wait(1500); P.touch("end", "#list", 200, 300);
  await until(() => hits() > h1, 2000);
  console.log("  after the hold: checked again:", hits() > h1);
  const h2 = hits();
  P.touch("start", "#list", 200, 120); P.touch("move", "#list", 200, 160); P.touch("end", "#list", 200, 160); await wait(300);
  console.log("D a short pull does nothing:", hits() === h2);
  // E: the blogs sheet shows the feed that failed
  P.tap('[data-act="sheet"]'); await wait(40);
  const t = P.text("#sheet"), i = t.indexOf("Spring", t.indexOf("Following"));
  console.log("E blogs sheet, Spring's row:", t.slice(i, i + 90));
  P.tap('[data-act="sheet"]'); await wait(20);
  E.finish(); await p;
  finish(E, errors); process.exit(0);
})().catch(e => { console.log("CRASH", e.stack); process.exit(1); });
