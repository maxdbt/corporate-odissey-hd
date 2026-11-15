"""Build the five client-facing concept boards; run from any working directory."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from io import BytesIO
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/concepts/Corporate-Odyssey-proposte-grafiche.pdf'
pdfmetrics.registerFont(TTFont('Segoe', 'C:/Windows/Fonts/segoeui.ttf'))
pdfmetrics.registerFont(TTFont('SegoeBold', 'C:/Windows/Fonts/segoeuib.ttf'))
BOARDS = [
    ('01', 'Ufficio cinematografico', 'Personaggi illustrati e ambienti realistici, con luci natalizie calde.',
     'Materiali credibili, atmosfera accogliente e azione leggibile. Riferimento scelto per il primo stage.',
     '01-ufficio-cinematografico.png', '#bf853b'),
    ('02', 'Fumetto corporate', 'Contorni netti, ombre grafiche e una comicità più marcata.',
     'Un ufficio freddo e satirico, con personaggi espressivi e dettagli da fumetto animato.',
     '02-fumetto-corporate.png', '#547c8b'),
    ('03', 'Realismo atmosferico', 'Fondali più vicini al reale, profondità e materiali ricchi.',
     'Un inverno cinematografico, con riflessi controllati e personaggi sul piano di gioco 2D.',
     '03-realismo-atmosferico.png', '#6c7387'),
    ('04', 'Diorama stop-motion', 'Un ufficio in miniatura, con texture tattili e personaggi artigianali.',
     'Legno, tessuti e piccoli oggetti danno al gioco il carattere di un set animato.',
     '04-diorama-stop-motion.png', '#9a6754'),
    ('05', 'Noir natalizio', 'Bianco e nero, con pochi accenti rossi e dorati.',
     'Un Natale aziendale dal carattere grafico deciso, con luci, ombre e ironia.',
     '05-noir-natalizio.png', '#555d68')
]
w, h = landscape(A4)
c = canvas.Canvas(str(OUT), pagesize=(w, h), pageCompression=1)
c.setTitle('Corporate Odyssey - Proposte grafiche per il primo livello')
c.setAuthor('Corporate Odyssey')
c.setSubject('Cinque direzioni artistiche per Natale in Ufficio')
margin = 28
for number, title, subtitle, detail, image_name, accent in BOARDS:
    c.setFillColor(HexColor('#f5f2ed')); c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(HexColor('#202a36')); c.setFont('SegoeBold', 9)
    c.drawString(margin, h - 24, 'CORPORATE ODYSSEY  /  NATALE IN UFFICIO')
    c.setFillColor(HexColor(accent)); c.drawRightString(w - margin, h - 24, number + ' / 05')
    c.setFillColor(HexColor('#18232f')); c.setFont('SegoeBold', 20)
    c.drawString(margin, h - 51, title)
    c.setFont('Segoe', 10); c.setFillColor(HexColor('#52606d'))
    c.drawString(margin, h - 70, subtitle)
    image_path = ROOT / 'docs/concepts' / image_name
    iw, ih = Image.open(image_path).size
    image_width = w - 2 * margin
    image_height = image_width * ih / iw
    image_y = h - 85 - image_height
    jpeg = BytesIO()
    Image.open(image_path).convert('RGB').save(jpeg, format='JPEG', quality=94, subsampling=0)
    jpeg.seek(0)
    c.drawImage(ImageReader(jpeg), margin, image_y, width=image_width, height=image_height)
    c.setFillColor(HexColor('#34404b')); c.setFont('Segoe', 9)
    c.drawString(margin, 41, detail)
    c.setFont('Segoe', 8); c.setFillColor(HexColor('#7a8189'))
    c.drawString(margin, 21, 'Studio di direzione artistica - le immagini rappresentano concept visivi.')
    c.drawRightString(w - margin, 21, '15 novembre 2026')
    c.showPage()
c.save()
reader = PdfReader(OUT)
assert len(reader.pages) == 5
for page in reader.pages:
    assert 'CORPORATE ODYSSEY' in page.extract_text()
print(f'{OUT}: {len(reader.pages)} pagine, {OUT.stat().st_size} byte')
