// Работа с полями (Group By и Aggregate)

function getCurrentFields() {
  const reportType = document.getElementById("reportType").value;
  return window.availableFieldsByReportType[reportType] || {};
}

function checkAndLoadFields() {
  const baseURL = document.getElementById("baseURL").value;
  const user = document.getElementById("user").value;
  const passwordHash = document.getElementById("passwordHash").value;
  const reportType = document.getElementById("reportType").value;

  // Загружаем поля только если все данные подключения заполнены и поля еще не загружены
  if (
    baseURL &&
    user &&
    passwordHash &&
    window.availableFieldsByReportType[reportType] === null
  ) {
    loadFields();
  }
}

async function loadFields() {
  const baseURL = document.getElementById("baseURL").value;
  const user = document.getElementById("user").value;
  const passwordHash = document.getElementById("passwordHash").value;
  const reportType = document.getElementById("reportType").value;

  if (!baseURL || !user || !passwordHash) {
    showError("Заполните все поля подключения");
    return;
  }

  showLoading(true);
  hideError();

  try {
    const response = await fetch("/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseURL, user, passwordHash, reportType }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load fields");
    }

    window.availableFieldsByReportType[reportType] = data;
    showLoading(false);
  } catch (error) {
    showError(error.message);
    showLoading(false);
  }
}

// Group By Row Fields
function addGroupByRowField() {
  const input = document.getElementById("groupByRowFieldInput");
  const value = input.value.trim();

  if (window.editingField) {
    const index = window.selectedGroupByRowFields.indexOf(window.editingField);
    if (index !== -1 && value) {
      window.selectedGroupByRowFields[index] = value;
    }
    window.editingField = null;
  } else if (value && !window.selectedGroupByRowFields.includes(value)) {
    window.selectedGroupByRowFields.push(value);
  }

  renderGroupByRowFields();
  input.value = "";
  document.getElementById("groupByRowAutocomplete").classList.add("hidden");
  window.autocompleteIndex.groupByRow = -1;
}

function removeGroupByRowField(field) {
  window.selectedGroupByRowFields = window.selectedGroupByRowFields.filter(
    (f) => f !== field
  );
  renderGroupByRowFields();
}

function editGroupByRowField(field) {
  window.editingField = field;
  document.getElementById("groupByRowFieldInput").value = field;
  document.getElementById("groupByRowFieldInput").focus();
}

function renderGroupByRowFields() {
  const container = document.getElementById("groupByRowFieldsContainer");
  container.innerHTML = "";
  const availableFields = getCurrentFields();

  window.selectedGroupByRowFields.forEach((field) => {
    const tag = document.createElement("span");
    tag.className =
      "inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm cursor-pointer hover:bg-blue-200";

    const fieldName = availableFields[field]?.name || field;
    const displayText = availableFields[field]
      ? `${fieldName} (${field})`
      : field;

    tag.innerHTML = `
      <span onclick="editGroupByRowField('${field.replace(/'/g, "\\'")}')">
        ${displayText}
      </span>
      <button onclick="event.stopPropagation(); removeGroupByRowField('${field.replace(
        /'/g,
        "\\'"
      )}');" class="hover:text-blue-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;
    container.appendChild(tag);
  });
}

// Group By Col Fields
function addGroupByColField() {
  const input = document.getElementById("groupByColFieldInput");
  const value = input.value.trim();

  if (window.editingField) {
    const index = window.selectedGroupByColFields.indexOf(window.editingField);
    if (index !== -1 && value) {
      window.selectedGroupByColFields[index] = value;
    }
    window.editingField = null;
  } else if (value && !window.selectedGroupByColFields.includes(value)) {
    window.selectedGroupByColFields.push(value);
  }

  renderGroupByColFields();
  input.value = "";
  document.getElementById("groupByColAutocomplete").classList.add("hidden");
  window.autocompleteIndex.groupByCol = -1;
}

function removeGroupByColField(field) {
  window.selectedGroupByColFields = window.selectedGroupByColFields.filter(
    (f) => f !== field
  );
  renderGroupByColFields();
}

function editGroupByColField(field) {
  window.editingField = field;
  document.getElementById("groupByColFieldInput").value = field;
  document.getElementById("groupByColFieldInput").focus();
}

function renderGroupByColFields() {
  const container = document.getElementById("groupByColFieldsContainer");
  container.innerHTML = "";
  const availableFields = getCurrentFields();

  window.selectedGroupByColFields.forEach((field) => {
    const tag = document.createElement("span");
    tag.className =
      "inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm cursor-pointer hover:bg-purple-200";

    const fieldName = availableFields[field]?.name || field;
    const displayText = availableFields[field]
      ? `${fieldName} (${field})`
      : field;

    tag.innerHTML = `
      <span onclick="editGroupByColField('${field.replace(/'/g, "\\'")}')">
        ${displayText}
      </span>
      <button onclick="event.stopPropagation(); removeGroupByColField('${field.replace(
        /'/g,
        "\\'"
      )}');" class="hover:text-purple-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;
    container.appendChild(tag);
  });
}

// Aggregate Fields
function addAggregateField() {
  const input = document.getElementById("aggregateFieldInput");
  const value = input.value.trim();

  if (window.editingField) {
    const index = window.selectedAggregateFields.indexOf(window.editingField);
    if (index !== -1 && value) {
      window.selectedAggregateFields[index] = value;
    }
    window.editingField = null;
  } else if (value && !window.selectedAggregateFields.includes(value)) {
    window.selectedAggregateFields.push(value);
  }

  renderAggregateFields();
  input.value = "";
  document.getElementById("aggregateAutocomplete").classList.add("hidden");
  window.autocompleteIndex.aggregate = -1;
}

