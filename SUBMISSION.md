# Submission checklist — Moldash Bekarys

**Assignment:** Web-Based AI Math Differentiator · Topic 8: AI for Differentiated Learning

**Chosen mathematics topic:** Quadratic equations

**Project:** Quadratic Studio

## Prepared deliverables

- Responsive original application source, deterministic math engine, open-source language-model integration, prompts, hints, worked solutions and interactive graph.
- Three genuinely different challenge levels, eight connected seed sets, 24 mathematically verified tasks.
- `public/report.pdf`: one-page report with author name, differentiation, AI prompts, architecture, examples and limitations.
- `docs/report.md`: editable report text.
- `README.md`: installation, local running, AI design, test commands and deployment instructions.
- Locked npm dependencies, GitHub Pages deployment workflow and Netlify configuration.
- Built static website in the downloadable website package.

## Validation completed in the current environment

- **10 / 10** automated Node test groups passed. All 24 differentiated tasks have roots verified by substitution; tests also cover radicals, fractions, rounding, physical-domain constraints, vertices, unsafe inputs and prompt context.
- **13 / 13** functional browser checks passed against the production build in Chromium. These include all levels, checking feedback, progressive hints, walkthroughs, keyboard controls, graph interaction, persistence, reset, report download and responsive widths of 375, 768, 1024 and 1440 pixels.
- Production build succeeded. No uncaught browser errors or horizontal overflow were found in the tested interactions and widths.
- Report was rendered and visually inspected, with one page and PDF author metadata set to Moldash Bekarys.
- A deliberately denied model download verified the honest **AI unavailable** state and clearly labelled non-AI fallback. This is not evidence of successful model inference.

## Publication and real AI

- **Live website:** https://johndoe018.github.io/bekarys1/
- **Public source:** https://github.com/johndoe018/bekarys1 (`main`; confirmed public in GitHub metadata).
- **Successful test/build/deploy run:** https://github.com/johndoe018/bekarys1/actions/runs/38798792099
- **Real browser AI:** The constrained SmolLM2 model loaded and selected valid verified next-step guidance on Foundation, Standard and Advanced in Chromium. All three returned `source: model-selected`, with strategy A, using the actual model weights and ONNX WASM. This demonstrates real inference and correct guidance selection for the tested requests, not free-form generation or general classification accuracy.
- **Mathematical safety:** Initial free-form responses were rejected after actual browser tests found errors. The final implementation masks every output token except A/B/C/D and maps the model-selected label to a complete verified explanation. The model can select a less relevant card, but cannot supply invented displayed mathematics.
- **Deployment:** GitHub Pages is now enabled, and deployment succeeded. Earlier 404 failures were resolved. The deployment workflow additionally runs the 13 functional browser checks and three real-model requests against the actual public URL after deployment; inspect its latest `verify-live-site` result for that additional evidence.

The current cloud machine's proxy still restricts direct Hugging Face and GitHub Pages HTTP access. Real model inference and deployment are independently verified on GitHub Actions runners. Saved cloud install/start instructions and domain requirements let future tasks reproduce setup; saved drafts still need review/save/publish in environment settings to activate configuration changes. No app API key is required.

## Suggested demonstration

1. Foundation: enter `2` and `3`; request each hint and open the walkthrough.
2. Standard: enter `(5-sqrt(7))/2` and `(5+sqrt(7))/2`.
3. Advanced: enter `6` for landing time and `61.25` for maximum height; explain why `−1` second is rejected.
4. Move the graph slider, switch levels using arrow keys, generate another equation, and reload to demonstrate saved progress.
5. Make a real AI request and explain how its prompt and guidance cards change by level. Distinguish the model’s guidance selection from deterministic mathematics and answer checking.

**Development disclosure:** Prepared with AI development assistance; review and adapt the work in line with the course's authorship and disclosure policy.
