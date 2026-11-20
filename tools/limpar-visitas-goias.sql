SELECT ym, country, region, n FROM visits_region_monthly WHERE country = 'BR' AND region = 'GO';
SELECT ym, country, n FROM visits_monthly WHERE country = 'BR';
UPDATE visits_region_monthly SET n = MAX(n - 100, 0) WHERE country = 'BR' AND region = 'GO' AND ym = strftime('%Y-%m', 'now');
UPDATE visits_monthly SET n = MAX(n - 100, 0) WHERE country = 'BR' AND ym = strftime('%Y-%m', 'now');
SELECT ym, country, region, n FROM visits_region_monthly WHERE country = 'BR' AND region = 'GO';
