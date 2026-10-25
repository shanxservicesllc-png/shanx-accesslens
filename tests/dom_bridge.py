"""Standard-library HTML parsing bridge for Node unit tests.
This is a DOM TEST DOUBLE, not an HTML5 browser parser; browser tests remain necessary.
"""
import html.parser
import json
import sys

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class Parser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = {'tag': '#document', 'attrs': {}, 'parts': []}
        self.stack = [self.root]
    def handle_starttag(self, tag, attrs):
        node = {'tag': tag, 'attrs': {a: b if b is not None else '' for a,b in attrs}, 'parts': []}
        self.stack[-1]['parts'].append(node)
        if tag not in VOID: self.stack.append(node)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID: self.handle_endtag(tag)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i]['tag'] == tag:
                self.stack = self.stack[:i]
                break
    def handle_data(self, data): self.stack[-1]['parts'].append(data)

p=Parser()
p.feed(sys.stdin.read())
print(json.dumps(p.root))