function removeAggregateField(field) {
  window.selectedAggregateFields = window.selectedAggregateFields.filter(
    (f) => f !== field
  );
  renderAggregateFields();
}

function editAggregateField(field) {
  window.editingField = field;
  document.getElementById("aggregateFieldInput").value = field;
  document.getElementById("aggregateFieldInput").focus();
}

function renderAggregateFields() {
  const container = document.getElementById("aggregateFieldsContainer");
  container.innerHTML = "";
  const availableFields = getCurrentFields();

  window.selectedAggregateFields.forEach((field) => {
    const tag = document.createElement("span");
    tag.className =
      "inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm cursor-pointer hover:bg-green-200";

    const fieldName = availableFields[field]?.name || field;
    const displayText = availableFields[field]
      ? `${fieldName} (${field})`
      : field;

    tag.innerHTML = `
      <span onclick="editAggregateField('${field.replace(/'/g, "\\'")}')">
        ${displayText}
      </span>
      <button onclick="event.stopPropagation(); removeAggregateField('${field.replace(
        /'/g,
        "\\'"
      )}');" class="hover:text-green-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;
    container.appendChild(tag);
  });
}

// Autocomplete
function normalizeSearchString(str) {
  return str.toLowerCase().replace(/[.\-_\s]/g, "");
}

function handleAutocompleteNavigation(e, type) {
  let autocompleteId;
  if (type === "groupByRow") {
    autocompleteId = "groupByRowAutocomplete";
  } else if (type === "groupByCol") {
    autocompleteId = "groupByColAutocomplete";
  } else if (type === "aggregate") {
    autocompleteId = "aggregateAutocomplete";
  }

  const autocomplete = document.getElementById(autocompleteId);
  const items = autocomplete.querySelectorAll("div.autocomplete-item");

  if (items.length === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    window.autocompleteIndex[type] = Math.min(
      window.autocompleteIndex[type] + 1,
      items.length - 1
    );
    updateAutocompleteHighlight(items, window.autocompleteIndex[type]);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    window.autocompleteIndex[type] = Math.max(
      window.autocompleteIndex[type] - 1,
      0
    );
    updateAutocompleteHighlight(items, window.autocompleteIndex[type]);
  } else if (e.key === "Enter" && window.autocompleteIndex[type] >= 0) {
    e.preventDefault();
    items[window.autocompleteIndex[type]].click();
  } else if (e.key === "Escape") {
    autocomplete.classList.add("hidden");
    window.autocompleteIndex[type] = -1;
  }
}

function updateAutocompleteHighlight(items, index) {
  items.forEach((item, i) => {
    if (i === index) {
      item.classList.add("bg-gray-200", "dark:bg-gray-600");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("bg-gray-200", "dark:bg-gray-600");
    }
  });
}

function handleAutocomplete(searchText, type) {
  let autocompleteId, selectedFields;

  if (type === "groupByRow") {
    autocompleteId = "groupByRowAutocomplete";
    selectedFields = window.selectedGroupByRowFields;
  } else if (type === "groupByCol") {
    autocompleteId = "groupByColAutocomplete";
    selectedFields = window.selectedGroupByColFields;
  } else if (type === "aggregate") {
    autocompleteId = "aggregateAutocomplete";
    selectedFields = window.selectedAggregateFields;
  }

  const autocomplete = document.getElementById(autocompleteId);
  const availableFields = getCurrentFields();

  window.autocompleteIndex[type] = -1;

  if (!searchText || searchText.length < 1) {
    autocomplete.classList.add("hidden");
    return;
  }

  if (!availableFields || Object.keys(availableFields).length === 0) {
    autocomplete.classList.add("hidden");
    return;
  }

  const searchNormalized = normalizeSearchString(searchText);
  const filtered = Object.entries(availableFields).filter(([key, field]) => {
    let allowed;
    if (type === "groupByRow" || type === "groupByCol") {
      allowed = field.groupingAllowed;
    } else if (type === "aggregate") {
      allowed = field.aggregationAllowed;
    }

    const keyNormalized = normalizeSearchString(key);
    const nameNormalized = normalizeSearchString(field.name);

    const matchesSearch =
      keyNormalized.includes(searchNormalized) ||
      nameNormalized.includes(searchNormalized);
    const notSelected = !selectedFields.includes(key);
    return allowed && matchesSearch && notSelected;
  });

  if (filtered.length === 0) {
    autocomplete.classList.add("hidden");
    return;
  }

  autocomplete.innerHTML = "";
  autocomplete.classList.remove("hidden");

  filtered.slice(0, 10).forEach(([key, field]) => {
    const item = document.createElement("div");
    item.className =
      "autocomplete-item px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm";
    item.innerHTML = `
      <div class="font-medium text-gray-900 dark:text-gray-100">${field.name}</div>
      <div class="text-xs text-gray-500 dark:text-gray-400">${key}</div>
    `;
    item.onclick = () => {
      if (type === "groupByRow") {
        document.getElementById("groupByRowFieldInput").value = key;
        addGroupByRowField();
      } else if (type === "groupByCol") {
        document.getElementById("groupByColFieldInput").value = key;
        addGroupByColField();
      } else if (type === "aggregate") {
        document.getElementById("aggregateFieldInput").value = key;
        addAggregateField();
      }
    };
    autocomplete.appendChild(item);
  });
}
