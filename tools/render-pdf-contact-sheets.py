from __future__ import annotations

import argparse
import math
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageDraw, ImageFont


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render a PDF into numbered contact sheets for visual auditing."
    )
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--columns", type=int, default=4)
    parser.add_argument("--rows", type=int, default=2)
    parser.add_argument("--page-width", type=int, default=420)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    pdf = pdfium.PdfDocument(str(args.pdf))
    per_sheet = args.columns * args.rows
    label_height = 30
    gap = 12
    font = ImageFont.load_default(size=18)

    for sheet_index in range(math.ceil(len(pdf) / per_sheet)):
        rendered: list[tuple[int, Image.Image]] = []
        for page_index in range(
            sheet_index * per_sheet,
            min((sheet_index + 1) * per_sheet, len(pdf)),
        ):
            page = pdf[page_index]
            source_width, source_height = page.get_size()
            scale = args.page_width / source_width
            image = page.render(scale=scale).to_pil().convert("RGB")
            rendered.append((page_index + 1, image))

        cell_width = args.page_width
        cell_height = max(image.height for _, image in rendered) + label_height
        sheet = Image.new(
            "RGB",
            (
                args.columns * cell_width + (args.columns + 1) * gap,
                args.rows * cell_height + (args.rows + 1) * gap,
            ),
            "#d9d9d9",
        )
        draw = ImageDraw.Draw(sheet)
        for position, (page_number, image) in enumerate(rendered):
            column = position % args.columns
            row = position // args.columns
            x = gap + column * (cell_width + gap)
            y = gap + row * (cell_height + gap)
            draw.rectangle(
                (x, y, x + cell_width, y + label_height), fill="#202020"
            )
            draw.text(
                (x + 10, y + 5),
                f"PDF page {page_number:03d}",
                fill="white",
                font=font,
            )
            sheet.paste(image, (x, y + label_height))

        first_page = sheet_index * per_sheet + 1
        last_page = min((sheet_index + 1) * per_sheet, len(pdf))
        output = args.output / f"pages-{first_page:03d}-{last_page:03d}.jpg"
        sheet.save(output, quality=90, optimize=True)
        print(output)


if __name__ == "__main__":
    main()
