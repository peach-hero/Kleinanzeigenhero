// ==========================================
// KLEINANZEIGEN HERO - APP.JS (v34.0 Ghost & Corrupt Image Cleaner)
// ==========================================

const g = id => document.getElementById(id);
const gVal = id => { const el = g(id); return el ? el.value : ''; };
const esc = s => { if (s == null) return ''; if (typeof s === 'object') { try { s = JSON.stringify(s); } catch(e) { s = '[Objekt]'; } } return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
const safeJsStr = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
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
const stackKey = i => `${i.group}||${i.productType||''}||${i.article||''}||${i.size||''}||${i.color||''}`; 
const uid = () => 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, c => { var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });

function toast(msg) { const t = g('toast'); if(t) { t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); } }
function fillSel(el, vals, ph) { if(!el) return; el.innerHTML = `<option value="">${ph}</option>` + vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''); }

const state = {
  page: 'new', sellCart: [], psManualOverride: false, psMode: 'pct', open: [], 
  openFilters: { text: '', group: '', type: '', article: '', size: '', color: '' }, 
  sellSelection: { group: '', type: '', article: '', size: '', color: '' },
  sold: [], soldFilter: '', termine: [], year: String(new Date().getFullYear()),
  deletedIds: [],
  deletedGroups: [], // DAUERHAFTE SPERRLISTE FÜR GELÖSCHTE GRUPPEN
  master: { catalog: {}, badgeRules: [], groupLogos: {}, typeLogos: {}, articleLogos: {}, images: [], setImages: [] }, openCollapse: {}, hideZero: true
};

let globalExpandState = false;
let db = null; const DB_NAME = 'amp3db', DB_VER = 1, STORE = 'data';
let imagePickCallback = null;

function openDB() { return new Promise((res, rej) => { if (db) { res(db); return; } const req = indexedDB.open(DB_NAME, DB_VER); req.onupgradeneeded = e => e.target.result.createObjectStore(STORE); req.onsuccess = e => { db = e.target.result; res(db); }; req.onerror = e => rej(e.target.error); }); }

function save() { 
  const payload = { open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year, deletedIds:state.deletedIds, deletedGroups:state.deletedGroups }; 
  try { 
    localStorage.setItem('amp3', JSON.stringify(payload)); 
    localStorage.setItem('amp3_backup_' + today(), JSON.stringify(payload)); 
  } catch(e) {} 
  openDB().then(database => { 
    const tx = database.transaction(STORE, 'readwrite'); 
    tx.objectStore(STORE).put(payload, 'state'); 
    tx.objectStore(STORE).put(payload, 'backup_last_known_good');
  }).catch(() => {});
}

function load() { 
  openDB().then(database => { 
    const tx = database.transaction(STORE, 'readonly'); 
    const req = tx.objectStore(STORE).get('state'); 
    req.onsuccess = e => { 
      const d = e.target.result; 
      if (d) applyState(d); 
      else { 
        try { const ls = JSON.parse(localStorage.getItem('amp3') || 'null'); if (ls) applyState(ls); } catch(e) {} 
      } 
      initApp(); 
    }; 
    req.onerror = () => fallbackLoad(); 
  }).catch(() => fallbackLoad()); 
}
function fallbackLoad() { try { const ls = JSON.parse(localStorage.getItem('amp3') || 'null'); if (ls) applyState(ls); } catch(e) {} initApp(); }

// PRÜFEN OB EIN BILD GÜLTIG ODER BESCHÄDIGT IST
function isValidImage(url) {
  if (!url || typeof url !== 'string') return false;
  const str = url.trim();
  if (str.startsWith('http://') || str.startsWith('https://')) return true;
  if (str.startsWith('data:image/')) {
    return str.length > 500 && str.includes(';base64,');
  }
  return false;
}

// BEREINIGUNGSFUNKTION FÜR BESCHÄDIGTE BILDER & GEISTER-GRUPPEN
window.cleanCorruptedImagesAndGhostGroups = function() {
  let cleanedCount = 0;
  
  // 1. Bilderpool säubern
  if (Array.isArray(state.master.images)) {
    const origLen = state.master.images.length;
    state.master.images = state.master.images.filter(isValidImage);
    cleanedCount += (origLen - state.master.images.length);
  }

  // 2. Gruppen-Logos säubern
  if (state.master.groupLogos) {
    Object.keys(state.master.groupLogos).forEach(k => {
      if (!isValidImage(state.master.groupLogos[k])) {
        delete state.master.groupLogos[k];
        cleanedCount++;
      }
    });
  }

  // 3. Typ- & Artikel-Logos säubern
  if (state.master.typeLogos) {
    Object.keys(state.master.typeLogos).forEach(k => {
      if (!isValidImage(state.master.typeLogos[k])) {
        delete state.master.typeLogos[k];
        cleanedCount++;
      }
    });
  }
  if (state.master.articleLogos) {
    Object.keys(state.master.articleLogos).forEach(k => {
      if (!isValidImage(state.master.articleLogos[k])) {
        delete state.master.articleLogos[k];
        cleanedCount++;
      }
    });
  }

  // 4. Verkaufs-Vorschauen säubern
  (state.sold || []).forEach(s => {
    if (s.previewImage && !isValidImage(s.previewImage)) {
      s.previewImage = '';
      cleanedCount++;
    }
  });

  // 5. Gelöschte Gruppen aus dem Katalog tilgen
  const delGrps = new Set(state.deletedGroups || []);
  delGrps.forEach(grp => {
    if (state.master.catalog && state.master.catalog[grp]) {
      delete state.master.catalog[grp];
    }
    if (state.master.groupLogos && state.master.groupLogos[grp]) {
      delete state.master.groupLogos[grp];
    }
  });

  save();
  window.saveToCloud(); // Direkt in die Cloud schreiben
  window.updateMasterForm();
  window.renderAllQuick();
  window.renderMaster();
  window.renderOpenFilters();
  window.renderOpen();
  toast(`Bereinigung abgeschlossen: ${cleanedCount} defekte Einträge entfernt ✓`);
};

// KOMPRESSION BEIM UPLOAD
function compressImage(file, callback) {
    const reader = new FileReader(); 
    reader.onload = e => { 
      const img = new Image(); 
      img.onload = () => { 
        const canvas = document.createElement('canvas'); 
        let w = img.width, h = img.height; 
        const MAX = 250; 
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; } 
        else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } 
        canvas.width = w; canvas.height = h; 
        const ctx = canvas.getContext('2d'); 
        ctx.drawImage(img, 0, 0, w, h); 
        callback(canvas.toDataURL('image/jpeg', 0.45)); 
      }; 
      img.src = e.target.result; 
    }; 
    reader.readAsDataURL(file);
}

function getEntityImage(grp, pt, art) {
  const m = state.master;
  if (grp && pt && art && m.articleLogos && isValidImage(m.articleLogos[`${grp}||${pt}||${art}`])) {
    return m.articleLogos[`${grp}||${pt}||${art}`];
  }
  if (grp && pt && !art && m.typeLogos && isValidImage(m.typeLogos[`${grp}||${pt}`])) {
    return m.typeLogos[`${grp}||${pt}`];
  }
  if (grp && !pt && !art && m.groupLogos && isValidImage(m.groupLogos[grp])) {
    return m.groupLogos[grp];
  }
  return '';
}

window.switchPage = function(pageName) {
  state.page = pageName;
  window.render();
};

window.toggleTheme = function() {
  const cur = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
};

// SICHERER CLOUD-SYNC (OHNE DIE WIEDERBELEBUNG GELÖSCHTER BILDER/GRUPPEN)
async function autoLoadFromCloud() {
  const gasUrl = localStorage.getItem('gasUrl') || gVal('gasUrl');
  if (!gasUrl) return;
  try {
    const fetchUrl = gasUrl + (gasUrl.includes('?') ? '&' : '?') + 'nocache=' + Date.now();
    const res = await fetch(fetchUrl);
    const data = await res.json();
    if (data && !data.error) {
      const delSet = new Set(state.deletedIds || []);
      const delGrps = new Set(state.deletedGroups || []);

      // 1. Verkäufe mergen
      const localSoldMap = new Map((state.sold || []).map(s => [s.id, s]));
      (data.sold || []).forEach(cloudSold => {
        if (!delSet.has(cloudSold.id)) {
          if (!localSoldMap.has(cloudSold.id)) {
            localSoldMap.set(cloudSold.id, cloudSold);
          }
        }
      });
      state.sold = Array.from(localSoldMap.values());

      // 2. Offene Bestände mergen
      const localOpenMap = new Map((state.open || []).map(o => [o.id, o]));
      (data.open || []).forEach(cloudItem => {
        if (!delSet.has(cloudItem.id) && !delGrps.has(cloudItem.group)) {
          if (!localOpenMap.has(cloudItem.id)) {
            localOpenMap.set(cloudItem.id, cloudItem);
          }
        }
      });
      state.open = Array.from(localOpenMap.values());

      // 3. Stammdaten mergen (Ohne gelöschte Gruppen!)
      if (data.master && typeof data.master === 'object') {
        if (data.master.catalog) {
          Object.keys(data.master.catalog).forEach(grp => {
            if (!delGrps.has(grp) && !state.master.catalog[grp]) {
              state.master.catalog[grp] = data.master.catalog[grp];
            }
          });
        }
        if (data.master.groupLogos) {
          Object.keys(data.master.groupLogos).forEach(grp => {
            if (!delGrps.has(grp) && isValidImage(data.master.groupLogos[grp])) {
              state.master.groupLogos[grp] = data.master.groupLogos[grp];
            }
          });
        }
      }

      // Auto-Bereinigung durchführen
      if (Array.isArray(state.master.images)) {
        state.master.images = state.master.images.filter(isValidImage);
      }

      save();
      window.updateMasterForm();
      window.renderAllQuick();
      window.renderMaster();
      window.renderOpenFilters();
      window.renderOpen();
      const timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      toast(`☁️ Sicher mit Cloud synchronisiert (${timeStr} Uhr) ✓`);
    }
  } catch(e) { console.log('Auto-Sync Offline'); }
}

window.autoSaveToCloud = function() {
  const gasUrl = localStorage.getItem('gasUrl') || gVal('gasUrl');
  if (!gasUrl) return;
  const cloudPayload = JSON.stringify({ open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year, deletedIds:state.deletedIds, deletedGroups:state.deletedGroups });
  fetch(gasUrl, { method: 'POST', body: cloudPayload, keepalive: true }).catch(() => {});
};

window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') window.autoSaveToCloud(); });
window.addEventListener('pagehide', () => window.autoSaveToCloud());

window.exportData = function() {
  const data = { open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year, deletedIds:state.deletedIds, deletedGroups:state.deletedGroups }; 
  const json = JSON.stringify(data, null, 2); 
  const filename = `kleinanzeigen-hero-${today()}.json`;
  const blob = new Blob([json], { type:'application/json' }); 
  const a = document.createElement('a'); 
  a.href = URL.createObjectURL(blob); 
  a.download = filename; 
  document.body.appendChild(a); 
  a.click(); 
  setTimeout(()=>{ URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 1000); 
  toast('Exportiert ✓');
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
      window.updateMasterForm(); 
      window.renderAllQuick(); 
      window.renderMaster(); 
      window.render(); 
      toast('Import erfolgreich ✓'); 
    } catch(err) { alert('Fehler beim Importieren: ' + err.message); } 
  };
  reader.readAsText(file);
};

window.saveToCloud = async function() {
  const gasUrl = gVal('gasUrl').trim(); if(!gasUrl) return toast('Bitte Script URL eingeben.'); localStorage.setItem('gasUrl', gasUrl);
  const cloudPayload = { open:state.open, sold:state.sold, termine:state.termine, master:state.master, year:state.year, deletedIds:state.deletedIds, deletedGroups:state.deletedGroups };
  try { 
    toast('Speichere in Cloud...'); 
    const res = await fetch(gasUrl, { method: 'POST', body: JSON.stringify(cloudPayload) }); 
    const text = await res.text(); 
    try { 
      const result = JSON.parse(text); 
      if(result.status === 'success') toast('Sync erfolgreich ✓'); 
      else toast('Fehler: ' + result.message); 
    } catch(err) { toast('Cloud-Upload abgeschlossen ✓'); } 
  } catch(e) { toast('Netzwerkfehler beim Upload'); }
};

