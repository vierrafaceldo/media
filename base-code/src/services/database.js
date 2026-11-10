// src/services/database.js
// Removed all .env dependencies!

export const databaseService = {
  getAllPosts: async () => {
    // Just use the relative path
    const response = await fetch(`/api/posts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }
    return response.json();
  },

  getMediaUrl: (path) => {
    if (!path) return '';
    return `/${path}`; 
  },

  scrapeUrl: async (targetUrl) => {
    const response = await fetch(`/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl })
    });
    return response;
  },

  saveLocalPost: async (formData) => {
    const response = await fetch(`/api/posts`, {
      method: 'POST',
      body: formData
    });
    return response;
  },

  saveRemotePost: async (endpointPath, payload) => {
    const response = await fetch(endpointPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response;
  }
};