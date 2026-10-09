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
      "label": "invite",
      "title": "The invitation",
      "act": "Introduction",
      "number": "5",
      "step": "invite.1",
      "sideTrip": false
    },
    {
      "label": "round1",
      "title": "Round one",
      "act": "Introduction",
      "number": "6",
      "step": "round1.1",
      "sideTrip": false
    },
    {
      "label": "round2",
      "title": "Round two",
      "act": "Introduction",
      "number": "7",
      "step": "round2.1",
      "sideTrip": false
    },
    {
      "label": "round3",
      "title": "Round three",
      "act": "Introduction",
      "number": "8",
      "step": "round3.1",
      "sideTrip": false
    },
    {
      "label": "dare",
      "title": "The challenge",
      "act": "Introduction",
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
      "label": "offer",
      "title": "The joke offer",
      "act": "More players",
      "number": "11",
      "step": "offer.1",
      "sideTrip": false
    },
    {
      "label": "joke",
      "title": "The joke",
      "act": "More players",
      "number": "12",
      "step": "joke.1",
      "sideTrip": false
    },
    {
      "label": "guess",
      "title": "Your guess",
      "act": "Your guess",
      "number": "13",
      "step": "guess.1",
      "sideTrip": false
    },
    {
      "label": "run",
      "title": "The run",
      "act": "The run",
      "number": "14",
      "step": "run.1",
      "sideTrip": false
    },
    {
      "label": "why",
      "title": "So why did they win?",
      "act": "The run",
      "number": "15",
      "step": "why.1",
      "sideTrip": false
    },
    {
      "label": "sort",
      "title": "Line them up",
      "act": "Line them up",
      "number": "16",
      "step": "sort.1",
      "sideTrip": false
    },
    {
      "label": "gini",
      "title": "Measure the room",
      "act": "Measure the room",
      "number": "17",
      "step": "gini.1",
      "sideTrip": false
    },
    {
      "label": "count",
      "title": "How many still count?",
      "act": "How many still count?",
      "number": "18",
      "step": "count.1",
      "sideTrip": false
    },
    {
      "label": "turnover",
      "title": "Is anything moving?",
      "act": "Is anything moving?",
      "number": "19",
      "step": "turnover.1",
      "sideTrip": false
    },
    {
      "label": "end",
      "title": "Where it ends",
      "act": "Where it ends",
      "number": "20",
      "step": "end.1",
      "sideTrip": false
    },
    {
      "label": "dial",
      "title": "Your hand on the dial",
      "act": "Your hand on the dial",
      "number": "21",
      "step": "dial.1",
      "sideTrip": false
    },
    {
      "label": "stop",
      "title": "Now you try to stop it",
      "act": "Now you try to stop it",
      "number": "22",
      "step": "stop.1",
      "sideTrip": false
    },
    {
      "label": "levy",
      "title": "Put the levy in the rules",
      "act": "Put the levy in the rules",
      "number": "23",
      "step": "levy.1",
      "sideTrip": false
    },
    {
      "label": "match",
      "title": "Trade and return together",
      "act": "Trade and return together",
      "number": "24",
      "step": "match.1",
      "sideTrip": false
    },
    {
      "label": "map",
      "title": "The outcome map",
      "act": "The outcome map",
      "number": "25",
      "step": "map.1",
      "sideTrip": false
    },
    {
      "label": "verdict",
      "title": "The verdict",
      "act": "The verdict",
      "number": "26",
      "step": "verdict.1",
      "sideTrip": false
    },
    {
      "label": "sandbox",
      "title": "The machine is yours",
      "act": "The machine is yours",
      "number": "27",
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
      "at": "script.tex:19",
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
      "at": "script.tex:28",
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
      "at": "script.tex:30",
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
      "at": "script.tex:32",
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
      "at": "script.tex:34",
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
        "title_a4_8",
        "title_a4_9"
      ],
      "bodyHolds": [
        3,
        0,
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
      "at": "script.tex:64",
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
      "at": "script.tex:81",
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
      "at": "script.tex:93",
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
          "meet_1_4"
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
          "at": "script.tex:104",
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
              "meet_2_3"
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
                "flow"
              ],
              "key": "meet_4"
            }
          ]
        }
      ]
    },
    {
      "id": "meet.5",
      "at": "script.tex:120",
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
      "at": "script.tex:134",
      "scene": "merit",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "merit_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.2",
      "at": "script.tex:136",
      "scene": "merit",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "merit_2",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.3",
      "at": "script.tex:138",
      "scene": "merit",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "merit_3",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.4",
      "at": "script.tex:140",
      "scene": "merit",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "merit_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.5",
      "at": "script.tex:143",
      "scene": "merit",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "merit_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "merit.6",
      "at": "script.tex:145",
      "scene": "merit",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "merit_6",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "invite.1",
      "at": "script.tex:159",
      "scene": "invite",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "invite_1",
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
      "id": "invite.2",
      "at": "script.tex:163",
      "scene": "invite",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "invite_2",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "invite.3",
      "at": "script.tex:167",
      "scene": "invite",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "invite_3",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "invite.4",
      "at": "script.tex:170",
      "scene": "invite",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "invite_4",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "invite.5",
      "at": "script.tex:174",
      "scene": "invite",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "invite_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "invite.6",
      "at": "script.tex:176",
      "scene": "invite",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "invite_6",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "invite.a1",
      "at": "script.tex:181",
      "scene": "invite",
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
      "id": "invite.7",
      "at": "script.tex:183",
      "scene": "invite",
      "act": false,
      "who": "blue",
      "manner": [
        "aside"
      ],
      "key": "invite_7",
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
                "flow"
              ],
              "key": "invite_8"
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
                "flow"
              ],
              "key": "invite_9"
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
                "flow"
              ],
              "key": "invite_10"
            },
            {
              "who": "red",
              "manner": [
                "flow"
              ],
              "key": "invite_11"
            }
          ]
        }
      ]
    },
    {
      "id": "invite.12",
      "at": "script.tex:207",
      "scene": "invite",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "invite_12",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round1.1",
      "at": "script.tex:218",
      "scene": "round1",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "round1_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "round1.2",
      "at": "script.tex:221",
      "scene": "round1",
      "act": false,
      "who": "blue",
      "manner": [],
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
      "wait": "reader"
    },
    {
      "id": "round1.3",
      "at": "script.tex:227",
      "scene": "round1",
      "act": false,
      "who": "red",
      "manner": [],
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
      "wait": "reader"
    },
    {
      "id": "round1.4",
      "at": "script.tex:232",
      "scene": "round1",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "round1_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "round1.a1",
      "at": "script.tex:238",
      "scene": "round1",
      "act": false,
      "who": null,
      "manner": [],
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
      "wait": "auto"
    },
    {
      "id": "round1.5",
      "at": "script.tex:249",
      "scene": "round1",
      "act": false,
      "who": "blue",
      "manner": [
        "aside",
        "flow"
      ],
      "key": "round1_5",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round2.1",
      "at": "script.tex:253",
      "scene": "round2",
      "act": false,
      "who": "blue",
      "manner": [],
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
      "wait": "reader"
    },
    {
      "id": "round2.2",
      "at": "script.tex:257",
      "scene": "round2",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "round2_2",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "round2.3",
      "at": "script.tex:259",
      "scene": "round2",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "round2_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "round2.4",
      "at": "script.tex:261",
      "scene": "round2",
      "act": false,
      "who": "red",
      "manner": [],
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
      "at": "script.tex:266",
      "scene": "round2",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "round2_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "round2.6",
      "at": "script.tex:269",
      "scene": "round2",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "round2_6",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "round2.7",
      "at": "script.tex:271",
      "scene": "round2",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
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
      "at": "script.tex:281",
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
      "at": "script.tex:288",
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
      "at": "script.tex:295",
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
      "at": "script.tex:300",
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
      "at": "script.tex:303",
      "scene": "round3",
      "act": false,
      "who": "blue",
      "manner": [
        "aside",
        "flow"
      ],
      "key": "round3_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.1",
      "at": "script.tex:309",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "aside",
        "flow"
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
      "at": "script.tex:313",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "dare_2",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.3",
      "at": "script.tex:315",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "dare_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.4",
      "at": "script.tex:318",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "dare_4",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.5",
      "at": "script.tex:322",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "dare_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.6",
      "at": "script.tex:325",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "dare_6",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.7",
      "at": "script.tex:329",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "dare_7",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.8",
      "at": "script.tex:331",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "dare_8",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.9",
      "at": "script.tex:334",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "dare_9",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.10",
      "at": "script.tex:337",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "dare_10",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.11",
      "at": "script.tex:340",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "dare_11",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.12",
      "at": "script.tex:342",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "dare_12",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.13",
      "at": "script.tex:344",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "dare_13",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "dare.14",
      "at": "script.tex:346",
      "scene": "dare",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "dare_14",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.15",
      "at": "script.tex:349",
      "scene": "dare",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "dare_15",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "dare.16",
      "at": "script.tex:352",
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
      "at": "script.tex:364",
      "scene": "room",
      "act": true,
      "who": "red",
      "manner": [],
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
      "wait": "reader"
    },
    {
      "id": "room.2",
      "at": "script.tex:369",
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
      "id": "room.3",
      "at": "script.tex:373",
      "scene": "room",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "room_3",
      "cues": [
        {
          "name": "card",
          "args": [
            "rule"
          ]
        },
        {
          "name": "pairs",
          "args": [
            "2"
          ]
        }
      ],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "room.4",
      "at": "script.tex:384",
      "scene": "room",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "room_4",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "offer.1",
      "at": "script.tex:390",
      "scene": "offer",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "offer_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "offer.2",
      "at": "script.tex:393",
      "scene": "offer",
      "act": false,
      "who": "red",
      "manner": [
        "aside"
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
      "at": "script.tex:405",
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
          "name": "picture",
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
      "at": "script.tex:409",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_2",
      "cues": [
        {
          "name": "picture",
          "args": [
            "darwin"
          ]
        },
        {
          "name": "picture",
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
      "at": "script.tex:414",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_3",
      "cues": [
        {
          "name": "picture",
          "args": [
            "silence"
          ]
        },
        {
          "name": "picture",
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
      "at": "script.tex:419",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_4",
      "cues": [
        {
          "name": "picture",
          "args": [
            "cow-moos"
          ]
        },
        {
          "name": "picture",
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
      "at": "script.tex:424",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_5",
      "cues": [
        {
          "name": "picture",
          "args": [
            "physicist"
          ]
        },
        {
          "name": "picture",
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
      "at": "script.tex:429",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_6",
      "cues": [
        {
          "name": "picture",
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
      "at": "script.tex:433",
      "scene": "joke",
      "act": false,
      "who": "red",
      "manner": [
        "flow"
      ],
      "key": "joke_7",
      "cues": [
        {
          "name": "picture",
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
      "at": "script.tex:438",
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
      "at": "script.tex:441",
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
      "at": "script.tex:445",
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
      "at": "script.tex:460",
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
      "at": "script.tex:463",
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
      "at": "script.tex:467",
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
      "at": "script.tex:478",
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
      "at": "script.tex:490",
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
                "flow"
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
                "flow"
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
                "flow"
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
                "flow"
              ],
              "key": "guess_8"
            }
          ]
        }
      ]
    },
    {
      "id": "run.1",
      "at": "script.tex:517",
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
      "at": "script.tex:521",
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
      "at": "script.tex:530",
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
                "flow"
              ],
              "key": "run_2"
            },
            {
              "who": "red",
              "manner": [
                "flow"
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
                "flow"
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
                "flow"
              ],
              "key": "run_7"
            },
            {
              "who": "red",
              "manner": [
                "flow"
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
                "flow"
              ],
              "key": "run_9"
            },
            {
              "who": "blue",
              "manner": [
                "flow"
              ],
              "key": "run_10"
            }
          ]
        }
      ]
    },
    {
      "id": "run.11",
      "at": "script.tex:570",
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
      "at": "script.tex:581",
      "scene": "why",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "why_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "why.w1",
      "at": "script.tex:584",
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
              "manner": [],
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
              "manner": [],
              "key": "why_3"
            }
          ]
        }
      ]
    },
    {
      "id": "why.4",
      "at": "script.tex:598",
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
      "at": "script.tex:614",
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
      "at": "script.tex:619",
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
      "at": "script.tex:621",
      "scene": "sort",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "sort_2",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sort.3",
      "at": "script.tex:625",
      "scene": "sort",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "sort_3",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sort.4",
      "at": "script.tex:629",
      "scene": "sort",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "sort_4",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "sort.5",
      "at": "script.tex:632",
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
      "at": "script.tex:637",
      "scene": "sort",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "sort_6",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sort.7",
      "at": "script.tex:641",
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
      "at": "script.tex:645",
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
      "at": "script.tex:647",
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
      "at": "script.tex:651",
      "scene": "sort",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "sort_9",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "sort.10",
      "at": "script.tex:655",
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
      "at": "script.tex:659",
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
      "at": "script.tex:664",
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
      "at": "script.tex:677",
      "scene": "gini",
      "act": true,
      "who": "blue",
      "manner": [],
      "key": "gini_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "gini.2",
      "at": "script.tex:681",
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
      "at": "script.tex:685",
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
      "at": "script.tex:690",
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
      "at": "script.tex:695",
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
      "at": "script.tex:700",
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
      "at": "script.tex:703",
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
      "at": "script.tex:709",
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
      "at": "script.tex:726",
      "scene": "count",
      "act": true,
      "who": "blue",
      "manner": [],
      "key": "count_1",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "count.2",
      "at": "script.tex:730",
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
      "at": "script.tex:735",
      "scene": "count",
      "act": false,
      "who": "red",
      "manner": [],
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
      "wait": "reader"
    },
    {
      "id": "count.4",
      "at": "script.tex:740",
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
      "at": "script.tex:745",
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
      "at": "script.tex:750",
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
      "at": "script.tex:755",
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
      "at": "script.tex:762",
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
      "at": "script.tex:773",
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
      "at": "script.tex:790",
      "scene": "turnover",
      "act": true,
      "who": "blue",
      "manner": [],
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
      "at": "script.tex:794",
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
      "at": "script.tex:798",
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
      "at": "script.tex:801",
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
      "at": "script.tex:805",
      "scene": "turnover",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "turnover_5",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "turnover.a1",
      "at": "script.tex:809",
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
      "at": "script.tex:823",
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
      "at": "script.tex:827",
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
      "at": "script.tex:831",
      "scene": "end",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "end_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "end.4",
      "at": "script.tex:834",
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
      "at": "script.tex:838",
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
      "at": "script.tex:854",
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
      "at": "script.tex:859",
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
      "at": "script.tex:884",
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
      "at": "script.tex:901",
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
      "at": "script.tex:906",
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
              "manner": [],
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
      "at": "script.tex:921",
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
      "at": "script.tex:926",
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
      "at": "script.tex:938",
      "scene": "levy",
      "act": true,
      "who": "red",
      "manner": [
        "aside"
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
      "at": "script.tex:943",
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
      "at": "script.tex:948",
      "scene": "levy",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "levy_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "levy.4",
      "at": "script.tex:952",
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
      "at": "script.tex:956",
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
      "at": "script.tex:962",
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
      "at": "script.tex:966",
      "scene": "levy",
      "act": false,
      "who": "blue",
      "manner": [
        "aside",
        "flow"
      ],
      "key": "levy_7",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "levy.8",
      "at": "script.tex:969",
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
      "at": "script.tex:984",
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
      "at": "script.tex:989",
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
      "at": "script.tex:993",
      "scene": "match",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "match_3",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "match.4",
      "at": "script.tex:996",
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
      "at": "script.tex:1006",
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
      "at": "script.tex:1010",
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
      "at": "script.tex:1014",
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
      "at": "script.tex:1019",
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
      "at": "script.tex:1022",
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
      "at": "script.tex:1035",
      "scene": "map",
      "act": true,
      "who": "blue",
      "manner": [],
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
      "at": "script.tex:1040",
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
      "at": "script.tex:1045",
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
      "at": "script.tex:1054",
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
      "at": "script.tex:1058",
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
      "at": "script.tex:1063",
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
      "at": "script.tex:1076",
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
      "at": "script.tex:1081",
      "scene": "verdict",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "verdict_2",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "verdict.3",
      "at": "script.tex:1084",
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
      "at": "script.tex:1087",
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
      "at": "script.tex:1090",
      "scene": "verdict",
      "act": false,
      "who": "blue",
      "manner": [
        "flow"
      ],
      "key": "verdict_5",
      "cues": [],
      "choices": [],
      "wait": "chat"
    },
    {
      "id": "verdict.6",
      "at": "script.tex:1093",
      "scene": "verdict",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "verdict_6",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "verdict.7",
      "at": "script.tex:1096",
      "scene": "verdict",
      "act": false,
      "who": "blue",
      "manner": [],
      "key": "verdict_7",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "verdict.8",
      "at": "script.tex:1099",
      "scene": "verdict",
      "act": false,
      "who": "red",
      "manner": [],
      "key": "verdict_8",
      "cues": [],
      "choices": [],
      "wait": "reader"
    },
    {
      "id": "sandbox.1",
      "at": "script.tex:1119",
      "scene": "sandbox",
      "act": true,
      "who": "red",
      "manner": [],
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
      "at": "script.tex:1124",
      "scene": "sandbox",
      "act": false,
      "who": "blue",
      "manner": [
        "aside"
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
    "invite": "invite.1",
    "round1": "round1.1",
    "round2": "round2.1",
    "round3": "round3.1",
    "dare": "dare.1",
    "act:more": "room.1",
    "room": "room.1",
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
