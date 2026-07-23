// ==========================================
// KLEINANZEIGEN HERO - APP.JS (v9.0 Final Build)
// ==========================================

const g = id => document.getElementById(id);
const gVal = id => { const el = g(id); return el ? el.value : ''; };
const esc = s => { if (s == null) return ''; if (typeof s === 'object') { try { s = JSON.stringify(s); } catch(e) { s = '[Objekt]'; } } return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
const sortKeys = (a, b) => String(a || '').localeCompare(String(b || ''), 'de');
const euro = v => Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(+v||0); 
const today = () => new Date().toISOString().slice(0,10);

function calcDays(entryDateStr, endDateStr) {
  if (!entryDateStr) return 0;
  const start = new Date(entryDateStr);
  const end = endDateStr ? new Date(endDateStr) : new Date();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function normalizeDate(dStr) { if (!dStr) return today(); const str = String(dStr).trim(); if (str.includes('.')) { const p = str.split('.'); if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`; } const dt = new Date(str); if (!isNaN(dt.getTime())) return dt.toISOString().slice(0,10); return today(); }
const fmtDate = d => { if(!d) return '-'; const dt = new Date(d); return isNaN(dt.getTime()) ? String(d) : new Intl.DateTimeFormat('de-DE',{dateStyle:'medium'}).format(dt); };
const fmtMonth = d => { if(!d) return '-'; const dt = new Date(d); return isNaN(dt.getTime()) ? String(d) : new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(dt); };
const stackKey = i => `${i.group}||${i.productType||''}||${i.article}||${i.size}||${i.color}`; 
const uid = () => 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, c => { var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });

function toast(msg) { const t = g('toast'); if(t) { t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); } }
function fillSel(el, vals, ph) { if(!el) return; el.innerHTML = `<option value="">${ph}</option>` + vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''); }

const state = {
  page: 'new', sellCart: [], psManualOverride: false, open: [], 
  openFilters: { text: '', group: '', type: '', article: '', size: '', color: '' }, 
  sold: [], soldFilter: '', termine: [], year: String(new Date().getFullYear()),
  master: { catalog: {}, badgeRules: [], images: [], setImages: [] }, openCollapse: {}, hideZero: true
};

let globalExpandState = false;
let db = null; const DB_NAME = 'amp3db', DB_VER = 1, STORE = 'data';

function openDB() { return new Promise((res, rej) => { if (db) { res(db); return; } const req = indexedDB.open(DB_NAME, DB_VER); req.onupgradeneeded = e => e.target.result.createObjectStore(STORE); req.onsuccess = e => { db = e.target.result; res(db); }; req.onerror = e => rej(e.target.error); }); }
function save() { const payload = { open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year }; try { localStorage.setItem('amp3', JSON.stringify(payload)); } catch(e) {} openDB().then(database => { const tx = database.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(payload, 'state'); }); }
function load() { openDB().then(database => { const tx = database.transaction(STORE, 'readonly'); const req = tx.objectStore(STORE).get('state'); req.onsuccess = e => { const d = e.target.result; if (d) { applyState(d); } else { try { const ls = JSON.parse(localStorage.getItem('amp3') || 'null'); if (ls) { applyState(ls); save(); } } catch(e) {} } initApp(); }; req.onerror = () => fallbackLoad(); }).catch(() => fallbackLoad()); }
function fallbackLoad() { try { const ls = JSON.parse(localStorage.getItem('amp3') || 'null'); if (ls) applyState(ls); } catch(e) {} initApp(); }

window.exportData = function() {
  const data = { open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year }; const json = JSON.stringify(data, null, 2); const filename = `kleinanzeigen-hero-${today()}.json`;
  const blob = new Blob([json], { type:'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 1000); toast('Exportiert ✓');
};

window.importData = function(file) {
  if (!file) return; toast('Lese Datei...'); const reader = new FileReader();
  reader.onload = e => { 
    try { 
      let d = JSON.parse(e.target.result); 
      if (Array.isArray(d)) d = { open: d }; 
      else if (d.state) d = d.state; 
      else if (d.data) d = d.data; 
      applyState(d); 
      save(); 
      updateMasterForm(); 
      renderAllQuick(); 
      renderMaster(); 
      render(); 
      toast('Import erfolgreich ✓'); 
    } catch(err) { 
      alert('Fehler beim Importieren: ' + err.message); 
    } 
  };
  reader.readAsText(file);
};

window.saveToCloud = async function() {
  const gasUrl = gVal('gasUrl').trim(); if(!gasUrl) return toast('Bitte Script URL eingeben.'); localStorage.setItem('gasUrl', gasUrl);
  const cloudPayload = { open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year };
  try { toast('Speichere in Cloud...'); const res = await fetch(gasUrl, { method: 'POST', body: JSON.stringify(cloudPayload) }); const text = await res.text(); try { const result = JSON.parse(text); if(result.status === 'success') toast('Sync erfolgreich ✓'); else toast('Fehler: ' + result.message); } catch(err) { alert("Zugriff blockiert."); } } catch(e) { toast('Netzwerkfehler'); }
};

window.loadFromCloud = async function() {
  const gasUrl = gVal('gasUrl').trim(); if(!gasUrl) return toast('Bitte URL eingeben.'); localStorage.setItem('gasUrl', gasUrl);
  try { toast('Lade aus Cloud...'); const fetchUrl = gasUrl + (gasUrl.includes('?') ? '&' : '?') + 'nocache=' + new Date().getTime(); const res = await fetch(fetchUrl); const text = await res.text(); try { const data = JSON.parse(text); if(data.error) return toast('Fehler: ' + data.error); applyState(data); save(); updateMasterForm(); renderAllQuick(); renderMaster(); render(); toast('Download erfolgreich ✓'); } catch(err) { alert("Datenfehler."); } } catch(e) { alert('Netzwerkfehler'); }
};

function compressImage(file, callback) {
    const reader = new FileReader(); reader.onload = e => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); let w = img.width, h = img.height; const MAX = 800; if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; } else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } canvas.width = w; canvas.height = h; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h); callback(canvas.toDataURL('image/jpeg', 0.75)); }; img.src = e.target.result; }; reader.readAsDataURL(file);
}

function initApp() { 
  updateMasterForm(); 
  populateUhrzeit(); 
  renderAllQuick(); 
  const gasUrl = g('gasUrl'); if(gasUrl) gasUrl.value = localStorage.getItem('gasUrl') || ''; 
  const td = g('terminDatum'); if(td) td.value = today();
  render(); 
}

function applyState(d) {
  try {
    state.open = Array.isArray(d.open) ? d.open.filter(Boolean) : [];
    if (d.sold !== undefined && Array.isArray(d.sold)) state.sold = d.sold.filter(Boolean);
    if (d.termine !== undefined && Array.isArray(d.termine)) state.termine = d.termine.filter(Boolean);
    if (!state.master) state.master = { catalog: {}, badgeRules: [], images: [], setImages: [] };
    
    if (d.master && d.master.catalog && typeof d.master.catalog === 'object' && !Array.isArray(d.master.catalog)) {
      state.master.catalog = JSON.parse(JSON.stringify(d.master.catalog)); 
    }
    if (d.master) { 
      if (Array.isArray(d.master.images)) state.master.images = d.master.images; 
      if (Array.isArray(d.master.setImages)) state.master.setImages = d.master.setImages; 
      if (Array.isArray(d.master.badgeRules)) state.master.badgeRules = d.master.badgeRules;
    }
    if (!state.master.catalog || typeof state.master.catalog !== 'object') state.master.catalog = {};

    const autoAdd = (grPrm, ptPrm, a, s, c) => {
        if (!grPrm) return; const grp = String(grPrm).trim(); if (!grp) return; const typ = ptPrm ? String(ptPrm).trim() : 'Standardtyp';
        if (!state.master.catalog[grp]) state.master.catalog[grp] = {}; 
        if (!state.master.catalog[grp][typ]) state.master.catalog[grp][typ] = { articles: [], sizes: [], colors: [], images: [] };
        const target = state.master.catalog[grp][typ];
        if (!Array.isArray(target.articles)) target.articles = []; 
        if (!Array.isArray(target.sizes)) target.sizes = []; 
        if (!Array.isArray(target.colors)) target.colors = [];
        if (a && !target.articles.includes(String(a).trim())) target.articles.push(String(a).trim());
        if (s && !target.sizes.includes(String(s).trim())) target.sizes.push(String(s).trim());
        if (c && !target.colors.includes(String(c).trim())) target.colors.push(String(c).trim());
    };

    state.open.forEach(item => autoAdd(item.group, item.productType, item.article, item.size, item.color));
    state.sold.forEach(set => { (set.items || []).forEach(item => autoAdd(item.group, item.productType, item.article, item.size, item.color)); });

    let newOpen = [];
    for (let i=0; i < state.open.length; i++) {
      let item = state.open[i]; if (!item) continue;
      if (!item.instances || !Array.isArray(item.instances)) {
          item.instances = []; let qty = item.quantity || item.menge || 1;
          for (let j=0; j < qty; j++) { item.instances.push({ id: uid(), purchasePrice: item.purchasePrice || 0, entryDate: normalizeDate(item.entryDate || item.datum), profitshare: !!item.profitshare, image: item.image || '' }); }
      } else {
          item.instances.forEach(inst => { if(!inst.id) inst.id = uid(); inst.entryDate = normalizeDate(inst.entryDate || item.entryDate || item.datum); });
      }
      if(!item.id) item.id = uid(); newOpen.push(item);
    }
    state.open = newOpen;

    state.sold.forEach(s => {
       if(!s.items || !Array.isArray(s.items)) s.items = []; if(!s.id) s.id = uid();
       s.saleDate = normalizeDate(s.saleDate || s.datum);
    });
  } catch(e) { console.error(e); }
}

// SET BADGES
window.currentEditBadgeIndex = null;
window.updateBadgeProdType = function() {
    const grp = gVal('newBadgeGroup'); const ptSel = g('newBadgeProdType'); if(!ptSel) return;
    if(!grp || !state.master.catalog || !state.master.catalog[grp]) { ptSel.innerHTML = '<option value="">– Produkttyp –</option>'; return; }
    const typs = Object.keys(state.master.catalog[grp]).sort(sortKeys); const currentVal = ptSel.value;
    ptSel.innerHTML = '<option value="">– Produkttyp –</option>' + typs.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    if (typs.includes(currentVal)) ptSel.value = currentVal;
};

window.openBadgeImgPicker = function() { imagePickCallback = (url) => { const nbi = g('newBadgeImg'); if(nbi) nbi.value = url; const bip = g('badgeImgPreview'); if(bip) bip.innerHTML = url ? `<img src="${url}" style="width:16px;height:16px;object-fit:cover;border-radius:4px;vertical-align:middle;">` : '📷'; }; const nbi = g('newBadgeImg'); openImagePicker(nbi ? nbi.value : ''); };

window.addBadgeRule = function() {
    const name = gVal('newBadgeName').trim(); const grp = gVal('newBadgeGroup'); const pt = gVal('newBadgeProdType'); const reqsStr = gVal('newBadgeReqs').trim(); const image = gVal('newBadgeImg');
    if(!name || !grp || !pt || !reqsStr) return alert('Bitte alle Pflichtfelder ausfüllen.');
    const reqs = reqsStr.split(',').map(s => { const parts = s.toLowerCase().split('x'); if(parts.length !== 2) return null; const size = parts[0].trim(); const qty = parseInt(parts[1].trim()); if(!size || isNaN(qty)) return null; return {size, qty}; }).filter(Boolean);
    if(reqs.length === 0) return alert('Ungültiges Bedarfs-Format. Bitte z.B. 64x2 eingeben.');
    if(!Array.isArray(state.master.badgeRules)) state.master.badgeRules = [];
    if (window.currentEditBadgeIndex !== null && window.currentEditBadgeIndex >= 0) { state.master.badgeRules[window.currentEditBadgeIndex] = { name, group: grp, productType: pt, reqs, image }; window.currentEditBadgeIndex = null; toast('Regel aktualisiert ✓'); } else { state.master.badgeRules.push({ name, group: grp, productType: pt, reqs, image }); toast('Regel hinzugefügt ✓'); }
    const nbi = g('newBadgeImg'); if(nbi) nbi.value = ''; const bip = g('badgeImgPreview'); if(bip) bip.innerHTML = '📷'; save(); renderMaster();
};

window.editBadgeRule = function(idx) {
    if (!Array.isArray(state.master.badgeRules) || !state.master.badgeRules[idx]) return; const rule = state.master.badgeRules[idx];
    const nbn = g('newBadgeName'); if(nbn) nbn.value = rule.name || ''; const nbg = g('newBadgeGroup'); if(nbg) nbg.value = rule.group || ''; window.updateBadgeProdType(); const nbpt = g('newBadgeProdType'); if(nbpt) nbpt.value = rule.productType || '';
    const reqsArr = Array.isArray(rule.reqs) ? rule.reqs : []; const nbreqs = g('newBadgeReqs'); if(nbreqs) nbreqs.value = reqsArr.map(r => `${r.size}x${r.qty}`).join(', ');
    const nbi = g('newBadgeImg'); if(nbi) nbi.value = rule.image || ''; const bip = g('badgeImgPreview'); if(bip) bip.innerHTML = rule.image ? `<img src="${rule.image}" style="width:16px;height:16px;object-fit:cover;border-radius:4px;vertical-align:middle;">` : '📷';
    window.currentEditBadgeIndex = idx; const bft = g('badgeFormTitle'); if(bft) bft.textContent = 'Regel bearbeiten'; const sbb = g('saveBadgeBtn'); if(sbb) sbb.innerHTML = '✓ Aktualisieren'; const cbb = g('cancelBadgeBtn'); if(cbb) cbb.style.display = 'inline-flex';
};

window.cancelEditBadgeRule = function() {
    window.currentEditBadgeIndex = null; ['newBadgeName', 'newBadgeGroup', 'newBadgeReqs', 'newBadgeImg'].forEach(id => { const el = g(id); if(el) el.value = ''; });
    const nbpt = g('newBadgeProdType'); if(nbpt) nbpt.innerHTML = '<option value="">– Produkttyp –</option>';
    const bip = g('badgeImgPreview'); if(bip) bip.innerHTML = '📷';
    const bft = g('badgeFormTitle'); if(bft) bft.textContent = 'Neue Regel erstellen';
    const sbb = g('saveBadgeBtn'); if(sbb) sbb.innerHTML = '✚ Regel speichern';
    const cbb = g('cancelBadgeBtn'); if(cbb) cbb.style.display = 'none';
};

window.deleteBadgeRule = function(idx) { if(!confirm('Regel löschen?')) return; if (Array.isArray(state.master.badgeRules)) { state.master.badgeRules.splice(idx, 1); } if (window.currentEditBadgeIndex === idx) window.cancelEditBadgeRule(); save(); renderMaster(); };

window.openSetBadgesModal = function() {
  const content = g('setBadgesContent'); if(!content) return;
  const rules = Array.isArray(state.master.badgeRules) ? state.master.badgeRules : [];
  const badgeResults = {}; const displayOrder = [];
  rules.forEach(r => { if(r && r.name && !badgeResults[r.name]) { badgeResults[r.name] = {items: [], image: r.image || ''}; displayOrder.push(r.name); } });
  const inventory = {};
  state.open.forEach(item => {
    if (!item.instances || item.instances.length === 0) return; 
    const key = (item.group||'–') + '::' + (item.productType||'–') + '::' + (item.article||'–') + '::' + (item.color||'–');
    if (!inventory[key]) inventory[key] = { grp: item.group||'–', pt: item.productType||'–', art: item.article||'–', col: item.color||'–', counts: {} };
    const size = item.size || '–'; if (!inventory[key].counts[size]) inventory[key].counts[size] = 0; inventory[key].counts[size] += item.instances.length;
  });
  Object.values(inventory).forEach(inv => {
     const label = `${inv.art} ${inv.col}`;
     rules.forEach(rule => {
        if (!rule || inv.grp !== rule.group || inv.pt !== rule.productType) return;
        let pass = true; const reqs = Array.isArray(rule.reqs) ? rule.reqs : [];
        for (let req of reqs) { if ((inv.counts[req.size] || 0) < req.qty) { pass = false; break; } }
        if (pass && reqs.length > 0) { if(badgeResults[rule.name] && !badgeResults[rule.name].items.includes(label)) badgeResults[rule.name].items.push(label); }
     });
  });
  let html = ''; let hasAny = false;
  displayOrder.forEach(badgeName => {
    const data = badgeResults[badgeName];
    if (data && data.items.length > 0) {
      hasAny = true; html += `<div style="padding:var(--sp2) 0; border-bottom:1px solid var(--divider); display:flex; gap:12px; align-items:center;">${data.image ? `<img src="${data.image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;">` : `<div style="width:40px;height:40px;border-radius:6px;border:1px dashed var(--border);display:grid;place-items:center;color:var(--muted);flex-shrink:0;">📷</div>`}<div style="line-height:1.4;"><strong style="display:block; color:var(--primary);">${esc(badgeName)}</strong><span style="color:var(--text);font-size:var(--text-sm);">${data.items.map(esc).join(' <span style="color:var(--muted); margin:0 4px;">|</span> ')}</span></div></div>`;
    }
  });
  if (!hasAny) html = '<div class="empty">Aktuell können keine Sets aus den definierten Regeln gebildet werden.</div>';
  content.innerHTML = html; const sbm = g('setBadgesModal'); if(sbm) { sbm.style.display = 'flex'; sbm.classList.add('show'); }
};

window.closeSetBadgesModal = function() { const m = g('setBadgesModal'); if(m) { m.classList.remove('show'); m.style.display = 'none'; } };

function updateMasterForm() {
  try {
      const mType = g('masterType'); if(!mType) return; const type = mType.value;
      const needGrp = ['producttypes','articles','sizes','colors'].includes(type); const needTyp = ['articles','sizes','colors'].includes(type);
      const groups = Object.keys(state.master.catalog || {}).sort(sortKeys); const mGrp = g('masterGroup');
      if(mGrp) { const curGrp = mGrp.value; mGrp.innerHTML = '<option value="">– Gruppe –</option>' + groups.map(grp=>`<option value="${esc(grp)}"${grp===curGrp?' selected':''}>${esc(grp)}</option>`).join(''); }
      const selGrp = mGrp ? mGrp.value : ''; const typs = selGrp && state.master.catalog[selGrp] ? Object.keys(state.master.catalog[selGrp]).sort(sortKeys) : []; const mTyp = g('masterProdType');
      if(mTyp) { const curTyp = mTyp.value; mTyp.innerHTML = '<option value="">– Typ –</option>' + typs.map(t=>`<option value="${esc(t)}"${t===curTyp?' selected':''}>${esc(t)}</option>`).join(''); }
      document.querySelectorAll('.mf-grp').forEach(el => el.style.display = needGrp ? 'grid' : 'none'); document.querySelectorAll('.mf-typ').forEach(el => el.style.display = needTyp ? 'grid' : 'none'); document.querySelectorAll('.mf-val').forEach(el => el.style.display = type !== 'images' ? 'grid' : 'none');
  } catch(e) {}
}

const mfBtn = g('masterForm');
if(mfBtn) {
    mfBtn.addEventListener('submit', e => {
      e.preventDefault();
      try {
        const type = gVal('masterType'); const val = gVal('masterValue').trim(); const grp = gVal('masterGroup'); const typ = gVal('masterProdType');
        if (!state.master.catalog) state.master.catalog = {};
        if (type === 'groups') { if (!val) return alert('Name eingeben.'); if (state.master.catalog[val] !== undefined) return alert('Existiert bereits.'); state.master.catalog[val] = {}; }
        else if (type === 'producttypes') { if (!grp || !val) return alert('Pflichtfelder fehlen.'); if (!state.master.catalog[grp]) state.master.catalog[grp] = {}; if (state.master.catalog[grp][val] !== undefined) return alert('Existiert bereits.'); state.master.catalog[grp][val] = { articles:[], sizes:[], colors:[], images:[] }; }
        else if (type === 'articles' || type === 'sizes' || type === 'colors') { if (!grp || !typ || !val) return alert('Pflichtfelder fehlen.'); if (!state.master.catalog[grp] || !state.master.catalog[grp][typ]) return alert('Gruppe/Typ fehlt.'); let arr = state.master.catalog[grp][typ][type]; if (!Array.isArray(arr)) { arr = []; state.master.catalog[grp][typ][type] = arr; } if (arr.includes(val)) return alert('Existiert bereits.'); arr.push(val); arr.sort(sortKeys); }
        if(g('masterValue')) g('masterValue').value = ''; updateMasterForm(); renderAllQuick(); save(); renderMaster(); toast('Gespeichert ✓');
      } catch(err) { alert('Fehler: ' + err.message); }
    });
}

function renderMaster() {
  try {
      const cat = state.master.catalog || {}; const groups = Object.keys(cat).sort(sortKeys); let html = '';
      if (groups.length) {
        groups.forEach(grp => {
          const typs = Object.keys(cat[grp] || {}).sort(sortKeys);
          html += `<div class="card" style="margin-bottom:var(--sp4);"><div class="card-head"><h3 class="card-title">📁 ${esc(grp)}</h3><button class="btn btn-danger" style="min-height:28px;padding:.2rem .6rem;font-size:var(--text-xs);width:auto;" data-rm="group" data-grp="${esc(grp)}">🗑 Gruppe</button></div><div class="card-body" style="padding:0;">`;
          if (!typs.length) { html += `<div class="empty" style="margin:var(--sp4);">Noch keine Produkttypen.</div>`; }
          typs.forEach(typ => {
            const d = cat[grp][typ] || {};
            html += `<div style="border-bottom:1px solid var(--divider);padding:var(--sp3) var(--sp4);"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp2);"><b style="font-size:var(--text-sm);">🏷 ${esc(typ)}</b><button class="btn btn-danger" style="min-height:26px;padding:.2rem .5rem;font-size:var(--text-xs);width:auto;" data-rm="prodtype" data-grp="${esc(grp)}" data-typ="${esc(typ)}">🗑 Typ</button></div>${['articles','sizes','colors'].map(field=>{ const labels={articles:'Artikelname',sizes:'Größen',colors:'Farben'}; const fieldArr = Array.isArray(d[field]) ? d[field] : []; return `<div style="margin-bottom:var(--sp2);"><div class="muted" style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp1);">${labels[field]}</div><div class="chips">${fieldArr.map((v,i)=>`<span class="chip" style="display:inline-flex;align-items:center;gap:4px;">${esc(v)}<button style="background:none;border:none;cursor:pointer;color:var(--err);font-size:12px;padding:0;line-height:1;" data-rm="${field}" data-grp="${esc(grp)}" data-typ="${esc(typ)}" data-idx="${i}">×</button></span>`).join('') || '<span class="muted" style="font-size:var(--text-xs);">Noch keine Einträge</span>'}</div></div>`; }).join('')}</div>`;
          });
          html += `</div></div>`;
        });
      } else { html += `<div class="empty">Noch keine Gruppen angelegt.</div>`; }
      
      const imgs = Array.isArray(state.master.images) ? state.master.images : [];
      html += `<div class="card" style="margin-bottom:var(--sp4);"><div class="card-head"><div style="display:flex;align-items:center;gap:8px;"><h3 class="card-title">🖼 Bilder</h3><span class="chip">${imgs.length}</span></div></div><div class="card-body"><div class="img-grid">${imgs.length ? imgs.map((url,i)=>`<div class="img-card" style="position:relative;"><img src="${url}" loading="lazy" style="width:100%;height:80px;object-fit:cover;"><button class="btn-icon-subtle danger" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.7);padding:2px 6px;" onclick="window.deleteMasterImage(${i})">🗑</button></div>`).join('') : '<div class="empty" style="grid-column:1/-1;">Noch keine Bilder.</div>'}</div></div></div>`;
      
      const safeBadgeRules = Array.isArray(state.master.badgeRules) ? state.master.badgeRules : [];
      html += `<div class="card" style="margin-bottom:var(--sp4);"><div class="card-head"><h3 class="card-title">🏆 Set Badges (Regeln)</h3></div><div class="card-body"><div id="badgeRulesList" style="margin-bottom:var(--sp3);">${safeBadgeRules.map((r, i) => { const reqsArr = Array.isArray(r.reqs) ? r.reqs : []; return `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--divider); padding:var(--sp2) 0;"><div style="display:flex; gap:12px; align-items:center;">${r.image ? `<img src="${r.image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;">` : `<div style="width:40px;height:40px;border-radius:6px;border:1px dashed var(--border);display:grid;place-items:center;color:var(--muted);flex-shrink:0;">📷</div>`}<div><b style="font-size:var(--text-base);">${esc(r.name)}</b> <span style="color:var(--muted); font-size:var(--text-xs);">(${esc(r.group)} · ${esc(r.productType)})</span><br><span style="font-size:var(--text-sm); font-weight:600; color:var(--primary);">${reqsArr.map(req => `${req.qty||1}x Gr. ${esc(req.size)}`).join(', ')}</span></div></div><div style="display:flex; gap:4px;"><button class="btn-icon-subtle" onclick="window.editBadgeRule(${i})" title="Bearbeiten">✏️</button><button class="btn-icon-subtle danger" onclick="window.deleteBadgeRule(${i})" title="Löschen">🗑️</button></div></div>`; }).join('') || '<div class="empty">Keine Regeln definiert.</div>'}</div><div style="background:var(--surface2); padding:var(--sp3); border-radius:var(--rad-md); border:1px solid var(--border);"><h4 id="badgeFormTitle" style="font-size:var(--text-sm); margin:0 0 var(--sp2);">Neue Regel erstellen</h4><div class="grid2" style="gap:8px;"><input type="text" class="input" id="newBadgeName" placeholder="Name (z.B. TV 180)"><select class="select" id="newBadgeGroup" onchange="window.updateBadgeProdType()"><option value="">– Gruppe wählen –</option>${groups.map(grp => `<option value="${esc(grp)}">${esc(grp)}</option>`).join('')}</select><select class="select" id="newBadgeProdType"><option value="">– Produkttyp –</option></select><input type="text" class="input" id="newBadgeReqs" placeholder="Bedarf (z.B. 64x2, 38x1)"></div><div style="display:flex; gap:8px; margin-top:8px; align-items:center;"><button type="button" class="btn btn-ghost" style="padding:4px 10px; min-height:32px; font-size:var(--text-xs);" onclick="window.openBadgeImgPicker()"><span id="badgeImgPreview">📷</span> Bild (optional)</button><input type="hidden" id="newBadgeImg"></div><div style="display:flex; gap:8px; margin-top:var(--sp3);"><button id="saveBadgeBtn" class="btn btn-primary" style="flex:1;" onclick="window.addBadgeRule()">✚ Regel speichern</button><button id="cancelBadgeBtn" class="btn btn-ghost" style="display:none;" onclick="window.cancelEditBadgeRule()">Abbrechen</button></div></div></div></div>`;

      const mc = g('masterContent'); if (mc) mc.innerHTML = html;
  } catch (err) {}
}

