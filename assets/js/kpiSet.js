/* =========================================================
   KPI SET
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeKPISet();
});

/* =========================================================
   STORAGE
========================================================= */

const KPI_SET_STORAGE_KEY = "kpi_set_data";

const KPI_STORAGE_KEY = "kpi_entry_data";

const PERIOD_STORAGE_KEY = "kpi_period_setup";

/*
  Change this only if your UOM Setup page uses a different
  localStorage key.
*/
const UOM_STORAGE_KEY = "kpi_uom_setup";

let selectedKPIEntryRecordId = null;

let editingKPISetId = null;

let deletingKPISetId = null;

let draggedKPISetId = null;

/* =========================================================
   INITIALIZE
========================================================= */

function initializeKPISet() {
  loadSearchEngine();

  loadFinancialYears();

  bindKPISetEvents();

  hideSavedKPISetList();

  disableKPISetMonthEditing();

  document.getElementById("kpiSetConfigCard").classList.remove("show");
}
/* =========================================================
   EVENTS
========================================================= */

function bindKPISetEvents() {
  const search = document.getElementById("kpiSetSearch");

  const clearSearch = document.getElementById("clearKPISetSearch");

  const loginButton = document.getElementById("kpiSetLoginBtn");

  const financialYear = document.getElementById("kpiSetFinancialYear");

  const quarter = document.getElementById("kpiSetQuarter");

  const saveButton = document.getElementById("saveKPISetBtn");

  const cancelButton = document.getElementById("cancelKPISetBtn");

  search.addEventListener("input", renderSearchEngine);

  clearSearch.addEventListener("click", function () {
    search.value = "";

    renderSearchEngine();

    search.focus();
  });

  document
    .getElementById("kpiSetSearchList")
    .addEventListener("change", function (event) {
      if (event.target.classList.contains("kpi-set-radio")) {
        selectedKPIEntryRecordId = event.target.value;

        loginButton.disabled = false;
      }
    });

  loginButton.addEventListener("click", loginToKPISet);

  financialYear.addEventListener("change", handleKPISetFinancialYearChange);

  quarter.addEventListener("change", handleKPISetQuarterChange);

  saveButton.addEventListener("click", saveKPISetConfiguration);

  cancelButton.addEventListener("click", resetKPISetForm);

  document
    .getElementById("cancelKPISetDelete")
    .addEventListener("click", closeKPISetDeleteModal);

  document
    .getElementById("confirmKPISetDelete")
    .addEventListener("click", confirmKPISetDelete);

  document
    .getElementById("kpiSetDeleteModal")
    .addEventListener("click", function (event) {
      if (event.target === this) {
        closeKPISetDeleteModal();
      }
    });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeKPISetDeleteModal();
    }
  });
}

/* =========================================================
   STORAGE HELPERS
========================================================= */

