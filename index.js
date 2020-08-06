const fs = require("fs")
const readline = require('readline');

const dict_path = __dirname+'/zdic_json'

function locate_file(word){
  const folder = dict_path;
  var files = fs.readdirSync(folder)
  for (var i = 0; i < files.length; i++){
    if (files[i].includes(word.slice(0,1))){
      return files[i]
    }
  }
  return "extended.json"
}

function read_json(file_path){
  return JSON.parse(fs.readFileSync(dict_path+"/"+file_path).toString())
}

function define(word){
  var dict_path = locate_file(word)
  var dict = read_json(dict_path)
  var ret = []
  if (word in dict){
    return [word,dict[word]]
  }
  return null;
}

function starts_with(word){
  var ret = []
  var dict = read_json(locate_file(word))
  for (w in dict){
    if (w.startsWith(word)){
      ret.push(w)
    }
  }
  return ret;
}

function contains(words){
  // console.log(words)
  var ret = []
  var files = fs.readdirSync(dict_path)
  for (var i = 0; i < files.length; i++){
    if (!files[i].endsWith(".json")){
      continue;
    }
    var dict = read_json(files[i]);
    for (var w in dict){
      var ok = true;
      for (var j = 0; j < words.length; j++){
        if (!w.includes(words[j])){
          ok = false;
          break;
        }
      }
      if (ok){
        ret.push(w);
      }
    }
  }
  return ret;
}

function full_text_search(word,view_len,callback){
  var ret = []
  var pd = Math.floor((view_len-word.length)/2);
  var files = fs.readdirSync(dict_path)
  var re = new RegExp(word);
  for (var i = 0; i < files.length; i++){
    if (!files[i].endsWith(".json")){
      continue;
    }
    var dict = read_json(files[i]);
    for (var w in dict){
      for (var j = 0; j < dict[w]['DEF'].length; j++){
        var idx = dict[w]['DEF'][j].search(re)
        if (idx == -1){
          continue;
        }
        var it = [ret.length,w,dict[w]['DEF'][j].slice(Math.max(idx-pd,0),idx+word.length+pd)];
        ret.push(w);
        callback(it);
        break;
      }
    }
  }
  return ret;
}

function render_def(word,entry){
  var result = ""
  result += "\x1b[32m\033[1m"+word+"\x1b[0m"
  if (entry['TRD'] != ''){
    result += " \x1b[32m\033[1m("+entry['TRD']+")\x1b[0m "
  }
  if (entry['PRN'][0] != ''){
    result += " \x1b[33m[ "+entry['PRN'][0].trim()+""
  }
  if (entry['PRN'][1] != ''){
    result += " , "+entry['PRN'][1].trim()
  }
  if (entry['PRN'][0] != ''){
    result += " ]\x1b[0m"
  }
  result += "\n"
  var n = process.stdout.columns-4;

  for (var i = 0; i < entry['DEF'].length; i++){
    result += "\x1b[2m〇\x1b[0m"
    var j = 1;
    var t = entry['DEF'][i];
    var isf = true;
    for (var c of t){
      if (c == "《"){
        result += "\x1b[31m"
      }
      if (c == "～"){
        result += "\x1b[33m"+c+"\x1b[0m";
        if (!isf){
          result += "\x1b[2m"
        }
      }else{
        result += c;
      }
      
      if (c == "》"){
        result += "\x1b[0m"
        if (!isf){
          result += "\x1b[2m"
        }
      }
      if (c == "。" && isf){
        result += "\x1b[2m"
        isf = false;
      }
      j+=2;
      if (j >= n){
        j = 2;
        result += "\n　　"

      }
    }
    result+="\x1b[0m\n"
  }
  result += ""
  return result
}

function char_pad(x,n){
  return (x+"　".repeat(n)).slice(0,n);
}
function render_item(i,x,n){
  return `\x1b[33m${i.toString().padStart(4)}\x1b[0m ${char_pad(x,n)}`;
}

function render_list(lst){
  var npi = 6;
  var npl = Math.floor((process.stdout.columns-2)/(npi*2+5))
  var result = "";
  for (var i = 0; i < lst.length; i++){
    var li = lst[i];
    li = li.replace(/[^一-鿿]/g,"")
    if (!li.length){//oops
      li = lst[i];
    }
    result += render_item(i,li,npi);
    if (i % npl == npl-1){
      result += "\n"
    }else{
      result += ""
    }
  }
  return result;
}


var commands = {
  "def":["def x      ","display entry for x"],
  "pre":["pre x      ","list words that starts with x"],
  "has":["has x y ...","list words that contains x and y ..."],
  "txt":["txt x      ","list words whose full entry text contains x (regex supported)"],
  "sel":["sel n      ","display entry at previously returned list index n"],
}

function main(prev){
  var curr = null;
  var def = null;
  var fail = false;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('> ', (answer) => {
    try{
      answer = answer.trim();
      var cmd = answer.slice(0,3);
      var arg = answer.slice(4);
      if (!arg.length){
        console.log(`\x1b[36m${commands[cmd][0]} \x1b[0m${commands[cmd][1]}`);
      }else{
        if (cmd == "def"){
          var def = define(arg);
          if (def){
            console.log(render_def(...def));
          }
        }else if (cmd == "pre"){
          curr = starts_with(arg);
          console.log(render_list(curr));
        }else if (cmd == "has"){
          curr = contains(arg.split(" "));
          console.log(render_list(curr));
        }else if (cmd == "txt"){
          curr = full_text_search(arg,Math.floor((process.stdout.columns-20)/2),function(x){
            console.log(`${render_item(x[0],x[1],6)}\x1b[2m${x[2]}\x1b[0m`);
          });
        }else if (cmd == "sel"){
          var def = define(prev[parseInt(arg)]);
          if (def){
            console.log(render_def(...def))
          }
        }else{
          console.log("\x1b[31munsupported command.\x1b[0m")
          fail = true
        }
        if (!fail && (def == null && (curr == null || curr.length == 0))){
          console.log("\x1b[2m(0 result returned)\x1b[0m")
        }
      }
    }catch(e){
      console.log("\x1b[31mcommand parse failed. trying as direct query...\x1b[0m")
      // console.log(e)
      try{
        var def = define(answer);
        if (def){
          console.log(render_def(...def));
        }else{
          throw new Error();
        }
      }catch(ee){
        console.log("\x1b[31mcommand parse totally failed.\x1b[0m")
      }
    }
    rl.close()
    main(curr||prev);
  });
  
}

console.log("╔═════════════════════════════════════════════╗")
console.log("║\x1b[31m               漢    典   CLI                \x1b[0m║")
console.log("║Unoffical offline 漢典 (zdic.net) commandline║")
console.log("║\x1b[2m w/ data derived from `汉典.prc` (for Kindle)\x1b[0m║")
console.log("║\x1b[2m            Lingdong Huang 2020              \x1b[0m║");
console.log("╚═════════════════════════════════════════════╝")
console.log(`commands: ${Object.keys(commands).map(x=>( "\x1b[36m"+x+"\x1b[0m" )).join(",") }, run without arguments to see help`);
main();
