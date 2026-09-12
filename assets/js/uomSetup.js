document.addEventListener("DOMContentLoaded", function () {
  initializeUOMSetup();
});

/*
|--------------------------------------------------------------------------
| Storage
|--------------------------------------------------------------------------
*/

const UOM_STORAGE_KEY = "kpi_uom_setup";

let editingUOMId = null;

let deletingUOMId = null;

/*
|--------------------------------------------------------------------------
| Initialize
|--------------------------------------------------------------------------
*/

function initializeUOMSetup() {
  const form = document.getElementById("uomForm");

  if (!form) {
    return;
  }

  form.addEventListener("submit", handleUOMSubmit);

  const clearButton = document.getElementById("clearUomBtn");

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      if (editingUOMId) {
        resetUOMForm();
      }
    });
  }

  const cancelEditButton = document.getElementById("cancelEditBtn");

  if (cancelEditButton) {
    cancelEditButton.addEventListener("click", resetUOMForm);
  }

  const cancelDeleteButton = document.getElementById("cancelDeleteBtn");

  if (cancelDeleteButton) {
    cancelDeleteButton.addEventListener("click", closeDeleteModal);
  }

  const confirmDeleteButton = document.getElementById("confirmDeleteBtn");

  if (confirmDeleteButton) {
    confirmDeleteButton.addEventListener("click", confirmDelete);
  }

  const deleteModal = document.getElementById("deleteModal");

  if (deleteModal) {
    deleteModal.addEventListener("click", function (event) {
      if (event.target === deleteModal) {
        closeDeleteModal();
      }
    });
  }

  renderUOMList();
}

/*
|--------------------------------------------------------------------------
| Submit
|--------------------------------------------------------------------------
*/

function handleUOMSubmit(event) {
  event.preventDefault();

  const uomName = document.getElementById("uomName").value.trim();

  const rangeFromValue = document.getElementById("rangeFrom").value;

  const rangeToValue = document.getElementById("rangeTo").value;

  const isActive = document.getElementById("isActive").checked;

  if (!uomName) {
    showUOMToast("Please enter the UOM name.", "error");

    return;
  }

  if (rangeFromValue === "" || rangeToValue === "") {
    showUOMToast("Please enter both range values.", "error");

    return;
  }

  const rangeFrom = Number(rangeFromValue);

  const rangeTo = Number(rangeToValue);

  if (!Number.isFinite(rangeFrom) || !Number.isFinite(rangeTo)) {
    showUOMToast("Please enter valid range values.", "error");

    return;
  }

  if (rangeFrom >= rangeTo) {
    showUOMToast("Range From must be less than Range To.", "error");

    return;
  }

  const uoms = getStoredUOMs();

  /*
    |--------------------------------------------------------------------------
    | Edit
    |--------------------------------------------------------------------------
    */

  if (editingUOMId) {
    const index = uoms.findIndex(function (uom) {
      return uom.id === editingUOMId;
    });

    if (index === -1) {
      showUOMToast("UOM record could not be found.", "error");

      resetUOMForm();

      return;
    }

    /*
        | Duplicate name check
        */

    const duplicate = uoms.some(function (uom) {
      return (
        uom.id !== editingUOMId &&
        uom.uomName.toLowerCase() === uomName.toLowerCase()
      );
    });

    if (duplicate) {
      showUOMToast("This UOM name already exists.", "error");

      return;
    }

    uoms[index].uomName = uomName;

    uoms[index].rangeFrom = rangeFrom;

    uoms[index].rangeTo = rangeTo;

    uoms[index].isActive = isActive;

    uoms[index].updatedAt = new Date().toISOString();

    localStorage.setItem(UOM_STORAGE_KEY, JSON.stringify(uoms));

    renderUOMList();

    resetUOMForm();

    showUOMToast("UOM updated successfully.", "success");

    return;
  }

  /*
    |--------------------------------------------------------------------------
    | New Record
    |--------------------------------------------------------------------------
    */

  const duplicate = uoms.some(function (uom) {
    return uom.uomName.toLowerCase() === uomName.toLowerCase();
  });

  if (duplicate) {
    showUOMToast("This UOM name already exists.", "error");

    return;
  }

  const newUOM = {
    id: Date.now().toString(),

    uomName: uomName,

    rangeFrom: rangeFrom,

    rangeTo: rangeTo,

    isActive: isActive,

    savedAt: new Date().toISOString(),

    updatedAt: null,
  };

  /*
    |--------------------------------------------------------------------------
    | Descending Order
    |--------------------------------------------------------------------------
    */

  uoms.unshift(newUOM);

  localStorage.setItem(UOM_STORAGE_KEY, JSON.stringify(uoms));

  renderUOMList();

  document.getElementById("uomForm").reset();

  /*
    | Active is selected by default
    */

  document.getElementById("isActive").checked = true;

  showUOMToast("UOM saved successfully.", "success");
}

