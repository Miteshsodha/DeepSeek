import { useState } from "react";

interface ChatMessage {
  role: string;
  content: string;
}

interface PromptBoxProps {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
}

export default function PromptBox({
  setMessages,
  setIsLoading,
  isLoading,
}: PromptBoxProps) {
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    };

    // Add user message
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 🔁 Your API call here (keep your existing fetch)
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const botMessage: ChatMessage = {
        role: "assistant",
        content: data.reply || "No response",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#292a2d] p-4 flex justify-center">
      <div className="w-full max-w-3xl flex gap-2">
        <input
          className="flex-1 p-3 rounded-lg bg-[#404045] text-white outline-none"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
