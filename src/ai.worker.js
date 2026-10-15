import { pipeline, env, LogitsProcessor } from '@huggingface/transformers';
import { maskChoiceLogits } from './ai-policy.js';

// Browser-only inference: no credentials, student-upload endpoint or application server.
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;
let generator;

class GuidanceChoices extends LogitsProcessor {
  constructor(ids) { super(); this.ids = ids; }
  _call(inputIds, logits) {
    for (let i = 0; i < inputIds.length; i++) maskChoiceLogits(logits[i].data, this.ids);
    return logits;
  }
}

self.onmessage = async ({ data }) => {
  const { id, messages } = data;
  try {
    if (!generator) {
      self.postMessage({ id, type: 'status', text: 'Downloading the open-source model. First use can take a few minutes.' });
      generator = await pipeline('text-generation', 'HuggingFaceTB/SmolLM2-135M-Instruct', {
        device: 'wasm', dtype: 'q4',
        progress_callback: progress => {
          if (progress.status === 'progress') self.postMessage({ id, type: 'progress', value: progress.progress, file: progress.file });
        },
      });
    }
    self.postMessage({ id, type: 'ready' });
    self.postMessage({ id, type: 'status', text: 'Thinking about your equation…' });
    const ids = ['A', 'B', 'C', 'D'].map(label => {
      const encoded = generator.tokenizer.encode(label, { add_special_tokens: false });
      if (encoded.length !== 1) throw new Error('Guidance labels must each have one model token.');
      return Number(encoded[0]);
    });
    const result = await generator(messages, { max_new_tokens: 1, do_sample: false, return_full_text: false, logits_processor: [new GuidanceChoices(ids)] });
    const generated = result?.[0]?.generated_text;
    const answer = typeof generated === 'string' ? generated : generated?.at(-1)?.content;
    const choice = answer?.trim();
    if (!['A', 'B', 'C', 'D'].includes(choice)) throw new Error('The model returned no valid guidance choice.');
    self.postMessage({ id, type: 'answer', choice });
  } catch (error) {
    self.postMessage({ id, type: 'error', text: 'The language model could not run on this connection or device. Verified hints and the walkthrough are still available.', detail: String(error?.message ?? error).slice(0, 200) });
  }
};
