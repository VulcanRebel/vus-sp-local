// src/components/Calculator.tsx

import { useState, useEffect, useMemo } from 'react';
import { PART_GROUP_OPTIONS, DENSITIES, THICKNESSES } from '../constants';
import ResultsDisplay from './ResultsDisplay';

type PartGroup = keyof typeof PART_GROUP_OPTIONS;
type CalculationResults = { [key: string]: { value: number | string; label: string } };

type CalculatorProps = {
  onSearchTermChange?: (value: string) => void;
  onAutoGenerateChange?: (on: boolean) => void;
  onPartTypeChange?: (type: string) => void;
  onTriggerSearch?: () => void;
};

// --- STYLES ---
// Defined as constants to keep the JSX clean while maintaining the strict Swiss grid
const STYLES = {
    select: `
        w-full h-10 px-3
        bg-slate-950 border border-slate-700 
        text-slate-100 text-sm 
        focus:border-blue-600 focus:ring-0 
        transition-colors rounded-none appearance-none cursor-pointer 
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] 
        bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat
    `,
    input: `
        w-full h-10 px-3 
        bg-slate-950 border border-slate-700 
        text-slate-100 placeholder-slate-600 text-sm font-mono
        focus:border-blue-600 focus:ring-0 
        transition-colors rounded-none
    `,
    label: `
        block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1
    `,
    checkbox: `
        peer h-4 w-4 bg-slate-950 border border-slate-700 
        checked:bg-blue-600 checked:border-blue-600 
        focus:ring-0 transition-colors rounded-none cursor-pointer
    `,
    button: `
        w-full h-12 
        bg-blue-600 hover:bg-blue-500 
        text-white font-bold text-xs uppercase tracking-widest 
        transition-colors shadow-none rounded-none cursor-pointer
    `
};