window.loadFromCloud = async function() {
  const gasUrl = gVal('gasUrl').trim(); if(!gasUrl) return toast('Bitte URL eingeben.'); localStorage.setItem('gasUrl', gasUrl);
  autoLoadFromCloud();
};

function initApp() { 
  window.updateMasterForm(); 
  populateUhrzeit(); 
  window.renderAllQuick(); 
  const gasUrl = g('gasUrl'); if(gasUrl) gasUrl.value = localStorage.getItem('gasUrl') || ''; 
  const td = g('terminDatum'); if(td) td.value = today();
  window.render(); 
  autoLoadFromCloud();
}

function applyState(d) {
  try {
    const delSet = new Set(d.deletedIds || state.deletedIds || []);
    state.deletedIds = Array.from(delSet);

    const delGrps = new Set(d.deletedGroups || state.deletedGroups || []);
    state.deletedGroups = Array.from(delGrps);

    state.open = Array.isArray(d.open) ? d.open.filter(i => i && !delSet.has(i.id) && !delGrps.has(i.group)) : [];
    if (d.sold !== undefined && Array.isArray(d.sold)) state.sold = d.sold.filter(s => s && !delSet.has(s.id));
    if (d.termine !== undefined && Array.isArray(d.termine)) state.termine = d.termine.filter(t => t && !delSet.has(t.id));
    
    if (!state.master) state.master = { catalog: {}, badgeRules: [], groupLogos: {}, typeLogos: {}, articleLogos: {}, images: [], setImages: [] };
    
    if (d.master && d.master.catalog && typeof d.master.catalog === 'object' && !Array.isArray(d.master.catalog)) {
      state.master.catalog = JSON.parse(JSON.stringify(d.master.catalog)); 
    }
    if (d.master) { 
      if (Array.isArray(d.master.images)) state.master.images = d.master.images.filter(isValidImage); 
      if (Array.isArray(d.master.setImages)) state.master.setImages = d.master.setImages; 
      if (Array.isArray(d.master.badgeRules)) state.master.badgeRules = d.master.badgeRules;
      if (d.master.groupLogos && typeof d.master.groupLogos === 'object') state.master.groupLogos = d.master.groupLogos;
      if (d.master.typeLogos && typeof d.master.typeLogos === 'object') state.master.typeLogos = d.master.typeLogos;
      if (d.master.articleLogos && typeof d.master.articleLogos === 'object') state.master.articleLogos = d.master.articleLogos;
    }

    // Gelöschte Gruppen definitiv tilgen
    delGrps.forEach(grp => {
      if (state.master.catalog && state.master.catalog[grp]) delete state.master.catalog[grp];
      if (state.master.groupLogos && state.master.groupLogos[grp]) delete state.master.groupLogos[grp];
    });

    let newOpen = [];
    for (let i=0; i < state.open.length; i++) {
      let item = state.open[i]; if (!item) continue;
      if (!item.instances || !Array.isArray(item.instances)) {
          item.instances = []; let qty = item.quantity || item.menge || 1;
          for (let j=0; j < qty; j++) { item.instances.push({ id: uid(), purchasePrice: item.purchasePrice || 0, entryDate: normalizeDate(item.entryDate || item.datum), profitshare: !!item.profitshare, image: '' }); }
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

// BILD-AUSWAHL MODAL
window.openImagePicker = function(currentUrl='') {
  const modal = g('imagePickerModal'); 
  const list = g('imagePickerList'); 
  if(!modal || !list) return;
  const pool = (Array.isArray(state.master.images) ? state.master.images : []).filter(isValidImage);
  
  list.innerHTML = pool.length ? pool.map(u => `
    <div class="img-pick-item" style="border-color:${u===currentUrl?'var(--primary)':'var(--border)'};" onclick="window.selectPoolImage('${safeJsStr(u)}')">
      <img src="${u}" loading="lazy">
    </div>`).join('') : '<div class="empty" style="grid-column:1/-1;">Noch keine Bilder im Bilderpool vorhanden.</div>';

  modal.style.display = 'flex'; 
  modal.classList.add('show');
};

window.closeImagePicker = function() { 
  const modal = g('imagePickerModal'); 
  if(modal){ modal.classList.remove('show'); modal.style.display = 'none'; } 
};

window.selectPoolImage = function(url) {
  if (imagePickCallback) imagePickCallback(url);
  window.closeImagePicker();
};

window.handleSingleModalUpload = function(file) {
  if (!file) return;
  compressImage(file, url => {
    if (!Array.isArray(state.master.images)) state.master.images = [];
    state.master.images.unshift(url);
    save();
    if (imagePickCallback) imagePickCallback(url);
    window.closeImagePicker();
    toast('Bild hochgeladen ✓');
  });
};

window.handleBatchPoolUpload = function(files) {
  if (!files || files.length === 0) return;
  toast(`Lade ${files.length} Bild(er) hoch...`);
  if (!Array.isArray(state.master.images)) state.master.images = [];
  let loaded = 0;
  Array.from(files).forEach(file => {
    compressImage(file, url => {
      state.master.images.unshift(url);
      loaded++;
      if (loaded === files.length) {
        save();
        window.renderMaster();
        toast(`${loaded} Bilder zum Pool hinzugefügt ✓`);
      }
    });
  });
};

window.openSellSetImgPicker = function() { 
  imagePickCallback = (url) => { 
    const siv = g('sellSetImgValue'); if(siv) siv.value = url; 
    const prev = g('sellSetImgPreview'); const lbl = g('sellSetImgLabel'); 
    if(prev) prev.innerHTML = url ? `<img src="${url}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;">` : '🖼️'; 
    if(lbl) lbl.textContent = url ? 'Set-Bild gewählt ✓' : 'Set-Bild wählen…'; 
  }; 
  window.openImagePicker(gVal('sellSetImgValue')); 
};

// BILDER FÜR GRUPPE, PRODUKTTYP & ARTIKELNAME IN STAMMDATEN
window.setGroupLogo = function(grp) {
  imagePickCallback = (url) => {
    if (!state.master.groupLogos) state.master.groupLogos = {};
    state.master.groupLogos[grp] = url;
    save(); window.renderMaster(); window.renderAllQuick(); window.renderOpenFilters(); window.renderOpen();
    toast(`Bild für Gruppe "${grp}" gespeichert ✓`);
  };
  window.openImagePicker('');
};

window.setTypeLogo = function(grp, typ) {
  imagePickCallback = (url) => {
    if (!state.master.typeLogos) state.master.typeLogos = {};
    state.master.typeLogos[`${grp}||${typ}`] = url;
    save(); window.renderMaster(); window.renderAllQuick(); window.renderOpenFilters(); window.renderOpen();
    toast(`Bild für Produkttyp "${typ}" gespeichert ✓`);
  };
  window.openImagePicker('');
};

window.setArticleLogo = function(grp, typ, art) {
  imagePickCallback = (url) => {
    if (!state.master.articleLogos) state.master.articleLogos = {};
    state.master.articleLogos[`${grp}||${typ}||${art}`] = url;
    save(); window.renderMaster(); window.renderAllQuick(); window.renderOpenFilters(); window.renderOpen();
    toast(`Bild für Artikel "${art}" gespeichert ✓`);
  };
  window.openImagePicker('');
};

// SET BADGES
window.currentEditBadgeIndex = null;
window.updateBadgeProdType = function() {
    const grp = gVal('newBadgeGroup'); const ptSel = g('newBadgeProdType'); if(!ptSel) return;
    if(!grp || !state.master.catalog || !state.master.catalog[grp]) { ptSel.innerHTML = '<option value="">– Produkttyp –</option>'; return; }
    const typs = Object.keys(state.master.catalog[grp]).sort(sortKeys); const currentVal = ptSel.value;
    ptSel.innerHTML = '<option value="">– Produkttyp –</option>' + typs.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    if (typs.includes(currentVal)) ptSel.value = currentVal;
};

window.openBadgeImgPicker = function() { 
  imagePickCallback = (url) => { 
    const nbi = g('newBadgeImg'); if(nbi) nbi.value = url; 
    const bip = g('badgeImgPreview'); if(bip) bip.innerHTML = url ? `<img src="${url}" style="width:24px;height:24px;object-fit:cover;border-radius:4px;vertical-align:middle;">` : '📷'; 
  }; 
  window.openImagePicker(gVal('newBadgeImg')); 
};

window.addBadgeRule = function() {
    const name = gVal('newBadgeName').trim(); const grp = gVal('newBadgeGroup'); const pt = gVal('newBadgeProdType'); const reqsStr = gVal('newBadgeReqs').trim(); const image = gVal('newBadgeImg');
    if(!name || !grp || !pt || !reqsStr) return alert('Bitte alle Pflichtfelder ausfüllen.');
    const reqs = reqsStr.split(',').map(s => { const parts = s.toLowerCase().split('x'); if(parts.length !== 2) return null; const size = parts[0].trim(); const qty = parseInt(parts[1].trim()); if(!size || isNaN(qty)) return null; return {size, qty}; }).filter(Boolean);
    if(reqs.length === 0) return alert('Ungültiges Bedarfs-Format. Bitte z.B. 64x2 eingeben.');
    if(!Array.isArray(state.master.badgeRules)) state.master.badgeRules = [];
    if (window.currentEditBadgeIndex !== null && window.currentEditBadgeIndex >= 0) { state.master.badgeRules[window.currentEditBadgeIndex] = { name, group: grp, productType: pt, reqs, image }; window.currentEditBadgeIndex = null; toast('Regel aktualisiert ✓'); } else { state.master.badgeRules.push({ name, group: grp, productType: pt, reqs, image }); toast('Regel hinzugefügt ✓'); }
    const nbi = g('newBadgeImg'); if(nbi) nbi.value = ''; const bip = g('badgeImgPreview'); if(bip) bip.innerHTML = '📷'; save(); window.renderMaster();
};

window.editBadgeRule = function(idx) {
    if (!Array.isArray(state.master.badgeRules) || !state.master.badgeRules[idx]) return; const rule = state.master.badgeRules[idx];
    const nbn = g('newBadgeName'); if(nbn) nbn.value = rule.name || ''; const nbg = g('newBadgeGroup'); if(nbg) nbg.value = rule.group || ''; window.updateBadgeProdType(); const nbpt = g('newBadgeProdType'); if(nbpt) nbpt.value = rule.productType || '';
    const reqsArr = Array.isArray(rule.reqs) ? rule.reqs : []; const nbreqs = g('newBadgeReqs'); if(nbreqs) nbreqs.value = reqsArr.map(r => `${r.size}x${r.qty}`).join(', ');
    const nbi = g('newBadgeImg'); if(nbi) nbi.value = rule.image || ''; const bip = g('badgeImgPreview'); if(bip) bip.innerHTML = rule.image ? `<img src="${rule.image}" style="width:24px;height:24px;object-fit:cover;border-radius:4px;vertical-align:middle;">` : '📷';
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

window.deleteBadgeRule = function(idx) { if(!confirm('Regel löschen?')) return; if (Array.isArray(state.master.badgeRules)) { state.master.badgeRules.splice(idx, 1); } if (window.currentEditBadgeIndex === idx) window.cancelEditBadgeRule(); save(); window.renderMaster(); };

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
      hasAny = true; 
      html += `<div style="padding:10px 0; border-bottom:1px solid var(--divider); display:flex; gap:12px; align-items:center;">
        ${data.image ? `<img src="${data.image}" class="badge-modal-img">` : `<div class="badge-modal-img" style="display:grid;place-items:center;background:var(--surface2);color:var(--muted);font-size:1.5rem;">📷</div>`}
        <div style="line-height:1.4; flex:1;">
          <strong style="display:block; font-size:var(--text-base); color:var(--primary);">${esc(badgeName)}</strong>
          <span style="color:var(--text);font-size:var(--text-sm);">${data.items.map(esc).join(' <span style="color:var(--muted); margin:0 4px;">|</span> ')}</span>
        </div>
      </div>`;
    }
  });
  if (!hasAny) html = '<div class="empty">Aktuell können keine Sets aus den definierten Regeln gebildet werden.</div>';
  content.innerHTML = html; const sbm = g('setBadgesModal'); if(sbm) { sbm.style.display = 'flex'; sbm.classList.add('show'); }
};

window.closeSetBadgesModal = function() { const m = g('setBadgesModal'); if(m) { m.classList.remove('show'); m.style.display = 'none'; } };

window.updateMasterForm = function() {
  try {
      const mType = g('masterType'); if(!mType) return; const type = mType.value;
      const needGrp = ['producttypes','articles','sizes','colors'].includes(type); 
      const needTyp = ['articles','sizes','colors'].includes(type);
      const needArt = ['sizes','colors'].includes(type);

      const groups = Object.keys(state.master.catalog || {}).sort(sortKeys); const mGrp = g('masterGroup');
      if(mGrp) { const curGrp = mGrp.value; mGrp.innerHTML = '<option value="">– Gruppe –</option>' + groups.map(grp=>`<option value="${esc(grp)}"${grp===curGrp?' selected':''}>${esc(grp)}</option>`).join(''); }
      
      const selGrp = mGrp ? mGrp.value : ''; const typs = selGrp && state.master.catalog[selGrp] ? Object.keys(state.master.catalog[selGrp]).sort(sortKeys) : []; const mTyp = g('masterProdType');
      if(mTyp) { const curTyp = mTyp.value; mTyp.innerHTML = '<option value="">– Typ –</option>' + typs.map(t=>`<option value="${esc(t)}"${t===curTyp?' selected':''}>${esc(t)}</option>`).join(''); }

      const selTyp = mTyp ? mTyp.value : ''; 
      const arts = (selGrp && selTyp && state.master.catalog[selGrp] && state.master.catalog[selGrp][selTyp] && Array.isArray(state.master.catalog[selGrp][selTyp].articles)) ? state.master.catalog[selGrp][selTyp].articles : [];
      const mArt = g('masterArticle');
      if(mArt) { const curArt = mArt.value; mArt.innerHTML = '<option value="">– Artikel –</option>' + arts.map(a=>`<option value="${esc(a)}"${a===curArt?' selected':''}>${esc(a)}</option>`).join(''); }

      document.querySelectorAll('.mf-grp').forEach(el => el.style.display = needGrp ? 'grid' : 'none'); 
      document.querySelectorAll('.mf-typ').forEach(el => el.style.display = needTyp ? 'grid' : 'none'); 
      document.querySelectorAll('.mf-art').forEach(el => el.style.display = needArt ? 'grid' : 'none');
      document.querySelectorAll('.mf-val').forEach(el => el.style.display = type !== 'images' ? 'grid' : 'none');
  } catch(e) {}
};

const mfBtn = g('masterForm');
if(mfBtn) {
    mfBtn.addEventListener('submit', e => {
      e.preventDefault();
      try {
        const type = gVal('masterType'); const val = gVal('masterValue').trim(); const grp = gVal('masterGroup'); const typ = gVal('masterProdType'); const art = gVal('masterArticle');
        if (!state.master.catalog) state.master.catalog = {};
        if (type === 'groups') { 
          if (!val) return alert('Name eingeben.'); 
          if (state.master.catalog[val] !== undefined) return alert('Existiert bereits.'); 
          state.master.catalog[val] = {}; 
          state.deletedGroups = (state.deletedGroups || []).filter(g => g !== val); // Aus Sperrliste entfernen
        }
        else if (type === 'producttypes') { if (!grp || !val) return alert('Pflichtfelder fehlen.'); if (!state.master.catalog[grp]) state.master.catalog[grp] = {}; if (state.master.catalog[grp][val] !== undefined) return alert('Existiert bereits.'); state.master.catalog[grp][val] = { articles:[], sizes:[], colors:[] }; }
        else if (type === 'articles') { if (!grp || !typ || !val) return alert('Pflichtfelder fehlen.'); if (!state.master.catalog[grp] || !state.master.catalog[grp][typ]) return alert('Gruppe/Typ fehlt.'); let arr = state.master.catalog[grp][typ].articles; if (!Array.isArray(arr)) { arr = []; state.master.catalog[grp][typ].articles = arr; } if (arr.includes(val)) return alert('Existiert bereits.'); arr.push(val); arr.sort(sortKeys); }
        else if (type === 'sizes' || type === 'colors') { 
          if (!grp || !typ || !val) return alert('Pflichtfelder fehlen.'); 
          let target = state.master.catalog[grp][typ];
          if (art && target) {
            if (!target.articleData) target.articleData = {};
            if (!target.articleData[art]) target.articleData[art] = { sizes: [], colors: [] };
            let arr = target.articleData[art][type];
            if (!Array.isArray(arr)) { arr = []; target.articleData[art][type] = arr; }
            if (arr.includes(val)) return alert('Existiert bereits.');
            arr.push(val); arr.sort(sortKeys);
          } else if (target) {
            let arr = target[type];
            if (!Array.isArray(arr)) { arr = []; target[type] = arr; }
            if (arr.includes(val)) return alert('Existiert bereits.');
            arr.push(val); arr.sort(sortKeys);
          }
        }
        if(g('masterValue')) g('masterValue').value = ''; window.updateMasterForm(); window.renderAllQuick(); save(); window.renderMaster(); toast('Gespeichert ✓');
      } catch(err) { alert('Fehler: ' + err.message); }
    });
}

window.renderMaster = function() {
  try {
      const cat = state.master.catalog || {}; const groups = Object.keys(cat).sort(sortKeys); let html = '';
      if (groups.length) {
        groups.forEach(grp => {
          const typs = Object.keys(cat[grp] || {}).sort(sortKeys);
          const grpLogo = (state.master.groupLogos && state.master.groupLogos[grp]) || '';
          html += `<div class="card" style="margin-bottom:var(--sp4);"><div class="card-head"><div style="display:flex;align-items:center;gap:8px;">${grpLogo ? `<img src="${grpLogo}" class="grp-header-logo">` : ''}<h3 class="card-title">📁 ${esc(grp)}</h3></div><div style="display:flex;gap:4px;"><button type="button" class="btn btn-ghost" style="min-height:28px;padding:.2rem .5rem;font-size:var(--text-xs);width:auto;" onclick="window.setGroupLogo('${safeJsStr(grp)}')">🖼️ Bild</button><button type="button" class="btn btn-danger" style="min-height:28px;padding:.2rem .6rem;font-size:var(--text-xs);width:auto;" data-rm="group" data-grp="${esc(grp)}">🗑 Gruppe</button></div></div><div class="card-body" style="padding:0;">`;
          if (!typs.length) { html += `<div class="empty" style="margin:var(--sp4);">Noch keine Produkttypen.</div>`; }
          typs.forEach(typ => {
            const d = cat[grp][typ] || {};
            const typLogo = (state.master.typeLogos && state.master.typeLogos[`${grp}||${typ}`]) || '';
            html += `<div style="border-bottom:1px solid var(--divider);padding:var(--sp3) var(--sp4);"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp2);"><div style="display:flex;align-items:center;gap:6px;">${typLogo ? `<img src="${typLogo}" class="grp-logo-thumb">` : ''}<b style="font-size:var(--text-base); color:var(--text);">🏷 ${esc(typ)}</b></div><div style="display:flex;gap:4px;"><button type="button" class="btn btn-ghost" style="min-height:26px;padding:.2rem .5rem;font-size:var(--text-xs);width:auto;" onclick="window.setTypeLogo('${safeJsStr(grp)}', '${safeJsStr(typ)}')">🖼️ Bild</button><button type="button" class="btn btn-danger" style="min-height:26px;padding:.2rem .5rem;font-size:var(--text-xs);width:auto;" data-rm="prodtype" data-grp="${esc(grp)}" data-typ="${esc(typ)}">🗑 Typ</button></div></div>`;
            
            const artArr = Array.isArray(d.articles) ? d.articles : [];
            html += `<div style="margin-bottom:var(--sp2);"><div class="muted" style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp1);">Artikelname</div><div class="chips">${artArr.map((v,i)=>{
              const artLogo = (state.master.articleLogos && state.master.articleLogos[`${grp}||${typ}||${v}`]) || '';
              return `<span class="chip" style="display:inline-flex;align-items:center;gap:4px;">${artLogo?`<img src="${artLogo}" class="grp-logo-thumb">`:''}${esc(v)}<button type="button" style="background:none;border:none;cursor:pointer;font-size:12px;padding:0;line-height:1;" onclick="window.setArticleLogo('${safeJsStr(grp)}','${safeJsStr(typ)}','${safeJsStr(v)}')">🖼️</button><button type="button" style="background:none;border:none;cursor:pointer;color:var(--err);font-size:12px;padding:0;line-height:1;" data-rm="articles" data-grp="${esc(grp)}" data-typ="${esc(typ)}" data-idx="${i}">×</button></span>`;
            }).join('') || '<span class="muted" style="font-size:var(--text-xs);">Noch keine Einträge</span>'}</div></div>`;

            ['sizes','colors'].forEach(field=>{ 
              const labels={sizes:'Größen',colors:'Farben'}; 
              const fieldArr = Array.isArray(d[field]) ? d[field] : []; 
              html += `<div style="margin-bottom:var(--sp2);"><div class="muted" style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp1);">${labels[field]}</div><div class="chips">${fieldArr.map((v,i)=>`<span class="chip" style="display:inline-flex;align-items:center;gap:4px;">${esc(v)}<button type="button" style="background:none;border:none;cursor:pointer;color:var(--err);font-size:12px;padding:0;line-height:1;" data-rm="${field}" data-grp="${esc(grp)}" data-typ="${esc(typ)}" data-idx="${i}">×</button></span>`).join('') || '<span class="muted" style="font-size:var(--text-xs);">Noch keine Einträge</span>'}</div></div>`; 
            });

            html += `</div>`;
          });
          html += `</div></div>`;
        });
      } else { html += `<div class="empty">Noch keine Gruppen angelegt.</div>`; }
      
      const imgs = (Array.isArray(state.master.images) ? state.master.images : []).filter(isValidImage);
      html += `<div class="card" style="margin-bottom:var(--sp4);"><div class="card-head"><div style="display:flex;align-items:center;gap:8px;"><h3 class="card-title">🖼 Bilderpool</h3><span class="chip">${imgs.length}</span></div><label class="btn btn-primary" style="min-height:28px;padding:.2rem .6rem;font-size:var(--text-xs);width:auto;cursor:pointer;">📂 Mehrere Bilder hochladen<input type="file" accept="image/*" multiple style="display:none;" onchange="window.handleBatchPoolUpload(this.files)"></label></div><div class="card-body"><div class="img-grid-select">${imgs.length ? imgs.map((url,i)=>`<div class="img-pick-item" style="position:relative;"><img src="${url}" loading="lazy"><button type="button" class="btn-icon-subtle danger" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.7);padding:2px 6px;" onclick="window.deleteMasterImage(${i})">🗑</button></div>`).join('') : '<div class="empty" style="grid-column:1/-1;">Noch keine Bilder im Bilderpool. Lade oben Bilder hoch.</div>'}</div></div></div>`;
      
      const safeBadgeRules = Array.isArray(state.master.badgeRules) ? state.master.badgeRules : [];
      html += `<div class="card" style="margin-bottom:var(--sp4);"><div class="card-head"><h3 class="card-title">🏆 Set Badges (Regeln)</h3></div><div class="card-body"><div id="badgeRulesList" style="margin-bottom:var(--sp3);">${safeBadgeRules.map((r, i) => { const reqsArr = Array.isArray(r.reqs) ? r.reqs : []; return `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--divider); padding:var(--sp2) 0;"><div style="display:flex; gap:12px; align-items:center;">${r.image ? `<img src="${r.image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;">` : `<div style="width:40px;height:40px;border-radius:6px;border-style:dashed;border-color:var(--border);display:grid;place-items:center;color:var(--muted);flex-shrink:0;">📷</div>`}<div><b style="font-size:var(--text-base);">${esc(r.name)}</b> <span style="color:var(--muted); font-size:var(--text-xs);">(${esc(r.group)} · ${esc(r.productType)})</span><br><span style="font-size:var(--text-sm); font-weight:600; color:var(--primary);">${reqsArr.map(req => `${req.qty||1}x Gr. ${esc(req.size)}`).join(', ')}</span></div></div><div style="display:flex; gap:4px;"><button type="button" class="btn-icon-subtle" onclick="window.editBadgeRule(${i})" title="Bearbeiten">✏️</button><button type="button" class="btn-icon-subtle danger" onclick="window.deleteBadgeRule(${i})" title="Löschen">🗑️</button></div></div>`; }).join('') || '<div class="empty">Keine Regeln definiert.</div>'}</div><div style="background:var(--surface2); padding:var(--sp3); border-radius:var(--rad-md); border:1px solid var(--border);"><h4 id="badgeFormTitle" style="font-size:var(--text-sm); margin:0 0 var(--sp2);">Neue Regel erstellen</h4><div class="grid2" style="gap:8px;"><input type="text" class="input" id="newBadgeName" placeholder="Name (z.B. TV 180)"><select class="select" id="newBadgeGroup" onchange="window.updateBadgeProdType()"><option value="">– Gruppe wählen –</option>${groups.map(grp => `<option value="${esc(grp)}">${esc(grp)}</option>`).join('')}</select><select class="select" id="newBadgeProdType"><option value="">– Produkttyp –</option></select><input type="text" class="input" id="newBadgeReqs" placeholder="Bedarf (z.B. 64x2, 38x1)"></div><div style="display:flex; gap:8px; margin-top:8px; align-items:center;"><button type="button" class="btn btn-ghost" style="padding:4px 10px; min-height:32px; font-size:var(--text-xs);" onclick="window.openBadgeImgPicker()"><span id="badgeImgPreview">📷</span> Beispielbild</button><input type="hidden" id="newBadgeImg"></div><div style="display:flex; gap:8px; margin-top:var(--sp3);"><button type="button" id="saveBadgeBtn" class="btn btn-primary" style="flex:1;" onclick="window.addBadgeRule()">✚ Regel speichern</button><button type="button" id="cancelBadgeBtn" class="btn btn-ghost" style="display:none;" onclick="window.cancelEditBadgeRule()">Abbrechen</button></div></div></div></div>`;

      const mc = g('masterContent'); if (mc) mc.innerHTML = html;
  } catch (err) {}
};

