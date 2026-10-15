import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './style.css';
import { LEVELS, SEEDS, makeTask, checkAnswers, aiPrompt, format } from './math.js';

const $ = id => document.getElementById(id);
const storageKey = 'quadratic-studio-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { /* A private/blocked store never prevents learning. */ }
let level = LEVELS.includes(saved.level) ? saved.level : 'foundation';
let seedIndex = Number.isInteger(saved.seedIndex) && saved.seedIndex >= 0 ? saved.seedIndex % SEEDS.length : 0;
const solvedLevels = new Set(Array.isArray(saved.solvedLevels) ? saved.solvedLevels.filter(x => LEVELS.includes(x)) : []);
const taskStates = new Map();
let task;
let worker, busy = false, modelReady = false, aiId = 0, aiTimeout;
const stateFor = key => {
  if (!taskStates.has(key)) taskStates.set(key, { hintsUsed: 0, solutionOpen: false, answers: ['', ''], correct: false, feedback: null });
  return taskStates.get(key);
};
const store = () => { try { localStorage.setItem(storageKey, JSON.stringify({ level, seedIndex, solvedLevels: [...solvedLevels] })); } catch { /* Optional persistence. */ } };
const element = (tag, text, className) => { const node = document.createElement(tag); node.textContent = text; if (className) node.className = className; return node; };

function renderProgress() {
  $('progress-number').textContent = solvedLevels.size;
  $('progress-copy').textContent = solvedLevels.size === 3 ? 'All three levels explored. Try a new equation to keep growing.' : solvedLevels.size ? 'Good progress. Try another level when you feel ready.' : 'Explore all three levels. There’s no rush.';
}

function renderHints() {
  const state = stateFor(task.key);
  $('hint-count').textContent = `${state.hintsUsed} / ${task.hints.length}`;
  $('hint-list').replaceChildren(...task.hints.slice(0, state.hintsUsed).map(hint => element('li', hint)));
  $('hint-list').hidden = !state.hintsUsed;
  $('hint-button').disabled = state.hintsUsed >= task.hints.length;
}

function renderFeedback() {
  const { feedback } = stateFor(task.key), area = $('feedback');
  area.hidden = !feedback;
  if (!feedback) return;
  area.classList.toggle('success', feedback.correct);
  area.replaceChildren(element('strong', feedback.correct ? 'That’s it. Nicely connected.' : feedback.invalid ? 'Let’s check the notation.' : 'You’re learning. Take another look.'), document.createTextNode(feedback.message));
}

function renderSolution() {
  const state = stateFor(task.key);
  $('solution').hidden = !state.solutionOpen;
  $('solution-button').setAttribute('aria-expanded', String(state.solutionOpen));
  $('solution-button').textContent = state.solutionOpen ? 'Hide the walkthrough ↑' : 'See the walkthrough ↓';
  $('solution-steps').replaceChildren(...task.steps.map(step => element('li', step)));
  $('solution-answer').textContent = task.answerText;
}

