// Очистка всех полей и фильтров OLAP отчета

function clearAllOlapFields() {
  // Подтверждение действия
  if (!confirm("Вы уверены, что хотите очистить все поля и фильтры?")) {
    return;
  }

  // Очищаем все выбранные поля
  window.selectedGroupByRowFields = [];
  window.selectedGroupByColFields = [];
  window.selectedAggregateFields = [];

  // Очищаем фильтры
  const filtersList = document.getElementById("filtersList");
  if (filtersList) {
    filtersList.innerHTML = "";
  }

  // Обновляем UI для полей
  renderGroupByRowFields();
  renderGroupByColFields();
  renderAggregateFields();

  // Очищаем также фильтры таблицы (если есть результаты)
  window.columnFilters = {};
  
  // Скрываем сообщение об успехе через несколько секунд
  const message = document.createElement("div");
  message.className =
    "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-300";
  message.textContent = "Все поля и фильтры очищены";
  document.body.appendChild(message);

  setTimeout(() => {
    message.style.opacity = "0";
    setTimeout(() => message.remove(), 300);
  }, 2000);
}

