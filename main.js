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

// Sub-hero fade-in (only present on index.html). Replays on initial load,
// on returning to this tab (visibilitychange), and on bfcache restores
// (pageshow) so switching back from another tab re-triggers it.
const heroFadeText = document.querySelector('.hero-fade-text');
if (heroFadeText) {
    const playHeroFade = () => {
        heroFadeText.classList.remove('hero-fade-in');
        void heroFadeText.offsetWidth; // force reflow to restart the animation
        heroFadeText.classList.add('hero-fade-in');
    };
    playHeroFade();
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) playHeroFade();
    });
    window.addEventListener('pageshow', playHeroFade);
}

// About page scroll reveal (only present on about.html): each section
// fades/melts in the first time it scrolls into view.
const aboutRevealSections = document.querySelectorAll('[data-reveal]');
if (aboutRevealSections.length) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    aboutRevealSections.forEach(section => revealObserver.observe(section));
}

// About page hero (only present on about.html): the hero stays pinned
// (position: sticky) inside .about-hero-pin-wrap while the user scrolls
// through its extra height, releasing once that height is used up.
// Progress is measured from the moment the wrap reaches the sticky
// "top: 72px" line, so it's independent of absolute page scroll position.
// Two thresholds stage the "We specialise..." and founder-bio reveals.
const aboutHeroPinWrap = document.querySelector('.about-hero-pin-wrap');
if (aboutHeroPinWrap) {
    const stage1 = document.querySelector('[data-reveal-stage="1"]');
    const stage2 = document.querySelector('[data-reveal-stage="2"]');
    const onHeroScroll = () => {
        const progress = 72 - aboutHeroPinWrap.getBoundingClientRect().top;
        const vh = window.innerHeight;
        if (stage1 && progress > vh * 0.15) stage1.classList.add('is-visible');
        if (stage2 && progress > vh * 0.6) stage2.classList.add('is-visible');
    };
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll();
}

// About page's modules table: each row starts collapsed, showing just its
// title; clicking toggles that row open/shut independently of the others.
document.querySelectorAll('.collapsible-row').forEach((row) => {
    const toggle = row.querySelector('.modules-row-toggle');
    toggle.addEventListener('click', () => {
        const isOpen = row.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', isOpen);
    });
});

// Services page (only present on services.html): a horizontal accordion —
// clicking a segment expands it while the others compress and slide over;
// clicking the open one again collapses everything back to equal widths.
document.querySelectorAll('[data-seg]').forEach((seg) => {
    seg.addEventListener('click', () => {
        const alreadyOpen = seg.classList.contains('is-open');
        document.querySelectorAll('[data-seg]').forEach((s) => s.classList.remove('is-open'));
        if (!alreadyOpen) seg.classList.add('is-open');
    });
});

// About page hero: hovering "unparalleled" holds its glow/lift for a
// flat 5s (re-hovering restarts the countdown) rather than reverting the
// instant the cursor leaves, then the CSS transition eases it back out.
const glowWord = document.querySelector('.glow-word');
if (glowWord) {
    let glowTimer = null;
    glowWord.addEventListener('mouseenter', () => {
        glowWord.classList.add('is-active');
        clearTimeout(glowTimer);
        glowTimer = setTimeout(() => {
            glowWord.classList.remove('is-active');
        }, 5000);
    });
}
