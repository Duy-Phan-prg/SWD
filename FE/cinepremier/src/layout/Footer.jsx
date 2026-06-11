import React, { useState } from 'react';
import { ArrowRight, MapPin, Phone } from 'lucide-react';

export default function Footer({ onTabChange = () => { }, cinema = null }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="mythic-footer border-t border-white/10 bg-black text-neutral-400 py-16 px-4 sm:px-6 lg:px-8">
      <span className="mythic-footer-symbol mythic-footer-dragon" aria-hidden="true">龍</span>
      <span className="mythic-footer-symbol mythic-footer-phoenix" aria-hidden="true">鳳</span>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">

          {/* Column 1: Info and Brand */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="border border-amber-300/45 h-10 w-10 flex items-center justify-center text-amber-100 font-serif italic text-lg tracking-widest bg-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.12)]">
                C
              </div>
              <span className="font-serif tracking-[0.28em] text-base uppercase text-white">
                Cine<span className="font-serif italic font-light text-amber-200">Premier</span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-7 text-neutral-300 font-sans font-normal">
              Trải nghiệm chiếu bóng chuẩn mực, tích hợp tối tân bộ đánh giá xung động cảm tính AI Rating cùng hệ thống phòng chiếu IMAX tinh thuần bộc phát từng sát-na giác cảm.
            </p>
            {cinema && (
              <div className="space-y-2 border-l border-amber-400/40 pl-3 text-xs text-neutral-300">
                <div className="font-black uppercase tracking-wider text-white">{cinema.name}</div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                  <span>{[cinema.address, cinema.city].filter(Boolean).join(', ')}</span>
                </div>
                {cinema.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-amber-300" />
                    <span>{cinema.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Quick navigation */}
          <div>
            <h3 className="mb-5 border-l-2 border-amber-400 pl-3 text-sm font-sans font-black uppercase tracking-[0.22em] text-white">DANH MỤC CHIẾU BÓNG</h3>
            <ul className="space-y-3 text-xs uppercase tracking-[0.14em] font-sans font-semibold text-neutral-300">
              <li><span className="cursor-pointer border-b border-transparent pb-0.5 transition-colors duration-250 hover:border-amber-300 hover:text-amber-200">Phim Đang Chiếu</span></li>
              <li><span className="cursor-pointer border-b border-transparent pb-0.5 transition-colors duration-250 hover:border-amber-300 hover:text-amber-200">Phim Sắp Chiếu</span></li>
              <li><span className="cursor-pointer border-b border-transparent pb-0.5 transition-colors duration-250 hover:border-amber-300 hover:text-amber-200">Phòng Chiếu IMAX VIP</span></li>
              <li><span className="cursor-pointer border-b border-transparent pb-0.5 transition-colors duration-250 hover:border-amber-300 hover:text-amber-200">Lịch Chiếu Toàn Quốc</span></li>
            </ul>
          </div>

          {/* Column 3: Policy & Support */}
          <div>
            <h3 className="mb-5 border-l-2 border-amber-400 pl-3 text-sm font-sans font-black uppercase tracking-[0.22em] text-white">HỖ TRỢ & ĐIỀU CHẾ</h3>
            <ul className="space-y-3 text-xs uppercase tracking-[0.14em] font-sans font-semibold text-neutral-300">
              <li><span className="cursor-pointer border-b border-transparent pb-0.5 transition-colors duration-250 hover:border-amber-300 hover:text-amber-200">Liên hệ phòng vé</span></li>
              <li>
                <button
                  type="button"
                  onClick={() => onTabChange('policies')}
                  className="cursor-pointer border-b border-transparent pb-0.5 text-left transition-colors duration-250 hover:border-amber-300 hover:text-amber-200"
                >
                  Chính sách rạp
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onTabChange('policies')}
                  className="cursor-pointer border-b border-transparent pb-0.5 text-left transition-colors duration-250 hover:border-amber-300 hover:text-amber-200"
                >
                  Chính sách bảo mật
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onTabChange('policies')}
                  className="cursor-pointer border-b border-transparent pb-0.5 text-left transition-colors duration-250 hover:border-amber-300 hover:text-amber-200"
                >
                  Điều hành sử dụng vé
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onTabChange('policies')}
                  className="cursor-pointer border-b border-transparent pb-0.5 text-left transition-colors duration-250 hover:border-amber-300 hover:text-amber-200"
                >
                  Quy chuẩn hoạt động
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter sign-up */}
          <div className="space-y-5">
            <h3 className="border-l-2 border-amber-400 pl-3 text-sm font-sans font-black uppercase tracking-[0.22em] text-white">THƯ CHIÊU ĐÃI VIP</h3>
            <p className="text-sm text-neutral-300 font-sans font-normal leading-7">Nhập email để nhận thư thông cáo về điện ảnh độc sắc và các đặc quyền voucher rạp mật.</p>

            {subscribed ? (
              <div className="border border-emerald-400/30 bg-emerald-950/20 p-3 text-xs uppercase tracking-wider text-emerald-200">
                ✓ Thiết lập đăng ký thành công.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative flex max-w-sm items-center">
                <input
                  type="email"
                  required
                  placeholder="EMAIL CỦA BẠN..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-white/15 bg-[#0A0A0A] py-3 pl-4 pr-12 text-xs tracking-wider text-white uppercase placeholder-neutral-600 transition focus:border-amber-300 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bg-white text-black hover:bg-amber-300 p-2 transition duration-250"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Bottom copyright barrier */}
        <div className="mt-16 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          <p>© 2026 CINEPREMIER STUDIOS. ALL RIGHTS RESERVED.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <span>Powered by Smart AI Rating Engine</span>
            <span>•</span>
            <span>Thế Điện Ảnh Tinh Hoa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
