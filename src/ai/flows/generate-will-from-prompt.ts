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
  prompt: `You are an expert legal assistant tasked with drafting a "Last Will and Testament" (Wasiyat) for a user in Pakistan. You must strictly adhere to the template below, filling in the bracketed placeholders with information from the user's prompt.

The Will must be in **formal legal English** relevant to Pakistan.

User's wishes and instructions:
{{{prompt}}}

---

**WILL TEMPLATE - STRICTLY FOLLOW THIS FORMAT**

**LAST WILL AND TESTAMENT**

**Bismillah-ir-Rahman-ir-Rahim**
(In the Name of Allah, the Most Gracious, the Most Merciful)

**I. DECLARATION**

I, [Testator's Full Name], son/daughter of [Father's Name], holding CNIC No. [Testator's CNIC Number], resident of [Testator's Full Address], being of sound mind and memory, do hereby revoke all my previous wills, codicils, and testamentary dispositions and declare this to be my Last Will and Testament.

**II. PAYMENT OF DEBTS AND FUNERAL EXPENSES**

I direct my Executor, appointed hereunder, to first pay all my just debts, funeral expenses, and testamentary expenses from my estate.

**III. APPOINTMENT OF EXECUTOR**

I appoint my [Relationship to Testator, e.g., son], [Executor's Full Name], holding CNIC No. [Executor's CNIC], to be the Executor and Trustee of this my Will. If he/she is unwilling or unable to act, then I appoint [Alternate Executor's Name] to be the Executor.

**IV. BEQUESTS (WASIYAT)**

I direct that up to one-third (1/3) of my net estate (after payment of debts and funeral expenses) shall be distributed as follows:

*   [List specific bequests from user's prompt, e.g., "To my friend, John Doe, the sum of PKR 100,000." or "10% of my net assets to the Edhi Foundation."]

(If no specific bequests are mentioned in the prompt, state: "No specific bequests under the one-third (1/3) wasiyat portion have been specified.")

**V. DISTRIBUTION OF REMAINING ESTATE**

The residue of my estate, comprising all my movable and immovable properties, shall be distributed among my legal heirs strictly in accordance with the principles of Islamic Law of Inheritance (Fara'id).

**VI. ATTESTATION**

In witness whereof, I have set my hand to this my Last Will and Testament at [Place of Signing] on this [Date].

_________________________
**[Testator's Full Name]**
(Testator)

**WITNESSES**

We, the undersigned, do hereby certify that the above-named Testator, being of sound mind, signed this document in our presence, and we, at his/her request and in his/her presence, and in the presence of each other, have subscribed our names as witnesses.

**1. Witness**
   Name: _________________________
   CNIC: _________________________
   Address: _______________________
   Signature: ______________________

**2. Witness**
   Name: _________________________
   CNIC: _________________________
   Address: _______________________
   Signature: ______________________

---
The entire document must be in English.
Output must always be in a formal Pakistani legal document format, not casual writing.
Fill in the placeholders like [Testator's Full Name] using the user's prompt. If information is missing, leave the placeholder in the text.
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
