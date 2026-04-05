import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

export default function BislamaWebView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b px-3 py-2 flex items-center justify-between z-50 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Learn Bislama</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              setLoading(true);
              const iframe = document.getElementById('bislama-frame') as HTMLIFrameElement;
              if (iframe) iframe.src = iframe.src;
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => window.open('https://learnbislama.com', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-2 bg-primary/5 text-sm text-primary gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading learnbislama.com...
        </div>
      )}

      {/* iframe */}
      <iframe
        id="bislama-frame"
        src="https://learnbislama.com"
        className="flex-1 w-full border-0"
        onLoad={() => setLoading(false)}
        allow="clipboard-write; autoplay"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
        title="Learn Bislama"
      />
    </div>
  );
}
