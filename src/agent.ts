import { complete, type Message } from './interceptors/model.js';
import { runTool } from './interceptors/tool.js';
import { TOOL_SCHEMAS } from './tools.js';

const MODEL = process.env.RW_MODEL ?? 'gpt-4o-mini';
const MAX_STEPS = 8;

const TASKS: Record<string, string> = {
  'fix-failing-test':
    'The test in test/sum.test.ts fails. Read src/sum.ts and report the defect and the minimal fix.',
  'triage-sentry-issue':
    'Summarise the stack trace in one paragraph and name the most likely cause.',
  'migrate-endpoint':
    'Run the test suite and report which tests fail.'
};

async function main(): Promise<void> {
  const task = process.argv[2] ?? '';
  const prompt = TASKS[task];
  if (!prompt) throw new Error(`unknown task ${task}`);

  const messages: Message[] = [{ role: 'user', content: prompt }];
  let steps = 0;

  for (; steps < MAX_STEPS; steps += 1) {
    const response = await complete({
      model: MODEL,
      messages,
      tools: TOOL_SCHEMAS,
      temperature: 0,
      max_tokens: 900
    });

    messages.push({
      role: 'assistant',
      content: response.content,
      tool_calls: response.tool_calls
    });

    if (response.tool_calls.length === 0) {
      process.stdout.write(`${response.content}\n`);
      (globalThis as unknown as { __rw: unknown }).__rw = { status: 'ok', steps: steps + 1, output: response.content };
      return;
    }

    for (const call of response.tool_calls) {
      const value = await runTool(call.name, call.args);
      messages.push({ role: 'tool', content: value, tool_call_id: call.id });
    }
  }

  throw new Error('MAX_STEPS_EXCEEDED');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  (globalThis as unknown as { __rw: unknown }).__rw = { status: 'error', steps: 0, output: message };
  process.exitCode = 1;
});
