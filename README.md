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
  "id": "deploy",
  "term": "deploy",
  "translation": "развернуть / выпустить",
  "definition": "To put code or an app into production.",
  "examples": [
    "We deployed the fix to production yesterday.",
    "I can't deploy because the tests are failing."
  ],
  "notes": "Common: deploy to production",
  "level": "B2",
  "category": "Work"
}
```

Progress is saved in the browser with `localStorage`, so it works on a phone after publishing to GitHub Pages.
