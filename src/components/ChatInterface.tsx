import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Plus, Menu, Wheat, Leaf, Tractor, Crop } from "lucide-react";
import { toast } from "sonner";
import { AgriculturalLoader } from "@/components/ui/agricultural-loader";
import { MessageBubble } from "@/components/ui/message-bubble";
import { QuickSuggestionCard } from "@/components/ui/quick-suggestion-card";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any;
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

  // Enhanced agriculture-related quick suggestions with better categorization
  const quickSuggestions = [
    {
      icon: <Wheat className="w-6 h-6 text-green-600" />,
      title: "Crop Guidance",
      description: "What crops are suitable for sandy soil?",
      query: "What crops are suitable for sandy soil?"
    },
    {
      icon: <Leaf className="w-6 h-6 text-green-600" />,
      title: "Pest Control",
      description: "How to prevent pest infestation in wheat?",
      query: "How to prevent pest infestation in wheat?"
    },
    {
      icon: <Tractor className="w-6 h-6 text-green-600" />,
      title: "Organic Farming",
      description: "Organic fertilizers for tomatoes",
      query: "Organic fertilizers for tomatoes"
    },
    {
      icon: <Crop className="w-6 h-6 text-green-600" />,
      title: "Government Schemes",
      description: "Government schemes for small farmers",
      query: "Government schemes for small farmers"
    }
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
        // Adjust the mapping to ensure sources is properly handled
        const formattedMessages = data.map(msg => ([
          {
            role: "user" as const,
            content: msg.user_message
          },
          {
            role: "assistant" as const,
            content: msg.assistant_response,
            sources: msg.sources || [] // Ensure sources is always an array or undefined
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
  const saveMessage = async (userMessage: string, assistantResponse: string, sources: any) => {
    if (!currentConversationId || !user) return;
    
    try {
      if (messages.length === 0) {
        await supabase
          .from("chat_conversations")
          .update({ 
            title: userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : ""),
            updated_at: new Date().toISOString() 
          })
          .eq("id", currentConversationId);
          
        fetchConversations();
      } else {
        await supabase
          .from("chat_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", currentConversationId);
      }
      
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
  const handleSuggestionClick = (query: string) => {
    setInput(query);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
      {/* Enhanced Sidebar with better padding */}
      <div className="w-80 bg-gradient-to-b from-green-800 to-green-900 text-white p-8 overflow-y-auto hidden md:block shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Wheat className="mr-3" size={24} />
              Conversations
            </h2>
            <p className="text-green-200 text-sm mt-2">Your farming discussions</p>
          </div>
          <Button 
            variant="ghost" 
            className="p-3 text-white hover:bg-green-700 rounded-full transition-all duration-200 hover:scale-105"
            onClick={createNewConversation}
          >
            <Plus size={22} />
          </Button>
        </div>
        
        <div className="space-y-4">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-5 rounded-2xl cursor-pointer flex justify-between items-center transition-all duration-200 ${
                currentConversationId === conv.id 
                  ? "bg-green-700 shadow-xl border border-green-600 transform scale-[1.02]" 
                  : "hover:bg-green-700/50 border border-transparent hover:scale-[1.01]"
              }`}
            >
              <div
                className="flex-1 truncate"
                onClick={() => loadConversation(conv.id)}
              >
                <div className="font-semibold truncate text-white text-base">
                  {conv.title || "New Conversation"}
                </div>
                <div className="text-sm text-green-200 mt-2 flex items-center">
                  <Leaf size={14} className="mr-2" />
                  {formatDate(conv.created_at)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-70 hover:opacity-100 hover:bg-red-500/20 transition-all duration-200 ml-3"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
          
          {conversations.length === 0 && (
            <div className="text-center text-green-200 py-12">
              <Wheat size={56} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No conversations yet</p>
              <p className="text-sm mt-3 opacity-80">Start by asking about farming!</p>
            </div>
          )}
        </div>
      </div>

      {/* Main chat area with enhanced padding */}
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* Enhanced Chat header with better spacing */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg">
                <Wheat size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">KRISHI MITRA</h1>
                <p className="text-green-100 text-base mt-1">Your Agricultural Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="md:hidden text-white hover:bg-green-700 rounded-xl p-3"
                onClick={() => toast("Mobile menu not implemented yet")}
              >
                <Menu size={22} />
              </Button>
              
              {user ? (
                <Button
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-700 transition-all duration-200 px-6 py-2 font-medium"
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
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-700 transition-all duration-200 px-6 py-2 font-medium"
                  onClick={() => window.location.href = "/auth"}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced Chat messages with better spacing */}
        <div 
          ref={chatContainerRef} 
          className="flex-1 p-8 overflow-y-auto"
        >
          {/* Enhanced Welcome message */}
          {messages.length === 0 && (
            <div className="text-center my-16">
              <div className="w-28 h-28 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Wheat size={56} className="text-green-600" />
              </div>
              <h2 className="text-4xl font-bold text-green-800 mb-6">
                Welcome to Krishi Mitra! 🌾
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto text-xl leading-relaxed mb-12">
                Your intelligent agricultural companion. Get expert advice on farming,
                crop management, soil health, pest control, and government agricultural schemes.
              </p>
              
              {/* Enhanced quick suggestions */}
              <div className="mt-12">
                <h3 className="text-2xl font-semibold text-green-700 mb-8">
                  Popular Topics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {quickSuggestions.map((suggestion, index) => (
                    <QuickSuggestionCard
                      key={index}
                      icon={suggestion.icon}
                      title={suggestion.title}
                      description={suggestion.description}
                      onClick={() => handleSuggestionClick(suggestion.query)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Chat messages using enhanced components */}
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              role={message.role}
              sources={message.sources}
            >
              {message.content}
            </MessageBubble>
          ))}
          
          {/* Enhanced Loading indicator */}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="bg-white/90 backdrop-blur-sm border border-green-100/60 rounded-3xl p-8 shadow-lg mr-16">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-sm">
                    <Leaf size={20} className="text-green-600" />
                  </div>
                  <div>
                    <AgriculturalLoader size={24} />
                    <p className="text-green-700 font-semibold mt-3 text-base">Krishi Mitra is analyzing...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Enhanced Input area with better padding */}
        <div className="p-8 border-t border-green-200 bg-white/90 backdrop-blur-sm">
          {user ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex space-x-6"
            >
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about crops, farming techniques, government schemes, or any agricultural question..."
                  className="pr-14 h-14 border-2 border-green-300 focus-visible:ring-green-500 bg-white shadow-lg text-base rounded-2xl"
                  disabled={isLoading}
                />
                <Leaf className="absolute right-4 top-4 h-6 w-6 text-green-400" />
              </div>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-14 px-8 shadow-lg transition-all duration-200 rounded-2xl font-semibold"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <AgriculturalLoader size={20} />
                ) : (
                  <>
                    <Send size={20} className="mr-3" />
                    Send
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Wheat size={40} className="text-green-600" />
              </div>
              <p className="text-gray-600 mb-6 text-xl font-medium">
                Sign in to start chatting with Krishi Mitra
              </p>
              <Button
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg px-8 py-3 text-base font-semibold rounded-2xl"
                onClick={() => window.location.href = "/auth"}
              >
                <Leaf size={20} className="mr-3" />
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
