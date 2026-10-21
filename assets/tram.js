// Tram line indicator + illustrated world. Runs after the drive script, so it can use its STOPS, goTo, prog, stopAutopilot.
(() => {
const { goTo, prog, stopAutopilot, track } = window.__drive || {};
/* ---------- the line: same stops as the drive, in order ---------- */
const LINE = [
  { name: "Carspotting!!",  f: 0.00, dots: [] },
  { name: "connections to", f: 0.22, dots: ["#e1261c"], xfer: true, href: "https://www.youtube.com/@asaaab93x", ext: true },
  { name: "Angelish Crest", f: 0.52, dots: ["#0b8a3e"], xfer: true, href: "/beamng/" },
  { name: "asaaab hangar",  f: 0.74, dots: ["#5865f2"], xfer: true },
  { name: "asaaab.shop",    f: 0.885, dots: ["#f7d117"], soon: true },
  { name: "boarding pass",  f: 1.00, dots: [] },
];
const tram = document.getElementById("tram");
/* Fantastic Contraption cloud behind the line: overlapping circles + a pill body, flat shade underneath */
function drawCloud(){
  const W = tram.offsetWidth + 28, H = tram.offsetHeight + 12;
  if (W < 40) return;
  const R = Math.min(H * 0.36, 72), top = [], bot = [];
  const n = Math.max(4, Math.round(W / (R * 1.45)));
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? .5 : i / (n - 1), wob = [0, .12, -.06, .09, -.1, .05][i % 6];
    const r = R * (0.82 + 0.22 * Math.abs(Math.sin(i * 2.3))) * (i === 0 || i === n - 1 ? .78 : 1);
    top.push([R * .7 + t * (W - R * 1.4), Math.max(r + 2, H * (0.42 + wob)), r]);
  }
  const m = Math.max(3, Math.round(W / (R * 2.2)));
  for (let i = 0; i < m; i++) { const t = (i + .5) / m; const r = H * .2; bot.push([t * W, H - r - 8, r]); }
  const body = `<rect x="${R * .3}" y="${H * .42}" width="${W - R * .6}" height="${H * .5}" rx="${H * .25}"/>`;
  let k = 0; const circ = a => a.map(([x, y, r]) => `<circle style="animation-delay:-${((k++ * 0.73) % 4).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`).join("");
  const shape = body + circ(top) + circ(bot); k = 0; const shape2 = body + circ(top) + circ(bot);
  let svg = tram.querySelector(".fcloud");
  if (!svg) { svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "fcloud"); svg.setAttribute("aria-hidden", "true"); tram.prepend(svg); }
  svg.style.width = W + "px"; svg.style.height = (H + 8) + "px"; svg.setAttribute("viewBox", `0 0 ${W} ${H + 8}`);
  svg.innerHTML = `<g class="sh" fill="#a9d0ff" transform="translate(0 7)">${shape2}</g><g fill="#eaf5ff">${shape}</g>`;
}
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
  b.addEventListener("click", e => { if (s.href) { e.stopPropagation(); try { track("tram-" + s.name.toLowerCase().replace(/\W+/g, "-")); } catch (e) {} if (s.ext) window.open(s.href, "_blank", "noopener"); else location.href = s.href; return; } if (s.board) { e.stopPropagation(); openBoard(b); } try { stopAutopilot(); } catch (e) {} goTo(s.f); try { track("tram-" + s.name.toLowerCase().replace(/\W+/g, "-")); } catch (e) {} });
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
car.innerHTML = '<svg viewBox="0 0 26 26" width="26" height="26"><circle cx="13" cy="13" r="12" fill="#1fbf5a" stroke="#fff" stroke-width="2.5"/><path d="M8 8.5 L20 13 L8 17.5 L10.5 13Z" fill="#fff"/></svg>';
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
  requestAnimationFrame(tick);
}

