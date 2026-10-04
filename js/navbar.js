(() => {
    const navbar = document.querySelector("header");

    if (!navbar) {
        return;
    }

    const updateNavbar = () => {
        navbar.classList.toggle("is-scrolled", window.scrollY > 0);
    };

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });
})();
