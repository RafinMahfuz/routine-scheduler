import base64

with open('assets/ruet_logo_opt.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('ascii')

with open('js/logo.js', 'w', encoding='utf-8') as f:
    f.write('/* Pre-encoded RUET University Crest for instant, zero-latency rendering in print and PDF */\n')
    f.write(f'const RUET_LOGO_DATA_URI = "data:image/png;base64,{b64}";\n')

print('Wrote js/logo.js successfully')

