/* Lucksrei — manifesto de screenshots localizadas.
 *
 * Arquivo de cada slot por idioma:
 *   /assets/img/<dir>/screens/<locale>/<slot>.webp      (locale: pt-BR | en | es)
 *
 * Para publicar uma versão em outro idioma: coloque o arquivo na pasta correspondente e
 * acrescente o locale em "locales" do slot (e as medidas em "dims", para evitar layout shift).
 * Textos (alt, título, legenda) ficam em assets/i18n/<locale>.js → shots.<projeto>.<slot>.{alt,title,caption}.
 *
 * Regra: um slot só é exibido nos locales listados. Nunca há imagem de outro idioma como fallback.
 * Slots sem "locales" para o idioma atual simplesmente não são renderizados.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LucksreiShots = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var LOCALES = ["pt-BR", "en", "es"];
  var BASE = "/assets/img";
  var DATA = 
{
  "fanhub": {
    "dir": "fan-hub",
    "slots": {
      "art-overview": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ]
        }
      },
      "art-arena": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ]
        }
      },
      "art-lineup": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ]
        }
      },
      "art-quiz": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ]
        }
      },
      "home": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ]
        }
      },
      "calendar": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ]
        }
      },
      "club": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ]
        }
      },
      "anthem": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ]
        }
      }
    },
    "blocks": {
      "b1": [
        "art-arena",
        "art-lineup",
        "art-quiz"
      ],
      "b2": [
        "home",
        "calendar",
        "club",
        "anthem"
      ]
    }
  },
  "matchqueue": {
    "dir": "match-queue",
    "slots": {
      "art-queue": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ]
        }
      },
      "art-teams": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ]
        }
      },
      "art-central": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ]
        }
      },
      "play": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            738,
            1600
          ]
        }
      },
      "queue-search": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            738,
            1600
          ]
        }
      },
      "teams-explore": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            738,
            1600
          ]
        }
      },
      "central": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            738,
            1600
          ]
        }
      },
      "players": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            738,
            1600
          ]
        }
      },
      "player-detail": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            738,
            1600
          ]
        }
      },
      "market": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            738,
            1600
          ]
        }
      }
    },
    "blocks": {
      "b1": [
        "art-teams",
        "art-central"
      ],
      "b2": [
        "play",
        "queue-search",
        "teams-explore"
      ],
      "b3": [
        "central",
        "players",
        "player-detail",
        "market"
      ]
    }
  },
  "aprovaura": {
    "dir": "aura",
    "slots": {
      "mock-review": {
        "locales": ["pt-BR"],
        "dims": { "pt-BR": [590, 1280] }
      },
      "essay-competencies": {
        "locales": ["pt-BR"],
        "dims": { "pt-BR": [590, 1280] }
      },
      "practice": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "quick": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "review": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "geography": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "mock-build": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "mock-summary": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "mock-question": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "mock-result": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "essay-themes": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "essay-submit": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "essay-score": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "essay-feedback": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "map": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "map-done": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "topics": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "home": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "theme-dark": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ]
        }
      },
      "language": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            590,
            1280
          ]
        }
      }
    },
    "blocks": {
      "b1": [
        "practice",
        "quick",
        "review",
        "geography"
      ],
      "b2": [
        "mock-build",
        "mock-summary",
        "mock-question",
        "mock-result"
      ],
      "b3": [
        "essay-themes",
        "essay-submit",
        "essay-score",
        "essay-feedback"
      ],
      "b4": [
        "map",
        "map-done",
        "topics"
      ],
      "b5": [
        "home",
        "theme-dark",
        "language"
      ]
    }
  },
  "lapelve": {
    "dir": "la-pelve",
    "slots": {
      "login": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ]
        }
      },
      "home": {
        "locales": [
          "pt-BR",
          "en"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "schedule": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            738,
            1600
          ]
        }
      },
      "patient-form": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            738,
            1600
          ]
        }
      },
      "financial-report": {
        "locales": [
          "en"
        ],
        "dims": {
          "en": [
            738,
            1600
          ]
        }
      },
      "patients": {
        "locales": [
          "pt-BR"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ]
        }
      }
    },
    "blocks": {
      "b1": [
        "home",
        "schedule",
        "patients",
        "patient-form",
        "financial-report"
      ]
    }
  }
};

  function slotFor(project, slot, locale) {
    var p = DATA[project];
    var s = p && p.slots[slot];
    if (!s || s.locales.indexOf(locale) < 0) return null;
    var d = s.dims[locale] || [0, 0];
    return {
      id: slot,
      locale: locale,
      src: BASE + "/" + p.dir + "/screens/" + locale + "/" + slot + ".webp",
      w: d[0],
      h: d[1],
      altKey: "shots." + project + "." + slot + ".alt",
      titleKey: "shots." + project + "." + slot + ".title",
      captionKey: "shots." + project + "." + slot + ".caption"
    };
  }

  // Só os slots do bloco que existem no idioma pedido.
  function blockFor(project, blockId, locale) {
    var p = DATA[project];
    var ids = (p && p.blocks[blockId]) || [];
    return ids.map(function (id) { return slotFor(project, id, locale); }).filter(Boolean);
  }

  // Modelo { "pt-BR": [{src, alt}], en: [...], es: [...] } (alt resolvido por t(key, null, locale))
  function buildScreenshots(project, blockId, t) {
    var out = {};
    LOCALES.forEach(function (l) {
      out[l] = blockFor(project, blockId, l).map(function (s) {
        return { src: s.src, alt: t ? t(s.altKey, null, l) : s.altKey };
      });
    });
    return out;
  }

  return { LOCALES: LOCALES, DATA: DATA, slotFor: slotFor, blockFor: blockFor, buildScreenshots: buildScreenshots };
});
