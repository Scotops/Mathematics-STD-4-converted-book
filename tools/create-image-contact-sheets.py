from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def main() -> None:
    parser = argparse.ArgumentParser(description="Create contact sheets from images.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--columns", type=int, default=4)
    parser.add_argument("--rows", type=int, default=2)
    parser.add_argument("--cell-width", type=int, default=420)
    args = parser.parse_args()

    files = sorted(args.input.glob("pg*.png"))
    args.output.mkdir(parents=True, exist_ok=True)
    per_sheet = args.columns * args.rows
    gap = 12
    label_height = 30
    font = ImageFont.load_default(size=18)

    for sheet_index in range(math.ceil(len(files) / per_sheet)):
        batch = files[sheet_index * per_sheet : (sheet_index + 1) * per_sheet]
        thumbs: list[tuple[Path, Image.Image]] = []
        for path in batch:
            image = Image.open(path).convert("RGB")
            height = round(image.height * args.cell_width / image.width)
            image = image.resize((args.cell_width, height), Image.Resampling.LANCZOS)
            thumbs.append((path, image))

        cell_height = max(image.height for _, image in thumbs) + label_height
        sheet = Image.new(
            "RGB",
            (
                args.columns * args.cell_width + (args.columns + 1) * gap,
                args.rows * cell_height + (args.rows + 1) * gap,
            ),
            "#d9d9d9",
        )
        draw = ImageDraw.Draw(sheet)
        for position, (path, image) in enumerate(thumbs):
            column = position % args.columns
            row = position // args.columns
            x = gap + column * (args.cell_width + gap)
            y = gap + row * (cell_height + gap)
            draw.rectangle(
                (x, y, x + args.cell_width, y + label_height), fill="#202020"
            )
            draw.text((x + 10, y + 5), path.stem, fill="white", font=font)
            sheet.paste(image, (x, y + label_height))

        output = args.output / f"adt-{sheet_index + 1:02d}.jpg"
        sheet.save(output, quality=90, optimize=True)
        print(output)


if __name__ == "__main__":
    main()
