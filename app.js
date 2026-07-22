// ==========================================
// KLEINANZEIGEN HERO - APP.JS (v6.2 Final)
// ==========================================

const g = id => document.getElementById(id);
const gVal = id => { const el = g(id); return el ? el.value : ''; };
const esc = s => { if (s == null) return ''; if (typeof s === 'object') { try { s = JSON.stringify(s); } catch(e) { s = '[Objekt]'; } } return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
const sortKeys = (a, b) => String(a || '').localeCompare(String(b || ''), 'de');
const euro = v => Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(+v||0); 
const today = () => new Date().toISOString().slice(0,10);

function normalizeDate(dStr) { if (!dStr) return today(); const str = String(dStr).trim(); if (str.includes('.')) { const p = str.split('.'); if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`; } const dt = new Date(str); if (!isNaN(dt.getTime())) return dt.toISOString().slice(0,10); return today(); }
const fmtDate = d => { if(!d) return '-'; const dt = new Date(d); return isNaN(dt.getTime()) ? String(d) : new Intl.DateTimeFormat('de-DE',{dateStyle:'medium'}).format(dt); };
const fmtMonth = d => { if(!d) return '-'; const dt = new Date(d); return isNaN(dt.getTime()) ? String(d) : new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(dt); };
const stackKey = i => `${i.group}||${i.productType||''}||${i.article}||${i.size}||${i.color}`; 
const uid = () => { return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); };

function toast(msg) { const t = g('toast'); if(t) { t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); } }
function fillSel(el, vals, ph) { if(!el) return; el.innerHTML = `<option value="">${ph}</option>` + vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''); }

const state = {
  page: 'new', sellCart: [], psManualOverride: false, open: [], openFilters: { text: '', group: '', type: '', article: '', size: '', color: '' }, sold: [], soldFilter: '', termine: [], year: String(new Date().getFullYear()),
  master: { catalog: {}, badgeRules: [], images: [], setImages: [] }, openCollapse: {}, openScrollPos: 0, hideZero: true, sel: new Set() 
};

let globalExpandState = false; let db = null; const DB_NAME = 'amp3db', DB_VER = 1, STORE = 'data';

function openDB() { return new Promise((res, rej) => { if (db) { res(db); return; } const req = indexedDB.open(DB_NAME, DB_VER); req.onupgradeneeded = e => e.target.result.createObjectStore(STORE); req.onsuccess = e => { db = e.target.result; res(db); }; req.onerror = e => rej(e.target.error); }); }
function save() { const payload = { open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year }; try { localStorage.setItem('amp3', JSON.stringify(payload)); } catch(e) {} openDB().then(database => { const tx = database.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(payload, 'state'); }); }
function load() { openDB().then(database => { const tx = database.transaction(STORE, 'readonly'); const req = tx.objectStore(STORE).get('state'); req.onsuccess = e => { const d = e.target.result; if (d) { applyState(d); } else { try { const ls = JSON.parse(localStorage.getItem('amp3') || 'null'); if (ls) { applyState(ls); save(); } } catch(e) {} } initApp(); }; req.onerror = () => { fallbackLoad(); }; }).catch(() => { fallbackLoad(); }); }
function fallbackLoad() { try { const ls = JSON.parse(localStorage.getItem('amp3') || 'null'); if (ls) applyState(ls); } catch(e) {} initApp(); }

function initApp() { updateMasterForm(); populateUhrzeit(); renderAllQuick(); const gasUrl = g('gasUrl'); if(gasUrl) gasUrl.value = localStorage.getItem('gasUrl') || ''; render(); }

function applyState(d) {
  try {
    state.open = Array.isArray(d.open) ? d.open.filter(Boolean) : [];
    if (d.sold !== undefined && Array.isArray(d.sold)) state.sold = d.sold.filter(Boolean);
    if (d.termine !== undefined && Array.isArray(d.termine)) state.termine = d.termine.filter(Boolean);
    if (!state.master) state.master = { catalog: {}, badgeRules: [], images: [], setImages: [] };
    
    if (d.master && d.master.catalog && typeof d.master.catalog === 'object' && !Array.isArray(d.master.catalog)) state.master.catalog = JSON.parse(JSON.stringify(d.master.catalog)); 
    if (d.master) { if (Array.isArray(d.master.images)) state.master.images = d.master.images; if (Array.isArray(d.master.setImages)) state.master.setImages = d.master.setImages; if (Array.isArray(d.master.badgeRules)) state.master.badgeRules = d.master.badgeRules; }
    if (!state.master.catalog || typeof state.master.catalog !== 'object') state.master.catalog = {};

    for (let grp in state.master.catalog) {
        if (!state.master.catalog[grp] || typeof state.master.catalog[grp] !== 'object' || Array.isArray(state.master.catalog[grp])) state.master.catalog[grp] = {};
        for (let typ in state.master.catalog[grp]) {
            if (!state.master.catalog[grp][typ] || typeof state.master.catalog[grp][typ] !== 'object' || Array.isArray(state.master.catalog[grp][typ])) state.master.catalog[grp][typ] = { articles: [], sizes: [], colors: [], images: [] };
            const ptData = state.master.catalog[grp][typ];
            ptData.articles = Array.isArray(ptData.articles) ? ptData.articles.filter(Boolean).map(String) : [];
            ptData.sizes = Array.isArray(ptData.sizes) ? ptData.sizes.filter(Boolean).map(String) : [];
            ptData.colors = Array.isArray(ptData.colors) ? ptData.colors.filter(Boolean).map(String) : [];
            ptData.images = Array.isArray(ptData.images) ? ptData.images.filter(Boolean).map(String) : [];
        }
    }

    const autoAdd = (grPrm, ptPrm, a, s, c) => {
        if (!grPrm) return; const grp = String(grPrm).trim(); if (!grp) return; const typ = ptPrm ? String(ptPrm).trim() : 'Standardtyp';
        if (!state.master.catalog[grp]) state.master.catalog[grp] = {}; if (!state.master.catalog[grp][typ]) state.master.catalog[grp][typ] = { articles: [], sizes: [], colors: [], images: [] };
        const target = state.master.catalog[grp][typ];
        if (!Array.isArray(target.articles)) target.articles = []; if (!Array.isArray(target.sizes)) target.sizes = []; if (!Array.isArray(target.colors)) target.colors = [];
        if (a && !target.articles.includes(String(a).trim())) target.articles.push(String(a).trim());
        if (s && !target.sizes.includes(String(s).trim())) target.sizes.push(String(s).trim());
        if (c && !target.colors.includes(String(c).trim())) target.colors.push(String(c).trim());
    };

    state.open.forEach(item => autoAdd(item.group, item.productType, item.article, item.size, item.color));
    state.sold.forEach(set => { (set.items || []).forEach(item => autoAdd(item.group, item.productType, item.article, item.size, item.color)); });

    if (d.quick && Array.isArray(d.quick.group)) {
        const oldPT = Array.isArray(d.quick.productType) && d.quick.productType.length > 0 ? d.quick.productType : ['Standardtyp'];
        d.quick.group.forEach(grp => { oldPT.forEach(pt => autoAdd(grp, pt, null, null, null)); });
        if (Array.isArray(d.quick.article)) d.quick.article.forEach(a => autoAdd(d.quick.group[0], oldPT[0], a, null, null));
        if (Array.isArray(d.quick.size)) d.quick.size.forEach(s => autoAdd(d.quick.group[0], oldPT[0], null, s, null));
        if (Array.isArray(d.quick.color)) d.quick.color.forEach(c => autoAdd(d.quick.group[0], oldPT[0], null, null, c));
    }

    for (let grp in state.master.catalog) { for (let typ in state.master.catalog[grp]) { state.master.catalog[grp][typ].articles.sort(sortKeys); state.master.catalog[grp][typ].sizes.sort(sortKeys); state.master.catalog[grp][typ].colors.sort(sortKeys); } }
    if (Object.keys(state.master.catalog).length === 0) initDemoCatalog();
    if (d.year) state.year = d.year;

    const cat = state.master.catalog;
    let newOpen = [];
    for (let i=0; i < state.open.length; i++) {
      let item = state.open[i]; if (!item) continue;
      if (!item.productType && item.article) {
          for (let grp in cat) { for (let pt in cat[grp]) { if (Array.isArray(cat[grp][pt].articles) && cat[grp][pt].articles.includes(item.article)) { item.productType = pt; break; } } }
      }
      if (!item.instances || !Array.isArray(item.instances)) {
          item.instances = []; let qty = 1; if (item.quantity !== undefined) qty = item.quantity; else if (item.menge !== undefined) qty = item.menge;
          qty = parseInt(qty, 10); if (isNaN(qty)) qty = 1; if (qty < 0) qty = 0;
          for (let j=0; j < qty; j++) { let p = parseFloat(String(item.purchasePrice || item.preis || 0).replace(',','.')); item.instances.push({ id: uid(), purchasePrice: isNaN(p) ? 0 : p, entryDate: normalizeDate(item.entryDate || item.datum), sold: false, profitshare: !!item.profitshare, image: item.image || '', comment: item.comment || item.info || '', defect: item.defect || '' }); }
      } else {
          item.instances.forEach(inst => { if(!inst.id) inst.id = uid(); inst.entryDate = normalizeDate(inst.entryDate || item.entryDate || item.datum); let p = parseFloat(String(inst.purchasePrice).replace(',','.')); inst.purchasePrice = isNaN(p) ? 0 : p; });
      }
      if(!item.id) item.id = uid(); newOpen.push(item);
    }
    state.open = newOpen;

    state.sold.forEach(s => {
       if(!s.items || !Array.isArray(s.items)) s.items = []; if(!s.id) s.id = uid();
       s.saleDate = normalizeDate(s.saleDate || s.datum); if(!s.setName) s.setName = s.name || 'Unbenanntes Set';
       s.items.forEach(i => { let qty = (i.menge !== undefined) ? i.menge : (i.quantity !== undefined ? i.quantity : 1); i.menge = qty; i.quantity = qty; });
    });
    state.sellCart = []; state.psManualOverride = false;
  } catch(e) { console.error("Migration Error:", e); toast("Ein Fehler ist aufgetreten."); }
}

async function saveToCloud() {
  const gasUrl = gVal('gasUrl').trim(); if(!gasUrl) return toast('Bitte Script URL eingeben.'); localStorage.setItem('gasUrl', gasUrl);
  const cloudPayload = { open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year };
  try { toast('Speichere in Cloud...'); const res = await fetch(gasUrl, { method: 'POST', body: JSON.stringify(cloudPayload) }); const text = await res.text(); try { const result = JSON.parse(text); if(result.status === 'success') toast('Sync erfolgreich ✓'); else toast('Fehler: ' + result.message); } catch(err) { alert("Zugriff blockiert."); } } catch(e) { toast('Netzwerkfehler'); }
}
async function loadFromCloud() {
  const gasUrl = gVal('gasUrl').trim(); if(!gasUrl) return toast('Bitte URL eingeben.'); localStorage.setItem('gasUrl', gasUrl);
  try { toast('Lade aus Cloud...'); const fetchUrl = gasUrl + (gasUrl.includes('?') ? '&' : '?') + 'nocache=' + new Date().getTime(); const res = await fetch(fetchUrl); const text = await res.text(); try { const data = JSON.parse(text); if(data.error) return toast('Fehler: ' + data.error); applyState(data); save(); updateMasterForm(); renderAllQuick(); renderMaster(); render(); toast('Download erfolgreich ✓'); } catch(err) { alert("Datenfehler."); } } catch(e) { alert('Netzwerkfehler'); }
}
function exportData() {
  const data = { open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year }; const json = JSON.stringify(data, null, 2); const filename = `kleinanzeigen-hero-${today()}.json`;
  const blob = new Blob([json], { type:'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 1000); toast('Exportiert ✓');
}
function importData(file) {
  if (!file) return; toast('Lese Datei...'); const reader = new FileReader();
  reader.onload = e => { try { let d = JSON.parse(e.target.result); if (Array.isArray(d)) d = { open: d }; else if (d.state) d = d.state; else if (d.data) d = d.data; applyState(d); state.hideZero = false; save(); updateMasterForm(); renderAllQuick(); renderMaster(); state.page = 'open'; render(); toast('Importiert ✓'); } catch(err) { toast('Import-Fehler'); } };
  reader.readAsText(file);
}
function compressImage(file, callback) {
    const reader = new FileReader(); reader.onload = e => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); let w = img.width, h = img.height; const MAX = 800; if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; } else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } canvas.width = w; canvas.height = h; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h); callback(canvas.toDataURL('image/jpeg', 0.75)); }; img.src = e.target.result; }; reader.readAsDataURL(file);
}

function initDemoCatalog() { if (state.master.catalog && Object.keys(state.master.catalog).length > 0) return; state.master.catalog = { "Besta": { "Tür": { articles: ["Selsviken"], sizes: ["64"], colors: ["Weiß"] } } }; save(); }

function updateMasterForm() {
  try {
      const mType = g('masterType'); if(!mType) return; const type = mType.value;
      const needGrp = ['producttypes','articles','sizes','colors'].includes(type); const needTyp = ['articles','sizes','colors'].includes(type);
      const groups = Object.keys(state.master.catalog || {}).sort(sortKeys); const mGrp = g('masterGroup');
      if(mGrp) { const curGrp = mGrp.value; mGrp.innerHTML = '<option value="">– Gruppe –</option>' + groups.map(grp=>`<option value="${esc(grp)}"${grp===curGrp?' selected':''}>${esc(grp)}</option>`).join(''); }
      const selGrp = mGrp ? mGrp.value : ''; const typs = selGrp && state.master.catalog[selGrp] ? Object.keys(state.master.catalog[selGrp]).sort(sortKeys) : []; const mTyp = g('masterProdType');
      if(mTyp) { const curTyp = mTyp.value; mTyp.innerHTML = '<option value="">– Typ –</option>' + typs.map(t=>`<option value="${esc(t)}"${t===curTyp?' selected':''}>${esc(t)}</option>`).join(''); }
      document.querySelectorAll('.mf-grp').forEach(el => el.style.display = needGrp ? 'grid' : 'none'); document.querySelectorAll('.mf-typ').forEach(el => el.style.display = needTyp ? 'grid' : 'none'); document.querySelectorAll('.mf-val').forEach(el => el.style.display = type !== 'images' ? 'grid' : 'none');
      const labels = {groups:'Gruppenname', producttypes:'Produkttyp-Name', articles:'Artikelname', sizes:'Größe', colors:'Farbe'}; const placeholders = {groups:'z.B. Besta', producttypes:'z.B. Tür', articles:'z.B. Selsviken', sizes:'z.B. 64×64', colors:'z.B. Schwarz'};
      if (g('masterValueLabel')) g('masterValueLabel').textContent = labels[type] || 'Wert'; if (g('masterValue')) g('masterValue').placeholder = placeholders[type] || '';
  } catch(e) {}
}

const mfBtn = g('masterForm');
if(mfBtn) {
    mfBtn.addEventListener('submit', e => {
      e.preventDefault();
      try {
        const type = gVal('masterType'); const val = gVal('masterValue').trim(); const grp = gVal('masterGroup'); const typ = gVal('masterProdType');
        if (!state.master.catalog) state.master.catalog = {}; if (type === 'images' || type === 'setimages') return;
        if (type === 'groups') { if (!val) return alert('Name eingeben.'); if (state.master.catalog[val] !== undefined) return alert('Existiert bereits.'); state.master.catalog[val] = {}; }
        else if (type === 'producttypes') { if (!grp || !val) return alert('Pflichtfelder fehlen.'); if (!state.master.catalog[grp]) state.master.catalog[grp] = {}; if (state.master.catalog[grp][val] !== undefined) return alert('Existiert bereits.'); state.master.catalog[grp][val] = { articles:[], sizes:[], colors:[], images:[] }; }
        else if (type === 'articles' || type === 'sizes' || type === 'colors') { if (!grp || !typ || !val) return alert('Pflichtfelder fehlen.'); if (!state.master.catalog[grp] || !state.master.catalog[grp][typ]) return alert('Gruppe/Typ fehlt.'); let arr = state.master.catalog[grp][typ][type]; if (!Array.isArray(arr)) { arr = []; state.master.catalog[grp][typ][type] = arr; } if (arr.includes(val)) return alert('Existiert bereits.'); arr.push(val); arr.sort(sortKeys); }
        if(g('masterValue')) g('masterValue').value = ''; updateMasterForm(); renderAllQuick(); save(); renderMaster(); toast('Gespeichert ✓');
      } catch(err) { alert('Fehler: ' + err.message); }
    });
}

function buildImgDropdown() {
  const dd = g('imgDropdown'); if (!dd) return;
  const grp = gVal('group'); const typ = gVal('productType');
  const catImgs = (grp && typ && state.master.catalog[grp] && state.master.catalog[grp][typ] && Array.isArray(state.master.catalog[grp][typ].images)) ? state.master.catalog[grp][typ].images : [];
  const allImgs = [...new Set([...catImgs, ...(state.master.images||[]), ...(state.master.setImages||[])])];
  const opts = [{ url:'', label:'Kein Bild' }, ...allImgs.map(u=>({ url:u, label: u.startsWith('data:') ? 'Upload' : (u.split('id=')[1]?.slice(0,22)||u.slice(-22)) }))];
  dd.innerHTML = opts.map(o=>`<div class="iso" data-val="${o.url}"><div class="iso-thumb">${o.url?`<img src="${o.url}" loading="lazy" onerror="this.parentElement.innerHTML='🖼️'">` :'📷'}</div><span>${esc(o.label)}</span></div>`).join('');
}

function onGroupChange() { 
  if(state.page !== 'new') return; 
  ['productType', 'article', 'size', 'color'].forEach(id => { const el = g(id); if (el) { el.innerHTML = '<option value=""></option>'; el.value = ''; } }); 
  buildImgDropdown(); 
  const iv = g('imgValue'); if(iv) iv.value = ''; 
  const prev = g('imgPreview'); if(prev) { prev.innerHTML='🖼'; } 
  renderAllQuick(); 
}

function onProductTypeChange() { 
  if(state.page !== 'new') return; 
  ['article', 'size', 'color'].forEach(id => { const el = g(id); if (el) { el.innerHTML = '<option value=""></option>'; el.value = ''; } }); 
  buildImgDropdown(); 
  const grp = gVal('group'); const typ = gVal('productType'); 
  let catImgs = []; 
  if (state.master.catalog[grp] && state.master.catalog[grp][typ] && Array.isArray(state.master.catalog[grp][typ].images)) { catImgs = state.master.catalog[grp][typ].images; } 
  const iv = g('imgValue'); 
  if (catImgs.length > 0 && iv && !iv.value) { iv.value = catImgs[0]; const prev = g('imgPreview'); if (prev) { prev.innerHTML = `<img src="${catImgs[0]}" style="width:28px;height:28px;object-fit:cover;border-radius:6px;">`; } } 
  renderAllQuick(); 
}

window.handleQuickSelect = function(selId, val) {
    const sel = g(selId); if (!sel) return;
    if (sel.value === val) { sel.value = ''; } else { let exists = Array.from(sel.options).some(o => o.value === val); if (!exists) sel.add(new Option(val, val)); sel.value = val; }
    if (selId === 'group') onGroupChange(); else if (selId === 'productType') onProductTypeChange(); else renderAllQuick();
};

function renderQChips(type, items, currentVal) {
    const c = g('qb-' + type); if (!c) return;
    const colorMap = { 'schwarz': '#222', 'weiss': '#fff', 'weiß': '#fff', 'dunkel': '#444', 'hell': '#eee', 'grau': '#9e9e9e', 'beige': '#f5f5dc', 'holz': '#c19a6b', 'rot': '#e53935', 'blau': '#1e88e5', 'grün': '#43a047', 'gelb': '#fdd835' };
    const safeItems = Array.isArray(items) ? items : [];
    let h = safeItems.map(val => {
        if(val == null) return ''; const strVal = String(val); const isActive = (strVal === String(currentVal||'')); const safeVal = strVal.replace(/'/g,"\\'").replace(/"/g,"&quot;");
        let colorDot = ''; if (type === 'color') { const hex = colorMap[strVal.toLowerCase()]; if (hex) { const border = (hex === '#fff' || hex === '#eee' || hex === '#f5f5dc' || hex === '#ffffff') ? 'border:1px solid #ccc;' : ''; colorDot = `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${hex};${border}margin-right:4px;"></span>`; } }
        return `<div class="qb-chip ${isActive ? 'active' : ''}" onclick="handleQuickSelect('${type}', '${safeVal}')">${colorDot}<span>${esc(strVal)}</span><span class="qb-rm" onclick="event.stopPropagation(); window.removeQuick('${type}', '${safeVal}')">×</span></div>`;
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
    const groups = Object.keys(cat).sort(sortKeys); 
    renderQChips('group', groups, grpVal);

    let typs = []; if (grpVal && cat[grpVal]) { typs = Object.keys(cat[grpVal]).sort(sortKeys); } 
    renderQChips('productType', typs, ptVal);

    let arts = [], sizes = [], colors = [];
    if (grpVal && ptVal && cat[grpVal][ptVal]) { arts = Array.isArray(cat[grpVal][ptVal].articles) ? cat[grpVal][ptVal].articles : []; sizes = Array.isArray(cat[grpVal][ptVal].sizes) ? cat[grpVal][ptVal].sizes : []; colors = Array.isArray(cat[grpVal][ptVal].colors) ? cat[grpVal][ptVal].colors : []; }
    if(g('article')) renderQChips('article', arts, gVal('article')); 
    if(g('size')) renderQChips('size', sizes, gVal('size')); 
    if(g('color')) renderQChips('color', colors, gVal('color'));
  } catch(e) { }
}

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

const ifrm = g('itemForm');
if(ifrm) {
    ifrm.addEventListener('submit', e => {
      e.preventDefault(); const pP = g('purchasePrice'); const totalPrice = pP ? +pP.value : 0; if (!gVal('group') || !gVal('productType')) return alert('Gruppe & Typ wählen.'); const qEl = g('quantity'); const qty = qEl ? +qEl.value : 1; let pricePerUnit = 0; if(qty > 0) pricePerUnit = totalPrice / qty;
      const psEl = g('profitshare'); const dEl = g('defect');
      for(let q=0;q<qty;q++) { const item = { group:gVal('group'), productType:gVal('productType'), article:gVal('article'), size:gVal('size'), color:gVal('color'), purchasePrice:pricePerUnit, profitshare:psEl?psEl.checked:false, image:gVal('imgValue'), comment:dEl?dEl.value:'', defect:dEl?dEl.value:'', entryDate:today() }; addOrStack(item); }
      save(); toast(qty>1?qty+' Artikel hinzugefügt ✓':'Artikel hinzugefügt ✓'); state.page='open'; render();
    });
}
function addOrStack(item) { const key = stackKey(item); const ex = state.open.find(i=>stackKey(i)===key); const inst = { id:uid(), image:item.image, comment:item.comment, defect:item.defect, entryDate:item.entryDate, profitshare:item.profitshare, purchasePrice:item.purchasePrice }; if (ex) { ex.instances.push(inst); } else { state.open.unshift({ id:uid(), group:item.group, productType:item.productType, article:item.article, size:item.size, color:item.color, purchasePrice:item.purchasePrice, profitshare:item.profitshare, instances:[inst] }); } }

let imagePickCallback = null;
function syncNewImageLabel(url) { const lbl = g('imgLabel'); const prev = g('imgPreview'); if(lbl) lbl.textContent = url ? 'Bild gewählt' : 'Wählen…'; if(prev) prev.textContent = url ? '🖼' : '📷'; }
function openNewImgPicker() { imagePickCallback = (url) => { const iv = g('imgValue'); if(iv) iv.value = url; const prev = g('imgPreview'); const lbl = g('imgLabel'); if(prev) prev.innerHTML = url ? `<img src="${url}" style="width:28px;height:28px;object-fit:cover;border-radius:6px;">` : '🖼'; if(lbl) lbl.textContent = url ? 'Bild gewählt ✓' : 'Wählen…'; }; const iv = g('imgValue'); openImagePicker(iv ? iv.value : ''); }
function openImagePicker(currentUrl='') {
  const modal = g('imagePickerModal'); const list = g('imagePickerList'); if(!modal || !list) return;
  const grp = gVal('group'); const typ = gVal('productType');
  const catImgs = (grp && typ && state.master.catalog[grp] && state.master.catalog[grp][typ] && Array.isArray(state.master.catalog[grp][typ].images)) ? state.master.catalog[grp][typ].images : [];
  const allImgs = [...new Set([...catImgs, ...(state.master.images||[]), ...(state.master.setImages||[])])];
  list.innerHTML = allImgs.length ? allImgs.map(u => `<button type="button" class="img-pick" data-url="${u.replace(/"/g,'&quot;')}" style="border:2px solid ${u===currentUrl?'#4caf50':'transparent'}"><img src="${u}" loading="lazy" style="width:100%;height:100px;object-fit:cover;border-radius:8px;"><div style="font-size:var(--text-xs);margin-top:4px;word-break:break-all;">${catImgs.includes(u) ? 'Stammdaten' : ((state.master.setImages||[]).includes(u) ? 'Set-Bild' : 'Upload')}</div></button>`).join('') : '<div class="empty">Keine Bilder.</div>';
  modal.style.display='flex'; modal.classList.add('show'); document.documentElement.style.overflow='hidden';
}
function closeImagePicker() { const modal = g('imagePickerModal'); if(modal){ modal.classList.remove('show'); modal.style.display='none'; } document.documentElement.style.overflow=''; }

window.currentEditBadgeIndex = null;
window.deleteMasterImage = function(idx) { if(!confirm('Dieses Bild löschen?')) return; if(Array.isArray(state.master.images)) { state.master.images.splice(idx, 1); save(); renderMaster(); } };
window.deleteAllImages = function() { if(!confirm('ACHTUNG: Alle Bilder löschen?')) return; state.master.images = []; state.master.setImages = []; state.open.forEach(item => { item._savedImage = ''; if(item.instances) item.instances.forEach(inst => inst.image = ''); }); state.sold.forEach(set => { set.previewImage = ''; }); if (state.master.catalog) { Object.keys(state.master.catalog).forEach(grp => { Object.keys(state.master.catalog[grp]||{}).forEach(typ => { if(state.master.catalog[grp][typ] && state.master.catalog[grp][typ].images) { state.master.catalog[grp][typ].images = []; } }); }); } if (Array.isArray(state.master.badgeRules)) { state.master.badgeRules.forEach(rule => { rule.image = ''; }); } save(); renderMaster(); toast('Gelöscht ✓'); };

// ==========================================
// BADGE RULES & SET BADGES MODAL LOGIK
// ==========================================
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

function openSetBadgesModal() {
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
  if (!hasAny) html = '<div class="empty">Aktuell können keine Sets gebildet werden.</div>';
  content.innerHTML = html; const sbm = g('setBadgesModal'); if(sbm) { sbm.style.display = 'flex'; sbm.classList.add('show'); }
}

function closeSetBadgesModal() { const m = g('setBadgesModal'); if(m) { m.classList.remove('show'); m.style.display = 'none'; } }

function renderMaster() {
  try {
      const cat = state.master.catalog || {}; const groups = Object.keys(cat).sort(sortKeys); let html = ''; window.currentEditBadgeIndex = null; 
      if (groups.length) {
        groups.forEach(grp => {
          const typs = Object.keys(cat[grp] || {}).sort(sortKeys);
          html += `<div class="card" style="margin-bottom:var(--sp4);"><div class="card-head"><h3 class="card-title">📁 ${esc(grp)}</h3><button class="btn btn-danger" style="min-height:32px;padding:.2rem .6rem;font-size:var(--text-xs);" data-rm="group" data-grp="${esc(grp)}">🗑 Gruppe</button></div><div class="card-body" style="padding:0;">`;
          if (!typs.length) { html += `<div class="empty" style="margin:var(--sp4);">Noch keine Produkttypen.</div>`; }
          typs.forEach(typ => {
            const d = cat[grp][typ] || {};
            html += `<div style="border-bottom:1px solid var(--divider);padding:var(--sp3) var(--sp4);"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp2);"><b style="font-size:var(--text-sm);">🏷 ${esc(typ)}</b><button class="btn btn-danger" style="min-height:28px;padding:.2rem .5rem;font-size:var(--text-xs);" data-rm="prodtype" data-grp="${esc(grp)}" data-typ="${esc(typ)}">🗑</button></div>${['articles','sizes','colors'].map(field=>{ const labels={articles:'Artikelname',sizes:'Größen',colors:'Farben'}; const fieldArr = Array.isArray(d[field]) ? d[field] : []; return `<div style="margin-bottom:var(--sp2);"><div class="muted" style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp1);">${labels[field]}</div><div class="chips">${fieldArr.map((v,i)=>`<span class="chip" style="display:inline-flex;align-items:center;gap:4px;">${esc(v)}<button style="background:none;border:none;cursor:pointer;color:var(--err);font-size:11px;padding:0;line-height:1;" data-rm="${field}" data-grp="${esc(grp)}" data-typ="${esc(typ)}" data-idx="${i}">×</button></span>`).join('') || '<span class="muted" style="font-size:var(--text-xs);">Noch keine Einträge</span>'}</div></div>`; }).join('')}</div>`;
          });
          html += `</div></div>`;
        });
      } else { html += `<div class="empty">Noch keine Gruppen angelegt.<br>Beginne mit Kategorie → Gruppe.</div>`; }
      const imgs = Array.isArray(state.master.images) ? state.master.images : [];
      html += `<div class="card"><div class="card-head"><div style="display:flex;align-items:center;gap:8px;"><h3 class="card-title">🖼 Bilder</h3><span class="chip">${imgs.length}</span></div>${imgs.length > 0 ? `<button class="btn btn-danger" style="min-height:28px;padding:.2rem .6rem;font-size:var(--text-xs);" onclick="deleteAllImages()">Alle löschen</button>` : ''}</div><div class="card-body"><div class="img-grid">${imgs.length ? imgs.map((url,i)=>`<div class="img-card"><img src="${url}" loading="lazy" onerror="this.style.display='none'" style="width:100%;height:80px;object-fit:cover;"><div class="img-lbl">${url.startsWith('data:')?'Upload '+(i+1):url.slice(-14)}</div><button class="img-del" onclick="deleteMasterImage(${i})" title="Bild löschen">×</button></div>`).join('') : '<div class="empty" style="grid-column:1/-1;">Noch keine Bilder.</div>'}</div></div></div>`;
      
      const safeBadgeRules = Array.isArray(state.master.badgeRules) ? state.master.badgeRules : [];
      html += `<div class="card" style="margin-bottom:var(--sp4);"><div class="card-head"><h3 class="card-title">🏆 Set Badges (Regeln)</h3></div><div class="card-body"><div id="badgeRulesList" style="margin-bottom:var(--sp3);">${safeBadgeRules.map((r, i) => { const reqsArr = Array.isArray(r.reqs) ? r.reqs : []; return `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--divider); padding:var(--sp2) 0;"><div style="display:flex; gap:12px; align-items:center;">${r.image ? `<img src="${r.image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;">` : `<div style="width:40px;height:40px;border-radius:6px;border:1px dashed var(--border);display:grid;place-items:center;color:var(--muted);flex-shrink:0;">📷</div>`}<div><b style="font-size:var(--text-base);">${esc(r.name)}</b> <span style="color:var(--muted); font-size:var(--text-xs);">(${esc(r.group)} · ${esc(r.productType)})</span><br><span style="font-size:var(--text-sm); font-weight:600; color:var(--primary);">${reqsArr.map(req => `${req.qty||1}x Gr. ${esc(req.size)}`).join(', ')}</span></div></div><div style="display:flex; gap:6px;"><button class="btn btn-ghost" style="min-height:28px;padding:.2rem .5rem;font-size:var(--text-xs);" onclick="editBadgeRule(${i})" title="Regel bearbeiten">✏️</button><button class="btn btn-danger" style="min-height:28px;padding:.2rem .5rem;font-size:var(--text-xs);" onclick="deleteBadgeRule(${i})" title="Regel löschen">🗑</button></div></div>`; }).join('') || '<div class="empty">Keine Regeln definiert.</div>'}</div><div style="background:var(--surface2); padding:var(--sp3); border-radius:var(--rad-md); border:1px solid var(--border);"><h4 id="badgeFormTitle" style="font-size:var(--text-sm); margin:0 0 var(--sp2);">Neue Regel erstellen</h4><div class="grid2" style="gap:8px;"><input type="text" class="input" id="newBadgeName" placeholder="Name (z.B. TV 180)"><select class="select" id="newBadgeGroup" onchange="updateBadgeProdType()"><option value="">– Gruppe wählen –</option>${groups.map(grp => `<option value="${esc(grp)}">${esc(grp)}</option>`).join('')}</select><select class="select" id="newBadgeProdType"><option value="">– Produkttyp –</option></select><input type="text" class="input" id="newBadgeReqs" placeholder="Bedarf (z.B. 64x2, 38x1)"></div><div style="display:flex; gap:8px; margin-top:8px; align-items:center;"><button type="button" class="btn btn-ghost" style="padding:4px 10px; min-height:32px; font-size:var(--text-xs); border-radius:var(--rad-md);" onclick="openBadgeImgPicker()"><span id="badgeImgPreview">📷</span> Bild (optional)</button><input type="hidden" id="newBadgeImg"></div><div style="display:flex; gap:8px; margin-top:var(--sp3);"><button id="saveBadgeBtn" class="btn btn-primary" style="flex:1;" onclick="addBadgeRule()">✚ Regel speichern</button><button id="cancelBadgeBtn" class="btn btn-ghost" style="display:none;" onclick="cancelEditBadgeRule()">Abbrechen</button></div><div style="font-size:11px; color:var(--muted); margin-top:6px; line-height:1.3;"><b>Bedarf-Format:</b> [Größe]x[Anzahl] (kommagetrennt).<br><i>Beispiel:</i> Um eine Regel für 2x Größe 64 und 1x Größe 38 zu erstellen, gib "64x2, 38x1" ein.</div></div></div></div>`;
      
      const mc = g('masterContent'); if (mc) mc.innerHTML = html;
  } catch (err) { const mc = g('masterContent'); if (mc) mc.innerHTML = '<div class="empty" style="color:red">Fehler beim Laden der Stammdaten.</div>'; }
}