function getStoredKPIEntryRecords() {
  try {
    const data = localStorage.getItem(KPI_STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read KPI Entry data:", error);

    return [];
  }
}

function getStoredKPISetRecords() {
  try {
    const data = localStorage.getItem(KPI_SET_STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read KPI Set data:", error);

    return [];
  }
}

function getPeriodData() {
  try {
    const data = localStorage.getItem(PERIOD_STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read Period Setup data:", error);

    return [];
  }
}

function getUOMData() {
  try {
    const data = localStorage.getItem(UOM_STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(function (uom) {
      return uom && uom.isActive === true && uom.uomName;
    });
  } catch (error) {
    console.error("Unable to read UOM Setup data:", error);

    return [];
  }
}

/* =========================================================
   SEARCH NUMBER
========================================================= */

function generateSearchNumber(existingNumbers) {
  let number = "";

  do {
    const digitLength = Math.floor(Math.random() * 4) + 3;

    let firstDigit = Math.floor(Math.random() * 9) + 1;

    let remaining = "";

    for (let i = 1; i < digitLength; i++) {
      remaining += Math.floor(Math.random() * 10);
    }

    number = String(firstDigit) + remaining;
  } while (existingNumbers.has(number));

  return number;
}

function getOrCreateSearchNumber(record) {
  if (record.searchNumber && /^\d{3,6}$/.test(String(record.searchNumber))) {
    return String(record.searchNumber);
  }

  const usedNumbers = new Set();

  getStoredKPIEntryRecords().forEach(function (item) {
    if (item.searchNumber) {
      usedNumbers.add(String(item.searchNumber));
    }
  });

  const newNumber = generateSearchNumber(usedNumbers);

  /*
    Persist the generated number directly into the KPI Entry
    record so the same number remains stable on future visits.
  */

  const records = getStoredKPIEntryRecords();

  const index = records.findIndex(function (item) {
    return item.id === record.id;
  });

  if (index !== -1) {
    records[index].searchNumber = newNumber;

    localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(records));
  }

  record.searchNumber = newNumber;

  return newNumber;
}

/* =========================================================
   SEARCH ENGINE
========================================================= */

function loadSearchEngine() {
  getStoredKPIEntryRecords().forEach(function (record) {
    getOrCreateSearchNumber(record);
  });

  renderSearchEngine();
}

function renderSearchEngine() {
  const tbody = document.getElementById("kpiSetSearchList");

  const emptyState = document.getElementById("emptyKPISetSearch");

  const noResult = document.getElementById("noKPISetSearchResult");

  const count = document.getElementById("searchRecordCount");

  const searchValue = (document.getElementById("kpiSetSearch").value || "")
    .trim()
    .toLowerCase();

  const records = getStoredKPIEntryRecords();

  if (count) {
    count.textContent = records.length;
  }

  if (!records.length) {
    tbody.innerHTML = "";

    emptyState.style.display = "flex";

    noResult.style.display = "none";

    return;
  }

  emptyState.style.display = "none";

  const filtered = records.filter(function (record) {
    const searchText = [
      record.searchNumber,
      record.unit,
      record.department,
      record.section,
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(searchValue);
  });

  if (!filtered.length) {
    tbody.innerHTML = "";

    noResult.style.display = "flex";

    return;
  }

  noResult.style.display = "none";

  tbody.innerHTML = filtered
    .map(function (record) {
      const searchNumber = getOrCreateSearchNumber(record);

      const checked = selectedKPIEntryRecordId === record.id ? "checked" : "";

      return `
        <tr>
          <td>
            <input
              type="radio"
              name="kpiSetSearchSelection"
              class="kpi-set-radio"
              value="${escapeKPISetHtml(record.id)}"
              ${checked}
            />
          </td>

          <td>
            <span class="search-number">
              ${escapeKPISetHtml(searchNumber)}
            </span>
          </td>

          <td>
            <span class="org-value">
              ${escapeKPISetHtml(record.unit)}
            </span>
          </td>

          <td>
            <span class="org-value">
              ${escapeKPISetHtml(record.department)}
            </span>
          </td>

          <td>
            <span class="org-value section-value">
              ${escapeKPISetHtml(record.section)}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  const loginButton = document.getElementById("kpiSetLoginBtn");

  loginButton.disabled = !selectedKPIEntryRecordId;
}

/* =========================================================
   LOGIN
========================================================= */

function loginToKPISet() {
  if (!selectedKPIEntryRecordId) {
    showKPISetToast("Please select a KPI configuration first.", "error");

    return;
  }

  const records = getStoredKPIEntryRecords();

  const record = records.find(function (item) {
    return String(item.id) === String(selectedKPIEntryRecordId);
  });

  if (!record) {
    showKPISetToast("Selected KPI configuration was not found.", "error");

    return;
  }

  resetKPISetConfigurationOnly();

  populateSelectedConfiguration(record);

  loadFinancialYears();

  /*
    Show only the Saved KPI Set List belonging
    to the selected Search Number.
  */
  renderSavedKPISetList();

  document.getElementById("kpiSetConfigCard").classList.add("show");

  document.getElementById("kpiSetConfigCard").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/* =========================================================
   SELECTED CONFIGURATION
========================================================= */

function populateSelectedConfiguration(record) {
  document.getElementById("selectedSearchNumber").textContent =
    getOrCreateSearchNumber(record);

  document.getElementById("selectedUnit").textContent = record.unit || "—";

  document.getElementById("selectedDepartment").textContent =
    record.department || "—";

  document.getElementById("selectedSection").textContent =
    record.section || "—";
}

/* =========================================================
   FINANCIAL YEAR
========================================================= */

function loadFinancialYears() {
  const select = document.getElementById("kpiSetFinancialYear");

  if (!select) {
    return;
  }

  const currentValue = select.value;

  select.innerHTML = `
    <option value="">Select Financial Year</option>
  `;

  /*
    ============================================================
    IMPORTANT:
    Financial Year must come from KPI Entry data, not Period Setup.

    Only KPI Entry records matching the currently selected:
      Unit
      Department
      Section

    will be considered.
    ============================================================
  */

  const entryRecords = getStoredKPIEntryRecords();

  if (!selectedKPIEntryRecordId || !entryRecords.length) {
    return;
  }

  /*
    Find the currently selected Search Engine configuration.
  */

  const selectedRecord = entryRecords.find(function (record) {
    return String(record.id) === String(selectedKPIEntryRecordId);
  });

  if (!selectedRecord) {
    return;
  }

  /*
    Get Financial Years only from KPI Entry records having
    the exact same Unit + Department + Section.
  */

  const years = [];

  entryRecords.forEach(function (record) {
    const sameUnit =
      String(record.unit ?? "").trim() ===
      String(selectedRecord.unit ?? "").trim();

    const sameDepartment =
      String(record.department ?? "").trim() ===
      String(selectedRecord.department ?? "").trim();

    const sameSection =
      String(record.section ?? "").trim() ===
      String(selectedRecord.section ?? "").trim();

    if (!sameUnit || !sameDepartment || !sameSection) {
      return;
    }

    const year = record.financialYear ?? record.finYear ?? record.year ?? "";

    if (String(year).trim() !== "" && !years.includes(String(year).trim())) {
      years.push(String(year).trim());
    }
  });

  /*
    Sort Financial Years descending.
  */

  years.sort(function (a, b) {
    return b.localeCompare(a, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  /*
    Populate only the Financial Years belonging to the
    selected Unit + Department + Section.
  */

  years.forEach(function (year) {
    const option = document.createElement("option");

    option.value = year;
    option.textContent = year;

    select.appendChild(option);
  });

  /*
    Preserve the previous selection if it still exists.
  */

  if (years.includes(String(currentValue))) {
    select.value = currentValue;
  }
}

/* =========================================================
   FINANCIAL YEAR CHANGE
========================================================= */
function handleKPISetFinancialYearChange() {
  const year = document.getElementById("kpiSetFinancialYear").value;

  const quarter = document.getElementById("kpiSetQuarter");

  quarter.innerHTML = `
    <option value="">Select Quarter</option>
  `;

  document.getElementById("kpiSetMonth").value = "";

  clearKPISetRows();

  if (!year || !selectedKPIEntryRecordId) {
    updateKPISetSaveButton();
    return;
  }

  const entryRecords = getStoredKPIEntryRecords();

  const selectedRecord = entryRecords.find(function (record) {
    return String(record.id) === String(selectedKPIEntryRecordId);
  });

  if (!selectedRecord) {
    updateKPISetSaveButton();
    return;
  }

  const quarters = [];

  entryRecords.forEach(function (record) {
    const sameYear =
      String(
        record.financialYear ?? record.finYear ?? record.year ?? "",
      ).trim() === String(year).trim();

    const sameUnit =
      String(record.unit ?? "").trim() ===
      String(selectedRecord.unit ?? "").trim();

    const sameDepartment =
      String(record.department ?? "").trim() ===
      String(selectedRecord.department ?? "").trim();

    const sameSection =
      String(record.section ?? "").trim() ===
      String(selectedRecord.section ?? "").trim();

    if (!sameYear || !sameUnit || !sameDepartment || !sameSection) {
      return;
    }

    const quarterName =
      record.quarter ??
      record.quarterSet ??
      record.financialYearWiseQuarterSet ??
      "";

    if (!String(quarterName).trim()) {
      return;
    }

    const normalizedQuarter = normalizeQuarter(quarterName);

    if (
      normalizedQuarter &&
      !quarters.some(function (item) {
        return normalizeQuarter(item) === normalizedQuarter;
      })
    ) {
      quarters.push(String(quarterName).trim());
    }
  });

  quarters
    .sort(function (a, b) {
      return quarterNumber(a) - quarterNumber(b);
    })
    .forEach(function (quarterName) {
      const option = document.createElement("option");

      option.value = quarterName;
      option.textContent = quarterName;

      quarter.appendChild(option);
    });

  updateKPISetSaveButton();
}

/* =========================================================
   QUARTER CHANGE
========================================================= */

function handleKPISetQuarterChange() {
  const year = document.getElementById("kpiSetFinancialYear").value;

  const quarter = document.getElementById("kpiSetQuarter").value;

  const month = document.getElementById("kpiSetMonth");

  month.value = "";

  clearKPISetRows();

  if (!year || !quarter) {
    updateKPISetSaveButton();

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

  if (matchingPeriods.length) {
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

  const entryRecords = getStoredKPIEntryRecords();

  const entryRecord = entryRecords.find(function (record) {
    return String(record.id) === String(selectedKPIEntryRecordId);
  });

  if (entryRecord) {
    const existingSet = findKPISetConfiguration(year, quarter, entryRecord);

    if (existingSet) {
      loadExistingKPISet(existingSet, entryRecord);
    } else {
      editingKPISetId = null;

      loadKPIsForSelectedConfiguration();
    }
  }

  updateKPISetSaveButton();
}

/* =========================================================
   LOAD KPI ENTRY DATA
========================================================= */

function loadKPIsForSelectedConfiguration() {
  if (!selectedKPIEntryRecordId) {
    return;
  }

  const entryRecords = getStoredKPIEntryRecords();

  const selectedRecord = entryRecords.find(function (record) {
    return String(record.id) === String(selectedKPIEntryRecordId);
  });

  if (!selectedRecord) {
    showKPISetToast(
      "The selected KPI Entry configuration could not be found.",
      "error",
    );

    return;
  }

  const year = document.getElementById("kpiSetFinancialYear").value;

  const quarter = document.getElementById("kpiSetQuarter").value;

  const matchingRecord = entryRecords.find(function (record) {
    return (
      record.financialYear === year &&
      normalizeQuarter(record.quarter) === normalizeQuarter(quarter) &&
      String(record.unit) === String(selectedRecord.unit) &&
      String(record.department) === String(selectedRecord.department) &&
      String(record.section) === String(selectedRecord.section)
    );
  });

  /*
    Because KPI Entry enforces a unique FY + Quarter + Unit +
    Department + Section combination, this should identify
    exactly one record.
  */

  if (!matchingRecord) {
    showKPISetToast(
      "No KPI Entry configuration exists for the selected Financial Year and Quarter.",
      "error",
    );

    return;
  }

  clearKPISetRows();

  if (Array.isArray(matchingRecord.kpis) && matchingRecord.kpis.length) {
    matchingRecord.kpis
      .slice()
      .sort(function (a, b) {
        return Number(a.priority || 0) - Number(b.priority || 0);
      })
      .forEach(function (kpi) {
        addKPISetRow({
          kpiName: kpi.kpiName || "",
          priority: kpi.priority,
          sourceKPIId: kpi.id || null,
          isLoadedFromKPIEntry: true,
        });
      });
  } else {
    showKPISetToast(
      "No KPI rows are available in the selected KPI Entry configuration.",
      "error",
    );
  }

  updateKPISetOrder();

  document.getElementById("kpiSetEntryArea").classList.add("show");
}

/* =========================================================
   FIND EXISTING KPI SET
========================================================= */

function findKPISetConfiguration(year, quarter, entryRecord) {
  const records = getStoredKPISetRecords();

  const searchNumber = String(getOrCreateSearchNumber(entryRecord)).trim();

  return (
    records.find(function (record) {
      return (
        String(record.searchNumber || "").trim() === searchNumber &&
        String(record.financialYear || "").trim() ===
          String(year || "").trim() &&
        normalizeQuarter(record.quarter) === normalizeQuarter(quarter) &&
        String(record.kpiEntryRecordId || "") === String(entryRecord.id || "")
      );
    }) || null
  );
}

/* =========================================================
   LOAD EXISTING KPI SET
========================================================= */

function loadExistingKPISet(setRecord, entryRecord) {
  editingKPISetId = setRecord.id;

  const container = document.getElementById("kpiSetRows");

  container.innerHTML = "";

  const sourceKPIs = Array.isArray(entryRecord.kpis)
    ? entryRecord.kpis.slice().sort(function (a, b) {
        return Number(a.priority || 0) - Number(b.priority || 0);
      })
    : [];

  const savedRows = Array.isArray(setRecord.rows) ? setRecord.rows : [];

  /*
    Load KPI Entry rows.
  */

  sourceKPIs.forEach(function (kpi, index) {
    const savedRow = savedRows.find(function (row) {
      return (
        row.isLoadedFromKPIEntry === true &&
        (String(row.sourceKPIId || "") === String(kpi.id || "") ||
          (!row.sourceKPIId &&
            String(row.kpiName || "") === String(kpi.kpiName || "")))
      );
    });

    addKPISetRow({
      id: savedRow?.id || null,
      kpiName: kpi.kpiName || "",
      uom: savedRow?.uom || "",
      weight: savedRow?.weight ?? "",
      target: savedRow?.target ?? "",
      remarks: savedRow?.remarks || "",
      sourceKPIId: kpi.id || null,
      isLoadedFromKPIEntry: true,
      priority: index + 1,
    });
  });

  /*
    Load manually-created KPI Target rows.
  */

  savedRows
    .filter(function (row) {
      return row.isLoadedFromKPIEntry !== true;
    })
    .forEach(function (row) {
      addKPISetRow({
        id: row.id || null,
        kpiName: row.kpiName || "",
        uom: row.uom || "",
        weight: row.weight ?? "",
        target: row.target ?? "",
        remarks: row.remarks || "",
        sourceKPIId: null,
        isLoadedFromKPIEntry: false,
      });
    });

  updateKPISetOrder();

  document.getElementById("kpiSetEntryArea").classList.add("show");

  document.getElementById("saveKPISetText").textContent = "Update KPI Set";

  updateKPISetSaveButton();
}

/* =========================================================
   ADD KPI SET ROW
========================================================= */

function addKPISetRow(rowData = {}) {
  const container = document.getElementById("kpiSetRows");

  const rowId =
    rowData.id ||
    "kpi-set-row-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 8);

  const isLoaded = rowData.isLoadedFromKPIEntry === true;

  const row = document.createElement("div");

  row.className = "kpi-set-row";

  row.dataset.rowId = rowId;

  row.dataset.loadedFromEntry = isLoaded ? "true" : "false";
  row.dataset.sourceKpiId = rowData.sourceKPIId || "";

  row.draggable = true;

  const kpiNameHtml = isLoaded
    ? `
      <span class="kpi-name-text">
        ${escapeKPISetHtml(rowData.kpiName || "")}
      </span>
    `
    : `
      <input
        type="text"
        class="kpi-set-input kpi-name-input"
        placeholder="Enter KPI Name..."
        autocomplete="off"
        value="${escapeKPISetAttribute(rowData.kpiName || "")}"
      />
    `;

  row.innerHTML = `
    <div class="kpi-set-cell kpi-name-cell">
      <div
        class="kpi-drag-handle"
        title="Drag to change priority"
      >
        <i class="fa-solid fa-grip-vertical"></i>
      </div>

      ${kpiNameHtml}
    </div>

    <div class="kpi-set-cell">
      <select class="kpi-set-select kpi-uom-select">
        ${buildUOMOptions(rowData.uom || "")}
      </select>
    </div>

    <div class="kpi-set-cell">
      <input
        type="number"
        class="kpi-set-input kpi-weight-input"
        min="0"
        step="any"
        inputmode="decimal"
        placeholder="Weight"
        value="${escapeKPISetAttribute(rowData.weight ?? "")}"
      />
    </div>

    <div class="kpi-set-cell">
      <input
        type="number"
        class="kpi-set-input kpi-target-input"
        step="any"
        inputmode="decimal"
        placeholder="Target"
        value="${escapeKPISetAttribute(rowData.target ?? "")}"
      />
    </div>

    <div class="kpi-set-cell">
      <span class="priority-badge">1</span>
    </div>

    <div class="kpi-set-cell">
      <input
        type="text"
        class="kpi-set-input kpi-remarks-input"
        placeholder="Remarks..."
        autocomplete="off"
        value="${escapeKPISetAttribute(rowData.remarks || "")}"
      />
    </div>

    <div class="kpi-set-cell">
      <div class="kpi-row-actions">

        <button
          type="button"
          class="kpi-row-action kpi-add-row-btn"
          title="Add KPI row below"
          aria-label="Add KPI row below"
        >
          <i class="fa-solid fa-plus"></i>
        </button>

            <button
        type="button"
        class="kpi-row-action kpi-delete-row-btn"
        title="Delete row"
        aria-label="Delete row"
      >
        <i class="fa-solid fa-minus"></i>
      </button>

      </div>
    </div>
  `;

  container.appendChild(row);

  if (isLoaded) {
    protectKPISetName(row);
  }

  row.querySelector(".kpi-add-row-btn").addEventListener("click", function () {
    addKPISetRow({
      id: null,
      kpiName: "",
      uom: "",
      weight: "",
      target: "",
      remarks: "",
      sourceKPIId: null,
      isLoadedFromKPIEntry: false,
    });

    updateKPISetOrder();
    updateKPISetSaveButton();

    const rows = document.querySelectorAll("#kpiSetRows .kpi-set-row");

    const lastRow = rows[rows.length - 1];

    if (lastRow) {
      const nameField = lastRow.querySelector(".kpi-name-input");

      if (nameField) {
        nameField.focus();
      }
    }
  });

  row
    .querySelector(".kpi-delete-row-btn")
    .addEventListener("click", function () {
      deleteKPISetRow(row);
    });

  row.addEventListener("dragstart", handleKPISetDragStart);

  row.addEventListener("dragover", handleKPISetDragOver);

  row.addEventListener("dragleave", handleKPISetDragLeave);

  row.addEventListener("drop", handleKPISetDrop);

  row.addEventListener("dragend", handleKPISetDragEnd);

  row.querySelectorAll("input, select").forEach(function (field) {
    field.addEventListener("input", updateKPISetSaveButton);

    field.addEventListener("change", updateKPISetSaveButton);
  });

  updateKPISetOrder();
}

/* =========================================================
   UOM
========================================================= */

function buildUOMOptions(selectedValue) {
  const uoms = getUOMData();

  let options = `
    <option value="">Select UOM</option>
  `;

  uoms.forEach(function (uom) {
    const value = String(uom.uomName || "").trim();

    if (!value) {
      return;
    }

    const selected = String(value) === String(selectedValue) ? "selected" : "";

    options += `
      <option
        value="${escapeKPISetAttribute(value)}"
        ${selected}
      >
        ${escapeKPISetHtml(value)}
      </option>
    `;
  });

  /*
    Preserve an already-saved UOM even if that UOM
    has subsequently been made inactive or removed.
  */

  if (
    selectedValue &&
    !uoms.some(function (uom) {
      return String(uom.uomName || "").trim() === String(selectedValue);
    })
  ) {
    options += `
      <option
        value="${escapeKPISetAttribute(selectedValue)}"
        selected
      >
        ${escapeKPISetHtml(selectedValue)}
      </option>
    `;
  }

  return options;
}

/* =========================================================
   DELETE ROW
========================================================= */

function deleteKPISetRow(row) {
  row.remove();

  updateKPISetOrder();

  updateKPISetSaveButton();
}

/* =========================================================
   PRIORITY
========================================================= */

function updateKPISetOrder() {
  const rows = Array.from(
    document.querySelectorAll("#kpiSetRows .kpi-set-row"),
  );

  rows.forEach(function (row, index) {
    const priority = row.querySelector(".priority-badge");

    if (priority) {
      priority.textContent = index + 1;
    }
  });

  const count = document.getElementById("kpiSetRowCount");

  if (count) {
    count.textContent = `${rows.length} KPI${rows.length === 1 ? "" : "s"}`;
  }
}

/* =========================================================
   DRAG START
========================================================= */

function handleKPISetDragStart(event) {
  draggedKPISetId = event.currentTarget.dataset.rowId;

  event.currentTarget.classList.add("dragging");

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData("text/plain", draggedKPISetId);
  }
}

/* =========================================================
   DRAG OVER
========================================================= */

function handleKPISetDragOver(event) {
  event.preventDefault();

  const target = event.currentTarget;

  if (target.dataset.rowId !== draggedKPISetId) {
    target.classList.add("drag-over");
  }

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

/* =========================================================
   DRAG LEAVE
========================================================= */

function handleKPISetDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

/* =========================================================
   DROP
========================================================= */

function handleKPISetDrop(event) {
  event.preventDefault();

  const target = event.currentTarget;

  target.classList.remove("drag-over");

  const container = document.getElementById("kpiSetRows");

  const dragged = container.querySelector(
    `[data-row-id="${CSS.escape(draggedKPISetId)}"]`,
  );

  if (!dragged || dragged === target) {
    return;
  }

  const rows = Array.from(container.querySelectorAll(".kpi-set-row"));

  const draggedIndex = rows.indexOf(dragged);

  const targetIndex = rows.indexOf(target);

  if (draggedIndex < targetIndex) {
    container.insertBefore(dragged, target.nextSibling);
  } else {
    container.insertBefore(dragged, target);
  }

  updateKPISetOrder();
}

/* =========================================================
   DRAG END
========================================================= */

function handleKPISetDragEnd(event) {
  event.currentTarget.classList.remove("dragging");

  document.querySelectorAll(".kpi-set-row").forEach(function (row) {
    row.classList.remove("drag-over");
  });

  draggedKPISetId = null;
}

/* =========================================================
   COLLECT ROWS
========================================================= */

function collectKPISetRows() {
  const rows = Array.from(
    document.querySelectorAll("#kpiSetRows .kpi-set-row"),
  );

  return rows.map(function (row, index) {
    const nameInput = row.querySelector(".kpi-name-input");

    const nameText = row.querySelector(".kpi-name-text");

    return {
      id:
        row.dataset.rowId ||
        Date.now().toString() +
          "-" +
          Math.random().toString(36).substring(2, 8),

      kpiName: nameInput
        ? nameInput.value.trim()
        : nameText
          ? nameText.textContent.trim()
          : "",

      uom: row.querySelector(".kpi-uom-select")?.value || "",

      weight: row.querySelector(".kpi-weight-input")?.value ?? "",

      target: row.querySelector(".kpi-target-input")?.value ?? "",

      priority: index + 1,

      remarks: row.querySelector(".kpi-remarks-input")?.value.trim() || "",

      isLoadedFromKPIEntry: row.dataset.loadedFromEntry === "true",
    };
  });
}

/* =========================================================
   VALIDATE ROWS
========================================================= */

function validateKPISetRows(rows) {
  if (!rows.length) {
    showKPISetToast("At least one KPI row is required.", "error");

    return false;
  }

  let totalWeight = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.kpiName) {
      showKPISetToast(`KPI Name is missing for priority ${i + 1}.`, "error");

      return false;
    }

    if (!row.uom) {
      showKPISetToast(`Please select UOM for "${row.kpiName}".`, "error");

      return false;
    }

    if (
      row.weight === "" ||
      !Number.isFinite(Number(row.weight)) ||
      Number(row.weight) < 0
    ) {
      showKPISetToast(
        `Please enter a valid Weight for "${row.kpiName}".`,
        "error",
      );

      return false;
    }

    if (row.target === "" || !Number.isFinite(Number(row.target))) {
      showKPISetToast(
        `Please enter a valid Target for "${row.kpiName}".`,
        "error",
      );

      return false;
    }

    totalWeight += Number(row.weight);
  }

  /*
    Weight validation:
    A KPI set should not exceed 100 total weight.
  */

  if (totalWeight > 100) {
    showKPISetToast(
      `Total KPI weight cannot exceed 100. Current total: ${totalWeight}.`,
      "error",
    );

    return false;
  }

  return true;
}

/* =========================================================
   SAVE KPI SET
========================================================= */

function saveKPISetConfiguration() {
  if (!selectedKPIEntryRecordId) {
    showKPISetToast("Please select a KPI configuration first.", "error");

    return;
  }

  const year = document.getElementById("kpiSetFinancialYear").value;

  const quarter = document.getElementById("kpiSetQuarter").value;

  const month = document.getElementById("kpiSetMonth").value;

  if (!year || !quarter || !month) {
    showKPISetToast("Please select Financial Year and Quarter first.", "error");

    return;
  }

  const entryRecords = getStoredKPIEntryRecords();

  const entryRecord = entryRecords.find(function (record) {
    return String(record.id) === String(selectedKPIEntryRecordId);
  });

  if (!entryRecord) {
    showKPISetToast("KPI Entry configuration could not be found.", "error");

    return;
  }

  const rows = collectKPISetRows();

  if (!validateKPISetRows(rows)) {
    return;
  }

  const records = getStoredKPISetRecords();

  const basicData = {
    financialYear: year,

    quarter: quarter,

    month: month,

    unit: entryRecord.unit,

    department: entryRecord.department,

    section: entryRecord.section,

    searchNumber: getOrCreateSearchNumber(entryRecord),

    kpiEntryRecordId: entryRecord.id,

    rows: rows,
  };

  /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

  if (editingKPISetId) {
    const index = records.findIndex(function (record) {
      return record.id === editingKPISetId;
    });

    if (index === -1) {
      showKPISetToast("KPI Set record could not be found.", "error");

      return;
    }

    records[index] = {
      ...records[index],
      ...basicData,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(KPI_SET_STORAGE_KEY, JSON.stringify(records));

    renderSavedKPISetList();

    showKPISetToast("KPI Set updated successfully.", "success");

    resetKPISetForm();

    return;
  }

  /*
    |--------------------------------------------------------------------------
    | PREVENT DUPLICATE SET
    |--------------------------------------------------------------------------
    */

  const currentSearchNumber = String(
    getOrCreateSearchNumber(entryRecord),
  ).trim();

  const duplicate = records.some(function (record) {
    return (
      String(record.searchNumber || "").trim() === currentSearchNumber &&
      String(record.financialYear || "").trim() === String(year || "").trim() &&
      normalizeQuarter(record.quarter) === normalizeQuarter(quarter) &&
      String(record.kpiEntryRecordId || "") === String(entryRecord.id || "")
    );
  });

  if (duplicate) {
    showKPISetToast(
      "A KPI Set already exists for this Financial Year, Quarter, Unit, Department and Section.",
      "error",
    );

    return;
  }

  /*
    |--------------------------------------------------------------------------
    | NEW
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

  localStorage.setItem(KPI_SET_STORAGE_KEY, JSON.stringify(records));

  renderSavedKPISetList();

  showKPISetToast("KPI Set saved successfully.", "success");

  resetKPISetForm();
}

/* =========================================================
   Hide  KPI SET LIST
========================================================= */
function hideSavedKPISetList() {
  const table = document.querySelector(".kpi-set-saved-table");

  const emptyState = document.getElementById("emptySavedKPISet");

  const count = document.getElementById("kpiSetRecordCount");

  if (table) {
    table.style.display = "none";
  }

  if (emptyState) {
    emptyState.style.display = "none";
  }

  if (count) {
    count.textContent = "0";
  }
}

/* =========================================================
   SAVED KPI SET LIST
========================================================= */

function renderSavedKPISetList() {
  const tbody = document.getElementById("savedKPISetList");

  const table = document.querySelector(".kpi-set-saved-table");

  const emptyState = document.getElementById("emptySavedKPISet");

  const count = document.getElementById("kpiSetRecordCount");

  const allRecords = getStoredKPISetRecords();

  const records = allRecords.filter(function (record) {
    return String(record.kpiEntryRecordId) === String(selectedKPIEntryRecordId);
  });

  if (count) {
    count.textContent = records.length;
  }

  if (!records.length) {
    tbody.innerHTML = "";

    table.style.display = "none";

    emptyState.style.display = "flex";

    return;
  }

  table.style.display = "table";

  emptyState.style.display = "none";

  const rows = [];

  records.forEach(function (record) {
    if (!Array.isArray(record.rows)) {
      return;
    }

    record.rows.forEach(function (row) {
      rows.push({
        ...row,
        setId: record.id,
      });
    });
  });

  tbody.innerHTML = rows
    .map(function (row, index) {
      const canDelete = true;

      return `
        <tr>
          <td>${index + 1}</td>

          <td class="kpi-list-name">
            ${escapeKPISetHtml(row.kpiName)}
          </td>

          <td>
            <span class="saved-kpi-uom">
              ${escapeKPISetHtml(row.uom)}
            </span>
          </td>

          <td>
            ${escapeKPISetHtml(row.weight)}
          </td>

          <td>
            ${escapeKPISetHtml(row.target)}
          </td>

          <td>
            <span class="saved-kpi-priority">
              ${escapeKPISetHtml(row.priority)}
            </span>
          </td>

          <td>
            ${escapeKPISetHtml(row.remarks)}
          </td>

          <td>
            <div class="table-action-buttons">

              <button
                type="button"
                class="table-edit-btn"
                title="Edit"
                data-set-id="${escapeKPISetAttribute(row.setId)}"
                data-row-id="${escapeKPISetAttribute(row.id)}"
              >
                <i class="fa-solid fa-pen"></i>
              </button>

                <button
                  type="button"
                  class="table-delete-btn"
                  title="Delete"
                  data-set-id="${escapeKPISetAttribute(row.setId)}"
                  data-row-id="${escapeKPISetAttribute(row.id)}"
                >
                  <i class="fa-solid fa-trash-can"></i>
                </button>

            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".table-edit-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      editSavedKPISetRow(button.dataset.setId, button.dataset.rowId);
    });
  });

  tbody.querySelectorAll(".table-delete-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      openKPISetDeleteModal(button.dataset.setId, button.dataset.rowId);
    });
  });
}