/* ---------- the world: glossy frutiger-aero countryside with freeways ---------- */
const sc = document.getElementById("scene");
const bg = document.createElement("canvas"), fg = document.createElement("canvas"); sc.append(bg, fg);
const g = bg.getContext("2d"), f = fg.getContext("2d");
let W = 0, H = 0, SEED = 93; const R = () => (SEED = (SEED * 16807) % 2147483647) / 2147483647;
const rr = (a, b) => a + R() * (b - a), pick = a => a[Math.floor(R() * a.length)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
let ROADS = [], RAIL = null, LAKES = [], TURB = [], VEH = [], TRAINS = [], BOATS = [], CLOUDS = [], PLANES = [];
const NG = {}; const hsh = (x, y) => { const k = x * 7919 + y; if (!(k in NG)) { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); NG[k] = ((h ^ (h >>> 16)) >>> 0) / 4294967295; } return NG[k]; };
const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = v => v * v * (3 - 2 * v);
  const a = hsh(xi, yi), b = hsh(xi + 1, yi), c = hsh(xi, yi + 1), d = hsh(xi + 1, yi + 1); return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf); };

function path(fn, n = 500){ const p = []; let L = 0; for (let k = 0; k <= n; k++){ const [x, y] = fn(k / n); if (k) L += Math.hypot(x - p[k - 1].x, y - p[k - 1].y); p.push({ x, y, d: L }); } p.L = L; return p; }
function at(p, d){ d = ((d % p.L) + p.L) % p.L; let lo = 0, hi = p.length - 1; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (p[m].d < d) lo = m; else hi = m; }
  const a = p[lo], b = p[hi], t = (d - a.d) / ((b.d - a.d) || 1); return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ang: Math.atan2(b.y - a.y, b.x - a.x) }; }
function offset(p, o){ return p.map((q, k) => { const a = p[Math.max(0, k - 1)], b = p[Math.min(p.length - 1, k + 1)], ang = Math.atan2(b.y - a.y, b.x - a.x); return { x: q.x - Math.sin(ang) * o, y: q.y + Math.cos(ang) * o }; }); }
function stroke(c, p, w, col, dash){ c.beginPath(); c.moveTo(p[0].x, p[0].y); for (const q of p) c.lineTo(q.x, q.y); c.lineWidth = w; c.strokeStyle = col; c.lineCap = "round"; c.lineJoin = "round"; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]); }
function nearRoad(x, y, m){ for (const p of [...ROADS, RAIL]) for (let k = 0; k < p.length; k += 3) if (Math.abs(p[k].x - x) < m && Math.abs(p[k].y - y) < m) return true; return false; }
function inLake(x, y, m){ for (const l of LAKES) if (((x - l.x) / (l.rx + m)) ** 2 + ((y - l.y) / (l.ry + m)) ** 2 < 1.15) return true; return false; }
function blob(c, l, s){ c.beginPath(); for (let a = 0; a <= 6.3; a += .1){ const r = s * (1 + .13 * Math.sin(3 * a + l.s) + .07 * Math.sin(5 * a + l.s * 2)); const x = l.x + Math.cos(a) * l.rx * r, y = l.y + Math.sin(a) * l.ry * r; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); }

/* glossy props */
function shadow(c, x, y, rx, ry){ c.fillStyle = "rgba(20,70,40,.18)"; c.beginPath(); c.ellipse(x + rx * .25, y + ry * .2, rx, ry, 0, 0, 7); c.fill(); }
function ballTree(c, x, y, s, hi, lo){ shadow(c, x, y, 9 * s, 4 * s); c.fillStyle = "#8a6a4e"; c.fillRect(x - 1.2 * s, y - 7 * s, 2.4 * s, 7 * s);
  const gr = c.createRadialGradient(x - 3 * s, y - 15 * s, 1, x, y - 11 * s, 9 * s); gr.addColorStop(0, hi); gr.addColorStop(1, lo);
  c.fillStyle = gr; c.beginPath(); c.arc(x, y - 11 * s, 8 * s, 0, 7); c.fill();
  c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.ellipse(x - 3 * s, y - 15 * s, 3 * s, 1.8 * s, -.5, 0, 7); c.fill(); }
