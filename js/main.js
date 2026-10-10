const SCRAMBLE_CHARS = '^˄ˆˇ';

const DOT_EFFECT_RADIUS = 240;
const TEXT_EFFECT_RADIUS = 260;
const MIN_OPACITY = 0.08;
const MAX_OPACITY = 0.8;
const MAX_SCALE = 2;
const PUSH_DISTANCE = 12;

const dotsPattern = document.querySelector('#dotsPattern');

let STEP = 0;
let DOT_SIZE = 0;
let dots = [];

function isDesktop() {
  return window.innerWidth > 768;
}

/* ==================== DOTS ==================== */

function updateSizes() {
  if (window.innerWidth <= 768) {
    STEP = 34;
    DOT_SIZE = 2;
  } else {
    STEP = window.innerWidth * 0.0417;
    DOT_SIZE = window.innerWidth * 0.002083;
  }
}

function createDots() {
  if (!dotsPattern) return;

  dotsPattern.innerHTML = '';
  dots = [];

  const width = window.innerWidth;
  const height = window.innerHeight;

  const columns = Math.ceil(width / STEP) + 1;
  const rows = Math.ceil(height / STEP) + 1;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const element = document.createElement('span');

      element.className = 'bg-dot';

      const x = column * STEP + STEP / 2;
      const y = row * STEP + STEP / 2;

      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.width = `${DOT_SIZE}px`;
      element.style.height = `${DOT_SIZE}px`;
      element.style.opacity = MIN_OPACITY;
      element.style.transform = 'translate(0, 0) scale(1)';

      dotsPattern.appendChild(element);

      dots.push({
        element,
        x: x + DOT_SIZE / 2,
        y: y + DOT_SIZE / 2,
      });
    }
  }
}

/* ==================== SCRAMBLE ==================== */

const scrambleElements = [
  ...new Set(
    [
      document.querySelector('.hero-description'),
      document.querySelector('.project-link'),
      ...document.querySelectorAll('.nav-label'),
      document.querySelector('.about-page-title'),
      document.querySelector('.about-back'),
      document.querySelector('.services-page-title'),
      document.querySelector('.services-back'),
      document.querySelector('.cases-page-title'),
      document.querySelector('.cases-back'),
      ...document.querySelectorAll('.scramble-text'),
    ].filter(Boolean),
  ),
];

const scrambleGroups = [];

function canScramble(character) {
  return /[A-Za-zА-Яа-яЁё0-9]/.test(character);
}

function randomScrambleCharacter() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function prepareScrambleElement(element, groupIndex) {
  const characters = [];

  function createCharacter(character) {
    if (!canScramble(character)) {
      return document.createTextNode(character);
    }

    const span = document.createElement('span');

    span.className = 'scramble-char';
    span.textContent = character;
    span.style.display = 'inline-block';

    characters.push({
      element: span,
      original: character,
      speed: 55 + Math.random() * 80,
      lastChange: 0,
    });

    return span;
  }

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();
      const tokens = node.nodeValue.split(/(\s+)/);

      tokens.forEach((token) => {
        if (!token) return;

        if (/^\s+$/.test(token)) {
          fragment.appendChild(document.createTextNode(token));
          return;
        }

        const word = document.createElement('span');
        word.className = 'scramble-word';

        [...token].forEach((character) => {
          word.appendChild(createCharacter(character));
        });

        fragment.appendChild(word);
      });

      node.replaceWith(fragment);
      return;
    }

    if (node.nodeName === 'BR') return;

    [...node.childNodes].forEach(processNode);
  }

  [...element.childNodes].forEach(processNode);

  scrambleGroups.push({
    element,
    characters,
    sensitivity: 0.82 + (groupIndex % 4) * 0.04,
  });
}

/*
  Scramble создаём только на desktop.
  На мобильном HTML-текст остаётся обычным.
*/

if (isDesktop()) {
  scrambleElements.forEach((element, index) => {
    prepareScrambleElement(element, index);
  });
}

/* ==================== SCRAMBLE HELPERS ==================== */

function distanceToRect(mouseX, mouseY, rect) {
  const closestX = Math.max(rect.left, Math.min(mouseX, rect.right));

  const closestY = Math.max(rect.top, Math.min(mouseY, rect.bottom));

  const dx = mouseX - closestX;
  const dy = mouseY - closestY;

  return Math.sqrt(dx * dx + dy * dy);
}

function restoreGroup(group) {
  group.characters.forEach((character) => {
    character.element.textContent = character.original;
  });
}

/* ==================== MOUSE ==================== */

let mouseX = -9999;
let mouseY = -9999;
let mouseInside = false;

window.addEventListener('mousemove', (event) => {
  if (!isDesktop()) return;

  mouseX = event.clientX;
  mouseY = event.clientY;
  mouseInside = true;
});

document.addEventListener('mouseleave', () => {
  mouseInside = false;

  dots.forEach((dot) => {
    dot.element.style.opacity = MIN_OPACITY;

    dot.element.style.transform = 'translate(0, 0) scale(1)';
  });

  scrambleGroups.forEach(restoreGroup);
});

