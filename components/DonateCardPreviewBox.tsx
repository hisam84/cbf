'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, Check, RefreshCw, Upload, Sparkles, Image as ImageIcon, Send, Share2, ExternalLink, AlertCircle, X } from 'lucide-react';
import { drawDonateCardToCanvas, downloadDonateCard, DonateCardData, generateFacebookCaption } from '@/lib/donate-card';
import { FacebookSettings } from '@/lib/types';

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
  const [showDonorInfo, setShowDonorInfo] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fullData: DonateCardData = {
    ...cardData,
    donorName: showDonorInfo ? cardData.donorName : undefined,
    useBengaliDigits,
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

  // Facebook Integration States
  const [fbSettings, setFbSettings] = useState<FacebookSettings | null>(null);
  const [showFbModal, setShowFbModal] = useState(false);
  const [fbCaption, setFbCaption] = useState('');
  const [isPostingFb, setIsPostingFb] = useState(false);
  const [fbPostResult, setFbPostResult] = useState<{
    success: boolean;
    message: string;
    postId?: string;
    postUrl?: string;
    groupUrl?: string;
    error?: string;
  } | null>(null);
  const [groupShareToast, setGroupShareToast] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('cbf_admin_token') : null;
        const res = await fetch('/api/settings/facebook', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.success && json.data) {
          setFbSettings(json.data);
        }
      } catch (err) {
        console.warn('Failed to fetch FB settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleOpenFbModal = () => {
    const caption = generateFacebookCaption(
      fbSettings?.captionTemplate,
      {
        donorName: cardData.donorName,
        bloodGroup: cardData.bloodGroup,
        date: cardData.date,
        number: cardData.number,
      },
      useBengaliDigits
    );
    setFbCaption(caption);
    setFbPostResult(null);
    setShowFbModal(true);
  };

  const handlePostToFacebook = async () => {
    if (!canvasRef.current) return;
    setIsPostingFb(true);
    setFbPostResult(null);

    try {
      const imageData = canvasRef.current.toDataURL('image/png');
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('cbf_admin_token') : null;

      const res = await fetch('/api/facebook/post-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          image: imageData,
          caption: fbCaption,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFbPostResult({
          success: true,
          message: data.message || 'ফেসবুক পেজে ফটোকার্ড পোস্ট সফল হয়েছে!',
          postId: data.data?.postId,
          postUrl: data.data?.postUrl,
          groupUrl: data.data?.groupUrl || fbSettings?.groupUrl,
        });
      } else {
        setFbPostResult({
          success: false,
          message: data.message || 'ফেসবুকে পোস্ট ব্যর্থ হয়েছে।',
          error: data.error,
        });
      }
    } catch (err: any) {
      setFbPostResult({
        success: false,
        message: 'সার্ভারে কানেক্ট করা সম্ভব হয়নি: ' + err.message,
      });
    } finally {
      setIsPostingFb(false);
    }
  };

  const handle1ClickGroupShare = async () => {
    const caption = generateFacebookCaption(
      fbSettings?.captionTemplate,
      {
        donorName: cardData.donorName,
        bloodGroup: cardData.bloodGroup,
        date: cardData.date,
        number: cardData.number,
      },
      useBengaliDigits
    );

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(caption);
      }
    } catch (e) {
      console.warn('Clipboard writeText fallback:', e);
    }

    if (canvasRef.current) {
      try {
        canvasRef.current.toBlob(async (blob) => {
          // @ts-ignore
          if (blob && navigator.clipboard && window.ClipboardItem) {
            try {
              // @ts-ignore
              const item = new ClipboardItem({ 'image/png': blob });
              // @ts-ignore
              await navigator.clipboard.write([item]);
            } catch (err) {
              console.warn('Clipboard image write:', err);
            }
          }
        }, 'image/png');
      } catch (e) {}
    }

    setGroupShareToast(true);
    setTimeout(() => setGroupShareToast(false), 4500);

    const targetUrl = fbSettings?.groupUrl || 'https://www.facebook.com/groups/chavalibloodfoundation';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
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

        {/* Facebook Page Auto-Post Button */}
        {(!fbSettings || fbSettings.postingMode === 'both' || fbSettings.postingMode === 'page_api') && (
          <button
            type="button"
            onClick={handleOpenFbModal}
            disabled={!cardData.image || isRendering}
            style={{
              padding: '11px 14px',
              borderRadius: '10px',
              background: cardData.image ? '#1877f2' : '#cbd5e1',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: cardData.image ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: cardData.image ? '0 2px 8px rgba(24, 119, 242, 0.3)' : 'none',
            }}
            title="ফেসবুক পেজে পোস্ট করুন"
          >
            <Send size={14} />
            <span>ফেসবুকে পোস্ট</span>
          </button>
        )}

        {/* 1-Click Facebook Group Share Button */}
        {(!fbSettings || fbSettings.postingMode === 'both' || fbSettings.postingMode === 'group_share') && (
          <button
            type="button"
            onClick={handle1ClickGroupShare}
            disabled={!cardData.image || isRendering}
            style={{
              padding: '11px 14px',
              borderRadius: '10px',
              background: cardData.image ? '#0284c7' : '#cbd5e1',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: cardData.image ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: cardData.image ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
            }}
            title="১-ক্লিকে ফটো ও ক্যাপশন কপি করে গ্রুপে শেয়ার করুন"
          >
            <Share2 size={14} />
            <span>গ্রুপে শেয়ার</span>
          </button>
        )}
      </div>

      {/* 1-Click Group Share Success Toast Banner */}
      {groupShareToast && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: '#0284c7',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>✅ ফটোকার্ড ও ক্যাপশন ক্লিপবোর্ডে কপি হয়েছে! ফেসবুক গ্রুপে Ctrl+V দিয়ে পেস্ট করুন।</span>
          <button
            onClick={() => setGroupShareToast(false)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Facebook Caption & Post Dialog Overlay */}
      {showFbModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100000,
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
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* FB Modal Header */}
            <div
              style={{
                padding: '14px 18px',
                background: '#1877f2',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>ফেসবুক পেজে অটো-পোস্ট (ক্যাপশন সহ)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFbModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  color: '#ffffff',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* FB Modal Content */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {fbPostResult?.success ? (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                    }}
                  >
                    <Check size={24} />
                  </div>
                  <h4 style={{ margin: '0 0 4px', color: '#166534', fontWeight: 800, fontSize: '1.05rem' }}>
                    সফলভাবে পোস্ট করা হয়েছে!
                  </h4>
                  <p style={{ margin: '0 0 14px', color: '#15803d', fontSize: '0.84rem' }}>
                    {fbPostResult.message}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {fbPostResult.postUrl && (
                      <a
                        href={fbPostResult.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#1877f2',
                          color: '#ffffff',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={14} />
                        <span>ফেসবুক পোস্টটি দেখুন</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={handle1ClickGroupShare}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#0284c7',
                        color: '#ffffff',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Share2 size={14} />
                      <span>ফেসবুক গ্রুপে শেয়ার করুন</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {fbPostResult?.error && (
                    <div
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: '#991b1b',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>পোস্ট ব্যর্থ হয়েছে:</strong> {fbPostResult.message}
                        <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#b91c1c' }}>
                          (টিপস: এডমিন সেটিংস থেকে আপনার Facebook Page ID এবং Page Access Token সঠিক আছে কিনা যাচাই করুন)
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                        পোস্ট ক্যাপশন (প্রয়োজনে এডিট করুন):
                      </label>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {fbCaption.length} অক্ষর
                      </span>
                    </div>
                    <textarea
                      value={fbCaption}
                      onChange={(e) => setFbCaption(e.target.value)}
                      rows={7}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        lineHeight: '1.5',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      placeholder="ফেসবুক ক্যাপশন লিখুন..."
                    />
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b', lineHeight: 1.4 }}>
                      💡 <strong>নোট:</strong> ফটোকার্ডটি মেটা Graph API দিয়ে সরাসরি চাঁভালি রক্ত ফাউন্ডেশন ফেসবুক পেজে পাবলিশ হবে। পোস্ট সম্পন্ন হলে আপনি সাথে সাথে গ্রুপে শেয়ার করার বাটন পাবেন।
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* FB Modal Footer */}
            <div
              style={{
                padding: '12px 18px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setShowFbModal(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {fbPostResult?.success ? 'বন্ধ করুন' : 'বাতিল'}
              </button>

              {!fbPostResult?.success && (
                <button
                  type="button"
                  onClick={handlePostToFacebook}
                  disabled={isPostingFb}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#1877f2',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(24, 119, 242, 0.35)',
                    opacity: isPostingFb ? 0.7 : 1,
                  }}
                >
                  {isPostingFb ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>ফেসবুকে আপলোড হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>কনফার্ম ও পেজে পোস্ট করুন</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

