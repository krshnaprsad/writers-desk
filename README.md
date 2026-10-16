# Writer's Desk

Read your own writing back to yourself.

Made by Zero3.

## What it does

I write stories and captions, and I wanted a quick way to see what my writing is doing without sending it to a website. So I built this one. You paste your text and it shows you:

- word, sentence and paragraph counts, plus reading time and speaking time
- your text with the tired spots marked: long dashes, cliche phrases, padded words, filler words, and words you repeat close together
- the rhythm of your sentences as a small chart, so you can see if everything is the same length
- the words you lean on most

There is also a clean up button. It turns long dashes into short ones, curly quotes into plain ones, and removes hidden characters and double spaces. It only changes what you tick, your words stay as you wrote them, and there is an undo.

## Use it

Open the app: https://krshnaprsad.github.io/writers-desk/

Or download the repo and open `index.html`. Nothing to install. Your text never leaves your browser.

## Things to know

- The counts are exact. The marks are my opinion. The lists of phrases are in `data/phrases.js` and you can read and change them. Plenty of good writing uses these words on purpose, so treat a mark as a question, not a mistake.
- It does not tell you whether a person or an AI wrote something. Nothing can tell that for sure from text alone. Long dashes and words like "testament" are only habits that often show up in machine written text, so I mark them so you can choose.
- The sentence splitter is simple. It handles Mr., Dr. and decimals, but poetry, lists and unusual punctuation can throw the sentence count off.
- English only.
- Reading time uses 230 words a minute and speaking time uses 150. Those are averages. You are not average.
- Long text is fine. The analysis of 50,000 words took about a tenth of a second on my machine.

## Files

- `index.html`, `web/` the app
- `src/desk.js` the analysis and clean up, no browser code
- `data/phrases.js` the phrase lists
- `tests/` the tests

Developer notes are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT. See [LICENSE](LICENSE).
