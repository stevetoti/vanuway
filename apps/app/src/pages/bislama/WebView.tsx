import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function BislamaWebView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Minimal floating back button — no header bar */}
      <button
        className="fixed top-3 left-3 z-[9999] h-10 w-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-5 w-5 text-gray-700" />
      </button>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[9998] bg-white flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground">Loading Learn Bislama...</p>
        </div>
      )}

      {/* Full-screen iframe — no header, feels native */}
      <iframe
        id="bislama-frame"
        src="https://learnbislama.com"
        className="flex-1 w-full border-0"
        style={{ height: '100vh' }}
        onLoad={() => setLoading(false)}
        allow="clipboard-write; autoplay"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
        title="Learn Bislama"
      />
    </div>
  );
}
