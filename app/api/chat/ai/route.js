export const maxDuration = 60;
export const runtime = "nodejs";

import OpenAI from "openai";
import { getAuth } from "@clerk/nextjs/server"; // ✅ FIXED
import { NextResponse } from "next/server";
import Chat from "@/models/Chat";
import connectDB from "@/config/db";
import mongoose from "mongoose";

// DeepSeek client
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

export async function POST(req) {
  try {
    // ✅ FIX 1: Correct Clerk auth for App Router
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

    // Validate inputs
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

    // Find chat for this user
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

    // Add user message to DB
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

    // DeepSeek API call
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "deepseek-chat", // or deepseek-reasoner if using R1
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

    const aiContent = completion?.choices?.[0]?.message?.content;

    if (!aiContent) {
      return NextResponse.json(
        { success: false, message: "No response from DeepSeek API" },
        { status: 500 }
      );
    }

    const assistantMessage = {
      role: "assistant",
      content: aiContent,
      timestamp: Date.now(),
    };

    data.messages.push(assistantMessage);
    await data.save();

    console.log("Chat saved successfully");

    // ✅ IMPORTANT: Matches your frontend format
    return NextResponse.json(
      {
        success: true,
        data: {
          content: assistantMessage.content,
          role: "assistant",
          timestamp: assistantMessage.timestamp,
        },
      },
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
