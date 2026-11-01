// js/script.js

import { helplineData } from "./data.js";
import {
  elements,
  renderList,
  renderCategoryTabs,
  updateUIText,
  setTheme,
  updateInsightPanel,
  updateMetricsPanel,
} from "./ui.js";

let currentLang = "en";
let sortedHelplineData = [...helplineData];
let anomalySummary = { invalidPhones: 0, duplicatePhones: 0 };

const defaultMetrics = {
  searches: 0,
  calls: 0,
  shares: 0,
  copies: 0,
  feedbackUseful: 0,
  feedbackNotUseful: 0,
  serviceClicks: {},
};

let appMetrics = loadMetrics();

const intentLexicon = {
  Emergency: [
    "emergency", "urgent", "ambulance", "fire", "police", "आणीबाणी", "आपातकाल", "तत्काल", "पोलिस", "पोलीस",
  ],
  Medical: [
    "hospital", "doctor", "clinic", "medical", "health", "medicine", "रुग्णालय", "अस्पताल", "डॉक्टर", "चिकित्सा", "वैद्यकीय",
  ],
  "Blood Banks": ["blood", "blood bank", "रक्त", "ब्लड"],
  Helplines: ["help", "helpline", "support", "सहाय्य", "मदद", "हेल्पलाइन"],
  Transport: ["metro", "bus", "railway", "airport", "train", "वाहतूक", "परिवहन"],
};

function loadMetrics() {
  try {
    const saved = JSON.parse(localStorage.getItem("appMetrics"));
    return { ...defaultMetrics, ...(saved || {}) };
  } catch {
    return { ...defaultMetrics };
  }
}

function saveMetrics() {
  localStorage.setItem("appMetrics", JSON.stringify(appMetrics));
}

function incMetric(key, serviceName) {
  appMetrics[key] = (appMetrics[key] || 0) + 1;
  if (serviceName) {
    appMetrics.serviceClicks[serviceName] =
      (appMetrics.serviceClicks[serviceName] || 0) + 1;
  }
  saveMetrics();
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function normalizePhone(phone) {
  return phone.replace(/[^\d]/g, "");
}

function detectAnomalies(data) {
  const phoneMap = new Map();
  let invalidPhones = 0;
  let duplicatePhones = 0;

  data.forEach((item) => {
    const normalized = normalizePhone(item.phone);
    if (!/^\d{3,15}$/.test(normalized)) invalidPhones += 1;
    if (phoneMap.has(normalized)) duplicatePhones += 1;
    phoneMap.set(normalized, true);
  });

  return { invalidPhones, duplicatePhones };
}

function inferIntent(query) {
  if (!query) return { category: null, urgency: "Normal", confidence: "Low" };
  const lowerQuery = query.toLowerCase();
  const categoryScores = {};
  let totalMatches = 0;

  Object.entries(intentLexicon).forEach(([category, keywords]) => {
    categoryScores[category] = keywords.reduce((score, term) => {
      if (lowerQuery.includes(term)) {
        totalMatches += 1;
        return score + 1;
      }
      return score;
    }, 0);
  });

  const [topCategory, topScore] =
    Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0] || [];

  const urgencyKeywords = ["urgent", "emergency", "तत्काल", "आणीबाणी", "आपातकाल"];
  const urgency = urgencyKeywords.some((term) => lowerQuery.includes(term))
    ? "High"
    : "Normal";

  if (!topCategory || topScore === 0) {
    return { category: null, urgency, confidence: "Low" };
  }
  if (topScore >= 2 || totalMatches >= 3) {
    return { category: topCategory, urgency, confidence: "High" };
  }
  return { category: topCategory, urgency, confidence: "Medium" };
}

function getDemandProfile(category) {
  const hour = new Date().getHours();
  const isPeak = (hour >= 9 && hour <= 12) || (hour >= 18 && hour <= 21);
  const base = {
    Emergency: { demand: "High", wait: "10-25 min", bestTime: "Immediate only" },
    Medical: { demand: isPeak ? "High" : "Medium", wait: isPeak ? "20-45 min" : "10-25 min", bestTime: "Early morning" },
    "Blood Banks": { demand: "Medium", wait: "10-20 min", bestTime: "10 AM - 1 PM" },
    Helplines: { demand: "Medium", wait: "3-10 min", bestTime: "Non-peak afternoon" },
  };

  return (
    base[category] || {
      demand: isPeak ? "Medium" : "Low",
      wait: isPeak ? "10-20 min" : "5-10 min",
      bestTime: "Midday",
    }
  );
}

