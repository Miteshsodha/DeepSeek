export const maxDuration = 60;
export const runtime = "nodejs";

import OpenAI from "openai";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Chat from "@/models/Chat";
import connectDB from "@/config/db";
import mongoose from "mongoose";

// DeepSeek client (with timeout to prevent slow fails)
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  timeout: 60000,
});

export async function POST(req) {
  try {
    // Auth
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

    // Save user message (NEW CORRECT FORMAT)
    const userMessage = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };

    data.messages.push(userMessage);

    // 🔥 CRITICAL FIX: Support OLD + NEW message schema
    // Old schema: { name, content }
    // New schema: { role, content }
    const safeMessages = (data.messages || []).map((msg) => {
      // Convert old messages that used "name" instead of "role"
      let role = msg.role;

      if (!role) {
        if (msg.name === "assistant") role = "assistant";
        else role = "user";
      }

      return {
        role: role === "assistant" ? "assistant" : "user",
        content: msg.content || "",
      };
    });

    // 🚀 PERFORMANCE FIX: Limit history (prevents slow + API fail)
    const limitedMessages = safeMessages.slice(-10);

    console.log("Messages sent to DeepSeek:", limitedMessages);

    // DeepSeek API call
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: limitedMessages,
        temperature: 0.7,
        max_tokens: 500,
      });
    } catch (deepseekError) {
      console.error(
        "DeepSeek Error Full:",
        deepseekError?.response?.data || deepseekError
      );

      return NextResponse.json(
        {
          success: false,
          message: "DeepSeek API failed",
          error: deepseekError.message,
        },
        { status: 500 }
      );
    }

    // Safe AI response parsing (prevents crash)
    const aiContent =
      completion?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    // Save assistant message (NEW FORMAT)
    const assistantMessage = {
      role: "assistant",
      content: aiContent,
      timestamp: Date.now(),
    };

    data.messages.push(assistantMessage);
    await data.save();

    console.log("Chat saved successfully");

    // Response format (kept same for your frontend)
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
