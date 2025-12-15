// Выполнение и конструирование запросов

// Глобальные переменные для сортировки и фильтрации
window.currentTableData = [];
window.originalTableData = []; // Исходные данные без фильтрации
window.currentSortColumn = null;
window.currentSortDirection = "asc"; // "asc" или "desc"
window.columnFilters = {}; // { columnKey: [selectedValues] }
window.openFilterDropdown = null; // Текущий открытый dropdown

async function executeQuery() {
  const baseURL = document.getElementById("baseURL").value;
  const user = document.getElementById("user").value;
  const passwordHash = document.getElementById("passwordHash").value;
  const reportType = document.getElementById("reportType").value;
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const groupByRowFields = window.selectedGroupByRowFields;
  const groupByColFields = window.selectedGroupByColFields;
  const aggregateFields = window.selectedAggregateFields;
  const filters = getFilters();

  if (!baseURL || !user || !passwordHash || !from || !to) {
    showError("Заполните все обязательные поля");
    return;
  }

  showLoading(true);
  hideError();
  hideResults();
  hideJsonDisplay();

  try {
    const response = await fetch("/olap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseURL,
        user,
        passwordHash,
        reportType,
        from,
        to,
        groupByRowFields,
        groupByColFields,
        aggregateFields,
        filters,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data, null, 2));
    }

    displayResults(data);
    showLoading(false);
  } catch (error) {
    showError(error.message);
    showLoading(false);
  }
}

function displayResults(data) {
  if (!data || data.length === 0) {
    showError("Нет данных для отображения");
    return;
  }

  // Сохраняем данные для сортировки и фильтрации
  window.originalTableData = data;
  window.currentTableData = data;
  window.currentSortColumn = null;
  window.currentSortDirection = "asc";
  window.columnFilters = {};

  updateRecordsCount();
  renderTable();
  document.getElementById("resultsContainer").classList.remove("hidden");
}

function renderTable() {
  const data = window.currentTableData;
  if (!data || data.length === 0) return;

  const tableHeader = document.getElementById("tableHeader");
  const tableBody = document.getElementById("tableBody");

  tableHeader.innerHTML = "";
  tableBody.innerHTML = "";

  // Получаем текущий тип отчета для доступа к полям
  const reportType = document.getElementById("reportType").value;
  const availableFields = window.availableFieldsByReportType[reportType];

  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  columns.forEach((key) => {
    const th = document.createElement("th");
    th.className =
      "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none";

    // Используем человеко-читаемое имя из fields, если доступно
    let displayName = key;
    let fieldType = null;
    if (availableFields && availableFields[key]) {
      displayName = availableFields[key].name || key;
      fieldType = availableFields[key].type;
    }

    // Определяем, можно ли фильтровать эту колонку (только STRING типы)
    const isFilterable = isColumnFilterable(key, fieldType);

    // Создаем контейнер для текста и иконок
    const container = document.createElement("div");
    container.className = "flex items-center gap-2";

    const leftSection = document.createElement("div");
    leftSection.className =
      "flex items-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300";
    leftSection.title = key; // Tooltip с техническим именем

    const text = document.createElement("span");
    text.textContent = displayName;
    leftSection.appendChild(text);

    // Добавляем иконку сортировки
    const sortIcon = document.createElement("span");
    sortIcon.className = "inline-block";
    sortIcon.innerHTML = getSortIcon(key);
    leftSection.appendChild(sortIcon);

    // Обработчик клика для сортировки
    leftSection.addEventListener("click", () => sortTable(key));

    container.appendChild(leftSection);

    // Добавляем иконку фильтра для строковых полей
    if (isFilterable) {
      const filterSection = document.createElement("div");
      filterSection.className = "relative";

      const filterButton = document.createElement("button");
      filterButton.className =
        "p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors";
      filterButton.innerHTML = getFilterIcon(key);
      filterButton.onclick = (e) => {
        e.stopPropagation();
        toggleFilterDropdown(key, filterButton);
      };

      filterSection.appendChild(filterButton);
      container.appendChild(filterSection);
    }

    th.appendChild(container);
    tableHeader.appendChild(th);
  });

  // Отрисовка строк
  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.className =
      index % 2 === 0
        ? "bg-white dark:bg-gray-800"
        : "bg-gray-50 dark:bg-gray-700";

    columns.forEach((key) => {
      const td = document.createElement("td");
      td.className =
        "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100";
      td.textContent = formatNumber(row[key]);
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });
}

function getSortIcon(columnKey) {
  if (window.currentSortColumn !== columnKey) {
    // Неактивная иконка (обе стрелки серые)
    return `
      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
    `;
  }

  if (window.currentSortDirection === "asc") {
    // Сортировка по возрастанию (стрелка вверх)
    return `
      <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
      </svg>
    `;
  } else {
    // Сортировка по убыванию (стрелка вниз)
    return `
      <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    `;
  }
}

