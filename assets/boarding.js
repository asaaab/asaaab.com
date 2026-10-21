// Share the passport → it gets a red ASAAAB stamp → a boarding pass to the hangar prints out of a slot.
(() => {
const HANGAR = "https://discord.gg/e7FUMwjNah";
const card = document.querySelector(".card.passport"), share = document.getElementById("share");
if (!card || !share) return;
const $ = id => document.getElementById(id);
const txt = id => ($(id) && $(id).textContent.trim()) || "";

// ink roughness for the stamp
document.body.insertAdjacentHTML("beforeend", `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="bpInk"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6"/><feComposite in="SourceGraphic" operator="in"/></filter></svg>`);

const today = new Date(), MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][today.getMonth()];
const dateStr = `${MON} ${String(today.getDate()).padStart(2, "0")} ${today.getFullYear()}`;
const stamp = document.createElement("div"); stamp.className = "bp-stamp"; stamp.setAttribute("aria-hidden", "true");
stamp.innerHTML = `<svg viewBox="0 0 150 104"><ellipse cx="75" cy="52" rx="71" ry="48" fill="none" stroke="currentColor" stroke-width="4"/><ellipse cx="75" cy="52" rx="63" ry="40" fill="none" stroke="currentColor" stroke-width="1.6"/>
<text x="75" y="58" text-anchor="middle" font-family="Overpass, Arial Narrow, sans-serif" font-weight="900" font-size="30" letter-spacing="1.5" fill="currentColor">ASAAAB</text>
<text x="75" y="76" text-anchor="middle" font-family="Share Tech Mono, Courier New, monospace" font-size="11" letter-spacing="1" fill="currentColor">${dateStr}</text>
<path d="M75 16 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.8z" fill="currentColor"/></svg>`;
card.appendChild(stamp);

// barcode from the driver number (just looks right)
function barcode(seed){
  let x = 0, bars = "", s = seed * 9301 + 49297;
  while (x < 140) { s = (s * 9301 + 49297) % 233280; const w = 1 + (s % 3); if ((s >> 3) % 3) bars += `<rect x="${x}" y="0" width="${w}" height="30"/>`; x += w + 1 + ((s >> 5) % 2); }
  return `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 30" preserveAspectRatio="none"><g fill="#16191c">${bars}</g></svg>`)}')`;
}
const plane = `<svg viewBox="0 0 24 24"><path fill="#fff" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)"/></svg>`;

const printer = document.createElement("div"); printer.className = "bp-printer"; printer.setAttribute("aria-live", "polite");
share.insertAdjacentElement("afterend", printer);

function fill(){
  const no = txt("ppNo") || "0000", n = txt("ppN") || "0";
  const bestEl = $("ppBest"), best = bestEl ? (bestEl.querySelector("b") || bestEl).textContent.trim() : "";
  const seat = String(Math.max(1, parseInt(n, 10) || 1)) + "A";
  printer.innerHTML = `<div class="bp-slot"></div><div class="bp-feed"><div class="bp-pass" role="img" aria-label="Boarding pass to the asaaab hangar, driver ${no}, ${n} spotted">
    <div class="bp-main">
      <div class="bp-head">${plane}BOARDING PASS</div>
      <div class="bp-route">
        <div><small>FROM</small><b>SPT</b><i>CARSPOTTING!!</i></div>
        <div class="bp-arc"><svg viewBox="0 0 100 34" preserveAspectRatio="none"><path d="M2 30 Q50 -6 98 30" fill="none" stroke="#16191c" stroke-width="1.6" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/></svg></div>
        <div class="to"><small>TO</small><b>HGR</b><i>THE HANGAR</i></div>
      </div>
      <div class="bp-grid">
        <div><small>PASSENGER</small><b>#${no}</b></div>
        <div><small>FLIGHT</small><b>A93X</b></div>
        <div><small>SEAT</small><b>${seat}</b></div>
        <div><small>SPOTTED</small><b>${n}</b></div>
        <div class="wide"><small>RAREST FIND</small><b>${best || "—"}</b></div>
        <div class="wide"><small>GATE</small><b>#passport-control</b></div>
      </div>
      <div class="bp-fine">GATE CLOSES WHEN THE HANGAR FILLS UP</div>
    </div>
    <div class="bp-stub">
      <div class="bp-head">BOARDING PASS</div>
      <div class="bp-grid">
        <div><small>FROM</small><b>SPT</b></div><div><small>TO</small><b>HGR</b></div>
        <div><small>SEAT</small><b>${seat}</b></div><div><small>DATE</small><b>${dateStr.slice(0, 6)}</b></div>
      </div>
      <div class="bp-code" style="background-image:${barcode(parseInt(no, 10) || 7)}; background-size:100% 100%"></div>
    </div>
  </div></div>
  <a class="cta bp-go" href="${HANGAR}" target="_blank" rel="noopener" data-t="boarding">Board: post it in #passport-control</a>`;
}

let printed = false;
const panel = $("sharePanel");
if (panel) panel.scrollIntoView = function(){ if (!card.classList.contains("bp-wait")) Element.prototype.scrollIntoView.apply(this, arguments); };
// scroll only inside the passport card (scrolling the page would drive the car)
const inCard = (el, end) => { const c = card.getBoundingClientRect(), r = el.getBoundingClientRect();
  card.scrollTo({ top: card.scrollTop + (end ? r.bottom - c.bottom + 12 : r.top - c.top - 12), behavior: smooth }); };
const smooth = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
share.addEventListener("click", () => {
  // the normal share (copy caption + save image) still runs; its panel waits until the pass has printed
  card.classList.add("bp-wait");
  card.scrollTo({ top: 0, behavior: smooth });
  setTimeout(() => { card.classList.remove("stamped"); void card.offsetWidth; card.classList.add("stamped"); }, 380);
  setTimeout(() => {
    if (!printed) { printed = true; fill(); printer.classList.add("on");
      printer.style.setProperty("--h", printer.querySelector(".bp-pass").offsetHeight + "px"); }
    printer.classList.remove("printed"); void printer.offsetWidth;
    inCard(printer, false);
    requestAnimationFrame(() => printer.classList.add("printed"));
    try { window.goatcounter && goatcounter.count({ path: "boarding-pass-printed", event: true }); } catch (e) {}
    setTimeout(() => { const go = printer.querySelector(".bp-go"); go && inCard(go, true); }, 2450);
    setTimeout(() => card.classList.remove("bp-wait"), 2900);
  }, 1500);
});
})();
