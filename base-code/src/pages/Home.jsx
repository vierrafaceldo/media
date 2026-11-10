import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import MediaCard from '../components/MediaCard';
import Filters from '../components/Filters';
import { databaseService } from '../services/database';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24; 
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ 
    searchQuery: '', sortBy: 'latest', categories: [], tags: [] 
  });

  useEffect(() => setCurrentPage(1), [filters]);

  useEffect(() => {
    databaseService.getAllPosts()
      .then((data) => setPosts(data))
      .catch((err) => console.error('Error fetching posts:', err));
  }, []);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  let processedPosts = [...posts];

  if (filters.searchQuery?.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    processedPosts = processedPosts.filter(post => 
      post.title?.toLowerCase().includes(query) || post.caption?.toLowerCase().includes(query)
    );
  }

  if (filters.categories?.length) {
    processedPosts = processedPosts.filter(post => filters.categories.every(cat => post.categories?.includes(cat)));
  }

  if (filters.sortBy === 'latest') processedPosts.sort((a, b) => b.id.localeCompare(a.id));
  else if (filters.sortBy === 'oldest') processedPosts.sort((a, b) => a.id.localeCompare(b.id));
  else if (filters.sortBy === 'alpha-asc') processedPosts.sort((a, b) => (a.title || a.id).localeCompare(b.title || b.id));
  else if (filters.sortBy === 'alpha-desc') processedPosts.sort((a, b) => (b.title || b.id).localeCompare(a.title || a.id));

  const indexOfLastItem = currentPage * itemsPerPage;
  const currentPosts = processedPosts.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);

  return (
    <div className="px-4 pt-4 pb-24 max-w-[480px] mx-auto min-h-screen bg-stone-50 md:bg-white">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[14px] font-bold text-gray-900">Galeri ({processedPosts.length})</h3>
      </div>

      <Filters onFilterChange={setFilters} />

      {processedPosts.length === 0 ? (
        <div className="p-8 mt-4 bg-white rounded-2xl text-center border border-gray-100 shadow-soft">
          <p className="text-xs font-medium text-gray-500">Tidak ada media yang ditemukan.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {currentPosts.map((post) => (
              <MediaCard key={post.id} post={post} onClick={() => navigate(`/media/${post.id}`)} />
            ))}
          </div>
          {processedPosts.length > itemsPerPage && (
            <div className="mt-6 flex justify-center">
              <Pagination currentPage={currentPage} totalItems={processedPosts.length} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />
            </div>
          )}
        </>
      )}
    </div>
  );
}