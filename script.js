// State management
const appState = {
    decks: [],
    cardsByDeckId: {},
    activeDeckId: null,
    currentCardIndex: 0,
    studyCards: [],
    searchTimeout: null
};

// Storage module
const Storage = {
    save(state) {
        try {
            localStorage.setItem('flashcardsState', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    },

    load() {
        try {
            const data = localStorage.getItem('flashcardsState');
            if (data) {
                const parsed = JSON.parse(data);
                // Ensure fallback structure
                return {
                    decks: parsed.decks || [],
                    cardsByDeckId: parsed.cardsByDeckId || {},
                    activeDeckId: parsed.activeDeckId || null,
                    currentCardIndex: parsed.currentCardIndex || 0,
                    studyCards: parsed.studyCards || [],
                    searchTimeout: null
                };
            }
        } catch (e) {
            console.error('Failed to load state, using defaults:', e);
        }
        return {
            decks: [],
            cardsByDeckId: {},
            activeDeckId: null,
            currentCardIndex: 0,
            studyCards: [],
            searchTimeout: null
        };
    }
};

// Modal component
class Modal {
    static isOpen = false;

    constructor(options) {
        this.opener = options.opener;
        this.onSubmit = options.onSubmit;
        this.onClose = options.onClose;
        this.content = options.content;
        this.createModal();
    }

    createModal() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';

        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');

        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'modal-close';
        this.closeBtn.innerHTML = '&times;';
        this.closeBtn.setAttribute('aria-label', 'Close modal');

        this.contentEl = document.createElement('div');
        this.contentEl.className = 'modal-content';

        if (typeof this.content === 'function') {
            this.contentEl.appendChild(this.content());
        } else {
            this.contentEl.appendChild(this.content);
        }

        this.modal.appendChild(this.closeBtn);
        this.modal.appendChild(this.contentEl);
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);

        this.setupEvents();
    }

    setupEvents() {
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        this.closeBtn.addEventListener('click', () => this.close());
        this.keydownHandler = this.handleKeydown.bind(this);
        document.addEventListener('keydown', this.keydownHandler);
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.close();
        } else if (e.key === 'Tab') {
            this.trapFocus(e);
        }
    }

    trapFocus(e) {
        const focusable = this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === first) {
                last.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    }

    open() {
        Modal.isOpen = true;
        this.overlay.style.display = 'flex';
        const focusable = this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) focusable[0].focus();
    }

    close() {
        Modal.isOpen = false;
        this.overlay.style.display = 'none';
        if (this.onClose) this.onClose();
        if (this.opener) this.opener.focus();
        document.removeEventListener('keydown', this.keydownHandler);
        this.overlay.remove();
    }
}

// Utility functions
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Render functions
function renderDecks() {
    const deckList = document.getElementById('deck-list');
    deckList.innerHTML = '';

    appState.decks.forEach(deck => {
        const li = document.createElement('li');
        const deckContainer = document.createElement('div');
        deckContainer.className = 'deck-item';

        const button = document.createElement('button');
        button.textContent = deck.name;
        button.dataset.deckId = deck.id;
        button.addEventListener('click', () => {
            appState.activeDeckId = deck.id;
            renderDecks(); // Re-render to update active state
            renderMainContent();
        });

        if (appState.activeDeckId === deck.id) {
            button.classList.add('active');
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-deck-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.setAttribute('aria-label', `Delete ${deck.name} deck`);
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering deck selection
            if (confirm(`Are you sure you want to delete the "${deck.name}" deck? This will also delete all its cards.`)) {
                // Remove deck
                appState.decks = appState.decks.filter(d => d.id !== deck.id);
                // Remove cards
                delete appState.cardsByDeckId[deck.id];
                // If it was active, set to null or first deck
                if (appState.activeDeckId === deck.id) {
                    appState.activeDeckId = appState.decks.length > 0 ? appState.decks[0].id : null;
                }
                // Reset study state
                appState.currentCardIndex = 0;
                appState.studyCards = [];
                Storage.save(appState);
                renderDecks();
                renderMainContent();
            }
        });

        deckContainer.appendChild(button);
        if (deck.id !== 'default') {
            deckContainer.appendChild(deleteBtn);
        }
        li.appendChild(deckContainer);
        deckList.appendChild(li);
    });
}

function renderMainContent() {
    const deckTitle = document.getElementById('deck-title');
    const flashcardArea = document.getElementById('flashcard-area');
    const searchBar = document.getElementById('search-bar');
    const header = document.querySelector('header');

    // Remove existing add card button if any
    const existingBtn = document.getElementById('add-card-btn');
    if (existingBtn) existingBtn.remove();

    const activeDeck = appState.decks.find(d => d.id === appState.activeDeckId);
    if (!activeDeck) {
        deckTitle.textContent = 'Select a Deck';
        flashcardArea.innerHTML = '<p>Select a deck to start studying.</p>';
        searchBar.value = '';
        return;
    }

    deckTitle.textContent = activeDeck.name;
    const originalCards = appState.cardsByDeckId[appState.activeDeckId] || [];

    // Add card button
    const addCardBtn = document.createElement('button');
    addCardBtn.id = 'add-card-btn';
    addCardBtn.textContent = 'Add Card';
    header.appendChild(addCardBtn);

    if (originalCards.length === 0) {
        flashcardArea.innerHTML = '<p>No cards in this deck. Add some cards first.</p>';
        searchBar.value = '';
        return;
    }

    // Reset study cards if deck changed or not set
    if (!appState.studyCards.length || !originalCards.some(card => appState.studyCards.includes(card))) {
        appState.studyCards = [...originalCards];
        appState.currentCardIndex = 0;
        searchBar.value = '';
    }

    renderCard(appState.currentCardIndex);
}