window.deleteMasterImage = function(idx) {
  if (!confirm('Bild löschen?')) return;
  if (Array.isArray(state.master.images)) {
    state.master.images.splice(idx, 1);
    save(); 
    window.autoSaveToCloud();
    window.renderMaster(); 
    toast('Bild gelöscht ✓');
  }
};

// FORMULAR & STRIKTE CHIP-ABHÄNGIGKEITEN
window.onGroupChange = function() { 
  if(state.page !== 'new') return; 
  ['productType', 'article', 'size', 'color'].forEach(id => { const el = g(id); if (el) el.value = ''; }); 
  window.renderAllQuick(); 
};

window.onProductTypeChange = function() { 
  if(state.page !== 'new') return; 
  ['article', 'size', 'color'].forEach(id => { const el = g(id); if (el) el.value = ''; }); 
  window.renderAllQuick(); 
};

window.onArticleChange = function() { 
  if(state.page !== 'new') return; 
  ['size', 'color'].forEach(id => { const el = g(id); if (el) el.value = ''; }); 
  window.renderAllQuick(); 
};

window.handleQuickSelect = function(selId, val) {
    const sel = g(selId); if (!sel) return;
    if (sel.value === val) { sel.value = ''; } else { let exists = Array.from(sel.options).some(o => o.value === val); if (!exists) sel.add(new Option(val, val)); sel.value = val; }
    if (selId === 'group') window.onGroupChange(); 
    else if (selId === 'productType') window.onProductTypeChange(); 
    else if (selId === 'article') window.onArticleChange();
    else window.renderAllQuick();
};

