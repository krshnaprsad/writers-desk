/* Built-in alternatives. This is a small hand-made list, not an AI, so it only knows the words and phrases written here.
   Each rule is [regular expression source for the whole match, [alternatives]]. Edit freely, see CONTRIBUTING.md. */
(function (root, factory) { if (typeof module === "object" && module.exports) module.exports = factory(); else root.DeskSwaps = factory(); })(typeof self !== "undefined" ? self : this, function () {
  return {
    // tired phrases: "" means the phrase can simply go
    cliche: [
      ["at the end of the day", ["in the end", "ultimately", ""]],
      ["in the nick of time", ["just in time", "barely in time"]],
      ["a stark reminder", ["a reminder", "a clear reminder"]],
      ["little did (he|she|they|i|we) know", [""]],
      ["dark and stormy night", ["stormy night", "rough night", "wet, windy night"]],
      ["heart (skipped|missed) a beat", ["my heart jumped", "I stopped", "I froze"]],
      ["time (stood|seemed to stand) still", ["everything slowed", "the moment stretched"]],
      ["like a ton of bricks", ["hard", "all at once"]],
      ["eyes (widened|went wide)", ["stared", "looked up fast"]],
      ["jaw dropped", ["stared", "was stunned"]],
      ["the calm before the storm", ["a quiet before it all began", "the lull"]],
      ["tip of the iceberg", ["only a small part", "just the start"]],
      ["only time will tell", ["we will see", "no one knows yet"]],
      ["needless to say", [""]],
      ["it goes without saying", [""]],
      ["last but not least", ["finally", "and one more thing"]],
      ["whirlwind of emotions", ["mix of feelings", "rush of feeling"]],
      ["deafening silence", ["heavy silence", "long silence", "silence"]],
      ["silence (was )?deafening", ["silence was total", "nobody spoke"]],
      ["game[- ]changer", ["big shift", "turning point"]],
      ["at a loss for words", ["speechless", "stuck for words"]],
      ["sigh of relief", ["relief", "easy breath"]],
      ["hung (heavy )?in the air", ["lingered", "stayed", "filled the room"]],
      ["thick with tension", ["tense", "strained"]],
      ["couldn't help but", ["had to", "could not stop myself and"]],
      ["could not help but", ["had to", "could not stop myself and"]],
      ["(barely|just) above a whisper", ["very quiet", "low", "soft"]],
      ["in the blink of an eye", ["in a second", "suddenly"]],
      ["gut feeling", ["hunch", "sense"]],
      ["against all odds", ["despite the odds", "somehow"]],
      ["once in a lifetime", ["rare", "one of a kind"]],
      ["cold sweat", ["sweat", "a sweat"]],
      ["dead of night", ["middle of the night", "late at night"]],
      ["think outside the box", ["try something new", "look for another way"]]
    ],
    // padded words and phrases
    ai: [
      ["delve[sd]?", ["dig", "look", "go"]], ["delving", ["digging", "looking"]], ["tapestry", ["mix", "pattern"]], ["testament", ["proof", "sign"]], ["a testament to", ["proof of", "a sign of"]],
      ["in the realm of", ["in", "within"]], ["ever[- ]evolving", ["changing", "shifting"]], ["it'?s important to note", [""]], ["it is worth noting", [""]], ["it'?s worth noting", [""]],
      ["moreover", ["also", "and"]], ["furthermore", ["also", "and"]], ["in conclusion", ["to sum up", "finally"]], ["crucial", ["key", "vital"]], ["pivotal", ["key", "central"]],
      ["vibrant", ["lively", "bright"]], ["seamless", ["smooth", "easy"]], ["seamlessly", ["smoothly", "easily"]], ["leverage", ["use"]], ["leverages", ["uses"]], ["leveraged", ["used"]], ["leveraging", ["using"]],
      ["elevate", ["raise", "lift"]], ["elevates", ["raises", "lifts"]], ["elevated", ["raised", "lifted"]], ["elevating", ["raising", "lifting"]], ["embark", ["begin", "start"]], ["embarks", ["begins", "starts"]],
      ["embarked", ["began", "started"]], ["embarking", ["beginning", "starting"]], ["foster", ["build", "grow"]], ["fosters", ["builds", "grows"]], ["fostered", ["built", "grew"]], ["fostering", ["building", "growing"]],
      ["robust", ["strong", "solid"]], ["holistic", ["whole", "complete"]], ["nuanced", ["subtle", "detailed"]], ["underscore", ["show", "stress"]], ["underscores", ["shows", "stresses"]],
      ["underscored", ["showed", "stressed"]], ["underscoring", ["showing", "stressing"]], ["intricate", ["detailed", "complex"]], ["multifaceted", ["complex", "many sided"]], ["beacon", ["signal", "light"]],
      ["myriad", ["many", "countless"]], ["bustling", ["busy", "crowded"]], ["symphony of", ["mix of", "chorus of"]], ["a dance of", ["a mix of", "an interplay of"]], ["whispers of", ["hints of", "traces of"]],
      ["shrouded in", ["wrapped in", "hidden in"]], ["kaleidoscope", ["mix", "spread"]], ["unwavering", ["steady", "firm"]], ["resonates?", ["lands", "rings true"]], ["unravel", ["come apart", "unwind"]],
      ["unravels", ["comes apart", "unwinds"]], ["unravelled", ["came apart", "unwound"]], ["unraveling", ["coming apart", "unwinding"]], ["unraveled", ["came apart", "unwound"]]
    ],
    // filler words: the first choice is to remove the word
    filler: { simply: ["just"], quite: ["fairly"], rather: ["fairly"], actually: ["in fact"], suddenly: ["at once"], somehow: ["in some way"], totally: ["fully"], completely: ["fully"], definitely: ["surely"], extremely: ["deeply"], incredibly: ["deeply"], absolutely: ["fully"], basically: ["mostly"], literally: ["truly"], really: ["truly"], very: ["so"], just: ["only"] },
    // close repeats: base words and a few regular alternatives. Irregular forms are listed in IRREG.
    thes: {
      walk: ["stroll", "stride", "wander"], run: ["race", "dash"], look: ["glance", "stare", "peer"], see: ["spot", "notice"], say: ["state", "mention"], tell: ["inform", "explain"], ask: ["question", "wonder"],
      move: ["shift", "step"], turn: ["twist", "spin"], open: ["unlock", "yank"], close: ["shut"], pull: ["drag", "tug"], push: ["shove", "press"], hold: ["grip", "clutch"], carry: ["bring", "haul"],
      watch: ["observe", "study"], smile: ["grin", "beam"], laugh: ["chuckle", "giggle"], cry: ["sob", "weep"], shout: ["yell", "call"], whisper: ["murmur", "mutter"], answer: ["reply", "respond"],
      think: ["suppose", "reckon"], feel: ["sense", "notice"], want: ["wish", "crave"], need: ["require", "lack"], love: ["adore", "treasure"], hate: ["dislike", "despise"], try: ["attempt", "test"],
      help: ["aid", "assist"], show: ["reveal", "display"], start: ["begin", "launch"], stop: ["halt", "end"], finish: ["complete", "end"], change: ["alter", "shift"], build: ["make", "create"],
      rain: ["downpour", "drizzle", "shower"], night: ["evening", "dark"], day: ["afternoon", "morning"], house: ["home", "place"], room: ["space", "chamber"], door: ["entrance", "doorway"], window: ["pane", "glass"],
      road: ["street", "path", "lane"], street: ["road", "lane"], city: ["town", "place"], town: ["village", "city"], water: ["liquid", "wet"], light: ["glow", "gleam"], dark: ["dim", "murky"],
      silence: ["quiet", "hush", "stillness"], voice: ["tone", "sound"], face: ["expression", "features"], hand: ["palm", "fist"], eye: ["gaze"], head: ["skull"], heart: ["chest"], mind: ["thoughts", "head"],
      story: ["tale", "account"], idea: ["thought", "notion", "plan"], plan: ["scheme", "idea"], problem: ["issue", "trouble"], reason: ["cause", "motive"], question: ["query", "puzzle"],
      people: ["folks", "crowd"], person: ["someone", "figure"], man: ["guy", "fellow"], woman: ["lady"], child: ["kid"], friend: ["pal", "mate", "companion"], family: ["relatives", "household"],
      big: ["large", "huge", "vast"], small: ["little", "tiny"], good: ["fine", "solid", "decent"], bad: ["poor", "awful"], great: ["fine", "superb"], nice: ["pleasant", "kind"], happy: ["glad", "pleased", "cheerful"],
      sad: ["unhappy", "down", "gloomy"], angry: ["furious", "cross", "mad"], tired: ["weary", "worn"], afraid: ["scared", "nervous"], quiet: ["still", "silent", "hushed"], loud: ["noisy", "booming"],
      quick: ["fast", "swift", "rapid"], slow: ["gradual", "steady"], old: ["aged", "worn", "ancient"], new: ["fresh", "recent"], long: ["lengthy", "extended"], hard: ["tough", "difficult"], easy: ["simple", "plain"],
      important: ["key", "vital"], different: ["distinct", "unlike"], strange: ["odd", "curious", "unusual"], beautiful: ["lovely", "striking"], cold: ["chilly", "icy"], hot: ["warm", "burning"],
      slowly: ["gradually", "gently"], quickly: ["swiftly", "fast"], softly: ["gently", "quietly"], carefully: ["gently", "with care"], finally: ["at last", "in the end"], always: ["forever", "every time"],
      thing: ["object", "item"], place: ["spot", "site"], time: ["moment", "while"], moment: ["instant", "second"], world: ["earth", "planet"], life: ["existence"], work: ["job", "labour"], word: ["term"]
    },
    irreg: { fell: ["dropped", "came down"], fall: ["drop", "come down"], falls: ["drops", "comes down"], falling: ["dropping", "coming down"], fallen: ["dropped"], ran: ["raced", "dashed"], saw: ["spotted", "noticed"], said: ["stated", "mentioned"], told: ["informed", "explained to"], felt: ["sensed", "noticed"], thought: ["supposed", "reckoned"], held: ["gripped", "clutched"], went: ["moved", "headed"], came: ["arrived", "appeared"], took: ["grabbed", "picked up"], gave: ["handed", "offered"], knew: ["understood"], made: ["created", "built"], began: ["started", "opened"], men: ["guys", "fellows"], women: ["ladies"], children: ["kids"], people: ["folks", "crowd"], eyes: ["gaze"], faces: ["expressions"], hands: ["palms", "fists"], wanted: ["wished", "craved"], needed: ["required", "lacked"], loved: ["adored", "treasured"], tried: ["attempted", "tested"], built: ["made", "created"], left: ["departed"], stood: ["waited", "rose"], sat: ["settled", "rested"], heard: ["caught", "noticed"], spoke: ["talked", "said"], broke: ["cracked", "snapped"], woke: ["stirred"], looked: ["glanced", "stared"], walked: ["strolled", "wandered"], turned: ["twisted", "spun"], smiled: ["grinned", "beamed"], laughed: ["chuckled", "giggled"] }
  };
});
