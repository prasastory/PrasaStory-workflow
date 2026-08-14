const API_URL =
  "https://script.google.com/macros/s/AKfycbyr2oW3ET-yne_n2TrO9aJYUcSwpru0siGzhlWNVNp77krlQ0rUSiWLWurAfsdmhbHi/exec";

const SECRET =
  "INasangarYTvsygxuahboIHZXOI";

const STEPS = [
  "Booked",
  "Foto Session",
  "Editing",
  "Upload Google Drive",
  "Culling",
  "Cetak",
  "Delivered"
];

let cache = {
  clients: [],
  projects: [],
  workflows: []
};

let editClientId = null;
let editProjectId = null;

const $ = (s) => document.querySelector(s);

function toast(message) {
  const t = $("#toast");

  t.textContent = message;
  t.classList.remove("hidden");

  setTimeout(() => {
    t.classList.add("hidden");
  }, 2000);
}

async function api(
  action,
  entity,
  data = {}
) {
  const res = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain"
    },

    body: JSON.stringify({
      secret: SECRET,
      action,
      entity,
      data
    })
  });

  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.error);
  }

  return json.data;
}

async function loadAll() {
  cache.clients =
    (await api(
      "list",
      "client"
    )) || [];

  cache.projects =
    (await api(
      "list",
      "project"
    )) || [];

  cache.workflows =
    (await api(
      "list",
      "workflow"
    )) || [];
}

function clientName(id) {
  const client =
    cache.clients.find(
      (c) =>
        String(c.id) ===
        String(id)
    );

  return client
    ? client.name
    : "-";
}

$("#nav").addEventListener(
  "click",
  (e) => {
    const btn =
      e.target.closest(
        ".nav-item"
      );

    if (!btn) return;

    document
      .querySelectorAll(
        ".nav-item"
      )
      .forEach((b) =>
        b.classList.remove(
          "active"
        )
      );

    btn.classList.add(
      "active"
    );

    const tab =
      btn.dataset.tab;

    $("#page-title").textContent =
      btn.textContent;

    document
      .querySelectorAll(
        ".view"
      )
      .forEach((v) =>
        v.classList.add(
          "hidden"
        )
      );

    const view = $(
      "#view-" + tab
    );

    if (view) {
      view.classList.remove(
        "hidden"
      );
    }

    if (tab === "dashboard")
      renderDashboard();

    if (tab === "client")
      renderClients();

    if (tab === "project")
      renderProjects();

    if (tab === "workflow")
      renderWorkflow();
  }
);

function renderDashboard() {
  const wrap =
    $("#stat-cards");

  wrap.innerHTML = "";

  const delivered =
    cache.workflows.filter(
      (w) =>
        w.step ===
          "Delivered" &&
        w.status === "Done"
    ).length;

  const cards = [
    {
      label: "Clients",
      value:
        cache.clients.length,
      color: "green"
    },

    {
      label: "Projects",
      value:
        cache.projects.length,
      color: "teal"
    },

    {
      label: "Delivered",
      value: delivered,
      color: "mint"
    }
  ];

  cards.forEach((c) => {
    const div =
      document.createElement(
        "div"
      );

    div.className =
      "stat-card " +
      c.color;

    div.innerHTML = `
      <div class="stat-value">
        ${c.value}
      </div>

      <div class="stat-label">
        ${c.label}
      </div>
    `;

    wrap.appendChild(div);
  });
}

function renderClients() {
  const box =
    $("#client-list");

  const keyword =
    $("#search-client")
      .value
      .toLowerCase();

  const clients =
    cache.clients.filter(
      (c) =>
        c.name
          .toLowerCase()
          .includes(keyword)
    );

  box.innerHTML = "";

  clients.forEach((c) => {
    const card =
      document.createElement(
        "div"
      );

    card.className =
      "data-card";

    card.innerHTML = `
      <div class="data-head">
        <strong>${c.name}</strong>

        <span class="row-actions">
          <button
            class="btn-sm edit-client"
            data-id="${c.id}">
            Edit
          </button>

          <button
            class="btn-sm danger delete-client"
            data-id="${c.id}">
            Hapus
          </button>
        </span>
      </div>

      <div class="data-body">
        ${c.email || ""}
        <br>
        ${c.phone || ""}
        <br>
        ${c.ig || ""}
      </div>
    `;

    box.appendChild(card);
  });

  document
    .querySelectorAll(
      ".edit-client"
    )
    .forEach((b) => {
      b.onclick = () => {
        openClient(
          b.dataset.id
        );
      };
    });

  document
    .querySelectorAll(
      ".delete-client"
    )
    .forEach((b) => {
      b.onclick = () =>
        deleteClient(
          b.dataset.id
        );
    });
}

