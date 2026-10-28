// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: download;

// Installs or updates "BlogPulse" from GitHub. Run it again any time to update.
const URL = 'https://raw.githubusercontent.com/gadominas/BlogPulse/main/BlogPulse.js';
const NAME = 'BlogPulse';

const req = new Request(URL);
const code = await req.loadString();
if (!req.response || req.response.statusCode !== 200 || !code.includes("const APP_ID = 'blogpulse'")) {
  const a = new Alert();
  a.title = 'Download failed';
  a.message = `Could not download BlogPulse (HTTP ${req.response ? req.response.statusCode : '?'}). Check your connection and try again.`;
  a.addAction('OK'); await a.present();
} else {
  let fm; try { fm = FileManager.iCloud(); } catch (e) { fm = FileManager.local(); }
  const path = fm.joinPath(fm.documentsDirectory(), `${NAME}.js`);
  const existed = fm.fileExists(path);
  fm.writeString(path, code);
  const a = new Alert();
  a.title = existed ? 'Updated' : 'Installed';
  a.message = `"${NAME}" is in your Scriptable library. Open it from the Scripts list.`;
  a.addAction('OK'); await a.present();
}
Script.complete();
