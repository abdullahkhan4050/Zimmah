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
1.  Be written in **formal legal English**, following the style commonly used in Pakistan.
2.  Begin with 'Bismillah' and a formal declaration that it is the Last Will and Testament.
3.  Include the testator’s full name, CNIC number, and residential address.
4.  Clearly state that funeral expenses and debts will be paid before distribution.
5.  Distribute all assets (movable and immovable) according to Islamic inheritance (Shariah) rules, unless otherwise specified by the user's prompt.
6.  Appoint an Executor/Trustee with their full name, CNIC, and relationship to the testator.
7.  Add space for two witnesses with their names, CNICs, and addresses.
8.  End with a declaration of validity, date, place, and signatures of the testator and witnesses.
9.  Avoid foreign or Western phrasing. Keep it culturally and legally relevant for Pakistan.
10. Use respectful, precise, and unambiguous wording.
11. The entire document must be in English.

User's wishes and instructions:
{{{prompt}}}

Output must always be in a **formal Pakistani legal document format**, not casual writing.
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
