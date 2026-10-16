/* Smart mode: optional small language models that run inside the browser. Nothing is sent anywhere.
   The library comes from a free CDN and the model files from huggingface.co. Both are free and need no account or key. */
(function () {
  var LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/transformers.min.js";
  // sizes in MB are from the model files on huggingface.co: q4f16 runs on the graphics chip (WebGPU), q8 runs on the processor
  var MODELS = {
    small: { id: "onnx-community/Qwen2.5-0.5B-Instruct", name: "Small (0.5B)", gpuMB: 483, cpuMB: 512, ram: "about 1.5 GB free" },
    big: { id: "onnx-community/Qwen2.5-1.5B-Instruct", name: "Bigger (1.5B)", gpuMB: 1221, cpuMB: 1578, ram: "about 3 GB free" }
  };
  var cur = null, key = null, curIdx = 0, loading = null, trail = [], TL = null;
  var NO_FACTS = " Rules: keep every fact, image and the meaning. Keep the first person voice, the tense and the point of view. Do not add facts, events or names. Do not repeat words or sentences. Write about the same number of words as the original. Never use long dashes. Reply with only the rewritten text, no title and no explanation.";
  var PROMPTS = {
    human: "You are an editor. Rewrite the text so it sounds natural and human, as a thoughtful person would say it. Use plain everyday words and a relaxed rhythm. Vary sentence length." + NO_FACTS,
    literary: "You are an editor. Rewrite the text in a more literary style, with richer and more precise words and a careful rhythm. Prefer vivid concrete words." + NO_FACTS
  };
  function support() {
    if (typeof WebAssembly !== "object") return { ok: false, why: "This browser cannot run it (no WebAssembly). Try a recent Chrome or Edge." };
    return { ok: true, gpu: !!navigator.gpu };
  }
  // Ask the graphics chip what it can do. The fast path needs WebGPU with 16-bit shader support. Without it the model would crash on start.
  var probed = null;
  function probe() {
    if (probed) return probed;
    probed = Promise.resolve().then(function () {
      if (!navigator.gpu || !navigator.gpu.requestAdapter) return { gpu: false };
      return navigator.gpu.requestAdapter({ powerPreference: "high-performance" }).then(function (a) {
        if (!a) return { gpu: false };
        var f16 = !!(a.features && a.features.has && a.features.has("shader-f16"));
        var big = a.limits && a.limits.maxBufferSize ? a.limits.maxBufferSize : 0;
        return { gpu: f16, f16: f16, maxBuffer: big };
      });
    }).catch(function () { return { gpu: false }; });
    return probed;
  }
  // Methods to try, in order. Some graphics drivers crash the engine on one file type, so we try the others.
  // A crash ("Aborted") leaves the engine unusable until the page reloads, so after one the page reloads itself and moves to the next method.
  var L4 = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js";
  function list(k, gpu) {
    var m = MODELS[k];
    if (k === "big") return gpu && !getSt(k).dead ? [{ lib: LIB, dev: "webgpu", dt: "q4f16", mb: m.gpuMB }, { lib: L4, dev: "webgpu", dt: "q4f16", mb: m.gpuMB }] : [];
    if (!gpu) return [{ lib: LIB, dev: "wasm", dt: "q8", mb: m.cpuMB }, { lib: L4, dev: "wasm", dt: "q8", mb: m.cpuMB }];
    return [
      { lib: L4, dev: "webgpu", dt: "q4f16", mb: 483 },
      { lib: LIB, dev: "webgpu", dt: "q4", mb: 786 },
      { lib: L4, dev: "webgpu", dt: "fp16", mb: 988 },
      { lib: LIB, dev: "wasm", dt: "q8", mb: 512 }
    ];
  }
  function label(a) { return a.dev + " " + a.dt + " (engine " + (a.lib === LIB ? "3.7.5" : "4.3.1") + ")"; }
  function getSt(k) { try { return JSON.parse(localStorage.getItem("wd-smart2-" + k) || "{}"); } catch (e) { return {}; } }
  function setSt(k, v) { try { localStorage.setItem("wd-smart2-" + k, JSON.stringify(v)); } catch (e) {} }
  function logOf(k) { try { return JSON.parse(localStorage.getItem("wd-smart-log-" + k) || "[]"); } catch (e) { return []; } }
  function logAdd(k, msg) { var l = logOf(k); l.push(new Date().toISOString().slice(11, 19) + " " + msg); try { localStorage.setItem("wd-smart-log-" + k, JSON.stringify(l.slice(-30))); } catch (e) {} }
  function loadedBefore(k, a) { return logOf(k).some(function (x) { return x.indexOf(" " + a.dev + " " + a.dt + " ") >= 0 && /: loaded/.test(x); }); }
  function info(k) { return probe().then(function (pr) { var L = list(k, pr.gpu), st = getSt(k), i = st.ok != null ? st.ok : (st.next || 0); return { i: i, n: L.length, a: L[i], retry: !!st.next && st.ok == null, reason: st.reason || "", cached: L[i] ? loadedBefore(k, L[i]) : false }; }); }
  // Download progress comes from the "progress_total" event (all files, known up front). Older engines only report per file.
  // A watchdog turns a stall into an error, so the page moves to the next method instead of hanging.
  function tryOne(a, k, progress) {
    var t0 = Date.now(), lastMove = Date.now(), loaded = 0, total = 0, dlDone = false, dlDoneAt = 0, timer = null, files = {}, failed = false;
    function fmt() { return Math.round(loaded / 1e6) + " of " + Math.round(total / 1e6) + " MB"; }
    function startMsg() { return "Download finished. Starting the model on your " + (a.dev === "webgpu" ? "graphics chip" : "processor") + " (" + a.dt + "). The first start can take one or two minutes. " + Math.round((Date.now() - dlDoneAt) / 1000) + " s so far."; }
    var wd = new Promise(function (_, rej) {
      timer = setInterval(function () {
        var now = Date.now();
        if (dlDone) { progress(1, startMsg()); if (now - dlDoneAt > 180000) { rej(new Error("Aborted: the model did not start within 3 minutes with " + label(a) + ".")); } }
        else if (now - lastMove > 90000) rej(new Error("Aborted: no download progress for 90 seconds with " + label(a) + "."));
        else if (total && loaded) progress(loaded / total, "Downloading " + fmt() + " (" + Math.round(100 * loaded / total) + "%)");
        else progress(0, "Connecting to the download server... " + Math.round((now - t0) / 1000) + " s");
      }, 1000);
    });
    var work = import(a.lib).then(function (T) {
      var m = MODELS[k];
      function cb(x) {
        if (x.status === "progress_total" && x.total) { if (x.loaded !== loaded) lastMove = Date.now(); loaded = x.loaded; total = x.total; if (loaded >= total) { dlDone = true; dlDoneAt = dlDoneAt || Date.now(); } }
        else if (x.status === "progress" && x.total && x.file) { files[x.file] = { l: x.loaded, t: x.total }; if (!total) { var l = 0, t = 0; for (var f in files) { l += files[f].l; t += files[f].t; } loaded = l; total = t; } lastMove = Date.now(); }
        else if (x.status === "ready") { dlDone = true; dlDoneAt = dlDoneAt || Date.now(); }
      }
      try { T.env.backends.onnx.wasm.numThreads = 1; T.env.backends.onnx.wasm.proxy = false; if (T.env.backends.onnx.webgpu) T.env.backends.onnx.webgpu.powerPreference = "high-performance"; } catch (e) {}
      TL = T; return T.pipeline("text-generation", m.id, { device: a.dev, dtype: a.dt, progress_callback: cb });
    });
    return Promise.race([work, wd]).then(function (g) { clearInterval(timer); return g; }, function (e) { clearInterval(timer); throw e; });
  }
  function load(k, progress) {
    if (cur && key === k) return Promise.resolve(cur);
    if (loading && loading.k === k) return loading.p;
    var s = support(); if (!s.ok) return Promise.reject(new Error(s.why));
    var p = probe().then(function (pr) {
      var L = list(k, pr.gpu);
      if (!L.length) throw new Error("The bigger model does not work on this device (it needs the graphics chip, and its methods failed or gave unusable output). Please use the small one.");
      var st = getSt(k), i = st.ok != null ? st.ok : (st.next || 0), errs = st.errs || [];
      if (i >= L.length) { i = 0; errs = []; }
      var a = L[i];
      return tryOne(a, k, progress).then(function (g) { curIdx = i; setSt(k, { ok: i }); logAdd(k, "method " + (i + 1) + " of " + L.length + " " + label(a) + ": loaded"); return g; }, function (e) {
        errs.push((i + 1) + ". " + label(a) + ": " + String(e && (e.stack || e.message) || e).slice(0, 400)); logAdd(k, "method " + (i + 1) + " of " + L.length + " " + label(a) + ": failed to start, " + String(e && e.message || e).slice(0, 150));
        if (st.ok != null) { setSt(k, {}); } // a method that used to work stopped working: start over from the top next time
        else if (i + 1 < L.length) {
          setSt(k, { next: i + 1, errs: errs, reason: "Method " + (i + 1) + " could not start (" + plain(e).slice(0, 120) + ")." });
          try { sessionStorage.setItem("wd-smart-auto", k); } catch (x) {}
          location.reload();
          return new Promise(function () {});
        } else setSt(k, k === "big" ? { dead: 1 } : {});
        var er = new Error(plain(errs.join(" ")));
        er.raw = errs.join("\n"); er.path = "tried " + (i + 1) + " of " + L.length + " methods";
        throw er;
      });
    }).then(function (g) { cur = g; key = k; return g; }, function (e) { loading = null; throw e; });
    loading = { k: k, p: p };
    return p;
  }
  // The current method produces garbage (for example "!!!!" from fp16 on some graphics drivers). Skip it and reload on the next one.
  function markBad(k) {
    return probe().then(function (pr) {
      var L = list(k, pr.gpu), st = getSt(k), errs = st.errs || [], bad = L[curIdx], nx = curIdx + 1;
      errs.push((curIdx + 1) + ". " + label(bad) + ": loaded but produced unusable output");
      logAdd(k, "method " + (curIdx + 1) + " of " + L.length + " " + label(bad) + ": unusable output (garbage characters)");
      while (nx < L.length && L[nx].dt === bad.dt && L[nx].lib === bad.lib) nx++;
      if (nx >= L.length) { setSt(k, k === "big" ? { dead: 1 } : {}); logAdd(k, "no method left that gives usable output"); return false; }
      setSt(k, { next: nx, errs: errs, reason: "Method " + (curIdx + 1) + " (" + bad.dt + ") gave unusable output." });
      try { sessionStorage.setItem("wd-smart-auto", k); } catch (x) {}
      return true;
    });
  }
  function methodNow(k) { return probe().then(function (pr) { var L = list(k, pr.gpu); return L[curIdx] ? label(L[curIdx]) + ", method " + (curIdx + 1) + " of " + L.length : ""; }); }
  // turn the runtime's cryptic errors into plain words
  function plain(e) {
    var m = String(e && e.message ? e.message : e || "");
    if (/^The bigger model/.test(m)) return m;
    if (/abort|alloc|out of memory|RangeError/i.test(m)) return "the AI engine in your browser stopped while starting. The downloaded files are kept, so a retry will not download again. See the technical details below.";
    if (/fetch|network|load failed|Failed to/i.test(m)) return "a file could not be downloaded. Check your connection and try again. Files already downloaded are kept.";
    return m || "unknown error";
  }
  function tidy(out) {
    var t = String(out || "").trim().replace(/^(here(?:'s| is)[^\n:]*:)\s*/i, "").replace(/^["\u201c]+|["\u201d]+$/g, "");
    t = t.replace(/[ \t]*[\u2014\u2013][ \t]*|[ \t]*--+[ \t]*/g, ", ").replace(/,\s*,/g, ",");
    return t.trim();
  }
  // Sampling settings. Attempt 0 is the normal one. Later attempts are stricter, because a loop usually means the model got stuck.
  function genOpts(attempt, maxTokens) {
    var o = { max_new_tokens: maxTokens, repetition_penalty: [1.18, 1.3, 1.4][attempt] || 1.4, no_repeat_ngram_size: 6 };
    if (attempt === 0) { o.do_sample = false; }
    else { o.do_sample = true; o.temperature = [0.7, 0.5][attempt - 1] || 0.5; o.top_p = 0.9; o.top_k = 40; }
    return o;
  }
  function run(system, user, maxTokens, attempt, onTok) {
    return Promise.resolve(cur).then(function (g) {
      if (!g) throw new Error("Smart mode is not turned on.");
      var o = genOpts(attempt || 0, maxTokens);
      if (onTok && TL && TL.TextStreamer && g.tokenizer) o.streamer = new TL.TextStreamer(g.tokenizer, { skip_prompt: true, skip_special_tokens: true, callback_function: function () {}, token_callback_function: function () { onTok(); } });
      return g([{ role: "system", content: system }, { role: "user", content: user }], o);
    }).then(function (o) { var m = o[0].generated_text; return Array.isArray(m) ? m[m.length - 1].content : m; });
  }
  function words(s) { return (String(s).toLowerCase().match(/[a-z']+/g) || []); }
  function stem(w) { return w.replace(/'s$/, "").replace(/(ing|ed|es|s|ly)$/, "").slice(0, 5); }
  // Quality guard. Returns "" when the output looks fine, otherwise a short reason.
  function check(inp, out, mode) {
    var iw = words(inp), ow = words(out);
    var letters = (out.match(/[A-Za-z]/g) || []).length, nonsp = out.replace(/\s/g, "").length;
    if (nonsp && (letters / nonsp < 0.6 || /(.)\1{7,}/.test(out.replace(/\s/g, "")) && !/\.{8}/.test(out))) return "garbage";
    if (ow.length < 3) return "empty";
    if (/[\u4e00-\u9fff]/.test(out)) return "wrong language";
    // the same 1 to 5 word group repeated 3 or more times in a row
    for (var n = 1; n <= 5; n++) for (var i = 0; i + n * 3 <= ow.length; i++) {
      var g = ow.slice(i, i + n).join(" "), r = 1;
      while (i + (r + 1) * n <= ow.length && ow.slice(i + r * n, i + (r + 1) * n).join(" ") === g) r++;
      if (r >= 3 && !(n === 1 && /^(no|very|so|and|ha|oh|never)$/.test(g))) return "loop";
    }
    var uniq = {}; ow.forEach(function (w) { uniq[w] = 1; });
    if (ow.length >= 16 && Object.keys(uniq).length / ow.length < 0.4) return "loop";
    // a sentence or a 6 word group that shows up more than once and was not in the original
    var seen = {}, src = words(inp).join(" ");
    for (var j = 0; j + 6 <= ow.length; j++) { var q = ow.slice(j, j + 6).join(" "); if (seen[q] && src.indexOf(q) < 0) return "loop"; seen[q] = 1; }
    var ratio = ow.length / Math.max(1, iw.length);
    if (iw.length >= 8 && ratio > 1.6) return "too long";
    if (iw.length >= 8 && ratio < 0.4) return "too short";
    // meaning: how many of the original content words (or close forms) are still there
    var keep = {}; ow.forEach(function (w) { keep[stem(w)] = 1; });
    var cw = iw.filter(function (w) { return w.length >= 5; });
    if (cw.length >= 4) { var hit = 0; cw.forEach(function (w) { if (keep[stem(w)]) hit++; }); if (hit / cw.length < (mode === "literary" ? 0.3 : 0.4)) return "lost meaning"; }
    if (/^(sure|certainly|here is|here's|rewritten|as an ai)/i.test(out.trim())) return "chatter";
    return "";
  }
  // split into sentences, then group 2 or 3 at a time (blank lines stay as they are)
  function chunks(text) {
    var out = [];
    text.split(/(\n{2,})/).forEach(function (part) {
      if (/^\n{2,}$/.test(part) || !part.trim()) { out.push({ sep: part }); return; }
      var s = part.replace(/\s+/g, " ").trim().match(/[^.!?]+(?:\.{3}|[.!?])+["')\u201d]*\s*|[^.!?]+$/g) || [part], i = 0;
      while (i < s.length) {
        var take = 0, len = 0;
        while (i + take < s.length && take < 3 && (take < 1 || len + s[i + take].length < 420)) { len += s[i + take].length; take++; }
        if (s.length - (i + take) === 1 && take < 3) take++; // never leave a single sentence alone at the end
        out.push({ text: s.slice(i, i + take).join("").trim() }); i += take;
      }
    });
    return out;
  }
  function pause() { return new Promise(function (r) { setTimeout(r, 0); }); }
  // mode: "human" or "literary". onProgress({chunk, chunks, attempt, tokens, tps, note})
  function rewrite(text, mode, onProgress) {
    var cs = chunks(text), total = cs.filter(function (c) { return c.text; }).length, n = 0, res = [], t0 = Date.now(), tokens = 0, bad = 0, notes = [], chain = Promise.resolve();
    function report(extra) { if (!onProgress) return; var sec = (Date.now() - t0) / 1000; var o = { chunk: n, chunks: total, tokens: tokens, tps: sec > 0.5 ? tokens / sec : 0, secs: sec }; for (var k in extra) o[k] = extra[k]; onProgress(o); }
    cs.forEach(function (c) {
      chain = chain.then(function () {
        if (!c.text) { res.push(c.sep); return; }
        n++;
        var maxTok = Math.min(400, Math.ceil(words(c.text).length * 1.3 * 1.4) + 12); // about 1.3 x the input, in tokens (a word is about 1.4 tokens)
        function attempt(a) {
          report({ attempt: a + 1 });
          return run(PROMPTS[mode], c.text, maxTok, a, function () { tokens++; if (tokens % 4 === 0) report({ attempt: a + 1 }); }).then(tidy).then(function (o) {
            var why = check(c.text, o, mode);
            if (!why) return o;
            if (why === "garbage" || why === "empty") bad++;
            notes.push("chunk " + n + " attempt " + (a + 1) + ": " + why + " | " + o.slice(0, 120).replace(/\s+/g, " "));
            if (a >= 2) { var e = new Error("This attempt failed, try again. The model did not give a good rewrite."); e.raw = notes.join("\n"); e.guard = true; e.garbage = bad >= 3; throw e; }
            return pause().then(function () { return attempt(a + 1); });
          });
        }
        return attempt(0).then(function (o) { res.push(o); });
      });
    });
    return chain.then(function () {
      var out = ""; cs.forEach(function (c, i) { out += c.text ? res[i] + (cs[i + 1] && cs[i + 1].text ? " " : "") : c.sep; });
      report({ done: true }); return out.trim();
    });
  }
  // short meanings for new words. These come from the small model and can be wrong.
  function define(words) {
    var out = {}, chain = Promise.resolve();
    words.forEach(function (w) { chain = chain.then(function () { return run("Give the plain meaning of the English word in 8 words or fewer. Reply with only the meaning.", w, 24, 1).then(function (d) { out[w] = tidy(d).replace(/^["']|["']$/g, ""); }, function () { out[w] = ""; }); }); });
    return chain.then(function () { return out; });
  }
  // flag anything the rewrite added that the original did not have
  function addedFacts(before, after) {
    var nums = function (s) { return s.match(/\d[\d.,]*/g) || []; }, bn = nums(before), warn = [];
    nums(after).forEach(function (n) { if (bn.indexOf(n) < 0 && warn.indexOf(n) < 0) warn.push(n); });
    var caps = function (s) { var o = []; var re = /[a-z,;]\s([A-Z][a-z]+)/g, m; while ((m = re.exec(s))) o.push(m[1]); return o; }, bl = before.toLowerCase();
    caps(after).forEach(function (n) { if (bl.indexOf(n.toLowerCase()) < 0 && warn.indexOf(n) < 0) warn.push(n); });
    return warn;
  }
  function newWords(before, after) {
    var seen = {}; (before.toLowerCase().match(/[a-z']+/g) || []).forEach(function (w) { seen[w] = 1; });
    var out = []; (after.toLowerCase().match(/[a-z']+/g) || []).forEach(function (w) { var b = w.replace(/(ing|ed|es|s|ly)$/, ""); if (w.length >= 6 && !seen[w] && !seen[b] && out.indexOf(w) < 0) out.push(w); });
    return out.slice(0, 8);
  }
  window.DeskSmart = { bigDead: function () { return !!getSt("big").dead; }, resetBig: function () { setSt("big", {}); }, log: logOf,  markBad: markBad, methodNow: methodNow, check: check, chunks: chunks, genOpts: genOpts, MODELS: MODELS, support: support, probe: probe, info: info, load: load, rewrite: rewrite, define: define, addedFacts: addedFacts, newWords: newWords, ready: function () { return !!cur; }, current: function () { return key; } };
})();
