(function () {
  var $ = function (s) { return document.querySelector(s); };
  var EX = "It was a dark and stormy night. I walked home\u2014slowly, really slowly\u2014and the rain fell. The rain fell harder. The rain fell and fell. I could not help but smile, because the whole thing felt like a testament to how far I had come.\n\n\u201CYou are late,\u201D she said. Her voice was barely above a whisper. I did not answer. Little did I know, the night was only beginning.\n\nThe door opened. A very long silence hung in the air, and the silence was deafening. Then she laughed.";
  var NAMES = { dash: "Long dashes", cliche: "Tired phrases", ai: "Padded words", rep: "Close repeats", filler: "Filler words" };
  var off = {}, before = null, timer = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mins(m) { if (m < 1 / 6) return "under 10 sec"; if (m < 1) return Math.round(m * 60) + " sec"; var t = Math.round(m * 10) / 10; return t + " min"; }
  function run() {
    var t = $("#txt").value, out = $("#out");
    $("#count").textContent = t.trim() ? Desk.analyze(t).words + " words" : "";
    if (!t.trim()) { out.hidden = true; return; }
    var a = Desk.analyze(t); out.hidden = false;
    $("#stats").innerHTML = [["Words", a.words], ["Sentences", a.sentences], ["Paragraphs", a.paragraphs], ["Reading time", mins(a.readMinutes)], ["Speaking time", mins(a.speakMinutes)], ["Characters", a.chars]].map(function (x) { return "<div><b>" + x[1] + "</b><span>" + x[0] + "</span></div>"; }).join("");
    // marked text
    var h = "", pos = 0;
    a.flags.forEach(function (f) { h += esc(t.slice(pos, f.start)); h += off[f.type] ? esc(t.slice(f.start, f.end)) : '<mark class="m-' + f.type + '" title="' + esc(f.note) + '">' + esc(t.slice(f.start, f.end)) + "</mark>"; pos = f.end; });
    $("#marked").innerHTML = h + esc(t.slice(pos));
    $("#legend").innerHTML = Object.keys(NAMES).map(function (k) { return '<button class="chip m-' + k + (off[k] ? " off" : "") + '" data-k="' + k + '">' + NAMES[k] + " " + a.tally[k] + "</button>"; }).join("");
    document.querySelectorAll(".chip").forEach(function (c) { c.onclick = function () { off[c.dataset.k] = !off[c.dataset.k]; run(); }; });
    $("#markednote").textContent = a.flags.length ? "Tap a label to hide or show it. Hover a mark to see why it is marked." : "Nothing marked. Either it is clean, or it is too short to judge.";
    // rhythm
    var mx = Math.max.apply(null, a.lens.concat([1]));
    var bars = a.lens.length > 120 ? "" : '<div class="bars">' + a.lens.map(function (l, i) { return '<i style="height:' + Math.max(4, Math.round(l / mx * 100)) + '%" title="Sentence ' + (i + 1) + ": " + l + ' words"></i>'; }).join("") + "</div>";
    var msg = a.rhythm === "flat" ? "Most sentences are about the same length, which can read flat. Try mixing a short one in." : a.rhythm === "varied" ? "Good mix of long and short sentences." : a.rhythm === "mixed" ? "A fair mix of lengths." : "Not enough sentences to judge the rhythm yet (it needs about 6).";
    $("#rhythm").innerHTML = bars + '<p class="rh"><b>' + a.rhythm + "</b>. " + msg + "</p><p class=\"note\">Average " + a.avg.toFixed(1) + " words, shortest " + a.shortest + ", longest " + a.longest + (a.runs ? ". " + a.runs + " run" + (a.runs > 1 ? "s" : "") + " of three or more sentences in a row with almost the same length" : "") + "." + (a.startsRep.length ? " Many sentences start with the same word: " + a.startsRep.map(function (s) { return "\u201C" + esc(s.word) + "\u201D (" + s.count + ")"; }).join(", ") + "." : "") + "</p>";
    $("#reps").innerHTML = a.repeated.length ? '<div class="tags">' + a.repeated.map(function (r) { return "<span><b>" + esc(r.word) + "</b> " + r.count + "</span>"; }).join("") + '</div><p class="note">Common small words are skipped, and so are names.</p>' : '<p class="note">No word comes up often enough to flag.</p>';
  }
  function later() { clearTimeout(timer); timer = setTimeout(run, 120); }
  $("#txt").addEventListener("input", later);
  $("#clear").onclick = function () { $("#txt").value = ""; before = null; $("#undo").hidden = true; $("#cleanmsg").textContent = ""; run(); };
  $("#ex").onclick = function () { $("#txt").value = EX; run(); };
  $("#copy").onclick = function () { var t = $("#txt").value; if (!t) return; var done = function () { $("#cleanmsg").textContent = "Copied."; }; if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { $("#txt").select(); document.execCommand("copy"); done(); }); else { $("#txt").select(); document.execCommand("copy"); done(); } };
  $("#doclean").onclick = function () {
    var t = $("#txt").value; if (!t) return;
    var c = Desk.clean(t, { dashes: $("#o-dashes").checked, quotes: $("#o-quotes").checked, hidden: $("#o-hidden").checked, spaces: $("#o-spaces").checked });
    var n = 0; for (var i = 0; i < Math.max(t.length, c.length); i++) if (t[i] !== c[i]) { n++; break; }
    if (t === c) { $("#cleanmsg").textContent = "Nothing to change."; return; }
    before = t; $("#txt").value = c; $("#undo").hidden = false; $("#cleanmsg").textContent = "Cleaned. " + Math.abs(t.length - c.length) + " characters different in length."; run();
  };
  $("#undo").onclick = function () { if (before !== null) { $("#txt").value = before; before = null; $("#undo").hidden = true; $("#cleanmsg").textContent = "Undone."; run(); } };
  window.WritersDesk = { run: run };
})();
