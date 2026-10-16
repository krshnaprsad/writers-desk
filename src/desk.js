/* Writer's Desk engine. Plain functions, no browser needed, so it can be tested in Node. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../data/phrases.js"));
  else root.Desk = factory(root.DeskLists);
})(typeof self !== "undefined" ? self : this, function (L) {
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

  var PRIO = { dash: 5, cliche: 4, ai: 3, rep: 2, filler: 1 };
  function analyze(text) {
    text = String(text || "");
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
    // resolve overlaps, higher priority wins
    flags.sort(function (a, b) { return a.start - b.start || PRIO[b.type] - PRIO[a.type]; });
    var kept = []; flags.forEach(function (f) { var p = kept[kept.length - 1]; if (p && f.start < p.end) { if (PRIO[f.type] > PRIO[p.type] && f.end >= p.end) kept[kept.length - 1] = f; return; } kept.push(f); });
    var tally = { dash: 0, cliche: 0, ai: 0, rep: 0, filler: 0 }; kept.forEach(function (f) { tally[f.type]++; });

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
  return { analyze: analyze, clean: clean, sentences: sentences, words: words };
});