window.removeQuick = function(type, val) {
    if(!confirm(`"${val}" entfernen?`)) return;
    const grpVal = gVal('group'); const ptVal = gVal('productType'); const cat = state.master.catalog;
    if (type === 'group') { 
      if(cat[val]) delete cat[val]; 
      if (!state.deletedGroups) state.deletedGroups = [];
      if (!state.deletedGroups.includes(val)) state.deletedGroups.push(val);
      if (grpVal === val) { g('group').value = ''; window.onGroupChange(); } 
    } 
    else if (type === 'productType') { if (cat[grpVal] && cat[grpVal][val]) { delete cat[grpVal][val]; } if (ptVal === val) { g('productType').value = ''; window.onProductTypeChange(); } } 
    else { const arrMap = { article: 'articles', size: 'sizes', color: 'colors' }; const arrName = arrMap[type]; if (cat[grpVal] && cat[grpVal][ptVal] && Array.isArray(cat[grpVal][ptVal][arrName])) { cat[grpVal][ptVal][arrName] = cat[grpVal][ptVal][arrName].filter(x => String(x) !== String(val)); } if (g(type) && g(type).value === val) g(type).value = ''; }
    save(); 
    window.autoSaveToCloud();
    window.updateMasterForm(); 
    window.renderAllQuick(); 
    window.renderMaster();
};

window.addQuick = function(type) {
    const grpVal = gVal('group'); const ptVal = gVal('productType'); const artVal = gVal('article');
    if (type !== 'group' && !grpVal) return alert('Zuerst Gruppe wählen.'); 
    if (['article', 'size', 'color'].includes(type) && !ptVal) return alert('Zuerst Produkttyp wählen.');
    const v = prompt('Neuer Eintrag:'); if (!v || v.trim() === '') return; const val = v.trim(); const cat = state.master.catalog;
    
    if (type === 'group') { 
      if (!cat[val]) cat[val] = {}; 
      state.deletedGroups = (state.deletedGroups || []).filter(g => g !== val);
      window.handleQuickSelect('group', val); 
    } 
    else if (type === 'productType') { if (!cat[grpVal]) cat[grpVal] = {}; if (!cat[grpVal][val]) cat[grpVal][val] = { articles: [], sizes: [], colors: [] }; window.handleQuickSelect('productType', val); } 
    else if (type === 'article') {
      let arr = cat[grpVal][ptVal].articles;
      if (!Array.isArray(arr)) { arr = []; cat[grpVal][ptVal].articles = arr; }
      if (!arr.includes(val)) { arr.push(val); arr.sort(sortKeys); }
      window.handleQuickSelect('article', val);
    }
    else {
      let target = cat[grpVal][ptVal];
      if (artVal) {
        if (!target.articleData) target.articleData = {};
        if (!target.articleData[artVal]) target.articleData[artVal] = { sizes: [], colors: [] };
        let arr = target.articleData[artVal][type === 'size' ? 'sizes' : 'colors'];
        if (!Array.isArray(arr)) { arr = []; target.articleData[artVal][type === 'size' ? 'sizes' : 'colors'] = arr; }
        if (!arr.includes(val)) { arr.push(val); arr.sort(sortKeys); }
      } else {
        let arr = target[type === 'size' ? 'sizes' : 'colors'];
        if (!Array.isArray(arr)) { arr = []; target[type === 'size' ? 'sizes' : 'colors'] = arr; }
        if (!arr.includes(val)) { arr.push(val); arr.sort(sortKeys); }
      }
      window.handleQuickSelect(type, val);
    }
    save(); 
    window.autoSaveToCloud();
    window.updateMasterForm(); 
    window.renderMaster();
};

function renderQChips(type, items, currentVal) {
    const c = g('qb-' + type); if (!c) return;
    const safeItems = Array.isArray(items) ? items : [];
    const isBig = (type === 'group' || type === 'productType');
    const selGrp = gVal('group');

    let lvlClass = 'lvl-grp';
    if (type === 'productType') lvlClass = 'lvl-typ';
    if (type === 'article') lvlClass = 'lvl-art';
    if (type === 'size' || type === 'color') lvlClass = 'lvl-var';

    let h = safeItems.map(val => {
        if(val == null) return ''; const strVal = String(val); const isActive = (strVal === String(currentVal||''));
        const safeParam = safeJsStr(strVal);
        
        let logo = '';
        if (type === 'group' && state.master.groupLogos && isValidImage(state.master.groupLogos[strVal])) {
          logo = `<img src="${state.master.groupLogos[strVal]}" class="grp-logo-xl">`;
        } else if (type === 'productType' && state.master.typeLogos && isValidImage(state.master.typeLogos[`${selGrp}||${strVal}`])) {
          logo = `<img src="${state.master.typeLogos[`${selGrp}||${strVal}`]}" class="grp-logo-xl">`;
        }
        
        const chipClass = isBig ? `qb-chip qb-chip-xl ${lvlClass}` : `qb-chip ${lvlClass}`;

        return `<div class="${chipClass} ${isActive ? 'active' : ''}" onclick="window.handleQuickSelect('${type}', '${safeParam}')">${logo}<span>${esc(strVal)}</span><span class="qb-rm" onclick="event.stopPropagation(); window.removeQuick('${type}', '${safeParam}')">×</span></div>`;
    }).join('');
    h += `<button type="button" class="qb-chip ${isBig?'qb-chip-xl':''} ${lvlClass} qb-add" onclick="window.addQuick('${type}')">✚ Neu</button>`; c.innerHTML = h;
}

// STRIKTE ARTIKEL-GEBUNDENE FILTERUNG BEI NEUERFASSUNG
window.renderAllQuick = function() {
  try {
    const grpVal = gVal('group'); const ptVal = gVal('productType'); const artVal = gVal('article');
    const fpt = g('field-productType'); if(fpt) fpt.style.display = grpVal ? 'grid' : 'none'; 
    const fa = g('field-article'); if(fa) fa.style.display = (grpVal && ptVal) ? 'grid' : 'none'; 
    
    const cat = state.master.catalog || {}; 
    renderQChips('group', Object.keys(cat).sort(sortKeys), grpVal);
    let typs = (grpVal && cat[grpVal]) ? Object.keys(cat[grpVal]).sort(sortKeys) : [];
    renderQChips('productType', typs, ptVal);

    let arts = [];
    if (grpVal && ptVal && cat[grpVal] && cat[grpVal][ptVal]) { 
      arts = Array.isArray(cat[grpVal][ptVal].articles) ? cat[grpVal][ptVal].articles : []; 
    }

    renderQChips('article', arts, artVal);

    const needsArticle = arts.length > 0;
    const showSizeColor = grpVal && ptVal && (!needsArticle || artVal);
    
    const fsc = g('field-size-color'); 
    if(fsc) fsc.style.display = showSizeColor ? 'grid' : 'none';

    let sizes = [], colors = [];
    if (showSizeColor && cat[grpVal] && cat[grpVal][ptVal]) {
      const target = cat[grpVal][ptVal];
      if (needsArticle) {
        if (artVal && target.articleData && target.articleData[artVal]) {
          sizes = target.articleData[artVal].sizes || [];
          colors = target.articleData[artVal].colors || [];
        } else {
          sizes = [];
          colors = [];
        }
      } else {
        sizes = target.sizes || [];
        colors = target.colors || [];
      }
    }
    
    renderQChips('size', sizes, gVal('size')); 
    renderQChips('color', colors, gVal('color'));
  } catch(e) { }
};

// PROFITSHARE TOGGLE BUTTON BEI NEUERFASSUNG
window.toggleProfitshareNew = function() {
  const hiddenInput = g('profitshare');
  const btn = g('profitshareBtn');
  if (!hiddenInput || !btn) return;
  const isNowActive = hiddenInput.value !== 'true';
  hiddenInput.value = isNowActive ? 'true' : 'false';
  btn.classList.toggle('active', isNowActive);
  btn.innerHTML = isNowActive ? '🤝 50/50 Aktiv' : '🤝 Profitshare: Aus';
};

