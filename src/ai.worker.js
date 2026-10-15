import { pipeline, env } from '@huggingface/transformers';

// Browser-only inference: no credentials, student-upload endpoint or application server.
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;
let generator;

self.onmessage = async ({ data }) => {
  const { id, messages } = data;
  try {
    if (!generator) {
      self.postMessage({ id, type: 'status', text: 'Downloading the open-source model. First use can take a few minutes.' });
      generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct', {
        device: 'wasm', dtype: 'q4',
        progress_callback: progress => {
          if (progress.status === 'progress') self.postMessage({ id, type: 'progress', value: progress.progress, file: progress.file });
        },
      });
    }
    self.postMessage({ id, type: 'ready' });
    self.postMessage({ id, type: 'status', text: 'Thinking about your equation…' });
    const result = await generator(messages, { max_new_tokens: 110, do_sample: false, repetition_penalty: 1.15, return_full_text: false });
    const generated = result?.[0]?.generated_text;
    const answer = typeof generated === 'string' ? generated : generated?.at(-1)?.content;
    if (!answer?.trim()) throw new Error('The model returned no explanation.');
    self.postMessage({ id, type: 'answer', text: answer.trim() });
  } catch (error) {
    self.postMessage({ id, type: 'error', text: 'The language model could not run on this connection or device. Verified hints and the walkthrough are still available.', detail: String(error?.message ?? error).slice(0, 200) });
  }
};
