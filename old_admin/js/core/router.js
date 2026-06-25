export class Router {
    constructor(rootElementId) {
        this.rootElement = document.getElementById(rootElementId);
        this.routes = {};
        this.currentRoute = null;
    }

    addRoute(path, templatePath, controller) {
        this.routes[path] = { templatePath, controller };
    }

    async navigate(path) {
        if (!this.routes[path]) {
            console.error(`Route ${path} not found`);
            path = 'dashboard'; // fallback
        }

        const route = this.routes[path];
        this.currentRoute = path;

        try {
            // Fetch HTML template
            const response = await fetch(route.templatePath);
            if (!response.ok) throw new Error('Template load failed');
            const html = await response.text();

            // Render HTML
            this.rootElement.innerHTML = html;

            // Execute scripts inside the fetched HTML (if any)
            const scripts = this.rootElement.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.body.appendChild(newScript);
                document.body.removeChild(newScript);
            });

            // Call controller init function if provided
            if (route.controller && typeof route.controller.init === 'function') {
                route.controller.init();
            }

            // Update UI (sidebar active state, page title)
            this.updateNavUI(path);
        } catch (error) {
            console.error('Navigation error:', error);
            this.rootElement.innerHTML = `<div style="padding:40px; color:var(--danger)">Error loading page.</div>`;
        }
    }

    updateNavUI(path) {
        // Update sidebar active class
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.route === path) {
                el.classList.add('active');
                
                // Update page title based on nav item text
                const pageTitleEl = document.getElementById('pageTitle');
                if (pageTitleEl) {
                    pageTitleEl.textContent = el.querySelector('span').textContent;
                }
            }
        });
    }
}
