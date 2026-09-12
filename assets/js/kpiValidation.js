/* =========================================================
   KPI VALIDATION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeKPIValidation();
});

/* =========================================================
   STORAGE
========================================================= */

const KPI_VALIDATION_STORAGE_KEY = "kpi_set_data";

const KPI_VALIDATION_UOM_STORAGE_KEY = "kpi_uom_setup";

let selectedValidationRecord = null;

let draggedValidationRowId = null;

/* =========================================================
   INITIALIZE
========================================================= */

function initializeKPIValidation() {
  bindKPIValidationEvents();

  loadValidationFilters();

  hideValidationResult();

  closeKPIValidationModal();
}

/* =========================================================
   EVENTS
========================================================= */

function bindKPIValidationEvents() {
  const financialYear = document.getElementById("kpiValidationFinancialYear");

  const quarter = document.getElementById("kpiValidationQuarter");

  const unit = document.getElementById("kpiValidationUnit");

  const department = document.getElementById("kpiValidationDepartment");

  const searchButton = document.getElementById("kpiValidationSearchBtn");

  const closeButton = document.getElementById("closeKPIValidationModal");

  const cancelButton = document.getElementById("cancelKPIValidationUpdate");

  const updateButton = document.getElementById("updateKPIValidationBtn");

  financialYear.addEventListener("change", handleValidationFinancialYearChange);

  quarter.addEventListener("change", handleValidationQuarterChange);

  unit.addEventListener("change", function () {
    loadValidationDepartments();
  });

  department.addEventListener("change", function () {
    updateValidationSearchButton();
  });

  searchButton.addEventListener("click", searchKPIValidation);

  closeButton.addEventListener("click", closeKPIValidationModal);

  cancelButton.addEventListener("click", closeKPIValidationModal);

  updateButton.addEventListener("click", updateKPIValidationRecord);

  document
    .getElementById("kpiValidationModal")
    .addEventListener("click", function (event) {
      if (event.target === this) {
        closeKPIValidationModal();
      }
    });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeKPIValidationModal();
    }
  });
}

/* =========================================================
   STORAGE HELPERS
========================================================= */

