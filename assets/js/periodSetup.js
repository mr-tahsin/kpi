document.addEventListener("DOMContentLoaded", function () {
  initializePeriodSetup();
});

/*
|--------------------------------------------------------------------------
| Storage Key
|--------------------------------------------------------------------------
*/

const PERIOD_STORAGE_KEY = "kpi_period_setup";

/*
|--------------------------------------------------------------------------
| Initialize Period Setup
|--------------------------------------------------------------------------
*/

function initializePeriodSetup() {
  const form = document.getElementById("periodSetupForm");

  if (!form) {
    return;
  }

  form.addEventListener("submit", savePeriod);

  const clearButton = document.getElementById("clearPeriodBtn");

  if (clearButton) {
    clearButton.addEventListener("click", clearPeriodForm);
  }

  renderPeriodList();
}

/*
|--------------------------------------------------------------------------
| Save Period
|--------------------------------------------------------------------------
*/

function savePeriod(event) {
  event.preventDefault();

  const financialYear = document.getElementById("financialYear").value.trim();

  const fromMonth = document.getElementById("fromMonth").value;

  const toMonth = document.getElementById("toMonth").value;

  const quarterSet = document.getElementById("quarterSet").value;

  /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

  if (!financialYear || !fromMonth || !toMonth || !quarterSet) {
    showPeriodToast("Please complete all required fields.", "error");

    return;
  }

  /*
    |--------------------------------------------------------------------------
    | Month Validation
    |--------------------------------------------------------------------------
    */

  const monthOrder = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const fromIndex = monthOrder.indexOf(fromMonth);

  const toIndex = monthOrder.indexOf(toMonth);

  if (fromIndex === -1 || toIndex === -1) {
    showPeriodToast("Invalid month selected.", "error");

    return;
  }

  /*
|--------------------------------------------------------------------------
| Prevent Invalid Period
|--------------------------------------------------------------------------
*/

  if (fromIndex === toIndex) {
    showPeriodToast("From Month and To Month cannot be the same.", "error");

    return;
  }

  if (fromIndex > toIndex) {
    showPeriodToast("To Month cannot be earlier than From Month.", "error");

    return;
  }

  /*
    |--------------------------------------------------------------------------
    | Get Existing Data
    |--------------------------------------------------------------------------
    */

  const periods = getStoredPeriods();

  /*
/*
|--------------------------------------------------------------------------
| Prevent Duplicate Financial Year + Quarter + Month
|--------------------------------------------------------------------------
*/

  const duplicate = periods.some(function (period) {
    return (
      String(period.financialYear).trim().toLowerCase() ===
        financialYear.trim().toLowerCase() &&
      String(period.quarterSet).trim().toLowerCase() ===
        quarterSet.trim().toLowerCase() &&
      String(period.fromMonth).trim().toLowerCase() ===
        fromMonth.trim().toLowerCase() &&
      String(period.toMonth).trim().toLowerCase() ===
        toMonth.trim().toLowerCase()
    );
  });

  if (duplicate) {
    showPeriodToast(
      "This Financial Year, Quarter and Month already exists.",
      "error",
    );

    return;
  }

  /*
|--------------------------------------------------------------------------
| Prevent Same Financial Year + Same Month Range
| For Different Quarters
|--------------------------------------------------------------------------
*/

  const sameMonthRange = periods.some(function (period) {
    return (
      String(period.financialYear).trim().toLowerCase() ===
        financialYear.trim().toLowerCase() &&
      String(period.fromMonth).trim().toLowerCase() ===
        fromMonth.trim().toLowerCase() &&
      String(period.toMonth).trim().toLowerCase() ===
        toMonth.trim().toLowerCase()
    );
  });

  if (sameMonthRange) {
    showPeriodToast(
      `The month range ${fromMonth} to ${toMonth} is already assigned to this Financial Year.`,
      "error",
    );

    return;
  }

  /*
    |--------------------------------------------------------------------------
    | New Period Object
    |--------------------------------------------------------------------------
    */

  const newPeriod = {
    id: Date.now().toString(),

    financialYear: financialYear,

    fromMonth: fromMonth,

    toMonth: toMonth,

    quarterSet: quarterSet,

    savedAt: new Date().toISOString(),
  };

  /*
    |--------------------------------------------------------------------------
    | Add New Record
    |--------------------------------------------------------------------------
    */

  periods.unshift(newPeriod);

  /*
    |--------------------------------------------------------------------------
    | Save To Browser
    |--------------------------------------------------------------------------
    */

  localStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify(periods));

  /*
    |--------------------------------------------------------------------------
    | Refresh List
    |--------------------------------------------------------------------------
    */

  renderPeriodList();

  /*
    |--------------------------------------------------------------------------
    | Clear Form
    |--------------------------------------------------------------------------
    */

  document.getElementById("periodSetupForm").reset();

  /*
    |--------------------------------------------------------------------------
    | Success Message
    |--------------------------------------------------------------------------
    */

  showPeriodToast("Financial period saved successfully.", "success");
}