function pine(c, x, y, s){ shadow(c, x, y, 7 * s, 3 * s); const gr = c.createLinearGradient(x - 6 * s, 0, x + 6 * s, 0); gr.addColorStop(0, "#7ee08a"); gr.addColorStop(1, "#1f8a4c");
  c.fillStyle = gr; c.beginPath(); c.moveTo(x, y - 24 * s); c.quadraticCurveTo(x + 3 * s, y - 10 * s, x + 7 * s, y - 2 * s); c.quadraticCurveTo(x, y + 1 * s, x - 7 * s, y - 2 * s); c.quadraticCurveTo(x - 3 * s, y - 10 * s, x, y - 24 * s); c.fill();
  c.fillStyle = "rgba(255,255,255,.4)"; c.beginPath(); c.ellipse(x - 2 * s, y - 14 * s, 1.3 * s, 4 * s, .2, 0, 7); c.fill(); }
function palm(c, x, y, s){ shadow(c, x, y, 8 * s, 3 * s); c.strokeStyle = "#b08a5e"; c.lineWidth = 2.4 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 4 * s, y - 12 * s, x + 2 * s, y - 24 * s); c.stroke();
  for (let a = 0; a < 7; a++){ const an = a / 7 * 6.28; c.strokeStyle = a % 2 ? "#3fcf6a" : "#7cf08e"; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x + 2 * s, y - 24 * s); c.quadraticCurveTo(x + 2 * s + Math.cos(an) * 7 * s, y - 28 * s + Math.sin(an) * 3 * s, x + 2 * s + Math.cos(an) * 12 * s, y - 21 * s + Math.sin(an) * 5 * s); c.stroke(); } }
function box(c, x, y, w, d, h, left, right, top){ // isometric block, (x,y) = front-bottom corner
  c.fillStyle = left; c.beginPath(); c.moveTo(x, y); c.lineTo(x - w, y - w / 2); c.lineTo(x - w, y - w / 2 - h); c.lineTo(x, y - h); c.closePath(); c.fill();
  c.fillStyle = right; c.beginPath(); c.moveTo(x, y); c.lineTo(x + d, y - d / 2); c.lineTo(x + d, y - d / 2 - h); c.lineTo(x, y - h); c.closePath(); c.fill();
  c.fillStyle = top; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - w, y - w / 2 - h); c.lineTo(x - w + d, y - w / 2 - d / 2 - h); c.lineTo(x + d, y - d / 2 - h); c.closePath(); c.fill(); }
function tower(c, x, y){ const w = rr(10, 16), d = rr(10, 16), h = rr(34, 96); shadow(c, x + 6, y - 2, w + 8, 6);
  const L = c.createLinearGradient(0, y - h, 0, y); L.addColorStop(0, "#7fe3ff"); L.addColorStop(1, "#1a8fe0");
  const Rr = c.createLinearGradient(0, y - h, 0, y); Rr.addColorStop(0, "#c6f4ff"); Rr.addColorStop(1, "#46b9f2");
  box(c, x, y, w, d, h, L, Rr, "#e9fbff");
  c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 1; for (let k = 8; k < h; k += 7){ c.beginPath(); c.moveTo(x, y - k); c.lineTo(x + d, y - d / 2 - k); c.stroke(); }
  c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.moveTo(x + d * .25, y - d * .125 - h * .2); c.lineTo(x + d * .55, y - d * .275 - h * .2); c.lineTo(x + d * .55, y - d * .275 - h * .75); c.lineTo(x + d * .25, y - d * .125 - h * .55); c.closePath(); c.fill(); }
function house(c, x, y){ const w = rr(7, 10), d = rr(7, 10), h = rr(6, 10); shadow(c, x + 3, y - 1, w + 3, 3);
  box(c, x, y, w, d, h, "#e9f2f7", "#ffffff", "#fff"); const roof = pick(["#ff6b6b", "#ffa94d", "#4dabf7", "#69db7c", "#b197fc", "#f783ac"]);
  c.fillStyle = roof; c.beginPath(); c.moveTo(x - w - 1, y - w / 2 - h); c.lineTo(x - w / 2 + d / 2, y - w / 4 - d / 4 - h - 8); c.lineTo(x + d + 1, y - d / 2 - h); c.lineTo(x, y - h + 1); c.closePath(); c.fill();
  c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.moveTo(x - w - 1, y - w / 2 - h); c.lineTo(x - w / 2 + d / 2, y - w / 4 - d / 4 - h - 8); c.lineTo(x - w / 2, y - w / 4 - h - 2); c.closePath(); c.fill(); }
