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
    <ul>${PAGES.map(([h, t]) => `<li><a href="${h}"${h === here ? ' class="active"' : ''}>${t}</a></li>`).join('')}<li class="m-only"><a href="contact.html#quote">ขอใบเสนอราคา →</a></li><li class="m-only"><a href="https://line.me/ti/p/~@itecwaste" target="_blank" rel="noopener"><span class="soc soc-line">${icon('line')}</span>LINE @itecwaste</a></li></ul>
    <a href="contact.html#quote" class="btn btn-lime">ขอใบเสนอราคา →</a>
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
  </div></footer>`;

  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', footer);

  document.querySelectorAll('[data-ico]').forEach(el => { el.classList.add('soc', 'soc-' + el.dataset.ico); el.innerHTML = icon(el.dataset.ico); });

  const nav = document.getElementById('nav');
  nav.querySelector('.burger').onclick = () => nav.classList.toggle('open');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // page fade transitions
  addEventListener('pageshow', () => document.body.classList.remove('leaving'));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target || e.metaKey || e.ctrlKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || !/\.html$/.test(url.pathname)) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 220);
  });

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
