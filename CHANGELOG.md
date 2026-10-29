# Changelog

All notable changes to BlogPulse. Generated from `releases.json`; edit that file, not this one.

## 1.6.0 (2026-10-29): Scan. Read. Rate.

- 📈 **A logo of its own**: The pulse feed: a heartbeat through your reading list, a violet dot and a teal new-post line.
- 🎬 **Launch screen**: The pulse draws itself and the tagline appears for about 2 seconds; tap to skip.
- ✨ **Branded everywhere**: The logo sits in the header, on the first-run screen and in the README.

**Changes**

- New BlogPulse logo (pulse feed): docs/logo.svg and a 1024 px app icon, docs/icon-1024.png
- Launch screen shown for 2.4 s with a short animation and the tagline "Scan. Read. Rate."; tap to skip; still with Reduce Motion (shared launch-screen blueprint 1.0.0)
- Logo mark in the header, the logo on the "Follow your first blog" screen, and at the top of the README
- Settings › Built with lists the launch-screen blueprint

## 1.5.0 (2026-10-29): Updates you won't miss

- 🔔 **Offered every time**: A new version is offered each time you open BlogPulse until you install it.
- 👆 **No accidental snooze**: Later, or a tap outside the sheet, no longer hides updates for two days.
- 🧹 **Old snooze cleared**: A two-day Later left by an older version is removed when BlogPulse starts.

**Changes**

- Later hides the update offer only until BlogPulse is opened again
- Settings › Updates explains when updates are checked

**Fixes**

- Tapping outside the update sheet could hide updates for two days without pressing Later

## 1.4.0 (2026-10-29): Natural AI voices

- ✦ **AI voice**: Have your news and the Story read by OpenAI's natural-sounding voices.
- 🎙 **Pick the voice and style**: Female or male voices, the speech model, and a style such as "calm newsreader".
- 📊 **See what it uses**: Characters read aloud are counted in AI settings, per model and day.

**Changes**

- Settings › Listening › Voice engine: iPhone voice or ✦ AI voice (OpenAI speech; needs an OpenAI key)
- AI voice settings: voice with Female and Male filters, speech model loaded from your OpenAI account, style instructions for gpt-4o-mini-tts, speed, voice test
- All Listen buttons use the chosen engine; the player shows ✦ AI voice and prepares the next piece while one plays
- If an AI voice request fails, the iPhone voice takes over from the same place
- Token usage shows characters read aloud per model, today and this month; AI settings always opens with fresh counts

## 1.3.0 (2026-10-29): Listen to your news

- 🔊 **Read aloud**: Listen to a day's posts, the Story, a TL;DR or a full article.
- 🗣 **Your choice of voice**: Pick a female or male voice, its speed and pitch, in Settings › Listening.
- ⏯ **Player controls**: Pause, skip to the next post or stop from the bar at the bottom.

**Changes**

- Listen buttons next to each day or week, on the Story, in inline TL;DRs and in the TL;DR panel
- Listen to the full article: BlogPulse reads the article page, or the feed excerpt when the page can't be read
- Player bar with pause, next and stop; the post being read is highlighted
- Settings › Listening: voice menu grouped by language with Female and Male filters, speed, pitch and a voice test
- Uses the iPhone's own voices (free, offline); falls back to the system voice when speech isn't available

**Fixes**

- The TL;DR hint now points to Settings › AI settings

## 1.2.0 (2026-10-28): Built with

- 🧩 **Built with**: A new last section in Settings shows the shared blueprints BlogPulse is built from.
- 🔗 **Read how it works**: Each blueprint opens at the exact version this release follows.
- 🧭 **Same as the other apps**: Strava Daily Digest, Dienynas+ and Go2FGym show the same section.

**Changes**

- Settings › Built with: In-app updates, Settings and AI configuration, each with its version and the BlogPulse version that brought it in, plus a link to all blueprints
- BLUEPRINTS block in the script, so the blueprints inventory can read what BlogPulse follows
- docs/BLUEPRINTS.md lists the same blueprints with links and deviations

**Fixes**

- Links from Built with open only pages in the blueprints repository

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
