#!/usr/bin/env python2.7
t = open("mobi/__init__.py",'r').read().replace(
	"uncompress_lz77(self.contents[self.records[recordnum]['record Data Offset']:self.records[recordnum+1]['record Data Offset']-self.config['mobi']['extra bytes']])",
	"result = uncompress_lz77(self.contents[self.records[recordnum]['record Data Offset']:self.records[recordnum+2]['record Data Offset']-self.config['mobi']['extra bytes']])"
).replace(
	"for record in range(1, self.config['mobi']['First Non-book index'] - 1):",
	"for record in range(0, 10000000,1):"
)
open("mobi/__init__.py",'w').write(t)
t = open("mobi/lz77.py",'r').read().replace(
	"print(\"WARNING:","#print(\"WARNING:"
).replace(
	"\" beginning of text!",
	"#"
)
open("mobi/lz77.py",'w').write(t)