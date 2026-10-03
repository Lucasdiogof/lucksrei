/* Lucksrei — CTA "Explorar todos os apps" da home: logos reais + contador calculado a partir do dataset. */
(function () {
  "use strict";
  var data = window.LUCKSREI_APPS;
  var stack = document.getElementById("apps-stack");
  var more = document.getElementById("apps-more");
  if (!data || !stack || !more) return;
  var byId = {};
  data.apps.forEach(function (a) { byId[a.id] = a; });
  var shown = data.featured.filter(function (id) { return byId[id] && byId[id].logo; });
  stack.textContent = "";
  shown.forEach(function (id) {
    var app = byId[id];
    var img = document.createElement("img");
    img.src = app.logo;
    img.alt = "";
    img.width = 32;
    img.height = 32;
    img.loading = "lazy";
    img.decoding = "async";
    stack.appendChild(img);
  });
  more.textContent = "+" + (data.apps.length - shown.length);
})();
