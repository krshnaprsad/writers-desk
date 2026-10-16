# Third party code and data

## nspell

`nspell.js` in this folder is nspell 2.1.5 by Titus Wormer, bundled and minified (no code changes). It does the spelling check.
https://github.com/wooorm/nspell

Licensed under the MIT licence. Copyright (c) 2016 Titus Wormer.

## English word list

`data/dict-*.js` hold the en_US hunspell dictionary from the `dictionary-en` package 4.0.0, which is built from SCOWL (Spell Checker Oriented Word Lists) by Kevin Atkinson, The package is licensed (MIT AND BSD). The full licence text is at https://github.com/wooorm/dictionaries/blob/main/dictionaries/en/license
http://wordlist.sourceforge.net

## Smart mode (loaded on demand, not stored in this repo)

transformers.js by Hugging Face (Apache 2.0) is loaded from jsDelivr. The models Qwen2.5-0.5B-Instruct and Qwen2.5-1.5B-Instruct by Alibaba Cloud (Apache 2.0), in ONNX form by the onnx-community, are loaded from huggingface.co.
