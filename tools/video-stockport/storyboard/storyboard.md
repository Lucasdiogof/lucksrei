# Storyboard — StockPort System

Conceito: acompanhar o fluxo de uma pequena empresa. O estoque alimenta as vendas, as vendas alimentam o caixa, o caixa
vira informação gerencial — e tudo converge para o SP. Uma mensagem principal por vez, títulos sustentados 3–5 s,
transições com motivo (o produto vira miniatura do catálogo, a caixa vira linha de movimentação, a venda vira registro
no caixa, o painel vira relatório, o relatório vira CSV/PDF, as linhas formam o SP).

Quadros de referência de cada cena: `../ref/` (16:9, 1:1 e 9:16). Contact sheets dos MP4 finais: `sheet-*.jpg`.

| # | Cena | Composição | Transição de saída |
|---|---|---|---|
| 1 | Marca | navy, linhas cobalto desenham em isométrico loja, prateleiras, caixas e balcão; pulso de luz percorre as arestas; SP montado (corpo sobe, coroa desce em três peças), extrusão real em Z, reflexo recortado pela própria geometria; wordmark por máscara; lockup vai para a esquerda e entra o título | marca recua, linhas descem para virar o piso |
| 2 | Produtos | piso técnico em perspectiva, 4 produtos 3D sobem com etiquetas de categoria; a câmera achata e cada produto voa para a miniatura da sua linha no catálogo; etiqueta com código de barras, feixe de leitura, dígitos, "Produto encontrado", linha destacada e ficha do item | painéis saem; a estante entra |
| 3 | Estoque | estante 3D montada nível a nível; a caixa de entrada desce em arco com rastro de luz e pousa na vaga (anel); a movimentação "+24" entra no topo e empurra o histórico; saldo 62 → 86 com marcador de mínimo; vaga do sabão acende em âmbar e o card "Estoque baixo" substitui o saldo | câmera recua |
| 4 | PDV | painel de venda inclinado ao lado do título; "Café" digitado; cards tocados soltam o produto que voa em arco para o carrinho; quantidades sobem (2, 6, 1), cliente, desconto, total; o pagamento sobe sobre a grade (Pix R$ 40 + Dinheiro R$ 30, falta R$ 0); toque em "Confirmar venda"; anel e check desenhados | o card de confirmação encolhe e desliza para a direita |
| 5 | Caixa | a venda (parte em dinheiro) chega como ficha no trilho de movimentos; cada nó acende e o esperado na gaveta anima; o fechamento desliza (esperado, contado, diferença R$ 0,00) | painel se dissolve |
| 6 | Clientes e fornecedores | fornecedor e cliente inclinados um para o outro; no centro o produto gira num anel; fluxos de luz "Entrada · 24 un." e "Venda #1048" | escurece para o close no painel claro |
| 7 | Dashboard | close no faturamento do dia; a câmera recua e revela o painel claro em camadas com profundidade; barras, linha e rosca animam; os cards convergem e somem para dar lugar ao relatório PDF (marca, régua cobalto, indicadores, gráfico, tabela) | relatório some |
| 8 | Equipe | matriz de permissões: pessoas entram, as células abrem coluna a coluna (opera / só consulta / sem acesso) | painel sai |
| 9 | Exportações | CSV (cabeçalho #0A3D91) e PDF se separam com os nomes dos arquivos; molduras de navegador e celular envolvem cada um; chips de plataformas, idiomas e temas | linhas convergem |
| 10 | Encerramento | ~30 linhas cobalto convergem; o contorno do SP é traçado com os paths originais; o preenchimento original aparece; wordmark; "Do estoque à venda. Tudo conectado."; "Um produto Lucksrei" — quadro final parado ≥ 3 s | (loop 1:1: dissolve para o fundo vazio do quadro 0) |

Versões curtas: o loop 1:1 tira a cena 6 e encurta esperas de cada cena; o vertical tira as cenas 6 e 9. Os títulos
mantêm velocidade real; aceleram só pausas, entradas e saídas.

## Refinamento comercial
- Títulos: "Estoque, vendas e caixa. Tudo em um só lugar." · "Cadastre e organize seus produtos." · "Acompanhe entradas,
  saídas e estoque baixo." · "Registre vendas com mais agilidade." · "Controle cada movimentação do caixa." · "Clientes
  e fornecedores com todo o histórico." · "Entenda seus resultados." · "Sua equipe, cada um com o acesso certo." ·
  "Informações onde você precisa." · fecho com "Licença de uso do software".
- Estoque em quatro tempos: a caixa pousa (entrada) → o saldo troca 62 → 86 → o histórico recebe a linha → o alerta do
  sabão. No PDV o total só exibe valores exatos; a confirmação mostra o estoque do café 86 → 84.
- Fronteiras entre cenas: cada cena termina a saída antes de a próxima entrar (sem painéis sobrepostos).
- Vertical para marketplace e loop 1:1 com câmera aproximada na coluna que importa; cena "gestão" exclusiva do vertical.
