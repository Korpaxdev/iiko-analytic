// Импорт конфигурации из JSON

function openImportModal() {
  const modal = document.getElementById("importModal");
  const textarea = document.getElementById("importJsonTextarea");
  const errorDiv = document.getElementById("importError");

  modal.classList.remove("hidden");
  textarea.value = "";
  errorDiv.classList.add("hidden");

  // Фокус на textarea
  setTimeout(() => {
    textarea.focus();
  }, 100);
}

function closeImportModal() {
  const modal = document.getElementById("importModal");
  modal.classList.add("hidden");
}

function closeImportModalOnBackdrop(event) {
  if (event.target.id === "importModal") {
    closeImportModal();
  }
}

function showImportError(message) {
  const errorDiv = document.getElementById("importError");
  const errorMessage = document.getElementById("importErrorMessage");
  errorMessage.textContent = message;
  errorDiv.classList.remove("hidden");
}

function hideImportError() {
  const errorDiv = document.getElementById("importError");
  errorDiv.classList.add("hidden");
}

function validateJsonFormat(json) {
  // Проверяем обязательные поля
  if (!json || typeof json !== "object") {
    return "JSON должен быть объектом";
  }

  // Неизвестные поля игнорируются при импорте
  // Проверяем типы полей
  if (json.aggregateFields !== undefined) {
    if (!Array.isArray(json.aggregateFields)) {
      return "aggregateFields должен быть массивом";
    }
    if (!json.aggregateFields.every((item) => typeof item === "string")) {
      return "Все элементы aggregateFields должны быть строками";
    }
  }

  if (json.groupByColFields !== undefined) {
    if (!Array.isArray(json.groupByColFields)) {
      return "groupByColFields должен быть массивом";
    }
    if (!json.groupByColFields.every((item) => typeof item === "string")) {
      return "Все элементы groupByColFields должны быть строками";
    }
  }

  if (json.groupByRowFields !== undefined) {
    if (!Array.isArray(json.groupByRowFields)) {
      return "groupByRowFields должен быть массивом";
    }
    if (!json.groupByRowFields.every((item) => typeof item === "string")) {
      return "Все элементы groupByRowFields должны быть строками";
    }
  }

  if (json.reportType !== undefined) {
    if (typeof json.reportType !== "string") {
      return "reportType должен быть строкой";
    }
    if (!["SALES", "TRANSACTIONS"].includes(json.reportType)) {
      return "reportType должен быть 'SALES' или 'TRANSACTIONS'";
    }
  }

  if (json.filters !== undefined) {
    if (typeof json.filters !== "object" || Array.isArray(json.filters)) {
      return "filters должен быть объектом";
    }

    // Проверяем каждый фильтр
    for (const [fieldName, filter] of Object.entries(json.filters)) {
      if (typeof filter !== "object" || Array.isArray(filter)) {
        return `Фильтр для поля '${fieldName}' должен быть объектом`;
      }

      if (!filter.filterType) {
        return `Фильтр для поля '${fieldName}' должен содержать filterType`;
      }

      // Проверяем только IncludeValues и ExcludeValues
      if (
        filter.filterType !== "IncludeValues" &&
        filter.filterType !== "ExcludeValues"
      ) {
        continue; // Пропускаем другие типы фильтров
      }

      if (!filter.values || !Array.isArray(filter.values)) {
        return `Фильтр для поля '${fieldName}' должен содержать массив values`;
      }

      if (!filter.values.every((item) => typeof item === "string")) {
        return `Все значения в фильтре для поля '${fieldName}' должны быть строками`;
      }
    }
  }

  return null; // Валидация прошла успешно
}

function importJson() {
  const textarea = document.getElementById("importJsonTextarea");
  const jsonText = textarea.value.trim();

  hideImportError();

  if (!jsonText) {
    showImportError("Введите JSON конфигурацию");
    return;
  }

  let json;
  try {
    json = JSON.parse(jsonText);
  } catch (error) {
    showImportError(`Ошибка парсинга JSON: ${error.message}`);
    return;
  }

  // Валидация формата
  const validationError = validateJsonFormat(json);
  if (validationError) {
    showImportError(validationError);
    return;
  }

  try {
    // Заполняем reportType
    if (json.reportType) {
      document.getElementById("reportType").value = json.reportType;
      // Триггерим событие change для обновления полей
      document.getElementById("reportType").dispatchEvent(new Event("change"));
    }

    // Заполняем groupByRowFields
    if (json.groupByRowFields) {
      window.selectedGroupByRowFields = [...json.groupByRowFields];
      renderGroupByRowFields();
    }

    // Заполняем groupByColFields
    if (json.groupByColFields) {
      window.selectedGroupByColFields = [...json.groupByColFields];
      renderGroupByColFields();
    }

    // Заполняем aggregateFields
    if (json.aggregateFields) {
      window.selectedAggregateFields = [...json.aggregateFields];
      renderAggregateFields();
    }

    // Заполняем фильтры (только IncludeValues и ExcludeValues)
    if (json.filters) {
      clearOlapFilters();
      Object.entries(json.filters).forEach(([fieldName, filter]) => {
        if (
          filter.filterType === "IncludeValues" ||
          filter.filterType === "ExcludeValues"
        ) {
          if (
            filter.values &&
            Array.isArray(filter.values) &&
            filter.values.length > 0
          ) {
            addFilterFromPreset(fieldName, filter.filterType, filter.values);
          }
        }
      });
    }

    // Закрываем модальное окно
    closeImportModal();

    // Показываем успешное сообщение
    showSuccess("Конфигурация успешно импортирована");
    setTimeout(() => {
      hideSuccess();
    }, 3000);
  } catch (error) {
    showImportError(`Ошибка при импорте: ${error.message}`);
  }
}

// Закрытие модального окна по Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("importModal");
    if (!modal.classList.contains("hidden")) {
      closeImportModal();
    }
  }
});
