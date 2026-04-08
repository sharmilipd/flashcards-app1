# Flashcards App

A modern, accessible single-page flashcard application built with vanilla HTML5, CSS3, and JavaScript.

## Features

### Core Functionality
- **Deck Management**: Create, select, and delete custom decks
- **Card Management**: Add cards with front/back content to any deck
- **Study Mode**: Interactive card flipping with smooth 3D animations
- **Navigation**: Previous/Next buttons with keyboard shortcuts
- **Shuffle**: Randomize card order for varied study sessions
- **Search**: Real-time filtering of cards by content

### Accessibility
- Semantic HTML structure with proper ARIA labels
- Keyboard navigation (Space to flip, Arrow keys for navigation)
- Focus management and visible focus indicators
- Screen reader friendly

### User Interface
- Responsive design that works on desktop and mobile
- Dark mode support (follows system preference)
- Modern Inter font and clean design
- Modal dialogs for forms with focus trapping

## Default Content

The app includes a default "Vegetables A-Z" deck with 26 cards teaching vegetable names alphabetically from A to Z.

## Keyboard Shortcuts

- **Space**: Flip current card
- **Arrow Left**: Previous card
- **Arrow Right**: Next card
- **Esc**: Close modal dialogs

## Getting Started

1. Open `index.html` in a modern web browser
2. The default vegetable deck will be automatically loaded
3. Click on deck names in the sidebar to switch decks
4. Use the "Add Card" button to create new flashcards
5. Click cards to flip between front and back
6. Use navigation buttons or keyboard shortcuts to move through cards

## File Structure

```
flashcard-app/
├── index.html          # Main HTML structure
├── styles.css          # CSS styles and responsive design
├── script.js           # Application logic and state management
└── assets/
    └── default-data.js # Default deck and card data
```

## Development

The app uses vanilla JavaScript with no external dependencies. All data is stored locally in the browser's localStorage.

### Adding New Features

The codebase is modular with separate concerns:
- State management in `appState` object
- UI rendering functions for different components
- Modal system for dialogs
- Storage utilities for persistence

## License

This project is open source and available under the MIT License.
