'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ValidBloodGroup, VALID_BLOOD_GROUPS } from '@/lib/types';
import { BLOOD_COMPATIBILITY_MAP } from '@/lib/validators';
import { Droplet, ArrowUpRight, ArrowDownLeft, Info, ArrowRight } from 'lucide-react';

interface Props {
  initialGroup?: ValidBloodGroup;
}

export default function BloodCompatibilityMatrix({ initialGroup = 'O+' }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<ValidBloodGroup>(initialGroup);
  const info = BLOOD_COMPATIBILITY_MAP[selectedGroup];

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '30px 24px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(220, 38, 38, 0.15)',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          <Droplet size={14} fill="currentColor" />
          ইন্টারেক্টিভ রক্তদান নির্দেশিকা
        </span>
        <h3 style={{ fontSize: '1.5rem', color: '#1f2937', fontWeight: 800 }}>
          রক্তের গ্রুপ ও গ্রহণ-দানের সামঞ্জস্যতা
        </h3>
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
          একটি রক্তের গ্রুপ নির্বাচন করুন এবং তাৎক্ষণিকভাবে দেখুন কারা রক্ত দিতে ও গ্রহণ করতে পারবে
        </p>
      </div>

      {/* Group Selector Buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '28px',
        }}
      >
        {VALID_BLOOD_GROUPS.map((bg) => {
          const isSelected = selectedGroup === bg;
          return (
            <button
              key={bg}
              type="button"
              onClick={() => setSelectedGroup(bg)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: isSelected ? '2px solid #DC2626' : '1px solid #e5e7eb',
                background: isSelected ? '#DC2626' : '#f9fafb',
                color: isSelected ? '#ffffff' : '#374151',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(220,38,38,0.3)' : 'none',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {bg}
            </button>
          );
        })}
      </div>

      {/* Compatibility Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Can Give To */}
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
              color: '#166534',
            }}
          >
            <ArrowUpRight size={20} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              <strong style={{ color: '#DC2626' }}>{selectedGroup}</strong> রক্ত দিতে পারবে:
            </h4>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {info.canGiveTo.map((target) => (
              <span
                key={target}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 14px',
                  background: '#22c55e',
                  color: '#ffffff',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                {target}
              </span>
            ))}
          </div>
        </div>

        {/* Can Receive From */}
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
              color: '#1e40af',
            }}
          >
            <ArrowDownLeft size={20} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              <strong style={{ color: '#DC2626' }}>{selectedGroup}</strong> রক্ত গ্রহণ করতে পারবে:
            </h4>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {info.canReceiveFrom.map((source) => (
              <span
                key={source}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 14px',
                  background: '#3b82f6',
                  color: '#ffffff',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Description & Action */}
      <div
        style={{
          background: '#fef2f2',
          borderLeft: '4px solid #DC2626',
          padding: '16px 20px',
          borderRadius: '0 12px 12px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="#991b1b" />
          <p style={{ margin: 0, color: '#991b1b', fontWeight: 600, fontSize: '0.95rem' }}>
            {info.description}
          </p>
        </div>
        <Link
          href={`/donors?bloodGroup=${encodeURIComponent(selectedGroup)}`}
          style={{
            background: '#DC2626',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(220,38,38,0.3)',
          }}
        >
          {selectedGroup} রক্তদাতা খুঁজুন <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
