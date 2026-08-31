'use client';

import { assets } from "@/assets/assets";
import PromptBox from "@/components/PromptBox";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Message from "@/components/Message";
import { useAppContext } from "@/context/AppContext";

interface ChatMessage {
  role: string;
  content: string;
}

export default function Home() {
  const [expand, setExpand] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const { selectedChat, manualRenameChat } = useAppContext();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Update messages when chat changes
  useEffect(() => {
    if (selectedChat?.messages) {
      setMessages(selectedChat.messages);
      setRenameValue(selectedChat?.name || '');
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  // Scroll to bottom
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // ✅ NEW: Handle manual rename
  const handleRename = async () => {
    if (!renameValue.trim()) return;
    
    const success = await manualRenameChat(selectedChat._id, renameValue);
    if (success) {
      setShowRenameInput(false);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setShowRenameInput(false);
      setRenameValue(selectedChat?.name || '');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar expand={expand} setExpand={setExpand} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#292a2d] text-white relative">
        
        {/* Mobile Header */}
        <div className="md:hidden absolute px-4 top-6 flex items-center justify-between w-full z-10">
          <Image
            onClick={() => setExpand(!expand)}
            className="rotate-180 cursor-pointer"
            src={assets.menu_icon}
            alt="Menu"
          />
          <Image
            className="opacity-70"
            src={assets.chat_icon}
            alt="Chat"
          />
        </div>

        {/* Messages Container */}
        <div
          ref={containerRef}
          className="flex-1 flex flex-col items-center justify-start w-full mt-20 px-4 overflow-y-auto pb-40"
        >
          {messages.length === 0 ? (
            // ✅ IMPROVED: Empty State with centered search box
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div className="flex items-center gap-3 mb-8">
                <Image
                  src={assets.logo_icon}
                  alt="Logo"
                  className="h-16"
                />
                <p className="text-2xl font-medium">
                  Hi, I am DeepSeek.
                </p>
              </div>
              <p className="text-sm mb-16 text-gray-400">
                How can I help you today?
              </p>
              
              {/* ✅ NEW: Centered Search Box in Empty State */}
              <div className="w-full flex justify-center px-4">
                <PromptBox
                  setMessages={setMessages}
                  setIsLoading={setIsLoading}
                  isLoading={isLoading}
                  isEmptyState={true}
                />
              </div>
            </div>
          ) : (
            <>
              {/* ✅ IMPROVED: Chat name with rename functionality */}
              <div className="sticky top-4 z-10 flex items-center gap-2 border border-transparent hover:border-gray-500/50 py-1 px-2 rounded-lg font-semibold bg-[#292a2d] group">
                {showRenameInput ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleRename}
                    autoFocus
                    className="bg-[#404045] text-white px-2 py-1 rounded outline-none"
                    placeholder="Enter new name"
                  />
                ) : (
                  <>
                    <p>{selectedChat?.name}</p>
                    {/* ✅ NEW: Edit icon button */}
                    <button
                      onClick={() => setShowRenameInput(true)}
                      className="opacity-0 group-hover:opacity-100 transition ml-2"
                      title="Rename chat"
                    >
                      <Image 
                        src={assets.pencil_icon} 
                        alt="Rename" 
                        className="w-4 h-4 cursor-pointer hover:opacity-70" 
                      />
                    </button>
                  </>
                )}
              </div>

              {messages.map((msg, index) => (
                <Message
                  key={index}
                  role={msg.role}
                  content={msg.content}
                />
              ))}

              {isLoading && (
                <div className="flex gap-4 max-w-3xl w-full py-3">
                  <Image
                    className="h-9 w-9 p-1 border border-white/15 rounded-full"
                    src={assets.logo_icon}
                    alt="Logo"
                  />
                  <div className="loader flex justify-center items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ✅ FIXED: PromptBox INSIDE layout & fixed bottom (shown when messages exist) */}
        {messages.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full flex justify-center px-4 pb-6 bg-gradient-to-t from-[#292a2d] to-transparent">
            <PromptBox
              setMessages={setMessages}
              setIsLoading={setIsLoading}
              isLoading={isLoading}
              isEmptyState={false}
            />
          </div>
        )}

      </div>
    </div>
  );
}
