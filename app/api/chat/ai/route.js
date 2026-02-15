export const maxDuration = 60;
export const runtime = "nodejs";

import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Chat from "@/models/Chat";
import connectDB from "@/config/db";
import mongoose from "mongoose";

// Initialize DeepSeek client (OpenAI-compatible)
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1", // FIX: must include /v1
});

export async function POST(req) {
  try {
    // FIX: Correct Clerk auth for App Router
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    const { chatId, prompt } = await req.json();

    console.log("Request:", { userId, chatId, prompt });

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, message: "Prompt is required" },
        { status: 400 }
      );
    }

    // Connect DB
    await connectDB();

    // FIX: Convert chatId to ObjectId (very important)
    const data = await Chat.findOne({
      userId,
      _id: new mongoose.Types.ObjectId(chatId),
    });

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 }
      );
    }

    // Add user message
    const userMessage = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };

    data.messages.push(userMessage);

    // FIX: Send full chat history to DeepSeek (better responses)
    const formattedMessages = data.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log("Calling DeepSeek API...");

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: formattedMessages,
      temperature: 0.7,
    });

    const aiMessage = completion.choices?.[0]?.message;

    if (!aiMessage) {
      throw new Error("No response from DeepSeek API");
    }

    const assistantMessage = {
      role: "assistant",
      content: aiMessage.content,
      timestamp: Date.now(),
    };

    // Save AI response
    data.messages.push(assistantMessage);
    await data.save();

    console.log("Chat saved successfully");

    return NextResponse.json(
      { success: true, data: assistantMessage },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        type: error.name,
      },
      { status: 500 }
    );
  }
}
