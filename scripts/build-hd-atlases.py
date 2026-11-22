"""Read sprite-sheet alpha and write Phaser frame metadata; source pixels stay unchanged."""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'public/assets/hd-office'
PROPS = ['desk', 'tree', 'plant', 'cabinet', 'copier', 'partyDoor', 'exitDoor', 'ladder',
         'coffee', 'laptop', 'euro', 'ticket', 'vacation', 'promotion', 'cooler', 'floor']
POSES = ['idle', 'walk1', 'walk2', 'jump', 'crouch', 'slide', 'climb', 'hurt']
ENEMIES = ['talker1', 'talker2', 'party1', 'party2', 'clienthell', 'bug', 'confcall',
           'minute', 'teamsicon', 'paper', 'panettone', 'flame']


def atlas(image_name, names, cols, rows, preserve_cells=False, output=None):
    image = Image.open(ROOT / image_name).convert('RGBA')
    width, height = image.size
    alpha = image.getchannel('A')
    frames = {}
    for index, name in enumerate(names):
        col, row = index % cols, index // cols
        left, top = round(col * width / cols), round(row * height / rows)
        right, bottom = round((col + 1) * width / cols), round((row + 1) * height / rows)
        # The cast sheet has intentionally uneven row heights. Grid boundaries would
        # include the next character's hair under a pair of feet.
        if ROOT.name == 'hd-worlds' and image_name == 'cast.png':
            top, bottom = [0, 315, 604, 910, height][row:row + 2]
        if ROOT.name == 'hd-worlds' and image_name == 'inventory.png':
            top, bottom = [0, 310, 560, 842, 1080, height][row:row + 2]
        if ROOT.name == 'hd-worlds' and image_name == 'food.png':
            top, bottom = [0, 320, 655, height][row:row + 2]
        cell_alpha = alpha.crop((left, top, right, bottom))
        # New painted sheets include soft light spill. Anchor to the solid object, not its halo.
        threshold = 250 if ROOT.name == 'hd-worlds' and name != 'palm' else 90
        box = cell_alpha.point(lambda a: 255 if a >= threshold else 0).getbbox()
        if not box:
            raise ValueError(f'Empty atlas cell: {image_name}/{name}')
        x0, y0 = max(0, box[0] - 2), max(0, box[1] - 2)
        x1, y1 = min(right - left, box[2] + 2), min(bottom - top, box[3] + 2)
        if name == 'floor':
            x0 += 20
            x1 -= 20
        fw, fh = x1 - x0, y1 - y0
        frames[name] = {
            'frame': {'x': left + x0, 'y': top + y0, 'w': fw, 'h': fh},
            'rotated': False,
            'trimmed': preserve_cells,
            'spriteSourceSize': {'x': x0 if preserve_cells else 0, 'y': y0 if preserve_cells else 0, 'w': fw, 'h': fh},
            'sourceSize': {'w': right - left if preserve_cells else fw, 'h': bottom - top if preserve_cells else fh},
        }
    result = {'frames': frames, 'meta': {'app': 'Corporate Odyssey', 'image': image_name,
              'format': 'RGBA8888', 'size': {'w': width, 'h': height}, 'scale': '1'}}
    target = ROOT / (output or Path(image_name).with_suffix('.json').name)
    target.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(f'{target.name}: {len(frames)} frames, {width}x{height}')


atlas('office-props.png', PROPS, 4, 4)
atlas('characters.png', [f'{c}_{p}' for c in ['man', 'woman'] for p in POSES], 4, 4, True)
for char, file in [('man', 'jack-motion.png'), ('woman', 'wendy-motion.png')]:
    names = [f'{char}_run{i}' for i in range(1, 9)] + [f'{char}_{p}' for p in ['idle1', 'idle2', 'attack', 'land']]
    atlas(file, names, 4, 3, True)
atlas('office-enemies-cutout.png', ENEMIES, 4, 3, False, 'office-enemies.json')
atlas('spumante.png', ['puddle'], 1, 1)
atlas('office-dressing.png', ['workstation', 'paperClutter', 'noticeboard', 'foregroundDesk', 'foregroundPlant', 'wallDesk'], 3, 2)

ROOT = ROOT.parent / 'hd-summer'
atlas('summer-props.png', ['aircon', 'fan', 'planeTicket', 'exitDoor', 'mail', 'urgentMail', 'coldColleague', 'suitcase'], 4, 2)

ROOT = ROOT.parent / 'hd-worlds'
atlas('furniture.png', ['table', 'counter', 'checkout', 'bench', 'postit', 'marble', 'metal', 'wood', 'gate', 'conveyor', 'microphone', 'tray'], 4, 3)
atlas('cast.png', ['cook', 'chief', 'thief', 'activist', 'dog', 'penguin', 'penguinSlide', 'snowman', 'jellyfish', 'shark', 'yesman', 'strategist', 'secretary', 'bossClient', 'bossCEO', 'hostess'], 4, 4)
atlas('nature.png', ['sand', 'ice', 'seabed', 'coral', 'cactus', 'icicle', 'palm', 'market', 'hut', 'reefBar', 'office', 'mine', 'camel', 'snowmobile', 'submarine', 'seahorse'], 4, 4)
atlas('objects.png', ['pasta', 'steak', 'salad', 'cake', 'passport', 'boardingPass', 'briefcase', 'bag', 'revenue', 'cost', 'ship', 'paperPlane', 'trophy', 'phone', 'coffee', 'folder'], 4, 4)
atlas('equipment.png', ['plane', 'train', 'taxi', 'motorcycle', 'sled', 'skis', 'fins', 'mask', 'parasol', 'wings', 'router', 'safe', 'calendar', 'heater', 'valve', 'golf'], 4, 4)
atlas('clients.png', ['pharaoh', 'penguinCEO', 'mermaid', 'mummy', 'bear', 'octopus', 'egyptian', 'winter', 'diver', 'orb', 'fish', 'crab'], 4, 3)
atlas('inventory.png', ['laptop','charger','phone','earbuds','antacid','toothpaste','toothbrush','underwear','banana','umbrella','toiletpaper','notebook','sleepmask','idcard','adapter','cards','suit','dates','swimsuit','jacket'], 4, 5)
atlas('executive-props.png', ['throne','helicopter','rotor','ac','antenna','screen','safe','reception','library','scales','sofa','parachute'], 4, 3)
atlas('passengers.png', ['man','woman','chatty','reader','music','sleeper','hostess','phone'], 4, 2)
atlas('food.png', ['panino','cannelloni','dunette','cioccolata','grappa','fonduta','sushi','alghe','paranza','wetSign','disco','toilet'], 4, 3)
atlas('ceo-motion.png', ['stand','run','attack'], 3, 1)
atlas('swim.png', [f'{c}_swim{i}' for c in ['man','woman'] for i in range(1,5)], 4, 2, True)