/*
|--------------------------------------------------------------------------
| Get Stored Periods
|--------------------------------------------------------------------------
*/

function getStoredPeriods() {
  try {
    const data = localStorage.getItem(PERIOD_STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error("Unable to read period data:", error);

    return [];
  }
}

/*
|--------------------------------------------------------------------------
| Render Period List
|--------------------------------------------------------------------------
*/

function renderPeriodList() {
  const list = document.getElementById("periodList");

  const emptyState = document.getElementById("emptyPeriodState");

  const table = document.querySelector(".period-table");

  const count = document.getElementById("periodCount");

  if (!list || !emptyState || !table) {
    return;
  }

  const periods = getStoredPeriods();

  /*
    |--------------------------------------------------------------------------
    | Count
    |--------------------------------------------------------------------------
    */

  if (count) {
    count.textContent = periods.length;
  }

  /*
    |--------------------------------------------------------------------------
    | Empty State
    |--------------------------------------------------------------------------
    */

  if (periods.length === 0) {
    list.innerHTML = "";

    table.style.display = "none";

    emptyState.style.display = "flex";

    return;
  }

  table.style.display = "table";

  emptyState.style.display = "none";

  /*
    |--------------------------------------------------------------------------
    | Render Rows
    |--------------------------------------------------------------------------
    */

  list.innerHTML = periods
    .map(function (period, index) {
      return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <span class="year-badge">
                                ${escapeHtml(period.financialYear)}
                            </span>
                        </td>

                          <td>
                            <span class="quarter-badge">
                                ${escapeHtml(period.quarterSet)}
                            </span>
                        </td>

                        <td>
                            ${escapeHtml(period.fromMonth)}
                        </td>

                        <td>
                            ${escapeHtml(period.toMonth)}
                        </td>

                        <td>
                            <span class="saved-date">
                                ${formatPeriodDate(period.savedAt)}
                            </span>
                        </td>

                        <td class="action-column">

                            <button
                                type="button"
                                class="delete-period-btn"
                                title="Delete"
                                data-id="${escapeHtml(period.id)}"
                            >

                                <i class="fa-solid fa-trash-can"></i>

                            </button>

                        </td>

                    </tr>
                `;
    })
    .join("");

  /*
    |--------------------------------------------------------------------------
    | Delete Events
    |--------------------------------------------------------------------------
    */

  list.querySelectorAll(".delete-period-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      const id = button.dataset.id;

      deletePeriod(id);
    });
  });
}

/*
|--------------------------------------------------------------------------
| Delete Period
|--------------------------------------------------------------------------
*/

function deletePeriod(id) {
  const periods = getStoredPeriods();

  const period = periods.find(function (item) {
    return item.id === id;
  });

  if (!period) {
    return;
  }

  const confirmed = window.confirm(
    `Delete financial year "${period.financialYear}"?`,
  );

  if (!confirmed) {
    return;
  }

  const updatedPeriods = periods.filter(function (item) {
    return item.id !== id;
  });

  localStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify(updatedPeriods));

  renderPeriodList();

  showPeriodToast("Financial period deleted successfully.", "success");
}

/*
|--------------------------------------------------------------------------
| Clear Form
|--------------------------------------------------------------------------
*/

function clearPeriodForm() {
  const form = document.getElementById("periodSetupForm");

  if (form) {
    form.reset();
  }
}

/*
|--------------------------------------------------------------------------
| Format Date
|--------------------------------------------------------------------------
*/

function formatPeriodDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/*
|--------------------------------------------------------------------------
| Escape HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
  const div = document.createElement("div");

  div.textContent = String(value ?? "");

  return div.innerHTML;
}

/*
|--------------------------------------------------------------------------
| Toast
|--------------------------------------------------------------------------
*/

function showPeriodToast(message, type = "success") {
  let toast = document.getElementById("periodToast");

  if (!toast) {
    toast = document.createElement("div");

    toast.id = "periodToast";

    toast.className = "period-toast";

    document.body.appendChild(toast);
  }

  const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";

  const iconClass = type === "success" ? "success" : "error";

  toast.innerHTML = `

        <div class="toast-icon ${iconClass}">

            <i class="fa-solid ${icon}"></i>

        </div>

        <span>
            ${escapeHtml(message)}
        </span>

    `;

  toast.classList.add("show");

  clearTimeout(toast._timer);

  toast._timer = setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}
