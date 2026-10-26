// THE PURPLE BUDDY. A hand-holding overlay that walks the Captain through every click, on any web page.
// Captain whimZ, 10/25: "he is a handholding device that walks throgh every step. he has already existed helping in
// chrome overlays with bithub nonsense. brilliantly. LOCK IN"
// How to summon (any Claude with a browser tool): paste this whole file into the page's JavaScript tool, then call
//   asaaabBuddy.start({title: "Share the folder", steps: [{find: "Settings", say: "Click Settings"}, ...]})
// find = a CSS selector OR the visible text of the thing to click (button, link, tab, label). Optional: say = the line to show.
// The buddy points with a glowing purple ring, shows one step at a time, and moves on when the Captain hits "next".
// It never clicks for him, never types, never reads secrets. Drag and fling it anywhere. plan.face = an image URL swaps in the Captain's own button art.
(() => {
  if (window.asaaabBuddy) { window.asaaabBuddy.stop(); }
  const P = "asaaab-buddy";
  const css = document.createElement("style"); css.id = P + "-css";
  // Look (Captain whimZ, 10/25 4:03pm): laser red like the 9-3X, and the bubble feels like the asaaab site's
  // fantastic-contraption menu (silver chrome frame, sky window, grassy hill). He can drop in his own button art (plan.face).
  const RED = "#e2302f", RED2 = "#a3141a";
  css.textContent = `
  #${P}-ring{position:fixed;z-index:2147483646;pointer-events:none;border-radius:18px;border:4px solid ${RED};
    box-shadow:0 0 0 6px rgba(226,48,47,.22),0 0 28px 8px rgba(226,48,47,.5);transition:all .25s ease;animation:${P}-pulse 1.3s ease-in-out infinite}
  @keyframes ${P}-pulse{50%{box-shadow:0 0 0 12px rgba(226,48,47,.1),0 0 42px 14px rgba(255,90,80,.7)}}
  #${P}{position:fixed;z-index:2147483647;right:22px;bottom:22px;width:min(350px,calc(100vw - 44px));padding:9px;border-radius:30px;touch-action:none;
    font:800 15px/1.4 Nunito,system-ui,-apple-system,Segoe UI,sans-serif;color:#0d2b3e;cursor:grab;user-select:none;
    background:linear-gradient(180deg,#fdfdfd 0%,#cfd6dc 45%,#f3f5f7 55%,#b9c2ca 100%);
    box-shadow:0 14px 34px rgba(70,90,110,.35),inset 0 1px 0 #fff;animation:${P}-bob 6s ease-in-out infinite}
  #${P}.bd-drag{cursor:grabbing;animation:none}
  @keyframes ${P}-bob{50%{translate:0 -4px}}
  #${P} .bd-win{position:relative;overflow:hidden;border-radius:22px;padding:14px 14px 12px 14px;
    background:radial-gradient(circle at 90% 6%,rgba(255,236,90,.95) 0,rgba(255,226,60,.4) 34px,rgba(255,226,60,0) 80px),
      linear-gradient(180deg,#1fa8ff 0%,#6fd0ff 22%,#bfeeff 44%,#f2fdff 62%,#f6fff0 100%);
    box-shadow:inset 0 0 0 1px rgba(0,0,0,.12),inset 0 0 18px rgba(0,60,120,.22)}
  #${P} .bd-win::before{content:"";position:absolute;left:-20%;right:-20%;bottom:-62px;height:96px;border-radius:50%;
    background:radial-gradient(ellipse at 50% 30%,#b6ef8a 0%,#5fc934 72%);opacity:.9}
  #${P} .bd-win::after{content:"";position:absolute;left:0;right:0;top:0;height:40%;pointer-events:none;border-radius:22px 22px 50% 50%/22px 22px 18px 18px;
    background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0))}
  #${P} .bd-win > *{position:relative;z-index:1}
  #${P} .bd-face{position:absolute;z-index:2;left:-16px;top:-18px;width:52px;height:52px;border-radius:50%;background-size:cover;background-position:center;
    background-color:transparent;background-image:radial-gradient(circle at 35% 28%,#fff 0,#ff8a80 18%,${RED} 52%,${RED2} 100%);
    box-shadow:0 5px 14px rgba(163,20,26,.45),inset 0 -4px 8px rgba(0,0,0,.2)}
  #${P} .bd-face.bd-art::before,#${P} .bd-face.bd-art::after{display:none}
  #${P} .bd-face::before,#${P} .bd-face::after{content:"";position:absolute;top:19px;width:7px;height:10px;border-radius:4px;background:#2b0608}
  #${P} .bd-face::before{left:16px}#${P} .bd-face::after{right:16px}
  #${P} .bd-top{display:flex;justify-content:space-between;align-items:center;margin:0 0 6px 34px;font:900 12px/1 Nunito,system-ui,sans-serif;letter-spacing:.06em;color:#06518a;text-transform:uppercase;text-shadow:0 1px 0 #fff}
  #${P} .bd-x{all:unset;cursor:pointer;font:900 16px/1 system-ui;color:#06518a;padding:2px 6px}
  #${P} .bd-say{font-size:17px;font-weight:900;margin:2px 0 10px;color:#0d2b3e;text-shadow:0 1px 0 rgba(255,255,255,.8)}
  #${P} .bd-miss{font-size:13px;color:${RED2};margin:-4px 0 8px}
  #${P} .bd-bar{height:9px;border-radius:99px;background:rgba(255,255,255,.7);box-shadow:inset 0 1px 3px rgba(0,40,80,.25);overflow:hidden;margin-bottom:12px}
  #${P} .bd-bar i{display:block;height:100%;background:linear-gradient(180deg,#ff8a80,${RED} 60%,${RED2});border-radius:99px;transition:width .3s}
  #${P} .bd-row{display:flex;gap:8px;justify-content:flex-end}
  #${P} button.bd-b{all:unset;cursor:pointer;padding:9px 17px;border-radius:999px;font:900 14px Nunito,system-ui,sans-serif}
  #${P} button.bd-back{color:#06518a;background:linear-gradient(180deg,#fff,#d6dde3);box-shadow:0 2px 0 #9aa6b2,inset 0 1px 0 #fff}
  #${P} button.bd-next{color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.25);background:radial-gradient(circle at 50% 18%,#ffb3ad 0,#ff5a50 30%,${RED} 60%,${RED2} 100%);
    box-shadow:0 4px 0 #6e0b10,0 8px 16px rgba(163,20,26,.4),inset 0 1px 0 rgba(255,255,255,.6)}
  #${P} button.bd-next:active{translate:0 3px;box-shadow:0 1px 0 #6e0b10,0 4px 10px rgba(163,20,26,.35)}
  .${P}-bub{position:fixed;z-index:2147483647;bottom:-60px;border-radius:50%;pointer-events:none;
    background:radial-gradient(circle at 35% 30%,#fff,rgba(255,138,128,.85) 40%,rgba(226,48,47,.55));animation:${P}-rise 2.6s ease-out forwards}
  @keyframes ${P}-rise{to{transform:translateY(-110vh) translateX(var(--dx));opacity:0}}
  @media (prefers-reduced-motion:reduce){#${P},#${P}-ring{animation:none}}`;
  document.head.append(css);
  const ring = document.createElement("div"); ring.id = P + "-ring"; ring.hidden = true;
  const box = document.createElement("div"); box.id = P; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "asaaab buddy");
  box.innerHTML = `<div class="bd-face"></div><div class="bd-win"><div class="bd-top"><span class="bd-t"></span><button class="bd-x" aria-label="close buddy">×</button></div>
    <div class="bd-say"></div><div class="bd-miss" hidden>Can't spot it on screen yet. Scroll a little, or it may be on the next page.</div>
    <div class="bd-bar"><i></i></div><div class="bd-row"><button class="bd-b bd-back">back</button><button class="bd-b bd-next">next →</button></div></div>`;
  document.body.append(ring, box);
  const $ = s => box.querySelector(s);

  // Fling it around the place (Captain, 10/25): grab the bubble anywhere but the buttons, drag, let go and it glides.
  let drag = null, vx = 0, vy = 0, raf = 0;
  const place = (x, y) => { const w = box.offsetWidth, h = box.offsetHeight;
    x = Math.max(4, Math.min(innerWidth - w - 4, x)); y = Math.max(4, Math.min(innerHeight - h - 4, y));
    Object.assign(box.style, {left: x + "px", top: y + "px", right: "auto", bottom: "auto"}); return [x, y]; };
  box.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; cancelAnimationFrame(raf);
    const r = box.getBoundingClientRect(); drag = {dx: e.clientX - r.left, dy: e.clientY - r.top, lx: e.clientX, ly: e.clientY, t: performance.now()};
    vx = vy = 0; box.classList.add("bd-drag"); box.setPointerCapture(e.pointerId); });
  box.addEventListener("pointermove", e => { if (!drag) return; const now = performance.now(), dt = Math.max(1, now - drag.t);
    vx = (e.clientX - drag.lx) / dt * 16; vy = (e.clientY - drag.ly) / dt * 16; drag.lx = e.clientX; drag.ly = e.clientY; drag.t = now;
    place(e.clientX - drag.dx, e.clientY - drag.dy); });
  box.addEventListener("pointerup", () => { if (!drag) return; drag = null; box.classList.remove("bd-drag");
    const glide = () => { const r = box.getBoundingClientRect(); let x = r.left + vx, y = r.top + vy;
      if (x < 4 || x > innerWidth - r.width - 4) vx = -vx * .6; if (y < 4 || y > innerHeight - r.height - 4) vy = -vy * .6;
      place(x, y); vx *= .93; vy *= .93; if (Math.abs(vx) + Math.abs(vy) > .4) raf = requestAnimationFrame(glide); };
    raf = requestAnimationFrame(glide); });
  let plan = null, i = 0, timer = null;
  function findEl(f){
    if (!f) return null;
    try { const el = document.querySelector(f); if (el) return el; } catch (e) {}
    const want = String(f).trim().toLowerCase();
    const cands = document.querySelectorAll("button,a,[role=button],[role=tab],[role=menuitem],label,summary,input[type=submit],h1,h2,h3,span,div,li");
    let best = null;
    for (const el of cands) {
      if (el.closest("#" + P)) continue;
      const t = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().toLowerCase();
      if (!t) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      if (t === want) return el;
      if (!best && t.includes(want) && t.length < want.length + 40) best = el;
    }
    return best;
  }
  function point(){
    const s = plan.steps[i], el = findEl(s.find);
    $(".bd-miss").hidden = !!el || !s.find;
    if (!el) { ring.hidden = true; return; }
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) el.scrollIntoView({block: "center", behavior: "smooth"});
    ring.hidden = false;
    Object.assign(ring.style, {left: r.left - 8 + "px", top: r.top - 8 + "px", width: r.width + 16 + "px", height: r.height + 16 + "px"});
  }
  function draw(){
    const n = plan.steps.length, s = plan.steps[i];
    $(".bd-t").textContent = (plan.title || "buddy") + " · " + (i + 1) + "/" + n;
    $(".bd-say").textContent = s.say || ("Click " + s.find);
    $(".bd-bar i").style.width = (i / n * 100) + "%";
    $(".bd-back").style.visibility = i ? "visible" : "hidden";
    $(".bd-next").textContent = i === n - 1 ? "done ✓" : "next →";
    point();
  }
  function party(){
    for (let k = 0; k < 16; k++) { const b = document.createElement("i"); b.className = P + "-bub"; const z = 14 + Math.random() * 30;
      b.style.cssText = `width:${z}px;height:${z}px;left:${Math.random() * 100}vw;animation-delay:${Math.random() * .5}s;--dx:${(Math.random() - .5) * 120}px`;
      document.body.append(b); setTimeout(() => b.remove(), 3200); }
  }
  $(".bd-next").onclick = () => {
    if (i < plan.steps.length - 1) { i++; draw(); }
    else { $(".bd-bar i").style.width = "100%"; $(".bd-say").textContent = plan.done || "done. brick laid. 🧱"; ring.hidden = true; party(); $(".bd-row").hidden = true; setTimeout(stop, 3500); }
  };
  $(".bd-back").onclick = () => { if (i) { i--; draw(); } };
  $(".bd-x").onclick = () => stop();
  function stop(){ clearInterval(timer); cancelAnimationFrame(raf); ring.remove(); box.remove(); css.remove(); delete window.asaaabBuddy; }
  window.asaaabBuddy = {
    start(p){ plan = p; i = p.at || 0; if (p.face) { const f = $(".bd-face"); f.classList.add("bd-art"); f.style.backgroundImage = "url(" + JSON.stringify(p.face) + ")"; f.style.borderRadius = "0"; f.style.boxShadow = "none"; } draw(); clearInterval(timer); timer = setInterval(() => plan && point(), 600); return "buddy on: " + p.steps.length + " steps"; },
    go(n){ i = Math.max(0, Math.min(plan.steps.length - 1, n)); draw(); },
    step(){ return i; },
    stop
  };
})();