function hill(c, x, y, rx){ const ry = rx * .55; c.fillStyle = "rgba(20,90,40,.16)"; c.beginPath(); c.ellipse(x + rx * .18, y + ry * .25, rx, ry * .9, 0, 0, 7); c.fill();
  const gr = c.createRadialGradient(x - rx * .35, y - ry * .55, 2, x, y, rx); gr.addColorStop(0, "#d9ffb0"); gr.addColorStop(.45, "#86e36a"); gr.addColorStop(1, "#3fb456");
  c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, rx, ry, 0, Math.PI, 0); c.ellipse(x, y, rx, ry * .35, 0, 0, Math.PI); c.fill();
  c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.ellipse(x - rx * .38, y - ry * .62, rx * .28, ry * .14, -.35, 0, 7); c.fill(); }

function build(){
  const dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  for (const cv of [bg, fg]){ cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; }
  g.setTransform(dpr, 0, 0, dpr, 0, 0); f.setTransform(dpr, 0, 0, dpr, 0, 0); SEED = 93;
  ROADS = [ path(t => [-140 + t * (W + 280), H * .27 + Math.sin(t * 6.6 + .5) * H * .07]),
            path(t => [W * .07 + t * W * .58 + Math.sin(t * 5.2) * W * .05, -140 + t * (H + 280)]),
            path(t => [-140 + t * (W + 280), H * .80 + Math.sin(t * 5.1 + 2) * H * .05]) ];
  RAIL = path(t => [W * .97 - t * W * .32 + Math.sin(t * 4.4) * W * .05, -140 + t * (H + 280)]);
  LAKES = []; const nl = Math.max(2, Math.round(W * H / 420000));
  for (let k = 0, tries = 0; k < nl && tries < 200; tries++){ const l = { x: rr(.04, .96) * W, y: rr(.08, .95) * H, rx: rr(70, 140), ry: 0, s: R() * 10 }; l.ry = l.rx * rr(.4, .55);
    if (!LAKES.some(o => Math.hypot(o.x - l.x, o.y - l.y) < 260)){ LAKES.push(l); k++; } }

  // ground: glossy patchwork tiles
  const base = g.createLinearGradient(0, 0, W, H); base.addColorStop(0, "#9ee87e"); base.addColorStop(1, "#5ccf6b"); g.fillStyle = base; g.fillRect(0, 0, W, H);
  const TW = 46, TH = 23;
  for (let r = -2; r * TH / 2 < H + TH; r++) for (let c = -2; c * TW < W + TW; c++){
    const x = c * TW + (r & 1 ? TW / 2 : 0), y = r * TH / 2, n = noise(x / 260 + 3, y / 200 + 7), m = noise(x / 90, y / 90);
    let col; if (n > .66) col = ["#ffe58a", "#d4f57a", "#a8f0d0", "#ffc6e2", "#ffd59a"][Math.floor(noise(x / 500, y / 500) * 5) % 5];
    else { const L = 60 + m * 12; col = `hsl(${100 + m * 22},${58 + m * 10}%,${L}%)`; }
    g.fillStyle = col; g.beginPath(); g.moveTo(x, y - TH / 2 + 1.2); g.quadraticCurveTo(x + TW / 4, y - TH / 4 + 1, x + TW / 2 - 2, y); g.quadraticCurveTo(x + TW / 4, y + TH / 4 - 1, x, y + TH / 2 - 1.2);
    g.quadraticCurveTo(x - TW / 4, y + TH / 4 - 1, x - TW / 2 + 2, y); g.quadraticCurveTo(x - TW / 4, y - TH / 4 + 1, x, y - TH / 2 + 1.2); g.fill();
    g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.ellipse(x - 4, y - 3, TW * .2, TH * .14, 0, 0, 7); g.fill(); }
  // lakes
  for (const l of LAKES){ g.fillStyle = "#fff4cf"; blob(g, l, 1.13); g.fill();
    const wg = g.createLinearGradient(l.x, l.y - l.ry, l.x, l.y + l.ry); wg.addColorStop(0, "#5fe0ff"); wg.addColorStop(1, "#0d8fe0"); g.fillStyle = wg; blob(g, l, 1); g.fill();
    g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 3; blob(g, l, .95); g.stroke();
    g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.ellipse(l.x - l.rx * .3, l.y - l.ry * .35, l.rx * .35, l.ry * .16, -.15, 0, 7); g.fill(); }
  // hills + turbines
  TURB = []; const props = [];
  const nh = Math.round(W * H / 70000);
  for (let k = 0; k < nh; k++){ const x = rr(0, W), y = rr(0, H), rx = rr(34, 80); if (nearRoad(x, y, rx * .9) || inLake(x, y, rx)) continue; props.push({ y, draw: () => hill(g, x, y, rx) }); if (R() < .35) TURB.push({ x, y: y - rx * .5, h: 34 + rx * .25, a: R() * 7, s: rr(.6, 1.2) }); }
  // towns & glass cities
  const nc = Math.max(2, Math.round(W * H / 380000));
  for (let k = 0; k < nc; k++){ const cx = rr(.05, .95) * W, cy = rr(.1, .95) * H, big = R() < .5;
    for (let q = 0; q < (big ? 26 : 18); q++){ const x = cx + rr(-70, 70), y = cy + rr(-35, 35); if (nearRoad(x, y, 22) || inLake(x, y, 12)) continue;
      props.push({ y, draw: big && Math.hypot(x - cx, (y - cy) * 2) < 55 ? () => tower(g, x, y) : () => house(g, x, y) }); } }
  // trees, lots of variety
  const nt = Math.round(W * H / 1500);
  for (let k = 0; k < nt; k++){ const x = rr(-10, W + 10), y = rr(-10, H + 20), n = noise(x / 160, y / 160); if (n < .45 && R() > .12) continue; if (nearRoad(x, y, 20) || inLake(x, y, 8)) continue;
    const s = rr(.7, 1.15), kind = R(), lakeside = inLake(x, y, 40);
    props.push({ y, draw: lakeside && kind < .5 ? () => palm(g, x, y, s) : kind < .38 ? () => pine(g, x, y, s) :
      kind < .5 ? () => ballTree(g, x, y, s, "#ffd6ec", "#f06fae") : kind < .58 ? () => ballTree(g, x, y, s, "#ffe7a0", "#f39a2b") : () => ballTree(g, x, y, s, "#c9ff9c", "#2fa64a") }); }
  // roads + monorail (drawn before props so things sit beside them)
  for (const p of ROADS){ stroke(g, p.map(q => ({ x: q.x + 5, y: q.y + 9 })), 36, "rgba(20,70,40,.2)"); stroke(g, p, 34, "#f7fbff"); stroke(g, p, 29, "#8592a0");
    stroke(g, offset(p, -12.5), 2, "rgba(255,255,255,.55)"); stroke(g, p, 1.8, "#ffd23f"); stroke(g, offset(p, -6.5), 1.3, "rgba(255,255,255,.9)", [10, 10]); stroke(g, offset(p, 6.5), 1.3, "rgba(255,255,255,.9)", [10, 10]); }
  for (let d = 0; d < RAIL.L; d += 38){ const q = at(RAIL, d); g.fillStyle = "rgba(20,70,40,.2)"; g.beginPath(); g.ellipse(q.x + 4, q.y + 3, 6, 3, 0, 0, 7); g.fill(); g.fillStyle = "#e9f1f6"; g.fillRect(q.x - 2, q.y - 2, 4, 14); }
  stroke(g, RAIL.map(q => ({ x: q.x + 6, y: q.y + 16 })), 9, "rgba(20,70,40,.15)"); stroke(g, RAIL, 10, "#f4f9fc"); stroke(g, RAIL, 3, "#4fd1ff");
  props.sort((a, b) => a.y - b.y).forEach(o => o.draw());
  for (const t of TURB){ g.strokeStyle = "#f7fbff"; g.lineWidth = 2.6; g.beginPath(); g.moveTo(t.x, t.y); g.lineTo(t.x, t.y - t.h); g.stroke(); }
  spawn();
}

