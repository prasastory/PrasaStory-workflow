const API_URL =
  "https://script.google.com/macros/s/AKfycbwozsahjM-uLQR3T9zYJp99x_eE4qp7kJTFtuEupMPx_2ScDhzChkMXGN2DqMYUzpSj/exec";

// Secret tidak di-hardcode di sini agar tidak kelihatan di source publik.
// Masukkan password yang sama dengan SECRET di appsscript.js (server-side).
const SECRET =
  prompt(
    "Masukkan password aplikasi:"
  );

const WORKFLOW_STEPS = [
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
  const toast = $("#toast");

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

async function api(
  action,
  entity,
  data = {}
) {
  const response = await fetch(
    API_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "text/plain"
      },

      body: JSON.stringify({
        secret: SECRET,
        action,
        entity,
        data
      })
    }
  );

  const json =
    await response.json();

  if (!json.ok) {
    throw new Error(
      json.error
    );
  }

  return json.data;
}

async function loadData() {
  cache.clients =
    await api(
      "list",
      "client"
    );

  cache.projects =
    await api(
      "list",
      "project"
    );

  cache.workflows =
    await api(
      "list",
      "workflow"
    );
}

function showPage(page) {
  document
    .querySelectorAll(
      ".page"
    )
    .forEach((p) =>
      p.classList.add(
        "hidden"
      )
    );

  document
    .querySelectorAll(
      ".menu-btn"
    )
    .forEach((b) =>
      b.classList.remove(
        "active"
      )
    );

  $("#" + page + "-page")
    .classList.remove(
      "hidden"
    );

  document
    .querySelector(
      `[data-page="${page}"]`
    )
    .classList.add(
      "active"
    );

  $("#page-title").textContent =
    page
      .charAt(0)
      .toUpperCase() +
    page.slice(1);

  if (page === "clients") {
    renderClients();
  }

  if (page === "projects") {
    renderProjects();
  }

  if (page === "workflow") {
    renderWorkflow();
  }

  if (page === "tasks") {
    renderTasks();
  }

  if (page === "calendar") {
    renderCalendar();
  }

  if (page === "reports") {
    renderReports();
  }
}

document
  .querySelectorAll(
    ".menu-btn"
  )
  .forEach((button) => {
    button.onclick = () =>
      showPage(
        button.dataset.page
      );
  });

function renderDashboard() {
  $(
    "#total-clients"
  ).textContent =
    cache.clients.length;

  $(
    "#total-projects"
  ).textContent =
    cache.projects.length;

  const finished =
    cache.projects.filter(
      (p) =>
        cache.workflows.some(
          (w) =>
            String(
              w.project_id
            ) ===
              String(p.id) &&
            w.step ===
              "Delivered" &&
            w.status ===
              "Done"
        )
    );

  $(
    "#finished-projects"
  ).textContent =
    finished.length;

  $(
    "#active-projects"
  ).textContent =
    cache.projects.length -
    finished.length;
}

function renderClients() {
  const list =
    $("#client-list");

  list.innerHTML = "";

  const keyword =
    $("#client-search")
      .value
      .toLowerCase();

  cache.clients
    .filter((c) =>
      c.name
        .toLowerCase()
        .includes(keyword)
    )
    .forEach((client) => {
      const card =
        document.createElement(
          "div"
        );

      card.className =
        "list-card";

      card.innerHTML = `
        <div class="list-header">
          <strong>${client.name}</strong>

          <div class="actions">
            <button
              class="edit-btn"
              onclick="editClient(${client.id})">
              Edit
            </button>

            <button
              class="delete-btn"
              onclick="deleteClient(${client.id})">
              Hapus
            </button>
          </div>
        </div>

        <div>
          ${client.phone}
        </div>
      `;

      list.appendChild(card);
    });
}

$("#client-search").oninput =
  renderClients;

$("#add-client-btn").onclick =
  () => {
    editClientId = null;

    $("#client-form").reset();

    $("#client-form")
      .classList.remove(
        "hidden"
      );
  };

