# Screenshots dos cases como jornada narrativa

As capturas dos quatro produtos próprios (Goiás App, Aprovaura, La Pelve e Match Queue) seguem uma história: entrada, uso principal e funcionalidades. Cada etapa é um bloco `data-shots="<produto>:jN"` na página do case, com eyebrow ("Etapa 01"), título curto e introdução em pt-BR, en e es (chaves `journey.*` em `assets/i18n/*.js`). A ordem das telas de cada etapa fica em `assets/js/screenshots-data.js` (`blocks`).

Regras: nenhuma captura foi alterada, criada ou removida; cada uma aparece uma única vez; listas vêm antes dos detalhes; login e cadastro abrem a história; o `tests/i18n.test.js` valida a ordem, a unicidade, os textos e a ordem de renderização no HTML.

Fora da narrativa (mantida no acervo): `aprovaura/essay-themes` (pt-BR), que duplica a lista de temas de `essay-list`.

## Telas que não existem no acervo (não foram inventadas)
- Goiás App: Quiz do Verdão (só aparece como cartão em Desafios) e as telas de resultado de Adivinhe a Escalação e Adivinhe o Jogador.
- Goiás App: cadastro de sócio só tem a primeira etapa.
- Match Queue: convites recebidos, confirmação de partida encontrada e resultado de partida.

# Inventário das capturas por produto

## Goiás App

Capturas exibidas por idioma: antes 52, depois 52. Slots no acervo: 52.

