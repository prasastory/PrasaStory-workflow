// === Konfigurasi: isi dengan URL Apps Script + SECRET yang sama di appsscript.js ===
const API_URL = "https://script.google.com/macros/s/AKfycbzUymJRIGliJui6I9s2S_CxnHxANecX4H9s7wkk7I2Q2rvF0mV2AD07la5bKYoPXOGo/exec";
const SECRET = "INasangarYTvsygxuahboIHZXO";
// =============================================================================

const STEPS = ["Booked", "Foto Session", "Editing", "Upload Google Drive", "Culling", "Cetak", "Delivered"];
const SHEETS = { client: "Clients", project: "Projects", workflow: "Workflows" };

let cache = { clients: [], projects: [], workflows: [] };
let editId = { client: null, project: null };

// ---------- API ----------
async function api(action, entity, data) {
  const body = JSON.stringify({ secret: SECRET, action, entity, data });
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    mode: "cors",
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

async function loadAll() {
  cache.clients = (await api("list", "client")) || [];
  cache.projects = (await api("list", "project")) || [];
  cache.workflows = (await api("list", "workflow")) || [];
}

// ---------- Helpers ----------
const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden"); setTimeout(() => t.classList.add("hidden"), 2200); }
function clientName(id) { const c = cache.clients.find((x) => x.id === id); return c ? c.name : "-"; }

// ---------- Navigasi ----------
$("#nav").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-item");
  if (!btn) return;
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  const tab = btn.dataset.tab;
  $("#page-title").textContent = btn.textContent;
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  $("#view-" + tab).classList.remove("hidden");
  if (tab === "dashboard") renderDashboard();
  if (tab === "client") renderClients();
  if (tab === "project") renderProjects();
  if (tab === "workflow") renderWorkflow();
});

// ---------- Dashboard ----------
function renderDashboard() {
  const c = cache.clients.length, p = cache.projects.length;
  const done = cache.workflows.filter((w) => w.status === "Delivered").length;
  const cards = [
    { label: "Clients", value: c, color: "green" },
    { label: "Projects", value: p, color: "teal" },
    { label: "Workflow Delivered", value: done, color: "mint" },
  ];
  const wrap = $("#stat-cards"); wrap.innerHTML = "";
  cards.forEach((x) => { const d = el("div", "stat-card " + x.color); d.innerHTML = `<div class="stat-value">${x.value}</div><div class="stat-label">${x.label}</div>`; wrap.appendChild(d); });
}

// ---------- Clients ----------
function renderClients() {
  const q = ($("#search-client").value || "").toLowerCase();
  const list = cache.clients.filter((c) => c.name.toLowerCase().includes(q));
  const box = $("#client-list"); box.innerHTML = "";
  if (!list.length) { box.appendChild(el("p", "hint", "Belum ada client.")); return; }
  list.forEach((c) => {
    const card = el("div", "data-card");
    card.innerHTML = `<div class="data-head"><strong>${c.name}</strong><span class="row-actions"><button class="btn-sm" data-edit="${c.id}">Edit</button><button class="btn-sm danger" data-del="${c.id}">Hapus</button></span></div>
      <div class="data-body">${c.email ? "✉ " + c.email + "<br>" : ""}${c.phone ? "☎ " + c.phone + "<br>" : ""}${c.ig ? "📷 " + c.ig + "<br>" : ""}${c.address ? "📍 " + c.address : ""}</div>`;
    box.appendChild(card);
  });
  box.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => openClientForm(b.dataset.edit));
  box.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => delClient(b.dataset.del));
}

function openClientForm(id) {
  editId.client = id || null;
  $("#client-form-title").textContent = id ? "Edit Client" : "Tambah Client";
  const c = cache.clients.find((x) => x.id === id);
  $("#c-name").value = c ? c.name : "";
  $("#c-email").value = c ? c.email || "" : "";
  $("#c-phone").value = c ? c.phone || "" : "";
  $("#c-ig").value = c ? c.ig || "" : "";
  $("#c-address").value = c ? c.address || "" : "";
  $("#c-notes").value = c ? c.notes || "" : "";
  $("#form-client").classList.remove("hidden");
}

