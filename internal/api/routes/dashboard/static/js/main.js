// Основная логика и инициализация

// Глобальные переменные
window.availableFieldsByReportType = {
  SALES: null,
  TRANSACTIONS: null,
};
window.presets = null; // Загруженные пресеты
window.presetsLoading = false; // Флаг загрузки пресетов
window.filterCount = 0;
window.selectedGroupByRowFields = [];
window.selectedGroupByColFields = [];
window.selectedAggregateFields = [];
window.editingField = null;
window.autocompleteIndex = {
  groupByRow: -1,
  groupByCol: -1,
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

  // Group By Row Field Input
  document
    .getElementById("groupByRowFieldInput")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addGroupByRowField();
      }
    });

  document
    .getElementById("groupByRowFieldInput")
    .addEventListener("keydown", (e) => {
      handleAutocompleteNavigation(e, "groupByRow");
    });

  document
    .getElementById("groupByRowFieldInput")
    .addEventListener("input", (e) => {
      handleAutocomplete(e.target.value, "groupByRow");
    });

  // Group By Col Field Input
  document
    .getElementById("groupByColFieldInput")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addGroupByColField();
      }
    });

  document
    .getElementById("groupByColFieldInput")
    .addEventListener("keydown", (e) => {
      handleAutocompleteNavigation(e, "groupByCol");
    });

  document
    .getElementById("groupByColFieldInput")
    .addEventListener("input", (e) => {
      handleAutocomplete(e.target.value, "groupByCol");
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
      !e.target.closest("#groupByRowFieldInput") &&
      !e.target.closest("#groupByRowAutocomplete")
    ) {
      document.getElementById("groupByRowAutocomplete").classList.add("hidden");
      window.autocompleteIndex.groupByRow = -1;
    }
    if (
      !e.target.closest("#groupByColFieldInput") &&
      !e.target.closest("#groupByColAutocomplete")
    ) {
      document.getElementById("groupByColAutocomplete").classList.add("hidden");
      window.autocompleteIndex.groupByCol = -1;
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
    updatePresetsSelect();
  });

  // Connection settings change handlers with debounce
  document.getElementById("baseURL").addEventListener("input", () => {
    saveConnectionSettings();
    debouncedCheckAndLoadFields();
    debouncedCheckAndLoadPresets();
  });

  document.getElementById("user").addEventListener("input", () => {
    saveConnectionSettings();
    debouncedCheckAndLoadFields();
    debouncedCheckAndLoadPresets();
  });

  document.getElementById("passwordHash").addEventListener("input", () => {
    saveConnectionSettings();
    debouncedCheckAndLoadFields();
    debouncedCheckAndLoadPresets();
  });

  // Загружаем сохраненные настройки и автоматически проверяем поля
  loadConnectionSettings();
  checkAndLoadFields();
  checkAndLoadPresets();
});

// Загрузка пресетов
async function loadPresets() {
  const baseURL = document.getElementById("baseURL").value;
  const user = document.getElementById("user").value;
  const passwordHash = document.getElementById("passwordHash").value;

  if (!baseURL || !user || !passwordHash) {
    return;
  }

  window.presetsLoading = true;
  updatePresetsSelect();

  try {
    const response = await fetch("/olap-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseURL, user, passwordHash }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load presets");
    }

    window.presets = data;
  } catch (error) {
    console.error("Failed to load presets:", error);
    window.presets = [];
  } finally {
    window.presetsLoading = false;
    updatePresetsSelect();
  }
}

function checkAndLoadPresets() {
  const baseURL = document.getElementById("baseURL").value;
  const user = document.getElementById("user").value;
  const passwordHash = document.getElementById("passwordHash").value;

  if (baseURL && user && passwordHash && window.presets === null) {
    loadPresets();
  }
}

// Создаем debounced версию функции загрузки пресетов
const debouncedCheckAndLoadPresets = debounce(checkAndLoadPresets, 500);

