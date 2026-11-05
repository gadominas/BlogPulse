# Changelog

All notable changes to BlogPulse. Generated from `releases.json`; edit that file, not this one.

## 1.21.0 (2026-11-05): Read posts fold away

- 📥 **Read posts fold away**: Once a post is read, it shrinks to its title so unread ones stand out.
- ⌄ **Open it again**: Tap ⌄ to see a read post in full, ⌃ to fold it back.
- ⚙️ **Your choice**: Settings › Reading › Collapse read posts turns it off.

**Changes**

- Read posts show only their blog, time and title (Comfortable and Compact layouts); a post being read aloud or with its TL;DR open stays full
- Settings › Reading › Collapse read posts (on)

## 1.20.0 (2026-11-04): Invite, then you decide

- ✍️ **See it before it goes**: The invitation appears in the dialog: read it, edit it if you like.
- 📋 **Copy or Share**: Copy puts it on the clipboard; Share opens the share sheet. Only when you tap.
- 📰 **Title and description**: Every invitation ends with the post's title, a short description and the link.

**Changes**

- Invite: ✦ Write invitation shows the result in the dialog with Copy and Share…, ✦ Write again and Done; nothing opens on its own
- Invitations end with the post: “Title” — blog, a one- or two-sentence description, the link (also in the TL;DR composer and the plain invitation)
- Closing the dialog while it writes keeps the invitation: Invite shows it again

## 1.19.4 (2026-11-04): Opens on any iPhone

- 📱 **Opens on any iPhone**: BlogPulse opens on iPhones that aren't signed in to iCloud, every time.
- 📥 **Installs on new phones**: The installer works on a brand-new iPhone without iCloud too.
- 🛡 **Updates safely**: Updating can no longer stop on a phone without iCloud.

**Changes**

- iCloud is used only when Scriptable keeps its scripts in iCloud Drive; otherwise everything stays on the phone
- Settings › Built with lists Stability patterns 1.0.0, Settings 1.1.2 and In-app updates 1.0.1

**Fixes**

- On an iPhone not signed in to iCloud, BlogPulse or its installer could still stop with "iCloud is not supported"

## 1.19.3 (2026-11-03): Silent mode, shared

- 🔔 **Still heard in silent mode**: Read aloud keeps playing with the Ring/Silent switch on.
- 🎵 **Your music comes back**: Other apps' music can play again as soon as reading stops.
- 🧩 **Shared with your apps**: Settings › Built with lists Sound in silent mode, now a blueprint.

**Changes**

- The silent-mode sound code is now the shared Sound in silent mode blueprint (1.0.0); Read aloud follows 1.2.3

## 1.19.2 (2026-11-03): Listen with silent mode on

- 🔔 **Plays in silent mode**: Read aloud is heard even with the Ring/Silent switch on.
- 🎵 **Music comes back**: When reading stops, other apps' music can play again.
- ⏹ **Stop means stop**: Stopping while an article loads no longer starts it a moment later.

**Changes**

- While reading, BlogPulse tells iOS it's playing media, so the iPhone voice and the AI voice play with the Ring/Silent switch on

**Fixes**

- Read aloud was silent with the Ring/Silent switch on
- Stopping Article or the reader's Listen while the article was still loading started reading anyway when it arrived

## 1.19.1 (2026-11-03): Works without iCloud

- 📱 **Opens without iCloud**: BlogPulse now opens on iPhones that aren't signed in to iCloud.
- 💾 **Kept on the phone**: Without iCloud, your blogs and reading are saved on the phone instead.
- ☁️ **iCloud as before**: Signed in to iCloud? Nothing changes: everything stays in iCloud Drive.

**Changes**

- Without iCloud, BlogPulse keeps its data in Files › On My iPhone › Scriptable › BlogPulse

**Fixes**

- On an iPhone not signed in to iCloud, BlogPulse stopped at once with "iCloud is not supported"

## 1.19.0 (2026-11-03): Fewer walls

- 🍪 **Past consent pages**: Posts behind Yahoo's and Google's cookie pages in Europe now open in the reader.
- 📰 **Straight to the publisher**: Google News links open the publisher's own page, in the reader and with Original.
- 🔁 **Try again, see why**: A post that won't open shows what BlogPulse tried and a Try again button.

