export const maxDuration = 60;
export const runtime = "nodejs";

import OpenAI from "openai";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Chat from "@/models/Chat";
import connectDB from "@/config/db";
import mongoose from "mongoose";

console.log("ENV KEY:", process.env.DEEPSEEK_API_KEY);
// DeepSeek client
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

export async function POST(req) {
  try {
    // ✅ FIX 1: Pass req to getAuth (VERY IMPORTANT)
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { chatId, prompt } = body;

    console.log("Request:", { userId, chatId, prompt });

    // ✅ FIX 2: Validate chatId (prevents 500 crash)
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing chatId" },
        { status: 400 }
      );
    }

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, message: "Prompt is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ FIX 3: Do NOT manually convert to ObjectId (safer)
    const data = await Chat.findOne({
      _id: chatId,
      userId: userId,
    });

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Chat not found for this user" },
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

    const formattedMessages = data.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log("Calling DeepSeek API...");

    // ✅ FIX 4: Safe DeepSeek call with error isolation
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: formattedMessages,
        temperature: 0.7,
      });
    } catch (deepseekError) {
      console.error("DeepSeek Error:", deepseekError);
      return NextResponse.json(
        {
          success: false,
          message: "DeepSeek API failed",
          error: deepseekError.message,
        },
        { status: 500 }
      );
    }

    const aiMessage = completion?.choices?.[0]?.message;

    if (!aiMessage || !aiMessage.content) {
      return NextResponse.json(
        { success: false, message: "No response from DeepSeek API" },
        { status: 500 }
      );
    }

    const assistantMessage = {
      role: "assistant",
      content: aiMessage.content,
      timestamp: Date.now(),
    };

    data.messages.push(assistantMessage);
    await data.save();

    console.log("Chat saved successfully");

    return NextResponse.json(
      { success: true, data: assistantMessage },
      { status: 200 }
    );
  } catch (error) {
    console.error("FULL API CRASH:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
        type: error.name,
      },
      { status: 500 }
    );
  }
}