/*
|--------------------------------------------------------------------------
| Get Stored UOM
|--------------------------------------------------------------------------
*/

function getStoredUOMs() {
  try {
    const data = localStorage.getItem(UOM_STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read UOM data:", error);

    return [];
  }
}

/*
|--------------------------------------------------------------------------
| Render List
|--------------------------------------------------------------------------
*/

function renderUOMList() {
  const list = document.getElementById("uomList");

  const emptyState = document.getElementById("emptyUomState");

  const table = document.querySelector(".uom-table");

  const count = document.getElementById("uomCount");

  if (!list || !emptyState || !table) {
    return;
  }

  const uoms = getStoredUOMs();

  /*
    |--------------------------------------------------------------------------
    | Count
    |--------------------------------------------------------------------------
    */

  if (count) {
    count.textContent = uoms.length;
  }

  /*
    |--------------------------------------------------------------------------
    | Empty
    |--------------------------------------------------------------------------
    */

  if (uoms.length === 0) {
    list.innerHTML = "";

    table.style.display = "none";

    emptyState.style.display = "flex";

    return;
  }

  table.style.display = "table";

  emptyState.style.display = "none";

  /*
    |--------------------------------------------------------------------------
    | Rows
    |--------------------------------------------------------------------------
    */

  list.innerHTML = uoms
    .map(function (uom, index) {
      const statusClass = uom.isActive ? "active" : "inactive";

      const statusText = uom.isActive ? "Active" : "Inactive";

      return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>

                            <span class="uom-name">
                                ${escapeUOMHtml(uom.uomName)}
                            </span>

                        </td>


                        <td>

                            <span class="range-value">
                                ${formatNumber(uom.rangeFrom)}
                            </span>

                        </td>


                        <td>

                            <span class="range-value">
                                ${formatNumber(uom.rangeTo)}
                            </span>

                        </td>


                        <td>

                            <span class="status-badge ${statusClass}">

                                <span class="status-dot"></span>

                                ${statusText}

                            </span>

                        </td>


                        <td>

                            <span class="saved-date">
                                ${formatUOMDate(uom.updatedAt || uom.savedAt)}
                            </span>

                        </td>


                        <td>

                            <div class="action-buttons">


                                <button
                                    type="button"
                                    class="edit-uom-btn"
                                    title="Edit"
                                    data-id="${escapeUOMHtml(uom.id)}"
                                >

                                    <i class="fa-solid fa-pen"></i>

                                </button>


                                <button
                                    type="button"
                                    class="delete-uom-btn"
                                    title="Delete"
                                    data-id="${escapeUOMHtml(uom.id)}"
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
    | Edit Events
    |--------------------------------------------------------------------------
    */

  list.querySelectorAll(".edit-uom-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      startEditUOM(button.dataset.id);
    });
  });

  /*
    |--------------------------------------------------------------------------
    | Delete Events
    |--------------------------------------------------------------------------
    */

  list.querySelectorAll(".delete-uom-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      openDeleteModal(button.dataset.id);
    });
  });
}

/*
|--------------------------------------------------------------------------
| Edit UOM
|--------------------------------------------------------------------------
*/

function startEditUOM(id) {
  const uoms = getStoredUOMs();

  const uom = uoms.find(function (item) {
    return item.id === id;
  });

  if (!uom) {
    showUOMToast("UOM record not found.", "error");

    return;
  }

  editingUOMId = uom.id;

  document.getElementById("uomId").value = uom.id;

  document.getElementById("uomName").value = uom.uomName;

  document.getElementById("rangeFrom").value = uom.rangeFrom;

  document.getElementById("rangeTo").value = uom.rangeTo;

  document.getElementById("isActive").checked = !!uom.isActive;

  /*
    |--------------------------------------------------------------------------
    | UI
    |--------------------------------------------------------------------------
    */

  document.getElementById("uomFormTitle").textContent =
    "Update UOM Configuration";

  document.getElementById("uomFormDescription").textContent =
    "Update the selected unit of measurement";

  document.getElementById("saveUomText").textContent = "Update UOM";

  document.getElementById("editingIndicator").classList.add("show");

  document.getElementById("cancelEditBtn").style.display = "inline-flex";

  /*
    |--------------------------------------------------------------------------
    | Scroll To Form
    |--------------------------------------------------------------------------
    */

  document.querySelector(".uom-form-card").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  /*
    |--------------------------------------------------------------------------
    | Focus
    |--------------------------------------------------------------------------
    */

  setTimeout(function () {
    document.getElementById("uomName").focus();
  }, 350);
}

