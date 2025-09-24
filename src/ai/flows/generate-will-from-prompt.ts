'use server';

/**
 * @fileOverview Generates a will draft (Wasiyat) based on a user-provided prompt, adhering to Shariah principles.
 *
 * - generateWillFromPrompt - A function that generates a will draft based on user input.
 * - GenerateWillInput - The input type for the generateWillFromPrompt function.
 * - GenerateWillOutput - The return type for the generateWillFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWillInputSchema = z.object({
  prompt: z.string().describe('A detailed description of the user\u2019s wishes for their will, including beneficiaries, assets, and any specific instructions.'),
});
export type GenerateWillInput = z.infer<typeof GenerateWillInputSchema>;

const GenerateWillOutputSchema = z.object({
  willDraft: z.string().describe('A draft of the will (Wasiyat) generated based on the user\u2019s prompt and Shariah principles.'),
});
export type GenerateWillOutput = z.infer<typeof GenerateWillOutputSchema>;

export async function generateWillFromPrompt(input: GenerateWillInput): Promise<GenerateWillOutput> {
  return generateWillFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWillFromPromptPrompt',
  input: {schema: GenerateWillInputSchema},
  output: {schema: GenerateWillOutputSchema},
  prompt: `You are tasked with drafting a "Last Will and Testament" for users in Pakistan. The Will must:
1.  Be written in formal legal language, following the style commonly used in Pakistan.
2.  Begin with an Islamic greeting and a declaration (e.g., “Bismillah-ir-Rahman-ir-Rahim” and “This is the Last Will and Testament of …”).
3.  Include standard sections:
    - Testator’s details (name, CNIC, address).
    - Revocation of previous wills.
    - Distribution of assets according to Islamic inheritance principles (unless user specifies otherwise).
    - Appointment of executor/trustee.
    - Witness details.
    - Date and place of signing.
4.  Avoid foreign or Western phrasing. Keep it culturally and legally relevant for Pakistan.
5.  Use respectful, precise, and unambiguous wording.

User's wishes and instructions:
{{{prompt}}}

Output must always be in a formal Pakistani legal document format, not casual writing.
  `,
});

const generateWillFromPromptFlow = ai.defineFlow(
  {
    name: 'generateWillFromPromptFlow',
    inputSchema: GenerateWillInputSchema,
    outputSchema: GenerateWillOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
