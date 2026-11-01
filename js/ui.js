// js/ui.js

import { uiStrings, categoryTranslations } from "./data.js";

// A single object to hold all DOM element references
export const elements = {
  landingPage: document.getElementById("landingPage"),
  mainApp: document.getElementById("mainApp"),
  enterButton: document.getElementById("enterButton"),
  backToHomeBtn: document.getElementById("backToHomeBtn"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  languageSwitcher: document.getElementById("languageSwitcher"),
  sunIcon: document.getElementById("sunIcon"),
  moonIcon: document.getElementById("moonIcon"),
  helplineList: document.getElementById("helplineList"),
  searchInput: document.getElementById("searchInput"),
  notFoundMessage: document.getElementById("notFoundMessage"),
  categoryTabsContainer: document.getElementById("categoryTabs"),
  starsContainer: document.getElementById("stars-container"),
  locationLoader: document.getElementById("locationLoader"),
  mlInsightText: document.getElementById("mlInsightText"),
  metricsText: document.getElementById("metricsText"),
};

function getChipClass(label) {
  if (label === "High") return "chip chip-high";
  if (label === "Medium") return "chip chip-medium";
  if (label === "Low") return "chip chip-low";
  return "chip";
}

export function renderList(contacts, currentLang) {
  elements.helplineList.innerHTML = "";
  const filteredData = contacts.reduce((acc, contact) => {
    (acc[contact.category] = acc[contact.category] || []).push(contact);
    return acc;
  }, {});
  elements.notFoundMessage.classList.toggle("hidden", contacts.length > 0);

  if (contacts.length === 0) {
    feather.replace(); // To render the "not found" icon
  }

  for (const categoryKey in filteredData) {
    const categoryWrapper = document.createElement("div");
    categoryWrapper.className = "reveal-on-scroll";
    const categoryName = categoryTranslations[categoryKey]?.[currentLang] || categoryKey;
    categoryWrapper.innerHTML = `<h2 class="text-2xl font-bold text-[var(--accent-color)] mb-4">${categoryName}</h2>`;
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";

    filteredData[categoryKey].forEach((contact) => {
      const item = document.createElement("div");
      item.className =
        "glass-card p-5 rounded-xl flex flex-col justify-between reveal-on-scroll";
      const contactInfo = contact.translations[currentLang];
      const ml = contact.ml || {};
      const confidence = ml.confidence || "Low";
      const demand = ml.demandLevel || "Unknown";
      const waitHint = ml.waitLabel || "N/A";
      const bestTime = ml.bestTimeHint || "Any time";
      const confidenceLabel = uiStrings[currentLang].confidenceLabel || "Confidence";
      const demandLabel = uiStrings[currentLang].demandLabel || "Demand";
      const waitLabel = uiStrings[currentLang].waitLabel || "Wait";
      const bestTimeLabel = uiStrings[currentLang].bestTimeLabel || "Best time";
      const feedbackPrompt = uiStrings[currentLang].feedbackPrompt || "Was this suggestion useful?";
      const usefulLabel = uiStrings[currentLang].feedbackUseful || "Useful";
      const notUsefulLabel = uiStrings[currentLang].feedbackNotUseful || "Not useful";
      let distanceInfo =
        contact.distance && contact.distance !== Infinity
          ? `<p class="text-xs text-[var(--accent-color)] font-semibold">(${
              uiStrings[currentLang].approx
            } ${contact.distance.toFixed(1)} ${
              uiStrings[currentLang].distanceAway
            })</p>`
          : "";
      const shareButton = navigator.share
        ? `<button class="action-icon share-btn" aria-label="${uiStrings[currentLang].ariaShare}" data-service-name="${contactInfo.service}" data-phone="${contact.phone}" data-address="${contactInfo.address}"><i data-feather="share-2" class="w-5 h-5 pointer-events-none"></i></button>`
        : "";
      const mapButton =
        contact.lat !== 0
          ? `<a href="https://maps.google.com/?q=${contact.lat},${contact.lon}" target="_blank" class="action-icon" aria-label="${uiStrings[currentLang].ariaMap}"><i data-feather="map" class="w-5 h-5"></i></a>`
          : "";

      item.innerHTML = `
          <div>
              <div class="flex justify-between items-start">
                  <div class="pr-4">
                      <p class="text-xl font-semibold text-[var(--text-primary)]">${contactInfo.service}</p>
                      ${distanceInfo}
                  </div>
                  <div class="flex items-center flex-shrink-0 text-[var(--text-secondary)]">
                      ${shareButton}
                      <button class="action-icon copy-btn" aria-label="${uiStrings[currentLang].ariaCopy}" data-phone="${contact.phone}"><i data-feather="copy" class="w-5 h-5 pointer-events-none"></i></button>
                      ${mapButton}
                  </div>
              </div>
              <div class="flex items-start text-[var(--text-secondary)] text-sm mt-2">
                  <i data-feather="map-pin" aria-hidden="true" class="w-4 h-4 mr-2 mt-1 flex-shrink-0"></i>
                  <p>${contactInfo.address}</p>
              </div>
              <div class="mt-2">
                  <span class="${getChipClass(confidence)}">${confidenceLabel}: ${confidence}</span>
                  <span class="chip">${demandLabel}: ${demand}</span>
                  <span class="chip">${waitLabel}: ${waitHint}</span>
              </div>
              <p class="text-xs text-[var(--text-secondary)] mt-2">${bestTimeLabel}: ${bestTime}</p>
              <div class="mt-3">
                 <p class="text-xs text-[var(--text-secondary)]">${feedbackPrompt}</p>
                 <button class="feedback-btn mt-1" data-feedback="useful" data-service-name="${contactInfo.service}">${usefulLabel}</button>
                 <button class="feedback-btn mt-1" data-feedback="not_useful" data-service-name="${contactInfo.service}">${notUsefulLabel}</button>
              </div>
          </div>
          <a href="tel:${contact.phone}" data-service-name="${contactInfo.service}" class="call-btn mt-4 w-full bg-teal-600 text-white font-bold py-3 px-5 rounded-lg flex items-center justify-center space-x-2 transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-400 active:scale-95">
              <i data-feather="phone-call" aria-hidden="true" stroke-width="2.5" width="20" height="20"></i>
              <span>${uiStrings[currentLang].call} ${contact.phone}</span>
          </a>`;
      grid.appendChild(item);
    });
    categoryWrapper.appendChild(grid);
    elements.helplineList.appendChild(categoryWrapper);
  }
  feather.replace();
  setupScrollAnimations();
}

export function renderCategoryTabs(categories, currentLang) {
  elements.categoryTabsContainer.innerHTML = categories
    .map((categoryKey) => {
      if (!categoryKey || !categoryTranslations[categoryKey]) return "";
      const categoryName = categoryTranslations[categoryKey][currentLang];
      return `<button class="category-tab flex-shrink-0 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] rounded-lg transition-all duration-200 border-2 border-transparent hover:border-[var(--accent-color)]" data-category="${categoryKey}">${categoryName}</button>`;
    })
    .join("");
  elements.categoryTabsContainer
    .querySelector(".category-tab")
    .classList.add("gradient-border-active");
}

export function updateUIText(currentLang) {
  const translations = uiStrings[currentLang];
  document.querySelectorAll("[data-translate-key]").forEach((el) => {
    const key = el.dataset.translateKey;
    if (translations[key]) {
      if (el.tagName === "INPUT") {
        el.placeholder = translations[key];
      } else {
        el.textContent = translations[key];
      }
    }
  });
  document.documentElement.lang = currentLang;
}

export function updateInsightPanel(text) {
  if (elements.mlInsightText) elements.mlInsightText.textContent = text;
}

export function updateMetricsPanel(text) {
  if (elements.metricsText) elements.metricsText.textContent = text;
}

export function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  elements.sunIcon.classList.toggle("hidden", theme === "dark");
  elements.moonIcon.classList.toggle("hidden", theme === "light");
  localStorage.setItem("theme", theme);
}

export function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document
    .querySelectorAll(".reveal-on-scroll")
    .forEach((el) => observer.observe(el));
}