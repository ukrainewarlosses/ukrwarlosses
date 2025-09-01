'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { hardcodedChartData, ChartData } from '@/data/hardcoded-chart-data';

type TimePeriod = 'monthly' | 'weekly';

export default function Chart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Use hardcoded data based on time period
    const data = timePeriod === 'monthly' ? hardcodedChartData.monthly : hardcodedChartData.weekly;
    
    console.log(`Chart loading ${timePeriod} hardcoded data:`, {
      dataPoints: data.length,
      firstPoint: data[0]?.date,
      lastPoint: data[data.length - 1]?.date,
      lastUpdated: hardcodedChartData.lastUpdated
    });
    
    setChartData(data);
    setLoading(false);
  }, [timePeriod]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className={`bg-gray-800 border border-border-color rounded-lg shadow-lg ${isMobile ? 'p-2 text-xs' : 'p-4'}`}>
          <p className={`text-text-primary font-medium ${isMobile ? 'mb-1 text-xs' : 'mb-3'}`}>
            {isMobile ? label : `${timePeriod === 'monthly' ? 'Month' : 'Week'}: ${label}`}
          </p>
          
          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <div>
              <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#0057B7' }}>
                {isMobile ? 'UA Total' : 'Ukrainian Total (Deaths + Missing)'}
              </p>
              <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {isMobile ? 'Period' : timePeriod === 'monthly' ? 'Monthly' : 'Weekly'}: {data.ukraineTotal?.toLocaleString() || 0}
                {!isMobile && ` (${(data.ukraineDeaths || 0).toLocaleString()} + ${(data.ukraineMissing || 0).toLocaleString()})`}
              </p>
              <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>{isMobile ? 'Cum' : 'Cumulative'}: {data.ukraineTotalCumulative?.toLocaleString() || 0}</p>
            </div>
            
            <div>
              <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#DA291C' }}>
                {isMobile ? 'RU Deaths' : 'Russian Deaths'}
              </p>
              <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>{isMobile ? 'Period' : timePeriod === 'monthly' ? 'Monthly' : 'Weekly'}: {data.russiaDeaths?.toLocaleString() || 0}</p>
              <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>{isMobile ? 'Cum' : 'Cumulative'}: {data.russiaTotalCumulative?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-75 bg-gray-800 border-2 border-dashed border-gray-600 rounded-md flex items-center justify-content-center text-text-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          Loading chart data...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setTimePeriod('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timePeriod === 'monthly'
                ? 'bg-primary text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimePeriod('weekly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timePeriod === 'weekly'
                ? 'bg-primary text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-80 sm:h-96 lg:h-[28rem] w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ 
              top: isMobile ? 25 : 20, 
              right: isMobile ? 20 : 30, 
              left: isMobile ? 15 : 20, 
              bottom: isMobile ? 80 : 40 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
            <XAxis 
              dataKey="date" 
              stroke="#a0aec0" 
              fontSize={isMobile ? 10 : 12}
              tick={{ fill: '#a0aec0', fontSize: isMobile ? 10 : 12 }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 40}
              interval={isMobile ? 'preserveStartEnd' : (timePeriod === 'weekly' ? 10 : 3)}
            />
            <YAxis 
              yAxisId="period"
              stroke="#a0aec0" 
              fontSize={isMobile ? 9 : 12}
              tick={{ fill: '#a0aec0', fontSize: isMobile ? 9 : 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={isMobile ? 30 : 50}
            />
            <YAxis 
              yAxisId="cumulative"
              orientation="right"
              stroke="#a0aec0" 
              fontSize={isMobile ? 9 : 12}
              tick={{ fill: '#a0aec0', fontSize: isMobile ? 9 : 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={isMobile ? 30 : 50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                color: '#a0aec0', 
                fontSize: isMobile ? '12px' : '12px',
                paddingTop: '10px'
              }}
              iconType="line"
              layout={isMobile ? 'vertical' : 'horizontal'}
              align={isMobile ? 'right' : 'center'}
              verticalAlign={isMobile ? 'top' : 'bottom'}
            />
            <Line 
              yAxisId="period"
              type="monotone" 
              dataKey="ukraineTotal" 
              stroke="#0057B7" 
              strokeWidth={isMobile ? 3 : 4}
              name={isMobile ? "UA Total" : "Ukrainian Total (Deaths + Missing)"}
              dot={{ fill: '#0057B7', strokeWidth: 1, r: isMobile ? 3 : 4 }}
              activeDot={{ r: isMobile ? 4 : 6, stroke: '#0057B7', strokeWidth: 1, fill: '#0057B7' }}
            />

            <Line 
              yAxisId="period"
              type="monotone" 
              dataKey="russiaDeaths" 
              stroke="#DA291C" 
              strokeWidth={isMobile ? 2 : 2.5}
              name={isMobile ? "RU Deaths" : "Russian Deaths"}
              dot={{ fill: '#DA291C', strokeWidth: 1, r: isMobile ? 2 : 3 }}
              activeDot={{ r: isMobile ? 3 : 5, stroke: '#DA291C', strokeWidth: 1, fill: '#DA291C' }}
            />
            <Line 
              yAxisId="cumulative"
              type="monotone" 
              dataKey="ukraineTotalCumulative" 
              stroke="#0057B7" 
              strokeWidth={isMobile ? 2 : 3}
              strokeDasharray="5 5"
              name={isMobile ? "UA Total (Cum)" : "Ukrainian Total (Cumulative)"}
              dot={false}
              activeDot={{ r: isMobile ? 3 : 5, stroke: '#0057B7', strokeWidth: 1, fill: '#0057B7' }}
            />
            <Line 
              yAxisId="cumulative"
              type="monotone" 
              dataKey="russiaTotalCumulative" 
              stroke="#DA291C" 
              strokeWidth={isMobile ? 2 : 3}
              strokeDasharray="5 5"
              name={isMobile ? "RU Total (Cum)" : "Russian Total (Cumulative)"}
              dot={false}
              activeDot={{ r: isMobile ? 3 : 5, stroke: '#DA291C', strokeWidth: 1, fill: '#DA291C' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
