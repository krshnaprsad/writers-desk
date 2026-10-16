/* Word and phrase lists. Each entry is a regular expression source, matched case-insensitively on whole words.
   These are my opinion of what reads as tired or padded, not rules. Add or remove freely, see CONTRIBUTING.md. */
(function (root, factory) { if (typeof module === "object" && module.exports) module.exports = factory(); else root.DeskLists = factory(); })(typeof self !== "undefined" ? self : this, function () {
  return {
    cliche: [
      "at the end of the day", "in the nick of time", "a stark reminder", "little did (he|she|they|i|we) know", "dark and stormy night",
      "heart (skipped|missed) a beat", "heart (pounded|hammered|raced) in (my|his|her|their) chest", "let out a breath (i|he|she|they) (didn't|did not) know",
      "(sent|ran|running) shivers? (down|up)", "time (stood|seemed to stand) still", "like a ton of bricks", "cold sweat", "blood (ran|turned) cold",
      "eyes (widened|went wide)", "jaw dropped", "butterflies in (my|his|her|their) stomach", "as if on cue", "the calm before the storm", "tip of the iceberg",
      "only time will tell", "needless to say", "it goes without saying", "last but not least", "in today's fast[- ]paced world", "whirlwind of emotions",
      "deafening silence", "piercing (blue|green) eyes", "for what (felt|seemed) like (hours|forever|an eternity)", "dead of night", "think outside the box",
      "game[- ]changer", "at a loss for words", "sigh of relief", "hung (heavy )?in the air", "thick with tension", "couldn't help but", "could not help but",
      "a smile tugged at", "(barely|just) above a whisper", "the weight of the world", "a mix of (fear|excitement|emotions)", "every fibre of (my|his|her) being",
      "every fiber of (my|his|her) being", "in the blink of an eye", "silence (was )?deafening", "a chill ran", "gut feeling", "against all odds", "once in a lifetime"
    ],
    ai: [
      "delve[sd]?", "delving", "tapestry", "testament", "in the realm of", "ever[- ]evolving", "navigat(e|es|ing) the complexit(y|ies)", "it'?s important to note", "it is worth noting",
      "it'?s worth noting", "moreover", "furthermore", "in conclusion", "crucial", "pivotal", "vibrant", "seamless(ly)?", "leverag(e|es|ed|ing)", "elevat(e|es|ed|ing)",
      "embark(s|ed|ing)?", "foster(s|ed|ing)?", "robust", "holistic", "nuanced", "underscor(e|es|ed|ing)", "intricate", "multifaceted", "beacon", "myriad", "bustling",
      "symphony of", "a dance of", "whispers of", "shrouded in", "kaleidoscope", "unwavering", "resonates?", "unravel(s|led|ing)?", "a testament to"
    ],
    filler: ["very", "really", "just", "quite", "rather", "actually", "basically", "literally", "suddenly", "somehow", "simply", "totally", "completely", "definitely", "extremely", "incredibly", "absolutely"]
  };
});
