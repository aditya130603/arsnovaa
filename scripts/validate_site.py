from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]
pages=list(ROOT.rglob('index.html'))
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.canonical=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag in ('a','script','link'):
            path=a.get('href') or a.get('src')
            if path: self.links.append(path)
        if tag=='link' and a.get('rel')=='canonical':
            self.canonical.append(a.get('href',''))

for page in pages:
    if any(part.startswith('.') for part in page.relative_to(ROOT).parts):
        continue
    parser=Links()
    parser.feed(page.read_text(encoding='utf-8'))
    if len(parser.canonical)!=1 or not parser.canonical[0].startswith('https://www.arsnovaa.com/'):
        errors.append(f'{page}: invalid canonical {parser.canonical}')
    for link in parser.links:
        if link.startswith('/') and not link.startswith('//'):
            target=ROOT/link.lstrip('/')
            if target.is_dir(): target=target/'index.html'
            if not target.exists(): errors.append(f'{page}: broken link {link}')
home=(ROOT/'index.html').read_text(encoding='utf-8')
for snippet in ('av-story-run','av-story-scene','/assets/experience.js','/assets/experience.css'):
    if snippet not in home: errors.append(f'Homepage missing {snippet}')
if errors:
    print('\n'.join(errors),file=sys.stderr)
    sys.exit(1)
print(f'Validated {len(pages)} pages and internal references.')
