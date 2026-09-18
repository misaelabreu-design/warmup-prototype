/* ---------- Data ---------- */

const STATUS_META = {
  processing: { label: "Processing", badge: "badge-processing" },
  analyzing: { label: "Analyzing", badge: "badge-analyzing" },
  review: { label: "Review", badge: "badge-review" },
  warming: { label: "Warming", badge: "badge-warming" },
  paused: { label: "Paused", badge: "badge-paused" },
  alert: { label: "Alert", badge: "badge-alert" },
  complete: { label: "Complete", badge: "badge-complete" },
};

function makePhases(currentBase, newUsers) {
  // Simple ramp: 20% of newUsers in phase1, then +10% growth each phase, matching mock (100k,110k,121k,133.1k,146.41k)
  const dates = ["9/16/2026", "9/17/2026", "9/18/2026", "9/19/2026", "9/20/2026"];
  let cumulative = currentBase;
  let regis = Math.round(newUsers * 0.2);
  const phases = [];
  for (let i = 0; i < 5; i++) {
    if (i > 0) regis = Math.round(regis * 1.1);
    cumulative += regis;
    phases.push({
      phase: `Phase ${i + 1}`,
      date: dates[i],
      regis,
      cumulative,
      status: "scheduled", // scheduled | inprocess | complete | paused
    });
  }
  return phases;
}

let rows = [
  {
    id: "r1",
    name: "Bulk_VendorName_TimePeriod",
    displayName: "Love Letter",
    product: "Love Letter",
    createdBy: "Jorge Dubois",
    status: "processing",
    currentBase: 1000000,
    newUsers: 500000,
  },
  {
    id: "r2",
    name: "Bulk_VendorName_TimePeriod",
    displayName: "The World",
    product: "The World",
    createdBy: "Jorge Dubois",
    status: "review",
    currentBase: 1000000,
    newUsers: 500000,
  },
  {
    id: "r3",
    name: "Bulk_VendorName_TimePeriod",
    displayName: "Breaking News",
    product: "Breaking News",
    createdBy: "Ofelia Redmond",
    status: "warming",
    currentBase: 1000000,
    newUsers: 500000,
  },
  {
    id: "r4",
    name: "Bulk_VendorName_TimePeriod",
    displayName: "The Good List",
    product: "The Good List",
    createdBy: "Kenton Leal",
    status: "warming",
    currentBase: 640000,
    newUsers: 210000,
  },
  {
    id: "r5",
    name: "Bulk_VendorName_TimePeriod",
    displayName: "On Tech",
    product: "On Tech",
    createdBy: "Jonas Bookman",
    status: "alert",
    currentBase: 300000,
    newUsers: 120000,
  },
  {
    id: "r6",
    name: "Bulk_VendorName_TimePeriod",
    displayName: "The Morning",
    product: "The Morning",
    createdBy: "Kayla Weatherly",
    status: "complete",
    currentBase: 2100000,
    newUsers: 400000,
  },
];

// seed phases + phase progress for rows that need them
rows.forEach((r) => {
  r.phases = makePhases(r.currentBase, r.newUsers);
  if (r.status === "warming" || r.status === "alert") {
    r.phases[0].status = "complete";
    r.phases[1].status = "inprocess";
  } else if (r.status === "complete") {
    r.phases.forEach((p) => (p.status = "complete"));
  }
});
// give row4 (The Good List) a different phase in progress for variety
rows[3].phases[0].status = "complete";
rows[3].phases[1].status = "complete";
rows[3].phases[2].status = "complete";
rows[3].phases[3].status = "inprocess";

/* ---------- Routing / view state ---------- */

let route = "tools"; // 'tools' | 'warmup'
let activeTab = "tools";
let openRowId = null;
let statusFilter = new Set(); // empty = show all statuses
let lastSearch = "";

const app = document.getElementById("app");
const breadcrumb = document.getElementById("breadcrumb");
const tabsRow = document.getElementById("tabsRow");

function fmt(n) {
  return n.toLocaleString("en-US");
}

/* ---------- Render: chrome (breadcrumb + tabs) ---------- */

