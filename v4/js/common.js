// Shared header / footer / behaviours for every page
(() => {
  const PAGES = [
    ['index.html', 'หน้าแรก'], ['services.html', 'บริการ'], ['process.html', 'กระบวนการ'],
    ['about.html', 'เกี่ยวกับเรา'], ['gallery.html', 'ผลงาน'], ['contact.html', 'ติดต่อ']
  ];
  const here = location.pathname.split('/').pop() || 'index.html';

  // brand / contact icons (LINE, Facebook, TikTok, Google Maps from Simple Icons, CC0)
  const ICON_PATHS = {"line": "M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314", "facebook": "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z", "tiktok": "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z", "maps": "M19.527 4.799c1.212 2.608.937 5.678-.405 8.173-1.101 2.047-2.744 3.74-4.098 5.614-.619.858-1.244 1.75-1.669 2.727-.141.325-.263.658-.383.992-.121.333-.224.673-.34 1.008-.109.314-.236.684-.627.687h-.007c-.466-.001-.579-.53-.695-.887-.284-.874-.581-1.713-1.019-2.525-.51-.944-1.145-1.817-1.79-2.671L19.527 4.799zM8.545 7.705l-3.959 4.707c.724 1.54 1.821 2.863 2.871 4.18.247.31.494.622.737.936l4.984-5.925-.029.01c-1.741.601-3.691-.291-4.392-1.987a3.377 3.377 0 0 1-.209-.716c-.063-.437-.077-.761-.004-1.198l.001-.007zM5.492 3.149l-.003.004c-1.947 2.466-2.281 5.88-1.117 8.77l4.785-5.689-.058-.05-3.607-3.035zM14.661.436l-3.838 4.563a.295.295 0 0 1 .027-.01c1.6-.551 3.403.15 4.22 1.626.176.319.323.683.377 1.045.068.446.085.773.012 1.22l-.003.016 3.836-4.561A8.382 8.382 0 0 0 14.67.439l-.009-.003zM9.466 5.868L14.162.285l-.047-.012A8.31 8.31 0 0 0 11.986 0a8.439 8.439 0 0 0-6.169 2.766l-.016.018 3.665 3.084z", "phone": "M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1L6.6 10.8z", "mail": "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.6 2L12 12.2 19.4 7H4.6zM20 8.4l-7.4 5.2a1 1 0 0 1-1.2 0L4 8.4V17h16V8.4z"};
  const icon = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON_PATHS[n]}"/></svg>`;

  const header = `
  <nav class="nav" id="nav"><div class="wrap bar">
    <a href="index.html" class="logo"><img src="assets/trend-e.png" alt="I-TEC / TREND"><span>I-TEC<small>WASTE SOLUTIONS</small></span></a>
    <ul>${PAGES.map(([h, t]) => `<li><a href="${h}"${h === here ? ' class="active"' : ''}>${t}</a></li>`).join('')}<li class="m-only"><a href="contact.html#form">ขอใบเสนอราคา →</a></li><li class="m-only"><a href="https://line.me/ti/p/~@itecwaste" target="_blank" rel="noopener"><span class="soc soc-line">${icon('line')}</span>LINE @itecwaste</a></li></ul>
    <a href="contact.html#form" class="btn btn-lime">ขอใบเสนอราคา →</a>
    <button class="burger" aria-label="เมนู">☰</button>
  </div></nav>`;

  const footer = `
  <footer><div class="wrap">
    <div class="cols">
      <div><div class="f-logos"><img src="assets/itec-logo.png" alt="ศูนย์ I-TEC"><img src="assets/trend-logo-wide.jpg" alt="TREND INTERTRADE"></div>
        <p style="max-width:340px">ศูนย์บริหารจัดการขยะติดเชื้อ และขยะอันตรายทางการแพทย์ ครบวงจร โดย บริษัท เทร็นด์ อินเตอร์เทรด จำกัด<br>472/1 ซ.เพชรเกษม 55/2 แขวงหลักสอง เขตบางแค กรุงเทพฯ 10160</p></div>
      <div><h4>เมนู</h4><ul>${PAGES.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
      <div><h4>ช่องทางติดต่อ</h4><ul>
        <li><a href="tel:0616942944"><span class="soc soc-phone">${icon('phone')}</span>061-694-2944 · 084-664-1571</a></li>
        <li><a href="https://line.me/ti/p/~@itecwaste" target="_blank" rel="noopener"><span class="soc soc-line">${icon('line')}</span>LINE @itecwaste</a></li>
        <li><a href="https://www.facebook.com/100057056246153" target="_blank" rel="noopener"><span class="soc soc-facebook">${icon('facebook')}</span>Facebook ศูนย์ I-TEC</a></li>
        <li><a href="https://www.tiktok.com/@itec481" target="_blank" rel="noopener"><span class="soc soc-tiktok">${icon('tiktok')}</span>TikTok @itec481</a></li>
        <li><a href="mailto:otrend@hotmail.com"><span class="soc soc-mail">${icon('mail')}</span>otrend@hotmail.com</a></li></ul></div>
    </div>
    <div class="bottom"><span>© 2026 itecwastesolutions — ต้นแบบดีไซน์ใหม่</span><span>ISO 9001:2015 · THAI SME-GP</span></div>
    <p class="credits">โมเดล 3D จาก Sketchfab (CC BY 4.0): ถังขยะ — BLENDERBROCPT · รถ Isuzu Elf — Romanov_13 · ต้นไม้ — 99.Miles · ถุงขยะ, เข็มฉีดยา — DJMaesen · หน้ากาก — Léonard_Doye · ถุงมือ — KOMODOZ · ขวดแล็บ — Naked Singularity · ปรอท — BlackCube · หลอดไฟ — Vince_Crusty · จอ — filththemutt · โพเดียม — ultravoilenterAS · หนังสือ — GetDeadEntertainment · ถังเท้าเหยียบ — Sibghat Baloch · ผ้าอนามัย — Subash Shenoy · เครื่องทำลายเอกสาร — Chenchanchong · กระดาษ — oparaskos · แม่กุญแจ — Gregsterius · คลินิก — narcozisne1 · ตึกแถว — Kun.Tan, jeremy1983 · โกดัง — prankscare99 · ถ้วยรางวัล — GimmeTheGucci · กล่องของมีคม — cig3d · โรงงาน — assetfactory · ท้องฟ้า ถนน และพื้น — Poly Haven (CC0)</p>
  </div></footer>`;

  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', footer);

  document.querySelectorAll('[data-ico]').forEach(el => { el.classList.add('soc', 'soc-' + el.dataset.ico); el.innerHTML = icon(el.dataset.ico); });

  // iOS Safari ignores user-scalable=no; block its pinch gesture and double-tap zoom explicitly
  ['gesturestart', 'gesturechange'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
  let lastTouch = 0;
  document.addEventListener('touchend', e => { const now = Date.now(); if (now - lastTouch < 300 && !e.target.closest('a,button,input,select,textarea')) e.preventDefault(); lastTouch = now; }, { passive: false });

  const nav = document.getElementById('nav');
  // menu: opening locks the page behind it; any link, outside tap or Esc closes it
  const setMenu = open => { nav.classList.toggle('open', open); document.documentElement.classList.toggle('menu-open', open); };
  nav.querySelector('.burger').onclick = e => { e.stopPropagation(); setMenu(!nav.classList.contains('open')); };
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', e => { if (nav.classList.contains('open') && !e.target.closest('.nav')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  // same-page anchors (e.g. "ขอใบเสนอราคา" while already on the contact page): glide to the target below the nav
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href*="#"]'); if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const el = document.querySelector(url.hash); if (!el) return;
    e.preventDefault(); setMenu(false);
    history.replaceState(null, '', url.hash);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // arriving with #form (or any hash): re-scroll once fonts, nav and 3D have settled, so the layout shift doesn't leave us short
  if (location.hash) {
    const go = () => { const el = document.querySelector(location.hash); if (el) el.scrollIntoView({ block: 'start' }); };
    addEventListener('load', () => { go(); setTimeout(go, 400); });
  }

  // page transitions: the 3D camera dives into the bin (or whatever is mid-screen), green ink floods the screen from
  // that point with the next page's name on it, and the next page opens out of the ink while its camera climbs back out
  (() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let slow = 1; try { if (location.hostname === 'localhost') slow = +sessionStorage.getItem('inkSlow') || 1; } catch (err) {}   // dev: slow-motion check
    const nameOf = href => (PAGES.find(([h]) => h === (new URL(href, location.href).pathname.split('/').pop() || 'index.html')) || [])[1] || 'I-TEC';
    const el = document.createElement('div'); el.className = 'ink'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<canvas></canvas><div class="ink-title"><img src="assets/trend-e.png" alt=""><small>I-TEC WASTE SOLUTIONS</small><b></b></div>';
    document.body.appendChild(el);
    const cv = el.querySelector('canvas'), title = el.querySelector('b');
    const FS = `precision highp float;
      uniform vec2 uRes, uO; uniform float uP, uT, uMode;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a*n(p); p = p*2.02 + vec2(17., 9.); a *= .5; } return s; }
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes.y, o = uO / uRes.y, d = uv - o, R2 = uRes / uRes.y;
        float r = length(d), a = atan(d.y, d.x);
        vec2 q = uv*2.5 + vec2(fbm(uv*1.7 + uT*.25), fbm(uv*1.7 + vec2(5.2, 1.3) - uT*.2)) * 1.6;   // ink-in-water swirl
        float w = fbm(q + uT*.15);
        float st = fbm(vec2(a*2.5 + 5., r*3. - uT*1.2));                                           // tendrils shooting outward
        float far = max(max(length(o), length(o - vec2(R2.x, 0.))), max(length(o - vec2(0., 1.)), length(o - R2)));
        float e = r/far + (w - .5)*.45 + (st - .5)*.35;
        float R = mix(-.45, 1.45, uP);
        float f = smoothstep(R + .015, R - .015, e);
        f = max(f, smoothstep(.70, .72, fbm(uv*7. + vec2(3., uT*.3))) * smoothstep(R + .18, R + .02, e));   // splatter ahead of the front
        float cov = uMode < .5 ? f : 1. - f;
        vec3 deep = vec3(.043, .302, .173), brand = vec3(.059, .541, .294), mint = vec3(.62, .89, .73);
        vec3 col = mix(deep, brand, smoothstep(.35, .75, w));
        col = mix(col, deep*.8, smoothstep(.3, .9, st)*.35);
        col = mix(col, mint, smoothstep(.09, 0., abs(e - R))*.85);                                 // bright wet edge
        gl_FragColor = vec4(col*cov, cov);
      }`;
    let gl = null, U = {};
    try {
      gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: true });
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog); gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      ['uRes', 'uO', 'uP', 'uT', 'uMode'].forEach(k => U[k] = gl.getUniformLocation(prog, k));
    } catch (err) { console.warn('ink transition: CSS fallback', err); gl = null; }

    const st = { p: 0, mode: 0, x: innerWidth / 2, y: innerHeight / 2 };
    const draw = () => {
      el.classList.toggle('full', st.mode === 0 ? st.p > 0.62 : st.p < 0.12);
      if (!gl) {                                       // no WebGL: a plain circle wipe
        const R = `${st.p * 150}vmax`, at = `at ${st.x}px ${st.y}px`;
        cv.style.background = '#0b4d2c';
        cv.style.clipPath = st.mode === 0 ? `circle(${R} ${at})` : '';
        cv.style.webkitMaskImage = cv.style.maskImage = st.mode === 0 ? '' : `radial-gradient(circle ${at}, transparent ${R}, #000 calc(${R} + 1px))`;
        return;
      }
      const s = Math.min(devicePixelRatio, 1), w = Math.round(innerWidth * s), h = Math.round(innerHeight * s);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(U.uRes, w, h); gl.uniform2f(U.uO, st.x * s, h - st.y * s);
      gl.uniform1f(U.uP, st.p); gl.uniform1f(U.uT, performance.now() / 1000); gl.uniform1f(U.uMode, st.mode);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const run = (mode, at, ms) => new Promise(done => {
      Object.assign(st, { mode, x: at.x, y: at.y });
      el.classList.add('on');
      const t0 = performance.now(); ms *= slow;
      const step = now => {
        const u = Math.min((now - t0) / ms, 1);
        st.p = 1 - (1 - u) ** 2.2;                      // bursts out, then settles
        draw();
        if (u < 1) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    });
    const sleep = ms => new Promise(r => setTimeout(r, ms * slow));
    const center = () => ({ x: innerWidth / 2, y: innerHeight / 2 });

    let pointer = null, busy = false;
    addEventListener('pointerdown', e => { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
    const fetched = new Set();                            // warm the next page while the pointer is on its link
    const prefetch = href => { if (fetched.has(href)) return; fetched.add(href); const l = document.createElement('link'); l.rel = 'prefetch'; l.href = href; document.head.appendChild(l); };
    const internal = a => {
      const url = new URL(a.href, location.href);
      return url.origin === location.origin && url.pathname !== location.pathname && /\.html$/.test(url.pathname);
    };
    ['pointerover', 'touchstart'].forEach(ev => document.addEventListener(ev, e => { const a = e.target.closest?.('a[href]'); if (a && !a.target && internal(a)) prefetch(a.href); }, { passive: true }));

    document.addEventListener('click', async e => {
      const a = e.target.closest('a[href]');
      if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || !internal(a)) return;
      e.preventDefault();
      if (busy) return;
      if (reduce) { location.href = a.href; return; }
      busy = true; prefetch(a.href);
      title.textContent = nameOf(a.href);
      const dove = window.ITEC3D?.dive(1000 * slow);
      if (dove) await sleep(380);                        // let the camera pick up speed before the ink bursts out of the bin
      await run(0, dove || pointer || center(), dove ? 700 : 650);
      try { sessionStorage.setItem('itecInk', String(Date.now())); } catch (err) {}
      location.href = a.href;
    });

    // arriving through the ink: it already covers the page (head script + CSS), so hold it until the 3D is drawing
    let arrived = false;
    try { arrived = Date.now() - +(sessionStorage.getItem('itecInk') || 0) < 8000; sessionStorage.removeItem('itecInk'); } catch (err) {}
    if (arrived && !reduce) {
      title.textContent = nameOf(location.href);
      Object.assign(st, { mode: 0, p: 1, ...center() }); el.classList.add('on'); draw();
      document.documentElement.classList.remove('ink-cover');
      let opened = false;
      const open = async () => {
        if (opened) return; opened = true;
        await sleep(120);
        const at = window.ITEC3D?.emerge(1400 * slow);
        await run(1, at || center(), 900);
        el.classList.remove('on', 'full');
      };
      if (document.body.dataset.scene && document.getElementById('stage')) { addEventListener('itec3d:done', open, { once: true }); setTimeout(open, 2200); }
      else setTimeout(open, 150);
    } else document.documentElement.classList.remove('ink-cover', 'ink-arrive');

    addEventListener('pageshow', e => {                // back/forward cache: come back to the page, not to the ink
      if (!e.persisted) return;
      busy = false; window.ITEC3D?.reset(); el.classList.remove('on', 'full');
    });
  })();

  // Thai line breaking: browsers break Thai anywhere their dictionary allows (e.g. "ทางการ / แพทย์").
  // Split into words, re-join known phrases, glue short connectors to the next word, and only allow breaks between those units.
  (() => {
    if (!('Segmenter' in Intl)) return;
    const seg = new Intl.Segmenter('th', { granularity: 'word' });
    const PHRASES = ['ทางการแพทย์', 'ขยะติดเชื้อ', 'ขยะอันตราย', 'มูลฝอยติดเชื้อ', 'ครบวงจร', 'ถูกต้อง', 'ตามกฎหมาย', 'ตามกฎกระทรวง',
      'ทุกขั้นตอน', 'มาตรฐาน', 'ไว้ใจได้', 'อุณหภูมิสูง', 'ควบคุมอุณหภูมิ', 'เตาเผา', 'ใบเสนอราคา', 'สถานพยาบาล', 'ผู้ประกอบการ',
      'ศูนย์กำจัด', 'ปลอดมลพิษ', 'ผ้าอนามัย', 'เอกสารสำคัญ', 'ถังบรรจุ', 'ทำความสะอาด', 'เก็บขน', 'ขั้นตอน', 'โปร่งใส', 'ตรวจสอบได้',
      'ตรวจสอบย้อนกลับได้', 'จัดเก็บ', 'ผู้เชี่ยวชาญ', 'เทร็นด์ อินเตอร์เทรด', 'โรงพยาบาล', 'การแพร่เชื้อ', 'จังหวัดใกล้เคียง', 'กรุงเทพฯ', 'ปริมณฑล',
      'เรียลไทม์', 'ต้นทาง', 'รายแรก', 'ประเทศไทย', 'นายกรัฐมนตรี', 'ติดเชื้อ', 'อันตราย', 'การจัดการ', 'บริการ', 'ของคุณ', 'วันนี้'];
    const GLUE = new Set(['และ', 'ของ', 'ด้วย', 'ตาม', 'ให้', 'จาก', 'สู่', 'ที่', 'ใน', 'กับ', 'หรือ', 'แก่', 'โดย', 'การ', 'ความ', 'ทาง', 'ผู้']);
    const maxLen = Math.max(...PHRASES.map(p => p.length));
    const units = text => {
      const w = [...seg.segment(text)].map(s => s.segment);
      const out = [];
      for (let i = 0; i < w.length;) {
        let j = i + 1, best = i + 1, acc = w[i];
        while (j < w.length && (acc + w[j]).length <= maxLen) { acc += w[j]; j++; if (PHRASES.includes(acc)) best = j; }
        out.push(w.slice(i, best).join('')); i = best;
      }
      const merged = [];                                   // connectors stick to what follows
      out.forEach(u => { const prev = merged[merged.length - 1]; if (prev !== undefined && GLUE.has(prev.trim()) && !/\s$/.test(prev)) merged[merged.length - 1] = prev + u; else merged.push(u); });
      return merged;
    };
    const fix = el => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
      while (walker.nextNode()) if (/[฀-๿]/.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
      nodes.forEach(n => {
        const frag = document.createDocumentFragment();
        units(n.nodeValue).forEach((u, k) => {
          if (k) frag.appendChild(document.createElement('wbr'));
          if (/^\s+$/.test(u)) { frag.appendChild(document.createTextNode(u)); return; }
          const sp = document.createElement('span'); sp.className = 'thw'; sp.textContent = u; frag.appendChild(sp);
        });
        n.replaceWith(frag);
      });
    };
    let runs = 0;
    window.thaiBreak = root => {
      if (++runs > 400) return;                           // safety valve
      let n = 0;
      (root || document).querySelectorAll('h1,h2,h3,.lead,p,.k,figcaption b,.svc-panel p,.card p,.chapter-head p').forEach(el => { if (!el.dataset.thw) { el.dataset.thw = 1; fix(el); n++; } });
    };
    thaiBreak();
    let queued = false;                                 // content injected later (service panel, gallery) gets the same treatment
    new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; thaiBreak(); }); } }).observe(document.body, { childList: true, subtree: true });
  })();

  // reveal + counters
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; el.classList.add('in'); io.unobserve(el);
    el.querySelectorAll('[data-count]').forEach(c => {
      const end = +c.dataset.count, t0 = performance.now();
      const step = now => { const p = Math.min((now - t0) / 1400, 1); c.textContent = Math.round(end * (1 - (1 - p) ** 3)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }), { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  // 3D tilt (tilt elements are never .rv, so transitions don't fight)
  window.applyTilt = (root = document) => {
    if (!matchMedia('(hover:hover)').matches) return;
    root.querySelectorAll('.tilt:not([data-tilt])').forEach(c => {
      c.dataset.tilt = 1;
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 12}deg) rotateX(${(0.5 - y) * 12}deg)`;
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
  };
  applyTilt();

})();
