// Основная логика и инициализация

// Глобальные переменные
window.availableFieldsByReportType = {
  SALES: null,
  TRANSACTIONS: null,
};
window.filterCount = 0;
window.selectedGroupByFields = [];
window.selectedAggregateFields = [];
window.editingField = null;
window.autocompleteIndex = {
  groupBy: -1,
  aggregate: -1,
};
window.filterAutocompleteIndex = {};

// Создаем debounced версию функции загрузки полей
const debouncedCheckAndLoadFields = debounce(checkAndLoadFields, 500);

// Инициализация при загрузке DOM
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  document.getElementById("toDate").valueAsDate = today;
  document.getElementById("fromDate").valueAsDate = yesterday;

  // Group By Field Input
  document
    .getElementById("groupByFieldInput")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addGroupByField();
      }
    });

  document
    .getElementById("groupByFieldInput")
    .addEventListener("keydown", (e) => {
      handleAutocompleteNavigation(e, "groupBy");
    });

  document
    .getElementById("groupByFieldInput")
    .addEventListener("input", (e) => {
      handleAutocomplete(e.target.value, "groupBy");
    });

  // Aggregate Field Input
  document
    .getElementById("aggregateFieldInput")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addAggregateField();
      }
    });

  document
    .getElementById("aggregateFieldInput")
    .addEventListener("keydown", (e) => {
      handleAutocompleteNavigation(e, "aggregate");
    });

  document
    .getElementById("aggregateFieldInput")
    .addEventListener("input", (e) => {
      handleAutocomplete(e.target.value, "aggregate");
    });

  // Close autocomplete on click outside
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest("#groupByFieldInput") &&
      !e.target.closest("#groupByAutocomplete")
    ) {
      document.getElementById("groupByAutocomplete").classList.add("hidden");
      window.autocompleteIndex.groupBy = -1;
    }
    if (
      !e.target.closest("#aggregateFieldInput") &&
      !e.target.closest("#aggregateAutocomplete")
    ) {
      document.getElementById("aggregateAutocomplete").classList.add("hidden");
      window.autocompleteIndex.aggregate = -1;
    }
  });

  // Report Type change handler
  document.getElementById("reportType").addEventListener("change", () => {
    saveConnectionSettings();
    checkAndLoadFields();
  });

  // Connection settings change handlers with debounce
  document.getElementById("baseURL").addEventListener("input", () => {
    saveConnectionSettings();
    debouncedCheckAndLoadFields();
  });

  document.getElementById("user").addEventListener("input", () => {
    saveConnectionSettings();
    debouncedCheckAndLoadFields();
  });

  document.getElementById("passwordHash").addEventListener("input", () => {
    saveConnectionSettings();
    debouncedCheckAndLoadFields();
  });

  // Загружаем сохраненные настройки и автоматически проверяем поля
  loadConnectionSettings();
  checkAndLoadFields();
});
