#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function testRussia2022Production() {
    console.log('🇷🇺 Testing Russia scraper - First 2000 records from 2022...');
    console.log('This will test the production-ready API with rate limiting protection');
    console.log('');

    const startTime = Date.now();
    
    try {
        // Call the Russia casualties API
        // Using maxPages to limit the number of pages for testing
        console.log('📡 Calling Russia scraper API...');
        console.log('Parameters: maxPages=50 (to get ~2000 records), delayMs=1500');
        
        const response = await fetch('http://localhost:3000/api/scrape-russia-casualties?maxPages=50&delayMs=1500', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
            const elapsed = (Date.now() - startTime) / 1000;
            console.log(`✅ Russia scraping completed successfully!`);
            console.log(`📊 Records extracted: ${result.total.toLocaleString()}`);
            console.log(`⏱️  Total time: ${elapsed.toFixed(1)} seconds`);
            console.log(`📈 Average rate: ${(result.total / elapsed).toFixed(1)} records/sec`);
            console.log(`💾 Data saved to: ${result.outputPath}`);
            
            // Verify the data file
            console.log('\n🔍 Verifying data file...');
            const dataExists = await fs.access(result.outputPath).then(() => true).catch(() => false);
            
            if (dataExists) {
                const fileStats = await fs.stat(result.outputPath);
                console.log(`📁 File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
                
                // Parse and analyze the data
                const rawData = await fs.readFile(result.outputPath, 'utf8');
                const records = JSON.parse(rawData);
                
                console.log(`📋 Records in file: ${records.length.toLocaleString()}`);
                
                if (records.length > 0) {
                    // Show sample data
                    console.log('\n📝 Sample records:');
                    records.slice(0, 5).forEach((record: any, i: number) => {
                        console.log(`  ${i + 1}. ${record.fullName} - ${record.date}`);
                        console.log(`     Year: ${record.year || 'N/A'}, Link: ${record.confirmationLink ? 'Yes' : 'No'}`);
                    });
                    
                    // Analyze data distribution
                    const monthCounts: Record<string, number> = {};
                    const yearCounts: Record<string, number> = {};
                    
                    for (const record of records) {
                        if (record.date) {
                            const dateMatch = record.date.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
                            if (dateMatch) {
                                const [, day, month, year] = dateMatch;
                                const monthKey = `${year}-${month.padStart(2, '0')}`;
                                monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
                                yearCounts[year] = (yearCounts[year] || 0) + 1;
                            }
                        }
                    }
                    
                    console.log('\n📊 Data Analysis:');
                    console.log('Monthly distribution (top 5):');
                    Object.entries(monthCounts)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .forEach(([month, count]) => {
                            console.log(`  ${month}: ${count} casualties`);
                        });
                    
                    console.log('\nYearly distribution:');
                    Object.entries(yearCounts)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .forEach(([year, count]) => {
                            console.log(`  ${year}: ${count} casualties`);
                        });
                }
                
                // Run the monthly compiler
                console.log('\n📈 Running monthly compiler...');
                const compilerResult = await execAsync(`npx tsx scripts/compile-russia-monthly.ts --input="${result.outputPath}"`);
                console.log('Compiler output:', compilerResult.stdout);
                
                // Verify monthly data
                const monthlyPath = path.join(process.cwd(), 'src', 'data', 'russia', `monthly_${new Date().toISOString().split('T')[0]}.json`);
                const monthlyExists = await fs.access(monthlyPath).then(() => true).catch(() => false);
                
                if (monthlyExists) {
                    const monthlyData = JSON.parse(await fs.readFile(monthlyPath, 'utf8'));
                    const monthlyKeys = Object.keys(monthlyData);
                    console.log(`✅ Monthly data compiled: ${monthlyKeys.length} months`);
                    console.log(`📅 Date range: ${monthlyKeys[0]} to ${monthlyKeys[monthlyKeys.length - 1]}`);
                    
                    // Show sample monthly data
                    console.log('\n📊 Monthly totals sample:');
                    Object.entries(monthlyData).slice(-3).forEach(([month, data]: [string, any]) => {
                        console.log(`  ${month}: ${data.total} total deaths`);
                    });
                } else {
                    console.log('⚠️ Monthly data compilation failed');
                }
                
            } else {
                console.log('❌ Data file not found');
            }
            
        } else {
            console.log(`❌ Russia scraper failed: ${result.error}`);
        }
        
    } catch (error) {
        const elapsed = (Date.now() - startTime) / 1000;
        console.error(`❌ Test failed after ${elapsed.toFixed(1)}s:`, error);
        
        if (error instanceof Error && error.message.includes('fetch')) {
            console.log('\n💡 Troubleshooting tips:');
            console.log('1. Make sure the dev server is running: npm run dev');
            console.log('2. Check if the API endpoint is accessible: http://localhost:3000/api/scrape-russia-casualties');
            console.log('3. The API might be rate-limited - try with smaller batchSize');
        }
    }
}

testRussia2022Production();
