/* =========================================================
   KPI ENTRY
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeKPIEntry();
});

/* =========================================================
   STORAGE
========================================================= */

const KPI_STORAGE_KEY = "kpi_entry_data";

const PERIOD_STORAGE_KEY = "kpi_period_setup";

let editingKPIId = null;

let deletingKPIId = null;

let draggedKPIId = null;

/* =========================================================
   INITIALIZE
========================================================= */

function initializeKPIEntry() {
  loadFinancialYears();

  bindKPIEvents();

  renderSavedKPIList();

  disableMonthEditing();
}

/* =========================================================
   EVENTS
========================================================= */

function bindKPIEvents() {
  const financialYear = document.getElementById("financialYear");

  const quarter = document.getElementById("quarter");

  const addKpiBtn = document.getElementById("addKpiBtn");

  const saveKpiBtn = document.getElementById("saveKpiBtn");

  const cancelKpiBtn = document.getElementById("cancelKpiBtn");

  const search = document.getElementById("kpiSearch");

  const clearSearch = document.getElementById("clearSearchBtn");

  financialYear.addEventListener("change", handleFinancialYearChange);

  quarter.addEventListener("change", handleQuarterChange);

  document
    .getElementById("unit")
    .addEventListener("change", updateAddKPIButton);

  document
    .getElementById("department")
    .addEventListener("change", updateAddKPIButton);

  document
    .getElementById("section")
    .addEventListener("change", updateAddKPIButton);

  addKpiBtn.addEventListener("click", function () {
    if (!isBasicInformationComplete()) {
      showKPIToast("Please complete all required fields first.", "error");

      return;
    }

    showKPIEntryArea();

    addKPIRow();
  });

  saveKpiBtn.addEventListener("click", saveKPIConfiguration);

  cancelKpiBtn.addEventListener("click", resetKPIForm);

  search.addEventListener("input", renderSavedKPIList);

  clearSearch.addEventListener("click", function () {
    search.value = "";

    renderSavedKPIList();

    search.focus();
  });

  document
    .getElementById("closeDetailsModal")
    .addEventListener("click", closeDetailsModal);

  document
    .getElementById("kpiDetailsModal")
    .addEventListener("click", function (event) {
      if (event.target === this) {
        closeDetailsModal();
      }
    });

  document
    .getElementById("cancelKpiDelete")
    .addEventListener("click", closeDeleteModal);

  document
    .getElementById("confirmKpiDelete")
    .addEventListener("click", confirmKPIDelete);

  document
    .getElementById("kpiDeleteModal")
    .addEventListener("click", function (event) {
      if (event.target === this) {
        closeDeleteModal();
      }
    });

  /*
    |--------------------------------------------------------------------------
    | Escape closes modal
    |--------------------------------------------------------------------------
    */

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeDetailsModal();

      closeDeleteModal();
    }
  });
}

/* =========================================================
   PERIOD SETUP DATA
========================================================= */

