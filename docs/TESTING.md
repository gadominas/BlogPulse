# Testing BlogPulse

BlogPulse is one Scriptable script, so it can't run in a normal test runner. The `tests/` folder runs the **real `BlogPulse.js`** in Node instead, with Scriptable's APIs replaced by stand-ins, and taps through the app the way a person would.

## Run the tests

```sh
cd tests
npm install          # jsdom
node run.js          # all 23 scenarios, one line each (about 70 seconds)
node run.js reader   # only those whose name contains "reader"
node run.js -v 13    # one scenario, printing everything it checks
```

A scenario **passes** when it finishes and reports no error from the script, from the page, no unmocked request and no crash. Every scenario also prints what it saw at each step (A, B, C…): read those lines with `-v` after a change, since most checks are things to look at (a label, a prompt, a count) rather than assertions. Bugs that were fixed are hard checks: they fail the scenario if they come back.

Run them all before every release (see [RELEASING.md](RELEASING.md)); a release goes out only with 23 of 23 passing. To test another copy of the script, set `BLOGPULSE_SCRIPT=/path/to/BlogPulse.js`.

## How it works

**`tests/harness.js`** loads `BlogPulse.js` with stand-ins for everything Scriptable provides:

| Scriptable | Stand-in |
|---|---|
| `WebView` | a [jsdom](https://github.com/jsdom/jsdom) page per `loadHTML`; `evaluateJavaScript` runs in it, and the page's `blogpulse://` bridge calls go back to the script's `shouldAllowRequest`, as on the phone. The empty first window is recorded. The page gets a fake Web Speech API (voices, utterances the test can end one by one), `Audio` and `navigator.audioSession` |
| `Request` | answers from built-in fixtures, by URL: RSS and Atom feeds, a blog page that links its feed, Feedly search, article pages (normal, paywall, 403, cookie banner), Yahoo's and Google's consent walls with redirects and cookies, Google News links, Jina Reader (with and without a key), Claude and OpenAI (chat, models, speech), GitHub (`releases.json` and the script), PostHog. An unknown URL is answered 404 and fails the scenario |
| `FileManager` | files in memory (`E.files`), iCloud Drive under `/icloud`, the phone under `/local`. Options: iCloud not delivering a file (`slowCloud`), a damaged file (`damaged`), a phone without iCloud (`noICloud`: every iCloud call throws and is recorded) |
| `Keychain` | in memory (`E.kc`); keys are fake |
| `Alert` | answers queued with `E.log.pushAlert({ fields: [...] })`, `{ action: n }` or `{ cancel: true }` |
| `Safari`, `ShareSheet`, `Pasteboard`, `Speech`, `ListWidget`, `Script`, `Timer`, `UUID`, `DrawContext`… | record what happened in `E.log` (opened links, shares, copies, widget trees) |
| `URL`, `setTimeout`, `fetch`, `atob`… | undefined, as in Scriptable's JavaScriptCore, so script-side code that uses a browser API fails here too |

`run(opts)` starts the script and returns `{ E, p }`: `E.getDom()` is the page, `E.files` and `E.kc` the stored data, `E.log` what the script did (requests, AI request bodies, speech requests, analytics events, alerts…), `E.finish()` closes the app, and `p` is the script's promise. `seeded(opts)` starts it with two blogs followed and a Claude key; `page(E)` gives `$`, `$$`, `tap`, `text`, `touch` (swipes and pulls) and `idOf(title)`.

**The AI is simulated**: the Claude and OpenAI fixtures recognise each kind of prompt (summaries and topics, Story, TL;DR, invitation, article questions, connection test) and answer with fixed JSON, and they keep the request so a test can check what BlogPulse sent.

The page sends one message to the script every 80 ms (`flush()`), as on the phone: wait for the effect (`until(...)`) rather than a fixed short time.

## The scenarios

| Test | Covers |
|---|---|
| 01 first-start-and-follow | The empty state, following by address and by name (Feedly), the first check, topics |
| 02 safe-startup | The empty first window, reopening, a slow iCloud, a damaged file (copy kept), no iCloud, a second window, the start-up log |
| 03 list-and-tabs | Tabs, day and week groups, blog chips, topics tapped and swiped, Show more |
| 04 mark-read-and-collapse | Mark read, folding to the title (⌄ ⌃), Mark N read, Mark all read's warning, the setting |
| 05 read-later | Bookmark, the tab, Done, Clear finished |
| 06 ratings-and-picks | Rate, change, clear; a rated post stays open; Rated; Picks |
| 07 tldr | Extracted without AI, Claude's TL;DR, Full screen, Hide, an unreadable page, the AI failing |
| 08 story | Writing, sections and citations, scopes, Rewrite, kept until the posts change, no tab without a key |
| 09 categories | Topics by keywords and by AI, AI summaries in the same call |
| 10 reader | Blocks, Original, reopening from memory, Safari when the reader is off, paywall and unreachable pages |
| 11 reader-consent | Yahoo's consent and its cookies, Google News through Google's consent, Jina Reader, the Jina key |
| 12 reader-ask-ai | Suggestions, follow-ups with earlier answers, what is sent, errors, no key |
| 13 read-aloud-iphone-voice | The player, progress, pause, the read-along view, jumping, the reader's Listen, Summaries, Stop while loading, waiting for a slow article |
| 14 read-aloud-ai-voice | OpenAI speech (model, voice, speed), pieces fetched ahead, pause, usage, falling back to the iPhone voice |
| 15 silent-mode | The media session and the silence loop while reading, paused, and off after |
| 16 invite | The dialog, presets, ↺ last instructions, the post's card, Copy and Share only on a tap, the template without AI |
| 17 ai-settings | Adding keys, models, Test, switching provider, token usage, removing keys |
| 18 settings | Appearance, Reading switches, Listening, Values, Built with, kept after reopening |
| 19 refresh | The refresh button, pull-and-hold, a new post, a feed that fails |
| 20 widget | Small, medium and large; a widget run that checks feeds; the empty widget; nothing written to iCloud |
| 21 updates | The offer and what's new, Later, Update now, a bad download refused, Check now |
| 22 analytics | The one-time question, No, Yes (events and their fixed fields only), Send a test, switching off |
| 23 ai-invitation-and-launch | The launch screen, the AI invitation: Later, Turn on AI, Don't remind me again, never with a key |

## Add a test

Copy the closest scenario in `tests/cases/` to `NN-what-it-covers.test.js` and keep its shape: start with `run()` or `seeded()`, tap through, print one line per step, and end with `finish(E, errors)`, which prints the `errors: … | unmocked URLs: … | console.error: … | JS errors: …` line `run.js` checks. If BlogPulse calls a new service, add its smallest realistic answer to `route()` in `harness.js`; never let a test reach the real network. If the harness lacks something the app uses, add it to the harness, not to the app.

## Screenshots

The README's screenshots aren't made here: [app-blueprints](https://github.com/gadominas/app-blueprints/blob/main/repo-site/REBUILD.md)' `capture.js` runs the real script with `docs/site/scenario.js`. Run it before a release that changes what's on them.

## What it doesn't cover

Real network answers (blogs, consent pages, Google News, Jina and the AI change their pages and formats; check on the phone after such a change), how iOS draws widgets, alerts and the share sheet, real voices and audio with the Ring/Silent switch, Shortcuts, and speed on a real phone. Those are checked on the iPhone before a release.
