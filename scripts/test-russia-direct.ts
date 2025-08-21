#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';

type ZonaListItem = {
    id?: string | number;
    _id?: string | number;
    slug?: string;
    url?: string;
    name?: string;
    color?: number;
    [key: string]: any;
};

async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

async function writeStreamAsync(stream: ReturnType<typeof createWriteStream>, text: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const canWrite = stream.write(text, 'utf8');
        if (canWrite) return resolve();
        stream.once('drain', resolve);
        stream.once('error', reject);
    });
}

async function fetchWithRetry<T>(url: string, retries: number = 3): Promise<T> {
    let attempt = 0;
    let lastError: unknown = null;
    
    while (attempt <= retries) {
        try {
            const res = await fetch(url, { 
                cache: 'no-store',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (res.status === 429) {
                console.log(`  Rate limited, waiting 3s before retry...`);
                await sleep(3000);
                attempt += 1;
                continue;
            }
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status} fetching ${url}`);
            }
            
            return await res.json() as T;
        } catch (err) {
            lastError = err;
            if (attempt === retries) break;
            await sleep(1000 * Math.pow(2, attempt));
            attempt += 1;
        }
    }
    throw lastError instanceof Error ? lastError : new Error('Unknown fetch error');
}

async function testRussiaDirect() {
    console.log('🇷🇺 Direct Russia scraper test - First 50 records from 2022...');
    console.log('This bypasses the Next.js API and calls zona.media directly');
    console.log('');

    const startTime = Date.now();
    
    try {
        // Get 2022 list
        console.log('📡 Fetching 2022 casualty list...');
        const listUrl = 'https://200.zona.media/api/case?death=2022';
        const listData = await fetchWithRetry<ZonaListItem[]>(listUrl);
        
        console.log(`✅ Got ${listData.length.toLocaleString()} items from 2022`);
        
        // Take first 50 for testing (to simulate getting ~2000 we'd need to do this 40 times)
        const targetRecords = 50;
        const testItems = listData.slice(0, targetRecords);
        
        console.log(`🎯 Testing with first ${targetRecords} records...`);
        
        // Set up streaming write
        const outputPath = path.join(process.cwd(), 'src', 'data', 'russia', 'casualties.json');
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });
        
        const tempPath = `${outputPath}.tmp`;
        const stream = createWriteStream(tempPath, { encoding: 'utf8' });
        
        let recordsWritten = 0;
        let successfulFetches = 0;
        
        await new Promise<void>((resolve, reject) => {
            stream.once('open', () => resolve());
            stream.once('error', reject);
        });
        
        await writeStreamAsync(stream, '[\n');
        
        console.log('🔄 Fetching details with 1-second delays...');
        
        for (let i = 0; i < testItems.length; i++) {
            const item = testItems[i];
            
            try {
                const detailUrl = `https://200.zona.media/api/case/${item.url}`;
                console.log(`  ${i + 1}/${testItems.length}: ${item.name}`);
                
                const detail = await fetchWithRetry<any>(detailUrl);
                
                const enriched = { ...detail, year: 2022 };
                const json = JSON.stringify(enriched);
                
                if (recordsWritten > 0) {
                    await writeStreamAsync(stream, ',\n');
                }
                
                await writeStreamAsync(stream, json);
                recordsWritten++;
                successfulFetches++;
                
            } catch (err) {
                console.log(`    ❌ Failed: ${err}`);
            }
            
            await sleep(1000); // 1-second delay
        }
        
        await writeStreamAsync(stream, '\n]\n');
        await new Promise<void>((resolve, reject) => {
            stream.end(() => resolve());
            stream.once('error', reject);
        });
        
        await fs.rename(tempPath, outputPath);
        
        const totalTime = (Date.now() - startTime) / 1000;
        const rate = successfulFetches / totalTime;
        
        console.log(`\n✅ Direct test completed:`);
        console.log(`📊 Records written: ${recordsWritten}`);
        console.log(`📈 Success rate: ${successfulFetches}/${testItems.length} (${((successfulFetches/testItems.length)*100).toFixed(1)}%)`);
        console.log(`⏱️  Total time: ${totalTime.toFixed(1)}s`);
        console.log(`🚀 Average rate: ${rate.toFixed(1)} records/sec`);
        
        // Estimate for 2000 records
        const estimatedTimeFor2000 = (2000 / rate) / 60;
        console.log(`⏰ Estimated time for 2000 records: ${estimatedTimeFor2000.toFixed(1)} minutes`);
        
        // Show sample data
        if (recordsWritten > 0) {
            const testData = JSON.parse(await fs.readFile(outputPath, 'utf8'));
            console.log(`\n📋 Sample data (first 3 records):`);
            testData.slice(0, 3).forEach((record: any, i: number) => {
                console.log(`  ${i + 1}. ${record.name} - ${record.death} (${record.region})`);
            });
            
            // Test the monthly compiler
            console.log('\n📈 Testing monthly compiler...');
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            try {
                const compilerResult = await execAsync('npx tsx scripts/compile-russia-monthly.ts');
                console.log('✅ Monthly compiler worked:');
                console.log(compilerResult.stdout.split('\n').slice(-5).join('\n')); // Last 5 lines
            } catch (compilerError) {
                console.log('❌ Monthly compiler failed:', compilerError);
            }
        }
        
        console.log(`\n🎯 Production scaling insights:`);
        console.log(`   For 2000 records: ~${(2000 / rate / 60).toFixed(1)} minutes`);
        console.log(`   For 18,517 records (full 2022): ~${(18517 / rate / 60).toFixed(1)} minutes`);
        console.log(`   For 101,372 records (all years): ~${(101372 / rate / 3600).toFixed(1)} hours`);
        
    } catch (error) {
        console.error('❌ Direct test failed:', error);
    }
}

testRussiaDirect();
