// THE GINGERBREAD LOCK. Captain whimZ, 10/25: "get rid of the combo lock thing, we are building a lock screen thats
// android 2.3.7 background tiles vector photon pixel streaks" / "the passcode is the pattern lock".
// 10/25 answers: streaks are lit blocks the size of one studded tile, stepping tile to tile; patterns of 4+ dots.
// Same contract as combo.js: it fills the page's normal code box (#pin) and submits #pinform, so the Worker check is
// unchanged. Dots are numbered 1-9 (top-left to bottom-right); the pattern becomes that digit string.
// The pattern itself is never stored on this device. "type it instead" still works.
(() => {
  const form = document.getElementById("pinform"), pin = document.getElementById("pin"), state = document.getElementById("pinstate"), gate = document.getElementById("gate");
  if (!form || !pin || !gate) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  const T = 34; // one studded tile, px

  const css = document.createElement("style");
  css.textContent = `
  .gb{position:fixed;inset:0;z-index:60;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;
    font-family:"Droid Sans",Roboto,Nunito,system-ui,sans-serif;color:#e8eef2;
    background:radial-gradient(circle at 50% 40%,#1b2a33 0%,#0c1216 70%,#05080a 100%)}
  .gb[hidden]{display:none!important}
  .gb-tiles{position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(circle at 50% 50%,rgba(150,190,210,.22) 0 3px,transparent 3.5px) 0 0/${T}px ${T}px,
      linear-gradient(rgba(120,160,180,.06) 1px,transparent 1px) 0 0/${T}px ${T}px,
      linear-gradient(90deg,rgba(120,160,180,.06) 1px,transparent 1px) 0 0/${T}px ${T}px}
  .gb-streak{position:absolute;width:${T}px;height:${T}px;pointer-events:none;border-radius:3px;
    background:rgba(120,230,255,.55);box-shadow:0 0 14px rgba(120,230,255,.8)}
  .gb-streak.o{background:rgba(255,170,60,.55);box-shadow:0 0 14px rgba(255,170,60,.8)}
  .gb-top{position:absolute;top:max(18px,env(safe-area-inset-top));left:0;right:0;text-align:center}
  .gb-clock{font:300 clamp(44px,13vw,76px)/1 "Droid Sans",Roboto,system-ui,sans-serif;letter-spacing:.02em;text-shadow:0 0 12px rgba(120,230,255,.35)}
  .gb-date{font:400 15px/1.6 system-ui,sans-serif;color:#9fb3bf}
  .gb-msg{margin-top:10px;min-height:22px;font:600 16px system-ui,sans-serif;color:#cfe3ec}
  .gb.no .gb-msg{color:#ff6b6b}
  .gb.yes .gb-msg{color:#7dff9a}
  .gb-pad{position:absolute;left:50%;top:56%;width:min(82vw,340px);aspect-ratio:1;transform:translate(-50%,-50%)}
  .gb-pad svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
  .gb-dot{position:absolute;width:20%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;
    background:radial-gradient(circle,#fff 0 13%,rgba(255,255,255,.2) 15% 40%,transparent 42%);transition:transform .08s}
  .gb-dot.on{transform:translate(-50%,-50%) scale(1.15);
    background:radial-gradient(circle,#fff 0 13%,rgba(110,255,140,.55) 15% 44%,rgba(110,255,140,.15) 46% 60%,transparent 62%)}
  .gb.no .gb-dot.on{background:radial-gradient(circle,#fff 0 13%,rgba(255,90,90,.6) 15% 44%,transparent 46%)}
  .gb-line{fill:none;stroke:rgba(110,255,140,.75);stroke-width:7;stroke-linecap:round;stroke-linejoin:round}
  .gb.no .gb-line{stroke:rgba(255,90,90,.75)}
  .gb.open{animation:gbgone .45s ease-in .5s forwards}
  @keyframes gbgone{to{opacity:0;transform:translateY(-6%)}}
  .gb-type{position:absolute;bottom:max(16px,env(safe-area-inset-bottom));left:0;right:0;text-align:center}
  .gb-type button,.gb-type a{all:unset;cursor:pointer;font:700 13px system-ui,sans-serif;color:#7fd3ff;text-decoration:underline;margin:0 9px}
  .gb-type a{color:#ffd54a}
  .gb-back{position:fixed;z-index:61;top:12px;right:12px;all:unset;cursor:pointer;padding:7px 13px;border-radius:999px;
    font:800 13px system-ui,sans-serif;color:#0b2342;background:linear-gradient(180deg,#fff,#c9d4df)}
  @media (prefers-reduced-motion:reduce){.gb.open{animation:gbgone .15s forwards}}`;
  document.head.append(css);

  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const gb = el("div", "gb"); gb.setAttribute("role", "dialog"); gb.setAttribute("aria-label", "Tower lock: draw your pattern");
  gb.append(el("div", "gb-tiles"));
  const top = el("div", "gb-top"), clock = el("div", "gb-clock"), date = el("div", "gb-date"), msg = el("div", "gb-msg", "Draw pattern to unlock");
  msg.setAttribute("role", "status"); top.append(clock, date, msg); gb.append(top);
  const pad = el("div", "gb-pad"), NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg"), line = document.createElementNS(NS, "polyline");
  svg.setAttribute("viewBox", "0 0 100 100"); line.setAttribute("class", "gb-line"); line.setAttribute("vector-effect", "non-scaling-stroke");
  svg.append(line); pad.append(svg);
  const POS = [17, 50, 83], dots = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const d = el("div", "gb-dot"); d.style.left = POS[c] + "%"; d.style.top = POS[r] + "%"; pad.append(d); dots.push({d, x: POS[c], y: POS[r]});
  }
  gb.append(pad);
  const typeRow = el("div", "gb-type"), typeB = el("button", "", "type it instead"), newB = el("a", "", "new here?");
  typeB.type = "button"; newB.href = "/tower/join/"; typeRow.append(typeB, newB); gb.append(typeRow);
  document.body.append(gb);
  const back = el("button", "gb-back", "🔒 lock screen"); back.type = "button"; back.hidden = true; document.body.append(back);

  // the clock, Gingerbread-style
  const tick = () => { const n = new Date(); clock.textContent = n.toLocaleTimeString([], {hour: "numeric", minute: "2-digit"}).replace(/\s?[AP]M/i, "");
    date.textContent = n.toLocaleDateString([], {weekday: "long", month: "long", day: "numeric"}); };
  tick(); setInterval(tick, 10000);

  // photon streaks: tile-sized lit blocks stepping tile to tile
  if (!calm) {
    const streak = () => {
      if (gb.hidden || document.hidden) return;
      const s = el("div", "gb-streak" + (Math.random() < .35 ? " o" : "")), across = Math.random() < .5;
      const cols = Math.ceil(innerWidth / T), rows = Math.ceil(innerHeight / T);
      let x = across ? 0 : Math.floor(Math.random() * cols), y = across ? Math.floor(Math.random() * rows) : 0, steps = 0;
      const place = () => { s.style.left = x * T + "px"; s.style.top = y * T + "px"; };
      place(); gb.append(s);
      const id = setInterval(() => { if (across) x++; else y++; steps++; place(); s.style.opacity = String(Math.max(0, 1 - steps / 14));
        if (steps > 14 || x > cols || y > rows) { clearInterval(id); s.remove(); } }, 70);
    };
    setInterval(streak, 700);
  }

  // drawing
  let path = [], drawing = false, trying = false, cur = null;
  const box = () => pad.getBoundingClientRect();
  const toPad = e => { const b = box(); return {x: (e.clientX - b.left) / b.width * 100, y: (e.clientY - b.top) / b.height * 100}; };
  const hit = p => dots.findIndex(o => Math.hypot(o.x - p.x, o.y - p.y) < 12);
  function add(i){
    if (i < 0 || path.includes(i)) return;
    const last = path[path.length - 1];
    if (last != null) { // Android rule: crossing straight over a middle dot picks it up
      const mid = (last + i) / 2, lr = Math.floor(last / 3), lc = last % 3, ir = Math.floor(i / 3), ic = i % 3;
      if (Number.isInteger(mid) && (lr + ir) % 2 === 0 && (lc + ic) % 2 === 0 && !path.includes(mid)) { path.push(mid); dots[mid].d.classList.add("on"); }
    }
    path.push(i); dots[i].d.classList.add("on"); buzz(8);
  }
  function draw(){
    const pts = path.map(i => dots[i].x + "," + dots[i].y);
    if (drawing && cur) pts.push(cur.x + "," + cur.y);
    line.setAttribute("points", pts.join(" "));
  }
  function reset(){ path = []; cur = null; dots.forEach(o => o.d.classList.remove("on")); draw(); }
  pad.addEventListener("pointerdown", e => { if (trying) return; e.preventDefault(); gb.classList.remove("no", "yes"); reset(); drawing = true;
    pad.setPointerCapture(e.pointerId); cur = toPad(e); add(hit(cur)); draw(); msg.textContent = "Release your finger when done"; });
  pad.addEventListener("pointermove", e => { if (!drawing) return; cur = toPad(e); add(hit(cur)); draw(); });
  const end = () => { if (!drawing) return; drawing = false; cur = null; draw();
    if (path.length < 4) { gb.classList.add("no"); msg.textContent = "Connect at least 4 dots. Try again."; buzz([40, 40, 40]); setTimeout(reset, 900); return; }
    attempt(); };
  pad.addEventListener("pointerup", end); pad.addEventListener("pointercancel", end);

  function attempt(){
    trying = true; msg.textContent = "Checking…";
    pin.value = path.map(i => i + 1).join(""); form.requestSubmit();
  }
  function win(){
    trying = false; gb.classList.add("yes", "open"); msg.textContent = "Unlocked"; buzz([10, 40, 18]);
    setTimeout(() => { gb.hidden = true; gb.classList.remove("open", "yes"); back.hidden = true; reset(); }, calm ? 200 : 1000);
  }
  function lose(text){
    trying = false; gb.classList.remove("no"); void gb.offsetWidth; gb.classList.add("no");
    msg.textContent = /can't/i.test(text) ? "Tower offline. Try again." : /lock|423|too many/i.test(text) ? text : "Wrong pattern. Try again.";
    buzz([40, 40, 40]); setTimeout(reset, 1100);
  }
  new MutationObserver(() => {
    if (gate.hidden) { if (trying) win(); else if (!gb.classList.contains("open")) { gb.hidden = true; back.hidden = true; } }
    else { gb.hidden = false; back.hidden = true; gb.classList.remove("open", "yes"); trying = false; msg.textContent = "Draw pattern to unlock"; reset(); }
  }).observe(gate, {attributes: true, attributeFilter: ["hidden"]});
  if (state) new MutationObserver(() => { if (trying && /didn|can't|expired|lock|too many/i.test(state.textContent)) lose(state.textContent.trim()); })
    .observe(state, {childList: true, characterData: true, subtree: true});

  typeB.onclick = () => { gb.hidden = true; back.hidden = false; pin.focus(); };
  back.onclick = () => { gb.hidden = false; back.hidden = true; };
  gb.hidden = gate.hidden;
})();
