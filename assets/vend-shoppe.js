// asaaab shop vending machine (WIP). Punch a code (A–E + 1–4), the coil spins, the item drops.
// The door is jammed, so everything piles up inside the glass. When the machine is empty: REQUEST CHECKOUT.
// Resets daily, or with the hidden code A·S·A·A·A·B (S = the coin slot, or the S key on a keyboard).
(() => {
  const SHOP_ENDPOINT = "";   // set when the shop worker is live (POST {keep, email}); until then only the tally is counted
  const ROWS = "ABCDE", COLS = 4, DEPTH = 3;
  const ITEMS = ["🚗","🛻","🚙","🏎️", "🚐","🚕","🚓","🚌", "🧸","🪀","🎈","🪁", "🍬","🍫","🍪","🧃", "🔧","🔩","🎟️","⭐"];
  const $ = id => document.getElementById(id);
  const track = n => { try { window.goatcounter && window.goatcounter.count && window.goatcounter.count({ path: n, title: n, event: true }); } catch (e) {} };
  const today = () => new Date().toLocaleDateString("en-CA");
  const store = { get() { try { return JSON.parse(localStorage.getItem("asaaab-vend-shoppe") || "null"); } catch (e) { return null; } },
                  set(v) { try { localStorage.setItem("asaaab-vend-shoppe", JSON.stringify(v)); } catch (e) {} } };

  const glass = $("glass"), cv = $("vcv"), g = cv.getContext("2d"), screen = $("screen");
  let W = 0, H = 0, dpr = 1, slotW = 0, rowH = 0, top0 = 0, R = 14;
  let stock, bodies = [], vending = null, typed = "", seq = "", idleT = 0, msgT = 0;

  function fresh() { stock = ITEMS.map(() => DEPTH); bodies = []; save(); }
  function save() { store.set({ day: today(), stock, pile: bodies.filter(b => b.sleep).map(b => ({ e: b.e, x: b.x / W, y: b.y / H, a: b.a })) }); }
  function load() {
    const s = store.get();
    if (!s || s.day !== today()) { fresh(); return; }
    stock = s.stock; bodies = (s.pile || []).map(p => body(p.e, p.x * W, p.y * H, p.a));
  }
  const body = (e, x, y, a = 0) => ({ e, x, y, vx: 0, vy: 0, a, va: 0, r: R, sleep: false });

  function layout() {
    const r = glass.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    const oldW = W, oldH = H;
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    slotW = W / COLS; top0 = H * .05; rowH = (H * .78) / ROWS.length; R = Math.min(slotW, rowH) * .3;
    if (oldW) for (const b of bodies) { b.x *= W / oldW; b.y *= H / oldH; b.r = R; }
  }
  const slotXY = i => { const row = Math.floor(i / COLS), col = i % COLS; return [col * slotW + slotW / 2, top0 + row * rowH + rowH * .55]; };

  // ---- input
  const show = (t, ms = 0) => { screen.textContent = t; msgT = ms ? performance.now() + ms : 0; };
  function press(k) {
    seq = (seq + k).slice(-6);
    if (seq === "ASAAAB") { fresh(); seq = ""; typed = ""; show("FULL!", 1500); $("req").hidden = true; track("shop-reset-code"); return; }
    if (k === "S") return;
    if (k === "CLR") { typed = ""; show("SELECT"); return; }
    if (vending) return;
    if (ROWS.includes(k)) { typed = k; show(k + "_"); return; }
    if (/[1-4]/.test(k) && typed.length === 1) {
      const code = typed + k, i = ROWS.indexOf(typed) * COLS + (+k - 1); typed = "";
      if (stock[i] <= 0) { show("SOLD OUT", 1400); return; }
      show(code + " ⟳"); vending = { i, t: 0 }; track("shop-vend");
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

  // ---- draw
  function coil(x, y, w, phase) {
    g.lineWidth = Math.max(1.2, w * .03); g.strokeStyle = "#c9d1d6";
    g.beginPath(); for (let t = 0; t <= 1.0001; t += .02) { const px = x - w * .42 + t * w * .84, py = y + R * .75 + Math.sin(t * Math.PI * 2 * 3.5 + phase) * R * .28; t ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
  }
  const emoji = (e, x, y, s, a = 0) => { g.save(); g.translate(x, y); g.rotate(a); g.font = `${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e, 0, 0); g.restore(); };
  function draw(now) {
    g.clearRect(0, 0, W, H);
    for (let row = 0; row < ROWS.length; row++) {   // shelves + labels
      const y = top0 + row * rowH + rowH * .95;
      g.fillStyle = "#3b4146"; g.fillRect(4, y, W - 8, 3);
      g.fillStyle = "#9aa3a0"; g.font = `800 ${Math.max(9, rowH * .14)}px system-ui, sans-serif`; g.textAlign = "center";
      for (let c = 0; c < COLS; c++) g.fillText(ROWS[row] + (c + 1), c * slotW + slotW / 2, y + rowH * .13);
    }
    for (let i = 0; i < ITEMS.length; i++) {
      const [x, y] = slotXY(i); let ph = 0, fwd = 0;
      if (vending && vending.i === i) { ph = vending.t * Math.PI * 4; fwd = Math.min(1, vending.t / .9); }
      if (stock[i] > 0) { if (stock[i] > 1) { g.globalAlpha = .35; emoji(ITEMS[i], x + R * .25, y - R * .1, R * 1.25); g.globalAlpha = 1; } emoji(ITEMS[i], x, y + fwd * R * .3, R * 1.5 * (1 + fwd * .18)); }
      coil(x, y, slotW, ph);
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
    if (msgT && now > msgT) { msgT = 0; show(typed ? typed + "_" : "SELECT"); }
    draw(now); requestAnimationFrame(frame);
  }
  const room = document.querySelector('.room'); const fit = () => { room.style.height = Math.max(480, innerHeight - room.getBoundingClientRect().top - scrollY) + 'px'; }; fit(); addEventListener('resize', fit); setTimeout(() => { fit(); layout(); }, 400);
  layout(); load(); bodies.forEach(b => { b.born = 0; b.r = R; });
  $("req").hidden = !stock.every(s => s <= 0);
  show("SELECT"); addEventListener("resize", layout); requestAnimationFrame(frame);
  window.__vend = { press, get stock() { return stock; }, get bodies() { return bodies; } };   // for testing
})();
