// The combo lock. Captain whimZ, 10/25 12:52pm: "Please animate a combo lock scrolling version for no good reason for these codes".
// Pure decoration on top of the normal code box: you still type (or paste) the code. The dials never show the real
// code, so nobody behind you can read it off the lock. Each key spins a dial, "clear in" rolls them all,
// a good code pops the shackle, a wrong one shakes and scrambles.
(() => {
  const form = document.getElementById("pinform"), pin = document.getElementById("pin"), state = document.getElementById("pinstate");
  if (!form || !pin) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const H = 34, N = 4;
  const css = document.createElement("style");
  css.textContent = `
  .cl{position:relative;width:188px;margin:6px auto 14px;user-select:none;pointer-events:none}
  .cl-shackle{display:block;width:118px;height:84px;margin:0 auto -26px;border:15px solid #c9d2da;border-bottom:0;border-radius:60px 60px 0 0;
    background:transparent;box-shadow:inset 0 3px 0 rgba(255,255,255,.7);transition:transform .45s cubic-bezier(.3,1.6,.5,1);transform-origin:20% 100%;
    border-color:#e4e9ee #aab5bf #aab5bf #f4f6f8}
  .cl.open .cl-shackle{transform:translateY(-22px) rotate(-14deg)}
  .cl-body{position:relative;z-index:1;display:flex;justify-content:center;gap:6px;padding:18px 14px;border-radius:28px;
    background:radial-gradient(circle at 50% 18%,#d8b8ff 0%,#9b5cff 55%,#6c2fe0 100%);
    box-shadow:0 10px 24px rgba(108,47,224,.38),inset 0 2px 0 rgba(255,255,255,.55),inset 0 -6px 12px rgba(40,0,110,.3)}
  .cl-body::after{content:"";position:absolute;left:14px;right:14px;top:6px;height:38%;border-radius:22px 22px 50% 50%;background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,0))}
  .cl-dial{position:relative;width:30px;height:${H * 1.6}px;overflow:hidden;border-radius:12px;
    background:linear-gradient(180deg,#9aa6b2 0%,#fdfdfd 30%,#fff 50%,#fdfdfd 70%,#9aa6b2 100%);box-shadow:inset 0 0 0 1.5px rgba(40,0,110,.35)}
  .cl-dial::after{content:"";position:absolute;left:0;right:0;top:50%;height:${H}px;transform:translateY(-50%);border-top:1.5px solid rgba(155,92,255,.55);border-bottom:1.5px solid rgba(155,92,255,.55)}
  .cl-strip{position:absolute;left:0;right:0;top:${(H * 1.6 - H) / 2}px;will-change:transform}
  .cl-strip b{display:block;height:${H}px;line-height:${H}px;text-align:center;font:900 20px Nunito,system-ui,sans-serif;color:#2a1460}
  .cl.shake .cl-body{animation:clshake .45s}
  @keyframes clshake{20%{transform:translateX(-8px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(3px)}}
  .cl-pop{position:fixed;inset:0;z-index:99;display:grid;place-items:center;pointer-events:none;animation:clfade .9s ease-in .55s forwards}
  @keyframes clfade{to{opacity:0;transform:scale(1.15)}}`;
  document.head.append(css);

  const lock = document.createElement("div"); lock.className = "cl"; lock.setAttribute("aria-hidden", "true");
  const shackle = document.createElement("span"); shackle.className = "cl-shackle";
  const body = document.createElement("div"); body.className = "cl-body";
  const dials = [];
  for (let d = 0; d < N; d++) {
    const dial = document.createElement("div"); dial.className = "cl-dial";
    const strip = document.createElement("div"); strip.className = "cl-strip";
    for (let i = 0; i < 40; i++) { const b = document.createElement("b"); b.textContent = i % 10; strip.append(b); }
    dial.append(strip); body.append(dial);
    const o = {strip, at: 10 + Math.floor(Math.random() * 10)}; dials.push(o); place(o, false);
  }
  lock.append(shackle, body);
  if (form.classList.contains("glass")) form.prepend(lock); else form.parentNode.insertBefore(lock, form);   // radar: inside its glass card

  function place(o, anim, ms){
    o.strip.style.transition = anim && !calm ? `transform ${ms || 420}ms cubic-bezier(.2,.9,.25,1.12)` : "none";
    o.strip.style.transform = `translateY(${-o.at * H}px)`;
  }
  function settle(o){ o.at = 10 + (o.at % 10); place(o, false); }   // jump back to the middle copy so the strip never runs out
  function spin(o, ms){
    const target = Math.floor(Math.random() * 10);
    o.at = 20 + target;   // always forward, one turn-ish
    place(o, true, ms); clearTimeout(o.t); o.t = setTimeout(() => settle(o), (ms || 420) + 30);
  }
  let k = 0, rolling = null;
  pin.addEventListener("input", () => { spin(dials[k++ % N]); try { navigator.vibrate && navigator.vibrate(6); } catch (e) {} });
  function roll(){
    stop(); let i = 0;
    rolling = setInterval(() => { const o = dials[i++ % N]; o.at = o.at >= 29 ? 10 + (o.at % 10) : o.at + 1; place(o, true, 110); if (o.at >= 29) setTimeout(() => settle(o), 130); }, 45);
  }
  function stop(){ clearInterval(rolling); rolling = null; }
  form.addEventListener("submit", () => { lock.classList.remove("open", "shake"); if (pin.value.trim()) roll(); }, true);

  function win(){
    stop(); dials.forEach((o, i) => setTimeout(() => spin(o, 380), i * 90));
    const pop = document.createElement("div"); pop.className = "cl-pop";
    const copy = lock.cloneNode(true); pop.append(copy); document.body.append(pop);
    setTimeout(() => { copy.classList.add("open"); try { navigator.vibrate && navigator.vibrate([10, 40, 18]); } catch (e) {} }, calm ? 0 : 420);
    setTimeout(() => pop.remove(), calm ? 300 : 1500);
  }
  function lose(){
    stop(); dials.forEach(o => spin(o, 300));
    lock.classList.remove("shake"); void lock.offsetWidth; lock.classList.add("shake");
    try { navigator.vibrate && navigator.vibrate([30, 30, 30]); } catch (e) {}
  }
  // The page decides if the code cleared; the lock just watches. Gate hides = cleared. "didn't clear" / "Can't reach" = no.
  const gate = document.getElementById("gate");
  if (gate) new MutationObserver(() => { if (gate.hidden && rolling) win(); }).observe(gate, {attributes: true, attributeFilter: ["hidden"]});
  if (state) new MutationObserver(() => { if (rolling && /didn|can't|expired/i.test(state.textContent)) lose(); }).observe(state, {childList: true, characterData: true, subtree: true});
})();
