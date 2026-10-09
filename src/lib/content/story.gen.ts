// Generated from script/*.tex by scripts/script-compile.ts — edit the script, not this file.
import type { Story } from '../script/compile';

export const STORY: Story = {
  "scenes": [
    {
      "label": "title",
      "title": "Title",
      "act": "Openning",
      "number": "1",
      "step": "title.1",
      "sideTrip": false
    },
    {
      "label": "crowd",
      "title": "The crowd",
      "act": "Openning",
      "number": "2",
      "step": "crowd.a1",
      "sideTrip": false
    },
    {
      "label": "meet",
      "title": "Meeting them",
      "act": "Introduction",
      "number": "3",
      "step": "meet.1",
      "sideTrip": false
    },
    {
      "label": "merit",
      "title": "The merit debate",
      "act": "Introduction",
      "number": "4",
      "step": "merit.1",
      "sideTrip": false
    },
    {
      "label": "rules",
      "title": "The rules",
      "act": "The Fair Game",
      "number": "5",
      "step": "rules.1",
      "sideTrip": false
    },
    {
      "label": "round1",
      "title": "Round one",
      "act": "The Fair Game",
      "number": "6",
      "step": "round1.1",
      "sideTrip": false
    },
    {
      "label": "round2",
      "title": "Round two",
      "act": "The Fair Game",
      "number": "7",
      "step": "round2.1",
      "sideTrip": false
    },
    {
      "label": "round3",
      "title": "Round three",
      "act": "The Fair Game",
      "number": "8",
      "step": "round3.1",
      "sideTrip": false
    },
    {
      "label": "dare",
      "title": "The challenge",
      "act": "The Fair Game",
      "number": "9",
      "step": "dare.1",
      "sideTrip": false
    },
    {
      "label": "room",
      "title": "The crowd arrives",
      "act": "More players",
      "number": "10",
      "step": "room.1",
      "sideTrip": false
    },
    {
      "label": "rule",
      "title": "The rule",
      "act": "More players",
      "number": "11",
      "step": "rule.1",
      "sideTrip": false
    },
    {
      "label": "offer",
      "title": "The joke offer",
      "act": "More players",
      "number": "12",
      "step": "offer.1",
      "sideTrip": false
    },
    {
      "label": "joke",
      "title": "The joke",
      "act": "More players",
      "number": "13",
      "step": "joke.1",
      "sideTrip": false
    },
    {
      "label": "guess",
      "title": "Your guess",
      "act": "Your guess",
      "number": "14",
      "step": "guess.1",
      "sideTrip": false
    },
    {
      "label": "run",
      "title": "The run",
      "act": "The run",
      "number": "15",
      "step": "run.1",
      "sideTrip": false
    },
    {
      "label": "why",
      "title": "So why did they win?",
      "act": "The run",
      "number": "16",
      "step": "why.1",
      "sideTrip": false
    },
    {
      "label": "sort",
      "title": "Line them up",
      "act": "Line them up",
      "number": "17",
      "step": "sort.1",
      "sideTrip": false
    },
    {
      "label": "gini",
      "title": "Measure the room",
      "act": "Measure the room",
      "number": "18",
      "step": "gini.1",
      "sideTrip": false
    },
    {
      "label": "count",
      "title": "How many still count?",
      "act": "How many still count?",
      "number": "19",
      "step": "count.1",
      "sideTrip": false
    },
    {
      "label": "turnover",
      "title": "Is anything moving?",
      "act": "Is anything moving?",
      "number": "20",
      "step": "turnover.1",
      "sideTrip": false
    },
    {
      "label": "end",
      "title": "Where it ends",
      "act": "Where it ends",
      "number": "21",
      "step": "end.1",
      "sideTrip": false
    },
    {
      "label": "dial",
      "title": "Your hand on the dial",
      "act": "Your hand on the dial",
      "number": "22",
      "step": "dial.1",
      "sideTrip": false
    },
    {
      "label": "stop",
      "title": "Now you try to stop it",
      "act": "Now you try to stop it",
      "number": "23",
      "step": "stop.1",
      "sideTrip": false
    },
    {
      "label": "levy",
      "title": "Put the levy in the rules",
      "act": "Put the levy in the rules",
      "number": "24",
      "step": "levy.1",
      "sideTrip": false
    },
    {
      "label": "match",
      "title": "Trade and return together",
      "act": "Trade and return together",
      "number": "25",
      "step": "match.1",
      "sideTrip": false
    },
    {
      "label": "map",
      "title": "The outcome map",
      "act": "The outcome map",
      "number": "26",
      "step": "map.1",
      "sideTrip": false
    },
    {
      "label": "verdict",
      "title": "The verdict",
      "act": "The verdict",
      "number": "27",
      "step": "verdict.1",
      "sideTrip": false
    },
    {
      "label": "sandbox",
      "title": "The machine is yours",
      "act": "The machine is yours",
      "number": "28",
      "step": "sandbox.1",
      "sideTrip": false
    },
    {
      "label": "human",
      "title": "The spherical human",
      "act": "The spherical human",
      "number": "B1",
      "step": "human.1",
      "sideTrip": true
    },
    {
      "label": "workshop",
      "title": "All the dials",
      "act": "All the dials",
      "number": "B2",
      "step": "",
      "sideTrip": true
    }
  ],
  "timing": {
    "beat": 0.6,
    "perword": 0.4,
    "minread": 1.5,
    "nudge": 4
  },
  "steps": [
    {
      "id": "title.1",
      "at": "script.tex:20",
      "scene": "title",
      "act": true,
      "who": "ledger",
      "manner": [
        "teletype"
      ],
      "key": "title_1",
      "cues": [],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "title.a1",
      "at": "script.tex:29",
      "scene": "title",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "crowd",
          "args": [
            "idle"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "title.a2",
      "at": "script.tex:31",
      "scene": "title",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "reveal",
          "args": [
            "merit"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "title.a3",
      "at": "script.tex:33",
      "scene": "title",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "reveal",
          "args": [
            "or"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "title.a4",
      "at": "script.tex:35",
      "scene": "title",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "reveal",
          "args": [
            "math"
          ]
        }
      ],
      "choices": [],
      "body": [
        "title_a4_1",
        "title_a4_2",
        "title_a4_3",
        "title_a4_4",
        "title_a4_5",
        "title_a4_6",
        "title_a4_7",
        "title_a4_8"
      ],
      "bodyHolds": [
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "bodyAnswer": 6,
      "wait": "auto"
    },
    {
      "id": "crowd.a1",
      "at": "script.tex:71",
      "scene": "crowd",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "crowd",
          "args": [
            "payout"
          ]
        },
        {
          "name": "reveal",
          "args": [
            "mark"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "crowd.a2",
      "at": "script.tex:89",
      "scene": "crowd",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "crowd",
          "args": [
            "two"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "meet.1",
      "at": "script.tex:103",
      "scene": "meet",
      "act": true,
      "who": "red",
      "manner": [
        "aside",
        "brief"
      ],
      "variants": {
        "ordered": true,
        "keys": [
          "meet_1_1",
          "meet_1_2",
          "meet_1_3",
          "meet_1_4",
          "meet_1_5",
          "meet_1_6",
          "meet_1_7",
          "meet_1_8",
          "meet_1_9"
        ]
      },
      "cues": [
        {
          "name": "hide",
          "args": [
            "headline"
          ]
        },
        {
          "name": "meet",
          "args": [
            "red"
          ]
        }
      ],
      "choices": [],
      "wait": "action",
      "together": [
        {
          "id": "meet.2",
          "at": "script.tex:119",
          "scene": "meet",
          "act": false,
          "who": "blue",
          "manner": [
            "aside",
            "brief"
          ],
          "variants": {
            "ordered": true,
            "keys": [
              "meet_2_1",
              "meet_2_2",
              "meet_2_3",
              "meet_2_4",
              "meet_2_5",
              "meet_2_6",
              "meet_2_7",
              "meet_2_8",
              "meet_2_9"
            ]
          },
          "cues": [
            {
              "name": "meet",
              "args": [
                "blue"
              ]
            }
          ],
          "choices": [],
          "wait": "action"
        }
      ],
      "reactions": [
        {
          "cond": {
            "kind": "on",
            "name": "met-red"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "aside",
                "flow"
              ],
              "key": "meet_3"
            }
          ]
        },
        {
          "cond": {
            "kind": "on",
            "name": "met-blue"
          },
          "bubbles": [
            {
              "who": "blue",
              "manner": [
                "aside",
                "flow",
                "proud"
              ],
              "key": "meet_4"
            }
          ]
        }
      ]
    },
    {
      "id": "meet.5",
      "at": "script.tex:141",
      "scene": "meet",
      "act": false,
      "who": "red",
      "manner": [
        "aside",
        "brief"
      ],
      "key": "meet_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.1",
      "at": "script.tex:155",
      "scene": "merit",
      "act": false,
      "who": "blue",
      "manner": [
        "sure"
      ],
      "key": "merit_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.2",
      "at": "script.tex:157",
      "scene": "merit",
      "act": false,
      "who": "red",
      "manner": [
        "glad"
      ],
      "key": "merit_2",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.3",
      "at": "script.tex:159",
      "scene": "merit",
      "act": false,
      "who": "blue",
      "manner": [
        "proud"
      ],
      "key": "merit_3",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.4",
      "at": "script.tex:161",
      "scene": "merit",
      "act": false,
      "who": "red",
      "manner": [
        "calm"
      ],
      "key": "merit_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.5",
      "at": "script.tex:163",
      "scene": "merit",
      "act": false,
      "who": "blue",
      "manner": [
        "smug"
      ],
      "key": "merit_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.6",
      "at": "script.tex:165",
      "scene": "merit",
      "act": false,
      "who": "red",
      "manner": [
        "tired"
      ],
      "key": "merit_6",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.7",
      "at": "script.tex:167",
      "scene": "merit",
      "act": false,
      "who": "blue",
      "manner": [
        "smug"
      ],
      "key": "merit_7",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.8",
      "at": "script.tex:169",
      "scene": "merit",
      "act": false,
      "who": "red",
      "manner": [
        "sure"
      ],
      "key": "merit_8",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.9",
      "at": "script.tex:171",
      "scene": "merit",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "annoyed"
      ],
      "key": "merit_9",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "merit.10",
      "at": "script.tex:174",
      "scene": "merit",
      "act": false,
      "who": "red",
      "manner": [
        "flow",
        "sure"
      ],
      "key": "merit_10",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "merit.11",
      "at": "script.tex:176",
      "scene": "merit",
      "act": false,
      "who": "blue",
      "manner": [
        "surprised"
      ],
      "key": "merit_11",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "rules.1",
      "at": "script.tex:192",
      "scene": "rules",
      "act": true,
      "who": "red",
      "manner": [
        "amused"
      ],
      "key": "rules_1",
      "cues": [
        {
          "name": "reveal",
          "args": [
            "coins"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "rules.2",
      "at": "script.tex:197",
      "scene": "rules",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "curious"
      ],
      "key": "rules_2",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "rules.3",
      "at": "script.tex:201",
      "scene": "rules",
      "act": false,
      "who": "red",
      "manner": [
        "flow",
        "calm"
      ],
      "key": "rules_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "rules.4",
      "at": "script.tex:205",
      "scene": "rules",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "annoyed"
      ],
      "key": "rules_4",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "rules.5",
      "at": "script.tex:210",
      "scene": "rules",
      "act": false,
      "who": "red",
      "manner": [
        "flow",
        "amused"
      ],
      "key": "rules_5",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "rules.a1",
      "at": "script.tex:217",
      "scene": "rules",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "hide",
          "args": [
            "words"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "rules.6",
      "at": "script.tex:219",
      "scene": "rules",
      "act": false,
      "who": "blue",
      "manner": [
        "aside",
        "annoyed"
      ],
      "key": "rules_6",
      "cues": [
        {
          "name": "equalize",
          "args": []
        },
        {
          "name": "expect",
          "args": [
            "blue=8, red=8"
          ]
        }
      ],
      "choices": [],
      "wait": "action",
      "reactions": [
        {
          "cond": {
            "kind": "on",
            "name": "first-move"
          },
          "bubbles": [
            {
              "who": "blue",
              "manner": [
                "flow",
                "surprised"
              ],
              "key": "rules_7"
            }
          ]
        },
        {
          "cond": {
            "kind": "on",
            "name": "blue-reaches-eleven"
          },
          "bubbles": [
            {
              "who": "blue",
              "manner": [
                "flow",
                "sad"
              ],
              "key": "rules_8"
            }
          ]
        },
        {
          "cond": {
            "kind": "on",
            "name": "red-above-eight"
          },
          "bubbles": [
            {
              "who": "blue",
              "manner": [
                "flow",
                "worried"
              ],
              "key": "rules_9"
            },
            {
              "who": "red",
              "manner": [
                "flow",
                "amused"
              ],
              "key": "rules_10"
            }
          ]
        }
      ]
    },
    {
      "id": "rules.11",
      "at": "script.tex:243",
      "scene": "rules",
      "act": false,
      "who": "red",
      "manner": [
        "flow",
        "glad"
      ],
      "key": "rules_11",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round1.1",
      "at": "script.tex:258",
      "scene": "round1",
      "act": false,
      "who": "red",
      "manner": [
        "calm"
      ],
      "key": "round1_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "round1.2",
      "at": "script.tex:260",
      "scene": "round1",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "sure"
      ],
      "key": "round1_2",
      "cues": [
        {
          "name": "stake",
          "args": [
            "4"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round1.3",
      "at": "script.tex:266",
      "scene": "round1",
      "act": false,
      "who": "red",
      "manner": [
        "calm",
        "flow"
      ],
      "key": "round1_3",
      "cues": [
        {
          "name": "reveal",
          "args": [
            "coin"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round1.4",
      "at": "script.tex:270",
      "scene": "round1",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "round1_4",
      "cues": [
        {
          "name": "flip",
          "args": [
            "red"
          ]
        },
        {
          "name": "expect",
          "args": [
            "blue=4, red=12"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round1.5",
      "at": "script.tex:279",
      "scene": "round1",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "round1_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "round1.6",
      "at": "script.tex:290",
      "scene": "round1",
      "act": false,
      "who": "blue",
      "manner": [
        "aside",
        "flow",
        "sad"
      ],
      "key": "round1_6",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round2.1",
      "at": "script.tex:294",
      "scene": "round2",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "worried"
      ],
      "key": "round2_1",
      "cues": [
        {
          "name": "hide",
          "args": [
            "coin"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round2.2",
      "at": "script.tex:299",
      "scene": "round2",
      "act": false,
      "who": "red",
      "manner": [
        "calm"
      ],
      "key": "round2_2",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "round2.3",
      "at": "script.tex:301",
      "scene": "round2",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "surprised"
      ],
      "key": "round2_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round2.4",
      "at": "script.tex:303",
      "scene": "round2",
      "act": false,
      "who": "red",
      "manner": [
        "sure"
      ],
      "key": "round2_4",
      "cues": [
        {
          "name": "stake",
          "args": [
            "2"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "round2.5",
      "at": "script.tex:308",
      "scene": "round2",
      "act": false,
      "who": "blue",
      "manner": [
        "curious"
      ],
      "key": "round2_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "round2.6",
      "at": "script.tex:310",
      "scene": "round2",
      "act": false,
      "who": "red",
      "manner": [
        "flow",
        "glad"
      ],
      "key": "round2_6",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round2.7",
      "at": "script.tex:313",
      "scene": "round2",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "sure"
      ],
      "key": "round2_7",
      "cues": [
        {
          "name": "reveal",
          "args": [
            "coin"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round2.a1",
      "at": "script.tex:323",
      "scene": "round2",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "flip",
          "args": [
            "blue"
          ]
        },
        {
          "name": "expect",
          "args": [
            "blue=6, red=10"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "round3.1",
      "at": "script.tex:330",
      "scene": "round3",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "round3_1",
      "cues": [
        {
          "name": "stake",
          "args": [
            "3"
          ]
        },
        {
          "name": "reveal",
          "args": [
            "coin"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round3.2",
      "at": "script.tex:337",
      "scene": "round3",
      "act": false,
      "who": "blue",
      "manner": [
        "brief",
        "flow"
      ],
      "key": "round3_2",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round3.a1",
      "at": "script.tex:342",
      "scene": "round3",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "flip",
          "args": [
            "blue"
          ]
        },
        {
          "name": "expect",
          "args": [
            "blue=9, red=7"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "round3.3",
      "at": "script.tex:345",
      "scene": "round3",
      "act": false,
      "who": "blue",
      "manner": [
        "aside",
        "flow",
        "smug"
      ],
      "key": "round3_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.1",
      "at": "script.tex:351",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "aside",
        "flow",
        "smug"
      ],
      "key": "dare_1",
      "cues": [
        {
          "name": "hide",
          "args": [
            "coin"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.2",
      "at": "script.tex:356",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "tired"
      ],
      "key": "dare_2",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.3",
      "at": "script.tex:358",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [
        "flow",
        "curious"
      ],
      "key": "dare_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.4",
      "at": "script.tex:361",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "sure"
      ],
      "key": "dare_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.5",
      "at": "script.tex:365",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [
        "amused"
      ],
      "key": "dare_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.6",
      "at": "script.tex:368",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "sure"
      ],
      "key": "dare_6",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.7",
      "at": "script.tex:372",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [
        "curious"
      ],
      "key": "dare_7",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.8",
      "at": "script.tex:374",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "annoyed"
      ],
      "key": "dare_8",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.9",
      "at": "script.tex:377",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [
        "calm"
      ],
      "key": "dare_9",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.10",
      "at": "script.tex:380",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "smug"
      ],
      "key": "dare_10",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.11",
      "at": "script.tex:383",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [
        "sure"
      ],
      "key": "dare_11",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.12",
      "at": "script.tex:385",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "smug"
      ],
      "key": "dare_12",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.13",
      "at": "script.tex:387",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [
        "sure"
      ],
      "key": "dare_13",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.14",
      "at": "script.tex:389",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "smug"
      ],
      "key": "dare_14",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.15",
      "at": "script.tex:392",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [
        "flow",
        "sure"
      ],
      "key": "dare_15",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.16",
      "at": "script.tex:395",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "dare_16",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "room.1",
      "at": "script.tex:407",
      "scene": "room",
      "act": true,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "room_1",
      "cues": [
        {
          "name": "crowd",
          "args": [
            "room"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "room.2",
      "at": "script.tex:413",
      "scene": "room",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "room_2",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "rule.1",
      "at": "script.tex:423",
      "scene": "rule",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "rule_1",
      "cues": [
        {
          "name": "learn",
          "args": [
            "rule",
            "0"
          ]
        },
        {
          "name": "pairs",
          "opt": "pick",
          "args": [
            "1"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "rule.2",
      "at": "script.tex:429",
      "scene": "rule",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "rule_2",
      "cues": [
        {
          "name": "learn",
          "args": [
            "rule",
            "1"
          ]
        },
        {
          "name": "pairs",
          "opt": "stake",
          "args": [
            "1"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "rule.3",
      "at": "script.tex:433",
      "scene": "rule",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "rule_3",
      "cues": [
        {
          "name": "learn",
          "args": [
            "rule",
            "2"
          ]
        },
        {
          "name": "pairs",
          "opt": "flip",
          "args": [
            "1"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "rule.4",
      "at": "script.tex:438",
      "scene": "rule",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "rule_4",
      "cues": [
        {
          "name": "learn",
          "args": [
            "rule",
            "3"
          ]
        },
        {
          "name": "pairs",
          "args": [
            "3"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "rule.5",
      "at": "script.tex:449",
      "scene": "rule",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "sure"
      ],
      "key": "rule_5",
      "cues": [
        {
          "name": "learn",
          "args": [
            "rule",
            "4"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "offer.1",
      "at": "script.tex:456",
      "scene": "offer",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "sure"
      ],
      "key": "offer_1",
      "cues": [
        {
          "name": "hide",
          "args": [
            "card:rule"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "offer.2",
      "at": "script.tex:460",
      "scene": "offer",
      "act": false,
      "who": "red",
      "manner": [
        "aside",
        "amused"
      ],
      "key": "offer_2",
      "cues": [],
      "choices": [
        {
          "key": "offer_2_choice_1",
          "target": "joke=yes"
        },
        {
          "key": "offer_2_choice_2",
          "target": "joke=no"
        }
      ],
      "wait": "action"
    },
    {
      "id": "joke.1",
      "at": "script.tex:472",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow",
        "amused"
      ],
      "key": "joke_1",
      "cues": [
        {
          "name": "image",
          "args": [
            "introduction"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "joke.2",
      "at": "script.tex:476",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_2",
      "cues": [
        {
          "name": "image",
          "args": [
            "darwin"
          ]
        },
        {
          "name": "image",
          "args": [
            "chemist"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "joke.3",
      "at": "script.tex:481",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_3",
      "cues": [
        {
          "name": "image",
          "args": [
            "silence"
          ]
        },
        {
          "name": "image",
          "args": [
            "cow-looks"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "joke.4",
      "at": "script.tex:486",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_4",
      "cues": [
        {
          "name": "image",
          "args": [
            "cow-moos"
          ]
        },
        {
          "name": "image",
          "args": [
            "scratch"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "joke.5",
      "at": "script.tex:491",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_5",
      "cues": [
        {
          "name": "image",
          "args": [
            "physicist"
          ]
        },
        {
          "name": "image",
          "args": [
            "spherical"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "joke.6",
      "at": "script.tex:496",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_6",
      "cues": [
        {
          "name": "image",
          "args": [
            "vacuum"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "joke.7",
      "at": "script.tex:500",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_7",
      "cues": [
        {
          "name": "image",
          "args": [
            "football"
          ]
        }
      ],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "joke.8",
      "at": "script.tex:505",
      "scene": "joke",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "amused"
      ],
      "key": "joke_8",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "joke.9",
      "at": "script.tex:508",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow",
        "calm"
      ],
      "key": "joke_9",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "joke.10",
      "at": "script.tex:512",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "joke_10",
      "cues": [],
      "choices": [
        {
          "key": "joke_10_choice_1",
          "target": "human"
        },
        {
          "key": "joke_10_choice_2",
          "target": ""
        }
      ],
      "wait": "reader"
    },
    {
      "id": "guess.1",
      "at": "script.tex:527",
      "scene": "guess",
      "act": true,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "guess_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "guess.2",
      "at": "script.tex:530",
      "scene": "guess",
      "act": false,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "guess_2",
      "cues": [
        {
          "name": "reveal",
          "args": [
            "card:rule"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "guess.3",
      "at": "script.tex:534",
      "scene": "guess",
      "act": false,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "guess_3",
      "cues": [],
      "choices": [
        {
          "key": "guess_3_choice_1",
          "target": "prediction=equal"
        },
        {
          "key": "guess_3_choice_2",
          "target": "prediction=spread"
        },
        {
          "key": "guess_3_choice_3",
          "target": "prediction=split"
        },
        {
          "key": "guess_3_choice_4",
          "target": "prediction=giant"
        }
      ],
      "wait": "action"
    },
    {
      "id": "guess.4",
      "at": "script.tex:545",
      "scene": "guess",
      "act": false,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "guess_4",
      "cues": [
        {
          "name": "hide",
          "args": [
            "card:rule"
          ]
        }
      ],
      "choices": [
        {
          "key": "guess_4_choice_1",
          "target": "bet=coffee"
        },
        {
          "key": "guess_4_choice_2",
          "target": "bet=lunch"
        },
        {
          "key": "guess_4_choice_3",
          "target": "bet=vacation"
        },
        {
          "key": "guess_4_choice_4",
          "target": "bet=percent"
        }
      ],
      "wait": "action"
    },
    {
      "id": "guess.w1",
      "at": "script.tex:557",
      "scene": "guess",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [],
      "choices": [],
      "wait": "when",
      "groups": [
        {
          "cond": {
            "kind": "when",
            "name": "bet",
            "value": "coffee"
          },
          "bubbles": [
            {
              "who": "blue",
              "manner": [
                "aside",
                "flow",
                "amused"
              ],
              "key": "guess_5"
            }
          ]
        },
        {
          "cond": {
            "kind": "when",
            "name": "bet",
            "value": "lunch"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "aside",
                "flow",
                "glad"
              ],
              "key": "guess_6"
            }
          ]
        },
        {
          "cond": {
            "kind": "when",
            "name": "bet",
            "value": "vacation"
          },
          "bubbles": [
            {
              "who": "blue",
              "manner": [
                "aside",
                "flow",
                "surprised"
              ],
              "key": "guess_7"
            }
          ]
        },
        {
          "cond": {
            "kind": "when",
            "name": "bet",
            "value": "percent"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "aside",
                "flow",
                "worried"
              ],
              "key": "guess_8"
            }
          ]
        }
      ]
    },
    {
      "id": "run.1",
      "at": "script.tex:589",
      "scene": "run",
      "act": true,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "run_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "run.a1",
      "at": "script.tex:593",
      "scene": "run",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "run",
          "args": []
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "run.w1",
      "at": "script.tex:602",
      "scene": "run",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [],
      "choices": [],
      "wait": "when",
      "groups": [
        {
          "cond": {
            "kind": "when",
            "name": "winner",
            "value": "other"
          },
          "bubbles": [
            {
              "who": "blue",
              "manner": [
                "flow",
                "curious"
              ],
              "key": "run_2"
            },
            {
              "who": "red",
              "manner": [
                "flow",
                "calm"
              ],
              "key": "run_3"
            },
            {
              "who": "blue",
              "manner": [
                "flow"
              ],
              "key": "run_4"
            },
            {
              "who": "red",
              "manner": [
                "flow"
              ],
              "key": "run_5"
            },
            {
              "who": "red",
              "manner": [
                "flow",
                "sure"
              ],
              "key": "run_6"
            }
          ]
        },
        {
          "cond": {
            "kind": "when",
            "name": "winner",
            "value": "blue"
          },
          "bubbles": [
            {
              "who": "blue",
              "manner": [
                "flow",
                "proud"
              ],
              "key": "run_7"
            },
            {
              "who": "red",
              "manner": [
                "flow",
                "amused"
              ],
              "key": "run_8"
            }
          ]
        },
        {
          "cond": {
            "kind": "when",
            "name": "winner",
            "value": "red"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "flow",
                "amused"
              ],
              "key": "run_9"
            },
            {
              "who": "blue",
              "manner": [
                "flow",
                "annoyed"
              ],
              "key": "run_10"
            }
          ]
        }
      ]
    },
    {
      "id": "run.11",
      "at": "script.tex:642",
      "scene": "run",
      "act": false,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "run_11",
      "cues": [],
      "choices": [
        {
          "key": "run_11_choice_1",
          "target": "\\run"
        },
        {
          "key": "run_11_choice_2",
          "target": ""
        }
      ],
      "wait": "reader"
    },
    {
      "id": "why.1",
      "at": "script.tex:653",
      "scene": "why",
      "act": false,
      "who": "blue",
      "manner": [
        "smug"
      ],
      "key": "why_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "why.w1",
      "at": "script.tex:656",
      "scene": "why",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [],
      "choices": [],
      "wait": "when",
      "groups": [
        {
          "cond": {
            "kind": "when",
            "name": "runs",
            "value": "one"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "calm"
              ],
              "key": "why_2"
            }
          ]
        },
        {
          "cond": {
            "kind": "when",
            "name": "runs",
            "value": "several"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "amused"
              ],
              "key": "why_3"
            }
          ]
        }
      ]
    },
    {
      "id": "why.4",
      "at": "script.tex:670",
      "scene": "why",
      "act": false,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "why_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sort.1",
      "at": "script.tex:686",
      "scene": "sort",
      "act": true,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "sort_1",
      "cues": [],
      "choices": [
        {
          "key": "sort_1_choice_1",
          "target": ""
        }
      ],
      "wait": "reader"
    },
    {
      "id": "sort.a1",
      "at": "script.tex:691",
      "scene": "sort",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "arrange",
          "args": [
            "piles"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "sort.2",
      "at": "script.tex:693",
      "scene": "sort",
      "act": false,
      "who": "blue",
      "manner": [
        "sure"
      ],
      "key": "sort_2",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sort.3",
      "at": "script.tex:697",
      "scene": "sort",
      "act": false,
      "who": "red",
      "manner": [
        "calm"
      ],
      "key": "sort_3",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sort.4",
      "at": "script.tex:700",
      "scene": "sort",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "curious"
      ],
      "key": "sort_4",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "sort.5",
      "at": "script.tex:703",
      "scene": "sort",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "sort_5",
      "cues": [],
      "choices": [],
      "vals": [
        "count"
      ],
      "wait": "chat"
    },
    {
      "id": "sort.6",
      "at": "script.tex:708",
      "scene": "sort",
      "act": false,
      "who": "blue",
      "manner": [
        "annoyed"
      ],
      "key": "sort_6",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sort.7",
      "at": "script.tex:712",
      "scene": "sort",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "sort_7",
      "cues": [],
      "choices": [
        {
          "key": "sort_7_choice_1",
          "target": ""
        }
      ],
      "wait": "reader"
    },
    {
      "id": "sort.a2",
      "at": "script.tex:716",
      "scene": "sort",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "arrange",
          "args": [
            "ruler"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "sort.8",
      "at": "script.tex:718",
      "scene": "sort",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "sort_8",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sort.9",
      "at": "script.tex:722",
      "scene": "sort",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "surprised"
      ],
      "key": "sort_9",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "sort.10",
      "at": "script.tex:726",
      "scene": "sort",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "sort_10",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sort.11",
      "at": "script.tex:730",
      "scene": "sort",
      "act": false,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "sort_11",
      "cues": [],
      "choices": [
        {
          "key": "sort_11_choice_1",
          "target": ""
        }
      ],
      "wait": "reader"
    },
    {
      "id": "sort.a3",
      "at": "script.tex:735",
      "scene": "sort",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "arrange",
          "args": [
            "free"
          ]
        },
        {
          "name": "card",
          "args": [
            "histogram"
          ]
        },
        {
          "name": "pin",
          "args": [
            "histogram"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "gini.1",
      "at": "script.tex:748",
      "scene": "gini",
      "act": true,
      "who": "blue",
      "manner": [
        "curious"
      ],
      "key": "gini_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "gini.2",
      "at": "script.tex:752",
      "scene": "gini",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "gini_2",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "line"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "gini.3",
      "at": "script.tex:756",
      "scene": "gini",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "gini_3",
      "cues": [
        {
          "name": "reveal",
          "args": [
            "curve"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "gini.4",
      "at": "script.tex:761",
      "scene": "gini",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "gini_4",
      "cues": [
        {
          "name": "reveal",
          "args": [
            "diagonal"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "gini.5",
      "at": "script.tex:766",
      "scene": "gini",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "gini_5",
      "cues": [
        {
          "name": "reveal",
          "args": [
            "gap"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "gini.6",
      "at": "script.tex:771",
      "scene": "gini",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "gini_6",
      "cues": [],
      "choices": [],
      "vals": [
        "gini"
      ],
      "wait": "reader"
    },
    {
      "id": "gini.7",
      "at": "script.tex:774",
      "scene": "gini",
      "act": false,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "gini_7",
      "cues": [],
      "choices": [
        {
          "key": "gini_7_choice_1",
          "target": "\\reveal{toy:gini}"
        },
        {
          "key": "gini_7_choice_2",
          "target": ""
        }
      ],
      "wait": "reader"
    },
    {
      "id": "gini.a1",
      "at": "script.tex:780",
      "scene": "gini",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "arrange",
          "args": [
            "free"
          ]
        },
        {
          "name": "hide",
          "args": [
            "lorenz"
          ]
        },
        {
          "name": "card",
          "args": [
            "gini"
          ]
        },
        {
          "name": "pin",
          "args": [
            "gini"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "count.1",
      "at": "script.tex:797",
      "scene": "count",
      "act": true,
      "who": "blue",
      "manner": [
        "sure"
      ],
      "key": "count_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "count.2",
      "at": "script.tex:801",
      "scene": "count",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "count_2",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "equal"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "count.3",
      "at": "script.tex:806",
      "scene": "count",
      "act": false,
      "who": "red",
      "manner": [
        "flow",
        "sad"
      ],
      "key": "count_3",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "zero"
          ]
        }
      ],
      "choices": [],
      "vals": [
        "count"
      ],
      "wait": "chat"
    },
    {
      "id": "count.4",
      "at": "script.tex:812",
      "scene": "count",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "count_4",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "double"
          ]
        }
      ],
      "choices": [],
      "vals": [
        "count"
      ],
      "wait": "reader"
    },
    {
      "id": "count.5",
      "at": "script.tex:817",
      "scene": "count",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "count_5",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "half"
          ]
        }
      ],
      "choices": [],
      "vals": [
        "count"
      ],
      "wait": "reader"
    },
    {
      "id": "count.6",
      "at": "script.tex:822",
      "scene": "count",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "count_6",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "one"
          ]
        }
      ],
      "choices": [],
      "vals": [
        "count"
      ],
      "wait": "reader"
    },
    {
      "id": "count.7",
      "at": "script.tex:827",
      "scene": "count",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "count_7",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "free"
          ]
        }
      ],
      "choices": [],
      "vals": [
        "count"
      ],
      "wait": "reader"
    },
    {
      "id": "count.8",
      "at": "script.tex:834",
      "scene": "count",
      "act": false,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "count_8",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "four"
          ]
        }
      ],
      "choices": [
        {
          "key": "count_8_choice_1",
          "target": ""
        }
      ],
      "wait": "reader",
      "beside": {
        "who": "red",
        "manner": [
          "aside",
          "interrupts"
        ],
        "key": "count_9"
      }
    },
    {
      "id": "count.10",
      "at": "script.tex:845",
      "scene": "count",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "count_10",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "free"
          ]
        },
        {
          "name": "card",
          "args": [
            "participants"
          ]
        },
        {
          "name": "pin",
          "args": [
            "participants"
          ]
        }
      ],
      "choices": [],
      "vals": [
        "count"
      ],
      "wait": "reader"
    },
    {
      "id": "turnover.1",
      "at": "script.tex:862",
      "scene": "turnover",
      "act": true,
      "who": "blue",
      "manner": [
        "sure"
      ],
      "key": "turnover_1",
      "cues": [],
      "choices": [],
      "vals": [
        "trades"
      ],
      "wait": "reader"
    },
    {
      "id": "turnover.2",
      "at": "script.tex:866",
      "scene": "turnover",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "turnover_2",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "turnover"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "turnover.3",
      "at": "script.tex:870",
      "scene": "turnover",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "turnover_3",
      "cues": [],
      "choices": [],
      "vals": [
        "early"
      ],
      "wait": "reader"
    },
    {
      "id": "turnover.4",
      "at": "script.tex:873",
      "scene": "turnover",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "turnover_4",
      "cues": [],
      "choices": [],
      "vals": [
        "late"
      ],
      "wait": "reader"
    },
    {
      "id": "turnover.5",
      "at": "script.tex:877",
      "scene": "turnover",
      "act": false,
      "who": "blue",
      "manner": [
        "worried"
      ],
      "key": "turnover_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "turnover.a1",
      "at": "script.tex:881",
      "scene": "turnover",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [
        {
          "name": "arrange",
          "args": [
            "free"
          ]
        },
        {
          "name": "card",
          "args": [
            "turnover"
          ]
        },
        {
          "name": "pin",
          "args": [
            "turnover"
          ]
        }
      ],
      "choices": [],
      "wait": "auto"
    },
    {
      "id": "end.1",
      "at": "script.tex:895",
      "scene": "end",
      "act": true,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "end_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "end.2",
      "at": "script.tex:899",
      "scene": "end",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "end_2",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "end.3",
      "at": "script.tex:903",
      "scene": "end",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "curious"
      ],
      "key": "end_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "end.4",
      "at": "script.tex:906",
      "scene": "end",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "end_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "end.5",
      "at": "script.tex:910",
      "scene": "end",
      "act": false,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "end_5",
      "cues": [
        {
          "name": "card",
          "args": [
            "limit"
          ]
        }
      ],
      "choices": [
        {
          "key": "end_5_choice_1",
          "target": "\\run[longer]"
        },
        {
          "key": "end_5_choice_2",
          "target": ""
        }
      ],
      "wait": "reader"
    },
    {
      "id": "dial.1",
      "at": "script.tex:926",
      "scene": "dial",
      "act": true,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "dial_1",
      "cues": [
        {
          "name": "control",
          "args": [
            "stake"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dial.w1",
      "at": "script.tex:931",
      "scene": "dial",
      "act": false,
      "who": null,
      "manner": [],
      "cues": [],
      "choices": [],
      "wait": "when",
      "groups": [
        {
          "cond": {
            "kind": "when",
            "name": "stake",
            "value": "zero"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "flow"
              ],
              "key": "dial_2"
            }
          ]
        },
        {
          "cond": {
            "kind": "when",
            "name": "stake",
            "value": "slow"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "flow"
              ],
              "key": "dial_3"
            }
          ]
        },
        {
          "cond": {
            "kind": "when",
            "name": "stake",
            "value": "same"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "flow"
              ],
              "key": "dial_4"
            }
          ]
        },
        {
          "cond": {
            "kind": "when",
            "name": "stake",
            "value": "fast"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "flow"
              ],
              "key": "dial_5"
            }
          ]
        },
        {
          "cond": {
            "kind": "when",
            "name": "stake",
            "value": "all"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "flow"
              ],
              "key": "dial_6"
            }
          ]
        }
      ]
    },
    {
      "id": "dial.7",
      "at": "script.tex:956",
      "scene": "dial",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "dial_7",
      "cues": [
        {
          "name": "control",
          "args": [
            "none"
          ]
        },
        {
          "name": "card",
          "args": [
            "stake"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "stop.1",
      "at": "script.tex:973",
      "scene": "stop",
      "act": true,
      "who": "red",
      "manner": [
        "aside"
      ],
      "key": "stop_1",
      "cues": [
        {
          "name": "control",
          "args": [
            "tax"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "stop.2",
      "at": "script.tex:978",
      "scene": "stop",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "stop_2",
      "cues": [],
      "choices": [
        {
          "key": "stop_2_choice_1",
          "target": "\\run[game]"
        }
      ],
      "wait": "reader",
      "reactions": [
        {
          "cond": {
            "kind": "on",
            "name": "game-won"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [
                "glad"
              ],
              "key": "stop_3"
            }
          ]
        },
        {
          "cond": {
            "kind": "on",
            "name": "game-lost"
          },
          "bubbles": [
            {
              "who": "red",
              "manner": [],
              "key": "stop_4"
            }
          ]
        }
      ]
    },
    {
      "id": "stop.5",
      "at": "script.tex:993",
      "scene": "stop",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "stop_5",
      "cues": [
        {
          "name": "control",
          "args": [
            "none"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "stop.6",
      "at": "script.tex:998",
      "scene": "stop",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "stop_6",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "levy.1",
      "at": "script.tex:1010",
      "scene": "levy",
      "act": true,
      "who": "red",
      "manner": [
        "aside",
        "calm"
      ],
      "key": "levy_1",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "levy4"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "levy.2",
      "at": "script.tex:1015",
      "scene": "levy",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "levy_2",
      "cues": [
        {
          "name": "levy",
          "args": [
            "collect"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "levy.3",
      "at": "script.tex:1020",
      "scene": "levy",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "annoyed"
      ],
      "key": "levy_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "levy.4",
      "at": "script.tex:1024",
      "scene": "levy",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "levy_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "levy.5",
      "at": "script.tex:1028",
      "scene": "levy",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "levy_5",
      "cues": [
        {
          "name": "levy",
          "args": [
            "return"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "levy.6",
      "at": "script.tex:1034",
      "scene": "levy",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "levy_6",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "levy.7",
      "at": "script.tex:1038",
      "scene": "levy",
      "act": false,
      "who": "blue",
      "manner": [
        "aside",
        "flow",
        "annoyed"
      ],
      "key": "levy_7",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "levy.8",
      "at": "script.tex:1041",
      "scene": "levy",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "levy_8",
      "cues": [
        {
          "name": "card",
          "args": [
            "levy"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "match.1",
      "at": "script.tex:1056",
      "scene": "match",
      "act": true,
      "who": "red",
      "manner": [],
      "key": "match_1",
      "cues": [
        {
          "name": "match",
          "args": []
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "match.2",
      "at": "script.tex:1061",
      "scene": "match",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "match_2",
      "cues": [],
      "choices": [],
      "vals": [
        "a",
        "b"
      ],
      "wait": "reader"
    },
    {
      "id": "match.3",
      "at": "script.tex:1065",
      "scene": "match",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "curious"
      ],
      "key": "match_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "match.4",
      "at": "script.tex:1068",
      "scene": "match",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "match_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "match.5",
      "at": "script.tex:1078",
      "scene": "match",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "match_5",
      "cues": [
        {
          "name": "pin",
          "args": [
            "histogram"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "match.6",
      "at": "script.tex:1082",
      "scene": "match",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "match_6",
      "cues": [
        {
          "name": "pin",
          "args": [
            "gini"
          ]
        }
      ],
      "choices": [],
      "vals": [
        "giniA",
        "giniB"
      ],
      "wait": "reader"
    },
    {
      "id": "match.7",
      "at": "script.tex:1086",
      "scene": "match",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "match_7",
      "cues": [
        {
          "name": "pin",
          "args": [
            "turnover"
          ]
        }
      ],
      "choices": [],
      "vals": [
        "turnA",
        "turnB"
      ],
      "wait": "reader"
    },
    {
      "id": "match.8",
      "at": "script.tex:1091",
      "scene": "match",
      "act": false,
      "who": "blue",
      "manner": [
        "surprised"
      ],
      "key": "match_8",
      "cues": [],
      "choices": [],
      "vals": [
        "levy"
      ],
      "wait": "reader"
    },
    {
      "id": "match.9",
      "at": "script.tex:1094",
      "scene": "match",
      "act": false,
      "who": "red",
      "manner": [
        "calm"
      ],
      "key": "match_9",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "map.1",
      "at": "script.tex:1107",
      "scene": "map",
      "act": true,
      "who": "blue",
      "manner": [
        "curious"
      ],
      "key": "map_1",
      "cues": [
        {
          "name": "arrange",
          "args": [
            "free"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "map.2",
      "at": "script.tex:1112",
      "scene": "map",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "map_2",
      "cues": [
        {
          "name": "reveal",
          "args": [
            "map"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "map.3",
      "at": "script.tex:1117",
      "scene": "map",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "map_3",
      "cues": [
        {
          "name": "reveal",
          "args": [
            "fit"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "map.4",
      "at": "script.tex:1126",
      "scene": "map",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "map_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "map.5",
      "at": "script.tex:1130",
      "scene": "map",
      "act": false,
      "who": "blue",
      "manner": [
        "sure"
      ],
      "key": "map_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "map.6",
      "at": "script.tex:1135",
      "scene": "map",
      "act": false,
      "who": "red",
      "manner": [
        "calm"
      ],
      "key": "map_6",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "verdict.1",
      "at": "script.tex:1148",
      "scene": "verdict",
      "act": true,
      "who": "red",
      "manner": [],
      "key": "verdict_1",
      "cues": [
        {
          "name": "crowd",
          "args": [
            "empty"
          ]
        },
        {
          "name": "expect",
          "args": [
            "blue=8, red=8"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "verdict.2",
      "at": "script.tex:1153",
      "scene": "verdict",
      "act": false,
      "who": "blue",
      "manner": [
        "curious"
      ],
      "key": "verdict_2",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "verdict.3",
      "at": "script.tex:1156",
      "scene": "verdict",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "verdict_3",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "verdict.4",
      "at": "script.tex:1159",
      "scene": "verdict",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "verdict_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "verdict.5",
      "at": "script.tex:1162",
      "scene": "verdict",
      "act": false,
      "who": "blue",
      "manner": [
        "flow",
        "annoyed"
      ],
      "key": "verdict_5",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "verdict.6",
      "at": "script.tex:1165",
      "scene": "verdict",
      "act": false,
      "who": "red",
      "manner": [
        "worried"
      ],
      "key": "verdict_6",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "verdict.7",
      "at": "script.tex:1168",
      "scene": "verdict",
      "act": false,
      "who": "blue",
      "manner": [
        "sure"
      ],
      "key": "verdict_7",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "verdict.8",
      "at": "script.tex:1171",
      "scene": "verdict",
      "act": false,
      "who": "red",
      "manner": [
        "calm"
      ],
      "key": "verdict_8",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sandbox.1",
      "at": "script.tex:1191",
      "scene": "sandbox",
      "act": true,
      "who": "red",
      "manner": [
        "calm"
      ],
      "key": "sandbox_1",
      "cues": [
        {
          "name": "crowd",
          "args": [
            "room"
          ]
        },
        {
          "name": "control",
          "args": [
            "sandbox"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sandbox.2",
      "at": "script.tex:1196",
      "scene": "sandbox",
      "act": false,
      "who": "blue",
      "manner": [
        "aside",
        "amused"
      ],
      "key": "sandbox_2",
      "cues": [],
      "choices": [
        {
          "key": "sandbox_2_choice_1",
          "target": "workshop"
        }
      ],
      "wait": "reader"
    }
  ],
  "branches": {
    "human": [
      {
        "id": "human.1",
        "at": "branches/human.tex:17",
        "scene": "human",
        "act": true,
        "who": "author",
        "manner": [],
        "key": "human_1",
        "cues": [],
        "choices": [],
        "wait": "reader"
      },
      {
        "id": "human.a1",
        "at": "branches/human.tex:20",
        "scene": "human",
        "act": false,
        "who": null,
        "manner": [],
        "cues": [],
        "choices": [
          {
            "key": "human_a1_choice_1",
            "target": "guess"
          }
        ],
        "wait": "action"
      }
    ],
    "workshop": []
  },
  "labels": {
    "act:openning": "title.1",
    "title": "title.1",
    "crowd": "crowd.a1",
    "act:intor": "meet.1",
    "meet": "meet.1",
    "merit": "merit.1",
    "fair-game": "rules.1",
    "rules": "rules.1",
    "round1": "round1.1",
    "round2": "round2.1",
    "round3": "round3.1",
    "dare": "dare.1",
    "act:more": "room.1",
    "room": "room.1",
    "rule": "rule.1",
    "offer": "offer.1",
    "joke": "joke.1",
    "act:guess": "guess.1",
    "guess": "guess.1",
    "act:run": "run.1",
    "run": "run.1",
    "why": "why.1",
    "act:sort": "sort.1",
    "sort": "sort.1",
    "act:gini": "gini.1",
    "gini": "gini.1",
    "act:count": "count.1",
    "count": "count.1",
    "act:turnover": "turnover.1",
    "turnover": "turnover.1",
    "act:end": "end.1",
    "end": "end.1",
    "act:dial": "dial.1",
    "dial": "dial.1",
    "act:stop": "stop.1",
    "stop": "stop.1",
    "act:levy": "levy.1",
    "levy": "levy.1",
    "act:match": "match.1",
    "match": "match.1",
    "act:map": "map.1",
    "map": "map.1",
    "act:verdict": "verdict.1",
    "verdict": "verdict.1",
    "act:sandbox": "sandbox.1",
    "sandbox": "sandbox.1",
    "act:human": "human.1",
    "human": "human.1"
  },
  "cards": {
    "gini": {
      "title": "card_gini_title",
      "blocks": [
        {
          "kind": "line",
          "key": "card_gini_1"
        },
        {
          "kind": "line",
          "key": "card_gini_2"
        },
        {
          "kind": "plot",
          "id": "lorenz"
        }
      ],
      "toy": "gini"
    },
    "histogram": {
      "title": "card_histogram_title",
      "blocks": [
        {
          "kind": "line",
          "key": "card_histogram_1"
        },
        {
          "kind": "line",
          "key": "card_histogram_2"
        },
        {
          "kind": "line",
          "key": "card_histogram_3"
        },
        {
          "kind": "plot",
          "id": "histogram"
        }
      ]
    },
    "levy": {
      "title": "card_levy_title",
      "blocks": [
        {
          "kind": "line",
          "key": "card_levy_1"
        },
        {
          "kind": "line",
          "key": "card_levy_2"
        },
        {
          "kind": "line",
          "key": "card_levy_3"
        }
      ]
    },
    "limit": {
      "title": "card_limit_title",
      "blocks": [
        {
          "kind": "line",
          "key": "card_limit_1"
        },
        {
          "kind": "line",
          "key": "card_limit_2"
        },
        {
          "kind": "line",
          "key": "card_limit_3"
        }
      ]
    },
    "participants": {
      "title": "card_participants_title",
      "blocks": [
        {
          "kind": "line",
          "key": "card_participants_1"
        },
        {
          "kind": "line",
          "key": "card_participants_2"
        },
        {
          "kind": "line",
          "key": "card_participants_3"
        },
        {
          "kind": "formula",
          "tex": "\\frac{1}{\\sum_i s_i^2}"
        },
        {
          "kind": "line",
          "key": "card_participants_4"
        },
        {
          "kind": "plot",
          "id": "participants"
        }
      ]
    },
    "rule": {
      "title": "card_rule_title",
      "blocks": [
        {
          "kind": "line",
          "key": "card_rule_1"
        },
        {
          "kind": "line",
          "key": "card_rule_2"
        },
        {
          "kind": "line",
          "key": "card_rule_3"
        },
        {
          "kind": "line",
          "key": "card_rule_4"
        }
      ]
    },
    "stake": {
      "title": "card_stake_title",
      "blocks": [
        {
          "kind": "line",
          "key": "card_stake_1"
        },
        {
          "kind": "line",
          "key": "card_stake_2"
        }
      ]
    },
    "turnover": {
      "title": "card_turnover_title",
      "blocks": [
        {
          "kind": "line",
          "key": "card_turnover_1"
        },
        {
          "kind": "line",
          "key": "card_turnover_2"
        },
        {
          "kind": "plot",
          "id": "turnover"
        }
      ]
    }
  }
};
