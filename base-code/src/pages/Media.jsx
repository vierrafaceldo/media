import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ExternalLink, Calendar, Tag, Folder, Image as ImageIcon } from 'lucide-react';

export default function Media() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Media tidak ditemukan');
        return res.json();
      })
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus media ini?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (response.ok) {
        navigate('/dashboard'); // Go back to downloads list after deleting
      } else {
        alert('Gagal menghapus media.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const isVideo = (path) => {
    if (!path) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.mkv'];
    return videoExtensions.some((ext) => path.toLowerCase().endsWith(ext));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg max-w-[480px] mx-auto">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 bg-app-bg max-w-[480px] mx-auto p-5 text-center">
        <p className="text-sm font-bold text-red-500">{error || 'Media tidak ditemukan.'}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto bg-white min-h-screen pb-24 shadow-soft">
      
      {/* 1. Sticky Top Navigation */}
      <div className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button 
          onClick={() => navigate(-1)} 
          className="w-9 h-9 flex items-center justify-center bg-gray-50 text-app-text rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xs font-bold text-app-text truncate px-4">
          {post.title || `Media #${post.id}`}
        </h2>
        <button 
          onClick={handleDelete} 
          className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* 2. Immersive Media Viewer */}
      <div className="w-full bg-black flex flex-col overflow-hidden">
        {post.paths && post.paths.map((path, idx) => (
          <div key={idx} className="w-full border-b border-gray-800 last:border-b-0">
            {isVideo(path) ? (
              <video 
                src={`/${path}`} 
                controls 
                className="w-full h-auto max-h-[65vh] object-contain" 
                playsInline 
              />
            ) : (
              <img 
                src={`/${path}`} 
                alt={`Media ${idx + 1}`} 
                className="w-full h-auto max-h-[65vh] object-contain" 
              />
            )}
          </div>
        ))}
        
        {/* Empty State Fallback */}
        {(!post.paths || post.paths.length === 0) && (
          <div className="w-full h-64 flex items-center justify-center text-gray-600">
            <ImageIcon size={48} />
          </div>
        )}
      </div>

      {/* 3. Metadata & Details Section */}
      <div className="p-5 flex flex-col gap-6">
        
        {/* Title & External Link */}
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-bold text-app-text leading-tight">
            {post.title || 'Media Tanpa Judul'}
          </h1>
          
          {post.source_url && post.source_url !== 'https://google.com' && (
            <a 
              href={post.source_url} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center w-fit gap-1.5 text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <ExternalLink size={14} strokeWidth={2.5} /> 
              Buka Sumber Asli
            </a>
          )}
        </div>

        {/* Caption Container */}
        {post.caption && (
          <div className="bg-app-bg p-4 rounded-2xl border border-gray-100">
            <p className="text-xs text-app-text whitespace-pre-wrap leading-relaxed">
              {post.caption}
            </p>
          </div>
        )}

        {/* Categories & Tags */}
        <div className="flex flex-col gap-3">
          
          {/* Category Pills */}
          {(post.categories && post.categories.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              <Folder size={14} className="text-app-muted" />
              {post.categories.map(cat => (
                <span key={cat} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                  {cat}
                </span>
              ))}
            </div>
          )}
          
          {/* Tag Pills */}
          {(post.tags && post.tags.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={14} className="text-app-muted" />
              {post.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-lg">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Date Created */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-app-muted mt-2 pt-4 border-t border-gray-100">
            <Calendar size={13} />
            <span>
              Disimpan pada: {new Date(post.created_at || Date.now()).toLocaleDateString('id-ID', { 
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
              })}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}