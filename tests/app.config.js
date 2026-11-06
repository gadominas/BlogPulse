// BlogPulse's per-app values for the app-blueprints testkit (recipes/testing.md › Per-app values).
const DAY = 864e5;
module.exports = {
  name: 'BlogPulse',
  script: '../BlogPulse.js',
  folder: 'BlogPulse',                       // <iCloud Drive or the phone>/BlogPulse/settings.json
  now: '2026-10-29T08:32:00Z',
  // A returning user's choices: the usage question answered, the AI invitation off (packs start from these)
  settings: { usageAsked: true, shareUsage: false, aiInvite: { off: true } },
  // …and data: two blogs followed
  seed: (h) => ({ files: { [h.path('sources.json')]: JSON.stringify([
    { id: 's-netflix', title: 'Netflix TechBlog', site: 'https://netflixtechblog.com', feed: 'https://netflixtechblog.com/feed', added: h.now - 30 * DAY },
    { id: 's-spring', title: 'Spring', site: 'https://spring.io/blog', feed: 'https://spring.io/blog.atom', added: h.now - 30 * DAY }]) } }),
  data: ['sources.json'],
  routes: require('./fixtures').routes,     // the app's own fixtures (feeds so far; the rest move here from harness.js)
  offline: ['https://'],
  legacyCases: true,                         // tests/cases still on the old harness: run them as before until moved                     // until then: every other host fails like a phone without a connection
};
