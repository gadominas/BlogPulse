// Read later: the bookmark, the tab and its count, Done, Clear finished (moved to the testkit)
const { scenario } = require(process.env.TESTKIT || '../../../app-blueprints/testkit');

scenario('read later', async (t) => {
  const app = await t.open();
  await app.until(() => app.$$('.card').length >= 3, 6000, 'the cards');
  const idOf = (title) => { const c = app.$$('.card').find((x) => (x.querySelector('h3') || {}).textContent.includes(title)); return c && c.id.slice(2); };
  const pin = (id) => '[data-act="pin"][data-id="' + id + '"]';
  const later = '[data-act="view"][data-v="later"]';
  const [a, b, c] = ['Scaling Java', 'Spring Boot', 'Spring AI'].map(idOf);
  // What the app saved; each step waits for its save to land before the next tap (wait for the effect, never a fixed time)
  const saved = () => Object.values(app.json(app.path('articles.json')) || {}).filter((x) => x.pinned).map((x) => x.title);
  const savedAre = (...titles) => () => { const s = saved(); return s.length === titles.length && titles.every((x) => s.some((y) => y.includes(x))); };

  t.step('A. Save three');
  for (const id of [a, b, c]) app.tap(pin(id));
  t.check(app.$$('[data-act="pin"][aria-pressed="true"]').length === 3, 'three bookmarks are pressed');
  t.see('tab', app.text(later));
  t.check(/3/.test(app.text(later)), 'the Read later tab counts 3');
  t.check(!!(await app.within(savedAre('Scaling Java', 'Spring Boot', 'Spring AI'), 3000)), 'all three are saved');

  t.step('B. The Read later tab');
  app.tap(later);
  await app.until(() => app.$$('.card').length === 3, 2000, 'three saved cards');
  t.check(app.$$('[data-act="pindone"]').length === 3, 'each saved card has Done');

  t.step('C. Done on one');
  app.tap('[data-act="pindone"][data-id="' + a + '"]');
  t.check(!!(await app.within(() => app.$$('.card').length === 2, 2000)), 'it leaves the list');
  t.check(/2/.test(app.text(later)), 'the tab counts 2');
  t.check(!!(await app.within(savedAre('Spring Boot', 'Spring AI'), 3000)), 'Done unsaves it');

  t.step('D. Unbookmark one');
  app.tap(pin(b));
  t.check(!!(await app.within(() => app.$$('.card').length === 1, 2000)), 'one card is left');

  t.step('E. What is saved');
  await app.within(savedAre('Spring AI'), 3000);
  await t.close(app);
  const pinned = saved();
  t.see('pinned', pinned);
  t.check(pinned.length === 1 && /Spring AI/.test(pinned[0]), 'only the Spring AI post stays saved');
});