export default function Calculator({ 
  onSearchTermChange, 
  onAutoGenerateChange, 
  onPartTypeChange,
  onTriggerSearch 
}: CalculatorProps) {
    
    // --- STATE MANAGEMENT ---
    // Core Selection
    const [partGroup, setPartGroup] = useState<PartGroup>('lineMarkers');
    const [partType, setPartType] = useState('bullet');

    // Dimensions
    const [itemWidth, setItemWidth] = useState('48');
    const [itemHeight, setItemHeight] = useState('24');

    // Material Specifics
    const [alGauge, setAlGauge] = useState('.024');
    const [acmSheetSize, setAcmSheetSize] = useState('96');
    const [hdpeSheetSize, setHdpeSheetSize] = useState('.023');
    
    // Roll / Sheet Specs
    const [magnetRollWidth, setMagnetRollWidth] = useState('24');
    const [magnetThickness, setMagnetThickness] = useState('0.030');
    const [digitalPrintRollWidth, setDigitalPrintRollWidth] = useState('54');
    const [includeBleed, setIncludeBleed] = useState(true);
    const [opusSheetWidth, setOpusSheetWidth] = useState('12');
    const [opusSheetHeight, setOpusSheetHeight] = useState('18');

    // Bullet Marker Specifics
    const [sleeveLength, setSleeveLength] = useState('16');
    const [tubeGauge, setTubeGauge] = useState('0.100');
    const [tubeLength, setTubeLength] = useState('72');
    const [customTubeLength, setCustomTubeLength] = useState('');
    const [includeDomeCapPlug, setIncludeDomeCapPlug] = useState(true);
    const [includeSleeve, setIncludeSleeve] = useState(true);
    const [includeT3Head, setIncludeT3Head] = useState(false);
    const [includeRainCap, setIncludeRainCap] = useState(false);
    const [includeUChannel, setIncludeUChannel] = useState(false);

    // Outputs
    const [results, setResults] = useState<CalculationResults | null>(null);
    const [error, setError] = useState<string>('');

    // Search Interaction
    const [autoGeneratePartNo, setAutoGeneratePartNo] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTermSuffix, setSearchTermSuffix] = useState('');

    // --- HELPER FUNCTIONS ---

    const formatGauge = (g: string) => {
        const n = parseFloat(g);
        if (Number.isNaN(n)) return '';
        return String(Math.round(n * 1000)).padStart(3, '0');
    };
    
    const formatDim = (v: string) => {
        const n = parseFloat(v);
        if (Number.isNaN(n)) return '';
        if (Number.isInteger(n)) return String(n);
        // Trim trailing zeros from decimals
        return String(n).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    };

    const calculateWeight = (l: number, w: number, thickness: number, density: number) => {
        return l * w * thickness * density;
    };

    // --- AUTO-GENERATION LOGIC ---
    const autoPrefix = useMemo(() => {
        const w = formatDim(itemWidth);
        const h = formatDim(itemHeight);

        // Markers
        if (partGroup === 'lineMarkers' && partType === 'bullet') {
            const length = tubeLength === 'custom' ? formatDim(customTubeLength) : formatDim(tubeLength);
            return length ? `${length}` : '';
        }

        // Standard Dimensions Check
        if (!w || !h) return '';

        // Signs
        if (partGroup === 'signs') {
            if (partType === 'aluminum_sign') {
                const g = formatGauge(alGauge);
                return g ? `${g}x${w}x${h}` : '';
            }
            if (partType === 'acm_sign') {
                return `3mmx${w}x${h}`;
            }
            if (partType === 'hdpe_sign') {
                const g = hdpeSheetSize === '.023' ? '023' : '110';
                return `${g}x${w}x${h}`;
            }
            if (partType === 'corrugated') {
                return `${w}x${h}`;
            }
        }

        // Decals
        if (partGroup === 'decals') {
            return `${w}x${h}`;
        }

        return '';
    }, [
        partGroup, partType, itemWidth, itemHeight, 
        alGauge, hdpeSheetSize, tubeLength, customTubeLength
    ]);

    // --- EFFECTS ---

    // 1. Reset Part Type when Group changes
    useEffect(() => {
        const firstPartType = PART_GROUP_OPTIONS[partGroup][0]?.value;
        if (firstPartType) { 
            setPartType(firstPartType); 
        }
        setResults(null); 
        setError('');
    }, [partGroup]);

    // 2. Notify Parent when Part Type changes (for Auto-Select dropdown in Search)
    useEffect(() => {
        setResults(null); 
        setError('');
        onPartTypeChange?.(partType);
    }, [partType, onPartTypeChange]);

    // 3. Handle Auto-Generation Text Updates
    useEffect(() => {
        if (!autoGeneratePartNo) return;
        const next = autoPrefix ? `${autoPrefix}${searchTermSuffix}` : searchTermSuffix;
        setSearchTerm(next);
        onSearchTermChange?.(next);
    }, [autoGeneratePartNo, autoPrefix, searchTermSuffix, onSearchTermChange]);

    // 4. Initial Sync for Auto-Gen
    useEffect(() => {
        if (!autoGeneratePartNo) return;
        if (!autoPrefix) {
            setSearchTerm(searchTermSuffix);
        }
    }, [autoGeneratePartNo, autoPrefix, searchTermSuffix]);

    // --- MAIN CALCULATION HANDLER ---
    const handleCalculate = () => {
        const width = parseFloat(itemWidth);
        const height = parseFloat(itemHeight);
        let calculatedResults: CalculationResults = {};
        setError('');

        // Basic Validation
        const requiresDimensions = !['bullet', 'frame', 'accessories', 'delta', 'drv'].includes(partType);
        if (requiresDimensions && (isNaN(width) || isNaN(height))) {
            setError("Please enter valid numbers for width and height.");
            setResults(null);
            return;
        }

        switch (partType) {
            case 'aluminum_sign':
            case 'corrugated': {
                const sheetWidth = 96; 
                const sheetHeight = 48;
                
                // Nesting Logic
                const numUpWidth = Math.floor(sheetWidth / width);
                const numUpHeight = Math.floor(sheetHeight / height);
                const numUpSwappedWidth = Math.floor(sheetWidth / height);
                const numUpSwappedHeight = Math.floor(sheetHeight / width);
                const maxNumUp = Math.max(numUpWidth * numUpHeight, numUpSwappedWidth * numUpSwappedHeight);
                
                const isAluminum = partType === 'aluminum_sign';
                const thickness = isAluminum ? parseFloat(alGauge) : THICKNESSES.corrugated;
                const density = isAluminum ? DENSITIES.aluminum : DENSITIES.corrugated;

                calculatedResults = {
                    qty: { value: maxNumUp, label: "# Up / Inverse Qty:" },
                    percentWaste: { value: maxNumUp > 0 ? (1 / maxNumUp) : 0, label: "% Out of Material:" },
                    weight: {
                        value: calculateWeight(width, height, thickness, density),
                        label: isAluminum ? "Aluminum Weight:" : "Corrugated Weight:"
                    }
                };
                break;
            }

            case 'acm_sign': {
                const sheetW = acmSheetSize === '120' ? 120 : 96;
                const sheetH = acmSheetSize === '120' ? 60 : 48;
                
                const numUpW = Math.floor(sheetW / width); 
                const numUpH = Math.floor(sheetH / height);
                const numUpSW = Math.floor(sheetW / height); 
                const numUpSH = Math.floor(sheetH / width);
                const maxNumUp = Math.max(numUpW * numUpH, numUpSW * numUpSH);

                calculatedResults = {
                    qty: { value: maxNumUp, label: "# Up / Inverse Qty:" },
                    percentWaste: { value: maxNumUp > 0 ? (1 / maxNumUp) : 0, label: "% Out of Material:" },
                    weight: { value: calculateWeight(width, height, THICKNESSES.acm, DENSITIES.acm), label: "ACM Weight:" }
                };
                break;
            }

            case 'hdpe_sign': {
                let sheetW = 48;
                let sheetH = 24;
                let density = DENSITIES.hdpe;
                let thickness = 0.110;

                if (hdpeSheetSize === '.023') {
                    sheetW = 45; sheetH = 24; density = DENSITIES.hdpe_023; thickness = 0.023;
                } else if (hdpeSheetSize === '.110_96') {
                    sheetH = 96;
                } else if (hdpeSheetSize === '.110_40') {
                    sheetH = 40;
                }

                const numUpW = Math.floor(sheetW / width); const numUpH = Math.floor(sheetH / height);
                const numUpSW = Math.floor(sheetW / height); const numUpSH = Math.floor(sheetH / width);
                const maxNumUp = Math.max(numUpW * numUpH, numUpSW * numUpSH);

                calculatedResults = {
                    qty: { value: maxNumUp, label: "# Up / Inverse Qty:" },
                    percentWaste: { value: maxNumUp > 0 ? (1 / maxNumUp) : 0, label: "% Out of Material:" },
                    weight: { value: calculateWeight(width, height, thickness, density), label: "HDPE Weight:" }
                };
                break;
            }

            case 'digital_print': {
                const rollW = parseFloat(digitalPrintRollWidth);
                const bleed = includeBleed ? 0.5 : 0;
                const printArea = rollW - 1.5;
                const itemWB = width + bleed; 
                const itemHB = height + bleed;

                if (itemWB > printArea && itemHB > printArea) {
                    setError("Error: Both dimensions exceed the roll width."); 
                    setResults(null); 
                    return;
                }

                let numUp1 = Math.floor(printArea / itemWB) || 1;
                let numUp2 = Math.floor(printArea / itemHB) || 1;
                
                // Sq Ft Cost Estimation logic
                const sqFt1 = Math.ceil(((width + 1) * rollW) / 144 / numUp2 * 1000) / 1000;
                const sqFt2 = Math.ceil(((height + 1) * rollW) / 144 / numUp1 * 1000) / 1000;

                calculatedResults = {
                    materialSqFt: { value: (sqFt1 + sqFt2) / 2, label: "Material Sq. ft.:" },
                    laminateSqFt: { value: ((sqFt1 + sqFt2) / 2) * 1.05, label: "Laminate Sq. ft.:" },
                    maxUpPerRow: { value: Math.max(numUp1, numUp2), label: "Max # Up per Row:" },
                };
                break;
            }

            case 'magnet': {
                const rollW = parseFloat(magnetRollWidth);
                const numUp1 = Math.floor(rollW / width); 
                const numUp2 = Math.floor(rollW / height);
                
                const sqFt1 = Math.ceil(((width + 1) * rollW) / 144 / numUp2 * 1000) / 1000;
                const sqFt2 = Math.ceil(((height + 1) * rollW) / 144 / numUp1 * 1000) / 1000;
                
                const volume = width * height * parseFloat(magnetThickness);

                calculatedResults = {
                    materialSqFt: { value: (sqFt1 + sqFt2) / 2, label: "Material Sq. ft.:" },
                    maxUpPerRow: { value: Math.max(numUp1, numUp2), label: "Max # Up per Row:" },
                    weight: { value: volume * DENSITIES.magnet, label: "Mag Weight:" }
                };
                break;
            }

            case 'banner': {
                 calculatedResults = {
                    bannerSqFt: { 
                        value: ((height + 3) * 2) < 52.5 ? ((width + 3) * (height + 3)) / 144 : ((width + 3) * 54) / 144, 
                        label: "Banner Sq. ft.:" 
                    },
                    bannerTape: { value: ((width + height) * 2) / 12, label: "Banner Tape:" },
                    grommets: { value: Math.max(4, Math.round(((width - 2) / 30) * 2)), label: "Grommets:" }
                };
                break;
            }

            case 'opus_cut_decal':
            case 'screenDecal': { 
                // Restored screenDecal logic (same as opus for now)
                const sheetW = parseFloat(opusSheetWidth); 
                const sheetH = parseFloat(opusSheetHeight);
                const numAcross = Math.floor((sheetW - 1.5) / width);
                const numDown = Math.floor(sheetH / height);
                const numUp = numAcross * numDown;
                const sheetArea = (sheetW * sheetH) / 144;
                
                calculatedResults = {
                    numUpStandard: { value: numUp, label: "# Up (Standard):" },
                    sheetAreaSqFt: { value: sheetArea, label: "Sheet Area (sq ft):" },
                    areaPerDecal: { value: numUp > 0 ? sheetArea / numUp : 0, label: "Area per Decal:" }
                };
                break;
            }

            case 'vhbTape': {
                const perimeter = ((width - 2) * 2) + ((height - 2) * 2);
                let additionalStrips = 0; 
                let additionalLength = 0;
                
                if (width >= 48 || height >= 48) {
                    if (width > height) {
                        additionalStrips = Math.max(1, Math.floor((width - 48) / 16));
                        additionalLength = additionalStrips * (height - 2);
                    } else {
                        additionalStrips = Math.max(1, Math.floor((height - 48) / 16));
                        additionalLength = additionalStrips * (width - 2);
                    }
                }
                const totalInches = perimeter + additionalLength;
                
                calculatedResults = {
                    vhbPerimeterLength: { value: perimeter / 12, label: "Perimeter Length (ft):" },
                    vhbAdditionalStrips: { value: additionalStrips, label: "Additional Strips:" },
                    vhbTapeLength: { value: totalInches / 12, label: "Total Length (ft):" },
                };
                break;
            }

            case 'bullet': {
                const tubeData = { "0.100": 0.4599, "0.110": 0.482195, "0.125": 0.5211, "0.218": 0.9073, "0.318": 1.29512 };
                const finalTubeLength = tubeLength === 'custom' ? parseFloat(customTubeLength) || 0 : parseFloat(tubeLength);
                
                const tubeWeight = (finalTubeLength / 12) * (tubeData[tubeGauge as keyof typeof tubeData] || 0);
                const headWeight = (includeSleeve ? (sleeveLength === '16' ? 0.65 : 0.95) : 0) + (includeDomeCapPlug ? 0.152 : 0);
                const totalWeight = tubeWeight + headWeight + (includeT3Head ? 0.6 : 0) + (includeRainCap ? 0.05 : 0) + (includeUChannel ? 1.12 : 0);

                calculatedResults = {
                    bulletHeadWeight: { value: headWeight, label: "Bullet Head Weight:" },
                    tubeWeight: { value: tubeWeight, label: "Tube Weight:" },
                    weight: { value: totalWeight, label: "Total Marker Weight:" }
                };
                break;
            }

            case 'delta': 
            case 'drv':
            case 'accessories':
            case 'frame': {
                // Restored Catch-all for simple parts
                calculatedResults = {
                    info: { value: "N/A", label: "No Calc Available" },
                    note: { value: "See Specs", label: "Refer to Standard" }
                };
                break;
            }
        }
        setResults(calculatedResults);

        // Auto-Search trigger
        if (autoGeneratePartNo && onTriggerSearch) {
            onTriggerSearch();
        }
    };
    
    // --- RENDER ---
    return (
        <div className="w-full">
            <div className="space-y-4">
                
                {/* Main Selectors Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="partGroup" className={STYLES.label}>Part Group</label>
                        <select id="partGroup" value={partGroup} onChange={(e) => setPartGroup(e.target.value as PartGroup)} className={STYLES.select}>
                            <option value="signs">Signs</option>
                            <option value="decals">Decals</option>
                            <option value="lineMarkers">Markers</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="partType" className={STYLES.label}>Part Type</label>
                        <select id="partType" value={partType} onChange={(e) => setPartType(e.target.value)} className={STYLES.select}>
                            {PART_GROUP_OPTIONS[partGroup].map(option => (<option key={option.value} value={option.value}>{option.text}</option>))}
                        </select>
                    </div>
                </div>

                {/* Live Part Search UI */}
                <div className="grid grid-cols-12 gap-4 pt-4 border-t border-slate-800">
                  <div className="col-span-12 md:col-span-4 flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={autoGeneratePartNo}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setAutoGeneratePartNo(on);
                            onAutoGenerateChange?.(on);
                            if (on) {
                              setSearchTermSuffix('');
                              setSearchTerm(autoPrefix);
                              onSearchTermChange?.(autoPrefix);
                            }
                          }}
                          className={STYLES.checkbox}
                        />
                        <svg className="absolute w-3 h-3 text-white hidden peer-checked:block left-0.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="4" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auto-Search</span>
                    </label>
                  </div>
                
                  <div className="col-span-12 md:col-span-8">
                    <label className={STYLES.label}>Part # / Search Term</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (!autoGeneratePartNo) {
                          setSearchTerm(next);
                          return;
                        }
                        if (autoPrefix && next.startsWith(autoPrefix)) {
                          setSearchTermSuffix(next.slice(autoPrefix.length));
                        } else {
                          setSearchTermSuffix(next);
                        }
                      }}
                      placeholder={autoGeneratePartNo ? 'Auto-generated...' : 'Type search term'}
                      className={STYLES.input}
                    />
                  </div>
                </div>
                
                {/* --- CONDITIONAL OPTIONS --- */}
                {partType === 'aluminum_sign' && (
                    <div>
                        <label htmlFor="alGauge_options" className={STYLES.label}>Aluminum Gauge</label>
                        <select id="alGauge_options" value={alGauge} onChange={(e) => setAlGauge(e.target.value)} className={STYLES.select}>
                            <option value=".024">.024</option><option value=".040">.040</option><option value=".050">.050</option><option value=".063">.063</option><option value=".080">.080</option><option value=".090">.090</option><option value=".125">.125</option>
                        </select>
                    </div>
                )}
                {partType === 'acm_sign' && (
                     <div>
                        <label htmlFor="acm_options" className={STYLES.label}>ACM Sheet Size</label>
                        <select id="acm_options" value={acmSheetSize} onChange={(e) => setAcmSheetSize(e.target.value)} className={STYLES.select}>
                            <option value="96">3mm x 96in x 48in</option><option value="120">3mm x 120in x 60in</option>
                        </select>
                    </div>
                )}
                 {partType === 'hdpe_sign' && (
                     <div>
                        <label htmlFor="hdpe_options" className={STYLES.label}>HDPE Sheet Size</label>
                        <select id="hdpe_options" value={hdpeSheetSize} onChange={(e) => setHdpeSheetSize(e.target.value)} className={STYLES.select}>
                            <option value=".023">.023in x 45in x 24in</option><option value=".110_96">.110in x 48in x 96in</option><option value=".110_40">.110in x 48in x 40in</option><option value=".110_24">.110in x 48in x 24in</option>
                        </select>
                    </div>
                )}
                {partType === 'corrugated' && (
                     <div>
                        <label htmlFor="corr_options" className={STYLES.label}>Corrugated Sheet Size</label>
                        <select id="corr_options" className={STYLES.select} disabled><option value="4mm">4mm x 96in x 48in</option></select>
                    </div>
                )}
                {partType === 'digital_print' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                            <label htmlFor="digital_print_options" className={STYLES.label}>Roll Width</label>
                            <select id="digital_print_options" value={digitalPrintRollWidth} onChange={(e) => setDigitalPrintRollWidth(e.target.value)} className={STYLES.select}>
                                <option value="54">54"</option><option value="48">48"</option><option value="36">36"</option><option value="30">30"</option><option value="24">24"</option><option value="22">22"</option><option value="18">18" (HIP)</option><option value="16">16"</option>
                            </select>
                        </div>
                        <div className="h-10 flex items-center">
                            <label htmlFor="includeBleed" className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input type="checkbox" id="includeBleed" checked={includeBleed} onChange={(e) => setIncludeBleed(e.target.checked)} className={STYLES.checkbox}/>
                                    <svg className="absolute w-3 h-3 text-white hidden peer-checked:block left-0.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="4" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">Include Bleed</span>
                            </label>
                        </div>
                    </div>
                )}
                {partType === 'magnet' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="magnet_options" className={STYLES.label}>Magnet Roll Width</label>
                            <select id="magnet_options" value={magnetRollWidth} onChange={(e) => setMagnetRollWidth(e.target.value)} className={STYLES.select}>
                                <option value="24">24"</option><option value="30">30"</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="magnet_thickness" className={STYLES.label}>Magnet Thickness</label>
                            <select id="magnet_thickness" value={magnetThickness} onChange={(e) => setMagnetThickness(e.target.value)} className={STYLES.select}>
                                <option value="0.030">30 mil</option><option value="0.060">60 mil</option>
                            </select>
                        </div>
                    </div>
                )}
                {['opus_cut_decal', 'screenDecal'].includes(partType) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="opusSheetWidth" className={STYLES.label}>Sheet Width</label>
                            <input id="opusSheetWidth" type="number" value={opusSheetWidth} onChange={(e) => setOpusSheetWidth(e.target.value)} className={STYLES.input}/>
                        </div>
                        <div>
                            <label htmlFor="opusSheetHeight" className={STYLES.label}>Sheet Height</label>
                            <input id="opusSheetHeight" type="number" value={opusSheetHeight} onChange={(e) => setOpusSheetHeight(e.target.value)} className={STYLES.input}/>
                        </div>
                    </div>
                )}
                {partType === 'bullet' && (
                     <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="sleeveLength" className={STYLES.label}>Sleeve Length</label>
                                <select id="sleeveLength" value={sleeveLength} onChange={(e) => setSleeveLength(e.target.value)} className={STYLES.select}>
                                    <option value="16">16in Sleeve</option><option value="22">22in Sleeve</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="tubeGauge" className={STYLES.label}>Tube Gauge</label>
                                <select id="tubeGauge" value={tubeGauge} onChange={(e) => setTubeGauge(e.target.value)} className={STYLES.select}>
                                    <option value="0.100">.100</option><option value="0.110">.110</option><option value="0.125">.125</option><option value="0.218">.218</option><option value="0.318">.318</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="tubeLength" className={STYLES.label}>Tube Length</label>
                            <select id="tubeLength" value={tubeLength} onChange={(e) => setTubeLength(e.target.value)} className={STYLES.select}>
                                <option value="66">66in</option><option value="72">72in</option><option value="84">84in</option><option value="96">96in</option><option value="custom">Custom</option>
                            </select>
                        </div>
                        {tubeLength === 'custom' && (
                            <div>
                                <label htmlFor="customLengthInput" className={STYLES.label}>Custom Length</label>
                                <input type="text" id="customLengthInput" value={customTubeLength} onChange={(e) => setCustomTubeLength(e.target.value)} placeholder="Enter custom length" className={STYLES.input}/>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Dome Cap Plug', checked: includeDomeCapPlug, set: setIncludeDomeCapPlug },
                                { label: 'Bullet Sleeve', checked: includeSleeve, set: setIncludeSleeve },
                                { label: 'T3 Head', checked: includeT3Head, set: setIncludeT3Head },
                                { label: 'Rain Cap', checked: includeRainCap, set: setIncludeRainCap },
                                { label: 'U-Channel', checked: includeUChannel, set: setIncludeUChannel },
                            ].map((opt, i) => (
                                <label key={i} className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" checked={opt.checked} onChange={(e) => opt.set(e.target.checked)} className={STYLES.checkbox}/>
                                        <svg className="absolute w-3 h-3 text-white hidden peer-checked:block left-0.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="4" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Item Size Inputs */}
                {partType !== 'bullet' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                        <div>
                            <label htmlFor="itemWidth" className={STYLES.label}>Item Width (in)</label>
                            <input id="itemWidth" type="number" value={itemWidth} onChange={e => setItemWidth(e.target.value)} placeholder="0.00" step="0.001" className={STYLES.input} />
                        </div>
                        <div>
                            <label htmlFor="itemHeight" className={STYLES.label}>Item Height (in)</label>
                            <input id="itemHeight" type="number" value={itemHeight} onChange={e => setItemHeight(e.target.value)} placeholder="0.00" step="0.001" className={STYLES.input} />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Action and Results */}
            <div className="mt-6 pt-4 border-t border-slate-800">
                <button onClick={handleCalculate} className={STYLES.button}>
                    {autoGeneratePartNo ? 'Calculate & Search' : 'Calculate'}
                </button>
                {error && <div className="mt-4 p-3 bg-red-950/30 border border-red-900 text-red-400 font-mono text-[10px] uppercase tracking-wider">{error}</div>}
                {results && <ResultsDisplay results={results} />}
            </div>
        </div>
    );
}