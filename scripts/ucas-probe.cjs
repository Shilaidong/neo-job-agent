// Dev probe (not shipped): what does the UCAS login page say to OUR embedded browser, with no tools attached?
// Default = exactly what the app now does: Electron's native UA, untouched.
// `NEO_PROBE_FIX=1` = the OLD behavior (UA masked to look like Chrome) — the known loop-maker, kept for comparison.
// It only READS the page. The human checkbox is never clicked from here — that stays a person's job.
const { app, BrowserWindow, session } = require("electron")
const URL = "https://accounts.ucas.com/account/login"
const FIX = process.env.NEO_PROBE_FIX === "1"

app.whenReady().then(async () => {
  const s = session.fromPartition("persist:ucas-probe")
  const win = new BrowserWindow({ width: 1280, height: 900, show: false, webPreferences: { partition: "persist:ucas-probe", sandbox: true } })
  if (FIX) win.webContents.setUserAgent(win.webContents.getUserAgent().replace(/\s(?!Mozilla|AppleWebKit|Chrome|Safari)[^\s/()]+\/[^\s]+/g, ""))
  win.webContents.on("did-navigate", (_e, url) => console.log(JSON.stringify({ ev: "navigate", url: String(url).slice(0, 120) })))
  win.webContents.on("did-fail-load", (_e, code, desc, url, main) => console.log(JSON.stringify({ ev: "fail", code, desc, main, url: String(url).slice(0, 100) })))
  // A stalled first load (slow line, challenge mid-load) must not hang the probe forever — race it, then read whatever is on screen.
  await Promise.race([win.webContents.loadURL(URL).catch((error) => console.log("LOADERR " + String(error))), new Promise((r) => setTimeout(r, 30000))])
  await new Promise((r) => setTimeout(r, 12000))
  const report = await win.webContents
    .executeJavaScript(`JSON.stringify({
      title: document.title,
      url: location.href,
      body: (document.body && document.body.innerText || "").slice(0, 260).replace(/\\s+/g, " "),
      hasTurnstile: Boolean(document.querySelector('iframe[src*="challenges.cloudflare.com"], .cf-turnstile')),
      hasPasswordForm: Boolean(document.querySelector('input[type=password]')),
      uaDataBrands: (navigator.userAgentData && navigator.userAgentData.brands || []).map((b) => b.brand + ":" + b.version).join("|"),
      uaPlatform: navigator.userAgentData && navigator.userAgentData.platform || "",
      webdriver: String(navigator.webdriver),
      ua: navigator.userAgent.slice(0, 160),
    })`)
    .catch((error) => JSON.stringify({ probeError: String(error) }))
  console.log("PROBE " + report)
  app.exit(0)
})
