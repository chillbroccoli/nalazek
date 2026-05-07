window.addEventListener("DOMContentLoaded", () => {
  const theme = getInitialTheme();
  document.getElementById("root").setAttribute("data-theme", theme);
  changeThemeButtonsStatus();

  document
    .getElementById("btn-dark")
    .addEventListener("click", () => setTheme("dark"));
  document
    .getElementById("btn-light")
    .addEventListener("click", () => setTheme("light"));

  const footerBottom = document.querySelector(".footer-bottom p");
  const currentYear = new Date().getFullYear();

  footerBottom.textContent = `© ${currentYear} Nalazek. Wszelkie prawa zastrzeżone.`;

  initProcessVideo();
});

function getInitialTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function changeThemeButtonsStatus() {
  const theme = localStorage.getItem("theme") ?? getInitialTheme();

  const btnDark = document.getElementById("btn-dark");
  const btnLight = document.getElementById("btn-light");

  btnDark.classList.toggle("active", theme === "dark");
  btnDark.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");

  btnLight.classList.toggle("active", theme === "light");
  btnLight.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
}

function setTheme(theme) {
  document.getElementById("root").setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  changeThemeButtonsStatus();
}

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-nav");
  const btn = document.getElementById("nav-hamburger");
  const isOpen = menu.classList.toggle("open");
  btn.classList.toggle("open", isOpen);
  btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function closeMobileMenu() {
  const menu = document.getElementById("mobile-nav");
  const btn = document.getElementById("nav-hamburger");
  menu.classList.remove("open");
  btn.classList.remove("open");
  btn.setAttribute("aria-expanded", "false");
}

function initProcessVideo() {
  const section = document.querySelector("[data-video-section]");
  const video = document.getElementById("process-video");

  if (!section || !video) {
    return;
  }

  if (shouldUseProcessVideoFallback(video)) {
    section.dataset.videoState = "fallback";
    return;
  }

  const loadVideo = () => startProcessVideoLoop(section, video);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadVideo();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(section);
    return;
  }

  loadVideo();
}

function shouldUseProcessVideoFallback(video) {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) {
    return true;
  }

  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (connection) {
    const effectiveType = connection.effectiveType || "";
    const slowConnection =
      effectiveType === "slow-2g" ||
      effectiveType === "2g" ||
      connection.downlink < 1.2;

    if (connection.saveData || slowConnection) {
      return true;
    }
  }

  const canPlayMp4 = video.canPlayType("video/mp4");

  return canPlayMp4 === "";
}

function startProcessVideoLoop(section, video) {
  const sources = (video.dataset.videoSources || "")
    .split(",")
    .map((source) => source.trim())
    .filter(Boolean);

  if (!sources.length) {
    section.dataset.videoState = "fallback";
    return;
  }

  let currentIndex = 0;

  const playCurrentVideo = () => {
    video.src = sources[currentIndex];
    video.load();

    const playPromise = video.play();

    if (playPromise) {
      playPromise.catch(() => {
        section.dataset.videoState = "fallback";
        section.classList.remove("is-video-ready");
        video.removeAttribute("src");
        video.load();
      });
    }
  };

  video.addEventListener(
    "canplay",
    () => {
      section.classList.add("is-video-ready");
    },
    { once: true },
  );

  video.addEventListener("ended", () => {
    currentIndex = (currentIndex + 1) % sources.length;
    playCurrentVideo();
  });

  video.addEventListener("error", () => {
    section.dataset.videoState = "fallback";
    section.classList.remove("is-video-ready");
    video.removeAttribute("src");
    video.load();
  });

  playCurrentVideo();
}
