
import React from 'react';
import { XP_PER_LEVEL } from '../constants';

interface AvatarProps {
  src: string;
  xp: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar: React.FC<AvatarProps> = ({ src, xp, size = 'md' }) => {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const progress = (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;

  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  return (
    <div className="relative inline-block">
      {/* Level Ring */}
      <svg className={`${sizes[size]} transform -rotate-90`}>
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          className="stroke-gray-200 fill-none"
          strokeWidth="6"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          className="stroke-indigo-500 fill-none transition-all duration-500"
          strokeWidth="6"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * progress) / 100}
        />
      </svg>
      <div className={`absolute top-0 left-0 flex items-center justify-center ${sizes[size]}`}>
        <img src={src} alt="Avatar" className="w-[85%] h-[85%] rounded-full object-cover" />
      </div>
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-white">
        LV.{level}
      </div>
    </div>
  );
};

export default Avatar;
