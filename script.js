/* global window, document */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const orderMailto =
    typeof window.ORDER_MAILTO === 'string' && window.ORDER_MAILTO.trim() !== ''
      ? window.ORDER_MAILTO.trim()
      : 'info.leader-steel@mail.ru';
  const orderOpenMode =
    typeof window.ORDER_OPEN_MODE === 'string' && window.ORDER_OPEN_MODE.trim().toLowerCase() === 'mailto'
      ? 'mailto'
      : 'yandex';
  const yandexComposeBase =
    typeof window.ORDER_YANDEX_COMPOSE === 'string' && window.ORDER_YANDEX_COMPOSE.trim() !== ''
      ? window.ORDER_YANDEX_COMPOSE.trim().replace(/\/$/, '')
      : 'https://mail.yandex.ru/compose';

  const header = $('[data-header]');
  const progress = $('[data-progress]');
  const toast = $('[data-toast]');
  const toastText = $('[data-toast-text]');

  const showToast = (text) => {
    if (!toast || !toastText) {
      window.alert(text);
      return;
    }
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

  // Заявки: открытие почтового клиента (mailto) с данными формы.
  $$('[data-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (String(fd.get('hp_field') || '').trim()) {
        return;
      }
      const name = String(fd.get('name') || '').trim();
      const phone = String(fd.get('phone') || '').trim();
      const msg = String(fd.get('message') || '').trim();
      if (name.length < 2) {
        showToast('Укажите имя');
        return;
      }
      if (phone.replace(/\D/g, '').length < 10) {
        showToast('Укажите телефон');
        return;
      }
      if (msg.length < 10) {
        showToast('Опишите, что нужно сделать');
        return;
      }
      const subject = String(fd.get('_subject') || 'Заявка с сайта — КБ Лидер-Сталь').trim();
      let bodyText = ['Имя: ' + name, 'Телефон: ' + phone, '', 'Сообщение:', msg].join('\n');
      const buildMailtoUri = (b) =>
        'mailto:' +
        orderMailto +
        '?subject=' +
        encodeURIComponent(subject) +
        '&body=' +
        encodeURIComponent(b);
      const buildYandexUrl = (mailtoUri) =>
        yandexComposeBase + '?mailto=' + encodeURIComponent(mailtoUri);
      const maxLen = orderOpenMode === 'yandex' ? 1800 : 1950;
      const buildFinal = (b) =>
        orderOpenMode === 'yandex' ? buildYandexUrl(buildMailtoUri(b)) : buildMailtoUri(b);
      let href = buildFinal(bodyText);
      if (href.length > maxLen) {
        const note = '\n\n[Текст укорочен — при необходимости допишите детали в письме.]';
        while (bodyText.length > 40 && buildFinal(bodyText + note).length > maxLen) {
          bodyText = bodyText.slice(0, Math.floor(bodyText.length * 0.88));
        }
        href = buildFinal(bodyText + note);
      }
      window.location.assign(href);
      showToast(
        orderOpenMode === 'yandex'
          ? 'Открывается Яндекс.Почта: поле «Кому» — ваш адрес из настроек. При необходимости войдите в аккаунт.'
          : 'Должен открыться почтовый клиент. Если ничего не произошло: Параметры Windows → Приложения → «Почта» по умолчанию.'
      );
    });
  });

  const params = new URLSearchParams(window.location.search);
  const stripQueryFlags = () => {
    if (!window.history.replaceState) return;
    const u = new URL(window.location.href);
    u.searchParams.delete('sent');
    u.searchParams.delete('error');
    const qs = u.searchParams.toString();
    window.history.replaceState({}, '', u.pathname + (qs ? `?${qs}` : '') + u.hash);
  };
  if (params.get('sent') === '1') {
    showToast('Заявка отправлена. Мы свяжемся с вами.');
    stripQueryFlags();
  }
  if (params.get('error') === '1') {
    showToast('Не удалось отправить заявку. Позвоните нам или напишите на почту из раздела «Контакты».');
    stripQueryFlags();
  }
})();

