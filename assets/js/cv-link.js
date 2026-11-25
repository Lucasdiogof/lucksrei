/* Contato: aponta Visualizar/Baixar do currículo para o PDF do idioma atual (en | es | pt-BR). O href estático é o PDF em inglês. */
(function () {
  "use strict";
  function apply(l) {
    var loc = l === "pt-BR" || l === "es" ? l : "en";
    document.querySelectorAll("a[data-cv]").forEach(function (a) {
      a.href = "/assets/cv/lucas-diogo-franca-resume." + loc + ".pdf";
      if (a.hasAttribute("download")) a.setAttribute("download", "lucas-diogo-franca-resume-" + loc + ".pdf");
    });
  }
  document.addEventListener("lucksrei:locale", function (e) { apply(e.detail && e.detail.locale); });
  if (window.LucksreiI18n) apply(window.LucksreiI18n.getLocale());
})();
