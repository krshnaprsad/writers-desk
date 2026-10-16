# Contributing

No dependencies. You need Node 18 or newer.

```
npm test
```

That runs `tests/desk.test.js`: counts, sentence splitting, every kind of mark, whole word matching (a word that only contains a listed word is not marked), rhythm, and the clean up rules, including that cleaning twice changes nothing.

Layout:

- `src/desk.js` has `Desk.analyze(text)` and `Desk.clean(text, options)`. No browser code.
- `data/phrases.js` holds three lists: `cliche`, `ai` and `filler`. Each entry is a regular expression source matched on whole words, case insensitive. To add a phrase, add a line and a test that it is found.
- `data/swaps.js` holds the alternatives: `cliche` and `ai` are lists of `[pattern, [alternatives]]` (an empty string means the phrase can just go, and `$1` reuses a group from the pattern), `filler` and `thes` are plain word maps, and `irreg` lists irregular forms such as "fell". Alternatives must not contain long dashes, and a test checks that.
- `Desk.choices(text, mark)` returns the options for one mark, `Desk.fixAll(text, kinds)` fixes every mark of the kinds you pass, and `Desk.applyEdits` applies edits. `Desk.analyze(text, { spell, ignore })` also marks spelling when you pass a checker.
- `src/spell.js` builds the checker from nspell and the word list. The tests use a tiny stand-in word list, so they need no dictionary.
- The word list files in `data/dict-*.js` were made from the `dictionary-en` package (en_US). To rebuild them, split its `index.dic` by lines into five parts.
- `web/app.js` is only the page.

Marks never overlap. When two marks hit the same text, the higher priority wins: spelling, grammar, long dash, cliche, padded word, filler, repeat.
