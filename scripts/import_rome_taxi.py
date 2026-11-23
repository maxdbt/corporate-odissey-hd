"""Build the offline Rome taxi map from an Overpass JSON extract.

python scripts/import_rome_taxi.py path/to/overpass.json
python scripts/import_rome_taxi.py --download
The exported derived database is distributed under ODbL 1.0.
"""
import argparse
import json
import math
import re
import pathlib
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

BBOX = [41.8145, 12.4465, 41.8455, 12.4915]  # EUR plus a connecting margin, including the entire lake
SCALE = 4  # game units per metre; narrow streets are widened for playability
QUERY = '[out:json][timeout:45];(way[highway]({b});node[highway=traffic_signals]({b});way[building]({b});way[leisure~"^(park|garden)$"]({b});way[landuse=grass]({b});way[natural=water]({b});relation[natural=water]({b}););out geom;'.replace('{b}', ','.join(map(str, BBOX)))
ENDPOINT = 'https://overpass-api.de/api/interpreter'
DEST = pathlib.Path(__file__).resolve().parents[1] / 'public/assets/hd-city-taxi/rome-map.json'
USER_AGENT = 'CorporateOdyssey-RomeMap/1.0 (+https://github.com/maxdbt/corporate-odissey-hd)'


def add_civilta_geometry(source):
    """The landmark is a multipolygon: its untagged outer ways aren't in way[building]."""
    if any(e['type'] == 'relation' and e['id'] == 1559654 for e in source['elements']):
        return
    url = 'https://api.openstreetmap.org/api/0.6/map?bbox=12.4639,41.8358,12.4663,41.8378'
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        root = ET.fromstring(response.read())
    nodes = {int(e.attrib['id']): {'lat': float(e.attrib['lat']), 'lon': float(e.attrib['lon'])} for e in root.findall('node')}
    ways = {int(e.attrib['id']): [int(n.attrib['ref']) for n in e.findall('nd')] for e in root.findall('way')}
    existing = {(e['type'], e['id']) for e in source['elements']}
    for element in root.findall('way') + root.findall('relation'):
        tags = {t.attrib['k']: t.attrib['v'] for t in element.findall('tag')}
        identity = element.tag, int(element.attrib['id'])
        if 'building' not in tags or identity in existing:
            continue
        feature = {'type': identity[0], 'id': identity[1], 'tags': tags}
        if element.tag == 'way':
            feature['nodes'] = ways[identity[1]]
            feature['geometry'] = [nodes[n] for n in feature['nodes']]
        else:
            feature['members'] = [{'type': m.attrib['type'], 'ref': int(m.attrib['ref']), 'role': m.attrib['role'],
                                   'geometry': [nodes[n] for n in ways.get(int(m.attrib['ref']), [])]}
                                  for m in element.findall('member') if m.attrib['type'] == 'way']
        source['elements'].append(feature)
    source['supplementalSource'] = url