function getPeriodData() {
  try {
    const data = localStorage.getItem(PERIOD_STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read period setup:", error);

    return [];
  }
}

/* =========================================================
   FINANCIAL YEAR
========================================================= */

function loadFinancialYears() {
  const select = document.getElementById("financialYear");

  const periods = getPeriodData();

  const currentValue = select.value;

  select.innerHTML = `

        <option value="">
            Select Financial Year
        </option>

    `;

  const uniqueYears = [];

  periods.forEach(function (period) {
    const year = period.financialYear ?? period.finYear ?? period.year;

    if (
      year !== undefined &&
      year !== null &&
      String(year).trim() !== "" &&
      !uniqueYears.includes(String(year))
    ) {
      uniqueYears.push(String(year));
    }
  });

  uniqueYears.sort(function (a, b) {
    return b.localeCompare(a);
  });

  uniqueYears.forEach(function (year) {
    const option = document.createElement("option");

    option.value = year;

    option.textContent = year;

    select.appendChild(option);
  });

  if (uniqueYears.includes(currentValue)) {
    select.value = currentValue;
  }
}

/* =========================================================
   FINANCIAL YEAR CHANGE
========================================================= */

function handleFinancialYearChange() {
  const year = document.getElementById("financialYear").value;

  const quarter = document.getElementById("quarter");

  quarter.innerHTML = `

        <option value="">
            Select Quarter
        </option>

    `;

  document.getElementById("month").value = "";

  if (!year) {
    updateAddKPIButton();

    return;
  }

  const periods = getPeriodData();

  const matchingPeriods = periods.filter(function (period) {
    return (
      String(period.financialYear ?? period.finYear ?? period.year ?? "") ===
      String(year)
    );
  });

  const quarterMap = new Map();

  matchingPeriods.forEach(function (period) {
    const quarterName =
      period.quarter ?? period.quarterSet ?? period.financialYearWiseQuarterSet;

    if (quarterName) {
      const normalized = normalizeQuarter(quarterName);

      if (normalized && !quarterMap.has(normalized)) {
        quarterMap.set(normalized, quarterName);
      }
    }
  });

  /*
    |--------------------------------------------------------------------------
    | Fallback to Q1-Q4 if period records contain quarter-set values
    |--------------------------------------------------------------------------
    */

  if (quarterMap.size === 0) {
    const fallbackQuarters = ["Q1", "Q2", "Q3", "Q4"];

    fallbackQuarters.forEach(function (quarterName) {
      quarterMap.set(quarterName, quarterName);
    });
  }

  Array.from(quarterMap.keys())
    .sort(function (a, b) {
      return quarterNumber(a) - quarterNumber(b);
    })
    .forEach(function (quarterName) {
      const option = document.createElement("option");

      option.value = quarterName;

      option.textContent = quarterName;

      quarter.appendChild(option);
    });

  updateAddKPIButton();
}

/* =========================================================
   QUARTER CHANGE
========================================================= */

function handleQuarterChange() {
  const year = document.getElementById("financialYear").value;

  const quarter = document.getElementById("quarter").value;

  const month = document.getElementById("month");

  month.value = "";

  if (!year || !quarter) {
    updateAddKPIButton();

    return;
  }

  const periods = getPeriodData();

  const matchingPeriods = periods.filter(function (period) {
    const periodYear = String(
      period.financialYear ?? period.finYear ?? period.year ?? "",
    );

    const periodQuarter = normalizeQuarter(
      period.quarter ??
        period.quarterSet ??
        period.financialYearWiseQuarterSet ??
        "",
    );

    return (
      periodYear === String(year) && periodQuarter === normalizeQuarter(quarter)
    );
  });

  /*
    |--------------------------------------------------------------------------
    | Build Month from Period Setup
    |--------------------------------------------------------------------------
    */

  if (matchingPeriods.length > 0) {
    const period = matchingPeriods[0];

    const fromMonth = period.fromMonth ?? period.monthFrom ?? period.startMonth;

    const toMonth = period.toMonth ?? period.monthTo ?? period.endMonth;

    if (fromMonth && toMonth) {
      month.value = `${fromMonth}-${toMonth}`;
    } else {
      month.value = buildMonthFromQuarter(quarter);
    }
  } else {
    month.value = buildMonthFromQuarter(quarter);
  }

  updateAddKPIButton();
}

/* =========================================================
   MONTH
========================================================= */

function buildMonthFromQuarter(quarter) {
  const q = normalizeQuarter(quarter);

  const months = {
    Q1: "January-March",

    Q2: "April-June",

    Q3: "July-September",

    Q4: "October-December",
  };

  return months[q] || "";
}

/*
|--------------------------------------------------------------------------
| Prevent Browser Editing
|--------------------------------------------------------------------------
*/

function disableMonthEditing() {
  const month = document.getElementById("month");

  if (!month) {
    return;
  }

  /*
    | readonly is maintained.
    | All keyboard/mouse editing actions are blocked.
    */

  const blockedEvents = [
    "keydown",
    "keypress",
    "keyup",
    "beforeinput",
    "input",
    "paste",
    "cut",
    "drop",
    "dragstart",
  ];

  blockedEvents.forEach(function (eventName) {
    month.addEventListener(eventName, function (event) {
      event.preventDefault();

      event.stopPropagation();

      return false;
    });
  });

  month.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  month.addEventListener("mousedown", function () {
    month.blur();
  });
}

/* =========================================================
   ADD KPI BUTTON
========================================================= */

function isBasicInformationComplete() {
  return Boolean(
    document.getElementById("financialYear").value &&
    document.getElementById("quarter").value &&
    document.getElementById("month").value &&
    document.getElementById("unit").value &&
    document.getElementById("department").value &&
    document.getElementById("section").value,
  );
}

function updateAddKPIButton() {
  const button = document.getElementById("addKpiBtn");

  button.disabled = !isBasicInformationComplete();
}

/* =========================================================
   KPI ENTRY AREA
========================================================= */

function showKPIEntryArea() {
  document.getElementById("kpiEntryArea").classList.add("show");
}

/* =========================================================
   ADD KPI ROW
========================================================= */

function addKPIRow(kpiData = null) {
  showKPIEntryArea();

  const container = document.getElementById("kpiRows");

  const rowId =
    "kpi-row-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);

  const row = document.createElement("div");

  row.className = "kpi-row";

  row.dataset.rowId = rowId;

  row.draggable = true;

  row.innerHTML = `
  <div class="kpi-name-field">
    <div class="kpi-drag-handle" title="Drag to change priority">
      <i class="fa-solid fa-grip-vertical"></i>
    </div>

    <input
      type="text"
      class="kpi-name-input"
      placeholder="Enter KPI name..."
      autocomplete="off"
    />
  </div>

  <div class="kpi-data-source">
    <select class="kpi-source-select">
      <option value="">Select Data Source</option>
      <option value="ERP">ERP</option>
      <option value="Entry">Entry</option>
      <option value="Manual">Manual</option>
    </select>
  </div>

  <div class="kpi-priority-wrapper">
    <span class="kpi-priority">1</span>
  </div>

  <div class="kpi-row-actions">
    <button
      type="button"
      class="kpi-add-row-btn"
      title="Add KPI below"
      aria-label="Add KPI below"
    >
      <i class="fa-solid fa-plus"></i>
    </button>

    <button
      type="button"
      class="kpi-delete-row-btn"
      title="Remove KPI"
      aria-label="Remove KPI"
    >
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
`;

  container.appendChild(row);

  /*
    |--------------------------------------------------------------------------
    | Existing Data
    |--------------------------------------------------------------------------
    */

  if (kpiData) {
    row.querySelector(".kpi-name-input").value = kpiData.kpiName || "";

    row.querySelector(".kpi-source-select").value = kpiData.dataSource || "";
  }

  /*
    |--------------------------------------------------------------------------
    | Events
    |--------------------------------------------------------------------------
    */

  row.querySelector(".kpi-add-row-btn").addEventListener("click", function () {
    addKPIRow();

    updateKPIOrder();

    const rows = document.querySelectorAll(".kpi-row");

    const lastRow = rows[rows.length - 1];

    if (lastRow) {
      lastRow.querySelector(".kpi-name-input").focus();
    }
  });

  row
    .querySelector(".kpi-delete-row-btn")
    .addEventListener("click", function () {
      deleteKPIRow(row);
    });

  /*
    |--------------------------------------------------------------------------
    | Drag & Drop
    |--------------------------------------------------------------------------
    */

  row.addEventListener("dragstart", handleKPIDragStart);

  row.addEventListener("dragover", handleKPIDragOver);

  row.addEventListener("dragleave", handleKPIDragLeave);

  row.addEventListener("drop", handleKPIDrop);

  row.addEventListener("dragend", handleKPIDragEnd);

  updateKPIOrder();

  /*
    |--------------------------------------------------------------------------
    | Focus first field
    |--------------------------------------------------------------------------
    */

  if (!kpiData) {
    setTimeout(function () {
      row.querySelector(".kpi-name-input").focus();
    }, 50);
  }
}

/* =========================================================
   DELETE KPI ROW
========================================================= */

function deleteKPIRow(row) {
  const rows = document.querySelectorAll(".kpi-row");

  if (rows.length <= 1) {
    row.querySelector(".kpi-name-input").value = "";

    row.querySelector(".kpi-source-select").value = "";

    showKPIToast("At least one KPI row is required.", "error");

    return;
  }

  row.remove();

  updateKPIOrder();
}

/* =========================================================
   UPDATE PRIORITY
========================================================= */

function updateKPIOrder() {
  const rows = document.querySelectorAll("#kpiRows .kpi-row");

  rows.forEach(function (row, index) {
    const priority = row.querySelector(".kpi-priority");

    if (priority) {
      priority.textContent = index + 1;
    }
  });

  const count = document.getElementById("kpiRowCount");

  if (count) {
    count.textContent = `${rows.length} KPI${rows.length === 1 ? "" : "s"}`;
  }
}

/* =========================================================
   DRAG START
========================================================= */

function handleKPIDragStart(event) {
  draggedKPIId = event.currentTarget.dataset.rowId;

  event.currentTarget.classList.add("dragging");

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData("text/plain", draggedKPIId);
  }
}

