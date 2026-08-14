// ============================================================
//  Prasa Workflow — frontend statis (GitHub Pages)
//  GANTI dua nilai di bawah:
//    API_URL = URL Web App dari Deploy Apps Script
//    SECRET  = sama persis dengan SECRET di appsscript.js
// ============================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbyYihD9tlqSS04-n0rYQPd8YGtmiUAdC0sUYcN167LhxbC-hhHAcZhud-kmtDONxZ58/exec';
const SECRET  = 'SecreTInisangaTRahaSia';

const MODEL = {
  clients: {
    label: 'Klien',
    fields: [
      { key: 'name', label: 'Nama', type: 'text', required: true },
      { key: 'contact', label: 'Kontak', type: 'text' },
      { key: 'notes', label: 'Catatan', type: 'text' },
    ],
  },
  projects: {
    label: 'Proyek',
    fields: [
      { key: 'clientId', label: 'Klien', type: 'ref', ref: 'clients', required: true },
      { key: 'name', label: 'Nama Proyek', type: 'text', required: true },
      { key: 'date', label: 'Tanggal', type: 'date' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'notes', label: 'Catatan', type: 'text' },
    ],
  },
  workflows: {
    label: 'Workflow',
    fields: [
      { key: 'projectId', label: 'Proyek', type: 'ref', ref: 'projects', required: true },
      { key: 'name', label: 'Nama Tahapan', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'dueDate', label: 'Deadline', type: 'date' },
      { key: 'step', label: 'Urutan', type: 'number' },
      { key: 'notes', label: 'Catatan', type: 'text' },
    ],
  },
};

let CACHE = { clients: [], projects: [], workflows: [] };
let current = 'clients';
let editing = null; // { entity, id }

async function api(action, entity, data, id) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain = hindari CORS preflight
    body: JSON.stringify({ secret: SECRET, action, entity, data: data || {}, id }),
  });
  const j = await res.json();
  if (j.error) throw new Error(j.error);
  return j;
}

async function refresh(entity) {
  CACHE[entity] = await api('list', entity);
  renderSection(entity);
}

function nameOf(entity, id) {
  const r = (CACHE[entity] || []).find((x) => x.id === id);
  return r ? (r.name || r.id) : '-';
}

function renderTabs() {
  const nav = document.getElementById('tabs');
  nav.innerHTML = '';
  Object.keys(MODEL).forEach((e) => {
    const b = document.createElement('button');
    b.textContent = MODEL[e].label;
    b.className = 'tab' + (e === current ? ' active' : '');
    b.onclick = () => selectTab(e);
    nav.appendChild(b);
  });
}

function selectTab(e) {
  current = e;
  editing = null;
  renderTabs();
  renderSection(e);
}

async function init() {
  renderTabs();
  await refresh('clients');
  await refresh('projects');
  await refresh('workflows');
  renderSection(current);
}

function renderSection(entity) {
  const m = MODEL[entity];
  const sec = document.getElementById('section');
  sec.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = m.label;
  sec.appendChild(title);

  // --- form ---
  const form = document.createElement('form');
  form.className = 'card';
  m.fields.forEach((f) => {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const lab = document.createElement('label');
    lab.textContent = f.label;
    wrap.appendChild(lab);
    let inp;
    if (f.type === 'ref') {
      inp = document.createElement('select');
      const o0 = document.createElement('option');
      o0.value = ''; o0.textContent = '— pilih —';
      inp.appendChild(o0);
      (CACHE[f.ref] || []).forEach((r) => {
        const o = document.createElement('option');
        o.value = r.id; o.textContent = r.name || r.id;
        inp.appendChild(o);
      });
    } else {
      inp = document.createElement('input');
      inp.type = f.type || 'text';
    }
    inp.name = f.key;
    wrap.appendChild(inp);
    form.appendChild(wrap);
  });
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = editing ? 'Simpan Perubahan' : 'Tambah';
  form.appendChild(btn);
  if (editing) {
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Batal';
    cancel.onclick = () => { editing = null; renderSection(entity); };
    form.appendChild(cancel);
  }
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const data = {};
    for (const f of m.fields) {
      const v = form[f.key].value;
      if (f.required && !v) { alert(f.label + ' wajib diisi'); return; }
      if (v !== '') data[f.key] = v;
    }
    try {
      if (editing) { await api('update', entity, data, editing.id); editing = null; }
      else { await api('create', entity, data); }
      await refresh(entity);
    } catch (err) { alert('Error: ' + err.message); }
  };
  sec.appendChild(form);

  // --- table ---
  const rows = CACHE[entity] || [];
  if (rows.length) {
    const table = document.createElement('table');
    table.className = 'card';
    const thead = document.createElement('tr');
    m.fields.forEach((f) => {
      const th = document.createElement('th');
      th.textContent = f.label; thead.appendChild(th);
    });
    const thA = document.createElement('th');
    thA.textContent = 'Aksi'; thead.appendChild(thA);
    table.appendChild(thead);
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      m.fields.forEach((f) => {
        const td = document.createElement('td');
        td.textContent = f.type === 'ref' ? nameOf(f.ref, r[f.key]) : (r[f.key] || '');
        tr.appendChild(td);
      });
      const td = document.createElement('td');
      const eb = document.createElement('button');
      eb.textContent = 'Edit';
      eb.onclick = () => startEdit(entity, r);
      td.appendChild(eb);
      const db = document.createElement('button');
      db.textContent = 'Hapus';
      db.onclick = async () => {
        if (confirm('Hapus data ini?')) { await api('delete', entity, {}, r.id); await refresh(entity); }
      };
      td.appendChild(db);
      tr.appendChild(td);
      table.appendChild(tr);
    });
    sec.appendChild(table);
  }
}

function startEdit(entity, r) {
  editing = { entity, id: r.id };
  renderSection(entity);
  const m = MODEL[entity];
  m.fields.forEach((f) => {
    const el = document.querySelector('#section form [name="' + f.key + '"]');
    if (el) el.value = r[f.key] || '';
  });
}

init();
