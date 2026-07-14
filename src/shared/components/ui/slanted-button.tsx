import React from 'react';
import { Loader2 } from 'lucide-react';

interface SlantedButtonProps {
  text?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const SlantedButton: React.FC<SlantedButtonProps> = ({
  text,
  onClick,
  type = "button",
  isLoading = false,
  disabled = false,
  className = '',
  children
}) => {
  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isButtonDisabled}
      style={{ touchAction: "manipulation" }}
      className={`
        relative py-3.5 px-6
        bg-gradient-to-b from-[#FF973C] to-[#FF6A00]
        text-white font-extrabold text-sm tracking-wide
        rounded-[6.64px] shadow-[0_4px_6px_rgba(0,0,0,0.2)]
        transition duration-150 active:scale-[0.98]
        transform -skew-x-[8.6deg]
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:brightness-105
        ${className}
      `}
    >
      {/* Inner Content (Counter-skewed so it remains upright) */}
      <span className="transform skew-x-[8.6deg] flex items-center justify-center gap-2">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          children || text
        )}
      </span>
    </button>
  );
};
