class Cards {
  constructor() {
    this.container = document.querySelector('[data-cards]');
    this.mainFooter = document.querySelector('[data-main-footer]');
    this.noCards = document.querySelector('[data-no-cards]');
    this.addCard = document.querySelector('[data-add-card]');
    this.addCardPanel = document.querySelector('[data-add-card-panel]');
    this.addCardPanelClose = document.querySelector('[data-add-card-panel-close]');
    this.form = document.querySelector('[data-add-card-form]');
    this.data = JSON.parse(localStorage.getItem("storedCards"));
    this.mainCard = document.querySelector('[data-card]');
    this.english = document.querySelector('[data-card-en]');
    this.example = document.querySelector('[data-card-ex]');
    this.translate = document.querySelector('[data-card-tr]');
    this.prev = document.querySelector('[data-prev]');
    this.next = document.querySelector('[data-next]');
    this.counter = document.querySelector('[data-counter]');
    this.voiceButton = document.querySelector('[data-generate-voice-output]');
    this.initialState = true;
    this.index = 0;
  }

  init() {
    this.toggleMode();
    this.initAddCard();
  }

  toggleMode() {
    if (this.data && this.data.length > 0 && this.initialState) {
      this.container.classList.remove('hidden');
      this.noCards.classList.add('hidden');
      this.initialState = false;
      this.renderCard();
      this.mainFooter.classList.remove('hidden');
    } else if (!this.data || !this.data.length) {
      this.initialState = true;
      this.container.classList.add('hidden');
      this.noCards.classList.remove('hidden');
      this.mainFooter.classList.add('hidden');
    };
  }

  clearForm(elements) {
    elements['english'].value = '';
    elements['translate'].value = '';
    elements['example'].value = '';
    this.addCardPanel.classList.remove('open');
  }

  initAddCard() {
    this.addCard.addEventListener('click', () => {
      this.addCardPanel.classList.add('open')
      this.form.elements['english'].focus();
    });
    this.addCardPanelClose.addEventListener('click', () => {
      this.addCardPanel.classList.remove('open')
    })
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();

      this.createCard({
        id: crypto.randomUUID(),
        english: e.target.elements['english'].value,
        translate: e.target.elements['translate'].value,
        example: e.target.elements['example'].value,
      })

      this.clearForm(e.target.elements);
    })
    this.mainCard.addEventListener('click', (e) => {
      if (
        e.target.classList.contains('card__delete')
        || e.target.parentElement.classList.contains('card__delete')
        || e.target.parentElement.parentElement.classList.contains('card__delete')
      ) {
        this.removeCard();
        return;
      }

      if (
        e.target.classList.contains('voice')
        || e.target.parentElement.classList.contains('voice')
        || e.target.parentElement.parentElement.classList.contains('voice')
      ) {
        this.generateVoiceOutput()
        return
      }
      this.mainCard.classList.toggle('card__flipped');
    })
    this.prev.addEventListener('click', () => {
      this.index --
      this.renderCard()
    })
    this.next.addEventListener('click', () => {
      this.index ++
      this.renderCard()
    })
  }

  showNoCardsMessage() {
    this.container.classList.toggle('hidden');
    this.noCards.classList.toggle('hidden');
  }

  renderCard(type = null) {
    const lastIndex = this.data.length - 1;

    if (type === 'delete') {
      this.index = this.index - 1;
      if (this.index < 0) this.index = 0;
    } else {
      if (this.index > lastIndex) this.index = 0;
      if (this.index < 0) this.index = lastIndex;
    };

    this.english.dataset.cardEn = this.data[this.index].english;
    this.english.textContent = this.data[this.index].english;
    this.example.textContent = this.data[this.index].example;
    this.translate.textContent = this.data[this.index].translate;
    this.counter.textContent = this.index + 1;
  }

  createCard(data) {
    this.storeCard(data);
    this.toggleMode();
    if (this.data.length === 1) {
      this.renderCard();
      this.counter.textContent = this.index + 1;
    } else {
      this.index = this.data.length - 1;
      this.renderCard();
    }
  }

  storeCard(data) {
    this.data = [...JSON.parse(localStorage.getItem("storedCards")) || [], data];
    localStorage.setItem("storedCards", JSON.stringify(this.data));
  }

  removeCard() {
    const newData = this.data.filter((_, inx) => inx !== this.index )
    this.data = newData;
    localStorage.setItem("storedCards", JSON.stringify(newData));
    if (!this.data.length) {
      this.toggleMode();
    } else this.renderCard('delete');
  }

  generateVoiceOutput () {
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance(this.english.dataset.cardEn);
    utterThis.lang = "en-US";
    utterThis.rate = 1;
    synth.speak(utterThis);
    this.voiceButton.disabled = true;

    utterThis.addEventListener("end", () => {
      this.voiceButton.disabled = false;
    });
  }
};

const app = new Cards();
app.init();
