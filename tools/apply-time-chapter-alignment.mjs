import fs from "node:fs";

const replacements = new Map([
  [
    ["pg155_sec001.html"],
    [["grid grid-cols-2 gap-x-6 text-center text-xl leading-[1.6]", "grid time-number-grid grid-cols-2 gap-x-6 text-center text-xl leading-[1.6]"]],
  ],
  [
    ["pg157_sec001.html", "pg157_sec002.html"],
    [["grid grid-cols-2 gap-x-4 text-center text-base leading-relaxed", "grid time-number-grid grid-cols-2 gap-x-4 text-center text-base leading-relaxed"]],
  ],
  [
    ["pg158_sec001.html"],
    [
      ["grid grid-cols-2 gap-x-4 text-center text-lg leading-relaxed", "grid time-number-grid grid-cols-2 gap-x-4 text-center text-lg leading-relaxed"],
      ["grid grid-cols-2 gap-x-6 text-center border-b", "grid time-number-grid grid-cols-2 gap-x-6 text-center border-b"],
      ["grid grid-cols-2 gap-x-6 text-center\">6", "grid time-number-grid grid-cols-2 gap-x-6 text-center\">6"],
    ],
  ],
  [
    ["pg159_sec001.html", "pg159_sec002.html", "pg162_sec001.html"],
    [["grid grid-cols-2 gap-x-4 text-center font-mono text-lg leading-relaxed", "grid time-number-grid grid-cols-2 gap-x-4 text-center font-mono text-lg leading-relaxed"]],
  ],
  [
    ["pg161_sec001.html"],
    [
      ["grid grid-cols-[3rem_3rem] w-fit gap-x-4", "grid time-number-grid grid-cols-[3rem_3rem] w-fit gap-x-4"],
      ["grid grid-cols-[4rem_4rem] gap-x-6 text-left", "grid time-number-grid grid-cols-[4rem_4rem] gap-x-6 text-left"],
    ],
  ],
  [
    ["pg165_sec001.html"],
    [["grid grid-cols-2 border-b border-neutral-800 pb-1 text-center", "grid time-operator-row grid-cols-2 border-b border-neutral-800 pb-1 text-center"]],
  ],
  [
    ["pg167_sec001.html", "pg167_sec002.html"],
    [["grid grid-cols-2 gap-x-8 border-b-2 border-gray-500 pb-1", "grid time-operator-row grid-cols-2 gap-x-8 border-b-2 border-gray-500 pb-1"]],
  ],
  [
    ["pg154_sec001.html"],
    [["grid grid-cols-2 border-b-2 border-neutral-700 pb-2", "grid time-operator-row grid-cols-2 border-b-2 border-neutral-700 pb-2"]],
  ],
]);

for (const [files, pairs] of replacements) {
  for (const file of files) {
    let html = fs.readFileSync(file, "utf8");
    for (const [from, to] of pairs) {
      html = html.split(from).join(to);
    }
    html = html
      .replace(/\b(time-number-grid)(?:\s+\1)+/g, "$1")
      .replace(/\b(time-operator-row)(?:\s+\1)+/g, "$1");
    fs.writeFileSync(file, html);
  }
}

console.log("Applied shared time-column alignment classes.");

for (const file of fs.readdirSync(".").filter((name) => name.endsWith(".html"))) {
  let html = fs.readFileSync(file, "utf8");
  html = html
    .replaceAll("book-layout.css?v=1", "book-layout.css?v=2")
    .replaceAll("offline-preloader.js?v=87", "offline-preloader.js?v=89")
    .replaceAll("offline-preloader.js?v=88", "offline-preloader.js?v=89")
    .replaceAll("fraction-tts-guard.js?v=87", "fraction-tts-guard.js?v=89")
    .replaceAll("fraction-tts-guard.js?v=88", "fraction-tts-guard.js?v=89");
  fs.writeFileSync(file, html);
}

console.log("Bumped the shared layout and bundle cache versions.");