function renderGraph(reset = false) {
  const a = task.a, b = task.b, c = task.c, vx = -b / (2 * a), vy = a * vx ** 2 + b * vx + c;
  const [r1, r2] = task.roots;
  const xmin = Math.min(-1, r1 - Math.max(1, (r2 - r1) * .2)), xmax = r2 + Math.max(1, (r2 - r1) * .2);
  const ymin = Math.min(0, vy) - Math.max(1, Math.abs(vy) * .16), ymax = Math.max(vy, c, 0) * 1.14 + 1;
  const w = 350, h = 174, px = 21, py = 13;
  const X = x => px + (x - xmin) / (xmax - xmin) * (w - px * 2);
  const Y = y => h - py - (y - ymin) / (ymax - ymin) * (h - py * 2);
  const slider = $('graph-slider');
  slider.min = xmin; slider.max = xmax; slider.step = (xmax - xmin) / 300;
  if (reset) slider.value = 0;
  const selectedX = Number(slider.value), selectedY = a * selectedX ** 2 + b * selectedX + c;
  const state = stateFor(task.key), reveal = state.solutionOpen || state.correct;
  const points = Array.from({ length: 161 }, (_, i) => { const x = xmin + (xmax - xmin) * i / 160; return `${i ? 'L' : 'M'}${X(x).toFixed(2)},${Y(a * x * x + b * x + c).toFixed(2)}`; }).join(' ');
  const grid = Array.from({ length: 7 }, (_, i) => { const x = px + i * (w - 2 * px) / 6; return `<line x1="${x}" y1="${py}" x2="${x}" y2="${h - py}"/>`; }).join('') + Array.from({ length: 5 }, (_, i) => { const y = py + i * (h - 2 * py) / 4; return `<line x1="${px}" y1="${y}" x2="${w - px}" y2="${y}"/>`; }).join('');
  const rootMarks = task.roots.map(root => `<circle cx="${X(root)}" cy="${Y(0)}" r="3" fill="#739852" stroke="#fbfcf7" stroke-width="1.5"/>${reveal ? `<text x="${X(root)}" y="${Math.min(h - 3, Y(0) + 14)}" text-anchor="middle" font-size="8" fill="#6b7f59">${format(root, 2)}</text>` : ''}`).join('');
  // SVG strings contain numbers produced by the trusted math engine, never learner text.
  $('graph').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><clipPath id="plot-clip"><rect x="${px}" y="${py}" width="${w - px * 2}" height="${h - py * 2}"/></clipPath></defs><g stroke="#e8eddf" stroke-width=".7">${grid}</g><line x1="${px}" y1="${Y(0)}" x2="${w - px + 4}" y2="${Y(0)}" stroke="#bdc9ad" stroke-width="1"/><line x1="${X(0)}" y1="${py}" x2="${X(0)}" y2="${h - py}" stroke="#bdc9ad" stroke-width="1"/><g clip-path="url(#plot-clip)">${task.level === 'advanced' ? `<rect x="${px}" y="${py}" width="${X(0) - px}" height="${h - 2 * py}" fill="#cdd7c5" opacity=".2"/>` : ''}<path d="${points}" stroke="#789b55" stroke-width="2.7" fill="none" stroke-linecap="round"/>${rootMarks}<circle cx="${X(selectedX)}" cy="${Y(selectedY)}" r="4" fill="#153e35" stroke="#fff" stroke-width="2"/></g><text x="${w - 9}" y="${Math.max(10, Y(0) - 6)}" font-size="9" fill="#87967a">${task.variable}</text><text x="${Math.min(w - 15, X(0) + 6)}" y="11" font-size="9" fill="#87967a">${task.level === 'advanced' ? 'h' : 'y'}</text></svg>`;
  $('graph-readout').textContent = `${task.variable} = ${format(selectedX, 2)} · ${task.level === 'advanced' ? 'h' : 'y'} = ${format(selectedY, 2)}`;
  $('graph').setAttribute('aria-label', `Graph of ${task.equation}. Opens ${a > 0 ? 'upwards' : 'downwards'}. ${reveal ? `Roots ${format(r1)} and ${format(r2)}.` : 'Two real intersections with the horizontal axis.'} Slider point: ${task.variable} ${format(selectedX, 2)}, height ${format(selectedY, 2)}.`);
  slider.setAttribute('aria-valuetext', `${task.variable} = ${format(selectedX, 2)}, ${task.level === 'advanced' ? 'height' : 'y'} = ${format(selectedY, 2)}`);
}

function setBusy(value) {
  busy = value;
  document.querySelectorAll('#coach-form button, .coach-suggestions button').forEach(b => { b.disabled = value; });
  $('coach-question').disabled = value;
  $('model-progress').hidden = !value;
  if (!value) clearTimeout(aiTimeout);
}

function cancelAI(message = 'AI request cancelled. Verified hints are ready whenever you need them.') {
  aiId++;
  worker?.terminate(); worker = undefined; modelReady = false;
  setBusy(false);
  $('ai-status').textContent = 'ON-DEVICE AI';
  $('coach-state').textContent = message;
}

function clearCoach() {
  if (busy) cancelAI();
  $('coach-answer').hidden = true;
  $('coach-answer').textContent = '';
  $('coach-state').textContent = modelReady ? 'Model loaded on your device · no API key' : 'Open-source language model · no API key';
  $('ai-status').textContent = 'ON-DEVICE AI';
  $('coach-question').value = '';
}

function render() {
  task = makeTask(level, seedIndex);
  const state = stateFor(task.key);
  document.querySelectorAll('[data-level]').forEach(tab => {
    const active = tab.dataset.level === level;
    tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
  });
  $('challenge-panel').setAttribute('aria-labelledby', `tab-${level}`);
  $('difficulty-tag').textContent = level.toUpperCase();
  $('task-focus').textContent = task.focus;
  $('task-id').textContent = `Q–${String(seedIndex + 1).padStart(3, '0')}`;
  $('task-title').textContent = task.title;
  $('task-description').textContent = task.description;
  $('equation').textContent = task.equation;
  $('equation').setAttribute('aria-label', task.equation.replace('²', ' squared '));
  $('equation-caption').textContent = task.caption;
  $('scaffold').replaceChildren(...task.scaffold.map(([title, text], i) => { const item = element('div', '', 'scaffold-step'); item.append(element('strong', `${String(i + 1).padStart(2, '0')} / ${title}`), document.createTextNode(text)); return item; }));
  $('answer-heading').textContent = task.heading;
  $('answer-note').textContent = task.note;
  for (let i = 1; i <= 2; i++) { $(`answer-label-${i}`).textContent = task.labels[i - 1]; $(`answer-${i}`).placeholder = task.placeholders[i - 1]; $(`answer-${i}`).value = state.answers[i - 1]; }
  $('graph-description').textContent = level === 'advanced' ? 'Times before t = 0 lie outside the physical model. The peak is the maximum height.' : 'Roots are where the curve crosses the x-axis.';
  renderHints(); renderSolution(); renderFeedback(); renderGraph(true); renderProgress(); clearCoach(); store();
}

document.querySelectorAll('[data-level]').forEach(tab => {
  tab.addEventListener('click', () => { level = tab.dataset.level; render(); });
  tab.addEventListener('keydown', e => {
    let next;
    if (e.key === 'ArrowRight') next = (LEVELS.indexOf(level) + 1) % 3;
    if (e.key === 'ArrowLeft') next = (LEVELS.indexOf(level) + 2) % 3;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = 2;
    if (next !== undefined) { e.preventDefault(); level = LEVELS[next]; render(); $(`tab-${level}`).focus(); }
  });
});
$('new-task').addEventListener('click', () => { seedIndex = (seedIndex + 1) % SEEDS.length; taskStates.clear(); render(); });
$('answer-form').addEventListener('submit', e => {
  e.preventDefault();
  const state = stateFor(task.key);
  state.answers = [$('answer-1').value, $('answer-2').value];
  state.feedback = checkAnswers(task, ...state.answers);
  state.correct = state.feedback.correct;
  if (state.correct) { solvedLevels.add(level); store(); renderProgress(); }
  renderFeedback(); renderGraph();
});
for (let i = 1; i <= 2; i++) $(`answer-${i}`).addEventListener('input', () => { const state = stateFor(task.key); state.answers[i - 1] = $(`answer-${i}`).value; });
$('hint-button').addEventListener('click', () => { const state = stateFor(task.key); if (state.hintsUsed < task.hints.length) state.hintsUsed++; renderHints(); });
$('solution-button').setAttribute('aria-controls', 'solution');
$('hint-button').setAttribute('aria-controls', 'hint-list');
$('solution-button').addEventListener('click', () => { const state = stateFor(task.key); state.solutionOpen = !state.solutionOpen; renderSolution(); renderGraph(); });
$('graph-slider').addEventListener('input', () => renderGraph());
$('reset-progress').addEventListener('click', () => { solvedLevels.clear(); store(); renderProgress(); });
$('about-button').addEventListener('click', () => $('about-dialog').showModal());
$('close-about').addEventListener('click', () => $('about-dialog').close());
$('about-dialog').addEventListener('click', e => { if (e.target === $('about-dialog')) { const b = $('about-dialog').getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) $('about-dialog').close(); } });
$('cancel-ai').addEventListener('click', () => cancelAI());

function showModelFailure(message) {
  setBusy(false);
  $('ai-status').textContent = 'AI UNAVAILABLE';
  $('coach-state').textContent = message;
  $('coach-answer').hidden = false;
  $('coach-answer').dataset.source = 'verified-fallback';
  $('coach-answer').textContent = `Verified guidance (not AI-generated):\n${task.hints[Math.min(stateFor(task.key).hintsUsed, task.hints.length - 1)]}`;
}

function askCoach(question) {
  if (busy || !question.trim()) return;
  const id = ++aiId, key = task.key, state = stateFor(key);
  $('coach-answer').hidden = true;
  $('ai-status').textContent = 'LOADING AI';
  $('coach-state').textContent = 'Preparing the model on your device. First use downloads model files; this may take a few minutes.';
  $('model-progress').querySelector('progress').removeAttribute('value');
  setBusy(true);
  try {
    if (!worker) {
      worker = new Worker(new URL('./ai.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.id !== aiId) return;
        if (data.type === 'ready') modelReady = true;
        if (data.type === 'status') $('coach-state').textContent = data.text;
        if (data.type === 'progress') {
          $('model-progress').querySelector('progress').value = data.value;
          $('coach-state').textContent = `Downloading ${data.file.split('/').at(-1)} · ${Math.round(data.value)}% (this file)`;
        }
        if (data.type === 'answer') {
          setBusy(false); $('ai-status').textContent = 'AI RESPONSE';
          $('coach-state').textContent = 'Generated on your device · check math with the verified walkthrough';
          $('coach-answer').hidden = false; $('coach-answer').dataset.source = 'model'; $('coach-answer').textContent = data.text;
        }
        if (data.type === 'error') {
          console.warn('[Quadratic Studio model]', data.detail);
          showModelFailure(data.text);
        }
      };
      worker.onerror = () => { worker?.terminate(); worker = undefined; modelReady = false; showModelFailure('AI could not start in this browser. Try a recent browser or use the verified hints.'); };
    }
    worker.postMessage({ id, messages: aiPrompt(task, question, { hintsUsed: state.hintsUsed, solutionOpen: state.solutionOpen, lastFeedback: state.feedback?.message }) });
    aiTimeout = setTimeout(() => { cancelAI(); showModelFailure('The model took too long to respond. You can retry or continue with verified hints.'); }, 180000);
  } catch { showModelFailure('This browser could not start on-device AI. Verified hints remain available.'); }
}
$('coach-form').addEventListener('submit', e => { e.preventDefault(); askCoach($('coach-question').value); });
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => askCoach(button.dataset.question)));
render();
