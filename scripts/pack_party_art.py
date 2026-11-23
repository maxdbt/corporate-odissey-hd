"""Encode unchanged generated PNG art as WebP and measure animation anchors.

No drawing, recoloring or resampling: the original PNGs stay intact. The measured
anchors are metadata used by the renderer to keep feet and body aligned.
Requires Pillow; run from any directory with `python scripts/pack_party_art.py`.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from statistics import median
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'public/assets/hd-party-escape'


def encode(path):
    image = Image.open(path)
    image.save(path.with_suffix('.webp'), 'WEBP', quality=90, method=4)
    if path.stem in ('room', 'props'):
        return path.stem, None
    assert image.size == (1536, 1024), (path.name, image.size)
    assert image.mode == 'RGBA', path.name
    frames, anchors = {}, []
    alpha = image.getchannel('A')
    for index in range(12):
        x, y = index % 6 * 256, index // 6 * 512
        mask = alpha.crop((x, y, x + 256, y + 512)).point(lambda a: 255 if a > 80 else 0)
        left, top, right, bottom = mask.getbbox()
        assert bottom - top > 250 and right - left > 45, (path.name, index)
        # Waist-band center is less affected by outstretched arms than a full bbox.
        centers = []
        for row in range(top + int((bottom-top)*.44), top + int((bottom-top)*.62), 3):
            xs = [col for col in range(left, right) if mask.getpixel((col, row))]
            if xs:
                centers.append(median(xs))
        anchors.append({'x': round(median(centers)/256, 5), 'y': round(bottom/512, 5),
                        'scale': round(512/(bottom-top), 5)})
        frames['walk'+str(index+1)] = {'frame': {'x': x, 'y': y, 'w': 256, 'h': 512},
            'rotated': False, 'trimmed': False, 'spriteSourceSize': {'x': 0, 'y': 0, 'w': 256, 'h': 512},
            'sourceSize': {'w': 256, 'h': 512}}
    atlas = {'frames': frames, 'meta': {'image': path.stem+'.webp', 'size': {'w': 1536, 'h': 1024}, 'scale': '1'}}
    path.with_suffix('.json').write_text(json.dumps(atlas, separators=(',', ':')), encoding='utf-8')
    return path.stem, anchors


if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(encode, sorted(ROOT.glob('*.png'))))
    anchors = {name: value for name, value in results if value}
    (ROOT / 'motion.json').write_text(json.dumps(anchors, separators=(',', ':')), encoding='utf-8')
    total = sum(path.stat().st_size for path in ROOT.glob('*.webp'))
    print(f'{len(anchors)} actor sheets; {len(anchors)*12} anchored poses; {total/1024/1024:.2f} MiB WebP')
