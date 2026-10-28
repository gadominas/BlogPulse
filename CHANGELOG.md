# Changelog

All notable changes to BlogPulse. Generated from `releases.json`; edit that file, not this one.

## 1.1.0 (2026-10-28): Pull down to refresh

- ⬇️ **Pull to refresh**: Pull the list down and hold until the ring fills to check every blog again.
- ⏱ **Your hold time**: Choose how long to hold, from instant to 5 seconds, in Settings.
- 🛡 **No accidental checks**: Let go early and nothing happens, so a casual drag never refreshes.

**Changes**

- Pull-to-refresh on the post list with a hold ring and status text
- New setting: Settings › Checking blogs › Pull-to-refresh hold (0 to 5 seconds, default 1.5)
- Pulling is ignored while a sheet is open, during a running check, and for sideways swipes
- The refresh button in the header stays as before

## 1.0.0 (2026-10-28): Your tech blogs, sorted and summarised

- 🧭 **Story of your blogs**: The latest posts blended into one short, cited read, per topic.
- ⚡ **TL;DR in place**: Tap TL;DR on any post to read its summary right in the list.
- 🗂 **Topic pages**: Posts sorted into Tech, AI, Finance and more. Swipe between pages.

**Changes**

- Checks every followed blog each time the app opens and marks what's new
- Follow blogs by searching or by pasting any address; the RSS or Atom feed is found automatically
- Mark read or unread, rate posts 1 to 3 stars, group by day or by week
- Picks: unread posts similar to the ones you rate highest
- Topic pages sorted by AI or by keywords, with a per-blog override
- Story: an AI-written briefing of the latest posts with citations and a TL;DR box
- TL;DR on any post, inline; extracted from the article when no AI key is set
- Invite to read: an AI-written message in your own words, shared with one tap
- Home-screen widget with a short summary and the top pick
- Seven colour themes, three layouts, four text sizes, sans or serif headlines
- AI settings: Claude or OpenAI key, model picker loaded from your account, token usage per provider, model and feature
- Settings screen for every limit and timing, with reset to defaults
- In-app updates from GitHub with a two-day Later
