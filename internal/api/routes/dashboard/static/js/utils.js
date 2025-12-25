// Утилиты для работы с темой, localStorage, загрузкой и ошибками

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
}

// Инициализируем тему сразу для избежания мигания
initTheme();

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains("dark");

  if (isDark) {
    html.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}

function showLoading(show) {
  document.getElementById("loading").classList.toggle("hidden", !show);
}

function hideError() {
  document.getElementById("error").classList.add("hidden");
}

function showError(message) {
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("error").classList.remove("hidden");
  hideSuccess(); // Скрываем успешное сообщение при показе ошибки
}

function hideSuccess() {
  document.getElementById("success").classList.add("hidden");
}

function showSuccess(message) {
  document.getElementById("successMessage").textContent = message;
  document.getElementById("success").classList.remove("hidden");
  hideError(); // Скрываем ошибку при показе успешного сообщения
}

function hideResults() {
  document.getElementById("resultsContainer").classList.add("hidden");
}

function hideJsonDisplay() {
  document.getElementById("jsonContainer").classList.add("hidden");
}

function saveConnectionSettings() {
  const settings = {
    baseURL: document.getElementById("baseURL").value,
    user: document.getElementById("user").value,
    passwordHash: document.getElementById("passwordHash").value,
    reportType: document.getElementById("reportType").value,
  };
  localStorage.setItem("olapConnectionSettings", JSON.stringify(settings));
}

function loadConnectionSettings() {
  const saved = localStorage.getItem("olapConnectionSettings");
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      document.getElementById("baseURL").value = settings.baseURL || "";
      document.getElementById("user").value = settings.user || "";
      document.getElementById("passwordHash").value =
        settings.passwordHash || "";
      document.getElementById("reportType").value =
        settings.reportType || "SALES";
    } catch (e) {}
  }
}

function clearConnectionSettings() {
  if (
    confirm("Вы уверены что хотите очистить сохраненные данные подключения?")
  ) {
    localStorage.removeItem("olapConnectionSettings");
    document.getElementById("baseURL").value = "";
    document.getElementById("user").value = "";
    document.getElementById("passwordHash").value = "";
    document.getElementById("reportType").value = "SALES";
    window.availableFieldsByReportType = {
      SALES: null,
      TRANSACTIONS: null,
    };
    window.presets = null;
    window.selectedGroupByRowFields = [];
    window.selectedGroupByColFields = [];
    window.selectedAggregateFields = [];
    renderGroupByRowFields();
    renderGroupByColFields();
    renderAggregateFields();
    updatePresetsSelect();
  }
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const num = Number(value);
  if (isNaN(num)) {
    return value;
  }

  const parts = num.toString().split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}