// Обновление select с пресетами
function updatePresetsSelect() {
  const container = document.getElementById("presetsSelectContainer");
  const select = document.getElementById("presetsSelect");

  if (window.presetsLoading) {
    // Показываем заблокированный select во время загрузки
    container.classList.remove("hidden");
    select.disabled = true;
    select.innerHTML = '<option value="">Загрузка пресетов...</option>';
    return;
  }

  if (!window.presets || window.presets.length === 0) {
    // Скрываем если пресеты не загружены или пустой список
    container.classList.add("hidden");
    return;
  }

  // Показываем и заполняем select
  container.classList.remove("hidden");
  select.disabled = false;

  const reportType = document.getElementById("reportType").value;
  const filteredPresets = window.presets.filter(
    (p) => p.reportType === reportType
  );

  select.innerHTML = '<option value="">-- Выберите пресет --</option>';
  filteredPresets.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.name;
    select.appendChild(option);
  });

  if (filteredPresets.length === 0) {
    select.innerHTML =
      '<option value="">Нет пресетов для данного типа отчета</option>';
    select.disabled = true;
  }
}

// Применение выбранного пресета
function applyPreset() {
  const presetId = document.getElementById("presetsSelect").value;
  if (!presetId) return;

  const preset = window.presets.find((p) => p.id === presetId);
  if (!preset) return;

  console.log("Applying preset:", preset);

  // 1. Устанавливаем reportType
  if (preset.reportType) {
    document.getElementById("reportType").value = preset.reportType;
  }

  // 2. Заполняем groupByRowFields
  window.selectedGroupByRowFields = preset.groupByRowFields || [];
  renderGroupByRowFields();

  // 3. Заполняем groupByColFields
  window.selectedGroupByColFields = preset.groupByColFields || [];
  renderGroupByColFields();

  // 4. Заполняем aggregateFields
  window.selectedAggregateFields = preset.aggregateFields || [];
  renderAggregateFields();

  // 5. Заполняем фильтры (только IncludeValues и ExcludeValues)
  clearAllFilters();
  if (preset.filters) {
    Object.entries(preset.filters).forEach(([fieldName, filter]) => {
      if (
        filter.filterType === "IncludeValues" ||
        filter.filterType === "ExcludeValues"
      ) {
        addFilterFromPreset(fieldName, filter.filterType, filter.values);
      }
    });
  }
}

// Очистить все фильтры
function clearAllFilters() {
  const filtersList = document.getElementById("filtersList");
  filtersList.innerHTML = "";
  window.filterAutocompleteIndex = {};
}

// Добавить фильтр из пресета
function addFilterFromPreset(fieldName, filterType, values) {
  const filtersList = document.getElementById("filtersList");
  const filterId = window.filterCount++;

  const filterDiv = document.createElement("div");
  filterDiv.className =
    "border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-700";
  filterDiv.id = "filter-" + filterId;
  filterDiv.innerHTML = `
    <div class="mb-2">
      <div class="relative mb-2">
        <input type="text" placeholder="Field name" id="filter-field-${filterId}" value="${fieldName}" class="filter-field w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" autocomplete="off">
        <div id="filter-autocomplete-${filterId}" class="custom-scrollbar hidden absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"></div>
      </div>
      <select class="filter-type w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <option value="IncludeValues" ${
          filterType === "IncludeValues" ? "selected" : ""
        }>Include Values</option>
        <option value="ExcludeValues" ${
          filterType === "ExcludeValues" ? "selected" : ""
        }>Exclude Values</option>
      </select>
      <input type="text" placeholder="Values (comma separated)" value="${values.join(
        ", "
      )}" class="filter-values w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <button onclick="removeFilter(${filterId})" class="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-2 rounded">
        Удалить
      </button>
    </div>
  `;

  filtersList.appendChild(filterDiv);

  // Добавляем обработчики для автокомплита (из filters.js)
  const filterInput = document.getElementById(`filter-field-${filterId}`);
  filterInput.addEventListener("input", (e) => {
    handleFilterAutocomplete(e.target.value, filterId);
  });
  filterInput.addEventListener("keydown", (e) => {
    handleFilterAutocompleteNavigation(e, filterId);
  });
}