/* =========================================================
   EDIT SAVED ROW
========================================================= */

function editSavedKPISetRow(setId, rowId) {
  const records = getStoredKPISetRecords();

  const record = records.find(function (item) {
    return item.id === setId;
  });

  if (!record) {
    showKPISetToast("KPI Set record could not be found.", "error");

    return;
  }

  const entryRecord = getStoredKPIEntryRecords().find(function (item) {
    return String(item.id) === String(record.kpiEntryRecordId);
  });

  if (!entryRecord) {
    showKPISetToast(
      "The related KPI Entry record could not be found.",
      "error",
    );

    return;
  }

  selectedKPIEntryRecordId = entryRecord.id;

  /*
    Select the corresponding Search Engine radio.
  */

  document.querySelectorAll(".kpi-set-radio").forEach(function (radio) {
    radio.checked = radio.value === String(entryRecord.id);
  });

  populateSelectedConfiguration(entryRecord);

  document.getElementById("kpiSetConfigCard").classList.add("show");

  loadFinancialYears();

  document.getElementById("kpiSetFinancialYear").value = record.financialYear;

  handleKPISetFinancialYearChange();

  document.getElementById("kpiSetQuarter").value = record.quarter;

  handleKPISetQuarterChange();

  editingKPISetId = record.id;

  loadExistingKPISet(record, entryRecord);

  document.getElementById("saveKPISetText").textContent = "Update KPI Set";

  document.getElementById("kpiSetConfigCard").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
  renderSavedKPISetList();
}

