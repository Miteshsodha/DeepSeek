import Image from 'next/image'
import { assets } from "@/assets/assets";
import { useState } from 'react';
import React from 'react'
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import axios from 'axios';

interface PromptBoxProps {
  setMessages: any; // kept to match your page.tsx (even if unused)
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
}

const PromptBox = ({ setMessages, setIsLoading, isLoading }: PromptBoxProps) => {
  const [prompt, setPrompt] = useState('');
  const { user, chats, setChats, selectedChat, setSelectedChat } = useAppContext();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(e as any);
    }
  }

  const sendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();

    const promptCopy = prompt;

    try {
      if (!user) return toast.error('Login to send message');
      if (!selectedChat) return toast.error('Select a chat first');
      if (isLoading) return toast.error("Wait for the previous prompt response");
      if (!promptCopy.trim()) return toast.error("Please enter a message");

      setIsLoading(true);
      setPrompt("");

      const userPrompt = {
        role: "user",
        content: promptCopy,
        timestamp: Date.now(),
      };

      // Update chats list
      setChats((prevChats: any[]) =>
        prevChats.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, messages: [...(chat.messages || []), userPrompt] }
            : chat
        )
      );

      // Update selected chat messages
      setSelectedChat((prev: any) => ({
        ...prev,
        messages: [...(prev?.messages || []), userPrompt],
      }));

      const { data } = await axios.post('/api/chat/ai', {
        chatId: selectedChat._id,
        prompt: promptCopy
      });

      if (data.success) {
        const message = data.data.content || "";
        const messageTokens = message.split(" ");

        let assistantMessage = {
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        };

        // Add empty assistant message first (for typing effect)
        setSelectedChat((prev: any) => ({
          ...prev,
          messages: [...(prev?.messages || []), assistantMessage],
        }));

        // Typing animation
        messageTokens.forEach((_, i) => {
          setTimeout(() => {
            assistantMessage = {
              ...assistantMessage,
              content: messageTokens.slice(0, i + 1).join(" "),
            };

            setSelectedChat((prev: any) => {
              const updatedMessages = [
                ...prev.messages.slice(0, -1),
                assistantMessage,
              ];
              return { ...prev, messages: updatedMessages };
            });
          }, i * 40); // smoother typing
        });

      } else {
        toast.error(data.message || "Something went wrong");
        setPrompt(promptCopy);
      }

    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error?.message || "Failed to send message");
      setPrompt(promptCopy);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full flex justify-center px-4 pb-6">
      <form
        onSubmit={sendPrompt}
        className={`w-full ${
          selectedChat?.messages?.length > 0 ? 'max-w-3xl' : 'max-w-2xl'
        } bg-[#404045] p-4 rounded-3xl transition-all`}
      >
        <textarea
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder='Message DeepSeek'
          required
          className="outline-none w-full resize-none overflow-hidden break-words bg-transparent text-white"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="flex items-center justify-between text-sm mt-2">
          <div className="flex items-center gap-2">
            <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'>
              <Image src={assets.deepthink_icon} alt='' className="h-5 w-5" />
              DeepThink (R1)
            </p>

            <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'>
              <Image src={assets.search_icon} alt='' className="h-5 w-5" />
              Search
            </p>
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='text-white/60 hover:text-white transition disabled:opacity-50'
          >
            <Image src={assets.arrow_icon} alt='' className='w-5 h-5' />
          </button>
        </div>
      </form>
    </div>
  );
}

export default PromptBox;