/* =========================================================
   DRAG OVER
========================================================= */

function handleKPIDragOver(event) {
  event.preventDefault();

  const target = event.currentTarget;

  if (target.dataset.rowId !== draggedKPIId) {
    target.classList.add("drag-over");
  }

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

/* =========================================================
   DRAG LEAVE
========================================================= */

function handleKPIDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

/* =========================================================
   DROP
========================================================= */

function handleKPIDrop(event) {
  event.preventDefault();

  const target = event.currentTarget;

  target.classList.remove("drag-over");

  const container = document.getElementById("kpiRows");

  const dragged = container.querySelector(
    `[data-row-id="${CSS.escape(draggedKPIId)}"]`,
  );

  if (!dragged || dragged === target) {
    return;
  }

  const allRows = Array.from(container.querySelectorAll(".kpi-row"));

  const draggedIndex = allRows.indexOf(dragged);

  const targetIndex = allRows.indexOf(target);

  if (draggedIndex < targetIndex) {
    container.insertBefore(dragged, target.nextSibling);
  } else {
    container.insertBefore(dragged, target);
  }

  updateKPIOrder();
}

/* =========================================================
   DRAG END
========================================================= */

function handleKPIDragEnd(event) {
  event.currentTarget.classList.remove("dragging");

  document.querySelectorAll(".kpi-row").forEach(function (row) {
    row.classList.remove("drag-over");
  });

  draggedKPIId = null;
}

/* =========================================================
   COLLECT KPI ROWS
========================================================= */

function collectKPIRows() {
  const rows = Array.from(document.querySelectorAll("#kpiRows .kpi-row"));

  const data = [];

  rows.forEach(function (row, index) {
    const kpiName = row.querySelector(".kpi-name-input").value.trim();

    const dataSource = row.querySelector(".kpi-source-select").value;

    data.push({
      kpiName: kpiName,

      dataSource: dataSource,

      priority: index + 1,
    });
  });

  return data;
}

/* =========================================================
   VALIDATE KPI ROWS
========================================================= */

function validateKPIRows(kpis) {
  if (!kpis.length) {
    showKPIToast("Please add at least one KPI.", "error");

    return false;
  }

  for (let i = 0; i < kpis.length; i++) {
    if (!kpis[i].kpiName) {
      showKPIToast(`Please enter KPI Name for priority ${i + 1}.`, "error");

      return false;
    }

    if (!kpis[i].dataSource) {
      showKPIToast(`Please select Data Source for priority ${i + 1}.`, "error");

      return false;
    }
  }

  return true;
}

/* =========================================================
   KPI CONFIGURATION DUPLICATE VALIDATION
========================================================= */

function isDuplicateKPIConfiguration(basicData, records) {
  return records.some(function (record) {
    /*
      When updating, ignore the record currently being edited.
      This allows the existing record to be saved without
      incorrectly detecting itself as a duplicate.
    */
    if (editingKPIId && record.id === editingKPIId) {
      return false;
    }

    return (
      String(record.financialYear ?? "").trim() ===
        String(basicData.financialYear ?? "").trim() &&
      normalizeQuarter(record.quarter) ===
        normalizeQuarter(basicData.quarter) &&
      String(record.unit ?? "").trim() ===
        String(basicData.unit ?? "").trim() &&
      String(record.department ?? "").trim() ===
        String(basicData.department ?? "").trim() &&
      String(record.section ?? "").trim() ===
        String(basicData.section ?? "").trim()
    );
  });
}

/* =========================================================
   SAVE KPI
========================================================= */

function saveKPIConfiguration() {
  if (!isBasicInformationComplete()) {
    showKPIToast("Please complete all required fields.", "error");

    return;
  }

  const kpis = collectKPIRows();

  if (!validateKPIRows(kpis)) {
    return;
  }

  const records = getStoredKPIRecords();

  const basicData = {
    financialYear: document.getElementById("financialYear").value,

    quarter: document.getElementById("quarter").value,

    month: document.getElementById("month").value,

    unit: document.getElementById("unit").value,

    department: document.getElementById("department").value,

    section: document.getElementById("section").value,

    kpis: kpis,
  };

  /*
    |--------------------------------------------------------------------------
    | DUPLICATE CONFIGURATION VALIDATION
    |--------------------------------------------------------------------------
    |
    | Same Financial Year + Quarter + Unit + Department + Section
    | cannot exist more than once.
    |
    */

  if (isDuplicateKPIConfiguration(basicData, records)) {
    showKPIToast(
      `KPI configuration already exists for ${basicData.financialYear} - ${basicData.quarter}, ${basicData.unit}, ${basicData.department}, ${basicData.section}.`,
      "error",
    );

    return;
  }

  /*
    |--------------------------------------------------------------------------
    | UPDATE EXISTING
    |--------------------------------------------------------------------------
    */

  if (editingKPIId) {
    const index = records.findIndex(function (record) {
      return record.id === editingKPIId;
    });

    if (index === -1) {
      showKPIToast("KPI record could not be found.", "error");

      return;
    }

    records[index] = {
      ...records[index],

      ...basicData,

      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(records));

    renderSavedKPIList();

    resetKPIForm();

    showKPIToast("KPI updated successfully.", "success");

    return;
  }

  /*
    |--------------------------------------------------------------------------
    | NEW RECORD
    |--------------------------------------------------------------------------
    */

  const newRecord = {
    id:
      Date.now().toString() + "-" + Math.random().toString(36).substring(2, 8),

    ...basicData,

    savedAt: new Date().toISOString(),

    updatedAt: null,
  };

  records.unshift(newRecord);

  localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(records));

  renderSavedKPIList();

  resetKPIForm();

  showKPIToast("KPI saved successfully.", "success");
}

