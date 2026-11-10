import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import AddMedia from './pages/AddMedia';
import Media from './pages/Media';
import Dashboard from './pages/Dashboard';


export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-app-bg pb-24">
        
        <main className="w-full h-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddMedia />} />
            <Route path="/media/:id" element={<Media />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route 
              path="*" 
              element={
                <div className="p-5 flex justify-center items-center min-h-[60vh]">
                  <h3 className="text-xl font-bold text-gray-800">Page Not Found</h3>
                </div>
              } 
            />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}