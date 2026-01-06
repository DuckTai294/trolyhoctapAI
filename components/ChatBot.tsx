
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, ChatMessage, StudentProfile } from '../types';
import { chatWithAI } from '../services/geminiService';
import { Send, Image as ImageIcon, X, Loader2, Bot, User, MessageSquare, Plus, Trash2, Sidebar as SidebarIcon } from 'lucide-react';
import { MathText } from './MathText';
import { useTheme } from './ThemeContext';

interface ChatBotProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  profile: StudentProfile; 
  onSessionChange: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onUpdateSession: (id: string, messages: ChatMessage[]) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ 
  sessions, activeSessionId, profile, onSessionChange, onNewSession, onDeleteSession, onUpdateSession 
}) => {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    if (sessions.length === 0 && !activeSessionId) {
      onNewSession();
    }
  }, []);

  useEffect(() => {
    const draft = localStorage.getItem('glassy_chat_draft');
    if (draft) setInput(draft);
  }, []);

  useEffect(() => {
    localStorage.setItem('glassy_chat_draft', input);
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      // Smooth scroll can sometimes be interrupted by rapid state updates, 
      // using timeout ensures it runs after render.
      setTimeout(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages.length, loading, activeSessionId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
         alert("Vui lòng chọn ảnh dưới 2MB để đảm bảo hiệu suất nha! 🌟");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;

    if (!activeSessionId) {
       onNewSession();
       // Wait for parent to create session. In a real app this would be awaited or handled via effect,
       // here we might need a slight delay or optimistic update.
       // Ideally onNewSession returns the ID. Assuming async state update, we pause.
       return; 
    }

    const currentSessionId = activeSessionId;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: selectedImage || undefined,
    };

    const newMessages = [...messages, userMsg];
    onUpdateSession(currentSessionId, newMessages);
    
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    const tempId = (Date.now() + 1).toString();
    const waitingMsg: ChatMessage = { id: tempId, role: 'model', text: '', isLoading: true };
    const loadingMessages = [...newMessages, waitingMsg];
    onUpdateSession(currentSessionId, loadingMessages);

    try {
      const response = await chatWithAI(userMsg.text, userMsg.image, {
        profile 
      });
      
      const finalMessages = [...newMessages, { ...waitingMsg, text: response, isLoading: false }];
      onUpdateSession(currentSessionId, finalMessages);
    } catch (error) {
      const errorMessages = [...newMessages, { ...waitingMsg, text: "Xin lỗi, mình gặp chút trục trặc. Bạn thử lại nha!", isLoading: false }];
      onUpdateSession(currentSessionId, errorMessages);
    } finally {
      setLoading(false);
    }
  };

  const rootClass = "flex h-[calc(100vh-140px)] md:h-[calc(100vh-130px)] max-w-6xl mx-auto pb-20 md:pb-0 gap-4 transition-all duration-300";

  return (
    <div className={rootClass}>
      
      {/* --- Sidebar History --- */}
      <div className={`
        flex-shrink-0 w-72 backdrop-blur-2xl border rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col transition-all duration-300 z-40 ease-spring
        ${showSidebar ? 'absolute inset-y-0 left-0 md:relative translate-x-0' : 'hidden md:flex'}
        ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/60 border-white/40'}
      `}>
         <div className={`p-6 border-b flex items-center justify-between ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/40 border-white/40'}`}>
            <h3 className={`font-bold ${theme.text}`}>Lịch sử Chat</h3>
            <button onClick={() => setShowSidebar(false)} className={`md:hidden hover:rotate-90 transition-transform ${theme.isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500'}`}><X size={20}/></button>
         </div>
         
         <div className="p-4">
            <button 
              onClick={() => { onNewSession(); if(window.innerWidth < 768) setShowSidebar(false); }}
              className={`btn-hover w-full py-3 bg-gradient-to-r ${theme.primary} text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2`}
            >
               <Plus size={18} /> Đoạn chat mới
            </button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-2">
            {sessions.slice().reverse().map(session => (
               <div 
                 key={session.id} 
                 onClick={() => { onSessionChange(session.id); if(window.innerWidth < 768) setShowSidebar(false); }}
                 className={`
                   group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border
                   ${activeSessionId === session.id 
                     ? (theme.isDark ? 'bg-slate-800 border-slate-600 shadow-sm' : 'bg-white shadow-sm border-pink-200 scale-[1.02]') 
                     : (theme.isDark ? 'border-transparent hover:bg-slate-800/50 hover:border-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-white/50 border-transparent hover:border-white/50 text-slate-500 hover:translate-x-1')}
                 `}
               >
                 <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={18} className={activeSessionId === session.id ? 'text-pink-500' : (theme.isDark ? 'text-slate-500' : 'text-slate-400')} />
                    <div className={`truncate text-sm font-medium ${activeSessionId === session.id ? (theme.isDark ? 'text-slate-200' : 'text-slate-700') : ''}`}>
                       {session.title || "Cuộc hội thoại mới"}
                    </div>
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                   className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all hover:scale-110"
                 >
                    <Trash2 size={14} />
                 </button>
               </div>
            ))}
         </div>
      </div>


      {/* --- Main Chat Area --- */}
      <div className={`flex-1 backdrop-blur-2xl border rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col h-full relative ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/60 border-white/40'}`}>
        <div className={`p-4 md:p-6 border-b flex flex-col md:flex-row items-center gap-4 justify-between ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-white/40'}`}>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => setShowSidebar(true)} className={`md:hidden p-2 -ml-2 ${theme.isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <SidebarIcon size={20} />
            </button>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${theme.primary} flex items-center justify-center text-white shadow-md animate-bounce-slow`}>
                <Bot size={24} />
            </div>
            <div>
                <h2 className={`text-xl font-bold ${theme.text}`}>AI Assistant</h2>
                {profile.name && <p className="text-xs text-pink-500 font-bold">Xin chào {profile.name}!</p>}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className={`flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar ${theme.isDark ? 'bg-slate-900/20' : 'bg-white/30'}`}>
          {!activeSessionId || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center opacity-70 animate-fade-in-up">
              <Bot size={64} className="mb-4 text-pink-300" />
              <p className={`text-lg font-medium ${theme.text}`}>Xin chào {profile.name || "bạn"}!</p>
              <p className="text-sm">Mình có thể giúp gì cho mục tiêu vào {profile.targetUniversity || "Đại học"}?</p>
            </div>
          ) : (
             messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 animate-slide-in-bottom ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1 transition-transform hover:scale-110
                  ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : `bg-gradient-to-br ${theme.primary} text-white`}
                `}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div className={`
                  max-w-[80%] rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md
                  ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-transparent rounded-tr-none' 
                    : (theme.isDark ? 'bg-slate-800 border-slate-700 text-slate-200 rounded-tl-none' : 'bg-white/80 border-white/50 text-slate-700 rounded-tl-none backdrop-blur-md')}
                `}>
                  {msg.image && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-white/20 shadow-sm">
                      <img src={msg.image} alt="User upload" className="max-w-full max-h-60 object-cover" />
                    </div>
                  )}
                  
                  {msg.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm font-medium">AI đang suy nghĩ...</span>
                    </div>
                  ) : (
                    <div className={`prose prose-sm max-w-none ${msg.role === 'user' || theme.isDark ? 'prose-invert' : 'prose-pink'}`}>
                      <MathText content={msg.text} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t backdrop-blur-xl ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/60 border-white/40'}`}>
          {selectedImage && (
            <div className="mb-3 flex items-center gap-2 bg-pink-50 px-3 py-2 rounded-xl w-fit border border-pink-100 animate-fade-in-up">
              <span className="text-xs font-bold text-pink-600 flex items-center gap-1">
                <ImageIcon size={12}/> Đã chọn ảnh
              </span>
              <button 
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          <div className="flex gap-2 items-end">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-2xl transition-all hover:scale-105 border mb-[2px] ${theme.isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200'}`}
            >
              <ImageIcon size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageSelect}
            />
            
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Nhập câu hỏi..."
                className={`w-full p-3 pr-10 rounded-2xl border focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none resize-none custom-scrollbar max-h-32 min-h-[50px] transition-all duration-300 ${theme.isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white/80 border-slate-200 text-slate-700 placeholder-slate-400'}`}
                rows={1}
              />
            </div>

            <button 
              onClick={handleSend}
              disabled={loading || (!input.trim() && !selectedImage) || !activeSessionId}
              className={`p-3 bg-gradient-to-br ${theme.primary} text-white rounded-2xl shadow-md transition-all duration-300 hover:scale-110 active:scale-90 disabled:opacity-50 disabled:hover:scale-100 mb-[2px]`}
            >
              {loading ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
