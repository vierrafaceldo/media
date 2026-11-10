import { useState } from 'react';

function ImageScrapper() {
  const [urlInput, setUrlInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [images, setImages] = useState([]);

  const handleExtract = async () => {
    // Clear previous results and set loading state
    setImages([]);
    setStatusMessage('Extracting metadata engine targets... please wait.');

    if (!urlInput.trim()) {
      setStatusMessage('Please enter a URL first.');
      return;
    }

    try {
      // Explicitly point to your Node backend port
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      });

      const data = await response.json();

      if (data.error) {
        setStatusMessage(data.error);
        return;
      }

      setStatusMessage(`Success! Extracted ${data.images.length} image link(s).`);
      setImages(data.images);

    } catch (err) {
      setStatusMessage('Could not establish connection to the backend engine.');
    }
  };

  return (
    <div className="card">
      <h2>IG Image Extractor Showcase</h2>
      <p>Input a public link to extract its direct CDN image URL array.</p>
      
      <div className="input-group">
        <input 
          type="text" 
          placeholder="Paste link here..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        <button onClick={handleExtract}>Extract</button>
      </div>

      {statusMessage && <div className="status-message">{statusMessage}</div>}
      
      <div className="gallery">
  {images.map((imgUrl, index) => (
    <div key={index} className="gallery-item" style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
      {/* 1. Displays the actual Image */}
      <img 
        src={imgUrl} 
        alt={`Extracted content ${index + 1}`} 
        style={{ maxWidth: '100%', height: 'auto', display: 'block', marginBottom: '10px' }}
      />
      
      {/* 2. Displays the URL text as a clickable link */}
      <div className="url-container" style={{ wordBreak: 'break-all' }}>
        <a href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', fontSize: '14px' }}>
          {imgUrl}
        </a>
      </div>
    </div>
  ))}
</div>
    </div>
  );
}

export default ImageScrapper;