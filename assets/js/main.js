document.addEventListener("DOMContentLoaded", function () {
  loadComponent("leftMenu");
  loadComponent("topMenu");
  loadComponent("footer");

  setCurrentDate();

  initializeCharts();
});

const isInsidePages = window.location.pathname.includes("/pages/");

const pagePath = isInsidePages ? "" : "pages/";

/*
|--------------------------------------------------------------------------
| HTML Components
|--------------------------------------------------------------------------
*/

const components = {
  leftMenu: `

  <div class="sidebar-inner">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="logo-icon">
        <i class="fa-solid fa-chart-line"></i>
      </div>

      <div class="logo-text">
        <strong>KPI</strong>
        <span>Management System</span>
      </div>
    </div>

  <!-- HR Segment -->
  <div class="menu-section">
    <div class="menu-section-title">
      <span>HR Segment</span>
    </div>

    <a href="${pagePath}parameter-entry.html" class="menu-item has-submenu">
      <span class="menu-icon">
        <i class="fa-solid fa-sliders"></i>
      </span>

      <span class="menu-text"> Parameter Entry </span>

      <span class="submenu-arrow">
        <i class="fa-solid fa-chevron-down"></i>
      </span>
    </a>

    <div class="submenu">
      <a href="${pagePath}periodSetup.html" class="submenu-item">
        <i class="fa-regular fa-calendar"></i>
        <span>1. Period Setup</span>
      </a>

      <a href="${pagePath}uomSetup.html" class="submenu-item">
        <i class="fa-solid fa-ruler"></i>
        <span>2. UOM Setup</span>
      </a>

      <a href="${pagePath}kpiEntry.html" class="submenu-item">
        <i class="fa-solid fa-sliders"></i>
        <span>3. KPI Entry</span>
      </a>
    </div>

   <a href="${pagePath}kpiValidation.html" class="menu-item">
      <span class="menu-icon">
        <i class="fa-solid fa-square-check"></i>
      </span>

      <span class="menu-text">5. KPI Validation </span>
    </a>

    <a href="${pagePath}achievementValidation.html" class="menu-item">
      <span class="menu-icon">
        <i class="fa-solid fa-clipboard-check"></i>
      </span>

      <span class="menu-text"> Achievement Validation </span>
    </a>
  </div>

  <!-- User Segment -->
  <div class="menu-section">
    <div class="menu-section-title">
      <span>User Segment</span>
    </div>

    <a href="${pagePath}kpiSet.html" class="menu-item">
      <span class="menu-icon">
        <i class="fa-solid fa-bullseye"></i>
      </span>

      <span class="menu-text">4. KPI Set </span>
    </a>

    <a href="${pagePath}achievementEntry.html" class="menu-item">
      <span class="menu-icon">
        <i class="fa-solid fa-chart-column"></i>
      </span>

      <span class="menu-text">Achievement Entry </span>
    </a>
  </div>

  <!-- Sidebar Bottom -->
  <div class="sidebar-bottom">
    <a href="#" class="menu-item">
      <span class="menu-icon">
        <i class="fa-solid fa-gear"></i>
      </span>

      <span class="menu-text"> Settings </span>
    </a>
  </div>
</div>

<!-- Fixed Sidebar Toggle -->
<button id="sidebarToggle" class="sidebar-toggle">
  <i class="fa-solid fa-chevron-left"></i>
</button>

  `,

  topMenu: `
    <div class="topbar-inner">
  <div class="topbar-left">
    <!-- Mobile Menu Button -->
    <button class="mobile-menu-btn" id="mobileMenuBtn">
      <i class="fa-solid fa-bars"></i>
    </button>

    <div class="breadcrumb">
      <span>Home</span>
      <i class="fa-solid fa-chevron-right"></i>
      <strong>Dashboard</strong>
    </div>
  </div>

  <div class="topbar-right">
    <!-- Search -->
    <div class="top-search">
      <i class="fa-solid fa-magnifying-glass"></i>

      <input type="text" placeholder="Search..." id="globalSearch" />
    </div>

    <!-- Notification -->
    <button class="topbar-icon notification-btn">
      <i class="fa-regular fa-bell"></i>

      <span class="notification-badge">3</span>
    </button>

    <!-- User -->
    <div class="user-profile">
      <div class="user-avatar">TA</div>

      <div class="user-info">
        <strong>Tahsin Faruque</strong>
        <span>Prototype</span>
      </div>

      <i class="fa-solid fa-chevron-down user-arrow"></i>
    </div>
  </div>
</div>

  `,

  footer: `
  <div class="footer-inner">

    <div class="footer-left">
      <span>
        © <span id="footerYear"></span> KPI Management System
      </span>
    </div>

    <div class="footer-right">

      <span class="footer-separator">|</span>

      <span>Prototype by</span>

      <strong>MIS, MASCO Group</strong>

      <span class="footer-separator">|</span>

         <!-- Versions Dropdown -->
      <div class="footer-dropdown">

        <button type="button" class="footer-dropdown-btn">

          <span>Versions</span>
          <i class="fa-solid fa-chevron-down footer-dropdown-arrow"></i>
        </button>

        <div class="footer-dropdown-menu">
          <a href="https://mr-tahsin.github.io/oldkpi-1" class="footer-version-link" target="_blank">v1 (18<sup>th</sup> Aug, 2026)</a>
          <a href="https://mr-tahsin.github.io/oldkpi-2" class="footer-version-link" target="_blank">v2 (07<sup>th</sup> Sep, 2026</a>
          <a href="#" class="footer-version-link">v3 (Current)</a>
        </div>

      </div>

    </div>

  </div>
`,
};

