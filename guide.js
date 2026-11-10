(function () {
  "use strict";

  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const toast = document.querySelector("#toast");
  const moduleCode = document.querySelector("#ios-module-url");
  const modulePath = "modules/locshift.sgmodule?v=3";
  const fallbackModuleUrl = new URL(modulePath, document.baseURI).toString();
  if (moduleCode) moduleCode.textContent = fallbackModuleUrl;

  fetch("api/lan-base", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      if (moduleCode && data && data.base) {
        moduleCode.textContent = new URL(modulePath, data.base).toString();
      }
    })
    .catch(() => {});

  function setPlatform(platform) {
    $$("[data-platform]").forEach((button) => button.classList.toggle("active", button.dataset.platform === platform));
    $$("[data-platform-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.platformPanel === platform));
    try { localStorage.setItem("locshift_platform", platform); } catch (_) {}
  }

  $$("[data-platform]").forEach((button) => button.addEventListener("click", () => setPlatform(button.dataset.platform)));

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    toast.textContent = "已复制";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
  }

  $$("[data-copy]").forEach((button) => button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.copy);
    if (target) copy(target.textContent);
  }));

  let initial = /Android/i.test(navigator.userAgent) ? "android" : "ios";
  try {
    const saved = localStorage.getItem("locshift_platform");
    if (saved === "ios" || saved === "android") initial = saved;
  } catch (_) {}
  setPlatform(initial);
})();
