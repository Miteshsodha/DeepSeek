import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import {auth} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";
import { use } from "react";

export async function POST(req) {
    try {
        const { userId } = auth();
        const {chatId} = await req.json();

        if(!userId) {
            return NextResponse.json({success: false, message: "User not authenticated",})
        }


    // Connect to database and delete the chat

    await connectDB();
    await Chat.deleteOne({_id: chatId, userId})

    return NextResponse.json({ success: true, message: "Chat Deleted"});
        
    } catch (error) {
        return NextResponse.json({success: false, error: error.message});
    }
}
