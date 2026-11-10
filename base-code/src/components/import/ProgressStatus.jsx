import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProgressStatus({ status, onClose }) {
  if (!status || status.state === 'idle') return null;

  const isProcessing = status.state === 'processing';
  const isSuccess = status.state === 'success';
  const isError = status.state === 'error';

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs flex flex-col items-center text-center shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">

        {/* 1. Processing State */}
        {isProcessing && (
          <>
            <div className="relative w-20 h-20 flex items-center justify-center mb-4">
              <Loader2 size={68} className="text-brand-500 animate-spin absolute" />
              <span className="text-sm font-extrabold text-brand-600">
                {status.progress}%
              </span>
            </div>

            <h3 className="text-sm font-bold text-app-text mb-1">
              {status.message || 'Memproses Unduhan...'}
            </h3>
            <p className="text-[11px] text-app-muted mb-4">
              Mohon tunggu, jangan tutup halaman ini.
            </p>

            {/* Horizontal Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-brand-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          </>
        )}

        {/* 2. Success State */}
        {isSuccess && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-sm font-bold text-app-text mb-1">Unduhan Selesai</h3>
            <p className="text-xs text-app-muted mb-5">{status.message}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
            >
              Selesai
            </button>
          </>
        )}

        {/* 3. Error State */}
        {isError && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3">
              <AlertCircle size={36} />
            </div>
            <h3 className="text-sm font-bold text-app-text mb-1">Gagal Mengunduh</h3>
            <p className="text-xs text-red-500 mb-5">{status.message}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
            >
              Tutup & Coba Lagi
            </button>
          </>
        )}

      </div>
    </div>
  );
}