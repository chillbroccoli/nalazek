window.addEventListener("DOMContentLoaded", () => {
  const theme = getInitialTheme();
  document.getElementById("root").setAttribute("data-theme", theme);
  changeThemeButtonsStatus();

  const footerBottom = document.querySelector(".footer-bottom p");
  const currentYear = new Date().getFullYear();

  footerBottom.textContent = `© ${currentYear} Nalazek. Wszelkie prawa zastrzeżone.`;
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
  document
    .getElementById("btn-dark")
    .classList.toggle("active", theme === "dark");
  document
    .getElementById("btn-light")
    .classList.toggle("active", theme === "light");
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
