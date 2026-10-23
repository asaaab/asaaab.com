// Banner-as-menu for asaaab.com. Put <div data-fban="red"></div> at the top of a page.
(function(){
  const V = "1";
  const STRIPS = {
    red:    { top:"#dd0500", bot:"#640200" },
    orange: { top:"#dd3900", bot:"#641900" },
    yellow: { top:"#dda400", bot:"#644900", ink:"#1d1600" },
    green:  { top:"#00dd44", bot:"#00641e", ink:"#00240b" },
    blue:   { top:"#0062dd", bot:"#002d64" },
    purple: { top:"#8600dd", bot:"#3c0064" },
    magenta:{ top:"#d930c9", bot:"#6a1462", noArt:true },
    charcoal:{ top:"#33383d", bot:"#16191c", noArt:true }, // no banner art yet
    glacier:{ top:"#647579", bot:"#2a373a" }, // the Start carspotting button color; menu band only (no banner art yet)
  };
  // one band per page, top to bottom. Each page's banner is its band's color.
  const PAGES = [
    { c:"red",     t:"Carspotting!!",  s:"the best of the TikToks",                    href:"/carspotting/" },
    { c:"orange",  t:"Angelish Crest", s:"BeamNG IRL · the map, the mod, the server",  href:"/beamng/" },
    { c:"yellow",  t:"asaaab.shop",    s:"under construction",                         href:"/shop/" },
    { c:"green",   t:"content strategy", s:"consulting inquiries · the receipts",      href:"/consulting/" },
    { c:"blue",    t:"connections to", s:"YouTube",                                    href:"https://www.youtube.com/@asaaab93x" },
    { c:"purple",  t:"asaaab hangar",  s:"the Discord",                                href:"https://discord.gg/e7FUMwjNah" },
    { c:"charcoal", t:"asaaab, what the hell is that?!", s:"privacy · copyright · resources", href:"/copyright/" },
    { c:"magenta", t:"asaaab co-owner's manual", s:"interested in joining asaaab?",   href:"/manual/", sticker:true },
    { c:"glacier", t:"calm",           s:"a breath of fresh air",                      href:"/calm/", tab:true },
  ];
  const STICKER = `<span aria-hidden="true" style="position:absolute;right:clamp(14px,4vw,48px);top:50%;width:clamp(26px,3.4vw,38px);aspect-ratio:3/4;transform:translateY(-50%) rotate(8deg);border-radius:3px 3px 3px 3px;background:linear-gradient(225deg,transparent 0 28%,rgba(0,0,0,.25) 28% 30%,#e9eef2 30% 44%,#fff 44%),repeating-linear-gradient(#fff 0 6px,#cfd6db 6px 7px);background-blend-mode:normal;box-shadow:0 0 0 2px #fff,0 4px 8px rgba(0,0,0,.3);pointer-events:none"></span>`;
  const ASSET = (document.currentScript && document.currentScript.src.replace(/bannerfold\.js.*$/, "")) || "/assets/";
  const art = c => `${ASSET}strips/${c}.webp?v=${V}`;
  const vars = c => `--top:${STRIPS[c].top};--bot:${STRIPS[c].bot}` + `;--fink:${STRIPS[c].ink || "#fff"}`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof window.FBAN_DEMO === "function") PAGES.forEach(p => p.href = window.FBAN_DEMO(p)); // mockup only
  const here = location.pathname.replace(/index\.html$/, "");
  const face = c => `<span class="fface"><span class="wrap">${STRIPS[c].noArt ? "" : `<img class="art" src="${art(c)}" alt="" width="600" height="600" decoding="async">`}</span></span>`;
  const store = { get(k){ try { return sessionStorage.getItem(k); } catch(e){ return null; } }, set(k,v){ try { sessionStorage.setItem(k,v); } catch(e){} }, del(k){ try { sessionStorage.removeItem(k); } catch(e){} } };

  function build(host){
    const color = STRIPS[host.dataset.fban] ? host.dataset.fban : "red";
    if (here === "/") host.dataset.athome = "1";
    host.classList.add("fban"); host.style.cssText += ";" + vars(color);
    host.innerHTML =
      `<span class="half t" aria-hidden="true">${face(color)}</span>` +
      `<span class="half b" aria-hidden="true">${face(color)}</span>` +
      `<span class="hint" aria-hidden="true">MENU <i><b></b><b></b><b></b></i></span>` +
      `<button class="hit" type="button" aria-expanded="false" aria-controls="fdrop" aria-label="asaaab menu"></button>` +
      `<nav class="fdrop" id="fdrop" aria-label="Site menu"><a class="fwin" href="/calm/" tabindex="-1" aria-label="calm"><span class="fsky"></span><span class="fglare"></span><span class="fsill"></span></a><div class="fshade">` + PAGES.map(p => {
        const cur = p.href === here;
        const ext = p.tab || /^https?:/.test(p.href);
        return `<a class="fband${cur ? " here" : ""}" href="${p.href}" data-c="${p.c}" style="${vars(p.c)}" tabindex="-1"${cur ? ' aria-current="page"' : ""}${ext ? ' target="_blank" rel="noopener"' : ""}>`
          + `<span class="lbl"><b>${p.t}</b><small>${p.s}</small></span>${p.sticker ? STICKER : ""}</a>`;
      }).join("") + `<span class="frail" aria-hidden="true"><i></i></span></div></nav>`;

    const hit = host.querySelector(".hit"), drop = host.querySelector(".fdrop"), bands = [...drop.querySelectorAll(".fband")];
    // taps on the banner/menu never count as the "first tap" that starts the theme music
    ["pointerdown","touchend","mousedown"].forEach(ev => host.addEventListener(ev, e => e.stopPropagation(), { passive:true }));
    for (const ev of ["wheel","touchmove"]) drop.addEventListener(ev, e => e.stopPropagation(), { passive:true });

    const delays = dir => bands.forEach((b, i) => b.style.transitionDelay = reduce ? "0ms" : ((dir > 0 ? 180 + i * 60 : (bands.length - 1 - i) * 35) + "ms"));
    let open = false;
    function show(){
      if (open) return; open = true;
      drop.style.height = Math.max(240, innerHeight - host.getBoundingClientRect().top - host.offsetHeight * 0.522) + "px";
      delays(1); host.classList.remove("shade"); host.classList.add("open"); hit.setAttribute("aria-expanded", "true");
      bands.forEach(b => b.tabIndex = 0);
      setTimeout(() => (drop.querySelector(".here") || bands[0]).focus({ preventScroll:true }), reduce ? 0 : 300);
      if (window.goatcounter && goatcounter.count) goatcounter.count({ path:"menu-open", event:true });
    }
    function hide(){
      if (!open) return; open = false;
      delays(-1); host.classList.remove("open"); hit.setAttribute("aria-expanded", "false");
      bands.forEach(b => b.tabIndex = -1);
    }
    // tap the banner: open the menu. With the menu open, the banner's top half is the way home.
    hit.addEventListener("click", e => { e.stopPropagation();
      if (!open) return show();
      if (here === "/") return hide();
      if (window.goatcounter && goatcounter.count) goatcounter.count({ path:"menu-home", event:true });
      host.classList.add("shade"); setTimeout(() => { store.set("fban-arrive", "1"); location.href = "/"; }, reduce ? 0 : 520); });
    drop.addEventListener("click", e => {
      const b = e.target.closest(".fband, .fwin"); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      if (window.goatcounter && goatcounter.count) goatcounter.count({ path:"menu-" + b.dataset.c, event:true });
      if (b.classList.contains("here")) { hide(); return; }
      // window shade: the rainbow rolls up into the bar, then we go
      host.classList.add("shade");
      const go = () => {
        if (b.target === "_blank") { window.open(b.href, "_blank", "noopener"); host.classList.remove("shade"); hide(); }
        else { store.set("fban-arrive", "1"); location.href = b.href; }
      };
      setTimeout(go, reduce ? 0 : 520);
    });
    document.addEventListener("click", e => { if (open && !host.contains(e.target)) hide(); });
    document.addEventListener("keydown", e => {
      if (!open) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); hide(); hit.focus(); return; }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); e.stopPropagation();
        const i = bands.indexOf(document.activeElement);
        bands[(i + (e.key === "ArrowDown" ? 1 : -1) + bands.length) % bands.length].focus();
      }
      if (["ArrowLeft","ArrowRight"," ","PageDown","PageUp"].includes(e.key)) e.stopPropagation(); // don't drive the car while the menu is open
    }, true);

    // arrived via the menu: roll this page's banner down out of the bar
    if (store.get("fban-arrive")) { store.del("fban-arrive"); if (!reduce) { host.classList.add("arrive"); setTimeout(() => host.classList.remove("arrive"), 600); } }
  }
  const run = () => document.querySelectorAll("[data-fban]").forEach(build);
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", run) : run();
})();