/* =========================================================
   DELETE MODAL
========================================================= */

function openKPISetDeleteModal(setId, rowId) {
  const records = getStoredKPISetRecords();

  const record = records.find(function (item) {
    return item.id === setId;
  });

  if (!record || !Array.isArray(record.rows)) {
    return;
  }

  const row = record.rows.find(function (item) {
    return item.id === rowId;
  });

  if (!row) {
    return;
  }

  // KPI Entry rows can now be deleted from KPI Set.

  deletingKPISetId = {
    setId: setId,
    rowId: rowId,
  };

  document.getElementById("kpiSetDeleteText").textContent =
    `Are you sure you want to delete "${row.kpiName}"?`;

  document.getElementById("kpiSetDeleteModal").classList.add("show");
}

/* =========================================================
   CLOSE DELETE
========================================================= */

function closeKPISetDeleteModal() {
  deletingKPISetId = null;

  document.getElementById("kpiSetDeleteModal").classList.remove("show");
}

/* =========================================================
   CONFIRM DELETE
========================================================= */

function confirmKPISetDelete() {
  if (!deletingKPISetId) {
    return;
  }

  const records = getStoredKPISetRecords();

  const recordIndex = records.findIndex(function (record) {
    return record.id === deletingKPISetId.setId;
  });

  if (recordIndex === -1) {
    closeKPISetDeleteModal();

    return;
  }

  const record = records[recordIndex];

  const row = record.rows.find(function (item) {
    return item.id === deletingKPISetId.rowId;
  });

  if (!row) {
    closeKPISetDeleteModal();

    return;
  }

  // KPI Entry rows can now be deleted from KPI Set.

  record.rows = record.rows.filter(function (item) {
    return item.id !== deletingKPISetId.rowId;
  });

  /*
    If all manually-created rows are removed and there are
    no rows left, remove the complete KPI Set configuration.
  */

  if (!record.rows.length) {
    records.splice(recordIndex, 1);
  } else {
    record.updatedAt = new Date().toISOString();
  }

  localStorage.setItem(KPI_SET_STORAGE_KEY, JSON.stringify(records));

  renderSavedKPISetList();

  closeKPISetDeleteModal();

  showKPISetToast("KPI Set row deleted successfully.", "success");
}

