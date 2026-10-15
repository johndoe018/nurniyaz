"""Build the provided one-page report. Requires reportlab; no network or secrets."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('DejaVu', str(FONT_DIR / 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVu-Bold', str(FONT_DIR / 'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold')
GREEN = colors.HexColor('#153e35')
MUTED = colors.HexColor('#5c6958')
body = ParagraphStyle('body', fontName='DejaVu', fontSize=8.65, leading=13.2, textColor=MUTED, spaceAfter=7)
heading = ParagraphStyle('heading', parent=body, fontName='DejaVu-Bold', fontSize=9.1, leading=13, textColor=GREEN, spaceBefore=8, spaceAfter=5)
small = ParagraphStyle('small', parent=body, fontSize=7.2, leading=10.4)
cell = ParagraphStyle('cell', parent=body, fontSize=8.1, leading=12, spaceAfter=0)

def para(text, style=body): return Paragraph(text, style)

story = [
    para('TOPIC 8 / AI FOR DIFFERENTIATED LEARNING', ParagraphStyle('kicker', parent=small, fontName='DejaVu-Bold', textColor=GREEN, fontSize=7.3, tracking=1.2)),
    Spacer(1, 4),
    para('Quadratic Studio', ParagraphStyle('title', fontName='DejaVu-Bold', fontSize=25, leading=31, textColor=GREEN)),
    para('<b>Moldash Bekarys</b> · Quadratic equations · Individual project', body),
    Spacer(1, 5),
    para('One concept. Three starting points.', heading),
    para('A responsive learning lab develops one core task: finding and interpreting the zeros of a quadratic. A shared seed connects three differentiated versions; eight seeds provide 24 tasks. Learners choose their level, receive progressive guidance and check their understanding.'),
]

rows = [
    [para('<b>LEVEL</b>', cell), para('<b>EXAMPLE & VERIFIED RESULT</b>', cell), para('<b>DIFFERENTIATION</b>', cell)],
    [para('<b>Foundation</b>', cell), para('x² − 5x + 6 = 0<br/>Roots: 2 and 3', cell), para('Integer factors; visible three-step scaffold; direct hints and zero-product reasoning.', cell)],
    [para('<b>Standard</b>', cell), para('2x² − 10x + 9 = 0<br/>Roots: (5 ± √7) / 2', cell), para('Non-monic equation; irrational roots; discriminant and quadratic formula; less scaffolding.', cell)],
    [para('<b>Advanced</b>', cell), para('h(t) = −5t² + 25t + 30<br/>Landing: 6 s; maximum: 61.25 m', cell), para('Physical domain and units; reject negative time; evaluate the vertex at t = 2.5 s.', cell)],
]
t = Table(rows, colWidths=[78, 194, 247], hAlign='LEFT')
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#eaf0df')),
    ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f6f8f1')),
    ('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),
    ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
    ('LINEBELOW',(0,0),(-1,-1),.5,colors.HexColor('#dfe6d4')),
]))
story += [t,
    para('AI architecture', heading),
    para('Transformers.js runs the open-source SmolLM2-135M-Instruct model (q4) in a browser Web Worker using ONNX WASM. The first coach request downloads model files; inference runs on-device. No API key or external inference backend is required; questions are not uploaded. Deterministic code transforms parameters and checks answers. The model selects a verified guidance card using the learner’s question and level. Constrained decoding permits only four labels; displayed mathematics is never unrestricted model prose.'),
    para('Prompt design', heading),
    para('<b>Abridged system template:</b> “Select the most useful VERIFIED guidance card for the learner. [Level-specific style.] Output exactly one letter: A, B, C or D. A = next step; B = why the method works; C = checking an answer; D = a deeper connection. Do not generate mathematics or prose.”'),
    para('<b>Foundation</b> prioritises direct scaffolding and one small next step. <b>Standard</b> supports independent reasoning about coefficients, Δ and ± cases. <b>Advanced</b> emphasises units, the physical domain and the vertex. Context includes the equation, level, question and four verified cards, adapted to hints used and checking feedback. The model’s relative label scores choose the card; final results appear only with an open walkthrough. Exact prompts: <b>src/math.js</b>.'),
    para('Feedback, validation and limitations', heading),
    para('Immediate checking accepts fractions, radicals and decimals within 0.01, and explains notation errors, duplicate roots and inadmissible negative time. Hints, complete solutions and an interactive graph support self-paced learning. Progress is stored locally. Ten test groups verify all 24 tasks, parsing, prompt context and output constraints; browser checks exercise learning interactions and the honestly labelled model-unavailable fallback. Real inference and public publication remain unverified where network access is blocked. Free-form outputs were rejected after real tests found errors; constrained selection prevents invented displayed mathematics.'),
    Spacer(1, 6),
    para('<b>Development disclosure:</b> Prepared with AI assistance; mathematics verified independently of model output.<br/><b>References:</b> huggingface.co/docs/transformers.js · huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct · vite.dev/guide/static-deploy.html · GitHub Pages documentation.', small),
]

def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor('#dfe6d4'))
    canvas.line(38, 30, A4[0] - 38, 30)
    canvas.setFont('DejaVu', 6.8)
    canvas.setFillColor(MUTED)
    canvas.drawString(38, 18, 'MOLDASH BEKARYS / QUADRATIC STUDIO')
    canvas.drawRightString(A4[0] - 38, 18, f'{doc.page}')

out = ROOT / 'public' / 'report.pdf'
SimpleDocTemplate(str(out), pagesize=A4, rightMargin=38, leftMargin=38, topMargin=32, bottomMargin=40,
                  title='Quadratic Studio — AI for Differentiated Learning', author='Moldash Bekarys').build(story, onFirstPage=footer, onLaterPages=footer)
print(out)
