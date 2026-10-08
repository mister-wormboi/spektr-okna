"""Read public article metadata. Original article bodies are not saved.

Run from any directory: python tools/scrape-article-metadata.py
"""
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag = tag
        self.attrs = dict(attrs)
        self.children = []

    def text(self):
        return ' '.join(re.sub(r'\s+', ' ', child.text() if isinstance(child, Node) else child).strip()
                        for child in self.children).strip()

    def find(self, predicate):
        matches = [self] if predicate(self) else []
        for child in self.children:
            if isinstance(child, Node):
                matches.extend(child.find(predicate))
        return matches


class Document(HTMLParser):
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def first(nodes):
    return nodes[0] if nodes else None


def scrape(url):
    request = Request(url, headers={'User-Agent': 'SpektrArticleMetadata/1.0'})
    with urlopen(request, timeout=35) as response:
        html = response.read().decode('utf-8')
        status = response.status
        final_url = response.url
    doc = Document()
    doc.feed(html)
    root = doc.root
    body = first(root.find(lambda n: n.attrs.get('id') == 'articleBody'))
    headline = first(root.find(lambda n: n.tag == 'h1'))
    if body is None or headline is None:
        raise ValueError('Article headline or body not found: ' + url)

    def prop(name):
        item = first(root.find(lambda n: n.attrs.get('itemprop') == name))
        return (item.attrs.get('content') or item.text()) if item else None

    author = first(root.find(lambda n: n.attrs.get('itemprop') == 'author'))
    author_text = author.text() if author else None
    if author_text == 'Автор':
        author_text = None
    canonical = first(root.find(lambda n: n.tag == 'link' and n.attrs.get('rel') == 'canonical'))
    read = first(root.find(lambda n: 'ArticleDetailBody_bar__time__' in n.attrs.get('class', '')))
    views = first(root.find(lambda n: 'ArticleDetailBody_bar__views__' in n.attrs.get('class', '')))
    cover = first(root.find(lambda n: n.tag == 'img' and n.attrs.get('itemprop') == 'contentUrl'))
    images = ([cover] if cover else []) + body.find(lambda n: n.tag == 'img')
    image_urls = []
    for img in images:
        src = urljoin(final_url, img.attrs.get('src', ''))
        original = parse_qs(urlsplit(src).query).get('url', [src])[0]
        if original not in image_urls:
            image_urls.append(original)
    metadata = {
        'url': final_url,
        'canonical_url': urljoin(final_url, canonical.attrs['href']) if canonical else None,
        'title': headline.text(),
        'published_on': prop('datePublished'),
        'modified_on': prop('dateModified'),
        'author': author_text,
        'reading_minutes': int(re.search(r'\d+', read.text())[0]) if read else None,
        'views_at_collection': int(views.text()) if views and views.text().isdigit() else None,
        'image_urls': image_urls,
        'heading_count': len(body.find(lambda n: n.tag in ('h2', 'h3', 'h4'))),
        'table_count': len(body.find(lambda n: n.tag == 'table')),
        'word_count': len(body.text().split()),
        'http_status': status,
        'fetched_at': datetime.now(timezone.utc).isoformat(),
    }
    return metadata, body


if __name__ == '__main__':
    sample = json.loads((ROOT / 'docs/mosokna-articles-sample.json').read_text(encoding='utf-8'))
    result = []
    for index, article in enumerate(sample['articles'], start=1):
        metadata, body = scrape(article['url'])
        result.append(metadata)
        print(json.dumps({'number': index, 'metadata': metadata,
                          'review_excerpt': body.text()[:2600]}, ensure_ascii=False), flush=True)
    target = ROOT / 'docs/mosokna-article-metadata.json'
    target.write_text(json.dumps({'articles': result, 'note': 'Метаданные источников без полных текстов. image_urls — адреса оригиналов; данные загруженных обложек находятся в mosokna-article-images.json.'},
                                ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
