/* Interpreta o arquivo _headers do Cloudflare (regras por caminho; "*" é curinga) para testes e para o preview local. */
"use strict";

function parse(text) {
  var rules = [];
  var cur = null;
  text.split(/\r?\n/).forEach(function (line) {
    if (!line.trim() || line.trim().charAt(0) === "#") return;
    if (/^\s/.test(line)) {
      var i = line.indexOf(":");
      if (cur && i > 0) cur.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
    } else {
      cur = { pattern: line.trim(), headers: [], line: line };
      rules.push(cur);
    }
  });
  return rules;
}

function matches(pattern, pathname) {
  var re = new RegExp("^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
  return re.test(pathname);
}

// cabeçalhos aplicados a um caminho (valores repetidos do mesmo nome são juntados com ", ", como no Cloudflare)
function headersFor(rules, pathname) {
  var out = {};
  rules.forEach(function (r) {
    if (!matches(r.pattern, pathname)) return;
    r.headers.forEach(function (h) {
      var k = h[0].toLowerCase();
      out[k] = out[k] ? out[k] + ", " + h[1] : h[1];
    });
  });
  return out;
}

module.exports = { parse: parse, matches: matches, headersFor: headersFor };