| # | Etapa | Pos. | Captura | Bloco antigo | Título | Legenda | Arquivos (pt-BR / en / es) |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 1 | `login` | b2 | Entrar | Login com e-mail e senha, com recuperação de senha e criação de conta. | ok / ok / ok |
| 2 | 1 | 2 | `signup` | b2 | Criar conta | Cadastro em três etapas: dados, contato e segurança. | ok / ok / ok |
| 3 | 1 | 3 | `home` | b2 | Home | Próximo jogo, contagem e atalhos. | ok / ok / ok |
| 4 | 2 | 1 | `matches` | b2 | Partidas | Próximo jogo, ingressos e rodada na mesma tela. | ok / ok / ok |
| 5 | 2 | 2 | `calendar` | b2 | Jogos | Partidas, calendário e classificação. | ok / ok / ok |
| 6 | 2 | 3 | `standings` | b2 | Classificação | Tabela completa com o clube em destaque. | ok / ok / ok |
| 7 | 2 | 4 | `other-competitions` | b2 | Outros campeonatos | Campeonatos nacionais e internacionais para consultar a classificação. | ok / ok / ok |
| 8 | 3 | 1 | `club-home` | b3 | Menu do clube | Todo o conteúdo institucional num só menu. | ok / ok / ok |
| 9 | 3 | 2 | `club` | b2 | Mais do menu do clube | Ídolos, diretoria, elenco, hino, transparência e parceiros. | ok / ok / ok |
| 10 | 3 | 3 | `history` | b3 | História | A trajetória do clube, de 1943 aos dias de hoje. | ok / ok / ok |
| 11 | 3 | 4 | `titles` | b3 | Títulos | Conquistas organizadas por campeonato e ano. | ok / ok / ok |
| 12 | 3 | 5 | `board` | b3 | Diretoria | Diretoria e gestão em lista, por área. | ok / ok / ok |
| 13 | 3 | 6 | `idols` | b3 | Ídolos | Os ídolos do clube, em ordem cronológica. | ok / ok / ok |
| 14 | 3 | 7 | `idol-detail` | b3 | Detalhe do ídolo | Perfil do ídolo com período, posição, história e campanhas. | ok / ok / ok |
| 15 | 3 | 8 | `squad` | b3 | Elenco | Elenco com foto e camisa de cada atleta. | ok / ok / ok |
| 16 | 3 | 9 | `player` | b3 | Perfil do jogador | Dados e carreira de cada atleta do elenco. | ok / ok / ok |
| 17 | 3 | 10 | `songs` | b3 | Hino & Músicas | Versões do hino e músicas da torcida. | ok / ok / ok |
| 18 | 3 | 11 | `anthem` | b2 | Player do hino | Player com volume e letra na tela. | ok / ok / ok |
| 19 | 3 | 12 | `transparency` | b3 | Transparência | Documentos do clube organizados por categoria. | ok / ok / ok |
| 20 | 3 | 13 | `document` | b3 | Documentos | PDF aberto dentro do app, com compartilhamento. | ok / ok / ok |
| 21 | 3 | 14 | `partners` | b3 | Parceiros | Marcas parceiras em destaque no app. | ok / ok / ok |
| 22 | 3 | 15 | `media` | b3 | Mídia | Notícias, Instagram, YouTube e X agregados. | ok / ok / ok |
| 23 | 3 | 16 | `media-news` | b3 | Notícias | Notícias do clube na aba Mídia. | ok / ok / ok |
| 24 | 3 | 17 | `media-youtube` | b3 | YouTube | Vídeos do canal do clube dentro do app. | ok / ok / ok |
| 25 | 3 | 18 | `media-x` | b3 | X | Publicações do clube no X. | ok / ok / ok |
| 26 | 3 | 19 | `news-article` | b3 | Notícia | Leitura da notícia dentro do app, com link para a matéria original. | ok / ok / ok |
| 27 | 4 | 1 | `socio` | b2 | Sócio | Planos de sócio, benefícios e cadastro dentro do app. | ok / ok / ok |
| 28 | 4 | 2 | `socio-plan` | b2 | Plano de sócio | Benefícios, valor mensal e dúvidas frequentes do plano. | ok / ok / ok |
| 29 | 4 | 3 | `member-signup` | b4 | Cadastro de sócio | Cadastro em etapas, com o plano escolhido. | ok / ok / ok |
| 30 | 4 | 4 | `tickets` | b4 | Ingressos | Compra de ingressos a partir do próximo jogo. | ok / ok / ok |
| 31 | 4 | 5 | `ticket-sectors` | b4 | Setores | Setor, categoria e quantidade em uma tela. | ok / ok / ok |
| 32 | 4 | 6 | `purchase` | b4 | Resumo da compra | Itens, total e titulares antes de finalizar. | ok / ok / ok |
| 33 | 4 | 7 | `purchased` | b4 | Compra concluída | Confirmação com atalho para o ingresso. | ok / ok / ok |
| 34 | 4 | 8 | `my-tickets` | b4 | Meus ingressos | Ingressos próximos e histórico. | ok / ok / ok |
| 35 | 4 | 9 | `ticket` | b4 | Ingresso | Ingresso digital com QR code, para salvar. | ok / ok / ok |
| 36 | 4 | 10 | `store` | b2 | Loja | Catálogo por categoria, compras e pedidos. | ok / ok / ok |
| 37 | 4 | 11 | `store-category` | b2 | Categoria da loja | Produtos de uma categoria, com ordenação e filtros. | ok / ok / ok |
| 38 | 4 | 12 | `store-product` | b2 | Produto | Foto, preço, tamanho, quantidade e retirada ou entrega; compras em modo demonstração. | ok / ok / ok |
| 39 | 5 | 1 | `arena` | b5 | Arena Esmeraldina | Jogos, passaporte e desafios no mesmo lugar. | ok / ok / ok |
| 40 | 5 | 2 | `challenges` | b5 | Desafios | Quatro jogos e dois testes de perfil. | ok / ok / ok |
| 41 | 5 | 3 | `guess-lineup` | b5 | Adivinhe a Escalação | Uma partida histórica: a escalação é descoberta camisa a camisa. | ok / ok / ok |
| 42 | 5 | 4 | `guess-shirt` | b2 | Palpite da camisa | Cada camisa é um desafio de palavras, com teclado na tela. | ok / ok / ok |
| 43 | 5 | 5 | `guess-player` | b2 | Adivinhe o Jogador | Pistas pela carreira: clubes, jogos e gols. | ok / ok / ok |
| 44 | 5 | 6 | `who-wore` | b5 | Quem Vestiu o Manto? | Foto desfocada e pistas por tentativa. | ok / ok / ok |
| 45 | 5 | 7 | `who-wore-hit` | b5 | Resposta certa | A foto se revela quando o torcedor acerta. | ok / ok / ok |
| 46 | 5 | 8 | `identity-quiz` | b2 | Identidade Futebolística | Perguntas sobre a sua forma de pensar o futebol. | ok / ok / ok |
| 47 | 5 | 9 | `identity-result` | b2 | Que craque você é? | Perfil de jogador com marcas e atributos. | ok / ok / ok |
| 48 | 5 | 10 | `crowd` | b5 | Time da torcida | A escalação mais votada pela torcida. | ok / ok / ok |
| 49 | 5 | 11 | `pitch` | b5 | Escale seu time | Formação e jogadores no campo. | ok / ok / ok |
| 50 | 5 | 12 | `passport` | b5 | Passaporte Esmeraldino | Registro de presença em cada partida. | ok / ok / ok |
| 51 | 5 | 13 | `trajectory` | b5 | Minha trajetória | Números da vida de torcedor. | ok / ok / ok |
| 52 | 5 | 14 | `ranking` | b5 | Ranking da Torcida | Pontuação acumulada em todos os jogos. | ok / ok / ok |

