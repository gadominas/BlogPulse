// BlogPulse's own fixtures, as testkit routes (recipes/testing.md › Fixtures). Moved from harness.js.
const H = 3600e3, DAY = 24 * H;
const rfc = (t) => new Date(t).toUTCString(), iso = (t) => new Date(t).toISOString();
const feeds = (now) => ({
  'https://netflixtechblog.com/feed': `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>Netflix TechBlog - Medium</title><link>https://netflixtechblog.com</link>
<item><title><![CDATA[Scaling Java services with virtual threads]]></title><link>https://netflixtechblog.com/a1</link><guid>a1</guid><pubDate>${rfc(now - H)}</pubDate><description>&lt;p&gt;How we moved &amp;amp; scaled &lt;b&gt;Java&lt;/b&gt; services to virtual threads and cut tail latency.&lt;/p&gt;</description></item>
<item><title>Data mesh at Netflix</title><link>https://netflixtechblog.com/a2</link><guid>a2</guid><pubDate>${rfc(now - 10 * DAY)}</pubDate><content:encoded><![CDATA[<p>How teams own their data products.</p>]]></content:encoded></item>
</channel></rss>`,
  'https://spring.io/blog.atom': `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title type="text">Spring</title><link rel="self" href="https://spring.io/blog.atom"/><link href="https://spring.io/blog"/>
<entry><title>Spring Boot 4.1 released</title><link rel="alternate" href="/blog/2026/10/boot"/><id>tag:spring,1</id><published>${iso(now - 2 * H)}</published><summary type="html">&lt;p&gt;Spring Boot 4.1 brings virtual threads by default.&lt;/p&gt;</summary></entry>
<entry><title>Spring AI 2.0 brings agents to Spring apps</title><link rel="alternate" href="/blog/2026/10/ai"/><id>tag:spring,2</id><published>${iso(now - 5 * H)}</published><summary type="html">&lt;p&gt;Agent workflows for Spring developers.&lt;/p&gt;</summary></entry>
</feed>`,
});
module.exports = {
  routes: [
    { name: 'feeds', match: (u) => u.split('?')[0] in feeds(0), respond: (req) => ({ body: feeds(Date.now())[req.url.split('?')[0]], type: 'application/rss+xml' }) },
  ],
};
