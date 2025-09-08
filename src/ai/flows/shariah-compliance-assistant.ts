'use server';
/**
 * @fileOverview AI-powered tips and reminders for Shariah compliance.
 *
 * - getShariahComplianceTips - A function that provides Shariah compliance tips.
 * - ShariahComplianceInput - The input type for the getShariahComplianceTips function.
 * - ShariahComplianceOutput - The return type for the getShariahComplianceTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShariahComplianceInputSchema = z.object({
  financialPractice: z
    .string()
    .describe('The specific financial practice to evaluate for Shariah compliance.'),
  userDetails: z
    .string()
    .optional()
    .describe('Optional details about the user and their specific circumstances.'),
});
export type ShariahComplianceInput = z.infer<typeof ShariahComplianceInputSchema>;

const ShariahComplianceOutputSchema = z.object({
  complianceTips: z
    .string()
    .describe('AI-powered tips and reminders to ensure Shariah compliance.'),
  isCompliant: z.boolean().describe('Whether the financial practice is Shariah compliant.'),
  reasoning: z
    .string()
    .optional()
    .describe('The reasoning behind the compliance determination.'),
});
export type ShariahComplianceOutput = z.infer<typeof ShariahComplianceOutputSchema>;

export async function getShariahComplianceTips(
  input: ShariahComplianceInput
): Promise<ShariahComplianceOutput> {
  return shariahComplianceFlow(input);
}

const shariahCompliancePrompt = ai.definePrompt({
  name: 'shariahCompliancePrompt',
  input: {schema: ShariahComplianceInputSchema},
  output: {schema: ShariahComplianceOutputSchema},
  prompt: `You are an AI assistant specialized in Shariah-compliant finance.

You will evaluate a given financial practice and provide tips and reminders to ensure adherence to Shariah principles. You will also determine if the practice is compliant and provide a reasoning for your determination.  Consider the user details, if available, when evaluating the financial practice.

Financial Practice: {{{financialPractice}}}
User Details: {{{userDetails}}}

Respond in a helpful and informative manner.

Ensure you answer the questions. Output the answer in JSON format.
`,
});

const shariahComplianceFlow = ai.defineFlow(
  {
    name: 'shariahComplianceFlow',
    inputSchema: ShariahComplianceInputSchema,
    outputSchema: ShariahComplianceOutputSchema,
  },
  async input => {
    const {output} = await shariahCompliancePrompt(input);
    return output!;
  }
);
