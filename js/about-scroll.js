(() => {
    const sections = Array.from(document.querySelectorAll(".about-main > .about-section"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (sections.length < 2) {
        return;
    }

    let animationFrame = null;

    const updateActiveSection = () => {
        const viewportCenter = window.innerHeight / 2;
        let closestSection = null;
        let closestDistance = Infinity;

        sections.forEach((section) => {
            const bounds = section.getBoundingClientRect();
            const sectionCenter = bounds.top + bounds.height / 2;
            const distance = Math.abs(sectionCenter - viewportCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestSection = section;
            }
        });

        sections.forEach((section) => {
            section.classList.toggle("is-active", section === closestSection);
        });
    };

    const scheduleUpdate = () => {
        if (animationFrame !== null) {
            return;
        }

        animationFrame = window.requestAnimationFrame(() => {
            animationFrame = null;
            updateActiveSection();
        });
    };

    const applyMotionPreference = () => {
        document.body.classList.toggle("about-scroll-effects", !reduceMotion.matches);

        if (reduceMotion.matches) {
            sections.forEach((section) => section.classList.remove("is-active"));
        } else {
            updateActiveSection();
        }
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reduceMotion.addEventListener?.("change", applyMotionPreference);
    applyMotionPreference();
})();