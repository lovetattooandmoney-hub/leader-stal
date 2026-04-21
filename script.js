/* global window, document */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const orderMailto =
    typeof window.ORDER_MAILTO === 'string' && window.ORDER_MAILTO.trim() !== ''
      ? window.ORDER_MAILTO.trim()
      : 'info.leader-steel@mail.ru,sales3_ls@mail.ru,sales2_ls@mail.ru';
  try {
    localStorage.removeItem('leader-stal-mail-provider-v1');
  } catch {
    /* старый ключ сохранения выбора почты — больше не используется */
  }

  const yandexComposeBase =
    typeof window.ORDER_YANDEX_COMPOSE === 'string' && window.ORDER_YANDEX_COMPOSE.trim() !== ''
      ? window.ORDER_YANDEX_COMPOSE.trim().replace(/\/$/, '')
      : 'https://mail.yandex.ru/compose';
  const mailruComposePrefix =
    typeof window.ORDER_MAILRU_COMPOSE === 'string' && window.ORDER_MAILRU_COMPOSE.trim() !== ''
      ? window.ORDER_MAILRU_COMPOSE.trim()
      : 'https://e.mail.ru/compose/?mailto=';
  const gmailComposeBase =
    typeof window.ORDER_GMAIL_COMPOSE === 'string' && window.ORDER_GMAIL_COMPOSE.trim() !== ''
      ? window.ORDER_GMAIL_COMPOSE.trim()
      : 'https://mail.google.com/mail/?view=cm&fs=1';
  const ymCounterId = Number(window.YM_COUNTER_ID || 0);
  const ymGoalFormSubmit = String(window.YM_GOAL_FORM_SUBMIT || 'form_submit');
  const ymGoalPhoneClick = String(window.YM_GOAL_PHONE_CLICK || 'phone_click');
  const ymGoalEmailClick = String(window.YM_GOAL_EMAIL_CLICK || 'email_click');
  const calltrackingScriptUrl =
    typeof window.CALLTRACKING_SCRIPT_URL === 'string' ? window.CALLTRACKING_SCRIPT_URL.trim() : '';

  const UTM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'yclid'
  ];
  const UTM_STORAGE_KEY = 'leader-stal-utm-v1';
  const pendingGoals = [];

  const canUseStorage = () => {
    try {
      return typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  };

  const getUtmPayloadFromSearch = () => {
    const params = new URLSearchParams(window.location.search);
    const payload = {};
    for (const key of UTM_KEYS) {
      const val = params.get(key);
      if (val && val.trim() !== '') payload[key] = val.trim();
    }
    return payload;
  };

  const saveUtmPayload = (payload) => {
    if (!canUseStorage()) return;
    try {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore storage errors */
    }
  };

  const getSavedUtmPayload = () => {
    if (!canUseStorage()) return {};
    try {
      const raw = localStorage.getItem(UTM_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const getUtmPayload = () => {
    const fromSearch = getUtmPayloadFromSearch();
    if (Object.keys(fromSearch).length > 0) {
      saveUtmPayload(fromSearch);
      return fromSearch;
    }
    return getSavedUtmPayload();
  };

  const appendUtmToInternalLinks = () => {
    const utm = getUtmPayload();
    if (Object.keys(utm).length === 0) return;
    $$('a[href]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.searchParams.has('utm_source')) return;
      for (const key of UTM_KEYS) {
        if (utm[key]) url.searchParams.set(key, String(utm[key]));
      }
      link.setAttribute('href', url.pathname + url.search + url.hash);
    });
  };

  const initYandexMetrika = () => {
    if (!Number.isFinite(ymCounterId) || ymCounterId <= 0) return;
    if (typeof window.ym !== 'function') {
      window.ym =
        window.ym ||
        function () {
          (window.ym.a = window.ym.a || []).push(arguments);
        };
      window.ym.l = Date.now();
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://mc.yandex.ru/metrika/tag.js';
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(s, firstScript);
      } else {
        document.head.appendChild(s);
      }
    }
    window.ym(ymCounterId, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });
  };

  const sendGoal = (goalName, params = {}) => {
    if (!Number.isFinite(ymCounterId) || ymCounterId <= 0 || !goalName) return;
    if (typeof window.ym === 'function') {
      window.ym(ymCounterId, 'reachGoal', goalName, params);
      return;
    }
    pendingGoals.push({ goalName, params });
  };

  const flushPendingGoals = () => {
    if (typeof window.ym !== 'function' || pendingGoals.length === 0) return;
    while (pendingGoals.length > 0) {
      const item = pendingGoals.shift();
      window.ym(ymCounterId, 'reachGoal', item.goalName, item.params);
    }
  };

  const initGoalListeners = () => {
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const telLink = target.closest('a[href^="tel:"]');
      if (telLink) {
        sendGoal(ymGoalPhoneClick, { href: telLink.getAttribute('href') || '' });
        return;
      }
      const mailLink = target.closest('a[href^="mailto:"]');
      if (mailLink) {
        sendGoal(ymGoalEmailClick, { href: mailLink.getAttribute('href') || '' });
      }
    });
  };

  const initCalltracking = () => {
    if (!calltrackingScriptUrl) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = calltrackingScriptUrl;
    document.head.appendChild(s);
  };

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

  const buildMailtoUri = (subject, body) =>
    'mailto:' +
    orderMailto +
    '?subject=' +
    encodeURIComponent(subject) +
    '&body=' +
    encodeURIComponent(body);

  const buildHrefForProvider = (provider, subject, body) => {
    const mailtoUri = buildMailtoUri(subject, body);
    switch (provider) {
      case 'yandex':
        return yandexComposeBase + '?mailto=' + encodeURIComponent(mailtoUri);
      case 'mailru':
        return mailruComposePrefix + encodeURIComponent(mailtoUri);
      case 'gmail':
        return (
          gmailComposeBase +
          '&to=' +
          encodeURIComponent(orderMailto) +
          '&su=' +
          encodeURIComponent(subject) +
          '&body=' +
          encodeURIComponent(body)
        );
      case 'mailto':
      default:
        return mailtoUri;
    }
  };

  const shortenHref = (provider, subject, bodyText) => {
    const note = '\n\n[Текст укорочен — при необходимости допишите детали в письме.]';
    const maxLen = provider === 'gmail' ? 2000 : 1850;
    let b = bodyText;
    let href = buildHrefForProvider(provider, subject, b);
    while (href.length > maxLen && b.length > 40) {
      b = b.slice(0, Math.floor(b.length * 0.88));
      href = buildHrefForProvider(provider, subject, b + note);
    }
    return href;
  };

  const resolveMailProvider = () => {
    const mode = String(window.ORDER_OPEN_MODE || 'chooser')
      .trim()
      .toLowerCase();
    if (['yandex', 'mailru', 'gmail', 'mailto'].includes(mode)) return mode;
    return null;
  };

  const openMailProviderModal = () =>
    new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'mail-modal';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'mail-modal-title');
      overlay.innerHTML = `
      <div class="mail-modal__panel">
        <h2 id="mail-modal-title" class="mail-modal__title">Где открыть письмо?</h2>
        <p class="mail-modal__hint">Браузер не сообщает сайту, в какой почте вы авторизованы. Укажите тот сервис, где вы уже вошли в аккаунт.</p>
        <div class="mail-modal__btns">
          <button type="button" class="btn btn--primary mail-modal__pick" data-provider="yandex">Яндекс</button>
          <button type="button" class="btn btn--primary mail-modal__pick" data-provider="mailru">Mail.ru</button>
          <button type="button" class="btn btn--primary mail-modal__pick" data-provider="gmail">Gmail</button>
          <button type="button" class="btn btn--primary mail-modal__pick" data-provider="mailto">Почта на компьютере</button>
        </div>
        <button type="button" class="mail-modal__cancel btn btn--ghost">Отмена</button>
      </div>`;
      document.body.appendChild(overlay);

      let onKey = null;
      const close = () => {
        if (onKey) document.removeEventListener('keydown', onKey);
        overlay.remove();
      };

      onKey = (e) => {
        if (e.key === 'Escape') {
          close();
          resolve(null);
        }
      };
      document.addEventListener('keydown', onKey);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          close();
          resolve(null);
        }
      });

      overlay.querySelectorAll('.mail-modal__pick').forEach((btn) => {
        btn.addEventListener('click', () => {
          const provider = btn.getAttribute('data-provider');
          close();
          resolve({ provider });
        });
      });

      overlay.querySelector('.mail-modal__cancel').addEventListener('click', () => {
        close();
        resolve(null);
      });
    });

  const toastAfterProvider = (provider) => {
    if (provider === 'yandex') {
      return 'Открывается Яндекс.Почта. Войдите в аккаунт, если попросит.';
    }
    if (provider === 'mailru') {
      return 'Открывается Почта Mail.ru. Войдите в аккаунт, если попросит.';
    }
    if (provider === 'gmail') {
      return 'Открывается Gmail. Войдите в аккаунт Google, если попросит.';
    }
    return 'Должен открыться почтовый клиент. Если нет — задайте почту по умолчанию в Windows.';
  };

  // Year
  initYandexMetrika();
  appendUtmToInternalLinks();
  initGoalListeners();
  initCalltracking();
  window.setTimeout(flushPendingGoals, 1200);

  const y = $('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());

  const nalichieUrl =
    typeof window.NALICHIE_PDF_URL === 'string' && window.NALICHIE_PDF_URL.trim() !== ''
      ? window.NALICHIE_PDF_URL.trim()
      : './media/nalichie_ooo_kb_lider-stal.pdf';
  $$('a[data-nalichie]').forEach((a) => {
    a.setAttribute('href', nalichieUrl);
  });

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

  // Gallery lightbox (about.html)
  const gallery = $('[data-gallery]');
  const galleryModal = $('[data-gallery-modal]');
  const galleryModalImage = $('[data-gallery-image]');
  const galleryClose = $('[data-gallery-close]');
  const galleryPrev = $('[data-gallery-prev]');
  const galleryNext = $('[data-gallery-next]');
  if (gallery && galleryModal && galleryModalImage) {
    const links = $$('a.gallery__item', gallery);
    let activeIndex = 0;

    const renderGalleryImage = () => {
      const link = links[activeIndex];
      if (!link) return;
      const img = $('img', link);
      galleryModalImage.src = link.getAttribute('href') || '';
      galleryModalImage.alt = img?.getAttribute('alt') || 'Фото';
    };

    const openGallery = (index) => {
      activeIndex = index;
      renderGalleryImage();
      galleryModal.classList.add('is-open');
      galleryModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeGallery = () => {
      galleryModal.classList.remove('is-open');
      galleryModal.setAttribute('aria-hidden', 'true');
      galleryModalImage.src = '';
      document.body.style.overflow = '';
    };

    const showPrev = () => {
      activeIndex = (activeIndex - 1 + links.length) % links.length;
      renderGalleryImage();
    };

    const showNext = () => {
      activeIndex = (activeIndex + 1) % links.length;
      renderGalleryImage();
    };

    links.forEach((link, index) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openGallery(index);
      });
    });

    galleryClose?.addEventListener('click', closeGallery);
    galleryPrev?.addEventListener('click', showPrev);
    galleryNext?.addEventListener('click', showNext);
    galleryModal.addEventListener('click', (e) => {
      if (e.target === galleryModal) closeGallery();
    });

    document.addEventListener('keydown', (e) => {
      if (!galleryModal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    });
  }

  // Заявки: веб-почта (Яндекс / Mail.ru / Gmail) или mailto — см. config.js.
  $$('[data-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
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
      const subject = String(fd.get('_subject') || 'Заявка КБ Лидер-Сталь').trim();
      const utm = getUtmPayload();
      const utmRows = Object.keys(utm).map((k) => `${k}: ${utm[k]}`);
      const bodyText = ['Имя: ' + name, 'Телефон: ' + phone, '', 'Сообщение:', msg]
        .concat(utmRows.length ? ['', 'UTM:', ...utmRows] : [])
        .join('\n');

      let provider = resolveMailProvider();
      if (!provider) {
        const picked = await openMailProviderModal();
        if (!picked || !picked.provider) return;
        provider = picked.provider;
      }

      const href = shortenHref(provider, subject, bodyText);
      sendGoal(ymGoalFormSubmit, { form: form.getAttribute('class') || 'data-form' });
      window.location.assign(href);
      showToast(toastAfterProvider(provider));
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

