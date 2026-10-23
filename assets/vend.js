// asaaab shop vending machine (WIP). Punch a code (a color orb + 1–4 dots), the coil spins, the item drops. Drag the machine and it rolls.
// The door is jammed, so everything piles up inside the glass. When the machine is empty: REQUEST CHECKOUT.
// Resets daily, or with the hidden code A·S·A·A·A·B (S = the coin slot, or the S key on a keyboard).
(() => {
  const SHOP_ENDPOINT = "";   // set when the shop worker is live (POST {keep, email}); until then only the tally is counted
  const ROWS = "ABCDE", COLS = 4, DEPTH = 3;
  const COLORS = ["#ff4b3e", "#ff9f1a", "#ffd21a", "#38d36b", "#3aa8ff"];   // rows are orbs (keyboard still takes A–E)
  const codeHTML = (row, col) => `<span class="o" style="--c:${COLORS[ROWS.indexOf(row)]}"></span>${col ? "<span class=\"d\">" + "•".repeat(col) + "</span>" : "<span class=\"d dim\">_</span>"}`;
  const ITEMS = ["🚗","🛻","🚙","🏎️", "🚐","🚕","🚓","🚌", "🧸","🪀","🎈","🪁", "🍬","🍫","🍪","🧃", "🔧","🔩","🎟️","⭐"];
  const $ = id => document.getElementById(id);
  const track = n => { try { window.goatcounter && window.goatcounter.count && window.goatcounter.count({ path: n, title: n, event: true }); } catch (e) {} };
  const today = () => new Date().toLocaleDateString("en-CA");
  const store = { get() { try { return JSON.parse(localStorage.getItem("asaaab-vend") || "null"); } catch (e) { return null; } },
                  set(v) { try { localStorage.setItem("asaaab-vend", JSON.stringify(v)); } catch (e) {} } };

  const glass = $("glass"), cv = $("vcv"), g = cv.getContext("2d"), screen = $("screen");
  let W = 0, H = 0, dpr = 1, slotW = 0, rowH = 0, top0 = 0, R = 14, S = 40;
  let jig = 0, stock, bodies = [], vending = null, typed = "", seq = "", idleT = 0, msgT = 0;

  function fresh() { stock = ITEMS.map(() => DEPTH); bodies = []; save(); }
  function save() { store.set({ day: today(), stock, pile: bodies.filter(b => b.sleep).map(b => ({ e: b.e, x: b.x / W, y: b.y / H, a: b.a, f: b.free ? 1 : 0 })) }); }
  function load() {
    const s = store.get();
    if (!s || s.day !== today()) { fresh(); return; }
    stock = s.stock; bodies = (s.pile || []).map(p => { const b = body(p.e, p.x * W, p.y * H, p.a); b.free = !!p.f; return b; });
  }
  const body = (e, x, y, a = 0) => ({ e, x, y, vx: 0, vy: 0, a, va: 0, r: R, sleep: false });

  function layout() {
    const r = glass.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    const oldW = W, oldH = H;
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    slotW = W / COLS; top0 = H * .03; rowH = (H * .8) / ROWS.length; S = Math.min(slotW, rowH * .86) * .94; R = S * .26;
    if (oldW) for (const b of bodies) { b.x *= W / oldW; b.y *= H / oldH; b.r = R; }
  }
  const slotXY = i => { const row = Math.floor(i / COLS), col = i % COLS; return [col * slotW + slotW / 2, top0 + row * rowH + rowH * .44]; };

  // ---- input
  const show = (t, ms = 0, html = false) => { html ? screen.innerHTML = t : screen.textContent = t; msgT = ms ? performance.now() + ms : 0; };
  function press(k) {
    seq = (seq + k).slice(-6);
    if (seq === "ASAAAB") { fresh(); seq = ""; typed = ""; show("FULL!", 1500); $("req").hidden = true; track("shop-reset-code"); return; }
    if (k === "S") return;
    if (k === "CLR") { typed = ""; show("SELECT"); return; }
    if (vending) return;
    if (ROWS.includes(k)) { typed = k; show(codeHTML(k, 0), 0, true); return; }
    if (/[1-4]/.test(k) && typed.length === 1) {
      const code = typed + k, i = ROWS.indexOf(typed) * COLS + (+k - 1); typed = "";
      if (stock[i] <= 0) { show("SOLD OUT", 1400); return; }
      show(codeHTML(code[0], +k) + " ⟳", 0, true); vending = { i, t: 0 }; track("shop-vend");
    }
  }
  document.querySelectorAll(".pad button").forEach(b => b.addEventListener("click", () => press(b.dataset.k)));
  $("coin").addEventListener("click", () => press("S"));
  addEventListener("keydown", e => { if (e.target.closest && e.target.closest("input")) return; const k = e.key.toUpperCase();
    if ("ABCDES1234".includes(k) && k.length === 1) { press(k); const btn = document.querySelector(`.pad button[data-k="${k}"]`); if (btn) { btn.classList.add("hit"); setTimeout(() => btn.classList.remove("hit"), 120); } }
    else if (k === "BACKSPACE" || k === "ESCAPE") press("CLR"); });
  $("trough").addEventListener("click", e => { if (e.target.id === "req") return; const t = $("trough"); t.classList.remove("shake"); void t.offsetWidth; t.classList.add("shake"); show("JAMMED", 1300); });

  // ---- checkout request (counted; email only when the shop worker is live)
  $("req").addEventListener("click", () => { $("ask").classList.add("on"); track("shop-checkout-open"); });
  $("emailRow").hidden = !SHOP_ENDPOINT;
  $("askGo").addEventListener("click", async () => {
    const keep = $("keep").checked, email = SHOP_ENDPOINT && keep ? $("email").value.trim() : "";
    track("shop-checkout-request"); if (keep) track("shop-keep-posted");
    if (SHOP_ENDPOINT) try { await fetch(SHOP_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ keep, email }) }); } catch (e) {}
    $("askBody").innerHTML = "<h2>Requested ✓</h2><p>You're on the flight log. Nobody gets emailed, no confirmations, just a count.</p>";
  });
  $("askX").addEventListener("click", () => $("ask").classList.remove("on"));

  // ---- WIP sign: drag it off the keypad
  (() => { const s = $("wipsign"); let d = null;
    s.addEventListener("pointerdown", e => { s.setPointerCapture(e.pointerId); const r = s.getBoundingClientRect(), p = s.offsetParent.getBoundingClientRect(); d = { dx: e.clientX - r.left, dy: e.clientY - r.top, p }; s.classList.add("drag"); });
    s.addEventListener("pointermove", e => { if (!d) return; s.style.left = (e.clientX - d.p.left - d.dx) + "px"; s.style.top = (e.clientY - d.p.top - d.dy) + "px"; s.style.right = "auto"; });
    s.addEventListener("pointerup", () => { d = null; s.classList.remove("drag"); }); })();

  // ---- physics (tiny circle stacker)
  function step(dt) {
    const G = 2200, floor = H - 4;
    for (const b of bodies) { if (b.sleep) continue; b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt; }
    for (let it = 0; it < 4; it++) {
      for (const b of bodies) {
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * .3; } if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * .3; }
        if (b.y > floor - b.r) { b.y = floor - b.r; if (b.vy > 0) b.vy *= -.25; b.vx *= .9; b.va *= .8; }
      }
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], c = bodies[j], dx = c.x - a.x, dy = c.y - a.y, d2 = dx * dx + dy * dy, m = a.r + c.r;
        if (d2 >= m * m || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, o = (m - d) / 2;
        const wa = a.sleep ? 0 : 1, wc = c.sleep ? 0 : 1, ws = wa + wc || 1;
        a.x -= nx * o * 2 * wa / ws; a.y -= ny * o * 2 * wa / ws; c.x += nx * o * 2 * wc / ws; c.y += ny * o * 2 * wc / ws;
        const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
        if (rv < 0) { const imp = -rv * .6; a.vx -= nx * imp * wa / ws; a.vy -= ny * imp * wa / ws; c.vx += nx * imp * wc / ws; c.vy += ny * imp * wc / ws; }
        if (!a.sleep && c.sleep && ny > .3) { a.vx *= .96; a.va *= .9; }   // resting on the pile
        if (!c.sleep && a.sleep && ny < -.3) { c.vx *= .96; c.va *= .9; }
      }
    }
    let settled = false;
    for (const b of bodies) if (!b.sleep && Math.abs(b.vx) + Math.abs(b.vy) < 18 && performance.now() - b.born > 700) { b.sleep = true; b.vx = b.vy = 0; settled = true; }
    if (settled) save();
  }

  // ---- draw: end-on spiral coils like a real machine, products in clear bags, orb + dot labels on the shelf lip
  function ringsBack(x, y, ph) { g.lineWidth = Math.max(1.6, S * .05);
    for (let k = 5; k >= 1; k--) { const r = S * .44 * (1 - k * .07), cy = y - k * S * .03; g.strokeStyle = `rgba(190,200,207,${.35 + (5 - k) * .13})`; g.beginPath(); g.arc(x, cy, r, 0, Math.PI * 2); g.stroke(); } }
  function ringFront(x, y, ph) { const r = S * .44, a0 = Math.PI * .42 + ph; g.lineWidth = Math.max(2.4, S * .08);
    const gr = g.createLinearGradient(x - r, y - r, x + r, y + r); gr.addColorStop(0, "#f4f7f8"); gr.addColorStop(.5, "#aeb8be"); gr.addColorStop(1, "#e3e8ea");
    g.strokeStyle = gr; g.beginPath(); g.arc(x, y, r, a0, a0 + Math.PI * 1.86); g.stroke(); }
  function bag(x, y, s) { const w = s * .5, h = s * .64, l = x - w / 2, t = y - h * .55;
    g.fillStyle = "rgba(235,245,255,.16)"; g.strokeStyle = "rgba(235,245,255,.45)"; g.lineWidth = 1; g.beginPath(); g.roundRect(l, t, w, h, 3); g.fill(); g.stroke();
    g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.arc(x, t + h * .1, Math.max(1.2, s * .03), 0, 7); g.fill(); }
  function label(x, y, row, col) { const r = Math.max(5, S * .1);
    const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); gr.addColorStop(0, "#fff"); gr.addColorStop(.35, COLORS[row]); gr.addColorStop(1, "#0006");
    g.fillStyle = gr; g.beginPath(); g.arc(x - r * .9, y, r, 0, 7); g.fill();
    g.fillStyle = "#16191c"; for (let d = 0; d < col; d++) { g.beginPath(); g.arc(x + r * .6 + d * r * .75, y, r * .26, 0, 7); g.fill(); } }
  const emoji = (e, x, y, s, a = 0) => { g.save(); g.translate(x, y); g.rotate(a); g.font = `${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e, 0, 0); g.restore(); };
  function draw(now) {
    g.clearRect(0, 0, W, H);
    for (let row = 0; row < ROWS.length; row++) {   // shelf lips with orb labels
      const y = top0 + row * rowH + rowH * .86, sh = rowH * .14;
      const gr = g.createLinearGradient(0, y, 0, y + sh); gr.addColorStop(0, "#c6ccd0"); gr.addColorStop(1, "#7d868b"); g.fillStyle = gr; g.fillRect(2, y, W - 4, sh);
      for (let c = 0; c < COLS; c++) { g.fillStyle = "#f4f6f7"; const lw = Math.min(slotW * .62, S * .62), lx = c * slotW + slotW / 2; g.fillRect(lx - lw / 2, y + sh * .16, lw, sh * .68); label(lx, y + sh * .5, row, c + 1); }
    }
    for (let i = 0; i < ITEMS.length; i++) {
      let [x, y] = slotXY(i), ph = 0, fwd = 0;
      if (vending && vending.i === i) { ph = vending.t * Math.PI * 2; fwd = Math.min(1, vending.t / .9); }
      ringsBack(x, y, ph);
      if (stock[i] > 0) { const sc = 1 + fwd * .22, yy = y + fwd * S * .06 + jig * Math.cos(now / 37 + i * 1.7) * .5; x += jig * Math.sin(now / 45 + i * 2.3); bag(x, yy, S * sc); emoji(ITEMS[i], x, yy, R * 1.45 * sc); }
      ringFront(x, y, ph);
    }
    for (const b of bodies) emoji(b.e, b.x, b.y, b.r * 1.7, b.a);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.033, (now - last) / 1000); last = now;
    if (vending) { vending.t += dt;
      if (vending.t > 1) { const i = vending.i, [x, y] = slotXY(i), b = body(ITEMS[i], x, y + R * .3); b.vx = (Math.random() - .5) * 120; b.vy = 40; b.va = (Math.random() - .5) * 8; b.born = now; bodies.push(b);
        stock[i]--; vending = null; show("THANKS", 900); save();
        if (stock.every(s => s <= 0)) { $("req").hidden = false; show("ALL GONE", 2500); track("shop-emptied"); } } }
    for (let s = 0; s < 3; s++) step(dt / 3);
    if (msgT && now > msgT) { msgT = 0; typed ? show(codeHTML(typed, 0), 0, true) : show("SELECT"); }
    jig *= Math.pow(.02, dt); draw(now); requestAnimationFrame(frame);
  }
  const room = document.querySelector('.room'); const fit = () => { room.style.height = Math.max(480, innerHeight - room.getBoundingClientRect().top - scrollY) + 'px'; }; fit(); addEventListener('resize', fit); setTimeout(() => { fit(); layout(); }, 400);
  layout(); load(); bodies.forEach(b => { b.born = 0; b.r = R; });
  $("req").hidden = !stock.every(s => s <= 0);
  show("SELECT"); addEventListener("resize", layout); requestAnimationFrame(frame);
  // ---- the machine has legs + wheels: drag it and it rolls; the pile inside sloshes
  const belt = (() => { const claim = document.querySelector(".claim"), car = claim && claim.querySelector(".carousel"), els = car ? [...car.querySelectorAll(".bag")] : [];
    const api = { speed: 46, lift: 5, update: () => false }; if (!car) return api;
    const bags = els.map((el, i) => ({ el, x: i * 130, y: 0 }));
    function place() { const wheel = document.querySelector(".wheel"); if (!wheel || getComputedStyle(claim).display === "none") return null;
      const wr = wheel.getBoundingClientRect(), cr = car.getBoundingClientRect(), want = wr.bottom - api.lift - cr.height * .55 - (api.lifted || 0);
      if (Math.abs(cr.top - want) > .5) claim.style.top = (claim.offsetTop + want - cr.top) + "px"; return car.getBoundingClientRect(); }
    api.update = (dt, vm, mx) => { const cr = place(); if (!cr) return false; const W = cr.width, bw = els[0] ? els[0].offsetWidth : 30;
      const ws = [...document.querySelectorAll(".wheel")].map(w => w.getBoundingClientRect()), ml = Math.min(...ws.map(w => w.left)) - cr.left, mr = Math.max(...ws.map(w => w.right)) - cr.left;
      const on = mr > 12 && ml < W - 12; let wall = on ? Math.max(0, ml - 6) : Infinity;   // luggage piles up against the machine's front wheel
      const order = bags.slice().sort((a, b) => b.x - a.x); let stackY = 0;
      for (const b of order) { let nx = b.x + api.speed * dt; if (nx + bw > wall && b.x < mr) { nx = Math.max(-bw, wall - bw); if (nx <= 0 && wall < W) { b.y = Math.min(b.y + 1, ++stackY); } wall = nx; } else { b.y = 0; }
        if (nx > W) nx = -bw - Math.random() * 60; b.x = nx; b.el.style.transform = `translate(${b.x.toFixed(1)}px, ${(-b.y * bw * .55).toFixed(1)}px) rotate(${b.y ? (b.y % 2 ? -12 : 9) : 0}deg)`; }
      api.lifted = on ? api.lift : 0; return on; };
    return api; })();
  (() => { const vm = document.querySelector(".vm"), wheels = [...document.querySelectorAll(".wheel")]; let x = 0, v = 0, prevV = 0, drag = null, lastT = performance.now();
    const lim = () => Math.max(0, (room.clientWidth - vm.offsetWidth) / 2 - 8);
    vm.addEventListener("pointerdown", e => { if (e.target.closest("button, .wipsign, #trough, input")) return; drag = { px: e.clientX, x0: x, t: performance.now() }; vm.setPointerCapture(e.pointerId); vm.classList.add("rolling"); });
    vm.addEventListener("pointermove", e => { if (!drag) return; const nx = Math.max(-lim(), Math.min(lim(), drag.x0 + e.clientX - drag.px)), t = performance.now(); v = (nx - x) / Math.max(.008, (t - (drag.t)) / 1000) * .5 + v * .5; drag.t = t; x = nx; });
    const up = () => { drag = null; vm.classList.remove("rolling"); }; vm.addEventListener("pointerup", up); vm.addEventListener("pointercancel", up);
    (function roll(t) { const dt = Math.min(.033, (t - lastT) / 1000); lastT = t;
      if (!drag) { v *= Math.pow(.12, dt); x += v * dt; if (Math.abs(x) > lim()) { x = Math.sign(x) * lim(); v = -v * .35; } if (Math.abs(v) < 2) v = 0; }
      const onBelt = belt.update(dt, vm, x);
      if (onBelt && !drag) { const want = belt.speed; v += (want - v) * Math.min(1, dt * 3); }
      const dv = v - prevV; prevV = v;
      if (Math.abs(dv) > 15) jolt(dv, t);
      vm.style.transform = `translateX(${x.toFixed(1)}px) translateY(${onBelt ? -belt.lift : 0}px) rotate(${Math.max(-4, Math.min(4, -v * .006)).toFixed(2)}deg)`;
      wheels.forEach(w => w.style.transform = `rotate(${(x / (w.offsetWidth / 2 || 10)) * 57.3}deg)`);
      requestAnimationFrame(roll); })(performance.now()); })();
  function shakeLoose(i, now) { if (stock[i] <= 0) return; const [x, y] = slotXY(i), b = body(ITEMS[i], x, y + R * .3); b.free = true; b.vx = (Math.random() - .5) * 260; b.vy = -60; b.va = (Math.random() - .5) * 14; b.born = now; bodies.push(b); stock[i]--;
    if (stock.every(s => s <= 0)) { $("req").hidden = false; show("ALL GONE", 2500); } save(); }
  function jolt(dv, t) { const k = Math.abs(dv); jig = Math.min(S * .12, jig + k * .01);
    for (const b of bodies) { b.vx -= dv * 1.1 + (Math.random() - .5) * k * .4; b.vy -= k * (.25 + Math.random() * .25); b.va += (Math.random() - .5) * k * .03; if (b.sleep) { b.sleep = false; b.born = t - 600; } }
    if (k > 300) { const p = Math.min(.2, (k - 300) / 2200); stock.forEach((n, i) => { if (n > 0 && Math.random() < p) shakeLoose(i, t); }); } }
  window.__vend = { press, shakeLoose, jolt, get stock() { return stock; }, get bodies() { return bodies; } };   // for testing
})();
