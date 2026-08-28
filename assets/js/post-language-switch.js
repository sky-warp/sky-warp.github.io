---
---

(() => {
  'use strict';

  const RUSSIAN = 'ru-RU';
  const ENGLISH = 'en';
  const STORAGE_KEY = 'blog-post-language';

  const posts = [
    {% for original in site.posts %}
      {% assign english_candidates = site.translations | where: 'translation_key', original.translation_key %}
      {% assign english_translation = english_candidates | where: 'lang', 'en' | first %}
      {% if english_translation %}
        {% assign post = english_translation %}
        {% capture english_summary %}{% include post-summary.html %}{% endcapture %}
      {% endif %}
      {
        sourceUrl: {{ original.url | relative_url | jsonify }},
        english: {% if english_translation %}{
          url: {{ english_translation.url | relative_url | jsonify }},
          title: {{ english_translation.title | jsonify }},
          summary: {{ english_summary | strip | jsonify }}
        }{% else %}null{% endif %}
      }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];

  function normalizePath(url) {
    try {
      const path = decodeURI(new URL(url, document.baseURI).pathname);
      return path === '/' ? path : path.replace(/\/+$/, '');
    } catch (_error) {
      return url;
    }
  }

  function readLanguage() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === ENGLISH ? ENGLISH : RUSSIAN;
    } catch (_error) {
      return RUSSIAN;
    }
  }

  function storeLanguage(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (_error) {
      // The switch still works for the current page when storage is unavailable.
    }
  }

  function createFallbackBadge() {
    const badge = document.createElement('span');
    badge.className = 'badge rounded-pill text-bg-secondary ms-2 align-middle';
    badge.textContent = 'RU only';
    return badge;
  }

  function initialize() {
    const postList = document.getElementById('post-list');
    const topbar = document.getElementById('topbar');

    if (!postList || !topbar) {
      return;
    }

    const postsByPath = new Map(posts.map((post) => [normalizePath(post.sourceUrl), post]));
    const cards = Array.from(postList.querySelectorAll('a.post-preview')).map((link) => {
      const title = link.querySelector('.card-title');
      const summary = link.querySelector('.card-text p');

      return {
        link,
        title,
        summary,
        post: postsByPath.get(normalizePath(link.getAttribute('href'))),
        original: {
          url: link.getAttribute('href'),
          title: title ? title.textContent : '',
          summary: summary ? summary.textContent : ''
        }
      };
    });

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'post-language-toggle';
    button.className = 'btn btn-link text-decoration-none';
    button.setAttribute('aria-controls', 'post-list');

    const searchTrigger = document.getElementById('search-trigger');
    if (searchTrigger) {
      topbar.insertBefore(button, searchTrigger);
    } else {
      topbar.appendChild(button);
    }

    let activeLanguage = readLanguage();

    function restoreOriginal(card) {
      card.link.setAttribute('href', card.original.url);

      if (card.title) {
        card.title.textContent = card.original.title;
      }

      if (card.summary) {
        card.summary.textContent = card.original.summary;
      }
    }

    function updateButton() {
      const isEnglish = activeLanguage === ENGLISH;
      const currentLabel = isEnglish ? 'EN' : 'RU';
      const nextLabel = isEnglish ? 'Russian' : 'English';

      button.innerHTML = `<i class="fas fa-language fa-fw" aria-hidden="true"></i><span>${currentLabel}</span>`;
      button.setAttribute('aria-label', `Post language is ${isEnglish ? 'English' : 'Russian'}. Switch to ${nextLabel}.`);
      button.setAttribute('title', `Switch posts to ${nextLabel}`);
      button.setAttribute('aria-pressed', String(isEnglish));
    }

    function updateCards() {
      cards.forEach((card) => {
        restoreOriginal(card);

        if (activeLanguage !== ENGLISH) {
          return;
        }

        if (card.post && card.post.english) {
          card.link.setAttribute('href', card.post.english.url);

          if (card.title) {
            card.title.textContent = card.post.english.title;
          }

          if (card.summary) {
            card.summary.textContent = card.post.english.summary;
          }
        } else if (card.title) {
          card.title.appendChild(createFallbackBadge());
        }
      });
    }

    function applyLanguage() {
      updateButton();
      updateCards();
    }

    button.addEventListener('click', () => {
      activeLanguage = activeLanguage === RUSSIAN ? ENGLISH : RUSSIAN;
      storeLanguage(activeLanguage);
      applyLanguage();
    });

    applyLanguage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
