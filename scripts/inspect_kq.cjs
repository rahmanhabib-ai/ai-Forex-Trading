const fs = require("fs");
const file = fs.readFileSync("assets/index-BmjL0JbS.js", "utf8");
const start = 2979226;
const nextFn = file.indexOf("function ", start + 50);
const kqCode = file.substring(start, nextFn);
const returnIdx = kqCode.indexOf("return r.jsxs(");

console.log("=== Part 6 (20000-26000) ===");
console.log(kqCode.substring(returnIdx + 20000, returnIdx + 26000));
