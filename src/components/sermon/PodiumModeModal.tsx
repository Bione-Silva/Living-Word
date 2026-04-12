import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Play, Pause, RotateCcw, DefaultIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PodiumModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sermonMarkdown: string;
  sermonTitle: string;
}

interface ParsedBlock {
  id: string;
  type: string;
  title: string;
  content: string;
  color: string;
  bgDark: string;
}

const parseMarkdownToBlocks = (markdown: string): ParsedBlock[] => {
  const lines = markdown.split('\n');
  const blocks: ParsedBlock[] = [];
  
  let currentBlock: Partial<ParsedBlock> = { type: 'intro', title: 'Introdução', content: '', color: '#C8A880', bgDark: '#1A1612' };
  
  lines.forEach((line, index) => {
    // Detect headings as new blocks
    if (line.startsWith('#')) {
      if (currentBlock.content && currentBlock.content.trim()) {
        blocks.push(currentBlock as ParsedBlock);
      }
      
      const level = (line.match(/^#+/) || [''])[0].length;
      const title = line.replace(/^#+\s*/, '').trim();
      let type = 'point';
      let color = '#F5D8B0'; // default point
      let bgDark = '#201A12';
      
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('versículo') || lowerTitle.includes('leitura') || lowerTitle.includes('bíb')) {
        type = 'verse'; color = '#8ABBE8'; bgDark = '#101620';
      } else if (lowerTitle.includes('ideia') || lowerTitle.includes('central')) {
        type = 'big_idea'; color = '#7AE09A'; bgDark = '#0C1C13';
      } else if (lowerTitle.includes('ilustração') || lowerTitle.includes('exemplo')) {
        type = 'illustration'; color = '#F5D0A0'; bgDark = '#1C150C';
      } else if (lowerTitle.includes('aplicação') || lowerTitle.includes('prática')) {
        type = 'application'; color = '#7AE09A'; bgDark = '#0C1C13';
      } else if (lowerTitle.includes('conclusão') || lowerTitle.includes('apelo')) {
        type = 'conclusion'; color = '#FF9999'; bgDark = '#1A0D0D';
      }
      
      currentBlock = {
        id: `block-${index}`,
        type,
        title,
        content: '',
        color,
        bgDark
      };
    } else {
      currentBlock.content += line + '\n';
    }
  });

  if (currentBlock.content && currentBlock.content.trim()) {
    blocks.push(currentBlock as ParsedBlock);
  }

  // Pre-process inline bolding to make it stand out more
  return blocks.map(b => ({...b, content: b.content.trim()})).filter(b => b.content.length > 0);
};

export function PodiumModeModal({ open, onOpenChange, sermonMarkdown, sermonTitle }: PodiumModeModalProps) {
  const { lang } = useLanguage();
  const [fontSize, setFontSize] = useState(24);
  const [targetTimeMins, setTargetTimeMins] = useState(40);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const mm = pad(Math.floor(elapsedSeconds / 60));
  const ss = pad(elapsedSeconds % 60);
  const remainingTotal = Math.max(0, (targetTimeMins * 60) - elapsedSeconds);
  const remMm = pad(Math.floor(remainingTotal / 60));
  const remSs = pad(remainingTotal % 60);

  const isOverTime = elapsedSeconds >= targetTimeMins * 60;
  
  const blocks = useMemo(() => parseMarkdownToBlocks(sermonMarkdown), [sermonMarkdown]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Ensure dark mode for this podium viewer regardless of system theme */}
      <DialogContent className="max-w-[100vw] w-screen h-screen max-h-screen p-0 m-0 gap-0 bg-[#080808] text-[#E8E0D8] !rounded-none flex flex-col border-none font-serif theme-dark dark">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0a0a] border-b border-[#1f1f1f] shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onOpenChange(false)} 
              className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold truncate max-w-sm text-[#F5F0E8] hidden md:block">
              {sermonTitle || 'Sermão'}
            </h1>
          </div>

          {/* Timer Display */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className={`text-3xl font-mono tracking-wider font-bold ${isOverTime ? 'text-red-500' : 'text-[#44DD88]'}`}>
                {isOverTime ? '-' : ''}{isOverTime ? remMm : mm}:{isOverTime ? remSs : ss}
              </span>
              <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
                {isRunning ? 'Em Andamento' : 'Pausado'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className="p-3 bg-[#1a1a1a] hover:bg-[#222] rounded-full transition-colors border border-[#333]"
              >
                {isRunning ? <Pause className="h-4 w-4 text-[#C4956A]" /> : <Play className="h-4 w-4 text-[#44DD88]" />}
              </button>
              <button 
                onClick={resetTimer}
                className="p-3 bg-[#1a1a1a] hover:bg-[#222] rounded-full transition-colors border border-[#333]"
              >
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-sans text-muted-foreground">Aa</span>
              <input 
                type="range" 
                min="18" 
                max="48" 
                value={fontSize} 
                onChange={e => setFontSize(Number(e.target.value))}
                className="w-24 accent-[#C4956A]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-sans text-muted-foreground">Meta:</span>
              <input 
                type="number" 
                value={targetTimeMins}
                onChange={e => setTargetTimeMins(Number(e.target.value))}
                className="w-16 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-center font-mono"
                min="1"
                max="120"
              />
              <span className="text-sm font-sans text-muted-foreground">m</span>
            </div>
          </div>
        </div>

        {/* Scrolling Content Area matching Sermonary PDF style */}
        <div className="flex-1 overflow-y-auto pb-32 pt-8 px-4 md:px-0">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Title block */}
            <div className="text-center mb-16 px-8">
              <h1 className="text-4xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight mb-4">
                {sermonTitle}
              </h1>
              <div className="h-1 w-24 bg-[#C4956A] mx-auto opacity-50 rounded-full"></div>
            </div>

            {/* Content blocks */}
            <div className="space-y-10">
              {blocks.map((block) => (
                <div key={block.id} className="relative flex group">
                  {/* Left Sidebar Marker & Badge */}
                  <div className="hidden md:flex flex-col items-end w-48 shrink-0 pr-6 pt-1">
                    <span 
                      className="text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border mb-2 text-right shadow-sm"
                      style={{ 
                        color: block.color, 
                        borderColor: `${block.color}40`,
                        backgroundColor: `${block.color}10` 
                      }}
                    >
                      {block.title}
                    </span>
                  </div>
                  
                  {/* Thick Left Border indicating Type */}
                  <div 
                    className="w-2 rounded-full shrink-0 mr-6 shadow-sm" 
                    style={{ backgroundColor: block.color }}
                  ></div>

                  {/* Main Block Content */}
                  <div 
                    className="flex-1 rounded-2xl p-8 shadow-sm transition-all relative overflow-hidden"
                    style={{ backgroundColor: block.bgDark, border: `1px solid ${block.color}20` }}
                  >
                    {/* Mobile Only Title Badge */}
                    <div className="md:hidden mb-4 inline-block">
                      <span 
                        className="text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border"
                        style={{ 
                          color: block.color, 
                          borderColor: `${block.color}40`,
                          backgroundColor: `${block.color}10` 
                        }}
                      >
                        {block.title}
                      </span>
                    </div>

                    {/* Markdown Renderer with enhanced Podium styles */}
                    <div 
                      className="podium-text"
                      style={{ 
                        fontSize: `${fontSize}px`,
                        lineHeight: 1.65,
                      }}
                    >
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="font-bold text-2xl mb-4 text-[#F5F0E8]" {...props} />,
                          h2: ({node, ...props}) => null, // We used headings as block titles, hide them inside content
                          h3: ({node, ...props}) => null,
                          h4: ({node, ...props}) => <h4 className="font-bold mb-2 opacity-90" {...props} />,
                          p: ({node, ...props}) => <p className="mb-6 last:mb-0 opacity-85 hover:opacity-100 transition-opacity" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-[#F5F0E8]" style={{ color: block.color }} {...props} />,
                          em: ({node, ...props}) => <em className="italic opacity-80" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-8 mb-6 space-y-3" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-8 mb-6 space-y-3" {...props} />,
                          li: ({node, ...props}) => <li className="pl-2" {...props} />,
                          blockquote: ({node, ...props}) => (
                            <blockquote 
                              className="border-l-4 pl-6 py-2 my-6 font-serif italic text-xl"
                              style={{ borderColor: block.color, backgroundColor: `${block.color}05` }}
                              {...props} 
                            />
                          ),
                        }}
                      >
                        {block.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Ending mark */}
            <div className="pt-20 text-center opacity-30 pb-20">
              <span className="text-[#C4956A] font-serif text-4xl">❧</span>
            </div>

          </div>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}