$("#cancel-client-btn").onclick =
  () => {
    $("#client-form")
      .classList.add(
        "hidden"
      );
  };

window.editClient =
  function (id) {
    editClientId = id;

    const client =
      cache.clients.find(
        (c) => c.id == id
      );

    $("#client-name").value =
      client.name;

    $("#client-phone").value =
      client.phone;

    $("#client-email").value =
      client.email;

    $("#client-instagram").value =
      client.ig;

    $("#client-address").value =
      client.address;

    $("#client-notes").value =
      client.notes;

    $("#client-form")
      .classList.remove(
        "hidden"
      );
  };

window.deleteClient =
  async function (id) {
    if (!confirm("Hapus?")) {
      return;
    }

    await api(
      "delete",
      "client",
      { id }
    );

    await refresh();
  };

$("#client-form").onsubmit =
  async (e) => {
    e.preventDefault();

    const data = {
      name:
        $("#client-name")
          .value,
      phone:
        $("#client-phone")
          .value,
      email:
        $("#client-email")
          .value,
      ig:
        $("#client-instagram")
          .value,
      address:
        $("#client-address")
          .value,
      notes:
        $("#client-notes")
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

    await refresh();

    $("#client-form")
      .classList.add(
        "hidden"
      );
  };

function fillClientSelect() {
  const select =
    $("#project-client");

  select.innerHTML =
    '<option value="">Pilih Client</option>';

  cache.clients.forEach(
    (client) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        client.id;

      option.textContent =
        client.name;

      select.appendChild(
        option
      );
    }
  );
}

function renderProjects() {
  fillClientSelect();

  const list =
    $("#project-list");

  list.innerHTML = "";

  const keyword =
    $("#project-search")
      .value
      .toLowerCase();

  cache.projects
    .filter((p) =>
      p.title
        .toLowerCase()
        .includes(keyword)
    )
    .forEach((project) => {
      const card =
        document.createElement(
          "div"
        );

      card.className =
        "list-card";

      card.innerHTML = `
        <div class="list-header">

          <strong>
            ${project.title}
          </strong>

          <div class="actions">

            <button
              class="edit-btn"
              onclick="editProject(${project.id})">
              Edit
            </button>

            <button
              class="delete-btn"
              onclick="deleteProject(${project.id})">
              Hapus
            </button>

          </div>

        </div>

        <div>
          ${project.location}
        </div>

      `;

      list.appendChild(card);
    });

  fillWorkflowProjects();
}

$("#add-project-btn").onclick =
  () => {
    editProjectId = null;

    $("#project-form")
      .reset();

    fillClientSelect();

    $("#project-form")
      .classList.remove(
        "hidden"
      );
  };

$("#cancel-project-btn").onclick =
  () => {
    $("#project-form")
      .classList.add(
        "hidden"
      );
  };

$("#project-search").oninput =
  renderProjects;

window.editProject =
  function (id) {
    editProjectId = id;

    const project =
      cache.projects.find(
        (p) => p.id == id
      );

    $("#project-client").value =
      project.client_id;

    $("#project-title").value =
      project.title;

    $("#project-date").value =
      project.date;

    $("#project-location").value =
      project.location;

    $("#project-package").value =
      project.package;

    $("#project-photographer").value =
      project.photographer;

    $("#project-editor").value =
      project.editor;

    $("#project-form")
      .classList.remove(
        "hidden"
      );
  };

window.deleteProject =
  async function (id) {
    if (!confirm("Hapus?")) {
      return;
    }

    await api(
      "delete",
      "project",
      { id }
    );

    await refresh();
  };