const CANDY = ["#ff5a5f", "#2ec4ff", "#ffd23f", "#ffffff", "#7bd389", "#b388ff", "#ff9f43", "#ff7eb6"];
function spawn(){
  VEH = []; ROADS.forEach(p => { const n = Math.round(p.L / 55); for (let k = 0; k < n; k++){ const dir = R() < .5 ? 1 : -1, r = R();
    VEH.push({ p, d: R() * p.L, v: dir * rr(38, 70), lane: dir * (R() < .5 ? 3.3 : 9.6), type: r < .72 ? "car" : r < .88 ? "truck" : "bus", col: pick(CANDY) }); } });
  TRAINS = [{ d: R() * RAIL.L, v: 64 }, { d: R() * RAIL.L, v: -52 }];
  BOATS = LAKES.map(l => ({ l, a: R() * 7, v: rr(.12, .22) * (R() < .5 ? 1 : -1), col: pick(["#ffffff", "#ff5a5f", "#ffd23f"]) }));
  CLOUDS = [0, 1, 2].map(() => ({ x: rr(0, W), y: rr(0, H), s: rr(.8, 1.4), v: rr(6, 12) }));
  PLANES = [{ x: rr(0, W), y: rr(0, H), v: 55 }];
}
function rrect(c, x, y, w, h, r){ c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
function vehicle(x, y, ang, len, wid, col, roof){ f.save(); f.translate(x, y); f.rotate(ang);
  f.fillStyle = "rgba(10,40,30,.25)"; rrect(f, -len / 2 + 1.5, -wid / 2 + 2.5, len, wid, wid / 2.4); f.fill();
  f.fillStyle = col; rrect(f, -len / 2, -wid / 2, len, wid, wid / 2.4); f.fill(); f.strokeStyle = "rgba(20,30,40,.35)"; f.lineWidth = .7; f.stroke();
  if (roof){ f.fillStyle = roof; rrect(f, -len * .15, -wid / 2 + 1.2, len * .42, wid - 2.4, 1.5); f.fill(); }
  f.fillStyle = "rgba(255,255,255,.55)"; rrect(f, -len / 2 + 2, -wid / 2 + .8, len - 4, wid * .28, 1); f.fill(); f.restore(); }
function cloud(x, y, s, a){ for (const [dx, dy, r] of [[0, 0, 26], [24, 4, 20], [-22, 6, 18], [8, -12, 18]]){ const gr = f.createRadialGradient(x + dx * s - 6, y + dy * s - 8, 2, x + dx * s, y + dy * s, r * s);
  gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, `rgba(255,255,255,${a * .55})`); f.fillStyle = gr; f.beginPath(); f.arc(x + dx * s, y + dy * s, r * s, 0, 7); f.fill(); } }
