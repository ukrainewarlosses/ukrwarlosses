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
                const waitTime = 5000; // 5 second wait for rate limiting
                console.log(`    Rate limited, waiting ${waitTime/1000}s...`);
                await sleep(waitTime);
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
            await sleep(2000 * Math.pow(2, attempt));
            attempt += 1;
        }
    }
    throw lastError instanceof Error ? lastError : new Error('Unknown fetch error');
}

async function extractRussia2000() {
    console.log('🇷🇺 Extracting first 2000 Russian casualties from 2022...');
    console.log('This will take approximately 50 minutes with 1.5-second delays');
    console.log('');

    const startTime = Date.now();
    const targetRecords = 2000;
    
    try {
        // Get 2022 list
        console.log('📡 Fetching 2022 casualty list...');
        const listUrl = 'https://200.zona.media/api/case?death=2022';
        const listData = await fetchWithRetry<ZonaListItem[]>(listUrl);
        
        console.log(`✅ Got ${listData.length.toLocaleString()} items from 2022`);
        console.log(`🎯 Extracting first ${targetRecords.toLocaleString()} records...`);
        
        const testItems = listData.slice(0, targetRecords);
        
        // Set up streaming write
        const outputPath = path.join(process.cwd(), 'src', 'data', 'russia', 'casualties.json');
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });
        
        const tempPath = `${outputPath}.tmp`;
        const stream = createWriteStream(tempPath, { encoding: 'utf8' });
        
        let recordsWritten = 0;
        let successfulFetches = 0;
        let rateLimitHits = 0;
        
        await new Promise<void>((resolve, reject) => {
            stream.once('open', () => resolve());
            stream.once('error', reject);
        });
        
        await writeStreamAsync(stream, '[\n');
        
        console.log('🔄 Starting extraction with 1.5-second delays...');
        console.log('Progress will be shown every 50 records');
        
        for (let i = 0; i < testItems.length; i++) {
            const item = testItems[i];
            
            try {
                const detailUrl = `https://200.zona.media/api/case/${item.url}`;
                
                const detail = await fetchWithRetry<any>(detailUrl);
                
                const enriched = { ...detail, year: 2022 };
                const json = JSON.stringify(enriched);
                
                if (recordsWritten > 0) {
                    await writeStreamAsync(stream, ',\n');
                }
                
                await writeStreamAsync(stream, json);
                recordsWritten++;
                successfulFetches++;
                
                // Progress reporting every 50 records
                if ((i + 1) % 50 === 0) {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const rate = successfulFetches / elapsed;
                    const remaining = targetRecords - (i + 1);
                    const estimatedTimeLeft = remaining / rate / 60;
                    
                    console.log(`📊 Progress: ${i + 1}/${targetRecords} (${((i + 1)/targetRecords*100).toFixed(1)}%)`);
                    console.log(`   Success: ${successfulFetches}, Rate: ${rate.toFixed(1)}/sec, ETA: ${estimatedTimeLeft.toFixed(1)}min`);
                }
                
            } catch (err) {
                if (err instanceof Error && err.message.includes('429')) {
                    rateLimitHits++;
                }
                console.log(`    ❌ ${i + 1}/${targetRecords} Failed: ${item.name} - ${err}`);
            }
            
            await sleep(1500); // 1.5-second delay
        }
        
        await writeStreamAsync(stream, '\n]\n');
        await new Promise<void>((resolve, reject) => {
            stream.end(() => resolve());
            stream.once('error', reject);
        });
        
        await fs.rename(tempPath, outputPath);
        
        const totalTime = (Date.now() - startTime) / 1000;
        const rate = successfulFetches / totalTime;
        
        console.log(`\n🎉 Extraction completed!`);
        console.log(`📊 Final Results:`);
        console.log(`   Records written: ${recordsWritten.toLocaleString()}`);
        console.log(`   Success rate: ${successfulFetches}/${targetRecords} (${((successfulFetches/targetRecords)*100).toFixed(1)}%)`);
        console.log(`   Rate limit hits: ${rateLimitHits}`);
        console.log(`   Total time: ${(totalTime/60).toFixed(1)} minutes`);
        console.log(`   Average rate: ${rate.toFixed(2)} records/sec`);
        console.log(`   File saved: ${outputPath}`);
        
        // Verify file
        const fileStats = await fs.stat(outputPath);
        console.log(`   File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
        
        // Test monthly compiler
        console.log(`\n📈 Running monthly compiler...`);
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
            const compilerResult = await execAsync('npx tsx scripts/compile-russia-monthly.ts');
            console.log('✅ Monthly compilation successful!');
            
            // Show compiler output
            const lines = compilerResult.stdout.trim().split('\n');
            lines.slice(-5).forEach((line: string) => console.log(`   ${line}`));
            
        } catch (compilerError) {
            console.log('❌ Monthly compiler failed:', compilerError);
        }
        
        console.log(`\n🎯 Production scaling insights:`);
        console.log(`   Current rate: ${rate.toFixed(2)} records/sec`);
        console.log(`   For full 2022 (18,517 records): ~${(18517 / rate / 3600).toFixed(1)} hours`);
        console.log(`   For all years (101,372 records): ~${(101372 / rate / 3600).toFixed(1)} hours`);
        console.log(`   Recommended: Process one year at a time to avoid long-running requests`);
        
    } catch (error) {
        console.error('❌ Extraction failed:', error);
    }
}

extractRussia2000();