function sortTable(columnKey) {
  // Если кликнули на ту же колонку - меняем направление
  if (window.currentSortColumn === columnKey) {
    window.currentSortDirection =
      window.currentSortDirection === "asc" ? "desc" : "asc";
  } else {
    // Новая колонка - сортируем по возрастанию
    window.currentSortColumn = columnKey;
    window.currentSortDirection = "asc";
  }

  // Сортируем данные
  window.currentTableData.sort((a, b) => {
    let aVal = a[columnKey];
    let bVal = b[columnKey];

    // Пытаемся преобразовать в числа для корректной сортировки
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      // Числовая сортировка
      return window.currentSortDirection === "asc" ? aNum - bNum : bNum - aNum;
    } else {
      // Строковая сортировка
      const aStr = String(aVal || "").toLowerCase();
      const bStr = String(bVal || "").toLowerCase();

      if (window.currentSortDirection === "asc") {
        return aStr.localeCompare(bStr, "ru");
      } else {
        return bStr.localeCompare(aStr, "ru");
      }
    }
  });

  // Перерисовываем таблицу
  renderTable();
}

function isColumnFilterable(columnKey, fieldType) {
  // Не фильтруем только NUMBER и DATE типы
  if (fieldType && (fieldType === "NUMBER" || fieldType === "DATE")) {
    return false;
  }

  // Проверяем значения в колонке
  const sampleValue = window.originalTableData[0]?.[columnKey];

  // Если значение null/undefined - разрешаем фильтрацию
  if (sampleValue === null || sampleValue === undefined) {
    return true;
  }

  const strValue = String(sampleValue);

  // Если похоже на число (все символы - цифры, точки и запятые)
  if (/^[\d.,\s]+$/.test(strValue.trim()) && !isNaN(parseFloat(strValue))) {
    return false;
  }

  // Исключаем даты в различных форматах
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // 2023-12-31
    /^\d{2}\/\d{2}\/\d{4}/, // 31/12/2023
    /^\d{2}\.\d{2}\.\d{4}/, // 31.12.2023
  ];

  if (datePatterns.some((pattern) => pattern.test(strValue))) {
    return false;
  }

  return true;
}

function getFilterIcon(columnKey) {
  // Фильтр активен только если есть выбранные значения
  // Если все значения выбраны, ключ удаляется из columnFilters
  const selectedFilters = window.columnFilters[columnKey];
  const hasActiveFilter = selectedFilters && selectedFilters.length > 0;

  if (hasActiveFilter) {
    return `
      <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/>
      </svg>
    `;
  }

  return `
    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
    </svg>
  `;
}

