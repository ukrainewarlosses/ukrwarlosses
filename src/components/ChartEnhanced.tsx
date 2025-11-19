'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { hardcodedChartData, ChartData } from '@/data/hardcoded-chart-data';

type TimePeriod = 'daily' | 'weekly' | 'monthly';

type HoverInfo = any;

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
  const height = 350;
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

  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = svgRef.current?.getBoundingClientRect();
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
  }, [data, innerWidth, isSettingRange, rangeStartIndex]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = svgRef.current?.getBoundingClientRect();
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
  }, [data, innerWidth, isSettingRange, rangeStartIndex]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
  }, []);

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
      </svg>

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
            className="px-3 py-1.5 bg-primary text-background rounded text-xs font-medium hover:bg-primary/80 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Set Range Start
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-center">
              <p className="text-xs text-text-muted mb-2">
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
              <p className="text-xs text-primary font-medium">Move finger to adjust end point, then confirm below</p>
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
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium transition-colors"
              >
                Set Range End
              </button>
              <button
                onClick={() => { setIsSettingRange(false); setRangeStartIndex(null); setRangeEndIndex(null); setCurrentHoverIndex(null); }}
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
  isHoverInfoPinned
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
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-primary text-background px-3 py-1 rounded-full text-xs font-medium">
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
            <Legend wrapperStyle={{ color: '#a0aec0', fontSize: '12px', paddingTop: '10px' }} iconType="line" />
            {refAreaLeft && refAreaRight && (
              <ReferenceArea yAxisId="period" x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#d4a574" fillOpacity={0.3} />
            )}
            {showUkraine && (
              <Line yAxisId="period" type="monotone" dataKey="ukraineTotal" stroke="#0057B7" strokeWidth={2} opacity={0.8} name="Ukraine Period" dot={timePeriod === 'monthly' ? { fill: '#0057B7', r: 3 } : false} activeDot={{ r: 5 }} />
            )}
            {showRussia && (
              <Line yAxisId="period" type="monotone" dataKey="russiaDeaths" stroke="#DA291C" strokeWidth={2} opacity={0.8} name="Russia Period" dot={timePeriod === 'monthly' ? { fill: '#DA291C', r: 3 } : false} activeDot={{ r: 5 }} />
            )}
            {showUkraine && (
              <Line yAxisId="cumulative" type="monotone" dataKey="ukraineTotalCumulative" stroke="#0057B7" strokeWidth={3} strokeDasharray="6 4" name="Ukraine Cumulative" dot={false} activeDot={{ r: 6 }} />
            )}
            {showRussia && (
              <Line yAxisId="cumulative" type="monotone" dataKey="russiaTotalCumulative" stroke="#DA291C" strokeWidth={3} strokeDasharray="6 4" name="Russia Cumulative" dot={false} activeDot={{ r: 6 }} />
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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');
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

  // Memoized hover info display component to prevent chart re-renders
  const HoverInfoDisplay = memo(({ info, timePeriod, showUkraine, showRussia, isMobile, onClose }: {
    info: any;
    timePeriod: TimePeriod;
    showUkraine: boolean;
    showRussia: boolean;
    isMobile: boolean;
    onClose?: () => void;
  }) => {
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
          <p className="text-text-primary font-semibold text-sm">
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
          <p className="text-text-muted text-xs">
            {timePeriod === 'daily' ? 'Losses recorded on this date' :
             timePeriod === 'weekly' ? 'Losses recorded during this week' :
             'Losses recorded during this month'}
          </p>
        </div>
        
        {/* Desktop/Mobile responsive layout */}
        <div className={`${isMobile ? 'flex gap-3' : 'flex gap-4'} mb-3`}>
          {/* Ukraine Data */}
          {showUkraine && (
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-2">
                <div className="ukraine-flag"></div>
                <p className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#0057B7' }}>
                  {isMobile ? 'UA' : 'Ukraine'}
                </p>
              </div>
              <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <p className="text-text-muted">
                  <span className="font-medium">Total Fatalities:</span> {(info.data.ukraineTotal || 0).toLocaleString()}
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
                  <p className={`text-text-primary font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Total: {(info.data.ukraineTotalCumulative || 0).toLocaleString()}
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
              <div className="flex items-center gap-1 mb-2">
                <div className="russia-flag"></div>
                <p className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#DA291C' }}>
                  {isMobile ? 'RU' : 'Russia'}
                </p>
              </div>
              <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <p className="text-text-muted">
                  <span className="font-medium">Total Fatalities:</span> {(info.data.russiaDeaths || 0).toLocaleString()}
                </p>
                <div className="border-t border-border-color pt-1 mt-1">
                  <p className={`text-text-primary font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Total: {(info.data.russiaTotalCumulative || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Ratios */}
        {showUkraine && showRussia && (
          <div className="border-t border-border-color pt-2">
            <p className={`text-text-muted ${isMobile ? 'text-xs' : 'text-sm'} mb-1 text-center`}>
              {timePeriod === 'monthly' && monthName ? monthName : 'Loss Ratio'}
            </p>
            <div className="bg-background rounded p-3 border border-border-color text-center">
              <span className="text-primary font-bold text-lg flex items-center justify-center gap-2">
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
    }
    
    setLoading(false);
  }, [timePeriod]);

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
    const height = 350;
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

    // Touch event handlers - memoized to prevent re-renders
    const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = touch.clientX - rect.left;
      
      if (x >= margin.left && x <= margin.left + innerWidth - X_PAD) {
        const touchIndex = xToIndex(x);
        const touchedData = data[touchIndex];
        
        // Update corner info with touched data
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
        
        // Update hover index for preview line
        setCurrentHoverIndex(touchIndex);
        
        // If in range setting mode, update end point
        if (isSettingRange && rangeStartIndex !== null) {
          setRangeEndIndex(touchIndex);
        }
      }
    }, [data, margin, innerWidth, xToIndex, isSettingRange, rangeStartIndex]);

    const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
      e.preventDefault(); // Prevent scrolling
      
      const touch = e.touches[0];
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = touch.clientX - rect.left;
      
      if (x >= margin.left && x <= margin.left + innerWidth - X_PAD) {
        const touchIndex = xToIndex(x);
        const touchedData = data[touchIndex];
        
        // Update corner info with moved data
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
        
        // Update hover index for preview line
        setCurrentHoverIndex(touchIndex);
        
        // If in range setting mode, update end point
        if (isSettingRange && rangeStartIndex !== null) {
          setRangeEndIndex(touchIndex);
        }
      }
    }, [data, margin, innerWidth, xToIndex, isSettingRange, rangeStartIndex]);

    const handleTouchEnd = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
      e.preventDefault();
      
      // Keep corner info visible (no timeout needed)
      
      // Keep hover line visible - don't clear currentHoverIndex
      // It will be cleared when user touches elsewhere or clicks "Set Range Start"
    }, []);

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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
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
          
          // Reset selection state
          setRefAreaLeft('');
          setRefAreaRight('');
          setIsSelectingDesktop(false);
        }
      }
    }, [isSelectingDesktop, refAreaLeft, chartData, showUkraine, showRussia]);

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


    const displayData = selectedRange ? selectedRange.data : chartData;

    return (
      <div className="relative">
        <div className="relative">
          {/* Desktop selection status */}
          {isSelectingDesktop && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10
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
          
          <ResponsiveContainer width="100%" height={400}>
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
        
        <Legend 
          wrapperStyle={{ 
            color: '#a0aec0', 
            fontSize: '12px',
            paddingTop: '10px'
          }}
          iconType="line"
        />
        
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

  return (
    <div className="w-full">
      {/* Period selector */}
      <div className="flex justify-center mb-4">
        <div className="flex bg-card-bg rounded-lg p-1 border border-border-color">
          <button
            onClick={() => setTimePeriod('daily')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timePeriod === 'daily'
                ? 'bg-primary text-background'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimePeriod('weekly')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timePeriod === 'weekly'
                ? 'bg-primary text-background'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimePeriod('monthly')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timePeriod === 'monthly'
                ? 'bg-primary text-background'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Country Selection */}
      <div className="flex justify-center mb-4">
        <div className="flex bg-card-bg rounded-lg p-1 border border-border-color gap-1">
          <button
            onClick={() => setShowUkraine(!showUkraine)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              showUkraine
                ? 'bg-[#0057B7] text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-gray-700'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showUkraine ? 'bg-white' : 'bg-[#0057B7]'}`}></div>
            Ukraine
          </button>
          <button
            onClick={() => setShowRussia(!showRussia)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              showRussia
                ? 'bg-[#DA291C] text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-gray-700'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showRussia ? 'bg-white' : 'bg-[#DA291C]'}`}></div>
            Russia
          </button>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-center text-text-muted text-xs mb-2">
        {isMobile
          ? `Select a range: tap "Set Range Start", then move your finger to choose the end. Or change the ${timePeriod === 'daily' ? 'date' : timePeriod === 'weekly' ? 'week' : 'month'} inputs below.`
          : `Select a range: click once to set the start, then click again to set the end. Or change the ${timePeriod === 'daily' ? 'date' : timePeriod === 'weekly' ? 'week' : 'month'} inputs below.`}
      </p>

      {/* Chart */}
      <div className="rounded-lg border border-border-color p-2 md:p-4" style={{ backgroundColor: '#1B1B1C' }}>
        {isMobile ? (
          <MobileChartMemo
            displayData={selectedRange ? selectedRange.data : chartData}
            timePeriod={timePeriod}
            showUkraine={showUkraine}
            showRussia={showRussia}
            setHoverInfo={setHoverInfo}
            setSelectedRange={setSelectedRange}
          />
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
          />
        )}
        
        {/* Dynamic Data Display - Inside chart component, under the chart */}
        <HoverInfoDisplay 
          info={hoverInfo}
          timePeriod={timePeriod}
          showUkraine={showUkraine}
          showRussia={showRussia}
          isMobile={isMobile}
          onClose={!isMobile ? () => {
            setIsHoverInfoPinned(false);
            setHoverInfo(null);
          } : undefined}
        />
      </div>

      {/* Selected range stats */}
      {selectedRange && (
        <div className="mt-4 p-3 bg-card-bg rounded-lg border border-border-color">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-3">
            <div>
              <p className="text-primary font-medium text-sm mb-1">Selected Range Analysis</p>
              <p className="text-text-muted text-xs mb-2">
                {timePeriod === 'weekly' ? (() => {
                  const formatWeekDate = (dateStr: string) => {
                    const [year, week] = dateStr.split('-W');
                    const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                    return `Week of ${weekStart.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}`;
                  };
                  return `${formatWeekDate(selectedRange.start)} to ${formatWeekDate(selectedRange.end)}`;
                })() : `${selectedRange.start} to ${selectedRange.end}`}
              </p>
              
              {/* Manual Period Input */}
              {timePeriod === 'daily' && (
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-text-muted text-xs">From:</label>
                    <input
                      type="date"
                      value={selectedRange.start}
                      min="2022-02-23"
                      max={chartData[chartData.length - 1]?.date || "2025-12-31"}
                      onChange={(e) => handleManualDateChange(e.target.value, selectedRange.end)}
                      className="px-2 py-1 text-xs bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-text-muted text-xs">To:</label>
                    <input
                      type="date"
                      value={selectedRange.end}
                      min="2022-02-23"
                      max={chartData[chartData.length - 1]?.date || "2025-12-31"}
                      onChange={(e) => handleManualDateChange(selectedRange.start, e.target.value)}
                      className="px-2 py-1 text-xs bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
              
              {timePeriod === 'weekly' && (
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-text-muted text-xs">From:</label>
                    <select
                      value={selectedRange.start}
                      onChange={(e) => handleManualDateChange(e.target.value, selectedRange.end)}
                      className="px-2 py-1 text-xs bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
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
                    <label className="text-text-muted text-xs">To:</label>
                    <select
                      value={selectedRange.end}
                      onChange={(e) => handleManualDateChange(selectedRange.start, e.target.value)}
                      className="px-2 py-1 text-xs bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
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
              
              {timePeriod === 'monthly' && (
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-text-muted text-xs">From:</label>
                    <input
                      type="month"
                      value={convertMonthDisplayToInput(selectedRange.start)}
                      min="2022-02"
                      max={convertMonthDisplayToInput(chartData[chartData.length - 1]?.date) || "2025-12"}
                      onChange={(e) => handleManualDateChange(convertMonthInputToDisplay(e.target.value), selectedRange.end)}
                      className="px-2 py-1 text-xs bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-text-muted text-xs">To:</label>
                    <input
                      type="month"
                      value={convertMonthDisplayToInput(selectedRange.end)}
                      min="2022-02"
                      max={convertMonthDisplayToInput(chartData[chartData.length - 1]?.date) || "2025-12"}
                      onChange={(e) => handleManualDateChange(selectedRange.start, convertMonthInputToDisplay(e.target.value))}
                      className="px-2 py-1 text-xs bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={handleResetRange}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs whitespace-nowrap"
            >
              Reset to Full Range
            </button>
          </div>
          
          <div className={`grid gap-2 ${showUkraine && showRussia ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {showUkraine && (
              <div className="bg-background rounded p-2">
                <p className="text-text-muted text-xs">Ukraine Total</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: '#0057B7' }}>
                  {selectedRange.ukraineTotal?.toLocaleString()}
                </p>
              </div>
            )}
            {showRussia && (
              <div className="bg-background rounded p-2">
                <p className="text-text-muted text-xs">Russia Total</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: '#DA291C' }}>
                  {selectedRange.russiaTotal?.toLocaleString()}
                </p>
              </div>
            )}
            <div className="bg-background rounded p-2">
              <p className="text-text-muted text-xs">
                {timePeriod === 'daily' ? 'Days in Range' : 
                 timePeriod === 'weekly' ? 'Weeks in Range' : 
                 'Months in Range'}
              </p>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-text-primary`}>
                {selectedRange.data.length}
              </p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-text-muted text-xs">
                {timePeriod === 'daily' ? 'Daily Average' : 
                 timePeriod === 'weekly' ? 'Weekly Average' : 
                 'Monthly Average'}
              </p>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-primary`}>
                {Math.round(((showUkraine ? selectedRange.ukraineTotal : 0) + (showRussia ? selectedRange.russiaTotal : 0)) / selectedRange.data.length).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
        {showUkraine && (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-[#0057B7] opacity-80"></div>
              <span className="text-text-muted">Ukraine Period</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 border-t-2 border-dashed border-[#0057B7]" style={{ background: 'transparent' }}></div>
              <span className="text-text-muted">Ukraine Cumulative</span>
            </div>
          </>
        )}
        {showRussia && (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-[#DA291C] opacity-80"></div>
              <span className="text-text-muted">Russia Period</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 border-t-2 border-dashed border-[#DA291C]" style={{ background: 'transparent' }}></div>
              <span className="text-text-muted">Russia Cumulative</span>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