$("#project-form").onsubmit =
  async (e) => {
    e.preventDefault();

    if (
      !$("#project-client").value
    ) {
      toast(
        "Pilih client dulu"
      );

      return;
    }

    const data = {
      client_id:
        $("#project-client")
          .value,

      title:
        $("#project-title")
          .value,

      date:
        $("#project-date")
          .value,

      location:
        $(
          "#project-location"
        ).value,

      package:
        $(
          "#project-package"
        ).value,

      photographer:
        $(
          "#project-photographer"
        ).value,

      editor:
        $("#project-editor")
          .value
    };

    if (editProjectId) {
      data.id = editProjectId;

      await api(
        "update",
        "project",
        data
      );
    } else {
      await api(
        "create",
        "project",
        data
      );
    }

    await refresh();

    $("#project-form")
      .classList.add(
        "hidden"
      );
  };

function fillWorkflowProjects() {
  const select = $(
    "#workflow-project-select"
  );

  select.innerHTML =
    '<option value="">Pilih Project</option>';

  cache.projects.forEach(
    (project) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        project.id;

      option.textContent =
        project.title;

      select.appendChild(
        option
      );
    }
  );
}

function renderWorkflow() {
  fillWorkflowProjects();

  const board =
    $("#workflow-board");

  board.innerHTML = "";

  const projectId =
    $(
      "#workflow-project-select"
    ).value;

  if (!projectId) {
    return;
  }

  const workflows =
    cache.workflows.filter(
      (w) =>
        String(
          w.project_id
        ) ===
        String(projectId)
    );

  workflows.forEach((w) => {
    const card =
      document.createElement(
        "div"
      );

    card.className =
      "workflow-column";

    card.innerHTML = `
      <div class="workflow-title">
        ${w.step}
      </div>

      <div class="workflow-card">

        <div class="workflow-status">
          ${w.status}
        </div>

        ${
          w.status !== "Done"
            ? `
            <button
              onclick="finishWorkflow(${w.id})">
              Selesaikan
            </button>
          `
            : ""
        }

      </div>
    `;

    board.appendChild(card);
  });
}

$("#workflow-project-select")
  .onchange =
  renderWorkflow;

window.finishWorkflow =
  async function (id) {
    const current =
      cache.workflows.find(
        (w) => w.id == id
      );

    const projectSteps =
      cache.workflows
        .filter(
          (w) =>
            w.project_id ==
            current.project_id
        )
        .sort(
          (a, b) =>
            WORKFLOW_STEPS.indexOf(
              a.step
            ) -
            WORKFLOW_STEPS.indexOf(
              b.step
            )
        );

    const index =
      projectSteps.findIndex(
        (w) => w.id == id
      );

    await api(
      "update",
      "workflow",
      {
        id,
        status: "Done"
      }
    );

    if (
      index <
      projectSteps.length - 1
    ) {
      await api(
        "update",
        "workflow",
        {
          id:
            projectSteps[
              index + 1
            ].id,

          status:
            "Progress"
        }
      );
    }

    await refresh();
  };

function renderTasks() {
  const list =
    $("#task-list");

  list.innerHTML = "";

  cache.workflows
    .filter(
      (w) =>
        w.status ===
        "Progress"
    )
    .forEach((w) => {
      const project =
        cache.projects.find(
          (p) =>
            p.id ==
            w.project_id
        );

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "list-card";

      card.innerHTML = `
        ${project.title}
        <br>
        ${w.step}
      `;

      list.appendChild(card);
    });
}

let calendarYear =
  new Date().getFullYear();

let calendarMonth =
  new Date().getMonth();

let calendarView =
  "year"; // "year" | "month"

const WEEKDAYS = [
  "Min",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab"
];