const ifrm = g('itemForm');
if(ifrm) {
    ifrm.addEventListener('submit', e => {
      e.preventDefault(); const pP = g('purchasePrice'); const totalPrice = pP ? +pP.value : 0; if (!gVal('group') || !gVal('productType')) return alert('Gruppe & Typ wählen.'); const qEl = g('quantity'); const qty = qEl ? +qEl.value : 1; let pricePerUnit = qty > 0 ? totalPrice / qty : 0;
      const isPs = gVal('profitshare') === 'true'; const dEl = g('defect');
      for(let q=0;q<qty;q++) { const item = { group:gVal('group'), productType:gVal('productType'), article:gVal('article'), size:gVal('size'), color:gVal('color'), purchasePrice:pricePerUnit, profitshare:isPs, image:'', comment:dEl?dEl.value:'', defect:dEl?dEl.value:'', entryDate:today() }; addOrStack(item); }
      save(); 
      window.autoSaveToCloud();
      toast(qty>1?qty+' Artikel hinzugefügt ✓':'Artikel hinzugefügt ✓'); state.page='open'; window.render();
    });
}

function addOrStack(item) { const key = stackKey(item); const ex = state.open.find(i=>stackKey(i)===key); const inst = { id:uid(), image:'', comment:item.comment, defect:item.defect, entryDate:item.entryDate, profitshare:item.profitshare, purchasePrice:item.purchasePrice }; if (ex) { ex.instances.push(inst); } else { state.open.unshift({ id:uid(), group:item.group, productType:item.productType, article:item.article, size:item.size, color:item.color, purchasePrice:item.purchasePrice, profitshare:item.profitshare, instances:[inst] }); } }

window.editItem = function(itemId) { const item = state.open.find(i=>i.id===itemId); if (!item) return; const newArticle = prompt('Artikelname:', item.article||''); if(newArticle === null) return; item.article = newArticle; save(); window.renderOpen(); };

window.deleteItem = function(itemId) { 
  if (!confirm('Artikel löschen?')) return; 
  if (!state.deletedIds) state.deletedIds = [];
  state.deletedIds.push(itemId);
  state.open = state.open.filter(i=>i.id!==itemId); 
  save(); 
  window.autoSaveToCloud();
  window.renderOpen(); 
};

window.editEK = function(itemId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; const val = prompt('EK Preis (€):', item.purchasePrice||0); if(val === null) return; const price = parseFloat(val.replace(',','.')) || 0; item.instances.forEach(inst => inst.purchasePrice = price); save(); window.renderOpen(); };
window.toggleItemProfitshare = function(itemId) { const item = state.open.find(i=>i.id===itemId); if(!item) return; const newVal = !item.instances.some(x=>x.profitshare); item.instances.forEach(x=>x.profitshare = newVal); save(); window.renderOpen(); };
window.changeQty = function(itemId, delta) { const item = state.open.find(i=>i.id===itemId); if(!item) return; if(delta > 0) { item.instances.push({ id: uid(), purchasePrice: item.instances[0]?.purchasePrice||0, profitshare: false, entryDate: today() }); } else if(item.instances.length > 0) { item.instances.pop(); } save(); window.renderOpen(); };

window.toggleAllGroups = function() { globalExpandState = !globalExpandState; state.openCollapse = {}; window.renderOpen(); };
window.toggleZeroFilter = function() { state.hideZero = !state.hideZero; updateZeroToggleUI(); window.renderOpen(); };
function updateZeroToggleUI() { const track = g('zeroFilterBtn'); const knob = g('zeroFilterKnob'); if(track) track.style.background = state.hideZero ? 'var(--primary)' : '#ccc'; if(knob) knob.style.left = state.hideZero ? '22px' : '2px'; }

window.clearOpenSearch = function() {
  const el = g('openSearchText');
  if (el) { el.value = ''; window.updateOpenFilters(); }
};

window.updateOpenFilters = function() {
  state.openFilters.text = gVal('openSearchText').trim();
  window.renderOpenFilters();
  window.renderOpen();
};

window.setInlineFilter = function(type, val) {
  if (state.openFilters[type] === val) {
    state.openFilters[type] = '';
  } else {
    state.openFilters[type] = val;
  }
  window.renderOpenFilters();
  window.renderOpen();
};

window.toggleGrp = function(el) {
  const key = el.dataset.key; const body = document.querySelector(`div[data-body="${key}"]`); if (!body) return;
  const isCurrentlyOpen = state.openCollapse[key] !== undefined ? state.openCollapse[key] : globalExpandState;
  const willBeOpen = !isCurrentlyOpen; state.openCollapse[key] = willBeOpen; body.style.display = willBeOpen ? 'block' : 'none';
  const titleEl = el.querySelector('.group-title'); if(titleEl) { const currentText = titleEl.innerHTML; titleEl.innerHTML = (willBeOpen ? "▼ " : "▶ ") + currentText.replace(/^[▼▶]\s*/, ''); }
};

// ==========================================
// BESTAND FILTER CHIPS
// ==========================================
window.renderOpenFilters = function() {
  const f = state.openFilters;
  const cat = state.master.catalog || {};
  
  // 1. Gruppen
  const grpContainer = g('qb-open-group');
  if (grpContainer) {
    grpContainer.innerHTML = Object.keys(cat).sort(sortKeys).map(grp => {
      const isActive = f.group === grp;
      const logo = (state.master.groupLogos && isValidImage(state.master.groupLogos[grp])) ? `<img src="${state.master.groupLogos[grp]}" class="grp-logo-thumb">` : '';
      return `<div class="qb-chip lvl-grp ${isActive?'active':''}" onclick="window.handleOpenFilterChip('group', '${safeJsStr(grp)}')">${logo}<span>${esc(grp)}</span></div>`;
    }).join('');
  }

  // 2. Produkttypen
  const fpt = g('open-field-productType'); 
  if(fpt) fpt.style.display = f.group ? 'grid' : 'none';
  const typContainer = g('qb-open-productType');
  if (typContainer && f.group && cat[f.group]) {
    typContainer.innerHTML = Object.keys(cat[f.group]).sort(sortKeys).map(t => {
      const typLogo = (state.master.typeLogos && isValidImage(state.master.typeLogos[`${f.group}||${t}`])) ? `<img src="${state.master.typeLogos[`${f.group}||${t}`]}" class="grp-logo-thumb">` : '';
      return `<div class="qb-chip lvl-typ ${f.type===t?'active':''}" onclick="window.handleOpenFilterChip('type', '${safeJsStr(t)}')">${typLogo}<span>${esc(t)}</span></div>`;
    }).join('');
  }

  // 3. Artikelnamen
  let arts = [];
  if (f.group && f.type && cat[f.group] && cat[f.group][f.type]) {
    arts = Array.isArray(cat[f.group][f.type].articles) ? cat[f.group][f.type].articles : [];
  }
  const fa = g('open-field-article'); 
  if(fa) fa.style.display = (f.group && f.type && arts.length > 0) ? 'grid' : 'none';
  const artContainer = g('qb-open-article');
  if (artContainer && f.group && f.type) {
    artContainer.innerHTML = arts.map(a => {
      const artLogo = (state.master.articleLogos && isValidImage(state.master.articleLogos[`${f.group}||${f.type}||${a}`])) ? `<img src="${state.master.articleLogos[`${f.group}||${f.type}||${a}`]}" class="grp-logo-thumb">` : '';
      return `<div class="qb-chip lvl-art ${f.article===a?'active':''}" onclick="window.handleOpenFilterChip('article', '${safeJsStr(a)}')">${artLogo}<span>${esc(a)}</span></div>`;
    }).join('');
  }

  // 4. Größen & Farben
  const needsArticle = arts.length > 0;
  const showSizeColor = f.group && f.type && (!needsArticle || f.article);
  const fsc = g('open-field-size-color');
  if(fsc) fsc.style.display = showSizeColor ? 'grid' : 'none';

  let sizes = [], colors = [];
  if (showSizeColor && cat[f.group] && cat[f.group][f.type]) {
    const target = cat[f.group][f.type];
    if (needsArticle) {
      if (f.article && target.articleData && target.articleData[f.article]) {
        sizes = target.articleData[f.article].sizes || [];
        colors = target.articleData[f.article].colors || [];
      } else {
        sizes = [];
        colors = [];
      }
    } else {
      sizes = target.sizes || [];
      colors = target.colors || [];
    }
  }

  const szContainer = g('qb-open-size');
  if (szContainer && showSizeColor) {
    szContainer.innerHTML = sizes.map(s => {
      return `<div class="qb-chip lvl-var ${f.size===s?'active':''}" onclick="window.handleOpenFilterChip('size', '${safeJsStr(s)}')"><span>Gr. ${esc(s)}</span></div>`;
    }).join('');
  }
  const colContainer = g('qb-open-color');
  if (colContainer && showSizeColor) {
    colContainer.innerHTML = colors.map(c => {
      return `<div class="qb-chip lvl-var ${f.color===c?'active':''}" onclick="window.handleOpenFilterChip('color', '${safeJsStr(c)}')"><span>${esc(c)}</span></div>`;
    }).join('');
  }
};

window.handleOpenFilterChip = function(type, val) {
  const f = state.openFilters;
  if (f[type] === val) {
    f[type] = '';
  } else {
    f[type] = val;
  }
  if (type === 'group') { f.type = ''; f.article = ''; f.size = ''; f.color = ''; }
  else if (type === 'type') { f.article = ''; f.size = ''; f.color = ''; }
  else if (type === 'article') { f.size = ''; f.color = ''; }
  
  window.renderOpenFilters();
  window.renderOpen();
};

