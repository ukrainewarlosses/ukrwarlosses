'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { hardcodedChartData, ChartData } from '@/data/hardcoded-chart-data';

type TimePeriod = 'daily' | 'weekly' | 'monthly';

type HoverInfo = any;

// Custom Legend component that shows solid vs dashed lines
const CustomLegend = ({ payload }: any) => {
  if (!payload || !payload.length) return null;
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', color: '#a0aec0', fontSize: '12px' }}>
      {payload.map((entry: any, index: number) => {
        const isCumulative = entry.value?.includes('Cumulative');
        const strokeWidth = isCumulative ? 3 : 2;
        const opacity = isCumulative ? 1 : 0.8;
        
        return (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="20" height="4" style={{ display: 'block' }}>
              <line
                x1="0"
                y1="2"
                x2="20"
                y2="2"
                stroke={entry.color}
                strokeWidth={strokeWidth}
                opacity={opacity}
                strokeDasharray={isCumulative ? '6 4' : undefined}
              />
            </svg>
            <span>{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

type MobileChartProps = {
  displayData: ChartData[];
  timePeriod: TimePeriod;
  showUkraine: boolean;
  showRussia: boolean;
  setHoverInfo: (info: HoverInfo | null) => void;
  setSelectedRange: (range: any) => void;
};

const MobileChartMemo = memo(function MobileChart({
  displayData,
  timePeriod,
  showUkraine,
  showRussia,
  setHoverInfo,
  setSelectedRange
}: MobileChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [rangeStartIndex, setRangeStartIndex] = useState<number | null>(null);
  const [rangeEndIndex, setRangeEndIndex] = useState<number | null>(null);
  const [isSettingRange, setIsSettingRange] = useState(false);
  const [currentHoverIndex, setCurrentHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      const viewportWidth = window.innerWidth;
      const safeWidth = Math.max(viewportWidth - 64, 280);
      setContainerWidth(safeWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const width = containerWidth;
  const height = timePeriod === 'daily' ? 450 : 350;
  const margin = { top: 20, right: 40, bottom: 55, left: 30 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const data = displayData;
  if (!data || data.length === 0) return null;

  const xMin = 0;
  const xMax = data.length - 1;
  const yMaxPeriod = timePeriod === 'daily' ? 600 : timePeriod === 'weekly' ? 2000 : Math.max(...data.map((d: ChartData) => Math.max(d.ukraineTotal, d.russiaDeaths)));
  const yMaxCum = Math.max(...data.map((d: ChartData) => Math.max(d.ukraineTotalCumulative, d.russiaTotalCumulative)));

  const X_PAD = 8;
  const xScale = (index: number) => margin.left + (index / xMax) * (innerWidth - X_PAD);
  const yScalePeriod = (value: number) => {
    // For daily and weekly charts, clamp values at max so they appear at the top edge
    const clampedValue = (timePeriod === 'daily' || timePeriod === 'weekly') ? Math.min(value, yMaxPeriod) : value;
    return margin.top + innerHeight - (clampedValue / yMaxPeriod) * innerHeight;
  };
  const yScaleCum = (value: number) => margin.top + innerHeight - (value / yMaxCum) * innerHeight;

  const xToIndex = (x: number) => {
    const relativeX = x - margin.left;
    const index = Math.round((relativeX / (innerWidth - X_PAD)) * xMax);
    return Math.max(0, Math.min(xMax, index));
  };

  // Use native event listeners to avoid passive event listener warning
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = svg.getBoundingClientRect();
      if (!rect) return;
      const x = touch.clientX - rect.left;
      if (x >= margin.left && x <= margin.left + innerWidth - X_PAD) {
        const touchIndex = xToIndex(x);
        const touchedData = data[touchIndex];
        const ukrainePeriod = touchedData.ukraineTotal || 0;
        const russiaPeriod = touchedData.russiaDeaths || 0;
        const ukraineCumulative = touchedData.ukraineTotalCumulative || 0;
        const russiaCumulative = touchedData.russiaTotalCumulative || 0;
        const periodRatio = ukrainePeriod > 0 ? (russiaPeriod / ukrainePeriod).toFixed(2) : '0';
        const cumulativeRatio = ukraineCumulative > 0 ? (russiaCumulative / ukraineCumulative).toFixed(2) : '0';
        setHoverInfo({ data: touchedData, label: touchedData.date, periodRatio, cumulativeRatio });
        setCurrentHoverIndex(touchIndex);
        if (isSettingRange && rangeStartIndex !== null) setRangeEndIndex(touchIndex);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = svg.getBoundingClientRect();
      if (!rect) return;
      const x = touch.clientX - rect.left;
      if (x >= margin.left && x <= margin.left + innerWidth - X_PAD) {
        const touchIndex = xToIndex(x);
        const touchedData = data[touchIndex];
        const ukrainePeriod = touchedData.ukraineTotal || 0;
        const russiaPeriod = touchedData.russiaDeaths || 0;
        const ukraineCumulative = touchedData.ukraineTotalCumulative || 0;
        const russiaCumulative = touchedData.russiaTotalCumulative || 0;
        const periodRatio = ukrainePeriod > 0 ? (russiaPeriod / ukrainePeriod).toFixed(2) : '0';
        const cumulativeRatio = ukraineCumulative > 0 ? (russiaCumulative / ukraineCumulative).toFixed(2) : '0';
        setHoverInfo({ data: touchedData, label: touchedData.date, periodRatio, cumulativeRatio });
        setCurrentHoverIndex(touchIndex);
        if (isSettingRange && rangeStartIndex !== null) setRangeEndIndex(touchIndex);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
    };

    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd, { passive: false });
    svg.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      svg.removeEventListener('touchstart', handleTouchStart);
      svg.removeEventListener('touchmove', handleTouchMove);
      svg.removeEventListener('touchend', handleTouchEnd);
      svg.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [data, innerWidth, isSettingRange, rangeStartIndex, margin.left, X_PAD, xToIndex, setHoverInfo, setCurrentHoverIndex, setRangeEndIndex]);

  const getHoverLine = () => {
    if (currentHoverIndex !== null && !isSettingRange) {
      return { x: xScale(currentHoverIndex), y: margin.top, height: innerHeight };
    }
    return null;
  };

  const getSelectionRect = () => {
    if (isSettingRange && rangeStartIndex !== null && rangeEndIndex !== null) {
      const x1 = xScale(Math.min(rangeStartIndex, rangeEndIndex));
      const x2 = xScale(Math.max(rangeStartIndex, rangeEndIndex));
      const width = Math.max(x2 - x1, 2);
      return { x: x1, width, y: margin.top, height: innerHeight };
    }
    return null;
  };

  const selectionRect = getSelectionRect();

  return (
    <div className="w-full relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line key={i} x1={margin.left} y1={margin.top + (innerHeight / 5) * i} x2={margin.left + innerWidth - X_PAD} y2={margin.top + (innerHeight / 5) * i} stroke="#3d3d3d" strokeWidth="1" />
        ))}
        {(() => { const hoverLine = getHoverLine(); return hoverLine && (
          <line x1={hoverLine.x} y1={hoverLine.y} x2={hoverLine.x} y2={hoverLine.y + hoverLine.height} stroke="#d4a574" strokeWidth="2" strokeDasharray="4,2" opacity="0.8" />
        ); })()}
        {selectionRect && (
          <rect x={selectionRect.x} y={selectionRect.y} width={selectionRect.width} height={selectionRect.height} fill="#d4a574" fillOpacity="0.3" stroke="#d4a574" strokeWidth="2" strokeDasharray="6,3" />
        )}
        {showUkraine && data.length > 1 && (
          <path d={`M ${data.map((d: ChartData, i: number) => `${xScale(i)},${yScalePeriod(d.ukraineTotal)}`).join(' L ')}`} fill="none" stroke="#0057B7" strokeWidth="2" opacity="0.8" />
        )}
        {showRussia && data.length > 1 && (
          <path d={`M ${data.map((d: ChartData, i: number) => `${xScale(i)},${yScalePeriod(d.russiaDeaths)}`).join(' L ')}`} fill="none" stroke="#DA291C" strokeWidth="2" opacity="0.8" />
        )}
        {showUkraine && data.length > 1 && (
          <path d={`M ${data.map((d: ChartData, i: number) => `${xScale(i)},${yScaleCum(d.ukraineTotalCumulative)}`).join(' L ')}`} fill="none" stroke="#0057B7" strokeWidth="3" strokeDasharray="6,4" />
        )}
        {showRussia && data.length > 1 && (
          <path d={`M ${data.map((d: ChartData, i: number) => `${xScale(i)},${yScaleCum(d.russiaTotalCumulative)}`).join(' L ')}`} fill="none" stroke="#DA291C" strokeWidth="3" strokeDasharray="6,4" />
        )}
        <line x1={margin.left} y1={margin.top + innerHeight} x2={margin.left + innerWidth - X_PAD} y2={margin.top + innerHeight} stroke="#a0aec0" />
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerHeight} stroke="#a0aec0" />
        <line x1={margin.left + innerWidth - X_PAD} y1={margin.top} x2={margin.left + innerWidth - X_PAD} y2={margin.top + innerHeight} stroke="#a0aec0" />
        {timePeriod === 'daily' ? (
          [0, 150, 300, 450, 600].map((value, i) => (
            <text
              key={i}
              x={margin.left - 5}
              y={margin.top + innerHeight - (value / yMaxPeriod) * innerHeight + 4}
              textAnchor="end"
              fill="#a0aec0"
              fontSize="8"
            >
              {value}
            </text>
          ))
        ) : timePeriod === 'weekly' ? (
          [0, 500, 1000, 1500, 2000].map((value, i) => (
            <text
              key={i}
              x={margin.left - 5}
              y={margin.top + innerHeight - (value / yMaxPeriod) * innerHeight + 4}
              textAnchor="end"
              fill="#a0aec0"
              fontSize="8"
            >
              {value}
            </text>
          ))
        ) : (
          [0, 1, 2, 3, 4].map(i => (
            <text key={i} x={margin.left - 5} y={margin.top + (innerHeight / 4) * i + 4} textAnchor="end" fill="#a0aec0" fontSize="8">{Math.round((yMaxPeriod / 4) * (4 - i) / 1000)}k</text>
          ))
        )}
        {[0, 1, 2, 3, 4].map(i => (
          <text key={`cum-${i}`} x={margin.left + innerWidth - X_PAD + 2} y={margin.top + (innerHeight / 4) * i + 4} textAnchor="start" fill="#a0aec0" fontSize="8">{Math.round((yMaxCum / 4) * (4 - i) / 1000)}k</text>
        ))}
        {(() => {
          const dataLength = data.length;
          const maxLabels = dataLength <= 15 ? dataLength : dataLength <= 30 ? 8 : 10;
          const labelIndices: number[] = [];
          for (let i = 0; i < maxLabels && i < data.length; i++) {
            const index = Math.round((i * (data.length - 1)) / (maxLabels - 1));
            labelIndices.push(index);
          }
          const uniqueIndices = Array.from(new Set(labelIndices)).sort((a, b) => a - b);
          return uniqueIndices.map((index) => {
            const d = data[index];
            let label = '';
            if (timePeriod === 'daily') {
              if (dataLength <= 30) {
                const date = new Date(d.date);
                label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: dataLength <= 15 ? 'numeric' : undefined });
              } else {
                const date = new Date(d.date);
                label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }
            } else if (timePeriod === 'weekly') {
              if (dataLength <= 20) {
                const [year, week] = d.date.split('-W');
                const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              } else {
                const [year, week] = d.date.split('-W');
                const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }
            } else {
              label = d.date;
            }
            return (
              <text key={index} x={xScale(index)} y={margin.top + innerHeight + 25} textAnchor="middle" fill="#a0aec0" fontSize="8" transform={`rotate(-45 ${xScale(index)} ${margin.top + innerHeight + 25})`}>
                {label}
              </text>
            );
          });
        })()}
        {rangeStartIndex !== null && (
          <circle cx={xScale(rangeStartIndex)} cy={margin.top + innerHeight / 2} r="6" fill="#d4a574" stroke="#ffffff" strokeWidth="2" />
        )}
        {rangeEndIndex !== null && rangeStartIndex !== null && rangeEndIndex !== rangeStartIndex && (
          <>
            <circle cx={xScale(rangeEndIndex)} cy={margin.top + innerHeight / 2} r="6" fill="#d4a574" stroke="#ffffff" strokeWidth="2" />
            <line x1={xScale(Math.min(rangeStartIndex, rangeEndIndex))} y1={margin.top + innerHeight / 2} x2={xScale(Math.max(rangeStartIndex, rangeEndIndex))} y2={margin.top + innerHeight / 2} stroke="#d4a574" strokeWidth="3" opacity="0.7" />
          </>
        )}
        {/* Mobile hover info text inside chart */}
        {currentHoverIndex !== null && !isSettingRange && data[currentHoverIndex] && (() => {
          const hoverData = data[currentHoverIndex];
          const infoX = margin.left + 5;
          const infoY = margin.top + 12;
          const lineHeight = 12;
          
          // Calculate line positions
          let currentY = infoY;
          const lines: Array<{y: number, content: JSX.Element}> = [];
          
          // Date line
          lines.push({
            y: currentY,
            content: (
              <text key="date" x={infoX} y={currentY} fill="#d4a574" fontSize="10" fontWeight="bold">
                {hoverData.date}
              </text>
            )
          });
          currentY += lineHeight;
          
          // Ukraine line
          if (showUkraine) {
            lines.push({
              y: currentY,
              content: (
                <g key="ua">
                  <text x={infoX} y={currentY} fill="#0057B7" fontSize="9" fontWeight="bold">UA:</text>
                  <text x={infoX + 25} y={currentY} fill="#a0aec0" fontSize="9">
                    {(hoverData.ukraineTotal || 0).toLocaleString()}
                  </text>
                </g>
              )
            });
            currentY += lineHeight;
          }
          
          // Russia line
          if (showRussia) {
            lines.push({
              y: currentY,
              content: (
                <g key="ru">
                  <text x={infoX} y={currentY} fill="#DA291C" fontSize="9" fontWeight="bold">RU:</text>
                  <text x={infoX + 25} y={currentY} fill="#a0aec0" fontSize="9">
                    {(hoverData.russiaDeaths || 0).toLocaleString()}
                  </text>
                </g>
              )
            });
          }
          
          const totalHeight = lines.length * lineHeight + 6;
          // Calculate width based on content - ensure it fits the numbers
          const maxWidth = Math.max(
            120,
            Math.max(
              (hoverData.ukraineTotal || 0).toLocaleString().length * 6,
              (hoverData.russiaDeaths || 0).toLocaleString().length * 6
            ) + 30
          );
          
          return (
            <g>
              {/* Background rectangle */}
              <rect
                x={infoX - 3}
                y={infoY - 10}
                width={maxWidth}
                height={totalHeight}
                fill="#1b1b1b"
                fillOpacity="0.85"
                stroke="#d4a574"
                strokeWidth="1"
                rx="3"
              />
              {/* All text lines */}
              {lines.map(line => line.content)}
            </g>
          );
        })()}
      </svg>

      {/* Range selection buttons - visible on mobile */}
      <div className="mt-3 flex flex-col items-center gap-2">
        {!isSettingRange ? (
          <button
            onClick={() => {
              if (currentHoverIndex !== null) {
                setRangeStartIndex(currentHoverIndex);
                setRangeEndIndex(currentHoverIndex);
                setIsSettingRange(true);
                setCurrentHoverIndex(null);
              }
            }}
            disabled={currentHoverIndex === null}
            className="px-3 py-1.5 bg-primary text-background rounded text-xs md:text-sm font-medium hover:bg-primary/80 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Set Range Start
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-center">
              <p className="text-xs md:text-sm text-text-muted mb-1 md:mb-2">
                Range: {(() => {
                  const startDate = data[rangeStartIndex!]?.date;
                  const endDate = data[rangeEndIndex!]?.date;
                  if (timePeriod === 'weekly') {
                    const formatWeekDate = (dateStr: string) => {
                      const [year, week] = dateStr.split('-W');
                      const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                      return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                    };
                    return `${formatWeekDate(startDate)} to ${formatWeekDate(endDate)}`;
                  } else {
                    return `${startDate} to ${endDate}`;
                  }
                })()}
              </p>
              <p className="text-xs md:text-sm text-primary font-medium">Move finger to adjust end point, then confirm below</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const start = Math.min(rangeStartIndex!, rangeEndIndex!);
                  const end = Math.max(rangeStartIndex!, rangeEndIndex!);
                  const selectedData = data.slice(start, end + 1);
                  const ukraineTotal = selectedData.reduce((sum: number, d: ChartData) => sum + (showUkraine ? d.ukraineTotal : 0), 0);
                  const russiaTotal = selectedData.reduce((sum: number, d: ChartData) => sum + (showRussia ? d.russiaDeaths : 0), 0);
                  setSelectedRange({ start: data[start].date, end: data[end].date, data: selectedData, ukraineTotal, russiaTotal });
                  setIsSettingRange(false);
                  setRangeStartIndex(null);
                  setRangeEndIndex(null);
                  setCurrentHoverIndex(null);
                }}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs md:text-sm font-medium transition-colors"
              >
                Set Range End
              </button>
              <button
                onClick={() => { setIsSettingRange(false); setRangeStartIndex(null); setRangeEndIndex(null); setCurrentHoverIndex(null); }}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

type DesktopChartProps = {
  fullData: ChartData[];
  displayData: ChartData[];
  timePeriod: TimePeriod;
  showUkraine: boolean;
  showRussia: boolean;
  setHoverInfo: (info: HoverInfo | null) => void;
  setSelectedRange: (range: any) => void;
  setIsHoverInfoPinned: (pinned: boolean) => void;
  isHoverInfoPinned: boolean;
  setActiveFilter?: (filter: string | number | null) => void;
};

const DesktopChartMemo = memo(function DesktopChart({
  fullData,
  displayData,
  timePeriod,
  showUkraine,
  showRussia,
  setHoverInfo,
  setSelectedRange,
  setIsHoverInfoPinned,
  isHoverInfoPinned,
  setActiveFilter
}: DesktopChartProps) {
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [isSelectingDesktop, setIsSelectingDesktop] = useState<boolean>(false);

  const handleChartClick = useCallback((e: any) => {
    if (e && e.activeLabel) {
      if (!isSelectingDesktop) {
        setRefAreaLeft(e.activeLabel);
        setRefAreaRight('');
        setIsSelectingDesktop(true);
      } else {
        const left = refAreaLeft < e.activeLabel ? refAreaLeft : e.activeLabel;
        const right = refAreaLeft > e.activeLabel ? refAreaLeft : e.activeLabel;
        const filteredData = fullData.filter(item => item.date >= left && item.date <= right);
        const ukraineTotal = filteredData.reduce((sum: number, d: ChartData) => sum + (showUkraine ? d.ukraineTotal : 0), 0);
        const russiaTotal = filteredData.reduce((sum: number, d: ChartData) => sum + (showRussia ? d.russiaDeaths : 0), 0);
        setSelectedRange({ start: left, end: right, data: filteredData, ukraineTotal, russiaTotal });
        setRefAreaLeft('');
        setRefAreaRight('');
        setIsSelectingDesktop(false);
      }
    }
  }, [isSelectingDesktop, refAreaLeft, fullData, showUkraine, showRussia, setSelectedRange]);

    const handleChartMouseMove = useCallback((dataEvt: any) => {
      if (dataEvt && dataEvt.activePayload && dataEvt.activePayload.length > 0) {
        const payload = dataEvt.activePayload[0].payload;
        const ukrainePeriod = payload.ukraineTotal || 0;
        const russiaPeriod = payload.russiaDeaths || 0;
        const ukraineCumulative = payload.ukraineTotalCumulative || 0;
        const russiaCumulative = payload.russiaTotalCumulative || 0;
        const periodRatio = ukrainePeriod > 0 ? (russiaPeriod / ukrainePeriod).toFixed(2) : '0';
        const cumulativeRatio = ukraineCumulative > 0 ? (russiaCumulative / ukraineCumulative).toFixed(2) : '0';
        setHoverInfo({ data: payload, label: payload.date, periodRatio, cumulativeRatio });
        // Auto-pin when hovering (desktop mode)
        setIsHoverInfoPinned(true);
      }
      if (isSelectingDesktop && refAreaLeft && dataEvt && dataEvt.activeLabel) {
        setRefAreaRight(dataEvt.activeLabel);
      }
    }, [isSelectingDesktop, refAreaLeft, setHoverInfo]);

    const handleChartMouseLeave = useCallback(() => {
      // Don't clear hover info if it's pinned (only in desktop mode)
      if (!isHoverInfoPinned) {
        setHoverInfo(null);
      }
    }, [isHoverInfoPinned]);

  const cancelSelection = () => {
    setRefAreaLeft('');
    setRefAreaRight('');
    setIsSelectingDesktop(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        {isSelectingDesktop && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-30 bg-primary text-background px-3 py-1 rounded-full text-xs font-medium">
            Click on chart to set end point
            <button onClick={cancelSelection} className="ml-2 text-background/80 hover:text-background">✕</button>
          </div>
        )}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={displayData}
            onClick={handleChartClick}
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleChartMouseLeave}
            margin={{ top: 20, right: 80, left: 60, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
            <XAxis
              dataKey="date"
              stroke="#a0aec0"
              fontSize={12}
              interval={(() => {
                const dataLength = displayData.length;
                if (dataLength <= 15) return 0;
                if (dataLength <= 30) return 1;
                if (dataLength <= 60) return Math.floor(dataLength / 15);
                return Math.floor(dataLength / 12);
              })()}
              domain={['dataMin', 'dataMax']}
              scale="point"
              tickFormatter={(value) => {
                const dataLength = displayData.length;
                if (timePeriod === 'daily') {
                  if (dataLength <= 30) {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: dataLength <= 15 ? 'numeric' : undefined });
                  } else {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  }
                } else if (timePeriod === 'weekly') {
                  if (dataLength <= 20) {
                    const [year, week] = value.split('-W');
                    const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                    return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  } else {
                    const [year, week] = value.split('-W');
                    const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  }
                } else {
                  return value;
                }
              }}
            />
            <YAxis 
              yAxisId="period" 
              stroke="#a0aec0" 
              fontSize={12} 
              tickFormatter={(v) => {
                if (timePeriod === 'daily') return v.toString();
                if (timePeriod === 'weekly') return v.toString();
                return `${(v / 1000).toFixed(0)}k`;
              }}
              domain={
                timePeriod === 'daily' ? (_dataMin: any, _dataMax: any) => [0, 600] :
                timePeriod === 'weekly' ? (_dataMin: any, _dataMax: any) => [0, 2000] :
                undefined
              }
              ticks={
                timePeriod === 'daily' ? [0, 150, 300, 450, 600] :
                timePeriod === 'weekly' ? [0, 500, 1000, 1500, 2000] :
                undefined
              }
              allowDataOverflow={(timePeriod === 'daily' || timePeriod === 'weekly') ? true : false}
              width={50} 
              label={{ value: 'Period Losses', angle: -90, position: 'insideLeft', style: { fill: '#a0aec0', fontSize: 10 } }} 
            />
            <YAxis yAxisId="cumulative" orientation="right" stroke="#a0aec0" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={50} label={{ value: 'Cumulative', angle: 90, position: 'insideRight', style: { fill: '#a0aec0', fontSize: 10 } }} />
            <Tooltip content={() => null} cursor={false} />
            <Legend content={<CustomLegend />} />
            {refAreaLeft && refAreaRight && (
              <ReferenceArea yAxisId="period" x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#d4a574" fillOpacity={0.3} />
            )}
            {showUkraine && (
              <Line yAxisId="period" type="monotone" dataKey="ukraineTotal" stroke="#0057B7" strokeWidth={2} opacity={0.8} name="Ukraine Period" dot={timePeriod === 'monthly' ? { fill: '#0057B7', r: 3 } : false} activeDot={{ r: 5 }} isAnimationActive={!isSelectingDesktop} />
            )}
            {showRussia && (
              <Line yAxisId="period" type="monotone" dataKey="russiaDeaths" stroke="#DA291C" strokeWidth={2} opacity={0.8} name="Russia Period" dot={timePeriod === 'monthly' ? { fill: '#DA291C', r: 3 } : false} activeDot={{ r: 5 }} isAnimationActive={!isSelectingDesktop} />
            )}
            {showUkraine && (
              <Line yAxisId="cumulative" type="monotone" dataKey="ukraineTotalCumulative" stroke="#0057B7" strokeWidth={3} strokeDasharray="6 4" name="Ukraine Cumulative" dot={false} activeDot={{ r: 6 }} isAnimationActive={!isSelectingDesktop} />
            )}
            {showRussia && (
              <Line yAxisId="cumulative" type="monotone" dataKey="russiaTotalCumulative" stroke="#DA291C" strokeWidth={3} strokeDasharray="6 4" name="Russia Cumulative" dot={false} activeDot={{ r: 6 }} isAnimationActive={!isSelectingDesktop} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default function ChartEnhanced() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [selectedRange, setSelectedRange] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  
  // Country visibility toggles
  const [showUkraine, setShowUkraine] = useState(true);
  const [showRussia, setShowRussia] = useState(true);
  
  // Unified hover info state for both desktop and mobile
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [isHoverInfoPinned, setIsHoverInfoPinned] = useState<boolean>(false);
  
  // Slider state for daily data navigation
  const [sliderStart, setSliderStart] = useState<number>(0);
  const [sliderEnd, setSliderEnd] = useState<number>(100);
  const [isDraggingSlider, setIsDraggingSlider] = useState<'start' | 'end' | null>(null);
  
  // Active filter state (year number or battle name)
  const [activeFilter, setActiveFilter] = useState<string | number | null>(null);

  // Memoized hover info display component to prevent chart re-renders
  const HoverInfoDisplay = memo(({ info, timePeriod, showUkraine, showRussia, isMobile, onClose, selectedRange, chartData, handleManualDateChange, handleResetRange, convertMonthDisplayToInput, convertMonthInputToDisplay, activeFilter }: {
    info: any;
    timePeriod: TimePeriod;
    showUkraine: boolean;
    showRussia: boolean;
    isMobile: boolean;
    onClose?: () => void;
    selectedRange?: any;
    chartData?: ChartData[];
    handleManualDateChange?: (startDate: string, endDate: string) => void;
    handleResetRange?: () => void;
    convertMonthDisplayToInput?: (displayMonth: string) => string;
    convertMonthInputToDisplay?: (inputMonth: string) => string;
    activeFilter?: string | number | null;
  }) => {
    // If selectedRange exists, show range analysis instead of single date info
    if (selectedRange) {
      // Show range analysis
      const formatWeekDate = (dateStr: string) => {
        const [year, week] = dateStr.split('-W');
        const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
        return `Week of ${weekStart.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })}`;
      };

      const rangePeriodRatio = (() => {
        const ukraineTotal = selectedRange.ukraineTotal || 0;
        const russiaTotal = selectedRange.russiaTotal || 0;
        if (ukraineTotal === 0 || russiaTotal === 0) return { left: 0, right: 0 };
        if (russiaTotal <= ukraineTotal) {
          return { left: 1, right: Number((ukraineTotal / russiaTotal).toFixed(2)) };
        } else {
          return { left: Number((russiaTotal / ukraineTotal).toFixed(2)), right: 1 };
        }
      })();

      return (
        <div className="mt-4 p-3 bg-card-bg border border-border-color rounded-lg relative">
          {!isMobile && onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-background"
              aria-label="Close info box"
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </svg>
            </button>
          )}
          
          <div className="text-center mb-3">
            <p className="text-primary font-medium text-base mb-1">
              Selected Range Analysis
              {activeFilter && (
                <span className="text-text-muted font-normal">
                  {' '}({typeof activeFilter === 'number' ? `Year ${activeFilter}` : `Battle of ${activeFilter}`})
                </span>
              )}
            </p>
            <p className="text-text-muted text-sm mb-2">
              {timePeriod === 'weekly' ? `${formatWeekDate(selectedRange.start)} to ${formatWeekDate(selectedRange.end)}` : `${selectedRange.start} to ${selectedRange.end}`}
            </p>
            
            {/* Manual Period Input */}
            {timePeriod === 'daily' && handleManualDateChange && (
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-center">
                <div className="flex items-center gap-2">
                  <label className="text-text-muted text-sm">From:</label>
                  <input
                    type="date"
                    value={selectedRange.start}
                    min="2022-02-23"
                    max={chartData && chartData.length > 0 ? chartData[chartData.length - 1]?.date || "2025-12-31" : "2025-12-31"}
                    onChange={(e) => handleManualDateChange(e.target.value, selectedRange.end)}
                    className="px-2 py-1 text-sm bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-text-muted text-sm">To:</label>
                  <input
                    type="date"
                    value={selectedRange.end}
                    min="2022-02-23"
                    max={chartData && chartData.length > 0 ? chartData[chartData.length - 1]?.date || "2025-12-31" : "2025-12-31"}
                    onChange={(e) => handleManualDateChange(selectedRange.start, e.target.value)}
                    className="px-2 py-1 text-sm bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}
            
            {timePeriod === 'weekly' && handleManualDateChange && chartData && (
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-center">
                <div className="flex items-center gap-2">
                  <label className="text-text-muted text-sm">From:</label>
                  <select
                    value={selectedRange.start}
                    onChange={(e) => handleManualDateChange(e.target.value, selectedRange.end)}
                    className="px-2 py-1 text-sm bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {chartData.map((item) => {
                      const [year, week] = item.date.split('-W');
                      const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                      const readableDate = `Week of ${weekStart.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}`;
                      return (
                        <option key={item.date} value={item.date}>
                          {readableDate}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-text-muted text-sm">To:</label>
                  <select
                    value={selectedRange.end}
                    onChange={(e) => handleManualDateChange(selectedRange.start, e.target.value)}
                    className="px-2 py-1 text-sm bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {chartData.map((item) => {
                      const [year, week] = item.date.split('-W');
                      const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                      const readableDate = `Week of ${weekStart.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}`;
                      return (
                        <option key={item.date} value={item.date}>
                          {readableDate}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}
            
            {timePeriod === 'monthly' && handleManualDateChange && convertMonthDisplayToInput && convertMonthInputToDisplay && chartData && (
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-center">
                <div className="flex items-center gap-2">
                  <label className="text-text-muted text-sm">From:</label>
                  <input
                    type="month"
                    value={convertMonthDisplayToInput(selectedRange.start)}
                    min="2022-02"
                    max={convertMonthDisplayToInput(chartData[chartData.length - 1]?.date) || "2025-12"}
                    onChange={(e) => handleManualDateChange(convertMonthInputToDisplay(e.target.value), selectedRange.end)}
                    className="px-2 py-1 text-sm bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-text-muted text-sm">To:</label>
                  <input
                    type="month"
                    value={convertMonthDisplayToInput(selectedRange.end)}
                    min="2022-02"
                    max={convertMonthDisplayToInput(chartData[chartData.length - 1]?.date) || "2025-12"}
                    onChange={(e) => handleManualDateChange(selectedRange.start, convertMonthInputToDisplay(e.target.value))}
                    className="px-2 py-1 text-sm bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}
            
            {handleResetRange && (
              <button 
                onClick={handleResetRange}
                className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm whitespace-nowrap"
              >
                Reset to Full Range
              </button>
            )}
          </div>
          
          {/* Range Stats Grid - Period Totals */}
          <div className="mb-3">
            <p className="text-text-muted text-sm font-medium mb-2">Period Totals (in selected range)</p>
            <div className={`grid gap-2 ${showUkraine && showRussia ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {showUkraine && (
                <div className="bg-background rounded p-2">
                  <p className="text-text-muted text-sm">Ukraine Total</p>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: '#0057B7' }}>
                    {selectedRange.ukraineTotal?.toLocaleString()}
                  </p>
                </div>
              )}
              {showRussia && (
                <div className="bg-background rounded p-2">
                  <p className="text-text-muted text-sm">Russia Total</p>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: '#DA291C' }}>
                    {selectedRange.russiaTotal?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cumulative Totals at End of Range */}
          {selectedRange.data && selectedRange.data.length > 0 && (() => {
            const lastDataPoint = selectedRange.data[selectedRange.data.length - 1];
            return (
              <div className="mb-3">
                <p className="text-text-muted text-sm font-medium mb-2">Cumulative Totals (at end of range)</p>
                <div className={`grid gap-2 ${showUkraine && showRussia ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {showUkraine && (
                    <div className="bg-background rounded p-2">
                      <p className="text-text-muted text-sm">Ukraine Cumulative</p>
                      <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: '#0057B7' }}>
                        {(lastDataPoint.ukraineTotalCumulative || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {showRussia && (
                    <div className="bg-background rounded p-2">
                      <p className="text-text-muted text-sm">Russia Cumulative</p>
                      <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: '#DA291C' }}>
                        {(lastDataPoint.russiaTotalCumulative || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Additional Stats */}
          <div className={`grid gap-2 ${showUkraine && showRussia ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'} mb-3`}>
            <div className="bg-background rounded p-2">
              <p className="text-text-muted text-sm">
                {timePeriod === 'daily' ? 'Days in Range' : 
                 timePeriod === 'weekly' ? 'Weeks in Range' : 
                 'Months in Range'}
              </p>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-text-primary`}>
                {selectedRange.data.length}
              </p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-text-muted text-sm">
                {timePeriod === 'daily' ? 'Daily Average' : 
                 timePeriod === 'weekly' ? 'Weekly Average' : 
                 'Monthly Average'}
              </p>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-primary`}>
                {Math.round(((showUkraine ? selectedRange.ukraineTotal : 0) + (showRussia ? selectedRange.russiaTotal : 0)) / selectedRange.data.length).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Range Ratio */}
          {showUkraine && showRussia && (
            <div className="border-t border-border-color pt-2">
              <p className={`text-text-muted ${isMobile ? 'text-xs' : 'text-sm'} mb-1 text-center`}>
                Range Loss Ratio
              </p>
              <div className="bg-background rounded p-3 border border-border-color text-center">
                <span className="text-primary font-bold text-lg flex items-center justify-center gap-2">
                  <div className="russia-flag"></div>
                  {rangePeriodRatio.left} : {rangePeriodRatio.right}
                  <div className="ukraine-flag"></div>
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Show single date info when no range is selected
    if (!info) return null;
    
    // Helper function to format month name from date string (e.g., "Feb 2022" -> "February 2022")
    const formatMonthName = (dateStr: string): string => {
      if (timePeriod !== 'monthly') return '';
      
      // Handle format like "Feb 2022" or "Sep 2025"
      const monthAbbrMap: Record<string, string> = {
        'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
        'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
        'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
      };
      
      const parts = dateStr.split(' ');
      if (parts.length === 2) {
        const monthAbbr = parts[0];
        const year = parts[1];
        const fullMonth = monthAbbrMap[monthAbbr];
        if (fullMonth) {
          return `${fullMonth} ${year}`;
        }
      }
      
      // Fallback: try to parse as "YYYY-MM" format
      const [year, month] = dateStr.split('-');
      if (year && month) {
        const monthIndex = parseInt(month) - 1;
        if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex <= 11) {
          const date = new Date(parseInt(year), monthIndex, 1);
          return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
      }
      
      return '';
    };
    
    // Helper function to calculate ratio with lowest number always 1 on left
    const calculateRatio = (left: number, right: number): { left: number; right: number } => {
      if (left === 0 || right === 0) return { left: 0, right: 0 };
      if (left <= right) {
        return { left: 1, right: Number((right / left).toFixed(2)) };
      } else {
        return { left: Number((left / right).toFixed(2)), right: 1 };
      }
    };
    
    const periodRatio = calculateRatio(
      info.data.russiaDeaths || 0,
      info.data.ukraineTotal || 0
    );
    
    const monthName = timePeriod === 'monthly' ? formatMonthName(info.label) : '';
    
    return (
      <div className={`${isMobile ? 'mt-2 p-2' : 'mt-4 p-3'} bg-card-bg border border-border-color rounded-lg relative ${isMobile ? 'max-h-[40vh] overflow-y-auto' : ''}`}>
        {!isMobile && onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-background"
            aria-label="Close info box"
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        )}
        <div className={`text-center ${isMobile ? 'mb-2' : 'mb-3'}`}>
          <p className={`text-text-primary font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>
            {timePeriod === 'daily' ? `Daily Data - ${info.label}` : 
             timePeriod === 'weekly' ? (() => {
               const [year, week] = info.label.split('-W');
               const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
               return `Weekly Data - ${weekStart.toLocaleDateString('en-US', { 
                 month: 'short', 
                 day: 'numeric',
                 year: 'numeric'
               })}`;
             })() : 
             monthName || `Monthly Data - ${info.label}`}
          </p>
          {!isMobile && (
            <p className="text-text-muted text-sm">
              {timePeriod === 'daily' ? 'Losses recorded on this date' :
               timePeriod === 'weekly' ? 'Losses recorded during this week' :
               'Losses recorded during this month'}
            </p>
          )}
        </div>
        
        {/* Desktop/Mobile responsive layout */}
        <div className={`${isMobile ? 'flex gap-2' : 'flex gap-4'} ${isMobile ? 'mb-2' : 'mb-3'}`}>
          {/* Ukraine Data */}
          {showUkraine && (
            <div className="flex-1">
              <div className={`flex items-center gap-1 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                <div className="ukraine-flag"></div>
                <p className={`font-semibold ${isMobile ? 'text-xs' : 'text-base'}`} style={{ color: '#0057B7' }}>
                  {isMobile ? 'UA' : 'Ukraine'}
                </p>
              </div>
              <div className={`${isMobile ? 'space-y-0.5' : 'space-y-1'} ${isMobile ? 'text-xs' : 'text-base'}`}>
                <p className="text-text-muted">
                  <span className="font-medium">Total:</span> {(info.data.ukraineTotal || 0).toLocaleString()}
                </p>
                {!isMobile && (
                  <>
                    <p className="text-text-muted">
                      <span className="font-medium">Confirmed Deaths:</span> {(info.data.ukraineDeaths || 0).toLocaleString()}
                    </p>
                    <p className="text-text-muted">
                      <span className="font-medium">Missing:</span> {(info.data.ukraineMissing || 0).toLocaleString()}
                    </p>
                  </>
                )}
                <div className="border-t border-border-color pt-1 mt-1">
                  <p className={`text-text-primary font-semibold ${isMobile ? 'text-xs' : 'text-base'}`}>
                    Cumulative: {(info.data.ukraineTotalCumulative || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Divider */}
          {showUkraine && showRussia && (
            <div className="w-px bg-border-color"></div>
          )}
          
          {/* Russia Data */}
          {showRussia && (
            <div className="flex-1">
              <div className={`flex items-center gap-1 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                <div className="russia-flag"></div>
                <p className={`font-semibold ${isMobile ? 'text-xs' : 'text-base'}`} style={{ color: '#DA291C' }}>
                  {isMobile ? 'RU' : 'Russia'}
                </p>
              </div>
              <div className={`${isMobile ? 'space-y-0.5' : 'space-y-1'} ${isMobile ? 'text-xs' : 'text-base'}`}>
                <p className="text-text-muted">
                  <span className="font-medium">Total:</span> {(info.data.russiaDeaths || 0).toLocaleString()}
                </p>
                <div className="border-t border-border-color pt-1 mt-1">
                  <p className={`text-text-primary font-semibold ${isMobile ? 'text-xs' : 'text-base'}`}>
                    Cumulative: {(info.data.russiaTotalCumulative || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Ratios */}
        {showUkraine && showRussia && (
          <div className={`border-t border-border-color ${isMobile ? 'pt-1' : 'pt-2'}`}>
            <p className={`text-text-muted ${isMobile ? 'text-xs' : 'text-sm'} ${isMobile ? 'mb-0.5' : 'mb-1'} text-center`}>
              {timePeriod === 'monthly' && monthName ? monthName : 'Loss Ratio'}
            </p>
            <div className={`bg-background rounded ${isMobile ? 'p-2' : 'p-3'} border border-border-color text-center`}>
              <span className={`text-primary font-bold ${isMobile ? 'text-sm' : 'text-lg'} flex items-center justify-center gap-2`}>
                <div className="russia-flag"></div>
                {periodRatio.left} : {periodRatio.right}
                <div className="ukraine-flag"></div>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const data = timePeriod === 'daily' 
      ? hardcodedChartData.daily 
      : timePeriod === 'weekly' 
        ? hardcodedChartData.weekly 
        : hardcodedChartData.monthly;
    
    setChartData(data);
    
    // Set default selected range to full data range
    if (data && data.length > 0) {
      const ukraineTotal = data.reduce((sum: number, d: ChartData) => sum + d.ukraineTotal, 0);
      const russiaTotal = data.reduce((sum: number, d: ChartData) => sum + d.russiaDeaths, 0);
      
      setSelectedRange({
        start: data[0].date,
        end: data[data.length - 1].date,
        data: data,
        ukraineTotal,
        russiaTotal
      });
      
      // Reset slider for all time periods
      setSliderStart(0);
      setSliderEnd(100);
      // Clear active filter when time period changes
      setActiveFilter(null);
    }
    
    setLoading(false);
  }, [timePeriod]);
  
  // Update selected range when slider changes (for all time periods)
  useEffect(() => {
    if (chartData.length > 0) {
      const startIndex = Math.floor((sliderStart / 100) * chartData.length);
      const endIndex = Math.floor((sliderEnd / 100) * chartData.length);
      const clampedStartIndex = Math.max(0, Math.min(startIndex, chartData.length - 1));
      const clampedEndIndex = Math.max(0, Math.min(endIndex, chartData.length - 1));
      
      const start = Math.min(clampedStartIndex, clampedEndIndex);
      const end = Math.max(clampedStartIndex, clampedEndIndex);
      
      const filteredData = chartData.slice(start, end + 1);
      const ukraineTotal = filteredData.reduce((sum: number, d: ChartData) => sum + (showUkraine ? d.ukraineTotal : 0), 0);
      const russiaTotal = filteredData.reduce((sum: number, d: ChartData) => sum + (showRussia ? d.russiaDeaths : 0), 0);
      
      setSelectedRange({
        start: chartData[start].date,
        end: chartData[end].date,
        data: filteredData,
        ukraineTotal,
        russiaTotal
      });
    }
  }, [sliderStart, sliderEnd, timePeriod, chartData, showUkraine, showRussia]);

  // Helper functions for month format conversion
  const convertMonthDisplayToInput = (displayMonth: string): string => {
    if (!displayMonth) return "";
    
    // Convert "Feb 2022" to "2022-02"
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = displayMonth.split(' ');
    if (parts.length !== 2) return "";
    
    const monthIndex = monthNames.indexOf(parts[0]);
    if (monthIndex === -1) return "";
    
    const year = parts[1];
    const month = String(monthIndex + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const convertMonthInputToDisplay = (inputMonth: string): string => {
    if (!inputMonth) return "";
    
    // Convert "2022-02" to "Feb 2022"
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = inputMonth.split('-');
    if (parts.length !== 2) return "";
    
    const year = parts[0];
    const monthIndex = parseInt(parts[1]) - 1;
    if (monthIndex < 0 || monthIndex > 11) return "";
    
    return `${monthNames[monthIndex]} ${year}`;
  };

  // Handler for manual date range changes
  const handleManualDateChange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate || startDate > endDate) return;
    
    const filteredData = chartData.filter(
      item => item.date >= startDate && item.date <= endDate
    );
    
    if (filteredData.length === 0) return;
    
    const ukraineTotal = filteredData.reduce((sum: number, d: ChartData) => sum + d.ukraineTotal, 0);
    const russiaTotal = filteredData.reduce((sum: number, d: ChartData) => sum + d.russiaDeaths, 0);
    
    setSelectedRange({
      start: startDate,
      end: endDate,
      data: filteredData,
      ukraineTotal,
      russiaTotal
    });
    
    // Clear active filter when manually changing dates
    setActiveFilter(null);
    
    // Sync slider with manual date changes (for daily data)
    if (timePeriod === 'daily' && chartData.length > 0) {
      const startIndex = chartData.findIndex(d => d.date >= startDate);
      const endIndex = chartData.findIndex(d => d.date >= endDate);
      if (startIndex !== -1 && endIndex !== -1) {
        const newStart = (startIndex / chartData.length) * 100;
        const newEnd = (endIndex / chartData.length) * 100;
        setSliderStart(newStart);
        setSliderEnd(newEnd);
      }
    }
  };

  // Handler for resetting to full range
  const handleResetRange = () => {
    if (chartData && chartData.length > 0) {
      const ukraineTotal = chartData.reduce((sum: number, d: ChartData) => sum + d.ukraineTotal, 0);
      const russiaTotal = chartData.reduce((sum: number, d: ChartData) => sum + d.russiaDeaths, 0);
      
      setSelectedRange({
        start: chartData[0].date,
        end: chartData[chartData.length - 1].date,
        data: chartData,
        ukraineTotal,
        russiaTotal
      });
      
      // Clear active filter when resetting
      setActiveFilter(null);
      setSliderStart(0);
      setSliderEnd(100);
    }
  };

  // Mobile-specific SVG rendering (hoisted as MobileChartMemo)
  const MobileChart = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    
    // Track touch position instead of index for smoother interaction
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    
    // Mobile corner info state - now using unified hoverInfo
    const [rangeStartIndex, setRangeStartIndex] = useState<number | null>(null);
    const [rangeEndIndex, setRangeEndIndex] = useState<number | null>(null);
    const [isSettingRange, setIsSettingRange] = useState(false);
    const [currentHoverIndex, setCurrentHoverIndex] = useState<number | null>(null);

    useEffect(() => {
      const updateWidth = () => {
        const viewportWidth = window.innerWidth;
        const safeWidth = Math.max(viewportWidth - 64, 280);
        setContainerWidth(safeWidth);
      };
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const width = containerWidth;
    const height = timePeriod === 'daily' ? 450 : 350;
    const margin = { top: 20, right: 40, bottom: 55, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const data = selectedRange ? selectedRange.data : chartData;
    if (!data || data.length === 0) return null;

    const xMin = 0;
    const xMax = data.length - 1;
    const yMaxPeriod = timePeriod === 'daily' ? 600 : timePeriod === 'weekly' ? 2000 : Math.max(...data.map((d: ChartData) => Math.max(d.ukraineTotal, d.russiaDeaths)));
    const yMaxCum = Math.max(...data.map((d: ChartData) => Math.max(d.ukraineTotalCumulative, d.russiaTotalCumulative)));

    const X_PAD = 8;
    const xScale = (index: number) => margin.left + (index / xMax) * (innerWidth - X_PAD);
    const yScalePeriod = (value: number) => {
      // For daily charts, clamp values at 600 so they appear at the top edge
      const clampedValue = timePeriod === 'daily' ? Math.min(value, yMaxPeriod) : value;
      return margin.top + innerHeight - (clampedValue / yMaxPeriod) * innerHeight;
    };
    const yScaleCum = (value: number) => margin.top + innerHeight - (value / yMaxCum) * innerHeight;

    // Convert X position to data index
    const xToIndex = (x: number) => {
      const relativeX = x - margin.left;
      const index = Math.round((relativeX / (innerWidth - X_PAD)) * xMax);
      return Math.max(0, Math.min(xMax, index));
    };

    // Use native event listeners to avoid passive event listener warning
    useEffect(() => {
      const svg = svgRef.current;
      if (!svg) return;

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const rect = svg.getBoundingClientRect();
        if (!rect) return;
        const x = touch.clientX - rect.left;
        if (x >= margin.left && x <= margin.left + innerWidth - X_PAD) {
          const touchIndex = xToIndex(x);
          const touchedData = data[touchIndex];
          const ukrainePeriod = touchedData.ukraineTotal || 0;
          const russiaPeriod = touchedData.russiaDeaths || 0;
          const ukraineCumulative = touchedData.ukraineTotalCumulative || 0;
          const russiaCumulative = touchedData.russiaTotalCumulative || 0;
          const periodRatio = ukrainePeriod > 0 ? (russiaPeriod / ukrainePeriod).toFixed(2) : '0';
          const cumulativeRatio = ukraineCumulative > 0 ? (russiaCumulative / ukraineCumulative).toFixed(2) : '0';
          setHoverInfo({
            data: touchedData,
            label: touchedData.date,
            periodRatio,
            cumulativeRatio
          });
          setCurrentHoverIndex(touchIndex);
          if (isSettingRange && rangeStartIndex !== null) {
            setRangeEndIndex(touchIndex);
          }
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const rect = svg.getBoundingClientRect();
        if (!rect) return;
        const x = touch.clientX - rect.left;
        if (x >= margin.left && x <= margin.left + innerWidth - X_PAD) {
          const touchIndex = xToIndex(x);
          const touchedData = data[touchIndex];
          const ukrainePeriod = touchedData.ukraineTotal || 0;
          const russiaPeriod = touchedData.russiaDeaths || 0;
          const ukraineCumulative = touchedData.ukraineTotalCumulative || 0;
          const russiaCumulative = touchedData.russiaTotalCumulative || 0;
          const periodRatio = ukrainePeriod > 0 ? (russiaPeriod / ukrainePeriod).toFixed(2) : '0';
          const cumulativeRatio = ukraineCumulative > 0 ? (russiaCumulative / ukraineCumulative).toFixed(2) : '0';
          setHoverInfo({
            data: touchedData,
            label: touchedData.date,
            periodRatio,
            cumulativeRatio
          });
          setCurrentHoverIndex(touchIndex);
          if (isSettingRange && rangeStartIndex !== null) {
            setRangeEndIndex(touchIndex);
          }
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        // Keep corner info visible (no timeout needed)
        // Keep hover line visible - don't clear currentHoverIndex
        // It will be cleared when user touches elsewhere or clicks "Set Range Start"
      };

      const handleTouchCancel = (e: TouchEvent) => {
        e.preventDefault();
      };

      svg.addEventListener('touchstart', handleTouchStart, { passive: false });
      svg.addEventListener('touchmove', handleTouchMove, { passive: false });
      svg.addEventListener('touchend', handleTouchEnd, { passive: false });
      svg.addEventListener('touchcancel', handleTouchCancel, { passive: false });

      return () => {
        svg.removeEventListener('touchstart', handleTouchStart);
        svg.removeEventListener('touchmove', handleTouchMove);
        svg.removeEventListener('touchend', handleTouchEnd);
        svg.removeEventListener('touchcancel', handleTouchCancel);
      };
    }, [data, margin, innerWidth, xToIndex, isSettingRange, rangeStartIndex, margin.left, X_PAD, setHoverInfo, setCurrentHoverIndex, setRangeEndIndex]);

    // Get hover line (like desktop)
    const getHoverLine = () => {
      if (currentHoverIndex !== null && !isSettingRange) {
        return {
          x: xScale(currentHoverIndex),
          y: margin.top,
          height: innerHeight
        };
      }
      return null;
    };

    // Get selection rectangle (range mode)
    const getSelectionRect = () => {
      if (isSettingRange && rangeStartIndex !== null && rangeEndIndex !== null) {
        const x1 = xScale(Math.min(rangeStartIndex, rangeEndIndex));
        const x2 = xScale(Math.max(rangeStartIndex, rangeEndIndex));
        const width = Math.max(x2 - x1, 2);
        
        return {
          x: x1,
          width: width,
          y: margin.top,
          height: innerHeight
        };
      }
      return null;
    };

    const selectionRect = getSelectionRect();

    return (
      <div className="w-full relative">
        <svg 
          ref={svgRef}
          width={width} 
          height={height}
          style={{ 
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <line
              key={i}
              x1={margin.left}
              y1={margin.top + (innerHeight / 5) * i}
              x2={margin.left + innerWidth - X_PAD}
              y2={margin.top + (innerHeight / 5) * i}
              stroke="#3d3d3d"
              strokeWidth="1"
            />
          ))}

          {/* Hover line (like desktop) */}
          {(() => {
            const hoverLine = getHoverLine();
            return hoverLine && (
              <line
                x1={hoverLine.x}
                y1={hoverLine.y}
                x2={hoverLine.x}
                y2={hoverLine.y + hoverLine.height}
                stroke="#d4a574"
                strokeWidth="2"
                strokeDasharray="4,2"
                opacity="0.8"
              />
            );
          })()}
          
          {/* Selection area (range mode) */}
          {selectionRect && (
            <rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              fill="#d4a574"
              fillOpacity="0.3"
              stroke="#d4a574"
              strokeWidth="2"
              strokeDasharray="6,3"
            />
          )}

          {/* Ukraine Period Line */}
          {showUkraine && data.length > 1 && (
            <path
              d={`M ${data.map((d: ChartData, i: number) => 
                `${xScale(i)},${yScalePeriod(d.ukraineTotal)}`
              ).join(' L ')}`}
              fill="none"
              stroke="#0057B7"
              strokeWidth="2"
              opacity="0.8"
            />
          )}

          {/* Russia Period Line */}
          {showRussia && data.length > 1 && (
            <path
              d={`M ${data.map((d: ChartData, i: number) => 
                `${xScale(i)},${yScalePeriod(d.russiaDeaths)}`
              ).join(' L ')}`}
              fill="none"
              stroke="#DA291C"
              strokeWidth="2"
              opacity="0.8"
            />
          )}

          {/* Ukraine Cumulative Line */}
          {showUkraine && data.length > 1 && (
            <path
              d={`M ${data.map((d: ChartData, i: number) => 
                `${xScale(i)},${yScaleCum(d.ukraineTotalCumulative)}`
              ).join(' L ')}`}
              fill="none"
              stroke="#0057B7"
              strokeWidth="3"
              strokeDasharray="6,4"
            />
          )}

          {/* Russia Cumulative Line */}
          {showRussia && data.length > 1 && (
            <path
              d={`M ${data.map((d: ChartData, i: number) => 
                `${xScale(i)},${yScaleCum(d.russiaTotalCumulative)}`
              ).join(' L ')}`}
              fill="none"
              stroke="#DA291C"
              strokeWidth="3"
              strokeDasharray="6,4"
            />
          )}

          {/* X-axis */}
          <line
            x1={margin.left}
            y1={margin.top + innerHeight}
            x2={margin.left + innerWidth - X_PAD}
            y2={margin.top + innerHeight}
            stroke="#a0aec0"
          />

          {/* Y-axes */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + innerHeight}
            stroke="#a0aec0"
          />
          
          {/* Right Y-axis */}
          <line
            x1={margin.left + innerWidth - X_PAD}
            y1={margin.top}
            x2={margin.left + innerWidth - X_PAD}
            y2={margin.top + innerHeight}
            stroke="#a0aec0"
          />

          {/* Left Y-axis labels (Period) */}
          {timePeriod === 'daily' ? (
            [0, 150, 300, 450, 600].map((value, i) => (
              <text
                key={i}
                x={margin.left - 5}
                y={margin.top + innerHeight - (value / yMaxPeriod) * innerHeight + 4}
                textAnchor="end"
                fill="#a0aec0"
                fontSize="8"
              >
                {value}
              </text>
            ))
          ) : timePeriod === 'weekly' ? (
            [0, 500, 1000, 1500, 2000].map((value, i) => (
              <text
                key={i}
                x={margin.left - 5}
                y={margin.top + innerHeight - (value / yMaxPeriod) * innerHeight + 4}
                textAnchor="end"
                fill="#a0aec0"
                fontSize="8"
              >
                {value}
              </text>
            ))
          ) : (
            [0, 1, 2, 3, 4].map(i => (
              <text
                key={i}
                x={margin.left - 5}
                y={margin.top + (innerHeight / 4) * i + 4}
                textAnchor="end"
                fill="#a0aec0"
                fontSize="8"
              >
                {Math.round((yMaxPeriod / 4) * (4 - i) / 1000)}k
              </text>
            ))
          )}

          {/* Right Y-axis labels (Cumulative) */}
          {[0, 1, 2, 3, 4].map(i => (
            <text
              key={`cum-${i}`}
              x={margin.left + innerWidth - X_PAD + 2}
              y={margin.top + (innerHeight / 4) * i + 4}
              textAnchor="start"
              fill="#a0aec0"
              fontSize="8"
            >
              {Math.round((yMaxCum / 4) * (4 - i) / 1000)}k
            </text>
          ))}

          {/* X-axis labels */}
          {(() => {
            // Dynamic label count based on data size
            const dataLength = data.length;
            const maxLabels = dataLength <= 15 ? dataLength : dataLength <= 30 ? 8 : 10;
            const labelIndices = [];
            
            // Generate evenly spaced indices, avoiding first/last overlap issues
            for (let i = 0; i < maxLabels && i < data.length; i++) {
              const index = Math.round((i * (data.length - 1)) / (maxLabels - 1));
              labelIndices.push(index);
            }
            
            // Remove duplicates and sort
            const uniqueIndices = Array.from(new Set(labelIndices)).sort((a, b) => a - b);
            
            return uniqueIndices.map((index) => {
              const d = data[index];
              let label = '';
              
              if (timePeriod === 'daily') {
                if (dataLength <= 30) {
                  // Show full dates for small selections
                  const date = new Date(d.date);
                  label = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: dataLength <= 15 ? 'numeric' : undefined 
                  });
                } else {
                  // Show month/year for larger selections
                  const date = new Date(d.date);
                  label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }
              } else if (timePeriod === 'weekly') {
                if (dataLength <= 20) {
                  // Show week start dates for small selections
                  const [year, week] = d.date.split('-W');
                  const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                  label = weekStart.toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                } else {
                  // Show month/year for larger selections
                  const [year, week] = d.date.split('-W');
                  const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                  label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }
              } else {
                // Monthly: "MMM YYYY" format already
                label = d.date;
              }
              
              return (
                <text
                  key={index}
                  x={xScale(index)}
                  y={margin.top + innerHeight + 25}
                  textAnchor="middle"
                  fill="#a0aec0"
                  fontSize="8"
                  transform={`rotate(-45 ${xScale(index)} ${margin.top + innerHeight + 25})`}
                >
                  {label}
                </text>
              );
            });
          })()}
          
          {/* Range indicators */}
          {rangeStartIndex !== null && (
            <circle
              cx={xScale(rangeStartIndex)}
              cy={margin.top + innerHeight / 2}
              r="6"
              fill="#d4a574"
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
          {rangeEndIndex !== null && rangeStartIndex !== null && rangeEndIndex !== rangeStartIndex && (
            <>
              <circle
                cx={xScale(rangeEndIndex)}
                cy={margin.top + innerHeight / 2}
                r="6"
                fill="#d4a574"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Range connection line */}
              <line
                x1={xScale(Math.min(rangeStartIndex, rangeEndIndex))}
                y1={margin.top + innerHeight / 2}
                x2={xScale(Math.max(rangeStartIndex, rangeEndIndex))}
                y2={margin.top + innerHeight / 2}
                stroke="#d4a574"
                strokeWidth="3"
                opacity="0.7"
              />
            </>
          )}
        </svg>
        
        
        {/* Range selection controls - proper workflow */}
        <div className="mt-3 flex flex-col items-center gap-2">
          {!isSettingRange ? (
            <button
              onClick={() => {
                if (currentHoverIndex !== null) {
                  // Fix the current hover position as start point
                  setRangeStartIndex(currentHoverIndex);
                  setRangeEndIndex(currentHoverIndex);
                  setIsSettingRange(true);
                  // Clear hover line since we're now in range mode
                  setCurrentHoverIndex(null);
                }
              }}
              disabled={currentHoverIndex === null}
              className="px-3 py-1.5 bg-primary text-background rounded text-xs font-medium hover:bg-primary/80 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Set Range Start
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Show current selection info */}
              <div className="text-center">
                <p className="text-xs text-text-muted mb-2">
                  Range: {(() => {
                    const startDate = data[rangeStartIndex!]?.date;
                    const endDate = data[rangeEndIndex!]?.date;
                    
                    if (timePeriod === 'weekly') {
                      const formatWeekDate = (dateStr: string) => {
                        const [year, week] = dateStr.split('-W');
                        const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                        return `Week of ${weekStart.toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}`;
                      };
                      return `${formatWeekDate(startDate)} to ${formatWeekDate(endDate)}`;
                    } else {
                      return `${startDate} to ${endDate}`;
                    }
                  })()}
                </p>
                <p className="text-xs text-primary font-medium">
                  Move finger to adjust end point, then confirm below
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const start = Math.min(rangeStartIndex!, rangeEndIndex!);
                    const end = Math.max(rangeStartIndex!, rangeEndIndex!);
                    const selectedData = data.slice(start, end + 1);
                    
                    const ukraineTotal = selectedData.reduce((sum: number, d: ChartData) => 
                      sum + (showUkraine ? d.ukraineTotal : 0), 0);
                    const russiaTotal = selectedData.reduce((sum: number, d: ChartData) => 
                      sum + (showRussia ? d.russiaDeaths : 0), 0);
                    
                    setSelectedRange({
                      start: data[start].date,
                      end: data[end].date,
                      data: selectedData,
                      ukraineTotal,
                      russiaTotal
                    });
                    
                    // Reset range selection mode
                    setIsSettingRange(false);
                    setRangeStartIndex(null);
                    setRangeEndIndex(null);
                    setCurrentHoverIndex(null);
                  }}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium transition-colors"
                >
                  Set Range End
                </button>
                
                <button
                  onClick={() => {
                    setIsSettingRange(false);
                    setRangeStartIndex(null);
                    setRangeEndIndex(null);
                    setCurrentHoverIndex(null);
                  }}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        

      </div>
    );
  };

  // Desktop chart (existing Recharts implementation) (hoisted as DesktopChartMemo)
  const DesktopChart = () => {
    const [refAreaLeft, setRefAreaLeft] = useState<string>('');
    const [refAreaRight, setRefAreaRight] = useState<string>('');
    const [isSelectingDesktop, setIsSelectingDesktop] = useState<boolean>(false);
    
    // State for corner info panel - now using unified hoverInfo

    // Click-based range selection for desktop - memoized to prevent re-renders
    const handleChartClick = useCallback((e: any) => {
      if (e && e.activeLabel) {
        if (!isSelectingDesktop) {
          // First click - start selection
          setRefAreaLeft(e.activeLabel);
          setRefAreaRight('');
          setIsSelectingDesktop(true);
        } else {
          // Second click - end selection
          const left = refAreaLeft < e.activeLabel ? refAreaLeft : e.activeLabel;
          const right = refAreaLeft > e.activeLabel ? refAreaLeft : e.activeLabel;
          
          const filteredData = chartData.filter(
            item => item.date >= left && item.date <= right
          );
          
          const ukraineTotal = filteredData.reduce((sum: number, d: ChartData) => 
            sum + (showUkraine ? d.ukraineTotal : 0), 0);
          const russiaTotal = filteredData.reduce((sum: number, d: ChartData) => 
            sum + (showRussia ? d.russiaDeaths : 0), 0);
          
          setSelectedRange({
            start: left,
            end: right,
            data: filteredData,
            ukraineTotal,
            russiaTotal
          });
          
          // Clear filter when range is selected via chart clicks
          if (setActiveFilter) {
            setActiveFilter(null);
          }
          
          // Reset selection state
          setRefAreaLeft('');
          setRefAreaRight('');
          setIsSelectingDesktop(false);
        }
      }
    }, [isSelectingDesktop, refAreaLeft, chartData, showUkraine, showRussia, setSelectedRange, setActiveFilter]);

    // Handle chart hover to update corner info - memoized to prevent re-renders
    const handleChartMouseMove = useCallback((data: any) => {
      if (data && data.activePayload && data.activePayload.length > 0) {
        const payload = data.activePayload[0].payload;
        
        // Calculate ratios (Russia:Ukraine)
        const ukrainePeriod = payload.ukraineTotal || 0;
        const russiaPeriod = payload.russiaDeaths || 0;
        const ukraineCumulative = payload.ukraineTotalCumulative || 0;
        const russiaCumulative = payload.russiaTotalCumulative || 0;
        
        const periodRatio = ukrainePeriod > 0 ? (russiaPeriod / ukrainePeriod).toFixed(2) : '0';
        const cumulativeRatio = ukraineCumulative > 0 ? (russiaCumulative / ukraineCumulative).toFixed(2) : '0';
        
        setHoverInfo({
          data: payload,
          label: payload.date,
          periodRatio,
          cumulativeRatio
        });
        // Auto-pin when hovering (only in desktop mode)
        setIsHoverInfoPinned(true);
      }
      
      // Handle selection preview
      if (isSelectingDesktop && refAreaLeft && data && data.activeLabel) {
        setRefAreaRight(data.activeLabel);
      }
    }, [isSelectingDesktop, refAreaLeft]);

    const handleChartMouseLeave = useCallback(() => {
      // Don't clear hover info if it's pinned (only in desktop mode)
      if (!isHoverInfoPinned) {
        setHoverInfo(null);
      }
    }, [isHoverInfoPinned]);

    const cancelSelection = () => {
      setRefAreaLeft('');
      setRefAreaRight('');
      setIsSelectingDesktop(false);
    };


    // Memoize displayData to prevent unnecessary chart re-renders when only selection state changes
    const displayData = useMemo(() => {
      return selectedRange ? selectedRange.data : chartData;
    }, [selectedRange, chartData]);

    return (
      <div className="relative">
        <div className="relative">
          {/* Desktop selection status */}
          {isSelectingDesktop && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-30
                            bg-primary text-background px-3 py-1 rounded-full text-xs font-medium">
              Click on chart to set end point
              <button 
                onClick={cancelSelection}
                className="ml-2 text-background/80 hover:text-background"
              >
                ✕
              </button>
            </div>
          )}
          
          <ResponsiveContainer width="100%" height={timePeriod === 'daily' ? 600 : 400}>
          <LineChart 
            data={displayData}
            onClick={handleChartClick}
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleChartMouseLeave}
            margin={{ 
              top: 20, 
              right: 80, 
              left: 60, 
              bottom: 40 
            }}
          >
        <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
        
        {/* X-Axis */}
        <XAxis 
          dataKey="date" 
          stroke="#a0aec0" 
          fontSize={12}
          interval={(() => {
            // Dynamic interval based on data size and selection
            const dataLength = displayData.length;
            if (dataLength <= 15) return 0; // Show all labels for small selections
            if (dataLength <= 30) return 1; // Show every 2nd label
            if (dataLength <= 60) return Math.floor(dataLength / 15); // Show ~15 labels
            return Math.floor(dataLength / 12); // Show ~12 labels for large selections
          })()}
          domain={['dataMin', 'dataMax']}
          scale="point"
          tickFormatter={(value) => {
            const dataLength = displayData.length;
            
            if (timePeriod === 'daily') {
              if (dataLength <= 30) {
                // Show full dates for small selections (30 days or less)
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: dataLength <= 15 ? 'numeric' : undefined 
                });
              } else {
                // Show month/year for larger selections
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }
            } else if (timePeriod === 'weekly') {
              if (dataLength <= 20) {
                // Show week start dates for small selections (20 weeks or less)
                const [year, week] = value.split('-W');
                const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                return weekStart.toLocaleDateString('en-US', { 
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
              } else {
                // Show month/year for larger selections
                const [year, week] = value.split('-W');
                const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }
            } else {
              // Monthly: always show "MMM YYYY"
              return value;
            }
          }}
        />
        
        {/* Left Y-Axis for Period Data */}
        <YAxis 
          yAxisId="period"
          stroke="#a0aec0" 
          fontSize={12}
          tickFormatter={(value) => {
            if (timePeriod === 'daily') return value.toString();
            if (timePeriod === 'weekly') return value.toString();
            return `${(value / 1000).toFixed(0)}k`;
          }}
          domain={
            timePeriod === 'daily' ? (_dataMin: any, _dataMax: any) => [0, 600] :
            timePeriod === 'weekly' ? (_dataMin: any, _dataMax: any) => [0, 2000] :
            undefined
          }
          ticks={
            timePeriod === 'daily' ? [0, 150, 300, 450, 600] :
            timePeriod === 'weekly' ? [0, 500, 1000, 1500, 2000] :
            undefined
          }
          allowDataOverflow={(timePeriod === 'daily' || timePeriod === 'weekly') ? true : false}
          width={50}
          label={{ 
            value: 'Period Losses', 
            angle: -90, 
            position: 'insideLeft',
            style: { fill: '#a0aec0', fontSize: 10 }
          }}
        />
        
        {/* Right Y-Axis for Cumulative Data */}
        <YAxis 
          yAxisId="cumulative"
          orientation="right"
          stroke="#a0aec0" 
          fontSize={12}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          width={50}
          label={{ 
            value: 'Cumulative', 
            angle: 90, 
            position: 'insideRight',
            style: { fill: '#a0aec0', fontSize: 10 }
          }}
        />
        
        <Tooltip 
          content={() => null}
          cursor={false}
        />
        
        <Legend content={<CustomLegend />} />
        
        {/* Reference Area for Selection */}
        {refAreaLeft && refAreaRight && (
          <ReferenceArea
            yAxisId="period"
            x1={refAreaLeft}
            x2={refAreaRight}
            strokeOpacity={0.3}
            fill="#d4a574"
            fillOpacity={0.3}
          />
        )}
        
        {/* Period Lines (Thinner, Semi-transparent) */}
        {showUkraine && (
          <Line 
            yAxisId="period"
            type="monotone" 
            dataKey="ukraineTotal" 
            stroke="#0057B7" 
            strokeWidth={2}
            opacity={0.8}
            name="Ukraine Period"
            dot={timePeriod === 'monthly' ? { fill: '#0057B7', r: 3 } : false}
            activeDot={{ r: 5 }}
            isAnimationActive={!isSelectingDesktop}
          />
        )}
        
        {showRussia && (
          <Line 
            yAxisId="period"
            type="monotone" 
            dataKey="russiaDeaths" 
            stroke="#DA291C" 
            strokeWidth={2}
            opacity={0.8}
            name="Russia Period"
            dot={timePeriod === 'monthly' ? { fill: '#DA291C', r: 3 } : false}
            activeDot={{ r: 5 }}
            isAnimationActive={!isSelectingDesktop}
          />
        )}
        
        {/* Cumulative Lines (Thicker, Dotted) */}
        {showUkraine && (
          <Line 
            yAxisId="cumulative"
            type="monotone" 
            dataKey="ukraineTotalCumulative" 
            stroke="#0057B7" 
            strokeWidth={3}
            strokeDasharray="6 4"
            name="Ukraine Cumulative"
            dot={false}
            activeDot={{ r: 6 }}
            isAnimationActive={!isSelectingDesktop}
          />
        )}
        
        {showRussia && (
          <Line 
            yAxisId="cumulative"
            type="monotone" 
            dataKey="russiaTotalCumulative" 
            stroke="#DA291C" 
            strokeWidth={3}
            strokeDasharray="6 4"
            name="Russia Cumulative"
            dot={false}
            activeDot={{ r: 6 }}
            isAnimationActive={!isSelectingDesktop}
          />
        )}
        </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-96 bg-card-bg border border-border-color rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handler to clear tooltip when mouse leaves the chart container
  const handleChartContainerMouseLeave = () => {
    // Always clear tooltip when leaving the container, regardless of pinned state
    setHoverInfo(null);
    setIsHoverInfoPinned(false);
  };

  return (
    <div className="w-full">
      {/* Period selector */}
      <div className="flex justify-center mb-4">
        <div className="flex bg-card-bg rounded-lg p-1 border border-border-color">
          <button
            onClick={() => setTimePeriod('monthly')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              timePeriod === 'monthly'
                ? 'bg-primary text-background'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimePeriod('weekly')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              timePeriod === 'weekly'
                ? 'bg-primary text-background'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimePeriod('daily')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              timePeriod === 'daily'
                ? 'bg-primary text-background'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Daily
          </button>
        </div>
      </div>

      {/* Country Selection */}
      <div className="flex justify-center mb-4">
        <div className="flex bg-card-bg rounded-lg p-1 border border-border-color gap-2">
          <button
            onClick={() => setShowUkraine(!showUkraine)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 border-2 ${
              showUkraine
                ? 'bg-[#0057B7] text-white border-[#0057B7] shadow-md'
                : 'text-text-secondary hover:text-text-primary hover:bg-gray-700 border-border-color bg-background'
            }`}
            title={showUkraine ? 'Click to hide Ukraine data' : 'Click to show Ukraine data'}
          >
            {showUkraine ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>Show Ukraine</span>
          </button>
          <button
            onClick={() => setShowRussia(!showRussia)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 border-2 ${
              showRussia
                ? 'bg-[#DA291C] text-white border-[#DA291C] shadow-md'
                : 'text-text-secondary hover:text-text-primary hover:bg-gray-700 border-border-color bg-background'
            }`}
            title={showRussia ? 'Click to hide Russia data' : 'Click to show Russia data'}
          >
            {showRussia ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>Show Russia</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-center text-text-muted text-sm mb-2">
        {isMobile
          ? `Select a range: tap "Set Range Start", then move your finger to choose the end. Or change the ${timePeriod === 'daily' ? 'date' : timePeriod === 'weekly' ? 'week' : 'month'} inputs below.`
          : `Select a range: click once to set the start, then click again to set the end. Or change the ${timePeriod === 'daily' ? 'date' : timePeriod === 'weekly' ? 'week' : 'month'} inputs below.`}
      </p>

      {/* Chart */}
      <div 
        className="rounded-lg border border-border-color p-2 md:p-4 relative flex flex-col" 
        style={{ backgroundColor: '#1B1B1C' }}
        onMouseLeave={handleChartContainerMouseLeave}
      >
        {/* Hover Tooltip - Above Chart (Desktop only) */}
        {!isMobile && hoverInfo && hoverInfo.data && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 bg-card-bg border border-border-color rounded-lg px-4 py-2 shadow-lg flex items-center gap-3 text-sm pointer-events-none">
            <span className="text-text-primary font-medium">
              📅 {(() => {
                const dateStr = hoverInfo.label || hoverInfo.data.date;
                if (timePeriod === 'weekly') {
                  const [year, week] = dateStr.split('-W');
                  if (year && week) {
                    const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                    return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                  }
                }
                return dateStr;
              })()}
            </span>
            {showRussia && (
              <div className="flex items-center gap-1">
                <div className="russia-flag"></div>
                <span className="text-text-muted">
                  {hoverInfo.data.russiaDeaths?.toLocaleString() || 0}
                </span>
              </div>
            )}
            {showUkraine && (
              <div className="flex items-center gap-1">
                <div className="ukraine-flag"></div>
                <span className="text-text-muted">
                  {hoverInfo.data.ukraineTotal?.toLocaleString() || 0}
                </span>
              </div>
            )}
          </div>
        )}
        {isMobile ? (
          <div className="order-1">
            <MobileChartMemo
              displayData={selectedRange ? selectedRange.data : chartData}
              timePeriod={timePeriod}
              showUkraine={showUkraine}
              showRussia={showRussia}
              setHoverInfo={setHoverInfo}
              setSelectedRange={setSelectedRange}
            />
          </div>
        ) : (
          <DesktopChartMemo
            fullData={chartData}
            displayData={selectedRange ? selectedRange.data : chartData}
            timePeriod={timePeriod}
            showUkraine={showUkraine}
            showRussia={showRussia}
            setHoverInfo={setHoverInfo}
            setSelectedRange={setSelectedRange}
            setIsHoverInfoPinned={setIsHoverInfoPinned}
            isHoverInfoPinned={isHoverInfoPinned}
            setActiveFilter={setActiveFilter}
          />
        )}

        {/* Date Range Slider for All Time Periods */}
        {chartData.length > 0 && (
          <div className={`${isMobile ? 'order-2' : ''} mt-4 p-4 bg-card-bg border border-border-color rounded-lg`}>
            <div className="mb-3">
              <label className="text-text-primary text-base font-medium mb-1 block">
                Navigate {timePeriod === 'daily' ? 'Daily' : timePeriod === 'weekly' ? 'Weekly' : 'Monthly'} Data Range
              </label>
              <p className="text-text-muted text-sm">
                Drag the handles below to select a date range. The chart will automatically update to show the selected period.
              </p>
            </div>
            
            <div className="relative py-2">
              {/* Slider Track Container */}
              <div className="relative h-8">
                {/* Background Track */}
                <div className="absolute top-3 left-0 right-0 h-2 bg-background rounded-full" />
                
                {/* Active Range Highlight */}
                <div
                  className="absolute top-3 h-2 bg-primary rounded-full transition-all duration-150"
                  style={{
                    left: `${sliderStart}%`,
                    width: `${sliderEnd - sliderStart}%`
                  }}
                />
                
                {/* Start Handle */}
                <div
                  className="absolute top-0 cursor-pointer touch-none z-10"
                  style={{
                    left: `calc(${sliderStart}% - 9px)`,
                    width: '18px',
                    height: '18px'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDraggingSlider('start');
                    const sliderContainer = e.currentTarget.parentElement?.parentElement;
                    if (!sliderContainer) return;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const rect = sliderContainer.getBoundingClientRect();
                      const percent = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                      if (percent < sliderEnd - 1) {
                        setSliderStart(percent);
                      }
                    };
                    const handleMouseUp = () => {
                      setIsDraggingSlider(null);
                      setActiveFilter(null); // Clear filter when manually dragging slider
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                  onTouchStart={(e) => {
                    if (e.cancelable) {
                      e.preventDefault();
                    }
                    setIsDraggingSlider('start');
                    const sliderContainer = e.currentTarget.parentElement?.parentElement;
                    if (!sliderContainer) return;
                    
                    const handleTouchMove = (moveEvent: TouchEvent) => {
                      if (!moveEvent.touches[0]) return;
                      const rect = sliderContainer.getBoundingClientRect();
                      const percent = Math.max(0, Math.min(100, ((moveEvent.touches[0].clientX - rect.left) / rect.width) * 100));
                      if (percent < sliderEnd - 1) {
                        setSliderStart(percent);
                      }
                    };
                    const handleTouchEnd = () => {
                      setIsDraggingSlider(null);
                      setActiveFilter(null); // Clear filter when manually dragging slider
                      document.removeEventListener('touchmove', handleTouchMove);
                      document.removeEventListener('touchend', handleTouchEnd);
                    };
                    document.addEventListener('touchmove', handleTouchMove, { passive: false });
                    document.addEventListener('touchend', handleTouchEnd);
                  }}
                >
                  <div className="w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg hover:scale-110 transition-transform" />
                </div>
                
                {/* End Handle */}
                <div
                  className="absolute top-0 cursor-pointer touch-none z-10"
                  style={{
                    left: `calc(${sliderEnd}% - 9px)`,
                    width: '18px',
                    height: '18px'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDraggingSlider('end');
                    const sliderContainer = e.currentTarget.parentElement?.parentElement;
                    if (!sliderContainer) return;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const rect = sliderContainer.getBoundingClientRect();
                      const percent = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                      if (percent > sliderStart + 1) {
                        setSliderEnd(percent);
                      }
                    };
                    const handleMouseUp = () => {
                      setIsDraggingSlider(null);
                      setActiveFilter(null); // Clear filter when manually dragging slider
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                  onTouchStart={(e) => {
                    if (e.cancelable) {
                      e.preventDefault();
                    }
                    setIsDraggingSlider('end');
                    const sliderContainer = e.currentTarget.parentElement?.parentElement;
                    if (!sliderContainer) return;
                    
                    const handleTouchMove = (moveEvent: TouchEvent) => {
                      if (!moveEvent.touches[0]) return;
                      const rect = sliderContainer.getBoundingClientRect();
                      const percent = Math.max(0, Math.min(100, ((moveEvent.touches[0].clientX - rect.left) / rect.width) * 100));
                      if (percent > sliderStart + 1) {
                        setSliderEnd(percent);
                      }
                    };
                    const handleTouchEnd = () => {
                      setIsDraggingSlider(null);
                      setActiveFilter(null); // Clear filter when manually dragging slider
                      document.removeEventListener('touchmove', handleTouchMove);
                      document.removeEventListener('touchend', handleTouchEnd);
                    };
                    document.addEventListener('touchmove', handleTouchMove, { passive: false });
                    document.addEventListener('touchend', handleTouchEnd);
                  }}
                >
                  <div className="w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg hover:scale-110 transition-transform" />
                </div>
              </div>
              
              {/* Date Labels */}
              <div className="flex justify-between mt-3 text-sm">
                <div className="text-text-muted">
                  <div className="font-medium text-text-primary">Start:</div>
                  <div>
                    {(() => {
                      const startIndex = Math.floor((sliderStart / 100) * chartData.length);
                      const dateStr = chartData[Math.max(0, Math.min(startIndex, chartData.length - 1))]?.date || '';
                      if (timePeriod === 'weekly') {
                        const [year, week] = dateStr.split('-W');
                        if (year && week) {
                          const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                          return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        }
                      }
                      return dateStr;
                    })()}
                  </div>
                </div>
                <div className="text-text-muted text-right">
                  <div className="font-medium text-text-primary">End:</div>
                  <div>
                    {(() => {
                      const endIndex = Math.floor((sliderEnd / 100) * chartData.length);
                      const dateStr = chartData[Math.max(0, Math.min(endIndex, chartData.length - 1))]?.date || '';
                      if (timePeriod === 'weekly') {
                        const [year, week] = dateStr.split('-W');
                        if (year && week) {
                          const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                          return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        }
                      }
                      return dateStr;
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Quick Range Buttons - By Year and Battles */}
              <div className="flex flex-wrap gap-2 mt-4">
                {(() => {
                  // Helper function to parse date based on time period
                  const parseDate = (dateStr: string): Date | null => {
                    if (timePeriod === 'daily') {
                      return new Date(dateStr);
                    } else if (timePeriod === 'weekly') {
                      const [year, week] = dateStr.split('-W');
                      if (!year || !week) return null;
                      // Calculate the start of the week
                      const jan1 = new Date(parseInt(year), 0, 1);
                      const daysOffset = (parseInt(week) - 1) * 7;
                      return new Date(jan1.getTime() + daysOffset * 24 * 60 * 60 * 1000);
                    } else {
                      // Monthly format: "Feb 2022" or "2022-02"
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      if (dateStr.includes('-')) {
                        const [year, month] = dateStr.split('-');
                        return new Date(parseInt(year), parseInt(month) - 1, 1);
                      } else {
                        const parts = dateStr.split(' ');
                        if (parts.length === 2) {
                          const monthIndex = monthNames.indexOf(parts[0]);
                          if (monthIndex !== -1) {
                            return new Date(parseInt(parts[1]), monthIndex, 1);
                          }
                        }
                      }
                      return null;
                    }
                  };

                  // Helper function to compare dates based on time period
                  const compareDates = (dataDate: string, targetDate: Date, comparison: 'start' | 'end'): boolean => {
                    const parsed = parseDate(dataDate);
                    if (!parsed) return false;
                    
                    if (timePeriod === 'daily') {
                      return comparison === 'start' 
                        ? parsed >= targetDate 
                        : parsed <= targetDate;
                    } else if (timePeriod === 'weekly') {
                      // For weekly, compare the week start date
                      return comparison === 'start'
                        ? parsed >= targetDate
                        : parsed <= targetDate;
                    } else {
                      // For monthly, compare month/year
                      return comparison === 'start'
                        ? parsed >= targetDate
                        : parsed <= targetDate;
                    }
                  };

                  // Helper function to get year range
                  const getYearRange = (year: number) => {
                    const yearStart = new Date(year, 0, 1);
                    const yearEnd = new Date(year, 11, 31);
                    
                    // Find first data point in this year
                    const startIndex = chartData.findIndex(d => {
                      const parsed = parseDate(d.date);
                      return parsed && parsed >= yearStart;
                    });
                    
                    // Find first data point in next year (or end of data)
                    const endIndex = chartData.findIndex((d, idx) => {
                      if (idx <= startIndex) return false;
                      const parsed = parseDate(d.date);
                      return parsed && parsed > yearEnd;
                    });
                    
                    if (startIndex === -1) return null;
                    
                    // Use the last index of the year, or the last data point if no next year found
                    const actualEndIndex = endIndex === -1 ? chartData.length - 1 : endIndex - 1;
                    
                    // Ensure we have valid indices
                    if (startIndex > actualEndIndex) return null;
                    
                    return {
                      startPercent: (startIndex / chartData.length) * 100,
                      endPercent: ((actualEndIndex + 1) / chartData.length) * 100
                    };
                  };

                  // Helper function to get battle range
                  const getBattleRange = (startDateStr: string, endDateStr: string) => {
                    const startDate = new Date(startDateStr);
                    const endDate = new Date(endDateStr);
                    
                    // Helper to check if a period overlaps with battle range
                    const periodOverlaps = (dataDate: string): boolean => {
                      const parsed = parseDate(dataDate);
                      if (!parsed) return false;
                      
                      if (timePeriod === 'daily') {
                        return parsed >= startDate && parsed <= endDate;
                      } else if (timePeriod === 'weekly') {
                        // For weekly, check if the week overlaps with battle period
                        // Week starts at parsed date, ends 6 days later
                        const weekEnd = new Date(parsed);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                        return parsed <= endDate && weekEnd >= startDate;
                      } else {
                        // For monthly, check if the month overlaps with battle period
                        // Month starts at parsed date, ends at last day of month
                        const monthEnd = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0);
                        return parsed <= endDate && monthEnd >= startDate;
                      }
                    };
                    
                    // Find first data point that overlaps with battle period
                    const startIndex = chartData.findIndex(d => periodOverlaps(d.date));
                    
                    // Find last data point that overlaps with battle period
                    let actualEndIndex = -1;
                    for (let i = chartData.length - 1; i >= 0; i--) {
                      if (periodOverlaps(chartData[i].date)) {
                        actualEndIndex = i;
                        break;
                      }
                    }
                    
                    if (startIndex === -1 || actualEndIndex === -1) return null;
                    
                    // Ensure we have valid indices
                    if (startIndex > actualEndIndex) return null;
                    
                    return {
                      startPercent: (startIndex / chartData.length) * 100,
                      endPercent: ((actualEndIndex + 1) / chartData.length) * 100
                    };
                  };
                  
                  const years = [2022, 2023, 2024, 2025];
                  const yearRanges = years.map(year => ({
                    year,
                    range: getYearRange(year)
                  })).filter(item => item.range !== null);

                  // Battle definitions
                  const battles = [
                    { name: 'Bakhmut', start: '2022-08-01', end: '2023-05-20' },
                    { name: 'Ukraine Summer Offensive 2023', start: '2023-06-04', end: '2023-09-30' },
                    { name: 'Avdiivka', start: '2023-10-10', end: '2024-02-17' },
                    { name: 'Kursk Operation', start: '2024-08-06', end: '2025-03-31' }
                  ];
                  
                  const battleRanges = battles.map(battle => ({
                    name: battle.name,
                    range: getBattleRange(battle.start, battle.end)
                  })).filter(item => item.range !== null);
                  
                  return (
                    <>
                      <div className="w-full mb-2">
                        <span className="text-text-muted text-sm font-medium">Years:</span>
                      </div>
                      {yearRanges.map(({ year, range }) => (
                        <button
                          key={year}
                          onClick={() => {
                            if (range) {
                              setSliderStart(range.startPercent);
                              setSliderEnd(range.endPercent);
                              setActiveFilter(year);
                            }
                          }}
                          className={`px-3 py-1.5 text-sm rounded transition-colors ${
                            activeFilter === year
                              ? 'bg-primary text-background font-medium'
                              : 'bg-background border border-border-color hover:bg-gray-700'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setSliderStart(0);
                          setSliderEnd(100);
                          setActiveFilter(null);
                        }}
                        className={`px-3 py-1.5 text-sm rounded transition-colors font-medium ${
                          activeFilter === null
                            ? 'bg-primary text-background'
                            : 'bg-background border border-border-color hover:bg-gray-700'
                        }`}
                      >
                        All Years
                      </button>
                      
                      <div className="w-full mt-3 mb-2">
                        <span className="text-text-muted text-sm font-medium">Battles:</span>
                      </div>
                      {battleRanges.map(({ name, range }) => (
                        <button
                          key={name}
                          onClick={() => {
                            if (range) {
                              setSliderStart(range.startPercent);
                              setSliderEnd(range.endPercent);
                              setActiveFilter(name);
                            }
                          }}
                          className={`px-3 py-1.5 text-sm rounded transition-colors ${
                            activeFilter === name
                              ? 'bg-primary text-background font-medium'
                              : 'bg-background border border-border-color hover:bg-gray-700'
                          }`}
                          title={`${name}: ${battles.find(b => b.name === name)?.start} to ${battles.find(b => b.name === name)?.end}`}
                        >
                          {name}
                        </button>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
        
        {/* Dynamic Data Display - Inside chart component, under the chart and range slider */}
        {/* Show HoverInfoDisplay for selectedRange on all devices, and for hoverInfo on desktop only */}
        <div className="order-3">
          <HoverInfoDisplay 
            info={selectedRange ? null : (isMobile ? null : hoverInfo)}
            timePeriod={timePeriod}
            showUkraine={showUkraine}
            showRussia={showRussia}
            isMobile={isMobile}
            selectedRange={selectedRange}
            chartData={chartData}
            handleManualDateChange={handleManualDateChange}
            handleResetRange={handleResetRange}
            convertMonthDisplayToInput={convertMonthDisplayToInput}
            convertMonthInputToDisplay={convertMonthInputToDisplay}
            activeFilter={activeFilter}
            onClose={!isMobile ? () => {
              setIsHoverInfoPinned(false);
              setHoverInfo(null);
            } : undefined}
          />
        </div>
      </div>

    </div>
  );
}