function popularityScore(serviceName) {
  const clicks = appMetrics.serviceClicks[serviceName] || 0;
  return Math.min(1, Math.log1p(clicks) / Math.log(20));
}

function confidenceBucket(score) {
  if (score >= 0.75) return "High";
  if (score >= 0.5) return "Medium";
  return "Low";
}

function enrichAndRank(data, query, activeCategory) {
  const intent = inferIntent(query);
  const lowerQuery = query.toLowerCase();

  const scored = data.map((item) => {
    const translated = item.translations[currentLang];
    const demandProfile = getDemandProfile(item.category);

    const distRaw = item.distance === Infinity ? 0 : 1 / (1 + item.distance);
    const intentRaw = intent.category && item.category === intent.category ? 1 : 0;
    const popularityRaw = popularityScore(translated.service);
    const queryRaw =
      !query
        ? 0.3
        : Number(
            translated.service.toLowerCase().includes(lowerQuery) ||
              translated.address.toLowerCase().includes(lowerQuery) ||
              item.phone.includes(lowerQuery)
          );
    const categoryRaw =
      activeCategory === "All" || item.category === activeCategory ? 1 : 0;

    const score =
      0.34 * distRaw +
      0.22 * intentRaw +
      0.18 * popularityRaw +
      0.16 * queryRaw +
      0.1 * categoryRaw;

    return {
      ...item,
      ml: {
        score,
        confidence: confidenceBucket(score),
        intentCategory: intent.category || "General",
        urgency: intent.urgency,
        demandLevel: demandProfile.demand,
        waitLabel: demandProfile.wait,
        bestTimeHint: demandProfile.bestTime,
      },
    };
  });

  return {
    intent,
    results: scored.sort((a, b) => b.ml.score - a.ml.score),
  };
}

function applyFiltersAndRender() {
  const query = elements.searchInput.value.trim();
  const activeCategory =
    document.querySelector(".category-tab.gradient-border-active")?.dataset
      .category || "All";

  let baseData = sortedHelplineData;
  if (activeCategory !== "All") {
    baseData = baseData.filter((c) => c.category === activeCategory);
  }

  const { intent, results } = enrichAndRank(baseData, query, activeCategory);
  const filteredResults = query
    ? results.filter((c) => {
        const t = c.translations[currentLang];
        const q = query.toLowerCase();
        return (
          t.service.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      })
    : results;

  renderList(filteredResults, currentLang);
  updateInsightPanel(
    `Intent: ${intent.category || "General"} | Urgency: ${intent.urgency} | Confidence: ${intent.confidence} | Anomalies: ${anomalySummary.invalidPhones + anomalySummary.duplicatePhones}`
  );
  updateMetricsPanel(
    `Searches: ${appMetrics.searches} · Calls: ${appMetrics.calls} · Shares: ${appMetrics.shares} · Copies: ${appMetrics.copies} · Useful feedback: ${appMetrics.feedbackUseful}`
  );
}

function requestLocationAndRender() {
  elements.locationLoader.classList.remove("hidden");
  elements.helplineList.innerHTML = "";
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sortedHelplineData = helplineData.map((service) => ({
          ...service,
          distance:
            service.lat !== 0 && service.lon !== 0
              ? haversineDistance(latitude, longitude, service.lat, service.lon)
              : Infinity,
        }));
        elements.locationLoader.classList.add("hidden");
        applyFiltersAndRender();
      },
      () => {
        sortedHelplineData = helplineData.map((service) => ({
          ...service,
          distance: Infinity,
        }));
        elements.locationLoader.classList.add("hidden");
        applyFiltersAndRender();
      }
    );
  } else {
    sortedHelplineData = helplineData.map((service) => ({
      ...service,
      distance: Infinity,
    }));
    elements.locationLoader.classList.add("hidden");
    applyFiltersAndRender();
  }
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("language", lang);
  updateUIText(currentLang);
  const categories = ["All", ...new Set(helplineData.map((c) => c.category))];
  renderCategoryTabs(categories, currentLang);
  applyFiltersAndRender();

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("gradient-border-active", btn.dataset.lang === lang);
  });
}

