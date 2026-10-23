"""Build smaller webfonts from preserved TTF originals (fonttools + brotli)."""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
# Cyrillic, Latin, Greek, combining marks, punctuation, currency and symbols.
# Keep whole ranges rather than only today's copy, so new text remains supported.
RANGES = ((0, 0x052F), (0x1E00, 0x1FFF), (0x2000, 0x27FF),
          (0x2DE0, 0x2DFF), (0xA640, 0xA69F), (0xFEFF, 0xFEFF), (0xFFFD, 0xFFFD))
UNICODES = {code for start, end in RANGES for code in range(start, end + 1)}
for original in sorted((ROOT / 'assets/fonts').rglob('*.ttf')):
    output = original.with_suffix('.woff2')
    if not output.exists():
        continue
    before = output.stat().st_size
    font = TTFont(original)
    expected = set(font.getBestCmap()) & UNICODES
    options = subset.Options()
    options.layout_features = ['*']
    options.flavor = 'woff2'
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=UNICODES)
    worker.subset(font)
    font.flavor = 'woff2'
    font.save(output)
    with TTFont(output) as check:
        assert expected <= set(check.getBestCmap()), original
    print(f'{output.name}: {before:,} → {output.stat().st_size:,} bytes')