function resetItemForm() {
  const frm = g('itemForm'); if(frm) frm.reset();
  ['purchasePrice', 'quantity', 'group', 'productType', 'article', 'size', 'color', 'imgValue'].forEach(id => { const el = g(id); if(el) el.value = ''; });
  const qEl = g('quantity'); if(qEl) qEl.value = '1';
  const lbl = g('imgLabel'); if(lbl) lbl.textContent = 'Wählen…';
  const prev = g('imgPreview'); if(prev) prev.innerHTML = '🖼';
  const upv = g('uploadPreview'); if(upv) upv.classList.remove('show');
  onGroupChange();
}

let _instImgItemId = null, _instImgInstId = null;
function triggerInstImgUpload(itemId, instId) { _instImgItemId = itemId; _instImgInstId = instId; const inInp = g('instImgInput'); if(inInp) inInp.click(); }
const inInpEv = g('instImgInput');
if(inInpEv) {
    inInpEv.addEventListener('change', function() {
      const file = this.files[0]; if (!file) return;
      compressImage(file, (url) => {
        const item = state.open.find(i => i.id === _instImgItemId); if (!item) return;
        const inst = item.instances.find(x => x.id === _instImgInstId); if (!inst) return;
        inst.image = url; save(); renderOpen(); toast('Bild gespeichert ✓');
      });
      this.value = '';
    });
}

