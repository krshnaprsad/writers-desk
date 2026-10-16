const assert = require("assert"), D = require("../src/desk.js"), L = require("../data/phrases.js");
// every list entry compiles
["cliche", "ai", "filler"].forEach(k => L[k].forEach(p => new RegExp(p, "i")));
assert.ok(!JSON.stringify(L).includes("\u2014"), "no em dashes in the lists");
// counts
const a = D.analyze("One two three. Four five six seven! Is this eight words, nine? Mr. Smith left.\n\nNew paragraph here.");
assert.strictEqual(a.words, 18); assert.strictEqual(a.sentences, 5); assert.strictEqual(a.paragraphs, 2);
assert.deepStrictEqual(a.lens, [3, 4, 5, 3, 3]);
assert.ok(Math.abs(a.readMinutes - 18 / 230) < 1e-9);
assert.strictEqual(D.analyze("").words, 0); assert.strictEqual(D.analyze("   ").sentences, 0); assert.strictEqual(D.analyze(null).words, 0);
// decimals and abbreviations do not split a sentence
assert.strictEqual(D.sentences("It cost 3.50 dollars. Dr. Lee agreed.").length, 2);
// flags
const f = D.analyze("I walked home\u2014slowly. Little did he know. It was a testament to him. I really ran.").flags.map(x => x.type + ":" + x.text.toLowerCase());
["dash:\u2014", "cliche:little did he know", "ai:a testament to", "filler:really"].forEach(x => assert.ok(f.includes(x), x + " in " + f));
// whole words only
assert.ok(!D.analyze("The scholar was rather surprised that the reality was just mundane.").flags.some(x => x.type === "ai"));
assert.strictEqual(D.analyze("A very good day.").flags.filter(x => x.type === "filler").length, 1);
assert.strictEqual(D.analyze("Everyone is averse to it.").flags.length, 0);
// close repeats, and names are not flagged
assert.ok(D.analyze("The garden was quiet and the garden was cold.").flags.some(x => x.type === "rep"));
assert.ok(!D.analyze("Then Maria spoke. Maria left. Maria smiled again later.").flags.some(x => x.type === "rep"));
// flags never overlap and point at the right text
const t = "Moreover\u2014it is a testament, really, really crucial. Little did she know it was a game changer.";
const r = D.analyze(t); r.flags.forEach((x, i) => { assert.strictEqual(t.slice(x.start, x.end), x.text); if (i) assert.ok(x.start >= r.flags[i - 1].end, "overlap"); });
// rhythm
assert.strictEqual(D.analyze("I ran home now. I sat down there. I ate some food. I drank a cup. I slept on it. I woke up soon. I went out then.").rhythm, "flat");
assert.strictEqual(D.analyze("Go. The long road home was longer than anyone had said it would be, and the rain came down. Stop. I waited by the old gate for what felt like most of the evening, watching. No. We left. It was over, and nobody spoke about it again for years and years.").rhythm, "varied");
assert.strictEqual(D.analyze("Short text only. Two sentences.").rhythm, "too short to judge");
// cleaning
assert.strictEqual(D.clean("home\u2014slowly"), "home - slowly");
assert.strictEqual(D.clean("home \u2014 slowly -- fast"), "home - slowly - fast");
assert.strictEqual(D.clean("\u2014 Hello, he said."), "- Hello, he said.");
assert.strictEqual(D.clean("5\u201310 days"), "5-10 days");
assert.strictEqual(D.clean("\u201CHi,\u201D she said\u2026 it\u2019s fine"), "\"Hi,\" she said... it's fine");
assert.strictEqual(D.clean("a\u200Bb\u00A0c  d"), "ab c d");
assert.strictEqual(D.clean("a\u2014b", { dashes: false }), "a\u2014b");
const messy = "Line one\u2014two.\nLine \u201Cthree\u201D."; const c = D.clean(messy); assert.ok(!/[\u2014\u201C\u201D]/.test(c));
assert.strictEqual(D.clean(c), c, "cleaning twice changes nothing");

