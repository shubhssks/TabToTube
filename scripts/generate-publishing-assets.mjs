import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const manifest = JSON.parse(await readFile(resolve(root, "extension", "manifest.json"), "utf8"));
const displayVersion = manifest.version_name || manifest.version;
const publishingDir = resolve(root, "assets", "publishing");
const iconDir = resolve(root, "extension", "icons");
const screenshotDir = join(publishingDir, "screenshots");
const promoDir = join(publishingDir, "promotional");
const videoDir = join(publishingDir, "video");
const frameDir = join(videoDir, ".frames");

await rm(publishingDir, { force: true, recursive: true });
await rm(iconDir, { force: true, recursive: true });
await mkdir(iconDir, { recursive: true });
await mkdir(screenshotDir, { recursive: true });
await mkdir(promoDir, { recursive: true });
await mkdir(frameDir, { recursive: true });

const browser = await chromium.launch();
try {
  await generateIcons(browser);
  await generateScreenshots(browser);
  await generatePromoImages(browser);
  await generateVideoFrames(browser);
} finally {
  await browser.close();
}

await renderVideo();
await rm(frameDir, { force: true, recursive: true });

console.log("Publishing assets generated:");
console.log(`- ${relativePath(iconDir)}`);
console.log(`- ${relativePath(publishingDir)}`);

async function generateIcons(browserInstance) {
  const sizes = [16, 32, 48, 128];
  for (const size of sizes) {
    await renderHtml(browserInstance, {
      html: iconHtml(size),
      outputPath: join(iconDir, `icon${size}.png`),
      viewport: { width: size, height: size },
      omitBackground: true
    });
  }

  await renderHtml(browserInstance, {
    html: iconHtml(128),
    outputPath: join(publishingDir, "tabtotube-icon-128.png"),
    viewport: { width: 128, height: 128 },
    omitBackground: true
  });
}

async function generateScreenshots(browserInstance) {
  const screenshots = [
    {
      file: "01-start-stream.png",
      eyebrow: "Minimal setup",
      title: "Start a YouTube stream from the tab you are already using",
      body: "Paste your stream key, choose a source, and keep the local bridge running in the background.",
      status: "Idle",
      source: "Tab",
      duration: "00:00:00",
      highlight: "start"
    },
    {
      file: "02-source-selection.png",
      eyebrow: "Capture choice",
      title: "Switch between tab and screen capture",
      body: "Use tab capture for a focused browser workflow or screen capture for full desktop presentations.",
      status: "Idle",
      source: "Screen",
      duration: "00:00:00",
      highlight: "source"
    },
    {
      file: "03-companion-ready.png",
      eyebrow: "Local companion",
      title: "Confirm FFmpeg is ready before going live",
      body: "The local companion reports health and FFmpeg availability before streaming starts.",
      status: "Ready",
      source: "Tab",
      duration: "00:00:00",
      highlight: "health"
    },
    {
      file: "04-live-status.png",
      eyebrow: "Live control",
      title: "Monitor stream state and elapsed duration",
      body: "The extension keeps the stream status visible while FFmpeg pushes RTMP locally.",
      status: "Live",
      source: "Tab",
      duration: "00:12:48",
      highlight: "live"
    },
    {
      file: "05-local-architecture.png",
      eyebrow: "Privacy-first flow",
      title: "Capture locally, encode locally, stream directly",
      body: "TabToTube avoids an extra cloud relay. Browser capture goes to the companion, FFmpeg, then YouTube Live.",
      status: "Live",
      source: "Screen",
      duration: "00:28:16",
      highlight: "flow"
    }
  ];

  for (const screenshot of screenshots) {
    await renderHtml(browserInstance, {
      html: screenshotHtml(screenshot),
      outputPath: join(screenshotDir, screenshot.file),
      viewport: { width: 1280, height: 800 }
    });
  }
}

