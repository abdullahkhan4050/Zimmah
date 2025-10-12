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
Generate the user’s Wasiyat strictly following the professional template below.
Preserve all headings, spacing, and formal structure exactly as shown.
Use the user's input to fill in the bracketed sections like [write here].

User input:
{{{prompt}}}

Template:
### 🕌 WASIYAT (ISLAMIC WILL)

**بِسْمِ اللّٰہِ الرَّحْمٰنِ الرَّحِیْم**  
**In the Name of Allah, the Most Gracious, the Most Merciful**

This document serves as the Islamic Will (Wasiyat) of:
**Full Name:** [Enter Full Name]
**Father’s Name:** [Enter Father’s Name]
**Residential Address:** [Enter Address]
**Date of Declaration:** [Enter Date]

---

**1. Declaration**

I, [Full Name], [write here]

**2. Funeral and Burial Instructions**

[write here]

**3. Debts and Financial Obligations**

[write here]

**4. Distribution of Assets**

[write here]

**5. Appointment of Executor**

I hereby appoint **[Executor’s Full Name]**,
**Relation:** [Relation to Testator]
**Contact:** [Phone / Email]
as the Executor of this Will. The Executor shall be responsible for ensuring that all instructions in this Wasiyat are executed faithfully and in compliance with Islamic Law.

**6. Special Instructions (if any)**

[Provide any specific instructions, donations, trusts, or waqf details here.]

---

**7. Witnesses**

This Wasiyat is made and signed in the presence of the following witnesses, who affirm that the Testator executed this document willingly and in full awareness.

**Witness 1:**
Name: ___________________________
CNIC: ___________________________
Signature: ___________________________

**Witness 2:**
Name: ___________________________
CNIC: ___________________________
Signature: ___________________________

**Signature of Testator (Wasiy):** ___________________________
**Date:** ___________________________
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
