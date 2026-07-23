// ==========================================
// KLEINANZEIGEN HERO - APP.JS (v2.0 Clean UI)
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
  page: 'new', sellCart: [], psManualOverride: false, open: [], openFilters: { text: '', group: '', type: '', article: '', size: '', color: '' }, sold: [], soldFilter: '', termine: [], year: String(new Date().getFullYear()),
  master: { catalog: {}, badgeRules: [], images: [], setImages: [] }, openCollapse: {}, hideZero: true
};

let db = null; const DB_NAME = 'amp3db', DB_VER = 1, STORE = 'data';

function openDB() { return new Promise((res, rej) => { if (db) { res(db); return; } const req = indexedDB.open(DB_NAME, DB_VER); req.onupgradeneeded = e => e.target.result.createObjectStore(STORE); req.onsuccess = e => { db = e.target.result; res(db); }; req.onerror = e => rej(e.target.error); }); }
function save() { const payload = { open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year }; try { localStorage.setItem('amp3', JSON.stringify(payload)); } catch(e) {} openDB().then(database => { const tx = database.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(payload, 'state'); }); }
function load() { openDB().then(database => { const tx = database.transaction(STORE, 'readonly'); const req = tx.objectStore(STORE).get('state'); req.onsuccess = e => { const d = e.target.result; if (d) { applyState(d); } else { try { const ls = JSON.parse(localStorage.getItem('amp3') || 'null'); if (ls) { applyState(ls); save(); } } catch(e) {} } initApp(); }; req.onerror = () => fallbackLoad(); }).catch(() => fallbackLoad()); }
function fallbackLoad() { try { const ls = JSON.parse(localStorage.getItem('amp3') || 'null'); if (ls) applyState(ls); } catch(e) {} initApp(); }

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
    
    if (d.master && d.master.catalog && typeof d.master.catalog === 'object' && !Array.isArray(d.master.catalog)) state.master.catalog = JSON.parse(JSON.stringify(d.master.catalog)); 
    if (d.master) { if (Array.isArray(d.master.images)) state.master.images = d.master.images; if (Array.isArray(d.master.setImages)) state.master.setImages = d.master.setImages; }
    if (!state.master.catalog || typeof state.master.catalog !== 'object') state.master.catalog = {};

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

function onGroupChange() { if(state.page !== 'new') return; ['productType', 'article', 'size', 'color'].forEach(id => { const el = g(id); if (el) el.value = ''; }); renderAllQuick(); }
function onProductTypeChange() { if(state.page !== 'new') return; ['article', 'size', 'color'].forEach(id => { const el = g(id); if (el) el.value = ''; }); renderAllQuick(); }

window.handleQuickSelect = function(selId, val) {
    const sel = g(selId); if (!sel) return;
    if (sel.value === val) { sel.value = ''; } else { let exists = Array.from(sel.options).some(o => o.value === val); if (!exists) sel.add(new Option(val, val)); sel.value = val; }
    if (selId === 'group') onGroupChange(); else if (selId === 'productType') onProductTypeChange(); else renderAllQuick();
};