/*
|--------------------------------------------------------------------------
| Footer Version Dropdown
|--------------------------------------------------------------------------
*/

function initializeFooterDropdown() {
  const dropdown = document.querySelector(".footer-dropdown");

  if (!dropdown) {
    return;
  }

  const button = dropdown.querySelector(".footer-dropdown-btn");
  const menu = dropdown.querySelector(".footer-dropdown-menu");

  if (!button || !menu) {
    return;
  }

  if (button.dataset.initialized === "true") {
    return;
  }

  button.dataset.initialized = "true";

  button.addEventListener("click", function (event) {
    event.stopPropagation();

    menu.classList.toggle("show");
  });

  menu.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  document.addEventListener("click", function () {
    menu.classList.remove("show");
  });
}

/*
|--------------------------------------------------------------------------
| Load Components
|--------------------------------------------------------------------------
*/

function loadComponent(elementId) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  if (!components[elementId]) {
    console.error("Component not found:", elementId);
    return;
  }

  element.innerHTML = components[elementId];

  initializeComponents();
}

/*
|--------------------------------------------------------------------------
| Initialize Components
|--------------------------------------------------------------------------
*/

function initializeComponents() {
  initializeSidebar();
  initializeMobileMenu();
  initializeActiveMenu();
  initializeFooterYear();
  initializeFooterDropdown();
}

/*
|--------------------------------------------------------------------------
| Sidebar
|--------------------------------------------------------------------------
*/

function initializeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebarToggle");

  if (!sidebar || !toggle) {
    return;
  }

  if (toggle.dataset.initialized !== "true") {
    toggle.dataset.initialized = "true";

    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");

      const icon = toggle.querySelector("i");

      if (!icon) {
        return;
      }

      if (sidebar.classList.contains("collapsed")) {
        icon.classList.remove("fa-chevron-left");
        icon.classList.add("fa-chevron-right");
      } else {
        icon.classList.remove("fa-chevron-right");
        icon.classList.add("fa-chevron-left");
      }
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Parameter Entry Dropdown
  |--------------------------------------------------------------------------
  */

  const submenuButtons = document.querySelectorAll(".has-submenu");

  submenuButtons.forEach(function (button) {
    if (button.dataset.submenuInitialized === "true") {
      return;
    }

    button.dataset.submenuInitialized = "true";

    button.addEventListener("click", function (event) {
      event.preventDefault();

      const submenu = button.nextElementSibling;

      if (!submenu || !submenu.classList.contains("submenu")) {
        return;
      }

      const isOpen = submenu.classList.contains("show");

      /*
      | Close all other submenus
      */

      document.querySelectorAll(".submenu.show").forEach(function (item) {
        item.classList.remove("show");
      });

      document.querySelectorAll(".has-submenu.open").forEach(function (item) {
        item.classList.remove("open");
      });

      /*
      | Open selected submenu
      */

      if (!isOpen) {
        submenu.classList.add("show");

        button.classList.add("open");
      }
    });
  });
}
/*
|--------------------------------------------------------------------------
| Mobile Menu
|--------------------------------------------------------------------------
*/

