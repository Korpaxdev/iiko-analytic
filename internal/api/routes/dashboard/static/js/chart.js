// Построение графиков на основе OLAP-данных

let _chartInstance = null;
let _selectedYFields = [];
let _chartAutocompleteIndex = { x: -1, y: -1 };

const _chartColors = [
  "rgba(99, 102, 241, 0.8)", // indigo
  "rgba(234, 88, 12, 0.8)", // orange
  "rgba(16, 185, 129, 0.8)", // emerald
  "rgba(239, 68, 68, 0.8)", // red
  "rgba(59, 130, 246, 0.8)", // blue
  "rgba(168, 85, 247, 0.8)", // purple
  "rgba(245, 158, 11, 0.8)", // amber
  "rgba(20, 184, 166, 0.8)", // teal
  "rgba(236, 72, 153, 0.8)", // pink
  "rgba(34, 197, 94, 0.8)", // green
];

const _chartColorsBorder = _chartColors.map((c) => c.replace("0.8)", "1)"));

function _getChartColumns() {
  const data = window.currentTableData;
  if (!data || data.length === 0) return { all: [], numeric: [] };

  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  const reportType = document.getElementById("reportType").value;
  const availableFields = window.availableFieldsByReportType[reportType];

  const all = columns.map((key) => ({
    key,
    name: availableFields && availableFields[key] ? availableFields[key].name : key,
  }));

  // Определяем числовые колонки по данным
  const numeric = all.filter((col) => {
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const val = data[i][col.key];
      if (val !== null && val !== undefined && val !== "") {
        return !isNaN(parseFloat(val));
      }
    }
    return false;
  });

  return { all, numeric };
}

function _normalizeSearch(str) {
  return str.toLowerCase().replace(/[.\-_\s]/g, "");
}

function _showChartAutocomplete(inputId, dropdownId, columns, excludeKeys) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const query = input.value.trim();

  if (!query) {
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden");
    return;
  }

  const normalizedQuery = _normalizeSearch(query);
  const filtered = columns.filter((col) => {
    if (excludeKeys && excludeKeys.includes(col.key)) return false;
    const normalizedKey = _normalizeSearch(col.key);
    const normalizedName = _normalizeSearch(col.name);
    return normalizedKey.includes(normalizedQuery) || normalizedName.includes(normalizedQuery);
  });

  if (filtered.length === 0) {
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden");
    return;
  }

  const items = filtered.slice(0, 10);
  dropdown.innerHTML = "";

  items.forEach((col, idx) => {
    const div = document.createElement("div");
    div.className =
      "px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors";
    div.innerHTML = `
      <div class="font-medium text-gray-800 dark:text-gray-200 text-sm">${col.name}</div>
      <div class="text-xs text-gray-500 dark:text-gray-400">${col.key}</div>
    `;
    div.addEventListener("mousedown", (e) => {
      e.preventDefault();
      _selectChartField(inputId, dropdownId, col);
    });
    dropdown.appendChild(div);
  });

  dropdown.classList.remove("hidden");
}

function _selectChartField(inputId, dropdownId, col) {
  const dropdown = document.getElementById(dropdownId);
  dropdown.innerHTML = "";
  dropdown.classList.add("hidden");

  if (inputId === "chartXFieldInput") {
    const input = document.getElementById(inputId);
    input.value = col.name;
    input.dataset.key = col.key;
  } else if (inputId === "chartYFieldInput") {
    if (!_selectedYFields.find((f) => f.key === col.key)) {
      _selectedYFields.push(col);
      _renderYFieldTags();
    }
    document.getElementById(inputId).value = "";
  }

  _resetAutocompleteIndex(inputId === "chartXFieldInput" ? "x" : "y");
}

function _resetAutocompleteIndex(axis) {
  _chartAutocompleteIndex[axis] = -1;
}