function openClient(id) {
  editClientId = id;

  const c =
    cache.clients.find(
      (x) =>
        String(x.id) ===
        String(id)
    );

  $("#form-client")
    .classList.remove(
      "hidden"
    );

  $("#c-name").value =
    c?.name || "";

  $("#c-email").value =
    c?.email || "";

  $("#c-phone").value =
    c?.phone || "";

  $("#c-ig").value =
    c?.ig || "";

  $("#c-address").value =
    c?.address || "";

  $("#c-notes").value =
    c?.notes || "";
}

$("#add-client").onclick =
  () => {
    editClientId = null;

    $("#form-client")
      .reset();

    $("#form-client")
      .classList.remove(
        "hidden"
      );
  };

$("#cancel-client").onclick =
  () => {
    $("#form-client")
      .classList.add(
        "hidden"
      );
  };

$("#search-client").oninput =
  renderClients;

$("#form-client").onsubmit =
  async (e) => {
    e.preventDefault();

    const data = {
      name:
        $("#c-name").value,
      email:
        $("#c-email")
          .value,
      phone:
        $("#c-phone")
          .value,
      ig: $("#c-ig").value,
      address:
        $("#c-address")
          .value,
      notes:
        $("#c-notes")
          .value
    };

    if (editClientId) {
      data.id =
        editClientId;

      await api(
        "update",
        "client",
        data
      );
    } else {
      await api(
        "create",
        "client",
        data
      );
    }

    await loadAll();

    renderClients();

    $("#form-client")
      .classList.add(
        "hidden"
      );

    toast("Tersimpan");
  };

async function deleteClient(
  id
) {
  if (!confirm("Hapus?"))
    return;

  await api(
    "delete",
    "client",
    { id }
  );

  await loadAll();

  renderClients();

  toast("Dihapus");
}

function fillProjectClients() {
  const select =
    $("#p-client");

  select.innerHTML =
    '<option value="">Pilih client</option>';

  cache.clients.forEach(
    (c) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        c.id;

      option.textContent =
        c.name;

      select.appendChild(
        option
      );
    }
  );
}

function renderProjects() {
  fillProjectClients();

  const box =
    $("#project-list");

  box.innerHTML = "";

  cache.projects.forEach(
    (p) => {
      const card =
        document.createElement(
          "div"
        );

      card.className =
        "data-card";

      card.innerHTML = `
        <div class="data-head">
          <strong>
            ${p.title}
          </strong>
        </div>

        <div class="data-body">
          Client:
          ${clientName(
            p.client_id
          )}
          <br>

          Tanggal:
          ${p.date}

          <br>

          Lokasi:
          ${p.location}
        </div>
      `;

      box.appendChild(card);
    }
  );

  fillWorkflowProjects();
}

function fillWorkflowProjects() {
  const select =
    $("#wf-project");

  select.innerHTML =
    '<option value="">Pilih project</option>';

  cache.projects.forEach(
    (p) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        p.id;

      option.textContent =
        p.title;

      select.appendChild(
        option
      );
    }
  );
}

function renderWorkflow() {
  const board =
    $("#wf-board");

  const pid =
    $("#wf-project")
      .value;

  board.innerHTML = "";

  if (!pid) return;

  const workflows =
    cache.workflows.filter(
      (w) =>
        String(
          w.project_id
        ) === String(pid)
    );

  STEPS.forEach((step) => {
    const item =
      workflows.find(
        (w) =>
          w.step === step
      );

    const column =
      document.createElement(
        "div"
      );

    column.className =
      "step-col";

    column.innerHTML = `
      <div class="step-title">
        ${step}
      </div>

      <div class="step-card ${
        item?.status ===
        "Done"
          ? "done"
          : "todo"
      }">

      ${
        item
          ? `
          <div class="step-status">
            ${item.status}
          </div>

          <button
            class="btn-sm toggle"
            data-id="${item.id}">
            Toggle
          </button>
        `
          : ""
      }

      </div>
    `;

    board.appendChild(
      column
    );
  });

  document
    .querySelectorAll(
      ".toggle"
    )
    .forEach((b) => {
      b.onclick =
        async () => {
          const workflow =
            cache.workflows.find(
              (w) =>
                String(
                  w.id
                ) ===
                String(
                  b.dataset.id
                )
            );

          await api(
            "update",
            "workflow",
            {
              id:
                workflow.id,
              status:
                workflow.status ===
                "Done"
                  ? "Todo"
                  : "Done"
            }
          );

          await loadAll();

          renderWorkflow();

          renderDashboard();
        };
    });
}

$("#wf-project").onchange =
  renderWorkflow;

(async function () {
  try {
    await loadAll();

    renderDashboard();

    renderClients();

    renderProjects();

  } catch (e) {
    toast(e.message);
  }
})();
