# Contributing

No dependencies. You need Node 18 or newer.

```
npm test
```

That runs `tests/desk.test.js`: counts, sentence splitting, every kind of mark, whole word matching (a word that only contains a listed word is not marked), rhythm, and the clean up rules, including that cleaning twice changes nothing.

Layout:

- `src/desk.js` has `Desk.analyze(text)` and `Desk.clean(text, options)`. No browser code.
- `data/phrases.js` holds three lists: `cliche`, `ai` and `filler`. Each entry is a regular expression source matched on whole words, case insensitive. To add a phrase, add a line and a test that it is found.
- `web/app.js` is only the page.

Marks never overlap. When two marks hit the same text, the higher priority wins: long dash, cliche, padded word, repeat, filler.
