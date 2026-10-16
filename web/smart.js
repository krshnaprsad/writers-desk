/* Smart mode: optional small language models that run inside the browser. Nothing is sent anywhere.
   The library comes from a free CDN and the model files from huggingface.co. Both are free and need no account or key. */
(function () {
  var LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/transformers.min.js";
  // sizes in MB are from the model files on huggingface.co: q4f16 runs on the graphics chip (WebGPU), q8 runs on the processor
  var MODELS = {
    small: { id: "onnx-community/Qwen2.5-0.5B-Instruct", name: "Small (0.5B)", gpuMB: 483, cpuMB: 512, ram: "about 1.5 GB free" },
    big: { id: "onnx-community/Qwen2.5-1.5B-Instruct", name: "Bigger (1.5B)", gpuMB: 1221, cpuMB: 1578, ram: "about 3 GB free" }
  };
  var cur = null, key = null, loading = null, trail = [];
  var NO_FACTS = " Keep every fact, name, number and the meaning. Keep the voice, tense and point of view. Do not add new facts, events or names. Keep about the same length. Never use long dashes. Reply with only the rewritten text, no title and no explanation.";
  var PROMPTS = {
    human: "You are an editor. Rewrite the user's text so it sounds natural and human, like a thoughtful person wrote it. Use plain, everyday words and a relaxed rhythm." + NO_FACTS,
    literary: "You are an editor. Rewrite the user's text in a more literary style, with richer and more precise vocabulary and a careful rhythm." + NO_FACTS
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
  function load(k, progress) {
    if (cur && key === k) return Promise.resolve(cur);
    if (loading && loading.k === k) return loading.p;
    var s = support(); if (!s.ok) return Promise.reject(new Error(s.why));
    trail = []; var p = probe().then(function (pr) { s.gpu = pr.gpu; trail.push("webgpu " + (pr.gpu ? "ok" : (pr.f16 === false ? "no f16" : "none"))); if (k === "big" && !pr.gpu) throw new Error("The bigger model needs the graphics chip (WebGPU), and this browser does not offer it. Please use the small one."); return import(LIB); }).then(function (T) {
      try { T.env.backends.onnx.wasm.numThreads = 1; T.env.backends.onnx.wasm.proxy = false; T.env.backends.onnx.webgpu.powerPreference = "high-performance"; } catch (e) {}
      var files = {}, m = MODELS[k];
      function cb(x) {
        if (x.status === "progress" && x.total) { files[x.file] = { l: x.loaded, t: x.total }; var l = 0, t = 0; for (var f in files) { l += files[f].l; t += files[f].t; } progress(t ? l / t : 0, Math.round(l / 1e6) + " of " + Math.round(t / 1e6) + " MB"); }
        else if (x.status === "ready") progress(1, "Starting up...");
      }
      var tryGpu = s.gpu;
      if (k === "big") return trail.push("try webgpu q4f16"), T.pipeline("text-generation", m.id, { device: "webgpu", dtype: "q4f16", progress_callback: cb });
      // Small model: graphics chip when it is fully supported, otherwise the processor (one thread, because this page cannot use more).
      return (tryGpu ? (trail.push("try webgpu q4f16"), T.pipeline("text-generation", m.id, { device: "webgpu", dtype: "q4f16", progress_callback: cb })) : Promise.reject()).catch(function (e0) {
        trail.push("webgpu failed: " + String(e0 && e0.message || e0).slice(0, 120));
        if (e0 && /abort/i.test(String(e0.message || e0))) throw e0;
        files = {}; trail.push("try wasm q8"); return T.pipeline("text-generation", m.id, { device: "wasm", dtype: "q8", progress_callback: cb });
      });
    }).then(function (g) { cur = g; key = k; return g; }, function (e) { loading = null; var er = new Error(plain(e)); er.raw = String(e && (e.stack || e.message) || e); er.path = trail.join(" > "); throw er; });
    loading = { k: k, p: p };
    return p;
  }
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
  function run(system, user, maxTokens) {
    return Promise.resolve(cur).then(function (g) {
      if (!g) throw new Error("Smart mode is not turned on.");
      return g([{ role: "system", content: system }, { role: "user", content: user }], { max_new_tokens: maxTokens, do_sample: false, repetition_penalty: 1.1 });
    }).then(function (o) { var m = o[0].generated_text; return Array.isArray(m) ? m[m.length - 1].content : m; });
  }
  // mode: "human" or "literary"
  function rewrite(text, mode) { return run(PROMPTS[mode], text, Math.min(500, Math.ceil(text.length / 2.5) + 40)).then(tidy); }
  // short meanings for new words. These come from the small model and can be wrong.
  function define(words) {
    var out = {}, chain = Promise.resolve();
    words.forEach(function (w) { chain = chain.then(function () { return run("Give the plain meaning of the English word in 8 words or fewer. Reply with only the meaning.", w, 24).then(function (d) { out[w] = tidy(d).replace(/^["']|["']$/g, ""); }, function () { out[w] = ""; }); }); });
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
  window.DeskSmart = { MODELS: MODELS, support: support, probe: probe, load: load, rewrite: rewrite, define: define, addedFacts: addedFacts, newWords: newWords, ready: function () { return !!cur; }, current: function () { return key; } };
})();
