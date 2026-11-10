import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Trash2, Image as ImageIcon, Play } from 'lucide-react';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [visibleCount, setVisibleCount] = useState(50); // Lazy loading state
  
  // The invisible div at the bottom we will "observe"
  const observerTarget = useRef(null);

  const fetchPosts = () => {
    fetch(`/api/posts`)
      .then((res) => res.json())
      .then((data) => setPosts(data.reverse()))
      .catch((err) => console.error('Error fetching posts:', err));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Intersection Observer for Infinite Scroll Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Add 50 more items when the user scrolls to the bottom
          setVisibleCount((prev) => prev + 50);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [posts]); // Re-bind if posts array changes

  const handleSelectToggle = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmDelete = window.confirm(`Hapus ${selectedIds.length} item secara permanen?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/posts/batch`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        setSelectedIds([]);
        fetchPosts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isVideo = (path) => {
    return ['.mp4', '.webm', '.ogg', '.mov', '.mkv'].some((ext) => path?.toLowerCase().endsWith(ext));
  };

  // Slice array to only render what's visible
  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <div className="px-4 pt-4 pb-6 max-w-[480px] mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-app-text">Database Unduhan</h2>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-red-50 p-3 rounded-xl border border-red-100 transition-all">
          <span className="text-xs font-bold text-red-600">{selectedIds.length} item terpilih</span>
          <button 
            onClick={handleBatchDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-red-700"
          >
            <Trash2 size={14} /> Hapus Batch
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {posts.length === 0 ? (
          <div className="py-10 text-center text-sm text-app-muted">Belum ada data.</div>
        ) : (
          visiblePosts.map((post) => {
            const firstMedia = post.paths?.[0];
            const isVideoFile = isVideo(firstMedia);
            
            // Fix Network Issue: Force thumbnail usage instead of loading full media
            const thumbUrl = firstMedia ? `/${firstMedia.replace(/(\.[\w\d]+)$/, '_thumb.jpg')}` : '';
            const displayTitle = post.title?.trim() ? post.title : `Media #${post.id}`;
            const isChecked = selectedIds.includes(post.id);

            return (
              <div 
                key={post.id} 
                onClick={() => handleSelectToggle(post.id)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isChecked ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {firstMedia ? (
                    <>
                      <img 
                        src={thumbUrl} 
                        alt="thumb" 
                        loading="lazy"
                        className="w-full h-full object-cover" 
                        // Fallback to original image if thumb missing
                        onError={(e) => { e.target.src = `/${firstMedia}`; }}
                      />
                      {isVideoFile && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play size={14} className="text-white fill-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <ImageIcon size={20} className="text-gray-400" />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <h4 className="text-xs font-bold text-app-text truncate">{displayTitle}</h4>
                  <div className="text-[10px] text-app-muted mt-0.5">
                    {isVideoFile ? 'Video' : 'Gambar'} • {post.source_url && post.source_url !== 'https://google.com' ? 'Remote' : 'Lokal'}
                  </div>
                </div>

                <div className="flex-shrink-0 pl-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isChecked ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                    <CheckCircle2 size={12} strokeWidth={3} />
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Invisible target for the Intersection Observer */}
        <div ref={observerTarget} className="h-4 w-full" />
      </div>
    </div>
  );
}