function _renderYFieldTags() {
  const container = document.getElementById("chartYFieldsContainer");
  container.innerHTML = "";

  _selectedYFields.forEach((col, idx) => {
    const tag = document.createElement("span");
    tag.className =
      "inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded text-sm";
    tag.innerHTML = `
      <span>${col.name}</span>
      <button onclick="_removeYField(${idx})" class="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 font-bold">&times;</button>
    `;
    container.appendChild(tag);
  });
}

function _removeYField(idx) {
  _selectedYFields.splice(idx, 1);
  _renderYFieldTags();
}

function _handleChartKeydown(e, inputId, dropdownId, axis) {
  const dropdown = document.getElementById(dropdownId);
  const items = dropdown.querySelectorAll("div.px-4");

  if (e.key === "ArrowDown") {
    e.preventDefault();
    _chartAutocompleteIndex[axis] = Math.min(_chartAutocompleteIndex[axis] + 1, items.length - 1);
    _highlightChartItem(items, _chartAutocompleteIndex[axis]);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    _chartAutocompleteIndex[axis] = Math.max(_chartAutocompleteIndex[axis] - 1, 0);
    _highlightChartItem(items, _chartAutocompleteIndex[axis]);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (_chartAutocompleteIndex[axis] >= 0 && items[_chartAutocompleteIndex[axis]]) {
      items[_chartAutocompleteIndex[axis]].dispatchEvent(new Event("mousedown"));
    }
  } else if (e.key === "Escape") {
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden");
    _resetAutocompleteIndex(axis);
  }
}

function _highlightChartItem(items, idx) {
  items.forEach((item, i) => {
    if (i === idx) {
      item.classList.add("bg-gray-100", "dark:bg-gray-700");
    } else {
      item.classList.remove("bg-gray-100", "dark:bg-gray-700");
    }
  });
}

function openChartModal() {
  const data = window.currentTableData;
  if (!data || data.length === 0) return;

  const modal = document.getElementById("chartModal");
  modal.classList.remove("hidden");

  // Сброс состояния
  _selectedYFields = [];
  _renderYFieldTags();
  document.getElementById("chartXFieldInput").value = "";
  document.getElementById("chartXFieldInput").dataset.key = "";
  document.getElementById("chartYFieldInput").value = "";
  document.getElementById("chartType").value = "bar";
  document.getElementById("chartXAutocomplete").classList.add("hidden");
  document.getElementById("chartYAutocomplete").classList.add("hidden");
  document.getElementById("chartCanvasContainer").classList.add("hidden");
  document.getElementById("chartError").classList.add("hidden");

  if (_chartInstance) {
    _chartInstance.destroy();
    _chartInstance = null;
  }

  // Привязка событий автокомплита
  const { all, numeric } = _getChartColumns();

  const xInput = document.getElementById("chartXFieldInput");
  const yInput = document.getElementById("chartYFieldInput");

  // Очищаем старые обработчики через замену элемента
  const newXInput = xInput.cloneNode(true);
  xInput.parentNode.replaceChild(newXInput, xInput);
  const newYInput = yInput.cloneNode(true);
  yInput.parentNode.replaceChild(newYInput, yInput);

  newXInput.addEventListener("input", () => {
    _resetAutocompleteIndex("x");
    _showChartAutocomplete("chartXFieldInput", "chartXAutocomplete", all, []);
  });
  newXInput.addEventListener("keydown", (e) =>
    _handleChartKeydown(e, "chartXFieldInput", "chartXAutocomplete", "x")
  );
  newXInput.addEventListener("blur", () => {
    setTimeout(() => {
      document.getElementById("chartXAutocomplete").classList.add("hidden");
    }, 200);
  });

  newYInput.addEventListener("input", () => {
    _resetAutocompleteIndex("y");
    const excludeKeys = _selectedYFields.map((f) => f.key);
    _showChartAutocomplete("chartYFieldInput", "chartYAutocomplete", numeric, excludeKeys);
  });
  newYInput.addEventListener("keydown", (e) =>
    _handleChartKeydown(e, "chartYFieldInput", "chartYAutocomplete", "y")
  );
  newYInput.addEventListener("blur", () => {
    setTimeout(() => {
      document.getElementById("chartYAutocomplete").classList.add("hidden");
    }, 200);
  });

  newXInput.focus();
}