function toggleFilterDropdown(columnKey, buttonElement) {
  // Закрываем предыдущий dropdown, если открыт
  if (window.openFilterDropdown && window.openFilterDropdown !== columnKey) {
    closeFilterDropdown();
  }

  const existingDropdown = document.getElementById("filterDropdown");
  if (existingDropdown) {
    closeFilterDropdown();
    if (window.openFilterDropdown === columnKey) {
      window.openFilterDropdown = null;
      return;
    }
  }

  window.openFilterDropdown = columnKey;

  // Получаем уникальные значения для колонки (включая null)
  const uniqueValues = [
    ...new Set(
      window.originalTableData.map((row) => {
        const value = row[columnKey];
        return value === null || value === undefined || value === ""
          ? "__NULL__"
          : String(value);
      })
    ),
  ].sort((a, b) => a.localeCompare(b, "ru"));

  // Создаем dropdown
  const dropdown = document.createElement("div");
  dropdown.id = "filterDropdown";
  dropdown.className =
    "absolute z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-96 overflow-y-auto custom-scrollbar";
  dropdown.style.minWidth = "250px";

  // Заголовок с кнопками
  const header = document.createElement("div");
  header.className =
    "sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center gap-2";

  const titleContainer = document.createElement("div");
  titleContainer.className = "flex items-center gap-2";

  const title = document.createElement("span");
  title.className = "text-sm font-semibold text-gray-700 dark:text-gray-300";
  title.textContent = "Фильтр";

  const counter = document.createElement("span");
  counter.id = "filterCounter";
  counter.className =
    "text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded";

  titleContainer.appendChild(title);
  titleContainer.appendChild(counter);

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "flex gap-2";

  const selectAllBtn = document.createElement("button");
  selectAllBtn.className =
    "text-xs text-blue-600 dark:text-blue-400 hover:underline";
  selectAllBtn.textContent = "Все";
  selectAllBtn.onclick = () => selectAllFilters(columnKey, uniqueValues);

  const clearBtn = document.createElement("button");
  clearBtn.className = "text-xs text-red-600 dark:text-red-400 hover:underline";
  clearBtn.textContent = "Очистить";
  clearBtn.onclick = () => clearColumnFilter(columnKey);

  buttonGroup.appendChild(selectAllBtn);
  buttonGroup.appendChild(clearBtn);
  header.appendChild(titleContainer);
  header.appendChild(buttonGroup);
  dropdown.appendChild(header);

  // Функция обновления счётчика
  const updateCounter = () => {
    const checked = document.querySelectorAll(
      '#filterDropdown input[type="checkbox"]:checked'
    ).length;
    counter.textContent = `${checked} из ${uniqueValues.length}`;
  };
  updateCounter();

  // Поле поиска
  const searchContainer = document.createElement("div");
  searchContainer.className =
    "p-3 border-b border-gray-200 dark:border-gray-700";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Поиск...";
  searchInput.className =
    "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const labels = list.querySelectorAll("label");

    labels.forEach((label) => {
      const text = label.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        label.style.display = "flex";
      } else {
        label.style.display = "none";
      }
    });
  });

  searchContainer.appendChild(searchInput);
  dropdown.appendChild(searchContainer);

  // Список чекбоксов
  const list = document.createElement("div");
  list.className = "p-2";
  list.id = "filterList";

  const currentFilters = window.columnFilters[columnKey] || [];

  uniqueValues.forEach((value) => {
    const label = document.createElement("label");
    label.className =
      "flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded text-sm";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = value;
    // Если фильтр не применен (ключа нет) или выбраны все - отмечаем все чекбоксы
    checkbox.checked =
      !currentFilters ||
      currentFilters.length === 0 ||
      currentFilters.includes(value);
    checkbox.className =
      "rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500";
    checkbox.onchange = () => {
      updateColumnFilter(columnKey);
      updateCounter();
    };

    const text = document.createElement("span");
    text.className = "text-gray-700 dark:text-gray-300 break-all";
    text.textContent = value === "__NULL__" ? "(null)" : value;

    label.appendChild(checkbox);
    label.appendChild(text);
    list.appendChild(label);
  });

  dropdown.appendChild(list);

  // Кнопка "Применить"
  const footer = document.createElement("div");
  footer.className =
    "sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3";

  const applyBtn = document.createElement("button");
  applyBtn.className =
    "w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200 text-sm";
  applyBtn.textContent = "Применить";
  applyBtn.onclick = () => {
    applyFilters();
    closeFilterDropdown();
  };

  footer.appendChild(applyBtn);
  dropdown.appendChild(footer);

  // Позиционируем dropdown относительно таблицы
  const rect = buttonElement.getBoundingClientRect();
  const tableContainer = document.getElementById("resultsContainer");
  const tableRect = tableContainer.getBoundingClientRect();

  dropdown.style.position = "absolute";
  dropdown.style.top = `${rect.bottom - tableRect.top + 5}px`;
  dropdown.style.left = `${rect.left - tableRect.left}px`;

  tableContainer.appendChild(dropdown);

  // Автофокус на поле поиска
  setTimeout(() => {
    searchInput.focus();
  }, 100);

  // Закрываем dropdown при клике вне его
  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 0);
}

function handleOutsideClick(e) {
  const dropdown = document.getElementById("filterDropdown");
  if (dropdown && !dropdown.contains(e.target)) {
    closeFilterDropdown();
  }
}

function closeFilterDropdown() {
  const dropdown = document.getElementById("filterDropdown");
  if (dropdown) {
    dropdown.remove();
  }
  document.removeEventListener("click", handleOutsideClick);
  window.openFilterDropdown = null;
}

function selectAllFilters(columnKey, allValues) {
  const checkboxes = document.querySelectorAll(
    '#filterDropdown input[type="checkbox"]'
  );
  checkboxes.forEach((cb) => (cb.checked = true));

  // Обновляем фильтр
  updateColumnFilter(columnKey);

  // Обновляем счётчик
  const counter = document.getElementById("filterCounter");
  if (counter) {
    counter.textContent = `${checkboxes.length} из ${checkboxes.length}`;
  }
}

function clearColumnFilter(columnKey) {
  const checkboxes = document.querySelectorAll(
    '#filterDropdown input[type="checkbox"]'
  );
  checkboxes.forEach((cb) => (cb.checked = false));

  // Обновляем фильтр
  updateColumnFilter(columnKey);

  // Обновляем счётчик
  const counter = document.getElementById("filterCounter");
  if (counter) {
    const total = checkboxes.length;
    counter.textContent = `0 из ${total}`;
  }
}

function updateColumnFilter(columnKey) {
  const checkboxes = Array.from(
    document.querySelectorAll('#filterDropdown input[type="checkbox"]')
  );
  const selectedValues = checkboxes
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  // Если выбраны все значения - удаляем фильтр (как будто не применен)
  if (selectedValues.length === checkboxes.length) {
    delete window.columnFilters[columnKey];
  } else {
    window.columnFilters[columnKey] = selectedValues;
  }
}