/* ==================== ANIMATION ==================== */

function animate(now) {
  if (isDesktop() && mouseInside) {
    animateDots();
    animateScramble(now);
  }

  requestAnimationFrame(animate);
}

function animateDots() {
  dots.forEach((dot) => {
    const dx = dot.x - mouseX;
    const dy = dot.y - mouseY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= DOT_EFFECT_RADIUS) {
      dot.element.style.opacity = MIN_OPACITY;

      dot.element.style.transform = 'translate(0, 0) scale(1)';

      return;
    }

    const strength = 1 - distance / DOT_EFFECT_RADIUS;

    const easedStrength = strength * strength;

    const opacity = MIN_OPACITY + easedStrength * (MAX_OPACITY - MIN_OPACITY);

    const scale = 1 + easedStrength * (MAX_SCALE - 1);

    let directionX = 0;
    let directionY = 0;

    if (distance > 0) {
      directionX = dx / distance;
      directionY = dy / distance;
    }

    const push = easedStrength * PUSH_DISTANCE;

    const moveX = directionX * push;

    const moveY = directionY * push;

    dot.element.style.opacity = opacity;

    dot.element.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
  });
}

function animateScramble(now) {
  scrambleGroups.forEach((group) => {
    const rect = group.element.getBoundingClientRect();

    const distance = distanceToRect(mouseX, mouseY, rect);

    if (distance >= TEXT_EFFECT_RADIUS) {
      restoreGroup(group);
      return;
    }

    const strength = 1 - distance / TEXT_EFFECT_RADIUS;

    const easedStrength = strength * strength;

    const probability = Math.min(
      0.42,
      easedStrength * group.sensitivity * 0.55,
    );

    group.characters.forEach((character) => {
      const interval = Math.max(40, character.speed - strength * 20);

      if (now - character.lastChange < interval) {
        return;
      }

      character.lastChange = now;

      if (Math.random() < probability) {
        character.element.textContent = randomScrambleCharacter();
      } else {
        character.element.textContent = character.original;
      }
    });
  });
}

/* ==================== RESIZE ==================== */

let resizeTimer;

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    updateSizes();
    createDots();
  }, 150);
});

/* ==================== CONTACTS ==================== */

const contactsButton = document.querySelector('#contactsButton');

const contactsPopup = document.querySelector('#contactsPopup');

const contactsClose = document.querySelector('#contactsClose');

if (contactsButton && contactsPopup) {
  contactsButton.addEventListener('click', () => {
    if (!isDesktop()) return;

    contactsPopup.classList.toggle('is-open');

    contactsButton.setAttribute(
      'aria-expanded',
      contactsPopup.classList.contains('is-open') ? 'true' : 'false',
    );
  });
}

if (contactsClose && contactsPopup) {
  contactsClose.addEventListener('click', () => {
    contactsPopup.classList.remove('is-open');

    if (contactsButton) {
      contactsButton.setAttribute('aria-expanded', 'false');
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && contactsPopup) {
    contactsPopup.classList.remove('is-open');

    if (contactsButton) {
      contactsButton.setAttribute('aria-expanded', 'false');
    }
  }
});

/* ==================== ANALYTICS ==================== */

const analyticsConsent = document.querySelector('#analyticsConsent');

const analyticsAccept = document.querySelector('#analyticsAccept');

const analyticsDecline = document.querySelector('#analyticsDecline');

const ANALYTICS_CONSENT_KEY = 'davideo-analytics-consent';

function loadAnalytics() {
  const METRIKA_ID = 113580337;

  // Не запускаем Метрику повторно
  if (window.__davideoMetrikaLoaded) {
    return;
  }

  window.__davideoMetrikaLoaded = true;

  // Создаём очередь команд Яндекс Метрики
  window.ym =
    window.ym ||
    function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };

  window.ym.l = 1 * new Date();

  // Подключаем официальный скрипт Яндекс Метрики
  const script = document.createElement('script');

  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + METRIKA_ID;

  script.setAttribute('data-yandex-metrika', 'true');

  document.head.appendChild(script);

  // Инициализируем счётчик
  window.ym(METRIKA_ID, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });
}

if (analyticsConsent) {
  const analyticsChoice = localStorage.getItem(ANALYTICS_CONSENT_KEY);

  if (analyticsChoice === 'accepted') {
    loadAnalytics();
  } else if (analyticsChoice === 'declined') {
    analyticsConsent.classList.remove('is-visible');
  } else {
    analyticsConsent.classList.add('is-visible');
  }
}

if (analyticsAccept) {
  analyticsAccept.addEventListener('click', () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'accepted');

    if (analyticsConsent) {
      analyticsConsent.classList.remove('is-visible');
    }

    loadAnalytics();
  });
}

if (analyticsDecline) {
  analyticsDecline.addEventListener('click', () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'declined');

    if (analyticsConsent) {
      analyticsConsent.classList.remove('is-visible');
    }
  });
}

/* ==================== INIT ==================== */

updateSizes();
createDots();
requestAnimationFrame(animate);
