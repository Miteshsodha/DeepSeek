import Image from 'next/image'
import { assets } from "@/assets/assets";
import { useState } from 'react';
import React from 'react'
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const PromptBox = ({ setMessages, setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const { user, chats, setChats, selectedChat, setSelectedChat } = useAppContext();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  }

  const sendPrompt = async () => {
    const promptCopy = prompt;

    try {
      if (!user) return toast.error('Login to send message');
      if (isLoading) return toast.error("Wait for the previous prompt response");
      if (!promptCopy.trim()) return toast.error("Please enter a message");
      if (!selectedChat?._id) return toast.error("No chat selected");

      setIsLoading(true);
      setPrompt("");

      const userPrompt = {
        role: "user",
        content: promptCopy,
        timestamp: Date.now(),
      }

      // Update chats list
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, messages: [...chat.messages, userPrompt] }
            : chat
        )
      );

      // Update selected chat messages
      setSelectedChat((prev) => ({
        ...prev,
        messages: [...prev.messages, userPrompt]
      }));

      const { data } = await axios.post('/api/chat/ai', {
        chatId: selectedChat._id,
        prompt: promptCopy
      });

      if (data.success) {
        const message = data.data.content;
        const messageTokens = message.split(" ");

        let assistantMessage = {
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        };

        // Add empty assistant message first
        setSelectedChat((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
        }));

        // Typing animation
        messageTokens.forEach((_, i) => {
          setTimeout(() => {
            assistantMessage = {
              ...assistantMessage,
              content: messageTokens.slice(0, i + 1).join(" ")
            };

            setSelectedChat((prev) => {
              const updatedMessages = [
                ...prev.messages.slice(0, -1),
                assistantMessage
              ];
              return { ...prev, messages: updatedMessages };
            });
          }, i * 40);
        });

      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Something went wrong");
      setPrompt(promptCopy);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`w-full ${selectedChat?.messages?.length > 0 ? 'max-w-3xl' : 'max-w-2xl'} bg-[#404045] p-4 rounded-3xl shadow-xl`}>
      <textarea
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder='Message DeepSeek'
        className='outline-none w-full resize-none overflow-hidden break-words bg-transparent text-white'
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div className='flex items-center justify-between text-sm'>
        <div className='flex items-center gap-2'>
          <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'>
            <Image src={assets.deepthink_icon} alt='' className='h-5' />
            DeepThink (R1)
          </p>
          <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'>
            <Image src={assets.search_icon} alt='' className='h-5' />
            Search
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
}

export default PromptBox;