function getStoredKPIValidationRecords() {
  try {
    const data = localStorage.getItem(KPI_VALIDATION_STORAGE_KEY);

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

function getStoredValidationUOMs() {
  try {
    const data = localStorage.getItem(KPI_VALIDATION_UOM_STORAGE_KEY);

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
    console.error("Unable to read UOM data:", error);

    return [];
  }
}

/* =========================================================
   FILTERS
========================================================= */

function loadValidationFilters() {
  loadValidationFinancialYears();

  loadValidationQuarters();

  loadValidationUnits();

  loadValidationDepartments();

  updateValidationSearchButton();
}

function getUniqueValues(records, getter) {
  const values = [];

  records.forEach(function (record) {
    const value = getter(record);

    if (String(value ?? "").trim() === "") {
      return;
    }

    const normalized = String(value).trim();

    if (!values.includes(normalized)) {
      values.push(normalized);
    }
  });

  return values;
}

function loadValidationFinancialYears() {
  const select = document.getElementById("kpiValidationFinancialYear");

  const records = getStoredKPIValidationRecords();

  const currentValue = select.value;

  select.innerHTML = `
    <option value="">Select Financial Year</option>
  `;

  const years = getUniqueValues(records, function (record) {
    return record.financialYear;
  });

  years.sort(function (a, b) {
    return b.localeCompare(a, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  years.forEach(function (year) {
    const option = document.createElement("option");

    option.value = year;

    option.textContent = year;

    select.appendChild(option);
  });

  if (years.includes(currentValue)) {
    select.value = currentValue;
  }
}

function handleValidationFinancialYearChange() {
  loadValidationQuarters();

  loadValidationUnits();

  loadValidationDepartments();

  updateValidationSearchButton();
}

function loadValidationQuarters() {
  const select = document.getElementById("kpiValidationQuarter");

  const year = document.getElementById("kpiValidationFinancialYear").value;

  const records = getStoredKPIValidationRecords();

  const currentValue = select.value;

  select.innerHTML = `
    <option value="">Select Quarter</option>
  `;

  const filtered = records.filter(function (record) {
    return (
      !year || String(record.financialYear || "").trim() === String(year).trim()
    );
  });

  const quarters = getUniqueValues(filtered, function (record) {
    return record.quarter;
  });

  quarters.sort(function (a, b) {
    return quarterNumber(a) - quarterNumber(b);
  });

  quarters.forEach(function (quarter) {
    const option = document.createElement("option");

    option.value = quarter;

    option.textContent = quarter;

    select.appendChild(option);
  });

  if (quarters.includes(currentValue)) {
    select.value = currentValue;
  }
}

function handleValidationQuarterChange() {
  loadValidationUnits();

  loadValidationDepartments();

  updateValidationSearchButton();
}

function loadValidationUnits() {
  const select = document.getElementById("kpiValidationUnit");

  const year = document.getElementById("kpiValidationFinancialYear").value;

  const quarter = document.getElementById("kpiValidationQuarter").value;

  const records = getStoredKPIValidationRecords();

  const currentValue = select.value;

  select.innerHTML = `
    <option value="">Select Unit / SBU</option>
  `;

  const filtered = records.filter(function (record) {
    const sameYear =
      !year ||
      String(record.financialYear || "").trim() === String(year).trim();

    const sameQuarter =
      !quarter ||
      normalizeQuarter(record.quarter) === normalizeQuarter(quarter);

    return sameYear && sameQuarter;
  });

  const units = getUniqueValues(filtered, function (record) {
    return record.unit;
  });

  units.sort(function (a, b) {
    return a.localeCompare(b, undefined, {
      sensitivity: "base",
    });
  });

  units.forEach(function (unit) {
    const option = document.createElement("option");

    option.value = unit;

    option.textContent = unit;

    select.appendChild(option);
  });

  if (units.includes(currentValue)) {
    select.value = currentValue;
  }
}

function loadValidationDepartments() {
  const select = document.getElementById("kpiValidationDepartment");

  const year = document.getElementById("kpiValidationFinancialYear").value;

  const quarter = document.getElementById("kpiValidationQuarter").value;

  const unit = document.getElementById("kpiValidationUnit").value;

  const records = getStoredKPIValidationRecords();

  const currentValue = select.value;

  select.innerHTML = `
    <option value="">Select Department</option>
  `;

  const filtered = records.filter(function (record) {
    const sameYear =
      !year ||
      String(record.financialYear || "").trim() === String(year).trim();

    const sameQuarter =
      !quarter ||
      normalizeQuarter(record.quarter) === normalizeQuarter(quarter);

    const sameUnit =
      !unit || String(record.unit || "").trim() === String(unit).trim();

    return sameYear && sameQuarter && sameUnit;
  });

  const departments = getUniqueValues(filtered, function (record) {
    return record.department;
  });

  departments.sort(function (a, b) {
    return a.localeCompare(b, undefined, {
      sensitivity: "base",
    });
  });

  departments.forEach(function (department) {
    const option = document.createElement("option");

    option.value = department;

    option.textContent = department;

    select.appendChild(option);
  });

  if (departments.includes(currentValue)) {
    select.value = currentValue;
  }
}

function updateValidationSearchButton() {
  const button = document.getElementById("kpiValidationSearchBtn");

  const year = document.getElementById("kpiValidationFinancialYear").value;

  const quarter = document.getElementById("kpiValidationQuarter").value;

  const unit = document.getElementById("kpiValidationUnit").value;

  const department = document.getElementById("kpiValidationDepartment").value;

  button.disabled = !year || !quarter || !unit || !department;
}

/* =========================================================
   SEARCH
========================================================= */

function searchKPIValidation() {
  const year = document.getElementById("kpiValidationFinancialYear").value;

  const quarter = document.getElementById("kpiValidationQuarter").value;

  const unit = document.getElementById("kpiValidationUnit").value;

  const department = document.getElementById("kpiValidationDepartment").value;

  if (!year || !quarter || !unit || !department) {
    showKPIValidationToast(
      "Please select Financial Year, Quarter, Unit and Department.",
      "error",
    );

    return;
  }

  const records = getStoredKPIValidationRecords();

  const filtered = records.filter(function (record) {
    return (
      String(record.financialYear || "").trim() === String(year).trim() &&
      normalizeQuarter(record.quarter) === normalizeQuarter(quarter) &&
      String(record.unit || "").trim() === String(unit).trim() &&
      String(record.department || "").trim() === String(department).trim()
    );
  });

  renderValidationResults(filtered);

  document.getElementById("kpiValidationResultCard").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/* =========================================================
   RESULT
========================================================= */

function renderValidationResults(records) {
  const card = document.getElementById("kpiValidationResultCard");

  const tbody = document.getElementById("kpiValidationList");

  const emptyState = document.getElementById("emptyKPIValidation");

  const count = document.getElementById("kpiValidationRecordCount");

  card.classList.add("show");

  count.textContent = records.length;

  if (!records.length) {
    tbody.innerHTML = "";

    emptyState.classList.add("show");

    return;
  }

  emptyState.classList.remove("show");

  tbody.innerHTML = records
    .map(function (record, index) {
      return `
        <tr>
          <td>${index + 1}</td>

          <td>
            <span class="validation-search-number">
              ${escapeValidationHtml(record.searchNumber || "—")}
            </span>
          </td>

          <td>
            <span class="validation-fixed-value">
              Full Name
            </span>
          </td>

          <td>
            <span class="validation-section">
              ${escapeValidationHtml(record.section || "—")}
            </span>
          </td>

          <td>
            <span class="validation-fixed-value">
              Designation
            </span>
          </td>

          <td>
            <button
              type="button"
              class="kpi-details-btn"
              data-record-id="${escapeValidationAttribute(record.id)}"
            >
              <i class="fa-solid fa-list-check"></i>
              KPI Details
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".kpi-details-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      openKPIValidationModal(button.dataset.recordId);
    });
  });
}

/* =========================================================
   MODAL
========================================================= */

function openKPIValidationModal(recordId) {
  const records = getStoredKPIValidationRecords();

  const record = records.find(function (item) {
    return String(item.id) === String(recordId);
  });

  if (!record) {
    showKPIValidationToast("KPI Set record could not be found.", "error");

    return;
  }

  selectedValidationRecord = JSON.parse(JSON.stringify(record));

  document.getElementById("kpiValidationModalSearchNumber").textContent =
    record.searchNumber || "—";

  document.getElementById("modalFinancialYear").textContent =
    record.financialYear || "—";

  document.getElementById("modalQuarter").textContent = record.quarter || "—";

  document.getElementById("modalUnit").textContent = record.unit || "—";

  document.getElementById("modalDepartment").textContent =
    record.department || "—";

  document.getElementById("modalSection").textContent = record.section || "—";

  renderValidationModalRows();

  document.getElementById("kpiValidationModal").classList.add("show");
}

function closeKPIValidationModal() {
  selectedValidationRecord = null;

  document.getElementById("kpiValidationModal").classList.remove("show");

  document.getElementById("kpiValidationModalRows").innerHTML = "";
}

/* =========================================================
   MODAL ROWS
========================================================= */

function renderValidationModalRows() {
  const container = document.getElementById("kpiValidationModalRows");

  if (!selectedValidationRecord) {
    return;
  }

  if (!Array.isArray(selectedValidationRecord.rows)) {
    selectedValidationRecord.rows = [];
  }

  selectedValidationRecord.rows.forEach(function (row, index) {
    if (!row.id) {
      row.id = createValidationRowId();
    }

    row.priority = index + 1;
  });

  container.innerHTML = `
    <table class="kpi-validation-modal-table">
      <thead>
        <tr>
          <th></th>
          <th>SL</th>
          <th>KPI Name</th>
          <th>UOM</th>
          <th>Weight</th>
          <th>Target</th>
          <th>Priority</th>
          <th>Remarks</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody id="kpiValidationModalTableBody"></tbody>
    </table>
  `;

  const tbody = document.getElementById("kpiValidationModalTableBody");

  selectedValidationRecord.rows.forEach(function (row) {
    appendValidationModalRow(tbody, row);
  });

  updateValidationModalOrder();
}

function appendValidationModalRow(tbody, rowData = {}) {
  const rowId = rowData.id || createValidationRowId();

  const row = document.createElement("tr");

  row.className = "kpi-validation-row";

  row.dataset.rowId = rowId;

  row.draggable = true;

  row.innerHTML = `
    <td class="kpi-validation-drag-cell">
      <span
        class="kpi-validation-drag-handle"
        title="Drag to change priority"
      >
        <i class="fa-solid fa-grip-vertical"></i>
      </span>
    </td>

    <td class="validation-modal-sl">
      1
    </td>

    <td>
      <input
        type="text"
        class="kpi-validation-name-input"
        autocomplete="off"
        value="${escapeValidationAttribute(rowData.kpiName || "")}"
      />
    </td>

    <td>
      <select class="kpi-validation-uom-select">
        ${buildValidationUOMOptions(rowData.uom || "")}
      </select>
    </td>

    <td>
      <input
        type="number"
        class="kpi-validation-weight-input"
        min="0"
        step="any"
        inputmode="decimal"
        value="${escapeValidationAttribute(rowData.weight ?? "")}"
      />
    </td>

    <td>
      <input
        type="number"
        class="kpi-validation-target-input"
        step="any"
        inputmode="decimal"
        value="${escapeValidationAttribute(rowData.target ?? "")}"
      />
    </td>

    <td>
      <button
        type="button"
        class="kpi-validation-priority"
        tabindex="-1"
        title="Drag row to change priority"
      >
        1
      </button>
    </td>

    <td>
      <input
        type="text"
        class="kpi-validation-remarks-input"
        autocomplete="off"
        value="${escapeValidationAttribute(rowData.remarks || "")}"
      />
    </td>

    <td>
      <div class="kpi-validation-row-actions">
        <button
          type="button"
          class="kpi-validation-row-action kpi-validation-add-row-btn"
          title="Add KPI row below"
          aria-label="Add KPI row below"
        >
          <i class="fa-solid fa-plus"></i>
        </button>

        <button
          type="button"
          class="kpi-validation-row-action kpi-validation-delete-row-btn"
          title="Delete KPI row"
          aria-label="Delete KPI row"
        >
          <i class="fa-solid fa-minus"></i>
        </button>
      </div>
    </td>
  `;

  tbody.appendChild(row);

  bindValidationModalRowEvents(row);
}

function bindValidationModalRowEvents(row) {
  row
    .querySelector(".kpi-validation-add-row-btn")
    .addEventListener("click", function () {
      const tbody = row.parentElement;

      const newRowData = {
        id: createValidationRowId(),
        kpiName: "",
        uom: "",
        weight: "",
        target: "",
        priority: 1,
        remarks: "",
        isLoadedFromKPIEntry: false,
      };

      appendValidationModalRow(tbody, newRowData);

      syncValidationModalRows();

      updateValidationModalOrder();

      const rows = tbody.querySelectorAll(".kpi-validation-row");

      const lastRow = rows[rows.length - 1];

      const input = lastRow?.querySelector(".kpi-validation-name-input");

      if (input) {
        input.focus();
      }
    });

  row
    .querySelector(".kpi-validation-delete-row-btn")
    .addEventListener("click", function () {
      row.remove();

      syncValidationModalRows();

      updateValidationModalOrder();

      updateValidationModalWeight();
    });

  row.querySelectorAll("input, select").forEach(function (field) {
    field.addEventListener("input", function () {
      syncValidationModalRows();

      updateValidationModalWeight();
    });

    field.addEventListener("change", function () {
      syncValidationModalRows();

      updateValidationModalWeight();
    });
  });

  row.addEventListener("dragstart", handleValidationDragStart);

  row.addEventListener("dragover", handleValidationDragOver);

  row.addEventListener("dragleave", handleValidationDragLeave);

  row.addEventListener("drop", handleValidationDrop);

  row.addEventListener("dragend", handleValidationDragEnd);
}

/* =========================================================
   UOM
========================================================= */

function buildValidationUOMOptions(selectedValue) {
  const uoms = getStoredValidationUOMs();

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
        value="${escapeValidationAttribute(value)}"
        ${selected}
      >
        ${escapeValidationHtml(value)}
      </option>
    `;
  });

  if (
    selectedValue &&
    !uoms.some(function (uom) {
      return String(uom.uomName || "").trim() === String(selectedValue);
    })
  ) {
    options += `
      <option
        value="${escapeValidationAttribute(selectedValue)}"
        selected
      >
        ${escapeValidationHtml(selectedValue)}
      </option>
    `;
  }

  return options;
}

/* =========================================================
   SYNC MODAL ROWS
========================================================= */

function syncValidationModalRows() {
  if (!selectedValidationRecord) {
    return;
  }

  const rows = Array.from(
    document.querySelectorAll(
      "#kpiValidationModalTableBody .kpi-validation-row",
    ),
  );

  selectedValidationRecord.rows = rows.map(function (row, index) {
    return {
      id: row.dataset.rowId || createValidationRowId(),

      kpiName:
        row.querySelector(".kpi-validation-name-input")?.value.trim() || "",

      uom: row.querySelector(".kpi-validation-uom-select")?.value || "",

      weight: row.querySelector(".kpi-validation-weight-input")?.value ?? "",

      target: row.querySelector(".kpi-validation-target-input")?.value ?? "",

      priority: index + 1,

      remarks:
        row.querySelector(".kpi-validation-remarks-input")?.value.trim() || "",

      isLoadedFromKPIEntry: row.dataset.loadedFromEntry === "true",
    };
  });
}

/* =========================================================
   PRIORITY
========================================================= */

function updateValidationModalOrder() {
  const rows = Array.from(
    document.querySelectorAll(
      "#kpiValidationModalTableBody .kpi-validation-row",
    ),
  );

  rows.forEach(function (row, index) {
    const sl = row.querySelector(".validation-modal-sl");

    const priority = row.querySelector(".kpi-validation-priority");

    if (sl) {
      sl.textContent = index + 1;
    }

    if (priority) {
      priority.textContent = index + 1;
    }
  });

  syncValidationModalRows();

  updateValidationModalWeight();
}

/* =========================================================
   DRAG
========================================================= */

function handleValidationDragStart(event) {
  draggedValidationRowId = event.currentTarget.dataset.rowId;

  event.currentTarget.classList.add("dragging");

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData("text/plain", draggedValidationRowId);
  }
}

function handleValidationDragOver(event) {
  event.preventDefault();

  const target = event.currentTarget;

  if (target.dataset.rowId !== draggedValidationRowId) {
    target.classList.add("drag-over");
  }

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function handleValidationDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function handleValidationDrop(event) {
  event.preventDefault();

  const target = event.currentTarget;

  target.classList.remove("drag-over");

  const container = document.getElementById("kpiValidationModalTableBody");

  const dragged = Array.from(
    container.querySelectorAll(".kpi-validation-row"),
  ).find(function (row) {
    return row.dataset.rowId === draggedValidationRowId;
  });

  if (!dragged || dragged === target) {
    return;
  }

  const rows = Array.from(container.querySelectorAll(".kpi-validation-row"));

  const draggedIndex = rows.indexOf(dragged);

  const targetIndex = rows.indexOf(target);

  if (draggedIndex < targetIndex) {
    container.insertBefore(dragged, target.nextSibling);
  } else {
    container.insertBefore(dragged, target);
  }

  updateValidationModalOrder();
}

function handleValidationDragEnd(event) {
  event.currentTarget.classList.remove("dragging");

  document
    .querySelectorAll("#kpiValidationModalTableBody .kpi-validation-row")
    .forEach(function (row) {
      row.classList.remove("drag-over");
    });

  draggedValidationRowId = null;
}

/* =========================================================
   WEIGHT
========================================================= */

function updateValidationModalWeight() {
  if (!selectedValidationRecord) {
    return;
  }

  const rows = Array.from(
    document.querySelectorAll(
      "#kpiValidationModalTableBody .kpi-validation-row",
    ),
  );

  let total = 0;

  rows.forEach(function (row) {
    const value =
      row.querySelector(".kpi-validation-weight-input")?.value ?? "";

    if (value !== "" && Number.isFinite(Number(value))) {
      total += Number(value);
    }
  });

  const totalElement = document.getElementById("kpiValidationTotalWeight");

  totalElement.textContent = Number.isInteger(total) ? total : total.toFixed(2);
}

/* =========================================================
   VALIDATE
========================================================= */

function validateValidationRows(rows) {
  if (!rows.length) {
    showKPIValidationToast("At least one KPI row is required.", "error");

    return false;
  }

  let totalWeight = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.kpiName) {
      showKPIValidationToast(
        `KPI Name is missing for priority ${i + 1}.`,
        "error",
      );

      return false;
    }

    if (!row.uom) {
      showKPIValidationToast(
        `Please select UOM for "${row.kpiName}".`,
        "error",
      );

      return false;
    }

    if (
      row.weight === "" ||
      !Number.isFinite(Number(row.weight)) ||
      Number(row.weight) < 0
    ) {
      showKPIValidationToast(
        `Please enter a valid Weight for "${row.kpiName}".`,
        "error",
      );

      return false;
    }

    if (row.target === "" || !Number.isFinite(Number(row.target))) {
      showKPIValidationToast(
        `Please enter a valid Target for "${row.kpiName}".`,
        "error",
      );

      return false;
    }

    totalWeight += Number(row.weight);
  }

  if (totalWeight > 100) {
    showKPIValidationToast(
      `Total KPI weight cannot exceed 100. Current total: ${totalWeight}.`,
      "error",
    );

    return false;
  }

  return true;
}

/* =========================================================
   UPDATE
========================================================= */

function updateKPIValidationRecord() {
  if (!selectedValidationRecord) {
    return;
  }

  syncValidationModalRows();

  const rows = selectedValidationRecord.rows;

  if (!validateValidationRows(rows)) {
    return;
  }

  const records = getStoredKPIValidationRecords();

  const index = records.findIndex(function (record) {
    return String(record.id) === String(selectedValidationRecord.id);
  });

  if (index === -1) {
    showKPIValidationToast("KPI Set record could not be found.", "error");

    return;
  }

  records[index] = {
    ...records[index],
    rows: rows,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(KPI_VALIDATION_STORAGE_KEY, JSON.stringify(records));

  const year = document.getElementById("kpiValidationFinancialYear").value;

  const quarter = document.getElementById("kpiValidationQuarter").value;

  const unit = document.getElementById("kpiValidationUnit").value;

  const department = document.getElementById("kpiValidationDepartment").value;

  const filtered = records.filter(function (record) {
    return (
      String(record.financialYear || "").trim() === String(year).trim() &&
      normalizeQuarter(record.quarter) === normalizeQuarter(quarter) &&
      String(record.unit || "").trim() === String(unit).trim() &&
      String(record.department || "").trim() === String(department).trim()
    );
  });

  closeKPIValidationModal();

  renderValidationResults(filtered);

  showKPIValidationToast("KPI Validation updated successfully.", "success");
}

/* =========================================================
   HIDE RESULT
========================================================= */

function hideValidationResult() {
  const card = document.getElementById("kpiValidationResultCard");

  const emptyState = document.getElementById("emptyKPIValidation");

  if (card) {
    card.classList.remove("show");
  }

  if (emptyState) {
    emptyState.classList.remove("show");
  }
}

/* =========================================================
   HELPERS
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

function createValidationRowId() {
  return (
    "kpi-validation-row-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substring(2, 8)
  );
}

function escapeValidationHtml(value) {
  const div = document.createElement("div");

  div.textContent = String(value ?? "");

  return div.innerHTML;
}

function escapeValidationAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* =========================================================
   TOAST
========================================================= */

function showKPIValidationToast(message, type = "success") {
  const toast = document.getElementById("kpiValidationToast");

  const messageElement = document.getElementById("kpiValidationToastMessage");

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