function renderCard(index) {
    const card = appState.studyCards[index];
    if (!card) return;

    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <p>${card.front}</p>
            </div>
            <div class="card-back">
                <p>${card.back}</p>
            </div>
        </div>
    `;

    cardEl.addEventListener('click', () => {
        cardEl.classList.toggle('is-flipped');
    });

    const controls = document.createElement('div');
    controls.className = 'card-controls';
    controls.innerHTML = `
        <button id="prev-btn">Previous</button>
        <button id="shuffle-btn">Shuffle</button>
        <button id="next-btn">Next</button>
    `;

    const prevBtn = controls.querySelector('#prev-btn');
    const nextBtn = controls.querySelector('#next-btn');
    const shuffleBtn = controls.querySelector('#shuffle-btn');

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === appState.studyCards.length - 1;

    prevBtn.addEventListener('click', () => {
        if (appState.currentCardIndex > 0) {
            appState.currentCardIndex--;
            renderCard(appState.currentCardIndex);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (appState.currentCardIndex < appState.studyCards.length - 1) {
            appState.currentCardIndex++;
            renderCard(appState.currentCardIndex);
        }
    });

    shuffleBtn.addEventListener('click', () => {
        const originalCards = appState.cardsByDeckId[appState.activeDeckId] || [];
        appState.studyCards = shuffle(originalCards);
        appState.currentCardIndex = 0;
        document.getElementById('search-bar').value = '';
        renderCard(0);
    });

    const area = document.getElementById('flashcard-area');
    area.innerHTML = '';
    area.appendChild(cardEl);
    area.appendChild(controls);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    Object.assign(appState, Storage.load());

    // Add default deck if it doesn't exist
    if (!appState.decks.find(d => d.id === 'default')) {
        appState.decks = [...defaultData.decks, ...appState.decks];
        appState.cardsByDeckId = { ...defaultData.cardsByDeckId, ...appState.cardsByDeckId };
        if (!appState.activeDeckId) {
            appState.activeDeckId = 'default';
        }
        Storage.save(appState);
    }

    renderDecks();
    renderMainContent();

    // Global keyboard listeners for study mode
    document.addEventListener('keydown', (e) => {
        if (Modal.isOpen) return;
        if (!appState.activeDeckId || !appState.studyCards.length) return;

        if (e.code === 'Space') {
            const card = document.querySelector('.card');
            if (card) {
                card.classList.toggle('is-flipped');
                e.preventDefault();
            }
        } else if (e.code === 'ArrowRight') {
            if (appState.currentCardIndex < appState.studyCards.length - 1) {
                appState.currentCardIndex++;
                renderCard(appState.currentCardIndex);
            }
        } else if (e.code === 'ArrowLeft') {
            if (appState.currentCardIndex > 0) {
                appState.currentCardIndex--;
                renderCard(appState.currentCardIndex);
            }
        }
    });

    // Search bar debounced filter
    const searchBar = document.getElementById('search-bar');
    searchBar.addEventListener('input', () => {
        clearTimeout(appState.searchTimeout);
        appState.searchTimeout = setTimeout(() => {
            const keyword = searchBar.value.toLowerCase().trim();
            const originalCards = appState.cardsByDeckId[appState.activeDeckId] || [];
            if (keyword) {
                const filtered = appState.studyCards.filter(card =>
                    card.front.toLowerCase().includes(keyword) ||
                    card.back.toLowerCase().includes(keyword)
                );
                appState.studyCards = filtered;
            } else {
                appState.studyCards = [...originalCards];
            }
            appState.currentCardIndex = 0;
            renderCard(0);
        }, 300);
    });

    // New Deck button
    const newDeckBtn = document.getElementById('new-deck-btn');
    newDeckBtn.addEventListener('click', () => {
        const modal = new Modal({
            opener: newDeckBtn,
            content: () => {
                const form = document.createElement('form');
                form.innerHTML = `
                    <h3>Create New Deck</h3>
                    <label for="deck-name">Deck Name:</label>
                    <input type="text" id="deck-name" required aria-label="Deck name">
                    <button type="submit">Create</button>
                `;
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const nameInput = form.querySelector('#deck-name');
                    const name = nameInput.value.trim();
                    if (name) {
                        const id = Date.now().toString();
                        appState.decks.push({ id, name });
                        appState.activeDeckId = id;
                        Storage.save(appState);
                        renderDecks();
                        modal.close();
                    } else {
                        nameInput.focus();
                    }
                });
                return form;
            }
        });
        modal.open();
    });

    // Add Card button (delegated since button is created dynamically)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'add-card-btn') {
            const modal = new Modal({
                opener: e.target,
                content: () => {
                    const form = document.createElement('form');
                    form.innerHTML = `
                        <h3>Add New Card</h3>
                        <label for="card-front">Front:</label>
                        <textarea id="card-front" required aria-label="Card front"></textarea>
                        <label for="card-back">Back:</label>
                        <textarea id="card-back" required aria-label="Card back"></textarea>
                        <button type="submit">Add Card</button>
                    `;
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const front = form.querySelector('#card-front').value.trim();
                        const back = form.querySelector('#card-back').value.trim();
                        if (front && back) {
                            if (!appState.cardsByDeckId[appState.activeDeckId]) {
                                appState.cardsByDeckId[appState.activeDeckId] = [];
                            }
                            appState.cardsByDeckId[appState.activeDeckId].push({ front, back });
                            Storage.save(appState);
                            renderMainContent();
                            modal.close();
                        } else {
                            if (!front) form.querySelector('#card-front').focus();
                            else form.querySelector('#card-back').focus();
                        }
                    });
                    return form;
                }
            });
            modal.open();
        }
    });
});