function renderSellFilters() { updateSellFilters('init'); }
function updateSellFilters(trigger) {
    const grpSel = g('sellFilterGroup'); const ptSel = g('sellFilterType'); const szSel = g('sellFilterSize'); const clSel = g('sellFilterColor'); const arSel = g('sellFilterArticle'); const inSel = g('sellFilterInstance'); if (!grpSel) return;
    if (trigger === 'group') { ptSel.value=''; arSel.value=''; szSel.value=''; clSel.value=''; } else if (trigger === 'type') { arSel.value=''; szSel.value=''; clSel.value=''; } else if (trigger === 'article') { szSel.value=''; clSel.value=''; } else if (trigger === 'size') { clSel.value=''; }
    const cartInstIds = state.sellCart.map(c => c.inst.id); 
    
    const validItems = [];
    for(let i=0; i<state.open.length; i++){
        const item = state.open[i];
        if(!item.instances) continue;
        const validInsts = [];
        for(let j=0; j<item.instances.length; j++){
            if(!cartInstIds.includes(item.instances[j].id)) validInsts.push(item.instances[j]);
        }
        if(validInsts.length > 0) validItems.push({...item, validInsts});
    }

    const updateDropdown = (selEl, valuesSet, defaultText) => { const currentVal = selEl.value; fillSel(selEl, [...valuesSet].sort(sortKeys), defaultText); if ([...valuesSet].includes(currentVal)) selEl.value = currentVal; else selEl.value = ''; };
    if (['init', 'cart'].includes(trigger)) updateDropdown(grpSel, new Set(validItems.map(i => i.group).filter(Boolean)), '– Alle –'); let itemsBase = grpSel.value ? validItems.filter(i => i.group === grpSel.value) : validItems;
    if (['init', 'cart', 'group'].includes(trigger)) updateDropdown(ptSel, new Set(itemsBase.map(i => i.productType).filter(Boolean)), '– Alle –'); itemsBase = ptSel.value ? itemsBase.filter(i => i.productType === ptSel.value) : itemsBase;
    if (['init', 'cart', 'group', 'type'].includes(trigger)) updateDropdown(arSel, new Set(itemsBase.map(i => String(i.article||'')).filter(Boolean)), '– Alle –'); itemsBase = arSel.value ? itemsBase.filter(i => String(i.article||'') === arSel.value) : itemsBase;
    if (['init', 'cart', 'group', 'type', 'article'].includes(trigger)) updateDropdown(szSel, new Set(itemsBase.map(i => String(i.size||'')).filter(Boolean)), '– Alle –'); itemsBase = szSel.value ? itemsBase.filter(i => String(i.size||'') === szSel.value) : itemsBase;
    if (['init', 'cart', 'group', 'type', 'article', 'size'].includes(trigger)) updateDropdown(clSel, new Set(itemsBase.map(i => String(i.color||'')).filter(Boolean)), '– Alle –'); itemsBase = clSel.value ? itemsBase.filter(i => String(i.color||'') === clSel.value) : itemsBase;
    
    let options = '<option value="" disabled selected>– Exemplar wählen –</option>'; let hasOptions = false;
    itemsBase.forEach(item => { item.validInsts.forEach(inst => { hasOptions = true; const label = `${esc(item.article)||'Unbenannt'} ${esc(item.color)||''} ${esc(item.size)||''} | EK: ${euro(inst.purchasePrice)}`; options += `<option value="${item.id}::${inst.id}">${label}</option>`; }); });
    if(!hasOptions) options = '<option value="" disabled selected>Keine Exemplare</option>'; inSel.innerHTML = options;
}

