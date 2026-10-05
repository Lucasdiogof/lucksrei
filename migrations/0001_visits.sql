-- Estatísticas agregadas de visitas por país (Mês UTC x país). Nada além de contadores.
-- visitas = no máximo 1 por sessão de aba (decidido no cliente com sessionStorage); não é visitante único.
CREATE TABLE IF NOT EXISTS visits_monthly (
  ym         TEXT    NOT NULL,                 -- 'AAAA-MM' (UTC)
  country    TEXT    NOT NULL,                 -- ISO 3166-1 alfa-2 maiúsculo; 'XX' = desconhecido/Tor
  n          INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,                 -- epoch (s) da última contagem
  PRIMARY KEY (ym, country),
  CHECK (length(country) = 2),
  CHECK (n >= 0)
) WITHOUT ROWID;
