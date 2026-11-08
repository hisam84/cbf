'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, X, Eye, EyeOff } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  onCrop: (croppedDataUrl: string) => void;
  onClose: () => void;
  aspectRatio?: number; // width / height, defaults to 1080 / 1182.6 = 0.91324
  sampleDate?: string;
  sampleNumber?: string;
  sampleDonorName?: string;
  sampleBloodGroup?: string;
}

export default function ImageCropModal({
  imageSrc,
  onCrop,
  onClose,
  aspectRatio = 1080 / 1182.6,
  sampleDate = new Date().toISOString().split('T')[0],
  sampleNumber = '3800',
  sampleDonorName,
  sampleBloodGroup,
}: ImageCropModalProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [showOverlay, setShowOverlay] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Load natural image dimensions
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementRef.current = img;
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Pointer / Mouse / Touch Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
    setScale((prev) => Math.min(3.5, Math.max(0.6, prev + zoomFactor)));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Perform Crop & Export
  const handleApplyCrop = useCallback(async () => {
    if (!imageElementRef.current) return;
    setIsProcessing(true);

    try {
      const TARGET_W = 1080;
      const TARGET_H = 1183;
      const canvas = document.createElement('canvas');
      canvas.width = TARGET_W;
      canvas.height = TARGET_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas 2d context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Dimensions of the UI crop container
      const container = containerRef.current;
      const frameW = container ? container.clientWidth : 360;
      const frameH = container ? container.clientHeight : 394;

      const img = imageElementRef.current;
      const isRotated90 = rotation === 90 || rotation === 270;
      const effImgW = isRotated90 ? img.naturalHeight : img.naturalWidth;
      const effImgH = isRotated90 ? img.naturalWidth : img.naturalHeight;

      // Base scale in UI: cover the frame
      const baseFitScale = Math.max(frameW / effImgW, frameH / effImgH);
      const mult = TARGET_W / frameW;

      ctx.save();
      // Translate to canvas center
      ctx.translate(TARGET_W / 2, TARGET_H / 2);
      // Apply user pan scaled to output canvas resolution
      ctx.translate(pan.x * mult, pan.y * mult);
      // Rotate
      ctx.rotate((rotation * Math.PI) / 180);
      // Scale
      const finalScale = baseFitScale * scale * mult;
      ctx.drawImage(
        img,
        (-img.naturalWidth / 2) * finalScale,
        (-img.naturalHeight / 2) * finalScale,
        img.naturalWidth * finalScale,
        img.naturalHeight * finalScale
      );
      ctx.restore();

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCrop(croppedUrl);
      onClose();
    } catch (err: any) {
      alert('Error cropping image: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [pan, scale, rotation, onCrop, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(6px)',
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
          borderRadius: '18px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
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
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              ডোনেশন ছবি ক্রপ ও এডজাস্ট করুন
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              মাউস বা হাত দিয়ে টেনে ছবি সরান ও জুম করে ফ্রেমের সাথে মিলান
            </p>
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

        {/* Crop Viewport */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#090d16',
            padding: '14px',
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px',
              aspectRatio: `${aspectRatio}`,
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: isDraggingRef.current ? 'grabbing' : 'grab',
              boxShadow: '0 0 0 2px rgba(220, 38, 38, 0.7), 0 10px 25px rgba(0,0,0,0.5)',
              touchAction: 'none',
            }}
          >
            {/* Background Image with transformations */}
            {naturalSize.width > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isDraggingRef.current ? 'none' : 'transform 0.05s ease-out',
                  pointerEvents: 'none',
                }}
              >
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    maxWidth: 'none',
                    maxHeight: 'none',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            {/* Template Overlay Preview (Shows ribbons and bottom banner) */}
            {showOverlay && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* Top Header Overlay: Logo Circle & Blood Group Badge */}
                <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: '3px',
                      border: '2px solid rgba(220, 38, 38, 0.4)',
                    }}
                  >
                    <img
                      src="/donate-card-logo.png"
                      alt="Logo"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div
                    style={{
                      background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.4)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>🩸 {sampleBloodGroup || 'O+'}</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.9 }}>স্বেচ্ছায় রক্তদান</span>
                  </div>
                </div>

                {/* Middle Ribbons (Donor Name, Date & Serial) */}
                <div style={{ marginTop: 'auto', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Donor Name ribbon (if provided) */}
                  {sampleDonorName && (
                    <div
                      style={{
                        background: 'linear-gradient(90deg, #7F1D1D 0%, rgba(153,27,27,0.92) 50%, rgba(255,255,255,0) 100%)',
                        color: '#ffffff',
                        padding: '3px 12px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        width: 'fit-content',
                        minWidth: '170px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.7)',
                        borderTop: '1px solid rgba(255,255,255,0.25)',
                      }}
                    >
                      রক্তদাতা: {sampleDonorName}
                    </div>
                  )}
                  {/* Date ribbon */}
                  <div
                    style={{
                      background: 'linear-gradient(90deg, #A51E22 0%, rgba(165,32,35,0.9) 40%, rgba(255,255,255,0) 100%)',
                      color: '#ffffff',
                      padding: '3px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      width: 'fit-content',
                      minWidth: '150px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    তারিখ: {sampleDate}
                  </div>
                  {/* No ribbon */}
                  <div
                    style={{
                      background: 'linear-gradient(90deg, #009444 0%, rgba(0,148,69,0.9) 40%, rgba(255,255,255,0) 100%)',
                      color: '#ffffff',
                      padding: '3px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      width: 'fit-content',
                      minWidth: '150px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    ডোনেট নং: {sampleNumber}
                  </div>
                </div>

                {/* Bottom Banner */}
                <div
                  style={{
                    background: '#009444',
                    paddingTop: '2px',
                  }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(90deg, #A4181C 0%, #ED1C24 50%, #A4181C 100%)',
                      padding: '8px 4px 6px',
                      textAlign: 'center',
                      color: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 900,
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                      }}
                    >
                      চাঁভালি রক্ত ফাউন্ডেশন
                    </div>
                    <div
                      style={{
                        height: '1px',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.4), transparent, rgba(255,255,255,0.4))',
                        margin: '3px auto',
                        width: '75%',
                      }}
                    />
                    <div
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        opacity: 0.95,
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      রক্তের বন্ধনে, চাঁভালি সবখানে
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subtle Grid / Rule of Thirds Guide (Only when overlay is OFF) */}
            {!showOverlay && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gridTemplateRows: '1fr 1fr 1fr',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.2)', borderBottom: '1px dashed rgba(255, 255, 255, 0.2)' }} />
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.2)', borderBottom: '1px dashed rgba(255, 255, 255, 0.2)' }} />
                <div style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.2)' }} />
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.2)', borderBottom: '1px dashed rgba(255, 255, 255, 0.2)' }} />
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.2)', borderBottom: '1px dashed rgba(255, 255, 255, 0.2)' }} />
                <div style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.2)' }} />
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.2)' }} />
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.2)' }} />
                <div />
              </div>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div
          style={{
            padding: '12px 18px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Zoom & Adjustment Sliders */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', minWidth: '40px' }}>
              জুম:
            </span>
            <button
              onClick={() => setScale((p) => Math.max(0.6, p - 0.15))}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '5px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Zoom Out"
            >
              <ZoomOut size={15} color="#475569" />
            </button>
            <input
              type="range"
              min="0.6"
              max="3.0"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{
                flex: 1,
                minWidth: '100px',
                accentColor: '#dc2626',
                cursor: 'pointer',
              }}
            />
            <button
              onClick={() => setScale((p) => Math.min(3.0, p + 0.15))}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '5px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Zoom In"
            >
              <ZoomIn size={15} color="#475569" />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', minWidth: '38px', textAlign: 'right' }}>
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Quick Buttons: Rotate, Reset, Toggle Template Overlay */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleRotate}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <RotateCw size={13} />
                <span>ঘোরান (90°)</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <RefreshCw size={13} />
                <span>রিসেট</span>
              </button>
            </div>

            {/* Template Overlay Button */}
            <button
              type="button"
              onClick={() => setShowOverlay(!showOverlay)}
              style={{
                background: showOverlay ? '#fee2e2' : '#ffffff',
                color: showOverlay ? '#991b1b' : '#475569',
                border: `1px solid ${showOverlay ? '#fca5a5' : '#cbd5e1'}`,
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {showOverlay ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{showOverlay ? 'কার্ড প্রিভিউ অন' : 'কার্ড প্রিভিউ অফ'}</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            background: '#ffffff',
          }}
        >
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
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            style={{
              padding: '9px 20px',
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
            <Check size={16} />
            <span>{isProcessing ? 'ক্রপ হচ্ছে...' : 'ক্রপ সম্পন্ন করুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