function addSellPosition() { const val = gVal('sellFilterInstance'); if(!val) return; const [itemId, instId] = val.split('::'); const item = state.open.find(i=>i.id===itemId); const inst = item ? item.instances.find(x=>x.id===instId) : null; if (item && inst) { state.sellCart.push({item, inst}); state.psManualOverride = false; renderSellCart(); updateSellFilters('cart'); } }
function removeSellPosition(index) { state.sellCart.splice(index, 1); state.psManualOverride = false; renderSellCart(); updateSellFilters('cart'); }
function renderSellCart() { const container = g('sellCartContainer'); if (!container) return; if (state.sellCart.length === 0) { container.innerHTML = '<div class="empty">Noch keine Positionen hinzugefügt.</div>'; updateSellPreview(); return; } let html = ''; state.sellCart.forEach((pos, i) => { const title = `${esc(pos.item.group)||''} / ${esc(pos.item.productType)||''} / ${esc(pos.item.article)||''} / ${esc(pos.item.size)||''} / ${esc(pos.item.color)||''}`; html += `<div class="sell-pos-row"><div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><b>${i+1}.</b> ${title.replace(/\/\s\//g, '/').replace(/\/$/, '')} <span style="color:var(--primary);font-weight:600;margin-left:8px;">${euro(pos.inst.purchasePrice)}</span></div><button class="btn btn-danger" style="min-height:28px;padding:.2rem .5rem;font-size:var(--text-xs);" onclick="removeSellPosition(${i})">✕</button></div>`; }); container.innerHTML = html; updateSellPreview(); }

function updateSellPreview() {
    const nameInput = g('sellBaseName'); const priceInput = g('sellPrice'); const psInput = g('sellPsInput'); const previewName = g('sellNamePreview'); const ekEl = g('sellEKTotal'); const netEl = g('sellNetto'); const histEl = g('sellHistPreview'); const finalProfitEl = g('sellFinalProfit'); if(!nameInput) return;
    const base = nameInput.value.trim(); const articles = [...new Set(state.sellCart.map(c => c.item.article).filter(Boolean))]; previewName.textContent = base + (articles.length > 0 ? ' ' + articles.join(' ') : '') ? `Finaler Set-Name: ${base + (articles.length > 0 ? ' ' + articles.join(' ') : '')}` : '';
    let purchaseTotal = 0; state.sellCart.forEach(c => purchaseTotal += (+c.inst.purchasePrice || 0)); ekEl.textContent = euro(purchaseTotal);
    if (!state.psManualOverride && state.sellCart.length > 0) { const allPs = state.sellCart.every(c => c.inst.profitshare); const nonePs = state.sellCart.every(c => !c.inst.profitshare); if (allPs) psInput.value = 50; else if (nonePs) psInput.value = 0; }
    const salePrice = +priceInput.value || 0; const rohertrag = salePrice - purchaseTotal; netEl.textContent = euro(rohertrag); netEl.style.color = rohertrag < 0 ? 'var(--err)' : 'var(--primary)';
    const psVal = +(psInput ? psInput.value : 0); const finalProfit = rohertrag * (1 - psVal/100); if (salePrice > 0) { finalProfitEl.textContent = psVal > 0 ? `Netto nach ${psVal}% PS: ${euro(finalProfit)}` : `Netto: ${euro(finalProfit)}`; } else { finalProfitEl.textContent = ''; }
}