function initializeMobileMenu() {
  const sidebar = document.getElementById("sidebar");
  const mobileButton = document.getElementById("mobileMenuBtn");

  if (!sidebar || !mobileButton) {
    return;
  }

  /*
  |----------------------------------------------------------------------
  | Create Mobile Overlay
  |----------------------------------------------------------------------
  */

  let overlay = document.getElementById("mobileMenuOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "mobileMenuOverlay";
    overlay.className = "mobile-menu-overlay";

    document.body.appendChild(overlay);
  }

  /*
  |----------------------------------------------------------------------
  | Prevent duplicate event listeners
  |----------------------------------------------------------------------
  */

  if (mobileButton.dataset.initialized === "true") {
    return;
  }

  mobileButton.dataset.initialized = "true";

  /*
  |----------------------------------------------------------------------
  | Open / Close Menu
  |----------------------------------------------------------------------
  */

  function toggleMobileMenu() {
    sidebar.classList.toggle("mobile-open");
    overlay.classList.toggle("show");
  }

  function closeMobileMenu() {
    sidebar.classList.remove("mobile-open");
    overlay.classList.remove("show");
  }

  /*
  |----------------------------------------------------------------------
  | Hamburger Button
  |----------------------------------------------------------------------
  */

  mobileButton.addEventListener("click", function (event) {
    event.stopPropagation();

    toggleMobileMenu();
  });

  /*
  |----------------------------------------------------------------------
  | Click Outside Sidebar
  |----------------------------------------------------------------------
  */

  overlay.addEventListener("click", function () {
    closeMobileMenu();
  });

  /*
  |----------------------------------------------------------------------
  | Close Menu When Menu Item Is Clicked
  |----------------------------------------------------------------------
  */

  sidebar.addEventListener("click", function (event) {
    const menuLink = event.target.closest("a");

    if (menuLink && !menuLink.classList.contains("has-submenu")) {
      closeMobileMenu();
    }
  });
}

/*
|--------------------------------------------------------------------------
| Active Menu
|--------------------------------------------------------------------------
*/

function initializeActiveMenu() {
  const currentPage = window.location.pathname.split("/").pop();

  const menuItems = document.querySelectorAll(".menu-item, .submenu-item");

  menuItems.forEach(function (item) {
    const href = item.getAttribute("href");

    if (!href) {
      return;
    }

    const linkPage = href.split("/").pop();

    item.classList.remove("active");

    if (linkPage === currentPage) {
      item.classList.add("active");

      const parentSubmenu = item.closest(".submenu");

      if (parentSubmenu) {
        parentSubmenu.classList.add("show");

        const parentMenu = parentSubmenu.previousElementSibling;

        if (parentMenu) {
          parentMenu.classList.add("active");
          parentMenu.classList.add("open");
        }
      }
    }
  });
}

/*
|--------------------------------------------------------------------------
| Footer Year
|--------------------------------------------------------------------------
*/

function initializeFooterYear() {
  const footerYear = document.getElementById("footerYear");

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }
}

/*
|--------------------------------------------------------------------------
| Footer Dropdowns
|--------------------------------------------------------------------------
*/

