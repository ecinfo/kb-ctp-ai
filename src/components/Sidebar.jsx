import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import logo from "@/assets/knorr-traine.png";
import {
  ArrowLeft,
  PanelLeftClose,
  SquarePen,
  Search,
  ChevronDown,
  Trash2,
} from "lucide-react";

export function Sidebar({
  chatHistory,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onToggleSidebar,
}) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = chatHistory.filter((chat) =>
    (chat.title || "New Chat").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-[280px] h-screen bg-[#F9F9F9] flex flex-col border-r border-gray-200 shrink-0 font-sans">
      {/* Top Icons */}
      <div className="flex items-center justify-between p-4 text-gray-500">
        <div className="flex ">
          <img src={logo} alt="Logo" className="w-30 h-15 p-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={onToggleSidebar}
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 space-y-1 mb-6">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-600 font-normal hover:bg-gray-200/50 h-10 px-3"
          onClick={onNewChat}
        >
          <SquarePen className="h-5 w-5" />
          New Chat
        </Button>

        {isSearching ? (
          <div className="px-3 py-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search chats..."
                className="pl-8 h-9 bg-white text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                onBlur={() => {
                  if (!searchQuery) setIsSearching(false);
                }}
              />
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 font-normal hover:bg-gray-200/50 h-10 px-3"
            onClick={() => setIsSearching(true)}
          >
            <Search className="h-5 w-5" />
            Search Chats
          </Button>
        )}
      </div>

      {/* Your Chats Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div
          className="px-5 py-2 flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
        >
          <span className="text-sm font-medium">Your Chats</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isHistoryOpen ? "" : "-rotate-90"
            }`}
          />
        </div>

        {isHistoryOpen && (
          <ScrollArea className="flex-1 px-2">
            <div className="w-full space-y-0.5 pb-4">
              {chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`group relative rounded-md cursor-pointer transition ${
                      currentChatId === chat.id
                        ? "bg-gray-200 text-gray-900"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                  >
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={14} />
                    </button>{" "}
                    {/* Chat title */}
                    <p className="px-5 py-2 pr-9 text-sm truncate">
                      {chat.title || "New Chat"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-5 py-2 text-xs text-gray-400">
                  No chat history
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