function executeSale() {
  if (state.sellCart.length === 0) return alert('Bitte Artikel einfügen.'); const sp = +gVal('sellPrice')||0; if (sp<=0) return alert('Bitte Verkaufspreis eingeben.');
  const byArticle = new Map(); state.sellCart.forEach(({item,inst})=>{ if(!byArticle.has(item.id)) byArticle.set(item.id,{item,insts:[]}); byArticle.get(item.id).insts.push(inst); });
  const base = gVal('sellBaseName').trim(); const articles = [...new Set(state.sellCart.map(c => c.item.article).filter(Boolean))]; const setName = base + (articles.length > 0 ? ' ' + articles.join(' ') : '');
  const purchaseTotal = state.sellCart.reduce((s,{inst})=>s+(+inst.purchasePrice||0),0); const rawProfit = sp - purchaseTotal; const psPct = +(g('sellPsInput') ? gVal('sellPsInput') : 0); const netProfit = rawProfit * (1 - psPct/100); const psSome = psPct > 0;
  
  const sid = g('sellSetImgData'); let previewImage = sid ? sid.value : '';
  if(!previewImage) { for(let i=0; i<state.sellCart.length; i++) { if(state.sellCart[i].inst.image) { previewImage = state.sellCart[i].inst.image; break; } } }

  state.sold.unshift({ id:uid(), setName: setName.trim() || 'Unbenanntes Set', salePrice:sp, purchaseTotal, netProfit, saleDate:today(), hasProfitshare:psSome, previewImage: previewImage, items:[...byArticle.values()].map(e=>({ article:e.item.article, productType:e.item.productType||'', group:e.item.group, size:e.item.size, color:e.item.color, menge:e.insts.length, quantity:e.insts.length })) });
  byArticle.forEach(({item,insts})=>{ const rmIds = new Set(insts.map(x=>x.id)); if(item.instances) item.instances = item.instances.filter(x=>!rmIds.has(x.id)); });
  state.sellCart = []; ['sellBaseName', 'sellPrice', 'sellSetImgData'].forEach(id => { const el=g(id); if(el) el.value=''; });
  const spi = g('sellPsInput'); if(spi) spi.value='0'; const sl = g('sellSetImgLabel'); if(sl) sl.textContent = 'Wählen…'; const sprev = g('sellSetImgPreview'); if(sprev) sprev.innerHTML = '📷'; const sclr = g('sellClearSetImg'); if(sclr) sclr.style.display='none';
  state.psManualOverride = false; save(); toast('Verkauft ✓'); state.page='sold'; render();
}

function toggleStack(id) { const el = g(id); if (!el) return; const btn = el.previousElementSibling; el.classList.toggle('open'); state.openCollapse['s_'+id] = el.classList.contains('open'); if (btn && btn.classList.contains('stack-toggle')) { const menge = el.querySelectorAll('.stack-inst').length; btn.textContent = el.classList.contains('open') ? `▾ ${menge} verbergen` : `▸ ${menge} anzeigen`; } }
function toggleAllGroups() { globalExpandState = !globalExpandState; state.openCollapse = {}; renderOpen(); }
function toggleZeroFilter() { state.hideZero = !state.hideZero; updateZeroToggleUI(); renderOpen(); }
function updateZeroToggleUI() { const active = state.hideZero; const track = g('zeroFilterBtn'); const knob = g('zeroFilterKnob'); if(track) track.style.background = active ? 'var(--primary)' : '#ccc'; if(knob) knob.style.left = active ? '22px' : '2px'; }

function populateOpenFilterDropdowns() {
  const grpSel = g('openSearchGroup'); const typSel = g('openSearchType'); const artSel = g('openSearchArticle'); const szSel = g('openSearchSize'); const colSel = g('openSearchColor'); if(!grpSel) return;
  const grps = new Set(), typs = new Set(), arts = new Set(), szs = new Set(), cols = new Set();
  state.open.forEach(i => { if (state.hideZero && (!i.instances || i.instances.length === 0)) return; if(i.group) grps.add(i.group); if(i.productType) typs.add(i.productType); if(i.article) arts.add(i.article); if(i.size) szs.add(i.size); if(i.color) cols.add(i.color); });
  const f = state.openFilters; const updateSel = (el, set, currentVal, label) => { if(!el) return; el.innerHTML = `<option value="">${label}</option>` + [...set].sort(sortKeys).map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join(''); if([...set].includes(currentVal)) el.value = currentVal; };
  updateSel(grpSel, grps, f.group, 'Alle Gruppen'); updateSel(typSel, typs, f.type, 'Alle Typen'); updateSel(artSel, arts, f.article, 'Alle Artikel'); updateSel(szSel, szs, f.size, 'Alle Größen'); updateSel(colSel, cols, f.color, 'Alle Farben');
}
function updateOpenFilters() { state.openFilters.text = gVal('openSearchText').trim(); state.openFilters.group = gVal('openSearchGroup'); state.openFilters.type = gVal('openSearchType'); state.openFilters.article = gVal('openSearchArticle'); state.openFilters.size = gVal('openSearchSize'); state.openFilters.color = gVal('openSearchColor'); renderOpen(); }
function toggleGrp(el) { const key = el.dataset.key; const body = document.querySelector(`div[data-body="${key}"]`); if (!body) return; const isCurrentlyOpen = state.openCollapse[key] !== undefined ? state.openCollapse[key] : globalExpandState; const willBeOpen = !isCurrentlyOpen; state.openCollapse[key] = willBeOpen; body.style.display = willBeOpen ? 'block' : 'none'; const title = el.querySelector('.group-title'); if (title) { title.innerHTML = title.innerHTML.replace(willBeOpen ? '▶' : '▼', willBeOpen ? '▼' : '▶'); } }

