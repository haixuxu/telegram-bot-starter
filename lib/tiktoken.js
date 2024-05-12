// src/tokenizer.ts
const get_encoding = require("tiktoken").get_encoding;

var tokenizer = get_encoding("cl100k_base");
function encode(input) {
  return tokenizer.encode(input);
}

function getTokenCount(text) {
  text = text.replace(/<\|endoftext\|>/g, "");
  return encode(text).length;
}

exports.getTokenCount = getTokenCount;