## Aprovaura

Capturas exibidas por idioma: antes 33, depois 33. Slots no acervo: 34.

| # | Etapa | Pos. | Captura | Bloco antigo | Título | Legenda | Arquivos (pt-BR / en / es) |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 1 | `login` | b5 | Entrar | Login com e-mail e senha, com recuperação de senha. | ok / ok / ok |
| 2 | 1 | 2 | `signup` | b5 | Criar conta | Cadastro rápido com nome, usuário, e-mail e senha. | ok / ok / ok |
| 3 | 1 | 3 | `home` | b5 | Início | Meta diária, ofensiva e atalhos para praticar. | ok / ok / ok |
| 4 | 2 | 1 | `practice` | b1 | Praticar | Matérias em cartões; cada uma abre sua própria trilha de conteúdo. | ok / ok / ok |
| 5 | 2 | 2 | `practice-more` | b1 | Mais matérias | Além das matérias do ENEM, há idiomas, atualidades e redação. | ok / ok / ok |
| 6 | 2 | 3 | `subjects` | b1 | Tópicos de Matemática | A mesma estrutura em outra matéria: filtro de dificuldade e progresso por tópico. | ok / ok / ok |
| 7 | 2 | 4 | `trail` | b1 | Trilha da matéria | Dentro da matéria, temas em sequência, com progresso e filtro por dificuldade. | ok / ok / ok |
| 8 | 2 | 5 | `trail-topics` | b1 | Subtemas | Cada tema se abre em subtemas, cada um com sua barra de progresso. | ok / ok / ok |
| 9 | 2 | 6 | `trail-question` | b1 | Questão | Questões do subtema, com opção de favoritar ou reportar. | ok / ok / ok |
| 10 | 2 | 7 | `current-affairs` | b1 | Atualidades | Áreas dos temas do momento: Brasil, mundo, economia, meio ambiente, ciência, sociedade e saúde. | ok / ok / ok |
| 11 | 2 | 8 | `current-affairs-dossier` | b1 | Dossiê | Texto de contexto sobre um acontecimento, com tempo de leitura. | ok / ok / ok |
| 12 | 2 | 9 | `review-errors` | b1 | Revisar erros | Questões erradas agrupadas por matéria e tópico, para refazer. | ok / ok / ok |
| 13 | 3 | 1 | `mock-build` | b2 | Montagem | Matéria, nível (fácil, médio, difícil ou misto) e quantidade, com o total de questões disponíveis. | ok / ok / ok |
| 14 | 3 | 2 | `mock-build-more` | b2 | Mais matérias | Dá para combinar várias matérias, cada uma com o próprio nível e a própria quantidade. | ok / ok / ok |
| 15 | 3 | 3 | `mock-summary` | b2 | Resumo do simulado | Antes de começar, o app mostra as matérias, a quantidade de questões e o modo prova. | ok / ok / ok |
| 16 | 3 | 4 | `mock-question` | b2 | Durante a prova | Navegação entre questões, com matéria e dificuldade sempre visíveis. | ok / ok / ok |
| 17 | 3 | 5 | `mock-submit` | b2 | Entregar simulado | Confirmação antes de entregar: depois disso as respostas não podem ser trocadas. | ok / ok / ok |
| 18 | 3 | 6 | `mock-result` | b2 | Resultado do simulado | Acertos, erros, Aura ganha e desempenho por matéria e por dificuldade. | ok / ok / ok |
| 19 | 3 | 7 | `mock-review` | b2 | Revisão das questões | Cada questão errada mostra a alternativa correta e a explicação. | ok / ok / ok |
| 20 | 4 | 1 | `essay-list` | b3 | Temas de redação | Temas para praticar a escrita; os já escritos mostram a última nota. | ok / ok / ok |
| 21 | 4 | 2 | `essay-proposal` | b3 | Proposta | O tema vem com a proposta completa, no formato do ENEM, antes de começar a escrever. | ok / ok / ok |
| 22 | 4 | 3 | `essay-editor` | b3 | Editor de redação | Editor com o mínimo de palavras para enviar, menu e acesso à proposta. | ok / ok / ok |
| 23 | 4 | 4 | `essay-submit` | b3 | Envio da redação | Antes de enviar, o app informa o que é compartilhado com a IA e linka a política de privacidade. | ok / ok / ok |
| 24 | 4 | 5 | `essay-correcting` | b3 | Correção em andamento | A correção roda em segundo plano: dá para sair do app e voltar depois para ver o resultado. | ok / ok / ok |
| 25 | 4 | 6 | `essay-score` | b3 | Nota estimada | Nota de 0 a 1000 e as cinco competências, cada uma com sua pontuação. | ok / ok / ok |
| 26 | 4 | 7 | `essay-feedback` | b3 | Devolutiva | Comentário geral, pontos fortes e o que fazer para evoluir. | ok / ok / ok |
| 27 | 5 | 1 | `topics` | b4 | Tópicos | Conteúdo organizado em subtemas, cada um com sua barra de progresso. | ok / ok / ok |
| 28 | 5 | 2 | `map` | b4 | Localize no mapa | Mapa interativo com pergunta e pontos clicáveis. | ok / ok / ok |
| 29 | 5 | 3 | `map-done` | b4 | Conclusão | Resultado da rodada com o mascote do app e a recompensa em Aura. | ok / ok / ok |
| 30 | 6 | 1 | `profile` | b5 | Perfil | Nível, Aura, ofensiva, questões respondidas e taxa de acerto, além do objetivo e das matérias em foco. | ok / ok / ok |
| 31 | 6 | 2 | `level-up` | b5 | Subiu de nível | No fim da atividade: acertos, aproveitamento, Aura ganha e o novo nível. | ok / ok / ok |
| 32 | 6 | 3 | `settings-theme` | b5 | Tema | Aparência automática, clara ou escura. | ok / ok / ok |
| 33 | 6 | 4 | `settings-language` | b5 | Idioma | Português, inglês ou espanhol, independentemente do idioma do aparelho. | ok / ok / ok |