function renderOpen() {
  updateZeroToggleUI(); const toggleAllBtn = g('toggleAllBtn'); if (toggleAllBtn) { toggleAllBtn.innerHTML = globalExpandState ? '↕ Alle einklappen' : '↕ Alle aufklappen'; }
  const oc = g('openContent'); if (!oc) return;
  if (!state.open || !state.open.length) { oc.innerHTML='<div class="empty">Keine offenen Artikel.</div>'; return; }
  populateOpenFilterDropdowns(); const countPcs = (arr) => arr.reduce((s, i) => s + (i.instances ? i.instances.length : 0), 0); const isOpen = (key) => state.openCollapse[key] !== undefined ? state.openCollapse[key] : globalExpandState; const hashStr = s => Math.abs(String(s).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(36);
  
  const tree = {}; const f = state.openFilters; const searchTerms = f.text.toLowerCase().split(' ').filter(Boolean);
  state.open.forEach(item => {
    if (state.hideZero && (!item.instances || item.instances.length === 0)) return; 
    if (f.group && item.group !== f.group) return; 
    if (f.type && item.productType !== f.type) return; 
    if (f.article && item.article !== f.article) return;
    if (f.size && item.size !== f.size) return; 
    if (f.color && item.color !== f.color) return;
    if (searchTerms.length > 0) { const searchStr = `${item.group || ''} ${item.productType || ''} ${item.article || ''} ${item.size || ''} ${item.color || ''}`.toLowerCase(); const matchesAll = searchTerms.every(term => searchStr.includes(term)); if (!matchesAll) return; }
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
            let img = ''; for(let n=0; n<allInst.length; n++){ if(allInst[n].image){ img=allInst[n].image; break; } } if(!img) img = firstItem._savedImage || '';
            const sdId = 'sdA_' + hashStr(grp+pt+art+col+(firstItem.size||'–')); const ekSumme = allInst.reduce((s,i)=>s+(+i.purchasePrice||0),0); const menge = allInst.length; const einzel = menge > 0 ? ekSumme / menge : (+firstItem.purchasePrice || 0); const hasPsh = menge > 0 ? allInst.some(x=>x.profitshare) : firstItem.profitshare;
            cardsHtml += `<div class="item-card"><div class="item-card-main"><div class="thumb" style="grid-column: 1 / 3;">${img?`<img src="${img}" loading="lazy" onerror="this.parentElement.innerHTML='📦'">` :'📦'}</div><div class="item-info">${firstItem.productType && (!art || art === '–') ? `<div style="font-size:var(--text-xs);color:var(--muted);margin-bottom:2px;">${esc(firstItem.productType)}</div>` : ''}<div class="item-title">${esc(firstItem.article) || '–'}</div><div class="chips"><span class="chip">Gr. ${esc(firstItem.size)||'-'}</span><span class="chip">${esc(firstItem.color)||'-'}</span><span class="chip" style="cursor:pointer" onclick="editEK('${firstItem.id}')">EK ${euro(einzel)} ✎</span><button class="chip" style="cursor:pointer;border:none" onclick="editItemImage('${firstItem.id}')">🖼 Bild</button><button class="chip" style="cursor:pointer;border:none" onclick="toggleItemProfitshare('${firstItem.id}')">${hasPsh?'PS ✓':'PS ✎'}</button>${`<span class="chip stack" style="display:flex;gap:3px;align-items:center;padding:0 4px"><button onclick="changeQty('${firstItem.id}',1)" style="width:16px;height:16px;border-radius:50%;background:#4CAF50;color:white;font-size:10px;border:none;font-weight:bold;cursor:pointer;line-height:1">+</button>${menge}<button onclick="changeQty('${firstItem.id}',-1)" style="width:16px;height:16px;border-radius:50%;background:#f44336;color:white;font-size:10px;border:none;font-weight:bold;cursor:pointer;line-height:1">−</button></span>`}${hasPsh?'<span class="chip ps">Profitshare</span>':''}</div></div></div><div class="item-footer"><div class="item-price-row">${menge} × Ø${euro(einzel)} = <b>${euro(ekSumme)}</b></div><div class="item-actions">${menge>1?`<button class="btn btn-ghost" style="min-height:36px;padding:.3rem .7rem;font-size:var(--text-xs);" onclick="toggleStack('${sdId}')">Details</button>`:''}<button class="btn btn-ghost" style="min-height:36px;padding:.3rem .7rem;font-size:var(--text-xs);" onclick="editItem('${firstItem.id}')">✏️</button><button class="btn btn-danger" style="min-height:36px;padding:.3rem .7rem;font-size:var(--text-xs);" onclick="deleteItem('${firstItem.id}')">🗑</button></div></div>${menge>1?`<button class="stack-toggle" onclick="toggleStack('${sdId}')">▸ ${menge} Exemplare anzeigen</button><div class="stack-details" id="${sdId}">${allInst.map(inst=>`<div class="stack-inst"><div class="inst-thumb" style="grid-column: 1 / 3;">${inst.image?`<img src="${inst.image}" loading="lazy" onerror="this.parentElement.innerHTML='📦'">` :'📦'}</div><div><div style="font-size:var(--text-xs);color:var(--muted);cursor:pointer" onclick="editInstEK('${firstItem.id}','${inst.id}')">EK ${euro(inst.purchasePrice||0)} ✎ · ${fmtDate(inst.entryDate)}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px"><button class="btn btn-ghost" style="min-height:24px;padding:.15rem .4rem;font-size:var(--text-xs);" onclick="editInstImage('${firstItem.id}','${inst.id}')">🖼 Bild</button><button class="btn btn-ghost" style="min-height:24px;padding:.15rem .4rem;font-size:var(--text-xs);" onclick="toggleInstProfitshare('${firstItem.id}','${inst.id}')">${inst.profitshare?'PS ✓':'PS ✎'}</button></div>${inst.comment?`<div style="font-size:var(--text-xs);color:var(--muted);">${esc(inst.comment)}</div>`:''}${inst.defect?`<div style="font-size:var(--text-xs);color:var(--warn);">⚠ ${esc(inst.defect)}</div>`:''}</div><button class="btn btn-danger" style="min-height:30px;padding:.2rem .5rem;font-size:var(--text-xs);" onclick="deleteInst('${firstItem.id}','${inst.id}')">🗑</button></div>`).join('')}</div>`:''}</div>`;
          });
          if(cardsHtml === '') return;
          const hasColor = col && col.trim() !== '' && col !== '–' && col !== '-';
          if (hasColor) { const cKey = 'c_' + hashStr(grp+pt+art+col); colHtmlMaster += `<div style="margin-bottom:var(--sp3); margin-left:var(--sp2);"><div class="group-head" onclick="toggleGrp(this)" data-key="${cKey}" style="cursor:pointer;"><h5 class="group-title" style="font-size:var(--text-xs);color:var(--muted);text-transform:uppercase;">${isOpen(cKey) ? "▼" : "▶"} Farbe: ${esc(col)}</h5><div style="display:flex;gap:6px;align-items:center;"><span class="chip">${colTotal} Stk</span></div></div><div class="grp-body" data-body="${cKey}" style="display:${isOpen(cKey) ? "block" : "none"}">${cardsHtml}</div></div>`; } else { colHtmlMaster += `<div style="margin-bottom:var(--sp2); margin-left:var(--sp2);">${cardsHtml}</div>`; }
        }); 
        if (!colHtmlMaster) return; ptTotal += artTotal; const hasArt = art && art.trim() !== '' && art !== '–' && art !== '-';
        if (hasArt) { const aKey = 'a_' + hashStr(grp+pt+art); ptHtml += `<div style="margin-bottom:var(--sp3); margin-left:var(--sp2);"><div class="group-head" onclick="toggleGrp(this)" data-key="${aKey}" style="cursor:pointer;"><h4 class="group-title" style="font-size:var(--text-sm);">${isOpen(aKey) ? "▼" : "▶"} ${esc(art)}</h4><div style="display:flex;gap:6px;align-items:center;"><span class="chip">${artTotal} Stk</span></div></div><div class="grp-body" data-body="${aKey}" style="display:${isOpen(aKey) ? "block" : "none"}">${colHtmlMaster}</div></div>`; } else { ptHtml += `<div>${colHtmlMaster}</div>`; }
      }); 
      if (!ptHtml) return; grpTotal += ptTotal; const pKey = 'p_' + hashStr(grp+pt);
      grpHtml += `<div style="margin-bottom:var(--sp4); margin-left:var(--sp2);"><div class="group-head" onclick="toggleGrp(this)" data-key="${pKey}" style="cursor:pointer;"><h3 class="group-title" style="font-size:var(--text-sm);color:var(--muted);">${isOpen(pKey) ? "▼" : "▶"} ${esc(pt)}</h3><div style="display:flex;gap:6px;align-items:center;"><span class="chip">${ptTotal} Stk</span></div></div><div class="grp-body" data-body="${pKey}" style="display:${isOpen(pKey) ? "block" : "none"}">${ptHtml}</div></div>`;
    }); 
    if (!grpHtml) return; const gKey = 'g_' + hashStr(grp);
    html += `<div style="margin-bottom:var(--sp6);"><div class="group-head" onclick="toggleGrp(this)" data-key="${gKey}" style="cursor:pointer;"><h2 class="group-title">${isOpen(gKey) ? "▼" : "▶"} ${esc(grp)}</h2><div style="display:flex;gap:6px;align-items:center;"><span class="chip stack">${grpTotal} Stk</span></div></div><div class="grp-body" data-body="${gKey}" style="display:${isOpen(gKey) ? "block" : "none"}">${grpHtml}</div></div>`;
  });
  oc.innerHTML = html || '<div class="empty">Keine Treffer.</div>';
}

function editItem(itemId) { const item = state.open.find(i=>i.id===itemId); if (!item) return; const newArticle = prompt('Artikelname:', item.article||''); if(newArticle === null) return; const newSize = prompt('Groesse:', item.size||''); if(newSize === null) return; const newColor = prompt('Farbe:', item.color||''); if(newColor === null) return; item.article = newArticle; item.size = newSize; item.color = newColor; save(); renderOpen(); }
function deleteItem(itemId) { if (!confirm('Artikel löschen?')) return; state.open = state.open.filter(i=>i.id!==itemId); state.sellCart = state.sellCart.filter(c => c.item.id !== itemId); save(); if (state.page === 'sell') renderSellFilters(); renderOpen(); }
function deleteInst(itemId, instId) { const item = state.open.find(i=>i.id===itemId); if (!item) return; if (!confirm('Exemplar löschen?')) return; item.instances = item.instances.filter(x=>x.id!==instId); if (item.instances.length===0) state.open = state.open.filter(i=>i.id!==itemId); state.sellCart = state.sellCart.filter(c => c.inst.id !== instId); save(); if (state.page === 'sell') { renderSellCart(); renderSellFilters(); } renderOpen(); }
function changeQty(itemId, delta) { const item = state.open.find(i=>i.id===itemId) || state.open.find(i=>stackKey(i)===itemId); if(!item) return; const current = item.instances.length; if(delta > 0) { let inheritImg = ''; if(item.instances[0] && item.instances[0].image) { inheritImg = item.instances[0].image; } else if (item.image) { inheritImg = item.image; } let pP = 0; if(item.instances[0]) { pP = item.instances[0].purchasePrice; } else if (item.purchasePrice) { pP = item.purchasePrice; } item.instances.push({ id: uid(), purchasePrice: pP, profitshare: item.profitshare || false, image: inheritImg, entryDate: today(), comment: '', defect: '' }); } else if(delta < 0 && current > 0) { const removedInst = item.instances.pop(); state.sellCart = state.sellCart.filter(c => c.inst.id !== removedInst.id); if(item.instances.length === 0 && removedInst.image) { item._savedImage = removedInst.image; } } save(); if (state.page === 'sell') renderSellFilters(); renderOpen(); }
function editItemImage(itemId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; imagePickCallback = (url) => { item._savedImage = url; if(item.instances[0] && !item.instances[0].image) item.instances[0].image = url; syncNewImageLabel(url); save(); renderOpen(); }; openImagePicker(item._savedImage || (item.instances[0] ? item.instances[0].image : '')); }
function toggleItemProfitshare(itemId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; const newVal = !item.instances.some(x=>x.profitshare); item.instances.forEach(x=>x.profitshare = newVal); save(); renderOpen(); }
function editInstImage(itemId, instId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; const inst = item.instances.find(i=>i.id===instId); if(!inst) return; imagePickCallback = (url) => { inst.image = url; syncNewImageLabel(url); save(); renderOpen(); }; openImagePicker(inst.image || item._savedImage || ''); }
function toggleInstProfitshare(itemId, instId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; const inst = item.instances.find(i=>i.id===instId); if(!inst) return; inst.profitshare = !inst.profitshare; save(); renderOpen(); }
function editEK(itemId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; const val = prompt('EK Preis (€):', item.purchasePrice||0); if(val === null) return; const price = parseFloat(val.replace(',','.')) || 0; item.purchasePrice = price; item.instances.forEach(inst => inst.purchasePrice = price); save(); renderOpen(); }
function editInstEK(itemId, instId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; const inst = item.instances.find(i=>i.id===instId); if(!inst) return; const val = prompt('EK Preis (€):', item.purchasePrice||0); if(val === null) return; inst.purchasePrice = parseFloat(val.replace(',','.')) || 0; save(); renderOpen(); }

