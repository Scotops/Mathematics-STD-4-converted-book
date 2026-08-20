import fs from 'node:fs/promises';

const descriptions = {
  pg004_im001_crop1: 'Handwritten signature of Dr Aneth A. Komba.',
  pg005_im001: 'QR code for the online learning resource.',
  pg007_im001: 'A pupil resting one hand under his chin while thinking.',
  pg027_im001: 'A pupil resting one hand under his chin while thinking.',
  pg035_im001: 'Lattice multiplication diagram for 3,125 multiplied by 12. Across the top are 3, 1, 2 and 5. Down the side are 1 and 2. The diagonal sums give 37,500.',
  pg067_im001: 'A balance scale with masses labelled 5 kilograms, 2 kilograms, 500 grams and 250 grams.',
  pg085_im001: 'A pupil resting one hand under his chin while thinking.',
  pg098_im001: 'Square A.',
  pg098_im002: 'Rectangle B, made from two equal squares placed side by side.',
  pg100_im001: 'A pupil resting one hand under his chin while thinking.',
  pg113_im001: 'A pupil resting one hand under his chin while thinking.',
  pg126_im001: 'A circle divided by a vertical diameter and diagonal radii into fractional sectors.',
  pg128_im001: 'A rectangle divided into five equal parts, with two parts shaded to show two over five.',
  pg129_im001: 'A fraction bar showing tenths within two over five.',
  pg132_im006_crop1: 'A bar divided into ten equal parts. The first one over ten is shaded and labelled zero point one.',
  pg132_im002_crop_v1_crop1: 'A fraction bar showing zero point five plus zero point three equals zero point eight.',
  pg134_im001: 'A hundred-square grid with one square shaded to show one over one hundred.',
  pg139_im001: 'A decimal bar showing zero point five plus zero point three equals zero point eight.',
  pg139_im004_seg002_v1_crop_v1: 'A number line from zero to one. A jump of zero point five followed by zero point three lands at zero point eight.',
  pg151_im005_crop1: 'A pupil resting one hand under his chin while thinking.',
  pg163_im001: 'Clock face for part a. The minute hand points to 3, and the hour hand points between 11 and 12.',
  pg163_im002: 'Second clock face for part a. The minute hand points to 6, and the hour hand points just past 12.',
  pg163_im003: 'Clock face for part b. The minute hand points to 9, and the hour hand points between 7 and 8.',
  pg163_im004: 'Second clock face for part b. The minute hand points to 3, and the hour hand points just past 9.',
  pg163_im005: 'Clock face for part c. The minute hand points to 9, and the hour hand points between 11 and 12.',
  pg163_im006: 'Second clock face for part c. The minute hand points to 9, and the hour hand points between 12 and 1.',
  pg169_im005_crop1: 'A pupil resting one hand under his chin while thinking.',
};

const textPath = 'content/i18n/en-US/texts.json';
const audioPath = 'content/i18n/en-US/audios.json';
const texts = JSON.parse(await fs.readFile(textPath, 'utf8'));
const audios = JSON.parse(await fs.readFile(audioPath, 'utf8'));

for (const [id, description] of Object.entries(descriptions)) {
  texts[id] = description;
  audios[id] = `${id}.mp3?v=43`;
}

await fs.writeFile(textPath, `${JSON.stringify(texts, null, 2)}\n`);
await fs.writeFile(audioPath, `${JSON.stringify(audios, null, 2)}\n`);
console.log(`Backfilled ${Object.keys(descriptions).length} image descriptions.`);