**Changes**

- Read aloud 1.2.0: pages come through the shared page fetcher, answering Yahoo's and Google's consent walls, following Google News links and logging each step to the start-up log
- When a page still won't open, Jina Reader reads it (Settings › Reading, on by default; only the public address is sent), with an optional Jina key in the Keychain
- The reader's blocked card has Try again and What BlogPulse tried; Original opens the publisher

## 1.18.0 (2026-11-02): Invite, your way

- 👤 **Who it's for**: Invite asks who you're sending to before it writes anything.
- ✍️ **Your instructions**: Write how it should sound, tap a preset, or reuse your last instructions.
- 📤 **Then straight to sharing**: Write and share opens the share sheet with the message and link.

**Changes**

- Invite opens a dialog: who it's for, your instructions (with AI), presets and Use my last instructions; it starts empty for each post
- Write and share writes the invitation for that person and opens the share sheet; Cancel or a tap outside closes it
- Without an AI key the dialog asks who it's for and shares the plain invitation
- An open TL;DR has Full screen for the TL;DR on its own screen

**Fixes**

- The no-key note in the invite composer pointed to Blogs instead of Settings › AI settings

## 1.17.0 (2026-11-02): Invite in one tap

- 📤 **Invite in one tap**: An Invite button next to Article and TL;DR goes straight to sharing.
- ✦ **Written for you**: With AI, the invitation follows your last instructions; without it, a plain one.
- 📖 **In the reader too**: Invite sits with Listen and Ask AI; Original moved up next to Done.

**Changes**

- Invite button on every post, next to Article and TL;DR (icon only in the Tiny layout), in the reader's tool row and in an open TL;DR
- One tap writes the invitation (AI with your last instructions, or the plain one without a key) and opens the share sheet with the message and link
- If the AI fails, the plain invitation is shared instead, with a note
- Write it my way in a TL;DR opens the full composer
- The reader's Original button moved to the top, next to Done

## 1.16.1 (2026-11-01): Easier questions

- ⌨️ **Send from the keyboard**: In the reader, the keyboard's Send key asks your question.
- 📝 **Room to type**: The question box grows as you write longer questions.
- 🧩 **Shared reader**: Settings › Built with lists Read aloud and reader 1.1.0.

**Changes**

- The reader's question box grows with what you type (up to a few lines) and the keyboard shows Send
- Settings › Built with lists the Read aloud and reader blueprint 1.1.0 (BlogPulse is its reference app)

## 1.16.0 (2026-11-01): A reader inside BlogPulse

- 📖 **Read without leaving**: Posts open in a clean reader with the article's own text.
- 🔊 **Listen as you read**: The text highlights sentence by sentence while it's read aloud.
- ✦ **Ask about the article**: Ask AI questions about the post you're reading, with follow-ups.

**Changes**

- Tapping a post opens the reader: title, author, reading time, the article's paragraphs, subheadings, lists, quotes and code
- If a site asks for consent or a sign-in, or can't be read, the reader says why and offers Open the article; the feed excerpt stays readable and listenable
- Listen in the reader highlights its own text and follows the voice; code blocks are shown, not read
- ✦ Ask about this article: suggested questions, answers from the article's text, follow-ups; counted as Article questions in AI usage
- Settings › Reading › Open posts in the reader (on); off opens posts in Safari as before
- The Article button on each post uses the same text as the reader

## 1.15.1 (2026-10-31): Room for the player

- 📏 **Nothing hidden behind the player**: The last post in the list scrolls clear of the player while you listen.
- 💬 **Messages above the player**: Short messages now appear above the player instead of on top of it.
- 🧩 **Read aloud blueprint**: Settings › Built with lists Read aloud, now shared with other apps.

**Changes**

- Settings › Built with lists the new Read aloud blueprint 1.0.0 (BlogPulse is its reference app)

**Fixes**

- An older style rule undid the room made for the two-row player, so the last post could hide behind it and messages appeared on top of it

## 1.15.0 (2026-10-31): Follow along as you listen

- 🏷 **Always know what's playing**: The player says Full article, TL;DR, Story or Summaries, and buttons are named to match.
- 🖍 **Read along**: The sentence being read is highlighted and read text dims, in the TL;DR and in a new text view.
- 👆 **Tap a sentence**: Jump straight to any sentence in the text you're listening to.

