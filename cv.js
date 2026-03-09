(() => {
  const body = document.body;
  const rootStyle = document.documentElement.style;
  const page1 = document.querySelector('.cv-page[data-page="1"]');
  const page2 = document.querySelector('.cv-page[data-page="2"]');

  const btnModePremium = document.getElementById("btn-mode-premium");
  const btnModeAts = document.getElementById("btn-mode-ats");
  const btnPage1 = document.getElementById("btn-page-1");
  const btnPage2 = document.getElementById("btn-page-2");
  const btnPrint = document.getElementById("btn-print");
  const themeButtons = Array.from(document.querySelectorAll("[data-theme-value]"));

  const STORAGE_KEYS = {
    mode: "cv-mode",
    page: "cv-page",
    theme: "cv-theme",
  };

  const THEMES = new Set(["blue", "green", "violet", "sunset", "black"]);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const readPreference = (key, fallback) => {
    try {
      return window.localStorage.getItem(key) || fallback;
    } catch (_) {
      return fallback;
    }
  };

  const writePreference = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
      // Ignore storage restrictions.
    }
  };

  const setGridHeight = (page) => {
    if (!page) return 0;
    const grid = page.querySelector(".page-grid");
    if (!grid) return 0;
    const styles = window.getComputedStyle(page);
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const available = Math.max(0, page.clientHeight - grid.offsetTop - paddingBottom);
    grid.style.height = `${available}px`;
    return available;
  };

  const measureLeftGap = (page) => {
    if (!page) return 0;
    const grid = page.querySelector(".page-grid");
    const left = page.querySelector(".main-col");
    if (!grid || !left) return 0;
    return grid.clientHeight - left.scrollHeight;
  };

  const updatePageOneOffsets = () => {
    if (!page1) return;
    const left = page1.querySelector(".main-col");
    const competences = page1.querySelector("#competences");
    const technos = page1.querySelector("#technos-environnements");
    const parcours = page1.querySelector("#parcours");
    rootStyle.setProperty("--page-1-tech-offset", "12px");
    rootStyle.setProperty("--page-1-parcours-offset", "12px");
    if (!left || !competences || !technos || !parcours) return;

    const baseGap = 12;
    const totalHeight = competences.scrollHeight + technos.scrollHeight + parcours.scrollHeight + (baseGap * 2);
    const freeSpace = Math.max(0, left.scrollHeight - totalHeight);
    const techOffset = baseGap + (freeSpace * 0.5);
    const parcoursOffset = baseGap + (freeSpace * 0.5);

    rootStyle.setProperty("--page-1-tech-offset", `${techOffset.toFixed(1)}px`);
    rootStyle.setProperty("--page-1-parcours-offset", `${parcoursOffset.toFixed(1)}px`);
  };

  const fitExperienceScale = () => {
    if (!page1) return;

    const atsMode = body.dataset.mode === "ats";
    const minScale = atsMode ? 0.9 : 0.98;
    const maxScale = atsMode ? 1.14 : 1.22;
    const targetGap = atsMode ? 14 : 24;
    const tolerance = atsMode ? 6 : 8;

    const gapFor = (scale) => {
      rootStyle.setProperty("--experience-scale", scale.toFixed(3));
      setGridHeight(page1);
      setGridHeight(page2);
      return measureLeftGap(page1);
    };

    const gapAtMin = gapFor(minScale);
    if (gapAtMin < targetGap - tolerance) {
      rootStyle.setProperty("--experience-scale", minScale.toFixed(3));
      return;
    }

    const gapAtMax = gapFor(maxScale);
    if (gapAtMax > targetGap + tolerance) {
      rootStyle.setProperty("--experience-scale", maxScale.toFixed(3));
      return;
    }

    let low = minScale;
    let high = maxScale;
    let best = 1;

    for (let index = 0; index < 14; index += 1) {
      const mid = (low + high) / 2;
      const gap = gapFor(mid);
      best = mid;
      if (gap > targetGap + tolerance) {
        low = mid;
      } else if (gap < targetGap - tolerance) {
        high = mid;
      } else {
        break;
      }
    }

    rootStyle.setProperty("--experience-scale", best.toFixed(3));
  };

  const updatePageTwoOffsets = () => {
    rootStyle.setProperty("--page-2-kpi-offset", "0px");
    rootStyle.setProperty("--page-2-exploration-offset", "0px");
    setGridHeight(page2);

    if (!page2) return;
    const grid = page2.querySelector(".page-grid");
    const left = page2.querySelector(".main-col");
    const side = page2.querySelector(".side-col");
    const kpi = page2.querySelector("#realisations-resultats");
    if (!grid || !left || !kpi) return;

    const topContentHeight = Math.max(left.scrollHeight, side ? side.scrollHeight : 0);
    const footerHeight = kpi.scrollHeight;
    const freeSpace = Math.max(0, grid.clientHeight - topContentHeight - footerHeight);
    if (freeSpace <= 12) {
      return;
    }

    const kpiOffset = clamp(freeSpace / 2, 10, 44);
    const explorationOffset = clamp(freeSpace * 0.18, 8, 18);
    rootStyle.setProperty("--page-2-kpi-offset", `${kpiOffset.toFixed(1)}px`);
    rootStyle.setProperty("--page-2-exploration-offset", `${explorationOffset.toFixed(1)}px`);
  };

  const layoutCv = () => {
    setGridHeight(page1);
    setGridHeight(page2);
    fitExperienceScale();
    setGridHeight(page1);
    updatePageOneOffsets();
    setGridHeight(page2);
    updatePageTwoOffsets();
  };

  const syncUi = () => {
    const mode = body.dataset.mode;
    const page = body.dataset.page;
    const theme = body.dataset.theme;

    if (btnModePremium && btnModeAts) {
      const premiumActive = mode === "premium";
      btnModePremium.classList.toggle("is-active", premiumActive);
      btnModeAts.classList.toggle("is-active", !premiumActive);
    }

    if (btnPage1 && btnPage2) {
      const page1Active = page === "1";
      btnPage1.classList.toggle("is-active", page1Active);
      btnPage2.classList.toggle("is-active", !page1Active);
    }

    themeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.themeValue === theme);
    });
  };

  const setTheme = (theme) => {
    const normalizedTheme = THEMES.has(theme) ? theme : "blue";
    body.dataset.theme = normalizedTheme;
    writePreference(STORAGE_KEYS.theme, normalizedTheme);
    syncUi();
    requestAnimationFrame(layoutCv);
  };

  const setMode = (mode) => {
    const normalizedMode = mode === "ats" ? "ats" : "premium";
    body.dataset.mode = normalizedMode;
    writePreference(STORAGE_KEYS.mode, normalizedMode);
    syncUi();
    requestAnimationFrame(layoutCv);
  };

  const setPage = (page) => {
    const normalizedPage = page === "2" ? "2" : "1";
    body.dataset.page = normalizedPage;
    writePreference(STORAGE_KEYS.page, normalizedPage);
    const targetPage = normalizedPage === "2" ? page2 : page1;
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    syncUi();
  };

  const printCv = () => {
    body.classList.add("is-printing");
    window.print();
  };

  if (btnModePremium) btnModePremium.addEventListener("click", () => setMode("premium"));
  if (btnModeAts) btnModeAts.addEventListener("click", () => setMode("ats"));
  if (btnPage1) btnPage1.addEventListener("click", () => setPage("1"));
  if (btnPage2) btnPage2.addEventListener("click", () => setPage("2"));
  if (btnPrint) btnPrint.addEventListener("click", printCv);
  themeButtons.forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.themeValue || "blue"));
  });

  window.addEventListener("afterprint", () => {
    body.classList.remove("is-printing");
    requestAnimationFrame(layoutCv);
  });

  window.addEventListener("beforeprint", () => {
    body.classList.add("is-printing");
  });

  window.addEventListener("resize", () => {
    requestAnimationFrame(layoutCv);
  });

  let currentVersion = null;

  const checkVersion = async () => {
    try {
      const response = await fetch("/__cv_version", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const version = await response.text();
      if (currentVersion === null) {
        currentVersion = version;
        return;
      }
      if (version !== currentVersion) {
        location.reload();
      }
    } catch (_) {
      // Ignore transient server/network issues during polling.
    }
  };

  setTheme(readPreference(STORAGE_KEYS.theme, body.dataset.theme || "blue"));
  setMode(readPreference(STORAGE_KEYS.mode, body.dataset.mode || "premium"));
  setPage(readPreference(STORAGE_KEYS.page, body.dataset.page || "1"));
  requestAnimationFrame(layoutCv);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(layoutCv));
  }
  checkVersion();
  setInterval(checkVersion, 1000);
})();
