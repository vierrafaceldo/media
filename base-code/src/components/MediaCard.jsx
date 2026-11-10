import React, { useState } from 'react';
import { Play, Image as ImageIcon } from 'lucide-react';

export default function MediaCard({ post, onClick }) {
  if (!post) return null;

  // Restore original logic for thumbnails
  const firstMedia = post.paths && post.paths[0];
  const mediaUrl = `/${firstMedia}`;
  const thumbPath = firstMedia ? firstMedia.replace(/(\.[\w\d]+)$/, '_thumb.jpg') : '';
  const thumbUrl = `/${thumbPath}`;

  const [thumbError, setThumbError] = useState(false);
  const displayTitle = post.title && post.title.trim() !== "" ? post.title : `Media #${post.id}`;

  const isVideo = (path) => {
    if (!path) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.mkv'];
    return videoExtensions.some((ext) => path.toLowerCase().endsWith(ext));
  };

  const hasMultiple = post.paths && post.paths.length > 1;

  return (
    <div 
      onClick={onClick}
      className="flex flex-col bg-white rounded-2xl shadow-soft hover:shadow-md transition-all cursor-pointer border border-gray-100/80 overflow-hidden active:scale-95"
    >
      {/* Top: Square Thumbnail */}
      <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {firstMedia ? (
          isVideo(firstMedia) ? (
            <>
              {!thumbError ? (
                <img 
                  src={thumbUrl} 
                  alt="thumbnail" 
                  loading="lazy"
                  className="w-full h-full object-cover" 
                  onError={() => setThumbError(true)}
                />
              ) : (
                // Safe fallback if thumb doesn't exist (no heavy video tag!)
                <div className="w-full h-full bg-brand-50 flex items-center justify-center">
                  <Play size={24} className="text-brand-200" />
                </div>
              )}
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center pl-0.5 shadow-sm">
                  <Play size={16} className="text-brand-600 fill-brand-600" />
                </div>
              </div>
            </>
          ) : (
            <img 
              src={thumbUrl} 
              alt="preview" 
              loading="lazy"
              className="w-full h-full object-cover" 
              onError={(e) => { e.target.src = mediaUrl; }}
            />
          )
        ) : (
          <ImageIcon size={24} className="text-gray-300" />
        )}

        {hasMultiple && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm">
            +{post.paths.length}
          </span>
        )}
      </div>

      {/* Bottom: Info Section */}
      <div className="p-2.5 flex flex-col gap-0.5">
        <h4 className="text-[11px] font-bold text-app-text truncate">
          {displayTitle}
        </h4>
        <div className="text-[9px] font-medium text-app-muted truncate">
          {post.source_url && post.source_url !== 'https://google.com' ? 'Remote' : 'Lokal'} • {isVideo(firstMedia) ? 'MP4' : 'IMG'}
        </div>
      </div>
    </div>
  );
}