window.deleteMasterImage = function(idx) {
  if (!confirm('Bild löschen?')) return;
  if (Array.isArray(state.master.images)) {
    state.master.images.splice(idx, 1);
    save(); renderMaster(); toast('Bild gelöscht ✓');
  }
};

function onGroupChange() { if(state.page !== 'new') return; ['productType', 'article', 'size', 'color'].forEach(id => { const el = g(id); if (el) el.value = ''; }); renderAllQuick(); }
function onProductTypeChange() { if(state.page !== 'new') return; ['article', 'size', 'color'].forEach(id => { const el = g(id); if (el) el.value = ''; }); renderAllQuick(); }

window.handleQuickSelect = function(selId, val) {
    const sel = g(selId); if (!sel) return;
    if (sel.value === val) { sel.value = ''; } else { let exists = Array.from(sel.options).some(o => o.value === val); if (!exists) sel.add(new Option(val, val)); sel.value = val; }
    if (selId === 'group') onGroupChange(); else if (selId === 'productType') onProductTypeChange(); else renderAllQuick();
};

window.removeQuick = function(type, val) {
    if(!confirm(`"${val}" entfernen?`)) return;
    const grpVal = gVal('group'); const ptVal = gVal('productType'); const cat = state.master.catalog;
    if (type === 'group') { if(cat[val]) delete cat[val]; if (grpVal === val) { g('group').value = ''; onGroupChange(); } } 
    else if (type === 'productType') { if (cat[grpVal] && cat[grpVal][val]) { delete cat[grpVal][val]; } if (ptVal === val) { g('productType').value = ''; onProductTypeChange(); } } 
    else { const arrMap = { article: 'articles', size: 'sizes', color: 'colors' }; const arrName = arrMap[type]; if (cat[grpVal] && cat[grpVal][ptVal] && Array.isArray(cat[grpVal][ptVal][arrName])) { cat[grpVal][ptVal][arrName] = cat[grpVal][ptVal][arrName].filter(x => String(x) !== String(val)); } if (g(type) && g(type).value === val) g(type).value = ''; }
    save(); updateMasterForm(); renderAllQuick(); renderMaster();
};

