import { getSession } from '../session.js';
import { RewindError } from '../errors.js';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ModelRequest {
  model: string;
  messages: Message[];
  tools: unknown[];
  temperature: number;
  max_tokens: number;
}

export interface ModelResponse {
  content: string;
  tool_calls: ToolCall[];
  usage: { in: number; out: number };
}

async function live(request: ModelRequest): Promise<ModelResponse> {
  const base = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  const key = process.env.OPENAI_API_KEY ?? '';

  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages.map((message) => ({
        role: message.role,
        content: message.content,
        ...(message.tool_calls ? { tool_calls: message.tool_calls.map((call) => ({ id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.args) } })) } : {}),
        ...(message.tool_call_id ? { tool_call_id: message.tool_call_id } : {})
      })),
      tools: request.tools.map((tool) => ({ type: 'function', function: tool })),
      temperature: request.temperature,
      max_tokens: request.max_tokens
    })
  });

  if (!response.ok) throw new Error(`model ${response.status}`);

  const body = (await response.json()) as {
    choices?: { message?: { content?: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[] } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const choice = body.choices?.[0]?.message;
  const calls = (choice?.tool_calls ?? []).map((call) => ({
    id: call.id,
    name: call.function.name,
    args: JSON.parse(call.function.arguments || '{}') as Record<string, unknown>
  }));

  return {
    content: choice?.content ?? '',
    tool_calls: calls,
    usage: { in: body.usage?.prompt_tokens ?? 0, out: body.usage?.completion_tokens ?? 0 }
  };
}

export async function complete(request: ModelRequest): Promise<ModelResponse> {
  const session = getSession();
  if (!session) return live(request);

  if (session.mode === 'record') {
    session.writer?.append('model.request', request as unknown as Record<string, unknown>);
    const response = await live(request);
    session.writer?.append('model.response', response as unknown as Record<string, unknown>);
    return response;
  }

  session.reader?.next('model.request', request as unknown as Record<string, unknown>);
  const recorded = session.reader?.next('model.response') as ModelResponse | undefined;
  if (!recorded) throw new RewindError('LIVE_ACCESS_IN_REPLAY', 'no recorded model response');
  return recorded;
}
