
import React from 'react';
import { User, Difficulty } from '../types';
import { Award, Shield, Crown, Printer } from 'lucide-react';

interface CertificateProps {
  user: User;
  level: number;
  difficulty: Difficulty;
  score: number;
}

const Certificate: React.FC<CertificateProps> = ({ user, level, difficulty, score }) => {
  const handlePrint = () => {
    window.print();
  };

  const date = new Date().toLocaleDateString('vi-VN');

  return (
    <div className="flex flex-col items-center gap-6">
      <div id="certificate" className="bg-white p-8 md:p-16 border-[12px] border-double border-indigo-900 rounded-lg shadow-2xl relative w-full max-w-4xl min-h-[600px] flex flex-col items-center text-center overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8 border-indigo-900 m-4 rounded-tl-xl opacity-20"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-t-8 border-r-8 border-indigo-900 m-4 rounded-tr-xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-8 border-l-8 border-indigo-900 m-4 rounded-bl-xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8 border-indigo-900 m-4 rounded-br-xl opacity-20"></div>
        
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-25deg] pointer-events-none select-none">
          <Award size={600} />
        </div>

        <div className="space-y-4 mb-12">
          <div className="flex justify-center gap-4 mb-6">
             <Shield className="text-indigo-900" size={48} />
             <Award className="text-amber-500 scale-125" size={56} />
             <Crown className="text-indigo-900" size={48} />
          </div>
          <h1 className="text-5xl font-black text-indigo-900 uppercase tracking-[0.2em]">Giấy Chứng Nhận</h1>
          <p className="text-2xl italic font-medium text-gray-600">Vinh danh chiến binh tài năng</p>
        </div>

        <div className="space-y-6 mb-12">
          <p className="text-xl text-gray-500">Trân trọng trao tặng cho</p>
          <h2 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-purple-800 underline underline-offset-8">
            {user.username}
          </h2>
        </div>

        <div className="max-w-2xl text-lg text-gray-700 leading-relaxed mb-12">
          Đã xuất sắc vượt qua thử thách 
          <span className="font-bold text-indigo-900 mx-2">Cấp độ {level}</span> 
          thuộc độ khó 
          <span className="font-bold text-indigo-900 mx-2">{difficulty}</span>
          với tổng số điểm ấn tượng là 
          <span className="font-bold text-indigo-900 mx-2">{score} điểm</span>.
          Ghi danh vào bảng vàng tại <strong>Đấu Trường Học Tập</strong>.
        </div>

        <div className="flex justify-between w-full mt-auto pt-12 border-t border-gray-100">
          <div className="text-left">
            <p className="text-gray-500">Ngày cấp</p>
            <p className="font-bold text-lg">{date}</p>
          </div>
          <div className="text-right">
             <p className="text-gray-500">Quản lý đấu trường</p>
             <p className="font-bold text-lg text-indigo-900 italic">Thầy Đạt</p>
             <div className="mt-2 h-16 flex items-center justify-end opacity-50">
                {/* Simulated signature */}
                <span className="font-['Cursive'] text-3xl italic">Dat Teacher</span>
             </div>
          </div>
        </div>
      </div>

      <button
        onClick={handlePrint}
        className="no-print flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl hover:scale-105"
      >
        <Printer size={20} />
        IN CHỨNG NHẬN / LƯU PDF
      </button>
    </div>
  );
};

export default Certificate;
