// Єдиний vanilla-скрипт ефектів: порт `componentDidMount`/`tick` з Main.dc.html без React.
import { buildAskMessage } from '../lib/ask-message';

const root = document.querySelector<HTMLElement>('.nl');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (root) {
  root.classList.add('js');
  initReveal(root);
  initScrollEffects(root);
  initMenu(root);
  initPill(root);
  initTabs(root);
  initAsk(root);
  if (!reduceMotion) {
    initTilt(root);
    initMagnet(root);
  }
}

// ── Частина 1: scroll-ефекти ────────────────────────────────────────────────

function initReveal(r: HTMLElement) {
  const els = r.querySelectorAll<HTMLElement>('.rv, .rv-line');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    els.forEach((e) => io.observe(e));
  } else {
    els.forEach((e) => e.classList.add('in'));
  }
}

function initScrollEffects(r: HTMLElement) {
  const hero = r.querySelector<HTMLElement>('.hero');
  const heroImg = r.querySelector<HTMLElement>('.hero-img');
  const band = r.querySelector<HTMLElement>('.band');
  const bandImg = r.querySelector<HTMLElement>('.band-img');
  const steps = r.querySelector<HTMLElement>('.steps');
  const stepEls = steps ? [...steps.querySelectorAll<HTMLElement>('.step')] : [];

  let raf = 0;
  const tick = () => {
    raf = 0;
    const vh = window.innerHeight || 800;
    const rr = r.getBoundingClientRect();
    const total = rr.height - vh;
    const p = total > 0 ? Math.min(1, Math.max(0, -rr.top / total)) : 0;
    r.style.setProperty('--sp', p.toFixed(4));

    if (hero && heroImg) {
      const hr = hero.getBoundingClientRect();
      r.classList.toggle('scrolled', hr.top < -40);
      if (!reduceMotion && window.innerWidth > 860) {
        heroImg.style.transform = `translate3d(0,${(Math.max(0, -hr.top) * 0.28).toFixed(1)}px,0) scale(1.06)`;
      } else {
        heroImg.style.transform = '';
      }
    }
    if (band && bandImg && !reduceMotion) {
      const br = band.getBoundingClientRect();
      const off = (br.top + br.height / 2 - vh / 2) * -0.12;
      bandImg.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
    }
    if (steps) {
      const sr = steps.getBoundingClientRect();
      const lp = Math.min(1, Math.max(0, (vh * 0.8 - sr.top) / (vh * 0.45)));
      steps.style.setProperty('--line', lp.toFixed(3));
      stepEls.forEach((s, i) => {
        s.classList.toggle('act', lp >= (i + 0.5) / 4 || (s.getBoundingClientRect().top < vh * 0.6 && window.innerWidth <= 1100));
      });
    }
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  window.addEventListener('resize', onScroll);
  tick();
}

// ── Частина 2: pointer-ефекти ───────────────────────────────────────────────

function initTilt(r: HTMLElement) {
  r.querySelectorAll<HTMLElement>('.card').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width;
      const y = (e.clientY - b.top) / b.height;
      el.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

function initMagnet(r: HTMLElement) {
  r.querySelectorAll<HTMLElement>('.btn-dark').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const b = el.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2);
      const dy = e.clientY - (b.top + b.height / 2);
      el.style.transform = `translate(${(dx * 0.18).toFixed(1)}px,${(dy * 0.3).toFixed(1)}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

function initPill(r: HTMLElement) {
  const nav = r.querySelector<HTMLElement>('.nav');
  const pill = r.querySelector<HTMLElement>('.pill');
  if (!nav || !pill) return;
  const show = (t: HTMLElement) => {
    pill.style.transform = `translateX(${t.offsetLeft}px)`;
    pill.style.width = `${t.offsetWidth}px`;
    pill.style.opacity = '1';
  };
  nav.querySelectorAll<HTMLElement>('.roll').forEach((a) => {
    a.addEventListener('mouseenter', () => show(a));
    a.addEventListener('focus', () => show(a));
  });
  nav.addEventListener('mouseleave', () => {
    pill.style.opacity = '0';
  });
}

// ── Частина 3: вкладки, меню, «запитати про товар» ──────────────────────────

function initTabs(r: HTMLElement) {
  const tabs = [...r.querySelectorAll<HTMLButtonElement>('.tab')];
  const panels = [...r.querySelectorAll<HTMLElement>('[data-panel]')];
  const ind = r.querySelector<HTMLElement>('.tab-ind');

  const select = (i: number, focus = false) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach((p, j) => {
      p.hidden = i !== j;
    });
    if (ind) ind.style.transform = `translateX(${i * 100}%)`;
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : -1;
      if (next >= 0) {
        e.preventDefault();
        select(next, true);
      }
    });
  });
}

function initMenu(r: HTMLElement) {
  const burger = r.querySelector<HTMLButtonElement>('.burger');
  const menu = r.querySelector<HTMLElement>('.mnav');
  if (!burger || !menu) return;
  const set = (open: boolean) => {
    burger.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.inert = !open;
  };
  burger.addEventListener('click', () => set(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      set(false);
      burger.focus();
    }
  });
}

function initAsk(r: HTMLElement) {
  r.querySelectorAll<HTMLElement>('[data-ask]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const textarea = r.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
      if (textarea) {
        textarea.value = buildAskMessage(btn.dataset.ask ?? '');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      document.getElementById('kontakt')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => textarea?.focus({ preventScroll: true }), reduceMotion ? 0 : 900);
    });
  });
}
