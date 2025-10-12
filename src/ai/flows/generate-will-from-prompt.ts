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
  prompt: `
Generate an Islamic Wasiyat (Will) using the following fixed format.
Always fill in the headings and text clearly, but do not change the structure or headings.

User input:
{{{prompt}}}

Format output exactly like this:
### 🕌 WASIYAT (ISLAMIC WILL)

**بِسْمِ اللّٰہِ الرَّحْمٰنِ الرَّحِیْم**  
**In the Name of Allah, the Most Gracious, the Most Merciful**

This is the Wasiyat (Last Will) of **[Full Name]**,  
son/daughter of **[Father’s Name]**,  
residing at **[Address]**.

---

**1. Declaration:**  
[Fill here]

**2. Funeral and Burial:**  
[Fill here]

**3. Debts and Obligations:**  
[Fill here]

**4. Distribution of Property:**  
[Fill here]

**5. Appointment of Executor:**  
[Fill here]

**6. Special Instructions:**  -
[Fill here]

---

**Witness 1:** ________________________  
**Witness 2:** ________________________  

**Signature of Testator:** ________________________  
**Date:** ________________________
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
