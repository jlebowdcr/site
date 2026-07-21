// Cookie consent banner + preference center for the Delta Strategies site.
// Loaded on every page. Handles: showing the banner, saving the visitor's
// choice, and switching on any consented scripts.
//
// HOW TO GATE A FUTURE SCRIPT (e.g. when you add Google Analytics):
// Instead of a normal script tag, write it disguised as inert text:
//   <script type="text/plain" data-cookie-category="analytics"
//           data-cookie-src="https://www.googletagmanager.com/gtag/js?id=XXXX">
//   </script>
// Categories: "analytics", "marketing", or "functional".
// Browsers don't run type="text/plain" scripts, so it does nothing until
// this file turns it into a real <script> tag after consent is given.

(function () {
    var STORAGE_KEY = 'ds-cookie-consent';

    var CATEGORY_INFO = {
        necessary: {
            label: 'Necessary',
            description: 'Required for the site to work, such as remembering your cookie choice. These cannot be switched off.',
            locked: true
        },
        analytics: {
            label: 'Analytics',
            description: 'Used to understand how visitors use the site via Google Analytics — number of visitors, how long they stay, and which source they arrived from (e.g. Google Search, LinkedIn, direct). This shares data with Google and only runs once you consent.',
            locked: false
        },
        marketing: {
            label: 'Marketing',
            description: 'Would be used for advertising or marketing purposes (e.g. ad pixels). We do not currently use any marketing cookies — this toggle is here for transparency and for if we add one in future.',
            locked: false
        },
        functional: {
            label: 'Functional',
            description: 'Used for embedded content that enhances the site, such as our interactive Google Maps office location. Loading this content shares your IP address with the provider (e.g. Google) and may set their cookies.',
            locked: false
        }
    };

    var CATEGORY_ORDER = ['necessary', 'analytics', 'marketing', 'functional'];

    // ---- Storage helpers -------------------------------------------------

    function getConsent() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function storeConsent(consent) {
        consent.necessary = true;
        consent.timestamp = new Date().toISOString();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
        } catch (e) {
            // localStorage unavailable (e.g. private browsing edge cases) -
            // the banner will just reappear next visit, which is a safe fallback.
        }
        applyConsent(consent);
        document.dispatchEvent(new CustomEvent('ds-cookie-consent-updated', { detail: consent }));
    }

    // ---- Turning on consented scripts -------------------------------------

    function applyConsent(consent) {
        var scriptPlaceholders = document.querySelectorAll('script[type="text/plain"][data-cookie-category]');
        scriptPlaceholders.forEach(function (placeholder) {
            var category = placeholder.getAttribute('data-cookie-category');
            if (!consent[category] || placeholder.dataset.activated === 'true') {
                return;
            }
            var realScript = document.createElement('script');
            for (var i = 0; i < placeholder.attributes.length; i++) {
                var attr = placeholder.attributes[i];
                if (attr.name === 'type' || attr.name === 'data-cookie-category') continue;
                if (attr.name === 'data-cookie-src') {
                    realScript.src = attr.value;
                } else {
                    realScript.setAttribute(attr.name, attr.value);
                }
            }
            if (!realScript.src && placeholder.textContent) {
                realScript.textContent = placeholder.textContent;
            }
            placeholder.dataset.activated = 'true';
            placeholder.parentNode.insertBefore(realScript, placeholder.nextSibling);
        });

        // Embeds (e.g. Google Maps) sit inert with no src attribute until
        // consent is granted for their category — same "don't run until
        // consented" idea as the script placeholders above, just for iframes.
        var iframePlaceholders = document.querySelectorAll('iframe[data-cookie-category][data-cookie-src]');
        iframePlaceholders.forEach(function (iframe) {
            var category = iframe.getAttribute('data-cookie-category');
            if (!consent[category]) return;
            if (!iframe.getAttribute('src')) {
                iframe.setAttribute('src', iframe.getAttribute('data-cookie-src'));
            }
            var wrapper = iframe.closest('.ds-embed');
            if (wrapper) wrapper.classList.add('ds-embed-activated');
        });
    }

    // ---- Banner (first layer) ---------------------------------------------

    function buildBanner() {
        var banner = document.createElement('div');
        banner.id = 'ds-cookie-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Cookie consent');
        banner.innerHTML =
            '<div class="ds-cookie-banner-inner">' +
                '<p class="ds-cookie-text">We use cookies to run this site. Some are strictly necessary; others (analytics, marketing) would only be used with your consent. Choose an option below — you can change your mind anytime via "Cookie settings" in the footer.</p>' +
                '<div class="ds-cookie-actions">' +
                    '<button type="button" class="ds-cookie-btn ds-cookie-btn-outline" data-action="manage">Manage preferences</button>' +
                    '<button type="button" class="ds-cookie-btn ds-cookie-btn-outline" data-action="reject">Reject all</button>' +
                    '<button type="button" class="ds-cookie-btn ds-cookie-btn-solid" data-action="accept">Accept all</button>' +
                '</div>' +
            '</div>';

        banner.querySelector('[data-action="accept"]').addEventListener('click', function () {
            storeConsent({ analytics: true, marketing: true, functional: true });
            hideBanner();
        });
        banner.querySelector('[data-action="reject"]').addEventListener('click', function () {
            storeConsent({ analytics: false, marketing: false, functional: false });
            hideBanner();
        });
        banner.querySelector('[data-action="manage"]').addEventListener('click', function () {
            openPreferences();
        });

        return banner;
    }

    function showBanner() {
        if (document.getElementById('ds-cookie-banner')) return;
        document.body.appendChild(buildBanner());
    }

    function hideBanner() {
        var banner = document.getElementById('ds-cookie-banner');
        if (banner) banner.remove();
    }

    // ---- Preferences panel (second layer) ----------------------------------

    function buildPreferencesPanel() {
        var current = getConsent() || {};
        var overlay = document.createElement('div');
        overlay.id = 'ds-cookie-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Cookie preferences');

        var rows = CATEGORY_ORDER.map(function (key) {
            var info = CATEGORY_INFO[key];
            var checked = key === 'necessary' ? true : !!current[key];
            return (
                '<div class="ds-cookie-row">' +
                    '<div class="ds-cookie-row-text">' +
                        '<span class="ds-cookie-row-label">' + info.label + (info.locked ? ' <em>(always on)</em>' : '') + '</span>' +
                        '<span class="ds-cookie-row-desc">' + info.description + '</span>' +
                    '</div>' +
                    '<label class="ds-cookie-toggle">' +
                        '<input type="checkbox" data-category="' + key + '"' +
                            (checked ? ' checked' : '') +
                            (info.locked ? ' disabled' : '') + '>' +
                        '<span class="ds-cookie-toggle-slider"></span>' +
                    '</label>' +
                '</div>'
            );
        }).join('');

        overlay.innerHTML =
            '<div class="ds-cookie-panel">' +
                '<h2 class="ds-cookie-panel-title">Cookie preferences</h2>' +
                '<p class="ds-cookie-panel-intro">We only use strictly necessary cookies today. The toggles below let you control optional categories, now or if we introduce them in future.</p>' +
                rows +
                '<div class="ds-cookie-panel-actions">' +
                    '<button type="button" class="ds-cookie-btn ds-cookie-btn-outline" data-action="close">Cancel</button>' +
                    '<button type="button" class="ds-cookie-btn ds-cookie-btn-solid" data-action="save">Save preferences</button>' +
                '</div>' +
            '</div>';

        overlay.querySelector('[data-action="close"]').addEventListener('click', closePreferences);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closePreferences();
        });
        overlay.querySelector('[data-action="save"]').addEventListener('click', function () {
            var consent = {};
            overlay.querySelectorAll('input[data-category]').forEach(function (input) {
                consent[input.getAttribute('data-category')] = input.checked;
            });
            storeConsent(consent);
            closePreferences();
            hideBanner();
        });

        return overlay;
    }

    function openPreferences() {
        closePreferences();
        document.body.appendChild(buildPreferencesPanel());
    }

    function closePreferences() {
        var overlay = document.getElementById('ds-cookie-overlay');
        if (overlay) overlay.remove();
    }

    // ---- Init ---------------------------------------------------------------

    function init() {
        var stored = getConsent();
        if (stored) {
            applyConsent(stored);
        } else {
            showBanner();
        }
        document.querySelectorAll('[data-cookie-settings-link]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                openPreferences();
            });
        });

        // "Enable map" style buttons: consent to just that one category
        // in-place, without making the visitor open the full panel.
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-enable-category]');
            if (!btn) return;
            var category = btn.getAttribute('data-enable-category');
            var current = getConsent() || { analytics: false, marketing: false, functional: false };
            current[category] = true;
            storeConsent(current);
            hideBanner();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exposed for reopening preferences from anywhere, and for future scripts
    // that need to check consent directly instead of using the tag trick.
    window.dsCookieConsent = {
        getConsent: getConsent,
        hasConsent: function (category) {
            var c = getConsent();
            return !!(c && c[category]);
        },
        openPreferences: openPreferences
    };
})();
