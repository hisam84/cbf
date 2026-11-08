'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Eye, Check, Sparkles, Image as ImageIcon, Copy, RefreshCw } from 'lucide-react';
import { drawDonateCardToCanvas, downloadDonateCard, DonateCardData, formatCardDate } from '@/lib/donate-card';

interface DonateCardModalProps {
  donation: {
    donorName: string;
    bloodGroup?: string;
    date: string;
    number: string;
    image?: string | null;
  };
  onClose: () => void;
}

export default function DonateCardModal({ donation, onClose }: DonateCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useBengaliDigits, setUseBengaliDigits] = useState(false);
  const [showDonorInfo, setShowDonorInfo] = useState(false);
  const [isRendering, setIsRendering] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const cardData: DonateCardData = {
    image: donation.image,
    date: donation.date,
    number: donation.number,
    donorName: donation.donorName,
    bloodGroup: donation.bloodGroup,
    showDonorInfo,
    useBengaliDigits,
    orgName: 'চাঁভালি রক্ত ফাউন্ডেশন',
    slogan: 'রক্তের বন্ধনে, চাঁভালি সবখানে',
  };

  const renderCard = async () => {
    if (!canvasRef.current) return;
    setIsRendering(true);
    try {
      await drawDonateCardToCanvas(canvasRef.current, cardData);
    } catch (err) {
      console.error('Failed to render donate card:', err);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    renderCard();
  }, [donation, useBengaliDigits, showDonorInfo]);

  const handleDownload = async (format: 'png' | 'jpeg') => {
    setIsDownloading(true);
    try {
      await downloadDonateCard(cardData, format);
    } catch (err: any) {
      alert('কার্ড ডাউনলোডে ত্রুটি: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        // @ts-ignore
        if (navigator.clipboard && window.ClipboardItem) {
          // @ts-ignore
          const item = new ClipboardItem({ 'image/png': blob });
          // @ts-ignore
          await navigator.clipboard.write([item]);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2500);
        } else {
          alert('ক্লিপবোর্ডে কপি করার সুবিধা এই ব্রাউজারে সমর্থিত নয়। দয়া করে ডাউনলোড করুন।');
        }
      }, 'image/png');
    } catch (err) {
      alert('কপি করা সম্ভব হয়নি।');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                ডোনেশন ফটোকার্ড
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                অফিসিয়াল সোশ্যাল মিডিয়া ও প্রিন্ট টেমপ্লেট (১০৮০ × ১১৮৩)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Canvas Preview Viewport */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#090d16',
            padding: '16px',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '380px',
              aspectRatio: '1080 / 1182.6',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                objectFit: 'contain',
              }}
            />
            {isRendering && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  gap: '8px',
                }}
              >
                <RefreshCw size={18} className="animate-spin" />
                <span>কার্ড প্রস্তুত হচ্ছে...</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Toggles */}
        <div
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Toggle: Bengali vs English Numbers */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={useBengaliDigits}
              onChange={(e) => setUseBengaliDigits(e.target.checked)}
              style={{ accentColor: '#dc2626', cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <span>বাংলা সংখ্যা ({useBengaliDigits ? 'যেমন: ৩৮০০' : 'যেমন: 3800'})</span>
          </label>

          {/* Toggle: Show Donor Name / Blood Group Badge */}
          {donation.donorName && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={showDonorInfo}
                onChange={(e) => setShowDonorInfo(e.target.checked)}
                style={{ accentColor: '#dc2626', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span>রক্তদাতার নাম ও গ্রুপ যুক্ত করুন</span>
            </label>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            background: '#ffffff',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyImage}
              style={{
                padding: '9px 12px',
                borderRadius: '9px',
                background: copySuccess ? '#dcfce7' : '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: copySuccess ? '#15803d' : '#475569',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Copy image to clipboard"
            >
              {copySuccess ? <Check size={14} /> : <Copy size={14} />}
              <span>{copySuccess ? 'কপি হয়েছে' : 'কপি করুন'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload('jpeg')}
              disabled={isDownloading || isRendering}
              style={{
                padding: '9px 12px',
                borderRadius: '9px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Download as JPG"
            >
              <Download size={14} />
              <span>JPG</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '9px',
                background: '#f1f5f9',
                border: 'none',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={() => handleDownload('png')}
              disabled={isDownloading || isRendering}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                background: '#dc2626',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Download size={16} />
              <span>{isDownloading ? 'ডাউনলোড হচ্ছে...' : 'ডাউনলোড ফটোকার্ড (PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