function closeChartModal() {
  document.getElementById("chartModal").classList.add("hidden");
}

function closeChartModalOnBackdrop(event) {
  if (event.target.id === "chartModal") closeChartModal();
}

function renderChart() {
  const xKey = document.getElementById("chartXFieldInput").dataset.key;
  const chartType = document.getElementById("chartType").value;
  const errorEl = document.getElementById("chartError");
  const errorMsg = document.getElementById("chartErrorMessage");

  errorEl.classList.add("hidden");

  if (!xKey) {
    errorMsg.textContent = "Выберите поле для оси X";
    errorEl.classList.remove("hidden");
    return;
  }

  if (_selectedYFields.length === 0) {
    errorMsg.textContent = "Выберите хотя бы одно поле для оси Y";
    errorEl.classList.remove("hidden");
    return;
  }

  if (chartType === "pie" && _selectedYFields.length > 1) {
    errorMsg.textContent = "Для круговой диаграммы выберите только одно поле Y";
    errorEl.classList.remove("hidden");
    return;
  }

  const data = window.currentTableData;
  const labels = data.map((row) => String(row[xKey] ?? ""));

  // Ограничение для больших датасетов
  const maxPoints = 100;
  let displayLabels = labels;
  let displayData = data;
  let truncated = false;

  if (labels.length > maxPoints) {
    displayLabels = labels.slice(0, maxPoints);
    displayData = data.slice(0, maxPoints);
    truncated = true;
  }

  const isDark = document.documentElement.classList.contains("dark");
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const textColor = isDark ? "#e5e7eb" : "#374151";

  let chartConfig;

  if (chartType === "pie") {
    const yKey = _selectedYFields[0].key;
    const values = displayData.map((row) => parseFloat(row[yKey]) || 0);
    const bgColors = displayLabels.map((_, i) => _chartColors[i % _chartColors.length]);
    const borderColors = displayLabels.map((_, i) => _chartColorsBorder[i % _chartColorsBorder.length]);

    chartConfig = {
      type: "pie",
      data: {
        labels: displayLabels,
        datasets: [
          {
            data: values,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { color: textColor, font: { size: 12 } } },
          title: {
            display: truncated,
            text: `Показаны первые ${maxPoints} из ${labels.length} записей`,
            color: "rgba(239,68,68,0.8)",
            font: { size: 12 },
          },
        },
      },
    };
  } else {
    const datasets = _selectedYFields.map((col, idx) => ({
      label: col.name,
      data: displayData.map((row) => parseFloat(row[col.key]) || 0),
      backgroundColor: _chartColors[idx % _chartColors.length],
      borderColor: _chartColorsBorder[idx % _chartColorsBorder.length],
      borderWidth: chartType === "line" ? 2 : 1,
      tension: chartType === "line" ? 0.3 : 0,
      fill: false,
    }));

    chartConfig = {
      type: chartType,
      data: { labels: displayLabels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: textColor, maxRotation: 45 }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } },
        },
        plugins: {
          legend: { labels: { color: textColor } },
          title: {
            display: truncated,
            text: `Показаны первые ${maxPoints} из ${labels.length} записей`,
            color: "rgba(239,68,68,0.8)",
            font: { size: 12 },
          },
        },
      },
    };
  }

  // Уничтожаем предыдущий график
  if (_chartInstance) {
    _chartInstance.destroy();
    _chartInstance = null;
  }

  // Пересоздаём canvas
  const container = document.getElementById("chartCanvasContainer");
  container.classList.remove("hidden");
  const oldCanvas = document.getElementById("chartCanvas");
  const newCanvas = document.createElement("canvas");
  newCanvas.id = "chartCanvas";
  oldCanvas.replaceWith(newCanvas);

  _chartInstance = new Chart(newCanvas, chartConfig);
}

// Закрытие по Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("chartModal");
    if (modal && !modal.classList.contains("hidden")) {
      closeChartModal();
    }
  }
});
