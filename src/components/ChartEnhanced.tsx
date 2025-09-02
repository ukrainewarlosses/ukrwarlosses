'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { hardcodedChartData, ChartData } from '@/data/hardcoded-chart-data';

type TimePeriod = 'daily' | 'weekly' | 'monthly';

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

  // Mobile-specific SVG rendering
  const MobileChart = () => {
    // Measure the actual container width to prevent cutoff
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    useEffect(() => {
      const updateWidth = () => {
        // Be very conservative with width to ensure no clipping
        const viewportWidth = window.innerWidth;
        const safeWidth = Math.max(viewportWidth - 64, 280); // Even more conservative
        setContainerWidth(safeWidth);
      };
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const width = containerWidth; // Use very conservative width
    const height = 350; // Slightly shorter for mobile
    // Shift plot left and provide extra space on the right edge to prevent clipping
    const margin = { top: 20, right: 32, bottom: 50, left: 18 } as const;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Get data to display
    const data = selectedRange ? selectedRange.data : chartData;
    if (!data || data.length === 0) return null;

    // Calculate scales
    const xMin = 0;
    const xMax = data.length - 1;
    const yMaxPeriod = Math.max(...data.map((d: ChartData) => Math.max(d.ukraineTotal, d.russiaDeaths)));
    const yMaxCum = Math.max(...data.map((d: ChartData) => Math.max(d.ukraineTotalCumulative, d.russiaTotalCumulative)));

    // Reduce padding now that we have right Y-axis
    const X_PAD = 8; // Minimal padding for right Y-axis labels
    const xScale = (index: number) => margin.left + (index / xMax) * (innerWidth - X_PAD);
    const yScalePeriod = (value: number) => margin.top + innerHeight - (value / yMaxPeriod) * innerHeight;
    const yScaleCum = (value: number) => margin.top + innerHeight - (value / yMaxCum) * innerHeight;

    // Stabilized touch handlers with useCallback
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      e.stopPropagation();
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      
      console.log('Touch start at x:', x, 'chart area:', margin.left, 'to', margin.left + innerWidth - X_PAD);
      
      // Only start selection if touch is within the chart area
      if (x >= margin.left && x <= margin.left + innerWidth - X_PAD) {
        const index = Math.round(((x - margin.left) / (innerWidth - X_PAD)) * xMax);
        console.log('Starting drag at index:', index, 'of', xMax);
        setDragStart(index);
        setDragEnd(index); // Set initial end to same as start
        setIsDragging(true);
      }
    }, [margin.left, innerWidth, X_PAD, xMax]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      e.stopPropagation();
      if (!isDragging) return;
      
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      
      if (x >= margin.left && x <= margin.left + innerWidth - X_PAD) {
        const index = Math.round(((x - margin.left) / (innerWidth - X_PAD)) * xMax);
        const clampedIndex = Math.max(0, Math.min(xMax, index));
        console.log('Moving to index:', clampedIndex);
        setDragEnd(clampedIndex);
      }
    }, [isDragging, margin.left, innerWidth, X_PAD, xMax]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      e.stopPropagation();
      console.log('Touch end - dragStart:', dragStart, 'dragEnd:', dragEnd, 'isDragging:', isDragging);
      
      if (isDragging && dragStart !== null && dragEnd !== null) {
        const start = Math.min(dragStart, dragEnd);
        const end = Math.max(dragStart, dragEnd);
        
        // Allow single point selection or range selection
        if (start <= end) {
          const selectedData = data.slice(start, end + 1);
          
          console.log('Selected data:', selectedData.length, 'points from', data[start]?.date, 'to', data[end]?.date);
          
          const ukraineTotal = selectedData.reduce((sum: number, d: ChartData) => sum + (showUkraine ? d.ukraineTotal : 0), 0);
          const russiaTotal = selectedData.reduce((sum: number, d: ChartData) => sum + (showRussia ? d.russiaDeaths : 0), 0);
          
          setSelectedRange({
            start: data[start].date,
            end: data[end].date,
            data: selectedData,
            ukraineTotal,
            russiaTotal
          });
        }
      }
      
      // Always reset drag state
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }, [isDragging, dragStart, dragEnd, data, showUkraine, showRussia]);

    return (
      <div className="w-full" ref={wrapperRef}>
        <svg 
          width={width} 
          height={height}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full"
          style={{ touchAction: 'none' }}
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

          {/* Selection area */}
          {isDragging && dragStart !== null && dragEnd !== null && (
            <rect
              x={Math.min(xScale(dragStart), xScale(dragEnd))}
              y={margin.top}
              width={Math.abs(xScale(dragEnd) - xScale(dragStart))}
              height={innerHeight}
              fill="#d4a574"
              fillOpacity="0.3"
              stroke="#d4a574"
              strokeWidth="2"
              strokeDasharray="4,2"
            />
          )}

          {/* Ukraine Period Line */}
          {showUkraine && (
            <path
              d={`M ${data.map((d: ChartData, i: number) => `${xScale(i)},${yScalePeriod(d.ukraineTotal)}`).join(' L ')}`}
              fill="none"
              stroke="#0057B7"
              strokeWidth="2"
              opacity="0.8"
            />
          )}

          {/* Russia Period Line */}
          {showRussia && (
            <path
              d={`M ${data.map((d: ChartData, i: number) => `${xScale(i)},${yScalePeriod(d.russiaDeaths)}`).join(' L ')}`}
              fill="none"
              stroke="#DA291C"
              strokeWidth="2"
              opacity="0.8"
            />
          )}

          {/* Ukraine Cumulative Line */}
          {showUkraine && (
            <path
              d={`M ${data.map((d: ChartData, i: number) => `${xScale(i)},${yScaleCum(d.ukraineTotalCumulative)}`).join(' L ')}`}
              fill="none"
              stroke="#0057B7"
              strokeWidth="3"
            />
          )}

          {/* Russia Cumulative Line */}
          {showRussia && (
            <path
              d={`M ${data.map((d: ChartData, i: number) => `${xScale(i)},${yScaleCum(d.russiaTotalCumulative)}`).join(' L ')}`}
              fill="none"
              stroke="#DA291C"
              strokeWidth="3"
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

          {/* Y-axis left */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + innerHeight}
            stroke="#a0aec0"
          />

          {/* Y-axis right */}
          <line
            x1={margin.left + innerWidth - X_PAD}
            y1={margin.top}
            x2={margin.left + innerWidth - X_PAD}
            y2={margin.top + innerHeight}
            stroke="#a0aec0"
          />

          {/* Left Y-axis labels (Period) */}
          {[0, 2, 4].map(i => (
            <text
              key={i}
              x={margin.left - 2}
              y={margin.top + (innerHeight / 4) * i + 4}
              textAnchor="end"
              fill="#a0aec0"
              fontSize="8"
            >
              {Math.round((yMaxPeriod / 4) * (4 - i) / 1000)}k
            </text>
          ))}

          {/* Right Y-axis labels (Cumulative) */}
          {[0, 2, 4].map(i => (
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

          {/* X-axis labels - show fewer on mobile */}
          {data.filter((_: ChartData, i: number) => i % Math.ceil(data.length / 4) === 0).map((d: ChartData, i: number) => (
            <text
              key={i}
              x={xScale(i * Math.ceil(data.length / 4))}
              y={margin.top + innerHeight + 20}
              textAnchor="middle"
              fill="#a0aec0"
              fontSize="10"
              transform={`rotate(-45 ${xScale(i * Math.ceil(data.length / 4))} ${margin.top + innerHeight + 20})`}
            >
              {d.date.split('-').slice(1).join('/')}
            </text>
          ))}
        </svg>
      </div>
    );
  };

  // Desktop chart (existing Recharts implementation)
  const DesktopChart = () => {
    const [refAreaLeft, setRefAreaLeft] = useState<string>('');
    const [refAreaRight, setRefAreaRight] = useState<string>('');

    // Range selection handlers for desktop
    const handleMouseDown = (e: any) => {
      if (e && e.activeLabel) {
        setRefAreaLeft(e.activeLabel);
        setRefAreaRight('');
      }
    };

    const handleMouseMove = (e: any) => {
      if (refAreaLeft && e && e.activeLabel) {
        setRefAreaRight(e.activeLabel);
      }
    };

    const handleMouseUp = () => {
      if (refAreaLeft && refAreaRight) {
        const left = refAreaLeft < refAreaRight ? refAreaLeft : refAreaRight;
        const right = refAreaLeft > refAreaRight ? refAreaLeft : refAreaRight;
        
        const filteredData = chartData.filter(
          item => item.date >= left && item.date <= right
        );
        
        const ukraineTotal = filteredData.reduce((sum, d) => sum + d.ukraineTotal, 0);
        const russiaTotal = filteredData.reduce((sum, d) => sum + d.russiaDeaths, 0);
        
        setSelectedRange({
          start: left,
          end: right,
          data: filteredData,
          ukraineTotal,
          russiaTotal
        });
      }
      setRefAreaLeft('');
      setRefAreaRight('');
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        
        return (
          <div className="bg-card-bg border border-border-color rounded-lg shadow-lg p-4">
            <p className="text-text-primary font-medium mb-3">
              {timePeriod === 'daily' ? 'Date' : timePeriod === 'weekly' ? 'Week' : 'Month'}: {label}
            </p>
            
            <div className="space-y-2">
              <div>
                <p className="font-medium text-sm" style={{ color: '#0057B7' }}>
                  Ukrainian Losses
                </p>
                <p className="text-text-muted text-xs">
                  Period: {data.ukraineTotal?.toLocaleString() || 0}
                  {` (${(data.ukraineDeaths || 0).toLocaleString()} deaths, ${(data.ukraineMissing || 0).toLocaleString()} missing)`}
                </p>
                <p className="text-text-muted text-xs">
                  Cumulative: {data.ukraineTotalCumulative?.toLocaleString() || 0}
                </p>
              </div>
              
              <div>
                <p className="font-medium text-sm" style={{ color: '#DA291C' }}>
                  Russian Losses
                </p>
                <p className="text-text-muted text-xs">
                  Period: {data.russiaDeaths?.toLocaleString() || 0}
                </p>
                <p className="text-text-muted text-xs">
                  Cumulative: {data.russiaTotalCumulative?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        );
      }
      return null;
    };

    const displayData = selectedRange ? selectedRange.data : chartData;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={displayData}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
          interval={timePeriod === 'daily' ? Math.floor(displayData.length / 10) : 
                   timePeriod === 'weekly' ? 5 : 2}
          domain={['dataMin', 'dataMax']}
          scale="point"
        />
        
        {/* Left Y-Axis for Period Data */}
        <YAxis 
          yAxisId="period"
          stroke="#a0aec0" 
          fontSize={12}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
        
        <Tooltip content={<CustomTooltip />} />
        
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
            dot={{ fill: '#0057B7', r: 3 }}
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
            dot={{ fill: '#DA291C', r: 3 }}
            activeDot={{ r: 5 }}
          />
        )}
        
        {/* Cumulative Lines (Thicker, Always Visible) */}
        {showUkraine && (
          <Line 
            yAxisId="cumulative"
            type="monotone" 
            dataKey="ukraineTotalCumulative" 
            stroke="#0057B7" 
            strokeWidth={3}
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
            name="Russia Cumulative"
            dot={false}
            activeDot={{ r: 6 }}
          />
        )}
        </LineChart>
      </ResponsiveContainer>
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
        {isMobile ? 'Touch and drag on chart or use ' : 'Click and drag on chart or use '}
        {timePeriod === 'daily' ? 'date' : timePeriod === 'weekly' ? 'week' : 'month'} 
        {' inputs below to select a range'}
      </p>

      {/* Chart */}
      <div className="bg-card-bg rounded-lg border border-border-color p-2 md:p-4">
        {isMobile ? <MobileChart /> : <DesktopChart />}
      </div>

      {/* Selected range stats */}
      {selectedRange && (
        <div className="mt-4 p-3 bg-card-bg rounded-lg border border-border-color">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-3">
            <div>
              <p className="text-primary font-medium text-sm mb-2">Selected Range Analysis</p>
              
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
                    <input
                      type="week"
                      value={selectedRange.start}
                      min={chartData[0]?.date || "2022-W09"}
                      max={chartData[chartData.length - 1]?.date || "2025-W52"}
                      onChange={(e) => handleManualDateChange(e.target.value, selectedRange.end)}
                      className="px-2 py-1 text-xs bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-text-muted text-xs">To:</label>
                    <input
                      type="week"
                      value={selectedRange.end}
                      min={chartData[0]?.date || "2022-W09"}
                      max={chartData[chartData.length - 1]?.date || "2025-W52"}
                      onChange={(e) => handleManualDateChange(selectedRange.start, e.target.value)}
                      className="px-2 py-1 text-xs bg-background border border-border-color rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
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
              <div className="w-3 h-1 bg-[#0057B7]"></div>
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
              <div className="w-3 h-1 bg-[#DA291C]"></div>
              <span className="text-text-muted">Russia Cumulative</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