function renderStats() {
  const years = [...new Set(state.sold.map(s=>(s.saleDate||today()).slice(0,4)))].sort((a,b)=>b-a);
  if (!years.length) years.push(state.year); if (!years.includes(state.year)) state.year = years[0];
  const sy = g('statsYear'); if(sy) sy.innerHTML = years.map(y=>`<option value="${y}" ${y===state.year?'selected':''}>${y}</option>`).join('');
  const ys = state.sold.filter(s=>(s.saleDate||today()).startsWith(state.year));
  const totalSets = ys.length; const totalProfit = ys.reduce((s,set)=>s+(set.netProfit||0),0); const totalRevenue = ys.reduce((s,set)=>s+(set.salePrice||0),0);
  const totalArtSold = ys.reduce((s,set)=>s+(set.items||[]).reduce((a,i)=>a+((i.menge !== undefined ? i.menge : i.quantity)||1),0),0);
  const topSet = ys.slice().sort((a,b)=>(b.netProfit||0)-(a.netProfit||0))[0];
  const monthMap = new Map();
  ys.forEach(set=>{
    const sDate = set.saleDate || today(); const m = fmtMonth(sDate);
    if(!monthMap.has(m)) monthMap.set(m,{profit:0,revenue:0,sets:0,artUnits:0,items:[],key:sDate.slice(0,7)});
    const e=monthMap.get(m); e.profit += (set.netProfit||0); e.revenue += (set.salePrice||0); e.sets += 1;
    if(set.items) {
        e.artUnits+= set.items.reduce((a,i)=>a+((i.menge !== undefined ? i.menge : i.quantity)||1),0);
        set.items.forEach(item=>{ e.items.push({ article:item.article, productType:item.productType||'', group:item.group||'', size:item.size||'', color:item.color||'', quantity:(item.menge !== undefined ? item.menge : item.quantity)||1, setName:set.setName||'Set', saleDate:sDate }); });
    }
  });
  const months = [...monthMap.entries()].sort((a,b)=>b[1].key.localeCompare(a[1].key));
  const sc = g('statsCards'); if(sc) sc.innerHTML = [{k:'Verkaufte Artikel', v:totalSets}, {k:'Jahresgewinn', v:euro(totalProfit)}, {k:'Umsatz', v:euro(totalRevenue)}, {k:'Top Artikel', v:topSet ? `<span style="font-size:var(--text-sm);">${esc(topSet.setName)||'–'}</span><div style="font-size:var(--text-xs);color:var(--muted);margin-top:2px;">${(topSet.items||[]).map(i=>[i.productType,i.article].filter(Boolean).map(esc).join(' · ')).join(', ')}</div>` : '-'}].map(c=>`<div class="stat-card"><div class="k">${c.k}</div><div class="v">${c.v}</div></div>`).join('');
  const monthPsProfit = new Map(); const monthPsSets = new Map();
  ys.filter(s=>s.hasProfitshare).forEach(set=>{ const sDate = set.saleDate || today(); const m=fmtMonth(sDate); monthPsProfit.set(m,(monthPsProfit.get(m)||0)+(set.netProfit||0)); monthPsSets.set(m,(monthPsSets.get(m)||0)+1); });
  const mt = g('monthTable'); if(mt) mt.innerHTML = months.length ? `<thead><tr><th>Monat</th><th>Jahr</th><th>Sets</th><th>Art.</th><th>Gewinn</th><th>Umsatz</th><th>PS-Anteil</th></tr></thead><tbody>${months.map(([m,d])=>{ const [mon,yr] = m.split(' '); const psSets = monthPsSets.get(m)||0; const psProfit = monthPsProfit.get(m)||0; const psPct = d.sets ? Math.round(psSets/d.sets*100) : 0; return '<tr><td>'+mon+'</td><td>'+yr+'</td><td>'+d.sets+'</td><td>'+d.artUnits+'</td><td>'+euro(d.profit)+'</td><td>'+euro(d.revenue)+'</td><td>'+(psSets?euro(psProfit)+' ('+psPct+'%)':'-')+'</td></tr>'; }).join('')}</tbody>` : '<tbody><tr><td colspan="7">Keine Verkäufe.</td></tr></tbody>';
  const avgUnit = totalSets ? totalProfit/totalSets : 0; const psCount = ys.filter(s=>s.hasProfitshare).length;
  const mkTop5 = (title, entries, fmt) => `<div style="margin-bottom:var(--sp4);"><div style="font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:var(--sp2);">${title}</div><table class="mini-table"><tbody>${entries.map(([name,val],i)=>`<tr><td style="color:var(--muted);width:20px;">${i+1}</td><td>${esc(name)}</td><td style="text-align:right;font-weight:700;">${fmt(val)}</td></tr>`).join('')}</tbody></table></div>`;
  const setByName = new Map(); ys.forEach(set => { const name = set.setName || '(kein Name)'; if (!setByName.has(name)) setByName.set(name, {profit:0, revenue:0, count:0}); const e = setByName.get(name); e.profit += (set.salePrice||0) - (set.purchaseTotal||0); e.revenue += (set.salePrice||0); e.count += 1; });
  const top10SetProfit = [...setByName.entries()].map(([k,v])=>[k,v.profit/v.count]).sort((a,b)=>b[1]-a[1]).slice(0,10); const top10SetRevenue = [...setByName.entries()].map(([k,v])=>[k,v.revenue/v.count]).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const tc = g('top5Cards'); if(tc) tc.innerHTML = '<div class="top5-grid">' + mkTop5('🎯 Top 10 Artikel', top10SetProfit, euro) + mkTop5('💵 Top 10 Umsatz', top10SetRevenue, euro) + '</div>';
  const ptMap = new Map(); const artMap = new Map(); const artRevMap = new Map();
  ys.forEach(s => { const shareRev = (s.items && s.items.length) ? (s.salePrice||0) / s.items.length : (s.salePrice||0); if(s.items) { s.items.forEach(i => { const pt = i.productType || '–'; let qty = (i.menge !== undefined ? i.menge : i.quantity) || 1; ptMap.set(pt, (ptMap.get(pt)||0) + qty); const art = i.article || '–'; artMap.set(art, (artMap.get(art)||0) + qty); artRevMap.set(art, (artRevMap.get(art)||0) + shareRev); }); } });
  const topPt = [...ptMap.entries()].sort((a,b)=>b[1]-a[1])[0]; const topArt = [...artMap.entries()].sort((a,b)=>b[1]-a[1])[0]; const topArtRev = [...artRevMap.entries()].sort((a,b)=>b[1]-a[1])[0];
  const avgEkPerItem = totalArtSold ? ys.reduce((s,x)=>s+(x.items||[]).reduce((a,i)=>a+(i.purchasePrice||0),0),0) / totalArtSold : 0; const avgVkPerEinheit = totalSets ? totalRevenue / totalSets : 0;
  const kc = g('kpiCards'); if(kc) kc.innerHTML = `<div class="kpi-grid"><div class="kpi-card"><div class="k">Ø Gewinn / Set</div><div class="v">${euro(avgUnit)}</div><div class="d">Je verkauftem Vorgang</div></div><div class="kpi-card"><div class="k">Profitshare-Anteil</div><div class="v">${ys.length?Math.round(psCount/ys.length*100):0} %</div><div class="d">Vorgänge mit PS</div></div><div class="kpi-card"><div class="k">Ø Marge</div><div class="v">${totalRevenue?Math.round(totalProfit/totalRevenue*100):0} %</div><div class="d">Gewinn ÷ Umsatz</div></div><div class="kpi-card"><div class="k">Ø EK / Exemplare</div><div class="v">${euro(avgEkPerItem)}</div><div class="d">Durchschnitt pro Stück</div></div><div class="kpi-card"><div class="k">Ø VK / Einheit</div><div class="v">${euro(avgVkPerEinheit)}</div><div class="d">Durchschnittlicher Verkauf</div></div><div class="kpi-card"><div class="k">Bester Monat</div><div class="v">${months.length ? months.slice().sort((a,b)=>b[1].profit-a[1].profit)[0][0] : '–'}</div><div class="d">Höchster Monatsgewinn</div></div><div class="kpi-card"><div class="k">Umsatzstärkster Monat</div><div class="v">${months.length ? months.slice().sort((a,b)=>b[1].revenue-a[1].revenue)[0][0] : '–'}</div><div class="d">Höchster Monatsumsatz</div></div><div class="kpi-card"><div class="k">Aktivste Gruppe</div><div class="v">${(()=>{const m=new Map();ys.forEach(s=>(s.items||[]).forEach(i=>{const g=i.group||'–';m.set(g,(m.get(g)||0)+1);}));const t=[...m.entries()].sort((a,b)=>b[1]-a[1])[0];return t?esc(t[0]):'–';})()}</div><div class="d">Meist verkaufte Gruppe</div></div><div class="kpi-card"><div class="k">Aktivster Produkttyp</div><div class="v">${topPt ? esc(topPt[0]) : '–'}</div><div class="d">${topPt ? topPt[1] + 'x verkauft' : ''}</div></div><div class="kpi-card"><div class="k">Aktivste Artikelnamen</div><div class="v">${topArt ? esc(topArt[0]) : '–'}</div><div class="d">Oft verkauft</div></div><div class="kpi-card"><div class="k">Meiste verkaufte Exemplare</div><div class="v">${topArt ? esc(topArt[0]) : '–'}</div><div class="d">${topArt ? topArt[1] + ' Stück · Ø VK ' + euro(topArtRev ? topArtRev[1]/topArt[1] : 0) : ''}</div></div><div class="kpi-card"><div class="k">Top Umsatz Artikel</div><div class="v">${topArtRev ? esc(topArtRev[0]) : '–'}</div><div class="d">${topArtRev ? euro(topArtRev[1]) : ''}</div></div></div>`;
  const curMonthKey = new Date().toISOString().slice(0,7);
  const mcd = g('monthCards'); if(mcd) mcd.innerHTML = months.filter(([,d])=>d.items.length).map(([m,d])=>{ const isCurrent = d.key === curMonthKey; return `<div class="month-card${isCurrent?' current-month':''}"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--sp2);"><b>${m}${isCurrent?' <span style=\"font-size:var(--text-xs);color:var(--accent);\">● aktuell</span>':''}</b><div class="chips"><span class="chip">${d.sets} Set${d.sets!==1?'s':''}</span><span class="chip">${d.artUnits} Artikel</span><span class="chip profit">${euro(d.profit)}</span></div></div><ul class="month-items">${d.items.map(i=>{ const artLabel = [i.productType, i.article].filter(Boolean).map(esc).join(' · ') || '–'; const details = [i.size, i.color].filter(Boolean).map(esc).join(' · '); const label = i.setName ? `<b>${esc(i.setName)}</b> <span style="color:var(--muted);font-size:var(--text-xs);">${artLabel}${details?' · '+details:''}</span>` : artLabel+(details?' · '+details:''); const qty = i.quantity && i.quantity > 1 ? ` <span style="color:var(--accent);font-size:var(--text-xs);">×${i.quantity}</span>` : ''; return `<li>${label}${qty} · ${fmtDate(i.saleDate)}</li>`; }).join('')}</ul></div>`; }).join('') || '<div class="empty">Keine Verkäufe im gewählten Jahr.</div>';
}

function editSoldName(id) { const set = state.sold.find(s=>s.id===id); if(!set) return; const val = prompt('Name:', set.setName||''); if(val===null) return; set.setName = val.trim(); save(); renderSold(); }
function editSoldPrice(id) { const set = state.sold.find(s=>s.id===id); if(!set) return; const val = prompt('Verkaufspreis (EUR):', set.salePrice||0); if(val===null) return; const price = parseFloat(val.replace(',','.')); if(isNaN(price)) return alert('Ungültiger Preis'); set.salePrice = price; set.netProfit = price - (set.purchaseTotal||0); save(); renderSold(); }
function editSoldImage(id) { const set = state.sold.find(s=>s.id===id); if(!set) return; imagePickCallback = (url) => { set.previewImage = url; save(); renderSold(); }; openImagePicker(set.previewImage||''); }

