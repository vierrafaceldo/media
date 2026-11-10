import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function MetadataForm({ 
  metadata, 
  setMetadata, 
  existingCategories, 
  existingTags, 
  activeTab 
}) {
  const [categoryInput, setCategoryInput] = useState('');
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);

  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const addCategory = (catName) => {
    const cleaned = catName.trim();
    if (cleaned && !metadata.selectedCategories.includes(cleaned)) {
      setMetadata({ ...metadata, selectedCategories: [...metadata.selectedCategories, cleaned] });
    }
    setCategoryInput('');
    setShowCatSuggestions(false);
  };

  const removeCategory = (catName) => {
    setMetadata({ ...metadata, selectedCategories: metadata.selectedCategories.filter(c => c !== catName) });
  };

  const addTag = (tagName) => {
    const cleaned = tagName.trim().toLowerCase();
    if (cleaned && !metadata.selectedTags.includes(cleaned)) {
      setMetadata({ ...metadata, selectedTags: [...metadata.selectedTags, cleaned] });
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagName) => {
    setMetadata({ ...metadata, selectedTags: metadata.selectedTags.filter(t => t !== tagName) });
  };

  const filteredCatSuggestions = categoryInput.trim().length >= 1 
    ? existingCategories.filter(cat => cat.toLowerCase().includes(categoryInput.toLowerCase()) && !metadata.selectedCategories.includes(cat)) 
    : [];
    
  const filteredTagSuggestions = tagInput.trim().length >= 1 
    ? existingTags.filter(tag => tag.toLowerCase().includes(tagInput.toLowerCase()) && !metadata.selectedTags.includes(tag)) 
    : [];

  const handleCategoryKeyDown = (e) => {
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      if (categoryInput.trim()) addCategory(categoryInput); 
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      if (tagInput.trim()) addTag(tagInput); 
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-gray-100">
      
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-app-muted uppercase tracking-wider">Judul Post (Opsional)</label>
        <input 
          type="text" placeholder="Masukkan judul kustom..." 
          value={metadata.title} onChange={(e) => setMetadata({ ...metadata, title: e.target.value })} 
          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:bg-white transition-colors" 
        />
      </div>

      {/* Categories */}
      <div className="relative flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-app-muted uppercase tracking-wider">Kategori</label>
        {metadata.selectedCategories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-1">
            {metadata.selectedCategories.map(cat => (
              <span key={cat} className="bg-brand-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-medium inline-flex items-center gap-1.5 shadow-sm">
                📁 {cat} 
                <button type="button" onClick={() => removeCategory(cat)} className="hover:text-brand-200 focus:outline-none"><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <input 
          type="text" placeholder="Ketik kategori & Enter..." 
          value={categoryInput} onKeyDown={handleCategoryKeyDown} 
          onChange={(e) => { setCategoryInput(e.target.value); setShowCatSuggestions(true); }} 
          onFocus={() => setShowCatSuggestions(true)}
          onBlur={() => setTimeout(() => setShowCatSuggestions(false), 200)}
          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:bg-white transition-colors" 
        />
        {showCatSuggestions && filteredCatSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 z-50 max-h-40 overflow-y-auto shadow-lg rounded-xl">
            {filteredCatSuggestions.map((suggestion) => (
              <div 
                key={suggestion} onClick={() => addCategory(suggestion)} 
                className="px-3 py-2 text-xs cursor-pointer bg-white hover:bg-gray-50"
              >
                📁 {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="relative flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-app-muted uppercase tracking-wider">Tags</label>
        {metadata.selectedTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-1">
            {metadata.selectedTags.map(tag => (
              <span key={tag} className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-medium inline-flex items-center gap-1.5 shadow-sm">
                #{tag} 
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-emerald-200 focus:outline-none"><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <input 
          type="text" placeholder="Ketik tag & Enter..." 
          value={tagInput} onKeyDown={handleTagKeyDown} 
          onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }} 
          onFocus={() => setShowTagSuggestions(true)} 
          onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:bg-white transition-colors" 
        />
        {showTagSuggestions && filteredTagSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 z-50 max-h-40 overflow-y-auto shadow-lg rounded-xl">
            {filteredTagSuggestions.map((suggestion) => (
              <div 
                key={suggestion} onClick={() => addTag(suggestion)} 
                className="px-3 py-2 text-xs cursor-pointer bg-white hover:bg-gray-50"
              >
                #{suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Source URL (Local Only) */}
      {activeTab === 'local' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-app-muted uppercase tracking-wider">Source URL / Link Asli</label>
          <input 
            type="url" placeholder="https://..." 
            value={metadata.sourceUrl} onChange={(e) => setMetadata({ ...metadata, sourceUrl: e.target.value })} 
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:bg-white transition-colors" 
          />
        </div>
      )}

      {/* Caption Box for ALL tabs */}
      <div className="flex flex-col gap-1.5 mt-1">
        <label className="text-[11px] font-bold text-app-muted uppercase tracking-wider">Caption</label>
        <textarea 
          placeholder="Caption hasil scrape akan muncul di sini atau ketik manual..." 
          value={metadata.caption} onChange={(e) => setMetadata({ ...metadata, caption: e.target.value })} 
          rows="4" 
          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:bg-white transition-colors resize-none" 
        />
      </div>

    </div>
  );
}