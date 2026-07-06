// Mobile menu toggle (present on every page's header)
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu when a link is clicked
    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
}

// Contact form email submission (only present on contact.html)
const submitContactForm = document.getElementById('submitContactForm');
if (submitContactForm) {
    submitContactForm.addEventListener('click', function() {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        const subject = encodeURIComponent(`Contact from Website: ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
        const mailtoLink = `mailto:info@deltacapitalresearch.com?subject=${subject}&body=${body}`;

        window.location.href = mailtoLink;
    });
}

// About page tab switching (only present on about.html): clicking a label
// swaps which single panel is shown on the right, and marks that label active.
const aboutTabButtons = document.querySelectorAll('.about-tab-btn');
if (aboutTabButtons.length) {
    const aboutPanels = document.querySelectorAll('.about-tab-panel');
    aboutTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            aboutTabButtons.forEach(b => b.classList.remove('about-tab-active'));
            btn.classList.add('about-tab-active');
            aboutPanels.forEach(panel => {
                panel.classList.toggle('about-panel-active', panel.dataset.panel === target);
            });
        });
    });
}