window.addQuick = function(type) {
    const grpVal = gVal('group'); const ptVal = gVal('productType');
    if (type !== 'group' && !grpVal) return alert('Zuerst Gruppe wählen.'); if (['article', 'size', 'color'].includes(type) && !ptVal) return alert('Zuerst Produkttyp wählen.');
    const v = prompt('Neuer Eintrag:'); if (!v || v.trim() === '') return; const val = v.trim(); const cat = state.master.catalog;
    if (type === 'group') { if (!cat[val]) cat[val] = {}; handleQuickSelect('group', val); } 
    else if (type === 'productType') { if (!cat[grpVal]) cat[grpVal] = {}; if (!cat[grpVal][val]) cat[grpVal][val] = { articles: [], sizes: [], colors: [] }; handleQuickSelect('productType', val); } 
    else { const arrMap = { article: 'articles', size: 'sizes', color: 'colors' }; const arrName = arrMap[type]; if (!cat[grpVal]) cat[grpVal] = {}; if (!cat[grpVal][ptVal]) cat[grpVal][ptVal] = { articles: [], sizes: [], colors: [] }; if (!Array.isArray(cat[grpVal][ptVal][arrName])) cat[grpVal][ptVal][arrName] = []; if (!cat[grpVal][ptVal][arrName].includes(val)) { cat[grpVal][ptVal][arrName].push(val); cat[grpVal][ptVal][arrName].sort(sortKeys); } handleQuickSelect(type, val); }
    save(); updateMasterForm(); renderMaster();
};

