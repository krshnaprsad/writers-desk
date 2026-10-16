// Tests the pure parts of web/smart.js (chunking and the quality guard). The model itself needs a browser.
var assert = require("assert"), fs = require("fs");
global.window = {}; global.navigator = {}; global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
eval(fs.readFileSync(__dirname + "/../web/smart.js", "utf8"));
var S = window.DeskSmart;
var src = "I wasn't dead before they began laying flowers on me. No, I felt myself slipping away slowly, buried under the weight of flowers brought by those who had once stood beside me, back when I was strong, when I was loud.";
var loop = "I'm trying to call out for help. But my help is smothering my help my help " + "my help ".repeat(60);
assert.strictEqual(S.check(src, loop, "human"), "loop");
assert.strictEqual(S.check(src, "no ".repeat(3) + "x y z", "human") !== "", true);
assert.strictEqual(S.check(src, src + " " + src + " " + src, "human") !== "", true, "far too long");
assert.strictEqual(S.check(src, "The weather was nice and we went to the market to buy some bread for lunch today.", "human"), "lost meaning");
var good = "I wasn't dead when they started laying flowers on me. I felt myself slowly slipping away, buried under the flowers of people who once stood next to me, back when I was strong and loud.";
assert.strictEqual(S.check(src, good, "human"), "");
var cs = S.chunks("One a. Two b. Three c. Four d. Five e.\n\nSix f. Seven g.").filter(function (c) { return c.text; });
assert.strictEqual(cs.length, 3); assert.strictEqual(cs[0].text, "One a. Two b. Three c."); assert.strictEqual(cs[1].text, "Four d. Five e.");
assert.ok(S.genOpts(0, 50).repetition_penalty >= 1.15 && S.genOpts(0, 50).no_repeat_ngram_size > 0);
assert.strictEqual(S.check(src, "The flowers" + "!".repeat(300), "human"), "garbage");
assert.strictEqual(S.check(src, "!".repeat(50), "human"), "garbage");
console.log("smart tests ok");
