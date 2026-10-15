/** Keep the model's ranking of valid choices; exclude every other output token. */
export function maskChoiceLogits(values, allowedIds) {
  if (!allowedIds.length || allowedIds.some(id => !Number.isInteger(id) || id < 0 || id >= values.length)) throw new Error('Invalid model choice tokens.');
  const retained = allowedIds.map(id => values[id]);
  if (!retained.some(Number.isFinite)) throw new Error('The model did not score the guidance choices.');
  values.fill(-Infinity);
  allowedIds.forEach((id, i) => { values[id] = retained[i]; });
  return values;
}
