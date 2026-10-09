"""Builds the résumé fonts in public/fonts from the Google Fonts sources.

Every family is downloaded from github.com/google/fonts (all OFL 1.1),
instanced to static 400/600/700 faces (italics where the family has them), and
subset to Latin (with Latin Extended-A/B, which carries Lithuanian), Cyrillic,
and general punctuation. The preview and the PDF export render from these
exact files, so a glyph missing here is missing everywhere.

Usage: python scripts/build-fonts.py <cache-dir>
Requires: pip install fonttools brotli
"""

import io
import os
import sys
import urllib.request

from fontTools import subset
from fontTools.otlLib.optimize.gpos import compact
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RAW = "https://raw.githubusercontent.com/google/fonts/main/"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "fonts")

UNICODES = (
    list(range(0x20, 0x250))  # Basic Latin to Latin Extended-B
    + list(range(0x300, 0x370))  # combining marks
    + list(range(0x400, 0x530))  # Cyrillic and its supplement
    + list(range(0x2000, 0x2070))  # general punctuation
    + [0x20AC, 0x20BD, 0x2116, 0x2122, 0x2190, 0x2192, 0x2212]
)

# family prefix -> (roman source, italic source or None, pinned axes)
VARIABLE = {
    "Inter": ("ofl/inter/Inter[opsz,wght].ttf", "ofl/inter/Inter-Italic[opsz,wght].ttf", {"opsz": 14}),
    "Roboto": ("ofl/roboto/Roboto[wdth,wght].ttf", "ofl/roboto/Roboto-Italic[wdth,wght].ttf", {"wdth": 100}),
    "OpenSans": ("ofl/opensans/OpenSans[wdth,wght].ttf", "ofl/opensans/OpenSans-Italic[wdth,wght].ttf", {"wdth": 100}),
    "SourceSans3": ("ofl/sourcesans3/SourceSans3[wght].ttf", "ofl/sourcesans3/SourceSans3-Italic[wght].ttf", {}),
    "Lora": ("ofl/lora/Lora[wght].ttf", "ofl/lora/Lora-Italic[wght].ttf", {}),
    "EBGaramond": ("ofl/ebgaramond/EBGaramond[wght].ttf", "ofl/ebgaramond/EBGaramond-Italic[wght].ttf", {}),
    "SourceSerif4": ("ofl/sourceserif4/SourceSerif4[opsz,wght].ttf", "ofl/sourceserif4/SourceSerif4-Italic[opsz,wght].ttf", {"opsz": 12}),
    "Merriweather": ("ofl/merriweather/Merriweather[opsz,wdth,wght].ttf", "ofl/merriweather/Merriweather-Italic[opsz,wdth,wght].ttf", {"opsz": 12, "wdth": 100}),
    "JetBrainsMono": ("ofl/jetbrainsmono/JetBrainsMono[wght].ttf", "ofl/jetbrainsmono/JetBrainsMono-Italic[wght].ttf", {}),
    "Arimo": ("ofl/arimo/Arimo[wght].ttf", "ofl/arimo/Arimo-Italic[wght].ttf", {}),
    "GeistMono": ("ofl/geistmono/GeistMono[wght].ttf", "ofl/geistmono/GeistMono-Italic[wght].ttf", {}),
}

# family prefix -> {output variant: source path}
STATIC = {
    "IBMPlexMono": {
        variant: f"ofl/ibmplexmono/IBMPlexMono-{variant}.ttf"
        for variant in ["Regular", "SemiBold", "Bold", "Italic", "BoldItalic"]
    },
    "Tinos": {
        variant: f"ofl/tinos/Tinos-{variant}.ttf"
        for variant in ["Regular", "Bold", "Italic", "BoldItalic"]
    },
    "Carlito": {
        variant: f"ofl/carlito/Carlito-{variant}.ttf"
        for variant in ["Regular", "Bold", "Italic", "BoldItalic"]
    },
    "Cousine": {
        variant: f"ofl/cousine/Cousine-{variant}.ttf"
        for variant in ["Regular", "Bold", "Italic", "BoldItalic"]
    },
}

