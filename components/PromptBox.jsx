import Image from 'next/image'
import { assets } from "@/assets/assets";
import { useState } from 'react';
import React from 'react'
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const PromptBox = ({ setMessages, setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const context = useAppContext(); // 🔥 safer destructuring

  const user = context?.user;
  const chats = context?.chats;
  const setChats = context?.setChats;
  const selectedChat = context?.selectedChat;
  const setSelectedChat = context?.setSelectedChat;

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

      setIsLoading(true);
      setPrompt("");

      const userPrompt = {
        role: "user",
        content: promptCopy,
        timestamp: Date.now(),
      };

      // Safe chat update
      if (setChats && selectedChat) {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === selectedChat._id
              ? { ...chat, messages: [...(chat.messages || []), userPrompt] }
              : chat
          )
        );
      }

      if (setSelectedChat) {
        setSelectedChat((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), userPrompt]
        }));
      }

      console.log("Sending to API:", promptCopy);

      const res = await axios.post('/api/chat/ai', {
        chatId: selectedChat._id,
        prompt: promptCopy
      });

      const data = res.data;

      if (data?.success) {
        const message = data.data.content || "";
        const tokens = message.split(" ");

        let assistantMessage = {
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        setSelectedChat((prev) => ({
          ...prev,
          messages: [...(prev.messages || []), assistantMessage],
        }));

        tokens.forEach((_, i) => {
          setTimeout(() => {
            assistantMessage = {
              ...assistantMessage,
              content: tokens.slice(0, i + 1).join(" ")
            };

            setSelectedChat((prev) => {
              const updated = [
                ...prev.messages.slice(0, -1),
                assistantMessage
              ];
              return { ...prev, messages: updated };
            });
          }, i * 30);
        });

      } else {
        toast.error(data?.message || "API failed");
        setPrompt(promptCopy);
      }

    } catch (error) {
      console.error("API ERROR:", error);
      toast.error(error?.response?.data?.message || error.message);
      setPrompt(promptCopy);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${selectedChat?.messages?.length > 0 ? 'max-w-3xl' : 'max-w-2xl'} bg-[#404045] p-4 rounded-3xl shadow-xl`}>
      
      <textarea
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder='Message DeepSeek'
        className='outline-none w-full resize-none bg-transparent text-white'
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div className='flex items-center justify-between text-sm'>
        <div className='flex items-center gap-2'>
          <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full'>
            <Image src={assets.deepthink_icon} alt='' className='h-5' />
            DeepThink (R1)
          </p>
        </div>

        <button
          onClick={sendPrompt}
          className='text-white/60 hover:text-white transition'
        >
          <Image src={assets.arrow_icon} alt='' className='w-5' />
        </button>
      </div>
    </div>
  );
};

export default PromptBox;
