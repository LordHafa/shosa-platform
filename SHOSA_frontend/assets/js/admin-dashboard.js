// assets/js/admin-dashboard.js
(() => {
  // ✅ Single source of truth for API base
  const SHOSA_API = window.SHOSA_API || "http://localhost:4000";

  // DOM
  const kpiAlumni = document.getElementById("kpiAlumni");
  const kpiSacco = document.getElementById("kpiSacco");
  const kpiPayments = document.getElementById("kpiPayments");

  const tableTitle = document.getElementById("tableTitle");
  const tableSummary = document.getElementById("tableSummary");
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");
  const tableError = document.getElementById("tableError");

  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const pageInfo = document.getElementById("pageInfo");

  const searchInput = document.getElementById("searchInput");
  const btnSearch = document.getElementById("btnSearch");
  const btnClear = document.getElementById("btnClear");

  const logoutBtn = document.getElementById("adminLogoutBtn");

  // State
  let activeTab = "alumni";
  let allRows = [];
  let filteredRows = [];
  let page = 1;
  const PAGE_SIZE = 15;

  // ---- helpers ----
  function showError(msg) {
    if (!tableError) return;
    tableError.style.display = "block";
    tableError.textContent = msg || "Something went wrong.";
  }

  function clearError() {
    if (!tableError) return;
    tableError.style.display = "none";
    tableError.textContent = "";
  }

  function fmtDate(iso) {
    if (!iso) return "";
    return String(iso).split("T")[0];
  }

  function fmtMoneyUGX(n) {
    const v = Number(n || 0);
    return v.toLocaleString("en-UG", { maximumFractionDigits: 0 });
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getAdminToken() {
    return localStorage.getItem("shosa_admin_token");
  }

  function requireAdminToken() {
    const token = getAdminToken();
    if (!token) {
      window.location.href = "admin-login.html";
      return null;
    }
    return token;
  }

  async function apiGet(path) {
    const token = requireAdminToken();
    if (!token) return null;

    const res = await fetch(`${SHOSA_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("shosa_admin_token");
        window.location.href = "admin-login.html";
        return null;
      }
      throw new Error(data.error || `Request failed: ${path}`);
    }
    return data;
  }

  // ---- renderers ----
  function setKpis({ alumniCount, saccoCount, paymentCount }) {
    if (kpiAlumni) kpiAlumni.textContent = String(alumniCount ?? "—");
    if (kpiSacco) kpiSacco.textContent = String(saccoCount ?? "—");
    if (kpiPayments) kpiPayments.textContent = String(paymentCount ?? "—");
  }

  function setTableMeta(title, summary) {
    if (tableTitle) tableTitle.textContent = title;
    if (tableSummary) tableSummary.textContent = summary;
  }

  function renderTableHead(columns) {
    const ths = columns
      .map(
        (c) =>
          `<th style="padding:0.4rem;border-bottom:1px solid #cbd5e1;text-align:${c.align || "left"};">${escapeHtml(
            c.label
          )}</th>`
      )
      .join("");

    tableHead.innerHTML = `<tr style="background:#e5edf5;">${ths}</tr>`;
  }

  function renderTableBody(columns, rows) {
    tableBody.innerHTML = rows
      .map((r) => {
        const tds = columns
          .map((c) => {
            const val = r[c.key] ?? "";
            return `<td style="padding:0.35rem;border-bottom:1px solid #e2e8f0;text-align:${c.align || "left"};">${escapeHtml(
              val
            )}</td>`;
          })
          .join("");
        return `<tr>${tds}</tr>`;
      })
      .join("");
  }

  function renderPagination() {
    const total = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    const pageRows = filteredRows.slice(start, end);

    if (pageInfo) {
      pageInfo.textContent = `Page ${page} / ${totalPages} • Showing ${pageRows.length} of ${total}`;
    }

    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= totalPages;

    const { columns, title } = getTabSchema(activeTab);
    renderTableHead(columns);
    renderTableBody(columns, pageRows);

    setTableMeta(title, `${total} records`);
  }

  function applySearch() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    if (!q) {
      filteredRows = [...allRows];
      page = 1;
      renderPagination();
      return;
    }

    filteredRows = allRows.filter((r) =>
      Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))
    );

    page = 1;
    renderPagination();
  }

  // ---- mapping raw API -> display rows ----
  function getTabSchema(tab) {
    if (tab === "sacco") {
      return {
        title: "SACCO",
        columns: [
          { key: "alumniName", label: "Alumni" },
          { key: "alumniEmail", label: "Email" },
          { key: "alumniPhone", label: "Phone" }, // ✅ added (for show/search)
          { key: "membershipType", label: "Type" },
          { key: "monthlyContribution", label: "Monthly", align: "right" },
          { key: "status", label: "Status" },
          { key: "startDate", label: "Start" },
        ],
      };
    }

    if (tab === "payments") {
      return {
        title: "Payments",
        columns: [
          { key: "id", label: "ID" },
          { key: "alumniName", label: "Alumni" }, // ✅ added (human friendly)
          { key: "alumniEmail", label: "Email" }, // ✅ added (for search)
          { key: "phone", label: "MM Phone" }, // ✅ renamed from "Phone" to "MM Phone"
          { key: "label", label: "Label" },
          { key: "paymentType", label: "Type" },
          { key: "amount", label: "Amount (UGX)", align: "right" },
          { key: "network", label: "Network" },
          { key: "createdAt", label: "Date" },
        ],
      };
    }

    // default: alumni
    return {
      title: "Alumni",
      columns: [
        { key: "fullName", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" }, // ✅ ensure present
        { key: "gradYear", label: "Grad year" },
        { key: "campus", label: "Campus" },
        { key: "period", label: "Period" },
        { key: "createdAt", label: "Created" },
      ],
    };
  }

  function normalizeRows(tab, data) {
    if (tab === "alumni") {
      const list = data.alumni || [];
      return list.map((a) => ({
        fullName: a.fullName || "",
        email: a.email || "",
        phone: a.phone || "", // ✅ shows/searches only if backend SELECT includes phone
        gradYear: a.gradYear || "",
        campus: a.campus || "",
        period: a.period || "",
        createdAt: fmtDate(a.createdAt),
      }));
    }

    if (tab === "sacco") {
      const list = data.memberships || [];
      return list.map((m) => ({
        alumniName: m.alumniName || "",
        alumniEmail: m.alumniEmail || "",
        alumniPhone: m.alumniPhone || "", // ✅ requires backend to SELECT a.phone AS alumniPhone
        membershipType: m.membershipType || "",
        monthlyContribution: fmtMoneyUGX(m.monthlyContribution),
        status: m.status || "",
        startDate: m.startDate || "",
      }));
    }

    if (tab === "payments") {
      const list = data.payments || [];
      return list.map((p) => ({
        id: p.id,
        alumniName: p.alumniName || "", // ✅ requires backend JOIN to alumni
        alumniEmail: p.alumniEmail || "", // ✅ requires backend JOIN to alumni
        phone: p.phone || "",
        label: p.label || "",
        paymentType: p.paymentType || "",
        amount: fmtMoneyUGX(p.amount),
        network: p.network || "",
        createdAt: fmtDate(p.createdAt),
      }));
    }

    return [];
  }

  // ---- data loaders ----
  async function loadTab(tab) {
    clearError();
    setTableMeta("Loading…", "Loading…");
    tableBody.innerHTML = "";
    tableHead.innerHTML = "";

    try {
      let data;
      if (tab === "alumni") data = await apiGet("/api/admin/alumni");
      if (tab === "sacco") data = await apiGet("/api/admin/sacco");
      if (tab === "payments") data = await apiGet("/api/admin/payments");

      if (!data) return; // redirected already

      allRows = normalizeRows(tab, data);
      filteredRows = [...allRows];
      page = 1;

      renderPagination();
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to load data.");
      setTableMeta(getTabSchema(tab).title, "Failed to load.");
    }
  }

  async function loadAllKpis() {
    try {
      const [a, s, p] = await Promise.all([
        apiGet("/api/admin/alumni"),
        apiGet("/api/admin/sacco"),
        apiGet("/api/admin/payments"),
      ]);

      if (!a || !s || !p) return;

      setKpis({
        alumniCount: (a.alumni || []).length,
        saccoCount: (s.memberships || []).length,
        paymentCount: (p.payments || []).length,
      });
    } catch (err) {
      console.error("KPI load error:", err);
    }
  }

  // ---- events ----
  function initTabs() {
    document.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        activeTab = btn.getAttribute("data-tab") || "alumni";

        // button styling
        document.querySelectorAll("[data-tab]").forEach((b) => {
          b.classList.remove("btn-primary");
          b.classList.add("btn");
        });
        btn.classList.remove("btn");
        btn.classList.add("btn-primary");

        // clear search
        if (searchInput) searchInput.value = "";
        await loadTab(activeTab);
      });
    });
  }

  function initSearch() {
    if (btnSearch) btnSearch.addEventListener("click", applySearch);

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        filteredRows = [...allRows];
        page = 1;
        renderPagination();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") applySearch();
      });
    }
  }

  function initPaging() {
    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        page -= 1;
        renderPagination();
      });
    }

    if (btnNext) {
      btnNext.addEventListener("click", () => {
        page += 1;
        renderPagination();
      });
    }
  }

  function initLogout() {
    if (!logoutBtn) return;
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("shosa_admin_token");
      window.location.href = "index.html";
    });
  }

  // ---- boot ----
  async function boot() {
    const token = requireAdminToken();
    if (!token) return;

    initTabs();
    initSearch();
    initPaging();
    initLogout();

    activeTab = "alumni";
    await loadAllKpis();
    await loadTab(activeTab);
  }

  boot();
})();
