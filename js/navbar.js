(() => {
    const navbar = document.querySelector("header");

    if (!navbar) {
        return;
    }

    const updateNavbar = () => {
        navbar.classList.toggle("is-scrolled", window.scrollY > 0);
    };

    const menuToggle = document.querySelector("#hamburger-menu");
    const mobileMenu = document.querySelector("#mobile-menu");
    const backdrop = document.querySelector("#mobile-menu-backdrop");
    let closeTimeout = null;
    let closeAnimationHandler = null;
    let restoreFocusOnClose = false;

    const finishClose = () => {
        if (!menuToggle || !mobileMenu || !backdrop || mobileMenu.hidden) {
            return;
        }

        if (closeTimeout !== null) {
            window.clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        if (closeAnimationHandler) {
            mobileMenu.removeEventListener("animationend", closeAnimationHandler);
            closeAnimationHandler = null;
        }

        mobileMenu.hidden = true;
        backdrop.hidden = true;
        mobileMenu.classList.remove("is-closing");
        backdrop.classList.remove("is-closing");
        document.body.classList.remove("mobile-menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");

        if (restoreFocusOnClose) {
            menuToggle.focus();
        }
        restoreFocusOnClose = false;
    };

    const closeMenu = (restoreFocus = false) => {
        if (!menuToggle || !mobileMenu || !backdrop || mobileMenu.hidden) {
            return;
        }

        restoreFocusOnClose = restoreFocusOnClose || restoreFocus;
        if (mobileMenu.classList.contains("is-closing")) {
            return;
        }

        if (window.innerWidth > 1249 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            finishClose();
            return;
        }

        mobileMenu.classList.add("is-closing");
        backdrop.classList.add("is-closing");
        closeAnimationHandler = (event) => {
            if (event.target === mobileMenu) {
                finishClose();
            }
        };
        mobileMenu.addEventListener("animationend", closeAnimationHandler);
        closeTimeout = window.setTimeout(finishClose, 300);
    };

    if (menuToggle && mobileMenu && backdrop) {
        menuToggle.addEventListener("click", () => {
            mobileMenu.classList.remove("is-closing");
            backdrop.classList.remove("is-closing");
            restoreFocusOnClose = false;
            mobileMenu.hidden = false;
            backdrop.hidden = false;
            document.body.classList.add("mobile-menu-open");
            menuToggle.setAttribute("aria-expanded", "true");
            menuToggle.setAttribute("aria-label", "Close navigation menu");
            mobileMenu.querySelector("a")?.focus();
        });

        backdrop.addEventListener("click", () => closeMenu(true));
        mobileMenu.addEventListener("click", (event) => {
            if (event.target.closest("a")) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMenu(true);
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 1249) {
                closeMenu();
            }
        });
    }

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });

    document.querySelectorAll('a[href="#top"]').forEach((topLink) => {
        topLink.addEventListener("click", (event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });
})();