No acervo, fora da narrativa: `essay-themes` (duplica essay-list: mesma lista de temas).

## La Pelve

Capturas exibidas por idioma: antes 15, depois 15. Slots no acervo: 15.

| # | Etapa | Pos. | Captura | Bloco antigo | Título | Legenda | Arquivos (pt-BR / en / es) |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 1 | `login` | b1 | Entrar | Acesso com e-mail e senha, com criação de conta na mesma tela. | ok / ok / ok |
| 2 | 1 | 2 | `signup` | b1 | Criar conta | Cadastro da fisioterapeuta com nome, Crefito, telefone, e-mail e senha. | ok / ok / ok |
| 3 | 1 | 3 | `home` | b1 | Início | Próximos atendimentos, atalhos e visão geral da clínica. | ok / ok / ok |
| 4 | 2 | 1 | `schedule` | b1 | Agenda | Atendimentos por dia, com status e criação rápida. | ok / ok / ok |
| 5 | 2 | 2 | `schedule-new` | b1 | Novo agendamento | Data, horário e paciente para criar um atendimento na agenda. | ok / ok / ok |
| 6 | 3 | 1 | `patients` | b1 | Pacientes | Cadastro e gestão de pacientes em um só lugar. | ok / ok / ok |
| 7 | 3 | 2 | `patient-form` | b1 | Cadastro passo a passo | Anamnese guiada em 11 etapas, com barra de progresso. | ok / ok / ok |
| 8 | 3 | 3 | `patient-anamnesis` | b1 | Anamnese | Queixa principal e história da moléstia atual, com perguntas de sim ou não. | ok / ok / ok |
| 9 | 3 | 4 | `patient-urinary` | b1 | Função urinária | Questionário específico de fisioterapia pélvica, com perguntas diretas. | ok / ok / ok |
| 10 | 3 | 5 | `patient-treatment` | b1 | Plano de tratamento | Diagnóstico fisioterapêutico, objetivo, conduta e frequência sugerida. | ok / ok / ok |
| 11 | 3 | 6 | `patient-detail` | b1 | Ficha do paciente | Dados pessoais e anamnese em abas, com acesso direto à evolução. | ok / ok / ok |
| 12 | 3 | 7 | `evolutions` | b1 | Evoluções | Linha do tempo das evoluções do paciente, com menu para editar ou excluir. | ok / ok / ok |
| 13 | 4 | 1 | `financial-report` | b1 | Relatório financeiro | Total recebido por período, com navegação mensal. | ok / ok / ok |
| 14 | 4 | 2 | `financial-new` | b1 | Registrar cobrança | Paciente, data, valor, status e forma de pagamento do lançamento. | ok / ok / ok |
| 15 | 4 | 3 | `whatsapp` | b1 | WhatsApp (em desenvolvimento) | Área da integração com o WhatsApp da clínica, em desenvolvimento e ainda não disponível. | ok / ok / ok |

