// "The receipts": every public asaaab TikTok as a bubble floating in a Fantastic Contraption sky.
// Height = views. Across = what you pick. Size = followers it earned. Color = when it was posted (first → latest).
// Hover/tap shows only the caption, so nosy visitors read the video, not a category.
(() => {
const host = document.getElementById("receipts"); if (!host) return;
const XS = {
  h3:  { label: "still watching at 3s", min: 0.1, max: 0.95, ticks: [.2, .4, .6, .8], fmt: v => Math.round(v * 100) + "%", get: d => d.h3 },
  fin: { label: "watched it all", min: 0, max: 0.7, ticks: [0, .2, .4, .6], fmt: v => Math.round(v * 100) + "%", get: d => d.fin },
  len: { label: "how long it is", min: 5, max: 300, log: true, ticks: [10, 30, 60, 120, 240], fmt: v => v < 60 ? v + "s" : (v / 60) + "m", get: d => d.secs },
};
const k = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n);
// first posts are cool sky blue, the latest are warm sunset pink, like a day going by
const RAMP = [[64, 160, 255], [72, 210, 160], [255, 214, 74], [255, 132, 74], [240, 70, 150]];
const ramp = t => { const s = Math.max(0, Math.min(1, t || 0)) * (RAMP.length - 1), i = Math.min(RAMP.length - 2, Math.floor(s)), f = s - i, a = RAMP[i], b = RAMP[i + 1]; return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * f)).join(",")})`; };
host.innerHTML = `
  <div class="rc-x" role="radiogroup" aria-label="Across the bottom">${Object.entries(XS).map(([key, x], i) => `<button type="button" role="radio" data-x="${key}" aria-checked="${i ? "false" : "true"}">${x.label}</button>`).join("")}</div>
  <div class="rc-plot"><svg class="rc-svg" role="img" aria-label="Every asaaab TikTok as a bubble: higher means more views"></svg><div class="rc-tip" hidden></div></div>
  <div class="rc-key"><span>first post</span><i></i><span>latest</span><b>bigger bubble = more followers</b></div>`;
const svg = host.querySelector(".rc-svg"), tip = host.querySelector(".rc-tip"), plot = host.querySelector(".rc-plot");
let data = [], xKey = "h3", pinned = null, t0 = 0, t1 = 1;
const NS = "http://www.w3.org/2000/svg", el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const key in a) e.setAttribute(key, a[key]); p && p.appendChild(e); return e; };

function cloud(g, x, y, s){ const c = el("g", { class: "rc-cloud", transform: `translate(${x} ${y}) scale(${s})` }, g);
  for (const [cx, cy, r] of [[0, 0, 22], [24, -10, 28], [52, -2, 22], [74, 6, 16], [-18, 8, 15]]) el("circle", { cx, cy: cy + 7, r, class: "rc-cloud-sh" }, c);
  for (const [cx, cy, r] of [[0, 0, 22], [24, -10, 28], [52, -2, 22], [74, 6, 16], [-18, 8, 15]]) el("circle", { cx, cy, r }, c);
  el("rect", { x: -18, y: 0, width: 92, height: 22, rx: 11 }, c); }

function draw(){
  const W = plot.clientWidth, H = Math.max(320, Math.min(540, W * 0.64)), P = { l: 50, r: 12, t: 18, b: 52 };
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.style.height = H + "px"; svg.innerHTML = "";
  const X = XS[xKey], pts = data.filter(d => X.get(d) != null && d.v > 0);
  const ymin = Math.log10(100), ymax = Math.log10(3.2e6);
  const sx = v => { const lo = X.log ? Math.log10(X.min) : X.min, hi = X.log ? Math.log10(X.max) : X.max, u = X.log ? Math.log10(Math.max(X.min, Math.min(X.max, v))) : Math.max(X.min, Math.min(X.max, v)); return P.l + (u - lo) / (hi - lo) * (W - P.l - P.r); };
  const sy = v => P.t + (1 - (Math.log10(Math.max(100, v)) - ymin) / (ymax - ymin)) * (H - P.t - P.b);
  const defs = el("defs", {}, svg);
  const sky = el("linearGradient", { id: "rcSky", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el("stop", { offset: "0", "stop-color": "#7cc4ff" }, sky); el("stop", { offset: ".7", "stop-color": "#c9e9ff" }, sky); el("stop", { offset: "1", "stop-color": "#eaf7ff" }, sky);
  el("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#rcSky)" }, svg);
  // a few clouds drifting in the back
  const cg = el("g", { class: "rc-clouds" }, svg);
  cloud(cg, W * .12, H * .16, W / 900); cloud(cg, W * .58, H * .1, W / 1100); cloud(cg, W * .84, H * .34, W / 1000); cloud(cg, W * .32, H * .5, W / 1400);
  // height markers: little flags on the left, no grid
  for (const v of [1e3, 1e4, 1e5, 1e6]) { const y = sy(v); el("line", { x1: P.l - 6, x2: W - P.r, y1: y, y2: y, class: "rc-line" }, svg); el("text", { x: P.l - 10, y: y + 4, "text-anchor": "end", class: "rc-ax" }, svg).textContent = k(v); }
  // grass with a bumpy top, and the across labels sitting on it
  const gy = H - P.b + 14; let d = `M0 ${H} L0 ${gy}`;
  for (let x = 0; x <= W; x += 28) d += ` Q${x + 14} ${gy - 8} ${x + 28} ${gy}`;
  el("path", { d: d + ` L${W} ${H}Z`, class: "rc-grass" }, svg);
  el("rect", { x: 0, y: gy + 6, width: W, height: H - gy, class: "rc-dirt" }, svg);
  for (const v of X.ticks) el("text", { x: sx(v), y: gy + 24, "text-anchor": "middle", class: "rc-ax rc-ax-g" }, svg).textContent = X.fmt(v);
  el("text", { x: W - P.r - 6, y: P.t + 4, "text-anchor": "end", class: "rc-axl" }, svg).textContent = X.label + " →";
  el("text", { x: P.l - 4, y: P.t - 4, class: "rc-axl" }, svg).textContent = "↑ views";
  // bubbles, biggest first so the small ones stay on top
  pts.sort((a, b) => (b.f || 0) - (a.f || 0));
  const g = el("g", { class: "rc-dots" }, svg);
  pts.forEach((p, i) => {
    const r = 4 + Math.min(11, Math.sqrt(p.f || 0) / 2.8), cx = sx(X.get(p)), cy = sy(p.v);
    const b = el("g", { class: "rc-b", tabindex: "0", transform: `translate(${cx} ${cy})`, style: `--d:${(i % 40) * 0.11}s`, "aria-label": p.cap || "video" }, g);
    el("circle", { r, fill: ramp((p.t - t0) / (t1 - t0 || 1)), class: "rc-orb" }, b);
    el("ellipse", { cx: -r * .32, cy: -r * .38, rx: r * .38, ry: r * .24, class: "rc-shine" }, b);
    b.__d = p;
  });
}
const esc = s => (s || "").replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
function show(d, x, y){
  tip.innerHTML = `<p>${esc(d.cap) || "…"}</p><a href="https://www.tiktok.com/@asaaab93x/video/${d.id}" target="_blank" rel="noopener">watch it</a>`;
  tip.hidden = false;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = Math.max(4, Math.min(plot.clientWidth - tw - 4, x - tw / 2)) + "px";
  tip.style.top = (y - th - 16 < 0 ? y + 16 : y - th - 16) + "px";
}
function at(e){ const t = e.target.closest(".rc-b"); if (!t) return null; const b = plot.getBoundingClientRect(), r = t.getBoundingClientRect(); return { d: t.__d, x: r.left + r.width / 2 - b.left, y: r.top - b.top, t }; }
svg.addEventListener("pointermove", e => { if (pinned || e.pointerType !== "mouse") return; const p = at(e); p ? show(p.d, p.x, p.y) : tip.hidden = true; });
svg.addEventListener("pointerleave", () => { if (!pinned) tip.hidden = true; });
svg.addEventListener("click", e => { const p = at(e); svg.querySelectorAll(".rc-b.on").forEach(n => n.classList.remove("on")); if (!p) { pinned = null; tip.hidden = true; return; } pinned = p.d; p.t.classList.add("on"); show(p.d, p.x, p.y); });
svg.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.classList.contains("rc-b")) e.target.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
host.querySelector(".rc-x").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; xKey = b.dataset.x; host.querySelectorAll(".rc-x button").forEach(n => n.setAttribute("aria-checked", n === b)); pinned = null; tip.hidden = true; draw(); });
let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(draw, 150); });
fetch((document.currentScript?.src || "/assets/receipts.js").replace(/receipts\.js.*$/, "receipts.json")).then(r => r.json()).then(j => {
  data = j.map(d => ({ ...d, secs: d.len ? +d.len.split(":")[0] * 60 + +d.len.split(":")[1] : null, t: Date.parse(d.d) || 0 }));
  const ts = data.map(d => d.t).filter(Boolean); t0 = Math.min(...ts); t1 = Math.max(...ts);
  draw();
});
})();