function plane(x, y, col){ f.save(); f.translate(x, y); f.rotate(-.5); f.fillStyle = col; f.beginPath();
  f.moveTo(14, 0); f.quadraticCurveTo(10, -2.4, 4, -2); f.lineTo(-2, -11); f.lineTo(-6, -11); f.lineTo(-3, -2); f.lineTo(-10, -2); f.lineTo(-14, -6); f.lineTo(-16, -6); f.lineTo(-14, 0);
  f.lineTo(-16, 6); f.lineTo(-14, 6); f.lineTo(-10, 2); f.lineTo(-3, 2); f.lineTo(-6, 11); f.lineTo(-2, 11); f.lineTo(4, 2); f.quadraticCurveTo(10, 2.4, 14, 0); f.fill(); f.restore(); }
let lastT = 0;
function frame(now){
  const dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now; f.clearRect(0, 0, W, H);
  for (const b of BOATS){ b.a += b.v * dt; const l = b.l, x = l.x + Math.cos(b.a) * l.rx * .55, y = l.y + Math.sin(b.a) * l.ry * .55, ang = Math.atan2(Math.cos(b.a) * l.ry, -Math.sin(b.a) * l.rx) + (b.v < 0 ? Math.PI : 0);
    f.save(); f.translate(x, y); f.rotate(ang); f.strokeStyle = "rgba(255,255,255,.8)"; f.lineWidth = 1.2; f.beginPath(); f.moveTo(-7, -3); f.lineTo(-20, -7); f.moveTo(-7, 3); f.lineTo(-20, 7); f.stroke();
    f.fillStyle = b.col; f.beginPath(); f.moveTo(-7, -4); f.lineTo(6, -4); f.quadraticCurveTo(12, 0, 6, 4); f.lineTo(-7, 4); f.closePath(); f.fill(); f.fillStyle = "#bdefff"; f.fillRect(-3, -2, 5, 4); f.restore(); }
  for (const v of VEH){ v.d += v.v * dt; const q = at(v.p, v.d), x = q.x - Math.sin(q.ang) * v.lane, y = q.y + Math.cos(q.ang) * v.lane, ang = q.ang + (v.v < 0 ? Math.PI : 0);
    if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;
    if (v.type === "car") vehicle(x, y, ang, 13, 6.5, v.col, "rgba(170,230,255,.95)");
    else if (v.type === "truck"){ vehicle(x, y, ang, 21, 7.5, "#f8fbff"); vehicle(x + Math.cos(ang) * 12, y + Math.sin(ang) * 12, ang, 6, 7.5, v.col, "rgba(170,230,255,.95)"); }
    else vehicle(x, y, ang, 23, 7.5, "#ffd23f", "rgba(170,230,255,.95)"); }
  for (const t of TRAINS){ t.d += t.v * dt; for (let k = 2; k >= 0; k--){ const q = at(RAIL, t.d - Math.sign(t.v) * k * 25), ang = q.ang + (t.v < 0 ? Math.PI : 0);
    f.save(); f.translate(q.x, q.y); f.rotate(ang); f.fillStyle = "rgba(10,40,30,.2)"; rrect(f, -11, -1, 23, 10, 5); f.fill();
    f.fillStyle = "#ffffff"; rrect(f, -11.5, -5, 23, 10, 5); f.fill(); f.strokeStyle = "rgba(40,90,120,.35)"; f.lineWidth = .8; f.stroke();
    f.fillStyle = "#33c6ff"; rrect(f, -8, -3, 16, 3, 1.5); f.fill(); f.fillStyle = "rgba(255,255,255,.7)"; rrect(f, -9, -4.4, 18, 1.4, .7); f.fill(); f.restore(); } }
  for (const t of TURB){ t.a += t.s * dt; f.strokeStyle = "#ffffff"; f.lineWidth = 2; f.lineCap = "round";
    for (let k = 0; k < 3; k++){ const a = t.a + k * 2.094; f.beginPath(); f.moveTo(t.x, t.y - t.h); f.lineTo(t.x + Math.cos(a) * 14, t.y - t.h + Math.sin(a) * 14); f.stroke(); }
    f.fillStyle = "#dff6ff"; f.beginPath(); f.arc(t.x, t.y - t.h, 2.4, 0, 7); f.fill(); }
  for (const c of CLOUDS){ c.x += c.v * dt; if (c.x > W + 120){ c.x = -120; c.y = rr(0, H); }
    f.fillStyle = "rgba(20,70,60,.07)"; f.beginPath(); f.ellipse(c.x + 70, c.y + 90, 46 * c.s, 20 * c.s, 0, 0, 7); f.fill(); cloud(c.x, c.y, c.s, .75); }
  for (const p of PLANES){ p.x += p.v * dt; p.y -= p.v * .55 * dt; if (p.x > W + 80 || p.y < -80){ p.x = -60; p.y = rr(H * .4, H + 40); }
    plane(p.x + 50, p.y + 80, "rgba(20,70,60,.13)"); plane(p.x, p.y, "#ffffff"); }
  if (!REDUCED) requestAnimationFrame(frame);
}
build(); requestAnimationFrame(frame);
let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { build(); if (REDUCED) requestAnimationFrame(frame); }, 200); });

requestAnimationFrame(tick);
drawCloud(); try { new ResizeObserver(drawCloud).observe(tram); } catch (e) { addEventListener("resize", drawCloud); }
})();