function renderQChips(type, items, currentVal) {
    const c = g('qb-' + type); if (!c) return;
    const safeItems = Array.isArray(items) ? items : [];
    let h = safeItems.map(val => {
        if(val == null) return ''; const strVal = String(val); const isActive = (strVal === String(currentVal||'')); const safeVal = strVal.replace(/'/g,"\\'").replace(/"/g,"&quot;");
        return `<div class="qb-chip ${isActive ? 'active' : ''}" onclick="window.handleQuickSelect('${type}', '${safeVal}')"><span>${esc(strVal)}</span><span class="qb-rm" onclick="event.stopPropagation(); window.removeQuick('${type}', '${safeVal}')">×</span></div>`;
    }).join('');
    h += `<button type="button" class="qb-chip qb-add" onclick="window.addQuick('${type}')">✚ Neu</button>`; c.innerHTML = h;
}

function renderAllQuick() {
  try {
    const grpVal = gVal('group'); const ptVal = gVal('productType');
    const fpt = g('field-productType'); if(fpt) fpt.style.display = grpVal ? 'grid' : 'none'; 
    const fa = g('field-article'); if(fa) fa.style.display = (grpVal && ptVal) ? 'grid' : 'none'; 
    const fsc = g('field-size-color'); if(fsc) fsc.style.display = (grpVal && ptVal) ? 'grid' : 'none';
    
    const cat = state.master.catalog || {}; 
    renderQChips('group', Object.keys(cat).sort(sortKeys), grpVal);
    let typs = (grpVal && cat[grpVal]) ? Object.keys(cat[grpVal]).sort(sortKeys) : [];
    renderQChips('productType', typs, ptVal);

    let arts = [], sizes = [], colors = [];
    if (grpVal && ptVal && cat[grpVal][ptVal]) { arts = cat[grpVal][ptVal].articles||[]; sizes = cat[grpVal][ptVal].sizes||[]; colors = cat[grpVal][ptVal].colors||[]; }
    if(g('article')) renderQChips('article', arts, gVal('article')); 
    if(g('size')) renderQChips('size', sizes, gVal('size')); 
    if(g('color')) renderQChips('color', colors, gVal('color'));
  } catch(e) { }
}

const ifrm = g('itemForm');
if(ifrm) {
    ifrm.addEventListener('submit', e => {
      e.preventDefault(); const pP = g('purchasePrice'); const totalPrice = pP ? +pP.value : 0; if (!gVal('group') || !gVal('productType')) return alert('Gruppe & Typ wählen.'); const qEl = g('quantity'); const qty = qEl ? +qEl.value : 1; let pricePerUnit = qty > 0 ? totalPrice / qty : 0;
      const psEl = g('profitshare'); const dEl = g('defect');
      for(let q=0;q<qty;q++) { const item = { group:gVal('group'), productType:gVal('productType'), article:gVal('article'), size:gVal('size'), color:gVal('color'), purchasePrice:pricePerUnit, profitshare:psEl?psEl.checked:false, image:gVal('imgValue'), comment:dEl?dEl.value:'', defect:dEl?dEl.value:'', entryDate:today() }; addOrStack(item); }
      save(); toast(qty>1?qty+' Artikel hinzugefügt ✓':'Artikel hinzugefügt ✓'); state.page='open'; render();
    });
}