async function generatePromoImages(browserInstance) {
  await renderHtml(browserInstance, {
    html: promoHtml({ width: 440, height: 280, mode: "small" }),
    outputPath: join(promoDir, "small-promo-440x280.png"),
    viewport: { width: 440, height: 280 }
  });

  await renderHtml(browserInstance, {
    html: promoHtml({ width: 920, height: 680, mode: "large" }),
    outputPath: join(promoDir, "large-promo-920x680.png"),
    viewport: { width: 920, height: 680 }
  });

  await renderHtml(browserInstance, {
    html: promoHtml({ width: 1400, height: 560, mode: "marquee" }),
    outputPath: join(promoDir, "marquee-promo-1400x560.png"),
    viewport: { width: 1400, height: 560 }
  });
}

async function generateVideoFrames(browserInstance) {
  const slides = [
    {
      title: "Install the extension and companion",
      body: "Use the GitHub release download for the companion bundle, then load or install TabToTube.",
      step: "1",
      highlight: "download"
    },
    {
      title: "Check the local bridge",
      body: "Run the companion and confirm FFmpeg is available before you start streaming.",
      step: "2",
      highlight: "health"
    },
    {
      title: "Paste the YouTube stream key",
      body: "Choose Tab or Screen, paste the stream key, and keep Remember stream key off on shared machines.",
      step: "3",
      highlight: "popup"
    },
    {
      title: "Click Start",
      body: "TabToTube captures locally and sends WebM chunks to FFmpeg for YouTube RTMP streaming.",
      step: "4",
      highlight: "live"
    },
    {
      title: "Stop when finished",
      body: "Stop releases browser capture tracks, closes the socket, and ends the local FFmpeg process.",
      step: "5",
      highlight: "stop"
    }
  ];

  for (let index = 0; index < slides.length; index += 1) {
    const outputPath = join(frameDir, `slide-${String(index + 1).padStart(2, "0")}.png`);
    await renderHtml(browserInstance, {
      html: videoSlideHtml(slides[index]),
      outputPath,
      viewport: { width: 1280, height: 720 }
    });
  }

  await renderHtml(browserInstance, {
    html: videoSlideHtml(slides[0]),
    outputPath: join(videoDir, "tabtotube-quick-start-poster.png"),
    viewport: { width: 1280, height: 720 }
  });
}

async function renderVideo() {
  const concatFile = join(frameDir, "concat.txt");
  const slideFiles = [
    "slide-01.png",
    "slide-02.png",
    "slide-03.png",
    "slide-04.png",
    "slide-05.png"
  ];
  const concatLines = [];

  for (const slide of slideFiles) {
    concatLines.push(`file '${join(frameDir, slide).replaceAll("\\", "/")}'`);
    concatLines.push("duration 4");
  }
  concatLines.push(`file '${join(frameDir, slideFiles.at(-1)).replaceAll("\\", "/")}'`);
  await writeFile(concatFile, `${concatLines.join("\n")}\n`);

  const outputPath = join(videoDir, "tabtotube-quick-start.mp4");
  const result = spawnSync("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFile,
    "-vf",
    "fps=30,format=yuv420p",
    "-c:v",
    "libx264",
    "-movflags",
    "+faststart",
    outputPath
  ], {
    cwd: root,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "FFmpeg failed to render instructional video");
  }
}

async function renderHtml(browserInstance, { html, omitBackground = false, outputPath, viewport }) {
  const page = await browserInstance.newPage({
    deviceScaleFactor: 1,
    viewport
  });

  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({
    omitBackground,
    path: outputPath
  });
  await page.close();
}

function iconHtml(size) {
  return `
    <!doctype html>
    <html>
      <head>
        <style>
          html, body {
            width: ${size}px;
            height: ${size}px;
            margin: 0;
            background: transparent;
          }
          svg {
            display: block;
            width: ${size}px;
            height: ${size}px;
          }
        </style>
      </head>
      <body>
        ${iconSvg()}
      </body>
    </html>
  `;
}

