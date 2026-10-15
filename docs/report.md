# Quadratic Studio: AI for Differentiated Learning

**Muratbek Nurniyaz · Topic 8 · Mathematics topic: Quadratic equations**

## Objective

Quadratic Studio is a responsive web application for exploring one core task: finding and interpreting the zeros of a quadratic. Learners choose Foundation, Standard or Advanced and receive progressively different demands, hints and complete solutions. A shared pair of seed numbers connects the three versions; eight seeds provide 24 tasks.

## Differentiation

**Foundation:** `x² − 5x + 6 = 0`. Integer factor pairs, a visible three-step scaffold and direct hints introduce the zero-product property. Verified roots: `2` and `3`.

**Standard:** `2x² − 10x + 9 = 0`. Reduced scaffolding, a non-monic coefficient and irrational roots require the discriminant and quadratic formula. Exact roots: `(5 ± √7)/2`.

**Advanced:** `h(t) = −5t² + 25t + 30`. A ball's height introduces units, physical constraints and a multi-step extension. Learners reject the negative time, find landing time `6 s`, and evaluate the vertex to obtain maximum height `61.25 m` at `2.5 s`.

## AI architecture and prompts

Transformers.js runs the open-source SmolLM2-135M-Instruct language model, quantised to q4, in a browser Web Worker using ONNX WASM. The first coach request downloads model files; inference runs on the device. No API key or external inference backend is needed, and learner questions are not uploaded. Deterministic code controls task parameters and checks answers; the model dynamically selects a verified guidance card using the question and level. Output is constrained to four labels, so all displayed mathematics remains verified.

The system prompt is: “Select the most useful VERIFIED guidance card for the learner. [Level-specific style.] Output exactly one letter: A, B, C or D. A = next step; B = why the method works; C = checking an answer; D = a deeper connection. Do not generate mathematics or prose.” This is an abridged template; the complete implementation is in `src/math.js`.

Foundation prioritises direct scaffolding and a small next step. Standard supports independent reasoning about coefficients, the discriminant and formula. Advanced supports units, domain interpretation and multi-step reasoning. Context includes the current equation, learner question and four verified cards, personalised by hints used and last checking feedback. A logits processor preserves the model’s scores for A/B/C/D and masks all other tokens; one-token decoding selects a card. Final results appear only with an open walkthrough. This is constrained AI-assisted guidance, not free-form mathematical generation.

## Feedback and verification

Instant deterministic feedback accepts numbers, fractions, square-root expressions and two-decimal approximations within `0.01`. It distinguishes duplicate roots, notation errors and inadmissible negative time. Progressive hints, worked solutions and a graph slider support self-paced learning. Progress stays in local browser storage. Ten automated test groups validate all 24 tasks, parsing, prompt context and output constraints; functional browser checks cover the learning interactions and model-unavailable fallback. Real browser model selection passed on all three levels in GitHub Actions. The source is public and the GitHub Pages deployment succeeded. Initial unrestricted model responses were rejected after browser tests found incorrect mathematics. Constrained selection prevents invented displayed mathematics; a model may still choose a less relevant card.

**Development disclosure:** Prepared with AI assistance; mathematics checked independently of model output. Sources: Transformers.js documentation; SmolLM2 model card; Vite and GitHub Pages documentation.

**Live website:** https://johndoe018.github.io/bekarys1/
**Public source:** https://github.com/johndoe018/bekarys1
