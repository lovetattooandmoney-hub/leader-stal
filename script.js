/* global window, document */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const header = $('[data-header]');
  const progress = $('[data-progress]');
  const toast = $('[data-toast]');
  const toastText = $('[data-toast-text]');

  const showToast = (text) => {
    if (!toast) return;
    toastText.textContent = text;
    toast.classList.add('is-show');
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove('is-show'), 2400);
  };

  // Year
  const y = $('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());

  // Scroll progress
  const updateProgress = () => {
    if (!progress) return;
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const p = Math.min(1, Math.max(0, window.scrollY / max));
    progress.style.width = `${(p * 100).toFixed(2)}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Smooth scroll for data-scroll links (keep native for others)
  const handleScrollLink = (a) => {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  $$('a[data-scroll]').forEach(handleScrollLink);

  // Reveal on scroll
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // Tabs
  const tabsRoot = $('[data-tabs]');
  if (tabsRoot) {
    const tabs = $$('[data-tab]', tabsRoot);
    const panes = $$('[data-pane]', tabsRoot);
    const activate = (key) => {
      tabs.forEach((t) => {
        const on = t.getAttribute('data-tab') === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panes.forEach((p) => p.classList.toggle('is-active', p.getAttribute('data-pane') === key));
    };
    tabs.forEach((t) =>
      t.addEventListener('click', () => {
        activate(t.getAttribute('data-tab'));
      })
    );
  }

  // Mobile menu (inject overlay)
  const nav = $('[data-nav]');
  const burger = $('[data-burger]');
  let menu = null;
  const ensureMenu = () => {
    if (menu) return menu;
    menu = document.createElement('div');
    menu.className = 'menu';
    const links = nav ? $$('a', nav) : [];
    for (const a of links) {
      const b = document.createElement('a');
      b.className = 'menu__link';
      b.href = a.getAttribute('href') || '#';
      b.textContent = a.textContent || '';
      b.addEventListener('click', (e) => {
        const href = b.getAttribute('href') || '';
        if (href.startsWith('#')) {
          e.preventDefault();
          const target = document.getElementById(href.slice(1));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        closeMenu();
      });
      menu.appendChild(b);
    }
    document.body.appendChild(menu);
    return menu;
  };

  const openMenu = () => {
    const m = ensureMenu();
    m.classList.add('is-open');
    burger?.setAttribute('aria-label', 'Закрыть меню');
    document.addEventListener('keydown', onEsc);
    document.addEventListener('click', onOutside, true);
  };
  const closeMenu = () => {
    menu?.classList.remove('is-open');
    burger?.setAttribute('aria-label', 'Открыть меню');
    document.removeEventListener('keydown', onEsc);
    document.removeEventListener('click', onOutside, true);
  };
  const onEsc = (e) => {
    if (e.key === 'Escape') closeMenu();
  };
  const onOutside = (e) => {
    if (!menu?.classList.contains('is-open')) return;
    const t = e.target;
    if (t === burger || burger?.contains(t)) return;
    if (menu.contains(t)) return;
    if (header?.contains(t)) return;
    closeMenu();
  };

  burger?.addEventListener('click', () => {
    ensureMenu();
    if (menu.classList.contains('is-open')) closeMenu();
    else openMenu();
  });

  // Copy buttons
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(val);
        showToast(`Скопировано: ${val}`);
      } catch {
        showToast('Не удалось скопировать');
      }
    });
  });

  // Floating call + Header call dropdown
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('[data-float-call].is-open, [data-header-call].is-open').forEach((w) => w.classList.remove('is-open'));
    }
  });
  $$('[data-header-call]').forEach((wrap) => {
    const btn = wrap.querySelector('.header__call-btn');
    if (!btn) return;
    const onOutside = (e) => {
      const t = e.target;
      if (wrap.contains(t)) return;
      wrap.classList.remove('is-open');
      document.removeEventListener('click', onOutside, true);
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = wrap.classList.toggle('is-open');
      if (open) {
        setTimeout(() => document.addEventListener('click', onOutside, true), 0);
      } else {
        document.removeEventListener('click', onOutside, true);
      }
    });
  });
  $$('[data-float-call]').forEach((wrap) => {
    const btn = wrap.querySelector('.float-call__btn');
    if (!btn) return;
    const onFloatOutside = (e) => {
      const t = e.target;
      if (wrap.contains(t)) return;
      wrap.classList.remove('is-open');
      document.removeEventListener('click', onFloatOutside, true);
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = wrap.classList.toggle('is-open');
      if (open) {
        setTimeout(() => document.addEventListener('click', onFloatOutside, true), 0);
      } else {
        document.removeEventListener('click', onFloatOutside, true);
      }
    });
  });

  // File UI
  const fileInput = $('input[type="file"][name="file"]');
  const fileName = $('[data-file-name]');
  const fileUi = $('[data-file-ui]');
  const updateFileUi = () => {
    if (!fileName) return;
    const f = fileInput?.files?.[0];
    fileName.textContent = f ? `Файл: ${f.name}` : 'Прикрепить чертёж (PDF/DXF/DWG)';
    if (fileUi) {
      fileUi.style.borderColor = f ? 'rgba(223,37,49,.55)' : 'rgba(255,255,255,.16)';
      fileUi.style.background = f ? 'rgba(223,37,49,.08)' : 'rgba(255,255,255,.02)';
    }
  };
  fileInput?.addEventListener('change', updateFileUi);
  updateFileUi();

  // Certificate lightbox (certificates.html)
  const certModal = $('[data-cert-modal]');
  const certOpen = $('[data-cert-open]');
  const certClose = $('[data-cert-close]');
  if (certModal && certOpen && certClose) {
    const openCert = () => {
      certModal.classList.add('is-open');
      certModal.setAttribute('aria-hidden', 'false');
    };
    const closeCert = () => {
      certModal.classList.remove('is-open');
      certModal.setAttribute('aria-hidden', 'true');
    };
    certOpen.addEventListener('click', openCert);
    certClose.addEventListener('click', closeCert);
    certModal.addEventListener('click', (e) => {
      if (e.target === certModal) closeCert();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCert();
    });
  }

  // Form submit → endpoint (Telegram Worker)
  $$('[data-form]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const msg = String(fd.get('message') || '').trim();

    const msgField = form.querySelector('[name="message"]');
    const msgRequired = msgField?.hasAttribute('required');
    const bad = [];
    if (name.length < 2) bad.push('Укажите имя');
    if (phone.replace(/\D/g, '').length < 10) bad.push('Укажите телефон');
    if (msgRequired && msg.length < 10) bad.push('Опишите задачу');

    if (bad.length) {
      showToast(bad[0]);
      return;
    }

    const endpoint =
      (typeof window !== 'undefined' && window.__LEAD_ENDPOINT__) || form.getAttribute('data-endpoint') || '';

    const submitOnline = async () => {
      if (!endpoint) return false;
      try {
        fd.set('page', window.location.href);
        const r = await fetch(endpoint, { method: 'POST', body: fd });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j || j.ok !== true) return false;
        return true;
      } catch {
        return false;
      }
    };

    (async () => {
      const ok = await submitOnline();
      if (ok) {
        form.reset();
        updateFileUi();
        showToast('Заявка отправлена. Мы свяжемся с вами!');
        return;
      }
      showToast('Не удалось отправить. Напишите нам в Telegram/на почту.');
    })();
  });
  });
})();

