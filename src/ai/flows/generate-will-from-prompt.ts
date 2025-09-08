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
  prompt: `You are an expert in Islamic inheritance law (Fara'id) and will drafting (Wasiyat).

  Based on the user's wishes and instructions provided in the prompt, you will generate a draft of their will (Wasiyat) that adheres to Shariah principles.

  Consider the following key aspects when drafting the will:

  1.  Beneficiaries: Identify all beneficiaries and their relationship to the testator (the person making the will).
  2.  Assets: List all assets to be included in the will, such as real estate, bank accounts, investments, and personal property.
  3.  Inheritance Shares: Determine the appropriate inheritance shares for each beneficiary based on Islamic law.
  4.  Specific Instructions: Include any specific instructions or conditions the testator wishes to include in their will.

  User's wishes and instructions:
  {{{prompt}}}

  Draft the will in a clear and concise manner, using appropriate legal and Islamic terminology.
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
