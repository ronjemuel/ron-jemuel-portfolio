/* Shared navigation, project filters, and scrolling for all five pages. */
(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");
  document.addEventListener("DOMContentLoaded", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const menuButton = document.querySelector(".menu-toggle");
    const nav = document.querySelector("#primary-nav");
    const mobile = window.matchMedia("(max-width: 900px)");
    const isMenuOpen = () =>
      menuButton?.getAttribute("aria-expanded") === "true";
    function setMenu(open, restoreFocus = false) {
      nav?.classList.toggle("is-open", open);
      menuButton?.setAttribute("aria-expanded", String(open));
      menuButton?.setAttribute(
        "aria-label",
        open ? "Close navigation" : "Open navigation",
      );
      if (open) nav?.querySelector("a")?.focus();
      else if (restoreFocus) menuButton?.focus();
    }
    menuButton?.addEventListener("click", () => setMenu(!isMenuOpen()));
    nav?.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isMenuOpen()) setMenu(false, true);
    });
    document.addEventListener("click", (event) => {
      if (isMenuOpen() && !event.target.closest(".site-header")) setMenu(false);
    });
    document.querySelector(".site-header")?.addEventListener("focusout", () => {
      // Wait until the browser has moved focus before checking where it landed.
      setTimeout(() => {
        if (
          isMenuOpen() &&
          !document
            .querySelector(".site-header")
            ?.contains(document.activeElement)
        )
          setMenu(false);
      }, 0);
    });
    mobile.addEventListener("change", () => setMenu(false));

    // Keep anchor targets below the actual header, including an open mobile menu.
    const header = document.querySelector(".site-header");
    const updateHeaderOffset = () => {
      const offset = header ? Math.ceil(header.getBoundingClientRect().height) + 28 : 28;
      root.style.setProperty("--header-offset", `${offset}px`);
    };
    updateHeaderOffset();
    if (header && "ResizeObserver" in window) {
      new ResizeObserver(updateHeaderOffset).observe(header);
    } else {
      window.addEventListener("resize", updateHeaderOffset, { passive: true });
    }

    // Observe only sections below the initial viewport. No JS means no hiding.
    let revealObserver;
    const revealSection = (section) => {
      section.classList.add("is-revealed");
      revealObserver?.unobserve(section);
    };
    const configureReveals = () => {
      revealObserver?.disconnect();
      document.querySelectorAll(".reveal-pending").forEach((section) => {
        section.classList.remove("reveal-pending", "is-revealed");
      });
      if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) revealSection(entry.target);
        });
      }, { threshold: 0, rootMargin: "0px 0px 24px 0px" });
      document.querySelectorAll("main > section").forEach((section) => {
        if (section.getBoundingClientRect().top < window.innerHeight) return;
        section.classList.add("reveal-pending");
        revealObserver.observe(section);
      });
    };
    configureReveals();
    reducedMotion.addEventListener("change", configureReveals);
    document.addEventListener("focusin", (event) => {
      const section = event.target.closest(".reveal-pending");
      if (section) revealSection(section);
    });

    const filterButtons = [...document.querySelectorAll("[data-filter]")];
    const cards = [...document.querySelectorAll(".project-card")];
    const sections = [...document.querySelectorAll(".project-section")];
    const result = document.querySelector(".filter-results");
    const empty = document.querySelector(".empty-state");
    function filterProjects(category) {
      const selected = filterButtons.find(
        (button) => button.dataset.filter === category,
      );
      if (!selected) return;
      filterButtons.forEach((button) =>
        button.setAttribute("aria-pressed", String(button === selected)),
      );
      let count = 0;
      cards.forEach((card) => {
        const matches =
          category === "all" ||
          card.dataset.categories.split(" ").includes(category);
        card.hidden = !matches;
        if (matches) count += 1;
      });
      sections.forEach((section) => {
        const visibleCount = [
          ...section.querySelectorAll(".project-card"),
        ].filter((card) => !card.hidden).length;
        section.hidden = visibleCount === 0;
        const counter = section.querySelector(".section-count");
        if (counter)
          counter.textContent = `${visibleCount} ${visibleCount === 1 ? "project" : "projects"}`;
      });
      if (result)
        result.textContent =
          category === "all"
            ? `Showing all ${count} projects`
            : `Showing ${count} ${count === 1 ? "project" : "projects"} · ${selected.textContent.trim()}`;
      if (empty) empty.hidden = count !== 0;
    }
    filterButtons.forEach((button) =>
      button.addEventListener("click", () =>
        filterProjects(button.dataset.filter),
      ),
    );
    document
      .querySelector("[data-reset-filter]")
      ?.addEventListener("click", () => {
        filterProjects("all");
        filterButtons[0]?.focus();
      });
    // Cross-page project links must still reveal their card after a filter was used.
    function revealHashTarget() {
      if (!location.hash) return;
      let target;
      try {
        target = document.getElementById(
          decodeURIComponent(location.hash.slice(1)),
        );
      } catch {
        return;
      }
      if (
        target &&
        (target.matches(".project-card") ||
          target.matches(".project-section")) &&
        target.hidden
      ) {
        filterProjects("all");
        target.scrollIntoView();
      }
      const section = target?.closest(".reveal-pending");
      if (section) revealSection(section);
    }
    window.addEventListener("hashchange", revealHashTarget);
    revealHashTarget();

    const backToTop = document.querySelector(".back-to-top");
    if (backToTop) {
      const updateBackToTop = () => {
        backToTop.hidden = window.scrollY < 650;
      };
      window.addEventListener("scroll", updateBackToTop, { passive: true });
      updateBackToTop();
      backToTop.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: reducedMotion.matches ? "instant" : "smooth",
        });
        document.querySelector(".skip-link")?.focus({ preventScroll: true });
      });
    }
  });
})();