## Match Queue

Capturas exibidas por idioma: antes 20, depois 20. Slots no acervo: 20.

| # | Etapa | Pos. | Captura | Bloco antigo | Título | Legenda | Arquivos (pt-BR / en / es) |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 1 | `login` | b3 | Entrar | Login com e-mail e senha, com criação de conta na mesma tela. | ok / ok / ok |
| 2 | 2 | 1 | `teams-explore` | b2 | Times | Explorar equipes, ver convites e gerenciar os próprios times. | ok / ok / ok |
| 3 | 2 | 2 | `team-detail` | b2 | Time | Membros com papéis (dono, gerente, jogador) e convite de novos jogadores. | ok / ok / ok |
| 4 | 3 | 1 | `play` | b2 | Jogar | Plataforma, formação e modo (Champions ou Rivals) antes de buscar. | ok / ok / ok |
| 5 | 3 | 2 | `platforms` | b2 | Plataformas | Escolha em quais plataformas o jogador joga: PC, PlayStation ou Xbox. | ok / ok / ok |
| 6 | 3 | 3 | `lineup` | b2 | Escalação | Formação, overall e química da escalação montada com as cartas do jogador. | ok / ok / ok |
| 7 | 3 | 4 | `queue-search` | b2 | Buscando partida | Cronômetro da busca, com cancelamento ou confirmação de que a partida foi encontrada. | ok / ok / ok |
| 8 | 3 | 5 | `history` | b2 | Histórico | Partidas encontradas e finalizadas, com filtro por período. | ok / ok / ok |
| 9 | 4 | 1 | `central` | b3 | Central | Catálogo e guias de mecânicas do jogo. | ok / ok / ok |
| 10 | 4 | 2 | `clubs` | b3 | Clubes | Clubes do jogo ordenados pelo overall médio, com filtro por gênero. | ok / ok / ok |
| 11 | 4 | 3 | `club-detail` | b3 | Detalhe do clube | Cartas do clube, com busca e filtros por posição. | ok / ok / ok |
| 12 | 4 | 4 | `players` | b3 | Jogadores | Busca por nome e filtros por categoria. | ok / ok / ok |
| 13 | 4 | 5 | `player-detail` | b3 | Detalhe da carta | Atributos, posições alternativas, pé fraco e skills. | ok / ok / ok |
| 14 | 4 | 6 | `playstyles` | b3 | PlayStyles | Habilidades especiais das cartas, organizadas por categoria. | ok / ok / ok |
| 15 | 4 | 7 | `chemistry` | b3 | Chemistry | Explicação de como a química da escalação funciona. | ok / ok / ok |
| 16 | 4 | 8 | `evolutions` | b3 | Evolutions | Como os jogadores evoluem no Ultimate Team. | ok / ok / ok |
| 17 | 4 | 9 | `controls` | b3 | Controles | Guia de dribles com os comandos para PlayStation e Xbox ou PC. | ok / ok / ok |
| 18 | 4 | 10 | `market` | b3 | Mercado | Preço atual por plataforma, com data da última atualização. | ok / ok / ok |
| 19 | 5 | 1 | `account` | b3 | Conta | Aparência, idioma e notificações em um só lugar. | ok / ok / ok |
| 20 | 5 | 2 | `notifications` | b3 | Notificações | Preferências de aviso para partida encontrada e convites de time. | ok / ok / ok |