// ==========================================
// BESTAND BAUM-ANSICHT
// ==========================================
window.renderOpen = function() {
  updateZeroToggleUI();
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
    const grpLogo = (state.master.groupLogos && isValidImage(state.master.groupLogos[grp])) ? state.master.groupLogos[grp] : '';

    Object.keys(tree[grp]).sort(sortKeys).forEach(pt => {
      let ptHtml = ''; let ptTotal = 0;
      const ptLogo = (state.master.typeLogos && isValidImage(state.master.typeLogos[`${grp}||${pt}`])) ? state.master.typeLogos[`${grp}||${pt}`] : '';
      const ptAvailSizes = new Set(), ptAvailColors = new Set();

      Object.keys(tree[grp][pt]).sort(sortKeys).forEach(art => {
        let artTotal = 0; let colHtmlMaster = '';
        const artLogo = (state.master.articleLogos && isValidImage(state.master.articleLogos[`${grp}||${pt}||${art}`])) ? state.master.articleLogos[`${grp}||${pt}||${art}`] : '';
        const artAvailSizes = new Set(), artAvailColors = new Set();

        Object.keys(tree[grp][pt][art]).sort(sortKeys).forEach(col => {
          const items = tree[grp][pt][art][col]; const colTotal = countPcs(items); if (colTotal === 0 && state.hideZero) return; artTotal += colTotal;
          const sizeMap = {}; items.forEach(i => { const sKey = i.size || '–'; if (!sizeMap[sKey]) sizeMap[sKey] = []; sizeMap[sKey].push(i); }); let cardsHtml = '';
          Object.values(sizeMap).forEach(sizeItems => {
            let allInst = []; sizeItems.forEach(sItem => { 
              if(sItem.instances && sItem.instances.length > 0) {
                if(sItem.size) { artAvailSizes.add(sItem.size); ptAvailSizes.add(sItem.size); }
                if(sItem.color) { artAvailColors.add(sItem.color); ptAvailColors.add(sItem.color); }
                sItem.instances.forEach(i => { allInst.push({...i, _itemId:sItem.id}); });
              }
            });
            if(allInst.length === 0 && state.hideZero) return; 
            const firstItem = sizeItems[0]; 
            
            let img = artLogo || ptLogo || grpLogo || '';
            const ekSumme = allInst.reduce((s,i)=>s+(+i.purchasePrice||0),0); const menge = allInst.length; const einzel = menge > 0 ? ekSumme / menge : (+firstItem.purchasePrice || 0); const hasPsh = menge > 0 ? allInst.some(x=>x.profitshare) : firstItem.profitshare;
            const oldestDays = allInst.length ? Math.max(...allInst.map(x => calcDays(x.entryDate, today()))) : 0;

            cardsHtml += `<div class="item-card">
              <div class="item-card-main">
                <div class="thumb">${img?`<img src="${img}" loading="lazy">` :'📦'}</div>
                <div class="item-info">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                      <div class="item-title" style="color:var(--text); font-size:1.05rem;">${esc(firstItem.article) || esc(firstItem.productType) || '–'} · <span style="font-weight:normal; color:var(--muted);">${esc(firstItem.color)||'-'}</span></div>
                    </div>
                    <div style="font-size:var(--text-xs); color:var(--muted); font-weight:bold; text-align:right;">${menge} × Ø${euro(einzel)} = <b style="color:var(--text); font-size:var(--text-sm);">${euro(ekSumme)}</b></div>
                  </div>
                  <div class="chips" style="margin-top:6px;">
                    <span class="chip">Gr. ${esc(firstItem.size)||'-'}</span>
                    <span class="chip days">⏱️ ${oldestDays} Tage im Bestand</span>
                  </div>
                </div>
              </div>
              <div class="item-footer">
                <div class="item-actions">
                  <span class="chip" style="cursor:pointer;" onclick="window.editEK('${firstItem.id}')">EK ${euro(einzel)} ✎</span>
                  <button type="button" class="chip" style="cursor:pointer;border:none" onclick="window.toggleItemProfitshare('${firstItem.id}')">${hasPsh?'PS ✓':'PS ✎'}</button>
                  <span class="chip stack" style="display:inline-flex;gap:3px;align-items:center;padding:0 6px">
                    <button type="button" onclick="window.changeQty('${firstItem.id}',1)" style="width:16px;height:16px;border-radius:50%;background:#4CAF50;color:white;font-size:10px;border:none;cursor:pointer">+</button>
                    ${menge}
                    <button type="button" onclick="window.changeQty('${firstItem.id}',-1)" style="width:16px;height:16px;border-radius:50%;background:#f44336;color:white;font-size:10px;border:none;cursor:pointer">−</button>
                  </span>
                  <button type="button" class="btn-icon-subtle" onclick="window.editItem('${firstItem.id}')" title="Bearbeiten">✏️</button>
                  <button type="button" class="btn-icon-subtle danger" onclick="window.deleteItem('${firstItem.id}')" title="Löschen">🗑️</button>
                </div>
              </div>
            </div>`;
          });
          if(cardsHtml) colHtmlMaster += `<div style="margin-bottom:var(--sp2); margin-left:var(--sp2);">${cardsHtml}</div>`;
        }); 

        if (colHtmlMaster) {
          ptTotal += artTotal; 
          
          if (!art || art.trim() === '') {
            ptHtml += colHtmlMaster;
          } else {
            const aKey = 'a_' + hashStr(grp+pt+art);
            let inlineChipsHtml = '<div style="display:inline-flex; gap:4px; margin-left:8px; flex-wrap:wrap;">';
            artAvailSizes.forEach(s => {
              const isActive = state.openFilters.size === s;
              inlineChipsHtml += `<span class="inline-filter-chip ${isActive?'active':''}" style="border-color:rgba(245,158,11,0.4);" onclick="event.stopPropagation(); window.setInlineFilter('size', '${safeJsStr(s)}')">Gr. ${esc(s)}</span>`;
            });
            artAvailColors.forEach(c => {
              const isActive = state.openFilters.color === c;
              inlineChipsHtml += `<span class="inline-filter-chip ${isActive?'active':''}" style="border-color:rgba(245,158,11,0.4);" onclick="event.stopPropagation(); window.setInlineFilter('color', '${safeJsStr(c)}')">${esc(c)}</span>`;
            });
            inlineChipsHtml += '</div>';

            ptHtml += `<div style="margin-bottom:var(--sp3); margin-left:var(--sp2);"><div class="group-head" onclick="window.toggleGrp(this)" data-key="${aKey}" style="cursor:pointer; border-left:4px solid var(--c-art-border); background:var(--c-art-bg); border-radius:8px;"><div style="display:flex; align-items:center; flex-wrap:nowrap;">${artLogo?`<img src="${artLogo}" class="tree-thumb">`:''}<h4 class="group-title" style="font-size:1.15rem; color:#fef3c7; font-weight:700;">${isOpen(aKey) ? "▼" : "▶"} ${esc(art)} <span style="font-weight:normal; color:var(--muted); font-size:var(--text-xs);">(${artTotal} Stk)</span></h4>${inlineChipsHtml}</div></div><div class="grp-body" data-body="${aKey}" style="display:${isOpen(aKey) ? "block" : "none"}">${colHtmlMaster}</div></div>`;
          }
        }
      }); 

      if (ptHtml) {
        grpTotal += ptTotal; const pKey = 'p_' + hashStr(grp+pt);
        
        let inlineChipsHtml = '<div style="display:inline-flex; gap:4px; margin-left:8px; flex-wrap:wrap;">';
        ptAvailSizes.forEach(s => {
          const isActive = state.openFilters.size === s;
          inlineChipsHtml += `<span class="inline-filter-chip ${isActive?'active':''}" style="border-color:rgba(99,102,241,0.4);" onclick="event.stopPropagation(); window.setInlineFilter('size', '${safeJsStr(s)}')">Gr. ${esc(s)}</span>`;
        });
        ptAvailColors.forEach(c => {
          const isActive = state.openFilters.color === c;
          inlineChipsHtml += `<span class="inline-filter-chip ${isActive?'active':''}" style="border-color:rgba(99,102,241,0.4);" onclick="event.stopPropagation(); window.setInlineFilter('color', '${safeJsStr(c)}')">${esc(c)}</span>`;
        });
        inlineChipsHtml += '</div>';

        grpHtml += `<div style="margin-bottom:var(--sp4); margin-left:var(--sp2);"><div class="group-head" onclick="window.toggleGrp(this)" data-key="${pKey}" style="cursor:pointer; border-left:4px solid var(--c-typ-border); background:var(--c-typ-bg); border-radius:8px;"><div style="display:flex; align-items:center; flex-wrap:nowrap;">${ptLogo?`<img src="${ptLogo}" class="tree-thumb">`:''}<h3 class="group-title" style="font-size:1.2rem; color:#e0e7ff; font-weight:700;">${isOpen(pKey) ? "▼" : "▶"} 🏷 ${esc(pt)} <span style="font-weight:normal; color:var(--muted); font-size:var(--text-xs);">(${ptTotal} Stk)</span></h3>${inlineChipsHtml}</div></div><div class="grp-body" data-body="${pKey}" style="display:${isOpen(pKey) ? "block" : "none"}">${ptHtml}</div></div>`;
      }
    }); 

    if (grpHtml) {
      const gKey = 'g_' + hashStr(grp);
      html += `<div style="margin-bottom:var(--sp6);"><div class="group-head" onclick="window.toggleGrp(this)" data-key="${gKey}" style="cursor:pointer; border-left:4px solid var(--c-grp-border); background:var(--c-grp-bg); border-radius:8px;"><div style="display:flex;align-items:center; flex-wrap:nowrap;">${grpLogo ? `<img src="${grpLogo}" class="grp-header-logo">` : ''}<h2 class="group-title" style="font-size:1.45rem; color:#f0f9ff; font-weight:800;">${isOpen(gKey) ? "▼" : "▶"} ${esc(grp)} <span style="font-weight:normal; color:var(--muted); font-size:var(--text-sm);">(${grpTotal} Stk)</span></h2></div><span class="chip stack" style="background:var(--c-grp); color:#fff;">${grpTotal} Stk</span></div><div class="grp-body" data-body="${gKey}" style="display:${isOpen(gKey) ? "block" : "none"}">${grpHtml}</div></div>`;
    }
  });
  oc.innerHTML = html || '<div class="empty">Keine Treffer.</div>';
};

// SCHNELLE CHIP-AUSWAHL IM VERKAUF
window.renderSellQuick = function() {
  const sel = state.sellSelection;
  const cartInstIds = new Set(state.sellCart.map(c => c.inst.id));

  const availableItems = [];
  state.open.forEach(item => {
    const validInsts = (item.instances || []).filter(inst => !cartInstIds.has(inst.id));
    if (validInsts.length > 0) {
      availableItems.push({ ...item, validInsts });
    }
  });

  const availGroups = [...new Set(availableItems.map(i => i.group).filter(Boolean))].sort(sortKeys);
  const grpContainer = g('qb-sell-group');
  if (grpContainer) {
    grpContainer.innerHTML = availGroups.map(grp => {
      const isActive = sel.group === grp;
      const logo = (state.master.groupLogos && isValidImage(state.master.groupLogos[grp])) ? `<img src="${state.master.groupLogos[grp]}" class="grp-logo-thumb">` : '';
      return `<div class="qb-chip lvl-grp ${isActive?'active':''}" onclick="window.handleSellChipSelect('group', '${safeJsStr(grp)}')">${logo}<span>${esc(grp)}</span></div>`;
    }).join('') || '<span class="muted" style="font-size:var(--text-xs);">Keine Artikel vorrätig</span>';
  }

  const itemsInGrp = sel.group ? availableItems.filter(i => i.group === sel.group) : [];
  const availTypes = [...new Set(itemsInGrp.map(i => i.productType).filter(Boolean))].sort(sortKeys);
  const fpt = g('sell-field-productType'); if(fpt) fpt.style.display = sel.group ? 'grid' : 'none';
  const typContainer = g('qb-sell-productType');
  if (typContainer && sel.group) {
    typContainer.innerHTML = availTypes.map(t => {
      const typLogo = (state.master.typeLogos && isValidImage(state.master.typeLogos[`${sel.group}||${t}`])) ? `<img src="${state.master.typeLogos[`${sel.group}||${t}`]}" class="grp-logo-thumb">` : '';
      return `<div class="qb-chip lvl-typ ${sel.type===t?'active':''}" onclick="window.handleSellChipSelect('type', '${safeJsStr(t)}')">${typLogo}<span>${esc(t)}</span></div>`;
    }).join('') || '<span class="muted" style="font-size:var(--text-xs);">Keine Typen</span>';
  }

  const itemsInTyp = (sel.group && sel.type) ? itemsInGrp.filter(i => i.productType === sel.type) : [];
  const availArticles = [...new Set(itemsInTyp.map(i => String(i.article||'')).filter(Boolean))].sort(sortKeys);
  const fa = g('sell-field-article'); if(fa) fa.style.display = (sel.group && sel.type) ? 'grid' : 'none';
  const artContainer = g('qb-sell-article');
  if (artContainer && sel.group && sel.type) {
    artContainer.innerHTML = availArticles.map(a => {
      const artLogo = (state.master.articleLogos && isValidImage(state.master.articleLogos[`${sel.group}||${sel.type}||${a}`])) ? `<img src="${state.master.articleLogos[`${sel.group}||${sel.type}||${a}`]}" class="grp-logo-thumb">` : '';
      return `<div class="qb-chip lvl-art ${sel.article===a?'active':''}" onclick="window.handleSellChipSelect('article', '${safeJsStr(a)}')">${artLogo}<span>${esc(a)}</span></div>`;
    }).join('') || '<span class="muted" style="font-size:var(--text-xs);">Keine Artikel</span>';
  }

  const itemsInArt = (sel.group && sel.type) ? itemsInTyp.filter(i => !sel.article || i.article === sel.article) : [];
  const availSizes = [...new Set(itemsInArt.map(i => String(i.size||'')).filter(Boolean))].sort(sortKeys);
  const availColors = [...new Set(itemsInArt.map(i => String(i.color||'')).filter(Boolean))].sort(sortKeys);

  const fsc = g('sell-field-size-color'); if(fsc) fsc.style.display = (sel.group && sel.type && (availSizes.length > 0 || availColors.length > 0)) ? 'grid' : 'none';
  const szContainer = g('qb-sell-size');
  if (szContainer && sel.group && sel.type) {
    szContainer.innerHTML = availSizes.map(s => {
      return `<div class="qb-chip lvl-var ${sel.size===s?'active':''}" onclick="window.handleSellChipSelect('size', '${safeJsStr(s)}')"><span>Gr. ${esc(s)}</span></div>`;
    }).join('') || '<span class="muted" style="font-size:var(--text-xs);">–</span>';
  }
  const colContainer = g('qb-sell-color');
  if (colContainer && sel.group && sel.type) {
    colContainer.innerHTML = availColors.map(c => {
      return `<div class="qb-chip lvl-var ${sel.color===c?'active':''}" onclick="window.handleSellChipSelect('color', '${safeJsStr(c)}')"><span>${esc(c)}</span></div>`;
    }).join('') || '<span class="muted" style="font-size:var(--text-xs);">–</span>';
  }

  window.renderSellInstanceList();
};

