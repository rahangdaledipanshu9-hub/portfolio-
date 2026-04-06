/* ===================================================
   Dipanshu Rahangdale — Portfolio Script
   Fixed: sections invisible, double scroll listeners,
          body opacity race, unthrottled parallax
   =================================================== */

(function () {
    'use strict';

    // ── Helpers ──────────────────────────────────────
    function qs(sel) { return document.querySelector(sel); }
    function qsa(sel) { return document.querySelectorAll(sel); }

    // rAF-throttled scroll — single shared ticker
    let rafPending = false;
    const scrollCallbacks = [];
    function onScroll(fn) { scrollCallbacks.push(fn); }
    window.addEventListener('scroll', function () {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(function () {
            rafPending = false;
            const y = window.pageYOffset;
            scrollCallbacks.forEach(function (fn) { fn(y); });
        });
    }, { passive: true });

    // ── Navigation ───────────────────────────────────
    const navbar    = qs('#navbar');
    const hamburger = qs('#hamburger');
    const navMenu   = qs('#navMenu');
    const navLinks  = qsa('.nav-link');
    const sections  = qsa('section[id]');

    hamburger.addEventListener('click', function () {
        const open = navMenu.classList.toggle('active');
        hamburger.classList.toggle('active', open);
        document.body.style.overflow = open ? 'hidden' : '';
    });

    navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Navbar scroll style
    onScroll(function (y) {
        navbar.classList.toggle('scrolled', y > 80);
    });

    // Active nav link
    onScroll(function (y) {
        const pos = y + 140;
        sections.forEach(function (sec) {
            const top = sec.offsetTop;
            const bot = top + sec.offsetHeight;
            if (pos >= top && pos < bot) {
                const id = sec.getAttribute('id');
                navLinks.forEach(function (l) {
                    l.classList.toggle('active', l.getAttribute('href') === '#' + id);
                });
            }
        });
    });

    // Smooth scroll for anchor links
    qsa('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = qs(href);
            if (!target) return;
            e.preventDefault();
            window.scrollTo({ top: target.offsetTop - 90, behavior: 'smooth' });
        });
    });

    // ── Scroll to top ────────────────────────────────
    const scrollTopBtn = qs('#scrollToTop');
    if (scrollTopBtn) {
        onScroll(function (y) {
            scrollTopBtn.classList.toggle('visible', y > 500);
        });
        scrollTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── Section reveal via IntersectionObserver ──────
    // Strategy: mark body as js-ready so CSS hides .reveal-item,
    // then use observer to reveal them. If JS is slow or observer
    // fails, a safety timeout reveals everything after 2 s.
    document.body.classList.add('js-ready');

    const revealItems = qsa('.reveal-item');

    // Safety net: if something goes wrong, reveal all after 2s
    const safetyTimer = setTimeout(function () {
        revealItems.forEach(function (el) { el.classList.add('revealed'); });
    }, 2000);

    if ('IntersectionObserver' in window) {
        const revealObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        revealItems.forEach(function (el) { revealObs.observe(el); });

        // Once all revealed clear the safety timer
        let revealed = 0;
        const total = revealItems.length;
        revealItems.forEach(function (el) {
            el.addEventListener('transitionend', function () {
                revealed++;
                if (revealed >= total) clearTimeout(safetyTimer);
            }, { once: true });
        });
    } else {
        // Browser doesn't support IO — just reveal everything instantly
        clearTimeout(safetyTimer);
        revealItems.forEach(function (el) { el.classList.add('revealed'); });
    }

    // ── Skill bar animation ──────────────────────────
    const skillObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('.skill-progress').forEach(function (bar) {
                const w = bar.getAttribute('data-width') || '0';
                // Small timeout lets the reveal transition finish first
                setTimeout(function () { bar.style.width = w + '%'; }, 200);
            });
            skillObs.unobserve(entry.target);
        });
    }, { threshold: 0.3 });

    qsa('.skill-list').forEach(function (list) { skillObs.observe(list); });

    // ── Contact form ─────────────────────────────────
    const contactForm = qs('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name    = qs('#name').value.trim();
            const email   = qs('#email').value.trim();
            const subject = qs('#subject').value.trim();
            const message = qs('#message').value.trim();
            if (!name || !email || !subject || !message) {
                showToast('Please fill in all fields.', 'error');
                return;
            }
            const body = 'Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + message;
            window.location.href = 'mailto:rahangdaledipanshu9@gmail.com'
                + '?subject=' + encodeURIComponent(subject)
                + '&body='    + encodeURIComponent(body);
            showToast('Opening your email client…');
            contactForm.reset();
        });
    }

    // ── Toast notification ───────────────────────────
    function showToast(msg, type) {
        const existing = qs('.toast');
        if (existing) existing.remove();

        const t = document.createElement('div');
        t.className = 'toast';
        if (type === 'error') t.style.borderLeftColor = '#ef4444';
        t.innerHTML =
            '<i class="fas ' + (type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle') + '" '
            + 'style="color:' + (type === 'error' ? '#ef4444' : '#10b981') + '"></i>'
            + '<span>' + msg + '</span>';
        document.body.appendChild(t);

        setTimeout(function () {
            t.classList.add('removing');
            setTimeout(function () { t.remove(); }, 380);
        }, 3400);
    }

    // ── Console branding ─────────────────────────────
    console.log('%c👨‍🔬 Dipanshu Rahangdale', 'color:#d4af37;font-size:22px;font-weight:bold;');
    console.log('%cChemical Engineer | Researcher | Innovator', 'color:#1a2332;font-size:14px;');

})();
