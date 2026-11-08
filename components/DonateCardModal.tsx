'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Eye, Check, Sparkles, Image as ImageIcon, Copy, RefreshCw, Share2, Send, ExternalLink, MessageSquare, AlertCircle } from 'lucide-react';
import { drawDonateCardToCanvas, downloadDonateCard, DonateCardData, formatCardDate, generateFacebookCaption } from '@/lib/donate-card';
import { FacebookSettings } from '@/lib/types';

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
  const [showDonorInfo, setShowDonorInfo] = useState(true);
  const [isRendering, setIsRendering] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  // Fetch Facebook settings
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

  const cardData: DonateCardData = {
    image: donation.image,
    date: donation.date,
    number: donation.number,
    donorName: showDonorInfo ? donation.donorName : undefined,
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

  // Open Facebook Post Modal with pre-filled caption
  const handleOpenFbModal = () => {
    const caption = generateFacebookCaption(
      fbSettings?.captionTemplate,
      {
        donorName: donation.donorName,
        bloodGroup: donation.bloodGroup,
        date: donation.date,
        number: donation.number,
      },
      useBengaliDigits
    );
    setFbCaption(caption);
    setFbPostResult(null);
    setShowFbModal(true);
  };

  // Execute Graph API post
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

  // 1-Click Smart Group Share: copies caption + image, opens group in new tab
  const handle1ClickGroupShare = async () => {
    const caption = generateFacebookCaption(
      fbSettings?.captionTemplate,
      {
        donorName: donation.donorName,
        bloodGroup: donation.bloodGroup,
        date: donation.date,
        number: donation.number,
      },
      useBengaliDigits
    );

    // 1. Copy text caption to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(caption);
      }
    } catch (e) {
      console.warn('Clipboard writeText fallback:', e);
    }

    // 2. Also copy photocard image to clipboard if supported
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
          {/* Left Buttons: Copy, JPG, Facebook Action */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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

            {/* Facebook Page Auto-Post Button */}
            {(!fbSettings || fbSettings.postingMode === 'both' || fbSettings.postingMode === 'page_api') && (
              <button
                type="button"
                onClick={handleOpenFbModal}
                disabled={isRendering}
                style={{
                  padding: '9px 14px',
                  borderRadius: '9px',
                  background: '#1877f2',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(24, 119, 242, 0.3)',
                  transition: 'background 0.2s',
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
                disabled={isRendering}
                style={{
                  padding: '9px 13px',
                  borderRadius: '9px',
                  background: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                }}
                title="১-ক্লিকে ফটো ও ক্যাপশন কপি করে গ্রুপে শেয়ার করুন"
              >
                <Share2 size={14} />
                <span>গ্রুপে শেয়ার</span>
              </button>
            )}
          </div>

          {/* Right Buttons: Close & PNG Download */}
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

        {/* 1-Click Group Share Success Toast Banner */}
        {groupShareToast && (
          <div
            style={{
              padding: '10px 16px',
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
    </div>
  );
}