/* =========================================================
   RESET
========================================================= */

function resetKPISetConfigurationOnly() {
  editingKPISetId = null;

  document.getElementById("kpiSetFinancialYear").value = "";

  document.getElementById("kpiSetQuarter").innerHTML = `
    <option value="">Select Quarter</option>
  `;

  document.getElementById("kpiSetMonth").value = "";

  clearKPISetRows();

  document.getElementById("saveKPISetText").textContent = "Save KPI Set";

  updateKPISetSaveButton();
}

function resetKPISetForm() {
  editingKPISetId = null;

  document.getElementById("kpiSetFinancialYear").value = "";

  document.getElementById("kpiSetQuarter").innerHTML = `
    <option value="">Select Quarter</option>
  `;

  document.getElementById("kpiSetMonth").value = "";

  clearKPISetRows();

  document.getElementById("saveKPISetText").textContent = "Save KPI Set";

  document.getElementById("kpiSetConfigCard").classList.remove("show");

  updateKPISetSaveButton();
}

function clearKPISetRows() {
  document.getElementById("kpiSetRows").innerHTML = "";

  document.getElementById("kpiSetEntryArea").classList.remove("show");

  document.getElementById("kpiSetRowCount").textContent = "0 KPI";
}

/* =========================================================
   SAVE BUTTON
========================================================= */

