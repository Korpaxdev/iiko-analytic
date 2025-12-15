// Подсветка синтаксиса JSON и работа с отображением

function syntaxHighlight(json) {
  json = JSON.stringify(json, null, 2);
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
        } else {
          cls = "json-string";
        }
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    }
  );
}

function displayJson(data) {
  const jsonCode = document.getElementById("jsonCode");
  jsonCode.innerHTML = syntaxHighlight(data);
  document.getElementById("jsonContainer").classList.remove("hidden");
}

function copyJson() {
  const jsonCode = document.getElementById("jsonCode");
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = jsonCode.textContent;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  document.execCommand("copy");
  document.body.removeChild(tempTextArea);

  const button = event.target;
  const originalText = button.textContent;
  button.textContent = "Скопировано!";
  button.classList.remove("bg-gray-500", "hover:bg-gray-600");
  button.classList.add("bg-green-500", "hover:bg-green-600");

  setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("bg-green-500", "hover:bg-green-600");
    button.classList.add("bg-gray-500", "hover:bg-gray-600");
  }, 2000);
}