ROMAN = {"Regular": 400, "SemiBold": 600, "Bold": 700}
ITALIC = {"Italic": 400, "BoldItalic": 700}


def fetch(cache: str, path: str) -> bytes:
    local = os.path.join(cache, path.replace("/", "__"))
    if not os.path.exists(local):
        url = RAW + urllib.request.quote(path)
        print("download", url)
        with urllib.request.urlopen(url) as response:
            data = response.read()
        with open(local, "wb") as file:
            file.write(data)
    with open(local, "rb") as file:
        return file.read()


def shrink(font: TTFont) -> TTFont:
    options = subset.Options()
    # Kerning, ligatures, and mark positioning; the stylistic sets and
    # alternates a résumé never uses would only add weight.
    options.layout_features = [
        "kern", "liga", "clig", "calt", "ccmp", "locl", "mark", "mkmk",
    ]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.glyph_names = False
    # Hinting only matters for low-resolution screens; dropping it keeps the
    # files a fraction of their size.
    options.hinting = False
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(font)
    if "GPOS" in font:
        # Instancing leaves kerning uncompacted; this is what keeps a family
        # like Merriweather from weighing most of a megabyte per face.
        compact(font, 5)
    return font


def write(font: TTFont, name: str) -> None:
    path = os.path.join(OUT, name)
    font.save(path)
    print("wrote", name, os.path.getsize(path))


STYLE_NAMES = {
    "Regular": ("Regular", 400, False),
    "SemiBold": ("SemiBold", 600, False),
    "Bold": ("Bold", 700, False),
    "Italic": ("Italic", 400, True),
    "BoldItalic": ("Bold Italic", 700, True),
}


def rename(font: TTFont, family: str, variant: str) -> TTFont:
    """Names an instanced face after its weight, so a PDF that embeds it says
    "Inter-Bold" (which the importer reads as bold), not the variable font's
    default "Inter-Regular"."""
    style, weight, italic = STYLE_NAMES[variant]
    names = font["name"]
    postscript = f"{family}-{variant}"
    for record_id, value in (
        (1, family if variant in ("Regular", "Bold", "Italic", "BoldItalic") else f"{family} {style}"),
        (2, style if variant in ("Regular", "Bold", "Italic", "BoldItalic") else "Regular"),
        (3, f"{postscript};kast"),
        (4, f"{family} {style}"),
        (6, postscript),
        (16, family),
        (17, style),
    ):
        names.setName(value, record_id, 3, 1, 0x409)
        names.setName(value, record_id, 1, 0, 0)
    font["OS/2"].usWeightClass = weight
    selection = font["OS/2"].fsSelection & ~0b1100001
    if weight >= 700:
        selection |= 0b100000
    if italic:
        selection |= 0b1
    if weight < 700 and not italic:
        selection |= 0b1000000
    font["OS/2"].fsSelection = selection
    return font


def build_variable(cache: str) -> None:
    for prefix, (roman, italic, pins) in VARIABLE.items():
        sources = [(roman, ROMAN)] + ([(italic, ITALIC)] if italic else [])
        for source, variants in sources:
            data = fetch(cache, source)
            for variant, weight in variants.items():
                font = TTFont(io.BytesIO(data))
                axes = {tag: value for tag, value in pins.items()}
                axes["wght"] = weight
                static = instancer.instantiateVariableFont(font, axes)
                write(rename(shrink(static), prefix, variant), f"{prefix}-{variant}.ttf")


def build_static(cache: str) -> None:
    for prefix, variants in STATIC.items():
        for variant, source in variants.items():
            font = TTFont(io.BytesIO(fetch(cache, source)))
            write(shrink(font), f"{prefix}-{variant}.ttf")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    cache = sys.argv[1]
    os.makedirs(cache, exist_ok=True)
    build_variable(cache)
    build_static(cache)


if __name__ == "__main__":
    main()
