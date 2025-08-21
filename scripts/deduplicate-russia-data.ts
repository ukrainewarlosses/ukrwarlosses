#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

type RussianCasualtyRecord = {
    date: string;
    fullName: string;
    confirmationLink: string;
    year?: number;
};

async function deduplicateRussiaData() {
    console.log('🔄 Running Russian casualties deduplication...');
    
    try {
        const inputPath = path.join(process.cwd(), 'src', 'data', 'russia', 'casualties.json');
        const outputPath = path.join(process.cwd(), 'src', 'data', 'russia', 'casualties-deduplicated.json');
        const backupPath = path.join(process.cwd(), 'src', 'data', 'russia', 'casualties-raw.json');
        
        console.log(`📖 Reading raw data from: ${inputPath}`);
        
        // Read the raw data
        const rawData = await fs.readFile(inputPath, 'utf8');
        const records: RussianCasualtyRecord[] = JSON.parse(rawData);
        
        console.log(`📊 Raw records loaded: ${records.length.toLocaleString()}`);
        
        // Backup the raw data
        await fs.writeFile(backupPath, rawData);
        console.log(`💾 Raw data backed up to: ${backupPath}`);
        
        // Deduplication logic
        const seen = new Set<string>();
        const deduplicatedRecords: RussianCasualtyRecord[] = [];
        let duplicatesFound = 0;
        
        console.log('🔍 Processing records for deduplication...');
        
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            
            // Create unique key for deduplication
            const key = `${record.date}|${record.fullName}|${record.confirmationLink}`;
            
            if (!seen.has(key)) {
                seen.add(key);
                deduplicatedRecords.push(record);
            } else {
                duplicatesFound++;
            }
            
            // Progress reporting
            if ((i + 1) % 1000 === 0) {
                console.log(`   Processed: ${(i + 1).toLocaleString()}/${records.length.toLocaleString()} (${duplicatesFound} duplicates found)`);
            }
        }
        
        console.log(`✅ Deduplication completed!`);
        console.log(`📊 Results:`);
        console.log(`   Original records: ${records.length.toLocaleString()}`);
        console.log(`   Unique records: ${deduplicatedRecords.length.toLocaleString()}`);
        console.log(`   Duplicates removed: ${duplicatesFound.toLocaleString()}`);
        console.log(`   Deduplication rate: ${((duplicatesFound / records.length) * 100).toFixed(1)}%`);
        
        // Analyze the deduplicated data
        console.log('\n📈 Data analysis:');
        
        const yearCounts: Record<number, number> = {};
        let recordsWithLinks = 0;
        let recordsWithYear = 0;
        
        for (const record of deduplicatedRecords) {
            if (record.year) {
                yearCounts[record.year] = (yearCounts[record.year] || 0) + 1;
                recordsWithYear++;
            }
            if (record.confirmationLink) {
                recordsWithLinks++;
            }
        }
        
        console.log(`   Records with confirmation links: ${recordsWithLinks}/${deduplicatedRecords.length} (${((recordsWithLinks/deduplicatedRecords.length)*100).toFixed(1)}%)`);
        console.log(`   Records with year: ${recordsWithYear}/${deduplicatedRecords.length} (${((recordsWithYear/deduplicatedRecords.length)*100).toFixed(1)}%)`);
        
        if (Object.keys(yearCounts).length > 0) {
            console.log('   Year distribution:');
            Object.entries(yearCounts)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .forEach(([year, count]) => {
                    console.log(`     ${year}: ${count.toLocaleString()} records`);
                });
        }
        
        // Save deduplicated data
        console.log(`\n💾 Saving deduplicated data...`);
        await fs.writeFile(outputPath, JSON.stringify(deduplicatedRecords, null, 2));
        console.log(`✅ Deduplicated data saved to: ${outputPath}`);
        
        // Replace the original file with deduplicated data
        await fs.writeFile(inputPath, JSON.stringify(deduplicatedRecords, null, 2));
        console.log(`✅ Original file updated with deduplicated data`);
        
        // File size comparison
        const originalStats = await fs.stat(backupPath);
        const deduplicatedStats = await fs.stat(inputPath);
        
        console.log(`\n📁 File size comparison:`);
        console.log(`   Original: ${(originalStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Deduplicated: ${(deduplicatedStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Space saved: ${((originalStats.size - deduplicatedStats.size) / 1024 / 1024).toFixed(2)} MB`);
        
        console.log(`\n🎉 Deduplication process completed successfully!`);
        console.log(`📊 Final dataset: ${deduplicatedRecords.length.toLocaleString()} unique records`);
        
        return {
            originalCount: records.length,
            deduplicatedCount: deduplicatedRecords.length,
            duplicatesRemoved: duplicatesFound,
            deduplicationRate: (duplicatesFound / records.length) * 100
        };
        
    } catch (error) {
        console.error('❌ Deduplication failed:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    deduplicateRussiaData().catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

export { deduplicateRussiaData };
