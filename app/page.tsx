'use client';

import { assets } from "@/assets/assets";
import PromptBox from "@/components/PromptBox";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Message from "@/components/Message";
import { useAppContext } from "@/context/AppContext";

export default function Home() {
  const [expand, setExpand] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { selectedChat } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);

  // Update messages when chat changes
  useEffect(() => {
    if (selectedChat?.messages) {
      setMessages(selectedChat.messages);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  // Auto scroll to bottom when messages update
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    containerRef.current!.scrollTop =
      containerRef.current!.scrollHeight;
  }, [messages, isLoading]);

  return (
    <div>
      <div className="flex h-screen">
        <Sidebar expand={expand} setExpand={setExpand} />

        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 bg-[#292a2d] text-white relative">

          {/* Mobile Header */}
          <div className="md:hidden absolute px-4 top-6 flex items-center justify-between w-full">
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

          {/* Chat Container (ALWAYS mounted) */}
          <div
            ref={containerRef}
            className="relative flex flex-col items-center justify-start w-full mt-20 max-h-screen overflow-y-auto"
          >
            {messages.length === 0 ? (
              <>
                <div className="flex items-center gap-3 mt-24">
                  <Image
                    src={assets.logo_icon}
                    alt="Logo"
                    className="h-16"
                  />
                  <p className="text-2xl font-medium">
                    Hi, I am DeepSeek.
                  </p>
                </div>
                <p className="text-sm mt-2">
                  How can I help you today?
                </p>
              </>
            ) : (
              <>
                <p className="fixed top-8 border border-transparent hover:border-gray-500/50 py-1 px-2 rounded-lg font-semibold bg-[#292a2d]">
                  {selectedChat?.name}
                </p>

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
        </div>
      </div>

      <PromptBox setMessages={setMessages} setIsLoading={setIsLoading} />
    </div>
  );
}
