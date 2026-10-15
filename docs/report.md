# Quadratic Studio: AI for Differentiated Learning

**Moldash Bekarys · Topic 8 · Mathematics topic: Quadratic equations**

## Objective

Quadratic Studio is a responsive web application for exploring one core task: finding and interpreting the zeros of a quadratic. Learners choose Foundation, Standard or Advanced and receive progressively different demands, hints and complete solutions. A shared pair of seed numbers connects the three versions; eight seeds provide 24 tasks.

## Differentiation

**Foundation:** `x² − 5x + 6 = 0`. Integer factor pairs, a visible three-step scaffold and direct hints introduce the zero-product property. Verified roots: `2` and `3`.

**Standard:** `2x² − 10x + 9 = 0`. Reduced scaffolding, a non-monic coefficient and irrational roots require the discriminant and quadratic formula. Exact roots: `(5 ± √7)/2`.

**Advanced:** `h(t) = −5t² + 25t + 30`. A ball's height introduces units, physical constraints and a multi-step extension. Learners reject the negative time, find landing time `6 s`, and evaluate the vertex to obtain maximum height `61.25 m` at `2.5 s`.

## AI architecture and prompts

Transformers.js runs the open-source SmolLM2-135M-Instruct language model, quantised to q4, in a browser Web Worker using ONNX WASM. The first coach request downloads model files; inference runs on the device. No API key or external inference backend is needed, and learner questions are not uploaded. Deterministic code controls task parameters and checks answers; the model dynamically adapts explanations using verified context.

The system prompt is: “You are a patient mathematics coach in Quadratic Studio. [Level-specific style.] Use at most 70 words. Adapt the supplied VERIFIED GUIDANCE to the learner question. Never invent coefficients, computations, answers or extra tasks. [Give a hint rather than the final answer when the walkthrough is closed.]” This is an abridged template; the complete implementation is in `src/math.js`.

Foundation requests simple vocabulary and one small next step. Standard requests curriculum vocabulary and one useful question about coefficients, the discriminant or ± cases. Advanced requests units, domain interpretation and multi-step reasoning. The user-message context includes the current equation, learner question, selected verified hint and previous checking feedback. Final results are included only when the walkthrough is open.

## Feedback and verification

Instant deterministic feedback accepts numbers, fractions, square-root expressions and two-decimal approximations within `0.01`. It distinguishes duplicate roots, notation errors and inadmissible negative time. Progressive hints, worked solutions and a graph slider support self-paced learning. Progress stays in local browser storage. Eight automated test groups validate all 24 tasks, parsing and prompt context; functional browser checks cover the learning interactions and model-unavailable fallback. Real inference and public publication remain unverified where network access is blocked. AI explanations may be imperfect; the verified walkthrough remains authoritative.

**Development disclosure:** Prepared with AI assistance; mathematics checked independently of model output. Sources: Transformers.js documentation; SmolLM2 model card; Vite and GitHub Pages documentation.
