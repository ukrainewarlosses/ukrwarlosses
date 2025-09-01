'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { hardcodedChartData, ChartData } from '@/data/hardcoded-chart-data';

type TimePeriod = 'daily' | 'weekly' | 'monthly';

export default function Chart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');
  
  // Range selection states
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<{
    start: string;
    end: string;
    data: ChartData[];
    ukraineTotal: number;
    russiaTotal: number;
  } | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Load data based on time period
    const data = timePeriod === 'daily' 
      ? hardcodedChartData.daily 
      : timePeriod === 'weekly' 
        ? hardcodedChartData.weekly 
        : hardcodedChartData.monthly;
    
    setChartData(data);
    setLoading(false);
    setSelectedRange(null); // Reset selection when changing period
  }, [timePeriod]);

  // Range selection handlers
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

  if (loading) {
    return (
      <div className="h-96 bg-card-bg border border-border-color rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-text-muted">Loading chart data...</p>
        </div>
      </div>
    );
  }

  const displayData = selectedRange ? selectedRange.data : chartData;

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-card-bg rounded-lg p-1 border border-border-color">
          <button
            onClick={() => setTimePeriod('daily')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timePeriod === 'daily'
                ? 'bg-primary text-background'
                : 'text-text-secondary hover:text-text-primary hover:bg-gray-700'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimePeriod('weekly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timePeriod === 'weekly'
                ? 'bg-primary text-background'
                : 'text-text-secondary hover:text-text-primary hover:bg-gray-700'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimePeriod('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timePeriod === 'monthly'
                ? 'bg-primary text-background'
                : 'text-text-secondary hover:text-text-primary hover:bg-gray-700'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Instructions */}
      {!selectedRange && (
        <p className="text-center text-text-muted text-sm mb-4">
          Click and drag on the chart to select a date range
        </p>
      )}

      {/* Chart Container */}
      <div className="h-96 lg:h-[28rem] w-full bg-card-bg rounded-lg border border-border-color p-4">
        <ResponsiveContainer width="100%" height="100%">
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
              bottom: isMobile ? 80 : 40 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
            
            {/* X-Axis */}
            <XAxis 
              dataKey="date" 
              stroke="#a0aec0" 
              fontSize={isMobile ? 10 : 12}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 40}
              interval={timePeriod === 'daily' ? 'preserveStartEnd' : 
                       timePeriod === 'weekly' ? (isMobile ? 10 : 5) : 
                       (isMobile ? 3 : 2)}
            />
            
            {/* Left Y-Axis for Period Data */}
            <YAxis 
              yAxisId="period"
              stroke="#a0aec0" 
              fontSize={isMobile ? 9 : 12}
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
              fontSize={isMobile ? 9 : 12}
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
            <Line 
              yAxisId="period"
              type="monotone" 
              dataKey="ukraineTotal" 
              stroke="#0057B7" 
              strokeWidth={2}
              opacity={0.8}
              name="Ukraine Period"
              dot={{ fill: '#0057B7', r: isMobile ? 2 : 3 }}
              activeDot={{ r: isMobile ? 4 : 5 }}
            />
            
            <Line 
              yAxisId="period"
              type="monotone" 
              dataKey="russiaDeaths" 
              stroke="#DA291C" 
              strokeWidth={2}
              opacity={0.8}
              name="Russia Period"
              dot={{ fill: '#DA291C', r: isMobile ? 2 : 3 }}
              activeDot={{ r: isMobile ? 4 : 5 }}
            />
            
            {/* Cumulative Lines (Thicker, Always Visible) */}
            <Line 
              yAxisId="cumulative"
              type="monotone" 
              dataKey="ukraineTotalCumulative" 
              stroke="#0057B7" 
              strokeWidth={3}
              name="Ukraine Cumulative"
              dot={false}
              activeDot={{ r: isMobile ? 4 : 6 }}
            />
            
            <Line 
              yAxisId="cumulative"
              type="monotone" 
              dataKey="russiaTotalCumulative" 
              stroke="#DA291C" 
              strokeWidth={3}
              name="Russia Cumulative"
              dot={false}
              activeDot={{ r: isMobile ? 4 : 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Range Statistics */}
      {selectedRange && (
        <div className="mt-6 p-4 bg-card-bg rounded-lg border border-border-color">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-primary font-medium text-lg mb-1">
                Selected Range Analysis
              </h3>
              <p className="text-text-muted text-sm">
                {selectedRange.start} to {selectedRange.end}
              </p>
            </div>
            <button 
              onClick={() => setSelectedRange(null)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
            >
              Reset Selection
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-3">
              <p className="text-text-muted text-xs mb-1">Ukraine Period Total</p>
              <p className="text-2xl font-bold" style={{ color: '#0057B7' }}>
                {selectedRange.ukraineTotal.toLocaleString()}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-text-muted text-xs mb-1">Russia Period Total</p>
              <p className="text-2xl font-bold" style={{ color: '#DA291C' }}>
                {selectedRange.russiaTotal.toLocaleString()}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-text-muted text-xs mb-1">Days in Range</p>
              <p className="text-2xl font-bold text-text-primary">
                {selectedRange.data.length}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-text-muted text-xs mb-1">Daily Average</p>
              <p className="text-2xl font-bold text-primary">
                {Math.round((selectedRange.ukraineTotal + selectedRange.russiaTotal) / selectedRange.data.length).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
