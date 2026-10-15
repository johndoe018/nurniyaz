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

- **8 / 8** automated Node test groups passed. All 24 differentiated tasks have roots verified by substitution; tests also cover radicals, fractions, rounding, physical-domain constraints, vertices, unsafe inputs and prompt context.
- **13 / 13** functional browser checks passed against the production build in Chromium. These include all levels, checking feedback, progressive hints, walkthroughs, keyboard controls, graph interaction, persistence, reset, report download and responsive widths of 375, 768, 1024 and 1440 pixels.
- Production build succeeded. No uncaught browser errors or horizontal overflow were found in the tested interactions and widths.
- Report was rendered and visually inspected, with one page and PDF author metadata set to Moldash Bekarys.
- A deliberately denied model download verified the honest **AI unavailable** state and clearly labelled non-AI fallback. This is not evidence of successful model inference.

## Outstanding external steps

1. **Real AI inference:** The environment's network proxy denies access to Hugging Face. Allow the model host and its artifact hosts, then open the application and make a coach request on each level. Inspect whether explanations are appropriate and consistent with the verified walkthrough. Do not describe inference as tested until it succeeds.
2. **Public source repository:** The selected target is `johndoe018/bekarys1`. Git reads work, but GitHub API access is blocked. Publication status must be checked after a successful authenticated write. The downloadable source is complete independently of hosting.
3. **Live website:** A public deployment URL is not available yet. Enable GitHub Pages with GitHub Actions for the target repository, or deploy the built website package through Netlify. Verify the real public URL, three levels and a successful AI request in a fresh browser before submission.

Required host additions have been saved to the environment configuration draft: `api.github.com`, `huggingface.co`, `cas-bridge.xethub.hf.co`, `cdn-lfs.hf.co` and `cdn-lfs.huggingface.co`. Saving a draft does not apply the settings or publish the environment. Review and save the changes in environment settings, then publish the environment to make the configuration reusable.

No secret value is needed for the application. The AI model runs on the learner's device. If repository publication needs further permissions, use the platform's GitHub connection or repository settings; never put access tokens in the app or submission.

## Suggested demonstration

1. Foundation: enter `2` and `3`; request each hint and open the walkthrough.
2. Standard: enter `(5-sqrt(7))/2` and `(5+sqrt(7))/2`.
3. Advanced: enter `6` for landing time and `61.25` for maximum height; explain why `−1` second is rejected.
4. Move the graph slider, switch levels using arrow keys, generate another equation, and reload to demonstrate saved progress.
5. Make a real AI request and explain how its prompt changes by level. Distinguish model-generated language from deterministic mathematical checking.

**Development disclosure:** Prepared with AI development assistance; review and adapt the work in line with the course's authorship and disclosure policy.
