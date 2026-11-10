(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const DEFAULTS = { latitude: 31.230416, longitude: 121.473701 };
  const state = {
    latitude: DEFAULTS.latitude,
    longitude: DEFAULTS.longitude,
    layer: "standard",
    platform: /Android/i.test(navigator.userAgent) ? "android" : "ios"
  };

  const elements = {
    latitude: $("#latitude"),
    longitude: $("#longitude"),
    validation: $("#validation"),
    mapCoordinate: $("#map-coordinate"),
    copyValue: $("#copy-value"),
    modeTitle: $("#mode-title"),
    modeDetail: $("#mode-detail"),
    instructions: $("#instruction-list"),
    moduleLink: $("#module-link"),
    searchInput: $("#search-input"),
    searchClear: $("#search-clear"),
    searchResults: $("#search-results"),
    toast: $("#toast")
  };

  const standardLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  });
  const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19,
    attribution: "&copy; Esri"
  });
  const amapLayer = L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}", {
    subdomains: ["1", "2", "3", "4"],
    maxZoom: 18,
    attribution: "&copy; 高德地图"
  });
  const layers = { standard: standardLayer, satellite: satelliteLayer, amap: amapLayer };
  const map = L.map("map", { zoomControl: false }).setView([state.latitude, state.longitude], 12);
  standardLayer.addTo(map);

  const marker = L.marker([state.latitude, state.longitude], {
    draggable: true,
    keyboard: false,
    icon: L.divIcon({ className: "target-marker", html: '<span class="target-pin"></span>', iconSize: [30, 40], iconAnchor: [15, 39] })
  }).addTo(map);

  function format(value) {
    return Number(value).toFixed(6);
  }

  function coordinateText() {
    return `${format(state.latitude)}, ${format(state.longitude)}`;
  }

  function outOfChina(latitude, longitude) {
    return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271;
  }

  function transformLatitude(x, y) {
    let value = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    value += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
    value += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3;
    value += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3;
    return value;
  }

  function transformLongitude(x, y) {
    let value = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    value += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
    value += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3;
    value += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3;
    return value;
  }

  function wgsToGcj(latitude, longitude) {
    if (outOfChina(latitude, longitude)) return [latitude, longitude];
    const a = 6378245.0;
    const ee = 0.00669342162296594323;
    let dLat = transformLatitude(longitude - 105, latitude - 35);
    let dLon = transformLongitude(longitude - 105, latitude - 35);
    const radLat = latitude / 180 * Math.PI;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    dLat = dLat * 180 / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
    dLon = dLon * 180 / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
    return [latitude + dLat, longitude + dLon];
  }

  function gcjToWgs(latitude, longitude) {
    if (outOfChina(latitude, longitude)) return [latitude, longitude];
    const [gcjLat, gcjLon] = wgsToGcj(latitude, longitude);
    return [latitude * 2 - gcjLat, longitude * 2 - gcjLon];
  }

  function displayCoordinate(latitude, longitude) {
    return state.layer === "amap" ? wgsToGcj(latitude, longitude) : [latitude, longitude];
  }

  function setTarget(latitude, longitude, options = {}) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      elements.validation.textContent = "坐标格式不正确：纬度 -90 至 90，经度 -180 至 180。";
      return false;
    }
    state.latitude = Number(lat.toFixed(8));
    state.longitude = Number(lon.toFixed(8));
    elements.validation.textContent = "";
    elements.latitude.value = format(state.latitude);
    elements.longitude.value = format(state.longitude);
    elements.mapCoordinate.textContent = coordinateText();
    elements.copyValue.textContent = coordinateText();
    marker.setLatLng(displayCoordinate(state.latitude, state.longitude));
    if (options.fly) map.flyTo(displayCoordinate(state.latitude, state.longitude), 15, { duration: .65 });
    return true;
  }

  function parseCoordinate(text) {
    const match = text.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,，\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
    return match ? [Number(match[1]), Number(match[2])] : null;
  }

  function setLayer(name) {
    if (!layers[name] || name === state.layer) return;
    const center = map.getCenter();
    layers[state.layer].remove();
    state.layer = name;
    layers[name].addTo(map);
    marker.setLatLng(displayCoordinate(state.latitude, state.longitude));
    const adjusted = state.layer === "amap" ? gcjToWgs(center.lat, center.lng) : [center.lat, center.lng];
    map.setView(displayCoordinate(adjusted[0], adjusted[1]), map.getZoom(), { animate: false });
    $$("[data-layer]").forEach((button) => button.classList.toggle("active", button.dataset.layer === name));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  let searchController = null;
  let searchTimer = null;

  function closeSearch() {
    elements.searchResults.hidden = true;
    elements.searchResults.replaceChildren();
  }

  function showSearchMessage(message) {
    elements.searchResults.hidden = false;
    elements.searchResults.innerHTML = `<div class="search-message">${escapeHtml(message)}</div>`;
  }

  async function searchPlaces(query) {
    if (searchController) searchController.abort();
    searchController = new AbortController();
    showSearchMessage("正在搜索…");
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "6");
      url.searchParams.set("accept-language", "zh-CN,zh,en");
      url.searchParams.set("q", query);
      const response = await fetch(url, { signal: searchController.signal });
      if (!response.ok) throw new Error("search failed");
      const results = await response.json();
      elements.searchResults.replaceChildren();
      if (!results.length) return showSearchMessage("没有找到地点，可以直接粘贴经纬度。");
      results.forEach((item) => {
        const button = document.createElement("button");
        const name = item.display_name || item.name || "未命名地点";
        button.type = "button";
        button.innerHTML = `<strong>${escapeHtml(name)}</strong><small>${Number(item.lat).toFixed(5)}, ${Number(item.lon).toFixed(5)}</small>`;
        button.addEventListener("click", () => {
          setTarget(Number(item.lat), Number(item.lon), { fly: true });
          elements.searchInput.value = name.split(",")[0];
          elements.searchClear.hidden = false;
          closeSearch();
        });
        elements.searchResults.append(button);
      });
      elements.searchResults.hidden = false;
    } catch (error) {
      if (error.name !== "AbortError") showSearchMessage("搜索暂不可用，请直接粘贴经纬度。");
    }
  }

  function renderPlatform() {
    const ios = state.platform === "ios";
    $$("[data-platform]").forEach((button) => button.classList.toggle("active", button.dataset.platform === state.platform));
    $$(".ios-only").forEach((element) => { element.hidden = !ios; });
    elements.modeTitle.textContent = ios ? "iPhone 网络定位" : "Android 模拟定位";
    elements.modeDetail.textContent = ios
      ? "首次导入模块并信任证书；之后只改模块里的经纬度。"
      : "使用系统模拟位置功能；无需代理、证书或 Root。";
    const steps = ios ? [
      "在小火箭「模块」中打开 <b>LocShift 定位修改</b>，点「编辑参数」。",
      "把模块中的纬度和经度改成上方坐标，断开再连接小火箭。",
      "关闭再打开 iPhone 的定位服务；室内通常 5～10 秒生效。"
    ] : [
      "安装一个可用的“模拟位置”应用，并打开 Android 开发者选项。",
      "在「选择模拟位置应用」中选中它；这一步通常只需做一次。",
      "把上方坐标粘贴进应用并启动；停止应用即可恢复真实位置。"
    ];
    elements.instructions.innerHTML = steps.map((step) => `<li>${step}</li>`).join("");
    try { localStorage.setItem("locshift_platform", state.platform); } catch (_) {}
  }

  let toastTimer = null;
  function showToast(message, error = false) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast show${error ? " error" : ""}`;
    toastTimer = setTimeout(() => { elements.toast.className = "toast"; }, 2400);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      textarea.remove();
      return success;
    }
  }

  map.on("click", (event) => {
    const [latitude, longitude] = state.layer === "amap" ? gcjToWgs(event.latlng.lat, event.latlng.lng) : [event.latlng.lat, event.latlng.lng];
    setTarget(latitude, longitude);
  });
  marker.on("dragend", (event) => {
    const position = event.target.getLatLng();
    const [latitude, longitude] = state.layer === "amap" ? gcjToWgs(position.lat, position.lng) : [position.lat, position.lng];
    setTarget(latitude, longitude);
  });

  [elements.latitude, elements.longitude].forEach((input) => {
    input.addEventListener("change", () => setTarget(elements.latitude.value, elements.longitude.value));
  });
  elements.searchInput.addEventListener("input", () => {
    const value = elements.searchInput.value.trim();
    elements.searchClear.hidden = !value;
    clearTimeout(searchTimer);
    const direct = parseCoordinate(value);
    if (direct) {
      setTarget(direct[0], direct[1], { fly: true });
      closeSearch();
      return;
    }
    if (!value) return closeSearch();
    if (value.length >= 2) searchTimer = setTimeout(() => searchPlaces(value), 450);
  });
  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    clearTimeout(searchTimer);
    const direct = parseCoordinate(elements.searchInput.value);
    if (direct) setTarget(direct[0], direct[1], { fly: true });
    else if (elements.searchInput.value.trim()) searchPlaces(elements.searchInput.value.trim());
  });
  elements.searchClear.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.searchClear.hidden = true;
    closeSearch();
  });
  $$("[data-layer]").forEach((button) => button.addEventListener("click", () => setLayer(button.dataset.layer)));
  $$("[data-platform]").forEach((button) => button.addEventListener("click", () => {
    state.platform = button.dataset.platform;
    renderPlatform();
  }));
  $("#recenter").addEventListener("click", () => map.flyTo(displayCoordinate(state.latitude, state.longitude), 15, { duration: .55 }));
  $("#copy-coordinate").addEventListener("click", async () => {
    const copied = await copyText(coordinateText());
    showToast(copied ? "坐标已复制" : "复制失败，请长按坐标手动复制", !copied);
  });

  function init() {
    try {
      const saved = localStorage.getItem("locshift_platform");
      if (saved === "ios" || saved === "android") state.platform = saved;
    } catch (_) {}
    const url = new URL(window.location.href);
    const latitude = Number(url.searchParams.get("lat") || url.searchParams.get("latitude"));
    const longitude = Number(url.searchParams.get("lon") || url.searchParams.get("lng") || url.searchParams.get("longitude"));
    setTarget(Number.isFinite(latitude) && latitude !== 0 ? latitude : DEFAULTS.latitude, Number.isFinite(longitude) && longitude !== 0 ? longitude : DEFAULTS.longitude, { fly: Boolean(url.search) });
    renderPlatform();
  }

  init();
})();
