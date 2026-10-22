/* Saab 9-3 (2003-2011) instrument cluster, rebuilt as SVG — v3.
   Proportions measured from Theo's straight-on photos (10/21 night set); behavior from:
     IMG_1376 f66-70 + IMG_5869 f150-173  Night Panel ON: tach, combo and speedo past 90 cut in one frame;
                                          display holds ~2 frames, dims 1, off (~125 ms); unlit needles sweep to rest (~0.3 s)
     IMG_5869 f25-48                      Night Panel OFF: display backlight first, gauges 2 frames later, needles sweep up, text last
     IMG_3090 f11-22                      past 140 km/h (~87 mph) the rest of the speedo fades back in (~80 ms)
     IMG_5868                             daylight: charcoal faces, light-grey printing, chrome rings; green only shows in the dark
   API: const c = Cluster(svgEl); c.setSpeed(mph); c.setRpm(x1000); c.setNight(bool); c.setAmbient(0 night .. 1 day) */
function Cluster(svg, needleSvg) {
  const NS = "http://www.w3.org/2000/svg";
  const el = (t, a = {}, p = svg) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); p.appendChild(n); return n; };
  const rad = d => d * Math.PI / 180, pol = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy - r * Math.sin(rad(deg))];
  svg.replaceChildren(); svg.setAttribute("viewBox", "0 0 1000 420");
  if (!needleSvg) { needleSvg = document.createElementNS(NS, "svg"); svg.after(needleSvg); }
  needleSvg.replaceChildren(); needleSvg.setAttribute("viewBox", "0 0 1000 420");

  // ---- palette (CSS vars so ambient light can shift unlit print from black to grey)
  svg.style.setProperty("--lit", "#86ff5c");
  svg.style.setProperty("--print", "#2b2f2c");          // unlit printing at night; setAmbient raises it toward light grey
  svg.style.setProperty("--needle-off", "#3a3e3c");
  const defs = el("defs");
  const glow = el("filter", { id: "cg", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
  el("feGaussianBlur", { stdDeviation: "1.4", result: "b" }, glow);
  const gm = el("feMerge", {}, glow); el("feMergeNode", { in: "b" }, gm); el("feMergeNode", { in: "SourceGraphic" }, gm);
  const nglow = el("filter", { id: "ng", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
  el("feGaussianBlur", { stdDeviation: "3", result: "b" }, nglow);
  const ngm = el("feMerge", {}, nglow); el("feMergeNode", { in: "b" }, ngm); el("feMergeNode", { in: "SourceGraphic" }, ngm);
  const soft = el("filter", { id: "soft", x: "-20%", y: "-20%", width: "140%", height: "140%" }, defs); el("feGaussianBlur", { stdDeviation: "6" }, soft);
  const grad = (id, stops, attrs = {}) => { const g = el(attrs.r ? "radialGradient" : "linearGradient", { id, ...attrs }, defs); stops.forEach(([o, c]) => el("stop", { offset: o, "stop-color": c }, g)); };
  grad("chrome", [["0", "#e9edef"], [".45", "#8e9498"], [".55", "#c9ced1"], ["1", "#6c7275"]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  grad("face", [["0", "#151816"], ["1", "#0b0d0c"]], { r: ".7" });
  grad("cap", [["0", "#d9dee0"], [".6", "#9aa1a4"], ["1", "#5d6366"]], { r: ".6" });
  el("style", {}, defs).textContent = `
    .L{fill:var(--lit)} .Lt{stroke:var(--lit)}
    .off.L{fill:var(--print)!important; filter:none} .off.Lt{stroke:var(--print)!important; filter:none}
    .fade{transition:fill .08s, stroke .08s}
    text{font-family:"Barlow Semi Condensed","Arial Narrow",system-ui,sans-serif; font-weight:600}
    image.off{opacity:0}
    .lcd text{font-family:"VT323","Courier New",monospace; font-weight:400}`;

  // ---- geometry, measured from the straight-on daytime reference: three circles first, everything else inside them
  const S = { cx: 500, cy: 205, R: 178 };                        // speedo
  const T = { cx: 188, cy: 228, R: 118 }, C = { cx: 812, cy: 228, R: 118 };   // side gauges: 2/3 the speedo, centers a touch lower
  const keep = [], upper = [], offs = [], lcdTxt = [];
  const tick = (p, k, r0, r1, a, w, list, color) => { const [x0, y0] = pol(k.cx, k.cy, r0, a), [x1, y1] = pol(k.cx, k.cy, r1, a);
    const t = el("line", { x1: x0, y1: y0, x2: x1, y2: y1, class: "Lt", stroke: "var(--lit)", "stroke-width": w, filter: "url(#cg)", ...(color ? { style: `stroke:${color}` } : {}) }, p);
    list && list.push(t); return t; };
  const text = (p, s, x, y, fs, list, anchor = "middle", glowOn = true) => { const t = el("text", { x, y, "font-size": fs, "text-anchor": anchor, class: "L", ...(glowOn ? { filter: "url(#cg)" } : {}) }, p); t.textContent = s; list && list.push(t); return t; };

  el("path", { d: "M 40 395 C 40 120, 250 52, 500 26 C 750 52, 960 120, 960 395 Z", fill: "#0d0f0e" });   // hood (page may remove)

  // tach + combo: full circles
  const sunken = (id, shape) => { const cp = el("clipPath", { id }, defs); shape(cp); const g = el("g", { "clip-path": `url(#${id})` }); return g; };
  for (const [k, id] of [[T, "clT"], [C, "clC"]]) {
    el("circle", { cx: k.cx, cy: k.cy, r: k.R, fill: "url(#face)" });
    const g = sunken(id, cp => el("circle", { cx: k.cx, cy: k.cy, r: k.R }, cp));
    el("circle", { cx: k.cx, cy: k.cy + k.R * .06, r: k.R * 1.04, fill: "none", stroke: "#000", "stroke-width": k.R * .2, opacity: .85, filter: "url(#soft)" }, g);
    el("circle", { cx: k.cx, cy: k.cy, r: k.R, fill: "none", stroke: "url(#chrome)", "stroke-width": 3.2 });
  }
  // light orbs: two sunken bubbles on each side of the speedo top (telltale housings)
  const ORBS = [[-1.2, -.65, .18], [-.85, -.8, .12], [.85, -.8, .12], [1.2, -.65, .18]].map(([dx, dy, r]) => ({ cx: S.cx + dx * S.R, cy: S.cy + dy * S.R, R: r * S.R }));
  ORBS.forEach((o, i) => { el("circle", { cx: o.cx, cy: o.cy, r: o.R, fill: "#080a09", stroke: "#252a27", "stroke-width": 1.6 });
    const g = sunken("clO" + i, cp => el("circle", { cx: o.cx, cy: o.cy, r: o.R }, cp));
    el("circle", { cx: o.cx, cy: o.cy + o.R * .2, r: o.R * 1.1, fill: "none", stroke: "#000", "stroke-width": o.R * .5, opacity: .9, filter: "url(#soft)" }, g); });

  // speedo: a circle whose bottom is cut off flat by the display; the corners roll smoothly into the flat bottom
  const CH = S.cy + S.R * .47, KA = Math.asin(.40) * 180 / Math.PI;
  const [kx0, ky0] = pol(S.cx, S.cy, S.R, 180 + KA), [kx1, ky1] = pol(S.cx, S.cy, S.R, -KA);
  const SPEEDO = `M ${S.cx - S.R * .78} ${CH} Q ${S.cx - S.R * .9} ${CH} ${kx0} ${ky0} A ${S.R} ${S.R} 0 1 1 ${kx1} ${ky1} Q ${S.cx + S.R * .9} ${CH} ${S.cx + S.R * .78} ${CH} Z`;
  el("path", { d: SPEEDO, fill: "url(#face)" });
  { const g = sunken("clS", cp => el("path", { d: SPEEDO }, cp));
    el("circle", { cx: S.cx, cy: S.cy + S.R * .06, r: S.R * 1.04, fill: "none", stroke: "#000", "stroke-width": S.R * .2, opacity: .85, filter: "url(#soft)" }, g); }
  const speedoRing = () => el("path", { d: SPEEDO, fill: "none", stroke: "url(#chrome)", "stroke-width": 3.4, "stroke-linejoin": "round" });

  // scales
  const MPH = [[0,184],[10,170],[20,157],[30,143],[40,130],[50,115.5],[60,102],[70,88],[80,75],[90,62],[100,50.5],[110,42],[120,33],[130,25],[140,16],[150,7.5],[160,-1]];
  const lerpT = (Tb, v) => { if (v <= Tb[0][0]) return Tb[0][1]; for (let i = 1; i < Tb.length; i++) if (v <= Tb[i][0]) { const [a, A] = Tb[i - 1], [b, B] = Tb[i]; return A + (B - A) * (v - a) / (b - a); } return Tb[Tb.length - 1][1]; };
  const mphAng = v => lerpT(MPH, v), tachAng = v => 210 - v * (240 / 7);
  const NP_MPH = 90, NP_KMH = 140, RELIGHT = 87;

  const sp = el("g");
  for (let v = 0; v <= 160; v += 5) { const major = v % 10 === 0, a = mphAng(v), lst = v <= NP_MPH ? keep : upper;
    tick(sp, S, S.R * (major ? .86 : .9), S.R * .965, a, major ? 4.4 : 2.8, lst);
    if (major && v > 0) { const big = v < 100, [x, y] = pol(S.cx, S.cy, S.R * (big ? .73 : .76), a); text(sp, v, x, y + (big ? 7 : 5.5), big ? 20 : 15, lst); } }
  { const [x, y] = pol(S.cx, S.cy, S.R * .8, 184); text(sp, "mph", x - 4, y + 7, 15, keep, "start"); }
  for (let k = 0; k <= 260; k += 10) { const a = mphAng(k / 1.609344), major = k % 20 === 0, lst = k <= NP_KMH ? keep : upper;
    tick(sp, S, S.R * .54, S.R * (major ? .6 : .575), a, major ? 2.8 : 1.8, lst);
    if (major && k > 0) { const [x, y] = pol(S.cx, S.cy, S.R * .47, a); text(sp, k, x, y + 3.8, 10, lst, "middle", false); } }
  { const [x, y] = pol(S.cx, S.cy, S.R * .55, 186); text(sp, "km/h", x + 2, y + 6, 8.5, keep, "start", false); }

  // display: fills the space between the hub and the flat bottom, as wide as the circle allows; dark glass, green text
  const lcd = el("g", { class: "lcd" });
  const lx0 = S.cx - S.R * .78, lx1 = S.cx + S.R * .78, ly0 = S.cy + S.R * .17, ly1 = CH - S.R * .03, LR = S.R * .03, BR = S.R * .13;
  const LCD = `M ${lx0 + LR} ${ly0} L ${lx1 - LR} ${ly0} Q ${lx1} ${ly0} ${lx1} ${ly0 + LR} L ${lx1} ${ly1 - BR} Q ${lx1} ${ly1} ${lx1 - BR} ${ly1} L ${lx0 + BR} ${ly1} Q ${lx0} ${ly1} ${lx0} ${ly1 - BR} L ${lx0} ${ly0 + LR} Q ${lx0} ${ly0} ${lx0 + LR} ${ly0} Z`;
  el("path", { d: LCD, fill: "none", stroke: "#2b302d", "stroke-width": 5 }, lcd);             // bezel lip
  const lcdPanel = el("path", { d: LCD, fill: "var(--lcd)", style: "transition:fill .04s" }, lcd);
  svg.style.setProperty("--lcd", "#2fa548"); svg.style.setProperty("--lcdtxt", "#e6ffe9");
  grad("lcdShade", [["0", "rgba(0,0,0,.6)"], [".22", "rgba(0,0,0,0)"], ["1", "rgba(0,0,0,.18)"]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  grad("lcdGloss", [["0", "rgba(255,255,255,.10)"], [".5", "rgba(255,255,255,.02)"], [".51", "rgba(255,255,255,0)"]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  [["D", lx0 + 10, ly0 + 40, 30, "start"], ["Temp", lx0 + 40, ly0 + 24, 24, "start"], ["60 °F", lx0 + 175, ly0 + 24, 24, "start"],
   ["129725", lx0 + 40, ly0 + 50, 24, "start"], ["3727.1", lx1 - 10, ly0 + 50, 24, "end"]].forEach(([s, x, y, fs, an]) => {
    const t = el("text", { x, y, "font-size": fs, "text-anchor": an, fill: "var(--lcdtxt)", filter: "url(#cg)", style: "transition:opacity .04s" }, lcd); t.textContent = s; lcdTxt.push(t); });
  el("path", { d: LCD, fill: "url(#lcdShade)" }, lcd); el("path", { d: LCD, fill: "url(#lcdGloss)" }, lcd);
  speedoRing();
  const spill = el("path", { d: `M ${lx0 + 30} ${CH + 16} L ${lx1 - 30} ${CH + 16}`, fill: "none", stroke: "#2f8a3e", "stroke-width": 8, opacity: .45, filter: "url(#ng)" });

  // tachometer
  const tg = el("g");
  for (let v = 0; v <= 7; v += 0.25) { const major = Number.isInteger(v), half = !major && v % .5 === 0, a = tachAng(v), red = v >= 6.5;
    tick(tg, T, T.R * (major ? .8 : half ? .85 : .89), T.R * .955, a, major ? 4.4 : 2.8, offs, red ? "#ff4a22" : null);
    if (major) { const [x, y] = pol(T.cx, T.cy, T.R * .64, a); text(tg, v, x, y + 7, 20, offs); } }
  text(tg, "1/min x 1000", T.cx + 4, T.cy + T.R * .36, 11, offs, "middle", false);

  // combo gauge: every scale is concentric with the gauge; each needle comes from its own hub inside the scale and points out at it
  const cg = el("g");
  const TH = { cx: C.cx + C.R * .02, cy: C.cy - C.R * .2 }, MH = { cx: C.cx - C.R * .33, cy: C.cy }, FH = { cx: C.cx + C.R * .35, cy: C.cy };
  const turboPhi = v => 132 - 83 * v;                     // Theo's turbo art spans 132° → 49° around the gauge center
  const tempPhi = v => 209 - 55 * v, fuelPhi = v => -26 + 52 * v;   // temp: L (209°) → H (154°); fuel: empty (-26°) → full (26°)
  { const sc = C.R * .76 / 287, img = el("image", { href: "/assets/cluster/turbo_glow.png", x: C.cx - 871.2 * sc, y: C.cy - 584.4 * sc, width: 1600 * sc, height: 1600 * sc }, cg); offs.push(img); }
  for (let i = 0; i <= 9; i++) {
    tick(cg, C, C.R * .82, C.R * .92, tempPhi(i / 9), 3, offs, i === 8 ? "#ff4a22" : null);   // red: 2nd from the H end
    tick(cg, C, C.R * .82, C.R * .92, fuelPhi(i / 9), 3, offs, i === 1 ? "#ff4a22" : null);   // red: 2nd from empty
  }
  text(cg, "H", C.cx - C.R * .64, C.cy - C.R * .27, 16, offs); text(cg, "L", C.cx - C.R * .6, C.cy + C.R * .48, 16, offs);
  text(cg, "1/1", C.cx + C.R * .6, C.cy - C.R * .27, 15, offs); text(cg, "1/2", C.cx + C.R * .68, C.cy + C.R * .12, 15, offs);
  // angle from a hub to a point on a gauge-centred scale
  const aim = (hub, phi, r) => { const [px, py] = pol(C.cx, C.cy, r, phi); return Math.atan2(-(py - hub.cy), px - hub.cx) * 180 / Math.PI; };
  const turboAng = v => aim(TH, turboPhi(v), C.R * .76), tempAng = v => aim(MH, tempPhi(v), C.R * .86), fuelAng = v => aim(FH, fuelPhi(v), C.R * .86);

  // telltales (green ones stay on with Night Panel)
  const icon = (d, x, y, s = 1, list = keep) => { const g = el("g", { transform: `translate(${x} ${y}) scale(${s})` }); const p = el("path", { d, fill: "none", "stroke-width": 2, "stroke-linecap": "round", class: "Lt", stroke: "var(--lit)", filter: "url(#cg)" }, g); list.push(p); return g; };
  icon("M2 -8 A8 8 0 0 1 2 8 Z M-2 -6 L-10 -6 M-2 -2 L-10 -2 M-2 2 L-10 2 M-2 6 L-10 6 M-12 -8 L-12 8", ORBS[0].cx + 4, ORBS[0].cy, 1.1);
  icon("M-8 4 A9 9 0 1 1 8 4 M0 0 L5 -5 M-9 -9 L-5 -5", T.cx, T.cy + T.R * .7);
  icon("M-3 -6 A6 6 0 0 0 -3 6 M3 -6 A6 6 0 0 1 3 6 M-8 -4 L-12 -4 M-8 0 L-13 0 M-8 4 L-12 4 M8 -4 L12 -4 M8 0 L13 0 M8 4 L12 4", C.cx + C.R * .2, C.cy + C.R * .74);

  // needles: chrome-ringed hub cap underneath, the needle lies ON TOP of it with its rounded base at the hub centre
  grad("capring", [["0", "#2a2e2c"], [".62", "#1a1d1c"], [".7", "#c9ced1"], [".85", "#8e9498"], ["1", "#4a5053"]], { r: ".5" });
  function needle(h, len, w, tipw, capR, rest) {
    const cap = el("circle", { cx: h.cx, cy: h.cy, r: capR, fill: "url(#capring)" }, needleSvg);
    const g = el("g", {}, needleSvg);
    const body = el("path", { d: `M 0 ${-w} L ${len * .95} ${-tipw} Q ${len} 0 ${len * .95} ${tipw} L 0 ${w} A ${w} ${w} 0 0 1 0 ${-w} Z`, fill: "#f4f8ff", filter: "url(#ng)", style: "transition:fill .12s" }, g);
    return { g, body, h, cur: rest, target: rest, rest, rate: 300 };
  }
  const N = {
    speed: needle(S, S.R * .96, S.R * .028, S.R * .009, S.R * .15, mphAng(0)),
    tach: needle(T, T.R * .78, T.R * .045, T.R * .014, T.R * .16, tachAng(0)),
    turbo: needle(TH, C.R * .5, C.R * .045, C.R * .014, C.R * .125, turboAng(0)),
    temp: needle(MH, C.R * .48, C.R * .045, C.R * .014, C.R * .125, tempAng(0)),
    fuel: needle(FH, C.R * .46, C.R * .045, C.R * .014, C.R * .125, fuelAng(0)),
  };
  const draw = n => n.g.setAttribute("transform", `translate(${n.h.cx} ${n.h.cy}) rotate(${-n.cur})`);
  Object.values(N).forEach(draw);

  // ---- state
  let speed = 0, rpm = .8, night = false, upperOn = true, timers = [], last = performance.now();
  const setOn = (list, on) => list.forEach(n => n.classList.toggle("off", !on));
  const later = (ms, f) => timers.push(setTimeout(f, ms));
  const lcdState = s => { lcdPanel.setAttribute("fill", s === "off" ? "#070a08" : "var(--lcd)"); lcdTxt.forEach(t => t.style.opacity = s === "lit" ? 1 : s === "dim" ? .35 : 0); spill.style.opacity = s === "lit" ? .45 : 0; };
  function targets() {
    N.speed.target = mphAng(speed);
    const live = !night;
    N.tach.target = live ? tachAng(rpm) : N.tach.rest;
    N.turbo.target = live ? turboAng(Math.min(1, Math.max(0, (speed - 20) / 140))) : N.turbo.rest;
    N.temp.target = live ? tempAng(.5) : N.temp.rest;
    N.fuel.target = live ? fuelAng(.5) : N.fuel.rest;
    const wantUpper = !night || speed > RELIGHT;
    if (wantUpper !== upperOn) { upperOn = wantUpper; upper.forEach(n => n.classList.add("fade")); setOn(upper, wantUpper); }
  }
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    for (const n of Object.values(N)) { const d = n.target - n.cur, step = n.rate * dt; n.cur += Math.abs(d) <= step ? d : Math.sign(d) * step; draw(n); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  lcdState("lit");
  // tell-tales, placed like the real 9-3X (photos 10/22): cruise on the tach, low beams on the combo gauge
  const tell = {};
  { const g1 = el("g", { transform: `translate(${T.cx + T.R * .3} ${T.cy + T.R * .6}) scale(1.15)`, opacity: .07, style: "transition:opacity .15s" });
    el("path", { d: "M -9 5 A 10 10 0 1 1 9 5", fill: "none", stroke: "#39ff6a", "stroke-width": 2.6, "stroke-linecap": "round" }, g1);
    el("path", { d: "M 0 3 L 5 -5", stroke: "#39ff6a", "stroke-width": 2.6, "stroke-linecap": "round" }, g1); tell.cruise = g1;
    const g2 = el("g", { transform: `translate(${C.cx + C.R * .32} ${C.cy + C.R * .62}) scale(1.15)`, opacity: .07, style: "transition:opacity .15s" });
    el("path", { d: "M 1 -7 C 9 -7 9 7 1 7 Z", fill: "none", stroke: "#39ff6a", "stroke-width": 2.4, "stroke-linejoin": "round" }, g2);
    el("path", { d: "M -3 -5 L -10 -3 M -3 0 L -10 2 M -3 5 L -10 7", stroke: "#39ff6a", "stroke-width": 2.2, "stroke-linecap": "round" }, g2); tell.lights = g2; }

  return {
    setTell(name, on) { if (tell[name]) tell[name].setAttribute("opacity", on ? 1 : .07); if (on) tell[name] && tell[name].setAttribute("filter", "url(#ng)"); },
    setSpeed(v) { speed = Math.max(0, Math.min(160, v)); rpm = Math.min(6.8, .7 + speed / 50); targets(); },
    setRpm(v) { rpm = v; targets(); },
    setNight(on) {
      on = !!on; if (on === night) return; night = on; timers.forEach(clearTimeout); timers = [];
      const side = ["tach", "turbo", "temp", "fuel"];
      if (night) {                                        // press: one-frame cut, display lingers, needles drop to rest (~0.3 s)
        setOn(offs, false); side.forEach(k => { N[k].body.setAttribute("fill", "var(--needle-off)"); N[k].rate = 120; });
        later(84, () => lcdState("dim")); later(125, () => lcdState("off"));
      } else {                                            // release: backlight first, gauges 2 frames later, text last
        lcdPanel.setAttribute("fill", "var(--lcd)");
        later(84, () => { setOn(offs, true); side.forEach(k => { N[k].body.setAttribute("fill", "#f4f8ff"); N[k].rate = 160; }); });
        later(125, () => lcdState("lit"));
      }
      targets();
    },
    setAmbient(a) { a = Math.max(0, Math.min(1, a)); const mix = (x, y) => Math.round(x + (y - x) * a);
      svg.style.setProperty("--print", `rgb(${mix(43, 196)},${mix(47, 200)},${mix(44, 203)})`);
      svg.style.setProperty("--needle-off", `rgb(${mix(58, 205)},${mix(62, 210)},${mix(60, 212)})`);
      svg.style.setProperty("--lit", `rgb(${mix(134, 222)},${mix(255, 230)},${mix(92, 224)})`);
      svg.style.setProperty("--lcd", `rgb(${mix(47, 16)},${mix(165, 44)},${mix(72, 24)})`);      // glowing green at night, dark green glass by day
      svg.style.setProperty("--lcdtxt", `rgb(${mix(230, 125)},${mix(255, 255)},${mix(233, 106)})`); },
    setLcd(top, bottom) { const d = ["Temp", "60 °F", "129725", "3727.1"]; if (top == null) { [1, 2, 3, 4].forEach((i, k) => lcdTxt[i].textContent = d[k]); return; }
      lcdTxt[1].textContent = top; lcdTxt[2].textContent = ""; lcdTxt[3].textContent = bottom || ""; lcdTxt[4].textContent = ""; },
    get state() { return { speed, rpm, night, upperOn }; },
  };
}