function iconSvg() {
  return `
    <svg viewBox="0 0 128 128" role="img" aria-label="TabToTube icon" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="panel" x1="20" y1="16" x2="104" y2="112" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1F6FEB"/>
          <stop offset="0.58" stop-color="#1552C5"/>
          <stop offset="1" stop-color="#102A56"/>
        </linearGradient>
        <linearGradient id="play" x1="50" y1="47" x2="88" y2="84" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF4D4D"/>
          <stop offset="1" stop-color="#D71920"/>
        </linearGradient>
        <filter id="shadow" x="4" y="4" width="120" height="120" color-interpolation-filters="sRGB">
          <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#102A56" flood-opacity="0.22"/>
        </filter>
      </defs>
      <rect x="16" y="16" width="96" height="96" rx="24" fill="url(#panel)" filter="url(#shadow)"/>
      <path d="M31 45.5C31 39.7 35.7 35 41.5 35h45C92.3 35 97 39.7 97 45.5v37C97 88.3 92.3 93 86.5 93h-45C35.7 93 31 88.3 31 82.5v-37Z" fill="#F8FAFC"/>
      <path d="M31 46C31 39.9 35.9 35 42 35h44c6.1 0 11 4.9 11 11v8H31v-8Z" fill="#D9E6FF"/>
      <path d="M45 43h23" stroke="#1F6FEB" stroke-width="5" stroke-linecap="round"/>
      <circle cx="83" cy="43" r="4" fill="#1F6FEB"/>
      <rect x="43" y="57" width="42" height="30" rx="9" fill="url(#play)"/>
      <path d="M60 65.5v13l13-6.5-13-6.5Z" fill="#FFFFFF"/>
      <path d="M90 64c5.7 3.6 9 8.7 9 14s-3.3 10.4-9 14" fill="none" stroke="#5EEAD4" stroke-width="5" stroke-linecap="round"/>
      <path d="M96 55c8 5.9 12.5 14 12.5 23S104 95.1 96 101" fill="none" stroke="#5EEAD4" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
    </svg>
  `;
}

function screenshotHtml(data) {
  return baseHtml(`
    <main class="store-shot">
      <section class="copy">
        <div class="eyebrow">${data.eyebrow}</div>
        <h1>${data.title}</h1>
        <p>${data.body}</p>
        ${flowStrip(data.highlight)}
      </section>
      <section class="workspace">
        ${browserFrame(data)}
        ${data.highlight === "health" ? healthPanel() : ""}
        ${data.highlight === "flow" ? architecturePanel() : ""}
      </section>
    </main>
  `, screenshotCss());
}

function promoHtml({ height, mode, width }) {
  const isMarquee = mode === "marquee";
  return baseHtml(`
    <main class="promo ${mode}" style="width:${width}px;height:${height}px">
      <div class="promo-bg"></div>
      <div class="promo-icon">${iconSvg()}</div>
      <div class="promo-lines">
        <span></span><span></span><span></span>
      </div>
      ${isMarquee ? "<div class=\"promo-wordmark\">TabToTube</div>" : ""}
      <div class="promo-flow">
        <b>Tab</b><i></i><b>FFmpeg</b><i></i><b>Live</b>
      </div>
    </main>
  `, promoCss());
}

function videoSlideHtml(data) {
  return baseHtml(`
    <main class="video-slide">
      <section class="video-copy">
        <div class="step">Step ${data.step}</div>
        <h1>${data.title}</h1>
        <p>${data.body}</p>
      </section>
      <section class="video-visual">
        ${videoVisual(data.highlight)}
      </section>
    </main>
  `, `${screenshotCss()}${videoCss()}`);
}

function browserFrame(data) {
  return `
    <div class="browser">
      <div class="browser-top">
        <span></span><span></span><span></span>
        <div class="address">studio.youtube.com / Live Control Room</div>
      </div>
      <div class="browser-body">
        <div class="live-card">
          <div>
            <strong>Live preview</strong>
            <small>${data.source} capture ready</small>
          </div>
          <div class="preview-grid">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
        ${popupPanel(data)}
      </div>
    </div>
  `;
}