**Changes**

- Buttons renamed: Article (full article) on each post, Listen to TL;DR, Summaries next to each day
- Coloured mode label in the player: Full article, TL;DR, Story, Summaries
- While a TL;DR is read, its text highlights sentence by sentence, inline and in the TL;DR screen
- Text button in the player opens the text being read (the article's own paragraphs for a full article), following the voice; it pauses following for 6 s when you scroll
- Tap any sentence to jump there

## 1.14.0 (2026-10-31): Anonymous usage, if you agree

- 📊 **Help shape BlogPulse**: If you agree, BlogPulse sends anonymous counts of the features you use. Nothing else.
- 🔒 **Anonymous by design**: A random ID made on your phone, never your content, names or accounts.
- 🎛️ **Your choice, any time**: Settings › Privacy turns it on or off, and Send test shows what happened.

**Changes**

- Anonymous usage analytics (app-blueprints · usage-analytics 1.1.0): opt-in, anonymous counts to PostHog's US cloud, with a one-time question and Settings › Privacy (switch and Send test)
- Events: app_open (layout, theme, ai_key, group_by), blogs_checked (new), post_opened, post_rated (stars), summary_made (provider), story_made, listened (kind, voice), blog_added, invite_made, app_updated
- Never sent: blog or post titles, links, text, ratings of named posts, invite text or names

## 1.13.0 (2026-10-31): Clearer Settings

- 🗂️ **Sections you can see**: Each Settings section now sits in its own card, so you can tell where it starts and ends.
- 🔤 **Quieter headings**: Section names are small grey capitals, so they no longer look like settings.
- 🎨 **In every palette**: The cards follow your colours, text size and layout, light or dark.

**Changes**

- Settings (app-blueprints · settings 1.1.0): each section's rows sit in one card, with a thin border and a slightly lighter background, under a small muted uppercase heading
- The changed-count line and a section's explanation sit outside the cards; Built with is a card too

## 1.12.0 (2026-10-30): See what AI can do

- ✦ **Discover AI**: Without an AI key, a short card now and then shows what AI adds to BlogPulse.
- 🔑 **Straight to setup**: Turn on AI opens AI settings with Add key highlighted: three steps and you're done.
- 🤫 **Never pushy**: At most every few days, never over another screen, and Don't remind me again stops it for good.

**Changes**

- AI invitation card, shown only while no Claude or OpenAI key is saved: one-line summaries on new posts, the Story and TL;DRs that say why a post matters
- Appears after the launch screen and never on a launch that offers an update, over a sheet, the Mark all read dialog or while Listen is playing
- Later (or a tap outside the card) brings it back in 3 days, in 7 days after the fourth time; removing your last key brings it back on the next launch
- Settings › Built with lists the AI invitation blueprint
- A data file that can't be read is copied aside (for example articles.broken-1730000000000.json) and started fresh, with a short note when BlogPulse opens

**Fixes**

- Turn on AI highlights Add key on the provider in use: with OpenAI in use, it highlighted Claude's button
- One damaged data file no longer stops BlogPulse from saving your changes

## 1.11.0 (2026-10-30): Read it later

- 🔖 **Save for later**: Tap the bookmark on any post to keep it on your Read later list.
- ✅ **Done when read**: Tap Done to mark a post read and take it off the list.
- 🧹 **Clear finished**: Remove every saved post you've already read in one tap.

**Changes**

- Bookmark on every post, in all layouts; amber when saved
- Read later tab with a count, newest saved first, grouped by the day you saved them; shows every saved post whatever topic or blog is selected
- Done (or the circle in the Tiny layout) marks the post read and removes it from Read later; Clear finished removes all read ones
- Saved posts are never removed for age and are kept first if posts are trimmed

## 1.10.0 (2026-10-30): Listen to whole articles

- 🔊 **Listen on every post**: A Listen button reads the full article from the original page.
- 📊 **Progress as you listen**: See how far along you are and roughly how many minutes are left.
- 👆 **Tap to jump**: Tap anywhere on the progress bar to skip ahead or go back.

**Changes**

- Listen button on every post (icon only in the Tiny layout) that reads the full article; falls back to the blog's excerpt if the page can't be read
- Progress bar in the player with percentage and time left, using your speed setting or the AI voice's real pace
- Tap the bar to jump: iPhone voices restart from that sentence, the AI voice jumps to that second within the current piece

## 1.9.2 (2026-10-29): No more black screen

- 🖥 **Drawn on screen**: BlogPulse now builds its page while the window is visible, so iOS draws it.
- 🔄 **Redraw on arrival**: When your posts arrive, the screen is redrawn to be sure they show.
- 🩺 **Start-up log**: Settings › Updates shows what happened the last times BlogPulse opened.

**Changes**

- An empty dark window appears first; the real page is built inside it while it's visible
- The page redraws itself once posts arrive and whenever it comes back into view
- The start-up log records what the page reports about itself (visible or not, size)
- Settings › Updates › Start-up log shows the last 40 lines

**Fixes**

- Black screen when opening from Scriptable, while the page had in fact loaded

## 1.9.1 (2026-10-29): Opens every time

- 🔓 **Always opens**: A stuck earlier run can no longer stop BlogPulse from opening.
- ☁️ **Patient with iCloud**: If iCloud is slow, BlogPulse opens with what it has and saves nothing over your data.
- 🩺 **Says what's wrong**: If opening ever stalls, the screen shows what BlogPulse was waiting for.

**Changes**

- A new run waits at most 1.5 s for an older window, then opens anyway
- Reading each data file from iCloud gives up after 10 s instead of waiting forever; files that weren't read are never saved over
- Posts are handed to the page in pieces, each with a time limit
- A short start-up log is kept on the phone and shown if opening fails

**Fixes**

- 1.9.0 could refuse to open after a run that got stuck, showing nothing

## 1.9.0 (2026-10-29): Opens straight away

- ⚡ **No more black screen**: BlogPulse shows its launch screen at once and loads your posts behind it.
- 👆 **Safe with quick taps**: Tapping the widget several times no longer stacks up copies of the app.
- ⏳ **Work waits its turn**: Checking blogs and updates starts after the first screen is drawn.

**Changes**

- The page is shown before blogs, posts and stories are read from iCloud; a "Loading your posts…" note appears if iCloud is slow
- Checking blogs starts 0.7 s after the first screen, the update check after 3.5 s, the widget icon after 6 s
- Only one BlogPulse window at a time: a new run waits briefly, and steps aside if one is already open
- Closing BlogPulse before posts finish loading never saves over them

**Fixes**

- Black screen when opening BlogPulse, especially from the widget or after several taps

## 1.8.0 (2026-10-29): Your top pick on the Home Screen

- 📲 **A new widget**: Your top pick, the latest ✦ Story line and more unread posts, on the BlogPulse logo.
- 👆 **Tap straight to a post**: Each unread post in the medium and large widget opens its article.
- 🕒 **Never out of date unnoticed**: The widget says when blogs were last checked, and turns amber when it's been a while.

**Changes**

- Home Screen widget redrawn in the shared frame all the apps use (app-blueprints · widgets 1.0.0): BlogPulse logo and name, "3 new" or "12 unread", the top pick with its reason and blog
- Rows: the latest ✦ AI Story line, then other unread posts with their blog, each opening the article
- "Scanned 10:05" footer; "All caught up" when everything is read; Lock Screen widgets show the top pick
- Settings › Widget: new "Mark the widget as out of date after" (12 hours by default)
- The widget still checks your blogs when the last check is old, within its time limit, but no longer changes BlogPulse's own files; otherwise it shows what BlogPulse last saved
- Settings › Built with lists the Widgets blueprint

## 1.7.0 (2026-10-29): Catch up in one tap

- ✅ **Mark all read**: Clear every unread post at once from the top of the list.
- ⚠️ **A warning first**: You see how many posts will be marked, and where, before anything changes.
- 🎯 **Only this page**: On a topic page, a blog or the New tab, only those posts are marked.

**Changes**

- Mark all read button above the list, with the unread count for the page
- Confirmation sheet explaining the scope and that there's no single undo; tapping outside cancels
- Respects the topic page, the selected blog and the New and Picks tabs; hidden on Story and Rated

**Fixes**

- Restores the logo and launch screen from 1.6.0, which a mistaken push briefly replaced on GitHub

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
