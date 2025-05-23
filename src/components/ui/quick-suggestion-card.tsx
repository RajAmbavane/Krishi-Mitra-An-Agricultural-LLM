
import { ReactNode } from "react";

interface QuickSuggestionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

export const QuickSuggestionCard = ({ icon, title, description, onClick }: QuickSuggestionCardProps) => {
  return (
    <div 
      className="bg-white/80 backdrop-blur-sm border border-green-200/60 rounded-2xl p-6 cursor-pointer 
                 hover:shadow-xl hover:border-green-300 transition-all duration-300
                 hover:scale-[1.02] group transform hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center
                       group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300 shadow-sm">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors duration-200 text-lg leading-tight">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};
