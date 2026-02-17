'use client';

import { useState, Dispatch, SetStateAction, FormEvent } from 'react';
import Image from 'next/image';
import { assets } from "@/assets/assets";

interface PromptBoxProps {
  setMessages: any;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isLoading?: boolean;
  handleSendMessage: (prompt: string) => Promise<void>;
}

const PromptBox = ({ handleSendMessage }: PromptBoxProps) => {
  const [prompt, setPrompt] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const message = prompt;
    setPrompt('');
    await handleSendMessage(message);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-3xl mx-auto p-4 flex items-center gap-3 bg-[#292a2d]"
    >
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Send a message..."
        className="flex-1 p-3 rounded-lg bg-[#3a3b3f] text-white outline-none"
      />

      <button
        type="submit"
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
      >
        <Image src={assets.send_icon} alt="Send" width={20} height={20} />
      </button>
    </form>
  );
};

export default PromptBox;
