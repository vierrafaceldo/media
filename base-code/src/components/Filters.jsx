import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';

export default function Filters({ onFilterChange }) {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => {
        const uniqueCats = new Set();
        const uniqueTags = new Set();
        data.forEach((post) => {
          if (post.categories) post.categories.forEach((cat) => uniqueCats.add(cat));
          if (post.tags) post.tags.forEach((tag) => uniqueTags.add(tag));
        });
        setCategories(Array.from(uniqueCats).sort());
        setTags(Array.from(uniqueTags).sort());
      })
      .catch((err) => console.error('Error fetching filters data:', err));
  }, []);

  useEffect(() => {
    onFilterChange({ searchQuery, sortBy, categories: selectedCategories, tags: selectedTags });
  }, [searchQuery, sortBy, selectedCategories, selectedTags, onFilterChange]);

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || selectedTags.length > 0 || sortBy !== 'latest';

  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('latest');
    setSelectedCategories([]);
    setSelectedTags([]);
  };

  return (
    <div className="flex flex-col gap-2 mb-2">
      {/* Top Search & Toggle Bar */}
      <div className="flex items-center gap-2">
        <input 
          type="text"
          placeholder="Cari post, judul, atau caption..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-all"
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-xl border transition-all ${isOpen || hasActiveFilters ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Expandable Filter Panel */}
      {isOpen && (
        <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-soft flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Urutkan</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs outline-none"
              >
                <option value="latest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="alpha-asc">A - Z</option>
                <option value="alpha-desc">Z - A</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Kategori</label>
              <select 
                onChange={(e) => {
                  if (e.target.value && !selectedCategories.includes(e.target.value)) {
                    setSelectedCategories([...selectedCategories, e.target.value]);
                  }
                  e.target.value = '';
                }}
                defaultValue=""
                className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs outline-none"
              >
                <option value="" disabled>+ Tambah...</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Active Chips Area */}
          {(selectedCategories.length > 0 || selectedTags.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
              {selectedCategories.map(cat => (
                <span key={cat} className="bg-brand-500 text-white px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1">
                  📁 {cat} <X size={10} className="cursor-pointer hover:text-gray-200" onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))} />
                </span>
              ))}
            </div>
          )}
          
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-[10px] font-bold text-red-500 text-right mt-1 hover:text-red-600">
              Reset Semua Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}