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
      "home": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "calendar": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "club": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "anthem": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "matches": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "standings": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "socio": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "store": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "guess-shirt": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "guess-player": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "identity-quiz": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "identity-result": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "club-home": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "titles": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "board": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "idols": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "squad": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "player": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "transparency": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "songs": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "document": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "partners": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "media": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "tickets": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "ticket-sectors": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "purchase": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "purchased": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "my-tickets": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "ticket": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "member-signup": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "arena": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "challenges": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "crowd": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            590,
            1280
          ]
        }
      },
      "pitch": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            590,
            1280
          ]
        }
      },
      "guess-lineup": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "who-wore": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "who-wore-hit": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "passport": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "trajectory": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ]
        }
      },
      "ranking": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      }
    },
    "blocks": {
      "b2": [
        "home",
        "matches",
        "standings",
        "calendar",
        "socio",
        "store",
        "club",
        "anthem",
        "guess-shirt",
        "guess-player",
        "identity-quiz",
        "identity-result"
      ],
      "b3": [
        "club-home",
        "titles",
        "board",
        "idols",
        "squad",
        "player",
        "transparency",
        "songs",
        "document",
        "partners",
        "media"
      ],
      "b4": [
        "tickets",
        "ticket-sectors",
        "purchase",
        "purchased",
        "my-tickets",
        "ticket",
        "member-signup"
      ],
      "b5": [
        "arena",
        "challenges",
        "crowd",
        "pitch",
        "guess-lineup",
        "who-wore",
        "who-wore-hit",
        "passport",
        "trajectory",
        "ranking"
      ]
    }
  },
  "matchqueue": {
    "dir": "match-queue",
    "slots": {
      "play": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "queue-search": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "teams-explore": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "team-detail": {
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
      "central": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "players": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "player-detail": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "market": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "account": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            738,
            1600
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      }
    },
    "blocks": {
      "b2": [
        "play",
        "queue-search",
        "teams-explore",
        "team-detail"
      ],
      "b3": [
        "central",
        "players",
        "player-detail",
        "market",
        "account"
      ]
    }
  },
  "aprovaura": {
    "dir": "aura",
    "slots": {
      "home": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "practice": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "practice-more": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "en": [
            590,
            1280
          ],
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "trail": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "trail-topics": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ]
        }
      },
      "trail-question": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "mock-build": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "mock-question": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "level-up": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
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
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
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
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "map-done": {
        "locales": [
          "pt-BR",
          "es",
          "en"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ]
        }
      },
      "topics": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "mock-build-more": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "profile": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "essay-proposal": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "essay-correcting": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            590,
            1280
          ],
          "en": [
            590,
            1280
          ],
          "es": [
            590,
            1280
          ]
        }
      },
      "essay-list": {
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
        "practice-more",
        "trail",
        "trail-topics",
        "trail-question"
      ],
      "b2": [
        "mock-build",
        "mock-build-more",
        "mock-question"
      ],
      "b3": [
        "essay-list",
        "essay-proposal",
        "essay-correcting",
        "essay-score"
      ],
      "b4": [
        "map",
        "map-done",
        "topics"
      ],
      "b5": [
        "home",
        "profile",
        "level-up"
      ]
    }
  },
  "lapelve": {
    "dir": "la-pelve",
    "slots": {
      "login": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      },
      "home": {
        "locales": [
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ],
          "en": [
            738,
            1600
          ],
          "es": [
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
          "pt-BR",
          "en",
          "es"
        ],
        "dims": {
          "pt-BR": [
            924,
            2000
          ],
          "en": [
            738,
            1600
          ],
          "es": [
            738,
            1600
          ]
        }
      }
    },
    "blocks": {
      "b1": [
        "login",
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
