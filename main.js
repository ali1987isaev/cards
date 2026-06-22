class EnglishCardsApp {
  constructor() {
    this.sets = {
      words: { label: 'Words', file: './words.json', type: 'word' },
      expressions: { label: 'Expressions', file: './expressions.json', type: 'expression' }
    };

    this.storageKey = 'english-cards-progress-v3';
    this.activeSet = localStorage.getItem('english-cards-active-set') || 'words';
    this.mode = 'all';
    this.cards = [];
    this.filteredCards = [];
    this.index = 0;
    this.isRevealed = false;
    this.progress = this.readProgress();

    this.nodes = {
      panel: document.querySelector('[data-library-panel]'),
      openLibrary: document.querySelector('[data-open-library]'),
      closeLibrary: document.querySelector('[data-close-library]'),
      setButtons: document.querySelectorAll('[data-set]'),
      modeButtons: document.querySelectorAll('[data-mode]'),
      totalCards: document.querySelector('[data-total-cards]'),
      masteredCards: document.querySelector('[data-mastered-cards]'),
      reviewCards: document.querySelector('[data-review-cards]'),
      card: document.querySelector('[data-card]'),
      emptyState: document.querySelector('[data-empty-state]'),
      cardType: document.querySelector('[data-card-type]'),
      counter: document.querySelector('[data-counter]'),
      term: document.querySelector('[data-term]'),
      hint: document.querySelector('[data-hint]'),
      frontExample: document.querySelector('[data-front-example]'),
      answer: document.querySelector('[data-answer]'),
      translation: document.querySelector('[data-translation]'),
      definition: document.querySelector('[data-definition]'),
      examples: document.querySelector('[data-examples]'),
      extra: document.querySelector('[data-extra]'),
      speakTerm: document.querySelector('[data-speak-term]'),
      speakExample: document.querySelector('[data-speak-example]'),
      prev: document.querySelector('[data-prev]'),
      next: document.querySelector('[data-next]'),
      flip: document.querySelector('[data-flip]'),
      reviewActions: document.querySelector('[data-review-actions]'),
      rateButtons: document.querySelectorAll('[data-rate]')
    };
  }

  async init() {
    this.bindEvents();
    await this.loadSet(this.activeSet);
  }

  bindEvents() {
    this.nodes.openLibrary?.addEventListener('click', () => this.openPanel());
    this.nodes.closeLibrary?.addEventListener('click', () => this.closePanel());

    this.nodes.setButtons.forEach((button) => {
      button.addEventListener('click', () => this.loadSet(button.dataset.set));
    });

    this.nodes.modeButtons.forEach((button) => {
      button.addEventListener('click', () => this.setMode(button.dataset.mode));
    });

    this.nodes.card?.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      this.toggleAnswer();
    });

    this.nodes.flip?.addEventListener('click', () => this.toggleAnswer());
    this.nodes.prev?.addEventListener('click', () => this.goToCard(this.index - 1));
    this.nodes.next?.addEventListener('click', () => this.goToCard(this.index + 1));
    this.nodes.speakTerm?.addEventListener('click', () => this.speak(this.currentCard?.term));
    this.nodes.speakExample?.addEventListener('click', () => this.speak(this.currentCard?.frontExample));

    this.nodes.rateButtons.forEach((button) => {
      button.addEventListener('click', () => this.rateCard(button.dataset.rate));
    });
  }

  async loadSet(setKey) {
    const set = this.sets[setKey] || this.sets.words;

    try {
      const response = await fetch(set.file, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Cannot load ${set.file}`);

      const cards = await response.json();
      this.activeSet = setKey;
      this.cards = this.normalizeCards(cards, set.type);
      this.index = 0;
      this.isRevealed = false;

      localStorage.setItem('english-cards-active-set', setKey);
      this.updateActiveSetButton();
      this.applyFilter();
      this.closePanel();
    } catch (error) {
      console.error(error);
      alert('Cards cannot be loaded. Please check the JSON file.');
    }
  }

  normalizeCards(cards, fallbackType) {
    if (!Array.isArray(cards)) return [];

    return cards.map((card, cardIndex) => {
      const term = card.term || card.english || '';
      const id = card.id || this.slugify(term) || `${fallbackType}-${cardIndex}`;
      const examples = Array.isArray(card.examples)
        ? card.examples.filter(Boolean)
        : [card.example].filter(Boolean);

      return {
        id,
        type: card.type || fallbackType,
        term,
        translation: card.translation || card.translate || '',
        definition: card.definition || '',
        examples,
        frontExample: card.frontExample || examples[0] || '',
        notes: card.notes || '',
        level: card.level || '',
        category: card.category || 'General'
      };
    }).filter((card) => card.term);
  }

  applyFilter() {
    const now = Date.now();

    this.filteredCards = this.cards.filter((card) => {
      const state = this.getCardState(card.id);
      if (this.mode === 'review') return state.nextReview <= now;
      if (this.mode === 'new') return state.repetitions === 0;
      if (this.mode === 'hard') return state.lastRating === 'hard' || state.lastRating === 'again';
      return true;
    });

    if (this.index >= this.filteredCards.length) this.index = 0;
    this.render();
  }

  setMode(mode) {
    this.mode = mode;
    this.index = 0;
    this.isRevealed = false;

    this.nodes.modeButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === mode);
    });

    this.applyFilter();
  }

  render() {
    this.updateStats();

    if (!this.filteredCards.length) {
      this.nodes.card?.classList.add('hidden');
      this.nodes.emptyState?.classList.remove('hidden');
      this.nodes.reviewActions?.classList.add('hidden');
      this.nodes.counter.textContent = `0 / ${this.cards.length}`;
      return;
    }

    this.nodes.card?.classList.remove('hidden');
    this.nodes.emptyState?.classList.add('hidden');

    const card = this.currentCard;
    const state = this.getCardState(card.id);

    this.nodes.card.classList.toggle('is-revealed', this.isRevealed);
    this.nodes.cardType.textContent = `${this.isRevealed ? 'Back' : 'Front'} · ${this.sets[this.activeSet].label}${card.level ? ` · ${card.level}` : ''}`;
    this.nodes.counter.textContent = `${this.index + 1} / ${this.filteredCards.length}`;
    this.nodes.term.textContent = card.term;
    this.nodes.translation.textContent = card.translation;
    this.nodes.definition.textContent = card.definition || 'Try to understand it from the example sentence.';
    this.nodes.hint.textContent = this.isRevealed
      ? 'Check the meaning, read examples aloud, then rate the card.'
      : 'Remember the meaning first. Tap the card only when you are ready.';
    this.nodes.frontExample.textContent = card.frontExample || 'No context sentence yet. Add one example to this card later.';
    this.nodes.answer.hidden = !this.isRevealed;
    this.nodes.flip.textContent = this.isRevealed ? 'Hide answer' : 'Show answer';
    this.nodes.reviewActions?.classList.toggle('hidden', !this.isRevealed);

    this.renderExamples(card.examples);
    this.renderExtra(card, state);
    this.nodes.card.classList.remove('card-change');
    requestAnimationFrame(() => this.nodes.card.classList.add('card-change'));
  }

  renderExamples(examples) {
    this.nodes.examples.innerHTML = '';

    if (!examples.length) {
      const empty = document.createElement('p');
      empty.className = 'example-card';
      empty.textContent = 'Add one or two real examples to this card later.';
      this.nodes.examples.appendChild(empty);
      return;
    }

    examples.forEach((example) => {
      const item = document.createElement('div');
      item.className = 'example-card';

      const text = document.createElement('p');
      text.textContent = example;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mini-voice';
      button.textContent = 'Listen';
      button.addEventListener('click', () => this.speak(example));

      item.append(text, button);
      this.nodes.examples.appendChild(item);
    });
  }

  renderExtra(card, state) {
    const nextDate = state.nextReview > Date.now()
      ? new Date(state.nextReview).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : 'today';

    this.nodes.extra.innerHTML = `
      <span>${card.category}</span>
      <span>Reviewed ${state.repetitions}x</span>
      <span>Next: ${nextDate}</span>
      ${card.notes ? `<span>${card.notes}</span>` : ''}
    `;
  }

  updateStats() {
    const now = Date.now();
    const states = this.cards.map((card) => this.getCardState(card.id));
    const mastered = states.filter((state) => state.repetitions >= 4 && state.lastRating === 'easy').length;
    const review = states.filter((state) => state.nextReview <= now && state.repetitions > 0).length;

    this.nodes.totalCards.textContent = this.cards.length;
    this.nodes.masteredCards.textContent = mastered;
    this.nodes.reviewCards.textContent = review;
  }

  toggleAnswer() {
    if (!this.filteredCards.length) return;
    this.isRevealed = !this.isRevealed;
    this.render();
  }

  goToCard(nextIndex) {
    if (!this.filteredCards.length) return;

    if (nextIndex < 0) this.index = this.filteredCards.length - 1;
    else if (nextIndex >= this.filteredCards.length) this.index = 0;
    else this.index = nextIndex;

    this.isRevealed = false;
    this.render();
  }

  rateCard(rating) {
    const card = this.currentCard;
    if (!card) return;

    const state = this.getCardState(card.id);
    const intervals = {
      again: 5 * 60 * 1000,
      hard: 24 * 60 * 60 * 1000,
      good: Math.max(2, state.repetitions + 1) * 24 * 60 * 60 * 1000,
      easy: Math.max(4, (state.repetitions + 1) * 3) * 24 * 60 * 60 * 1000
    };

    this.progress[card.id] = {
      repetitions: state.repetitions + 1,
      lastRating: rating,
      nextReview: Date.now() + intervals[rating]
    };

    this.saveProgress();
    this.goToCard(this.index + 1);
  }

  speak(text) {
    if (!text || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  openPanel() {
    this.nodes.panel?.classList.add('open');
    this.nodes.panel?.setAttribute('aria-hidden', 'false');
  }

  closePanel() {
    this.nodes.panel?.classList.remove('open');
    this.nodes.panel?.setAttribute('aria-hidden', 'true');
  }

  updateActiveSetButton() {
    this.nodes.setButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.set === this.activeSet);
    });
  }

  get currentCard() {
    return this.filteredCards[this.index];
  }

  getCardState(cardId) {
    return this.progress[cardId] || {
      repetitions: 0,
      lastRating: 'new',
      nextReview: 0
    };
  }

  readProgress() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || {};
    } catch (_) {
      return {};
    }
  }

  saveProgress() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
  }

  slugify(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

const app = new EnglishCardsApp();
app.init();