function popupPanel(data) {
  const isLive = data.status === "Live";
  return `
    <aside class="popup">
      <header>
        <div>
          <h2>TabToTube</h2>
          <p>${data.status}</p>
        </div>
        <span class="dot ${isLive ? "live" : data.status === "Ready" ? "ready" : ""}"></span>
      </header>
      <div class="segmented">
        <b class="${data.source === "Tab" ? "active" : ""}">Tab</b>
        <b class="${data.source === "Screen" ? "active" : ""}">Screen</b>
      </div>
      <label>Stream key <em>••••-••••-••••</em></label>
      <label class="check"><span></span> Remember stream key</label>
      <label>Companion URL <em>ws://127.0.0.1:43310/stream</em></label>
      <label>Video bitrate <em>2.5 Mbps</em></label>
      <div class="metric"><span>Duration</span><strong>${data.duration}</strong></div>
      <div class="buttons">
        <button class="${isLive ? "" : "primary"}">${isLive ? "Start" : "Start"}</button>
        <button class="${isLive ? "danger" : ""}">Stop</button>
      </div>
    </aside>
  `;
}

function healthPanel() {
  return `
    <div class="health">
      <div class="terminal-title">Companion health</div>
      <code>{
  "ok": true,
  "ffmpeg": {
    "available": true,
    "path": "ffmpeg",
    "version": "ffmpeg version 8.1"
  }
}</code>
    </div>
  `;
}

function architecturePanel() {
  return `
    <div class="architecture">
      <div>Extension</div><span></span><div>Companion</div><span></span><div>FFmpeg</div><span></span><div>YouTube Live</div>
    </div>
  `;
}

function flowStrip(highlight) {
  const active = {
    start: 0,
    source: 0,
    health: 1,
    live: 2,
    flow: 2
  }[highlight] ?? 0;
  return `
    <div class="flow-strip">
      ${["Capture", "Local bridge", "RTMP Live"].map((item, index) => `<span class="${index === active ? "active" : ""}">${item}</span>`).join("")}
    </div>
  `;
}

function videoVisual(highlight) {
  if (highlight === "download") {
    return `
      <div class="download-card">
        ${iconSvg()}
        <h2>GitHub Releases</h2>
        <p>TabToTube-Companion-Node-Bundle-v${displayVersion}.zip</p>
        <button>Download</button>
      </div>
    `;
  }

  if (highlight === "health") {
    return healthPanel();
  }

  if (highlight === "live") {
    return popupPanel({ status: "Live", source: "Tab", duration: "00:01:24" });
  }

  if (highlight === "stop") {
    return popupPanel({ status: "Idle", source: "Screen", duration: "00:00:00" });
  }

  return popupPanel({ status: "Idle", source: "Tab", duration: "00:00:00" });
}

