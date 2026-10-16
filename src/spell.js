/* Spelling check. Wraps the nspell library and the English word list. US spelling is the base, and common British spellings are accepted too. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(); else root.DeskSpell = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // British to American patterns, so "colour" and "organise" are not marked wrong
  var GB = [[/our(s|ed|ing|ite|able|ful|less)?$/, "or$1"], [/(is)(e|es|ed|ing|ation|ations|er|ers)$/, "iz$2"], [/yse(s|d)?$/, "yze$1"], [/ysing$/, "yzing"], [/tre(s)?$/, "ter$1"], [/ogue(s)?$/, "og$1"],
    [/lled$/, "led"], [/lling$/, "ling"], [/ller(s)?$/, "ler$1"], [/ence(s)?$/, "ense$1"], [/ae(?=[a-z])/, "e"], [/oe(?=[a-z])/, "e"], [/ou(?=ld)/, "o"], [/(ph|v)?ice$/, "$1ise"], [/ogramme(s)?$/, "ogram$1"], [/ugh(s)?$/, "ug$1"]];
  function make(NSpell, aff, dic) {
    var sp = NSpell(aff, dic);
    function known(w) { return sp.correct(w) || sp.correct(w.toLowerCase()); }
    var EXTRA = { ok: 1, okay: 1, vs: 1, etc: 1, tv: 1, pm: 1, am: 1, wifi: 1, "wi-fi": 1, whatsapp: 1, youtube: 1, google: 1, iphone: 1, android: 1 };
    function correct(w) {
      w = String(w).replace(/\u2019/g, "'");
      if (EXTRA[w.toLowerCase()] || known(w)) return true;
      var plain = w.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (plain !== w && known(plain)) return true;
      var lw = w.toLowerCase();
      for (var i = 0; i < GB.length; i++) { var v = lw.replace(GB[i][0], GB[i][1]); if (v !== lw && known(v)) return true; }
      return false;
    }
    function suggest(w) {
      w = String(w).replace(/\u2019/g, "'");
      var out = sp.suggest(w) || [];
      if (/^[A-Z][a-z]/.test(w)) out = out.map(function (x) { return x.charAt(0).toUpperCase() + x.slice(1); });
      var key = function (x) { return x.toLowerCase().split("").sort().join(""); }, k = key(w);
      out = out.filter(function (x, i) { return out.indexOf(x) === i; });
      // same letters in another order (teh, recieve) is the likeliest typo, so list it first
      return out.filter(function (x) { return key(x) === k; }).concat(out.filter(function (x) { return key(x) !== k; }));
    }
    return { correct: correct, suggest: suggest };
  }
  return { make: make };
});
