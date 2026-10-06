-- Estatísticas agregadas de visitas por estado/região (Mês UTC x país x região). Nada além de contadores.
-- Mesma métrica de visits_monthly (no máximo 1 visita por sessão de aba); começa vazia, sem histórico retroativo.
-- Só cria a tabela nova: visits_monthly não é alterada.
CREATE TABLE IF NOT EXISTS visits_region_monthly (
  ym         TEXT    NOT NULL,                 -- 'AAAA-MM' (UTC)
  country    TEXT    NOT NULL,                 -- ISO 3166-1 alfa-2 maiúsculo (nunca 'XX': sem país não há região)
  region     TEXT    NOT NULL,                 -- parte da subdivisão ISO 3166-2 (request.cf.regionCode, ex.: 'GO'); 'XX' = desconhecida
  name       TEXT    NOT NULL DEFAULT '',      -- nome da região informado pela Cloudflare (request.cf.region), só para exibição
  n          INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,                 -- epoch (s) da última contagem
  PRIMARY KEY (ym, country, region),
  CHECK (length(country) = 2),
  CHECK (length(region) BETWEEN 1 AND 3),
  CHECK (length(name) <= 80),
  CHECK (n >= 0)
) WITHOUT ROWID;
