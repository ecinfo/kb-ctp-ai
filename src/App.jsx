import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const abortControllerRef = useRef(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("chatHistory");
    if (savedChats) {
      setChatHistory(JSON.parse(savedChats));
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // Save current chat whenever messages change
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      const generateChatTitle = (content) => {
        if (!content) return "New Chat";

        // Common prefixes to remove
        const prefixes = [
          "what is",
          "what are",
          "who is",
          "who are",
          "how to",
          "how do i",
          "how do you",
          "can you",
          "could you",
          "please",
          "tell me about",
          "explain",
          "describe",
          "define",
          "write a",
          "create a",
          "make a",
        ];

        let cleanContent = content.trim();
        const lowerContent = cleanContent.toLowerCase();

        for (const prefix of prefixes) {
          if (lowerContent.startsWith(prefix)) {
            cleanContent = cleanContent.slice(prefix.length).trim();
            // Remove optional question mark or punctuation at start if any remained (unlikely with trim but good safety)
            break; // Only remove one prefix
          }
        }

        // Remove trailing question marks or dots
        cleanContent = cleanContent.replace(/[?.,!]+$/, "");

        // Capitalize first letter
        cleanContent =
          cleanContent.charAt(0).toUpperCase() + cleanContent.slice(1);

        return cleanContent.slice(0, 40) || "New Chat";
      };

      const firstUserMessage = messages.find((m) => m.role === "user")?.content;
      const chatTitle = generateChatTitle(firstUserMessage);
      const chatExists = chatHistory.find((chat) => chat.id === currentChatId);

      if (chatExists) {
        setChatHistory((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages, title: chatTitle, updatedAt: Date.now() }
              : chat
          )
        );
      } else {
        setChatHistory((prev) => [
          {
            id: currentChatId,
            title: chatTitle,
            messages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          ...prev,
        ]);
      }
    }
  }, [messages, currentChatId]);

  const handleSubmit = async (textFromSuggestion) => {
    const text = (textFromSuggestion || input).trim();
    if (!text || isLoading) return;

    // Create a new chat ID if needed
    if (!currentChatId) {
      setCurrentChatId(Date.now());
    }

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Create bot message placeholder
    const botMessageId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: botMessageId,
        role: "assistant",
        content: "",
      },
    ]);

    // Create abort controller for stopping stream
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(import.meta.env.VITE_APP_CHATBOT_BASEURL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_APP_CHATBOT_SECRETKEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          stream: true,
          max_tokens: 400,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedContent = "";
      let buffer = "";

      // Read stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("Stream completed");
          break;
        }

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();

          // Skip empty lines
          if (!trimmedLine) continue;

          // Parse SSE format: "data: {json}"
          if (trimmedLine.startsWith("data: ")) {
            const jsonString = trimmedLine.slice(6).trim();

            // Skip [DONE] signal
            if (jsonString === "[DONE]") {
              console.log("Received [DONE] signal");
              continue;
            }

            try {
              const parsed = JSON.parse(jsonString);

              // Extract content from delta
              const deltaContent =
                parsed?.choices?.[0]?.delta?.content ||
                parsed?.choices?.[0]?.delta?.reasoning_content ||
                "";

              if (deltaContent) {
                accumulatedContent += deltaContent;

                // Update message with accumulated content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              }
            } catch (parseError) {
              console.error("JSON parse error:", parseError);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Stream aborted by user");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  content: msg.content + "\n\n*[Response stopped by user]*",
                }
              : msg
          )
        );
      } else {
        console.error("Stream error:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  content:
                    "⚠️ Error: Unable to get response. Please try again.",
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setCurrentChatId(null);
    setMessages([]);
    setInput("");
    setIsLoading(false);
  };

  const handleLoadChat = (chatId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const chat = chatHistory.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      setIsLoading(false);
    }
  };

  const handleDeleteChat = (chatId) => {
    setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      handleNewChat();
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      } else if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleRetry = () => {
    const lastUserMessageIndex = messages.findLastIndex(
      (m) => m.role === "user"
    );
    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages[lastUserMessageIndex];
    const text = lastUserMessage.content;

    // Remove the failed interaction (user message + error response)
    setMessages((prev) => prev.slice(0, lastUserMessageIndex));

    setTimeout(() => handleSubmit(text), 0);
  };

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`${isMobile ? "fixed inset-y-0 left-0 z-30" : "relative"} ${
          isSidebarOpen ? "w-[280px]" : "w-0"
        } transition-all duration-300 ease-in-out overflow-hidden shrink-0 bg-[#F9F9F9] border-r border-gray-200`}
      >
        <Sidebar
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          onSelectChat={(id) => {
            handleLoadChat(id);
            if (isMobile) setIsSidebarOpen(false);
          }}
          onNewChat={() => {
            handleNewChat();
            if (isMobile) setIsSidebarOpen(false);
          }}
          onDeleteChat={handleDeleteChat}
          onToggleSidebar={toggleSidebar}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <ChatInterface
          messages={messages}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onStop={handleStopStreaming}
          onRetry={handleRetry}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
      </div>
    </div>
  );
}

export default App;
