const g = id => document.getElementById(id);
const gVal = id => { const el = g(id); return el ? el.value : ''; };
const esc = s => { if(s==null)return''; if(typeof s==='object'){try{s=JSON.stringify(s);}catch(e){s='[Objekt]';}} return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); };
const safeJsStr = s => String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const sortKeys = (a, b) => String(a||'').localeCompare(String(b||''),'de');
const euro = v => Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(+v||0);
const today = () => new Date().toISOString().slice(0,10);
const uid = () => 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, c => { var r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16); });
function calcDays(s) { if(!s) return 0; const t = new Date(s); if(isNaN(t.getTime())) return 0; return Math.max(0, Math.floor((new Date().getTime() - t.getTime())/(1000*60*60*24))); }
const fmtDate = d => { if(!d) return '-'; const dt=new Date(d); return isNaN(dt.getTime())?String(d):new Intl.DateTimeFormat('de-DE',{dateStyle:'medium'}).format(dt); };
const fmtMonth = d => { if(!d) return '-'; const dt=new Date(d); return isNaN(dt.getTime())?String(d):new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(dt); };
const stackKey = i => `${i.group}||${i.productType||''}||${i.article||''}||${i.size||''}||${i.color||''}`;

let toastTimer = null;
function toast(msg) {
  const t = g('toast');
  if(!t) return;
  t.innerHTML = '<span>✓</span> <span>' + esc(msg) + '</span>';
  t.classList.add('show');
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, 2200);
}

function fillSel(el, vals, ph) { if(el) el.innerHTML=(ph?'<option value="">'+ph+'</option>':'')+vals.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join(''); }

const COLOR_HEX_MAP = {
  'weiß': '#ffffff', 'weiss': '#ffffff', 'hochglanz weiß': 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
  'schwarzbraun': '#2c1e18', 'schwarz-braun': '#2c1e18', 'schwarz': '#141414',
  'beige': '#dfd3c3', 'grau': '#7a7a7a', 'dunkelgrau': '#3a3a3a', 'hellgrau': '#d1d5db',
  'eiche': '#c4a47c', 'eicheneffekt': '#c4a47c', 'walnuss': '#5c3a21',
  'blau': '#2563eb', 'dunkelblau': '#1e3a8a', 'grün': '#15803d', 'rot': '#b91c1c'
};

function getColorStyle(colorName) {
  const norm = String(colorName || '').toLowerCase().trim();
  const customImg = state.master?.colorImages?.[norm];
  if(customImg) return "background-image: url('"+customImg+"'); border-color: rgba(255,255,255,0.4);";
  for(const [key, hex] of Object.entries(COLOR_HEX_MAP)){
    if(norm.includes(key)){
      if(hex.startsWith('linear-gradient')) return "background: "+hex+"; border: 1px solid #cbd5e1;";
      return "background-color: "+hex+"; "+ (hex === '#ffffff' ? 'border: 1px solid #94a3b8;' : '');
    }
  }
  return "background-color: #64748b;";
}

const DEFAULT_FAVORITE_SPOTS = [
  { name: 'IKEA Altona', addr: 'Große Bergstraße 164, 22767 Hamburg' },
  { name: 'IKEA Schnelsen', addr: 'Wunderbrunnen 1, 22457 Hamburg' },
  { name: 'IKEA Moorfleet', addr: 'Unterer Landweg 77, 22113 Hamburg' }
];

const DEFAULT_SET_RULES = [
  { id: 'rule_1', pattern: 'Sideboard {Tür} ({Farbe})', model: 'Sideboard', reqs: { '64': 2, '38': 0, '26': 0 }, sameArtCol: true },
  { id: 'rule_2', pattern: 'Longboard {Tür} ({Farbe})', model: 'Longboard', reqs: { '64': 3, '38': 0, '26': 0 }, sameArtCol: true },
  { id: 'rule_3', pattern: 'Sideboard 180 {Tür} ({Farbe})', model: 'Longboard', reqs: { '64': 3, '38': 0, '26': 0 }, sameArtCol: true, allowModular: true },
  { id: 'rule_4', pattern: 'Sideboard TV {Tür} ({Farbe})', model: 'Sideboard TV', reqs: { '64': 0, '38': 2, '26': 0 }, sameArtCol: true },
  { id: 'rule_5', pattern: 'Longboard TV {Tür} ({Farbe})', model: 'Longboard TV', reqs: { '64': 0, '38': 3, '26': 0 }, sameArtCol: true }
];

const DEFAULT_BESTA_TUEREN = ['Björköviken','Djupviken','Förvaltare','Glassvik','Grundsviken','Hammarsmed','Hanviken','Hedeviken','Hjortviken','Kallviken','Krukmakare','Lappviken','Laxviken','Mjörtviken','Norum','Novum','Pippmakare','Riksviken','Selsviken','Sindvik','Smeviken','Studsviken','Sutterviken','Tofta','Tombo','Vara','Vassbo'];

const BESTA_KORPUS_MODELS = {
  'Hochschrank': { dim: '193 x 40 x 60', bom: { 'Seite': { s: '193', q: 2 }, 'Oben/Unten': { s: '60', q: 2 } } },
  'Highboard': { dim: '128 x 40 x 60', bom: { 'Seite': { s: '128', q: 2 }, 'Oben/Unten': { s: '60', q: 2 } } },
  'Sideboard': { dim: '64 x 40 x 120', bom: { 'Seite': { s: '64', q: 2 }, 'Oben/Unten': { s: '120', q: 2 }, 'Mitte': { s: '64', q: 1 } } },
  'Sideboard (niedrig)': { dim: '38 x 40 x 120', bom: { 'Seite': { s: '38', q: 2 }, 'Oben/Unten': { s: '120', q: 2 }, 'Mitte': { s: '38', q: 1 } } },
  'Sideboard Schmal': { dim: '64 x 20 x 120', bom: { 'Seite': { s: '64s', q: 2 }, 'Oben/Unten': { s: '120s', q: 2 }, 'Mitte': { s: '64s', q: 1 } } },
  'Sideboard Schmal (niedrig)': { dim: '38 x 20 x 120', bom: { 'Seite': { s: '38s', q: 2 }, 'Oben/Unten': { s: '120s', q: 2 }, 'Mitte': { s: '38s', q: 1 } } },
  'Sideboard TV': { dim: '38 x 40 x 120', bom: { 'Seite': { s: '38', q: 2 }, 'Oben/Unten TV': { s: '120', q: 2 }, 'Mitte TV': { s: '38', q: 1 } } },
  'Longboard': { dim: '64 x 40 x 180', bom: { 'Seite': { s: '64', q: 2 }, 'Oben/Unten': { s: '180', q: 2 }, 'Mitte': { s: '64', q: 2 } } },
  'Longboard (niedrig)': { dim: '38 x 40 x 180', bom: { 'Seite': { s: '38', q: 2 }, 'Oben/Unten': { s: '180', q: 2 }, 'Mitte': { s: '38', q: 2 } } },
  'Longboard TV': { dim: '64 x 40 x 180', bom: { 'Seite': { s: '64', q: 2 }, 'Oben/Unten TV': { s: '180', q: 2 }, 'Mitte TV': { s: '64', q: 2 } } },
  'Longboard TV (niedrig)': { dim: '38 x 40 x 180', bom: { 'Seite': { s: '38', q: 2 }, 'Oben/Unten TV': { s: '180', q: 2 }, 'Mitte TV': { s: '38', q: 2 } } },
  'Einzelkorpus': { dim: '64 x 40 x 60', bom: { 'Seite': { s: '64', q: 2 }, 'Oben/Unten': { s: '60', q: 2 } } },
  'Einzelkorpus (niedrig)': { dim: '38 x 40 x 60', bom: { 'Seite': { s: '38', q: 2 }, 'Oben/Unten': { s: '60', q: 2 } } },
  'Einzelkorpus Schmal': { dim: '64 x 20 x 60', bom: { 'Seite': { s: '64s', q: 2 }, 'Oben/Unten': { s: '60s', q: 2 } } },
  'Einzelkorpus Schmal (niedrig)': { dim: '38 x 20 x 60', bom: { 'Seite': { s: '38s', q: 2 }, 'Oben/Unten': { s: '60s', q: 2 } } }
};

const BESTA_KORPUS_CATEGORIES = {
  'Einzelkorpus': ['Einzelkorpus', 'Einzelkorpus (niedrig)', 'Einzelkorpus Schmal', 'Einzelkorpus Schmal (niedrig)'],
  'Sideboard': ['Sideboard', 'Sideboard (niedrig)', 'Sideboard Schmal', 'Sideboard Schmal (niedrig)', 'Sideboard TV'],
  'Longboard': ['Longboard', 'Longboard (niedrig)', 'Longboard TV', 'Longboard TV (niedrig)'],
  'Highboard / Hochschrank': ['Highboard', 'Hochschrank']
};

const BESTA_BOM = {};
Object.entries(BESTA_KORPUS_MODELS).forEach(([name, def]) => {
  BESTA_BOM[name] = def.bom;
  BESTA_BOM[def.dim] = def.bom;
  BESTA_BOM[def.dim.replace(/\s+/g, '')] = def.bom;
});

const DEFAULT_IMAGE_CATEGORIES = ['Türen Bilder', 'Korpus Bilder', 'Farbbilder', 'Set Bilder', 'Sonstige'];

const state = { 
  page:'new', sellCart:[], psMode:'pct', open:[], 
  openFilters:{text:'',group:'',type:'',article:'',size:'',color:''}, 
  sellSelection:{group:'',type:'',article:'',size:'',color:''}, 
  sold:[], soldFilter:'', termine:[], year:'ALL', deletedIds:[], deletedGroups:[], 
  master:{
    catalog:{}, badgeRules:[], groupLogos:{}, typeLogos:{}, articleLogos:{}, 
    images:[], imageCategories:[...DEFAULT_IMAGE_CATEGORIES], categorizedImages:{}, 
    colorImages:{}, doorOVP:{}, setRules:[...DEFAULT_SET_RULES], favoriteSpots:[...DEFAULT_FAVORITE_SPOTS]
  }, 
  openCollapse:{}, hideZero:false 
};

let globalExpandState=false, db=null, imagePickCallback=null, activeImageCategoryFilter='Alle';
const DB_NAME='amp3db', DB_VER=1, STORE='data';

window.bestaHideZero = false;
window.bestaActiveTab = 'tueren';
window.bestaTuerColors = {};
window.bestaGlobalKorpusColor = 'Weiß';

function openDB(){ return new Promise((res,rej)=>{ if(db){res(db);return;} const req=indexedDB.open(DB_NAME,DB_VER); req.onupgradeneeded=e=>e.target.result.createObjectStore(STORE); req.onsuccess=e=>{db=e.target.result;res(db);}; req.onerror=e=>rej(e.target.error); }); }
function save(){ const pl={open:state.open,sold:state.sold,termine:state.termine,master:state.master,year:state.year,deletedIds:state.deletedIds,deletedGroups:state.deletedGroups}; try{localStorage.setItem('amp3',JSON.stringify(pl));}catch(e){} openDB().then(database=>{ const tx=database.transaction(STORE,'readwrite'); tx.objectStore(STORE).put(pl,'state'); }).catch(()=>{}); }
function load(){ openDB().then(database=>{ const tx=database.transaction(STORE,'readonly'); const req=tx.objectStore(STORE).get('state'); req.onsuccess=e=>{ if(e.target.result) applyState(e.target.result); else{try{const ls=JSON.parse(localStorage.getItem('amp3'));if(ls)applyState(ls);}catch(e){}} initApp(); }; req.onerror=()=>fallbackLoad(); }).catch(()=>fallbackLoad()); }
function fallbackLoad(){ try{const ls=JSON.parse(localStorage.getItem('amp3'));if(ls)applyState(ls);}catch(e){} initApp(); }

function isValidImage(url){ if(!url||typeof url!=='string')return false; const s=url.trim(); if(s.startsWith('http'))return true; if(s.startsWith('data:image/'))return s.length>500&&s.includes(';base64,'); return false; }
function compressImage(file, callback){ const reader=new FileReader(); reader.onload=e=>{ const img=new Image(); img.onload=()=>{ const canvas=document.createElement('canvas'); let w=img.width,h=img.height; const MAX=300; if(w>h&&w>MAX){h=Math.round(h*MAX/w);w=MAX;}else if(h>MAX){w=Math.round(w*MAX/h);h=MAX;} canvas.width=w; canvas.height=h; canvas.getContext('2d').drawImage(img,0,0,w,h); callback(canvas.toDataURL('image/jpeg',0.5)); }; img.src=e.target.result; }; reader.readAsDataURL(file); }

function getEntityImage(grp, pt, art){ 
  const m = state.master; 
  if(grp && pt && art && m.articleLogos && isValidImage(m.articleLogos[`${grp}||${pt}||${art}`])) return m.articleLogos[`${grp}||${pt}||${art}`]; 
  if(grp && pt && !art && m.typeLogos && isValidImage(m.typeLogos[`${grp}||${pt}`])) return m.typeLogos[`${grp}||${pt}`]; 
  if(grp && !pt && !art && m.groupLogos && isValidImage(m.groupLogos[grp])) return m.groupLogos[grp]; 
  return ''; 
}

