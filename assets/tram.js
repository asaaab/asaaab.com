// Tram line indicator + illustrated world. Runs after the drive script, so it can use its STOPS, goTo, prog, stopAutopilot.
(() => {
const { goTo, prog, stopAutopilot, track } = window.__drive || {};
/* ---------- the line: same stops as the drive, in order ---------- */
const LINE = [
  { name: "Carspotting!!",  f: 0.00, dots: [] },
  { name: "connections to", f: 0.22, dots: ["#e1261c", "#16191c", "#1185fe"], xfer: true, board: true },
  { name: "Angelish Crest", f: 0.52, dots: ["#0b8a3e"], xfer: true },
  { name: "asaaab hangar",  f: 0.74, dots: ["#5865f2"], xfer: true },
  { name: "asaaab.shop",    f: 0.885, dots: ["#f7d117"], soon: true },
  { name: "boarding pass",  f: 1.00, dots: [] },
];
const tram = document.getElementById("tram");
tram.innerHTML = `<div class="head"><span class="plate" aria-label="Flight path"><i></i>FLIGHT PATH<i></i></span><span class="now">NOW AT <b id="tramNow">Carspotting!!</b></span></div>
  <div class="rail" id="rail"><div class="bar"></div><div class="done" id="tramDone"></div></div>`;
const rail = document.getElementById("rail");
const xs = LINE.map((_, i) => 3 + i * (84 / (LINE.length - 1)));  // even spacing, % of rail
const stops = LINE.map((s, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "stop" + (s.xfer ? " xfer" : "") + (s.soon ? " soon" : "");
  b.style.left = xs[i] + "%";
  b.setAttribute("aria-label", `Go to ${s.name}${s.soon ? " (coming soon)" : ""}`);
  b.innerHTML = `<span class="dot"></span><span class="lbl">${s.name}${s.dots.length ? `<i>${s.dots.map(c => `<span style="background:${c}"></span>`).join("")}</i>` : ""}</span>`;
  b.addEventListener("click", e => { if (s.board) { e.stopPropagation(); openBoard(b); } try { stopAutopilot(); } catch (e) {} goTo(s.f); try { track("tram-" + s.name.toLowerCase().replace(/\W+/g, "-")); } catch (e) {} });
  // taps here shouldn't count as the "first tap" that starts music
  ["pointerdown", "touchend"].forEach(ev => b.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
  rail.appendChild(b); return b;
});
rail.querySelector(".bar").style.right = (100 - xs[xs.length - 1] - 1.2) + "%";
const board = document.createElement("div"); board.className = "board"; board.setAttribute("role", "menu");
board.innerHTML = `<div class="bt">TRANSFER TO</div>
  <a href="https://www.youtube.com/@asaaab93x" target="_blank" rel="noopener"><span style="background:#e1261c">▶</span>YouTube</a>
  <a href="https://www.tiktok.com/@asaaab93x" target="_blank" rel="noopener"><span style="background:#16191c">♪</span>TikTok</a>
  <a href="https://bsky.app/profile/9-3x.bsky.social" target="_blank" rel="noopener"><span style="background:#1185fe">🦋</span>Bluesky</a>`;
tram.appendChild(board);
function openBoard(btn){ const r = btn.getBoundingClientRect(), tr = tram.getBoundingClientRect();
  board.style.left = Math.max(8, Math.min(tr.width - 190, r.left - tr.left - 20)) + "px"; board.classList.add("on"); }
document.addEventListener("click", e => { if (!board.contains(e.target)) board.classList.remove("on"); });
["pointerdown", "touchend"].forEach(ev => board.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
const car = document.createElement("div"); car.className = "car";
car.innerHTML = '<svg viewBox="0 0 34 20" width="34" height="20"><rect x="1" y="3" width="30" height="14" rx="5" fill="#ff4d3d" stroke="#16191c" stroke-width="2"/><rect x="18" y="5" width="7" height="10" rx="2" fill="#7fc4ff" stroke="#16191c" stroke-width="1"/><rect x="6" y="5" width="9" height="10" rx="2" fill="#7fc4ff" stroke="#16191c" stroke-width="1"/><path d="M31 8 L34 10 L31 12Z" fill="#ffd23f"/></svg>';
rail.appendChild(car);

const xAt = p => { for (let i = 0; i < LINE.length - 1; i++) { const a = LINE[i], b = LINE[i + 1];
  if (p <= b.f) return xs[i] + (xs[i + 1] - xs[i]) * ((p - a.f) / (b.f - a.f || 1)); } return xs[xs.length - 1]; };
let lastHere = -1;
function tick(){
  let p = 0; try { p = prog(); } catch (e) {}
  const x = xAt(p);
  car.style.left = x + "%"; document.getElementById("tramDone").style.width = x + "%";
  let here = 0; LINE.forEach((s, i) => { if (p >= s.f - 0.02) here = i; });
  if (here !== lastHere){ lastHere = here; stops.forEach((b, i) => b.classList.toggle("here", i === here)); document.getElementById("tramNow").textContent = LINE[here].name; }
  // gentle parallax on the world
  const t = scrollY;
  for (const [el, k] of par) el.setAttribute("transform", `translate(${(-t * k).toFixed(1)} 0)`);
  requestAnimationFrame(tick);
}

/* ---------- the world: dense, layered, flat-illustrated ---------- */
const NS = "http://www.w3.org/2000/svg";
const sc = document.getElementById("scene");
const svg = document.createElementNS(NS, "svg");
svg.setAttribute("viewBox", "0 0 1600 1000"); svg.setAttribute("preserveAspectRatio", "xMidYMax slice");
sc.appendChild(svg);
const el = (t, a, p = svg) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); p.appendChild(n); return n; };
let seed = 93; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const par = [];
const layer = k => { const g = el("g", { class: "layer" }); par.push([g, k]); return g; };
const ridge = (y, amp, step, g, fill) => { let d = `M-200 1000 L-200 ${y}`; for (let x = -200; x <= 1800; x += step) d += ` Q${x + step / 2} ${y - amp * (0.4 + r())} ${x + step} ${y + (r() - .5) * amp * .5}`; d += " L1800 1000 Z"; el("path", { d, fill }, g); };

// sun + clouds
el("circle", { cx: 1270, cy: 150, r: 70, fill: "#fff1b8" });
el("circle", { cx: 1270, cy: 150, r: 48, fill: "#ffe27a" });
for (let i = 0; i < 7; i++){ const g = el("g", { class: "cloud", style: `animation-duration:${90 + r() * 120}s; animation-delay:-${r() * 200}s` });
  const x = 0, y = 60 + r() * 230, s = .6 + r() * .9;
  el("path", { d: `M${x} ${y} a${22 * s} ${22 * s} 0 0 1 ${40 * s} -${16 * s} a${30 * s} ${30 * s} 0 0 1 ${54 * s} ${4 * s} a${20 * s} ${20 * s} 0 0 1 ${18 * s} ${34 * s} h-${112 * s}z`, fill: "#fff", opacity: .95 }, g); }

// far mountains (San Gabriels, lavender) with snow
const far = layer(.02); ridge(470, 170, 160, far, "#c9c3ea");
for (let i = 0; i < 9; i++){ const x = -100 + i * 210 + r() * 60, y = 330 + r() * 70; el("path", { d: `M${x} ${y} l26 34 l-12 -4 l-14 10 l-14 -10 l-12 4z`, fill: "#fff", opacity: .85 }, far); }
// mid hills
const mid = layer(.05); ridge(560, 110, 120, mid, "#a6dcc0");
// near hills
const near = layer(.09); ridge(640, 80, 90, near, "#8fd19e");
// valley floor
el("rect", { x: -200, y: 700, width: 2000, height: 300, fill: "#cfe8a8" }, near);
el("path", { d: "M-200 690 C200 660 500 720 800 690 S1400 660 1800 700 L1800 1000 L-200 1000Z", fill: "#cfe8a8" }, near);

// river with bridges
const river = "M-200 860 C100 820 260 900 520 850 S900 780 1120 840 S1500 900 1800 820";
el("path", { d: river, fill: "none", stroke: "#7fd0ef", "stroke-width": 26, "stroke-linecap": "round" }, near);
el("path", { d: river, fill: "none", stroke: "#b8ecff", "stroke-width": 6, "stroke-dasharray": "18 26", opacity: .8 }, near);
for (const x of [330, 760, 1300]){ const g = el("g", { transform: `translate(${x} 0)` }, near);
  el("path", { d: "M-40 0 Q0 -26 40 0", fill: "none", stroke: "#f2a1c4", "stroke-width": 5 }, g).setAttribute("transform", `translate(0 ${843 + (x === 760 ? -30 : 0)})`); }

// freeway with cars
const fwy = "M-200 760 C200 740 500 790 820 760 S1400 730 1800 770";
el("path", { d: fwy, fill: "none", stroke: "#c9ccd0", "stroke-width": 18 }, near);
el("path", { d: fwy, fill: "none", stroke: "#fff", "stroke-width": 1.5, "stroke-dasharray": "10 12" }, near);
const fp = el("path", { d: fwy, fill: "none", stroke: "none", id: "fwy" }, near);
const carCols = ["#e1261c", "#2f7fe0", "#f7d117", "#fff", "#3f9a2f", "#7a4bd1", "#16191c", "#f39c4a"];
for (let i = 0; i < 14; i++){ const c = el("rect", { x: -7, y: -4, width: 14, height: 8, rx: 2.5, fill: carCols[i % carCols.length], stroke: "#16191c", "stroke-width": 1 }, near);
  const m = el("animateMotion", { dur: `${22 + r() * 18}s`, repeatCount: "indefinite", rotate: "auto", begin: `-${r() * 40}s` }, c);
  if (i % 2) { m.setAttribute("keyPoints", "1;0"); m.setAttribute("keyTimes", "0;1"); m.setAttribute("calcMode", "linear"); }
  el("mpath", { href: "#fwy" }, m); }

// the rail line + a little tram
const rl = "M-200 905 C300 880 600 930 900 900 S1400 870 1800 910";
el("path", { d: rl, fill: "none", stroke: "#8a6e5a", "stroke-width": 6 }, near);
el("path", { d: rl, fill: "none", stroke: "#5a463a", "stroke-width": 10, "stroke-dasharray": "2 10", opacity: .6 }, near);
el("path", { d: rl, fill: "none", stroke: "none", id: "rl" }, near);
{ const t = el("g", {}, near);
  for (let k = 0; k < 3; k++){ el("rect", { x: -60 + k * 40, y: -12, width: 36, height: 16, rx: 4, fill: "#e1261c", stroke: "#16191c", "stroke-width": 1.5 }, t);
    el("rect", { x: -54 + k * 40, y: -8, width: 24, height: 6, rx: 1.5, fill: "#ffe9a8" }, t); }
  const m = el("animateMotion", { dur: "48s", repeatCount: "indefinite", rotate: "auto" }, t); el("mpath", { href: "#rl" }, m); }

// towns: little houses with colored roofs, clustered
const roofs = ["#e1261c", "#f39c4a", "#7a4bd1", "#2f7fe0", "#d930c9", "#3f9a2f"];
const town = (cx, cy, n, g) => { for (let i = 0; i < n; i++){ const x = cx + (r() - .5) * 160, y = cy + (r() - .5) * 50, w = 9 + r() * 8;
  el("rect", { x, y, width: w, height: w * .8, fill: "#fff8ee", stroke: "#7a6a5e", "stroke-width": .8 }, g);
  el("path", { d: `M${x - 2} ${y} L${x + w / 2} ${y - w * .55} L${x + w + 2} ${y}Z`, fill: roofs[(i + Math.floor(cx)) % roofs.length] }, g); } };
town(160, 800, 26, near); town(620, 820, 34, near); town(1080, 800, 28, near); town(1450, 790, 22, near);
// palm trees along the freeway, dense pine/oak scatter on the hills
const palm = (x, y, g) => { el("path", { d: `M${x} ${y} q2 -18 0 -34`, stroke: "#8a6e5a", "stroke-width": 2.5, fill: "none" }, g);
  for (let a = 0; a < 6; a++) el("path", { d: `M${x} ${y - 34} q${Math.cos(a) * 10} -6 ${Math.cos(a) * 16} ${4 + Math.sin(a) * 4}`, stroke: "#3f9a2f", "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, g); };
for (let x = -150; x < 1750; x += 70 + r() * 50) palm(x, 752 + (r() - .5) * 10, near);
const tree = (x, y, s, g, col) => { if (r() > .45) el("path", { d: `M${x} ${y - 14 * s} l${6 * s} ${12 * s} h-${12 * s}z`, fill: col }, g); else el("circle", { cx: x, cy: y - 6 * s, r: 6 * s, fill: col }, g); };
for (let i = 0; i < 380; i++) tree(-200 + r() * 2000, 560 + r() * 110, .7 + r() * .6, near, ["#5fb36e", "#4aa35d", "#79c27f", "#e3a34a"][Math.floor(r() * 4)]);
for (let i = 0; i < 220; i++) tree(-200 + r() * 2000, 490 + r() * 90, .5 + r() * .4, mid, ["#7cc69a", "#6ab88c"][Math.floor(r() * 2)]);
// a couple of tiny planes heading for LAX
for (let i = 0; i < 2; i++){ const g = el("g", { class: "cloud", style: `animation-duration:${60 + r() * 40}s; animation-delay:-${r() * 60}s` });
  el("path", { d: `M0 ${120 + i * 90} l26 0 l6 -6 l4 0 l-3 6 l10 0 l-2 4 l-41 0z`, fill: "#fff", stroke: "#9aa6b2", "stroke-width": 1 }, g); }

requestAnimationFrame(tick);
})();
