const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const navSectionLinks = nav ? [...nav.querySelectorAll("[data-nav-section]")] : [];

const updateNavSelection = () => {
  const section = window.location.hash === "#about"
    ? "about"
    : window.location.hash === "#contact"
      ? "contact"
      : "home";

  navSectionLinks.forEach((link) => {
    if (link.dataset.navSection === section) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
};

updateNavSelection();
window.addEventListener("hashchange", updateNavSelection);

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", () => {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
}

const reveals = document.querySelectorAll(".reveal");

const homeHero = document.querySelector("[data-home-hero]");

if (homeHero) {
  const layers = [...homeHero.querySelectorAll("[data-home-layer]")];
  const interactiveLayers = layers.filter((layer) => layer.dataset.bounds);
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const pointerMotion = new Map(interactiveLayers.map((layer) => [layer, {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  }]));
  let pointerFrame = 0;

  const renderPointerLayers = () => {
    let moving = false;

    pointerMotion.forEach((motion, layer) => {
      motion.x += (motion.targetX - motion.x) * .08;
      motion.y += (motion.targetY - motion.y) * .08;

      if (Math.abs(motion.targetX - motion.x) < .02) motion.x = motion.targetX;
      else moving = true;
      if (Math.abs(motion.targetY - motion.y) < .02) motion.y = motion.targetY;
      else moving = true;

      layer.style.translate = `${motion.x.toFixed(2)}px ${motion.y.toFixed(2)}px`;
    });

    pointerFrame = moving ? window.requestAnimationFrame(renderPointerLayers) : 0;
  };

  const startPointerMotion = () => {
    if (!pointerFrame) pointerFrame = window.requestAnimationFrame(renderPointerLayers);
  };

  const resetPointerLayers = () => {
    interactiveLayers.forEach((layer) => {
      layer.classList.remove("is-pointer-active");
      const motion = pointerMotion.get(layer);
      motion.targetX = 0;
      motion.targetY = 0;
    });
    startPointerMotion();
  };

  const updatePointerLayers = (event) => {
    if (!homeHero.classList.contains("is-interactive")) return;

    const rect = homeHero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 100;
    const y = (event.clientY - rect.top) / rect.height * 100;
    const activeLayer = [...interactiveLayers].reverse().find((layer) => {
      const [left, top, right, bottom] = layer.dataset.bounds.split(",").map(Number);
      return x >= left - 1.2 && x <= right + 1.2 && y >= top - 1.2 && y <= bottom + 1.2;
    });

    interactiveLayers.forEach((layer) => {
      const active = layer === activeLayer;
      const motion = pointerMotion.get(layer);
      layer.classList.toggle("is-pointer-active", active);
      if (!active) {
        motion.targetX = 0;
        motion.targetY = 0;
        return;
      }

      const [left, top, right, bottom] = layer.dataset.bounds.split(",").map(Number);
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      const depth = Number(layer.dataset.depth || 6);
      const maxMove = depth <= 5 ? 4 : 7;
      const normalize = (value) => {
        const clamped = Math.max(-1, Math.min(1, value));
        if (Math.abs(clamped) < .08) return 0;
        return Math.sign(clamped) * (Math.abs(clamped) - .08) / .92;
      };
      motion.targetX = normalize((x - centerX) / Math.max(1, (right - left) / 2)) * maxMove;
      motion.targetY = normalize((y - centerY) / Math.max(1, (bottom - top) / 2)) * maxMove;
    });

    startPointerMotion();
  };

  Promise.all(layers.map((layer) => layer.decode?.().catch(() => undefined))).then(() => {
    window.requestAnimationFrame(() => homeHero.classList.add("is-animated"));
    window.setTimeout(() => homeHero.classList.add("is-interactive"), 1900);
  });

  if (finePointer.matches) {
    homeHero.addEventListener("pointermove", updatePointerLayers);
    homeHero.addEventListener("pointerleave", resetPointerLayers);
  }
}

const thanksSection = document.querySelector(".thanks-layered");

if (thanksSection) {
  if ("IntersectionObserver" in window) {
    const thanksObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      thanksSection.classList.add("is-animated");
      observer.disconnect();
    }, { threshold: 0.55 });

    thanksObserver.observe(thanksSection);
  } else {
    thanksSection.classList.add("is-animated");
  }
}

