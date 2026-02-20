import Image from 'next/image';
import { assets } from "@/assets/assets";
import { useState } from 'react';
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const PromptBox = ({ setMessages, setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const context = useAppContext() || {};

  const user = context.user;
  const chats = context.chats;
  const setChats = context.setChats;
  const selectedChat = context.selectedChat;
  const setSelectedChat = context.setSelectedChat;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  const sendPrompt = async () => {
    const promptCopy = prompt;

    try {
      if (!user) return toast.error('Login to send message');
      if (!selectedChat?._id) return toast.error('Select a chat first');
      if (isLoading) return toast.error("Wait for previous response");
      if (!promptCopy.trim()) return toast.error("Enter a message");

      setIsLoading?.(true);
      setPrompt("");

      const userPrompt = {
        role: "user",
        content: promptCopy,
        timestamp: Date.now(),
      };

      // 🔒 SAFE: Only call if function exists
      if (typeof setSelectedChat === "function") {
        setSelectedChat((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), userPrompt],
          };
        });
      }

      if (typeof setChats === "function" && selectedChat) {
        setChats((prevChats) =>
          (prevChats || []).map((chat) =>
            chat._id === selectedChat._id
              ? {
                  ...chat,
                  messages: [...(chat.messages || []), userPrompt],
                }
              : chat
          )
        );
      }

      console.log("Sending to API:", promptCopy);

      const res = await axios.post('/api/chat/ai', {
        chatId: selectedChat._id,
        prompt: promptCopy,
      });

      const data = res.data;

      if (!data?.success) {
        toast.error(data?.message || "API failed");
        setPrompt(promptCopy);
        return;
      }

      const fullMessage = data?.data?.content || "";

      // Add assistant placeholder safely
      if (typeof setSelectedChat === "function") {
        setSelectedChat((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [
              ...(prev.messages || []),
              {
                role: "assistant",
                content: "",
                timestamp: Date.now(),
              },
            ],
          };
        });
      }

      // Typing animation (safe)
      let currentText = "";
      const words = fullMessage.split(" ");

      for (let i = 0; i < words.length; i++) {
        currentText += words[i] + " ";
        await new Promise((resolve) => setTimeout(resolve, 25));

        if (typeof setSelectedChat === "function") {
          setSelectedChat((prev) => {
            if (!prev) return prev;

            const msgs = [...(prev.messages || [])];
            const lastIndex = msgs.length - 1;

            if (lastIndex >= 0 && msgs[lastIndex]?.role === "assistant") {
              msgs[lastIndex] = {
                ...msgs[lastIndex],
                content: currentText.trim(),
              };
            }

            return {
              ...prev,
              messages: msgs,
            };
          });
        }
      }
    } catch (error) {
      console.error("API ERROR:", error);
      toast.error(error?.response?.data?.message || error.message);
      setPrompt(promptCopy);
    } finally {
      setIsLoading?.(false);
    }
  };

  return (
    <div
      className={`w-full ${
        selectedChat?.messages?.length > 0 ? 'max-w-3xl' : 'max-w-2xl'
      } bg-[#404045] p-4 rounded-3xl shadow-xl`}
    >
      <textarea
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="Message DeepSeek"
        className="outline-none w-full resize-none bg-transparent text-white"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div className="flex items-center justify-between text-sm mt-2">
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full">
            <Image src={assets.deepthink_icon} alt="" className="h-5" />
            DeepThink (R1)
          </p>
        </div>

        <button
          onClick={sendPrompt}
          disabled={isLoading}
          className="text-white/60 hover:text-white transition disabled:opacity-40"
        >
          <Image src={assets.arrow_icon} alt="" className="w-5" />
        </button>
      </div>
    </div>
  );
};

export default PromptBox;
