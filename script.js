const header = document.querySelector(".header");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const navAnchors = navLinks.querySelectorAll('a[href^="#"]');
const revealEls = document.querySelectorAll(".reveal");
const reservationForm = document.getElementById("reservationForm");
const formMessage = document.getElementById("formMessage");
const heroMedia = document.querySelector(".hero-media");
const heroLights = document.querySelectorAll(".hero-light");
const sectionEls = document.querySelectorAll("main section[id]");
const narrativeSections = document.querySelectorAll("main section");
const backToTopLink = document.querySelector('.footer a[href="#top"]');
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
let lastScrollY = window.scrollY;
let lastScrollTime = performance.now();
let fastScrollTimer;

function handleHeaderState() {
  const isScrolled = window.scrollY > 25;
  header.classList.toggle("scrolled", isScrolled);
}

function isMobileNav() {
  return window.innerWidth < 980;
}

function syncNavInert() {
  if (!("inert" in navLinks)) {
    return;
  }
  if (isMobileNav()) {
    navLinks.inert = !navLinks.classList.contains("open");
  } else {
    navLinks.inert = false;
  }
}

function closeMobileNav(options = {}) {
  const { returnFocusToToggle = false } = options;
  if (!navLinks.classList.contains("open")) {
    return;
  }
  navLinks.classList.remove("open");
  navToggle.classList.remove("active");
  navToggle.setAttribute("aria-expanded", "false");
  syncNavInert();
  if (returnFocusToToggle) {
    navToggle.focus();
  }
}

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.classList.toggle("active", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  syncNavInert();
  if (isOpen && isMobileNav()) {
    requestAnimationFrame(() => {
      const first = navLinks.querySelector("a");
      if (first) {
        first.focus();
      }
    });
  }
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (targetId === "#top") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (window.innerWidth < 980) {
      closeMobileNav();
    }
  });
});

document.addEventListener("click", (event) => {
  const clickInsideMenu = navLinks.contains(event.target);
  const clickOnToggle = navToggle.contains(event.target);
  if (!clickInsideMenu && !clickOnToggle && navLinks.classList.contains("open")) {
    closeMobileNav({ returnFocusToToggle: true });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navLinks.classList.contains("open")) {
    event.preventDefault();
    closeMobileNav({ returnFocusToToggle: true });
  }
});

if (backToTopLink) {
  backToTopLink.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    updateActiveNav();
  });
}

function updateActiveNav() {
  if (window.scrollY < 80) {
    navAnchors.forEach((anchor) => {
      const targetId = anchor.getAttribute("href").slice(1);
      anchor.classList.toggle("active", targetId === "top");
    });
    return;
  }

  const viewportMiddle = window.scrollY + window.innerHeight * 0.35;
  let activeId = "hero";

  sectionEls.forEach((section) => {
    if (viewportMiddle >= section.offsetTop - 80) {
      activeId = section.id;
    }
  });

  navAnchors.forEach((anchor) => {
    const targetId = anchor.getAttribute("href").slice(1);
    anchor.classList.toggle("active", targetId === activeId);
  });
}

function onScroll() {
  const now = performance.now();
  const deltaY = Math.abs(window.scrollY - lastScrollY);
  const deltaT = Math.max(16, now - lastScrollTime);
  const velocity = deltaY / deltaT;
  document.body.classList.toggle("fast-scroll", velocity > 1.9);
  lastScrollY = window.scrollY;
  lastScrollTime = now;

  clearTimeout(fastScrollTimer);
  fastScrollTimer = setTimeout(() => {
    document.body.classList.remove("fast-scroll");
  }, 180);

  handleHeaderState();
  updateActiveNav();
}

function assignRevealDelays() {
  narrativeSections.forEach((section) => {
    const items = section.querySelectorAll(".reveal");
    items.forEach((item, index) => {
      const isPanel = item.matches(".menu-panel, .card, .review, .contact-card, .gallery-item");
      const staggerStep = isPanel ? 110 : 75;
      const clampedOrder = Math.min(index, 10);
      item.style.setProperty("--reveal-delay", `${clampedOrder * staggerStep}ms`);
      item.style.setProperty("--reveal-y", isPanel ? "24px" : "18px");
      item.style.setProperty("--reveal-x", clampedOrder % 2 === 0 ? "-24px" : "24px");
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("visible", entry.isIntersecting);
    });
  },
  { threshold: 0.12, rootMargin: "10% 0px -10% 0px" }
);

revealEls.forEach((el) => observer.observe(el));
assignRevealDelays();

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("in-view", entry.isIntersecting);
    });
  },
  { threshold: 0.22, rootMargin: "-6% 0px -14% 0px" }
);

narrativeSections.forEach((section) => sectionObserver.observe(section));

const submitBtn = reservationForm.querySelector('button[type="submit"]');
const defaultSubmitLabel = submitBtn ? submitBtn.textContent : "";

reservationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(reservationForm);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const date = String(data.get("date") || "").trim();
  const time = String(data.get("time") || "").trim();
  const guests = Number(data.get("guests"));
  const occasion = String(data.get("occasion") || "").trim();

  formMessage.className = "form-message";

  if (!name || !email || !date || !time || !occasion || !Number.isFinite(guests)) {
    formMessage.textContent = "Please complete all required fields to continue.";
    formMessage.classList.add("error");
    return;
  }

  if (guests < 1 || guests > 12) {
    formMessage.textContent = "Guest count must be between 1 and 12.";
    formMessage.classList.add("error");
    return;
  }

  const runSuccess = () => {
    formMessage.className = "form-message";
    formMessage.textContent = `Confirmed, ${name}. Your ${time} tasting request for ${guests} guest(s) has been sent. Concierge confirmation follows shortly.`;
    formMessage.classList.add("success");
    reservationForm.reset();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
      submitBtn.textContent = defaultSubmitLabel;
    }
  };

  if (submitBtn && !prefersReducedMotion) {
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    submitBtn.textContent = "Sending...";
    window.setTimeout(runSuccess, 420);
  } else {
    runSuccess();
  }
});

const dateInput = reservationForm.querySelector('input[name="date"]');
if (dateInput) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  dateInput.min = `${y}-${m}-${day}`;
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth >= 980) {
    closeMobileNav();
  }
  syncNavInert();
});
handleHeaderState();
updateActiveNav();
syncNavInert();

if (!prefersReducedMotion && finePointer) {
  window.addEventListener("mousemove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    heroMedia.style.transform = `scale(1.1) translate(${x * -8}px, ${y * -8}px)`;

    heroLights.forEach((light, index) => {
      const intensity = (index + 1) * 3;
      light.style.transform = `translate(${x * intensity}px, ${y * intensity}px)`;
    });
  });
}
