'use server';
/**
 * @fileOverview A simple chatbot that uses Gemini to respond to user messages.
 *
 * - chat - A function that takes a user message and returns a response.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatInputSchema = z.object({
  message: z.string().describe('The user\u2019s message to the chatbot.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z
    .string()
    .describe('The chatbot\u2019s response to the user\u2019s message.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: {schema: ChatInputSchema},
  output: {schema: ChatOutputSchema},
  prompt: `You are a helpful AI assistant for Zimmah, a digital vault for Shariah-compliant assets. Your goal is to be user-friendly and provide assistance related to the project's features: Wasiyat (Wills), Qarz (Debts), and Amanat (Trusts).

  - Do not answer any questions that are outside the scope of the Zimmah application. If a user asks an irrelevant question, politely decline and steer the conversation back to the app's features.
  - Do not answer any unethical or inappropriate questions.
  - Maintain a helpful and friendly tone.

  User message:
  {{{message}}}

  Your response:
`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    const {output} = await chatPrompt(input);
    return output!;
  }
);