function initializeFooterDropdowns() {
  const dropdowns = document.querySelectorAll(".footer-dropdown");

  dropdowns.forEach(function (dropdown) {
    const button = dropdown.querySelector(".footer-dropdown-btn");
    const menu = dropdown.querySelector(".footer-dropdown-menu");

    if (!button || !menu) {
      return;
    }

    if (button.dataset.initialized === "true") {
      return;
    }

    button.dataset.initialized = "true";

    button.addEventListener("click", function (event) {
      event.stopPropagation();

      document
        .querySelectorAll(".footer-dropdown-menu.show")
        .forEach(function (item) {
          if (item !== menu) {
            item.classList.remove("show");
          }
        });

      menu.classList.toggle("show");
    });

    menu.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  });

  if (document.body.dataset.footerDropdownInitialized !== "true") {
    document.body.dataset.footerDropdownInitialized = "true";

    document.addEventListener("click", function () {
      document
        .querySelectorAll(".footer-dropdown-menu.show")
        .forEach(function (menu) {
          menu.classList.remove("show");
        });
    });
  }
}

/*
|--------------------------------------------------------------------------
| Current Date
|--------------------------------------------------------------------------
*/

function setCurrentDate() {
  const dateElement = document.getElementById("currentDate");

  if (!dateElement) {
    return;
  }

  const today = new Date();

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  dateElement.textContent = today.toLocaleDateString("en-US", options);
}

/*
|--------------------------------------------------------------------------
| Dashboard Charts
|--------------------------------------------------------------------------
*/

function initializeCharts() {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js is not loaded.");
    return;
  }

  initializeAchievementChart();
  initializeKPIStatusChart();
}

/*
|--------------------------------------------------------------------------
| Achievement Trend Chart
|--------------------------------------------------------------------------
*/

function initializeAchievementChart() {
  const achievementCanvas = document.getElementById("achievementChart");

  if (!achievementCanvas) {
    return;
  }

  if (achievementCanvas.dataset.initialized === "true") {
    return;
  }

  achievementCanvas.dataset.initialized = "true";

  new Chart(achievementCanvas, {
    type: "line",

    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],

      datasets: [
        {
          label: "Achievement",

          data: [62, 66, 64, 71, 69, 75, 77, 79],

          borderColor: "#30508F",

          backgroundColor: "rgba(48, 80, 143, 0.10)",

          borderWidth: 3,

          fill: true,

          tension: 0.4,

          pointRadius: 4,

          pointHoverRadius: 7,

          pointBackgroundColor: "#30508F",

          pointBorderColor: "#FFFFFF",

          pointBorderWidth: 2,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      interaction: {
        intersect: false,

        mode: "index",
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          backgroundColor: "#FFFFFF",

          titleColor: "#1E293B",

          bodyColor: "#64748B",

          borderColor: "#E2E8F0",

          borderWidth: 1,

          padding: 10,

          displayColors: false,

          callbacks: {
            label: function (context) {
              return `Achievement: ${context.raw}%`;
            },
          },
        },
      },

      scales: {
        y: {
          beginAtZero: true,

          max: 100,

          border: {
            display: false,
          },

          grid: {
            color: "#EEF2F7",
          },

          ticks: {
            color: "#64748B",

            font: {
              size: 10,
            },

            callback: function (value) {
              return value + "%";
            },
          },
        },

        x: {
          border: {
            display: false,
          },

          grid: {
            display: false,
          },

          ticks: {
            color: "#64748B",

            font: {
              size: 10,
            },
          },
        },
      },
    },
  });
}

/*
|--------------------------------------------------------------------------
| KPI Status Chart
|--------------------------------------------------------------------------
*/

function initializeKPIStatusChart() {
  const statusCanvas = document.getElementById("kpiStatusChart");

  if (!statusCanvas) {
    return;
  }

  if (statusCanvas.dataset.initialized === "true") {
    return;
  }

  statusCanvas.dataset.initialized = "true";

  new Chart(statusCanvas, {
    type: "doughnut",

    data: {
      labels: ["Completed", "Pending", "Validation"],

      datasets: [
        {
          data: [72, 18, 10],

          backgroundColor: ["#30508F", "#E7A93B", "#7C5CFC"],

          borderWidth: 0,

          hoverOffset: 5,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      cutout: "72%",

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          backgroundColor: "#FFFFFF",

          titleColor: "#1E293B",

          bodyColor: "#64748B",

          borderColor: "#E2E8F0",

          borderWidth: 1,

          padding: 10,

          callbacks: {
            label: function (context) {
              return ` ${context.label}: ${context.raw}%`;
            },
          },
        },
      },
    },
  });
}
