/* Writer's Desk engine. Plain functions, no browser needed, so it can be tested in Node. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../data/phrases.js"), require("../data/swaps.js"));
  else root.Desk = factory(root.DeskLists, root.DeskSwaps);
})(typeof self !== "undefined" ? self : this, function (L, S) {
  var STOP = ("a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up us very was we were what when where which while who whom why will with would you your yours yourself yourselves said say says now one like get got go went came come back then still even much many way thing things").split(" ");
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });
  var ABBR = /\b(mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|e\.g|i\.e|no)\.$/i;
  var WPM_READ = 230, WPM_SPEAK = 150;

  // Split into sentences. Keeps closing quotes with their sentence. Not perfect on odd punctuation.
  function sentences(text) {
    var out = [], re = /[^.!?\u2026\n]+(?:[.!?\u2026]+["'\u201d\u2019)\]]*|\n|$)/g, m, buf = "", start = 0;
    while ((m = re.exec(text))) {
      var piece = m[0]; if (!piece.trim()) continue;
      if (!buf) start = m.index; buf += piece;
      var endsHard = /[.!?\u2026]["'\u201d\u2019)\]]*$/.test(piece);
      if (endsHard && ABBR.test(piece.replace(/["'\u201d\u2019)\]]+$/, ""))) continue;
      if (endsHard && /\d\.$/.test(piece) && /^\s*\d/.test(text.slice(m.index + piece.length, m.index + piece.length + 3))) continue;
      out.push({ text: buf.trim(), start: start, end: m.index + piece.length }); buf = "";
    }
    if (buf.trim()) out.push({ text: buf.trim(), start: start, end: start + buf.length });
    return out;
  }
  function words(s) { return (s.match(/[A-Za-z\u00C0-\u024F]+(?:['\u2019][A-Za-z]+)*/g) || []); }
  function wordsAt(text) { var re = /[A-Za-z\u00C0-\u024F]+(?:['\u2019][A-Za-z]+)*/g, m, out = []; while ((m = re.exec(text))) out.push({ w: m[0], lw: m[0].toLowerCase().replace(/\u2019/g, "'"), i: m.index }); return out; }

  function rx(list) { return new RegExp("(?:^|[^A-Za-z\\u00C0-\\u024F'])((?:" + list.join("|") + "))(?![A-Za-z\\u00C0-\\u024F])", "gi"); }
  function find(text, list, type, note) {
    var re = rx(list), m, out = [];
    while ((m = re.exec(text))) { var s = m.index + m[0].length - m[1].length; out.push({ type: type, start: s, end: s + m[1].length, text: m[1], note: note }); if (m[0].length === 0) re.lastIndex++; }
    return out;
  }

  var PRIO = { spell: 7, gram: 6, dash: 5, cliche: 4, ai: 3, filler: 2, rep: 1 };
  function analyze(text, opts) {
    text = String(text || ""); opts = opts || {};
    var ws = wordsAt(text), sents = sentences(text), n = ws.length;
    var paras = text.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length;
    var lens = sents.map(function (s) { return words(s.text).length; }).filter(function (x) { return x > 0; });
    var avg = lens.length ? lens.reduce(function (a, b) { return a + b; }, 0) / lens.length : 0;
    var sd = lens.length ? Math.sqrt(lens.reduce(function (a, b) { return a + (b - avg) * (b - avg); }, 0) / lens.length) : 0;
    var cv = avg ? sd / avg : 0, sorted = lens.slice().sort(function (a, b) { return a - b; });
    var rhythm = lens.length < 6 ? "too short to judge" : cv < 0.35 ? "flat" : cv >= 0.6 ? "varied" : "mixed";
    // runs of 3 or more sentences within 2 words of each other
    var runs = 0, k = 0; while (k < lens.length) { var j = k; while (j + 1 < lens.length && Math.abs(lens[j + 1] - lens[j]) <= 2) j++; if (j - k >= 2) runs++; k = j + 1; }

    // names: words that only ever appear capitalised and not at a sentence start are treated as names
    var lowerSeen = {}, capMid = {};
    var starts = {}; sents.forEach(function (s) { starts[s.start + (s.text.length ? (text.slice(s.start).search(/\S/)) : 0)] = 1; });
    ws.forEach(function (x) { if (x.w === x.w.toLowerCase()) lowerSeen[x.lw] = 1; else if (/^[A-Z]/.test(x.w) && !starts[x.i]) capMid[x.lw] = 1; });
    var isName = function (lw) { return capMid[lw] && !lowerSeen[lw]; };

    // repeated words
    var counts = {}; ws.forEach(function (x) { if (x.lw.length > 2 && !STOPSET[x.lw] && !isName(x.lw)) counts[x.lw] = (counts[x.lw] || 0) + 1; });
    var min = n > 1500 ? 6 : n > 400 ? 4 : 3;
    var repeated = Object.keys(counts).filter(function (w) { return counts[w] >= min; }).sort(function (a, b) { return counts[b] - counts[a] || (a < b ? -1 : 1); }).slice(0, 15).map(function (w) { return { word: w, count: counts[w] }; });

    // close repeats: same word (4+ letters, not a common word) again within 30 words
    var flags = [], last = {};
    ws.forEach(function (x, idx) { if (x.lw.length >= 4 && !STOPSET[x.lw] && !isName(x.lw)) { if (last[x.lw] !== undefined && idx - last[x.lw] <= 30 && idx - last[x.lw] > 0) flags.push({ type: "rep", start: x.i, end: x.i + x.w.length, text: x.w, note: "Used again within 30 words" }); last[x.lw] = idx; } });
    flags = flags.concat(find(text, L.cliche, "cliche", "Tired phrase"), find(text, L.ai, "ai", "Often reads as padded or AI-written"), find(text, L.filler, "filler", "Filler word"));
    var dre = /\u2014|\u2015|--+/g, dm; while ((dm = dre.exec(text))) flags.push({ type: "dash", start: dm.index, end: dm.index + dm[0].length, text: dm[0], note: "Long dash" });
    pairDashes(text, flags);
    flags = flags.concat(gramFlags(text), opts.spell ? spellFlags(text, opts) : []);
    // resolve overlaps, higher priority wins
    flags.sort(function (a, b) { return a.start - b.start || PRIO[b.type] - PRIO[a.type]; });
    var kept = []; flags.forEach(function (f) { var p = kept[kept.length - 1]; if (p && f.start < p.end) { if (PRIO[f.type] > PRIO[p.type] && f.end >= p.end) kept[kept.length - 1] = f; return; } kept.push(f); });
    var tally = { spell: 0, gram: 0, dash: 0, cliche: 0, ai: 0, rep: 0, filler: 0 }; kept.forEach(function (f) { tally[f.type]++; });

    // sentence starts used 3 or more times
    var st = {}; sents.forEach(function (s) { var w = words(s.text)[0]; if (w) { w = w.toLowerCase(); st[w] = (st[w] || 0) + 1; } });
    var startsRep = Object.keys(st).filter(function (w) { return st[w] >= 3 && sents.length >= 8 && st[w] / sents.length >= 0.15; }).sort(function (a, b) { return st[b] - st[a]; }).map(function (w) { return { word: w, count: st[w] }; });
    var ly = ws.filter(function (x) { return /ly$/i.test(x.w) && x.w.length > 4; }).length;
    return {
      words: n, chars: text.length, charsNoSpace: text.replace(/\s/g, "").length, sentences: lens.length, paragraphs: paras,
      readMinutes: n / WPM_READ, speakMinutes: n / WPM_SPEAK,
      lens: lens, avg: avg, longest: sorted.length ? sorted[sorted.length - 1] : 0, shortest: sorted.length ? sorted[0] : 0, rhythm: rhythm, runs: runs,
      repeated: repeated, startsRep: startsRep, adverbs: ly, flags: kept, tally: tally, dashCount: tally.dash + (text.match(/\u2013/g) || []).length
    };
  }

  // Clean up text the way I like it: short dashes, straight quotes, no hidden characters.
  function clean(text, o) {
    o = o || { dashes: true, quotes: true, hidden: true, spaces: true };
    var t = String(text || "");
    if (o.hidden) t = t.replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "").replace(/[\u00A0\u202F\u2009\u2002\u2003]/g, " ");
    if (o.dashes) t = t.replace(/^([ \t]*)[\u2014\u2015]\s*/gm, "$1- ").replace(/(\d)\s*\u2013\s*(\d)/g, "$1-$2").replace(/[ \t]*(?:[\u2014\u2015]|--+|\u2013)[ \t]*/g, " - ");
    if (o.quotes) t = t.replace(/[\u201C\u201D\u201E]/g, '"').replace(/[\u2018\u2019\u201A]/g, "'").replace(/\u2026/g, "...");
    if (o.spaces) t = t.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+$/gm, "");
    return t;
  }
  // ---------- Fixing: suggestions and edits ----------
  // An edit is { start, end, text }: replace text[start..end] with text. Edits never overlap.
  function applyEdits(text, edits) {
    var list = edits.slice().sort(function (a, b) { return b.start - a.start; }), out = text, lastStart = Infinity;
    list.forEach(function (e) { if (e.end > lastStart) return; out = out.slice(0, e.start) + e.text + out.slice(e.end); lastStart = e.start; });
    return out;
  }
  function matchCase(orig, repl) {
    if (!repl) return repl;
    if (orig.length > 1 && orig === orig.toUpperCase() && /[A-Z]/.test(orig)) return repl.toUpperCase();
    if (/^[A-Z]/.test(orig)) return repl.charAt(0).toUpperCase() + repl.slice(1);
    return repl;
  }
  function atSentenceStart(text, i) {
    if (i === 0) return true;
    var before = text.slice(Math.max(0, i - 40), i), re = /(?:\n[ \t]*|[.!?]["'\u201d\u2019)]*[ \t]+)["\u201c(]?$/;
    return re.test(before) || (i <= 40 && /^[ \t]*["\u201c(]?$/.test(before));
  }
  // Remove a span cleanly: take one space with it, and capitalise the next word if it now starts a sentence.
  function deleteSpan(text, s, e) {
    var start = s, end = e, start0 = atSentenceStart(text, s);
    if (start0) {
      if (text.charAt(end) === ",") end++;
      while (text.charAt(end) === " " || text.charAt(end) === "\t") end++;
      var nx = text.charAt(end);
      if (/[a-z]/.test(nx)) return { start: start, end: end + 1, text: nx.toUpperCase() };
      return { start: start, end: end, text: "" };
    }
    if (text.charAt(start - 1) === " ") start--;
    return { start: start, end: end, text: "" };
  }
  function spaceSpan(text, s, e) { while (s > 0 && (text.charAt(s - 1) === " " || text.charAt(s - 1) === "\t")) s--; while (text.charAt(e) === " " || text.charAt(e) === "\t") e++; return [s, e]; }

  // Long dashes. Two dashes close together are treated as one aside.
  function pairDashes(text, flags) {
    var d = flags.filter(function (f) { return f.type === "dash"; }).sort(function (a, b) { return a.start - b.start; });
    for (var i = 0; i < d.length - 1; i++) {
      var between = text.slice(d[i].end, d[i + 1].start);
      if (!/[.!?\n]/.test(between) && between.length <= 120 && between.trim()) { d[i].mate = d[i + 1]; d[i + 1].first = d[i]; i++; }
    }
  }
  function dashEdits(text, f, style) {
    var pair = f.mate || f.first, a = f.first || f, b = f.mate || (f.first ? f : null), res = [];
    function one(x, how, role) {
      var sp = spaceSpan(text, x.start, x.end), s = sp[0], e = sp[1], nx = text.charAt(e), t;
      var lineStart = text.slice(0, x.start).search(/(^|\n)[ \t]*$/) >= 0;
      if (how === "comma") t = /[,.;:!?)]/.test(nx) || e >= text.length ? "" : ", ";
      else if (how === "stop") { if (/[a-z]/.test(nx)) return { start: s, end: e + 1, text: ". " + nx.toUpperCase() }; t = ". "; }
      else if (how === "short") t = " - ";
      else if (how === "join") t = " ";
      else if (how === "open") t = " (";
      else if (how === "close") t = ")" + (/[A-Za-z0-9]/.test(nx) ? " " : "");
      if (lineStart) { return { start: x.start, end: e, text: "- " }; }
      return { start: s, end: e, text: t };
    }
    if (pair) {
      if (style === "comma") res = [one(a, "comma"), one(b, "comma")];
      else if (style === "paren") res = [one(a, "open"), one(b, "close")];
      else if (style === "short") res = [one(a, "short"), one(b, "short")];
      else res = [one(a, "join"), one(b, "join")];
    } else res = [one(f, style)];
    return res;
  }
  function dashChoices(text, f) {
    if (f.mate || f.first) return [
      { label: "Commas around it (fixes both dashes)", edits: dashEdits(text, f, "comma") },
      { label: "Brackets around it (fixes both dashes)", edits: dashEdits(text, f, "paren") },
      { label: "Short dashes with spaces (fixes both)", edits: dashEdits(text, f, "short") },
      { label: "Just a space (fixes both)", edits: dashEdits(text, f, "join") }
    ];
    return [
      { label: "Comma", edits: dashEdits(text, f, "comma") },
      { label: "Full stop, new sentence", edits: dashEdits(text, f, "stop") },
      { label: "Short dash with spaces", edits: dashEdits(text, f, "short") },
      { label: "Just a space", edits: dashEdits(text, f, "join") }
    ];
  }

  // Close repeats: find the base word, then swap in a regular form of an alternative.
  function endsCvc(w) { return w.length <= 4 && /[^aeiou][aeiou][bdgmnprt]$/.test(w); }
  function inflect(w, form) {
    if (form === "base") return w;
    if (form === "s") return /(s|x|z|ch|sh)$/.test(w) ? w + "es" : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ies" : w + "s";
    if (form === "ed") return /e$/.test(w) ? w + "d" : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ied" : endsCvc(w) ? w + w.slice(-1) + "ed" : w + "ed";
    if (form === "ing") return /[^e]e$/.test(w) ? w.slice(0, -1) + "ing" : endsCvc(w) ? w + w.slice(-1) + "ing" : w + "ing";
    return w;
  }
  function repAlternatives(word) {
    var w = word.toLowerCase().replace(/\u2019/g, "'"), out = [], T = S.thes, I = S.irreg;
    if (Object.prototype.hasOwnProperty.call(I, w)) out = I[w].slice();
    else {
      var tries = [[w, "base"]];
      if (/ies$/.test(w)) tries.push([w.slice(0, -3) + "y", "s"]);
      if (/es$/.test(w)) tries.push([w.slice(0, -2), "s"]);
      if (/s$/.test(w)) tries.push([w.slice(0, -1), "s"]);
      if (/ied$/.test(w)) tries.push([w.slice(0, -3) + "y", "ed"]);
      if (/ed$/.test(w)) tries.push([w.slice(0, -2), "ed"], [w.slice(0, -1), "ed"], [w.slice(0, -3), "ed"]);
      if (/ing$/.test(w)) tries.push([w.slice(0, -3), "ing"], [w.slice(0, -3) + "e", "ing"], [w.slice(0, -4), "ing"]);
      for (var i = 0; i < tries.length; i++) { var k = tries[i][0]; if (Object.prototype.hasOwnProperty.call(T, k)) { out = T[k].map(function (x) { return inflect(x, tries[i][1]); }); break; } }
    }
    return out.filter(function (x, i) { return x && x !== w && out.indexOf(x) === i; }).map(function (x) { return matchCase(word, x); });
  }
  function expand(alt, m) { return alt.replace(/\$(\d)/g, function (_, n) { return m[+n] || ""; }); }
  function swapAlternatives(list, textMatch) {
    for (var i = 0; i < list.length; i++) {
      var m = new RegExp("^(?:" + list[i][0] + ")$", "i").exec(textMatch);
      if (m) return list[i][1].map(function (a) { return a === "" ? "" : matchCase(textMatch, expand(a, m)); });
    }
    return [];
  }
  var NOALT = "No built-in alternative for this one. Try putting it in your own words.";
  // Choices for one mark. Returns { choices: [{label, edits}], none: message }.
  function choices(text, f, opts) {
    opts = opts || {}; var out = [], t = f.text;
    if (f.fixes) out = f.fixes;
    else if (f.type === "dash") out = dashChoices(text, f);
    else if (f.type === "filler") {
      out.push({ label: "Remove \u201C" + t + "\u201D", edits: [deleteSpan(text, f.start, f.end)] });
      (S.filler[t.toLowerCase()] || []).forEach(function (a) { out.push({ label: "Use \u201C" + matchCase(t, a) + "\u201D", edits: [{ start: f.start, end: f.end, text: matchCase(t, a) }] }); });
    } else if (f.type === "ai" || f.type === "cliche") {
      swapAlternatives(S[f.type], t).forEach(function (a) { out.push(a === "" ? { label: "Remove it", edits: [deleteSpan(text, f.start, f.end)] } : { label: "Use \u201C" + a + "\u201D", edits: [{ start: f.start, end: f.end, text: a }] }); });
    } else if (f.type === "rep") {
      repAlternatives(t).forEach(function (a) { out.push({ label: "Use \u201C" + a + "\u201D", edits: [{ start: f.start, end: f.end, text: a }] }); });
    } else if (f.type === "spell") {
      var sg = opts.spell && opts.spell.suggest ? opts.spell.suggest(t) : [];
      sg.slice(0, 5).forEach(function (a) { out.push({ label: "Change to \u201C" + a + "\u201D", edits: [{ start: f.start, end: f.end, text: a }] }); });
    }
    return { choices: out, none: out.length ? "" : (f.type === "spell" ? "No suggestion found. Check the spelling yourself." : f.type === "rep" ? "No built-in alternative for this word. Use a different word, or reword the sentence." : NOALT) };
  }
  // What one tap does for a mark, or null if I do not fix this kind on my own.
  function defaultFix(text, f) {
    if (f.type === "cliche" || f.type === "spell") return null;
    var c = choices(text, f).choices;
    return c.length ? c[0].edits : null;
  }
  // Fix every mark of the given kinds. Kinds: dash, filler, ai, rep, gram. Returns { text, count }.
  function fixAll(text, kinds, opts, tidied) {
    var a = analyze(text, opts), ed = [], n = 0;
    a.flags.forEach(function (f) {
      if (kinds.indexOf(f.type) < 0) return;
      var e = defaultFix(text, f); if (!e) return;
      ed = ed.concat(e); if (!f.first) n++;
    });
    var t = applyEdits(text, ed);
    // swaps can leave a wrong a/an, a lowercase sentence start or a double space, so tidy those once
    if (n && !tidied) t = fixAll(t, ["gram"], opts, true).text;
    return { text: t, count: n };
  }

  // ---------- Grammar and spacing rules ----------
  var A_EXC = /^(uni|use|usu|uti|usa|ubi|eu|one|once|ufo|uk|ura|uri|uro|ute)/i, AN_EXC = /^(hour|honest|honou?r|heir)/i;
  function gramFlags(text) {
    var out = [], m;
    function add(start, end, note, edits, label, extra) { var f = { type: "gram", start: start, end: end, text: text.slice(start, end), note: note, fixes: [{ label: label, edits: edits }] }; if (extra) for (var k in extra) f[k] = extra[k]; out.push(f); }
    // doubled words
    var dre = /\b([A-Za-z]+)([ \t]+)\1\b/gi, OK2 = /^(had|that|bye|no|ha|so|knock|yes|very|go|night|there|boo|blah|la|na|chop|dum|tut|pom|choo)$/i;
    while ((m = dre.exec(text))) { if (OK2.test(m[1])) continue; var s = m.index + m[1].length; add(s, m.index + m[0].length, "Doubled word", [{ start: s, end: m.index + m[0].length, text: "" }], "Remove the second \u201C" + m[1] + "\u201D"); }
    // a and an
    var are = /(^|[^A-Za-z'\u2019-])(a|an)([ \t]+)([A-Za-z][A-Za-z'-]*)/gi;
    while ((m = are.exec(text))) {
      var w = m[4]; if (w === w.toUpperCase() && w.length > 1) continue;
      var vowel = /^[aeiou]/i.test(w), want = vowel ? (A_EXC.test(w) ? "a" : "an") : (AN_EXC.test(w) ? "an" : "a");
      if (want !== m[2].toLowerCase()) { var s2 = m.index + m[1].length, fixed = matchCase(m[2], want); add(s2, s2 + m[2].length, "Use \u201C" + want + "\u201D before \u201C" + w + "\u201D", [{ start: s2, end: s2 + m[2].length, text: fixed }], "Change to \u201C" + fixed + "\u201D"); }
    }
    // lone i
    var ire = /(^|[^A-Za-z0-9'\u2019_-])(i)(?=[ \t\n,.;:!?]|['\u2019](?:m|ve|ll|d)\b|$)/g;
    while ((m = ire.exec(text))) { var s3 = m.index + m[1].length; add(s3, s3 + 1, "Write I with a capital", [{ start: s3, end: s3 + 1, text: "I" }], "Change to \u201CI\u201D"); }
    // sentence starts
    var cre = /(^|\n[ \t]*\n[ \t]*|[.!?]["'\u201d\u2019)]*[ \t]+)(["\u201c(]?)([a-z][A-Za-z']*)/g;
    while ((m = cre.exec(text))) {
      var lead = m[1], word = m[3], pos = m.index + lead.length + m[2].length;
      if (/^[.!?]/.test(lead)) {
        if (/["'\u201d\u2019)]/.test(lead) && /[?!]/.test(lead)) continue; // a dialogue tag such as "Really?" she asked
        if (/\.\.$|\u2026$/.test(text.slice(Math.max(0, m.index - 2), m.index + 1))) continue; // after an ellipsis
        if (/\b(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|no|fig|approx|inc|ltd|cf)$/i.test(text.slice(Math.max(0, m.index - 8), m.index)) || /\b(?:e\.g|i\.e)$/i.test(text.slice(Math.max(0, m.index - 6), m.index))) continue;
      }
      if (/^(www|http)/i.test(word) || /[0-9_@\/]/.test(text.charAt(pos + word.length)) || (text.charAt(pos + word.length) === "." && /^[a-z]{1,2}$/.test(word))) continue;
      var up = word.charAt(0).toUpperCase();
      add(pos, pos + word.length, "Start a sentence with a capital", [{ start: pos, end: pos + 1, text: up }], "Change to \u201C" + up + word.slice(1) + "\u201D");
    }
    // spaces before punctuation
    var sre = /([^\s])([ \t]+)([,;:!?]|\.(?!\.))/g;
    while ((m = sre.exec(text))) { var s4 = m.index + 1; if (/\d/.test(m[1]) && m[3] === ":") continue; add(s4, s4 + m[2].length, "Space before punctuation", [{ start: s4, end: s4 + m[2].length, text: "" }], "Remove the space"); }
    // double spaces inside a line
    var dsr = /([^\s])( {2,})(?=\S)/g;
    while ((m = dsr.exec(text))) { var s5 = m.index + 1; add(s5, s5 + m[2].length, "Double space", [{ start: s5, end: s5 + m[2].length, text: " " }], "Use one space"); }
    // doubled commas
    var cc = /,(?:[ \t]*,)+/g;
    while ((m = cc.exec(text))) add(m.index, m.index + m[0].length, "Doubled comma", [{ start: m.index, end: m.index + m[0].length, text: "," }], "Use one comma");
    // missing space after a comma, semicolon or full stop
    var mre = /([A-Za-z]{2,})([,;]|\.(?=[A-Z][a-z]))(?=[A-Za-z])/g;
    while ((m = mre.exec(text))) {
      var around = text.slice(Math.max(0, m.index - 12), m.index + m[0].length + 14);
      if (m[2] === "." && (/[\/@]|www|https?:/i.test(around) || /\b[a-z]{2,}\.(?:com|org|net|io|co|uk|ae|in)\b/i.test(around))) continue;
      var s6 = m.index + m[1].length; add(s6, s6 + 1, "Missing space after " + (m[2] === "." ? "the full stop" : m[2] === "," ? "the comma" : "the semicolon"), [{ start: s6, end: s6 + 1, text: m[2] + " " }], "Add a space");
    }
    return out;
  }

  // ---------- Spelling ----------
  // opts.spell is { correct(word) -> bool, suggest(word) -> [words] } built from the dictionary. opts.ignore is a set of lowercase words to accept.
  var WRE = /[A-Za-z\u00C0-\u024F]+(?:['\u2019][A-Za-z]+)*/g;
  function spellFlags(text, opts) {
    var sp = opts.spell, ign = opts.ignore || {}, out = [], m, re = new RegExp(WRE.source, "g");
    while ((m = re.exec(text))) {
      var w = m[0], s = m.index, e = s + w.length, pc = text.charAt(s - 1), nc = text.charAt(e), n2 = text.charAt(e + 1);
      if (w.length < 2 || /[0-9_@\/#\\]/.test(pc) || /[0-9_@\/]/.test(nc) || (nc === "." && /[A-Za-z]/.test(n2)) || (pc === "." && /[A-Za-z]/.test(text.charAt(s - 2)))) continue;
      if (/^(https?|www)$/i.test(w)) continue;
      var norm = w.replace(/\u2019/g, "'"), base = norm.replace(/'[sS]$/, "");
      if (base === base.toUpperCase() && base.length > 1) continue;
      if (/[a-z][A-Z]/.test(base)) continue;
      if (ign[base.toLowerCase()] || ign[norm.toLowerCase()]) continue;
      if (/^[A-Z]/.test(base) && !atSentenceStart(text, s)) continue;
      if (!sp.correct(norm) && !sp.correct(base)) out.push({ type: "spell", start: s, end: e, text: w, note: "Not in the dictionary. It could be a typo, a name, or a word I do not know." });
    }
    return out;
  }

  return { analyze: analyze, clean: clean, sentences: sentences, words: words, choices: choices, defaultFix: defaultFix, fixAll: fixAll, applyEdits: applyEdits };
});
