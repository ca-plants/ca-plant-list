class UI {
    static init() {
        const tooltips = document.querySelectorAll("span[title]");
        [...tooltips].map(
            // @ts-ignore
            (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
        );
    }
}

UI.init();