$("#add-client").onclick = () => openClientForm(null);
$("#cancel-client").onclick = () => $("#form-client").classList.add("hidden");
$("#search-client").oninput = renderClients;
$("#form-client").onsubmit = async (e) => {
  e.preventDefault();
  const data = { name: $("#c-name").value, email: $("#c-email").value, phone: $("#c-phone").value, ig: $("#c-ig").value, address: $("#c-address").value, notes: $("#c-notes").value };
  try {
    if (editId.client) await api("update", "client", { id: editId.client, ...data });
    else await api("create", "client", data);
    await loadAll(); renderClients(); $("#form-client").classList.add("hidden"); toast("Tersimpan");
  } catch (err) { toast("Gagal: " + err.message); }
};

async function delClient(id) {
  if (!confirm("Hapus client ini?")) return;
  try { await api("delete", "client", { id }); await loadAll(); renderClients(); toast("Dihapus"); } catch (err) { toast("Gagal: " + err.message); }
}

// ---------- Projects ----------
function fillClientSelect() {
  const sel = $("#p-client"); sel.innerHTML = '<option value="">Pilih client</option>';
  cache.clients.forEach((c) => sel.appendChild(el("option", null, c.name)).setAttribute("value", c.id));
}

function renderProjects() {
  fillClientSelect();
  const q = ($("#search-project").value || "").toLowerCase();
  const list = cache.projects.filter((p) => p.title.toLowerCase().includes(q));
  const box = $("#project-list"); box.innerHTML = "";
  if (!list.length) { box.appendChild(el("p", "hint", "Belum ada project.")); return; }
  list.forEach((p) => {
    const card = el("div", "data-card");
    card.innerHTML = `<div class="data-head"><strong>${p.title}</strong><span class="row-actions"><button class="btn-sm" data-edit="${p.id}">Edit</button><button class="btn-sm danger" data-del="${p.id}">Hapus</button></span></div>
      <div class="data-body">👤 ${clientName(p.client_id)}<br>${p.date ? "📅 " + p.date + "<br>" : ""}${p.location ? "📍 " + p.location + "<br>" : ""}${p.package ? "🎁 " + p.package + "<br>" : ""}${p.photographer ? "📸 " + p.photographer + "<br>" : ""}${p.editor ? "🖌 " + p.editor + "<br>" : ""}${p.status ? "● " + p.status : ""}</div>`;
    box.appendChild(card);
  });
  box.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => openProjectForm(b.dataset.edit));
  box.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => delProject(b.dataset.del));
}

function openProjectForm(id) {
  editId.project = id || null;
  $("#project-form-title").textContent = id ? "Edit Project" : "Tambah Project";
  const p = cache.projects.find((x) => x.id === id);
  fillClientSelect();
  if (p) {
    $("#p-client").value = p.client_id || "";
    $("#p-title").value = p.title || "";
    $("#p-date").value = p.date || "";
    $("#p-location").value = p.location || "";
    $("#p-package").value = p.package || "";
    $("#p-photographer").value = p.photographer || "";
    $("#p-editor").value = p.editor || "";
    $("#p-status").value = p.status || "";
  } else {
    ["p-client","p-title","p-date","p-location","p-photographer","p-editor"].forEach((i) => $(i ? "#" + i : i).value = "");
    $("#p-package").value = ""; $("#p-status").value = "";
  }
  $("#form-project").classList.remove("hidden");
}

