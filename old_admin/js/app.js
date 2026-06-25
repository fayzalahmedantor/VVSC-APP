import { Router } from './core/router.js';

class App {
    constructor() {
        this.router = new Router('appRoot');
        this.init();
    }

    init() {
        this.setupRoutes();
        this.setupEventListeners();
        
        // Initial load
        this.router.navigate('dashboard');
    }

    setupRoutes() {
        // We will add more routes as we build the pages
        this.router.addRoute('dashboard', 'views/dashboard.html', null);
        this.router.addRoute('inventory', 'views/dashboard.html', null); // Placeholder
        this.router.addRoute('suppliers', 'views/dashboard.html', null); // Placeholder
        this.router.addRoute('customers', 'views/dashboard.html', null); // Placeholder
        this.router.addRoute('sales', 'views/dashboard.html', null); // Placeholder
        this.router.addRoute('expenses', 'views/dashboard.html', null); // Placeholder
        this.router.addRoute('loyalty', 'views/dashboard.html', null); // Placeholder
        this.router.addRoute('service', 'views/dashboard.html', null); // Placeholder
        this.router.addRoute('reports', 'views/dashboard.html', null); // Placeholder
        this.router.addRoute('settings', 'views/dashboard.html', null); // Placeholder
    }

    setupEventListeners() {
        // Navigation clicks
        document.getElementById('navMenu').addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.route) {
                this.router.navigate(navItem.dataset.route);
            }
        });

        // Theme Toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = themeToggle.querySelector('i');
            if (document.body.classList.contains('dark-mode')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
        
        // Language Toggle (Placeholder for now)
        const langToggle = document.getElementById('langToggle');
        langToggle.addEventListener('click', () => {
            const span = langToggle.querySelector('span');
            span.textContent = span.textContent === 'BN' ? 'EN' : 'BN';
            // Here we will trigger i18n update later
        });
    }
}

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
