import React, { useState, useEffect } from 'react';
import { Globe, Search, MonitorUp, Link as LinkIcon, ImagePlus, Trash2, Loader2, MessageSquareText } from 'lucide-react';
import { databaseService } from '../services/database';
import MetadataForm from '../components/import/MetadataForm';
import ProgressStatus from '../components/import/ProgressStatus';

export default function AddMedia() {
  const [activeTab, setActiveTab] = useState('url'); 
  const [metadata, setMetadata] = useState({ title: '', caption: '', sourceUrl: '', selectedCategories: [], selectedTags: [] });

  const [files, setFiles] = useState([]);
  const [remoteMediaUrl, setRemoteMediaUrl] = useState('');
  const [targetPostUrl, setTargetPostUrl] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  
  const [existingCategories, setExistingCategories] = useState([]);
  const [existingTags, setExistingTags] = useState([]);
  const [status, setStatus] = useState({ state: 'idle', message: '', progress: 0 });

  useEffect(() => {
    databaseService.getAllPosts()
      .then((data) => {
        const allCats = new Set();
        const allTags = new Set();
        data.forEach(post => {
          if (post.categories) post.categories.forEach(cat => allCats.add(cat));
          if (post.tags) post.tags.forEach(tag => allTags.add(tag));
        });
        setExistingCategories(Array.from(allCats));
        setExistingTags(Array.from(allTags));
      })
      .catch((err) => console.error('Error loading suggestions:', err));
  }, []);

  const handleExtractCaption = async (targetUrl) => {
    if (!targetUrl.trim()) return setStatus({ state: 'error', message: 'Masukkan link terlebih dahulu.', progress: 0 });
    
    setStatus({ state: 'processing', message: 'Mengekstrak caption...', progress: 50 });
    
    try {
      // Using a free CORS proxy because direct fetch to Instagram/X is blocked by browsers
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl.trim())}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Target universal metadata tags
        let extractedCaption = 
          doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
          doc.querySelector('meta[property="twitter:description"]')?.getAttribute('content') || 
          doc.querySelector('meta[name="description"]')?.getAttribute('content');
        
        if (!extractedCaption) {
          const title = doc.querySelector('title')?.innerText || '';
          if (title.length > 15) extractedCaption = title.replace(/Instagram photos and videos/gi, '').trim();
        }

        if (extractedCaption) {
          setMetadata(prev => ({ ...prev, caption: extractedCaption }));
          setStatus({ state: 'success', message: 'Caption berhasil ditarik!', progress: 100 });
          setTimeout(() => setStatus({ state: 'idle', message: '', progress: 0 }), 1500);
        } else {
          setStatus({ state: 'error', message: 'Caption tidak ditemukan di halaman ini.', progress: 0 });
          setTimeout(() => setStatus({ state: 'idle', message: '', progress: 0 }), 2500);
        }
      }
    } catch (err) {
      console.error(err);
      setStatus({ state: 'error', message: 'Gagal menarik caption (Jaringan/CORS error).', progress: 0 });
      setTimeout(() => setStatus({ state: 'idle', message: '', progress: 0 }), 2500);
    }
  };

  const handleExtractImages = async () => {
    if (!targetPostUrl.trim()) return setStatus({ state: 'error', message: 'Masukkan link post terlebih dahulu.', progress: 0 });
    setStatus({ state: 'processing', message: 'Mencari gambar...', progress: 45 });
    
    try {
      const response = await databaseService.scrapeUrl(targetPostUrl.trim());
      const data = await response.json();
      
      if (response.ok && data.images?.length > 0) {
        setImageUrls(data.images);
        setStatus({ state: 'success', message: `Berhasil menarik ${data.images.length} gambar!`, progress: 100 });
        setTimeout(() => setStatus({ state: 'idle', message: '', progress: 0 }), 1500);
      } else {
        setStatus({ state: 'error', message: data.error || 'Gagal mengekstrak gambar.', progress: 0 });
      }
    } catch (err) {
      setStatus({ state: 'error', message: 'Koneksi ke backend gagal.', progress: 0 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeTab === 'local' && files.length === 0) return setStatus({ state: 'error', message: 'Pilih file.', progress: 0 });
    if (activeTab === 'url' && !remoteMediaUrl.trim()) return setStatus({ state: 'error', message: 'Masukkan link.', progress: 0 });
    if (activeTab === 'image' && imageUrls.length === 0) return setStatus({ state: 'error', message: 'Tarik gambar dulu.', progress: 0 });

    setStatus({ state: 'processing', message: 'Menyimpan unduhan...', progress: 5 });

    const progressInterval = setInterval(() => {
      setStatus(prev => ({ ...prev, progress: Math.min(prev.progress + 10, 90) }));
    }, 600);

    try {
      let response;
      if (activeTab === 'local') {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        formData.append('title', metadata.title);
        formData.append('source_url', metadata.sourceUrl.trim() || 'https://google.com');
        formData.append('caption', metadata.caption);
        formData.append('categories', JSON.stringify(metadata.selectedCategories));
        formData.append('tags', JSON.stringify(metadata.selectedTags));
        response = await databaseService.saveLocalPost(formData);
      } 
      else if (activeTab === 'url') {
        response = await databaseService.saveRemotePost('/api/posts/from-url', {
          media_url: remoteMediaUrl,
          title: metadata.title,
          caption: metadata.caption,
          tags: JSON.stringify(metadata.selectedTags),
          categories: JSON.stringify(metadata.selectedCategories)
        });
      } 
      else if (activeTab === 'image') {
        response = await databaseService.saveRemotePost('/api/posts/from-image-urls', {
          image_urls: JSON.stringify(imageUrls),
          title: metadata.title,
          caption: metadata.caption,
          tags: JSON.stringify(metadata.selectedTags),
          categories: JSON.stringify(metadata.selectedCategories)
        });
      }

      clearInterval(progressInterval);

      if (response && response.ok) {
        setStatus({ state: 'success', message: 'Tersimpan!', progress: 100 });
        setFiles([]); setRemoteMediaUrl(''); setImageUrls([]); setTargetPostUrl('');
        setMetadata({ title: '', caption: '', sourceUrl: '', selectedCategories: [], selectedTags: [] });
      } else {
        const err = await response.json();
        setStatus({ state: 'error', message: err.error || 'Terjadi kesalahan sistem.', progress: 0 });
      }
    } catch (err) {
      clearInterval(progressInterval);
      setStatus({ state: 'error', message: 'Terputus dari server.', progress: 0 });
    }
  };

  return (
    <div className="px-4 pt-4 pb-6 max-w-[480px] mx-auto flex flex-col gap-6">
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-app-text">Browser & Import</h2>
        <button className="p-2 text-brand-500 bg-brand-50 rounded-full shadow-soft">
          <Globe size={20} />
        </button>
      </div>

      <div className="flex bg-gray-100/70 p-1 rounded-2xl">
        <button onClick={() => { setActiveTab('url'); setStatus({state: 'idle'}); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'url' ? 'bg-white text-brand-600 shadow-sm' : 'text-app-muted'}`}>
          <LinkIcon size={14} /> URL
        </button>
        <button onClick={() => { setActiveTab('local'); setStatus({state: 'idle'}); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'local' ? 'bg-white text-brand-600 shadow-sm' : 'text-app-muted'}`}>
          <MonitorUp size={14} /> Local
        </button>
        <button onClick={() => { setActiveTab('image'); setStatus({state: 'idle'}); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'image' ? 'bg-white text-brand-600 shadow-sm' : 'text-app-muted'}`}>
          <ImagePlus size={14} /> Batch
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-soft border border-gray-100">
        <form onSubmit={handleSubmit} className="flex flex-col">
          
          <div className="mb-2">
            {activeTab === 'url' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-app-text">Link Video/Media Remote</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                    <Search size={16} className="text-app-muted ml-2 shrink-0" />
                    <input 
                      type="url" placeholder="Paste Post Link..." 
                      value={remoteMediaUrl} onChange={(e) => setRemoteMediaUrl(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs text-app-text bg-transparent outline-none" 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleExtractCaption(remoteMediaUrl)}
                    className="flex items-center gap-1 bg-brand-50 text-brand-600 px-3 rounded-xl text-[11px] font-bold hover:bg-brand-100 transition-colors whitespace-nowrap"
                  >
                    <MessageSquareText size={14} /> Caption
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'local' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-app-text">Pilih File Lokal</label>
                <input 
                  type="file" multiple onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
                  className="block w-full text-xs text-app-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100 cursor-pointer"
                />
              </div>
            )}

            {activeTab === 'image' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-app-text">Scrape Images dari Post</label>
                <div className="flex gap-2">
                  <input 
                    type="url" placeholder="Paste link post..." 
                    value={targetPostUrl} onChange={(e) => setTargetPostUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-400"
                  />
                  <button 
                    type="button" 
                    onClick={handleExtractImages} 
                    className="bg-gray-100 text-app-text px-3 rounded-xl text-[11px] font-bold hover:bg-gray-200 shadow-sm transition-colors whitespace-nowrap"
                  >
                    Images
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleExtractCaption(targetPostUrl)}
                    className="flex items-center gap-1 bg-brand-50 text-brand-600 px-3 rounded-xl text-[11px] font-bold hover:bg-brand-100 shadow-sm transition-colors whitespace-nowrap"
                  >
                    <MessageSquareText size={14} /> Caption
                  </button>
                </div>
                
                {imageUrls.length > 0 && (
                  <div className="mt-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-2 max-h-32 overflow-y-auto">
                    <span className="text-[10px] font-bold text-gray-500 mb-2 block">Queue: {imageUrls.length} file</span>
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-1.5 border border-gray-200 mb-1 rounded text-[10px]">
                        <span className="truncate w-[85%]">{url}</span>
                        <button type="button" onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))} className="text-red-500 font-bold p-1 hover:bg-red-50 rounded">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <MetadataForm 
            metadata={metadata} 
            setMetadata={setMetadata} 
            existingCategories={existingCategories} 
            existingTags={existingTags} 
            activeTab={activeTab} 
          />

          <button 
            type="submit" 
            disabled={status.state === 'processing'}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-bold text-sm py-3 rounded-2xl mt-5 transition-all shadow-float flex items-center justify-center gap-2"
          >
            {status.state === 'processing' ? <Loader2 size={18} className="animate-spin" /> : 'Unduh Sekarang'}
          </button>

          <ProgressStatus 
            status={status} 
            onClose={() => setStatus({ state: 'idle', message: '', progress: 0 })} 
          />
        </form>
      </div>
    </div>
  );
}