function renderChrome() {
  if (route === "tools") {
    breadcrumb.innerHTML = `<span class="crumb-active">MessageHub</span>`;
    tabsRow.style.display = "flex";
    tabsRow.innerHTML = `
      <button class="tab" data-tab="campaigns">Campaigns</button>
      <button class="tab" data-tab="templates">Templates</button>
      <button class="tab" data-tab="journeys">Journeys</button>
      <button class="tab is-active" data-tab="tools">Tools</button>
    `;
  } else {
    breadcrumb.innerHTML = `
      <span class="crumb-link" data-nav="tools">MessageHub</span>
      <span class="sep">›</span>
      <span class="crumb-link" data-nav="tools">Tools</span>
      <span class="sep">›</span>
      <span class="crumb-active">Automated warm-up</span>
    `;
    tabsRow.style.display = "none";
  }

  tabsRow.querySelectorAll(".tab").forEach((el) => {
    el.addEventListener("click", () => {
      // Only "Tools" is a real destination in this prototype
      if (el.dataset.tab === "tools") {
        route = "tools";
        render();
      } else {
        showToast(`"${el.textContent}" isn't wired up in this prototype yet`);
      }
    });
  });
  breadcrumb.querySelectorAll(".crumb-link").forEach((el) => {
    el.addEventListener("click", () => {
      route = "tools";
      closePanel();
      render();
    });
  });
}

/* ---------- Render: Tools list page ---------- */

function renderToolsPage() {
  app.innerHTML = `
    <div class="tools-list">
      <a class="tool-link" id="goWarmup">Automated warm-up</a>
      <a class="tool-link" id="goSendDash">Send dashboard</a>
      <a class="tool-link" id="goDossier">User Dossier</a>
    </div>
  `;
  document.getElementById("goWarmup").addEventListener("click", () => {
    route = "warmup";
    render();
  });
  document.getElementById("goSendDash").addEventListener("click", () => {
    showToast("Send dashboard isn't part of this prototype");
  });
  document.getElementById("goDossier").addEventListener("click", () => {
    showToast("User Dossier isn't part of this prototype");
  });
}

/* ---------- Render: Warm-up dashboard ---------- */

