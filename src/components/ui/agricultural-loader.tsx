
import { Wheat } from "lucide-react";

export const AgriculturalLoader = ({ size = 24, className = "" }) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Wheat 
        size={size} 
        className="animate-pulse text-green-600" 
      />
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};
