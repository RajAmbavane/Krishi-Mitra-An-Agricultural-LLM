
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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div className={`
        max-w-4xl rounded-3xl p-6 shadow-lg
        ${isUser 
          ? "bg-gradient-to-br from-green-500 to-green-600 text-white ml-16" 
          : "bg-white/90 backdrop-blur-sm border border-green-100/60 mr-16"
        }
      `}>
        <div className="flex items-start space-x-4">
          {!isUser && (
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-sm">
              <Leaf size={20} className="text-green-600" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="whitespace-pre-line leading-relaxed text-base">
              {children}
            </div>
            
            {/* Display sources if available */}
            {sources && sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-green-200/50">
                <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center">
                  <Leaf size={14} className="mr-2" />
                  Sources:
                </p>
                <div className="space-y-2">
                  {sources.map((source: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      <a 
                        href={source.url} 
                        className="text-green-700 hover:text-green-800 hover:underline transition-colors duration-200 block p-2 bg-green-50/50 rounded-lg hover:bg-green-50" 
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
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-sm">
              <User size={20} className="text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
