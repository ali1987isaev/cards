class Cards {
  constructor() {
    // Core DOM nodes
    this.container = document.querySelector('[data-cards]');
    this.mainFooter = document.querySelector('[data-main-footer]');
    this.noCards = document.querySelector('[data-no-cards]');
    this.addCard = document.querySelector('[data-add-card]');
    this.addCardPanel = document.querySelector('[data-add-card-panel]');
    this.addCardPanelClose = document.querySelector('[data-add-card-panel-close]');
    this.form = document.querySelector('[data-add-card-form]');
    this.mainCard = document.querySelector('[data-card]');
    this.english = document.querySelector('[data-card-en]');
    this.example = document.querySelector('[data-card-ex]');
    this.translate = document.querySelector('[data-card-tr]');
    this.prev = document.querySelector('[data-prev]');
    this.next = document.querySelector('[data-next]');
    this.counter = document.querySelector('[data-counter]');
    this.voiceButton = document.querySelector('[data-generate-voice-output]');

    // Title above the cards with current person name
    this.setTitle = document.querySelector('[data-cards-title]');
    if (!this.setTitle && this.container && this.container.parentElement) {
      // If you didn't add it in HTML, create it dynamically
      this.setTitle = document.createElement('h2');
      this.setTitle.className = 'cards-title';
      this.setTitle.dataset.cardsTitle = '';
      this.container.parentElement.insertBefore(this.setTitle, this.container);
    }

    // Replace "Add card" label => we now choose a person
    if (this.addCard) {
      this.addCard.textContent = 'Choose person';
    }

    // All available people / JSON files
    // IMPORTANT: adjust `file` paths to match where you actually put the JSON files
    this.people = [
      { key: 'ali', label: 'Ali', file: './ali.json' },
      { key: 'amina', label: 'Amina', file: './amina.json' },
      { key: 'yusuf', label: 'Yusuf', file: './yusuf.json' },
      { key: 'muhammad', label: 'Muhammad', file: './muhammad.json' },
      { key: 'malik', label: 'Malik', file: './malik.json' }
    ];

    // Runtime state
    this.data = [];            // current cards list (from selected JSON)
    this.currentSetKey = null; // which person is selected
    this.initialState = true;
    this.index = 0;
  }

  init() {
    this.buildPeopleList();    // build list of persons in the side panel
    this.initChoosePanel();    // open/close panel events
    this.initCardInteractions(); // flip/prev/next/voice
    this.toggleMode();         // show empty state initially
  }

  // Build list of people inside the slide-in panel
  buildPeopleList() {
    if (!this.form) return;

    // Clear the old "add card" form UI completely
    this.form.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'choose-person-title';
    title.textContent = 'Choose whose cards you want to practice';
    this.form.appendChild(title);

    const list = document.createElement('div');
    list.className = 'person-list';
    this.form.appendChild(list);

    this.people.forEach(person => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'button button--primary person-button';
      btn.textContent = person.label;
      btn.addEventListener('click', () => this.handlePersonClick(person));
      list.appendChild(btn);
    });
  }

  initChoosePanel() {
    if (this.addCard) {
      this.addCard.addEventListener('click', () => {
        this.addCardPanel?.classList.add('open');
      });
    }

    if (this.addCardPanelClose) {
      this.addCardPanelClose.addEventListener('click', () => {
        this.addCardPanel?.classList.remove('open');
      });
    }
  }

  initCardInteractions() {
    if (!this.mainCard) return;

    this.mainCard.addEventListener('click', (e) => {
      // Voice button
      if (
        e.target.classList.contains('voice') ||
        e.target.parentElement?.classList.contains('voice') ||
        e.target.parentElement?.parentElement?.classList.contains('voice')
      ) {
        this.generateVoiceOutput();
        return;
      }

      // Just flip card
      this.mainCard.classList.toggle('card__flipped');
    });

    this.prev?.addEventListener('click', () => {
      this.index--;
      this.renderCard();
    });

    this.next?.addEventListener('click', () => {
      this.index++;
      this.renderCard();
    });
  }

  async handlePersonClick(person) {
    try {
      // Load JSON for selected person
      const response = await fetch(person.file, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to load ${person.file}`);
      }

      const json = await response.json();
      if (!Array.isArray(json) || !json.length) {
        throw new Error('JSON file is empty or has wrong format');
      }

      // Expecting array of objects with: english, translate, example
      this.data = json;
      this.currentSetKey = person.key;
      this.index = 0;
      this.initialState = true; // force toggleMode to treat this as a fresh state

      if (this.setTitle) {
        this.setTitle.textContent = `${person.label}'s cards`;
      }

      this.addCardPanel?.classList.remove('open');
      this.toggleMode();
    } catch (err) {
      console.error(err);
      alert(`Cannot load cards for ${person.label}. Check JSON path & format.`);
    }
  }

  toggleMode() {
    if (this.data && this.data.length > 0 && this.initialState) {
      this.container?.classList.remove('hidden');
      this.noCards?.classList.add('hidden');
      this.initialState = false;
      this.renderCard();
      this.mainFooter?.classList.remove('hidden');
    } else if (!this.data || !this.data.length) {
      this.initialState = true;
      this.container?.classList.add('hidden');
      this.noCards?.classList.remove('hidden');
      this.mainFooter?.classList.add('hidden');

      // Optional: tweak empty message
      const header = this.noCards?.querySelector('h2');
      if (header) {
        header.textContent = 'Choose a person to start practicing cards';
      }
    }
  }

  renderCard() {
    if (!this.data || !this.data.length || !this.mainCard) return;

    this.mainCard.classList.add('rendered');
    const lastIndex = this.data.length - 1;

    if (this.index > lastIndex) this.index = 0;
    if (this.index < 0) this.index = lastIndex;

    const current = this.data[this.index];

    if (this.english) {
      this.english.dataset.cardEn = current.english;
      this.english.textContent = current.english;
    }
    if (this.example) {
      this.example.textContent = current.example || '';
    }
    if (this.translate) {
      this.translate.textContent = current.translate;
    }
    if (this.counter) {
      this.counter.textContent = this.index + 1;
    }

    setTimeout(() => this.mainCard.classList.remove('rendered'), 200);
  }

  generateVoiceOutput() {
    if (!this.english) return;
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance(this.english.dataset.cardEn);
    utterThis.lang = 'en-US';
    utterThis.rate = 1;
    synth.speak(utterThis);
    if (this.voiceButton) {
      this.voiceButton.disabled = true;
      utterThis.addEventListener('end', () => {
        this.voiceButton.disabled = false;
      });
    }
  }
}

const app = new Cards();
app.init();