/* =========================================================
   GET KPI RECORDS
========================================================= */

function getStoredKPIRecords() {
  try {
    const data = localStorage.getItem(KPI_STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read KPI data:", error);

    return [];
  }
}

/* =========================================================
   RESET FORM
========================================================= */

function resetKPIForm() {
  editingKPIId = null;

  document.getElementById("financialYear").value = "";

  document.getElementById("quarter").innerHTML = `

            <option value="">
                Select Quarter
            </option>

        `;

  document.getElementById("month").value = "";

  document.getElementById("unit").value = "";

  document.getElementById("department").value = "";

  document.getElementById("section").value = "";

  document.getElementById("kpiRows").innerHTML = "";

  document.getElementById("kpiEntryArea").classList.remove("show");

  document.getElementById("saveKpiText").textContent = "Save KPI";

  updateAddKPIButton();
}

/* =========================================================
   EDIT KPI
========================================================= */

function startEditKPI(id) {
  const records = getStoredKPIRecords();

  const record = records.find(function (item) {
    return item.id === id;
  });

  if (!record) {
    showKPIToast("KPI record not found.", "error");

    return;
  }

  editingKPIId = record.id;

  /*
    |--------------------------------------------------------------------------
    | Basic Information
    |--------------------------------------------------------------------------
    */

  const financialYear = document.getElementById("financialYear");

  financialYear.value = record.financialYear;

  handleFinancialYearChange();

  document.getElementById("quarter").value = record.quarter;

  handleQuarterChange();

  /*
    | Preserve saved month
    */

  document.getElementById("month").value = record.month;

  document.getElementById("unit").value = record.unit;

  document.getElementById("department").value = record.department;

  document.getElementById("section").value = record.section;

  /*
    |--------------------------------------------------------------------------
    | KPI Rows
    |--------------------------------------------------------------------------
    */

  const container = document.getElementById("kpiRows");

  container.innerHTML = "";

  showKPIEntryArea();

  if (Array.isArray(record.kpis) && record.kpis.length) {
    record.kpis.forEach(function (kpi) {
      addKPIRow(kpi);
    });
  } else {
    addKPIRow();
  }

  updateKPIOrder();

  /*
|--------------------------------------------------------------------------
| Update KPI Priorities
|--------------------------------------------------------------------------
*/
  updateKPIOrder();
  /*
    |--------------------------------------------------------------------------
    | UI
    |--------------------------------------------------------------------------
    */

  document.getElementById("saveKpiText").textContent = "Update KPI";

  document.querySelector(".kpi-config-card").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  setTimeout(function () {
    const firstInput = document.querySelector(".kpi-name-input");

    if (firstInput) {
      firstInput.focus();
    }
  }, 400);
}

/* =========================================================
   RENDER SAVED LIST
========================================================= */

function renderSavedKPIList() {
  const tbody = document.getElementById("savedKpiList");

  const table = document.querySelector(".kpi-table");

  const emptyState = document.getElementById("emptyKpiState");

  const noSearchResult = document.getElementById("noSearchResult");

  const recordCount = document.getElementById("kpiRecordCount");

  const search = document.getElementById("kpiSearch");

  if (!tbody || !table) {
    return;
  }

  const records = getStoredKPIRecords();

  if (recordCount) {
    recordCount.textContent = records.length;
  }

  const keyword = (search?.value || "").trim().toLowerCase();

  const filtered = records.filter(function (record) {
    if (!keyword) {
      return true;
    }

    const searchableText = [
      record.financialYear,

      record.quarter,

      record.month,

      record.unit,

      record.department,

      record.section,

      ...(Array.isArray(record.kpis)
        ? record.kpis.map(function (kpi) {
            return kpi.kpiName;
          })
        : []),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(keyword);
  });

  /*
    |--------------------------------------------------------------------------
    | No records
    |--------------------------------------------------------------------------
    */

  if (records.length === 0) {
    tbody.innerHTML = "";

    table.style.display = "none";

    emptyState.style.display = "flex";

    noSearchResult.style.display = "none";

    return;
  }

  /*
    |--------------------------------------------------------------------------
    | Records exist
    |--------------------------------------------------------------------------
    */

  table.style.display = "table";

  emptyState.style.display = "none";

  /*
    |--------------------------------------------------------------------------
    | Search has no result
    |--------------------------------------------------------------------------
    */

  if (filtered.length === 0) {
    tbody.innerHTML = "";

    table.style.display = "none";

    noSearchResult.style.display = "flex";

    return;
  }

  noSearchResult.style.display = "none";

  /*
    |--------------------------------------------------------------------------
    | Rows
    |--------------------------------------------------------------------------
    */

  tbody.innerHTML = filtered
    .map(function (record, index) {
      const kpiCount = Array.isArray(record.kpis) ? record.kpis.length : 0;

      return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>
                            ${escapeKPIHtml(record.financialYear)}
                        </td>


                        <td>
                            ${escapeKPIHtml(record.quarter)}
                        </td>


                        <td>
                            ${escapeKPIHtml(record.month)}
                        </td>


                        <td>
                            ${escapeKPIHtml(record.unit)}
                        </td>


                        <td>
                            ${escapeKPIHtml(record.department)}
                        </td>


                        <td>

                            <span class="kpi-section">
                                ${escapeKPIHtml(record.section)}
                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="kpi-details-btn"
                                data-id="${escapeKPIHtml(record.id)}"
                            >

                                <i class="fa-solid fa-list"></i>

                                ${kpiCount} KPI

                            </button>

                        </td>


                        <td>

                            <div class="table-action-buttons">

                                <button
                                    type="button"
                                    class="table-edit-btn"
                                    title="Edit"
                                    data-id="${escapeKPIHtml(record.id)}"
                                >

                                    <i class="fa-solid fa-pen"></i>

                                </button>


                                <button
                                    type="button"
                                    class="table-delete-btn"
                                    title="Delete"
                                    data-id="${escapeKPIHtml(record.id)}"
                                >

                                    <i class="fa-solid fa-trash-can"></i>

                                </button>

                            </div>

                        </td>

                    </tr>

                `;
    })
    .join("");

  /*
    |--------------------------------------------------------------------------
    | Details
    |--------------------------------------------------------------------------
    */

  tbody.querySelectorAll(".kpi-details-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      openDetailsModal(button.dataset.id);
    });
  });

  /*
    |--------------------------------------------------------------------------
    | Edit
    |--------------------------------------------------------------------------
    */

  tbody.querySelectorAll(".table-edit-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      startEditKPI(button.dataset.id);
    });
  });

  /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

  tbody.querySelectorAll(".table-delete-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      openDeleteModal(button.dataset.id);
    });
  });
}

/* =========================================================
   KPI DETAILS MODAL
========================================================= */

function openDetailsModal(id) {
  const records = getStoredKPIRecords();

  const record = records.find(function (item) {
    return item.id === id;
  });

  if (!record) {
    showKPIToast("KPI record not found.", "error");

    return;
  }

  const subtitle = document.getElementById("modalSubtitle");

  const meta = document.getElementById("modalMeta");

  const list = document.getElementById("modalKpiList");

  subtitle.textContent = `${record.section} — KPI Configuration`;

  meta.innerHTML = `

        <span class="modal-meta-item">
            <strong>FY:</strong>
            ${escapeKPIHtml(record.financialYear)}
        </span>


        <span class="modal-meta-item">
            <strong>Quarter:</strong>
            ${escapeKPIHtml(record.quarter)}
        </span>


        <span class="modal-meta-item">
            <strong>Month:</strong>
            ${escapeKPIHtml(record.month)}
        </span>


        <span class="modal-meta-item">
            <strong>Unit:</strong>
            ${escapeKPIHtml(record.unit)}
        </span>


        <span class="modal-meta-item">
            <strong>Department:</strong>
            ${escapeKPIHtml(record.department)}
        </span>


        <span class="modal-meta-item">
            <strong>Section:</strong>
            ${escapeKPIHtml(record.section)}
        </span>

    `;

  const kpis = Array.isArray(record.kpis) ? record.kpis : [];

  list.innerHTML = kpis
    .map(function (kpi, index) {
      return `

                    <tr>

                        <td>

                            <span class="modal-priority">
                                ${index + 1}
                            </span>

                        </td>


                        <td>

                            ${escapeKPIHtml(kpi.kpiName)}

                        </td>


                        <td>

                            <span class="modal-source">
                                ${escapeKPIHtml(kpi.dataSource)}
                            </span>

                        </td>

                    </tr>

                `;
    })
    .join("");

  document.getElementById("kpiDetailsModal").classList.add("show");
}

/* =========================================================
   CLOSE DETAILS
========================================================= */

function closeDetailsModal() {
  document.getElementById("kpiDetailsModal").classList.remove("show");
}

/* =========================================================
   DELETE
========================================================= */

function openDeleteModal(id) {
  const records = getStoredKPIRecords();

  const record = records.find(function (item) {
    return item.id === id;
  });

  if (!record) {
    return;
  }

  deletingKPIId = id;

  document.getElementById("deleteKpiText").textContent =
    `Are you sure you want to delete the KPI configuration for ${record.section} (${record.financialYear} - ${record.quarter})?`;

  document.getElementById("kpiDeleteModal").classList.add("show");
}

/* =========================================================
   CLOSE DELETE
========================================================= */

function closeDeleteModal() {
  deletingKPIId = null;

  document.getElementById("kpiDeleteModal").classList.remove("show");
}

/* =========================================================
   CONFIRM DELETE
========================================================= */

function confirmKPIDelete() {
  if (!deletingKPIId) {
    return;
  }

  const records = getStoredKPIRecords();

  const updatedRecords = records.filter(function (record) {
    return record.id !== deletingKPIId;
  });

  localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(updatedRecords));

  const wasEditing = editingKPIId === deletingKPIId;

  renderSavedKPIList();

  closeDeleteModal();

  if (wasEditing) {
    resetKPIForm();
  }

  showKPIToast("KPI deleted successfully.", "success");
}

/* =========================================================
   QUARTER HELPERS
========================================================= */

function normalizeQuarter(value) {
  const text = String(value || "")
    .trim()
    .toUpperCase();

  const match = text.match(/Q\s*([1-4])/);

  if (!match) {
    return text;
  }

  return `Q${match[1]}`;
}

function quarterNumber(value) {
  const quarter = normalizeQuarter(value);

  const match = quarter.match(/Q([1-4])/);

  return match ? Number(match[1]) : 99;
}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeKPIHtml(value) {
  const div = document.createElement("div");

  div.textContent = String(value ?? "");

  return div.innerHTML;
}

/* =========================================================
   TOAST
========================================================= */

function showKPIToast(message, type = "success") {
  const toast = document.getElementById("kpiToast");

  const messageElement = document.getElementById("kpiToastMessage");

  if (!toast || !messageElement) {
    return;
  }

  const icon = toast.querySelector(".toast-icon i");

  const iconBox = toast.querySelector(".toast-icon");

  messageElement.textContent = message;

  if (type === "error") {
    icon.className = "fa-solid fa-circle-exclamation";

    iconBox.style.background = "#FFF1F1";

    iconBox.style.color = "var(--danger)";
  } else {
    icon.className = "fa-solid fa-circle-check";

    iconBox.style.background = "#E8F7F0";

    iconBox.style.color = "#16805A";
  }

  toast.classList.add("show");

  clearTimeout(toast._timer);

  toast._timer = setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}
