window.addEventListener("DOMContentLoaded", () => {
  const footerBottom = document.querySelector(".footer-bottom p");
  const currentYear = new Date().getFullYear();
  footerBottom.textContent = `© ${currentYear} Nalazek. Wszelkie prawa zastrzeżone.`;

  initProcessVideo();
  initContactForm();
  initGallery();
});

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

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const submitBtn = document.getElementById("form-submit-btn");
  const successBanner = document.getElementById("form-banner-success");
  const errorBanner = document.getElementById("form-banner-error");

  const validatedFields = [
    { el: document.getElementById("cf-name"), group: document.getElementById("fg-name"), type: "text" },
    { el: document.getElementById("cf-email"), group: document.getElementById("fg-email"), type: "email" },
    { el: document.getElementById("cf-message"), group: document.getElementById("fg-message"), type: "text" },
  ];

  validatedFields.forEach(({ el, group, type }) => {
    if (!el) return;

    el.addEventListener("input", () => {
      if (group.classList.contains("has-error")) {
        group.classList.toggle("has-error", !isFieldValid(el, type));
      }
    });

    el.addEventListener("blur", () => {
      if (el.value.trim() !== "" || el.required) {
        group.classList.toggle("has-error", !isFieldValid(el, type));
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let allValid = true;
    validatedFields.forEach(({ el, group, type }) => {
      const valid = isFieldValid(el, type);
      group.classList.toggle("has-error", !valid);
      if (!valid) allValid = false;
    });

    if (!allValid) {
      const firstError = form.querySelector(".form-group.has-error input, .form-group.has-error textarea");
      firstError?.focus();
      return;
    }

    errorBanner.hidden = true;
    setFormLoading(true);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Submission failed");
      }

      showFormSuccess();
    } catch {
      setFormLoading(false);
      errorBanner.hidden = false;
    }
  });

  function isFieldValid(el, type) {
    const val = el.value.trim();
    if (el.required && val === "") return false;
    if (type === "email" && val !== "") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }
    return true;
  }

  function setFormLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle("is-loading", loading);
  }

  function showFormSuccess() {
    form.querySelectorAll(".form-row, .form-group, .form-actions").forEach((el) => {
      el.hidden = true;
    });
    successBanner.hidden = false;
  }
}

function initGallery() {
  const tabs = document.querySelectorAll(".gallery-tab");
  const items = document.querySelectorAll(".gallery-item");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCounter = document.getElementById("lightbox-counter");

  if (!lightbox) return;

  let currentIndex = 0;

  // --- Category filter ---
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const filter = tab.dataset.filter;

      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      items.forEach((item) => {
        if (filter === "all" || item.dataset.category === filter) {
          item.classList.remove("hidden");
        } else {
          item.classList.add("hidden");
        }
      });
    });
  });

  // --- Lightbox ---
  function getVisibleItems() {
    return Array.from(document.querySelectorAll(".gallery-item:not(.hidden)"));
  }

  function showImage(idx) {
    const visible = getVisibleItems();
    currentIndex = ((idx % visible.length) + visible.length) % visible.length;
    const item = visible[currentIndex];
    const img = item.querySelector("img");
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCounter.textContent = `${currentIndex + 1} / ${visible.length}`;
  }

  function openLightbox(idx) {
    showImage(idx);
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
    document.getElementById("lightbox-close").focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
    lightboxImg.src = "";
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const visible = getVisibleItems();
      const idx = visible.indexOf(item);
      if (idx !== -1) openLightbox(idx);
    });
  });

  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);

  document.getElementById("lightbox-prev").addEventListener("click", () => {
    showImage(currentIndex - 1);
  });

  document.getElementById("lightbox-next").addEventListener("click", () => {
    showImage(currentIndex + 1);
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showImage(currentIndex - 1);
    if (e.key === "ArrowRight") showImage(currentIndex + 1);
  });

  // Touch swipe support
  let touchStartX = 0;
  lightbox.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) showImage(currentIndex + 1);
      else showImage(currentIndex - 1);
    }
  }, { passive: true });
}
