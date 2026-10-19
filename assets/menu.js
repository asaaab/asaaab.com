// Hamburger menu for asaaab.com. Drops itself into every [data-menu-host].
(function(){
  const ITEMS = [
    { href:"/shop/", ic:"🛒", bg:"#f7d117", t:"Merch", s:"asaaab.shop · under construction" },
    { href:"mailto:asaaab93x@gmail.com?subject=Media%20inquiry", ic:"✉️", bg:"#a7d3ef", t:"Media contact", s:"asaaab93x@gmail.com", ext:true },
    { sep:true },
    { href:"/privacy/", ic:"🔒", bg:"#cfe4b2", t:"Privacy policy", s:"what this site keeps (barely anything)" },
    { href:"/copyright/", ic:"©", bg:"#f3c6ee", t:"Copyright & reuse", s:"what you can share, what to ask about" },
  ];
  const here = location.pathname.replace(/index\.html$/, "");
  function build(host){
    const nav = document.createElement("nav");
    nav.className = "mnav"; nav.setAttribute("aria-label", "Site menu");
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "mnav-btn"; btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "mnav-panel");
    btn.innerHTML = '<i></i><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Menu</span>';
    const panel = document.createElement("div");
    panel.className = "mnav-panel"; panel.id = "mnav-panel";
    let html = '<div class="mnav-head">MENU · RECALCULATING…</div>';
    if (here !== "/") html += '<a href="/"><span class="ic" style="background:#3f9a2f;color:#fff">⌂</span><span><b>Back to the drive</b><small>asaaab.com</small></span></a><hr>';
    for (const it of ITEMS){
      if (it.sep){ html += "<hr>"; continue; }
      const cur = !it.ext && here === it.href ? ' aria-current="page"' : "";
      html += `<a href="${it.href}"${cur}><span class="ic" style="background:${it.bg}">${it.ic}</span><span><b>${it.t}</b><small>${it.s}</small></span></a>`;
    }
    html += `<div class="foot">© ${new Date().getFullYear()} asaaab · move your mind</div>`;
    panel.innerHTML = html;
    nav.append(btn, panel); host.appendChild(nav);
    const set = open => { nav.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); };
    btn.addEventListener("click", e => { e.stopPropagation(); set(!nav.classList.contains("open")); });
    document.addEventListener("click", e => { if (!nav.contains(e.target)) set(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) { set(false); btn.focus(); } }, true);
    // keep scroll/keys inside the menu from driving the car
    for (const ev of ["wheel","touchmove","keydown"]) panel.addEventListener(ev, e => e.stopPropagation(), { passive:true });
    // and taps on the menu don't count as the "first tap" that starts the theme music
    for (const ev of ["pointerdown","touchend","mousedown"]) nav.addEventListener(ev, e => e.stopPropagation(), { passive:true });
    panel.addEventListener("click", e => {
      const a = e.target.closest("a"); if (!a) return;
      if (window.goatcounter && goatcounter.count) goatcounter.count({ path: "menu-" + (a.textContent.trim().split(/\s/)[0] || "link").toLowerCase(), event: true });
    });
  }
  const run = () => document.querySelectorAll("[data-menu-host]").forEach(build);
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", run) : run();
})();