function buildMonthCard(
  year,
  month,
  large
) {
  const byDate = {};

  cache.projects.forEach((p) => {
    if (p.date) {
      (byDate[p.date] =
        byDate[p.date] || []).push(
        p.title
      );
    }
  });

  const monthName =
    new Date(
      year,
      month,
      1
    ).toLocaleString("id", {
      month: "long"
    });

  const first = new Date(
    year,
    month,
    1
  ).getDay();

  const days = new Date(
    year,
    month + 1,
    0
  ).getDate();

  let cells = "";

  for (let i = 0; i < first; i++) {
    cells +=
      '<div class="cal-empty"></div>';
  }

  for (let d = 1; d <= days; d++) {
    const key = `${year}-${String(
      month + 1
    ).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;

    const items = byDate[key]
      ? byDate[key]
          .map(
            (t) =>
              `<small>${t}</small>`
          )
          .join("")
      : "";

    cells += `<div class="cal-cell">${d}${items}</div>`;
  }

  const card =
    document.createElement(
      "div"
    );

  card.className =
    "cal-month";

  if (large) {
    card.style.maxWidth =
      "520px";

    card.style.margin =
      "0 auto";
  }

  card.innerHTML = `
    <h4 style="margin:0 0 10px 0; color:var(--primary);">
      ${monthName} ${year}
    </h4>

    <div class="cal-weekdays">
      ${WEEKDAYS.map(
        (w) => `<span>${w}</span>`
      ).join("")}
    </div>

    <div class="cal-grid"${
      large
        ? ' style="gap:8px;"'
        : ""
    }>${cells}</div>
  `;

  return card;
}

function renderCalendar() {
  const list =
    $("#calendar-list");

  list.innerHTML = "";

  $(
    "#cal-nav-year"
  ).classList.toggle(
    "hidden",
    calendarView !== "year"
  );

  $(
    "#cal-nav-month"
  ).classList.toggle(
    "hidden",
    calendarView !== "month"
  );

  $(
    "#cal-view-toggle"
  ).textContent =
    "Tampilan: " +
    (calendarView === "year"
      ? "Tahunan"
      : "Bulanan");

  if (calendarView === "year") {
    $(
      "#cal-year"
    ).textContent =
      calendarYear;

    for (let m = 0; m < 12; m++) {
      list.appendChild(
        buildMonthCard(
          calendarYear,
          m,
          false
        )
      );
    }
  } else {
    $(
      "#cal-month-label"
    ).textContent =
      new Date(
        calendarYear,
        calendarMonth,
        1
      ).toLocaleString("id", {
        month: "long",
        year: "numeric"
      });

    list.appendChild(
      buildMonthCard(
        calendarYear,
        calendarMonth,
        true
      )
    );
  }
}

$("#cal-view-toggle").onclick =
  () => {
    calendarView =
      calendarView === "year"
        ? "month"
        : "year";

    renderCalendar();
  };

$("#cal-prev").onclick = () => {
  calendarYear--;
  renderCalendar();
};

$("#cal-next").onclick = () => {
  calendarYear++;
  renderCalendar();
};

$("#cal-month-prev").onclick =
  () => {
    if (calendarMonth === 0) {
      calendarMonth = 11;
      calendarYear--;
    } else {
      calendarMonth--;
    }

    renderCalendar();
  };

$("#cal-month-next").onclick =
  () => {
    if (calendarMonth === 11) {
      calendarMonth = 0;
      calendarYear++;
    } else {
      calendarMonth++;
    }

    renderCalendar();
  };

function renderReports() {
  const list =
    $("#report-list");

  const gold =
    cache.projects.filter(
      (p) => p.package === "Gold"
    ).length;

  const platinum =
    cache.projects.filter(
      (p) =>
        p.package === "Platinum"
    ).length;

  const finished =
    cache.projects.filter((p) =>
      cache.workflows.some(
        (w) =>
          String(w.project_id) ===
            String(p.id) &&
          w.step === "Delivered" &&
          w.status === "Done"
      )
    ).length;

  list.innerHTML = `
    <div class="list-card">Total Client: ${cache.clients.length}</div>
    <div class="list-card">Total Project: ${cache.projects.length}</div>
    <div class="list-card">Project Selesai: ${finished}</div>
    <div class="list-card">Paket: Gold (${gold}) | Platinum (${platinum})</div>
  `;
}

async function refresh() {
  try {
    await loadData();

    renderDashboard();

    renderClients();

    renderProjects();

    renderWorkflow();

    renderTasks();

    renderCalendar();

    renderReports();
  } catch (err) {
    toast(
      "Gagal muat data: " +
        err.message
    );

    console.error(err);
  }
}

(async () => {
  await refresh();
})();
