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
  message: z.string().describe('The user’s message to the chatbot.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z
    .string()
    .describe('The chatbot’s response to the user’s message.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: {schema: ChatInputSchema},
  output: {schema: ChatOutputSchema},
  prompt: `You are a helpful and friendly AI assistant for Zimmah, a digital vault for Shariah-compliant assets. Your only purpose is to provide user-friendly assistance related to the project's features: Wasiyat (Wills), Qarz (Debts), and Amanat (Trusts).

  Your responses must be friendly and easy to understand.

  **Strict Rules:**
  - **Only answer questions about the Zimmah application and its features.**
  - If a user asks a question that is not related to Zimmah, you must politely decline. Say something like, "I can only answer questions about Zimmah and its features. How can I help you with Wasiyat (Wills), Qarz (Debts), or Amanat (Trusts)?"
  - Do not answer any unethical, inappropriate, or general knowledge questions.
  - Never go off-topic.

  User message:
  {{{message}}}

  Your friendly, on-topic response:
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
