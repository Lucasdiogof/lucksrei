/* Lucksrei — tema claro/escuro. Roda no <head>, antes do CSS e da primeira pintura (sem flash de tema).
 *
 * Ordem: escolha manual salva (localStorage "lucksrei.theme" = "dark" | "light") → prefers-color-scheme → escuro.
 * Define <html data-theme> e color-scheme. O botão do header (main.js) troca e salva a escolha.
 */
(function () {
  "use strict";
  var root = document.documentElement;
  var theme = null;
  try { theme = localStorage.getItem("lucksrei.theme"); } catch (e) { /* storage bloqueado: segue o sistema */ }
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');   // barra do navegador no celular
  if (meta) meta.setAttribute("content", theme === "light" ? "#0d1424" : "#040405");
})();
