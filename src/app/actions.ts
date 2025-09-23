"use server";

import { generateWillFromPrompt, GenerateWillInput } from "@/ai/flows/generate-will-from-prompt";
import { getShariahComplianceTips, ShariahComplianceInput } from "@/ai/flows/shariah-compliance-assistant";
import { chat, ChatInput } from "@/ai/flows/chatbot";

export async function generateWillAction(input: GenerateWillInput) {
    try {
        const result = await generateWillFromPrompt(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to generate will draft." };
    }
}


export async function getComplianceTipsAction(input: ShariahComplianceInput) {
    try {
        const result = await getShariahComplianceTips(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to get compliance tips." };
    }
}

export async function chatAction(input: ChatInput) {
    try {
        const result = await chat(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to get chat response." };
    }
}
