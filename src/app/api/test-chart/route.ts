import { NextResponse } from 'next/server';
import { loadCasualtyData } from '@/lib/dataLoader';

export async function GET() {
  try {
    const data = await loadCasualtyData();
    
    // Process the Ukrainian data like the chart does
    const dataMap: { [key: string]: any } = {};
    
    if (data.ukraineHistorical && data.ukraineHistorical.length > 0) {
      data.ukraineHistorical.forEach((item) => {
        // Parse the date correctly - item.date is in format "2025-07-01"
        const [year, month, day] = item.date.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // month is 0-indexed
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        // Ensure we're using the total casualties (confirmed + unconfirmed)
        let totalCasualties = item.casualties;
        
        // If casualties is 0 or undefined, try to calculate from confirmed + unconfirmed
        if (!totalCasualties && (item.confirmed || item.unconfirmed)) {
          totalCasualties = (item.confirmed || 0) + (item.unconfirmed || 0);
        }
        
        dataMap[dateKey] = {
          date: dateKey,
          ukraine: totalCasualties || 0,
          originalDate: item.date,
          casualties: item.casualties,
          confirmed: item.confirmed,
          unconfirmed: item.unconfirmed
        };
      });
    }
    
    const processedData = Object.values(dataMap);
    
    // Sort the data
    const sortedData = processedData.sort((a: any, b: any) => {
      const [monthA, yearA] = a.date.split(' ');
      const [monthB, yearB] = b.date.split(' ');
      
      const dateA = new Date(monthA + ' 1, ' + yearA);
      const dateB = new Date(monthB + ' 1, ' + yearB);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Return the last few months for debugging
    const last5Months = sortedData.slice(-5);
    
    return NextResponse.json({
      totalEntries: data.ukraineHistorical?.length || 0,
      processedEntries: processedData.length,
      last5Months,
      july2025: sortedData.find((item: any) => item.date.includes('Jul 2025')),
      june2025: sortedData.find((item: any) => item.date.includes('Jun 2025'))
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process data', details: error }, { status: 500 });
  }
}