function renderWarmupPage() {
  app.innerHTML = `
    <div class="dash-header">
      <div>
        <h1 class="page-title">Automated warm-up</h1>
        <p class="page-sub">Track active and queued warming jobs across all products.</p>
      </div>
    </div>
    <div class="toolbar">
      <div class="search-box">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input type="text" id="searchInput" placeholder="Search" />
      </div>
      <div class="filter-wrap">
        <button class="icon-square-btn" id="filterBtn" title="Filter by status">
          <svg viewBox="0 0 24 24"><path d="M4 5h16M7 12h10M10 19h4"/></svg>
          <span class="filter-count" id="filterCount" hidden></span>
        </button>
        <div class="filter-dropdown" id="filterDropdown"></div>
      </div>
      <div style="flex:1"></div>
      <button class="btn btn-primary" id="newUploadBtn">New upload</button>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Product</th>
          <th>Created by</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  `;

  const tbody = document.getElementById("tableBody");
  const search = document.getElementById("searchInput");
  search.value = lastSearch;

  function paint(filterText = "") {
    lastSearch = filterText;
    const f = filterText.trim().toLowerCase();
    const visible = rows.filter((r) => {
      const matchesSearch = !f || r.product.toLowerCase().includes(f) || r.createdBy.toLowerCase().includes(f);
      const matchesStatus = statusFilter.size === 0 || statusFilter.has(r.status);
      return matchesSearch && matchesStatus;
    });
    tbody.innerHTML = visible
      .map((r) => {
        const meta = STATUS_META[r.status];
        return `
        <tr data-row="${r.id}" class="${openRowId === r.id ? "is-selected" : ""}">
          <td>${r.name.length > 26 ? r.name.slice(0, 22) + "..." : r.name}</td>
          <td>${r.product}</td>
          <td>${r.createdBy}</td>
          <td><span class="badge ${meta.badge}">${meta.label}</span></td>
          <td class="row-actions"><button class="row-menu-btn" data-menu="${r.id}">⋯</button></td>
        </tr>`;
      })
      .join("");

    if (visible.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No jobs match the current filters.</td></tr>`;
    }

    tbody.querySelectorAll("tr[data-row]").forEach((tr) => {
      tr.addEventListener("click", (e) => {
        if (e.target.closest(".row-menu-btn")) return;
        openPanel(tr.dataset.row);
      });
    });
    tbody.querySelectorAll(".row-menu-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openPanel(btn.dataset.menu);
      });
    });
  }

  paint(lastSearch);
  search.addEventListener("input", () => paint(search.value));
  document.getElementById("newUploadBtn").addEventListener("click", openUploadModal);

  const filterBtn = document.getElementById("filterBtn");
  const filterDropdown = document.getElementById("filterDropdown");
  const filterCount = document.getElementById("filterCount");

  function paintFilterUI() {
    if (statusFilter.size > 0) {
      filterCount.hidden = false;
      filterCount.textContent = statusFilter.size;
      filterBtn.classList.add("is-active");
    } else {
      filterCount.hidden = true;
      filterBtn.classList.remove("is-active");
    }
    filterDropdown.innerHTML = `
      <div class="filter-dropdown-header">
        <span>Filter by status</span>
        <button class="filter-clear" id="filterClear">Clear</button>
      </div>
      ${Object.entries(STATUS_META)
        .map(
          ([key, meta]) => `
        <label class="filter-option">
          <input type="checkbox" data-status="${key}" ${statusFilter.has(key) ? "checked" : ""} />
          <span class="badge ${meta.badge}">${meta.label}</span>
        </label>`
        )
        .join("")}
    `;
    filterDropdown.querySelectorAll("input[data-status]").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) statusFilter.add(cb.dataset.status);
        else statusFilter.delete(cb.dataset.status);
        paintFilterUI();
        paint(search.value);
      });
    });
    document.getElementById("filterClear").addEventListener("click", () => {
      statusFilter.clear();
      paintFilterUI();
      paint(search.value);
    });
  }
  paintFilterUI();

  filterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    filterDropdown.classList.toggle("is-open");
  });
  document.removeEventListener("click", closeFilterDropdownOnOutsideClick);
  document.addEventListener("click", closeFilterDropdownOnOutsideClick);
}

function closeFilterDropdownOnOutsideClick(e) {
  const wrap = document.querySelector(".filter-wrap");
  const dropdown = document.getElementById("filterDropdown");
  if (!wrap || !dropdown) return;
  if (!wrap.contains(e.target)) dropdown.classList.remove("is-open");
}

function refreshTableOnly() {
  if (route !== "warmup") return;
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  renderWarmupPage(); // simplest: full repaint, preserves selection via openRowId
}

/* ---------- Render dispatcher ---------- */

function render() {
  renderChrome();
  if (route === "tools") {
    renderToolsPage();
  } else {
    renderWarmupPage();
  }
}

/* ---------- Upload modal ---------- */

const uploadOverlay = document.getElementById("uploadOverlay");

function openUploadModal() {
  document.getElementById("fSignupVersion").value = "Bulk_VendorName_TimePeriod";
  document.getElementById("fProduct").value = "";
  document.getElementById("fCadence").value = "";
  document.getElementById("fBigQuery").value = "";
  document.getElementById("fEmailConfirm").checked = false;
  uploadOverlay.classList.add("is-open");
}
function closeUploadModal() {
  uploadOverlay.classList.remove("is-open");
}
document.getElementById("closeUploadModal").addEventListener("click", closeUploadModal);
document.getElementById("cancelUpload").addEventListener("click", closeUploadModal);
uploadOverlay.addEventListener("click", (e) => {
  if (e.target === uploadOverlay) closeUploadModal();
});

document.getElementById("submitUpload").addEventListener("click", () => {
  const product = document.getElementById("fProduct").value;
  const cadence = document.getElementById("fCadence").value;
  const bq = document.getElementById("fBigQuery").value.trim();

  if (!product || !cadence || !bq) {
    showToast("Fill in newsletter, cadence, and BigQuery table to continue");
    return;
  }

  const newRow = {
    id: "r" + (rows.length + 1) + "_" + Date.now(),
    name: document.getElementById("fSignupVersion").value || "Bulk_VendorName_TimePeriod",
    displayName: product,
    product,
    createdBy: "Elena Larsen",
    status: "processing",
    currentBase: 500000 + Math.round(Math.random() * 500000),
    newUsers: 100000 + Math.round(Math.random() * 300000),
  };
  newRow.phases = makePhases(newRow.currentBase, newRow.newUsers);
  rows.unshift(newRow);

  closeUploadModal();
  render();
  showToast(`Uploaded — analyzing "${product}"`);

  // simulate pipeline: processing -> analyzing -> review
  setTimeout(() => {
    newRow.status = "analyzing";
    refreshTableOnly();
    if (openRowId === newRow.id) renderPanel(newRow);
  }, 1600);
  setTimeout(() => {
    newRow.status = "review";
    refreshTableOnly();
    if (openRowId === newRow.id) renderPanel(newRow);
    showToast(`"${product}" is ready for review`);
  }, 3600);
});

/* ---------- Side panel ---------- */

const panel = document.getElementById("panel");
const panelName = document.getElementById("panelName");
const panelBadge = document.getElementById("panelBadge");
const panelBody = document.getElementById("panelBody");
const panelFooter = document.getElementById("panelFooter");

function openPanel(rowId) {
  openRowId = rowId;
  const row = rows.find((r) => r.id === rowId);
  if (!row) return;
  panel.classList.add("is-open");
  renderPanel(row);
  refreshTableOnly();
}

function closePanel() {
  openRowId = null;
  panel.classList.remove("is-open");
  refreshTableOnly();
}
document.getElementById("closePanel").addEventListener("click", closePanel);

function phaseStatusText(status) {
  const map = {
    complete: ["Complete", "status-text-complete"],
    inprocess: ["In process", "status-text-inprocess"],
    scheduled: ["Scheduled", "status-text-scheduled"],
    paused: ["Paused", "status-text-paused"],
  };
  const [label, cls] = map[status];
  return `<span class="status-text ${cls}">${label}</span>`;
}

function contentHeader(row) {
  const meta = STATUS_META[row.status];
  return `
    <div class="content-header">
      <span class="content-name">${row.name}</span>
      <span class="badge ${meta.badge}">${meta.label}</span>
    </div>
  `;
}

function renderPanel(row) {
  panelName.textContent = row.displayName;

  const targetTotal = row.currentBase + row.newUsers;
  const pctExpansion = Math.round((row.newUsers / row.currentBase) * 100);

  const statCards = `
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">Current base</div>
        <div class="stat-value">${fmt(row.currentBase)}</div>
        <div class="stat-sub">Existing subscribers</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">New users</div>
        <div class="stat-value">+ ${fmt(row.newUsers)}</div>
        <div class="stat-sub">+${pctExpansion}% list expansion</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Target total</div>
        <div class="stat-value">${fmt(targetTotal)}</div>
        <div class="stat-sub">Post-ramp</div>
      </div>
    </div>
  `;

  if (row.status === "processing") {
    panelBody.innerHTML = `
      ${contentHeader(row)}
      <div class="info-banner">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16" r=".3"/></svg>
        <span>This table is still processing. Status will be updated to 'Review' when ready.</span>
      </div>
    `;
    panelFooter.innerHTML = `<button class="btn btn-secondary" id="pClose">Close</button>`;
    document.getElementById("pClose").addEventListener("click", closePanel);
    return;
  }

  if (row.status === "analyzing") {
    panelBody.innerHTML = `
      ${contentHeader(row)}
      <div class="info-banner">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16" r=".3"/></svg>
        <span>This table is still processing. Status will be updated to 'Review' when ready.</span>
      </div>
    `;
    panelFooter.innerHTML = `<button class="btn btn-secondary" id="pClose">Close</button>`;
    document.getElementById("pClose").addEventListener("click", closePanel);
    return;
  }

  if (row.status === "alert") {
    panelBody.innerHTML = `
      ${contentHeader(row)}
      <div class="alert-banner">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16" r=".3"/></svg>
        <span>Messages from this warm-up have been landing in spam. Consider pausing until deliverability improves.</span>
      </div>
      ${statCards}
      <table class="phase-table">
        <thead>
          <tr>
            <th>Phase</th>
            <th>Estimated date</th>
            <th>Regis added</th>
            <th>Cumulative total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${row.phases
            .map(
              (p) => `
            <tr class="${p.status === "inprocess" ? "phase-current" : ""}">
              <td>${p.phase}</td>
              <td>${p.date}</td>
              <td>+ ${fmt(p.regis)}</td>
              <td>${fmt(p.cumulative)}</td>
              <td>${phaseStatusText(p.status)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;
    panelFooter.innerHTML = `
      <button class="btn btn-secondary" id="pClose">Close</button>
      <button class="btn btn-danger" id="pPauseAlert">Pause warm-up</button>
    `;
    document.getElementById("pClose").addEventListener("click", closePanel);
    document.getElementById("pPauseAlert").addEventListener("click", () => {
      row.status = "paused";
      row.phases.forEach((p) => {
        if (p.status !== "complete") p.status = "paused";
      });
      renderPanel(row);
      refreshTableOnly();
      showToast(`Warm-up paused for "${row.displayName}"`);
    });
    return;
  }

  // review / warming / paused / complete all show stat cards + phase table
  const showStatusColumn = row.status !== "review";
  panelBody.innerHTML = `
    ${contentHeader(row)}
    ${statCards}
    <table class="phase-table">
      <thead>
        <tr>
          <th>Phase</th>
          <th>Estimated date</th>
          <th>Regis added</th>
          <th>Cumulative total</th>
          ${showStatusColumn ? "<th>Status</th>" : ""}
        </tr>
      </thead>
      <tbody>
        ${row.phases
          .map(
            (p) => `
          <tr class="${p.status === "inprocess" ? "phase-current" : ""}">
            <td>${p.phase}</td>
            <td>${p.date}</td>
            <td>+ ${fmt(p.regis)}</td>
            <td>${fmt(p.cumulative)}</td>
            ${showStatusColumn ? `<td>${phaseStatusText(p.status)}</td>` : ""}
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  if (row.status === "review") {
    panelFooter.innerHTML = `
      <button class="btn btn-secondary" id="pClose">Close</button>
      <button class="btn btn-primary" id="pBegin">Begin warm-up</button>
    `;
    document.getElementById("pClose").addEventListener("click", closePanel);
    document.getElementById("pBegin").addEventListener("click", () => {
      row.status = "warming";
      row.phases.forEach((p, i) => (p.status = i === 0 ? "inprocess" : "scheduled"));
      renderPanel(row);
      refreshTableOnly();
      showToast(`Warm-up started for "${row.displayName}"`);
    });
  } else if (row.status === "warming") {
    panelFooter.innerHTML = `
      <button class="btn btn-secondary" id="pClose">Close</button>
      <button class="btn btn-danger" id="pPause">Pause warm-up</button>
    `;
    document.getElementById("pClose").addEventListener("click", closePanel);
    document.getElementById("pPause").addEventListener("click", () => {
      row.status = "paused";
      row.phases.forEach((p) => {
        if (p.status !== "complete") p.status = "paused";
      });
      renderPanel(row);
      refreshTableOnly();
      showToast(`Warm-up paused for "${row.displayName}"`);
    });
  } else if (row.status === "paused") {
    panelFooter.innerHTML = `
      <button class="btn btn-secondary" id="pClose">Close</button>
      <button class="btn btn-primary" id="pResume">Resume warm-up</button>
    `;
    document.getElementById("pClose").addEventListener("click", closePanel);
    document.getElementById("pResume").addEventListener("click", () => {
      row.status = "warming";
      let sawInProcess = false;
      row.phases.forEach((p) => {
        if (p.status === "paused") {
          if (!sawInProcess) {
            p.status = "inprocess";
            sawInProcess = true;
          } else {
            p.status = "scheduled";
          }
        }
      });
      renderPanel(row);
      refreshTableOnly();
      showToast(`Warm-up resumed for "${row.displayName}"`);
    });
  } else if (row.status === "complete") {
    panelFooter.innerHTML = `<button class="btn btn-secondary" id="pClose">Close</button>`;
    document.getElementById("pClose").addEventListener("click", closePanel);
  }
}

/* ---------- Toast ---------- */

let toastTimer = null;
function showToast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add("is-visible"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2600);
}

/* ---------- Rail (decorative) ---------- */

document.querySelectorAll(".rail-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.rail === "all") return;
    showToast(`"${btn.textContent.trim() || "Help"}" isn't part of this prototype`);
  });
});

/* ---------- Init ---------- */

render();
