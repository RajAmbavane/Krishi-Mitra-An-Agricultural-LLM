
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

const ChatInterface = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);

  // Agriculture-related quick suggestions
  const quickSuggestions = [
    "What crops are suitable for sandy soil?",
    "How to prevent pest infestation in wheat?",
    "Organic fertilizers for tomatoes",
    "Government schemes for small farmers"
  ];

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        fetchConversations();
      }
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchConversations();
      } else {
        setConversations([]);
        setCurrentConversationId(null);
        setMessages([]);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch user's conversations
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
        
      if (error) throw error;
      setConversations(data || []);
      
      // If conversations exist and no current conversation is selected, select the most recent one
      if (data && data.length > 0 && !currentConversationId) {
        setCurrentConversationId(data[0].id);
        loadConversation(data[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    }
  };
  
  // Load messages from a specific conversation
  const loadConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setMessages([]);
    
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        const formattedMessages = data.map(msg => ([
          {
            role: "user" as const,
            content: msg.user_message
          },
          {
            role: "assistant" as const,
            content: msg.assistant_response,
            sources: msg.sources
          }
        ])).flat();
        
        setMessages(formattedMessages);
      }
    } catch (error: any) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  // Create a new conversation
  const createNewConversation = async () => {
    if (!user) {
      toast.error("Please sign in to start a conversation");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          title: "New Conversation",
          user_id: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setConversations([data, ...conversations]);
        setCurrentConversationId(data.id);
        setMessages([]);
        toast.success("New conversation created");
      }
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
    }
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", conversationId);
        
      if (error) throw error;
      
      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConversations);
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(updatedConversations[0]?.id || null);
        setMessages([]);
        
        if (updatedConversations[0]) {
          loadConversation(updatedConversations[0].id);
        }
      }
      
      toast.success("Conversation deleted");
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  // Save message to database
  const saveMessage = async (userMessage: string, assistantResponse: string, sources: any[]) => {
    if (!currentConversationId || !user) return;
    
    try {
      // First, update the conversation title based on the first message
      if (messages.length === 0) {
        await supabase
          .from("chat_conversations")
          .update({ 
            title: userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : ""),
            updated_at: new Date().toISOString() 
          })
          .eq("id", currentConversationId);
          
        // Refresh conversations to show updated title
        fetchConversations();
      } else {
        // Just update timestamp
        await supabase
          .from("chat_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", currentConversationId);
      }
      
      // Then save the message
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: currentConversationId,
          user_message: userMessage,
          assistant_response: assistantResponse,
          sources: sources || null
        });
        
      if (error) throw error;
    } catch (error: any) {
      console.error("Error saving message:", error);
      // Don't show toast on error to avoid disrupting chat flow
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!user) {
      toast.error("Please sign in to send messages");
      return;
    }
    
    // Create a new conversation if none exists
    if (!currentConversationId) {
      await createNewConversation();
    }
    
    const userMessage = input;
    setInput("");
    
    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    
    setIsLoading(true);
    
    try {
      // Call API endpoint
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage,
          // Include conversation history for context
          history: messages.map(msg => ({ role: msg.role, content: msg.content }))
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add assistant response to chat
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: data.answer, 
          sources: data.sources 
        },
      ]);
      
      // Save the exchange to the database
      await saveMessage(userMessage, data.answer, data.sources);
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Failed to get a response. Please try again.");
      
      // Remove user message if API call fails
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle quick suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-green-50">
      {/* Sidebar for conversations */}
      <div className="w-64 bg-green-700 text-white p-4 overflow-y-auto hidden md:block">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Conversations</h2>
          <Button 
            variant="ghost" 
            className="p-2 text-white hover:bg-green-600 rounded-full"
            onClick={createNewConversation}
          >
            <Plus size={20} />
          </Button>
        </div>
        
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-2 rounded-lg cursor-pointer flex justify-between items-center ${
                currentConversationId === conv.id 
                  ? "bg-green-600" 
                  : "hover:bg-green-600/50"
              }`}
            >
              <div
                className="flex-1 truncate"
                onClick={() => loadConversation(conv.id)}
              >
                <div className="font-medium truncate">
                  {conv.title || "New Conversation"}
                </div>
                <div className="text-xs opacity-75">
                  {formatDate(conv.created_at)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-70 hover:opacity-100 hover:bg-red-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          
          {conversations.length === 0 && (
            <div className="text-center text-green-200 py-4">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* Chat header */}
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">KRISHI MITRA</h1>
          <div className="flex items-center space-x-2">
            {/* Mobile menu button for conversations */}
            <Button
              variant="ghost"
              className="md:hidden text-white hover:bg-green-700"
              onClick={() => {
                // This would toggle the mobile menu in a real implementation
                toast("Mobile menu not implemented yet");
              }}
            >
              Conversations
            </Button>
            
            {user ? (
              <Button
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-green-700"
                onClick={async () => {
                  await supabase.auth.signOut();
                  toast.success("Signed out successfully");
                }}
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-green-700"
                onClick={() => window.location.href = "/auth"}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
        
        {/* Chat messages */}
        <div 
          ref={chatContainerRef} 
          className="flex-1 p-4 overflow-y-auto space-y-4"
        >
          {/* Welcome message if no messages */}
          {messages.length === 0 && (
            <div className="text-center my-8">
              <h2 className="text-2xl font-bold text-green-700 mb-4">
                Welcome to Krishi Mitra! 🌿
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Your agricultural assistance chatbot. Ask any questions about farming,
                crops, soil management, government schemes, or agricultural practices.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-full text-sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Chat messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${
                message.role === "user" 
                  ? "bg-green-200 ml-auto mr-2" 
                  : "bg-white mr-auto ml-2"
              } max-w-3xl rounded-lg p-4 shadow`}
            >
              <div className="whitespace-pre-line">{message.content}</div>
              
              {/* Display sources if available */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500">Sources:</p>
                  <div className="mt-1 space-y-1">
                    {message.sources.map((source, idx) => (
                      <div key={idx} className="text-xs text-gray-600">
                        <a 
                          href={source.url} 
                          className="text-green-700 hover:underline" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {source.title || "Source " + (idx + 1)}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="bg-white max-w-3xl rounded-lg p-4 shadow mr-auto ml-2 flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
              <p>Krishi Mitra is thinking...</p>
            </div>
          )}
          
          {/* Auto-scroll reference */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {user ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex space-x-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about crops, farming techniques, or government schemes..."
                className="flex-1 focus-visible:ring-green-500"
                disabled={isLoading}
              />
              <Button 
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-2">
              <p className="text-gray-600 mb-2">
                Sign in to start chatting with Krishi Mitra
              </p>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => window.location.href = "/auth"}
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
