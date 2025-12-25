// Работа с хэшем пароля

function openHashModal() {
  const modal = document.getElementById("hashModal");
  if (modal) {
    modal.classList.remove("hidden");
    const passwordInput = document.getElementById("passwordInput");
    if (passwordInput) {
      passwordInput.focus();
      passwordInput.value = "";
    }
    hideHashError();
  }
}

function closeHashModal() {
  const modal = document.getElementById("hashModal");
  if (modal) {
    modal.classList.add("hidden");
    const passwordInput = document.getElementById("passwordInput");
    const hashResultContainer = document.getElementById("hashResultContainer");
    const hashOutput = document.getElementById("hashOutput");
    if (passwordInput) {
      passwordInput.value = "";
    }
    if (hashResultContainer) {
      hashResultContainer.classList.add("hidden");
    }
    if (hashOutput) {
      hashOutput.value = "";
    }
    hideHashError();
  }
}

function closeHashModalOnBackdrop(event) {
  if (event.target.id === "hashModal") {
    closeHashModal();
  }
}

function hideHashError() {
  const errorDiv = document.getElementById("hashError");
  if (errorDiv) {
    errorDiv.classList.add("hidden");
  }
}

function showHashError(message) {
  const errorDiv = document.getElementById("hashError");
  const errorMessage = document.getElementById("hashErrorMessage");
  if (errorDiv && errorMessage) {
    errorMessage.textContent = message;
    errorDiv.classList.remove("hidden");
  }
}

function generateHash() {
  const passwordInput = document.getElementById("passwordInput");
  const hashResultContainer = document.getElementById("hashResultContainer");
  const hashOutput = document.getElementById("hashOutput");

  if (!passwordInput || !hashResultContainer || !hashOutput) {
    showHashError("Ошибка: не найдены необходимые элементы формы");
    return;
  }

  const password = passwordInput.value.trim();

  if (!password) {
    showHashError("Пожалуйста, введите пароль");
    passwordInput.focus();
    return;
  }

  try {
    // Генерируем SHA-1 хэш
    const hash = CryptoJS.SHA1(password).toString(CryptoJS.enc.Hex);

    // Показываем хэш в поле для копирования
    hashOutput.value = hash;
    hashResultContainer.classList.remove("hidden");
    hideHashError();

    // Выделяем текст для удобства копирования
    hashOutput.select();
  } catch (error) {
    showHashError("Ошибка при генерации хэша: " + error.message);
  }
}

function copyHash(button) {
  const hashOutput = document.getElementById("hashOutput");
  if (!hashOutput) return;

  hashOutput.select();
  hashOutput.setSelectionRange(0, 99999); // Для мобильных устройств

  const originalText = button.textContent;

  try {
    document.execCommand("copy");
    // Временно меняем текст кнопки для обратной связи
    button.textContent = "Скопировано!";
    button.classList.add("bg-green-500", "hover:bg-green-600");
    button.classList.remove("bg-gray-500", "hover:bg-gray-600");
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("bg-green-500", "hover:bg-green-600");
      button.classList.add("bg-gray-500", "hover:bg-gray-600");
    }, 2000);
  } catch (err) {
    // Fallback для современных браузеров
    navigator.clipboard
      .writeText(hashOutput.value)
      .then(() => {
        button.textContent = "Скопировано!";
        button.classList.add("bg-green-500", "hover:bg-green-600");
        button.classList.remove("bg-gray-500", "hover:bg-gray-600");
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove("bg-green-500", "hover:bg-green-600");
          button.classList.add("bg-gray-500", "hover:bg-gray-600");
        }, 2000);
      })
      .catch(() => {
        showHashError("Не удалось скопировать хэш");
      });
  }
}