window.handleSellChipSelect = function(type, val) {
  const sel = state.sellSelection;
  if (sel[type] === val) {
    sel[type] = '';
  } else {
    sel[type] = val;
  }
  if (type === 'group') { sel.type = ''; sel.article = ''; sel.size = ''; sel.color = ''; }
  else if (type === 'type') { sel.article = ''; sel.size = ''; sel.color = ''; }
  else if (type === 'article') { sel.size = ''; sel.color = ''; }
  window.renderSellQuick();
};

window.renderSellInstanceList = function() {
  const list = g('sellInstanceList'); if(!list) return;
  const sel = state.sellSelection;
  const cartInstIds = new Set(state.sellCart.map(c => c.inst.id));

  const matches = [];
  state.open.forEach(item => {
    if (sel.group && item.group !== sel.group) return;
    if (sel.type && item.productType !== sel.type) return;
    if (sel.article && item.article !== sel.article) return;
    if (sel.size && item.size !== sel.size) return;
    if (sel.color && item.color !== sel.color) return;

    (item.instances||[]).forEach(inst => {
      if (!cartInstIds.has(inst.id)) {
        matches.push({ item, inst });
      }
    });
  });

  if (matches.length === 0) {
    list.innerHTML = '<div class="empty" style="padding:var(--sp2);">Keine passenden Lager-Exemplare vorrätig.</div>';
    return;
  }

  list.innerHTML = matches.map(m => {
    const spec = `${esc(m.item.article||m.item.productType||'Artikel')} · ${esc(m.item.color||'–')} ${m.item.size?'(Gr. '+esc(m.item.size)+')':''}`;
    const days = calcDays(m.inst.entryDate);
    return `<div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface2); padding:6px 10px; border-radius:var(--rad-sm);">
      <div>
        <b style="font-size:var(--text-sm);">${spec}</b>
        <div style="font-size:var(--text-xs); color:var(--muted);">EK: ${euro(m.inst.purchasePrice)} · ⏱️ ${days} Tage im Bestand</div>
      </div>
      <button type="button" class="btn btn-primary" style="width:auto; min-height:28px; padding:2px 10px;" onclick="window.addSellDirect('${m.item.id}', '${m.inst.id}')">✚</button>
    </div>`;
  }).join('');
};

window.addSellDirect = function(itemId, instId) {
  const item = state.open.find(i=>i.id===itemId);
  const inst = item ? item.instances.find(x=>x.id===instId) : null;
  if (item && inst) {
    state.sellCart.push({ item, inst });
    state.psManualOverride = false;
    window.renderSellCart();
    window.renderSellQuick();
  }
};

window.removeSellPosition = function(index) { 
  state.sellCart.splice(index, 1); 
  state.psManualOverride = false; 
  window.renderSellCart(); 
  window.renderSellQuick();
};

window.renderSellCart = function() { 
  const container = g('sellCartContainer'); if (!container) return; 
  const isSet = state.sellCart.length > 1;
  const setImgGroup = g('sellSetImageGroup');
  if (setImgGroup) setImgGroup.style.display = isSet ? 'block' : 'none';

  if (state.sellCart.length === 0) { container.innerHTML = '<div class="empty">Noch keine Positionen im Warenkorb.</div>'; window.updateSellPreview(); return; } 
  let html = ''; state.sellCart.forEach((pos, i) => { const title = `${esc(pos.item.group)||''} / ${esc(pos.item.productType)||''} / ${esc(pos.item.article)||''} ${pos.item.color?'('+esc(pos.item.color)+')':''}`; html += `<div class="sell-pos-row" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--divider);"><div style="flex:1;"><b>${i+1}.</b> ${title} <span style="color:var(--primary);font-weight:600;">${euro(pos.inst.purchasePrice)}</span> <span style="color:var(--muted); font-size:var(--text-xs);">(⏱️ ${calcDays(pos.inst.entryDate)}d)</span></div><button type="button" class="btn btn-danger" style="width:auto; min-height:28px; padding:.2rem .5rem;" onclick="window.removeSellPosition(${i})">✕</button></div>`; }); 
  container.innerHTML = html; window.updateSellPreview(); 
};

// DUALER PROFITSHARE (% ODER €)
window.onPsPctInput = function() {
  state.psManualOverride = true;
  state.psMode = 'pct';
  window.updateSellPreview();
};

window.onPsEuroInput = function() {
  state.psManualOverride = true;
  state.psMode = 'euro';
  window.updateSellPreview();
};

window.updateSellPreview = function() {
    const nameInput = g('sellBaseName'); const priceInput = g('sellPrice'); 
    const psInput = g('sellPsInput'); const psEuroInput = g('sellPsEuroInput');
    const previewName = g('sellNamePreview'); const ekEl = g('sellEKTotal'); const netEl = g('sellNetto'); const finalProfitEl = g('sellFinalProfit'); if(!nameInput) return;

    const base = nameInput.value.trim(); const articles = [...new Set(state.sellCart.map(c => c.item.article).filter(Boolean))]; previewName.textContent = base + (articles.length > 0 ? ' ' + articles.join(' ') : '') ? `Finaler Set-Name: ${base + (articles.length > 0 ? ' ' + articles.join(' ') : '')}` : '';
    
    let purchaseTotal = 0; state.sellCart.forEach(c => purchaseTotal += (+c.inst.purchasePrice || 0)); ekEl.textContent = euro(purchaseTotal);
    const salePrice = +priceInput.value || 0; 
    const rohertrag = salePrice - purchaseTotal; 
    netEl.textContent = euro(rohertrag); 
    netEl.style.color = rohertrag < 0 ? 'var(--err)' : 'var(--primary)';

    if (!state.psManualOverride && state.sellCart.length > 0) { 
      const allPs = state.sellCart.every(c => c.inst.profitshare); 
      const nonePs = state.sellCart.every(c => !c.inst.profitshare); 
      if (allPs) { psInput.value = 50; state.psMode = 'pct'; }
      else if (nonePs) { psInput.value = 0; state.psMode = 'pct'; }
    }

    let psEuro = 0;
    let psPct = 0;

    if (state.psMode === 'euro' && psEuroInput) {
      psEuro = +psEuroInput.value || 0;
      psPct = (rohertrag > 0) ? (psEuro / rohertrag) * 100 : 0;
      if (psInput) psInput.value = Math.round(psPct);
    } else {
      psPct = +(psInput ? psInput.value : 0);
      psEuro = (rohertrag > 0) ? rohertrag * (psPct / 100) : 0;
      if (psEuroInput) psEuroInput.value = psEuro > 0 ? psEuro.toFixed(2) : '';
    }

    const finalProfit = rohertrag - psEuro;
    if (salePrice > 0) { 
      finalProfitEl.textContent = psEuro > 0 ? `Netto nach ${euro(psEuro)} PS (${Math.round(psPct)}%): ${euro(finalProfit)}` : `Netto: ${euro(finalProfit)}`; 
    } else { 
      finalProfitEl.textContent = ''; 
    }
};

window.executeSale = function() {
  if (state.sellCart.length === 0) return alert('Bitte Artikel einfügen.'); const sp = +gVal('sellPrice')||0; if (sp<=0) return alert('Bitte Verkaufspreis eingeben.');
  const byArticle = new Map(); state.sellCart.forEach(({item,inst})=>{ if(!byArticle.has(item.id)) byArticle.set(item.id,{item,insts:[]}); byArticle.get(item.id).insts.push(inst); });
  const base = gVal('sellBaseName').trim(); const articles = [...new Set(state.sellCart.map(c => c.item.article).filter(Boolean))]; const setName = base + (articles.length > 0 ? ' ' + articles.join(' ') : '');
  const purchaseTotal = state.sellCart.reduce((s,{inst})=>s+(+inst.purchasePrice||0),0); const rawProfit = sp - purchaseTotal; 
  
  let psEuro = +(g('sellPsEuroInput') ? gVal('sellPsEuroInput') : 0);
  if (state.psMode !== 'euro') {
    const psPct = +(g('sellPsInput') ? gVal('sellPsInput') : 0);
    psEuro = rawProfit > 0 ? rawProfit * (psPct / 100) : 0;
  }
  const netProfit = rawProfit - psEuro;
  const psSome = psEuro > 0;
  
  const isSet = state.sellCart.length > 1;
  let finalImage = '';
  if (isSet) {
    finalImage = gVal('sellSetImgValue') || '';
    if (!finalImage && (state.master.setImages||[]).length > 0) finalImage = state.master.setImages[0];
  } else {
    finalImage = getEntityImage(state.sellCart[0].item.group, state.sellCart[0].item.productType, state.sellCart[0].item.article);
  }

  const totalDays = state.sellCart.reduce((sum, c) => sum + calcDays(c.inst.entryDate, today()), 0);
  const avgDaysInStock = state.sellCart.length ? Math.round(totalDays / state.sellCart.length) : 0;

  state.sold.unshift({ id:uid(), setName: setName.trim() || 'Unbenanntes Set', isSet: isSet, salePrice:sp, purchaseTotal, netProfit, saleDate:today(), hasProfitshare:psSome, previewImage: finalImage, avgDaysInStock: avgDaysInStock, items:[...byArticle.values()].map(e=>({ article:e.item.article, productType:e.item.productType||'', group:e.item.group, size:e.item.size, color:e.item.color, menge:e.insts.length, quantity:e.insts.length, entryDate: e.insts[0]?.entryDate })) });
  byArticle.forEach(({item,insts})=>{ const rmIds = new Set(insts.map(x=>x.id)); if(item.instances) item.instances = item.instances.filter(x=>!rmIds.has(x.id)); });
  state.sellCart = []; ['sellBaseName', 'sellPrice', 'sellSetImgValue', 'sellPsEuroInput'].forEach(id => { const el=g(id); if(el) el.value=''; });
  save(); 
  window.autoSaveToCloud();
  toast('Verkauft ✓'); state.page='sold'; window.render();
};

// EDIT SOLD BILD
window.editSoldImage = function(id) {
  const set = state.sold.find(s => s.id === id);
  if (!set) return;
  imagePickCallback = (url) => {
    set.previewImage = url;
    save();
    window.autoSaveToCloud();
    window.renderSold();
    toast('Verkaufs-Bild aktualisiert ✓');
  };
  window.openImagePicker(set.previewImage || '');
};

window.editSoldName = function(id) {
  const set = state.sold.find(s => s.id === id);
  if (!set) return;
  const newName = prompt('Name / Set-Name bearbeiten:', set.setName || '');
  if (newName !== null) {
    set.setName = newName.trim() || 'Unbenanntes Set';
    save();
    window.autoSaveToCloud();
    window.renderSold();
    toast('Name aktualisiert ✓');
  }
};

window.editSoldPrice = function(id) {
  const set = state.sold.find(s => s.id === id);
  if (!set) return;
  const newPriceStr = prompt('Verkaufspreis (€):', set.salePrice || 0);
  if (newPriceStr !== null) {
    const newPrice = parseFloat(newPriceStr.replace(',', '.')) || 0;
    set.salePrice = newPrice;
    const rawProfit = newPrice - (set.purchaseTotal || 0);
    set.netProfit = set.hasProfitshare ? rawProfit * 0.5 : rawProfit;
    save();
    window.autoSaveToCloud();
    window.renderSold();
    toast('Preis & Gewinn aktualisiert ✓');
  }
};

window.deleteSoldSet = function(id) {
  if (!confirm('Verkaufte Position löschen?')) return;
  if (!state.deletedIds) state.deletedIds = [];
  state.deletedIds.push(id);
  state.sold = state.sold.filter(s => s.id !== id);
  save(); 
  window.autoSaveToCloud();
  window.renderSold(); 
  toast('Gelöscht ✓');
};