$("#add-project").onclick = () => openProjectForm(null);
$("#cancel-project").onclick = () => $("#form-project").classList.add("hidden");
$("#search-project").oninput = renderProjects;
$("#form-project").onsubmit = async (e) => {
  e.preventDefault();
  const data = { client_id: $("#p-client").value, title: $("#p-title").value, date: $("#p-date").value, location: $("#p-location").value, package: $("#p-package").value, photographer: $("#p-photographer").value, editor: $("#p-editor").value, status: $("#p-status").value };
  try {
    if (editId.project) await api("update", "project", { id: editId.project, ...data });
    else {
      const created = await api("create", "project", data);
      // buat 7 workflow step otomatis
      for (const s of STEPS) await api("create", "workflow", { project_id: created.id, step: s, status: s === "Booked" ? "Done" : "Todo", due: "", notes: "" });
    }
    await loadAll(); renderProjects(); $("#form-project").classList.add("hidden"); toast("Tersimpan");
  } catch (err) { toast("Gagal: " + err.message); }
};

async function delProject(id) {
  if (!confirm("Hapus project (dan workflow-nya)?")) return;
  try {
    const wfs = cache.workflows.filter((w) => w.project_id === id);
    for (const w of wfs) await api("delete", "workflow", { id: w.id });
    await api("delete", "project", { id });
    await loadAll(); renderProjects(); toast("Dihapus");
  } catch (err) { toast("Gagal: " + err.message); }
}

// ---------- Workflow ----------
function fillWfProject() {
  const sel = $("#wf-project"); sel.innerHTML = '<option value="">Pilih project</option>';
  cache.projects.forEach((p) => sel.appendChild(el("option", null, p.title)).setAttribute("value", p.id));
}

function renderWorkflow() {
  fillWfProject();
  const pid = $("#wf-project").value;
  const board = $("#wf-board"); board.innerHTML = "";
  if (!pid) { board.appendChild(el("p", "hint", "Pilih project untuk lihat workflow.")); return; }
  const wfs = cache.workflows.filter((w) => String(w.project_id) === String(pid)).sort((a, b) => STEPS.indexOf(a.step) - STEPS.indexOf(b.step));
  STEPS.forEach((step) => {
    const w = wfs.find((x) => x.step === step);
    const col = el("div", "step-col");
    col.innerHTML = `<div class="step-title">${step}</div>`;
    const card = el("div", "step-card " + (w ? (w.status === "Done" ? "done" : "todo") : "empty"));
    if (w) {
      card.innerHTML = `<div class="step-status">${w.status === "Done" ? "✓ Done" : "○ Todo"}</div>${w.due ? "<div class='step-due'>📅 " + w.due + "</div>" : ""}${w.notes ? "<div class='step-notes'>" + w.notes + "</div>" : ""}<div class="row-actions"><button class='btn-sm' data-toggle='" + w.id + "'>Toggle</button><button class='btn-sm danger' data-wdel='" + w.id + "'>✕</button></div>`;
    } else {
      card.innerHTML = `<button class='btn-sm add-step' data-add='" + pid + "' data-step='" + step + "'>+ Add</button>`;
    }
    col.appendChild(card); board.appendChild(col);
  });
  board.querySelectorAll("[data-toggle]").forEach((b) => b.onclick = () => toggleStep(JSON.parse(b.dataset.toggle)));
  board.querySelectorAll("[data-wdel]").forEach((b) => b.onclick = () => delStep(JSON.parse(b.dataset.wdel)));
  board.querySelectorAll("[data-add]").forEach((b) => b.onclick = () => addStep(JSON.parse(b.dataset.add), b.dataset.step));
}

async function toggleStep(id) {
  const w = cache.workflows.find((x) => x.id === id);
  await api("update", "workflow", { id, status: w.status === "Done" ? "Todo" : "Done" });
  await loadAll(); renderWorkflow();
}
async function addStep(pid, step) {
  await api("create", "workflow", { project_id: pid, step, status: "Todo", due: "", notes: "" });
  await loadAll(); renderWorkflow();
}
async function delStep(id) {
  await api("delete", "workflow", { id });
  await loadAll(); renderWorkflow();
}
$("#wf-project").onchange = renderWorkflow;

// ---------- Init ----------
(async function init() {
  try { await loadAll(); renderDashboard(); }
  catch (err) { toast("Gagal muat data: " + err.message); }
})();
