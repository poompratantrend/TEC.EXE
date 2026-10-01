// I-TEC v3 — page behaviour (everything except the 3D layer)
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Thai line breaking: words → units, phrases kept together, connectors glued forward ---------- */
  const seg = 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  const PHRASES = ['ทางการแพทย์', 'ขยะติดเชื้อ', 'ขยะอันตราย', 'มูลฝอยติดเชื้อ', 'ครบวงจร', 'ถูกต้อง', 'ตามกฎหมาย', 'ตามกฎกระทรวง', 'ทุกขั้นตอน',
    'มาตรฐาน', 'อุณหภูมิสูง', 'ควบคุมอุณหภูมิ', 'เตาเผา', 'ใบเสนอราคา', 'สถานพยาบาล', 'ผู้ประกอบการ', 'ศูนย์กำจัด', 'ปลอดมลพิษ', 'ผ้าอนามัย',
    'เอกสารสำคัญ', 'ถังบรรจุ', 'ทำความสะอาด', 'เก็บขน', 'จัดเก็บ', 'ขั้นตอน', 'โปร่งใส', 'ตรวจสอบได้', 'ตรวจสอบย้อนกลับได้', 'ผู้เชี่ยวชาญ',
    'โรงพยาบาล', 'การแพร่เชื้อ', 'จังหวัดใกล้เคียง', 'กรุงเทพฯ', 'ปริมณฑล', 'เรียลไทม์', 'ต้นทาง', 'รายแรก', 'ประเทศไทย', 'นายกรัฐมนตรี',
    'ติดเชื้อ', 'อันตราย', 'การจัดการ', 'บริการ', 'ของคุณ', 'วันนี้', 'ที่เดียว', 'เทร็นด์', 'อินเตอร์เทรด', 'หลักวิชาการ', 'ไว้วางใจ', 'I-TEC', 'E-Manifest', 'ISO 9001:2015', 'พ.ศ.2545', 'ปลอดภัย', 'ภาครัฐ', 'สิ่งแวดล้อม', 'ธุรกิจ', 'สังคม', 'รั่วไหล', 'บุคลากร', 'ห้างร้าน', 'สำนักงาน', 'อุปกรณ์', 'เอกสาร', 'กฎกระทรวง', 'มูลฝอย', 'ของเสีย', 'ประสบการณ์', 'ใบอนุญาต', 'ผู้ติดต่อ', 'หน่วยงาน', 'นายกรัฐมนตรี', 'จัดซื้อจัดจ้าง', 'ขึ้นทะเบียน', 'เยี่ยมชม', 'ประเทศไทย'];
  const GLUE = new Set(['และ', 'ของ', 'ด้วย', 'ตาม', 'ให้', 'จาก', 'สู่', 'ที่', 'ใน', 'กับ', 'หรือ', 'แก่', 'โดย', 'การ', 'ความ', 'ทาง', 'ผู้', 'อย่าง', 'เพื่อ', 'กลุ่ม', 'ทีม', 'ด้าน', 'จน', 'ทุก', 'ได้']);
  const MAXP = Math.max(...PHRASES.map(p => p.length));
  const units = text => {
    if (!seg) return [text];
    const w = [...seg.segment(text)].map(s => s.segment), out = [];
    // 1. keep known phrases whole
    for (let i = 0; i < w.length;) {
      let j = i + 1, best = i + 1, acc = w[i];
      while (j < w.length && (acc + w[j]).length <= MAXP) { acc += w[j]; j++; if (PHRASES.includes(acc)) best = j; }
      out.push(w.slice(i, best).join('')); i = best;
    }
    // 2. connector words ride with the word after them
    const m = [];
    out.forEach(u => { const p = m[m.length - 1]; if (p !== undefined && GLUE.has(p) ) m[m.length - 1] = p + u; else m.push(u); });
    // 3. punctuation (· — & + / :) is tied to the words on both sides, spaces become non-breaking
    const isSp = u => /^\s+$/.test(u), isP = u => /^[·—–&+/:]$/.test(u.trim());
    const q = [];
    for (let i = 0; i < m.length; i++) {
      if (isP(m[i]) && q.length) {
        let tie = '';
        while (q.length && isSp(q[q.length - 1])) tie = ' ' + tie, q.pop();
        let k = i + 1, after = '';
        while (k < m.length && isSp(m[k])) after += ' ', k++;
        // always stays with the word before it; takes the next word along only if that word is short
        const nx = m[k] || '';
        if (nx && nx.length <= 10) { q[q.length - 1] += tie + m[i].trim() + after + nx; i = k; }
        else { q[q.length - 1] += tie + m[i].trim(); i = k - 1; if (after) q.push(' '); }
      } else q.push(m[i]);
    }
    return q;
  };
  const breakThai = el => {
    if (el.dataset.thw) return; el.dataset.thw = 1;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
    while (walk.nextNode()) if (walk.currentNode.nodeValue.trim()) nodes.push(walk.currentNode);
    nodes.forEach(n => {
      const f = document.createDocumentFragment();
      units(n.nodeValue).forEach((u, k) => {
        if (k) f.appendChild(document.createElement('wbr'));
        if (/^\s+$/.test(u)) { f.appendChild(document.createTextNode(u)); return; }
        const s = document.createElement('span'); s.className = 'thw'; s.textContent = u; f.appendChild(s);
      });
      n.replaceWith(f);
    });
    // no lonely last word: the last two units always share a line
    const us = [...el.querySelectorAll(':scope > .thw, :scope > .holo-text > .thw')].filter(u => u.textContent.trim());
    if (us.length > 2) {
      const a = us[us.length - 2], b = us[us.length - 1];
      if (a.parentNode === b.parentNode && b.textContent.length <= 7 && a.textContent.length + b.textContent.length <= 22) {
        let n = a.nextSibling; const mid = [];
        while (n && n !== b) { mid.push(n); n = n.nextSibling; }
        if (mid.every(x => x.nodeName === 'WBR' || (x.nodeType === 3 && /^\s*$/.test(x.data)))) {
          mid.forEach(x => { if (x.nodeName === 'WBR') x.remove(); else a.textContent += x.data.replace(/ /g, '\u00a0'), x.remove(); });
          a.textContent += b.textContent; b.remove();
        }
      }
    }
  };
  $$('h1,h2,h3,p,.stat>span,.li li').forEach(breakThai);
  // word-by-word reveal timing for headings marked .words
  $$('.words').forEach(h => $$('.thw', h).forEach((u, i) => { u.style.transitionDelay = (0.05 + i * 0.055) + 's'; }));

  /* ---------- reveal (blur → sharp), counters, process line ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; el.classList.add('in'); io.unobserve(el);
    $$('[data-count]', el).forEach(c => {
      const end = +c.dataset.count, t0 = performance.now();
      const step = now => { const p = Math.min((now - t0) / 1600, 1); c.textContent = Math.round(end * (1 - (1 - p) ** 4)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }), { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  $$('.rv,.words,#steps').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

  /* ---------- nav: active section, burger, page lock while open ---------- */
  const nav = $('#nav'), links = $$('.nav ul a');
  const setMenu = o => { nav.classList.toggle('open', o); document.documentElement.classList.toggle('lock', o); };
  $('.burger').onclick = e => { e.stopPropagation(); setMenu(!nav.classList.contains('open')); };
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', e => { if (nav.classList.contains('open') && !e.target.closest('.nav')) setMenu(false); });
  const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const spy = () => {
    const y = innerHeight * 0.35; let cur = null;
    secs.forEach(s => { if (s.getBoundingClientRect().top <= y) cur = s; });
    links.forEach(a => a.classList.toggle('on', cur && a.getAttribute('href') === '#' + cur.id));
  };
  addEventListener('scroll', spy, { passive: true }); spy();
  // anchors land below the floating nav (through the smooth-scroll engine)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const el = $(a.getAttribute('href')); if (!el) return;
    e.preventDefault();
    window.smoothTo(el.getBoundingClientRect().top + scrollY - (el.id === 'top' ? 0 : 90));
    history.replaceState(null, '', a.getAttribute('href'));
  });

  /* ---------- tilt + holographic sheen that follows the pointer ---------- */
  if (matchMedia('(hover:hover)').matches) $$('.tilt').forEach(c => {
    if (c.closest('.hero')) return;
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = `perspective(1000px) rotateY(${(x - .5) * 8}deg) rotateX(${(.5 - y) * 8}deg) translateY(-2px)`;
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });

  /* ---------- credentials marquee ---------- */
  const creds = [['../assets/iso-badges.png', 'ISO 9001:2015'], ['../assets/sme-award.png', 'SME ดีเด่น 2018'], ['../assets/itec-logo.png', 'ศูนย์ I-TEC'], [null, 'จัดเก็บ · ขนส่ง · กำจัด'],
    ['../assets/trend-logo.png', 'TREND INTERTRADE'], [null, 'THAI SME-GP'], [null, 'ใบอนุญาตรายแรกของไทย'], [null, 'GPS Tracking'], [null, 'E-Manifest']];
  const credHTML = creds.map(([img, t]) => `<span class="cred">${img ? `<img src="${img}" alt="">` : '<span class="chip" style="padding:0;border:0;background:none"><i></i></span>'}${t}</span>`).join('');
  $('#credTrack').innerHTML = credHTML + credHTML;

  /* ---------- gallery: v2 albums + one ambient row + lightbox ---------- */
  const CH = [
    { t: 'การเก็บขน', d: 'ทีมงานสวมชุดป้องกัน ขนถังบรรจุขึ้นรถควบคุมอุณหภูมิจากต้นทาง', n: [14, 1, 13, 16, 19, 21, 25, 26, 28, 30] },
    { t: 'ถังบรรจุ & การทำความสะอาด', d: 'การดูแลและทำความสะอาดถังบรรจุมูลฝอยติดเชื้อ', n: [33, 11, 31, 32, 38, 41, 42, 46, 47, 50, 52, 59, 60] },
    { t: 'ทีมงาน', d: 'พนักงานผ่านการฝึกอบรมการป้องกันและระงับการแพร่เชื้อ', n: [35, 10, 56] },
    { t: 'ศูนย์กำจัด & การอบรม', d: 'เยี่ยมชมระบบเตาเผาอุณหภูมิสูง และจัดอบรมการจัดการขยะติดเชื้อ', n: [4, 8, 3, 9] }
  ];
  const src = n => `../assets/gallery-${n}.jpg`;
  const ALL = CH.flatMap(c => c.n);
  $('#albums').innerHTML = CH.map((c, i) => `<button class="album rv" style="--d:${i * 0.08}s" data-a="${i}">
      <span class="stack">${c.n.slice(0, 3).reverse().map(n => `<img src="${src(n)}" alt="" loading="lazy">`).join('')}</span>
      <span class="meta"><b>${c.t}</b><small>${c.d}</small><em>${c.n.length} ภาพ →</em></span></button>`).join('');
  $$('.album b,.album small').forEach(breakThai);
  $$('.album').forEach(el => io.observe(el));
  const rowHTML = ALL.map((n, i) => `<button data-i="${i}" aria-label="ดูภาพ"><img src="${src(n)}" alt="ภาพการทำงาน I-TEC" loading="lazy"></button>`).join('');
  $('#row1 .track').innerHTML = rowHTML + rowHTML;
  const lb = $('#lb'), main = $('.main', lb), cnt = $('.cnt', lb), strip = $('.lb-strip', lb);
  let set = ALL, cur = 0;
  const show = (i, list) => {
    if (list && list !== set) { set = list; strip.innerHTML = set.map((n, k) => `<img src="${src(n)}" data-i="${k}" alt="" loading="lazy">`).join(''); }
    cur = (i + set.length) % set.length; main.src = src(set[cur]); cnt.textContent = `${cur + 1} / ${set.length}`;
    $$('img', strip).forEach((im, k) => im.classList.toggle('on', k === cur));
    strip.scrollTo({ left: strip.children[cur].offsetLeft - strip.clientWidth / 2 + 38, behavior: 'smooth' });
    lb.classList.add('open'); document.documentElement.classList.add('lock');
  };
  strip.innerHTML = ALL.map((n, k) => `<img src="${src(n)}" data-i="${k}" alt="" loading="lazy">`).join('');
  const close = () => { lb.classList.remove('open'); document.documentElement.classList.remove('lock'); };
  $('#work').addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (b) return show(+b.dataset.i, ALL);
    const a = e.target.closest('button[data-a]'); if (a) show(0, CH[+a.dataset.a].n);
  });
  $('#openAll').onclick = () => show(0, ALL);
  strip.addEventListener('click', e => { const im = e.target.closest('img'); if (im) show(+im.dataset.i); });
  $('.x', lb).onclick = close; $('.p', lb).onclick = () => show(cur - 1); $('.n', lb).onclick = () => show(cur + 1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  let sx = null;
  main.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  main.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); sx = null; });

  /* ---------- contact: channels, areas, quote form ---------- */
  const IC = {
    line: 'M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314',
    fb: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
    tt: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
    tel: 'M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1L6.6 10.8z',
    mail: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.6 2L12 12.2 19.4 7H4.6zM20 8.4l-7.4 5.2a1 1 0 0 1-1.2 0L4 8.4V17h16V8.4z',
    map: 'M12 0C7.8 0 4.4 3.4 4.4 7.6 4.4 13.3 12 24 12 24s7.6-10.7 7.6-16.4C19.6 3.4 16.2 0 12 0zm0 11.2a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z'
  };
  const svg = k => `<svg viewBox="0 0 24 24"><path d="${IC[k]}"/></svg>`;
  const CHANNELS = [['tel', 'b-tel', 'มือถือ', '061-694-2944 · 084-664-1571', 'tel:0616942944'], ['tel', 'b-tel', 'สำนักงาน', '02-454-8040 · 02-801-5724', 'tel:024548040'],
    ['line', 'b-line', 'LINE', '@itecwaste', 'https://line.me/ti/p/~@itecwaste'], ['fb', 'b-fb', 'Facebook', 'ขยะติดเชื้อ มูลฝอยติดเชื้อ ศูนย์ I-TEC', 'https://www.facebook.com/100057056246153'],
    ['tt', 'b-tt', 'TikTok', '@itec481', 'https://www.tiktok.com/@itec481'], ['mail', 'b-mail', 'อีเมล', 'otrend@hotmail.com', 'mailto:otrend@hotmail.com'],
    ['map', 'b-map', 'ที่ตั้ง · เปิดใน Google Maps', '472/1 ซ.เพชรเกษม 55/2 แขวงหลักสอง เขตบางแค กรุงเทพฯ 10160', 'https://www.google.com/maps/search/?api=1&query=472%2F1+%E0%B8%8B%E0%B8%AD%E0%B8%A2%E0%B9%80%E0%B8%9E%E0%B8%8A%E0%B8%A3%E0%B9%80%E0%B8%81%E0%B8%A9%E0%B8%A1+55%2F2+%E0%B8%9A%E0%B8%B2%E0%B8%87%E0%B9%81%E0%B8%84']];
  $("#channels").innerHTML = CHANNELS.map(([k, cls, t, v, href]) => `<a class="ch" href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}><span class="b ${cls}">${svg(k)}</span><span><small>${t}</small><strong>${v}</strong></span></a>`).join('');
  
  // area chips: same behaviour as v2 — the quote form (quote-form.js) picks the province from 'area-picked'
  const AREAS = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม', 'พระนครศรีอยุธยา', 'ฉะเชิงเทรา', 'จังหวัดอื่นๆ'];
  const box = $('#areas'), note = $('#areaNote');
  box.innerHTML = AREAS.map(a => `<button type="button">${a}</button>`).join('');
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.textContent;
    $$('button', box).forEach(x => x.classList.toggle('on', x === b));
    note.innerHTML = a === 'จังหวัดอื่นๆ' ? 'จังหวัดอื่นนอกเหนือจากรายการ กรุณาแจ้งที่อยู่ในฟอร์ม เราจะตรวจสอบเส้นทางให้'
      : `<b>${a}</b> อยู่ในพื้นที่ให้บริการ — ใส่ในฟอร์มให้แล้ว <a href="#form">ไปกรอกต่อ ↓</a>`;
    dispatchEvent(new CustomEvent('area-picked', { detail: a }));
  });


  /* ---------- anchor scrolling (native wheel/touch scroll is left alone: it never lags) ---------- */
  const root = document.documentElement;
  window.smoothTo = y => scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  const fine = matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- intro curtain → hero entrance ---------- */
  const intro = $('#intro'), bar = $('#introBar');
  let p = 0, gl = false, done = false;
  const t0 = performance.now();
  addEventListener('holo-ready', () => { gl = true; });
  const lift = () => {
    if (done) return; done = true;
    bar.style.transform = 'scaleX(1)';
    setTimeout(() => {
      root.classList.add('go'); intro.classList.add('out');
      dispatchEvent(new Event('intro-done'));
      $$('.hero .rv,.hero .words').forEach(el => el.classList.add('in'));
      setTimeout(() => intro.remove(), 1400);
    }, 260);
  };
  const load = () => {
    if (done) return;
    const el = performance.now() - t0, ready = gl || root.classList.contains('no-webgl');
    p += ((ready ? 1 : Math.min(0.9, el / 2400)) - p) * 0.12;
    bar.style.transform = `scaleX(${p})`;
    if ((ready && p > 0.97 && el > 700) || el > 4500) lift(); else requestAnimationFrame(load);
  };
  requestAnimationFrame(load);

  /* ---------- scroll-linked: parallax photos, giant running words, chamber glow ---------- */
  const par = $$('.pic img,.bento .big .ph img,.album .stack');
  const gr = $('#grTrack'), chamber = $('#chamber');
  const frame = () => {
    const h = innerHeight;
    par.forEach(el => {
      const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > h) return;
      const k = (r.top + r.height / 2 - h / 2) / h;
      el.style.transform = el.classList.contains('stack') ? `translateY(${k * -18}px)` : `translateY(${k * -6}%) scale(1.14)`;
    });
    if (gr) { const r = chamber.getBoundingClientRect(); if (r.bottom > 0 && r.top < h) gr.style.transform = `translateX(${-(h - r.top) * 0.35}px)`; }
    queued = false;
  };
  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  /* ---------- magnetic buttons (desktop) ---------- */
  if (fine) $$('.btn').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  /* ---------- phones: no pinch / double-tap zoom (iOS ignores user-scalable=no) ---------- */
  ['gesturestart', 'gesturechange'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
  let lastTouch = 0;
  document.addEventListener('touchend', e => { const n = Date.now(); if (n - lastTouch < 300 && !e.target.closest('a,button,input,select,textarea')) e.preventDefault(); lastTouch = n; }, { passive: false });
})();