function handleRouteChange() {
  const isMainPage = window.location.hash === "#main";
  elements.landingPage.classList.toggle("hidden", isMainPage);
  elements.mainApp.classList.toggle("hidden", !isMainPage);
  if (isMainPage) {
    elements.mainApp.classList.add("fade-in");
    requestLocationAndRender();
  } else {
    elements.mainApp.classList.remove("fade-in");
  }
}

function setupEventListeners() {
  elements.themeToggleBtn.addEventListener("click", () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });

  elements.languageSwitcher.addEventListener("click", (e) => {
    if (e.target.classList.contains("lang-btn")) {
      setLanguage(e.target.dataset.lang);
    }
  });

  elements.enterButton.addEventListener("click", () => {
    history.pushState({ page: "main" }, "Main Page", "#main");
    handleRouteChange();
  });

  elements.backToHomeBtn.addEventListener("click", () => {
    history.pushState({ page: "home" }, "Home Page", "#");
    handleRouteChange();
  });

  window.addEventListener("popstate", handleRouteChange);

  elements.searchInput.addEventListener("input", () => {
    if (elements.searchInput.value.trim()) incMetric("searches");
    applyFiltersAndRender();
  });

  elements.helplineList.addEventListener("click", (e) => {
    const copyBtn = e.target.closest(".copy-btn");
    const shareBtn = e.target.closest(".share-btn");
    const callBtn = e.target.closest(".call-btn");
    const feedbackBtn = e.target.closest(".feedback-btn");

    if (copyBtn) {
      const phone = copyBtn.dataset.phone;
      navigator.clipboard.writeText(phone).then(() => {
        incMetric("copies");
        const icon = copyBtn.querySelector("i");
        icon.setAttribute("data-feather", "check");
        feather.replace({ width: "20px", height: "20px" });
        setTimeout(() => {
          icon.setAttribute("data-feather", "copy");
          feather.replace({ width: "20px", height: "20px" });
        }, 1500);
      });
    }

    if (shareBtn) {
      const service = shareBtn.dataset.serviceName;
      const phone = shareBtn.dataset.phone;
      const address = shareBtn.dataset.address;
      incMetric("shares", service);
      navigator.share({
        title: `Pune Seva Sahyog: ${service}`,
        text: `${service}\nPhone: ${phone}\nAddress: ${address}`,
      });
    }

    if (callBtn) {
      const service = callBtn.dataset.serviceName;
      incMetric("calls", service);
    }

    if (feedbackBtn) {
      const type = feedbackBtn.dataset.feedback;
      const service = feedbackBtn.dataset.serviceName;
      if (type === "useful") incMetric("feedbackUseful", service);
      if (type === "not_useful") incMetric("feedbackNotUseful", service);
      applyFiltersAndRender();
    }
  });

  elements.categoryTabsContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("category-tab")) return;
    document
      .querySelectorAll(".category-tab")
      .forEach((t) => t.classList.remove("gradient-border-active"));
    e.target.classList.add("gradient-border-active");
    elements.searchInput.value = "";
    applyFiltersAndRender();
  });
}

function init() {
  setTheme(localStorage.getItem("theme") || "dark");
  anomalySummary = detectAnomalies(helplineData);
  const savedLang = localStorage.getItem("language") || "en";
  setLanguage(savedLang);

  let starsHTML = "";
  for (let i = 0; i < 100; i++) {
    starsHTML += `<div class="stars" style="top:${
      Math.random() * 2000
    }px;left:${Math.random() * 100}%;animation-delay:${
      Math.random() * 20
    }s;animation-duration:${100 + Math.random() * 10}s;"></div>`;
  }
  elements.starsContainer.innerHTML = starsHTML;

  feather.replace();
  setupEventListeners();
  handleRouteChange();
}

document.addEventListener("DOMContentLoaded", init);