function updateKPISetSaveButton() {
  const button = document.getElementById("saveKPISetBtn");

  const year = document.getElementById("kpiSetFinancialYear").value;

  const quarter = document.getElementById("kpiSetQuarter").value;

  const rows = document.querySelectorAll("#kpiSetRows .kpi-set-row");

  button.disabled =
    !selectedKPIEntryRecordId || !year || !quarter || !rows.length;
}

/* =========================================================
   MONTH PROTECTION
========================================================= */

function disableKPISetMonthEditing() {
  const month = document.getElementById("kpiSetMonth");

  if (!month) {
    return;
  }

  month.readOnly = true;

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

      month.value = month.dataset.lockedValue || "";

      return false;
    });
  });

  month.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  month.addEventListener("mousedown", function () {
    month.blur();
  });

  /*
    Keep the field readonly even if browser inspection is used
    to remove the readonly attribute.
  */

  const observer = new MutationObserver(function () {
    if (!month.hasAttribute("readonly")) {
      month.setAttribute("readonly", "readonly");
    }

    month.setAttribute("tabindex", "-1");

    month.setAttribute("aria-readonly", "true");
  });

  observer.observe(month, {
    attributes: true,
    attributeFilter: ["readonly", "tabindex", "aria-readonly"],
  });
}

