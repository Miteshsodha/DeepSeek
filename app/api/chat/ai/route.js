export const maxDuration = 60;
import OpenAI from "openai";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Chat from "@/models/Chat";
import connectDB from "@/config/db";

// Initialize OpenAI client with DeepSeek API key and base URL
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req) {
    try {
        const { userId } = getAuth(req)

        // Extract chatId and prompt from the request body
        const { chatId, prompt } = await req.json();

        console.log("Received request - userId:", userId, "chatId:", chatId, "prompt:", prompt);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "User not authenticated",
            }, { status: 401 });
        }

        if (!prompt || !prompt.trim()) {
            return NextResponse.json({
                success: false,
                message: "Prompt is required",
            }, { status: 400 });
        }

        // Find the chat document in the database based on userId and chatId
        await connectDB();
        const data = await Chat.findOne({ userId, _id: chatId })

        if (!data) {
            console.error("Chat not found - userId:", userId, "chatId:", chatId);
            return NextResponse.json({
                success: false,
                message: "Chat not found",
            }, { status: 404 });
        }

        // Create a user message object
        const userPrompt = {
            role: "user",
            content: prompt,
            timestamp: Date.now()
        };

        data.messages.push(userPrompt);

        // Call the DeepSeek API to get a chat completion
        console.log("Calling DeepSeek API with model: deepseek-chat");
        
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-chat",
        });

        console.log("DeepSeek response received:", completion);

        if (!completion.choices || !completion.choices[0]) {
            throw new Error("No response from DeepSeek API");
        }

        const message = completion.choices[0].message;
        message.timestamp = Date.now()
        data.messages.push(message);
        await data.save();

        console.log("Chat saved successfully");

        return NextResponse.json({success: true, data: message}, { status: 200 })

    } catch (error) {
        console.error("API Error Details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        return NextResponse.json({
            success: false,
            error: error.message,
            type: error.name
        }, { status: 500 })
    }
}