function applyFilters() {
  // Начинаем с исходных данных
  let filteredData = [...window.originalTableData];

  // Применяем каждый фильтр (если все значения выбраны, ключ удален из columnFilters)
  Object.entries(window.columnFilters).forEach(
    ([columnKey, selectedValues]) => {
      if (selectedValues && selectedValues.length > 0) {
        filteredData = filteredData.filter((row) => {
          const value = row[columnKey];
          const normalizedValue =
            value === null || value === undefined || value === ""
              ? "__NULL__"
              : String(value);
          return selectedValues.includes(normalizedValue);
        });
      }
    }
  );

  window.currentTableData = filteredData;
  updateRecordsCount();
  renderTable();
}

function updateRecordsCount() {
  const recordsCountEl = document.getElementById("recordsCount");
  if (!recordsCountEl) return;

  const filtered = window.currentTableData.length;
  const total = window.originalTableData.length;

  // Проверяем, есть ли активные фильтры
  // Если все значения выбраны, ключ удален из columnFilters
  const hasActiveFilters = Object.keys(window.columnFilters).length > 0;

  // Показываем/скрываем кнопку сброса фильтров
  const clearBtn = document.getElementById("clearAllFiltersBtn");
  if (clearBtn) {
    if (hasActiveFilters && filtered !== total) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }

  if (filtered === total) {
    recordsCountEl.textContent = `(${total} записей)`;
    recordsCountEl.className =
      "text-sm text-gray-500 dark:text-gray-400 font-normal";
  } else {
    recordsCountEl.textContent = `(${filtered} из ${total} записей)`;
    recordsCountEl.className =
      "text-sm text-blue-600 dark:text-blue-400 font-semibold";
  }
}

function clearAllFilters() {
  window.columnFilters = {};
  window.currentTableData = [...window.originalTableData];
  updateRecordsCount();
  renderTable();
}

function exportToExcel() {
  if (!window.currentTableData || window.currentTableData.length === 0) {
    showError("Нет данных для экспорта");
    return;
  }

  try {
    // Получаем человеко-читаемые имена колонок
    const reportType = document.getElementById("reportType").value;
    const availableFields = window.availableFieldsByReportType[reportType];
    const firstRow = window.currentTableData[0];
    const columns = Object.keys(firstRow);

    // Создаем данные для экспорта с человеко-читаемыми заголовками
    const exportData = window.currentTableData.map((row) => {
      const newRow = {};
      columns.forEach((key) => {
        let displayName = key;
        if (
          availableFields &&
          availableFields[key] &&
          availableFields[key].name
        ) {
          displayName = availableFields[key].name;
        }
        newRow[displayName] = row[key];
      });
      return newRow;
    });

    // Создаем workbook и worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Автоматическая ширина колонок
    const colWidths = columns.map((key) => {
      let displayName = key;
      if (
        availableFields &&
        availableFields[key] &&
        availableFields[key].name
      ) {
        displayName = availableFields[key].name;
      }

      const maxLength = Math.max(
        displayName.length,
        ...window.currentTableData.map((row) => String(row[key] || "").length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Макс 50 символов
    });
    ws["!cols"] = colWidths;

    // Добавляем worksheet в workbook
    XLSX.utils.book_append_sheet(wb, ws, "Отчет");

    // Генерируем имя файла с датой и временем
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(":", "-");
    const filtered =
      window.currentTableData.length !== window.originalTableData.length
        ? "_отфильтровано"
        : "";
    const fileName = `iiko_аналитика_${reportType}_${dateStr}_${timeStr}${filtered}.xlsx`;

    // Сохраняем файл
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error("Export error:", error);
    showError("Ошибка при экспорте: " + error.message);
  }
}

async function constructQuery() {
  const baseURL = document.getElementById("baseURL").value;
  const user = document.getElementById("user").value;
  const passwordHash = document.getElementById("passwordHash").value;
  const reportType = document.getElementById("reportType").value;
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const groupByRowFields = window.selectedGroupByRowFields;
  const groupByColFields = window.selectedGroupByColFields;
  const aggregateFields = window.selectedAggregateFields;
  const filters = getFilters();

  if (!baseURL || !user || !passwordHash || !from || !to) {
    showError("Заполните все обязательные поля");
    return;
  }

  showLoading(true);
  hideError();
  hideJsonDisplay();
  hideResults();

  try {
    const response = await fetch("/olap-body", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseURL,
        user,
        passwordHash,
        reportType,
        from,
        to,
        groupByRowFields,
        groupByColFields,
        aggregateFields,
        filters,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data, null, 2));
    }

    displayJson(data);
    showLoading(false);
  } catch (error) {
    showError(error.message);
    showLoading(false);
  }
}
