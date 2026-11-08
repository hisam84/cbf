'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, Check, RefreshCw, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import { drawDonateCardToCanvas, downloadDonateCard, DonateCardData } from '@/lib/donate-card';

interface DonateCardPreviewBoxProps {
  cardData: DonateCardData;
  onUploadPhotoClick?: () => void;
  title?: string;
  subtitle?: string;
  height?: string;
}

export default function DonateCardPreviewBox({
  cardData,
  onUploadPhotoClick,
  title = 'ফটোকার্ড প্রিভিউ (Live Card Preview)',
  subtitle = 'ডোনেশন তথ্যের সাথে সাথে লাইভ আপডেট হয়',
}: DonateCardPreviewBoxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useBengaliDigits, setUseBengaliDigits] = useState(false);
  const [showDonorInfo, setShowDonorInfo] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fullData: DonateCardData = {
    ...cardData,
    useBengaliDigits,
    showDonorInfo,
    orgName: 'চাঁভালি রক্ত ফাউন্ডেশন',
    slogan: 'রক্তের বন্ধনে, চাঁভালি সবখানে',
  };

  const renderCanvas = async () => {
    if (!canvasRef.current) return;
    setIsRendering(true);
    try {
      await drawDonateCardToCanvas(canvasRef.current, fullData);
    } catch (err) {
      console.error('Error rendering live card preview:', err);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [
    cardData.image,
    cardData.date,
    cardData.number,
    cardData.donorName,
    cardData.bloodGroup,
    useBengaliDigits,
    showDonorInfo,
  ]);

  const handleDownload = async (format: 'png' | 'jpeg') => {
    setIsDownloading(true);
    try {
      await downloadDonateCard(fullData, format);
    } catch (err: any) {
      alert('ডাউনলোড ত্রুটি: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
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
          setTimeout(() => setCopySuccess(false), 2200);
        } else {
          alert('ক্লিপবোর্ডে কপি সুবিধা এই ব্রাউজারে নেই। ডাউনলোড বাটন ব্যবহার করুন।');
        }
      }, 'image/png');
    } catch {
      alert('কপি করা সম্ভব হয়নি।');
    }
  };

  return (
    <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: 800 }}>
            {title}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
            {subtitle}
          </p>
        </div>
        <span
          style={{
            background: '#fee2e2',
            color: '#dc2626',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid #fecaca',
          }}
        >
          ১০৮০ × ১১৮৩ PX
        </span>
      </div>

      {/* Canvas Viewport */}
      <div
        style={{
          background: '#090d16',
          borderRadius: '14px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '360px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '340px',
            aspectRatio: '1080 / 1182.6',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
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
                background: 'rgba(15, 23, 42, 0.55)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                gap: '6px',
              }}
            >
              <RefreshCw size={16} className="animate-spin" />
              <span>আপডেট হচ্ছে...</span>
            </div>
          )}

          {!cardData.image && onUploadPhotoClick && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15, 23, 42, 0.65)',
                padding: '16px',
                textAlign: 'center',
                backdropFilter: 'blur(2px)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  marginBottom: '10px',
                }}
              >
                <ImageIcon size={24} />
              </div>
              <p style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 4px' }}>
                রক্তদানের ছবি যুক্ত করুন
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.74rem', margin: '0 0 14px' }}>
                ছবি যুক্ত করলে পুরো ফটোকার্ড প্রস্তুত হয়ে যাবে
              </p>
              <button
                type="button"
                onClick={onUploadPhotoClick}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 10px rgba(220, 38, 38, 0.35)',
                }}
              >
                <Upload size={14} />
                <span>ছবি আপলোড ও ক্রপ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div
        style={{
          marginTop: '14px',
          padding: '10px 12px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
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
            style={{ accentColor: '#dc2626', cursor: 'pointer', width: '15px', height: '15px' }}
          />
          <span>বাংলা সংখ্যা ({useBengaliDigits ? 'যেমন: ৩৮০০' : 'যেমন: 3800'})</span>
        </label>

        {cardData.donorName && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
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
              style={{ accentColor: '#dc2626', cursor: 'pointer', width: '15px', height: '15px' }}
            />
            <span>রক্তদাতার নাম ব্যাজ</span>
          </label>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => handleDownload('png')}
          disabled={isDownloading || isRendering || !cardData.image}
          style={{
            flex: '1 1 140px',
            padding: '11px 14px',
            background: cardData.image ? '#dc2626' : '#cbd5e1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: cardData.image ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: cardData.image ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none',
          }}
          title="Download 1080x1183 PNG Photo Card"
        >
          <Download size={15} />
          <span>{isDownloading ? 'ডাউনলোড হচ্ছে...' : 'ডাউনলোড ফটোকার্ড (PNG)'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleDownload('jpeg')}
          disabled={isDownloading || isRendering || !cardData.image}
          style={{
            padding: '11px 14px',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            color: '#334155',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: cardData.image ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Download JPG for social media"
        >
          <Download size={14} />
          <span>JPG</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!cardData.image}
          style={{
            padding: '11px 12px',
            background: copySuccess ? '#dcfce7' : '#f1f5f9',
            border: `1px solid ${copySuccess ? '#86efac' : '#cbd5e1'}`,
            color: copySuccess ? '#15803d' : '#334155',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: cardData.image ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Copy image to clipboard"
        >
          {copySuccess ? <Check size={14} /> : <Copy size={14} />}
          <span>{copySuccess ? 'কপি হয়েছে' : 'কপি'}</span>
        </button>
      </div>
    </div>
  );
}
