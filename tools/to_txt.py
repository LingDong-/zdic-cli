#!/usr/bin/env python2.7
from mobi import Mobi

book = Mobi("../zdic.prc");
book.parse();

for record in book:
	print record,