function addOrStack(item) { const key = stackKey(item); const ex = state.open.find(i=>stackKey(i)===key); const inst = { id:uid(), image:item.image, comment:item.comment, defect:item.defect, entryDate:item.entryDate, profitshare:item.profitshare, purchasePrice:item.purchasePrice }; if (ex) { ex.instances.push(inst); } else { state.open.unshift({ id:uid(), group:item.group, productType:item.productType, article:item.article, size:item.size, color:item.color, purchasePrice:item.purchasePrice, profitshare:item.profitshare, instances:[inst] }); } }

let imagePickCallback = null;
window.openNewImgPicker = function() { imagePickCallback = (url) => { const iv = g('imgValue'); if(iv) iv.value = url; const prev = g('imgPreview'); const lbl = g('imgLabel'); if(prev) prev.innerHTML = url ? `<img src="${url}" style="width:28px;height:28px;object-fit:cover;border-radius:6px;">` : '🖼'; if(lbl) lbl.textContent = url ? 'Bild gewählt ✓' : 'Wählen…'; }; const iv = g('imgValue'); openImagePicker(iv ? iv.value : ''); };

function openImagePicker(currentUrl='') {
  const modal = g('imagePickerModal'); const list = g('imagePickerList'); if(!modal || !list) return;
  const catImgs = (gVal('group') && gVal('productType') && state.master.catalog[gVal('group')]?.[gVal('productType')]?.images) || [];
  const allImgs = [...new Set([...catImgs, ...(state.master.images||[])])];
  const uploadTile = `<label class="img-pick-upload" style="border:2px dashed var(--primary); display:flex; flex-direction:column; align-items:center; justify-content:center; height:100px; border-radius:8px; cursor:pointer; background:var(--surface2); color:var(--primary); font-weight:bold; font-size:var(--text-xs);"><span style="font-size:1.5rem;">✚</span><span>Upload</span><input type="file" accept="image/*" style="display:none;" onchange="window.handleModalImageUpload(this.files[0])"></label>`;
  list.innerHTML = uploadTile + (allImgs.length ? allImgs.map(u => `<button type="button" class="img-pick" data-url="${u.replace(/"/g,'&quot;')}" style="border:2px solid ${u===currentUrl?'#4caf50':'transparent'}"><img src="${u}" loading="lazy" style="width:100%;height:100px;object-fit:cover;border-radius:8px;"></button>`).join('') : '');
  modal.style.display='flex'; modal.classList.add('show');
}
window.closeImagePicker = function() { const modal = g('imagePickerModal'); if(modal){ modal.classList.remove('show'); modal.style.display='none'; } };

window.handleModalImageUpload = function(file) {
  if (!file) return;
  compressImage(file, url => {
    if (!Array.isArray(state.master.images)) state.master.images = [];
    state.master.images.unshift(url); save();
    if (imagePickCallback) imagePickCallback(url);
    window.closeImagePicker(); toast('Bild hochgeladen ✓');
  });
};

window.editItem = function(itemId) { const item = state.open.find(i=>i.id===itemId); if (!item) return; const newArticle = prompt('Artikelname:', item.article||''); if(newArticle === null) return; item.article = newArticle; save(); renderOpen(); };
window.deleteItem = function(itemId) { if (!confirm('Artikel löschen?')) return; state.open = state.open.filter(i=>i.id!==itemId); save(); renderOpen(); };
window.editEK = function(itemId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; const val = prompt('EK Preis (€):', item.purchasePrice||0); if(val === null) return; const price = parseFloat(val.replace(',','.')) || 0; item.instances.forEach(inst => inst.purchasePrice = price); save(); renderOpen(); };
window.editItemImage = function(itemId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; imagePickCallback = (url) => { if(item.instances[0]) item.instances[0].image = url; save(); renderOpen(); }; openImagePicker(''); };
window.toggleItemProfitshare = function(itemId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; const newVal = !item.instances.some(x=>x.profitshare); item.instances.forEach(x=>x.profitshare = newVal); save(); renderOpen(); };
window.changeQty = function(itemId, delta) { const item = state.open.find(i=>i.id===itemId); if(!item) return; if(delta > 0) { item.instances.push({ id: uid(), purchasePrice: item.instances[0]?.purchasePrice||0, profitshare: false, entryDate: today() }); } else if(item.instances.length > 0) { item.instances.pop(); } save(); renderOpen(); };

window.toggleAllGroups = function() { globalExpandState = !globalExpandState; state.openCollapse = {}; renderOpen(); };
window.toggleZeroFilter = function() { state.hideZero = !state.hideZero; updateZeroToggleUI(); renderOpen(); };
function updateZeroToggleUI() { const track = g('zeroFilterBtn'); const knob = g('zeroFilterKnob'); if(track) track.style.background = state.hideZero ? 'var(--primary)' : '#ccc'; if(knob) knob.style.left = state.hideZero ? '22px' : '2px'; }

window.updateOpenFilters = function() {
  state.openFilters.text = gVal('openSearchText').trim();
  state.openFilters.group = gVal('openSearchGroup');
  state.openFilters.type = gVal('openSearchType');
  state.openFilters.article = gVal('openSearchArticle');
  state.openFilters.size = gVal('openSearchSize');
  state.openFilters.color = gVal('openSearchColor');
  renderOpen();
};

function populateOpenFilterDropdowns() {
  const grpSel = g('openSearchGroup'); const typSel = g('openSearchType'); const artSel = g('openSearchArticle'); const szSel = g('openSearchSize'); const colSel = g('openSearchColor'); if(!grpSel) return;
  const grps = new Set(), typs = new Set(), arts = new Set(), sizes = new Set(), colors = new Set();
  state.open.forEach(i => {
    if (state.hideZero && (!i.instances || i.instances.length === 0)) return;
    if(i.group) grps.add(i.group);
    if(i.productType) typs.add(i.productType);
    if(i.article) arts.add(i.article);
    if(i.size) sizes.add(i.size);
    if(i.color) colors.add(i.color);
  });
  const f = state.openFilters;
  const updateSel = (el, set, currentVal, label) => { if(!el) return; el.innerHTML = `<option value="">${label}</option>` + [...set].sort(sortKeys).map(v => `<option value="${esc(v)}"${v===currentVal?' selected':''}>${esc(v)}</option>`).join(''); };
  updateSel(grpSel, grps, f.group, 'Gruppe'); updateSel(typSel, typs, f.type, 'Produkttyp'); updateSel(artSel, arts, f.article, 'Artikelname');
  updateSel(szSel, sizes, f.size, 'Größe'); updateSel(colSel, colors, f.color, 'Farbe');
}

window.toggleGrp = function(el) {
  const key = el.dataset.key; const body = document.querySelector(`div[data-body="${key}"]`); if (!body) return;
  const isCurrentlyOpen = state.openCollapse[key] !== undefined ? state.openCollapse[key] : globalExpandState;
  const willBeOpen = !isCurrentlyOpen; state.openCollapse[key] = willBeOpen; body.style.display = willBeOpen ? 'block' : 'none';
  const titleEl = el.querySelector('.group-title'); if(titleEl) { const currentText = titleEl.innerHTML; titleEl.innerHTML = (willBeOpen ? "▼ " : "▶ ") + currentText.replace(/^[▼▶]\s*/, ''); }
};

