// Управление серверами (localStorage, UI)

const SERVERS_KEY = "olapServers";
const SELECTED_SERVER_KEY = "selectedServerId";

// --- localStorage CRUD ---

function getServers() {
  try {
    return JSON.parse(localStorage.getItem(SERVERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveServers(servers) {
  localStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
}

function getSelectedServerId() {
  return localStorage.getItem(SELECTED_SERVER_KEY) || "";
}

function setSelectedServerId(id) {
  localStorage.setItem(SELECTED_SERVER_KEY, id);
}

function getSelectedServer() {
  const id = getSelectedServerId();
  if (!id) return null;
  return getServers().find((s) => s.id === id) || null;
}

function addServer(data) {
  const servers = getServers();
  const server = { id: crypto.randomUUID(), ...data };
  servers.push(server);
  saveServers(servers);
  setSelectedServerId(server.id);
  return server;
}

function updateServer(id, data) {
  const servers = getServers();
  const idx = servers.findIndex((s) => s.id === id);
  if (idx === -1) return;
  servers[idx] = { ...servers[idx], ...data };
  saveServers(servers);
}

function deleteServer(id) {
  if (!id) return;
  const servers = getServers();
  const server = servers.find((s) => s.id === id);
  if (!server) return;
  if (!confirm(`Удалить сервер "${server.name}"?`)) return;

  const filtered = servers.filter((s) => s.id !== id);
  saveServers(filtered);

  if (getSelectedServerId() === id) {
    setSelectedServerId(filtered.length > 0 ? filtered[0].id : "");
  }
  renderServerSelector();
  onServerChange();
}

// --- Миграция со старого формата ---

function migrateOldSettings() {
  const old = localStorage.getItem("olapConnectionSettings");
  if (!old) return;
  try {
    const settings = JSON.parse(old);
    if (settings.baseURL) {
      let name;
      try {
        name = new URL(settings.baseURL).hostname;
      } catch {
        name = settings.baseURL;
      }
      addServer({
        name: name,
        baseURL: settings.baseURL,
        user: settings.user || "",
        passwordHash: settings.passwordHash || "",
      });
    }
    localStorage.removeItem("olapConnectionSettings");
  } catch {}
}

// --- UI рендеринг ---

function renderServerSelector() {
  const select = document.getElementById("serverSelector");
  if (!select) return;

  const servers = getServers();
  const selectedId = getSelectedServerId();

  select.innerHTML =
    '<option value="">Выберите сервер...</option>' +
    servers
      .map(
        (s) =>
          `<option value="${s.id}" ${s.id === selectedId ? "selected" : ""}>${s.name}</option>`
      )
      .join("");

  // Обновляем состояние кнопок edit/delete
  const editBtn = document.getElementById("editServerBtn");
  const deleteBtn = document.getElementById("deleteServerBtn");
  if (editBtn) editBtn.disabled = !selectedId;
  if (deleteBtn) deleteBtn.disabled = !selectedId;
}

function onServerChange() {
  const select = document.getElementById("serverSelector");
  if (select) {
    setSelectedServerId(select.value);
  }

  // Обновляем кнопки
  const selectedId = getSelectedServerId();
  const editBtn = document.getElementById("editServerBtn");
  const deleteBtn = document.getElementById("deleteServerBtn");
  if (editBtn) editBtn.disabled = !selectedId;
  if (deleteBtn) deleteBtn.disabled = !selectedId;

  // Сбрасываем загруженные данные
  window.availableFieldsByReportType = { SALES: null, TRANSACTIONS: null };
  window.presets = null;
  window.selectedGroupByRowFields = [];
  window.selectedGroupByColFields = [];
  window.selectedAggregateFields = [];
  renderGroupByRowFields();
  renderGroupByColFields();
  renderAggregateFields();
  updatePresetsSelect();

  // Загружаем данные для нового сервера
  if (getSelectedServer()) {
    checkAndLoadFields();
    checkAndLoadPresets();
  }
}

// --- Модальное окно сервера ---

let _editingServerId = null;

function openServerModal(id) {
  const modal = document.getElementById("serverModal");
  const title = document.getElementById("serverModalTitle");
  const nameInput = document.getElementById("serverName");
  const urlInput = document.getElementById("serverURL");
  const userInput = document.getElementById("serverUser");
  const passInput = document.getElementById("serverPasswordHash");
  const errorDiv = document.getElementById("serverModalError");

  errorDiv.classList.add("hidden");

  if (id) {
    const server = getServers().find((s) => s.id === id);
    if (!server) return;
    _editingServerId = id;
    title.textContent = "Редактировать сервер";
    nameInput.value = server.name;
    urlInput.value = server.baseURL;
    userInput.value = server.user;
    passInput.value = server.passwordHash;
  } else {
    _editingServerId = null;
    title.textContent = "Добавить сервер";
    nameInput.value = "";
    urlInput.value = "";
    userInput.value = "";
    passInput.value = "";
  }

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  setTimeout(() => nameInput.focus(), 100);
}

function closeServerModal() {
  document.getElementById("serverModal").classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  _editingServerId = null;
}

function closeServerModalOnBackdrop(event) {
  if (event.target.id === "serverModal") {
    closeServerModal();
  }
}

function showServerModalError(message) {
  const errorDiv = document.getElementById("serverModalError");
  const errorMsg = document.getElementById("serverModalErrorMessage");
  errorMsg.textContent = message;
  errorDiv.classList.remove("hidden");
}

function saveServerFromModal() {
  const name = document.getElementById("serverName").value.trim();
  const baseURL = document.getElementById("serverURL").value.trim();
  const user = document.getElementById("serverUser").value.trim();
  const passwordHash = document.getElementById("serverPasswordHash").value.trim();

  if (!baseURL || !user || !passwordHash) {
    showServerModalError("Заполните все обязательные поля");
    return;
  }

  const serverName = name || (() => {
    try { return new URL(baseURL).hostname; } catch { return baseURL; }
  })();

  if (_editingServerId) {
    updateServer(_editingServerId, {
      name: serverName,
      baseURL,
      user,
      passwordHash,
    });
  } else {
    addServer({ name: serverName, baseURL, user, passwordHash });
  }

  closeServerModal();
  renderServerSelector();
  onServerChange();
}

// --- Инициализация ---

function initServers() {
  migrateOldSettings();
  renderServerSelector();
}

// Закрытие модала по Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("serverModal");
    if (modal && !modal.classList.contains("hidden")) {
      closeServerModal();
    }
  }
});
