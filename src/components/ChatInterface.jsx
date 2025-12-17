import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Send,
  Square,
  PanelLeftOpen,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { MarkdownRenderer } from "./chatmarkdown/components/markdownHelper";
import logo from "@/assets/knorr-traine.png";

function MessageBubble({ role, content, isLast, onRetry, isLoading }) {
  const isUser = role === "user";
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex w-full flex-col ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[80%] px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-gray-300 text-black font-semibold rounded-br-sm"
            : "bg-white border border-gray-100 rounded-bl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <MarkdownRenderer content={content} className="text-gray-800" />
        )}
      </div>

      {!isUser && (
        <div className="flex items-center gap-2 mt-2 ml-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-600"
            onClick={handleCopy}
            title="Copy response"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>

          {isLast && !isLoading && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
              onClick={onRetry}
              title="Regenerate response"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ChatInterface({
  messages,
  input,
  setInput,
  isLoading,
  onSubmit,
  onStop,
  onRetry,
  isSidebarOpen,
  onToggleSidebar,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white relative font-sans">
      {/* Header */}
      <header className="h-16 flex items-center px-6 sticky top-0 bg-white z-10 shrink-0 gap-4">
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500"
            onClick={onToggleSidebar}
          >
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-medium text-gray-700">
          AI-Powered Intelligence
        </h1>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in duration-500">
            <img src={logo} alt="logo" className="h-25 w-56 p-5" />
            <h2 className="text-3xl font-semibold text-gray-800 mb-8">
              What's on your mind today?
            </h2>
            <div className="flex gap-4 flex-wrap justify-center max-w-3xl">
              {[
                "What is CTP (Customer Training Program) in Knorr-Bremse Rail Services?",
                "How do I register or request a CTP training course?",
                "What certifications do I receive after completing CTP training?",
                "Explain rail breaking systems covered in CTP training (for exams).",
                "What are the attendance and assessment requirements to complete CTP training?",
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSubmit(item)}
                  disabled={isLoading}
                  className="
                        px-6 py-4 
                        text-gray-600 bg-white 
                        rounded-xl border border-gray-200 
                        shadow-sm 
                        hover:border-blue-400 hover:text-blue-600 hover:shadow-md 
                        transition-all 
                        cursor-pointer 
                        text-sm 
                        text-left
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                  <p className="max-w-[200px] leading-relaxed">{item}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages Area */}
        {messages.length > 0 && (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-gray-200  scrollbar-track-transparent"
          >
            <div className="max-w-6xl mx-auto space-y-6 pb-4">
              {messages.map((m, index) => {
                // Check if this is the last message, from assistant, and empty (Thinking state)
                const isThinking =
                  isLoading &&
                  m.role === "assistant" &&
                  !m.content &&
                  index === messages.length - 1;

                if (isThinking) {
                  return (
                    <div key={m.id} className="flex justify-start w-full mb-6">
                      <div className="bg-white border border-gray-100 px-5 py-4 rounded-2xl rounded-bl-sm text-sm text-gray-500 animate-pulse shadow-sm">
                        Thinking...
                      </div>
                    </div>
                  );
                }

                // Render normal message bubble if content exists or it's a user message
                if (m.content || m.role === "user") {
                  const isLastMessage = index === messages.length - 1;

                  return (
                    <div key={m.id} className="w-full mb-6 flex flex-col">
                      <MessageBubble
                        role={m.role}
                        content={m.content}
                        isLast={isLastMessage}
                        onRetry={onRetry}
                        isLoading={isLoading}
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0  pt-4 pb-6 px-6 ">
        <div className="max-w-6xl mx-auto">
          <div className="relative flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-white shadow-sm focus-within:ring-1 focus-within:ring-gray-300 transition-all">
            <Input
              placeholder="Ask Anything..."
              className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base bg-transparent h-10 px-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            {isLoading ? (
              <Button
                size="icon"
                className="h-9 w-9 bg-red-600 hover:bg-red-700 text-white rounded-md shrink-0"
                onClick={onStop}
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-9 w-9 bg-[#004B87] hover:bg-[#003966] text-white rounded-md shrink-0"
                onClick={() => onSubmit()}
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
