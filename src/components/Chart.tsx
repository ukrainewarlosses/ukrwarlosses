'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartProps } from '@/types';

interface ChartData {
  date: string;
  ukraine: number;
  russia: number;
  ukraineCumulative: number;
  russiaCumulative: number;
}

export default function Chart({ ukraineHistorical, russiaHistorical }: ChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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
    const processHistoricalData = () => {

      
      // Combine Ukrainian and Russian data by date
      const dataMap: { [key: string]: ChartData } = {};
      
      if (ukraineHistorical && ukraineHistorical.length > 0) {

        ukraineHistorical.forEach((item, index) => {
          // Parse the date correctly - item.date is in format "2025-07-01"
          const [year, month, day] = item.date.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // month is 0-indexed
          const dateKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!dataMap[dateKey]) {
            dataMap[dateKey] = { date: dateKey, ukraine: 0, russia: 0, ukraineCumulative: 0, russiaCumulative: 0 };
          }
          
          // Ensure we're using the total casualties (confirmed + unconfirmed)
          let totalCasualties = item.casualties;
          
          // If casualties is 0 or undefined, try to calculate from confirmed + unconfirmed
          if (!totalCasualties && (item.confirmed || item.unconfirmed)) {
            totalCasualties = (item.confirmed || 0) + (item.unconfirmed || 0);
          }
          
          dataMap[dateKey].ukraine = totalCasualties || 0;
          

        });
        

      } else {
        console.warn('No Ukrainian historical data available');
      }
      
      if (russiaHistorical && russiaHistorical.length > 0) {

        russiaHistorical.forEach((item, index) => {
          // Parse the date correctly - item.date is in format "2025-07-03"  
          const [year, month, day] = item.date.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // month is 0-indexed
          const dateKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!dataMap[dateKey]) {
            dataMap[dateKey] = { date: dateKey, ukraine: 0, russia: 0, ukraineCumulative: 0, russiaCumulative: 0 };
          }
          dataMap[dateKey].russia = item.casualties;
          

        });
      }
      
      const processedData = Object.values(dataMap);
      
      if (processedData.length > 0) {
        const sortedData = processedData.sort((a, b) => {
          // Better date sorting - extract year from the date string
          const [monthA, yearA] = a.date.split(' ');
          const [monthB, yearB] = b.date.split(' ');
          
          const dateA = new Date(monthA + ' 1, ' + yearA);
          const dateB = new Date(monthB + ' 1, ' + yearB);
          return dateA.getTime() - dateB.getTime();
        });
        
        // Calculate cumulative totals
        let ukraineCumulative = 0;
        let russiaCumulative = 0;
        
        const dataWithCumulative = sortedData.map(item => {
          ukraineCumulative += item.ukraine;
          russiaCumulative += item.russia;
          
          return {
            ...item,
            ukraineCumulative,
            russiaCumulative
          };
        });

        return dataWithCumulative;
      }
      
      console.warn('No data available, using fallback');
      // Fallback mock data if no historical data available
      const data: ChartData[] = [];
      const startDate = new Date('2022-02-01');

      for (let i = 0; i < 36; i++) { // 36 months from Feb 2022 to current
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        
        const ukraineMonthly = Math.floor(Math.random() * 5000) + 2000;
        const russiaMonthly = Math.floor(Math.random() * 8000) + 6000;

        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          ukraine: ukraineMonthly,
          russia: russiaMonthly,
          ukraineCumulative: 0, // Will be calculated below
          russiaCumulative: 0   // Will be calculated below
        });
      }
      
      // Calculate cumulative totals for fallback data
      let ukraineCumulative = 0;
      let russiaCumulative = 0;
      
      return data.map(item => {
        ukraineCumulative += item.ukraine;
        russiaCumulative += item.russia;
        
        return {
          ...item,
          ukraineCumulative,
          russiaCumulative
        };
      });
    };

    // Process the data
    const processedData = processHistoricalData();
    setChartData(processedData);
    setLoading(false);
  }, [ukraineHistorical, russiaHistorical]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Get the full data point
      
      return (
        <div className={`bg-gray-800 border border-border-color rounded-lg shadow-lg ${isMobile ? 'p-2 text-xs' : 'p-4'}`}>
          <p className={`text-text-primary font-medium ${isMobile ? 'mb-1 text-xs' : 'mb-3'}`}>
            {isMobile ? label : `Month: ${label}`}
          </p>
          
          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <div>
              <p className={`font-medium text-yellow-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isMobile ? 'UA' : 'Ukrainian Forces'}
              </p>
              <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {isMobile ? 'M' : 'Monthly'}: {data.ukraine?.toLocaleString() || 0}
              </p>
              <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {isMobile ? 'T' : 'Cumulative'}: {data.ukraineCumulative?.toLocaleString() || 0}
              </p>
            </div>
            
            <div>
              <p className={`font-medium text-red-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isMobile ? 'RU' : 'Russian Forces'}
              </p>
              <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {isMobile ? 'M' : 'Monthly'}: {data.russia?.toLocaleString() || 0}
              </p>
              <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {isMobile ? 'T' : 'Cumulative'}: {data.russiaCumulative?.toLocaleString() || 0}
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
      <div className="h-75 bg-gray-800 border-2 border-dashed border-gray-600 rounded-md flex items-center justify-content-center text-text-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          Loading chart data...
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 sm:h-80 lg:h-96 w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData} 
          margin={{ 
            top: 20, 
            right: isMobile ? 15 : 30, 
            left: isMobile ? 10 : 20, 
            bottom: isMobile ? 60 : 5 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
          <XAxis 
            dataKey="date" 
            stroke="#a0aec0" 
            fontSize={isMobile ? 9 : 12}
            tick={{ fill: '#a0aec0', fontSize: isMobile ? 9 : 12 }}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 60 : 30}
            interval={isMobile ? 'preserveStartEnd' : 0}
          />
          <YAxis 
            yAxisId="monthly"
            stroke="#a0aec0" 
            fontSize={isMobile ? 8 : 12}
            tick={{ fill: '#a0aec0', fontSize: isMobile ? 8 : 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            width={isMobile ? 30 : 50}
          />
          <YAxis 
            yAxisId="cumulative"
            orientation="right"
            stroke="#666"
            fontSize={isMobile ? 8 : 12}
            tick={{ fill: '#666', fontSize: isMobile ? 8 : 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            width={isMobile ? 30 : 50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ 
              color: '#a0aec0', 
              fontSize: isMobile ? '11px' : '12px',
              paddingTop: '10px'
            }}
            iconType="line"
            layout={isMobile ? 'vertical' : 'horizontal'}
            align={isMobile ? 'right' : 'center'}
            verticalAlign={isMobile ? 'top' : 'bottom'}
          />
          <Line 
            yAxisId="monthly"
            type="monotone" 
            dataKey="ukraine" 
            stroke="#ffd700" 
            strokeWidth={isMobile ? 1.5 : 2}
            name={isMobile ? "UA Monthly" : "Ukrainian Monthly Losses"}
            dot={{ fill: '#ffd700', strokeWidth: 1, r: isMobile ? 2 : 3 }}
            activeDot={{ r: isMobile ? 3 : 5, stroke: '#ffd700', strokeWidth: 1, fill: '#ffd700' }}
          />
          <Line 
            yAxisId="monthly"
            type="monotone" 
            dataKey="russia" 
            stroke="#ff6b6b" 
            strokeWidth={isMobile ? 1.5 : 2}
            name={isMobile ? "RU Monthly" : "Russian Monthly Losses"}
            dot={{ fill: '#ff6b6b', strokeWidth: 1, r: isMobile ? 2 : 3 }}
            activeDot={{ r: isMobile ? 3 : 5, stroke: '#ff6b6b', strokeWidth: 1, fill: '#ff6b6b' }}
          />
          <Line 
            yAxisId="cumulative"
            type="monotone" 
            dataKey="ukraineCumulative" 
            stroke="#b8860b" 
            strokeWidth={isMobile ? 1.5 : 2}
            strokeDasharray={isMobile ? "3 3" : "5 5"}
            name={isMobile ? "UA Total" : "Ukrainian Cumulative Total"}
            dot={false}
            activeDot={{ r: isMobile ? 2 : 4, stroke: '#b8860b', strokeWidth: 1, fill: '#b8860b' }}
          />
          <Line 
            yAxisId="cumulative"
            type="monotone" 
            dataKey="russiaCumulative" 
            stroke="#8b0000" 
            strokeWidth={isMobile ? 1.5 : 2}
            strokeDasharray={isMobile ? "3 3" : "5 5"}
            name={isMobile ? "RU Total" : "Russian Cumulative Total"}
            dot={false}
            activeDot={{ r: isMobile ? 2 : 4, stroke: '#8b0000', strokeWidth: 1, fill: '#8b0000' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
