// Выполнение и конструирование запросов

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

  const tableHeader = document.getElementById("tableHeader");
  const tableBody = document.getElementById("tableBody");

  tableHeader.innerHTML = "";
  tableBody.innerHTML = "";

  const firstRow = data[0];
  Object.keys(firstRow).forEach((key) => {
    const th = document.createElement("th");
    th.className =
      "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider";
    th.textContent = key;
    tableHeader.appendChild(th);
  });

  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.className =
      index % 2 === 0
        ? "bg-white dark:bg-gray-800"
        : "bg-gray-50 dark:bg-gray-700";

    Object.values(row).forEach((value) => {
      const td = document.createElement("td");
      td.className =
        "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100";
      td.textContent = formatNumber(value);
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });

  document.getElementById("resultsContainer").classList.remove("hidden");
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
