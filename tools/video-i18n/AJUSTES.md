# Ajustes da revisão (Etapa 1 → pilotos da Etapa 2)

## Regras aprovadas (valem para todos os vídeos)
Traduzir interface, títulos, mensagens, slogans, categorias e descrições de produtos. Nunca traduzir clubes, equipes,
jogadores, aplicativos, marcas ou estádios (Team Falcons, Goiás, Avaí, Independiente…). Dados brasileiros demonstrativos
ficam (BRL, Pix, Crefito, cidades, linhas). Datas, horas e números seguem o idioma. Termos oficiais dos apps têm prioridade;
divergências ficam sinalizadas abaixo.

## O que mudou nos dicionários
| Vídeo | Ajuste |
|---|---|
| StockPort | produtos e categorias de demonstração agora são traduzidos (Café Torrado → Roasted Coffee / Café tostado; Mercearia → Grocery / Abarrotes…), inclusive os rótulos impressos nas caixas 3D. Ficam: Mercado Bom Dia, Distribuidora Serra, Mariana Souza, valores em R$, Pix. |
| Bebômetro | slogan aprovado: "Draft beer, cachaça, and good times." / "Cerveza de barril, cachaça y buenos momentos."; Mais uma, Comanda, Chope e Porção traduzidos; **Bafômetro** investigado (abaixo); 4 textos que só aparecem no master 16:9 foram incluídos (h3, chipLab, glassSub, stamp). |
| BusãoGyn | "Where's the bus?" / "¿Dónde está el bus?" aprovados; BusãoGyn inalterado. |
| Match Queue | "Pedalada (Stepover) direita" → **"Pedalada direita"** / "Pedalada derecha" (en "Stepover right"); es "El siguiente toma el turno" (mais curto). Team Falcons e demais nomes protegidos. |
| Goiás App | slogan curto e natural ("THE CENTER-WEST'S BIGGEST" / "EL MAYOR DEL CENTRO-OESTE"); Copa Sudamericana mantida. |
| La Pelve | **Agendado não é o termo oficial em espanhol**: o app usa **Programado** (`appointment_status.dart`); dicionário corrigido. |
| OrbiJob | idioma do usuário primeiro na demonstração (`wd.order`); 7 rótulos ESCO e atribuição "ESCO © … CC BY 4.0" preservados. |
| Aprovaura | competências do ENEM agora com o **nome oficial completo** do app (antes eram rótulos resumidos); pt-BR e es usam as perguntas, alternativas e manchetes do banco do app. |

## Bafômetro (investigação)
O recurso do app é uma **brincadeira**: mede o volume do sopro no microfone, sem medir álcool ("Simulação", "Dá para brincar",
"Brincadeira visual. Nada é registrado."; o filme tem o carimbo "De mentirinha"). O app mantém o nome "Bafômetro" em pt, en e es.
Traduzir como "Breathalyzer" sugere uma medição real de álcool; por isso os pilotos usam **"Blow Meter"** (en) e
**"Soplómetro"** (es). Isto **diverge do app** (não alterado); decisão final do dono.

## Divergências entre vídeos e apps
Comparação automática (texto original idêntico ao de um texto do app, tradução diferente):
- Bafômetro (acima) e Pedalada (encurtada só por espaço). Nenhuma outra divergência.
- Traduções do app que são iguais ao original (possível tradução pendente, na verdade cognatos legítimos): "Bar", "Casa", "Restaurante"
  (es), "Presencial/Híbrido/Remoto/Entrevista/Contratado/Etapa" (es), "Overall" e "Consoles" (pt), "Total" (pt/es). Nenhuma incorreta.
- Divergência de "bus": o app usa "autobús" em es; o slogan aprovado usa "bus" (coloquial).

## Textos longos (avisos do verificador) e ajustes visuais necessários na renderização
Pilotos (já resolvidos com `fit` por idioma): BusãoGyn es "¿Dónde está / el bus?" (fonte 75%); Bebômetro en "THE NIGHT OUT BEGINS." (85%),
en "FROM DRAFT BEER TO COCKTAILS." (80%), slogan en (85%) e es (68%). O título es de "Do chope ao coquetel" foi reformulado
para "Del barril al cóctel" porque a forma literal não cabe.

Pendentes nos demais vídeos (a tratar na renderização deles):
- Bebômetro (master 16:9): h3 en "Your phone becomes a glass." (160%).
- Match Queue: "Química da escalação" / "Química de la alineación" (es 171%), "Historial de búsquedas" (157%).
- Goiás App: "Attacking midfielder" (153%); "DEFENSIVE MIDFIELDER".
- Aprovaura: as 5 competências do ENEM no nome oficial completo são bem mais longas que os rótulos originais (de ~25 para 40–70
  caracteres): exigem quebra de linha ou fonte menor na lista de resultados.
- StockPort: rótulos das caixas 3D (es "DETERGENTE EN POLVO 1 KG").
- **Todos os vídeos de recorte 1:1 (Bebômetro, OrbiJob, BusãoGyn):** o recorte central de 1080 px já corta chips laterais
  (BusãoGyn 14–19 s mostra "REAL" e "NÃO CO" cortados nos publicados). Mantido igual nos pilotos; correção opcional, ver abaixo.

## Pendências sem resolver
1. Decisão do dono sobre "Blow Meter/Soplómetro" × manter "Bafômetro" (diverge do app).
2. Corrigir ou não o corte lateral dos chips do BusãoGyn (14–19 s) nas 3 versões (muda o pt-BR em relação ao publicado).
3. Fonte da Inter (Aprovaura/Match Queue) segue aproximada; datas/horas dos filmes de Goiás e La Pelve ainda não parametrizadas.
4. Os 6 vídeos restantes só começam após aprovação visual dos pilotos.
