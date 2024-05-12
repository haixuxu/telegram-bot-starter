var path = require("path");
var fs = require("fs");
const dateFormat = require("date-format");
var cwd = process.cwd();
var log_file = fs.createWriteStream(path.resolve(cwd, "debug.log"), {
  flags: "w",
});



const levelVal = {
  fatal: { piv: 1, colour: "\x1b[31m%s\x1b[0m" },
  error: { piv: 2, colour: "\x1b[31m%s\x1b[0m" },
  warn: { piv: 3, colour: "\x1b[33m%s\x1b[0m" },
  info: { piv: 4, colour: "\x1b[32m%s\x1b[0m" },
  log: { piv: 5, colour: "\x1b[37m%s\x1b[0m" },
  debug: { piv: 6, colour: "\x1b[35m%s\x1b[0m" },
};

function getCustomLogger(label, level) {
  const noop = () => void 0;
  const setPiv = levelVal[level].piv;
  function getter(target, key, handler) {
    if (levelVal[key].piv <= setPiv) {
      const colour = levelVal[key].colour;
      return function (msg) {
        let date = dateFormat("yyyy/MM/dd hh:mm:ss", new Date());
        var prefix = `${date} [${key[0].toUpperCase()}] ${label} `;
        console.log(colour, prefix, msg);
        log_file.write(prefix + msg + "\n");
      };
    } else {
      return noop;
    }
  }
  return new Proxy({}, { get: getter });
}

module.exports = getCustomLogger;