def convert(source):
    south, west, north, east = BBOX
    longitude_metres = 111320 * math.cos(math.radians((north + south) / 2))
    width = round((east - west) * longitude_metres * SCALE)
    height = round((north - south) * 111320 * SCALE)

    def project(p):
        return [round((p['lon'] - west) * longitude_metres * SCALE, 1),
                round((north - p['lat']) * 111320 * SCALE, 1)]

    nodes, roads, buildings, parks, rivers, water, signals = {}, [], [], [], [], [], []
    def building_details(tags):
        result = {}
        for key, field in [('height', 'height'), ('building:levels', 'levels')]:
            value = tags.get(key, '').strip()
            if re.fullmatch(r'\d+(?:\.\d+)?\s*(?:m)?', value):
                result[field] = float(value.rstrip('m').strip())
        for key, field in [('roof:shape', 'roofShape'), ('roof:colour', 'roofColour'),
                           ('building:colour', 'colour'), ('building:material', 'material')]:
            if key in tags:
                result[field] = tags[key]
        return result
    drive_types = {'primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street', 'service', 'primary_link', 'secondary_link', 'tertiary_link', 'trunk', 'trunk_link'}
    walk_types = drive_types | {'pedestrian', 'footway', 'path', 'steps'}
    widths = {'primary': 100, 'secondary': 88, 'tertiary': 76, 'residential': 62,
              'unclassified': 68, 'living_street': 58, 'service': 54, 'pedestrian': 54,
              'footway': 14, 'path': 16, 'steps': 18, 'primary_link': 64, 'secondary_link': 62, 'tertiary_link': 60, 'trunk': 100, 'trunk_link': 64}
    def rings(element, role='outer'):
        if element['type'] == 'way':
            return [list(map(project, element.get('geometry', [])))]
        chains = [list(map(project, member['geometry'])) for member in element.get('members', [])
                  if member.get('role') == role and member.get('geometry')]
        result = []
        while chains:
            chain = chains.pop()
            while chain[0] != chain[-1]:
                match = next(((i, False) if other[0] == chain[-1] else (i, True)
                              for i, other in enumerate(chains) if chain[-1] in (other[0], other[-1])), None)
                if match is None:
                    break
                index, reverse = match
                other = chains.pop(index)
                chain.extend((other[::-1] if reverse else other)[1:])
            if len(chain) >= 4 and chain[0] == chain[-1]:
                result.append(chain)
        return result

    for element in source['elements']:
        tags = element.get('tags', {})
        geometry = element.get('geometry', [])
        if element['type'] == 'node':
            if tags.get('highway') == 'traffic_signals':
                signals.append({'id': element['id'], 'point': project(element),
                                'direction': tags.get('traffic_signals:direction', tags.get('direction', 'both'))})
            continue
        if element['type'] == 'relation':
            for polygon in rings(element):
                feature = {'id': element['id'], 'sourceType': 'relation', 'name': tags.get('official_name', tags.get('name', '')), 'points': polygon}
                if tags.get('natural') == 'water':
                    water.append(feature)
                elif tags.get('building'):
                    buildings.append({**feature, 'kind': tags['building'], 'holes': rings(element, 'inner'), **building_details(tags)})
                elif tags.get('leisure') == 'park':
                    parks.append(feature)
            continue
        if len(geometry) < 2 or any('lat' not in p for p in geometry):
            continue
        points = list(map(project, geometry))
        if not any(-60 <= p[0] <= width+60 and -60 <= p[1] <= height+60 for p in points):
            continue
        kind = tags.get('highway')
        if kind in walk_types and tags.get('area') != 'yes' and tags.get('access') not in ('private', 'no'):
            drive = kind in drive_types and tags.get('motor_vehicle', tags.get('vehicle')) not in ('no', 'private')
            # Indoor corridors, underground paths and private courtyards are not part of the street game.
            if tags.get('indoor') == 'yes' or tags.get('tunnel') == 'yes':
                continue
            refs = element.get('nodes', [])
            if len(refs) != len(points):
                continue
            runs, run = [], []
            for node_id, p in zip(refs, points):
                if 30 < p[0] < width-30 and 30 < p[1] < height-30:
                    nodes[str(node_id)] = p
                    run.append(node_id)
                else:
                    if len(run) > 1:
                        runs.append(run)
                    run = []
            if len(run) > 1:
                runs.append(run)
            for run in runs:
                roads.append({'id': element['id'], 'name': tags.get('name', ''), 'kind': kind,
                              'drive': drive, 'walk': tags.get('foot') != 'no', 'crossing': tags.get('footway') == 'crossing',
                              'oneway': -1 if tags.get('oneway') == '-1' else 1 if tags.get('oneway') in ('yes', '1', 'true') or tags.get('junction') == 'roundabout' else 0,
                              'width': widths[kind], 'nodes': run})
        if tags.get('building') and len(points) >= 4 and points[0] == points[-1]:
            buildings.append({'id': element['id'], 'name': tags.get('name', ''), 'kind': tags['building'], 'points': points, **building_details(tags)})
        if (tags.get('leisure') in ('park', 'garden') or tags.get('landuse') == 'grass') and len(points) >= 4:
            parks.append({'id': element['id'], 'points': points})
        if tags.get('natural') == 'water' and len(points) >= 4 and points[0] == points[-1]:
            water.append({'id': element['id'], 'name': tags.get('name', ''), 'points': points})
        if tags.get('waterway') == 'river':
            rivers.append({'id': element['id'], 'name': tags.get('name', ''), 'points': points})

    landmarks = []
    for name, osm_id, art in [('Palazzo della Civiltà Italiana', 1559654, 'civilta'),
                              ('Palazzo dei Congressi', 23959054, 'congressi'),
                              ('Palazzo dello Sport', 23528669, 'sport'),
                              ('Laghetto dell’EUR', 2426553, None)]:
        features = [f for f in buildings + water if f['id'] == osm_id]
        points = [p for f in features for p in f['points']]
        if not points:
            raise ValueError('Missing landmark geometry: ' + name)
        center = [(min(p[0] for p in points)+max(p[0] for p in points))/2,
                  (min(p[1] for p in points)+max(p[1] for p in points))/2]
        landmarks.append({'name': name, 'point': center, 'osmId': osm_id, 'art': art})
        for f in features:
            if art:
                f['art'] = art
    return {'meta': {'title': 'Roma · EUR', 'source': 'OpenStreetMap',
                    'attribution': '© OpenStreetMap contributors', 'license': 'ODbL-1.0',
                    'licenseUrl': 'https://opendatacommons.org/licenses/odbl/1-0/',
                    'copyrightUrl': 'https://www.openstreetmap.org/copyright',
                    'endpoint': ENDPOINT, 'query': QUERY, 'bbox': BBOX,
                    'snapshot': source.get('osm3s', {}).get('timestamp_osm_base'),
                    'supplementalSource': source.get('supplementalSource'),
                    'signalsSource': source.get('signalsSource'),
                    'unitsPerMetre': SCALE, 'width': width, 'height': height,
                    'adaptation': 'Projected local geometry; road widths enlarged. Arcade driving, not real-world navigation or access advice.'},
            'nodes': nodes, 'roads': roads, 'buildings': buildings, 'parks': parks, 'rivers': rivers, 'water': water,
            'landmarks': landmarks, 'signals': signals}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', nargs='?')
    parser.add_argument('--download', action='store_true')
    args = parser.parse_args()
    if args.download:
        request = urllib.request.Request(ENDPOINT + '?' + urllib.parse.urlencode({'data': QUERY}), headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(request, timeout=55) as response:
            source = json.load(response)
    elif args.source:
        source = json.loads(pathlib.Path(args.source).read_text(encoding='utf-8'))
    else:
        parser.error('Pass an Overpass JSON file or --download.')
    if source.get('remark'):
        raise RuntimeError(source['remark'])
    add_civilta_geometry(source)
    result = convert(source)
    DEST.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(DEST), 'bytes': DEST.stat().st_size, 'size': [result['meta']['width'], result['meta']['height']],
                      **{k: len(result[k]) for k in ('roads', 'buildings', 'nodes')}}))
