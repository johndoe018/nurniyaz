import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, SEEDS, makeTask, solveQuadratic, parseAnswer, checkAnswers, aiPrompt } from '../src/math.js';

test('all 24 differentiated tasks have correct roots and canonical answers', () => {
  for (let i = 0; i < SEEDS.length; i++) for (const level of LEVELS) {
    const task = makeTask(level, i);
    assert.equal(task.roots.length, 2);
    for (const root of task.roots) assert.ok(Math.abs(task.a * root ** 2 + task.b * root + task.c) < 1e-8, `${task.key}: root substitution`);
    const inputs = level === 'advanced' ? [task.landingTime, task.vertexY] : task.roots;
    assert.equal(checkAnswers(task, ...inputs.map(String)).correct, true, task.key);
    assert.equal(checkAnswers(task, ...inputs.map(x => x.toFixed(2))).correct, true, `${task.key}: rounded answers`);
    assert.equal(checkAnswers(task, ...inputs.map(x => String(x + 1))).correct, false, `${task.key}: wrong answers`);
    assert.equal(task.hints.length, 3);
    assert.ok(task.steps.length >= 5);
  }
});

test('foundation always has factorable positive integer roots', () => {
  for (let i = 0; i < SEEDS.length; i++) {
    const t = makeTask('foundation', i);
    assert.deepEqual(t.roots.map(Math.round), SEEDS[i]);
    assert.equal(t.roots[0] + t.roots[1], -t.b);
    assert.equal(t.roots[0] * t.roots[1], t.c);
    assert.equal(checkAnswers(t, String(t.q), String(t.p)).correct, true);
    assert.equal(checkAnswers(t, String(t.p), String(t.p)).correct, false);
  }
});

test('standard introduces non-monic coefficients and distinct irrational roots', () => {
  for (let i = 0; i < SEEDS.length; i++) {
    const t = makeTask('standard', i);
    assert.equal(t.a, 2);
    assert.ok(t.discriminant > 0);
    assert.equal(Number.isInteger(Math.sqrt(t.discriminant)), false);
    assert.equal(checkAnswers(t, `(${-t.b}-sqrt(${t.discriminant}))/${2 * t.a}`, `(${-t.b}+sqrt(${t.discriminant}))/${2 * t.a}`).correct, true);
  }
});

test('advanced uses a physically meaningful landing time and actual maximum', () => {
  for (let i = 0; i < SEEDS.length; i++) {
    const t = makeTask('advanced', i);
    assert.ok(t.roots[0] < 0 && t.landingTime > 0);
    assert.ok(t.vertexX > 0 && t.vertexX < t.landingTime);
    assert.equal(2 * t.a * t.vertexX + t.b, 0);
    assert.ok(t.vertexY > t.c);
    assert.equal(checkAnswers(t, String(t.roots[0]), String(t.vertexY)).correct, false);
    assert.equal(checkAnswers(t, String(t.vertexY), String(t.landingTime)).correct, false);
  }
});

test('the parser handles exact fractions, radicals, signs and normal arithmetic', () => {
  for (const [input, value] of [['2', 2], ['−3.5', -3.5], ['1/4', .25], ['sqrt(49)', 7], ['(5-sqrt(7))/2', (5 - Math.sqrt(7)) / 2], [' √(9) + 1 ', 4], ['2^3', 8], ['-2^2', -4], ['2*3+4/2', 8], ['1e-3', .001]]) assert.equal(parseAnswer(input), value, input);
});

test('the parser rejects unsafe, malformed and non-real input', () => {
  for (const input of ['', ' ', 'Infinity', 'NaN', '1/0', 'sqrt(-1)', '2abc', 'globalThis', 'alert(1)', '1;alert(1)', '2**3', '(2+3', '2+3)', 'sqrt(9', '1e9999', '2^9999', '('.repeat(80) + '2' + ')'.repeat(80), '-'.repeat(40) + '2']) assert.throws(() => parseAnswer(input), undefined, input);
  assert.equal(checkAnswers(makeTask('standard'), '', '').invalid, true);
});

test('the solver handles repeated, zero, complex and unstable roots', () => {
  assert.deepEqual(solveQuadratic(1, -4, 4).roots, [2, 2]);
  assert.deepEqual(solveQuadratic(1, 0, 0).roots, [0, 0]);
  assert.equal(solveQuadratic(1, 2, 0).roots[1], 0);
  assert.deepEqual(solveQuadratic(1, 0, 1).roots, []);
  assert.ok(solveQuadratic(1, 1e8, 1).roots.some(x => Math.abs(x + 1e-8) < 1e-15));
  assert.throws(() => solveQuadratic(0, 2, 3));
});

test('prompts adapt to all levels and reveal final results only with an open walkthrough', () => {
  for (const level of LEVELS) {
    const task = makeTask(level);
    const closed = aiPrompt(task, 'Help me', { hintsUsed: 0 });
    const open = aiPrompt(task, 'Help me', { solutionOpen: true });
    assert.ok(closed[0].content.includes('hint rather than the final answer'));
    assert.ok(closed[1].content.includes(`LEVEL: ${level}`));
    assert.ok(closed[1].content.includes(task.equation));
    assert.ok(!closed[1].content.includes('VERIFIED RESULT:'));
    assert.ok(open[1].content.includes(`VERIFIED RESULT: ${task.answerText}`));
  }
});
