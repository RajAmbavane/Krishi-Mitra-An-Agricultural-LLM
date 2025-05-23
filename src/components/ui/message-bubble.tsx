
import { ReactNode } from "react";
import { Leaf, User } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  children: ReactNode;
  sources?: any;
}

export const MessageBubble = ({ role, children, sources }: MessageBubbleProps) => {
  const isUser = role === "user";
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`
        max-w-3xl rounded-2xl p-4 shadow-lg
        ${isUser 
          ? "bg-gradient-to-br from-green-500 to-green-600 text-white ml-12" 
          : "bg-white border border-green-100 mr-12"
        }
      `}>
        <div className="flex items-start space-x-3">
          {!isUser && (
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Leaf size={18} className="text-green-600" />
            </div>
          )}
          
          <div className="flex-1">
            <div className="whitespace-pre-line leading-relaxed">
              {children}
            </div>
            
            {/* Display sources if available */}
            {sources && sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                  <Leaf size={12} className="mr-1" />
                  Sources:
                </p>
                <div className="space-y-1">
                  {sources.map((source: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      <a 
                        href={source.url} 
                        className="text-green-700 hover:text-green-800 hover:underline transition-colors" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {source.title || `Source ${idx + 1}`}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {isUser && (
            <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
