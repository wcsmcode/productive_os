import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '/src/lib/supabase.js';
import { 
  Plus, FolderPlus, FileText, Folder, 
  ChevronDown, ChevronRight, Save, Trash2, Edit3 
} from 'lucide-react';
// Tận dụng PrismJS siêu nhẹ để tokenize code
import prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-css';

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' }
];

const inferLanguageFromTitle = (title) => {
  const ext = title.split('.').pop().toLowerCase();
  switch (ext) {
    case 'py': return 'python';
    case 'js':
    case 'ts': return 'javascript';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'c++': return 'cpp';
    case 'html': return 'html';
    case 'css': return 'css';
    default: return 'javascript';
  }
};

const NotesApp = () => {
  // --- STATES ---
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [currentNote, setCurrentNote] = useState({ title: 'new_note.js', content: '', language: 'javascript' });
  const [loading, setLoading] = useState(true);

  const saveTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const preRef = useRef(null);

  // --- KÉO DATA BAN ĐẦU ---
  useEffect(() => {
    fetchInitialData();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Đồng bộ cuộn giữa thẻ hiển thị code và textarea ẩn
  const handleScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const fetchInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [foldersRes, notesRes] = await Promise.all([
        supabase.from('note_folders').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('notes').select('id, title, folder_id, language').eq('user_id', user.id).order('updated_at', { ascending: false })
      ]);

      setFolders(foldersRes.data || []);
      const fetchedNotes = notesRes.data || [];
      setNotes(fetchedNotes);

      if (fetchedNotes.length > 0 && !currentNoteId) {
        loadNoteContent(fetchedNotes[0].id);
      }
    } catch (err) {
      console.error('🚨 Lỗi nạp dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId, e) => {
    e.stopPropagation();
    setCurrentFolderId(folderId);
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const createNewFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name || !name.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('note_folders')
      .insert([{ user_id: user.id, name: name.trim() }]);

    if (!error) fetchInitialData();
  };

  const createNewNote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const targetFolder = currentFolderId || null;
    if (targetFolder) {
      setExpandedFolders(prev => new Set(prev).add(targetFolder));
    }

    const { data: newNote, error } = await supabase
      .from('notes')
      .insert([{ 
        user_id: user.id, 
        folder_id: targetFolder, 
        title: 'new_note.js', 
        content: '',
        language: 'javascript'
      }])
      .select().single();

    if (!error && newNote) {
      await fetchInitialData();
      loadNoteContent(newNote.id);
    }
  };

  const loadNoteContent = async (noteId) => {
    if (saveTimeoutRef.current) saveCurrentNoteImmediate();

    setCurrentNoteId(noteId);
    const { data: note, error } = await supabase.from('notes').select('*').eq('id', noteId).single();
    if (error || !note) return;

    setCurrentNote({
      title: note.title,
      content: note.content || '',
      language: note.language || inferLanguageFromTitle(note.title || 'new_note.js')
    });
  };

  const deleteNote = async (noteId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (!error) {
      if (currentNoteId === noteId) {
        setCurrentNoteId(null);
        setCurrentNote({ title: 'deleted.sys', content: '', language: 'javascript' });
      }
      fetchInitialData();
    }
  };

  const renameNote = async (noteId, oldTitle, e) => {
    e.stopPropagation();
    const newTitle = prompt('Enter new name for this note:', oldTitle);
    if (!newTitle || !newTitle.trim()) return;

    const inferredLang = inferLanguageFromTitle(newTitle.trim());
    const { error } = await supabase.from('notes').update({ title: newTitle.trim(), language: inferredLang }).eq('id', noteId);
    if (!error) {
      if (currentNoteId === noteId) {
        setCurrentNote(prev => ({
          ...prev,
          title: newTitle.trim(),
          language: inferredLang
        }));
      }
      fetchInitialData();
    }
  };

  const handleEditorInput = () => {
    if (!currentNoteId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentNoteImmediate();
    }, 1500);
  };

  const saveCurrentNoteImmediate = async () => {
    if (!currentNoteId) return;

    await supabase.from('notes').update({ 
      title: currentNote.title, 
      content: currentNote.content,
      language: currentNote.language
    }).eq('id', currentNoteId);
  };

  const handleCodeChange = (e) => {
    const content = e.target.value;
    setCurrentNote(prev => ({ ...prev, content }));
    handleEditorInput();
  };

  const handleLanguageSelect = async (language) => {
    setCurrentNote(prev => ({ ...prev, language }));
    if (currentNoteId) {
      await supabase.from('notes').update({ language }).eq('id', currentNoteId);
      setNotes(prev => prev.map(n => n.id === currentNoteId ? { ...n, language } : n));
    }
  };

  // --- ENGINE TỰ ĐỘNG ĐÓNG NGOẶC & INDENT CỦA CHẤT ZEN ---
  const handleEditorKeyDown = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // 1. Nhấn Tab -> Thêm 2 khoảng trắng thụt lề
    if (e.key === 'Tab') {
      e.preventDefault();
      const updated = currentNote.content.substring(0, start) + '  ' + currentNote.content.substring(end);
      setCurrentNote(prev => ({ ...prev, content: updated }));
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
      handleEditorInput();
    }

    // 2. Cặp ký tự đóng mở ngoặc tự động
    const pairs = {
      '{': '}',
      '(': ')',
      '[': ']',
      '"': '"',
      "'": "'",
      '`': '`'
    };

    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const closingChar = pairs[e.key];
      
      // Nếu có bôi đen đoạn text -> bọc đoạn text lại
      const selection = currentNote.content.substring(start, end);
      const updated = currentNote.content.substring(0, start) + e.key + selection + closingChar + currentNote.content.substring(end);
      
      setCurrentNote(prev => ({ ...prev, content: updated }));
      setTimeout(() => {
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = start + 1 + selection.length;
      }, 0);
      handleEditorInput();
    }
  };

  // Hàm ép PrismJS render HTML highlight chuỗi string text
  const getHighlightedCode = () => {
    const code = currentNote.content || '';
    const lang = currentNote.language || 'javascript';
    const grammar = prism.languages[lang] || prism.languages.javascript;
    // Thêm ký tự xuống dòng ảo để mượt cuộn dòng cuối
    return prism.highlight(code, grammar, lang) + (code.endsWith('\n') ? '\n' : '');
  };

  const renderNoteItem = (note) => (
    <div 
      key={note.id}
      onClick={() => loadNoteContent(note.id)}
      className={`group flex justify-between items-center cursor-pointer p-2 hover:bg-black/10 text-xs border border-transparent
        ${currentNoteId === note.id ? 'bg-black/10 font-bold border-dashed border-black' : ''}`}
    >
      <span className="truncate flex-grow flex items-center gap-1.5">
        <FileText size={12} className="shrink-0" /> {note.title || 'Untitled Note'}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1 hover:bg-black/20 rounded text-black/60 hover:text-black" onClick={(e) => renameNote(note.id, note.title, e)}>
          <Edit3 size={10} />
        </button>
        <button className="p-1 hover:bg-red-500 hover:text-white rounded text-black/60" onClick={(e) => deleteNote(note.id, e)}>
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[550px] w-[800px] bg-[#F4F3EF] text-[#2A2820] select-none border-2 border-black font-mono rounded-lg overflow-hidden">
      <div className="flex flex-grow overflow-hidden">
        
        {/* SIDEBAR EXPLORER */}
        <aside className="w-60 border-r-2 border-black bg-[#E0DFD8] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#2A2820]/20 flex justify-between items-center bg-black/5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Explorer</span>
            <div className="flex gap-1.5">
              <button onClick={createNewNote} className="w-7 h-7 flex items-center justify-center border border-[#2A2820] bg-white hover:bg-[#2A2820] hover:text-white transition-all shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-[1px]" title="New Note">
                <Plus size={14} strokeWidth={3} />
              </button>
              <button onClick={createNewFolder} className="w-7 h-7 flex items-center justify-center border border-[#2A2820] bg-white hover:bg-[#2A2820] hover:text-white transition-all shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-[1px]" title="New Folder">
                <FolderPlus size={14} />
              </button>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-2 space-y-1">
            {folders.map(folder => {
              const isExpanded = expandedFolders.has(folder.id);
              const isSelected = currentFolderId === folder.id;
              const folderNotes = notes.filter(n => n.folder_id === folder.id);

              return (
                <div key={folder.id} className="space-y-0.5">
                  <div 
                    onClick={(e) => toggleFolder(folder.id, e)}
                    className={`flex items-center p-2 cursor-pointer hover:bg-black/10 text-xs font-bold transition-all
                      ${isSelected ? 'bg-black/5 border-l-2 border-black pl-1.5' : ''}`}
                  >
                    <span className="mr-1.5 opacity-70">
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>
                    <Folder size={13} className="mr-1.5 opacity-70" />
                    <span className="truncate flex-grow">{folder.name}</span>
                  </div>

                  {isExpanded && (
                    <div className="pl-3 border-l border-black/10 ml-3 space-y-0.5">
                      {folderNotes.length === 0 ? (
                        <div className="p-2 text-[10px] italic opacity-40">Empty folder...</div>
                      ) : (
                        folderNotes.map(note => renderNoteItem(note))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {notes.filter(n => !n.folder_id).length > 0 && folders.length > 0 && (
              <div className="mt-4 mb-1 px-2 text-[9px] font-black uppercase tracking-widest opacity-30">Root</div>
            )}
            {notes.filter(n => !n.folder_id).map(note => renderNoteItem(note))}
          </div>
        </aside>

        {/* EDITOR WORKSPACE ĐÃ ĐƯỢC CHÈN BỘ CHỈNH HIGHLIGHT */}
        <main className="flex-grow flex flex-col bg-[#F4F3EF]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-black/10 bg-white/40">
            <div className="flex flex-wrap items-center gap-2">
              {languageOptions.map(lang => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.value)}
                  className={`text-[10px] font-black uppercase px-3 py-1 border transition-all ${currentNote.language === lang.value ? 'bg-black text-white border-black' : 'bg-white text-black border-transparent hover:bg-black hover:text-white hover:border-black'}`}
                >
                  {lang.label}
                </button>
              ))}
              <button onClick={saveCurrentNoteImmediate} className="hover:bg-black hover:text-white px-2.5 py-1 text-[10px] font-black border border-transparent hover:border-black transition-all text-green-700" title="Lưu thủ công"><Save size={12} /></button>
            </div>
            <span className="text-[9px] font-bold italic opacity-50 uppercase tracking-tight">{currentNote.title} • {currentNote.language}</span>
          </div>

          {/* BLOCK CODE ĐÈ NỀN (OVERLAY STRUCTURE) */}
          <div className="flex-grow relative overflow-hidden bg-[#0F172A]">
            
            {/* Lớp hiển thị code được tô màu bởi Prism (Nằm dưới, ko bắt sự kiện chuột) */}
            <pre 
              ref={preRef}
              className="absolute inset-0 p-4 m-0 font-mono text-[13px] leading-[1.6] overflow-hidden pointer-events-none whitespace-pre-wrap break-words text-[#E2E8F0]"
              aria-hidden="true"
            >
              <code 
                className={`language-${currentNote.language}`}
                dangerouslySetInnerHTML={{ __html: getHighlightedCode() }}
              />
            </pre>

            {/* Lớp Textarea thực tế nhận tương tác gõ chữ (Nằm trên, làm trong suốt văn bản, giữ nguyên con trỏ nhảy) */}
            <textarea
              ref={textareaRef}
              value={currentNote.content}
              onChange={handleCodeChange}
              onKeyDown={handleEditorKeyDown}
              onScroll={handleScroll}
              spellCheck="false"
              className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white font-mono text-[13px] leading-[1.6] outline-none border-none resize-none overflow-auto whitespace-pre-wrap break-words"
              placeholder="Write code here..."
            />
          </div>
        </main>
      </div>

      {/* CSS Nhúng trực tiếp để tạo bảng màu token chuẩn Dark-Mode cho Prism */}
      <style>{`
        .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #64748b; font-style: italic; }
        .token.punctuation { color: #94a3b8; }
        .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol, .token.deleted { color: #f43f5e; }
        .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #10b981; }
        .token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string { color: #f59e0b; }
        .token.atrule, .token.attr-value, .token.keyword { color: #3b82f6; font-weight: bold; }
        .token.function, .token.class-name { color: #ec4899; }
        .token.regex, .token.important, .token.variable { color: #eab308; }
      `}</style>
    </div>
  );
};

export default NotesApp;