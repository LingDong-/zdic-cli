#!/usr/bin/env python2.7
# -*- coding: utf-8 -*-
import os
import re
import io
import sys 
import json 

reload(sys)  
sys.setdefaultencoding('utf8')

txt = open("../zdic.txt",'r').read()
ent = re.findall(r'<h2>([^<>]*?)</h2>(.*?)<mbp:pagebreak/>', txt)
ent = [(x[0].strip(),x[1]) for x in ent]
ent = [x for x in ent if x[0] != ""]

def first(l):
    return "" if len(l) == 0 else l[0]

def rem_bad_char(t):
    return t.decode('utf-8','ignore')

def heads_to_name(t):
    u = [x for x in t if len(hex(ord(x)))-2 <= 4]
    u = ("".join(u)).decode("utf-8","ignore")
    #print u
    return u

def append_if_ok(heads,word):
    try:
        fn = "../zdic_json/"+heads_to_name(heads+[unicode(word)[0].lower()])+".json"
        open(fn,'wb').write("test.")
        os.remove(fn)
        heads.append(unicode(word)[0].lower())
        return True
    except:
        print("BAD WORD NAME:",word)
        return False

heads = []
result = {}
weirdo = {}
for e in ent:
    
    word = e[0]
    content = e[1]
    print word,
    
    is_ok = True

    if len(heads) == 0:
        heads = []
        is_ok = append_if_ok(heads,word)

    else:
        try:
            b = not (word.lower()).startswith(heads[-1].lower())
        except:
            continue
        if b:
            if len(result) > 1000 or len(heads) >= 128:
                fn = heads_to_name(heads)
                open("../zdic_json/"+fn+".json",'wb').write(json.dumps(result))

                result = {}
                heads = []
                is_ok = append_if_ok(heads,word)
            else:
                is_ok = append_if_ok(heads,word)


    traditional = first(re.findall(r"#444\">\((.*?)\)",content)) + first(re.findall(r"繁体字:(.*?)</li>",content))
    pinyin = first(re.findall(r"拼音.*?：(.*?)[<\t　]",content))
    zhuyin = first(re.findall(r"注音.*?：(.*?)<",content))
    definition = re.findall(r"<li.*?>(.*?)</li>",content)
    if len(definition) == 0:
        definition = [content]

    definition = [re.sub(r"<.*?>","",d).strip() for d in definition]
    definition = [re.sub(r"^.{0,1}\d.*?[\.\)]","",d).strip() for d in definition]
    definition = [re.sub(r"===汉英互译===","",d).strip() for d in definition]
    #definition = [re.sub(r"【解释】：","",d).strip() for d in definition]
    traditional = re.sub(r"<.*?>","",traditional).replace(" ","")

    definition = [rem_bad_char(d) for d in definition 
        if  (len(pinyin) == 0 or (pinyin not in d and pinyin.replace(" ","") not in d)) \
        and (len(zhuyin) == 0 or zhuyin not in d ) \
        and "繁体" not in d
        and "简体" not in d
        and "郑码" not in d
        and "拼音" not in d
        and "粤语：" not in d
        and "潮州话：" not in d
        and "UniCode" not in d
        and "◎" not in d
        and len(d.replace(word,"")) > 0
    ]

    if len(definition) == 0:
        definition = [rem_bad_char(content)]
        definition = [re.sub(r"<.*?>","",d).strip() for d in definition]


    thing = {"TRD":traditional.decode('utf-8',"ignore"), 
             "PRN":[pinyin.decode('utf-8',"ignore"), zhuyin.decode('utf-8',"ignore")],
             "DEF":definition,
            }
    if is_ok:
        result[word]=thing
    else:
        weirdo[word]=thing

open("../zdic_json/extended.json",'wb').write(json.dumps(weirdo))