function baseHtml(body, css) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <style>${css}</style>
      </head>
      <body>${body}</body>
    </html>
  `;
}

function screenshotCss() {
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; font-family: Inter, Arial, sans-serif; background: #F6F7F9; color: #172033; }
    .store-shot { width: 1280px; height: 800px; display: grid; grid-template-columns: 430px 1fr; gap: 40px; padding: 60px; background: linear-gradient(135deg, #F8FAFC 0%, #EDF4FF 54%, #ECFDF5 100%); }
    .copy { display: flex; flex-direction: column; justify-content: center; }
    .eyebrow { color: #0A8F5A; font-weight: 800; font-size: 17px; margin-bottom: 18px; }
    h1 { font-size: 45px; line-height: 1.05; letter-spacing: 0; margin: 0 0 22px; color: #121826; }
    p { font-size: 20px; line-height: 1.45; color: #4A5567; margin: 0; }
    .flow-strip { display: flex; gap: 10px; margin-top: 34px; }
    .flow-strip span { padding: 10px 13px; border-radius: 7px; background: #FFFFFF; color: #4A5567; font-size: 13px; font-weight: 800; border: 1px solid #D7DCE4; }
    .flow-strip .active { background: #1F6FEB; color: #FFFFFF; border-color: #1F6FEB; }
    .workspace { position: relative; display: flex; align-items: center; justify-content: center; }
    .browser { width: 730px; height: 570px; background: #FFFFFF; border: 1px solid #D7DCE4; border-radius: 8px; box-shadow: 0 24px 70px rgba(31, 49, 79, .18); overflow: hidden; }
    .browser-top { height: 48px; display: flex; align-items: center; gap: 8px; padding: 0 16px; border-bottom: 1px solid #E1E6EF; background: #F8FAFC; }
    .browser-top span { width: 11px; height: 11px; border-radius: 999px; background: #CBD5E1; }
    .browser-top span:nth-child(1) { background: #F87171; }
    .browser-top span:nth-child(2) { background: #FBBF24; }
    .browser-top span:nth-child(3) { background: #34D399; }
    .address { margin-left: 12px; background: #FFFFFF; border: 1px solid #E1E6EF; border-radius: 6px; color: #64748B; padding: 8px 12px; font-size: 13px; width: 420px; }
    .browser-body { height: calc(100% - 48px); padding: 24px; display: grid; grid-template-columns: 1fr 304px; gap: 24px; background: #F8FAFC; }
    .live-card { min-width: 0; padding: 20px; border-radius: 8px; border: 1px solid #D7DCE4; background: #FFFFFF; }
    .live-card strong { display: block; font-size: 20px; margin-bottom: 4px; }
    .live-card small { color: #64748B; }
    .preview-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .preview-grid span { height: 122px; border-radius: 7px; background: linear-gradient(135deg, #DCEBFF, #CFFAFE); border: 1px solid #C5D6EF; }
    .preview-grid span:nth-child(2) { background: linear-gradient(135deg, #FEE2E2, #FFE4B5); }
    .preview-grid span:nth-child(3) { background: linear-gradient(135deg, #DBEAFE, #E0E7FF); }
    .preview-grid span:nth-child(4) { background: linear-gradient(135deg, #DCFCE7, #CCFBF1); }
    .popup { width: 304px; padding: 16px; border-radius: 8px; border: 1px solid #D7DCE4; background: #FFFFFF; box-shadow: 0 14px 34px rgba(31, 49, 79, .12); }
    .popup header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .popup h2 { font-size: 19px; margin: 0; }
    .popup header p { font-size: 13px; margin: 3px 0 0; color: #64748B; }
    .dot { width: 13px; height: 13px; border-radius: 999px; background: #94A3B8; box-shadow: 0 0 0 4px rgba(148,163,184,.16); }
    .dot.ready { background: #D18900; }
    .dot.live { background: #0A8F5A; box-shadow: 0 0 0 4px rgba(10,143,90,.16); }
    .segmented { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 4px; border-radius: 8px; border: 1px solid #D7DCE4; margin-bottom: 12px; }
    .segmented b { text-align: center; padding: 8px; border-radius: 6px; color: #64748B; font-size: 13px; }
    .segmented .active { background: #1F6FEB; color: #FFFFFF; }
    label { display: block; color: #202A3A; font-size: 13px; font-weight: 800; margin: 10px 0; }
    label em { display: block; margin-top: 5px; padding: 9px; border: 1px solid #D7DCE4; border-radius: 7px; color: #172033; font-style: normal; font-weight: 600; background: #F8FAFC; }
    .check { display: flex; align-items: center; gap: 8px; color: #4A5567; }
    .check span { width: 15px; height: 15px; border-radius: 4px; border: 1px solid #AAB4C3; }
    .metric { display: flex; justify-content: space-between; padding: 10px; border-radius: 7px; border: 1px solid #D7DCE4; color: #64748B; font-size: 13px; }
    .metric strong { color: #172033; }
    .buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 12px; }
    button { height: 36px; border-radius: 7px; border: 1px solid #C8D0DC; background: #FFFFFF; font-weight: 800; color: #64748B; }
    button.primary { background: #1F6FEB; color: #FFFFFF; border-color: #1F6FEB; }
    button.danger { background: #D71920; color: #FFFFFF; border-color: #D71920; }
    .health { position: absolute; right: 42px; bottom: 12px; width: 420px; padding: 16px; border-radius: 8px; background: #111827; color: #D1FAE5; box-shadow: 0 18px 44px rgba(15,23,42,.28); }
    .terminal-title { font-weight: 800; color: #FFFFFF; margin-bottom: 10px; }
    code { white-space: pre-wrap; font-family: Consolas, monospace; font-size: 13px; line-height: 1.35; }
    .architecture { position: absolute; left: 16px; bottom: 26px; display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 8px; background: rgba(255,255,255,.94); border: 1px solid #D7DCE4; }
    .architecture div { padding: 10px 12px; border-radius: 7px; background: #EDF4FF; color: #1F3A66; font-weight: 800; font-size: 13px; }
    .architecture span { width: 34px; height: 3px; border-radius: 999px; background: #1F6FEB; }
  `;
}

