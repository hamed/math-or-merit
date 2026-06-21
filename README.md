# Math or Merit?

An interactive explorable explanation of the Yard-Sale wealth-condensation model.

Everyone starts equal. Every trade is fair. One person ends up with almost everything.

This project turns that result into a prose-first interactive essay with small inline simulations. The goal is to make the reader feel the contradiction: local fairness does not necessarily produce global fairness.

The model sits in the tradition of econophysics and wealth-condensation models, with a visual and interactive style inspired by explorable explanations.

## Research

The evidence ledger starts at [`notes/research.md`](notes/research.md). It distinguishes
published results, local observations, hypotheses, metaphors, design choices, and rejected
claims.

Run the compact seeded study with:

```sh
npm run research
```

The command prints its parameters, seeds, checkpoints, and descriptive ensemble quantiles
as JSON. It does not modify the production simulation state or write generated datasets.
