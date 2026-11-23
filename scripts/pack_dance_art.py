"""Build anchored Phaser metadata for the generated 3 x 4 dance sheets.

The PNG pixels are retained. Only frame bounds and fixed foot anchors are described.
Run: python scripts/pack_dance_art.py
"""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'public/assets/hd-dance'
cast = [('man', 'jack'), ('woman', 'wendy')]
cast += [(name, name) for name in ['capo', 'stagista', 'contabile', 'sistemista', 'marketing']]
sources = [(character + '_dance', root / f'{sheet}-dance.png') for character, sheet in cast]
sources += [('talker', root.parent / 'hd-worlds/talker-gestures.png')]
for prefix, path in sources:
    image = Image.open(path)
    assert image.mode == 'RGBA' and image.getchannel('A').getextrema() == (0, 255)
    width, height = image.size
    assert width % 3 == height % 4 == 0
    cw, ch = width // 3, height // 4
    frames = {}
    for i in range(12):
        x, y = (i % 3) * cw, (i // 3) * ch
        alpha = image.getchannel('A').crop((x, y, x + cw, y + ch))
        box = alpha.point(lambda a: 255 if a > 16 else 0).getbbox()
        assert box is not None
        left, top, right, bottom = box
        left, top, right, bottom = max(0, left - 2), max(0, top - 2), min(cw, right + 2), min(ch, bottom + 2)
        w, h = right - left, bottom - top
        frames[f'{prefix}{i + 1}'] = {
            'frame': {'x': x + left, 'y': y + top, 'w': w, 'h': h},
            'rotated': False, 'trimmed': True,
            'spriteSourceSize': {'x': left, 'y': ch - h, 'w': w, 'h': h},
            'sourceSize': {'w': cw, 'h': ch},
        }
    data = {'frames': frames, 'meta': {'image': path.name, 'size': {'w': width, 'h': height}, 'scale': '1'}}
    path.with_suffix('.json').write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    print(f'{path.stem}: 12 frames, fixed canvas {cw} x {ch}, feet at {ch}')
