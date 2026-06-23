# English Cards

Simple static vocabulary app. No build step and no backend are required.

## Files

- `index.html` - app markup
- `main.css` - app styles
- `main.js` - app logic
- `words.json` - cards for single words
- `expressions.json` - cards for phrases and expressions

## Card format

```json
{
  "id": "research",
  "term": "research",
  "translation": "исследование",
  "definition": "The careful study of a subject to discover new information.",
  "examples": [
    "We did a small research project in class.",
    "The company is conducting market research.",
    "She spent years doing research on climate change.",
    "More research is needed in this area.",
    "The findings are based on recent research."
  ],
  "notes": "Usually uncountable. We say 'do research' rather than 'make research'.",
  "synonyms": ["study", "investigation", "analysis"],
  "antonyms": [],
  "level": "B2",
  "category": "General"
}
```

Progress is saved in the browser with `localStorage`, so it works on a phone after publishing to GitHub Pages.
