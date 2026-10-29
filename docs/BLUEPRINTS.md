# Blueprints

BlogPulse follows the shared blueprints in https://github.com/gadominas/app-blueprints, and is the reference app for two of them.
The script's `BLUEPRINTS` block is the source of truth; this table mirrors it and adds deviations.

| Blueprint | Version | Since app version | Deviations |
| --- | --- | --- | --- |
| [in-app-updates](https://github.com/gadominas/app-blueprints/blob/in-app-updates-v1.0.0/blueprints/in-app-updates.md) | 1.0.0 | 1.0.0 | From 1.5.0, no two-day snooze: **Later** hides the offer until the next launch, and older snoozes are cleared at start |
| [settings](https://github.com/gadominas/app-blueprints/blob/settings-v1.0.0/blueprints/settings.md) | 1.0.0 | 1.2.0 | Reference app (from 1.1.0); fully in line from 1.2.0, when Built with (step 9) was added |
| [ai-configuration](https://github.com/gadominas/app-blueprints/blob/ai-configuration-v1.0.0/blueprints/ai-configuration.md) | 1.0.0 | 1.0.0 | Reference app |
| [launch-screen](https://github.com/gadominas/app-blueprints/blob/launch-screen-v1.0.0/blueprints/launch-screen.md) | 1.0.0 | 1.6.0 | The name uses the app's `--display` font (`--sp-font`); no Detail part (the logo has none); the app's own `spin-dot` and `spin` classes were renamed `busy-dot` and `rf-spin` so no app class starts with `sp` |
| [widgets](https://github.com/gadominas/app-blueprints/blob/widgets-v1.0.0/blueprints/widgets.md) | 1.0.0 | 1.8.0 | Settings load at the top of the script (no `loadSettings()`), before both branches; the WebView is now built in `main()` (`buildWebView()`), so the widget branch comes before it. Keeps the existing Widget tunables (`widgetScanAfterMin`, `widgetScanBudget`, `widgetStoryHours`): the widget may check blogs within `widgetScanBudget`, as before, but keeps the result in memory and saves only the widget snapshot (before 1.8.0 it also wrote BlogPulse's files). Caught-up state adds the caption "Following N blogs" |
