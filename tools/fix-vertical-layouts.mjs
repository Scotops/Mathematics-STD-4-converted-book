import fs from "node:fs";

function replaceOnce(file, before, after, label) {
  const source = fs.readFileSync(file, "utf8");
  const occurrences = source.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${file}: expected one ${label}, found ${occurrences}`);
  }
  fs.writeFileSync(file, source.replace(before, after), "utf8");
}

function multiplicationStack(id, top, bottom, width = "w-24") {
  return `<div aria-hidden="true" class="${width} font-mono text-[1.05rem] leading-[1.35] text-gray-900"><div class="px-1 text-right">${top}</div><div class="flex items-center justify-between border-b border-gray-900 px-1 pb-0.5"><span>&#xd7;</span><span>${bottom}</span></div><div class="mt-5 border-b border-gray-700"></div></div><span data-id="${id}" class="sr-only">${top} multiplied by ${bottom}. Dash.</span>`;
}

const page31Problems = [
  ["pg031_n0020", "22", "14"],
  ["pg031_n0024", "28", "18"],
  ["pg031_n0028", "11", "13"],
  ["pg031_n0032", "24", "19"],
  ["pg031_n0036", "23", "13"],
  ["pg031_n0040", "33", "33"],
  ["pg031_n0044", "40", "18"],
  ["pg031_n0048", "42", "12"],
  ["pg031_n0052", "32", "11"],
  ["pg031_n0056", "41", "22"],
  ["pg031_n0060", "97", "88"],
  ["pg031_n0064", "85", "60"],
];

for (const file of ["pg031_sec001.html", "pg031_sec002.html"]) {
  for (const [id, top, bottom] of page31Problems) {
    replaceOnce(
      file,
      `<div><span data-id="${id}">${top} &#xd7; ${bottom} =</span></div>`,
      multiplicationStack(id, top, bottom),
      id,
    );
  }
}

const page32Problems = [
  ["pg032_n0003", "47", "18"],
  ["pg032_n0006", "53", "34"],
  ["pg032_n0009", "65", "24"],
];

for (const [id, top, bottom] of page32Problems) {
  replaceOnce(
    "pg032_sec001.html",
    `<span aria-hidden="true">${top} &#xd7; ${bottom} = <span class="inline-block w-14 border-b border-current align-middle"></span></span><span data-id="${id}" class="sr-only">${top} multiplied by ${bottom} equals dash.</span>`,
    multiplicationStack(id, top, bottom),
    id,
  );
}

const page40Problems = [
  ["pg040_n0051", "7492", "11"],
  ["pg040_n0053", "165", "21"],
  ["pg040_n0055", "414", "232"],
  ["pg040_n0057", "79276", "15"],
];

for (const file of ["pg040_sec001.html", "pg040_sec002.html"]) {
  for (const [id, top, bottom] of page40Problems) {
    replaceOnce(
      file,
      `<span class="whitespace-pre-line text-[1rem] leading-tight block" data-id="${id}">${top} &#xd7; ${bottom}</span>`,
      multiplicationStack(id, top, bottom, "w-28"),
      id,
    );
  }
}

replaceOnce(
  "pg083_sec001.html",
  '<div class="mt-3 grid grid-cols-4 gap-x-4 text-[2.05rem] leading-[1.15] max-sm:text-[1.3rem]">',
  '<div class="mt-3 grid grid-cols-4 gap-x-4 whitespace-nowrap text-[2.05rem] leading-[1.15] max-sm:text-[1.3rem]">',
  "question 9 no-wrap grid",
);

const page170Problems = [
  ["pg170_n0026", "950", "7"],
  ["pg170_n0029", "75", "13"],
  ["pg170_n0032", "560", "12"],
  ["pg170_n0035", "105", "85"],
  ["pg170_n0038", "200", "25"],
  ["pg170_n0041", "960", "14"],
];

for (const file of ["pg170_sec001.html", "pg170_sec002.html"]) {
  for (const [id, top, bottom] of page170Problems) {
    replaceOnce(
      file,
      `<span data-id="${id}">shs ${top} &#xd7; ${bottom} = <span class="answer-line" role="img" aria-label="dash"></span></span>`,
      `<span aria-hidden="true" class="ml-2 inline-flex w-28 flex-col align-top font-mono text-[1.05rem] leading-[1.35] text-gray-900"><span class="px-1 text-right">shs ${top}</span><span class="flex items-center justify-between border-b border-gray-900 px-1 pb-0.5"><span>&#xd7;</span><span>${bottom}</span></span><span class="mt-5 border-b border-gray-700"></span></span><span data-id="${id}" class="sr-only">${top} shillings multiplied by ${bottom}. Dash.</span>`,
      id,
    );
  }
}

replaceOnce(
  "pg174_sec001.html",
  '<pre data-id="pg174_n0012" class="overflow-x-auto rounded-md bg-gray-50 p-3 text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">\\text{shs }800 &#xd7; 15 = 12000</pre>',
  '<div class="my-2 ml-8"><div aria-hidden="true" class="w-32 font-mono text-[1.05rem] leading-[1.35] text-gray-900"><div class="px-1 text-right">shs 800</div><div class="flex items-center justify-between border-b border-gray-900 px-1 pb-0.5"><span>&#xd7;</span><span>15</span></div><div class="px-1 text-right">4000</div><div class="flex items-center justify-between border-b border-gray-900 px-1"><span>+</span><span>800</span></div><div class="px-1 text-right">shs 12000</div></div><span data-id="pg174_n0012" class="sr-only">800 shillings multiplied by 15 equals 12,000 shillings.</span></div>',
  "pg174_n0012",
);

console.log("Updated vertical arithmetic layouts on pages 31, 32, 40, 83, 170, and 174.");
