import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PaymentCallbackPage() {
  const navigate = useNavigate();
  const onGoTickets = () => navigate('/tickets');
  const [status, setStatus] = useState('loading');
  const [info, setInfo] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const responseCode = params.get('vnp_ResponseCode');
    const amount = params.get('vnp_Amount');
    const txnRef = params.get('vnp_TxnRef');
    const orderInfo = params.get('vnp_OrderInfo');
    const transactionNo = params.get('vnp_TransactionNo');

    setInfo({
      amount: amount ? (Number.parseInt(amount, 10) / 100).toLocaleString('vi-VN') + 'đ' : '',
      txnRef,
      orderInfo,
      transactionNo
    });

    if (responseCode === '00') {
      setStatus('success');
    } else if (responseCode) {
      setStatus('failed');
    } else {
      setStatus('unknown');
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full border border-white/10 bg-neutral-950 p-8 space-y-6 text-center">

        {status === 'loading' && (
          <Loader2 className="h-12 w-12 text-amber-500 animate-spin mx-auto" />
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle className="h-10 w-10" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-serif italic text-white uppercase tracking-wider font-bold">Thanh Toán Thành Công</h2>
              <p className="text-[11px] text-zinc-400 mt-1">Giao dịch của bạn đã được xử lý.</p>
            </div>
            {info.amount && (
              <div className="border border-white/10 bg-black p-4 text-left space-y-2 text-[10px] font-mono text-neutral-400">
                <div className="flex justify-between"><span>Số tiền:</span><span className="text-emerald-400 font-bold">{info.amount}</span></div>
                {info.txnRef && <div className="flex justify-between"><span>Mã giao dịch:</span><span className="text-white">{info.txnRef}</span></div>}
                {info.transactionNo && <div className="flex justify-between"><span>VNPAY Ref:</span><span className="text-white">{info.transactionNo}</span></div>}
              </div>
            )}
          </>
        )}

        {(status === 'failed' || status === 'unknown') && (
          <>
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-500">
                <XCircle className="h-10 w-10" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-serif italic text-red-400 uppercase tracking-wider font-bold">Thanh Toán Thất Bại</h2>
              <p className="text-[11px] text-zinc-400 mt-1">Giao dịch bị huỷ hoặc không thành công.</p>
            </div>
          </>
        )}

        <button
          onClick={onGoTickets}
          className="w-full bg-white text-black hover:bg-neutral-200 py-3 text-xs font-bold uppercase tracking-widest transition"
        >
          Về vé của tôi
        </button>

      </div>
    </div>
  );
}