window.switchPage = function(pageName){
  state.page = pageName;
  window.render();
};
window.toggleTheme = function(){ document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'); };

function ensureCatalogIntegrity(){
  if(!state.master) state.master={};
  if(!state.master.catalog||typeof state.master.catalog!=='object') state.master.catalog={};
  if(!state.master.articleLogos) state.master.articleLogos={};
  if(!state.master.typeLogos) state.master.typeLogos={};
  if(!state.master.groupLogos) state.master.groupLogos={};
  if(!state.master.colorImages) state.master.colorImages={};
  if(!state.master.doorOVP) state.master.doorOVP={};
  if(!Array.isArray(state.master.images)) state.master.images=[];
  if(!Array.isArray(state.master.imageCategories) || state.master.imageCategories.length===0) state.master.imageCategories=[...DEFAULT_IMAGE_CATEGORIES];
  if(!state.master.categorizedImages || typeof state.master.categorizedImages!=='object') state.master.categorizedImages={};
  if(!Array.isArray(state.master.setRules) || state.master.setRules.length===0) state.master.setRules = [...DEFAULT_SET_RULES];
  
  if(state.master.images.length > 0 && Object.keys(state.master.categorizedImages).length === 0){
    state.master.categorizedImages['Sonstige'] = [...state.master.images];
  }
  if(!state.master.catalog.Besta) state.master.catalog.Besta={};
  if(!state.master.catalog.Besta['Tür']) state.master.catalog.Besta['Tür']={articles:[...DEFAULT_BESTA_TUEREN],sizes:['64','38','26'],colors:['Weiß','Schwarzbraun']};
  if(!state.master.catalog.Besta['Korpus Bauteil']) state.master.catalog.Besta['Korpus Bauteil']={articles:['Seite','Oben/Unten','Oben/Unten TV','Mitte','Mitte TV'],sizes:[],colors:['Weiß','Schwarzbraun']};
  if(!Array.isArray(state.master.favoriteSpots) || state.master.favoriteSpots.length === 0) state.master.favoriteSpots = [...DEFAULT_FAVORITE_SPOTS];
}

// ==================== BILD-VERWALTUNG & UPLOAD-POOL ====================
window.setGroupLogo = function(grp){
  imagePickCallback = url => {
    if(!state.master.groupLogos) state.master.groupLogos = {};
    state.master.groupLogos[grp] = url;
    save(); window.autoSaveToCloud?.();
    window.updateMasterForm(); window.renderAllQuick(); window.renderMaster(); window.renderOpenFilters(); window.renderSellQuick();
    toast(`Logo für Gruppe "${grp}" gespeichert ✓`);
  };
  window.openImagePicker(state.master.groupLogos?.[grp] || '', 'Sonstige');
};

window.addNewImageCategory = function(){
  const val = prompt('Name der neuen Bild-Gruppe:');
  if(!val || !val.trim()) return;
  const cat = val.trim();
  if(!state.master.imageCategories.includes(cat)){
    state.master.imageCategories.push(cat);
    if(!state.master.categorizedImages[cat]) state.master.categorizedImages[cat] = [];
    save(); window.autoSaveToCloud?.();
    window.renderMasterImageSection();
    window.renderImagePickerCategories();
    toast(`Gruppe "${cat}" angelegt ✓`);
  }
};

window.openImagePicker = function(currentUrl = '', preferredCategory = ''){
  const m = g('imagePickerModal'); if(!m) return;
  activeImageCategoryFilter = preferredCategory || 'Alle';
  window.renderImagePickerCategories();
  window.renderImagePickerGrid(currentUrl);
  m.classList.add('show'); m.style.display = 'flex';
};

window.closeImagePicker = function(){ 
  const m = g('imagePickerModal'); 
  if(m){ m.classList.remove('show'); m.style.display = 'none'; } 
};

window.selectPoolImage = function(url){ 
  if(imagePickCallback){ imagePickCallback(url); }
  window.closeImagePicker(); 
};

window.renderImagePickerCategories = function(){
  const cCont = g('imagePickerCategoryChips'), sEl = g('modalUploadTargetCat');
  const cats = state.master.imageCategories || DEFAULT_IMAGE_CATEGORIES;
  
  if(cCont){
    cCont.innerHTML = ['Alle', ...cats].map(c => `
      <span class="chip ${c===activeImageCategoryFilter?'active':''}" onclick="window.setImagePickerFilter('${safeJsStr(c)}')">${esc(c)}</span>
    `).join('');
  }
  if(sEl){
    sEl.innerHTML = cats.map(c => `<option value="${esc(c)}" ${c===activeImageCategoryFilter?'selected':''}>Zu: ${esc(c)}</option>`).join('');
  }
};

window.setImagePickerFilter = function(cat){
  activeImageCategoryFilter = cat;
  window.renderImagePickerCategories();
  window.renderImagePickerGrid();
};

window.renderImagePickerGrid = function(currentUrl = ''){
  const l = g('imagePickerList'); if(!l) return;
  let displayImages = [];
  const cats = state.master.categorizedImages || {};

  if(activeImageCategoryFilter === 'Alle'){
    const set = new Set();
    Object.values(cats).forEach(arr => (arr||[]).forEach(u => set.add(u)));
    (state.master.images||[]).forEach(u => set.add(u));
    displayImages = Array.from(set).filter(isValidImage);
  } else {
    displayImages = (cats[activeImageCategoryFilter] || []).filter(isValidImage);
  }

  if(displayImages.length === 0){
    l.innerHTML = '<div class="empty" style="grid-column:1/-1;">Keine Bilder in dieser Gruppe vorhanden. Lade oben ein neues Bild hoch!</div>';
    return;
  }

  l.innerHTML = displayImages.map(u => `
    <div class="img-pick-item" style="border-color:${u===currentUrl?'var(--primary)':'var(--border)'};" onclick="window.selectPoolImage('${safeJsStr(u)}')">
      <img src="${u}" loading="lazy">
    </div>
  `).join('');
};

window.handleSingleModalUpload = function(file){
  if(!file) return;
  const targetCat = gVal('modalUploadTargetCat') || (activeImageCategoryFilter !== 'Alle' ? activeImageCategoryFilter : 'Sonstige');
  compressImage(file, u => {
    if(!state.master.images) state.master.images = [];
    state.master.images.unshift(u);

    if(!state.master.categorizedImages) state.master.categorizedImages = {};
    if(!state.master.categorizedImages[targetCat]) state.master.categorizedImages[targetCat] = [];
    state.master.categorizedImages[targetCat].unshift(u);

    save(); window.autoSaveToCloud?.();
    toast(`Bild zu "${targetCat}" hinzugefügt ✓`);
    
    if(imagePickCallback){
      imagePickCallback(u);
      window.closeImagePicker();
    } else {
      window.renderImagePickerGrid(u);
    }
    window.renderMasterImageSection();
  });
};

window.handleMasterDirectUpload = function(file){
  if(!file) return;
  const targetCat = gVal('masterUploadTargetCat') || 'Sonstige';
  compressImage(file, u => {
    if(!state.master.images) state.master.images = [];
    state.master.images.unshift(u);

    if(!state.master.categorizedImages) state.master.categorizedImages = {};
    if(!state.master.categorizedImages[targetCat]) state.master.categorizedImages[targetCat] = [];
    state.master.categorizedImages[targetCat].unshift(u);

    save(); window.autoSaveToCloud?.();
    toast(`Bild direkt zu "${targetCat}" hochgeladen ✓`);
    window.renderMasterImageSection();
  });
};

window.setArticleLogo = function(grp, typ, art){
  imagePickCallback = url => {
    if(!state.master.articleLogos) state.master.articleLogos = {};
    state.master.articleLogos[`${grp}||${typ}||${art}`] = url;
    save(); window.autoSaveToCloud?.();
    window.renderBestaManager(); window.renderOpen();
    toast(`Bild für "${art}" gespeichert ✓`);
  };
  window.openImagePicker(getEntityImage(grp, typ, art), 'Türen Bilder');
};

window.setBestaKorpusImage = function(modelName){
  imagePickCallback = url => {
    if(!state.master.articleLogos) state.master.articleLogos = {};
    state.master.articleLogos[`Besta||Korpus||${modelName}`] = url;
    save(); 
    window.autoSaveToCloud?.();
    window.renderBestaManager();
    toast(`Bild für Korpus "${modelName}" gespeichert ✓`);
  };
  window.openImagePicker(getEntityImage('Besta', 'Korpus', modelName), 'Korpus Bilder');
};

window.uploadColorSwatch = function(colorName){
  const norm = String(colorName || '').toLowerCase().trim();
  imagePickCallback = url => {
    if(!state.master.colorImages) state.master.colorImages = {};
    state.master.colorImages[norm] = url;
    save(); window.autoSaveToCloud?.();
    window.renderBestaManager();
    toast(`Farbmuster gespeichert ✓`);
  };
  window.openImagePicker(state.master.colorImages?.[norm] || '', 'Farbbilder');
};

window.openSellSetImgPicker = function(){ 
  imagePickCallback = url => { 
    const v = g('sellSetImgValue'), p = g('sellSetImgPreview'), l = g('sellSetImgLabel'); 
    if(v) v.value = url; 
    if(p) p.innerHTML = url ? `<img src="${url}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;">` : '🖼'; 
    if(l) l.textContent = url ? 'Set-Bild gewählt ✓' : 'Set-Bild wählen…'; 
  }; 
  window.openImagePicker(gVal('sellSetImgValue'), 'Set Bilder'); 
};

let activeMasterCatView = 'Türen Bilder';
window.renderMasterImageSection = function(){
  const bCont = g('masterImageCategoriesBar'), gCont = g('masterImagesGrid'), uSel = g('masterUploadTargetCat');
  const cats = state.master.imageCategories || DEFAULT_IMAGE_CATEGORIES;
  if(!cats.includes(activeMasterCatView)) activeMasterCatView = cats[0] || 'Türen Bilder';

  if(bCont){
    bCont.innerHTML = cats.map(c => `
      <span class="chip ${c===activeMasterCatView?'active':''}" onclick="window.switchMasterCatView('${safeJsStr(c)}')">${esc(c)}</span>
    `).join('');
  }

  if(uSel){
    uSel.innerHTML = cats.map(c => `<option value="${esc(c)}" ${c===activeMasterCatView?'selected':''}>${esc(c)}</option>`).join('');
  }

  if(gCont){
    const imgs = (state.master.categorizedImages?.[activeMasterCatView] || []).filter(isValidImage);
    if(imgs.length === 0){
      gCont.innerHTML = `<div class="empty" style="grid-column:1/-1;">Keine Bilder in "${activeMasterCatView}".</div>`;
    } else {
      gCont.innerHTML = imgs.map((u, idx) => `
        <div class="img-pick-item" style="position:relative;">
          <img src="${u}">
          <button type="button" class="btn btn-danger" style="position:absolute; top:4px; right:4px; padding:2px 5px; font-size:10px;" onclick="window.deleteImageFromCategory('${safeJsStr(activeMasterCatView)}', ${idx})">✕</button>
        </div>
      `).join('');
    }
  }
};

window.switchMasterCatView = function(cat){ activeMasterCatView = cat; window.renderMasterImageSection(); };
window.deleteImageFromCategory = function(cat, idx){
  if(!confirm('Bild aus dieser Gruppe entfernen?')) return;
  state.master.categorizedImages[cat].splice(idx, 1);
  save(); window.autoSaveToCloud?.(); window.renderMasterImageSection(); toast('Bild entfernt ✓');
};

// ==================== BESTA INVENTAR & BOM ====================
function getBestaComp(p,s,c){
  const cl=String(c||'').toLowerCase().trim(), artMatch=String(p).toLowerCase().trim();
  return state.open.reduce((sum,i)=>{
    if(i && i.group==='Besta' && (i.productType||'').toLowerCase().includes('bauteil')){
      if(String(i.article||'').toLowerCase().trim()===artMatch && String(i.size||'').trim()===String(s).trim() && String(i.color||'').toLowerCase().trim()===cl){
        return sum + (i.instances ? i.instances.length : 0);
      }
    }
    return sum;
  },0);
}

function getBestaPoss(m,c){
  const r=BESTA_BOM[m]; if(!r) return 0;
  let min=Infinity;
  for(const[p,d] of Object.entries(r)){
    min=Math.min(min,Math.floor(getBestaComp(p,d.s,c)/d.q));
  }
  return min===Infinity?0:min;
}

function addBestaInst(p,s,c,q,ek=0,ps=false,def=''){
  for(let i=0;i<q;i++){
    const pl={group:'Besta',productType:'Korpus Bauteil',article:p,size:s,color:c,defect:def,purchasePrice:ek,profitshare:ps,entryDate:today()};
    const k=stackKey(pl);
    let ex=state.open.find(x=>stackKey(x)===k);
    const inst={id:uid(),purchasePrice:ek,profitshare:ps,entryDate:today(),defect:def};
    if(ex) ex.instances.push(inst);
    else state.open.unshift({id:uid(),...pl,instances:[inst]});
  }
}

function remBestaInst(p,s,c,q){
  const cl=String(c||'').toLowerCase().trim(), artMatch=String(p).toLowerCase().trim();
  let ex=state.open.find(x=>x && x.group==='Besta' && (x.productType||'').toLowerCase().includes('bauteil') && String(x.article||'').toLowerCase().trim()===artMatch && String(x.size||'').trim()===String(s).trim() && String(x.color||'').toLowerCase().trim()===cl);
  if(ex && ex.instances){
    for(let i=0;i<q && ex.instances.length>0;i++) ex.instances.pop();
  }
}

window.increaseBestaKorpus = function(model, color){
  const c = color || window.bestaGlobalKorpusColor || 'Weiß';
  const bom = BESTA_BOM[model]; if(!bom) return;
  for(const [p, d] of Object.entries(bom)){ addBestaInst(p, d.s, c, d.q, 0, false, ''); }
  save(); window.autoSaveToCloud?.(); window.renderBestaManager(); window.renderOpen();
  toast(`+1 ${model} (${c}) aufgebaut ✓`);
};

window.reduceBestaKorpus = function(model, color){
  const c = color || window.bestaGlobalKorpusColor || 'Weiß';
  const poss = getBestaPoss(model, c);
  if(poss <= 0) return toast(`Kein ${model} (${c}) vorhanden.`);
  const bom = BESTA_BOM[model]; if(!bom) return;
  for(const [p, d] of Object.entries(bom)){ remBestaInst(p, d.s, c, d.q); }
  save(); window.autoSaveToCloud?.(); window.renderBestaManager(); window.renderOpen();
  toast(`−1 ${model} (${c}) abgebaut ✓`);
};

window.deleteBestaTuerColor = function(art, color){
  if(!confirm(`Farbe "${color}" bei "${art}" wirklich entfernen?`)) return;
  const cl = String(color).toLowerCase().trim();
  const bCat = state.master?.catalog?.Besta?.['Tür'];
  if(bCat){
    if(!bCat.articleData) bCat.articleData = {};
    if(!bCat.articleData[art]){
      const currentList = Array.from(new Set([...(bCat.colors || ['Weiß','Schwarzbraun'])]));
      bCat.articleData[art] = { sizes: ['64','38','26'], colors: currentList.filter(c => String(c).toLowerCase().trim() !== cl) };
    } else {
      bCat.articleData[art].colors = (bCat.articleData[art].colors || []).filter(c => String(c).toLowerCase().trim() !== cl);
    }
  }
  state.open = state.open.filter(i => !(i && i.group === 'Besta' && (i.productType||'').toLowerCase().includes('tür') && i.article === art && String(i.color||'').toLowerCase().trim() === cl));
  if(window.bestaTuerColors[art] === color){ delete window.bestaTuerColors[art]; }
  save(); window.autoSaveToCloud?.(); window.renderBestaManager(); window.renderOpen(); toast('Farbe entfernt ✓');
};

window.changeBestaTuerQty = function(art,sz,c,d){
  const col = c || 'Weiß'; const cl = String(col).toLowerCase().trim();
  let ex = state.open.find(x => x && x.group==='Besta' && (x.productType||'').toLowerCase().includes('tür') && x.article===art && String(x.size||'').trim()===String(sz).trim() && String(x.color||'').toLowerCase().trim()===cl);
  if(d > 0){
    const inst = { id: uid(), purchasePrice: 0, profitshare: false, entryDate: today() };
    if(ex) ex.instances.push(inst);
    else state.open.unshift({ id: uid(), group: 'Besta', productType: 'Tür', article: art, size: sz, color: col, purchasePrice: 0, profitshare: false, instances: [inst] });
    toast(`+1 ${art} (${col}, Gr. ${sz})`);
  } else if(d < 0 && ex && ex.instances && ex.instances.length > 0){
    ex.instances.pop(); toast(`-1 ${art} (${col}, Gr. ${sz})`);
  }
  save(); window.renderBestaManager();
};

window.updateDoorOVP = function(art, sz, val){
  if(!state.master.doorOVP) state.master.doorOVP = {};
  const key = `${art}_${sz}`;
  const num = parseFloat(String(val||'').replace('€','').replace(',','.').trim()) || 0;
  if(num > 0) state.master.doorOVP[key] = num;
  else delete state.master.doorOVP[key];
  save(); window.autoSaveToCloud?.();
};

window.onOvpFocus = function(el){ el.value = el.value.replace(' €','').replace('€','').trim(); el.select(); };
window.onOvpBlur = function(art, sz, el){
  const key = `${art}_${sz}`;
  window.updateDoorOVP(art, sz, el.value);
  const val = state.master?.doorOVP?.[key];
  el.value = val ? `${val % 1 === 0 ? val : val.toFixed(2).replace('.', ',')} €` : '';
};

window.toggleBestaKorpusPs = function(){
  const btn = g('bestaQuickPsBtn'); const val = g('bestaQuickPs'); if(!btn || !val) return;
  const isPs = val.value === 'true'; val.value = isPs ? 'false' : 'true';
  btn.classList.toggle('active', !isPs); btn.textContent = !isPs ? '🤝 PS: An' : '🤝 PS: Aus';
};

window.addBestaKorpusDirect = function(){
  const m = gVal('bestaQuickModel'); const q = parseInt(gVal('bestaQuickQty')) || 1;
  const c = window.bestaGlobalKorpusColor || 'Weiß';
  const totalEk = parseFloat(gVal('bestaQuickPrice').replace(',', '.')) || 0;
  const isPs = gVal('bestaQuickPs') === 'true';

  if(!m) return toast('Bitte Modell wählen.');
  const bom = BESTA_BOM[m]; if(!bom) return;
  let totalParts = 0; for(const part of Object.values(bom)) totalParts += part.q;
  const pieceEk = totalParts > 0 ? (totalEk / totalParts) : 0;

  for(const [p, d] of Object.entries(bom)){ addBestaInst(p, d.s, c, d.q * q, pieceEk, isPs, ''); }
  save(); window.renderBestaManager(); window.renderOpen();
  toast(`${q}x ${m} (${c}) erfasst ✓`); const pin = g('bestaQuickPrice'); if(pin) pin.value = '';
};

window.changeBestaBauteilQty = function(p,s,d){
  if(d > 0){ addBestaInst(p,s,window.bestaGlobalKorpusColor,1); toast(`+1 ${p} (${s})`); }
  else { remBestaInst(p,s,window.bestaGlobalKorpusColor,1); toast(`-1 ${p} (${s})`); }
  save(); window.renderBestaManager();
};

window.toggleBestaHideZero = function(){ window.bestaHideZero=!window.bestaHideZero; window.renderBestaManager(); };
window.setBestaTab = function(tab){
  window.bestaActiveTab=tab;
  const bt=g('btn-besta-tueren'),bk=g('btn-besta-korpus'),vt=g('besta-tueren-view'),vk=g('besta-korpus-view');
  if(bt) bt.className=tab==='tueren'?'btn btn-primary':'btn btn-ghost';
  if(bk) bk.className=tab==='korpus'?'btn btn-primary':'btn btn-ghost';
  if(vt) vt.style.display=tab==='tueren'?'block':'none';
  if(vk) vk.style.display=tab==='korpus'?'block':'none';
  window.renderBestaManager();
};

window.onBestaTuerColorSelect = function(a,c){ window.bestaTuerColors[a]=c; window.renderBestaManager(); };
window.addBestaModel = function(){
  const v=prompt('Tür-Artikelname:'); if(!v||!v.trim())return; const m=v.trim();
  if(!state.master.catalog.Besta['Tür']) state.master.catalog.Besta['Tür']={articles:[],sizes:['64','38','26'],colors:['Weiß','Schwarzbraun']};
  if(!state.master.catalog.Besta['Tür'].articles.includes(m)){ state.master.catalog.Besta['Tür'].articles.push(m); state.master.catalog.Besta['Tür'].articles.sort(sortKeys); save(); window.renderBestaManager(); toast('Hinzugefügt ✓'); }
};
window.addBestaColorToArticle = function(a){
  const v=prompt(`Neue Farbe für ${a}:`); if(!v||!v.trim())return; const c=v.trim();
  const t=state.master.catalog.Besta['Tür']; if(!t.articleData) t.articleData={};
  if(!t.articleData[a]) t.articleData[a]={sizes:['64','38','26'],colors:['Weiß','Schwarzbraun']};
  if(!t.articleData[a].colors.includes(c)){ t.articleData[a].colors.push(c); t.articleData[a].colors.sort(sortKeys); window.bestaTuerColors[a]=c; save(); window.renderBestaManager(); toast('Farbe hinzugefügt ✓'); }
};
window.addBestaKorpusColor = function(){
  const v=prompt('Neue Korpus-Farbe:'); if(!v||!v.trim())return; const c=v.trim();
  if(!state.master.catalog.Besta['Korpus Bauteil']) state.master.catalog.Besta['Korpus Bauteil']={articles:['Seite','Oben/Unten','Oben/Unten TV','Mitte','Mitte TV'],sizes:[],colors:[]};
  if(!state.master.catalog.Besta['Korpus Bauteil'].colors.includes(c)){ state.master.catalog.Besta['Korpus Bauteil'].colors.push(c); state.master.catalog.Besta['Korpus Bauteil'].colors.sort(sortKeys); window.bestaGlobalKorpusColor=c; save(); window.renderBestaManager(); toast('Farbe hinzugefügt ✓'); }
};
window.onBestaKorpusColorChange = function(c){ window.bestaGlobalKorpusColor=c; window.renderBestaManager(); };

window.renderBestaManager = function(){
  try{
    const bCat = state.master?.catalog?.Besta || {};
    const defaultDoorColors = bCat['Tür']?.colors || ['Weiß', 'Schwarzbraun'];
    const ovpMap = state.master?.doorOVP || {};

    const tt = g('bestaTuerenTable');
    if(tt && window.bestaActiveTab === 'tueren'){
      const allSzs = ['64','38','26'];
      const dArts = new Set(DEFAULT_BESTA_TUEREN);
      const dc = {};

      if(bCat['Tür']?.articles) bCat['Tür'].articles.forEach(a => dArts.add(a));
      state.open.forEach(i => {
        if(i && i.group === 'Besta' && (i.productType||'').toLowerCase().includes('tür') && i.article){
          dArts.add(i.article);
          if(!dc[i.article]) dc[i.article] = new Set();
          if(i.color) dc[i.article].add(i.color);
        }
      });

      dArts.forEach(a => {
        if(!dc[a]) dc[a] = new Set();
        const artColors = bCat['Tür']?.articleData?.[a]?.colors;
        if(Array.isArray(artColors)){ artColors.forEach(c => dc[a].add(c)); }
        else { defaultDoorColors.forEach(c => dc[a].add(c)); }
      });

      const sArts = Array.from(dArts).sort(sortKeys);
      let visSzs = [...allSzs];
      if(window.bestaHideZero){
        visSzs = allSzs.filter(sz => sArts.some(art => {
          const sc = window.bestaTuerColors[art] || Array.from(dc[art]||[])[0] || 'Weiß';
          const scl = String(sc).toLowerCase().trim();
          return state.open.some(i => i && i.group==='Besta' && (i.productType||'').toLowerCase().includes('tür') && i.article===art && String(i.size||'').trim()===sz && String(i.color||'').toLowerCase().trim()===scl && (i.instances?.length>0));
        }));
      }

      let th = '<thead><tr><th style="width:70px;">Bild</th><th style="text-align:left;">Name <button type="button" class="btn-icon-subtle" style="padding:0; color:var(--primary); font-size:14px;" onclick="window.addBestaModel()">✚</button></th><th style="text-align:left;">Farbe</th>'+visSzs.map(s => `<th>Gr. ${s}<br><span style="font-size:9px;color:var(--muted);font-weight:normal;">Bestand / OVP</span></th>`).join('')+'</tr></thead>';
      let tb = '', rowIdx = 0;

      sArts.forEach(art => {
        const ac = Array.from(dc[art] || []).sort(sortKeys);
        if(!window.bestaTuerColors[art]){
          let bc = ac[0] || 'Weiß';
          for(let c of ac){
            if(state.open.some(i => i && i.group==='Besta' && (i.productType||'').toLowerCase().includes('tür') && i.article===art && String(i.color||'').toLowerCase().trim()===String(c).toLowerCase().trim() && (i.instances?.length>0))){
              bc = c; break;
            }
          }
          window.bestaTuerColors[art] = bc;
        }

        const sel = window.bestaTuerColors[art] || ac[0] || 'Weiß';
        const scl = String(sel).toLowerCase().trim();
        const cnts = {};
        let tR = 0;

        visSzs.forEach(s => {
          const c = state.open.reduce((sum,i) => (i && i.group==='Besta' && (i.productType||'').toLowerCase().includes('tür') && i.article===art && String(i.size||'').trim()===s && String(i.color||'').toLowerCase().trim()===scl)?sum+(i.instances?i.instances.length:0):sum, 0);
          cnts[s] = c; tR += c;
        });

        if(window.bestaHideZero && tR === 0) return;

        const al = getEntityImage('Besta','Tür',art);
        const imH = al ? `<img src="${al}" class="tuer-thumb-img" onclick="window.setArticleLogo('Besta','Tür','${safeJsStr(art)}')" title="Bild ändern">` : `<div class="tuer-thumb-placeholder" onclick="window.setArticleLogo('Besta','Tür','${safeJsStr(art)}')" title="Bild auswählen">📷</div>`;

        const cChips = ac.map(c => {
          const isAct = c === sel;
          const norm = String(c).toLowerCase().trim();
          const hasLogo = Boolean(state.master?.colorImages?.[norm]);
          const st = getColorStyle(c);

          return `<div class="color-dot-btn ${isAct?'active':''} ${hasLogo?'has-logo':''}" onclick="window.onBestaTuerColorSelect('${safeJsStr(art)}','${safeJsStr(c)}')"><span class="color-swatch-circle" style="${st}" title="${esc(c)}"></span>${hasLogo?'':`<span>${esc(c)}</span>`}<span class="color-btn-actions"><span class="color-btn-del" title="Farbe löschen" onclick="event.stopPropagation(); window.deleteBestaTuerColor('${safeJsStr(art)}','${safeJsStr(c)}')">✕</span><span class="color-btn-img" title="Muster wählen" onclick="event.stopPropagation(); window.uploadColorSwatch('${safeJsStr(c)}')">🖼</span></span></div>`;
        }).join('') + `<span class="chip" style="cursor:pointer; border-style:dashed;" onclick="window.addBestaColorToArticle('${safeJsStr(art)}')">✚</span>`;

        const qC = visSzs.map(s => {
          const rawOvp = ovpMap[`${art}_${s}`];
          const ovpDisplay = rawOvp ? `${rawOvp % 1 === 0 ? rawOvp : rawOvp.toFixed(2).replace('.', ',')} €` : '';
          return `
            <td style="white-space:nowrap;">
              <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                <div class="qty-ctrl ${cnts[s]===0 ? 'is-zero' : ''}">
                  <button type="button" onclick="window.changeBestaTuerQty('${safeJsStr(art)}','${s}','${safeJsStr(sel)}',-1)">-</button>
                  <span>${cnts[s]}</span>
                  <button type="button" onclick="window.changeBestaTuerQty('${safeJsStr(art)}','${s}','${safeJsStr(sel)}',1)">+</button>
                </div>
                <input type="text" inputmode="decimal" class="ovp-input" placeholder="OVP €" value="${ovpDisplay}" 
                       onfocus="window.onOvpFocus(this)" 
                       onblur="window.onOvpBlur('${safeJsStr(art)}','${s}',this)" 
                       onkeydown="if(event.key==='Enter') this.blur();"
                       title="OVP Neupreis">
              </div>
            </td>
          `;
        }).join('');

        const trBg = (rowIdx % 2 === 0) ? 'background:var(--surface2);' : 'background:transparent;';
        rowIdx++;
        tb += `<tr style="${trBg}" class="${tR === 0 ? 'is-zero' : ''}"><td>${imH}</td><td style="font-weight:800; font-size:1.15rem; text-align:left;">${esc(art)}</td><td style="text-align:left;"><div class="chips" style="gap:4px;">${cChips}</div></td>${qC}</tr>`;
      });

      tt.innerHTML = th + '<tbody>' + (tb || '<tr><td colspan="6" class="empty">Alle Türen 0.</td></tr>') + '</tbody>';
    }

    const kt = g('bestaKorpusTable'), bc = g('bestaBauteileContainer');
    if(kt && bc && window.bestaActiveTab === 'korpus'){
      const gc = new Set(['Weiß','Schwarzbraun']);
      state.open.forEach(i => { if(i && i.group==='Besta' && (i.productType||'').toLowerCase().includes('bauteil') && i.color) gc.add(i.color); });
      if(bCat['Korpus Bauteil']?.colors) bCat['Korpus Bauteil'].colors.forEach(c => gc.add(c));
      const gCA = Array.from(gc).sort(sortKeys);
      if(!gCA.includes(window.bestaGlobalKorpusColor)) window.bestaGlobalKorpusColor = gCA[0] || 'Weiß';

      const topBar = g('bestaKorpusTopBar');
      if(topBar){
        const mOpts = Object.keys(BESTA_KORPUS_MODELS).map(m => `<option value="${esc(m)}">${esc(m)} (${esc(BESTA_KORPUS_MODELS[m].dim)})</option>`).join('');
        const colorPills = gCA.map(c => `<div class="color-dot-btn ${c === window.bestaGlobalKorpusColor ? 'active' : ''}" onclick="window.onBestaKorpusColorChange('${safeJsStr(c)}')"><span class="color-swatch-circle" style="${getColorStyle(c)}"></span><b>${esc(c)}</b></div>`).join('');

        topBar.innerHTML = `<div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap;"><span style="font-size:12px; font-weight:800; color:var(--muted); text-transform:uppercase;">Aktive Korpus-Farbe:</span>${colorPills}<button type="button" class="btn btn-ghost" style="padding:3px 8px; font-size:11px;" onclick="window.addBestaKorpusColor()">✚ Neue Farbe</button></div><div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;"><div style="display:flex; align-items:center; gap:4px;"><span style="font-weight:800; font-size:12px; color:var(--text); white-space:nowrap;">Modell:</span><select id="bestaQuickModel" class="select" style="min-width:180px; padding:6px; font-size:12px;">${mOpts}</select></div><div style="display:flex; align-items:center; gap:4px;"><span style="font-weight:800; font-size:12px; color:var(--text); white-space:nowrap;">Anzahl:</span><input type="number" id="bestaQuickQty" class="input" style="width:50px; padding:6px; text-align:center; font-size:12px;" min="1" value="1"></div><div style="display:flex; align-items:center; gap:4px;"><span style="font-weight:800; font-size:12px; color:var(--text); white-space:nowrap;">EK (€):</span><input type="number" step="0.01" id="bestaQuickPrice" class="input" style="width:70px; padding:6px; font-size:12px;" placeholder="0.00"></div><span id="bestaQuickPsBtn" class="ps-badge-btn" style="padding:4px 10px; font-size:11px;" onclick="window.toggleBestaKorpusPs()">🤝 PS: Aus</span><input type="hidden" id="bestaQuickPs" value="false"><button type="button" class="btn btn-primary" style="width:auto; min-height:32px; padding:4px 12px; font-size:12px; font-weight:700; white-space:nowrap; margin-left:auto;" onclick="window.addBestaKorpusDirect()">✚ Einpflegen</button></div>`;
      }

      let kth = `<thead><tr><th style="width:70px;">Bild</th><th style="text-align:left;">Modell & Maße</th><th style="text-align:center;">Baubar (${esc(window.bestaGlobalKorpusColor)})</th><th style="text-align:right;">Status</th></tr></thead>`, ktb='', kRowIdx = 0;

      Object.keys(BESTA_KORPUS_MODELS).forEach(m => {
        const def = BESTA_KORPUS_MODELS[m], poss = getBestaPoss(m, window.bestaGlobalKorpusColor);
        if(window.bestaHideZero && poss === 0) return;
        const isZero = poss === 0;
        const al = getEntityImage('Besta','Korpus',m);
        const imH = al 
          ? `<img src="${al}" class="tuer-thumb-img" onclick="window.setBestaKorpusImage('${safeJsStr(m)}')" title="Bild ändern / uploaden">` 
          : `<div class="tuer-thumb-placeholder" onclick="window.setBestaKorpusImage('${safeJsStr(m)}')" title="Bild auswählen / hochladen">🗄</div>`;

        const trBg = (kRowIdx % 2 === 0) ? 'background:var(--surface2);' : 'background:transparent;';
        kRowIdx++;

        ktb += `<tr style="${trBg}" class="${isZero ? 'is-zero' : ''}"><td>${imH}</td><td style="text-align:left;"><div style="font-weight:800; font-size:1.15rem; color:var(--text);">${esc(m)}</div><div style="font-size:var(--text-xs); color:var(--muted);">${esc(def.dim)} cm</div></td><td style="text-align:center;"><div class="qty-ctrl ${isZero ? 'is-zero' : ''}"><button type="button" onclick="window.reduceBestaKorpus('${safeJsStr(m)}', '${safeJsStr(window.bestaGlobalKorpusColor)}')" title="1x abbauen">−</button><span style="min-width:32px;">${poss}</span><button type="button" onclick="window.increaseBestaKorpus('${safeJsStr(m)}', '${safeJsStr(window.bestaGlobalKorpusColor)}')" title="1x aufbauen">+</button></div></td><td style="text-align:right;"><span style="font-size:var(--text-xs); color:${poss>0?'var(--success)':'var(--muted)'}; font-weight:700;">${poss>0 ? '✓ Vorrätig' : '– Unvollständig'}</span></td></tr>`;
      });
      kt.innerHTML = kth + `<tbody>${ktb || '<tr><td colspan="4" class="empty">Aus den vorhandenen Einzelteilen ist aktuell kein vollständiger Korpus baubar.</td></tr>'}</tbody>`;

      const psz = {'Seite':['193','128','64','64s','38','38s'],'Oben/Unten':['180','120','120s','60','60s'],'Oben/Unten TV':['180','120'],'Mitte':['64','64s','38','38s'],'Mitte TV':['64','38']};
      let bHtml = '';
      Object.keys(psz).forEach(p => {
        bHtml += `<div style="margin-bottom:12px;background:var(--surface2);padding:10px;border-radius:8px;border:1px solid var(--border);"><div style="font-weight:800;color:var(--text);margin-bottom:8px;font-size:13px;text-transform:uppercase;">${p} (${esc(window.bestaGlobalKorpusColor)})</div><div style="display:flex;gap:10px;flex-wrap:wrap;">`;
        let hA = false;
        psz[p].forEach(sz => {
          const cnt = getBestaComp(p, sz, window.bestaGlobalKorpusColor);
          if(window.bestaHideZero && cnt === 0) return;
          hA = true;
          bHtml += `<div style="display:flex;align-items:center;gap:6px;background:var(--bg);padding:4px 8px;border-radius:6px;border:1px solid var(--border);" class="${cnt===0 ? 'is-zero' : ''}"><span style="font-size:12px;font-weight:700;color:var(--muted);width:45px;">Gr. ${sz}</span><div class="qty-ctrl"><button type="button" onclick="window.changeBestaBauteilQty('${p}','${sz}',-1)">-</button><span>${cnt}</span><button type="button" onclick="window.changeBestaBauteilQty('${p}','${sz}',1)">+</button></div></div>`;
        });
        if(!hA) bHtml += '<div class="muted" style="font-size:12px;">Keine Bestände in dieser Farbe vorhanden.</div>';
        bHtml += '</div></div>';
      });
      bc.innerHTML = bHtml;
    }
  }catch(err){console.error(err);}
};

// ==================== FORMULAR NEU ====================
window.renderAllQuick = function(){
  try{
    const gv=gVal('group'), pv=gVal('productType'), av=gVal('article');
    const fpt=g('field-productType'); if(fpt)fpt.style.display=gv?'grid':'none';
    const fa=g('field-article'); if(fa)fa.style.display=(gv&&pv)?'grid':'none'; 
    const ag=new Set(Object.keys(state.master.catalog||{})); state.open.forEach(i=>{if(i.group)ag.add(i.group);}); renderQChips('group',Array.from(ag).sort(sortKeys),gv);
    const at=new Set(); if(gv&&state.master.catalog[gv])Object.keys(state.master.catalog[gv]).forEach(t=>at.add(t)); state.open.forEach(i=>{if(i.group===gv&&i.productType)at.add(i.productType);}); renderQChips('productType',Array.from(at).sort(sortKeys),pv);
    const aa=new Set(); if(gv&&pv&&state.master.catalog[gv]&&state.master.catalog[gv][pv]&&state.master.catalog[gv][pv].articles) state.master.catalog[gv][pv].articles.forEach(a=>aa.add(a)); state.open.forEach(i=>{if(i.group===gv&&i.productType===pv&&i.article)aa.add(i.article);}); renderQChips('article',Array.from(aa).sort(sortKeys),av);
    const na=aa.size>0, ssc=gv&&pv&&(!na||av), fsc=g('field-size-color'); if(fsc)fsc.style.display=ssc?'grid':'none';
    const sz=new Set(), cl=new Set(); if(ssc){ const tg=state.master.catalog[gv]?.[pv]||{}; if(na&&av){if(tg.articleData&&tg.articleData[av]){(tg.articleData[av].sizes||[]).forEach(s=>sz.add(s));(tg.articleData[av].colors||[]).forEach(c=>cl.add(c));}}else if(!na){(tg.sizes||[]).forEach(s=>sz.add(s));(tg.colors||[]).forEach(c=>cl.add(c));} state.open.forEach(i=>{if(i.group===gv&&i.productType===pv){if(!na||i.article===av){if(i.size)sz.add(i.size);if(i.color)cl.add(i.color);}}}); }
    renderQChips('size',Array.from(sz).sort(sortKeys),gVal('size')); renderQChips('color',Array.from(cl).sort(sortKeys),gVal('color'));
  }catch(e){console.error(e);}
};

function renderQChips(id, vals, sel){
  const sEl = g(id); if(sEl){ fillSel(sEl, vals, ''); sEl.value = sel || ''; }
  const cont = g(`qb-${id}`); if(!cont) return;
  const lvl = id === 'group' ? 'grp' : (id === 'productType' ? 'typ' : (id === 'article' ? 'art' : 'var'));
  
  let html = (vals || []).map(v => {
    const isAct = v === sel;
    let img = '';
    if(id === 'group' && state.master.groupLogos && isValidImage(state.master.groupLogos[v])) {
      img = `<img src="${state.master.groupLogos[v]}" class="grp-logo-thumb">`;
    }
    return `<div class="qb-chip lvl-${lvl} ${isAct ? 'active' : ''}" onclick="window.selectFormChip('${id}', '${safeJsStr(v)}')">${img}<span>${esc(v)}</span></div>`;
  }).join('');

  html += `<div class="qb-chip qb-add" onclick="window.promptAddNewChip('${id}')" style="cursor:pointer; border-style:dashed; color:var(--primary); font-weight:bold;"><span>✚ Neu</span></div>`;
  cont.innerHTML = html;
}

window.selectFormChip = function(id, val){
  const el = g(id); if(!el) return;
  el.value = (el.value === val) ? '' : val;
  if(id === 'group'){
    const pt = g('productType'); if(pt) pt.value = '';
    const ar = g('article'); if(ar) ar.value = '';
    const sz = g('size'); if(sz) sz.value = '';
    const cl = g('color'); if(cl) cl.value = '';
  } else if(id === 'productType'){
    const ar = g('article'); if(ar) ar.value = '';
    const sz = g('size'); if(sz) sz.value = '';
    const cl = g('color'); if(cl) cl.value = '';
  } else if(id === 'article'){
    const sz = g('size'); if(sz) sz.value = '';
    const cl = g('color'); if(cl) cl.value = '';
  }
  window.renderAllQuick();
};

window.promptAddNewChip = function(type){
  if(!state.master) state.master = {};
  if(!state.master.catalog) state.master.catalog = {};
  const cat = state.master.catalog;

  if(type === 'group'){
    const val = prompt('Neue Gruppe:'); if(!val || !val.trim()) return;
    const v = val.trim(); if(!cat[v]) cat[v] = {};
    save(); window.autoSaveToCloud?.(); g('group').value = v; window.renderAllQuick(); toast(`Gruppe "${v}" hinzugefügt`);
  } else if(type === 'productType'){
    const grp = gVal('group'); if(!grp) return toast('Bitte zuerst Gruppe wählen.');
    const val = prompt(`Neuer Produkttyp für "${grp}":`); if(!val || !val.trim()) return;
    const v = val.trim(); if(!cat[grp]) cat[grp] = {}; if(!cat[grp][v]) cat[grp][v] = { articles: [], sizes: [], colors: [] };
    save(); window.autoSaveToCloud?.(); g('productType').value = v; window.renderAllQuick(); toast(`Produkttyp "${v}" hinzugefügt`);
  } else if(type === 'article'){
    const grp = gVal('group'), typ = gVal('productType'); if(!grp || !typ) return toast('Bitte Gruppe & Typ wählen.');
    const val = prompt('Neuer Artikelname:'); if(!val || !val.trim()) return;
    const v = val.trim(); if(!cat[grp]) cat[grp] = {}; if(!cat[grp][typ]) cat[grp][typ] = { articles: [], sizes: [], colors: [] };
    if(!cat[grp][typ].articles) cat[grp][typ].articles = [];
    if(!cat[grp][typ].articles.includes(v)){ cat[grp][typ].articles.push(v); cat[grp][typ].articles.sort(sortKeys); }
    save(); window.autoSaveToCloud?.(); g('article').value = v; window.renderAllQuick(); toast(`Artikel "${v}" hinzugefügt`);
  } else if(type === 'size' || type === 'color'){
    const grp = gVal('group'), typ = gVal('productType'), art = gVal('article'); if(!grp || !typ) return toast('Bitte Gruppe & Typ wählen.');
    const label = type === 'size' ? 'Größe (z.B. 60x60)' : 'Farbe (z.B. Weiß)';
    const val = prompt(`Neuer Wert für ${label}:`); if(!val || !val.trim()) return;
    const v = val.trim(); if(!cat[grp]) cat[grp] = {}; if(!cat[grp][typ]) cat[grp][typ] = { articles: [], sizes: [], colors: [] };
    let target = cat[grp][typ];
    if(art){
      if(!target.articleData) target.articleData = {};
      if(!target.articleData[art]) target.articleData[art] = { sizes: [], colors: [] };
      target = target.articleData[art];
    }
    const list = type === 'size' ? (target.sizes = target.sizes || []) : (target.colors = target.colors || []);
    if(!list.includes(v)){ list.push(v); list.sort(sortKeys); }
    save(); window.autoSaveToCloud?.(); g(type).value = v; window.renderAllQuick(); toast('Gespeichert ✓');
  }
};

window.onGroupChange = function(){ const pt=g('productType'); if(pt)pt.value=''; const ar=g('article'); if(ar)ar.value=''; window.renderAllQuick(); };
window.onProductTypeChange = function(){ const ar=g('article'); if(ar)ar.value=''; window.renderAllQuick(); };
window.onArticleChange = function(){ window.renderAllQuick(); };

window.toggleProfitshareNew = function(){
  const b = g('profitshareBtn'), v = g('profitshare'); if(!b || !v) return;
  const isPs = v.value === 'true'; v.value = isPs ? 'false' : 'true';
  b.classList.toggle('active', !isPs); b.textContent = !isPs ? '🤝 Profitshare: An' : '🤝 Profitshare: Aus';
};

window.resetItemForm = function(){
  const f = g('itemForm'); if(f) f.reset();
  const ps = g('profitshare'), psb = g('profitshareBtn');
  if(ps) ps.value = 'false';
  if(psb) { psb.classList.remove('active'); psb.textContent = '🤝 Profitshare: Aus'; }
  ['group','productType','article','size','color'].forEach(id => { const el = g(id); if(el) el.value = ''; });
  window.renderAllQuick();
};

const itemFrm = g('itemForm');
if(itemFrm){
  itemFrm.addEventListener('submit', e => {
    e.preventDefault();
    const grp = gVal('group'), typ = gVal('productType'), art = gVal('article');
    const sz = gVal('size'), col = gVal('color');
    const ek = parseFloat(gVal('purchasePrice').replace(',', '.')) || 0;
    const qty = parseInt(gVal('quantity')) || 1;
    const def = gVal('defect').trim();
    const ps = gVal('profitshare') === 'true';

    if(!grp) return toast('Bitte Gruppe wählen.');
    const pl = { group: grp, productType: typ, article: art, size: sz, color: col, defect: def, purchasePrice: ek, profitshare: ps, entryDate: today() };
    const k = stackKey(pl);
    let ex = state.open.find(x => stackKey(x) === k);

    for(let i=0; i<qty; i++){
      const inst = { id: uid(), purchasePrice: ek, profitshare: ps, entryDate: today(), defect: def };
      if(ex) ex.instances.push(inst);
      else { ex = { id: uid(), ...pl, instances: [inst] }; state.open.unshift(ex); }
    }
    save(); window.autoSaveToCloud?.(); toast(`${qty}x eingepflegt ✓`); window.resetItemForm(); window.renderOpen();
  });
}

// ==================== BESTAND ====================
window.renderOpenFilters = function(){
  const f = state.openFilters;
  const ct = state.master.catalog || {};
  
  // 1. Gruppen ermitteln
  const ag = new Set(Object.keys(ct));
  state.open.forEach(i => { if(i.group) ag.add(i.group); });
  const gc = g('qb-open-group');
  if(gc){
    gc.innerHTML = Array.from(ag).sort(sortKeys).map(grp => `
      <div class="qb-chip lvl-grp ${f.group === grp ? 'active' : ''}" onclick="window.handleOpenFilterChip('group','${safeJsStr(grp)}')">
        ${(state.master.groupLogos && isValidImage(state.master.groupLogos[grp])) ? `<img src="${state.master.groupLogos[grp]}" class="grp-logo-thumb">` : ''}
        <span>${esc(grp)}</span>
      </div>
    `).join('');
  }

  // 2. Produkttypen
  const fpt = g('open-field-productType');
  if(fpt) fpt.style.display = f.group ? 'grid' : 'none';
  const tc = g('qb-open-productType');
  if(tc && f.group){
    const at = new Set();
    if(ct[f.group]) Object.keys(ct[f.group]).forEach(t => at.add(t));
    state.open.forEach(i => { if(i.group === f.group && i.productType) at.add(i.productType); });
    tc.innerHTML = Array.from(at).sort(sortKeys).map(t => `
      <div class="qb-chip lvl-typ ${f.type === t ? 'active' : ''}" onclick="window.handleOpenFilterChip('type','${safeJsStr(t)}')">
        <span>${esc(t)}</span>
      </div>
    `).join('');
  }

  // 3. Artikelnamen
  const aa = new Set();
  if(f.group && f.type){
    if(ct[f.group]?.[f.type]?.articles) ct[f.group][f.type].articles.forEach(a => aa.add(a));
    state.open.forEach(i => { if(i.group === f.group && i.productType === f.type && i.article) aa.add(i.article); });
  }
  const fa = g('open-field-article');
  if(fa) fa.style.display = (f.group && f.type && aa.size > 0) ? 'grid' : 'none';
  const ac = g('qb-open-article');
  if(ac && f.group && f.type){
    ac.innerHTML = Array.from(aa).sort(sortKeys).map(a => `
      <div class="qb-chip lvl-art ${f.article === a ? 'active' : ''}" onclick="window.handleOpenFilterChip('article','${safeJsStr(a)}')">
        ${(state.master.articleLogos && isValidImage(state.master.articleLogos[`${f.group}||${f.type}||${a}`])) ? `<img src="${state.master.articleLogos[`${f.group}||${f.type}||${a}`]}" class="grp-logo-thumb">` : ''}
        <span>${esc(a)}</span>
      </div>
    `).join('');
  }

  // 4. Größen und Farben exakt für den gewählten Artikel / Typ filtern
  const hasArticles = aa.size > 0;
  const showSizeColor = Boolean(f.group && f.type && (!hasArticles || f.article));
  const fsc = g('open-field-size-color');
  if(fsc) fsc.style.display = showSizeColor ? 'grid' : 'none';

  const sz = new Set(), cl = new Set();
  if(showSizeColor){
    const tg = ct[f.group]?.[f.type] || {};

    if(f.article && tg.articleData && tg.articleData[f.article]){
      (tg.articleData[f.article].sizes || []).forEach(s => sz.add(String(s).trim()));
      (tg.articleData[f.article].colors || []).forEach(c => cl.add(String(c).trim()));
    } else {
      (tg.sizes || []).forEach(s => sz.add(String(s).trim()));
      (tg.colors || []).forEach(c => cl.add(String(c).trim()));
    }

    state.open.forEach(i => {
      if(i.group === f.group && i.productType === f.type){
        if(!hasArticles || !f.article || i.article === f.article){
          if(i.size && String(i.size).trim()) sz.add(String(i.size).trim());
          if(i.color && String(i.color).trim()) cl.add(String(i.color).trim());
        }
      }
    });
  }

  // 5. Buttons für Größe und Farbe rendern
  const szc = g('qb-open-size');
  if(szc && showSizeColor){
    const sortedSizes = Array.from(sz).filter(Boolean).sort(sortKeys);
    szc.innerHTML = sortedSizes.map(s => `
      <div class="qb-chip lvl-var ${String(f.size).trim() === s ? 'active' : ''}" onclick="window.handleOpenFilterChip('size','${safeJsStr(s)}')">
        <span>Gr. ${esc(s)}</span>
      </div>
    `).join('') || '<span class="muted" style="font-size:11px;">–</span>';
  }

  const clc = g('qb-open-color');
  if(clc && showSizeColor){
    const sortedColors = Array.from(cl).filter(Boolean).sort(sortKeys);
    clc.innerHTML = sortedColors.map(c => `
      <div class="qb-chip lvl-var ${String(f.color).trim().toLowerCase() === c.toLowerCase() ? 'active' : ''}" onclick="window.handleOpenFilterChip('color','${safeJsStr(c)}')">
        <span class="color-swatch-circle" style="${getColorStyle(c)}"></span>
        <span>${esc(c)}</span>
      </div>
    `).join('') || '<span class="muted" style="font-size:11px;">–</span>';
  }
};

window.handleOpenFilterChip = function(type, val){
  const f = state.openFilters; f[type] = (f[type] === val) ? '' : val;
  if(type === 'group'){ f.type = ''; f.article = ''; f.size = ''; f.color = ''; }
  else if(type === 'type'){ f.article = ''; f.size = ''; f.color = ''; }
  else if(type === 'article'){ f.size = ''; f.color = ''; }
  window.renderOpenFilters(); window.renderOpen();
};

window.setInlineFilter = function(key, val){
  const f = state.openFilters; f[key] = f[key] === val ? '' : val;
  window.renderOpenFilters(); window.renderOpen();
};

window.toggleZeroFilter = function(){ state.hideZero=!state.hideZero; save(); window.renderOpen(); };
window.updateOpenFilters = function(){ const sf=g('openSearchText'); state.openFilters.text=sf?sf.value.trim():''; window.renderOpen(); };
window.clearOpenSearch = function(){ const sf=g('openSearchText'); if(sf)sf.value=''; state.openFilters.text=''; window.renderOpen(); };

window.renderOpen = function(){
  const tr=g('zeroFilterBtn'), kn=g('zeroFilterKnob'); if(tr)tr.style.background=state.hideZero?'var(--primary)':'#ccc'; if(kn)kn.style.left=state.hideZero?'22px':'2px';
  const oc=g('openContent'); if(!oc)return; if(!state.open||!state.open.length){oc.innerHTML='<div class="empty">Keine offenen Artikel.</div>';return;}
  const tree={}, f=state.openFilters, st=f.text.toLowerCase().split(' ').filter(Boolean);
  state.open.forEach(i=>{ if(state.hideZero&&(!i.instances||!i.instances.length))return; if(f.group&&i.group!==f.group)return; if(f.type&&i.productType!==f.type)return; if(f.article&&i.article!==f.article)return; if(f.size&&i.size!==f.size)return; if(f.color&&i.color!==f.color)return; if(st.length>0){const ss=`${i.group||''} ${i.productType||''} ${i.article||''} ${i.size||''} ${i.color||''}`.toLowerCase();if(!st.every(t=>ss.includes(t)))return;} const gp=i.group||'–', pt=i.productType||'–', ar=i.article||'', col=i.color||'–'; if(!tree[gp])tree[gp]={}; if(!tree[gp][pt])tree[gp][pt]={}; if(!tree[gp][pt][ar])tree[gp][pt][ar]={}; if(!tree[gp][pt][ar][col])tree[gp][pt][ar][col]=[]; tree[gp][pt][ar][col].push(i); });
  let html='';
  Object.keys(tree).sort(sortKeys).forEach(gp=>{
    let gh='', grpTotal=0;
    Object.keys(tree[gp]).sort(sortKeys).forEach(pt=>{
      let ph='', ptT=0; const pS=new Set(), pC=new Set();
      Object.keys(tree[gp][pt]).sort(sortKeys).forEach(ar=>{
        let aT=0, ah=''; const aS=new Set(), aC=new Set();
        Object.keys(tree[gp][pt][ar]).sort(sortKeys).forEach(col=>{
          const it=tree[gp][pt][ar][col], ct=it.reduce((s,i)=>s+(i.instances?i.instances.length:0),0); if(ct===0&&state.hideZero)return; aT+=ct; const sm={}; it.forEach(i=>{const k=i.size||'–'; if(!sm[k])sm[k]=[]; sm[k].push(i);}); let ch='';
          Object.values(sm).forEach(si=>{
            let ai=[]; si.forEach(sItem=>{if(sItem.instances&&sItem.instances.length){if(sItem.size){aS.add(sItem.size);pS.add(sItem.size);}if(sItem.color){aC.add(sItem.color);pC.add(sItem.color);}sItem.instances.forEach(x=>ai.push({...x,_itemId:sItem.id}));}});
            if(ai.length===0&&state.hideZero)return;
            const fi=si[0], es=ai.reduce((s,x)=>s+(+x.purchasePrice||0),0), mg=ai.length, ez=mg>0?es/mg:(+fi.purchasePrice||0), hp=mg>0?ai.some(x=>x.profitshare):fi.profitshare, od=ai.length?Math.max(...ai.map(x=>calcDays(x.entryDate,today()))):0;
            ch+=`<div class="item-card ${mg===0?'is-zero':''}"><div class="item-card-main"><div class="item-info"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div><div class="item-title" style="color:var(--text);">${esc(fi.article)||esc(fi.productType)||'–'} · <span style="font-weight:normal;color:var(--muted);">${esc(fi.color)||'-'}</span></div></div><div style="font-size:var(--text-xs);color:var(--muted);font-weight:bold;text-align:right;">${mg} × Ø${euro(ez)} = <b style="color:var(--text);font-size:var(--text-sm);">${euro(es)}</b></div></div><div class="chips" style="margin-top:6px;"><span class="chip">Gr. ${esc(fi.size)||'-'}</span><span class="chip days">⏱ ${od} Tage im Bestand</span></div></div></div><div class="item-footer"><div class="item-actions"><span class="chip" style="cursor:pointer;" onclick="window.editEK('${fi.id}')">EK ${euro(ez)} ✎</span><button type="button" class="chip" style="cursor:pointer;border:none" onclick="window.toggleItemProfitshare('${fi.id}')">${hp?'PS ✓':'PS ✎'}</button><span class="chip stack" style="display:inline-flex;gap:3px;align-items:center;padding:0 6px"><button type="button" onclick="window.changeQty('${fi.id}',1)" style="width:16px;height:16px;border-radius:50%;background:#4CAF50;color:white;font-size:10px;border:none;cursor:pointer">+</button>${mg}<button type="button" onclick="window.changeQty('${fi.id}',-1)" style="width:16px;height:16px;border-radius:50%;background:#f44336;color:white;font-size:10px;border:none;cursor:pointer">−</button></span><button type="button" class="btn-icon-subtle danger" onclick="window.deleteItem('${fi.id}')" title="Löschen">🗑️</button></div></div></div>`;
          });
          if(ch) ah+=`<div style="margin-top:var(--sp2);">${ch}</div>`;
        });
        if(ah){
          ptT+=aT;
          if(!ar||!ar.trim()) ph+=ah;
          else {
            const ak='a_'+Math.abs(String(gp+pt+ar).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(36);
            let ic='<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:6px;">';
            aS.forEach(s=>ic+=`<span class="inline-filter-chip ${f.size===s?'active':''}" style="border-color:rgba(245,158,11,0.4); padding:2px 8px; font-size:11px;" onclick="event.stopPropagation(); window.setInlineFilter('size','${safeJsStr(s)}')">Gr. ${esc(s)}</span>`);
            aC.forEach(c=>ic+=`<span class="inline-filter-chip ${f.color===c?'active':''}" style="border-color:rgba(245,158,11,0.4); padding:2px 8px; font-size:11px;" onclick="event.stopPropagation(); window.setInlineFilter('color','${safeJsStr(c)}')">${esc(c)}</span>`);
            ic+='</div>';
            const io=state.openCollapse[ak]!==undefined?state.openCollapse[ak]:globalExpandState;
            ph+=`<div style="margin-bottom:var(--sp3);"><div class="group-head" onclick="window.toggleGrp(this)" data-key="${ak}" style="cursor:pointer; border-left:4px solid var(--c-art-border); background:var(--c-art-bg); border-radius:8px; padding:10px; display:flex; flex-direction:column; align-items:flex-start;"><div style="display:flex; align-items:center; width:100%;"><h4 class="group-title" style="font-size:1.15rem; color:#fef3c7; flex:1;">${io?"▼":"▶"} ${esc(ar)} <span style="font-weight:normal;color:var(--muted);font-size:var(--text-xs);">(${aT} Stk)</span></h4></div>${ic}</div></div><div class="grp-body" data-body="${ak}" style="display:${io?"block":"none"}; margin-top:6px;">${ah}</div>`;
          }
        }
      });
      if(ph){
        grpTotal+=ptT;
        const pk='p_'+Math.abs(String(gp+pt).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(36);
        let ic='<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:6px;">';
        pS.forEach(s=>ic+=`<span class="inline-filter-chip ${f.size===s?'active':''}" style="border-color:rgba(99,102,241,0.4); padding:2px 8px; font-size:11px;" onclick="event.stopPropagation(); window.setInlineFilter('size','${safeJsStr(s)}')">Gr. ${esc(s)}</span>`);
        pC.forEach(c=>ic+=`<span class="inline-filter-chip ${f.color===c?'active':''}" style="border-color:rgba(99,102,241,0.4); padding:2px 8px; font-size:11px;" onclick="event.stopPropagation(); window.setInlineFilter('color','${safeJsStr(c)}')">${esc(c)}</span>`);
        ic+='</div>';
        const io=state.openCollapse[pk]!==undefined?state.openCollapse[pk]:globalExpandState;
        gh+=`<div style="margin-bottom:var(--sp4);"><div class="group-head" onclick="window.toggleGrp(this)" data-key="${pk}" style="cursor:pointer; border-left:4px solid var(--c-typ-border); background:var(--c-typ-bg); border-radius:8px; padding:10px; display:flex; flex-direction:column; align-items:flex-start;"><div style="display:flex; align-items:center; width:100%;"><h3 class="group-title" style="font-size:1.2rem; color:#e0e7ff; flex:1;">${io?"▼":"▶"} 🏷 ${esc(pt)} <span style="font-weight:normal;color:var(--muted);font-size:var(--text-xs);">(${ptT} Stk)</span></h3></div>${ic}</div></div><div class="grp-body" data-body="${pk}" style="display:${io?"block":"none"}; margin-top:6px;">${ph}</div>`;
      }
    });
    if(gh){
      const gk='g_'+Math.abs(String(gp).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(36);
      const io=state.openCollapse[gk]!==undefined?state.openCollapse[gk]:globalExpandState;
      html+=`<div style="margin-bottom:var(--sp6);"><div class="group-head" onclick="window.toggleGrp(this)" data-key="${gk}" style="cursor:pointer; border-left:4px solid var(--c-grp-border); background:var(--c-grp-bg); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;"><div style="display:flex;align-items:center;"><h2 class="group-title" style="font-size:1.40rem; color:#f0f9ff;">${io?"▼":"▶"} ${esc(gp)} <span style="font-weight:normal;color:var(--muted);font-size:var(--text-sm);">(${grpTotal} Stk)</span></h2></div><span class="chip stack" style="background:var(--c-grp);color:#fff;">${grpTotal} Stk</span></div><div class="grp-body" data-body="${gk}" style="display:${io?"block":"none"}; margin-top:8px;">${gh}</div></div>`;
    }
  });
  oc.innerHTML=html||'<div class="empty">Keine Treffer.</div>';
};

window.toggleGrp = function(el){
  const k = el.dataset.key; const b = document.querySelector(`[data-body="${k}"]`); if(!b) return;
  const o = b.style.display !== 'none'; b.style.display = o ? 'none' : 'block';
  state.openCollapse[k] = !o; const h = el.querySelector('h2,h3,h4'); if(h) h.innerHTML = h.innerHTML.replace(o ? '▼' : '▶', o ? '▶' : '▼');
};

window.toggleAllGroups = function(){ globalExpandState = !globalExpandState; state.openCollapse = {}; window.renderOpen(); };

window.changeQty = function(id, delta){
  const it = state.open.find(x => x.id === id); if(!it) return;
  if(!it.instances) it.instances = [];
  if(delta > 0){ it.instances.push({ id: uid(), purchasePrice: it.purchasePrice || 0, profitshare: it.profitshare || false, entryDate: today() }); toast('Menge erhöht ✓'); }
  else if(delta < 0 && it.instances.length > 0){ it.instances.pop(); toast('Menge verringert'); }
  save(); window.renderOpen();
};

window.editEK = function(id){
  const it = state.open.find(x => x.id === id); if(!it) return;
  const cur = it.instances?.length ? (it.instances.reduce((s,x)=>s+(+x.purchasePrice||0),0)/it.instances.length) : it.purchasePrice;
  const val = prompt('Neuer Ø Einkaufspreis (€):', cur || 0);
  if(val !== null){
    const p = parseFloat(val.replace(',', '.')) || 0;
    it.purchasePrice = p; (it.instances||[]).forEach(x => x.purchasePrice = p);
    save(); window.renderOpen(); toast('EK aktualisiert ✓');
  }
};

window.toggleItemProfitshare = function(id){
  const it = state.open.find(x => x.id === id); if(!it) return;
  it.profitshare = !it.profitshare; (it.instances||[]).forEach(x => x.profitshare = it.profitshare);
  save(); window.renderOpen(); toast('Profitshare geändert');
};

window.deleteItem = function(id){
  if(!confirm('Artikel löschen?')) return;
  state.open = state.open.filter(x => x.id !== id);
  save(); window.renderOpen(); toast('Artikel gelöscht');
};

// ==================== EXPORT & SYNC ====================
function triggerDownload(data, filename){
  const b = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 1000);
}
window.exportData = function(){ triggerDownload({open:state.open,sold:state.sold,termine:state.termine,master:state.master,year:state.year,deletedIds:state.deletedIds,deletedGroups:state.deletedGroups}, `kleinanzeigen-hero-backup-${today()}.json`); toast('Gesamt-Backup exportiert ✓'); };
window.exportBestand = function(){ triggerDownload({open:state.open}, `bestand-${today()}.json`); toast('Bestand exportiert ✓'); };
window.exportBesta = function(){ triggerDownload({bestaInventory: state.open.filter(i=>i.group==='Besta'), catalog: state.master?.catalog?.Besta||{}, models: BESTA_KORPUS_MODELS}, `besta-korpusse-${today()}.json`); toast('Besta & Korpusse exportiert ✓'); };
window.exportSold = function(){ triggerDownload({sold:state.sold}, `historie-${today()}.json`); toast('Historie exportiert ✓'); };
window.importData = function(file){ if(!file)return; toast('Lese Datei...'); const r=new FileReader(); r.onload=e=>{try{let d=JSON.parse(e.target.result);if(Array.isArray(d))d={open:d};else if(d.state)d=d.state;else if(d.data)d=d.data;applyState(d);save();window.updateMasterForm();window.renderAllQuick();window.renderMaster();window.render();toast('Import erfolgreich ✓');}catch(err){alert('Fehler: '+err.message);}}; r.readAsText(file); };

window.autoSaveToCloud = function(){ const gasUrl=localStorage.getItem('gasUrl')||gVal('gasUrl'); if(!gasUrl)return; fetch(gasUrl,{method:'POST',body:JSON.stringify({open:state.open,sold:state.sold,termine:state.termine,master:state.master,year:state.year,deletedIds:state.deletedIds,deletedGroups:state.deletedGroups}),keepalive:true}).catch(()=>{}); };
window.saveToCloud = async function(){ const gasUrl=gVal('gasUrl').trim()||localStorage.getItem('gasUrl'); if(!gasUrl)return toast('Bitte Script-URL eintragen.'); localStorage.setItem('gasUrl',gasUrl); try{ toast('Speichere...'); await fetch(gasUrl,{method:'POST',body:JSON.stringify({open:state.open,sold:state.sold,termine:state.termine,master:state.master,year:state.year,deletedIds:state.deletedIds,deletedGroups:state.deletedGroups})}); toast('In Cloud gespeichert ✓'); }catch(e){toast('Fehler beim Cloud-Upload');} };
window.loadFromCloud = async function(){
  const gasUrl=gVal('gasUrl').trim()||localStorage.getItem('gasUrl'); if(!gasUrl)return toast('Bitte Script-URL eintragen.');
  localStorage.setItem('gasUrl',gasUrl);
  try{
    toast('Lade...');
    const res = await fetch(gasUrl + (gasUrl.includes('?') ? '&' : '?') + 'nocache=' + Date.now());
    const d = await res.json();
    if(d && !d.error){
      applyState(d); save();
      window.updateMasterForm(); window.renderAllQuick(); window.renderMaster(); window.renderOpenFilters(); window.renderOpen();
      toast('Erfolgreich aus Cloud geladen ✓');
    }
  }catch(e){ toast('Fehler beim Laden'); }
};

// ==================== VERKAUF ====================
window.renderSellQuick = function(){
  const sel = state.sellSelection;
  const cIds = new Set(state.sellCart.filter(c => !c.isBestaKorpusVirtual).map(c => c.inst.id));
  const aI = [];
  state.open.forEach(i => {
    const vI = (i.instances || []).filter(x => !cIds.has(x.id));
    if (vI.length > 0) aI.push({ ...i, validInsts: vI });
  });

  const groupSet = new Set();
  aI.forEach(i => { if (i.group) groupSet.add(i.group); });
  state.open.forEach(i => { if (i.group) groupSet.add(i.group); });
  if (state.master && state.master.catalog) Object.keys(state.master.catalog).forEach(gName => groupSet.add(gName));
  if (state.open.some(i => i && i.group === 'Besta')) groupSet.add('Besta');

  const aG = Array.from(groupSet).sort(sortKeys);
  const gc = g('qb-sell-group');
  if (gc) {
    gc.innerHTML = aG.map(grp => `<div class="qb-chip lvl-grp ${sel.group === grp ? 'active' : ''}" onclick="window.handleSellChipSelect('group','${safeJsStr(grp)}')">${state.master.groupLogos && isValidImage(state.master.groupLogos[grp]) ? `<img src="${state.master.groupLogos[grp]}" class="grp-logo-thumb">` : ''}<span>${esc(grp)}</span></div>`).join('') || '<span class="muted" style="font-size:var(--text-xs);">Keine Gruppen angelegt</span>';
  }

  const iG = sel.group ? aI.filter(i => i.group === sel.group) : [];
  let aTRaw = [...new Set(iG.map(i => i.productType).filter(Boolean))].filter(t => !t.toLowerCase().includes('bauteil') && t !== 'Korpus');
  if (sel.group === 'Besta' && !aTRaw.includes('Korpus (Komplett)')) {
    aTRaw.push('Korpus (Komplett)');
  }
  const aT = aTRaw.sort(sortKeys);

  const fpt = g('sell-field-productType'); if (fpt) fpt.style.display = sel.group ? 'grid' : 'none';
  const tc = g('qb-sell-productType');
  if (tc && sel.group) {
    tc.innerHTML = aT.map(t => `<div class="qb-chip lvl-typ ${sel.type === t ? 'active' : ''}" onclick="window.handleSellChipSelect('type','${safeJsStr(t)}')">${state.master.typeLogos && isValidImage(state.master.typeLogos[`${sel.group}||${t}`]) ? `<img src="${state.master.typeLogos[`${sel.group}||${t}`]}" class="grp-logo-thumb">` : ''}<span>${esc(t)}</span></div>`).join('') || '<span class="muted" style="font-size:var(--text-xs);">Keine Typen</span>';
  }

  const ik = (sel.group === 'Besta' && sel.type === 'Korpus (Komplett)');
  const fa = g('sell-field-article'); if (fa) fa.style.display = (sel.group && sel.type) ? 'grid' : 'none';
  const ac = g('qb-sell-article');

  if (ac && sel.group && sel.type) {
    if (ik) {
      let catHtml = '';
      Object.entries(BESTA_KORPUS_CATEGORIES).forEach(([catTitle, models]) => {
        catHtml += `<div style="width:100%; margin:6px 0 2px; font-size:11px; font-weight:800; color:var(--muted); text-transform:uppercase;">${esc(catTitle)}</div><div class="chips" style="gap:6px; margin-bottom:8px;">`;
        models.forEach(a => {
          const isAct = sel.article === a;
          catHtml += `<div class="qb-chip lvl-art ${isAct ? 'active' : ''}" onclick="window.handleSellChipSelect('article','${safeJsStr(a)}')"><span>${esc(a)}</span></div>`;
        });
        catHtml += `</div>`;
      });
      ac.innerHTML = catHtml;
    } else {
      const iT = (sel.group && sel.type) ? iG.filter(i => i.productType === sel.type) : [];
      const aA = [...new Set(iT.map(i => String(i.article || '')).filter(Boolean))].sort(sortKeys);
      ac.innerHTML = aA.map(a => `<div class="qb-chip lvl-art ${sel.article === a ? 'active' : ''}" onclick="window.handleSellChipSelect('article','${safeJsStr(a)}')">${state.master.articleLogos && isValidImage(state.master.articleLogos[`${sel.group}||${sel.type}||${a}`]) ? `<img src="${state.master.articleLogos[`${sel.group}||${sel.type}||${a}`]}" class="grp-logo-thumb">` : ''}<span>${esc(a)}</span></div>`).join('') || '<span class="muted" style="font-size:var(--text-xs);">Keine Artikel</span>';
    }
  }

  const fsc = g('sell-field-size-color'); let aS = [], aC = [];
  if (ik) {
    if (sel.article) {
      const cS = new Set();
      state.open.forEach(i => {
        if (i && i.group === 'Besta' && (i.productType || '').toLowerCase().includes('bauteil') && i.color) cS.add(i.color);
      });
      aC = Array.from(cS).sort(sortKeys);
      if (!aC.length) aC.push('Weiß');
    }
    if (fsc) fsc.style.display = (sel.group && sel.type && aC.length > 0) ? 'grid' : 'none';
  } else {
    const iT = (sel.group && sel.type) ? iG.filter(i => (i.productType || '') === sel.type) : [];
    const iA = (sel.group && sel.type) ? iT.filter(i => !sel.article || (i.article || '') === sel.article) : [];
    aS = [...new Set(iA.map(i => String(i.size || '').trim()).filter(Boolean))].sort(sortKeys);
    aC = [...new Set(iA.map(i => String(i.color || '').trim()).filter(Boolean))].sort(sortKeys);
    if (fsc) fsc.style.display = (sel.group && sel.type && (aS.length > 0 || aC.length > 0)) ? 'grid' : 'none';
  }
  const sc = g('qb-sell-size'); if (sc && sel.group && sel.type) sc.innerHTML = aS.map(s => `<div class="qb-chip lvl-var ${sel.size === s ? 'active' : ''}" onclick="window.handleSellChipSelect('size','${safeJsStr(s)}')"><span>Gr. ${esc(s)}</span></div>`).join('') || '<span class="muted" style="font-size:var(--text-xs);">–</span>';
  const cc = g('qb-sell-color'); if (cc && sel.group && sel.type) cc.innerHTML = aC.map(c => `<div class="qb-chip lvl-var ${sel.color === c ? 'active' : ''}" onclick="window.handleSellChipSelect('color','${safeJsStr(c)}')"><span>${esc(c)}</span></div>`).join('') || '<span class="muted" style="font-size:var(--text-xs);">–</span>';
  window.renderSellInstanceList();
};

window.handleSellChipSelect = function(t, v){
  const s = state.sellSelection; s[t] = (s[t] === v) ? '' : v;
  if(t==='group'){ s.type=''; s.article=''; s.size=''; s.color=''; }
  else if(t==='type'){ s.article=''; s.size=''; s.color=''; }
  else if(t==='article'){ s.size=''; s.color=''; }
  window.renderSellQuick();
};

window.renderSellInstanceList = function(){
  const l = g('sellInstanceList'); if(!l) return;
  const s = state.sellSelection;
  if(s.group==='Besta' && s.type==='Korpus (Komplett)'){
    if(!s.article || !s.color){ l.innerHTML = '<div class="empty" style="padding:8px;">Bitte Modell und Farbe wählen.</div>'; return; }
    const p = getBestaPoss(s.article, s.color);
    if(p > 0){
      l.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(16,185,129,0.1); border:1px dashed var(--c-var-border); padding:6px 10px; border-radius:6px;"><div><b>${esc(s.article)} (${esc(s.color)})</b><div style="font-size:12px; color:var(--success);">${p} Stück baubar</div></div><button type="button" class="btn btn-primary" onclick="window.addSellKorpusComplete('${safeJsStr(s.article)}', '${safeJsStr(s.color)}')">✚ Set Hinzufügen</button></div>`;
    } else {
      l.innerHTML = '<div class="empty" style="color:var(--err);">Nicht genügend Bauteile vorhanden.</div>';
    }
    return;
  }
  if(!s.group){ l.innerHTML = '<div class="empty">Bitte zuerst eine Gruppe wählen.</div>'; return; }
  const cid=new Set(state.sellCart.filter(c=>!c.isBestaKorpusVirtual).map(c=>c.inst.id)), m=[];
  state.open.forEach(i=>{
    if(!i) return;
    if(s.group && (i.group||'')!==s.group) return;
    if(s.type && (i.productType||'')!==s.type) return;
    if(s.article && (i.article||'')!==s.article) return;
    if(s.size && String(i.size||'').trim()!==s.size.trim()) return;
    if(s.color && String(i.color||'').trim().toLowerCase()!==s.color.trim().toLowerCase()) return;
    (i.instances||[]).forEach(x=>{if(!cid.has(x.id)) m.push({item:i,inst:x});});
  });
  if(!m.length){ l.innerHTML = '<div class="empty">Keine Lager-Exemplare vorrätig.</div>'; return; }
  l.innerHTML = m.map(x=>`<div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface2); padding:6px 10px; border-radius:var(--rad-sm); margin-bottom:6px;"><div><b style="font-size:var(--text-sm);">${esc(x.item.article||x.item.productType)} · ${esc(x.item.color||'–')} ${x.item.size?'(Gr. '+esc(x.item.size)+')':''}</b><div style="font-size:var(--text-xs); color:var(--muted);">EK: ${euro(x.inst.purchasePrice)} · ⏱️ ${calcDays(x.inst.entryDate)} Tage</div></div><button type="button" class="btn btn-primary" style="width:auto; min-height:28px; padding:2px 10px;" onclick="window.addSellDirect('${x.item.id}', '${x.inst.id}')">✚</button></div>`).join('');
};

window.addSellKorpusComplete = function(m, c){
  const r = BESTA_BOM[m]; let p = 0;
  for(const[pt,d] of Object.entries(r)){
    let f=0;
    state.open.forEach(i=>{
      if(i.group==='Besta'&&i.productType==='Korpus Bauteil'&&String(i.article||'').toLowerCase().trim()===String(pt).toLowerCase().trim()&&String(i.size||'').trim()===String(d.s).trim()&&String(i.color||'').toLowerCase().trim()===String(c).toLowerCase().trim()){
        (i.instances||[]).forEach(x=>{ if(f<d.q){ p+=(x.purchasePrice||0); f++; } });
      }
    });
  }
  state.sellCart.push({ isBestaKorpusVirtual:true, model:m, color:c, reqs:r, item:{group:'Besta',productType:'Korpus',article:m,color:c}, inst:{id:'virt_'+uid(), purchasePrice:p, entryDate:today(), profitshare:false} });
  window.renderSellCart(); toast(`Korpus "${m}" im Warenkorb ✓`);
};

window.addSellDirect = function(iId, inId){ const i=state.open.find(x=>x.id===iId), x=i?i.instances.find(y=>y.id===inId):null; if(i&&x){state.sellCart.push({item:i,inst:x}); window.renderSellCart(); window.renderSellQuick(); toast('Position in Warenkorb');} };
window.removeSellPosition = function(i){ state.sellCart.splice(i,1); window.renderSellCart(); };
window.renderSellCart = function(){
  const c = g('sellCartContainer'); if(!c) return;
  if(state.sellCart.length === 0){ c.innerHTML = '<div class="empty">Warenkorb leer.</div>'; window.updateSellPreview(); return; }
  c.innerHTML = state.sellCart.map((p,i) => `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border);"><div><b>${i+1}.</b> ${p.isBestaKorpusVirtual?esc(p.model)+' ('+esc(p.color)+') [BAUSATZ]':esc(p.item.article||p.item.productType)+' ('+esc(p.item.color||'')+(p.item.size?', '+esc(p.item.size):'')+')'} <span style="color:var(--primary);">${euro(p.inst.purchasePrice)}</span></div><button type="button" class="btn btn-danger" onclick="window.removeSellPosition(${i})">✕</button></div>`).join('');
  window.updateSellPreview();
};

window.onPsPctInput = function(){ state.psMode = 'pct'; window.updateSellPreview(); };
window.onPsEuroInput = function(){ state.psMode = 'euro'; window.updateSellPreview(); };

window.updateSellPreview = function(){
  const p = g('sellPrice'), pi = g('sellPsInput'), pe = g('sellPsEuroInput');
  const eT = g('sellEKTotal'), nT = g('sellNetto'), fP = g('sellFinalProfit');
  if(!p || !eT || !nT || !fP) return;

  let ekGesamt = 0; state.sellCart.forEach(c => ekGesamt += (+c.inst.purchasePrice || 0));
  eT.textContent = euro(ekGesamt);

  const sp = parseFloat(p.value.replace(',', '.')) || 0;
  const rohertrag = sp - ekGesamt;
  nT.textContent = euro(rohertrag); nT.style.color = rohertrag < 0 ? 'var(--err)' : 'var(--text)';

  let psEuro = 0, psPct = 0;
  if(rohertrag > 0){
    if(state.psMode === 'euro'){
      psEuro = parseFloat(pe.value.replace(',', '.')) || 0;
      if(psEuro > rohertrag) psEuro = rohertrag;
      psPct = (psEuro / rohertrag) * 100;
      if(pi) pi.value = Math.round(psPct);
    } else {
      psPct = parseFloat(pi.value.replace(',', '.')) || 0;
      if(psPct > 100) psPct = 100;
      psEuro = rohertrag * (psPct / 100);
      if(pe) pe.value = psEuro > 0 ? psEuro.toFixed(2) : '';
    }
  } else {
    if(pe) pe.value = ''; if(pi) pi.value = 0;
  }

  const meinGewinn = rohertrag - psEuro;
  if(sp > 0){
    if(psEuro > 0){
      fP.innerHTML = `Dein Reingewinn: <b style="color:var(--success); font-size:14px;">${euro(meinGewinn)}</b> <span style="color:var(--muted); font-size:11px;">(Partner: ${euro(psEuro)} / ${Math.round(psPct)}%)</span>`;
    } else {
      fP.innerHTML = `Dein Reingewinn: <b style="color:${meinGewinn >= 0 ? 'var(--success)' : 'var(--err)'}; font-size:14px;">${euro(meinGewinn)}</b>`;
    }
  } else { fP.innerHTML = ''; }
};

window.executeSale = function(){
  if(state.sellCart.length === 0) return alert('Warenkorb leer.');
  const sp = parseFloat(gVal('sellPrice').replace(',', '.')) || 0;
  if(sp <= 0) return alert('Bitte Verkaufspreis angeben.');

  let pt = 0; state.sellCart.forEach(c => pt += (+c.inst.purchasePrice || 0));
  const rohertrag = sp - pt;

  let pe = 0;
  if(rohertrag > 0){
    if(state.psMode === 'euro'){ pe = parseFloat(gVal('sellPsEuroInput').replace(',', '.')) || 0; }
    else { const pp = parseFloat(gVal('sellPsInput').replace(',', '.')) || 0; pe = rohertrag * (pp / 100); }
  }

  const netProfit = rohertrag - pe;
  const cd = [];
  state.sellCart.forEach(c => {
    if(c.isBestaKorpusVirtual){
      for(const[p,d] of Object.entries(c.reqs)) cd.push({ p:p, s:d.s, c:c.color, q:d.q });
    }
  });

  const bn = gVal('sellBaseName').trim() || 'Set';
  state.sold.unshift({
    id: uid(), setName: bn, isSet: state.sellCart.length > 1,
    salePrice: sp, purchaseTotal: pt, netProfit: netProfit,
    saleDate: today(), hasProfitshare: pe > 0,
    previewImage: gVal('sellSetImgValue') || '',
    avgDaysInStock: Math.round(state.sellCart.reduce((s,c)=>s+calcDays(c.inst.entryDate),0)/state.sellCart.length),
    items: state.sellCart.map(c => ({
      article: c.item.article || c.model || '',
      productType: c.item.productType || 'Korpus',
      group: c.item.group, size: c.item.size || '', color: c.color || c.item.color || '',
      quantity: 1, entryDate: c.inst.entryDate
    }))
  });

  cd.forEach(c => remBestaInst(c.p, c.s, c.c, c.q));
  state.sellCart.forEach(c => {
    if(!c.isBestaKorpusVirtual && c.inst && c.inst.id){
      state.open.forEach(item => {
        if(item.instances && item.instances.length > 0){
          const idx = item.instances.findIndex(inst => inst.id === c.inst.id);
          if(idx !== -1) item.instances.splice(idx, 1);
        }
      });
    }
  });

  state.sellCart = [];
  ['sellBaseName','sellPrice','sellPsEuroInput','sellSetImgValue'].forEach(id => { const el = g(id); if(el) el.value = ''; });
  g('sellPsInput').value = '0';

  save(); window.autoSaveToCloud?.(); toast('Verkauf gebucht & Bestand reduziert ✓');
  window.renderOpen(); window.renderBestaManager();
  state.page = 'sold'; window.render();
};

// ==================== HISTORIE ====================
window.editSoldImage = function(id){
  const s = state.sold.find(x => x.id === id); if(!s) return;
  imagePickCallback = url => {
    s.previewImage = url; save(); window.autoSaveToCloud?.(); window.renderSold();
    toast('Bild gespeichert ✓');
  };
  window.openImagePicker(s.previewImage || '', 'Set Bilder');
};

window.editSoldName = function(id){
  const s = state.sold.find(x => x.id === id); if(!s) return;
  const n = prompt('Neuer Name:', s.setName || '');
  if(n !== null){ s.setName = n.trim() || 'Set'; save(); window.autoSaveToCloud?.(); window.renderSold(); toast('Name aktualisiert ✓'); }
};

window.editSoldPrice = function(id){
  const s = state.sold.find(x => x.id === id); if(!s) return;
  const val = prompt('Neuer Verkaufspreis (€):', s.salePrice || 0);
  if(val !== null){
    const sp = parseFloat(val.replace(',', '.')) || 0;
    s.salePrice = sp; const rohertrag = sp - (s.purchaseTotal || 0);
    s.netProfit = s.hasProfitshare ? (rohertrag * 0.5) : rohertrag;
    save(); window.autoSaveToCloud?.(); window.renderSold(); window.renderStats(); toast('Preis aktualisiert ✓');
  }
};

window.deleteSoldSet = function(id){
  if(!confirm('Diesen Verkauf wirklich löschen?')) return;
  if(!state.deletedIds) state.deletedIds = [];
  state.deletedIds.push(id);
  state.sold = state.sold.filter(x => x.id !== id);
  save(); window.autoSaveToCloud?.(); window.renderSold(); window.renderStats(); toast('Verkauf gelöscht');
};

window.renderSold = function(){
  const sc = g('soldContent'), sf = g('soldSearch'), badge = g('soldCountBadge');
  if(!sc) return;
  const term = sf ? sf.value.trim().toLowerCase() : '';

  const sorted = [...(state.sold || [])].sort((a, b) => {
    const da = String(a.saleDate || '1970-01-01');
    const db = String(b.saleDate || '1970-01-01');
    return db.localeCompare(da);
  });

  const filtered = term ? sorted.filter(s => {
    const str = `${s.setName||''} ${s.saleDate||''} ${(s.items||[]).map(i=>i.article+' '+i.color).join(' ')}`.toLowerCase();
    return str.includes(term);
  }) : sorted;

  if(badge) badge.textContent = `${filtered.length} Verkäufe`;
  if(!filtered.length){ sc.innerHTML = '<div class="empty">Keine Verkäufe gefunden.</div>'; return; }

  sc.innerHTML = filtered.map(s => {
    const profit = s.netProfit !== undefined ? s.netProfit : ((s.salePrice||0) - (s.purchaseTotal||0));
    const isProf = profit >= 0;
    const profitColor = isProf ? 'color:var(--success);' : 'color:var(--err);';
    const sign = isProf ? '+' : '';
    const img = s.previewImage || '';
    const itemsSummary = (s.items || []).map(i => `${i.article || i.productType || 'Artikel'} ${i.color ? '('+i.color+')' : ''}`.trim()).filter(Boolean).join(' · ');

    return `
      <div class="sold-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div style="display:flex; gap:12px; align-items:center; flex:1; min-width:0;">
            <div class="thumb" onclick="window.editSoldImage('${s.id}')" title="Bild ändern/hinzufügen">
              ${img ? `<img src="${img}">` : '<span style="font-size:20px; opacity:0.6;">🖼️</span>'}
            </div>
            <div style="min-width:0; flex:1;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <b style="font-size:1.05rem; color:var(--text);">${esc(s.setName || 'Set')}</b>
                <b style="font-size:1.05rem; ${profitColor}">${sign}${euro(profit)}</b>
              </div>
              <div class="chips" style="margin-top:4px;">
                <span class="chip">📅 ${fmtDate(s.saleDate)}</span>
                <span class="chip days">⏱ ${s.avgDaysInStock || 0}d Lager</span>
                ${s.hasProfitshare ? '<span class="chip stack" style="color:var(--warn); border-color:var(--warn);">🤝 Profitshare</span>' : ''}
              </div>
              ${itemsSummary ? `<div style="font-size:11px; color:var(--muted); margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(itemsSummary)}</div>` : ''}
            </div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0;">
            <div style="font-size:11px; color:var(--muted); white-space:nowrap;">VK ${euro(s.salePrice)} · EK ${euro(s.purchaseTotal)}</div>
            <div style="display:flex; gap:4px; align-items:center;">
              <button type="button" class="btn btn-ghost" style="padding:2px 6px; font-size:11px;" onclick="window.editSoldImage('${s.id}')">🖼 Bild</button>
              <button type="button" class="btn-icon-subtle" onclick="window.editSoldName('${s.id}')">✏️</button>
              <button type="button" class="btn-icon-subtle" onclick="window.editSoldPrice('${s.id}')">🏷</button>
              <button type="button" class="btn-icon-subtle danger" onclick="window.deleteSoldSet('${s.id}')">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

// ==================== STATISTIK ====================
window.onStatsFilterChange = function(t){
  if(t==='grp'){g('statsFilterTyp').value='';g('statsFilterArt').value='';g('statsFilterSize').value='';g('statsFilterCol').value='';}
  else if(t==='typ'){g('statsFilterArt').value='';g('statsFilterSize').value='';g('statsFilterCol').value='';}
  else if(t==='art'){g('statsFilterSize').value='';g('statsFilterCol').value='';}
  window.renderStats();
};

function populateStatsFilters(){
  const gS=g('statsFilterGrp'), tS=g('statsFilterTyp'), aS=g('statsFilterArt'), szS=g('statsFilterSize'), cS=g('statsFilterCol');
  if(!gS) return;
  const cg=gS.value, ct=tS.value, ca=aS.value, cSz=szS?szS.value:'', cc=cS?cS.value:'';
  const gr=new Set(), ty=new Set(), ar=new Set(), si=new Set(), cl=new Set();
  (state.sold||[]).forEach(s=>{
    (s.items||[]).forEach(i=>{
      if(i.group) gr.add(i.group);
      if(!cg || i.group===cg){
        if(i.productType) ty.add(i.productType);
        if(!ct || i.productType===ct){
          if(i.article) ar.add(i.article);
          if(i.size) si.add(i.size);
          if(i.color) cl.add(i.color);
        }
      }
    });
  });
  fillSel(gS, [...gr].sort(sortKeys), 'Gruppe (Alle)'); gS.value=cg;
  fillSel(tS, [...ty].sort(sortKeys), 'Typ (Alle)'); tS.value=ct;
  fillSel(aS, [...ar].sort(sortKeys), 'Artikel (Alle)'); aS.value=ca;
  if(szS){ fillSel(szS, [...si].sort(sortKeys), 'Größe (Alle)'); szS.value=cSz; }
  if(cS){ fillSel(cS, [...cl].sort(sortKeys), 'Farbe (Alle)'); cS.value=cc; }
}

window.renderStats = function(){
  populateStatsFilters();
  const fg=gVal('statsFilterGrp'), ft=gVal('statsFilterTyp'), fa=gVal('statsFilterArt'), fs=gVal('statsFilterSize'), fc=gVal('statsFilterCol');

  const availableYears = [...new Set((state.sold||[]).map(s => String(s.saleDate || today()).slice(0, 4)))].filter(Boolean).sort().reverse();
  const sy = g('statsYear');
  if(sy){
    let opts = `<option value="ALL" ${state.year==='ALL'?'selected':''}>Alle Jahre</option>`;
    availableYears.forEach(yr => { opts += `<option value="${yr}" ${state.year===yr?'selected':''}>${yr}</option>`; });
    sy.innerHTML = opts;
  }

  let ys = (state.sold || []);
  if(state.year && state.year !== 'ALL'){
    ys = ys.filter(s => String(s.saleDate || today()).startsWith(state.year));
  }

  if(fg || ft || fa || fs || fc){
    ys = ys.filter(s => (s.items || []).some(i => 
      (!fg || i.group === fg) && (!ft || i.productType === ft) && (!fa || i.article === fa) &&
      (!fs || String(i.size) === String(fs)) && (!fc || String(i.color).toLowerCase() === String(fc).toLowerCase())
    ));
  }

  const totalSets = ys.length;
  const totalRevenue = ys.reduce((s, x) => s + (+x.salePrice || 0), 0);
  const totalNetProfit = ys.reduce((s, x) => s + (+x.netProfit || 0), 0);
  const totalDays = ys.reduce((s, x) => s + (+x.avgDaysInStock || 0), 0);
  const avgDays = totalSets ? Math.round(totalDays / totalSets) : 0;
  const avgMargin = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;

  const sc = g('statsCards');
  if(sc){
    sc.innerHTML = [
      { k: 'Verkaufte Sets', v: totalSets },
      { k: 'Gesamtumsatz', v: euro(totalRevenue) },
      { k: 'Reingewinn', v: euro(totalNetProfit) },
      { k: 'Ø Marge / Rotation', v: `${avgMargin}% · ${avgDays}d` }
    ].map(c => `<div class="stat-card"><div class="k">${c.k}</div><div class="v">${c.v}</div></div>`).join('');
  }

  const monthlyMap = new Map();
  ys.forEach(s => {
    const sd = s.saleDate || today();
    const monthKey = sd.slice(0, 7);
    const monthName = fmtMonth(sd);

    if(!monthlyMap.has(monthKey)){
      monthlyMap.set(monthKey, { name: monthName, year: monthKey.slice(0, 4), sets: 0, revenue: 0, profit: 0, psAmount: 0 });
    }

    const m = monthlyMap.get(monthKey);
    const vk = +s.salePrice || 0;
    const ek = +s.purchaseTotal || 0;
    const net = +s.netProfit || 0;
    const rohertrag = Math.max(0, vk - ek);
    const partnerAnteil = s.hasProfitshare ? Math.max(0, rohertrag - net) : 0;

    m.sets += 1; m.revenue += vk; m.profit += net; m.psAmount += partnerAnteil;
  });

  const sortedMonths = [...monthlyMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const mtt = g('monthTable');

  if(mtt){
    if(sortedMonths.length === 0){
      mtt.innerHTML = '<tbody><tr><td class="empty">Keine Verkaufsdaten vorhanden.</td></tr></tbody>';
    } else {
      mtt.innerHTML = `
        <thead>
          <tr>
            <th>Monat</th><th>Jahr</th><th style="text-align:center;">Sets</th><th>Umsatz</th><th>Reingewinn</th><th style="color:var(--warn);">Profitshare</th>
          </tr>
        </thead>
        <tbody>
          ${sortedMonths.map(([key, d]) => `
            <tr>
              <td><b>${d.name.split(' ')[0]}</b></td><td>${d.year}</td>
              <td style="text-align:center;"><span class="chip stack">${d.sets}</span></td>
              <td><b>${euro(d.revenue)}</b></td>
              <td style="color:var(--success); font-weight:800;">+${euro(d.profit)}</td>
              <td style="color:var(--warn); font-weight:700;">${d.psAmount > 0 ? euro(d.psAmount) : '–'}</td>
            </tr>
          `).join('')}
        </tbody>
      `;
    }
  }
};

const syEl = g('statsYear');
if(syEl){
  syEl.addEventListener('change', e => { state.year = e.target.value; window.renderStats(); });
}

// ==================== KALENDER ====================
window.renderTermine = function(){
  const c=g('terminContent'); if(!c)return;
  if(!state.termine||state.termine.length===0){c.innerHTML='<div class="empty">Keine Termine.</div>';return;}
  const s=[...state.termine].sort((a,b)=>new Date(`${b.datum}T${b.uhrzeit||'00:00'}:00`)-new Date(`${a.datum}T${a.uhrzeit||'00:00'}:00`));
  c.innerHTML=s.map(t=>`<div class="card" style="margin-bottom:var(--sp3);"><div class="card-body" style="padding:var(--sp3);"><div style="display:flex; justify-content:space-between;"><b>${esc(t.name)}</b><span>${fmtDate(t.datum)} ${t.uhrzeit} Uhr</span></div><div style="font-size:12px; color:var(--muted); margin-top:4px;">${esc(t.art)}</div><button type="button" class="btn btn-danger" style="margin-top:6px; padding:2px 8px; font-size:11px;" onclick="window.deleteTermin('${t.id}')">🗑 Löschen</button></div></div>`).join('');
};
window.deleteTermin = function(id){ state.termine=state.termine.filter(t=>t.id!==id); save(); window.autoSaveToCloud?.(); window.renderTermine(); };

const tfrm=g('terminForm');
if(tfrm){
  tfrm.addEventListener('submit',e=>{
    e.preventDefault();
    state.termine.unshift({id:uid(),art:gVal('terminArt'),name:gVal('terminName'),datum:gVal('terminDatum'),uhrzeit:gVal('terminUhrzeit')});
    save(); window.autoSaveToCloud?.(); toast('Termin gespeichert ✓'); tfrm.reset(); g('terminDatum').value=today(); window.renderTermine();
  });
}

function populateUhrzeit(){
  const s=g('terminUhrzeit'); if(!s)return; let h='<option value="" disabled selected>Zeit wählen</option>';
  for(let i=9;i<=23;i++) h+=`<option value="${i<10?'0'+i:i}:00">${i<10?'0'+i:i}:00</option><option value="${i<10?'0'+i:i}:30">${i<10?'0'+i:i}:30</option>`;
  s.innerHTML=h;
}

// ==================== ROUTENPLANER & PRÄZISE GEO-DATEN MIT MINUTEN ====================
let routeWaypoints = [];
const geoCache = {};

// Präzise Koordinaten Hamburg (georeferenziert)
const KNOWN_GEO = {
  'josephstr': { lat: 53.5714, lon: 10.0760 },
  'wunderbrunnen': { lat: 53.6405, lon: 9.9160 },
  'schnelsen': { lat: 53.6405, lon: 9.9160 },
  'ikea schnelsen': { lat: 53.6405, lon: 9.9160 },
  'halstenbek': { lat: 53.6265, lon: 9.8785 },
  'padel amigos': { lat: 53.6265, lon: 9.8785 },
  'gasstraße': { lat: 53.5570, lon: 9.9150 },
  'bahrenfeld': { lat: 53.5570, lon: 9.9150 },
  'große bergstraße': { lat: 53.5513, lon: 9.9482 },
  'altona': { lat: 53.5513, lon: 9.9482 },
  'ikea altona': { lat: 53.5513, lon: 9.9482 },
  'alsterdorfer markt': { lat: 53.6060, lon: 10.0120 },
  'alsterdorf': { lat: 53.6060, lon: 10.0120 },
  'unterer landweg': { lat: 53.5049, lon: 10.0886 },
  'moorfleet': { lat: 53.5049, lon: 10.0886 },
  'ikea moorfleet': { lat: 53.5049, lon: 10.0886 },
  'havighorster weg': { lat: 53.4880, lon: 10.1980 },
  'bergedorf': { lat: 53.4880, lon: 10.1980 },
  'p3 padel': { lat: 53.4880, lon: 10.1980 }
};

function getPredefinedCoords(rawText){
  if(!rawText) return null;
  const s = rawText.toLowerCase().replace(/[,.-]/g, ' ').replace(/\s+/g, ' ').trim();

  if(s.includes('kieler')){
    const nr = parseInt((s.match(/\b\d+\b/) || [0])[0]);
    if(nr >= 350) return { lat: 53.5975, lon: 9.9230 }; // Kieler Str. 400 (Eidelstedt / Grenze Stellingen)
    if(nr >= 180) return { lat: 53.5850, lon: 9.9380 }; // Stellingen Mitte
    return { lat: 53.5680, lon: 9.9510 }; // Eimsbüttel
  }

  for(const [k, v] of Object.entries(KNOWN_GEO)){
    if(s.includes(k)) return v;
  }
  return null;
}

async function fetchCoordinates(addressText){
  if(!addressText || !addressText.trim()) return null;
  const raw = addressText.trim().toLowerCase();
  
  if(geoCache[raw]) return geoCache[raw];

  const pre = getPredefinedCoords(raw);
  if(pre){ geoCache[raw] = pre; return pre; }

  try{
    const query = encodeURIComponent(raw.includes('hamburg') || raw.includes('halstenbek') ? raw : raw + ', Hamburg');
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`);
    const data = await res.json();
    if(data && data.length > 0){
      const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      geoCache[raw] = coords;
      return coords;
    }
  }catch(e){}

  return { lat: 53.5511, lon: 9.9937 };
}

function calcRealRoadInfo(c1, c2){
  if(!c1 || !c2) return { km: 12, min: 20 };
  const R = 6371;
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLon = (c2.lon - c1.lon) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const luftlinie = R * c;
  
  const km = Math.max(1, Math.round(luftlinie * 1.30));
  const min = Math.max(2, Math.round((km / 32) * 60) + 2);
  return { km, min };
}

window.saveCustomHome = function(val){
  if(!val || !val.trim()) return;
  state.master.homeAddress = val.trim();
  save(); window.autoSaveToCloud?.();
  toast('Standard-Startadresse gespeichert ✓');
  window.calcRoutePage();
};

window.addRouteWaypoint = function(addr = ''){ 
  routeWaypoints.push(addr); 
  window.renderRouteWaypoints(); 
  if(addr) toast('Stopp hinzugefügt ✓');
  window.calcRoutePage();
};

window.removeRouteWaypoint = function(idx){ 
  routeWaypoints.splice(idx, 1); 
  window.renderRouteWaypoints(); 
  window.calcRoutePage();
};

window.renderRouteWaypoints = function(){
  const c = g('routeWaypointsContainer'); if(!c) return;
  c.innerHTML = routeWaypoints.map((w, idx) => `
    <div style="display:flex; gap:6px; margin-top:6px; align-items:center;">
      <input type="text" class="input" style="font-size:12px;" value="${esc(w)}" placeholder="Zwischenstopp..." onchange="routeWaypoints[${idx}]=this.value; window.calcRoutePage();">
      <button type="button" class="btn btn-danger" style="width:auto; padding:4px 8px;" onclick="window.removeRouteWaypoint(${idx})">✕</button>
    </div>
  `).join('');
};

window.renderRouteFavorites = function(){
  const chipsBar = g('routeFavoriteChipsBar');
  const mgmtList = g('routeFavoritesManagementList');
  const favs = state.master?.favoriteSpots || [];

  if(chipsBar){
    if(favs.length === 0){
      chipsBar.innerHTML = '<span class="muted" style="font-size:11px;">Keine Favoriten hinterlegt. Klicke auf "✚ Neuer Favorit".</span>';
    } else {
      chipsBar.innerHTML = favs.map(f => `
        <span class="chip" style="cursor:pointer;" onclick="window.setRouteDestAddress('${safeJsStr(f.addr)}')">📍 ${esc(f.name)}</span>
      `).join('');
    }
  }

  if(mgmtList){
    if(favs.length === 0){
      mgmtList.innerHTML = '<div class="empty" style="padding:10px;">Noch keine Favoriten gespeichert.</div>';
    } else {
      mgmtList.innerHTML = favs.map((f, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface2); padding:8px 12px; border-radius:6px; border:1px solid var(--border); margin-bottom:4px; gap:8px;">
          <div style="min-width:0; flex:1;">
            <b style="font-size:13px; color:var(--text);">${esc(f.name)}</b>
            <div style="font-size:11px; color:var(--muted); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${esc(f.addr)}</div>
          </div>
          <div style="display:flex; gap:4px; flex-shrink:0;">
            <button type="button" class="btn btn-ghost" style="padding:3px 7px; font-size:11px;" onclick="window.setRouteDestAddress('${safeJsStr(f.addr)}')">Ziel</button>
            <button type="button" class="btn btn-ghost" style="padding:3px 7px; font-size:11px;" onclick="window.addRouteWaypoint('${safeJsStr(f.addr)}')">✚ Stopp</button>
            <button type="button" class="btn btn-ghost" style="padding:3px 7px; font-size:11px;" onclick="window.editFavoriteSpot(${idx})">✏️</button>
            <button type="button" class="btn btn-danger" style="padding:3px 7px; font-size:11px;" onclick="window.deleteFavoriteSpot(${idx})">🗑</button>
          </div>
        </div>
      `).join('');
    }
  }
};

window.setRouteDestAddress = function(addr){
  const destIn = g('routeDestInput');
  if(destIn){
    destIn.value = addr;
    window.calcRoutePage();
    toast(`Zieladresse übernommen ✓`);
  }
};

window.promptAddFavoriteSpot = function(){
  const name = prompt('Name des neuen Favoriten (z.B. Padel Amigos, IKEA Schnelsen, FitX):');
  if(!name || !name.trim()) return;
  const addr = prompt(`Exakte Adresse für "${name}":`);
  if(!addr || !addr.trim()) return;
  
  if(!state.master.favoriteSpots) state.master.favoriteSpots = [];
  state.master.favoriteSpots.push({ name: name.trim(), addr: addr.trim() });
  save(); window.autoSaveToCloud?.();
  window.renderRouteFavorites();
  toast(`Favorit "${name}" gespeichert ✓`);
  window.calcRoutePage();
};

window.editFavoriteSpot = function(idx){
  const favs = state.master?.favoriteSpots || [];
  const cur = favs[idx];
  if(!cur) return;
  const newName = prompt('Name des Favoriten bearbeiten:', cur.name);
  if(newName === null) return;
  const newAddr = prompt(`Adresse für "${newName || cur.name}" bearbeiten:`, cur.addr);
  if(newAddr === null) return;

  cur.name = newName.trim() || cur.name;
  cur.addr = newAddr.trim() || cur.addr;
  save(); window.autoSaveToCloud?.();
  window.renderRouteFavorites();
  toast('Favorit aktualisiert ✓');
  window.calcRoutePage();
};

window.deleteFavoriteSpot = function(idx){
  if(!confirm('Diesen Favoriten entfernen?')) return;
  state.master.favoriteSpots.splice(idx, 1);
  save(); window.autoSaveToCloud?.();
  window.renderRouteFavorites();
  toast('Favorit entfernt ✓');
  window.calcRoutePage();
};

window.calcRoutePage = async function(){
  const dest = gVal('routeDestInput').trim(); 
  const res = g('routeCalculationResult');
  if(!dest){
    if(res) res.innerHTML = '';
    return;
  }
  const start = gVal('routeStartInput').trim() || state.master?.homeAddress || 'Josephstr. 14, 22041 Hamburg';
  
  if(res) res.innerHTML = '<div style="padding:10px; text-align:center; color:var(--muted); font-size:12px;">⏳ Berechne reale Koordinaten, Entfernungen & Fahrzeiten…</div>';

  const stops = routeWaypoints.filter(w => w && w.trim());
  
  const startCoords = await fetchCoordinates(start);
  const destCoords = await fetchCoordinates(dest);

  const stopsCoords = [];
  for(const st of stops){
    stopsCoords.push({ addr: st, coords: await fetchCoordinates(st) });
  }

  let totalKm = 0;
  let totalMin = 0;
  let prevC = startCoords;
  for(const item of stopsCoords){
    const leg = calcRealRoadInfo(prevC, item.coords);
    totalKm += leg.km;
    totalMin += leg.min;
    prevC = item.coords;
  }
  const toDest = calcRealRoadInfo(prevC, destCoords);
  totalKm += toDest.km;
  totalMin += toDest.min;

  const backHome = calcRealRoadInfo(destCoords, startCoords);
  totalKm += backHome.km;
  totalMin += backHome.min;

  const cost = totalKm * 0.15 * 0.33;

  const favs = state.master?.favoriteSpots || [];
  let favCheckHtml = '';

  if(favs.length > 0 && destCoords){
    const favCalculations = [];
    for(const f of favs){
      const fCoords = await fetchCoordinates(f.addr);
      const info = calcRealRoadInfo(destCoords, fCoords);
      favCalculations.push({ ...f, km: info.km, min: info.min, isClose: info.km <= 7 });
    }

    favCalculations.sort((a,b) => a.km - b.km);

    favCheckHtml = `
      <div style="margin-top:12px; border-top:1px solid var(--border); padding-top:10px;">
        <div style="font-weight:800; font-size:11px; text-transform:uppercase; color:var(--muted); margin-bottom:6px;">
          📍 Entfernung & Fahrzeit vom Ziel zu deinen Favoriten:
        </div>
        <div style="display:grid; gap:5px;">
    `;

    favCalculations.forEach(f => {
      favCheckHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); padding:6px 10px; border-radius:6px; border:1px solid ${f.isClose?'var(--success)':'var(--border)'}; font-size:11px;">
          <div style="min-width:0; flex:1; margin-right:8px;">
            <b>${esc(f.name)}:</b> ca. <span style="font-weight:800; color:${f.isClose?'var(--success)':'var(--text)'};">${f.km} km</span> · <span style="font-weight:700; color:var(--muted);">${f.min} Min.</span>
            ${f.isClose ? ' <span class="chip stack" style="font-size:9px; padding:1px 6px; color:var(--success); border-color:var(--success); margin-left:4px;">In der Nähe!</span>' : ''}
          </div>
          <button type="button" class="btn btn-ghost" style="padding:2px 8px; font-size:10px; white-space:nowrap;" onclick="window.addRouteWaypoint('${safeJsStr(f.addr)}')">
            ✚ Als Stopp
          </button>
        </div>
      `;
    });
    favCheckHtml += '</div></div>';
  }

  const allWp = [...stops, dest];
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(start)}&waypoints=${encodeURIComponent(allWp.join('|'))}`;

  if(res){
    res.innerHTML = `
      <div style="background:var(--surface2); padding:12px; border-radius:8px; border:1px solid var(--border); font-size:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <b>Rundreise: ca. ${totalKm} km · ${totalMin} Min. Fahrzeit</b>
          <span style="font-weight:700; color:var(--text);">⚡ Stromkosten: ${euro(cost)}</span>
        </div>
        <div style="font-size:11px; color:var(--muted); margin-bottom:6px;">Start & Ende: <b>${esc(start)}</b></div>
        ${favCheckHtml}
        <button type="button" class="btn btn-primary" style="margin-top:10px; width:100%; font-weight:700;" onclick="window.open('${mapsUrl}','_blank')">
          🗺️ In Google Maps öffnen
        </button>
      </div>
    `;
  }
};
// ==================== STAMMDATEN ====================
window.updateMasterForm = function(){
  const cat = gVal('masterType'), grpSel = g('masterGroup'), typSel = g('masterProdType'), artSel = g('masterArticle');
  const mfG = document.querySelector('.mf-grp'), mfT = document.querySelector('.mf-typ'), mfA = document.querySelector('.mf-art');
  const catObj = state.master?.catalog || {};
  if(grpSel) fillSel(grpSel, Object.keys(catObj).sort(sortKeys), 'Gruppe wählen…');
  if(mfG) mfG.style.display = (cat !== 'groups') ? 'grid' : 'none';
  const selGrp = grpSel ? grpSel.value : '';
  const typs = (selGrp && catObj[selGrp]) ? Object.keys(catObj[selGrp]).sort(sortKeys) : [];
  if(typSel) fillSel(typSel, typs, 'Produkttyp wählen…');
  if(mfT) mfT.style.display = (cat === 'articles' || cat === 'sizes' || cat === 'colors') ? 'grid' : 'none';
  const selTyp = typSel ? typSel.value : '';
  const arts = (selGrp && selTyp && catObj[selGrp]?.[selTyp]?.articles) ? catObj[selGrp][selTyp].articles : [];
  if(artSel) fillSel(artSel, arts, 'Artikel wählen…');
  if(mfA) mfA.style.display = (cat === 'sizes' || cat === 'colors') ? 'grid' : 'none';
};

const masterFrm = g('masterForm');
if(masterFrm){
  masterFrm.addEventListener('submit', e => {
    e.preventDefault();
    const cat = gVal('masterType'), val = gVal('masterValue').trim();
    if(!val) return toast('Bitte Wert eingeben.');
    if(!state.master) state.master = {};
    if(!state.master.catalog) state.master.catalog = {};
    const c = state.master.catalog;

    if(cat === 'groups'){ if(!c[val]) c[val] = {}; }
    else if(cat === 'producttypes'){
      const gr = gVal('masterGroup'); if(!gr) return toast('Bitte Gruppe wählen.');
      if(!c[gr]) c[gr] = {}; if(!c[gr][val]) c[gr][val] = { articles: [], sizes: [], colors: [] };
    } else if(cat === 'articles'){
      const gr = gVal('masterGroup'), t = gVal('masterProdType'); if(!gr || !t) return toast('Gruppe & Typ nötig.');
      if(!c[gr]) c[gr] = {}; if(!c[gr][t]) c[gr][t] = { articles: [], sizes: [], colors: [] };
      if(!c[gr][t].articles.includes(val)) c[gr][t].articles.push(val);
    } else if(cat === 'sizes' || cat === 'colors'){
      const gr = gVal('masterGroup'), t = gVal('masterProdType'); if(!gr || !t) return toast('Gruppe & Typ nötig.');
      if(!c[gr]) c[gr] = {}; if(!c[gr][t]) c[gr][t] = { articles: [], sizes: [], colors: [] };
      const list = cat === 'sizes' ? (c[gr][t].sizes = c[gr][t].sizes || []) : (c[gr][t].colors = c[gr][t].colors || []);
      if(!list.includes(val)) list.push(val);
    }
    save(); window.autoSaveToCloud?.(); window.updateMasterForm(); window.renderAllQuick(); window.renderMaster();
    toast('Stammdaten gespeichert ✓'); g('masterValue').value = '';
  });
}

window.renderMaster = function(){
  window.renderMasterImageSection();
  const c = g('masterContent'); if(!c) return;
  const cat = state.master?.catalog || {}; let h = '';
  Object.keys(cat).sort(sortKeys).forEach(grp => {
    const gl = state.master.groupLogos?.[grp] || '';
    h += `
      <div class="card" style="margin-bottom:var(--sp3);">
        <div class="card-head" style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            ${gl ? `<img src="${gl}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;">` : ''}
            <b>${esc(grp)}</b>
          </div>
          <div>
            <button type="button" class="btn btn-ghost" style="padding:2px 8px; font-size:11px;" onclick="window.setGroupLogo('${safeJsStr(grp)}')">🖼 Logo</button>
            <button type="button" class="btn btn-danger" style="padding:2px 8px; font-size:11px;" data-rm="group" data-grp="${esc(grp)}">🗑</button>
          </div>
        </div>
        <div class="card-body">
    `;
    Object.keys(cat[grp] || {}).sort(sortKeys).forEach(tp => {
      h += `<div style="margin-bottom:6px;"><b>🏷 ${esc(tp)}:</b> <span class="muted">${(cat[grp][tp].articles||[]).join(', ')}</span></div>`;
    });
    h += `</div></div>`;
  });
  c.innerHTML = h;
};

// ==================== INITIALISIERUNG ====================
function initApp(){
  ensureCatalogIntegrity();
  populateUhrzeit();
  window.updateMasterForm();
  window.renderAllQuick();
  const gEl = document.getElementById('gasUrl'); 
  if(gEl) gEl.value = localStorage.getItem('gasUrl') || '';
  window.render();
}

function applyState(d){
  try{
    const delSet = new Set(d.deletedIds || state.deletedIds || []); state.deletedIds = Array.from(delSet);
    const delGrps = new Set(d.deletedGroups || state.deletedGroups || []); state.deletedGroups = Array.from(delGrps);
    state.open = Array.isArray(d.open) ? d.open.filter(i => i && !delSet.has(i.id) && !delGrps.has(i.group)) : [];
    if(Array.isArray(d.sold)) state.sold = d.sold.filter(s => s && !delSet.has(s.id));
    if(Array.isArray(d.termine)) state.termine = d.termine.filter(t => t && !delSet.has(t.id));
    if(d.master && typeof d.master === 'object') state.master = d.master;
    ensureCatalogIntegrity();
  }catch(e){console.error(e);}
}

document.addEventListener('click', e => {
  const t = e.target; if(!t) return;
  const el = t.nodeType === 3 ? t.parentElement : t; if(!el || typeof el.closest !== 'function') return;
  const rm = el.closest('[data-rm]');
  if(rm){
    const k = rm.dataset.rm, gp = rm.dataset.grp, tp = rm.dataset.typ, ix = rm.dataset.idx;
    if(k === 'group'){
      if(state.master.catalog[gp]) delete state.master.catalog[gp];
      if(!state.deletedGroups) state.deletedGroups = [];
      if(!state.deletedGroups.includes(gp)) state.deletedGroups.push(gp);
    } else if(k === 'prodtype'){
      if(state.master.catalog[gp]) delete state.master.catalog[gp][tp];
    } else {
      if(state.master.catalog[gp]?.[tp]?.[k]) state.master.catalog[gp][tp][k].splice(+ix, 1);
    }
    save(); window.autoSaveToCloud?.(); window.updateMasterForm(); window.renderAllQuick(); window.renderMaster(); window.renderBestaManager();
  }
});

window.render = function(){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn, .icon-btn[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === state.page));
  const a = g('page-' + state.page); if(a) a.classList.add('active');
  if(state.page === 'new') window.renderAllQuick();
  if(state.page === 'besta') window.renderBestaManager();
  if(state.page === 'sell'){ window.renderSellQuick(); window.renderSellCart(); }
  if(state.page === 'open'){ window.renderOpenFilters(); window.renderOpen(); }
  if(state.page === 'sold') window.renderSold();
  if(state.page === 'route'){ window.renderRouteFavorites(); window.calcRoutePage(); }
  if(state.page === 'master') window.renderMaster();
  if(state.page === 'termin') window.renderTermine();
  if(state.page === 'stats') window.renderStats();
};

load();