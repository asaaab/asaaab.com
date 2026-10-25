// THE VAULT. Captain whimZ, 10/25 12:57pm: "Not maxxing enough. The entire screen is a lock that you scroll letters and
// numbers and try the lock. Whimsy maxxing." / "Secret agent" vibes. Original art, all code.
// The whole screen is a vault door. Scroll each dial to a letter or number, then TRY THE LOCK.
// It feeds the page's normal code box underneath, so the Worker check is unchanged. "type it instead" still works
// (password managers, odd characters). Only the number of dials is remembered on this device, never the code.
(() => {
  const form = document.getElementById("pinform"), pin = document.getElementById("pin"), state = document.getElementById("pinstate"), gate = document.getElementById("gate");
  if (!form || !pin || !gate) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(""), H = 58;
  let count = 6; try { count = Math.min(16, Math.max(1, +localStorage.getItem("vault-dials") || 6)); } catch (e) {}
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  const css = document.createElement("style");
  css.textContent = `
  .vault{position:fixed;inset:0;z-index:60;display:grid;place-items:center;overflow:hidden;perspective:1400px;font-family:Nunito,system-ui,sans-serif;
    background:radial-gradient(circle at 50% 40%,#173a63 0%,#0a1a33 55%,#040b18 100%);color:#e9f4ff}
  .vault[hidden]{display:none!important}
  .v-grid{position:absolute;inset:0;background:linear-gradient(rgba(80,180,255,.07) 1px,transparent 1px) 0 0/34px 34px,linear-gradient(90deg,rgba(80,180,255,.07) 1px,transparent 1px) 0 0/34px 34px;pointer-events:none}
  .v-scan{position:absolute;left:0;right:0;height:120px;top:-120px;background:linear-gradient(180deg,rgba(90,200,255,0),rgba(90,200,255,.09),rgba(90,200,255,0));animation:vscan 4.5s linear infinite;pointer-events:none}
  @keyframes vscan{to{top:100%}}
  .v-top{position:absolute;top:max(14px,env(safe-area-inset-top));left:0;right:0;text-align:center;font:900 13px/1.3 ui-monospace,Menlo,monospace;letter-spacing:.32em;color:#7fd3ff;text-shadow:0 0 10px rgba(80,190,255,.7)}
  .v-top b{display:block;font:900 clamp(22px,6vw,34px)/1.1 Nunito,system-ui,sans-serif;letter-spacing:.06em;color:#fff;text-shadow:0 2px 0 #0b2b55,0 0 18px rgba(120,210,255,.6)}
  .v-door{position:relative;width:min(92vmin,640px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;transform-origin:3% 50%;
    background:radial-gradient(circle at 50% 30%,#eef3f8 0%,#b9c6d3 38%,#7d8ea0 72%,#58697b 100%);
    box-shadow:0 0 0 10px #2a3c52,0 0 0 18px #13233a,0 30px 80px rgba(0,0,0,.6),inset 0 6px 0 rgba(255,255,255,.7),inset 0 -14px 30px rgba(10,30,60,.45);
    transition:transform 1.1s cubic-bezier(.6,0,.25,1)}
  .vault.open .v-door{transform:rotateY(-104deg)}
  .vault.open{animation:vgone .5s ease-in 1.15s forwards}
  @keyframes vgone{to{opacity:0}}
  .v-bolt{position:absolute;width:5.5%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#a9b6c3 55%,#5d6d7e);box-shadow:0 2px 3px rgba(0,0,0,.35)}
  .v-ring{position:absolute;inset:7%;border-radius:50%;border:3px dashed rgba(30,60,95,.35);animation:vspin 60s linear infinite}
  @keyframes vspin{to{transform:rotate(360deg)}}
  .v-face{position:relative;width:84%;display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 0}
  .v-light{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#ffd54a 45%,#c98a00);box-shadow:0 0 14px #ffcf3a}
  .vault.no .v-light{background:radial-gradient(circle at 40% 35%,#fff,#ff5a6e 45%,#a3001b);box-shadow:0 0 22px #ff2a4a}
  .vault.yes .v-light{background:radial-gradient(circle at 40% 35%,#fff,#5dff8f 45%,#00a33a);box-shadow:0 0 22px #2aff6a}
  .v-dials{display:flex;gap:6px;padding:12px 12px;border-radius:22px;max-width:100%;overflow-x:auto;scrollbar-width:none;
    background:linear-gradient(180deg,#0c1d33,#15304f);box-shadow:inset 0 3px 10px rgba(0,0,0,.6),0 2px 0 rgba(255,255,255,.6)}
  .v-dials::-webkit-scrollbar{display:none}
  .vault.no .v-dials{animation:vshake .5s}
  @keyframes vshake{20%{transform:translateX(-12px)}40%{transform:translateX(10px)}60%{transform:translateX(-7px)}80%{transform:translateX(4px)}}
  .v-col{display:flex;flex-direction:column;align-items:center;gap:2px;flex:none}
  .v-col button{all:unset;cursor:pointer;width:38px;height:20px;display:grid;place-items:center;color:#7fd3ff;font-size:13px;border-radius:8px}
  .v-col button:focus-visible{outline:2px solid #7fd3ff}
  .v-dial{position:relative;width:40px;height:${H * 2.2}px;overflow-y:scroll;scroll-snap-type:y mandatory;scrollbar-width:none;border-radius:12px;outline:none;
    background:linear-gradient(180deg,#5b6b7c 0%,#e9eef3 28%,#fff 50%,#e9eef3 72%,#5b6b7c 100%);box-shadow:inset 0 0 0 2px rgba(10,30,60,.5)}
  .v-dial::-webkit-scrollbar{display:none}
  .v-dial:focus-visible{box-shadow:inset 0 0 0 2px rgba(10,30,60,.5),0 0 0 3px #7fd3ff}
  .v-dial b{display:block;height:${H}px;line-height:${H}px;text-align:center;scroll-snap-align:center;font:900 26px ui-monospace,Menlo,monospace;color:#0b2342}
  .v-dial i{display:block;height:${(H * 2.2 - H) / 2}px}
  .v-win{position:absolute;left:0;right:0;top:50%;height:${H}px;transform:translateY(-50%);pointer-events:none;border-radius:8px;
    border-top:2px solid rgba(255,190,40,.9);border-bottom:2px solid rgba(255,190,40,.9);background:rgba(255,210,80,.12)}
  .v-colwrap{position:relative}
  .v-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center}
  .v-try{all:unset;cursor:pointer;padding:16px 34px;border-radius:999px;font:900 clamp(17px,4.4vw,22px) Nunito,system-ui,sans-serif;letter-spacing:.08em;color:#fff;
    background:radial-gradient(circle at 50% 25%,#ff9ad9 0%,#ff4fb8 45%,#c21d86 100%);box-shadow:0 8px 0 #7a0f55,0 14px 26px rgba(194,29,134,.5),inset 0 2px 0 rgba(255,255,255,.6);transition:transform .1s}
  .v-try:active{transform:translateY(6px);box-shadow:0 2px 0 #7a0f55,0 6px 14px rgba(194,29,134,.4),inset 0 2px 0 rgba(255,255,255,.6)}
  .v-try:focus-visible{outline:3px solid #fff;outline-offset:4px}
  .v-small{all:unset;cursor:pointer;padding:7px 13px;border-radius:999px;font:900 13px Nunito,system-ui,sans-serif;color:#0b2342;background:linear-gradient(180deg,#fff,#c9d4df);box-shadow:0 3px 0 #6d7d8e}
  .v-small:focus-visible{outline:2px solid #7fd3ff}
  .v-msg{min-height:20px;font:900 13px ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#0b2342;text-align:center}
  .vault.no .v-msg{color:#c4001f}
  .v-wheel{position:absolute;right:-2%;top:50%;width:13%;aspect-ratio:1;transform:translateY(-50%);border-radius:50%;border:6px solid #3b4e64;background:radial-gradient(circle,#c4cfda 0 28%,transparent 30%)}
  .v-wheel::before,.v-wheel::after{content:"";position:absolute;left:50%;top:-14%;width:16%;height:128%;margin-left:-8%;border-radius:8px;background:#3b4e64}
  .v-wheel::after{transform:rotate(90deg)}
  .vault.trying .v-wheel{animation:vspin .8s linear infinite}
  .vault.open .v-wheel{animation:vspin .35s linear 2}
  .v-type{position:absolute;bottom:max(14px,env(safe-area-inset-bottom));left:0;right:0;text-align:center}
  .v-type button{all:unset;cursor:pointer;font:800 13px Nunito,system-ui,sans-serif;color:#7fd3ff;text-decoration:underline}
  .v-back{position:fixed;z-index:61;top:12px;right:12px}
  @media (max-width:520px){.v-door{width:min(98vw,98vmin)}.v-face{gap:8px;width:80%}.v-try{padding:12px 24px}.v-dial{width:34px;height:${H * 1.8}px}.v-dial i{height:${(H * 1.8 - H) / 2}px}.v-dial b{font-size:22px}.v-col button{width:32px}.v-wheel{display:none}}
  @media (prefers-reduced-motion:reduce){.v-scan,.v-ring,.vault.trying .v-wheel{animation:none}.v-door{transition:none}.vault.open{animation:vgone .2s forwards}}`;
  document.head.append(css);

  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const vault = el("div", "vault"); vault.setAttribute("role", "dialog"); vault.setAttribute("aria-label", "Tower vault: dial in your code");
  vault.append(el("div", "v-grid"), el("div", "v-scan"));
  const top = el("div", "v-top", "AGENT ACCESS ONLY"); top.prepend(el("b", "", "asaaab HQ vault")); vault.append(top);
  const door = el("div", "v-door");
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, b = el("span", "v-bolt"); b.style.left = (50 + 46 * Math.cos(a) - 2.75) + "%"; b.style.top = (50 + 46 * Math.sin(a) - 2.75) + "%"; door.append(b); }
  door.append(el("div", "v-ring"), el("div", "v-wheel"));
  const face = el("div", "v-face");
  const light = el("div", "v-light");
  const dialsBox = el("div", "v-dials");
  const msg = el("div", "v-msg", "SCROLL THE DIALS"); msg.setAttribute("role", "status");
  const rowA = el("div", "v-row");
  const minus = el("button", "v-small", "− dial"), plus = el("button", "v-small", "+ dial");
  minus.type = plus.type = "button"; minus.setAttribute("aria-label", "Remove a dial"); plus.setAttribute("aria-label", "Add a dial");
  rowA.append(minus, plus);
  const tryB = el("button", "v-try", "TRY THE LOCK"); tryB.type = "button";
  face.append(light, dialsBox, rowA, tryB, msg);
  door.append(face); vault.append(door);
  const typeRow = el("div", "v-type"), typeB = el("button", "", "type it instead"); typeB.type = "button";
  const newB = el("a", "", "new here?"); newB.href = "/tower/join/"; newB.style.cssText = "margin-left:18px;font:800 13px Nunito,system-ui,sans-serif;color:#ffd54a";
  typeRow.append(typeB, newB); vault.append(typeRow);
  document.body.append(vault);

  // back to the vault from the typing box
  const back = el("button", "v-small v-back", "🔐 vault"); back.type = "button"; back.hidden = true; document.body.append(back);

  let dials = [];
  function makeDial(){
    const col = el("div", "v-col"), up = el("button", "", "▲"), dn = el("button", "", "▼"), wrap = el("div", "v-colwrap"), d = el("div", "v-dial");
    up.type = dn.type = "button"; up.tabIndex = dn.tabIndex = -1; up.setAttribute("aria-hidden", "true"); dn.setAttribute("aria-hidden", "true");
    d.tabIndex = 0; d.setAttribute("role", "spinbutton"); d.setAttribute("aria-label", "Dial");
    d.append(el("i")); for (const c of CH) d.append(el("b", "", c)); d.append(el("i"));
    wrap.append(d, el("div", "v-win")); col.append(up, wrap, dn);
    const idx = () => Math.max(0, Math.min(CH.length - 1, Math.round(d.scrollTop / H)));
    const go = (n, smooth) => d.scrollTo({top: ((n % CH.length + CH.length) % CH.length) * H, behavior: smooth && !calm ? "smooth" : "auto"});
    let last = -1, t;
    d.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(() => { const i = idx(); d.setAttribute("aria-valuetext", CH[i]); if (i !== last) { last = i; buzz(5); } vault.classList.remove("no"); }, 60); });
    up.onclick = () => go(idx() - 1, true); dn.onclick = () => go(idx() + 1, true);
    d.addEventListener("keydown", e => {
      if (e.key === "ArrowUp") { e.preventDefault(); go(idx() - 1, true); }
      else if (e.key === "ArrowDown") { e.preventDefault(); go(idx() + 1, true); }
      else if (e.key === "Enter") { e.preventDefault(); attempt(); }
      else if (/^[a-z0-9]$/i.test(e.key)) { e.preventDefault(); go(CH.indexOf(e.key.toUpperCase()), true); const nx = dials[dials.indexOf(o) + 1]; if (nx) nx.d.focus(); }
    });
    const o = {col, d, idx, go}; requestAnimationFrame(() => go(Math.floor(Math.random() * CH.length), false));
    return o;
  }
  function setCount(n){
    count = Math.max(1, Math.min(16, n)); try { localStorage.setItem("vault-dials", count); } catch (e) {}
    while (dials.length < count) { const o = makeDial(); dials.push(o); dialsBox.append(o.col); }
    while (dials.length > count) dials.pop().col.remove();
    minus.disabled = count <= 1; plus.disabled = count >= 16;
  }
  minus.onclick = () => setCount(count - 1); plus.onclick = () => setCount(count + 1);
  setCount(count);

  let trying = false;
  function attempt(){
    if (trying) return;
    const code = dials.map(o => CH[o.idx()]).join("");
    trying = true; vault.classList.remove("no", "yes"); vault.classList.add("trying"); msg.textContent = "CHECKING CLEARANCE…"; buzz(12);
    pin.value = code; form.requestSubmit();
  }
  tryB.onclick = attempt;

  function win(){
    trying = false; vault.classList.remove("trying"); vault.classList.add("yes", "open"); msg.textContent = "ACCESS GRANTED, AGENT"; buzz([10, 40, 18, 40, 30]);
    setTimeout(() => { vault.hidden = true; vault.classList.remove("open", "yes"); back.hidden = true; }, calm ? 250 : 1700);
  }
  function lose(text){
    trying = false; vault.classList.remove("trying", "no"); void vault.offsetWidth; vault.classList.add("no");
    msg.textContent = /can't/i.test(text) ? "TOWER OFFLINE. TRY AGAIN" : "ACCESS DENIED, AGENT"; buzz([40, 40, 40]);
  }
  new MutationObserver(() => {
    if (gate.hidden) { if (trying) win(); else if (!vault.classList.contains("open")) { vault.hidden = true; back.hidden = true; } }
    else { vault.hidden = false; back.hidden = true; vault.classList.remove("open", "yes", "trying"); msg.textContent = "SCROLL THE DIALS"; }
  }).observe(gate, {attributes: true, attributeFilter: ["hidden"]});
  if (state) new MutationObserver(() => { if (trying && /didn|can't|expired/i.test(state.textContent)) lose(state.textContent); }).observe(state, {childList: true, characterData: true, subtree: true});

  typeB.onclick = () => { vault.hidden = true; back.hidden = false; pin.focus(); };
  back.onclick = () => { vault.hidden = false; back.hidden = true; };
  // start hidden if the page already cleared you (saved code this session)
  vault.hidden = gate.hidden;
})();