/* =========================================================
   KPI NAME PROTECTION
========================================================= */

function protectKPISetName(row) {
  const nameElement = row.querySelector(".kpi-name-text");

  if (!nameElement) {
    return;
  }

  nameElement.setAttribute("contenteditable", "false");

  nameElement.setAttribute("spellcheck", "false");

  nameElement.addEventListener("keydown", function (event) {
    event.preventDefault();
  });

  nameElement.addEventListener("beforeinput", function (event) {
    event.preventDefault();
  });

  nameElement.addEventListener("paste", function (event) {
    event.preventDefault();
  });

  /*
    Keep KPI name tied to KPI Entry data if the DOM is altered.
  */

  const entryRecord = getStoredKPIEntryRecords().find(function (record) {
    return String(record.id) === String(selectedKPIEntryRecordId);
  });

  if (!entryRecord || !Array.isArray(entryRecord.kpis)) {
    return;
  }

  const rowSourceKPIId = row.dataset.sourceKpiId;

  const sourceKPI = entryRecord.kpis.find(function (kpi) {
    return String(kpi.id || "") === String(rowSourceKPIId || "");
  });

  if (!sourceKPI) {
    return;
  }

  const expectedName = String(sourceKPI.kpiName || "");

  const observer = new MutationObserver(function () {
    if (nameElement.textContent !== expectedName) {
      nameElement.textContent = expectedName;
    }
  });

  observer.observe(nameElement, {
    childList: true,
    characterData: true,
    subtree: true,
  });
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

function buildMonthFromQuarter(quarter) {
  const months = {
    Q1: "January-March",
    Q2: "April-June",
    Q3: "July-September",
    Q4: "October-December",
  };

  return months[normalizeQuarter(quarter)] || "";
}

/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeKPISetHtml(value) {
  const div = document.createElement("div");

  div.textContent = String(value ?? "");

  return div.innerHTML;
}

function escapeKPISetAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* =========================================================
   TOAST
========================================================= */

function showKPISetToast(message, type = "success") {
  const toast = document.getElementById("kpiSetToast");

  const messageElement = document.getElementById("kpiSetToastMessage");

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
  }, 3200);
}