function renderOpen() {
  updateZeroToggleUI();
  populateOpenFilterDropdowns();
  const toggleAllBtn = g('toggleAllBtn'); if (toggleAllBtn) { toggleAllBtn.innerHTML = globalExpandState ? '↕ Einklappen' : '↕ Aufklappen'; }
  const oc = g('openContent'); if (!oc) return;
  if (!state.open || !state.open.length) { oc.innerHTML='<div class="empty">Keine offenen Artikel.</div>'; return; }
  
  const countPcs = arr => arr.reduce((s, i) => s + (i.instances ? i.instances.length : 0), 0);
  const isOpen = key => state.openCollapse[key] !== undefined ? state.openCollapse[key] : globalExpandState;
  const hashStr = s => Math.abs(String(s).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(36);

  const tree = {}; const f = state.openFilters; const searchTerms = f.text.toLowerCase().split(' ').filter(Boolean);
  state.open.forEach(item => {
    if (state.hideZero && (!item.instances || item.instances.length === 0)) return; 
    if (f.group && item.group !== f.group) return; 
    if (f.type && item.productType !== f.type) return; 
    if (f.article && item.article !== f.article) return;
    if (f.size && item.size !== f.size) return;
    if (f.color && item.color !== f.color) return;
    if (searchTerms.length > 0) { const searchStr = `${item.group || ''} ${item.productType || ''} ${item.article || ''} ${item.size || ''} ${item.color || ''}`.toLowerCase(); if (!searchTerms.every(term => searchStr.includes(term))) return; }
    const grp = item.group || '–'; const pt = item.productType || '–'; const art = item.article || ''; const col = item.color || '–';
    if (!tree[grp]) tree[grp] = {}; if (!tree[grp][pt]) tree[grp][pt] = {}; if (!tree[grp][pt][art]) tree[grp][pt][art] = {}; if (!tree[grp][pt][art][col]) tree[grp][pt][art][col] = [];
    tree[grp][pt][art][col].push(item);
  });
  
  let html = '';
  Object.keys(tree).sort(sortKeys).forEach(grp => {
    let grpHtml = ''; let grpTotal = 0;
    Object.keys(tree[grp]).sort(sortKeys).forEach(pt => {
      let ptHtml = ''; let ptTotal = 0;
      Object.keys(tree[grp][pt]).sort(sortKeys).forEach(art => {
        let artTotal = 0; let colHtmlMaster = '';
        Object.keys(tree[grp][pt][art]).sort(sortKeys).forEach(col => {
          const items = tree[grp][pt][art][col]; const colTotal = countPcs(items); if (colTotal === 0 && state.hideZero) return; artTotal += colTotal;
          const sizeMap = {}; items.forEach(i => { const sKey = i.size || '–'; if (!sizeMap[sKey]) sizeMap[sKey] = []; sizeMap[sKey].push(i); }); let cardsHtml = '';
          Object.values(sizeMap).forEach(sizeItems => {
            let allInst = []; sizeItems.forEach(sItem => { if(sItem.instances) { sItem.instances.forEach(i => { allInst.push({...i, _itemId:sItem.id}); }); } });
            if(allInst.length === 0 && state.hideZero) return; 
            const firstItem = sizeItems[0]; 
            let img = allInst.find(n=>n.image)?.image || firstItem._savedImage || '';
            const ekSumme = allInst.reduce((s,i)=>s+(+i.purchasePrice||0),0); const menge = allInst.length; const einzel = menge > 0 ? ekSumme / menge : (+firstItem.purchasePrice || 0); const hasPsh = menge > 0 ? allInst.some(x=>x.profitshare) : firstItem.profitshare;
            const oldestDays = allInst.length ? Math.max(...allInst.map(x => calcDays(x.entryDate, today()))) : 0;

            cardsHtml += `<div class="item-card">
              <div class="item-card-main">
                <div class="thumb">${img?`<img src="${img}" loading="lazy">` :'📦'}</div>
                <div class="item-info">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div><div class="item-title">${esc(firstItem.article) || esc(firstItem.productType) || '–'}</div></div>
                    <div style="font-size:var(--text-xs); color:var(--muted); font-weight:bold; text-align:right;">${menge} × Ø${euro(einzel)} = <b style="color:var(--text); font-size:var(--text-sm);">${euro(ekSumme)}</b></div>
                  </div>
                  <div class="chips" style="margin-top:6px;">
                    <span class="chip">Gr. ${esc(firstItem.size)||'-'}</span>
                    <span class="chip">${esc(firstItem.color)||'-'}</span>
                    <span class="chip days">⏱️ ${oldestDays} Tage im Bestand</span>
                  </div>
                </div>
              </div>
              <div class="item-footer">
                <div class="item-actions">
                  <span class="chip" style="cursor:pointer;" onclick="window.editEK('${firstItem.id}')">EK ${euro(einzel)} ✎</span>
                  <button class="chip" style="cursor:pointer;border:none" onclick="window.editItemImage('${firstItem.id}')">🖼 Bild</button>
                  <button class="chip" style="cursor:pointer;border:none" onclick="window.toggleItemProfitshare('${firstItem.id}')">${hasPsh?'PS ✓':'PS ✎'}</button>
                  <span class="chip stack" style="display:inline-flex;gap:3px;align-items:center;padding:0 6px">
                    <button onclick="window.changeQty('${firstItem.id}',1)" style="width:16px;height:16px;border-radius:50%;background:#4CAF50;color:white;font-size:10px;border:none;cursor:pointer">+</button>
                    ${menge}
                    <button onclick="window.changeQty('${firstItem.id}',-1)" style="width:16px;height:16px;border-radius:50%;background:#f44336;color:white;font-size:10px;border:none;cursor:pointer">−</button>
                  </span>
                  <button class="btn-icon-subtle" onclick="window.editItem('${firstItem.id}')" title="Bearbeiten">✏️</button>
                  <button class="btn-icon-subtle danger" onclick="window.deleteItem('${firstItem.id}')" title="Löschen">🗑️</button>
                </div>
              </div>
            </div>`;
          });
          if(cardsHtml) colHtmlMaster += `<div style="margin-bottom:var(--sp2); margin-left:var(--sp2);">${cardsHtml}</div>`;
        }); 
        if (colHtmlMaster) {
          ptTotal += artTotal; const aKey = 'a_' + hashStr(grp+pt+art);
          ptHtml += `<div style="margin-bottom:var(--sp3); margin-left:var(--sp2);"><div class="group-head" onclick="window.toggleGrp(this)" data-key="${aKey}" style="cursor:pointer;"><h4 class="group-title">${isOpen(aKey) ? "▼" : "▶"} ${esc(art)}</h4><span class="chip">${artTotal} Stk</span></div><div class="grp-body" data-body="${aKey}" style="display:${isOpen(aKey) ? "block" : "none"}">${colHtmlMaster}</div></div>`;
        }
      }); 
      if (ptHtml) {
        grpTotal += ptTotal; const pKey = 'p_' + hashStr(grp+pt);
        grpHtml += `<div style="margin-bottom:var(--sp4); margin-left:var(--sp2);"><div class="group-head" onclick="window.toggleGrp(this)" data-key="${pKey}" style="cursor:pointer;"><h3 class="group-title" style="font-size:var(--text-sm);color:var(--muted);">${isOpen(pKey) ? "▼" : "▶"} ${esc(pt)}</h3><span class="chip">${ptTotal} Stk</span></div><div class="grp-body" data-body="${pKey}" style="display:${isOpen(pKey) ? "block" : "none"}">${ptHtml}</div></div>`;
      }
    }); 
    if (grpHtml) {
      const gKey = 'g_' + hashStr(grp);
      html += `<div style="margin-bottom:var(--sp6);"><div class="group-head" onclick="window.toggleGrp(this)" data-key="${gKey}" style="cursor:pointer;"><h2 class="group-title">${isOpen(gKey) ? "▼" : "▶"} ${esc(grp)}</h2><span class="chip stack">${grpTotal} Stk</span></div><div class="grp-body" data-body="${gKey}" style="display:${isOpen(gKey) ? "block" : "none"}">${grpHtml}</div></div>`;
    }
  });
  oc.innerHTML = html || '<div class="empty">Keine Treffer.</div>';
}

function renderSold() {
  const sf = g('soldSearch'); const needle = sf ? sf.value.trim().toLowerCase() : '';
  const sets = needle ? state.sold.filter(s=>(s.setName||'').toLowerCase().includes(needle)) : state.sold;
  const sc = g('soldContent'); if (!sc) return;
  if (!sets.length) { sc.innerHTML='<div class="empty">Keine Einträge.</div>'; return; }
  
  sc.innerHTML = sets.map(set=> {
    const isProfit = (set.netProfit || 0) >= 0;
    const profitColor = isProfit ? 'color:var(--success)' : 'color:var(--err)';
    const profitSign = isProfit ? '+' : '';
    const itemCount = (set.items||[]).reduce((s,i)=>s+((i.menge||i.quantity)||1), 0);

    const summary = (set.items||[]).map(i => {
      const ptLower = (i.productType||'').toLowerCase();
      const artLower = (i.article||'').toLowerCase();
      if (ptLower.includes('tür') || artLower.includes('korpus')) {
        return i.color ? esc(i.color) : esc(i.article||'');
      }
      return `${esc(i.productType||'')} ${esc(i.article||'')} ${esc(i.color||'')}`.trim();
    }).filter(Boolean).join(' · ');

    const daysInStock = set.avgDaysInStock !== undefined ? set.avgDaysInStock : 0;

    return `<div class="sold-card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div style="display:flex; gap:var(--sp3); align-items:center; flex:1;">
          <div class="thumb">${set.previewImage?`<img src="${set.previewImage}" loading="lazy">` :'📦'}</div>
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="item-title">${esc(set.setName)||'Unbenanntes Set'}</span>
              <span style="font-weight:800; font-size:1.1rem; ${profitColor};">
                ${profitSign}${euro(set.netProfit)}
              </span>
            </div>
            <div class="chips" style="margin-top:4px;">
              <span class="chip">${itemCount} Artikel</span>
              <span class="chip">${fmtDate(set.saleDate)}</span>
              <span class="chip days">⏱️ ${daysInStock} Tage Bestand</span>
            </div>
            <div style="font-size:var(--text-xs); color:var(--muted); margin-top:4px;">${summary}</div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0;">
          <div style="font-size:var(--text-xs); color:var(--muted); white-space:nowrap;">
            VK ${euro(set.salePrice)} · EK ${euro(set.purchaseTotal)}
          </div>
          <div style="display:flex; gap:2px; align-items:center;">
            <button class="btn-icon-subtle" onclick="window.editSoldName('${set.id}')" title="Name bearbeiten">✏️</button>
            <button class="btn-icon-subtle" onclick="window.editSoldPrice('${set.id}')" title="VK bearbeiten">🏷️</button>
            <button class="btn-icon-subtle" onclick="window.editSoldImage('${set.id}')" title="Bild ändern">🖼️</button>
            <button class="btn-icon-subtle danger" onclick="window.deleteSoldSet('${set.id}')" title="Löschen">🗑️</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

window.deleteSoldSet = function(id) {
  if (!confirm('Verkaufte Position löschen?')) return;
  state.sold = state.sold.filter(s => s.id !== id);
  save(); renderSold(); toast('Gelöscht ✓');
};

// INTELLIGENTE STATISTIK MIT SPEZIFIKATIONEN & TOP 5 RANKING
window.onStatsFilterChange = function(type) {
  if (type === 'grp') { g('statsFilterTyp').value = ''; g('statsFilterArt').value = ''; }
  else if (type === 'typ') { g('statsFilterArt').value = ''; }
  renderStats();
};

function populateStatsFilters() {
  const grpSel = g('statsFilterGrp'); const typSel = g('statsFilterTyp'); const artSel = g('statsFilterArt'); if (!grpSel) return;
  const curGrp = grpSel.value; const curTyp = typSel.value; const curArt = artSel.value;
  const grps = new Set(), typs = new Set(), arts = new Set();

  state.sold.forEach(s => {
    (s.items||[]).forEach(i => {
      if (i.group) grps.add(i.group);
      if (!curGrp || i.group === curGrp) {
        if (i.productType) typs.add(i.productType);
        if (!curTyp || i.productType === curTyp) {
          if (i.article) arts.add(i.article);
        }
      }
    });
  });

  fillSel(grpSel, [...grps].sort(sortKeys), 'Alle Gruppen'); grpSel.value = curGrp;
  fillSel(typSel, [...typs].sort(sortKeys), 'Alle Typen'); typSel.value = curTyp;
  fillSel(artSel, [...arts].sort(sortKeys), 'Alle Artikel'); artSel.value = curArt;
}

function renderStats() {
  populateStatsFilters();
  const fGrp = gVal('statsFilterGrp'); const fTyp = gVal('statsFilterTyp'); const fArt = gVal('statsFilterArt');
  
  const years = [...new Set(state.sold.map(s=>(s.saleDate||today()).slice(0,4)))].sort((a,b)=>b-a);
  if (years.length > 0 && !years.includes(state.year)) state.year = years[0];
  const sy = g('statsYear'); if(sy) sy.innerHTML = (years.length ? years : [state.year]).map(y=>`<option value="${y}" ${y===state.year?'selected':''}>${y}</option>`).join('');
  
  let ys = state.sold.filter(s=>(s.saleDate||today()).startsWith(state.year));
  if (ys.length === 0 && state.sold.length > 0) ys = state.sold;

  if (fGrp || fTyp || fArt) {
    ys = ys.filter(s => (s.items||[]).some(i => (!fGrp || i.group === fGrp) && (!fTyp || i.productType === fTyp) && (!fArt || i.article === fArt)));
  }

  const totalSets = ys.length; 
  const totalProfit = ys.reduce((s,set)=>s+(set.netProfit||0),0); 
  const totalRevenue = ys.reduce((s,set)=>s+(set.salePrice||0),0);
  const totalDaysAll = ys.reduce((s,set) => s + (set.avgDaysInStock || 0), 0);
  const avgDaysOverall = totalSets ? Math.round(totalDaysAll / totalSets) : 0;

  const sc = g('statsCards'); 
  if (sc) {
    sc.innerHTML = [
      {k:'Gefilterte Sets', v:totalSets}, 
      {k:'Gewinn', v:euro(totalProfit)}, 
      {k:'Umsatz', v:euro(totalRevenue)}, 
      {k:'Ø Standzeit', v:`${avgDaysOverall} Tage`}
    ].map(c=>`<div class="stat-card"><div class="k">${c.k}</div><div class="v">${c.v}</div></div>`).join('');
  }

  // Präzise Aufschlüsselung nach Spezifikation (Name, Größe, Farbe)
  const specStats = new Map();

  ys.forEach(s => {
    const itemCount = s.items.length || 1;
    const shareProfit = (s.netProfit || 0) / itemCount;
    const shareRevenue = (s.salePrice || 0) / itemCount;

    (s.items||[]).forEach(i => {
      if ((!fGrp || i.group === fGrp) && (!fTyp || i.productType === fTyp) && (!fArt || i.article === fArt)) {
        // Detaillierte Namensgebung inklusive Größe und Farbe
        const specName = `${i.productType||''} ${i.article||''} ${i.color||''} ${i.size ? '('+i.size+')' : ''}`.replace(/\s+/g, ' ').trim() || 'Unbenannt';
        if (!specStats.has(specName)) specStats.set(specName, { name: specName, count: 0, profit: 0, revenue: 0 });
        const entry = specStats.get(specName);
        const qty = (i.menge || i.quantity || 1);
        entry.count += qty;
        entry.profit += shareProfit * qty;
        entry.revenue += shareRevenue * qty;
      }
    });
  });

  const sortedSpecsByCount = [...specStats.values()].sort((a,b) => b.count - a.count);
  const sortedSpecsByProfit = [...specStats.values()].sort((a,b) => b.profit - a.profit);
  const sortedSpecsByRevenue = [...specStats.values()].sort((a,b) => b.revenue - a.revenue);

  const bestCount = sortedSpecsByCount[0];
  const bestProfit = sortedSpecsByProfit[0];
  const bestRevenue = sortedSpecsByRevenue[0];
  const worstCount = sortedSpecsByCount.length > 1 ? sortedSpecsByCount[sortedSpecsByCount.length - 1] : null;
  const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  const dkContainer = g('dynamicKpis');
  if (dkContainer) {
    dkContainer.innerHTML = `
      <div class="kpi-card"><div class="k">🏆 Bestseller (Spezifikation)</div><div class="v">${bestCount ? esc(bestCount.name) : '–'}</div><div class="d">${bestCount ? bestCount.count + 'x verkauft' : ''}</div></div>
      <div class="kpi-card"><div class="k">🎯 Top Gewinnprodukt</div><div class="v">${bestProfit ? esc(bestProfit.name) : '–'}</div><div class="d">${bestProfit ? euro(bestProfit.profit) : ''}</div></div>
      <div class="kpi-card"><div class="k">💵 Top Umsatzbringer</div><div class="v">${bestRevenue ? esc(bestRevenue.name) : '–'}</div><div class="d">${bestRevenue ? euro(bestRevenue.revenue) : ''}</div></div>
      <div class="kpi-card"><div class="k">⚠️ Geringster Absatz</div><div class="v">${worstCount ? esc(worstCount.name) : '–'}</div><div class="d">${worstCount ? worstCount.count + 'x verkauft' : ''}</div></div>
      <div class="kpi-card"><div class="k">📈 Ø Marge in %</div><div class="v">${avgMargin} %</div><div class="d">Gewinn vs. Umsatz</div></div>
      <div class="kpi-card"><div class="k">⏳ Rotationsgeschwindigkeit</div><div class="v">${avgDaysOverall} Tage</div><div class="d">Verkaufsdauer im Lager</div></div>
    `;
  }

  // TOP 5 RANKING KARTEN GENERIEREN
  const trContainer = g('topRankings');
  if (trContainer) {
    if (sortedSpecsByCount.length > 0) {
      const top5 = sortedSpecsByCount.slice(0, 5);
      trContainer.innerHTML = `
        <div class="card">
          <div class="card-head"><h3 class="card-title">🔥 Top 5 meistverkaufte Exemplare (${fGrp || 'Alle'})</h3></div>
          <div class="card-body" style="padding:0;">
            <table class="mini-table">
              <thead><tr><th>Platz</th><th>Spezifikation / Artikel</th><th>Menge</th><th>Gewinn</th></tr></thead>
              <tbody>
                ${top5.map((item, idx) => `<tr>
                  <td><b>#${idx + 1}</b></td>
                  <td>${esc(item.name)}</td>
                  <td><b style="color:var(--primary);">${item.count}x</b></td>
                  <td style="color:var(--success);">${euro(item.profit)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    } else {
      trContainer.innerHTML = '';
    }
  }

  // Monatsübersicht
  const monthMap = new Map();
  ys.forEach(set => {
    const sDate = set.saleDate || today(); const m = fmtMonth(sDate);
    if(!monthMap.has(m)) monthMap.set(m, { profit: 0, revenue: 0, sets: 0, artUnits: 0, psProfit: 0, psRevenue: 0, key: sDate.slice(0,7) });
    const e = monthMap.get(m); 
    e.profit += (set.netProfit || 0); 
    e.revenue += (set.salePrice || 0); 
    e.sets += 1;
    if(set.items) e.artUnits += set.items.reduce((a,i)=>a+((i.menge||i.quantity)||1), 0);
    if (set.hasProfitshare) {
      e.psProfit += (set.netProfit || 0);
      e.psRevenue += (set.salePrice || 0);
    }
  });
  const months = [...monthMap.entries()].sort((a,b) => b[1].key.localeCompare(a[1].key));

  const mt = g('monthTable'); 
  if (mt) {
    mt.innerHTML = months.length ? `
      <thead>
        <tr>
          <th>Monat</th>
          <th>Jahr</th>
          <th>Sets</th>
          <th>Art.</th>
          <th>Gewinn</th>
          <th>Umsatz</th>
          <th>PS-Gewinn</th>
          <th>PS-Umsatz</th>
        </tr>
      </thead>
      <tbody>
        ${months.map(([m, d]) => {
          const [mon, yr] = m.split(' ');
          return `<tr>
            <td><b>${mon}</b></td>
            <td>${yr}</td>
            <td>${d.sets}</td>
            <td>${d.artUnits}</td>
            <td style="color:var(--success); font-weight:bold;">${euro(d.profit)}</td>
            <td>${euro(d.revenue)}</td>
            <td style="color:var(--warn); font-weight:600;">${euro(d.psProfit)}</td>
            <td>${euro(d.psRevenue)}</td>
          </tr>`;
        }).join('')}
      </tbody>` : '<tbody><tr><td colspan="8" class="empty">Keine Verkäufe im Filter.</td></tr></tbody>';
  }
}

function renderTermine() {
    const container = g('terminContent'); if (!container) return; if (!state.termine || state.termine.length === 0) { container.innerHTML = '<div class="empty">Keine Termine vorhanden.</div>'; return; }
    const sorted = [...state.termine].sort((a,b) => new Date(`${a.datum}T${a.uhrzeit}:00`) - new Date(`${b.datum}T${b.uhrzeit}:00`)); 
    
    container.innerHTML = sorted.map(t => {
      const isAbholung = t.art === 'Abholung';
      const color = isAbholung ? 'var(--err)' : 'var(--success)';
      const mapsUrl = t.ort ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.ort)}` : null;

      return `<div class="card" style="margin-bottom:var(--sp3); border-left:4px solid ${color};"><div class="card-body" style="padding:var(--sp3);"><div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp2);"><div><div style="font-size:var(--text-xs); color:${color}; font-weight:700;">${t.art}</div><h4 style="margin:2px 0 0; font-size:var(--text-base);">${esc(t.name)}</h4></div><div style="text-align:right;"><div style="font-weight:700;">${fmtDate(t.datum)}</div><div style="color:var(--muted); font-size:var(--text-sm);">${t.uhrzeit} Uhr</div></div></div><div class="chips" style="margin-bottom:var(--sp3);">${t.preis ? `<span class="chip">💰 ${esc(t.preis)}</span>` : ''}${mapsUrl ? `<a href="${mapsUrl}" target="_blank" class="chip" style="color:var(--primary); font-weight:700; text-decoration:underline;">📍 ${esc(t.ort)}</a>` : ''}${t.user ? `<span class="chip">👤 ${esc(t.user)}</span>` : ''}</div><button class="btn btn-danger" style="min-height:30px; padding:0; width:100%" onclick="window.deleteTermin('${t.id}')">🗑 Löschen</button></div></div>`;
    }).join('');
}

window.deleteTermin = function(id) { if(!confirm('Termin löschen?')) return; state.termine = state.termine.filter(t => t.id !== id); save(); renderTermine(); };
function populateUhrzeit() { const sel = g('terminUhrzeit'); if (!sel) return; let html = '<option value="" disabled selected>Zeit wählen</option>'; for(let i=9; i<=23; i++) { let hour = i < 10 ? '0'+i : i; html += `<option value="${hour}:00">${hour}:00</option><option value="${hour}:30">${hour}:30</option>`; } sel.innerHTML = html; }

const tfrm = g('terminForm');
if(tfrm) { tfrm.addEventListener('submit', e => { e.preventDefault(); const entry = { id: uid(), art: gVal('terminArt'), name: gVal('terminName'), preis: gVal('terminPreis'), ort: gVal('terminOrt'), datum: gVal('terminDatum'), uhrzeit: gVal('terminUhrzeit'), user: gVal('terminUser'), info: gVal('terminInfo') }; if(!state.termine) state.termine = []; state.termine.unshift(entry); save(); toast('Termin angelegt ✓'); tfrm.reset(); const td = g('terminDatum'); if(td) td.value = today(); renderTermine(); }); }

document.addEventListener('click', e => {
  const target = e.target; if (!target) return; const el = target.nodeType === 3 ? target.parentElement : target; if (!el || typeof el.closest !== 'function') return;
  const rmBtn = el.closest('[data-rm]');
  if (rmBtn) {
    const key = rmBtn.dataset.rm; const grp = rmBtn.dataset.grp; const typ = rmBtn.dataset.typ; const idx = rmBtn.dataset.idx;
    if (key === 'group') { if (state.master.catalog[grp]) delete state.master.catalog[grp]; } 
    else if (key === 'prodtype') { if (state.master.catalog[grp]) delete state.master.catalog[grp][typ]; } 
    else { if (state.master.catalog[grp] && state.master.catalog[grp][typ] && state.master.catalog[grp][typ][key]) { state.master.catalog[grp][typ][key].splice(+idx, 1); } }
    save(); updateMasterForm(); renderAllQuick(); renderMaster(); return;
  }
  const imgPickBtn = el.closest('.img-pick'); if(imgPickBtn) { if(imagePickCallback) imagePickCallback(imgPickBtn.dataset.url); window.closeImagePicker(); return; }
  const tgl = g('themeToggle'); if(tgl && tgl.contains(el)) { document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'); return; }
  const nb = el.closest('[data-page]'); if (nb) { state.page = nb.dataset.page; render(); }
});

const sy = g('statsYear'); if (sy) { sy.addEventListener('change', e=>{ state.year=e.target.value; renderStats(); }); }
const expBtn = g('exportBtn'); if(expBtn) expBtn.addEventListener('click', window.exportData);

document.querySelectorAll('.bottom-nav, .header-actions').forEach(container => { 
  container.addEventListener('click', e => { 
    const btn = e.target.closest('[data-page]'); 
    if(!btn) return; 
    state.page = btn.dataset.page; 
    render(); 
  }); 
});

function render() {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); 
  document.querySelectorAll('.nav-btn, .icon-btn[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));
  const activePage = g('page-'+state.page); if(activePage) activePage.classList.add('active');
  if (state.page==='stats') renderStats(); 
  if (state.page==='sell') { renderSellFilters(); renderSellCart(); }
  if (state.page==='open') renderOpen(); 
  if (state.page==='sold') renderSold(); 
  if (state.page==='master') renderMaster(); 
  if (state.page==='termin') renderTermine();
}

load();
