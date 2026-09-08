'use client';

import React, { useState, useEffect } from 'react';
import { X, Ruler, HelpCircle, Check, Sparkles } from 'lucide-react';

export function openSizeGuide(category?: string, department?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('styluxe_open_size_guide', {
      detail: { category, department }
    }));
  }
}

export function SizeGuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'apparel' | 'jeans' | 'shoes'>('apparel');
  const [gender, setGender] = useState<'women' | 'men'>('women');
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');

  useEffect(() => {
    const handleOpen = (e: any) => {
      const detail = e.detail || {};
      if (detail.category) {
        const cat = detail.category.toLowerCase();
        if (cat.includes('shoe') || cat.includes('foot') || cat.includes('sneaker') || cat.includes('boot')) {
          setActiveTab('shoes');
        } else if (cat.includes('jean') || cat.includes('pant') || cat.includes('denim') || cat.includes('trouser')) {
          setActiveTab('jeans');
        } else {
          setActiveTab('apparel');
        }
      }
      if (detail.department) {
        if (detail.department === 'men') setGender('men');
        if (detail.department === 'women') setGender('women');
      }
      setIsOpen(true);
    };

    window.addEventListener('styluxe_open_size_guide', handleOpen);
    return () => window.removeEventListener('styluxe_open_size_guide', handleOpen);
  }, []);

  // Keyboard shortcut listener: ESC to close size guide modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  // Data for tables
  const apparelWomen = [
    { size: 'XXS', it: '36', fr: '32', uk: '4', us: '0', bustCm: '76-80', waistCm: '58-61', hipsCm: '84-87', bustIn: '30-31.5', waistIn: '23-24', hipsIn: '33-34' },
    { size: 'XS', it: '38', fr: '34', uk: '6', us: '2', bustCm: '80-84', waistCm: '62-65', hipsCm: '88-91', bustIn: '31.5-33', waistIn: '24.5-25.5', hipsIn: '34.5-36' },
    { size: 'S', it: '40', fr: '36', uk: '8', us: '4', bustCm: '84-88', waistCm: '66-69', hipsCm: '92-95', bustIn: '33-34.5', waistIn: '26-27', hipsIn: '36-37.5' },
    { size: 'M', it: '42', fr: '38', uk: '10', us: '6', bustCm: '88-92', waistCm: '70-73', hipsCm: '96-99', bustIn: '34.5-36', waistIn: '27.5-29', hipsIn: '38-39' },
    { size: 'L', it: '44', fr: '40', uk: '12', us: '8', bustCm: '92-96', waistCm: '74-78', hipsCm: '100-104', bustIn: '36-38', waistIn: '29-31', hipsIn: '39.5-41' },
    { size: 'XL', it: '46', fr: '42', uk: '14', us: '10', bustCm: '96-102', waistCm: '79-84', hipsCm: '105-110', bustIn: '38-40', waistIn: '31-33', hipsIn: '41.5-43.5' },
    { size: 'XXL', it: '48', fr: '44', uk: '16', us: '12', bustCm: '102-108', waistCm: '85-92', hipsCm: '111-118', bustIn: '40-42.5', waistIn: '33.5-36', hipsIn: '44-46.5' }
  ];

  const apparelMen = [
    { size: 'XS', it: '44', fr: '44', uk: '34', us: '34', chestCm: '86-90', waistCm: '72-76', hipsCm: '88-92', chestIn: '34-35.5', waistIn: '28-30', hipsIn: '34.5-36' },
    { size: 'S', it: '46', fr: '46', uk: '36', us: '36', chestCm: '90-94', waistCm: '76-80', hipsCm: '92-96', chestIn: '35.5-37', waistIn: '30-31.5', hipsIn: '36-38' },
    { size: 'M', it: '48', fr: '48', uk: '38', us: '38', chestCm: '94-98', waistCm: '80-84', hipsCm: '96-100', chestIn: '37-38.5', waistIn: '31.5-33', hipsIn: '38-39.5' },
    { size: 'L', it: '50', fr: '50', uk: '40', us: '40', chestCm: '98-104', waistCm: '84-90', hipsCm: '100-106', chestIn: '38.5-41', waistIn: '33-35.5', hipsIn: '39.5-41.5' },
    { size: 'XL', it: '52', fr: '52', uk: '42', us: '42', chestCm: '104-110', waistCm: '90-96', hipsCm: '106-112', chestIn: '41-43.5', waistIn: '35.5-38', hipsIn: '42-44' },
    { size: 'XXL', it: '54', fr: '54', uk: '44', us: '44', chestCm: '110-116', waistCm: '96-102', hipsCm: '112-118', chestIn: '43.5-45.5', waistIn: '38-40', hipsIn: '44-46.5' },
    { size: '3XL', it: '56', fr: '56', uk: '46', us: '46', chestCm: '116-124', waistCm: '102-110', hipsCm: '118-126', chestIn: '45.5-49', waistIn: '40-43', hipsIn: '46.5-49.5' }
  ];

  const jeansData = [
    { waist: 'W28', eu: '44', waistCm: '71-73', hipsCm: '86-89', waistIn: '28-29', hipsIn: '34-35' },
    { waist: 'W29', eu: '45', waistCm: '74-76', hipsCm: '89-91', waistIn: '29-30', hipsIn: '35-36' },
    { waist: 'W30', eu: '46', waistCm: '76-78', hipsCm: '91-94', waistIn: '30-31', hipsIn: '36-37' },
    { waist: 'W31', eu: '47', waistCm: '79-81', hipsCm: '94-97', waistIn: '31-32', hipsIn: '37-38' },
    { waist: 'W32', eu: '48', waistCm: '81-84', hipsCm: '97-100', waistIn: '32-33', hipsIn: '38-39.5' },
    { waist: 'W33', eu: '49', waistCm: '84-86', hipsCm: '100-102', waistIn: '33-34', hipsIn: '39.5-40' },
    { waist: 'W34', eu: '50', waistCm: '86-89', hipsCm: '102-105', waistIn: '34-35', hipsIn: '40-41.5' },
    { waist: 'W36', eu: '52', waistCm: '91-94', hipsCm: '107-110', waistIn: '36-37', hipsIn: '42-43.5' },
    { waist: 'W38', eu: '54', waistCm: '96-100', hipsCm: '112-116', waistIn: '38-39.5', hipsIn: '44-45.5' },
    { waist: 'W40', eu: '56', waistCm: '101-106', hipsCm: '117-122', waistIn: '40-42', hipsIn: '46-48' }
  ];

  const shoesData = [
    { eu: '35', usW: '5', usM: '-', uk: '2.5', lengthCm: '22.0', lengthIn: '8.7' },
    { eu: '36', usW: '6', usM: '-', uk: '3.5', lengthCm: '22.7', lengthIn: '8.9' },
    { eu: '37', usW: '6.5', usM: '-', uk: '4', lengthCm: '23.3', lengthIn: '9.2' },
    { eu: '38', usW: '7.5', usM: '-', uk: '5', lengthCm: '24.0', lengthIn: '9.4' },
    { eu: '39', usW: '8.5', usM: '6.5', uk: '6', lengthCm: '24.7', lengthIn: '9.7' },
    { eu: '40', usW: '9', usM: '7', uk: '6.5', lengthCm: '25.3', lengthIn: '10.0' },
    { eu: '41', usW: '10', usM: '8', uk: '7.5', lengthCm: '26.0', lengthIn: '10.2' },
    { eu: '42', usW: '10.5', usM: '8.5', uk: '8', lengthCm: '26.7', lengthIn: '10.5' },
    { eu: '43', usW: '11.5', usM: '9.5', uk: '9', lengthCm: '27.3', lengthIn: '10.7' },
    { eu: '44', usW: '-', usM: '10.5', uk: '10', lengthCm: '28.0', lengthIn: '11.0' },
    { eu: '45', usW: '-', usM: '11.5', uk: '11', lengthCm: '28.7', lengthIn: '11.3' },
    { eu: '46', usW: '-', usM: '12', uk: '11.5', lengthCm: '29.3', lengthIn: '11.5' }
  ];

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
      className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
    >
      <div className="bg-white text-zinc-950 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp border border-zinc-200">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-7 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-zinc-950 text-amber-400 flex items-center justify-center shadow-md shrink-0">
              <Ruler size={24} />
            </div>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-black tracking-[0.15em] text-zinc-950 uppercase">
                INTERNATIONAL SIZE GUIDE
              </h2>
              <p className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-wider pt-0.5">
                دليل المقاسات العالمي - Luxury Fashion Standards
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-2.5 rounded-full hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTROLS BAR: CATEGORY TABS + GENDER SWITCH + UNIT TOGGLE */}
        <div className="px-5 sm:px-7 py-4 bg-white border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4">
          
          {/* CATEGORY TABS */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
            <button
              onClick={() => setActiveTab('apparel')}
              className={`px-5 py-2.5 text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${
                activeTab === 'apparel'
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Apparel (الملابس)
            </button>
            <button
              onClick={() => setActiveTab('jeans')}
              className={`px-5 py-2.5 text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${
                activeTab === 'jeans'
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Jeans & Pants (الجينز والبنطال)
            </button>
            <button
              onClick={() => setActiveTab('shoes')}
              className={`px-5 py-2.5 text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${
                activeTab === 'shoes'
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Footwear (الأحذية)
            </button>
          </div>

          {/* GENDER & UNIT SWITCHERS */}
          <div className="flex items-center gap-3">
            {activeTab !== 'shoes' && (
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl text-xs sm:text-sm font-black uppercase">
                <button
                  onClick={() => setGender('women')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    gender === 'women' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-600'
                  }`}
                >
                  Women (نساء)
                </button>
                <button
                  onClick={() => setGender('men')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    gender === 'men' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-600'
                  }`}
                >
                  Men (رجال)
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl text-xs sm:text-sm font-black uppercase">
              <button
                onClick={() => setUnit('cm')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  unit === 'cm' ? 'bg-amber-400 text-zinc-950 shadow-xs' : 'text-zinc-600'
                }`}
              >
                CM (سم)
              </button>
              <button
                onClick={() => setUnit('in')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  unit === 'in' ? 'bg-amber-400 text-zinc-950 shadow-xs' : 'text-zinc-600'
                }`}
              >
                IN (إنش)
              </button>
            </div>
          </div>

        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-8 flex-1">
          
          {/* 1. APPAREL TABLE */}
          {activeTab === 'apparel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold tracking-wider uppercase text-zinc-950">
                  {gender === 'women' ? "WOMEN'S READY-TO-WEAR SIZING" : "MEN'S READY-TO-WEAR SIZING"}
                </h3>
                <span className="text-[11px] font-bold text-zinc-400 uppercase">
                  UNITS: {unit.toUpperCase()}
                </span>
              </div>

              <div className="overflow-x-auto border border-zinc-200 rounded-xl shadow-xs">
                <table className="w-full text-center text-xs sm:text-sm">
                  <thead className="bg-zinc-950 text-white font-black uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Standard</th>
                      <th className="py-3.5 px-4">IT (Italy)</th>
                      <th className="py-3.5 px-4">FR (France)</th>
                      <th className="py-3.5 px-4">UK</th>
                      <th className="py-3.5 px-4">US</th>
                      <th className="py-3.5 px-4">{gender === 'women' ? 'Bust' : 'Chest'} ({unit})</th>
                      <th className="py-3.5 px-4">Waist ({unit})</th>
                      <th className="py-3.5 px-4">Hips ({unit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {(gender === 'women' ? apparelWomen : apparelMen).map((row: any, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/70 hover:bg-zinc-100 transition-colors'}>
                        <td className="py-3.5 px-4 font-black text-zinc-950 text-sm">{row.size}</td>
                        <td className="py-3.5 px-4 font-bold">{row.it}</td>
                        <td className="py-3.5 px-4 font-bold">{row.fr}</td>
                        <td className="py-3.5 px-4">{row.uk}</td>
                        <td className="py-3.5 px-4">{row.us}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">{unit === 'cm' ? (row.bustCm || row.chestCm) : (row.bustIn || row.chestIn)}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">{unit === 'cm' ? row.waistCm : row.waistIn}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">{unit === 'cm' ? row.hipsCm : row.hipsIn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. JEANS TABLE */}
          {activeTab === 'jeans' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg sm:text-xl font-bold tracking-wider uppercase text-zinc-950">
                  JEANS & TROUSERS WAIST CONVERSION
                </h3>
                <span className="text-xs font-black text-zinc-500 uppercase">
                  UNITS: {unit.toUpperCase()}
                </span>
              </div>

              <div className="overflow-x-auto border border-zinc-200 rounded-xl shadow-xs">
                <table className="w-full text-center text-xs sm:text-sm">
                  <thead className="bg-zinc-950 text-white font-black uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Jeans Waist Size</th>
                      <th className="py-3.5 px-4">EU / IT Size</th>
                      <th className="py-3.5 px-4">Waist Circumference ({unit})</th>
                      <th className="py-3.5 px-4">Seat / Hips ({unit})</th>
                      <th className="py-3.5 px-4">Standard Inseam Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {jeansData.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/70 hover:bg-zinc-100 transition-colors'}>
                        <td className="py-3.5 px-4 font-black text-amber-600 text-sm sm:text-base">{row.waist}</td>
                        <td className="py-3.5 px-4 font-bold">{row.eu}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">{unit === 'cm' ? row.waistCm : row.waistIn}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">{unit === 'cm' ? row.hipsCm : row.hipsIn}</td>
                        <td className="py-3.5 px-4 text-zinc-600">{unit === 'cm' ? '81 - 86 cm' : '32" - 34"'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. SHOES TABLE */}
          {activeTab === 'shoes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg sm:text-xl font-bold tracking-wider uppercase text-zinc-950">
                  INTERNATIONAL FOOTWEAR SIZE MATRIX
                </h3>
                <span className="text-xs font-black text-zinc-500 uppercase">
                  UNITS: {unit.toUpperCase()}
                </span>
              </div>

              <div className="overflow-x-auto border border-zinc-200 rounded-xl shadow-xs">
                <table className="w-full text-center text-xs sm:text-sm">
                  <thead className="bg-zinc-950 text-white font-black uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 bg-zinc-900">EU (Europe)</th>
                      <th className="py-3.5 px-4">US Men</th>
                      <th className="py-3.5 px-4">US Women</th>
                      <th className="py-3.5 px-4">UK</th>
                      <th className="py-3.5 px-4">Foot Length ({unit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {shoesData.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/70 hover:bg-zinc-100 transition-colors'}>
                        <td className="py-3.5 px-4 font-black text-zinc-950 text-sm sm:text-base">{row.eu}</td>
                        <td className="py-3.5 px-4 font-bold">{row.usM}</td>
                        <td className="py-3.5 px-4 font-bold">{row.usW}</td>
                        <td className="py-3.5 px-4">{row.uk}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{unit === 'cm' ? `${row.lengthCm} cm` : `${row.lengthIn}"`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. HOW TO MEASURE GUIDE */}
          <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-zinc-950 font-bold uppercase tracking-widest text-xs sm:text-sm">
              <HelpCircle size={18} className="text-amber-500" />
              <span>HOW TO TAKE ACCURATE BODY MEASUREMENTS (كيف تأخذ مقاسك بدقة)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-700 leading-relaxed">
              <div className="space-y-1.5">
                <span className="font-extrabold text-zinc-950 uppercase block">1. Chest / Bust (الصدر)</span>
                <p>Measure across the fullest part of your chest, keeping the measuring tape horizontal and under your arms.</p>
                <p className="text-xs text-zinc-500">قس حول الجزء الأوسع من الصدر مع إبقاء شريط القياس مستوياً.</p>
              </div>

              <div className="space-y-1.5">
                <span className="font-extrabold text-zinc-950 uppercase block">2. Waist (الخصر)</span>
                <p>Measure around the narrowest part of your waist (typically above your belly button and below your rib cage).</p>
                <p className="text-xs text-zinc-500">قس حول أضيق نقطة في خصرك الطبيعي دون شد الشريط بقوة.</p>
              </div>

              <div className="space-y-1.5">
                <span className="font-extrabold text-zinc-950 uppercase block">3. Hips / Foot (الورك / القدم)</span>
                <p>For hips, measure around the fullest part of your hips. For shoes, measure heel to longest toe.</p>
                <p className="text-xs text-zinc-500">للأحذية، قس المسافة من الكعب إلى أطول إصبع في القدم.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-800">
              <Sparkles size={16} className="text-amber-500 shrink-0" />
              <span>
                <strong>PRO TIP:</strong> If you are between two sizes, European luxury tailoring recommends sizing up for a relaxed fit or true to size for a structured silhouette.
              </span>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
            STYLUXE OFFICIAL LUXURY SIZING
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 bg-zinc-950 text-white text-xs font-black uppercase tracking-widest rounded hover:bg-zinc-800 transition-colors shadow-sm"
          >
            CLOSE GUIDE
          </button>
        </div>

      </div>
    </div>
  );
}
