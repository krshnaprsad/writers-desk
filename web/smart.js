/* Smart mode: optional small language models that run inside the browser. Nothing is sent anywhere.
   The library comes from a free CDN and the model files from huggingface.co. Both are free and need no account or key. */
(function () {
  var LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/transformers.min.js";
  // sizes in MB are from the model files on huggingface.co: q4f16 runs on the graphics chip (WebGPU), q8 runs on the processor
  var MODELS = {
    small: { id: "onnx-community/Qwen2.5-0.5B-Instruct", name: "Small (0.5B)", gpuMB: 483, cpuMB: 512, ram: "about 1.5 GB free" },
    big: { id: "onnx-community/Qwen2.5-1.5B-Instruct", name: "Bigger (1.5B)", gpuMB: 1221, cpuMB: 1578, ram: "about 3 GB free" }
  };
  var cur = null, key = null, loading = null;
  var NO_FACTS = " Keep every fact, name, number and the meaning. Keep the voice, tense and point of view. Do not add new facts, events or names. Keep about the same length. Never use long dashes. Reply with only the rewritten text, no title and no explanation.";
  var PROMPTS = {
    human: "You are an editor. Rewrite the user's text so it sounds natural and human, like a thoughtful person wrote it. Use plain, everyday words and a relaxed rhythm." + NO_FACTS,
    literary: "You are an editor. Rewrite the user's text in a more literary style, with richer and more precise vocabulary and a careful rhythm." + NO_FACTS
  };
  function support() {
    if (typeof WebAssembly !== "object") return { ok: false, why: "This browser cannot run it (no WebAssembly). Try a recent Chrome or Edge." };
    return { ok: true, gpu: !!navigator.gpu };
  }
  function load(k, progress) {
    if (cur && key === k) return Promise.resolve(cur);
    if (loading && loading.k === k) return loading.p;
    var s = support(); if (!s.ok) return Promise.reject(new Error(s.why));
    var p = import(LIB).then(function (T) {
      var files = {}, m = MODELS[k];
      function cb(x) {
        if (x.status === "progress" && x.total) { files[x.file] = { l: x.loaded, t: x.total }; var l = 0, t = 0; for (var f in files) { l += files[f].l; t += files[f].t; } progress(t ? l / t : 0, Math.round(l / 1e6) + " of " + Math.round(t / 1e6) + " MB"); }
        else if (x.status === "ready") progress(1, "Starting up...");
      }
      var tryGpu = s.gpu;
      return (tryGpu ? T.pipeline("text-generation", m.id, { device: "webgpu", dtype: "q4f16", progress_callback: cb }) : Promise.reject()).catch(function () {
        files = {}; return T.pipeline("text-generation", m.id, { device: "wasm", dtype: "q8", progress_callback: cb });
      });
    }).then(function (g) { cur = g; key = k; return g; }, function (e) { loading = null; throw e; });
    loading = { k: k, p: p };
    return p;
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
  window.DeskSmart = { MODELS: MODELS, support: support, load: load, rewrite: rewrite, define: define, addedFacts: addedFacts, newWords: newWords, ready: function () { return !!cur; }, current: function () { return key; } };
})();