// ---- fixing ----
const S = require("../data/swaps.js");
const fix = (txt, kinds, o) => D.fixAll(txt, kinds, o).text;
assert.strictEqual(fix("Home\u2014slowly\u2014and", ["dash"]), "Home, slowly, and");
assert.strictEqual(fix("One thing\u2014 two things.", ["dash"]), "One thing, two things.");
assert.strictEqual(D.choices("Ab\u2014b\u2014c", D.analyze("Ab\u2014b\u2014c").flags.find(f => f.type === "dash")).choices.length, 4, "pair offers four ways");
assert.strictEqual(fix("It was really cold. Really cold.", ["filler"]), "It was cold. Cold.");
assert.strictEqual(fix("Moreover, it works. We crucial.", ["ai"]), "Also, it works. We key.");
assert.strictEqual(fix("Needless to say, go.", ["cliche"]), "Needless to say, go.", "tired phrases are never fixed on their own");
assert.strictEqual(fix("Needless to say, go.", ["cliche"]).length > 0, true);
const rf = D.analyze("The rain fell. The rain fell.").flags.filter(f => f.type === "rep");
assert.ok(rf.length >= 1 && D.choices("The rain fell. The rain fell.", rf[0]).choices[0].label.indexOf("Use") === 0);
assert.strictEqual(fix("He walked home. He walked back.", ["rep"]).indexOf("walked", 20) < 0, true, "close repeat swapped");
// alternatives are plain and never contain a long dash
(function scan(o) { Object.keys(o).forEach(k => { const v = o[k]; if (typeof v === "string") assert.ok(!/[\u2014\u2013]|--/.test(v), v); else if (v && typeof v === "object") scan(v); }); })(S);
D.analyze("The rain fell. The rain fell harder. The rain fell and fell. Little did I know.").flags.forEach(f => D.choices("x", Object.assign({}, f, { start: 0, end: 0 })).choices.forEach(c => c.edits.forEach(e => assert.ok(!/[\u2014\u2013]/.test(e.text)))));
// grammar and spacing
assert.strictEqual(fix("I bought a apple and an pear.", ["gram"]), "I bought an apple and a pear.");
assert.strictEqual(fix("An hour and a university and a one and an honest man.", ["gram"]), "An hour and a university and a one and an honest man.");
assert.strictEqual(fix("This is is odd, and the the end.", ["gram"]), "This is odd, and the end.");
assert.strictEqual(fix("so i said that i am here. then i left.", ["gram"]), "So I said that I am here. Then I left.");
assert.strictEqual(fix("Hello , world.  Next,one.", ["gram"]), "Hello, world. Next, one.");
assert.strictEqual(fix("She had had enough. Mr. smith left... and so on. \"Why?\" she asked.", ["gram"]), "She had had enough. Mr. smith left... and so on. \"Why?\" she asked.", "no false alarms");
assert.strictEqual(fix("See www.example.com and a@b.org. Item 3.5 ok", ["gram"]), "See www.example.com and a@b.org. Item 3.5 ok");
// spelling with a tiny stand-in word list
const stub = { correct: w => ["the", "cat", "sat", "on", "mat", "it", "was", "fine", "of"].indexOf(w.toLowerCase()) >= 0, suggest: w => ["cat"] };
const sa = D.analyze("The cta sat on the mat. It was fine, said Krishna of NASA.", { spell: stub });
assert.deepStrictEqual(sa.flags.filter(f => f.type === "spell").map(f => f.text), ["cta", "said"], "names and acronyms are skipped, unknown words are marked");
assert.deepStrictEqual(D.analyze("The cta sat.", { spell: stub, ignore: { cta: 1 } }).flags.filter(f => f.type === "spell"), [], "ignored words are accepted");
assert.strictEqual(D.choices("The cta sat.", sa.flags.find(f => f.type === "spell"), { spell: stub }).choices[0].edits[0].text, "cat");
assert.strictEqual(D.analyze("The cta sat.").flags.filter(f => f.type === "spell").length, 0, "no spelling marks without a dictionary");
// fixing is safe to repeat
const once = fix("Moreover\u2014really\u2014it is a apple. i agree.", ["dash", "filler", "ai", "gram"]); assert.strictEqual(fix(once, ["dash", "filler", "ai", "gram"]), once);
console.log("desk tests passed");
