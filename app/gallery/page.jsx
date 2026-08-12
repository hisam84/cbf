'use client';

import { useState, useEffect } from 'react';

export default function GalleryPage() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lightboxImg, setLightboxImg] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetch('/api/gallery')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    setImages(data.data);
                } else {
                    setImages([]);
                }
            })
            .catch(err => {
                console.error('Error fetching gallery:', err);
                setImages([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const filteredImages = selectedCategory === 'all' 
        ? images 
        : images.filter(img => img.category === selectedCategory);

    return (
        <section className="section" id="gallery" style={{ paddingTop: '40px' }}>
            <div className="container">
                <div className="section-title">
                    <h2>রক্তদান কার্যক্রম ও ফটো গ্যালারি</h2>
                    <div className="underline"></div>
                    <p>চাঁভালি রক্ত ফাউন্ডেশনের বিভিন্ন রক্তদান ক্যাম্পেইন ও সমাজকল্যাণমূলক কর্মকাণ্ডের চিত্র</p>
                </div>

                {/* CATEGORY FILTER */}
                <div className="donor-filters" style={{ marginBottom: '30px' }}>
                    <button 
                        className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        সব ছবি ({images.length})
                    </button>
                    <button 
                        className={`filter-btn ${selectedCategory === 'donation' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('donation')}
                    >
                        রক্তদান কার্যক্রম
                    </button>
                    <button 
                        className={`filter-btn ${selectedCategory === 'general' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('general')}
                    >
                        ক্যাম্পেইন ও সমাবেশ
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <p style={{ fontSize: '1.2rem', color: '#DC2626' }}>⏳ গ্যালারি লোড হচ্ছে...</p>
                    </div>
                ) : filteredImages.length > 0 ? (
                    <div className="gallery-grid" id="galleryGrid">
                        {filteredImages.map((img, idx) => (
                            <div 
                                className="gallery-item" 
                                key={img.id || idx}
                                onClick={() => setLightboxImg(img.data || img.image_data)}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src={img.data || img.image_data} alt={img.caption || 'Chavali Blood Activity'} />
                                <div className="gallery-overlay">
                                    <span>{img.caption || 'চাঁভালি রক্তদান কার্যক্রম'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
                        <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>এখনও কোনো ছবি আপলোড করা হয়নি।</p>
                    </div>
                )}
            </div>

            {/* LIGHTBOX */}
            {lightboxImg && (
                <div className="lightbox active" onClick={() => setLightboxImg(null)}>
                    <button className="lightbox-close" onClick={() => setLightboxImg(null)}>✕</button>
                    <img src={lightboxImg} alt="Enlarged gallery photo" />
                </div>
            )}
        </section>
    );
}
