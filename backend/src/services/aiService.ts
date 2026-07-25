import OpenAI from 'openai';
import { env } from '../config/env';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!env.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return openaiClient;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
}

export interface TagResult {
  tags: string[];
}

export async function generateSummary(content: string): Promise<SummaryResult> {
  const openai = getOpenAIClient();

  const prompt = `
You are an AI assistant that summarizes notes. 
Given the following note content, generate:
1. A concise summary (2-3 sentences)
2. Key bullet points (3-5 points)

Return your response as JSON with "summary" and "keyPoints" fields.

Note content:
${content}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    summary: result.summary || '',
    keyPoints: result.keyPoints || [],
  };
}

export async function generateTags(content: string): Promise<TagResult> {
  const openai = getOpenAIClient();

  const prompt = `
You are an AI assistant that generates tags for notes.
Given the following note content, generate 5-10 relevant tags.
Return your response as JSON with a "tags" field containing an array of strings.

Note content:
${content}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 200,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    tags: result.tags || [],
  };
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

export async function answerQuestion(
  question: string,
  context: string
): Promise<string> {
  const openai = getOpenAIClient();

  const prompt = `
You are an AI assistant that answers questions based on provided context.
Answer the question using the context provided. If the answer is not in the context, say so.

Context:
${context}

Question: ${question}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
  });

  return response.choices[0].message.content || '';
}
