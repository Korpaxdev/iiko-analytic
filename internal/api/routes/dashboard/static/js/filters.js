// Работа с фильтрами

function addFilter() {
  const filtersList = document.getElementById("filtersList");
  const filterId = window.filterCount++;

  const filterDiv = document.createElement("div");
  filterDiv.className =
    "border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-700";
  filterDiv.id = "filter-" + filterId;
  filterDiv.innerHTML = `
    <div class="mb-2">
      <div class="relative mb-2">
        <input type="text" placeholder="Field name" id="filter-field-${filterId}" class="filter-field w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" autocomplete="off">
        <div id="filter-autocomplete-${filterId}" class="custom-scrollbar hidden absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"></div>
      </div>
      <select class="filter-type w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <option value="IncludeValues">Include Values</option>
        <option value="ExcludeValues">Exclude Values</option>
      </select>
      <input type="text" placeholder="Values (comma separated)" class="filter-values w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <button onclick="removeFilter(${filterId})" class="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-2 rounded">
        Удалить
      </button>
    </div>
  `;

  filtersList.appendChild(filterDiv);

  const filterInput = document.getElementById(`filter-field-${filterId}`);
  const filterAutocomplete = document.getElementById(
    `filter-autocomplete-${filterId}`
  );

  filterInput.addEventListener("input", (e) => {
    handleFilterAutocomplete(e.target.value, filterId);
  });

  filterInput.addEventListener("keydown", (e) => {
    handleFilterAutocompleteNavigation(e, filterId);
  });

  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(`#filter-field-${filterId}`) &&
      !e.target.closest(`#filter-autocomplete-${filterId}`)
    ) {
      filterAutocomplete.classList.add("hidden");
    }
  });
}

function removeFilter(filterId) {
  const filterDiv = document.getElementById("filter-" + filterId);
  if (filterDiv) {
    filterDiv.remove();
    delete window.filterAutocompleteIndex[filterId];
  }
}

function handleFilterAutocomplete(searchText, filterId) {
  const autocomplete = document.getElementById(
    `filter-autocomplete-${filterId}`
  );
  const availableFields = getCurrentFields();

  window.filterAutocompleteIndex[filterId] = -1;

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
    const keyNormalized = normalizeSearchString(key);
    const nameNormalized = normalizeSearchString(field.name);

    return (
      keyNormalized.includes(searchNormalized) ||
      nameNormalized.includes(searchNormalized)
    );
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
      document.getElementById(`filter-field-${filterId}`).value = key;
      autocomplete.classList.add("hidden");
      window.filterAutocompleteIndex[filterId] = -1;
    };
    autocomplete.appendChild(item);
  });
}

function handleFilterAutocompleteNavigation(e, filterId) {
  const autocomplete = document.getElementById(
    `filter-autocomplete-${filterId}`
  );
  const items = autocomplete.querySelectorAll("div.autocomplete-item");

  if (items.length === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    window.filterAutocompleteIndex[filterId] = Math.min(
      (window.filterAutocompleteIndex[filterId] || -1) + 1,
      items.length - 1
    );
    updateAutocompleteHighlight(
      items,
      window.filterAutocompleteIndex[filterId]
    );
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    window.filterAutocompleteIndex[filterId] = Math.max(
      (window.filterAutocompleteIndex[filterId] || 0) - 1,
      0
    );
    updateAutocompleteHighlight(
      items,
      window.filterAutocompleteIndex[filterId]
    );
  } else if (
    e.key === "Enter" &&
    window.filterAutocompleteIndex[filterId] >= 0
  ) {
    e.preventDefault();
    items[window.filterAutocompleteIndex[filterId]].click();
  } else if (e.key === "Escape") {
    autocomplete.classList.add("hidden");
    window.filterAutocompleteIndex[filterId] = -1;
  }
}

function getFilters() {
  const filters = {};
  const filterDivs = document.querySelectorAll("#filtersList > div");

  filterDivs.forEach((div) => {
    const field = div.querySelector(".filter-field").value.trim();
    const type = div.querySelector(".filter-type").value;
    const values = div
      .querySelector(".filter-values")
      .value.split(",")
      .map((v) => v.trim())
      .filter((v) => v);

    if (field && values.length > 0) {
      filters[field] = {
        filterType: type,
        values: values,
      };
    }
  });

  return filters;
}


