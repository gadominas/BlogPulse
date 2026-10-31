# Blueprints

BlogPulse follows the shared blueprints in https://github.com/gadominas/app-blueprints, and is the reference app for three of them.
The script's `BLUEPRINTS` block is the source of truth; this table mirrors it and adds deviations.

| Blueprint | Version | Since app version | Deviations |
| --- | --- | --- | --- |
| [in-app-updates](https://github.com/gadominas/app-blueprints/blob/in-app-updates-v1.0.0/blueprints/in-app-updates.md) | 1.0.0 | 1.0.0 | From 1.5.0, no two-day snooze: **Later** hides the offer until the next launch, and older snoozes are cleared at start |
| [settings](https://github.com/gadominas/app-blueprints/blob/settings-v1.1.0/blueprints/settings.md) | 1.1.0 | 1.13.0 | Reference app (from 1.1.0); fully in line from 1.2.0, when Built with (step 9) was added; Section cards (1.1.0) are built by `cardSections()` right after each render, giving the same markup as Step 5 without rewriting every section's code; the card CSS is scoped under `#cfgsheet` |
| [ai-configuration](https://github.com/gadominas/app-blueprints/blob/ai-configuration-v1.0.0/blueprints/ai-configuration.md) | 1.0.0 | 1.0.0 | Reference app |
| [launch-screen](https://github.com/gadominas/app-blueprints/blob/launch-screen-v1.0.0/blueprints/launch-screen.md) | 1.0.0 | 1.6.0 | The name uses the app's `--display` font (`--sp-font`); no Detail part (the logo has none); the app's own `spin-dot` and `spin` classes were renamed `busy-dot` and `rf-spin` so no app class starts with `sp` |
| [widgets](https://github.com/gadominas/app-blueprints/blob/widgets-v1.0.0/blueprints/widgets.md) | 1.0.0 | 1.8.0 | Settings load at the top of the script (no `loadSettings()`), before both branches; the WebView is now built in `main()` (`buildWebView()`), so the widget branch comes before it. Keeps the existing Widget tunables (`widgetScanAfterMin`, `widgetScanBudget`, `widgetStoryHours`): the widget may check blogs within `widgetScanBudget`, as before, but keeps the result in memory and saves only the widget snapshot (before 1.8.0 it also wrote BlogPulse's files). Caught-up state adds the caption "Following N blogs" |
| [ai-invitation](https://github.com/gadominas/app-blueprints/blob/ai-invitation-v1.2.1/blueprints/ai-invitation.md) | 1.2.1 | 1.12.0 | `inviteIfDue` reaches the page with BlogPulse's `call("__aiInvite", AI_INVITE)` (its `js()`). The page's busy check also waits for BlogPulse's own `#confirm` dialog (Mark all read), and `window.canInvite` holds the card back while Listen is playing. `window.__aiOpen` opens the AI sheet like the Settings row's `aiopen` action but without that action's token-count refresh (`send("state")`), whose re-render would wipe the **Add key** pulse; the counts were handed over at start-up. With BlogPulse's no-snooze update offer, **Later** clears `pendingUpdate` only after `inviteIfDue` has run, so it is still one offer per launch. Names stay apart from the "Invite someone to read a post" feature (`makeInvite`, the `invite` action) |
| [read-aloud](https://github.com/gadominas/app-blueprints/blob/read-aloud-v1.0.0/blueprints/read-aloud.md) | 1.0.0 | 1.15.1 | Reference app. `refreshInPlace()` is inlined in `refreshReadingViews()` (it re-renders the inline TL;DR and the TL;DR screen), and the `readAloudAct` and `readAloudBridge` cases are inline in BlogPulse's own click and action handlers |
| [usage-analytics](https://github.com/gadominas/app-blueprints/blob/usage-analytics-v1.1.0/blueprints/usage-analytics.md) | 1.1.0 | 1.14.0 | The question card is drawn on the page from the state's `usageAsk` flag (the page renders its list itself); listening is reported by the page with a fixed kind (`usage-listen`); invites are counted when written (`invite_made`), as BlogPulse can't know they were sent; `app_open` adds `group_by` |

## Recipes

Coding rules every app follows (https://github.com/gadominas/app-blueprints/tree/main/recipes). They describe how the code is written, not a feature, so they aren't listed in the script's `BLUEPRINTS` block or in Built with.

| Recipe | Version | Since app version | Deviations |
| --- | --- | --- | --- |
| [safe-startup](https://github.com/gadominas/app-blueprints/blob/safe-startup-v1.1.0/recipes/safe-startup.md) | 1.1.0 | 1.12.0 | none (reference implementation for 1.1.0; first followed 1.0.0 from 1.9.2). `write()` guards every data file, not only a list of names |
