'use client';

import { useState, useEffect } from 'react';
import { GalleryItem } from '@/lib/types';
import { toBengali } from '@/lib/image-compress';
import { X, Image as ImageIcon, ZoomIn, Calendar, Tag } from 'lucide-react';

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lightboxImg, setLightboxImg] = useState<GalleryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setImages(data.data);
        } else {
          setImages([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching gallery:', err);
        setImages([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Close lightbox on Escape key & manage body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImg(null);
    };
    if (lightboxImg) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxImg]);

  const filteredImages =
    selectedCategory === 'all'
      ? images
      : images.filter((img) => img.category === selectedCategory);

  const donationCount = images.filter((img) => img.category === 'donation').length;
  const generalCount = images.filter((img) => img.category === 'general').length;

  return (
    <section className="section gallery-section" id="gallery">
      <div className="container">
        {/* Section Header */}
        <div className="section-title gallery-title-header">
          <h2>রক্তদান কার্যক্রম ও ফটো গ্যালারি</h2>
          <div className="underline"></div>
          <p>চাঁভালি রক্ত ফাউন্ডেশনের বিভিন্ন রক্তদান ক্যাম্পেইন ও সমাজকল্যাণমূলক কর্মকাণ্ডের চিত্র</p>
        </div>

        {/* CATEGORY FILTER - Touch & Mobile Scroll Friendly */}
        <div className="donor-filters gallery-filters-wrapper">
          <button
            type="button"
            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            সব ছবি ({toBengali(images.length)})
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedCategory === 'donation' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('donation')}
          >
            রক্তদান কার্যক্রম ({toBengali(donationCount)})
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedCategory === 'general' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('general')}
          >
            ক্যাম্পেইন ও সমাবেশ ({toBengali(generalCount)})
          </button>
        </div>

        {/* GALLERY CONTENT */}
        {loading ? (
          <div className="gallery-loading-state">
            <div className="gallery-spinner"></div>
            <p>গ্যালারি লোড হচ্ছে...</p>
          </div>
        ) : filteredImages.length > 0 ? (
          <div className="gallery-grid" id="galleryGrid">
            {filteredImages.map((img, idx) => {
              const imgSrc = img.data || img.imageData;
              const captionText = img.caption || 'চাঁভালি রক্তদান কার্যক্রম';
              const isDonation = img.category === 'donation';

              return (
                <div
                  className="gallery-item"
                  key={img.id || idx}
                  onClick={() => setLightboxImg(img)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxImg(img);
                    }
                  }}
                >
                  {/* Category Pill Tag */}
                  <span className={`gallery-tag ${isDonation ? 'donation' : 'general'}`}>
                    {isDonation ? 'রক্তদান' : 'কার্যক্রম'}
                  </span>

                  {/* Photo with lazy loading */}
                  <img
                    src={imgSrc}
                    alt={captionText}
                    loading="lazy"
                  />

                  {/* Overlay with zoom icon and caption */}
                  <div className="gallery-overlay">
                    <div className="gallery-zoom-icon">
                      <ZoomIn size={20} />
                    </div>
                    <span className="gallery-caption-text">{captionText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="gallery-empty-state">
            <div className="gallery-empty-icon">
              <ImageIcon size={36} />
            </div>
            <h3>এখনও কোনো ছবি পাওয়া যায়নি</h3>
            <p>এই ক্যাটাগরিতে এখনো কোনো ছবি আপলোড করা হয়নি।</p>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                className="filter-btn active"
                onClick={() => setSelectedCategory('all')}
                style={{ marginTop: '12px' }}
              >
                সব ছবি দেখুন
              </button>
            )}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxImg && (
        <div
          className="lightbox active"
          onClick={() => setLightboxImg(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="lightbox-close"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImg(null);
            }}
            type="button"
            aria-label="বন্ধ করুন"
          >
            <X size={22} />
          </button>

          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImg.data || lightboxImg.imageData}
              alt={lightboxImg.caption || 'Enlarged photo'}
              className="lightbox-image"
            />
            {lightboxImg.caption && (
              <div className="lightbox-caption-box">
                <span className="lightbox-tag">
                  {lightboxImg.category === 'donation' ? 'রক্তদান কার্যক্রম' : 'ক্যাম্পেইন ও সমাবেশ'}
                </span>
                <p className="lightbox-caption">{lightboxImg.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
