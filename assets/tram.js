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
  requestAnimationFrame(tick);
}

/* ---------- the world: a quiet isometric countryside, drawn once ---------- */
const sc = document.getElementById("scene");
const cv = document.createElement("canvas"); sc.appendChild(cv);
const ctx = cv.getContext("2d");
const TW = 28, TH = 14;                       // tile size in CSS px (fixed: never scales up)
const C = {
  grass: ["#a6d394", "#9ecc8b", "#aed89c", "#98c886"], edge: "rgba(40,70,40,.06)",
  tree: ["#4c9a5f", "#3c8a51", "#5bab6b", "#69b676"], trunk: "#7d6450", autumn: "#e3a13c",
  wheat: "#efd88a", wheatLine: "#dcc06a", plough: "#d9ad78", ploughLine: "#c39461",
  water: "#62b6e0", waterHi: "#c2e8f8", road: "#d9d5c9", roadEdge: "#b9b3a3", roadLine: "#f4f1e8",
  ballast: "#c8ad88", rail: "#6f5f4f", sleeper: "#957d60",
  wall: "#fdf8ee", wallShade: "#e7dac4", roofs: ["#d6623f", "#c94a3a", "#e58a35", "#5b85c0", "#77a755", "#a65c9e"],
};
let S = 4242; const rnd = () => (S = (S * 16807) % 2147483647) / 2147483647;
// smooth value noise for forests & fields
const NG = {}; const hash = (x, y) => { const k = x + "," + y; if (!(k in NG)) { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >>> 13)) * 1274126177; NG[k] = ((h ^ (h >>> 16)) >>> 0) / 4294967295; } return NG[k]; };
const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = v => v * v * (3 - 2 * v);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf); };
const diamond = (x, y, fill) => { ctx.beginPath(); ctx.moveTo(x, y - TH / 2); ctx.lineTo(x + TW / 2, y); ctx.lineTo(x, y + TH / 2); ctx.lineTo(x - TW / 2, y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
const tree = (x, y, s, col) => { ctx.fillStyle = "rgba(40,60,45,.12)"; ctx.beginPath(); ctx.ellipse(x + 2, y + 1, 4 * s, 2 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = C.trunk; ctx.fillRect(x - .6, y - 4 * s, 1.2, 4 * s);
  ctx.fillStyle = col; if (rnd() < .5) { ctx.beginPath(); ctx.moveTo(x, y - 12 * s); ctx.lineTo(x + 4 * s, y - 3 * s); ctx.lineTo(x - 4 * s, y - 3 * s); ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(x, y - 7 * s, 4 * s, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.arc(x - 1.3 * s, y - 8.3 * s, 1.6 * s, 0, 7); ctx.fill(); } };
const house = (x, y, h, roof) => { const w = TW * .32, d = TH * .32;
  ctx.fillStyle = C.wallShade; ctx.beginPath(); ctx.moveTo(x - w, y - d * 0); ctx.lineTo(x, y + d); ctx.lineTo(x, y + d - h); ctx.lineTo(x - w, y - h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.wall; ctx.beginPath(); ctx.moveTo(x, y + d); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y - h); ctx.lineTo(x, y + d - h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - w - 1, y - h); ctx.lineTo(x, y - h - d - 4); ctx.lineTo(x + w + 1, y - h); ctx.lineTo(x, y + d - h + 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(60,50,40,.35)"; ctx.fillRect(x + w * .35, y - h * .55, 1.6, 1.6); };

function drawWorld(){
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); S = 4242;
  const cols = Math.ceil(W / TW) + 4, rows = Math.ceil(H / (TH / 2)) + 4;
  // screen → iso helpers (diamond grid: row r, column c; odd rows offset)
  const cells = [];
  for (let r = -2; r < rows; r++) for (let c = -2; c < cols; c++){
    const x = c * TW + (r & 1 ? TW / 2 : 0), y = r * TH / 2;
    const i = Math.round(x / TW + y / TH), j = Math.round(y / TH - x / TW);   // iso grid coords
    cells.push({ x, y, i, j });
  }
  // features on iso lines
  const isRoad = (i, j) => i % 23 === 0 || j % 29 === 0;
  const isRail = (i, j) => j % 41 === 17;
  const riverJ = i => 9 + Math.round(Math.sin(i / 9) * 3 + Math.sin(i / 23) * 4);
  const isRiver = (i, j) => Math.abs(j - riverJ(i)) <= 1;
  const town = (i, j) => { const ti = Math.round(i / 23) * 23, tj = Math.round(j / 29) * 29; const dd = Math.abs(i - ti) + Math.abs(j - tj); return dd < 6 && hash(ti, tj) > .35; };
  // pass 1: ground
  for (const k of cells){ const { x, y, i, j } = k; let f = C.grass[(i * 7 + j * 13 & 3)];
    if (isRiver(i, j)) f = C.water;
    else if (isRail(i, j)) f = C.ballast;
    else if (isRoad(i, j)) f = C.road;
    else { const n = noise(i / 7 + 40, j / 7 + 40); if (n > .62 && !town(i, j)) f = noise(i / 3, j / 3) > .5 ? C.wheat : C.plough; }
    k.f = f; diamond(x, y, f);
    ctx.strokeStyle = C.edge; ctx.lineWidth = .6; ctx.stroke();
    if (f === C.water && rnd() < .25){ ctx.strokeStyle = C.waterHi; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 3, y - 1.5); ctx.stroke(); }
    if (f === C.wheat || f === C.plough){ ctx.strokeStyle = f === C.wheat ? C.wheatLine : C.ploughLine; ctx.lineWidth = .8;
      for (let s = -2; s <= 2; s++){ ctx.beginPath(); ctx.moveTo(x - TW / 4 + s * 3, y - TH / 4 + s * 1.5 + 3.5); ctx.lineTo(x + TW / 4 + s * 3 - 7, y + TH / 4 + s * 1.5 - 3.5 + 0); ctx.stroke(); } }
    if (f === C.road){ ctx.strokeStyle = C.roadEdge; ctx.lineWidth = .8; ctx.stroke(); }
    if (f === C.ballast){ ctx.strokeStyle = C.sleeper; ctx.lineWidth = 1; for (let s = -1; s <= 1; s++){ ctx.beginPath(); ctx.moveTo(x - 5 + s * 5, y - 2.5 + s * 2.5 - 2); ctx.lineTo(x - 1 + s * 5, y - .5 + s * 2.5 + 2); ctx.stroke(); }
      ctx.strokeStyle = C.rail; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(x - TW / 2 + 2, y - 2); ctx.lineTo(x + 1, y + TH / 2 - 1); ctx.moveTo(x - 1, y - TH / 2 + 1); ctx.lineTo(x + TW / 2 - 2, y + 2); ctx.stroke(); }
  }
  // pass 2: objects back-to-front (rows already in order)
  for (const k of cells){ const { x, y, i, j, f } = k;
    if (f !== C.grass[0] && f !== C.grass[1] && f !== C.grass[2] && f !== C.grass[3]) continue;
    if (town(i, j) && rnd() < .7){ house(x, y + 1, 5 + rnd() * 5, C.roofs[Math.floor(rnd() * C.roofs.length)]); continue; }
    const n = noise(i / 6, j / 6);
    if (n > .55 && rnd() < (n - .45) * 1.6){ const m = 1 + Math.floor(rnd() * 3);
      for (let t = 0; t < m; t++) tree(x + (rnd() - .5) * TW * .55, y + (rnd() - .5) * TH * .5, .75 + rnd() * .4, rnd() < .08 ? C.autumn : C.tree[Math.floor(rnd() * 4)]); }
    else if (rnd() < .025) tree(x, y, .8, C.tree[Math.floor(rnd() * 4)]);
  }
}
drawWorld();
/* ---------- traffic: things move on the still map ---------- */
const vc = document.createElement("canvas"); sc.appendChild(vc); const vx = vc.getContext("2d");
const iso = (i, j) => [(i - j) * TW / 2, (i + j) * TH / 2];
const riverJf = i => 9 + Math.sin(i / 9) * 3 + Math.sin(i / 23) * 4;
const CAR = ["#e1261c", "#2f7fe0", "#f7d117", "#ffffff", "#2d2d2d", "#3f9a2f", "#e58a35", "#8a4fb7", "#c0c4c8"];
let VEH = [], PLANES = [], lastT = 0;
const pick = a => a[Math.floor(Math.random() * a.length)];
function spawn(){
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  vc.width = W * dpr; vc.height = H * dpr; vc.style.width = W + "px"; vc.style.height = H + "px"; vx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const iMin = -3, iMax = Math.ceil(W / TW + H / TH) + 3, jMin = -Math.ceil(W / TW) - 3, jMax = Math.ceil(H / TH) + 3;
  const iL = [], jL = [], rL = [];
  for (let i = Math.ceil(iMin / 23) * 23; i <= iMax; i += 23) iL.push(i);
  for (let j = Math.ceil(jMin / 29) * 29; j <= jMax; j += 29) jL.push(j);
  for (let j = jMin; j <= jMax; j++) if (((j % 41) + 41) % 41 === 17) rL.push(j);
  VEH = [];
  const n = Math.max(10, Math.round(W * H / 26000));
  for (let k = 0; k < n; k++){
    const kind = Math.random(); const type = kind < .72 ? "car" : kind < .88 ? "truck" : "bus";
    const dir = Math.random() < .5 ? -1 : 1, sp = type === "car" ? .9 + Math.random() * .7 : .6 + Math.random() * .3;
    if (Math.random() < .5 && iL.length) VEH.push({ type, axis: "j", c: pick(iL) + .2 * dir, t: jMin + Math.random() * (jMax - jMin), v: dir * sp, min: jMin, max: jMax, col: pick(CAR) });
    else if (jL.length) VEH.push({ type, axis: "i", c: pick(jL) - .2 * dir, t: iMin + Math.random() * (iMax - iMin), v: dir * sp, min: iMin, max: iMax, col: pick(CAR) });
  }
  for (const j of rL) VEH.push({ type: "train", axis: "i", c: j, t: iMin + Math.random() * (iMax - iMin), v: (Math.random() < .5 ? -1 : 1) * 2.2, min: iMin - 6, max: iMax + 6 });
  for (let k = 0; k < 3; k++) VEH.push({ type: "boat", axis: "river", t: iMin + Math.random() * (iMax - iMin), v: (Math.random() < .5 ? -1 : 1) * (.35 + Math.random() * .2), min: iMin, max: iMax, col: pick(["#ffffff", "#e1261c", "#f7d117"]) });
  PLANES = [{ x: Math.random() * W, y: Math.random() * H * .6, s: 46 }];
}
function body(x, y, ang, len, wid, col, roof){
  vx.save(); vx.translate(x, y); vx.rotate(ang); vx.scale(1, .5);
  vx.fillStyle = "rgba(0,0,0,.18)"; vx.fillRect(-len / 2 + 1, -wid / 2 + 2, len, wid);
  vx.fillStyle = col; vx.strokeStyle = "rgba(20,25,30,.55)"; vx.lineWidth = .8; vx.fillRect(-len / 2, -wid / 2, len, wid); vx.strokeRect(-len / 2, -wid / 2, len, wid);
  if (roof){ vx.fillStyle = roof; vx.fillRect(-len / 2 + len * .25, -wid / 2 + 1, len * .4, wid - 2); }
  vx.restore();
}
function frame(now){
  const dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now;
  const W = innerWidth, H = innerHeight; vx.clearRect(0, 0, W, H);
  for (const v of VEH){
    v.t += v.v * dt; if (v.t > v.max) v.t = v.min; if (v.t < v.min) v.t = v.max;
    let i, j, ang;
    if (v.axis === "j"){ i = v.c; j = v.t; ang = v.v > 0 ? Math.PI - .4636 : -.4636; }
    else if (v.axis === "i"){ i = v.t; j = v.c; ang = v.v > 0 ? .4636 : Math.PI + .4636; }
    else { i = v.t; j = riverJf(i); const j2 = riverJf(i + .2); const [ax, ay] = iso(i, j), [bx, by] = iso(i + .2, j2); ang = Math.atan2(by - ay, bx - ax) + (v.v < 0 ? Math.PI : 0); }
    const [x, y] = iso(i, j);
    if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
    if (v.type === "car") body(x, y, ang, 12, 7, v.col, "rgba(150,210,240,.9)");
    else if (v.type === "truck"){ body(x, y, ang, 19, 8, "#f4f1ea"); body(x + Math.cos(ang) * 10, y + Math.sin(ang) * 5, ang, 6, 8, v.col); }
    else if (v.type === "bus") body(x, y, ang, 21, 8, "#f7c52b", "rgba(150,210,240,.9)");
    else if (v.type === "train"){ for (let k = 3; k >= 0; k--){ const [tx, ty] = iso(i - Math.sign(v.v) * k * .78, j); body(tx, ty, ang, 19, 8, k === 0 ? "#b71c1c" : "#e1261c", "#ffe9a8"); } }
    else if (v.type === "boat"){ vx.save(); vx.translate(x, y); vx.rotate(ang); vx.scale(1.35, .75);
      vx.strokeStyle = "rgba(255,255,255,.7)"; vx.lineWidth = 1; vx.beginPath(); vx.moveTo(-6, -3); vx.lineTo(-16, -6); vx.moveTo(-6, 3); vx.lineTo(-16, 6); vx.stroke();
      vx.fillStyle = v.col; vx.beginPath(); vx.moveTo(-6, -3.5); vx.lineTo(5, -3.5); vx.lineTo(9, 0); vx.lineTo(5, 3.5); vx.lineTo(-6, 3.5); vx.closePath(); vx.fill(); vx.strokeStyle = "rgba(20,25,30,.5)"; vx.stroke(); vx.restore(); }
  }
  for (const p of PLANES){ p.x += p.s * dt; p.y -= p.s * .5 * dt; if (p.x > W + 80 || p.y < -60){ p.x = -60; p.y = H * (.3 + Math.random() * .6); }
    vx.fillStyle = "rgba(0,0,0,.12)"; plane(p.x + 40, p.y + 60);
    vx.fillStyle = "#ffffff"; plane(p.x, p.y); }
  if (!REDUCED) requestAnimationFrame(frame);
}
function plane(x, y){ vx.save(); vx.translate(x, y); vx.rotate(-.4636); vx.beginPath();
  vx.moveTo(12, 0); vx.lineTo(4, -1.6); vx.lineTo(-2, -9); vx.lineTo(-5, -9); vx.lineTo(-2, -1.6); vx.lineTo(-9, -1.6); vx.lineTo(-12, -4); vx.lineTo(-13, -4); vx.lineTo(-12, 0);
  vx.lineTo(-13, 4); vx.lineTo(-12, 4); vx.lineTo(-9, 1.6); vx.lineTo(-2, 1.6); vx.lineTo(-5, 9); vx.lineTo(-2, 9); vx.lineTo(4, 1.6); vx.closePath(); vx.fill(); vx.restore(); }
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
spawn(); requestAnimationFrame(frame);
let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { drawWorld(); spawn(); }, 200); });

requestAnimationFrame(tick);
})();