window.renderSold = function() {
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
            <button type="button" class="btn-icon-subtle" onclick="window.editSoldName('${set.id}')" title="Name bearbeiten">✏️</button>
            <button type="button" class="btn-icon-subtle" onclick="window.editSoldPrice('${set.id}')" title="VK bearbeiten">🏷️</button>
            <button type="button" class="btn-icon-subtle" onclick="window.editSoldImage('${set.id}')" title="Bild ändern">🖼️</button>
            <button type="button" class="btn-icon-subtle danger" onclick="window.deleteSoldSet('${set.id}')" title="Löschen">🗑️</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
};

// STATISTIK LOGIK
window.onStatsFilterChange = function(type) {
  if (type === 'grp') { g('statsFilterTyp').value = ''; g('statsFilterArt').value = ''; g('statsFilterSize').value = ''; g('statsFilterCol').value = ''; }
  else if (type === 'typ') { g('statsFilterArt').value = ''; g('statsFilterSize').value = ''; g('statsFilterCol').value = ''; }
  else if (type === 'art') { g('statsFilterSize').value = ''; g('statsFilterCol').value = ''; }
  window.renderStats();
};

function populateStatsFilters() {
  const grpSel = g('statsFilterGrp'); const typSel = g('statsFilterTyp'); const artSel = g('statsFilterArt'); const szSel = g('statsFilterSize'); const colSel = g('statsFilterCol'); if (!grpSel) return;
  const curGrp = grpSel.value; const curTyp = typSel.value; const curArt = artSel.value; const curSz = szSel ? szSel.value : ''; const curCol = colSel ? colSel.value : '';
  const grps = new Set(), typs = new Set(), arts = new Set(), sizes = new Set(), colors = new Set();

  state.sold.forEach(s => {
    (s.items||[]).forEach(i => {
      if (i.group) grps.add(i.group);
      if (!curGrp || i.group === curGrp) {
        if (i.productType) typs.add(i.productType);
        if (!curTyp || i.productType === curTyp) {
          if (i.article) arts.add(i.article);
          if (i.size) sizes.add(i.size);
          if (i.color) colors.add(i.color);
        }
      }
    });
  });

  fillSel(grpSel, [...grps].sort(sortKeys), 'Gruppe'); grpSel.value = curGrp;
  fillSel(typSel, [...typs].sort(sortKeys), 'Produkttyp'); typSel.value = curTyp;
  fillSel(artSel, [...arts].sort(sortKeys), 'Artikelname'); artSel.value = curArt;
  if (szSel) { fillSel(szSel, [...sizes].sort(sortKeys), 'Größe'); szSel.value = curSz; }
  if (colSel) { fillSel(colSel, [...colors].sort(sortKeys), 'Farbe'); colSel.value = curCol; }
}

window.renderStats = function() {
  populateStatsFilters();
  const fGrp = gVal('statsFilterGrp'); const fTyp = gVal('statsFilterTyp'); const fArt = gVal('statsFilterArt');
  const fSz = gVal('statsFilterSize'); const fCol = gVal('statsFilterCol');
  
  const years = [...new Set(state.sold.map(s=>(s.saleDate||today()).slice(0,4)))].sort((a,b)=>b-a);
  if (years.length > 0 && !years.includes(state.year)) state.year = years[0];
  const sy = g('statsYear'); if(sy) sy.innerHTML = (years.length ? years : [state.year]).map(y=>`<option value="${y}" ${y===state.year?'selected':''}>${y}</option>`).join('');
  
  let ys = state.sold.filter(s=>(s.saleDate||today()).startsWith(state.year));
  if (ys.length === 0 && state.sold.length > 0) ys = state.sold;

  if (fGrp || fTyp || fArt || fSz || fCol) {
    ys = ys.filter(s => (s.items||[]).some(i => 
      (!fGrp || i.group === fGrp) && 
      (!fTyp || i.productType === fTyp) && 
      (!fArt || i.article === fArt) && 
      (!fSz || i.size === fSz) && 
      (!fCol || i.color === fCol)
    ));
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

  const specStats = new Map();

  ys.forEach(s => {
    const itemCount = s.items.length || 1;
    const shareProfit = (s.netProfit || 0) / itemCount;
    const shareRevenue = (s.salePrice || 0) / itemCount;

    (s.items||[]).forEach(i => {
      if ((!fGrp || i.group === fGrp) && (!fTyp || i.productType === fTyp) && (!fArt || i.article === fArt) && (!fSz || i.size === fSz) && (!fCol || i.color === fCol)) {
        const parts = [i.productType, i.article, i.color, i.size ? `(${i.size})` : ''].filter(Boolean);
        const specName = parts.join(' ').trim() || 'Unbenannt';
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
      <div class="kpi-card"><div class="k">🎯 Top Gewinnbringer</div><div class="v">${bestProfit ? esc(bestProfit.name) : '–'}</div><div class="d">${bestProfit ? euro(bestProfit.profit) : ''}</div></div>
      <div class="kpi-card"><div class="k">💵 Top Umsatzbringer</div><div class="v">${bestRevenue ? esc(bestRevenue.name) : '–'}</div><div class="d">${bestRevenue ? euro(bestRevenue.revenue) : ''}</div></div>
      <div class="kpi-card"><div class="k">⚠️ Geringster Absatz</div><div class="v">${worstCount ? esc(worstCount.name) : '–'}</div><div class="d">${worstCount ? worstCount.count + 'x verkauft' : ''}</div></div>
      <div class="kpi-card"><div class="k">📈 Ø Marge in %</div><div class="v">${avgMargin} %</div><div class="d">Gewinn vs. Umsatz</div></div>
      <div class="kpi-card"><div class="k">⏳ Rotationsgeschwindigkeit</div><div class="v">${avgDaysOverall} Tage</div><div class="d">Durchschnittliche Lagerdauer</div></div>
    `;
  }

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
                  <td style="color:var(--success); font-weight:bold;">${euro(item.profit)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    } else {
      trContainer.innerHTML = '';
    }
  }

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
};

// KALENDER LOGIK
window.renderTermine = function() {
    const container = g('terminContent'); if (!container) return; if (!state.termine || state.termine.length === 0) { container.innerHTML = '<div class="empty">Keine Termine vorhanden.</div>'; return; }
    
    const sorted = [...state.termine].sort((a,b) => {
      const dateA = new Date(`${a.datum}T${a.uhrzeit||'00:00'}:00`);
      const dateB = new Date(`${b.datum}T${b.uhrzeit||'00:00'}:00`);
      return dateB - dateA;
    }); 
    
    container.innerHTML = sorted.map(t => {
      const isAbholung = t.art === 'Abholung';
      const color = isAbholung ? 'var(--err)' : 'var(--success)';
      const mapsUrl = t.ort ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.ort)}` : null;

      return `<div class="card" style="margin-bottom:var(--sp3); border-left:4px solid ${color};"><div class="card-body" style="padding:var(--sp3);"><div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp2);"><div><div style="font-size:var(--text-xs); color:${color}; font-weight:700;">${t.art}</div><h4 style="margin:2px 0 0; font-size:var(--text-base);">${esc(t.name)}</h4></div><div style="text-align:right;"><div style="font-weight:700;">${fmtDate(t.datum)}</div><div style="color:var(--muted); font-size:var(--text-sm);">${t.uhrzeit} Uhr</div></div></div><div class="chips" style="margin-bottom:var(--sp3);">${t.preis ? `<span class="chip">💰 ${esc(t.preis)}</span>` : ''}${mapsUrl ? `<a href="${mapsUrl}" target="_blank" class="chip" style="color:var(--primary); font-weight:700; text-decoration:underline;">📍 ${esc(t.ort)}</a>` : ''}${t.user ? `<span class="chip">👤 ${esc(t.user)}</span>` : ''}</div><div style="display:flex; gap:8px;"><button type="button" class="btn btn-ghost" style="flex:1;" onclick="window.addToCalendar('${t.id}')">📅 Google Kalender öffnen</button><button type="button" class="btn btn-danger" style="width:auto;" onclick="window.deleteTermin('${t.id}')">🗑</button></div></div></div>`;
    }).join('');
};

window.addToCalendar = function(id) {
  const t = state.termine.find(x => x.id === id);
  if (!t) return;

  const title = `${t.art} / ${t.name}${t.preis ? ' / ' + t.preis : ''}`;
  const dateClean = (t.datum || today()).replace(/-/g, '');
  const [h, m] = (t.uhrzeit || '10:00').split(':').map(Number);
  const startDT = `${dateClean}T${String(h).padStart(2,'0')}${String(m).padStart(2,'0')}00`;
  
  let endH = h, endM = m + 30;
  if (endM >= 60) { endM -= 60; endH = (endH + 1) % 24; }
  const endDT = `${dateClean}T${String(endH).padStart(2,'0')}${String(endM).padStart(2,'0')}00`;

  const details = `${t.user ? 'Kleinanzeigen User: ' + t.user + '\n' : ''}${t.info ? 'Info: ' + t.info : ''}`;
  const location = t.ort || '';

  const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDT}/${endDT}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  
  window.open(gCalUrl, '_blank');
  toast('Google Kalender wird geöffnet 📅');
};

window.deleteTermin = function(id) { 
  if(!confirm('Termin löschen?')) return; 
  if (!state.deletedIds) state.deletedIds = [];
  state.deletedIds.push(id);
  state.termine = state.termine.filter(t => t.id !== id); 
  save(); 
  window.autoSaveToCloud();
  window.renderTermine(); 
};
function populateUhrzeit() { const sel = g('terminUhrzeit'); if (!sel) return; let html = '<option value="" disabled selected>Zeit wählen</option>'; for(let i=9; i<=23; i++) { let hour = i < 10 ? '0'+i : i; html += `<option value="${hour}:00">${hour}:00</option><option value="${hour}:30">${hour}:30</option>`; } sel.innerHTML = html; }

const tfrm = g('terminForm');
if(tfrm) { tfrm.addEventListener('submit', e => { e.preventDefault(); const entry = { id: uid(), art: gVal('terminArt'), name: gVal('terminName'), preis: gVal('terminPreis'), ort: gVal('terminOrt'), datum: gVal('terminDatum'), uhrzeit: gVal('terminUhrzeit'), user: gVal('terminUser'), info: gVal('terminInfo') }; if(!state.termine) state.termine = []; state.termine.unshift(entry); save(); toast('Termin angelegt ✓'); tfrm.reset(); const td = g('terminDatum'); if(td) td.value = today(); window.renderTermine(); }); }

document.addEventListener('click', e => {
  const target = e.target; if (!target) return; const el = target.nodeType === 3 ? target.parentElement : target; if (!el || typeof el.closest !== 'function') return;
  const rmBtn = el.closest('[data-rm]');
  if (rmBtn) {
    const key = rmBtn.dataset.rm; const grp = rmBtn.dataset.grp; const typ = rmBtn.dataset.typ; const idx = rmBtn.dataset.idx;
    if (key === 'group') { 
      if (state.master.catalog[grp]) delete state.master.catalog[grp]; 
      if (!state.deletedGroups) state.deletedGroups = [];
      if (!state.deletedGroups.includes(grp)) state.deletedGroups.push(grp);
    } 
    else if (key === 'prodtype') { if (state.master.catalog[grp]) delete state.master.catalog[grp][typ]; } 
    else { if (state.master.catalog[grp] && state.master.catalog[grp][typ] && state.master.catalog[grp][typ][key]) { state.master.catalog[grp][typ][key].splice(+idx, 1); } }
    save(); 
    window.autoSaveToCloud();
    window.updateMasterForm(); 
    window.renderAllQuick(); 
    window.renderMaster(); 
    return;
  }
});

const sy = g('statsYear'); if (sy) { sy.addEventListener('change', e=>{ state.year=e.target.value; window.renderStats(); }); }

window.render = function() {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); 
  document.querySelectorAll('.nav-btn, .icon-btn[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));
  const activePage = g('page-'+state.page); if(activePage) activePage.classList.add('active');
  if (state.page==='new') window.renderAllQuick();
  if (state.page==='stats') window.renderStats(); 
  if (state.page==='sell') { window.renderSellQuick(); window.renderSellCart(); }
  if (state.page==='open') { window.renderOpenFilters(); window.renderOpen(); } 
  if (state.page==='sold') window.renderSold(); 
  if (state.page==='master') window.renderMaster(); 
  if (state.page==='termin') window.renderTermine();
};

load();