/*
|--------------------------------------------------------------------------
| Reset Form
|--------------------------------------------------------------------------
*/

function resetUOMForm() {
  editingUOMId = null;

  const form = document.getElementById("uomForm");

  if (form) {
    form.reset();
  }

  document.getElementById("uomId").value = "";

  /*
    | Active by default
    */

  document.getElementById("isActive").checked = true;

  /*
    |--------------------------------------------------------------------------
    | Restore UI
    |--------------------------------------------------------------------------
    */

  document.getElementById("uomFormTitle").textContent = "UOM Configuration";

  document.getElementById("uomFormDescription").textContent =
    "Add a new unit of measurement";

  document.getElementById("saveUomText").textContent = "Save UOM";

  document.getElementById("editingIndicator").classList.remove("show");

  document.getElementById("cancelEditBtn").style.display = "none";
}

/*
|--------------------------------------------------------------------------
| Delete Modal
|--------------------------------------------------------------------------
*/

function openDeleteModal(id) {
  const uoms = getStoredUOMs();

  const uom = uoms.find(function (item) {
    return item.id === id;
  });

  if (!uom) {
    return;
  }

  deletingUOMId = id;

  const text = document.getElementById("deleteModalText");

  if (text) {
    text.textContent = `Are you sure you want to delete "${uom.uomName}"? This action cannot be undone.`;
  }

  document.getElementById("deleteModal").classList.add("show");
}

/*
|--------------------------------------------------------------------------
| Close Delete Modal
|--------------------------------------------------------------------------
*/

function closeDeleteModal() {
  deletingUOMId = null;

  document.getElementById("deleteModal").classList.remove("show");
}

/*
|--------------------------------------------------------------------------
| Confirm Delete
|--------------------------------------------------------------------------
*/

function confirmDelete() {
  if (!deletingUOMId) {
    return;
  }

  const uoms = getStoredUOMs();

  const updatedUOMs = uoms.filter(function (uom) {
    return uom.id !== deletingUOMId;
  });

  localStorage.setItem(UOM_STORAGE_KEY, JSON.stringify(updatedUOMs));

  renderUOMList();

  closeDeleteModal();

  /*
    |--------------------------------------------------------------------------
    | If deleted record was being edited
    |--------------------------------------------------------------------------
    */

  if (editingUOMId === deletingUOMId) {
    resetUOMForm();
  }

  showUOMToast("UOM deleted successfully.", "success");
}

/*
|--------------------------------------------------------------------------
| Number Formatting
|--------------------------------------------------------------------------
*/

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-";
  }

  return number.toLocaleString("en-US", {
    maximumFractionDigits: 10,
  });
}

/*
|--------------------------------------------------------------------------
| Date Formatting
|--------------------------------------------------------------------------
*/

function formatUOMDate(dateString) {
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

function escapeUOMHtml(value) {
  const div = document.createElement("div");

  div.textContent = String(value ?? "");

  return div.innerHTML;
}

/*
|--------------------------------------------------------------------------
| Toast
|--------------------------------------------------------------------------
*/

function showUOMToast(message, type = "success") {
  const toast = document.getElementById("uomToast");

  const toastMessage = document.getElementById("uomToastMessage");

  const toastIcon = toast.querySelector(".toast-icon i");

  if (!toast || !toastMessage) {
    return;
  }

  toastMessage.textContent = message;

  if (type === "error") {
    toastIcon.className = "fa-solid fa-circle-exclamation";

    toast.querySelector(".toast-icon").style.background = "#FFF1F1";

    toast.querySelector(".toast-icon").style.color = "var(--danger)";
  } else {
    toastIcon.className = "fa-solid fa-circle-check";

    toast.querySelector(".toast-icon").style.background = "#E8F7F0";

    toast.querySelector(".toast-icon").style.color = "#16805A";
  }

  toast.classList.add("show");

  clearTimeout(toast._timer);

  toast._timer = setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}