document.querySelectorAll("[data-entry-section]").forEach((section) => {
  const animate = () => {
    Promise.all([...section.querySelectorAll("img")].map((image) => image.decode?.().catch(() => undefined)))
      .then(() => window.requestAnimationFrame(() => section.classList.add("is-animated")));
  };

  if (!("IntersectionObserver" in window)) {
    animate();
    return;
  }

  const entryObserver = new IntersectionObserver((entries, observer) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    animate();
    observer.disconnect();
  }, { rootMargin: "0px 0px -8%", threshold: 0.28 });

  entryObserver.observe(section);
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add("is-visible"));
}

const toast = document.querySelector("[data-toast]");
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      showToast("微信号已复制");
    } catch {
      const input = document.createElement("input");
      input.value = value;
      input.setAttribute("readonly", "");
      document.body.append(input);
      input.select();
      try {
        const copied = document.execCommand("copy");
        showToast(copied ? "微信号已复制" : "复制失败，请手动复制微信号");
      } catch {
        showToast("复制失败，请手动复制微信号");
      } finally {
        input.remove();
      }
    }
  });
});

const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
const lightboxTitle = lightbox?.querySelector("[data-lightbox-title]");

if (lightbox && lightboxImage && lightboxTitle) {
  let galleryCards = [];
  const controls = lightbox.querySelector("[data-lightbox-controls]");
  const counter = lightbox.querySelector("[data-lightbox-counter]");
  const figure = lightbox.querySelector("figure");
  const closeButton = lightbox.querySelector("[data-lightbox-close]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let imageIndex = -1;
  let changingImage = false;
  let transitionVersion = 0;
  let outgoingImage;
  let slideAnimations = [];
  let closingLightbox = false;

  const clearImageTransition = () => {
    transitionVersion += 1;
    slideAnimations.forEach((animation) => animation.cancel());
    slideAnimations = [];
    outgoingImage?.remove();
    outgoingImage = null;
    changingImage = false;
  };

  const closeLightbox = () => {
    if (!lightbox.open || closingLightbox) return;
    if (!lightbox.classList.contains("art-lightbox--gallery") || reducedMotion.matches) {
      lightbox.close();
      return;
    }

    closingLightbox = true;
    transitionVersion += 1;
    slideAnimations.forEach((animation) => animation.pause());
    const figureStyle = getComputedStyle(figure);
    figure.style.setProperty("--lightbox-close-opacity", figureStyle.opacity);
    figure.style.setProperty("--lightbox-close-transform", figureStyle.transform);
    [controls, closeButton].forEach((element) => {
      element.style.setProperty("--lightbox-close-opacity", getComputedStyle(element).opacity);
    });
    const backdropStyle = getComputedStyle(lightbox, "::backdrop");
    lightbox.style.setProperty("--lightbox-close-backdrop", backdropStyle.backgroundColor);
    lightbox.style.setProperty("--lightbox-close-blur", backdropStyle.backdropFilter);
    lightbox.classList.add("is-closing");
  };

  figure.addEventListener("animationend", (event) => {
    if (event.target === figure && event.animationName === "gallery-lightbox-close" && closingLightbox) {
      lightbox.close();
    }
  });

  const showImage = (card) => {
    lightboxImage.src = card.dataset.lightboxSrc;
    lightboxImage.alt = card.dataset.lightboxTitle;
    lightboxTitle.textContent = card.dataset.lightboxTitle;
    if (imageIndex < 0) return;
    counter.textContent = `${String(imageIndex + 1).padStart(2, "0")} / ${String(galleryCards.length).padStart(2, "0")}`;
    [-1, 1].forEach((direction) => {
      const next = (imageIndex + direction + galleryCards.length) % galleryCards.length;
      new Image().src = galleryCards[next].dataset.lightboxSrc;
    });
  };

  const changeImage = async (direction) => {
    if (imageIndex < 0 || changingImage || closingLightbox) return;
    changingImage = true;
    const version = ++transitionVersion;
    const nextIndex = (imageIndex + direction + galleryCards.length) % galleryCards.length;
    const nextImage = new Image();
    nextImage.src = galleryCards[nextIndex].dataset.lightboxSrc;

    try {
      await nextImage.decode();
      if (version !== transitionVersion || !lightbox.open) return;

      if (!reducedMotion.matches) {
        outgoingImage = lightboxImage.cloneNode();
        outgoingImage.removeAttribute("data-lightbox-image");
        outgoingImage.setAttribute("aria-hidden", "true");
        outgoingImage.alt = "";
        lightboxImage.parentElement.append(outgoingImage);
      }

      imageIndex = nextIndex;
      showImage(galleryCards[imageIndex]);

      if (outgoingImage) {
        const options = { duration: 480, easing: "cubic-bezier(.22,.61,.36,1)", fill: "both" };
        slideAnimations = [
          outgoingImage.animate([
            { opacity: 1, transform: "translateX(0)" },
            { opacity: 0, transform: `translateX(${-direction * 36}px)` },
          ], options),
          lightboxImage.animate([
            { opacity: 0, transform: `translateX(${direction * 36}px)` },
            { opacity: 1, transform: "translateX(0)" },
          ], options),
        ];
        await Promise.all(slideAnimations.map((animation) => animation.finished));
      }
    } catch {
      // Keep the current image when loading fails; closing also cancels the transition.
    } finally {
      if (version === transitionVersion) clearImageTransition();
    }
  };

  document.querySelectorAll("[data-lightbox-src]").forEach((card) => {
    card.addEventListener("click", async () => {
      if (changingImage || closingLightbox) return;
      const collection = card.closest("#home-visual, #home-experiential");
      galleryCards = collection ? [...collection.querySelectorAll("[data-lightbox-src]")] : [];
      imageIndex = galleryCards.indexOf(card);
      const isGallery = imageIndex >= 0;
      const animatedLightbox = isGallery || Boolean(card.closest("#home-packaging"));
      lightbox.classList.toggle("art-lightbox--gallery", animatedLightbox);
      controls.hidden = !isGallery;
      if (isGallery) {
        const name = collection.querySelector("h3").textContent;
        controls.setAttribute("aria-label", `${name} 大图浏览`);
        controls.querySelector("[data-lightbox-prev]").setAttribute("aria-label", `查看上一张 ${name} 大图`);
        controls.querySelector("[data-lightbox-next]").setAttribute("aria-label", `查看下一张 ${name} 大图`);
      }
      showImage(card);
      if (animatedLightbox) {
        changingImage = true;
        try {
          await lightboxImage.decode();
        } catch {
          const thumbnail = card.querySelector("img");
          lightboxImage.src = thumbnail.currentSrc || thumbnail.src;
          await lightboxImage.decode().catch(() => undefined);
        }
        changingImage = false;
        document.body.style.setProperty("--lightbox-scrollbar", `${window.innerWidth - document.documentElement.clientWidth}px`);
        document.body.classList.add("has-gallery-lightbox");
      }
      lightbox.showModal();
    });
  });

  lightbox.querySelector("[data-lightbox-prev]").addEventListener("click", () => changeImage(-1));
  lightbox.querySelector("[data-lightbox-next]").addEventListener("click", () => changeImage(1));
  lightbox.addEventListener("keydown", (event) => {
    if (imageIndex < 0 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    changeImage(event.key === "ArrowLeft" ? -1 : 1);
  });
  lightbox.addEventListener("close", () => {
    clearImageTransition();
    closingLightbox = false;
    lightbox.classList.remove("is-closing");
    imageIndex = -1;
    document.body.classList.remove("has-gallery-lightbox");
    document.body.style.removeProperty("--lightbox-scrollbar");
  });
  lightbox.addEventListener("cancel", (event) => {
    if (!lightbox.classList.contains("art-lightbox--gallery")) return;
    event.preventDefault();
    closeLightbox();
  });
  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
}

const projectPositionKey = "portfolio-selected-project";

function rememberProject(pathname) {
  try {
    window.sessionStorage.setItem(projectPositionKey, pathname);
  } catch {
    // Navigation remains available when the browser blocks session storage.
  }
}

if (document.querySelector(".case-back-button")) {
  rememberProject(window.location.pathname);
}

const projectCarousel = document.querySelector("[data-project-carousel]");

if (projectCarousel) {
  const projectTrack = projectCarousel.querySelector("[data-project-track]");
  const projectCards = [...projectTrack.querySelectorAll(".project-card")];
  const projectDots = [...projectCarousel.querySelectorAll("[data-project-dot]")];
  const prevButton = projectCarousel.querySelector("[data-project-prev]");
  const nextButton = projectCarousel.querySelector("[data-project-next]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let autoplayTimer;
  let scrollFrame;
  let interactionPaused = false;
  let playing = !reduceMotion.matches;

  const updateProjectState = () => {
    projectCards.forEach((card, index) => {
      card.classList.toggle("is-active", index === activeIndex);
      if (index === activeIndex) card.setAttribute("aria-current", "true");
      else card.removeAttribute("aria-current");
    });
    projectDots.forEach((dot, index) => {
      if (index === activeIndex) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  const scheduleAutoplay = () => {
    window.clearTimeout(autoplayTimer);
    if (!playing || interactionPaused || document.hidden) return;
    autoplayTimer = window.setTimeout(() => {
      showProject(activeIndex + 1);
    }, 7500);
  };

  const showProject = (index, behavior = "smooth") => {
    activeIndex = (index + projectCards.length) % projectCards.length;
    const card = projectCards[activeIndex];
    projectTrack.scrollTo({
      left: card.offsetLeft + card.offsetWidth / 2 - projectTrack.clientWidth / 2,
      behavior
    });
    updateProjectState();
    scheduleAutoplay();
  };

  projectCards.forEach((card, index) => {
    card.addEventListener("click", (event) => {
      if (index === activeIndex) {
        rememberProject(new URL(card.href).pathname);
        return;
      }
      event.preventDefault();
      showProject(index);
    });
  });

  projectDots.forEach((dot, index) => {
    dot.addEventListener("click", () => showProject(index));
  });

  prevButton.addEventListener("click", () => showProject(activeIndex - 1));
  nextButton.addEventListener("click", () => showProject(activeIndex + 1));

  projectTrack.addEventListener("scroll", () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(() => {
      const trackCenter = projectTrack.scrollLeft + projectTrack.clientWidth / 2;
      activeIndex = projectCards.reduce((closest, card, index) => (
        Math.abs(card.offsetLeft + card.offsetWidth / 2 - trackCenter) < Math.abs(projectCards[closest].offsetLeft + projectCards[closest].offsetWidth / 2 - trackCenter) ? index : closest
      ), 0);
      updateProjectState();
    });
  });

  projectCarousel.addEventListener("mouseenter", () => {
    interactionPaused = true;
    window.clearTimeout(autoplayTimer);
  });
  projectCarousel.addEventListener("mouseleave", () => {
    interactionPaused = false;
    scheduleAutoplay();
  });
  projectCarousel.addEventListener("focusin", () => {
    interactionPaused = true;
    window.clearTimeout(autoplayTimer);
  });
  projectCarousel.addEventListener("focusout", () => {
    window.setTimeout(() => {
      interactionPaused = projectCarousel.contains(document.activeElement);
      scheduleAutoplay();
    });
  });
  document.addEventListener("visibilitychange", scheduleAutoplay);
  reduceMotion.addEventListener("change", () => {
    playing = !reduceMotion.matches;
    scheduleAutoplay();
  });
  const restoreProject = () => {
    try {
      const pathname = window.sessionStorage.getItem(projectPositionKey);
      const index = projectCards.findIndex((card) => new URL(card.href).pathname === pathname);
      if (index >= 0) activeIndex = index;
    } catch {
      // Keep the default selection if session storage is unavailable.
    }
    showProject(activeIndex, "instant");
  };

  restoreProject();
  window.addEventListener("pageshow", () => window.requestAnimationFrame(restoreProject));
}

function setupGalleryCarousel(carousel, prevButton, nextButton) {
  const cards = [...carousel.querySelectorAll(".visual-card")];
  let scrollFrame;

  const updateControls = () => {
    prevButton.disabled = carousel.scrollLeft <= 1;
    nextButton.disabled = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 1;
  };

  const moveCarousel = (direction) => {
    const gap = parseFloat(getComputedStyle(carousel).columnGap) || 0;
    carousel.scrollBy({ left: direction * (cards[0].offsetWidth + gap), behavior: "smooth" });
  };

  carousel.addEventListener("scroll", () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(() => {
      updateControls();
    });
  });

  prevButton.addEventListener("click", () => moveCarousel(-1));
  nextButton.addEventListener("click", () => moveCarousel(1));
  updateControls();
}

const visualCarousel = document.querySelector("[data-visual-carousel]");

if (visualCarousel) {
  const visualSection = visualCarousel.closest(".home-collection");
  setupGalleryCarousel(
    visualCarousel,
    visualSection.querySelector("[data-carousel-prev]"),
    visualSection.querySelector("[data-carousel-next]")
  );
}

const eventCarousel = document.querySelector("[data-event-carousel]");

if (eventCarousel) {
  const eventSection = eventCarousel.closest(".home-collection");
  setupGalleryCarousel(
    eventCarousel,
    eventSection.querySelector("[data-event-prev]"),
    eventSection.querySelector("[data-event-next]")
  );
}
