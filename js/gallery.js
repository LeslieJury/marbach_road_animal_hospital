(() => {
    const carousel = document.querySelector("#gallery-carousel");
    const preview = document.querySelector("#gallery-preview");
    const previewImage = document.querySelector("#gallery-preview-image");
    const previewClose = document.querySelector("#gallery-preview-close");

    if (!carousel || !preview || !previewImage || !previewClose) {
        return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let motionPaused = reducedMotion.matches;

    const rows = Array.from(carousel.querySelectorAll(".gallery-track-row"));
    const rowStates = rows.map((row) => {
        const track = row.querySelector(".gallery-track");
        const imageSet = track.querySelector(".gallery-image-set");
        imageSet.querySelectorAll("img").forEach((image) => {
            image.loading = "eager";
            image.decoding = "async";
            image.draggable = false;
        });

        return {
            row,
            track,
            imageSet,
            dragging: false,
            pointerId: null,
            previousPointerX: 0,
            pressedPhoto: null,
            dragDistance: 0,
            suppressClick: false,
            hasFocus: false,
        };
    });

    let sharedPeriod = 0;
    let sharedOffset = 0;
    const autoSpeed = 24;

    const normalizeOffset = () => {
        if (sharedPeriod > 0) {
            sharedOffset = ((sharedOffset % sharedPeriod) + sharedPeriod) % sharedPeriod - sharedPeriod;
        }
    };

    const renderRows = () => {
        rowStates.forEach((state) => {
            state.track.style.transform = `translate3d(${sharedOffset}px, 0, 0)`;
        });
    };

    const ensureTrackCoverage = () => {
        rowStates.forEach((state) => {
            state.track.querySelectorAll(".gallery-image-set:not(:first-child)").forEach((set) => set.remove());

            const setWidth = state.imageSet.getBoundingClientRect().width;
            if (setWidth <= 0) {
                return;
            }

            const copyCount = Math.max(2, Math.ceil(state.row.clientWidth / setWidth) + 1);
            for (let index = 1; index < copyCount; index += 1) {
                const duplicate = state.imageSet.cloneNode(true);
                duplicate.setAttribute("aria-hidden", "true");
                duplicate.querySelectorAll("button").forEach((button) => {
                    button.tabIndex = -1;
                });
                state.track.appendChild(duplicate);
            }
        });
    };

    const measureRows = () => {
        const progress = sharedPeriod > 0 ? -sharedOffset / sharedPeriod : 1;
        ensureTrackCoverage();
        const firstRow = rowStates[0];
        const firstDuplicate = firstRow.track.querySelectorAll(".gallery-image-set")[1];
        sharedPeriod = firstDuplicate.offsetLeft - firstRow.imageSet.offsetLeft;
        sharedOffset = -Math.min(Math.max(progress, 0), 1) * sharedPeriod;
        normalizeOffset();
        renderRows();
    };

    measureRows();
    window.addEventListener("resize", measureRows);

    const getPhotoFromTarget = (target) => (
        target instanceof Element ? target.closest(".gallery-photo") : null
    );

    const openPreview = (photo) => {
        const image = photo?.querySelector("img");
        const source = image?.getAttribute("src");

        if (!image || !source) {
            return;
        }

        previewImage.src = image.currentSrc || source;
        previewImage.alt = image.alt;
        preview.showModal();
    };

    rowStates.forEach((state) => {
        state.row.addEventListener("pointerdown", (event) => {
            if (event.button !== 0 || preview.open) {
                return;
            }

            state.dragging = true;
            state.pointerId = event.pointerId;
            state.previousPointerX = event.clientX;
            state.pressedPhoto = getPhotoFromTarget(event.target);
            state.dragDistance = 0;
            state.row.classList.add("is-dragging");
            state.row.setPointerCapture(event.pointerId);
        });

        state.row.addEventListener("pointermove", (event) => {
            if (!state.dragging || event.pointerId !== state.pointerId) {
                return;
            }

            const deltaX = event.clientX - state.previousPointerX;
            state.previousPointerX = event.clientX;
            state.dragDistance += Math.abs(deltaX);
            sharedOffset += deltaX;
            normalizeOffset();
            renderRows();
        });

        const finishDrag = (event) => {
            if (!state.dragging || event.pointerId !== state.pointerId) {
                return;
            }

            state.dragging = false;
            state.row.classList.remove("is-dragging");
            const wasClick = event.type === "pointerup" && state.dragDistance <= 6;
            const wasDrag = state.dragDistance > 6;
            state.suppressClick = Boolean(state.pressedPhoto);
            if (wasClick) {
                openPreview(state.pressedPhoto);
            }
            if (wasDrag) {
                state.hasFocus = false;
                if (state.row.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
            }
            state.pointerId = null;
            state.pressedPhoto = null;
            window.setTimeout(() => {
                state.suppressClick = false;
            }, 0);
        };

        state.row.addEventListener("pointerup", finishDrag);
        state.row.addEventListener("pointercancel", finishDrag);

        state.row.addEventListener("click", (event) => {
            if (state.suppressClick) {
                event.preventDefault();
                event.stopPropagation();
                state.suppressClick = false;
                return;
            }

            openPreview(getPhotoFromTarget(event.target));
        });

        state.row.addEventListener("focusin", () => {
            state.hasFocus = true;
        });

        state.row.addEventListener("focusout", (event) => {
            if (!state.row.contains(event.relatedTarget)) {
                state.hasFocus = false;
            }
        });
    });

    reducedMotion.addEventListener("change", (event) => {
        motionPaused = event.matches;
    });

    previewClose.addEventListener("click", () => preview.close());
    preview.addEventListener("click", (event) => {
        if (event.target === preview) {
            preview.close();
        }
    });
    preview.addEventListener("close", () => {
        previewImage.removeAttribute("src");
        previewImage.alt = "";
        rowStates.forEach((state) => {
            state.hasFocus = false;
        });
    });

    let previousFrame = 0;
    const animate = (timestamp) => {
        const elapsed = previousFrame ? Math.min((timestamp - previousFrame) / 1000, 0.05) : 0;
        previousFrame = timestamp;

        const userInteracting = rowStates.some((state) => state.dragging || state.hasFocus);
        if (!motionPaused && !preview.open && !userInteracting && sharedPeriod > 0) {
            sharedOffset += autoSpeed * elapsed;
            normalizeOffset();
            renderRows();
        }

        window.requestAnimationFrame(animate);
    };

    window.requestAnimationFrame(animate);
})();
