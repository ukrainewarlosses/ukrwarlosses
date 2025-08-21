'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartProps } from '@/types';

interface ChartData {
  date: string;
  isoDate: string; // For sorting/filtering
  ukraineTotal: number;
  ukraineDeaths: number;
  ukraineMissing: number;
  ukraineTotalCumulative: number;
  russiaDeaths: number;
  russiaTotalCumulative: number;
}

type TimePeriod = 'monthly' | 'weekly';

export default function Chart({ ukraineHistorical, russiaHistorical, ukraineWeekly, russiaWeekly }: ChartProps) {
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
    const processHistoricalData = () => {
      const dataMap: { [key: string]: ChartData } = {};

      // Choose data source based on time period
      const ukraineData = timePeriod === 'monthly' ? ukraineHistorical : (ukraineWeekly || []);
      const russiaData = timePeriod === 'monthly' ? russiaHistorical : (russiaWeekly || []);
      
      // Debug logging
      console.log(`Chart processing ${timePeriod} data:`, {
        ukraineDataLength: ukraineData.length,
        russiaDataLength: russiaData.length,
        timePeriod
      });

      if (ukraineData && ukraineData.length > 0) {
        ukraineData.forEach(item => {
          let dateKey: string;
          let isoDate: string;
          
          if (timePeriod === 'monthly') {
            // Monthly data: "2022-02-01" format
            const [year, month] = item.date.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            dateKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            isoDate = `${year}-${month}-01`;
          } else {
            // Weekly data: "2022-W09" format
            dateKey = item.date; // Use week key directly
            isoDate = item.date;
          }
          
          if (!dataMap[dateKey]) {
            dataMap[dateKey] = { 
              date: dateKey, 
              isoDate, 
              ukraineTotal: 0, 
              ukraineDeaths: 0, 
              ukraineMissing: 0, 
              ukraineTotalCumulative: 0,
              russiaDeaths: 0,
              russiaTotalCumulative: 0
            };
          }
          
          const deaths = item.confirmed || 0;
          const missing = item.unconfirmed || 0;
          const total = deaths + missing;
          dataMap[dateKey].ukraineTotal = total;
          dataMap[dateKey].ukraineDeaths = deaths;
          dataMap[dateKey].ukraineMissing = missing;
        });
      }

      if (russiaData && russiaData.length > 0) {
        russiaData.forEach(item => {
          let dateKey: string;
          let isoDate: string;
          
          if (timePeriod === 'monthly') {
            // Monthly data: "2022-02-01" format
            const [year, month] = item.date.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            dateKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            isoDate = `${year}-${month}-01`;
          } else {
            // Weekly data: "2022-W09" format
            dateKey = item.date; // Use week key directly
            isoDate = item.date;
          }
          
          if (!dataMap[dateKey]) {
            dataMap[dateKey] = { 
              date: dateKey, 
              isoDate, 
              ukraineTotal: 0, 
              ukraineDeaths: 0, 
              ukraineMissing: 0, 
              ukraineTotalCumulative: 0,
              russiaDeaths: 0,
              russiaTotalCumulative: 0
            };
          }
          
          const deaths = item.casualties || 0; // Russia data has deaths in casualties field
          dataMap[dateKey].russiaDeaths = deaths;
        });
      }

      const processedData = Object.values(dataMap);
      if (processedData.length > 0) {
        // Cut off at last fully completed period (exclude current period and future)
        const now = new Date();
        let filtered: ChartData[];
        
        if (timePeriod === 'monthly') {
          const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Previous month
          filtered = processedData.filter(p => {
            const d = new Date(p.isoDate);
            return d < cutoffDate;
          });
        } else {
          // For weekly data, we need to handle the ISO week format differently
          // Calculate the current week number and exclude current week
          const currentYear = now.getFullYear();
          const startOfYear = new Date(currentYear, 0, 1);
          const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
          const currentWeekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
          const currentWeekKey = `${currentYear}-W${String(currentWeekNumber).padStart(2, '0')}`;
          
          filtered = processedData.filter(p => {
            // For weekly data, compare week keys directly
            return p.date < currentWeekKey;
          });
        }

        const sortedData = filtered.sort((a, b) => {
          if (timePeriod === 'monthly') {
            const [monthA, yearA] = a.date.split(' ');
            const [monthB, yearB] = b.date.split(' ');
            const dateA = new Date(monthA + ' 1, ' + yearA);
            const dateB = new Date(monthB + ' 1, ' + yearB);
            return dateA.getTime() - dateB.getTime();
          } else {
            // Weekly data is already in sortable format (YYYY-W##)
            return a.date.localeCompare(b.date);
          }
        });

        let ukraineTotalCum = 0;
        let russiaTotalCum = 0;
        const finalData = sortedData.map(item => {
          ukraineTotalCum += item.ukraineTotal;
          russiaTotalCum += item.russiaDeaths;
          return {
            ...item,
            ukraineTotalCumulative: ukraineTotalCum,
            russiaTotalCumulative: russiaTotalCum
          };
        });
        
        console.log(`Final ${timePeriod} chart data:`, {
          dataPoints: finalData.length,
          firstPoint: finalData[0]?.date,
          lastPoint: finalData[finalData.length - 1]?.date
        });
        
        return finalData;
      }

      return [] as ChartData[];
    };

    const processedData = processHistoricalData();
    setChartData(processedData);
    setLoading(false);
  }, [ukraineHistorical, russiaHistorical, ukraineWeekly, russiaWeekly, timePeriod]);

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
              <p className={`font-medium text-yellow-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isMobile ? 'UA Total' : 'Ukrainian Total (Deaths + Missing)'}
              </p>
              <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {isMobile ? 'Period' : timePeriod === 'monthly' ? 'Monthly' : 'Weekly'}: {data.ukraineTotal?.toLocaleString() || 0}
                {!isMobile && ` (${(data.ukraineDeaths || 0).toLocaleString()} + ${(data.ukraineMissing || 0).toLocaleString()})`}
              </p>
              <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>{isMobile ? 'Cum' : 'Cumulative'}: {data.ukraineTotalCumulative?.toLocaleString() || 0}</p>
            </div>
            
            <div>
              <p className={`font-medium text-red-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
              stroke="#ffd700" 
              strokeWidth={isMobile ? 3 : 4}
              name={isMobile ? "UA Total" : "Ukrainian Total (Deaths + Missing)"}
              dot={{ fill: '#ffd700', strokeWidth: 1, r: isMobile ? 3 : 4 }}
              activeDot={{ r: isMobile ? 4 : 6, stroke: '#ffd700', strokeWidth: 1, fill: '#ffd700' }}
            />

            <Line 
              yAxisId="period"
              type="monotone" 
              dataKey="russiaDeaths" 
              stroke="#f44336" 
              strokeWidth={isMobile ? 2 : 2.5}
              name={isMobile ? "RU Deaths" : "Russian Deaths"}
              dot={{ fill: '#f44336', strokeWidth: 1, r: isMobile ? 2 : 3 }}
              activeDot={{ r: isMobile ? 3 : 5, stroke: '#f44336', strokeWidth: 1, fill: '#f44336' }}
            />
            <Line 
              yAxisId="cumulative"
              type="monotone" 
              dataKey="ukraineTotalCumulative" 
              stroke="#ffeb3b" 
              strokeWidth={isMobile ? 2 : 3}
              strokeDasharray="5 5"
              name={isMobile ? "UA Total (Cum)" : "Ukrainian Total (Cumulative)"}
              dot={false}
              activeDot={{ r: isMobile ? 3 : 5, stroke: '#ffeb3b', strokeWidth: 1, fill: '#ffeb3b' }}
            />
            <Line 
              yAxisId="cumulative"
              type="monotone" 
              dataKey="russiaTotalCumulative" 
              stroke="#ef5350" 
              strokeWidth={isMobile ? 2 : 3}
              strokeDasharray="5 5"
              name={isMobile ? "RU Total (Cum)" : "Russian Total (Cumulative)"}
              dot={false}
              activeDot={{ r: isMobile ? 3 : 5, stroke: '#ef5350', strokeWidth: 1, fill: '#ef5350' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
