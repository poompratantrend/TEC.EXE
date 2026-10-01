// Quote request form: dependent province → district lists, location button, validation, thank-you card.
// Sends to the company's Google Form when the form has data-gform + data-entries; with data-preview it only shows the card.
(() => {
  const form = document.querySelector('form.qf');
  if (!form) return;

  const DISTRICTS = {
    'กรุงเทพมหานคร': ['พระนคร', 'ดุสิต', 'หนองจอก', 'บางรัก', 'บางเขน', 'บางกะปิ', 'ปทุมวัน', 'ป้อมปราบศัตรูพ่าย', 'พระโขนง', 'มีนบุรี', 'ลาดกระบัง', 'ยานนาวา', 'สัมพันธวงศ์', 'พญาไท', 'ธนบุรี', 'บางกอกใหญ่', 'ห้วยขวาง', 'คลองสาน', 'ตลิ่งชัน', 'บางกอกน้อย', 'บางขุนเทียน', 'ภาษีเจริญ', 'หนองแขม', 'ราษฎร์บูรณะ', 'บางพลัด', 'ดินแดง', 'บึงกุ่ม', 'สาทร', 'บางซื่อ', 'จตุจักร', 'บางคอแหลม', 'ประเวศ', 'คลองเตย', 'สวนหลวง', 'จอมทอง', 'ดอนเมือง', 'ราชเทวี', 'ลาดพร้าว', 'วัฒนา', 'บางแค', 'หลักสี่', 'สายไหม', 'คันนายาว', 'สะพานสูง', 'วังทองหลาง', 'คลองสามวา', 'บางนา', 'ทวีวัฒนา', 'ทุ่งครุ', 'บางบอน'],
    'นนทบุรี': ['เมืองนนทบุรี', 'บางกรวย', 'บางใหญ่', 'บางบัวทอง', 'ไทรน้อย', 'ปากเกร็ด'],
    'ปทุมธานี': ['เมืองปทุมธานี', 'คลองหลวง', 'ธัญบุรี', 'หนองเสือ', 'ลาดหลุมแก้ว', 'ลำลูกกา', 'สามโคก'],
    'สมุทรปราการ': ['เมืองสมุทรปราการ', 'บางบ่อ', 'บางพลี', 'พระประแดง', 'พระสมุทรเจดีย์', 'บางเสาธง'],
    'สมุทรสาคร': ['เมืองสมุทรสาคร', 'กระทุ่มแบน', 'บ้านแพ้ว'],
    'นครปฐม': ['เมืองนครปฐม', 'กำแพงแสน', 'นครชัยศรี', 'ดอนตูม', 'บางเลน', 'สามพราน', 'พุทธมณฑล'],
    'พระนครศรีอยุธยา': ['พระนครศรีอยุธยา', 'ท่าเรือ', 'นครหลวง', 'บางไทร', 'บางบาล', 'บางปะอิน', 'บางปะหัน', 'ผักไห่', 'ภาชี', 'ลาดบัวหลวง', 'วังน้อย', 'เสนา', 'บางซ้าย', 'อุทัย', 'มหาราช', 'บ้านแพรก'],
    'ฉะเชิงเทรา': ['เมืองฉะเชิงเทรา', 'บางคล้า', 'บางน้ำเปรี้ยว', 'บางปะกง', 'บ้านโพธิ์', 'พนมสารคาม', 'ราชสาส์น', 'สนามชัยเขต', 'แปลงยาว', 'ท่าตะเกียบ', 'คลองเขื่อน']
  };
  const OTHER = 'จังหวัดอื่นๆ';
  const $ = id => document.getElementById(id);
  const prov = $('qf-province'), dist = $('qf-district'), distText = $('qf-district-other'), provText = $('qf-province-other');

  prov.innerHTML = '<option value="">— เลือกจังหวัด —</option>' + [...Object.keys(DISTRICTS), OTHER].map(p => `<option>${p}</option>`).join('');
  const syncDistricts = () => {
    const list = DISTRICTS[prov.value], other = prov.value === OTHER;
    dist.innerHTML = '<option value="">' + (list ? '— เลือกเขต / อำเภอ —' : '— เลือกจังหวัดก่อน —') + '</option>' + (list || []).map(d => `<option>${d}</option>`).join('');
    dist.disabled = !list;
    dist.hidden = other; dist.required = !other;
    distText.hidden = provText.hidden = !other; distText.required = provText.required = other;
    const row = document.getElementById('qf-province-other-row'); if (row) row.hidden = !other;
  };
  prov.addEventListener('change', syncDistricts);
  syncDistricts();
  // area chips on the contact page pick the province here too
  addEventListener('area-picked', e => { if (DISTRICTS[e.detail] || e.detail === OTHER) { prov.value = e.detail; syncDistricts(); } });

  // location: this device's position, or a pasted Google Maps link
  const loc = $('qf-location'), locBtn = $('qf-locate'), locNote = $('qf-locate-note');
  locBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { locNote.textContent = 'เครื่องนี้หาตำแหน่งไม่ได้ วางลิงก์ Google Maps แทนได้'; return; }
    locNote.textContent = 'กำลังหาตำแหน่ง…';
    navigator.geolocation.getCurrentPosition(
      p => { loc.value = `${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`; form.elements.address.setCustomValidity(''); locNote.textContent = 'ได้ตำแหน่งแล้ว (ถ้ากรอกอยู่ที่หน่วยงาน)'; },
      () => { locNote.textContent = 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง วางลิงก์ Google Maps แทนได้'; },
      { enableHighAccuracy: true, timeout: 12000 });
  });

  [form.elements.address, loc].forEach(el => el.addEventListener('input', () => form.elements.address.setCustomValidity('')));
  const postcode = $('qf-postcode');
  postcode.addEventListener('input', () => { postcode.value = postcode.value.replace(/\D/g, '').slice(0, 5); });

  const status = $('qf-status'), thanks = $('qf-thanks');
  const fail = msg => { status.textContent = msg; status.hidden = false; };
  $('qf-again').addEventListener('click', () => { form.classList.remove('done'); thanks.hidden = true; form.elements.org.focus(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.hidden = true;
    if (form.elements.website.value) return;                 // honeypot
    // an address OR a map location is enough for the truck to find the place
    const addr = form.elements.address;
    addr.setCustomValidity(addr.value.trim() || loc.value.trim() ? '' : 'พิมพ์ที่อยู่ หรือใส่ตำแหน่งบนแผนที่อย่างใดอย่างหนึ่ง');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const f = new FormData(form), one = k => (f.get(k) || '').toString().trim(), many = k => f.getAll(k).join(', ');
    const province = prov.value === OTHER ? one('province_other') : prov.value;
    const district = prov.value === OTHER ? one('district_other') : dist.value;
    const answers = {
      org: one('org'), type: one('type'), name: one('name'), tel: one('tel'), email: one('email'),
      province, district, postcode: one('postcode'), address: one('address'), location: one('location'),
      waste: many('waste'), weight: one('weight'), freq: one('freq'), bins: one('bins'), days: many('days'), note: one('note')
    };
    // for the current Google Form (fewer questions): everything that has no question of its own rides along in "ที่อยู่",
    // and the weight goes to the nearest of its old choices (the exact one is in the text too)
    const LEGACY_WEIGHT = { 'ไม่เกิน 20 กก.': '0-20  กิโลกรัม', '21–40 กก.': 'ไม่เกิน 40 กิโลกรัม', '41–60 กก.': 'ไม่เกิน 60 กิโลกรัม', '61–80 กก.': 'ไม่เกิน 80 กิโลกรัม',
      '81–100 กก.': 'มากกว่า 100 กิโลกรัม', '101–200 กก.': 'มากกว่า 100 กิโลกรัม', 'มากกว่า 200 กก.': 'มากกว่า 100 กิโลกรัม', 'ยังไม่แน่ใจ': '0-20  กิโลกรัม' };
    const extra = [['ประเภท', answers.type], ['ชนิดขยะ', answers.waste], ['น้ำหนัก/เดือน', answers.weight], ['ถัง/ถุงแดง', answers.bins], ['วันสะดวก', answers.days], ['หมายเหตุ', answers.note]]
      .filter(r => r[1]).map(([k, v]) => `${k}: ${v}`);
    answers.addressFull = [answers.address, `${district}, ${province} ${answers.postcode}`, answers.location && 'แผนที่: ' + answers.location, extra.length && '— ' + extra.join(' · ')].filter(Boolean).join('\n');
    answers.weightLegacy = LEGACY_WEIGHT[answers.weight] || '0-20  กิโลกรัม';
    answers.emailOrDash = answers.email || '-';
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      if (!form.dataset.preview) {
        // data-entries: { "fields": { answerKey: "entry.123", … }, "fixed": { "entry.456": "-" } }
        const map = JSON.parse(form.dataset.entries || '{}'), body = new URLSearchParams();
        for (const [k, id] of Object.entries(map.fields || {})) {
          if (k === 'waste' || k === 'days') f.getAll(k).forEach(x => body.append(id, x));   // checkbox questions: one value per ticked box
          else body.append(id, answers[k]);
        }
        for (const [id, v] of Object.entries(map.fixed || {})) body.append(id, v);
        await fetch(form.dataset.gform, { method: 'POST', mode: 'no-cors', body });   // Google doesn't let other sites read the reply
      }
      form.reset(); syncDistricts(); form.classList.add('done'); thanks.hidden = false;
      thanks.focus({ preventScroll: true }); form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      fail('ส่งไม่สำเร็จ กรุณาลองอีกครั้ง หรือโทร 061-694-2944');
    } finally { btn.disabled = false; }
  });
})();