function renderSold() {
  const sf = g('soldSearch'); const needle = sf ? sf.value.trim().toLowerCase() : '';
  const sets = needle ? state.sold.filter(s=>(s.setName||'').toLowerCase().includes(needle)) : state.sold;
  const sc = g('soldContent'); if (!sc) return;
  if (!sets.length) { sc.innerHTML='<div class="empty">Keine Einträge.</div>'; return; }
  let totalArtUnits = 0; sets.forEach(s => { if(s.items) s.items.forEach(i => totalArtUnits += ((i.menge !== undefined ? i.menge : i.quantity) || 1)); });
  const sub = g('soldSubtitle'); if(sub) sub.textContent = sets.length+' Sets · '+totalArtUnits+' Artikel';
  sc.innerHTML = sets.map(set=>`<div class="sold-card"><div class="sold-card-main"><div class="sold-thumb">${set.previewImage?`<img src="${set.previewImage}" loading="lazy" onerror="this.parentElement.innerHTML='📦'">` :'📦'}</div><div><div class="item-title">${esc(set.setName)||'Unbenanntes Set'}</div><div class="chips" style="margin-top:var(--sp1);"><span class="chip">${(set.items||[]).reduce((s,i)=>s+((i.menge !== undefined ? i.menge : i.quantity)||1),0)} Artikel</span><span class="chip">${fmtDate(set.saleDate)}</span>${set.hasProfitshare?'<span class="chip ps">PS</span>':''}</div><div class="muted" style="font-size:var(--text-xs);margin-top:var(--sp2);">${(set.items||[]).map(i=>{ const label=(set.setName?[i.productType,i.article]:[i.group,i.productType,i.article,i.size,i.color]).filter(Boolean).map(esc).join(' · '); let qty = (i.menge !== undefined ? i.menge : i.quantity) || 1; return label+(qty>1?' ×'+qty:''); }).join(', ')}</div></div></div><div class="item-footer"><div class="item-price-row">VK ${euro(set.salePrice)} · EK ${euro(set.purchaseTotal)} · <b class="profit">+${euro(set.netProfit)}</b></div><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;"><button class="btn btn-ghost" style="min-height:32px;padding:.2rem .6rem;font-size:var(--text-xs);" onclick="editSoldName('${set.id}')">✎ Name</button><button class="btn btn-ghost" style="min-height:32px;padding:.2rem .6rem;font-size:var(--text-xs);" onclick="editSoldPrice('${set.id}')">✎ VK</button><button class="btn btn-ghost" style="min-height:32px;padding:.2rem .6rem;font-size:var(--text-xs);" onclick="editSoldImage('${set.id}')">🖼 Bild</button><button class="btn btn-danger" style="min-height:32px;padding:.2rem .6rem;font-size:var(--text-xs);" data-del-sold="${set.id}">🗑</button></div></div></div>`).join('');
}

function renderTermine() {
    const container = g('terminContent'); if (!container) return; if (!state.termine || state.termine.length === 0) { container.innerHTML = '<div class="empty">Keine Termine vorhanden.</div>'; return; }
    const sorted = [...state.termine].sort((a,b) => new Date(`${a.datum}T${a.uhrzeit}:00`) - new Date(`${b.datum}T${b.uhrzeit}:00`)); let html = '';
    sorted.forEach(t => { const isAbholung = t.art === 'Abholung'; const color = isAbholung ? 'var(--err)' : 'var(--success)'; const icon = isAbholung ? '📤' : '🤝'; html += `<div class="card" style="margin-bottom:var(--sp3); border-left:4px solid ${color};"><div class="card-body" style="padding:var(--sp3);"><div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp2);"><div><div style="font-size:var(--text-xs); color:${color}; font-weight:700; text-transform:uppercase;">${icon} ${t.art}</div><h4 style="margin:2px 0 0; font-size:var(--text-base);">${esc(t.name)}</h4></div><div style="text-align:right;"><div style="font-weight:700;">${fmtDate(t.datum)}</div><div style="color:var(--muted); font-size:var(--text-sm);">${t.uhrzeit} Uhr</div></div></div><div class="chips" style="margin-bottom:var(--sp3);">${t.preis ? `<span class="chip" style="font-weight:700;">💰 ${esc(t.preis)}</span>` : ''}${t.ort ? `<span class="chip">📍 ${esc(t.ort)}</span>` : ''}${t.user ? `<span class="chip">👤 ${esc(t.user)}</span>` : ''}</div>${t.info ? `<div style="font-size:var(--text-sm); color:var(--muted); margin-bottom:var(--sp3); padding:8px; background:var(--surface2); border-radius:var(--rad-md);">${esc(t.info)}</div>` : ''}<div style="display:flex; gap:8px;"><button class="btn btn-primary" style="flex:1; min-height:36px; padding:0; font-size:var(--text-sm);" onclick="addTerminToCalendar('${t.id}')">📅 In Kalender</button><button class="btn btn-danger" style="width:40px; min-height:36px; padding:0;" onclick="deleteTermin('${t.id}')">🗑</button></div></div></div>`; });
    container.innerHTML = html;
}
function deleteTermin(id) { if(!confirm('Termin löschen?')) return; state.termine = state.termine.filter(t => t.id !== id); save(); renderTermine(); }
function addTerminToCalendar(id) { const entry = state.termine.find(t => t.id === id); if (!entry) return; const preisText = entry.preis ? ` / ${entry.preis}` : ''; const title = encodeURIComponent(`${entry.art} / ${entry.name}${preisText}`); const location = encodeURIComponent(entry.ort || ''); const details = encodeURIComponent(`User: ${entry.user || '-'}\nInfo: ${entry.info || '-'}`); const dParts = entry.datum.split('-'); const tParts = entry.uhrzeit.split(':'); const startDate = new Date(dParts[0], dParts[1] - 1, dParts[2], tParts[0], tParts[1]); const endDate = new Date(startDate.getTime() + (60 * 60 * 1000)); const startStr = startDate.toISOString().replace(/-|:|\.\d\d\d/g,""); const endStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g,""); window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&location=${location}&details=${details}`, '_blank'); }
function populateUhrzeit() { const sel = g('terminUhrzeit'); if (!sel) return; let html = '<option value="" disabled selected>Zeit wählen</option>'; for(let i=9; i<=23; i++) { let hour = i < 10 ? '0'+i : i; html += `<option value="${hour}:00">${hour}:00</option><option value="${hour}:30">${hour}:30</option>`; } sel.innerHTML = html; }
const tfrm = g('terminForm');
if(tfrm) { tfrm.addEventListener('submit', e => { e.preventDefault(); const entry = { id: uid(), art: gVal('terminArt'), name: gVal('terminName'), preis: gVal('terminPreis'), ort: gVal('terminOrt'), datum: gVal('terminDatum'), uhrzeit: gVal('terminUhrzeit'), user: gVal('terminUser'), info: gVal('terminInfo') }; if(!state.termine) state.termine = []; state.termine.unshift(entry); save(); toast('Termin angelegt ✓'); tfrm.reset(); renderTermine(); }); }

document.addEventListener('click', e => {
  const target = e.target; if (!target) return; const el = target.nodeType === 3 ? target.parentElement : target; if (!el || typeof el.closest !== 'function') return;
  const togBtn = el.closest('[data-tog]'); if (togBtn) { const d=g('sd-'+togBtn.dataset.tog); if(d) d.classList.toggle('open'); return; }
  const delBtn = el.closest('[data-del]'); if (delBtn && !el.closest('[data-del-inst]')) { if(!confirm('Ganzen Stapel löschen?')) return; const id=delBtn.dataset.del; state.open=state.open.filter(i=>i.id!==id); state.sellCart = state.sellCart.filter(c => c.item.id !== id); save(); renderOpen(); return; }
  const delInstBtn = el.closest('[data-del-inst]'); if (delInstBtn) { const itemId=delInstBtn.dataset.delInst, instId=delInstBtn.dataset.instId; const item=state.open.find(i=>i.id===itemId); if(!item) return; item.instances=item.instances.filter(x=>x.id!==instId); if(!item.instances.length) state.open=state.open.filter(i=>i.id!==itemId); state.sellCart = state.sellCart.filter(c => c.inst.id !== instId); save(); renderOpen(); return; }
  const delSoldBtn = el.closest('[data-del-sold]'); if (delSoldBtn) { if(!confirm('Eintrag löschen?')) return; state.sold=state.sold.filter(s=>s.id!==delSoldBtn.dataset.delSold); save(); renderSold(); return; }
  const rmBtn = el.closest('[data-rm]'); if (rmBtn) {
    const key = rmBtn.dataset.rm; const grp = rmBtn.dataset.grp; const typ = rmBtn.dataset.typ; const idx = rmBtn.dataset.idx;
    if (key === 'group') { if (state.master.catalog[grp]) delete state.master.catalog[grp]; } 
    else if (key === 'prodtype') { if (state.master.catalog[grp]) delete state.master.catalog[grp][typ]; } 
    else { if (state.master.catalog[grp] && state.master.catalog[grp][typ] && state.master.catalog[grp][typ][key]) { state.master.catalog[grp][typ][key].splice(+idx, 1); } }
    save(); updateMasterForm(); renderAllQuick(); renderMaster(); return;
  }
  const imgPickBtn = el.closest('.img-pick'); if(imgPickBtn) { if(imagePickCallback) imagePickCallback(imgPickBtn.dataset.url); closeImagePicker(); return; }
  const tgl = g('themeToggle'); if(tgl && tgl.contains(el)) { document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'); return; }
  
  const nb = el.closest('[data-page]'); if (nb) { state.page = nb.dataset.page; render(); }
});

const sy = g('statsYear'); if (sy) { sy.addEventListener('change', e=>{ state.year=e.target.value; renderStats(); }); }
const expBtn = g('exportBtn'); if(expBtn) expBtn.addEventListener('click', exportData);

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
  const sc=document.querySelector('.scroll-container'); if(sc && state.page !== 'open') sc.scrollTop=0; 
}

// APP STARTEN
load();
// Service Worker registrieren für PWA-Installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker erfolgreich registriert:', reg.scope))
      .catch(err => console.log('Service Worker Registrierung fehlgeschlagen:', err));
  });
}

