(function () {
  var $ = function (s) { return document.querySelector(s); };
  var EX = "It was a dark and stormy night. I walked home\u2014slowly, really slowly\u2014and the rain fell. The rain fell harder. The rain fell and fell. I could not help but smile, because the whole thing felt like a testament to how far I had come.\n\n\u201CYou are late,\u201D she said. Her voice was barely above a whisper. I did not answer. Little did I know, the night was only beginning.\n\nThe door opened. A very long silence hung in the air, and the silence was deafening. Then she laughed.";
  var NAMES = { spell: "Spelling", gram: "Grammar and spacing", dash: "Long dashes", cliche: "Tired phrases", ai: "Padded words", rep: "Close repeats", filler: "Filler words" };
  var off = {}, timer = null, HIST = [], SP = null, FL = [], TXT = "", skip = {}, mine = {};
  try { (JSON.parse(localStorage.getItem("wd-words") || "[]") || []).forEach(function (w) { mine[w] = 1; }); } catch (e) {}
  function ao() { return { spell: SP, ignore: mine }; }
  function keyOf(f) { return f.type + ":" + f.text.toLowerCase(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mins(m) { if (m < 1 / 6) return "under 10 sec"; if (m < 1) return Math.round(m * 60) + " sec"; var t = Math.round(m * 10) / 10; return t + " min"; }
  function run() {
    var t = $("#txt").value, out = $("#out");
    if (!t.trim()) { $("#count").textContent = ""; out.hidden = true; return; }
    var a = Desk.analyze(t, ao()); out.hidden = false; $("#count").textContent = a.words + " words";
    a.flags = a.flags.filter(function (f) { return !skip[keyOf(f)]; });
    a.tally = { spell: 0, gram: 0, dash: 0, cliche: 0, ai: 0, rep: 0, filler: 0 }; a.flags.forEach(function (f) { a.tally[f.type]++; });
    FL = a.flags; TXT = t;
    $("#stats").innerHTML = [["Words", a.words], ["Sentences", a.sentences], ["Paragraphs", a.paragraphs], ["Reading time", mins(a.readMinutes)], ["Speaking time", mins(a.speakMinutes)], ["Characters", a.chars]].map(function (x) { return "<div><b>" + x[1] + "</b><span>" + x[0] + "</span></div>"; }).join("");
    // marked text
    var h = "", pos = 0;
    a.flags.forEach(function (f, i) { h += esc(t.slice(pos, f.start)); h += off[f.type] ? esc(t.slice(f.start, f.end)) : '<mark class="m-' + f.type + '" data-i="' + i + '" tabindex="0" role="button" title="' + esc(f.note) + '. Tap to fix.">' + esc(t.slice(f.start, f.end)) + "</mark>"; pos = f.end; });
    $("#marked").innerHTML = h + esc(t.slice(pos));
    $("#legend").innerHTML = Object.keys(NAMES).map(function (k) { return '<button class="chip m-' + k + (off[k] ? " off" : "") + '" data-k="' + k + '">' + NAMES[k] + " " + a.tally[k] + "</button>"; }).join("");
    document.querySelectorAll(".chip").forEach(function (c) { c.onclick = function () { off[c.dataset.k] = !off[c.dataset.k]; run(); }; });
    $("#markednote").textContent = (a.flags.length ? "Tap a mark to see why it is marked and pick a fix. Tap a label above to hide or show a kind." : "Nothing marked. Either it is clean, or it is too short to judge.") + (SP ? "" : (DICT_FAIL ? " The spelling dictionary did not load, so spelling is not checked." : " Loading the spelling dictionary..."));
    fixbar(a);
    // rhythm
    var mx = Math.max.apply(null, a.lens.concat([1]));
    var bars = a.lens.length > 120 ? "" : '<div class="bars">' + a.lens.map(function (l, i) { return '<i style="height:' + Math.max(4, Math.round(l / mx * 100)) + '%" title="Sentence ' + (i + 1) + ": " + l + ' words"></i>'; }).join("") + "</div>";
    var msg = a.rhythm === "flat" ? "Most sentences are about the same length, which can read flat. Try mixing a short one in." : a.rhythm === "varied" ? "Good mix of long and short sentences." : a.rhythm === "mixed" ? "A fair mix of lengths." : "Not enough sentences to judge the rhythm yet (it needs about 6).";
    $("#rhythm").innerHTML = bars + '<p class="rh"><b>' + a.rhythm + "</b>. " + msg + "</p><p class=\"note\">Average " + a.avg.toFixed(1) + " words, shortest " + a.shortest + ", longest " + a.longest + (a.runs ? ". " + a.runs + " run" + (a.runs > 1 ? "s" : "") + " of three or more sentences in a row with almost the same length" : "") + "." + (a.startsRep.length ? " Many sentences start with the same word: " + a.startsRep.map(function (s) { return "\u201C" + esc(s.word) + "\u201D (" + s.count + ")"; }).join(", ") + "." : "") + "</p>";
    $("#reps").innerHTML = a.repeated.length ? '<div class="tags">' + a.repeated.map(function (r) { return "<span><b>" + esc(r.word) + "</b> " + r.count + "</span>"; }).join("") + '</div><p class="note">Common small words are skipped, and so are names.</p>' : '<p class="note">No word comes up often enough to flag.</p>';
  }
  function later() { clearTimeout(timer); timer = setTimeout(run, 120); }
  $("#txt").addEventListener("input", later);
  $("#clear").onclick = function () { if ($("#txt").value) HIST.push($("#txt").value); $("#txt").value = ""; $("#cleanmsg").textContent = ""; closePop(); run(); upd(); };
  $("#ex").onclick = function () { if ($("#txt").value) HIST.push($("#txt").value); $("#txt").value = EX; closePop(); run(); upd(); };
  $("#copy").onclick = function () { var t = $("#txt").value; if (!t) return; var done = function () { $("#cleanmsg").textContent = "Copied."; }; if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { $("#txt").select(); document.execCommand("copy"); done(); }); else { $("#txt").select(); document.execCommand("copy"); done(); } };
  $("#doclean").onclick = function () {
    var t = $("#txt").value; if (!t) return;
    var c = Desk.clean(t, { dashes: $("#o-dashes").checked, quotes: $("#o-quotes").checked, hidden: $("#o-hidden").checked, spaces: $("#o-spaces").checked });
    if (t === c) { $("#cleanmsg").textContent = "Nothing to change."; return; }
    setText(c, "Cleaned. Undo puts it back.");
  };
  $("#undo").onclick = $("#undo2").onclick = undo;
  // ---- fixing ----
  function setText(t, msg) { var ta = $("#txt"); HIST.push(ta.value); if (HIST.length > 60) HIST.shift(); ta.value = t; closePop(); $("#fixmsg").textContent = msg || ""; $("#cleanmsg").textContent = msg || ""; run(); upd(); }
  function undo() { if (!HIST.length) return; $("#txt").value = HIST.pop(); closePop(); $("#fixmsg").textContent = "Undone."; $("#cleanmsg").textContent = "Undone."; run(); upd(); }
  function upd() { var n = HIST.length; [$("#undo"), $("#undo2")].forEach(function (b) { b.hidden = !n; }); $("#undo2").textContent = "Undo (" + n + ")"; }
  var KINDS = [["dash", "Fix long dashes"], ["filler", "Remove filler words"], ["ai", "Fix padded words"], ["rep", "Fix close repeats"], ["gram", "Fix grammar and spacing"]];
  function fixCounts(a) { var c = {}; KINDS.forEach(function (k) { c[k[0]] = 0; }); a.flags.forEach(function (f) { if (c[f.type] !== undefined && !off[f.type] && !f.first && Desk.defaultFix(TXT, f)) c[f.type]++; }); return c; }
  function fixbar(a) {
    var c = fixCounts(a), total = 0, h = "";
    KINDS.forEach(function (k) { total += c[k[0]]; if (c[k[0]]) h += '<button class="btn" data-fix="' + k[0] + '">' + k[1] + " " + c[k[0]] + "</button>"; });
    if (total) h = '<button class="btn go" data-fix="all">Accept all ' + total + "</button>" + h;
    $("#fixes").innerHTML = h;
    document.querySelectorAll("[data-fix]").forEach(function (b) { b.onclick = function () {
      var k = b.dataset.fix, kinds = k === "all" ? KINDS.map(function (x) { return x[0]; }).filter(function (x) { return !off[x]; }) : [k], r = Desk.fixAll($("#txt").value, kinds, ao());
      if (r.text === $("#txt").value) { $("#fixmsg").textContent = "Nothing to change."; return; }
      setText(r.text, "Fixed " + r.count + ". Read it through, then use Undo if something sounds wrong.");
    }; });
  }
  // ---- the pop-up for one mark ----
  var pop = $("#pop");
  function closePop() { pop.hidden = true; pop.innerHTML = ""; }
  function openPop(el) {
    var f = FL[+el.dataset.i]; if (!f) return;
    var c = Desk.choices(TXT, f, ao()), h = '<p class="pt">' + esc(f.note) + '</p><p class="pw">\u201C' + esc(f.text) + '\u201D</p>';
    c.choices.forEach(function (x, i) { h += '<button class="opt" data-c="' + i + '">' + esc(x.label) + "</button>"; });
    if (!c.choices.length) h += '<p class="note">' + esc(c.none) + "</p>";
    h += '<div class="pa"><button class="opt dim" data-ig="1">Ignore this</button>' + (f.type === "spell" ? '<button class="opt dim" data-add="1">Add to my words</button>' : "") + '<button class="opt dim" data-x="1">Close</button></div>';
    if (f.type !== "spell" && f.type !== "gram") h += '<p class="note small">Alternatives come from a small built-in list, not an AI. Read the sentence after you change it.</p>';
    pop.innerHTML = h; pop.hidden = false;
    var r = el.getBoundingClientRect(), pw = Math.min(300, window.innerWidth - 16);
    pop.style.width = pw + "px"; pop.style.left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left)) + "px";
    var top = r.bottom + 6; pop.style.top = top + "px"; var ph = pop.offsetHeight; if (top + ph > window.innerHeight - 8) pop.style.top = Math.max(8, r.top - ph - 6) + "px";
    pop.querySelectorAll("[data-c]").forEach(function (b) { b.onclick = function () { var ch = c.choices[+b.dataset.c]; setText(Desk.applyEdits(TXT, ch.edits), "Changed."); }; });
    pop.querySelector("[data-ig]").onclick = function () { skip[keyOf(f)] = 1; closePop(); run(); };
    var ad = pop.querySelector("[data-add]"); if (ad) ad.onclick = function () { mine[f.text.toLowerCase()] = 1; try { localStorage.setItem("wd-words", JSON.stringify(Object.keys(mine))); } catch (e) {} closePop(); run(); };
    pop.querySelector("[data-x]").onclick = closePop;
  }
  $("#marked").addEventListener("click", function (e) { var m = e.target.closest && e.target.closest("mark[data-i]"); if (m) { e.preventDefault(); openPop(m); } });
  $("#marked").addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("mark[data-i]")) { e.preventDefault(); openPop(e.target); } });
  document.addEventListener("mousedown", function (e) { if (!pop.hidden && !pop.contains(e.target) && !(e.target.closest && e.target.closest("mark[data-i]"))) closePop(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(); });
  window.addEventListener("scroll", closePop, true);
  // ---- the spelling dictionary loads after the page, so typing is never blocked ----
  var DICT_FAIL = false;
  function loadDict() {
    var files = ["data/dict-0.js", "data/dict-1.js", "data/dict-2.js", "data/dict-3.js", "data/dict-4.js", "data/dict-5.js", "vendor/nspell.js"], i = 0;
    function next() {
      if (i >= files.length) { try { SP = DeskSpell.make(NSpell, window.DeskDic.aff, window.DeskDic.parts.join("\n")); } catch (e) { DICT_FAIL = true; } run(); return; }
      var s = document.createElement("script"); s.src = files[i++] + "?v=1.2.8"; s.onload = next; s.onerror = function () { DICT_FAIL = true; run(); }; document.head.appendChild(s);
    }
    next();
  }
  setTimeout(loadDict, 50);
  // ---- Smart mode (optional, off until asked) ----
  var sup = window.DeskSmart ? DeskSmart.support() : { ok: false, why: "Smart mode did not load." };
  var smm = $("#smmsg"), smbar = $("#smbar"), pick = $("#smpick");
  if (!sup.ok) smm.textContent = sup.why;
  else {
    smm.textContent = "Checking what this device can run...";
    DeskSmart.probe().then(function (pr) {
      var ks = pr.gpu && !DeskSmart.bigDead() ? ["small", "big"] : ["small"];
      smm.textContent = pr.gpu ? "Your browser can use the graphics chip, which is faster. " + (DeskSmart.bigDead() ? "The bigger model is turned off here because it gave unusable output." : "Both models are available.") + "" : "No usable graphics acceleration here, so it will run on the processor, slower. Only the small model is offered, because the bigger one does not fit in a browser tab without the graphics chip.";
      Promise.all(ks.map(function (k) { return DeskSmart.info(k); })).then(function (infos) {
      pick.innerHTML = ks.map(function (k, j) { var m = DeskSmart.MODELS[k]; return '<button class="btn" data-model="' + k + '">Turn on ' + m.name + ", download " + (infos[j].a ? infos[j].a.mb : (pr.gpu ? m.gpuMB : m.cpuMB)) + ' MB</button>'; }).join("") + '<span class="note">Needs ' + DeskSmart.MODELS.small.ram + " for the small one" + (pr.gpu ? ", " + DeskSmart.MODELS.big.ram + " for the bigger one" : "") + ". The download is kept in your browser, so a failed start does not download it again.</span>";
      var auto = null; try { auto = sessionStorage.getItem("wd-smart-auto"); sessionStorage.removeItem("wd-smart-auto"); } catch (x) {}
      pick.querySelectorAll("[data-model]").forEach(function (b) { b.onclick = function () {
        var k = b.dataset.model; pick.querySelectorAll("button").forEach(function (x) { x.disabled = true; }); smbar.hidden = false; smm.textContent = "Downloading...";
        DeskSmart.load(k, function (f, t) { $("#smfill").style.width = Math.round(f * 100) + "%"; smm.textContent = t; }).then(function () {
          smbar.hidden = true; pick.hidden = true; $("#smtools").hidden = false; smm.textContent = DeskSmart.MODELS[k].name + " is on. It runs on your device."; DeskSmart.methodNow(k).then(function (m) { if (m) { var d = document.createElement("details"); d.innerHTML = "<summary>Technical details</summary><pre class=\"note\"></pre>"; d.querySelector("pre").textContent = "Method in use: " + m + "\nWriter's Desk " + WritersDesk.version + "\nLog:\n" + DeskSmart.log(k).join("\n"); smm.appendChild(d); } });
        }, function (e) { smbar.hidden = true; pick.querySelectorAll("button").forEach(function (x) { x.disabled = false; }); smm.textContent = "It could not start: " + (e && e.message ? e.message : "unknown error"); var d = document.createElement("details"); d.innerHTML = "<summary>Technical details (send me these)</summary><pre class=\"note\" style=\"white-space:pre-wrap\"></pre>"; d.querySelector("pre").textContent = "Writer's Desk " + (window.WritersDesk ? WritersDesk.version : "") + "\nPath: " + (e && e.path || "") + "\nError: " + (e && e.raw || e) + "\nLog:\n" + (window.DeskSmart ? DeskSmart.log(k).join("\n") : "") + "\nBrowser: " + navigator.userAgent; smm.appendChild(d); });
      }; });
      if (auto && pick.querySelector("[data-model=" + auto + "]")) { DeskSmart.info(auto).then(function (n) { smm.textContent = (n.reason || "The earlier method did not work on this device.") + " Trying method " + (n.i + 1) + " of " + n.n + " (" + n.a.dev + ", " + n.a.dt + "). " + (n.cached ? "Those files are already downloaded." : "This needs another download of about " + n.a.mb + " MB."); pick.querySelector("[data-model=" + auto + "]").click(); }); }
      });
    });
  }
  function smRange() {
    var ta = $("#txt"), t = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    if (e - s > 3) return [s, e];
    var pos = s, ps = t.lastIndexOf("\n\n", pos - 1); ps = ps < 0 ? 0 : ps + 2; var pe = t.indexOf("\n\n", pos); if (pe < 0) pe = t.length;
    return [ps, pe];
  }
  document.querySelectorAll("[data-sm]").forEach(function (b) { b.onclick = function () {
    var r = smRange(), t = $("#txt").value, seg = t.slice(r[0], r[1]), mode = b.dataset.sm, res = $("#smres");
    if (!seg.trim()) { res.innerHTML = '<p class="note">Select some text, or put the cursor in a paragraph, first.</p>'; return; }
    document.querySelectorAll("[data-sm]").forEach(function (x) { x.disabled = true; });
    res.innerHTML = '<p class="note">Thinking. On a laptop this can take from several seconds to a few minutes. I work a few sentences at a time.</p><p class="note" id="smprog"></p>';
    DeskSmart.rewrite(seg, mode, function (p) {
      var m = "Working on part " + p.chunk + " of " + p.chunks + (p.attempt > 1 ? " (retry " + (p.attempt - 1) + ", the last try looked bad)" : "") + ". " + p.tokens + " tokens so far" + (p.tps ? ", " + p.tps.toFixed(1) + " tokens per second" : "") + ", " + Math.round(p.secs) + " s.";
      var el = $("#smprog"); if (el) el.textContent = m;
    }).then(function (out) {
      if (!out) throw new Error("It gave nothing back. Try again.");
      var warn = DeskSmart.addedFacts(seg, out), words = mode === "literary" ? DeskSmart.newWords(seg, out) : [];
      var h = '<div class="smcmp"><div><b>Before</b>' + esc(seg) + '</div><div><b>After</b>' + esc(out) + "</div></div>";
      if (warn.length) h += '<p class="smwarn">It added things that were not in your text: ' + esc(warn.join(", ")) + ". Check that these are what you meant.</p>";
      h += '<div id="smwords"></div><div class="row"><button class="btn go" id="smacc">Accept</button><button class="btn" id="smno">Discard</button></div><p class="note small">Accept replaces the text above. Undo puts it back.</p>';
      res.innerHTML = h;
      $("#smacc").onclick = function () { var cur = $("#txt").value; if (cur.slice(r[0], r[1]) !== seg) { res.innerHTML = '<p class="note">The text changed since. Run it again.</p>'; return; } setText(cur.slice(0, r[0]) + out + cur.slice(r[1]), "Rewritten by Smart mode. Use Undo to go back."); res.innerHTML = ""; };
      $("#smno").onclick = function () { res.innerHTML = ""; };
      if (words.length) { $("#smwords").innerHTML = '<p class="note">New words, with short meanings from the same small model (they can be wrong, check a dictionary):</p><p class="note">Looking them up...</p>';
        DeskSmart.define(words).then(function (d) { $("#smwords").innerHTML = '<p class="note">New words, with short meanings from the same small model (they can be wrong, check a dictionary). If you do not like one, Discard and run again, or change it in the text after you accept:</p><ul class="smwords">' + words.map(function (w) { return "<li><b>" + esc(w) + "</b>" + (d[w] ? ": " + esc(d[w]) : "") + "</li>"; }).join("") + "</ul>"; }); }
    }).catch(function (e) {
      if (e && e.garbage && DeskSmart.current()) { var k = DeskSmart.current(); return DeskSmart.markBad(k).then(function (more) { res.innerHTML = '<p class="note">This method gave garbage (' + esc(e.raw.split("\n")[0]) + "). " + (more ? "Switching to the next method and reloading..." : "The bigger model gave unusable output with every method here, so I have turned it off on this device. The small one still works. Reload the page to continue.") + "</p>"; if (more) setTimeout(function () { location.reload(); }, 1500); }); }
      res.innerHTML = '<p class="note">' + (e && e.guard ? "This attempt failed, try again." : "Smart mode failed: " + esc(e && e.message ? e.message : "unknown error")) + "</p>" + (e && e.raw ? '<details><summary>Technical details</summary><pre class="note" style="white-space:pre-wrap">' + esc(e.raw) + "</pre></details>" : ""); }).then(function () { document.querySelectorAll("[data-sm]").forEach(function (x) { x.disabled = false; }); });
  }; });
  window.WritersDesk = { run: run, version: "1.2.8" };
})();
