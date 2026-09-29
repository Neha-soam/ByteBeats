/* Shared styled dialogs, replacing the browser's native prompt()/confirm(). */
(() => {
  function openModal(html, focusSelector) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "install-overlay dialog-overlay";
      overlay.innerHTML = `<div class="install-modal dialog-modal" role="dialog" aria-modal="true">${html}</div>`;
      document.body.append(overlay);
      const modal = overlay.querySelector(".dialog-modal");
      (modal.querySelector(focusSelector) || modal.querySelector("button")).focus();

      function close(result) {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
        resolve(result);
      }
      function onKey(e) {
        if (e.key === "Escape") close(null);
        if (e.key === "Enter" && document.activeElement.tagName === "INPUT") modal.querySelector('[data-act="ok"]').click();
      }
      document.addEventListener("keydown", onKey);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) return close(null);
        const act = e.target.closest("[data-act]");
        if (!act) return;
        if (act.dataset.act === "cancel") close(null);
        else if (act.dataset.act === "ok") {
          const input = modal.querySelector("input");
          close(input ? input.value.trim() : true);
        }
      });
    });
  }

  window.Dialog = {
    /** Styled replacement for prompt(). Resolves to the trimmed string, or null if cancelled. */
    text(title, placeholder = "", value = "") {
      return openModal(`
        <h3>${title}</h3>
        <input type="text" class="dialog-input" placeholder="${placeholder}" value="${String(value).replace(/"/g, "&quot;")}">
        <div class="install-actions">
          <button class="badge" data-act="cancel">Cancel</button>
          <button class="badge dark-badge" data-act="ok">Save</button>
        </div>`, "input");
    },
    /** Styled replacement for confirm(). Resolves to true/false. */
    confirm(title, message, okLabel = "Confirm") {
      return openModal(`
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="install-actions">
          <button class="badge" data-act="cancel">Cancel</button>
          <button class="badge dark-badge" data-act="ok">${okLabel}</button>
        </div>`, '[data-act="ok"]').then(Boolean);
    },
  };
})();