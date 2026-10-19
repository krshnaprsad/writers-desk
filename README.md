# Writer's Desk

Read your own writing back to yourself.

Made by Zero3.

## What it does

I write stories and captions, and I wanted a quick way to see what my writing is doing without sending it to a website. So I built this one. You paste your text and it shows you:

- word, sentence and paragraph counts, plus reading time and speaking time
- your text with the tired spots marked: long dashes, cliche phrases, padded words, filler words, and words you repeat close together
- the rhythm of your sentences as a small chart, so you can see if everything is the same length
- the words you lean on most

Version 1.1 can also fix what it marks. Tap any mark and you get the reason and a few choices to swap in. There are one tap buttons for long dashes, filler words, padded words, close repeats, and grammar and spacing, plus Accept all. Every change can be undone, one step at a time. It also checks spelling and a few basic grammar rules.

There is also a clean up button. It turns long dashes into short ones, curly quotes into plain ones, and removes hidden characters and double spaces. It only changes what you tick, your words stay as you wrote them, and there is an undo.

On-device rewriting was tried and removed because it was not reliable in browsers.

## Use it

Open the app: https://krshnaprsad.github.io/writers-desk/

Or download the repo and open `index.html`. Nothing to install. Your text never leaves your browser.

## Things to know

- If a button from the latest version is missing, your browser is showing an old copy. Press Ctrl+F5 on Windows, or clear the site data on your phone. The page also tells you when it spots this.
- The counts are exact. The marks are my opinion. The lists of phrases are in `data/phrases.js` and you can read and change them. Plenty of good writing uses these words on purpose, so treat a mark as a question, not a mistake.
- It does not tell you whether a person or an AI wrote something. Nothing can tell that for sure from text alone. Long dashes and words like "testament" are only habits that often show up in machine written text, so I mark them so you can choose.
- The sentence splitter is simple. It handles Mr., Dr. and decimals, but poetry, lists and unusual punctuation can throw the sentence count off.
- The fixes are not an AI. Nothing is rewritten for you and nothing is uploaded. The alternatives come from small lists I wrote (`data/swaps.js`), so many phrases have no suggestion, and a suggestion can be wrong for your sentence. After Accept all, read the text again. Swapping a repeated word can create a new repeat, and Undo is there for that.
- Tired phrases are never fixed in one tap, because the right words are your call.
- Spelling uses a standard English word list. It marks names that start a sentence and words it does not know, so use Ignore or Add to my words (kept only in your browser). It accepts common British spellings too.
- The grammar checks are only simple rules: a or an, doubled words, capital letters (including the word I), and spacing around commas and full stops. It does not catch the wrong word, tense, "their" for "there", or sentence structure. For that you still need your own eyes or a person.
- The spelling dictionary is about 550 KB and loads after the page, so spelling marks appear a moment later.
- English only.
- Reading time uses 230 words a minute and speaking time uses 150. Those are averages. You are not average.
- Long text is fine. The analysis of 50,000 words took about a tenth of a second on my machine.

## Files

- `index.html`, `web/` the app
- `src/desk.js` the analysis, fixes, grammar rules and clean up, no browser code
- `src/spell.js` the spelling check
- `data/phrases.js` the phrase lists
- `data/swaps.js` the alternatives behind the fixes
- `data/dict-*.js` the English word list (hunspell en_US, see `vendor/NOTICE.md`)
- `vendor/nspell.js` the spelling library (MIT, Titus Wormer)
- `tests/` the tests

Developer notes are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

I made this and it is free to use, including for paid work. What it is not free to do is be copied: please don't republish, redistribute or sell the code, or build your own version from it. The full terms are in [LICENSE](LICENSE). Versions published before 19 October 2026 were MIT and stay that way. The Zero3 name and logo are not part of the licence.

The spelling library and word lists in `vendor/` and `data/` are not mine and keep their own licences, see `vendor/NOTICE.md`.
