import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, AlertCircle } from 'lucide-react';

interface PopupOptions {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface PopupContextType {
  showPopup: (options: PopupOptions) => void;
  hidePopup: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [popup, setPopup] = useState<PopupOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showPopup = (options: PopupOptions) => {
    setPopup(options);
    // Use requestAnimationFrame/setTimeout to trigger fade-in animation
    setTimeout(() => {
      setIsOpen(true);
    }, 10);
  };

  const hidePopup = () => {
    setIsOpen(false);
    setTimeout(() => {
      setPopup(null);
    }, 200); // Match transiton duration
  };

  const handleConfirm = () => {
    if (popup?.onConfirm) {
      popup.onConfirm();
    }
    hidePopup();
  };

  const handleCancel = () => {
    if (popup?.onCancel) {
      popup.onCancel();
    }
    hidePopup();
  };

  return (
    <PopupContext.Provider value={{ showPopup, hidePopup }}>
      {children}
      {popup && (
        <div 
          className={`fixed inset-0 bg-[#06121E]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div 
            className={`bg-white rounded-3xl border border-navy/5 p-6 md:p-8 max-w-md w-full shadow-2xl relative text-center flex flex-col items-center gap-5 transform transition-all duration-200 ${
              isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
            }`}
          >
            {/* Icons depending on popup type */}
            {popup.type === 'success' && (
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="h-8 w-8 text-green-dark" />
              </div>
            )}
            {popup.type === 'error' && (
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-650 shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
            {popup.type === 'warning' && (
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
            )}
            {popup.type === 'info' && (
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Info className="h-8 w-8 text-blue-600" />
              </div>
            )}
            {popup.type === 'confirm' && (
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
            )}

            <div className="text-center">
              <h3 className="text-base md:text-lg font-black text-navy tracking-tight">{popup.title}</h3>
              <p className="text-xs md:text-sm text-text-secondary mt-2.5 font-semibold leading-relaxed whitespace-pre-wrap">
                {popup.message}
              </p>
            </div>

            <div className="flex w-full gap-3 pt-3">
              {popup.type === 'confirm' ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 border border-navy/10 hover:bg-navy/5 text-navy text-xs font-bold rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer font-sans"
                  >
                    {popup.cancelText || 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer font-sans"
                  >
                    {popup.confirmText || 'Yes, Confirm'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 bg-navy hover:bg-[#1a2d3c] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer font-sans"
                >
                  {popup.confirmText || 'OK'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};