function promoCss() {
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; background: #F8FAFC; font-family: Inter, Arial, sans-serif; }
    .promo { position: relative; overflow: hidden; background: linear-gradient(135deg, #F8FAFC, #EAF4FF 54%, #EAFBF5); }
    .promo-bg { position: absolute; inset: 0; background-image: radial-gradient(circle at 18% 20%, rgba(31,111,235,.18), transparent 30%), radial-gradient(circle at 82% 70%, rgba(10,143,90,.14), transparent 35%); }
    .promo-icon { position: absolute; left: 8%; top: 50%; width: 34%; aspect-ratio: 1; transform: translateY(-50%); }
    .promo-icon svg { width: 100%; height: 100%; }
    .promo-wordmark { position: absolute; left: 43%; top: 24%; color: #121826; font-size: 72px; font-weight: 900; letter-spacing: 0; }
    .promo-lines { position: absolute; left: 48%; right: 9%; top: 40%; display: grid; gap: 15px; }
    .promo-lines span { display: block; height: 16px; border-radius: 999px; background: rgba(31,111,235,.18); }
    .promo-lines span:nth-child(2) { width: 78%; background: rgba(10,143,90,.18); }
    .promo-lines span:nth-child(3) { width: 56%; background: rgba(215,25,32,.14); }
    .promo-flow { position: absolute; left: 43%; right: 8%; bottom: 18%; display: flex; align-items: center; gap: 12px; }
    .promo-flow b { padding: 10px 13px; border-radius: 7px; background: #FFFFFF; border: 1px solid #D7DCE4; color: #1F3A66; font-size: 13px; }
    .promo-flow i { flex: 1; height: 3px; border-radius: 999px; background: #1F6FEB; }
    .small .promo-icon { left: 10%; width: 42%; }
    .small .promo-lines { left: 57%; right: 10%; top: 30%; }
    .small .promo-flow { left: 52%; right: 7%; bottom: 22%; gap: 6px; }
    .small .promo-flow b { font-size: 10px; padding: 7px 8px; }
    .large .promo-icon { width: 37%; left: 8%; }
    .large .promo-lines { top: 31%; }
    .large .promo-flow { bottom: 25%; }
  `;
}

function videoCss() {
  return `
    .video-slide { width: 1280px; height: 720px; display: grid; grid-template-columns: 470px 1fr; gap: 56px; padding: 58px 70px; background: linear-gradient(135deg, #F8FAFC, #EDF4FF 58%, #ECFDF5); }
    .video-copy { display: flex; flex-direction: column; justify-content: center; }
    .video-copy .step { width: fit-content; color: #FFFFFF; background: #1F6FEB; border-radius: 7px; padding: 9px 12px; font-weight: 900; margin-bottom: 22px; }
    .video-copy h1 { font-size: 50px; margin: 0 0 20px; }
    .video-copy p { font-size: 22px; }
    .video-visual { display: flex; align-items: center; justify-content: center; }
    .video-visual .popup { transform: scale(1.18); }
    .video-visual .health { position: static; width: 560px; transform: scale(1.1); }
    .download-card { width: 520px; padding: 34px; border-radius: 8px; background: #FFFFFF; border: 1px solid #D7DCE4; box-shadow: 0 24px 70px rgba(31, 49, 79, .18); text-align: center; }
    .download-card svg { width: 150px; height: 150px; }
    .download-card h2 { margin: 20px 0 10px; font-size: 32px; }
    .download-card p { font-size: 17px; color: #64748B; }
    .download-card button { margin-top: 18px; padding: 0 28px; height: 44px; background: #1F6FEB; color: #FFFFFF; border-color: #1F6FEB; }
  `;
}

function relativePath(pathValue) {
  return pathValue.replace(root, ".").replaceAll("\\", "/");
}