function renderQChips(type, items, currentVal) {
    const c = g('qb-' + type); if (!c) return;
    const safeItems = Array.isArray(items) ? items : [];
    let h = safeItems.map(val => {
        if(val == null) return ''; const strVal = String(val); const isActive = (strVal === String(currentVal||'')); const safeVal = strVal.replace(/'/g,"\\'").replace(/"/g,"&quot;");
        return `<div class="qb-chip ${isActive ? 'active' : ''}" onclick="handleQuickSelect('${type}', '${safeVal}')"><span>${esc(strVal)}</span></div>`;
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
function openNewImgPicker() { imagePickCallback = (url) => { const iv = g('imgValue'); if(iv) iv.value = url; const prev = g('imgPreview'); const lbl = g('imgLabel'); if(prev) prev.innerHTML = url ? `<img src="${url}" style="width:28px;height:28px;object-fit:cover;border-radius:6px;">` : '🖼'; if(lbl) lbl.textContent = url ? 'Bild gewählt ✓' : 'Wählen…'; }; const iv = g('imgValue'); openImagePicker(iv ? iv.value : ''); }

function openImagePicker(currentUrl='') {
  const modal = g('imagePickerModal'); const list = g('imagePickerList'); if(!modal || !list) return;
  const catImgs = (gVal('group') && gVal('productType') && state.master.catalog[gVal('group')]?.[gVal('productType')]?.images) || [];
  const allImgs = [...new Set([...catImgs, ...(state.master.images||[])])];
  const uploadTile = `<label class="img-pick-upload" style="border:2px dashed var(--primary); display:flex; flex-direction:column; align-items:center; justify-content:center; height:100px; border-radius:8px; cursor:pointer; background:var(--surface2); color:var(--primary); font-weight:bold; font-size:var(--text-xs);"><span style="font-size:1.5rem;">✚</span><span>Upload</span><input type="file" accept="image/*" style="display:none;" onchange="handleModalImageUpload(this.files[0])"></label>`;
  list.innerHTML = uploadTile + (allImgs.length ? allImgs.map(u => `<button type="button" class="img-pick" data-url="${u.replace(/"/g,'&quot;')}" style="border:2px solid ${u===currentUrl?'#4caf50':'transparent'}"><img src="${u}" loading="lazy" style="width:100%;height:100px;object-fit:cover;border-radius:8px;"></button>`).join('') : '');
  modal.style.display='flex'; modal.classList.add('show');
}
function closeImagePicker() { const modal = g('imagePickerModal'); if(modal){ modal.classList.remove('show'); modal.style.display='none'; } }

window.handleModalImageUpload = function(file) {
  if (!file) return;
  compressImage(file, url => {
    if (!Array.isArray(state.master.images)) state.master.images = [];
    state.master.images.unshift(url); save();
    if (imagePickCallback) imagePickCallback(url);
    closeImagePicker(); toast('Bild hochgeladen ✓');
  });
};

function renderOpen() {
  updateZeroToggleUI();
  const oc = g('openContent'); if (!oc) return;
  if (!state.open || !state.open.length) { oc.innerHTML='<div class="empty">Keine offenen Artikel.</div>'; return; }
  
  const tree = {}; const f = state.openFilters; const searchTerms = f.text.toLowerCase().split(' ').filter(Boolean);
  state.open.forEach(item => {
    if (state.hideZero && (!item.instances || item.instances.length === 0)) return; 
    if (f.group && item.group !== f.group) return; 
    if (f.type && item.productType !== f.type) return; 
    if (f.article && item.article !== f.article) return;
    if (searchTerms.length > 0) { const searchStr = `${item.group || ''} ${item.productType || ''} ${item.article || ''} ${item.size || ''} ${item.color || ''}`.toLowerCase(); if (!searchTerms.every(term => searchStr.includes(term))) return; }
    const grp = item.group || '–'; const pt = item.productType || '–'; const art = item.article || ''; const col = item.color || '–';
    if (!tree[grp]) tree[grp] = {}; if (!tree[grp][pt]) tree[grp][pt] = {}; if (!tree[grp][pt][art]) tree[grp][pt][art] = {}; if (!tree[grp][pt][art][col]) tree[grp][pt][art][col] = [];
    tree[grp][pt][art][col].push(item);
  });
  
  let html = '';
  Object.keys(tree).sort(sortKeys).forEach(grp => {
    let grpHtml = '';
    Object.keys(tree[grp]).sort(sortKeys).forEach(pt => {
      let ptHtml = '';
      Object.keys(tree[grp][pt]).sort(sortKeys).forEach(art => {
        let colHtmlMaster = '';
        Object.keys(tree[grp][pt][art]).sort(sortKeys).forEach(col => {
          const items = tree[grp][pt][art][col];
          const sizeMap = {}; items.forEach(i => { const sKey = i.size || '–'; if (!sizeMap[sKey]) sizeMap[sKey] = []; sizeMap[sKey].push(i); }); let cardsHtml = '';
          Object.values(sizeMap).forEach(sizeItems => {
            let allInst = []; sizeItems.forEach(sItem => { if(sItem.instances) { sItem.instances.forEach(i => { allInst.push({...i, _itemId:sItem.id}); }); } });
            if(allInst.length === 0 && state.hideZero) return; 
            const firstItem = sizeItems[0]; 
            let img = allInst.find(n=>n.image)?.image || firstItem._savedImage || '';
            const ekSumme = allInst.reduce((s,i)=>s+(+i.purchasePrice||0),0); const menge = allInst.length; const einzel = menge > 0 ? ekSumme / menge : (+firstItem.purchasePrice || 0); const hasPsh = menge > 0 ? allInst.some(x=>x.profitshare) : firstItem.profitshare;
            
            // Tage im Bestand (Ältestes Exemplar)
            const oldestDays = allInst.length ? Math.max(...allInst.map(x => calcDays(x.entryDate, today()))) : 0;

            cardsHtml += `<div class="item-card">
              <div class="item-card-main">
                <div class="thumb">${img?`<img src="${img}" loading="lazy">` :'📦'}</div>
                <div class="item-info">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                      <div class="item-title">${esc(firstItem.article) || esc(firstItem.productType) || '–'}</div>
                    </div>
                    <!-- EK Summe oben rechts -->
                    <div style="font-size:var(--text-xs); color:var(--muted); font-weight:bold; text-align:right;">
                      ${menge} × Ø${euro(einzel)} = <b style="color:var(--text); font-size:var(--text-sm);">${euro(ekSumme)}</b>
                    </div>
                  </div>
                  <div class="chips" style="margin-top:6px;">
                    <span class="chip">Gr. ${esc(firstItem.size)||'-'}</span>
                    <span class="chip">${esc(firstItem.color)||'-'}</span>
                    <!-- DEUTLICHER TAG-CHIP -->
                    <span class="chip days">⏱️ ${oldestDays} Tage im Bestand</span>
                  </div>
                </div>
              </div>
              
              <!-- Unten rechts: Aktionschips & Icon-Buttons -->
              <div class="item-footer">
                <div class="item-actions">
                  <span class="chip" style="cursor:pointer;" onclick="editEK('${firstItem.id}')">EK ${euro(einzel)} ✎</span>
                  <button class="chip" style="cursor:pointer;border:none" onclick="editItemImage('${firstItem.id}')">🖼 Bild</button>
                  <button class="chip" style="cursor:pointer;border:none" onclick="toggleItemProfitshare('${firstItem.id}')">${hasPsh?'PS ✓':'PS ✎'}</button>
                  <span class="chip stack" style="display:inline-flex;gap:3px;align-items:center;padding:0 6px">
                    <button onclick="changeQty('${firstItem.id}',1)" style="width:16px;height:16px;border-radius:50%;background:#4CAF50;color:white;font-size:10px;border:none;cursor:pointer">+</button>
                    ${menge}
                    <button onclick="changeQty('${firstItem.id}',-1)" style="width:16px;height:16px;border-radius:50%;background:#f44336;color:white;font-size:10px;border:none;cursor:pointer">−</button>
                  </span>
                  <button class="btn-icon-subtle" onclick="editItem('${firstItem.id}')" title="Bearbeiten">✏️</button>
                  <button class="btn-icon-subtle danger" onclick="deleteItem('${firstItem.id}')" title="Löschen">🗑️</button>
                </div>
              </div>
            </div>`;
          });
          if(cardsHtml) colHtmlMaster += `<div style="margin-bottom:var(--sp2); margin-left:var(--sp2);">${cardsHtml}</div>`;
        }); 
        if (colHtmlMaster) ptHtml += `<div style="margin-bottom:var(--sp3); margin-left:var(--sp2);"><h4 class="group-title">${esc(art)}</h4>${colHtmlMaster}</div>`;
      }); 
      if (ptHtml) grpHtml += `<div style="margin-bottom:var(--sp4); margin-left:var(--sp2);"><h3 class="group-title" style="font-size:var(--text-sm);color:var(--muted);">${esc(pt)}</h3>${ptHtml}</div>`;
    }); 
    if (grpHtml) html += `<div style="margin-bottom:var(--sp6);"><h2 class="group-title">${esc(grp)}</h2>${grpHtml}</div>`;
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

    // Filter-Anforderung: Bei Korpus / Tür nur die Farben ausgeben
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
              <!-- Farblicher Nettogewinn groß direkt neben dem Namen -->
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

        <!-- Rechte Seite: VK/EK + SCHLICHTE ICON-BUTTONS IN 1 REIHE -->
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0;">
          <div style="font-size:var(--text-xs); color:var(--muted); white-space:nowrap;">
            VK ${euro(set.salePrice)} · EK ${euro(set.purchaseTotal)}
          </div>
          <div style="display:flex; gap:2px; align-items:center;">
            <button class="btn-icon-subtle" onclick="editSoldName('${set.id}')" title="Name bearbeiten">✏️</button>
            <button class="btn-icon-subtle" onclick="editSoldPrice('${set.id}')" title="VK bearbeiten">🏷️</button>
            <button class="btn-icon-subtle" onclick="editSoldImage('${set.id}')" title="Bild ändern">🖼️</button>
            <button class="btn-icon-subtle danger" onclick="deleteSoldSet('${set.id}')" title="Löschen">🗑️</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function deleteSoldSet(id) {
  if (!confirm('Verkaufte Position löschen?')) return;
  state.sold = state.sold.filter(s => s.id !== id);
  save(); renderSold(); toast('Gelöscht ✓');
}

// Interaktiver KPI Filter Handler
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
  if (!years.length) years.push(state.year); if (!years.includes(state.year)) state.year = years[0];
  const sy = g('statsYear'); if(sy) sy.innerHTML = years.map(y=>`<option value="${y}" ${y===state.year?'selected':''}>${y}</option>`).join('');
  
  let ys = state.sold.filter(s=>(s.saleDate||today()).startsWith(state.year));
  if (fGrp || fTyp || fArt) {
    ys = ys.filter(s => (s.items||[]).some(i => (!fGrp || i.group === fGrp) && (!fTyp || i.productType === fTyp) && (!fArt || i.article === fArt)));
  }

  const totalSets = ys.length; const totalProfit = ys.reduce((s,set)=>s+(set.netProfit||0),0); const totalRevenue = ys.reduce((s,set)=>s+(set.salePrice||0),0);
  const totalDaysAll = ys.reduce((s,set) => s + (set.avgDaysInStock || 0), 0);
  const avgDaysOverall = totalSets ? Math.round(totalDaysAll / totalSets) : 0;

  const sc = g('statsCards'); if(sc) sc.innerHTML = [
    {k:'Verkäufe (Gefiltert)', v:totalSets}, 
    {k:'Gewinn', v:euro(totalProfit)}, 
    {k:'Umsatz', v:euro(totalRevenue)}, 
    {k:'Ø Standzeit', v:`${avgDaysOverall} Tage`}
  ].map(c=>`<div class="stat-card"><div class="k">${c.k}</div><div class="v">${c.v}</div></div>`).join('');

  const monthMap = new Map();
  ys.forEach(set=>{
    const sDate = set.saleDate || today(); const m = fmtMonth(sDate);
    if(!monthMap.has(m)) monthMap.set(m,{profit:0,revenue:0,sets:0,artUnits:0,key:sDate.slice(0,7)});
    const e=monthMap.get(m); e.profit += (set.netProfit||0); e.revenue += (set.salePrice||0); e.sets += 1;
    if(set.items) e.artUnits += set.items.reduce((a,i)=>a+((i.menge||i.quantity)||1),0);
  });
  const months = [...monthMap.entries()].sort((a,b)=>b[1].key.localeCompare(a[1].key));

  const mt = g('monthTable'); if(mt) mt.innerHTML = months.length ? `<thead><tr><th>Monat</th><th>Jahr</th><th>Sets</th><th>Art.</th><th>Gewinn</th><th>Umsatz</th></tr></thead><tbody>${months.map(([m,d])=>{ const [mon,yr] = m.split(' '); return `<tr><td>${mon}</td><td>${yr}</td><td>${d.sets}</td><td>${d.artUnits}</td><td>${euro(d.profit)}</td><td>${euro(d.revenue)}</td></tr>`; }).join('')}</tbody>` : '<tbody><tr><td colspan="6">Keine Verkäufe im Filter.</td></tr></tbody>';
}

function renderTermine() {
    const container = g('terminContent'); if (!container) return; if (!state.termine || state.termine.length === 0) { container.innerHTML = '<div class="empty">Keine Termine vorhanden.</div>'; return; }
    const sorted = [...state.termine].sort((a,b) => new Date(`${a.datum}T${a.uhrzeit}:00`) - new Date(`${b.datum}T${b.uhrzeit}:00`)); 
    
    container.innerHTML = sorted.map(t => {
      const isAbholung = t.art === 'Abholung';
      const color = isAbholung ? 'var(--err)' : 'var(--success)';
      const mapsUrl = t.ort ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.ort)}` : null;

      return `<div class="card" style="margin-bottom:var(--sp3); border-left:4px solid ${color};"><div class="card-body" style="padding:var(--sp3);"><div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp2);"><div><div style="font-size:var(--text-xs); color:${color}; font-weight:700;">${t.art}</div><h4 style="margin:2px 0 0; font-size:var(--text-base);">${esc(t.name)}</h4></div><div style="text-align:right;"><div style="font-weight:700;">${fmtDate(t.datum)}</div><div style="color:var(--muted); font-size:var(--text-sm);">${t.uhrzeit} Uhr</div></div></div><div class="chips" style="margin-bottom:var(--sp3);">${t.preis ? `<span class="chip">💰 ${esc(t.preis)}</span>` : ''}${mapsUrl ? `<a href="${mapsUrl}" target="_blank" class="chip" style="color:var(--primary); font-weight:700; text-decoration:underline;">📍 ${esc(t.ort)}</a>` : ''}${t.user ? `<span class="chip">👤 ${esc(t.user)}</span>` : ''}</div><button class="btn btn-danger" style="min-height:30px; padding:0; width:100%" onclick="deleteTermin('${t.id}')">🗑 Löschen</button></div></div>`;
    }).join('');
}

function deleteTermin(id) { if(!confirm('Termin löschen?')) return; state.termine = state.termine.filter(t => t.id !== id); save(); renderTermine(); }
function populateUhrzeit() { const sel = g('terminUhrzeit'); if (!sel) return; let html = '<option value="" disabled selected>Zeit wählen</option>'; for(let i=9; i<=23; i++) { let hour = i < 10 ? '0'+i : i; html += `<option value="${hour}:00">${hour}:00</option><option value="${hour}:30">${hour}:30</option>`; } sel.innerHTML = html; }

const tfrm = g('terminForm');
if(tfrm) { tfrm.addEventListener('submit', e => { e.preventDefault(); const entry = { id: uid(), art: gVal('terminArt'), name: gVal('terminName'), preis: gVal('terminPreis'), ort: gVal('terminOrt'), datum: gVal('terminDatum'), uhrzeit: gVal('terminUhrzeit'), user: gVal('terminUser'), info: gVal('terminInfo') }; if(!state.termine) state.termine = []; state.termine.unshift(entry); save(); toast('Termin angelegt ✓'); tfrm.reset(); const td = g('terminDatum'); if(td) td.value = today(); renderTermine(); }); }

document.addEventListener('click', e => {
  const target = e.target; if (!target) return; const el = target.nodeType === 3 ? target.parentElement : target; if (!el || typeof el.closest !== 'function') return;
  const imgPickBtn = el.closest('.img-pick'); if(imgPickBtn) { if(imagePickCallback) imagePickCallback(imgPickBtn.dataset.url); closeImagePicker(); return; }
  const tgl = g('themeToggle'); if(tgl && tgl.contains(el)) { document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'); return; }
  const nb = el.closest('[data-page]'); if (nb) { state.page = nb.dataset.page; render(); }
});

const sy = g('statsYear'); if (sy) { sy.addEventListener('change', e=>{ state.year=e.target.value; renderStats(); }); }
const expBtn = g('exportBtn'); if(expBtn) expBtn.addEventListener('click', exportData);

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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        reg.update();
        console.log('Service Worker registriert & aktualisiert:', reg.scope);
      })
      .catch(err => console.log('Service Worker Fehler:', err));
  });
}

load();
