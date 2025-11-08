#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

interface UkraineLostArmourRecord {
  name: string;
  birthDate: string;
  deathDate: string;
  missingDate: string;
  location: string;
  rawText: string;
  pageSource: string;
  detailUrl: string;
  // Additional fields from Lost Armour
  rank?: string;
  age?: string;
  conscription?: string;
  sources?: string;
  recordType?: 'death' | 'missing';
  estimatedDeathDate?: string;
}

async function deduplicateUkraineLostArmour() {
  console.log('🔄 Starting Ukrainian Lost Armour data deduplication...\n');
  
  try {
    const inputPath = path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers-raw.json');
    const outputPath = path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers.json');
    const backupPath = path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers-raw-backup.json');
    
    console.log(`📖 Reading raw data from: ${inputPath}`);
    
    // Check if raw data exists
    try {
      await fs.access(inputPath);
    } catch (error) {
      console.error(`❌ Raw data file not found: ${inputPath}`);
      console.error('   Make sure to run the Lost Armour scraper first');
      process.exit(1);
    }
    
    const rawData = await fs.readFile(inputPath, 'utf-8');
    const records: UkraineLostArmourRecord[] = JSON.parse(rawData);
    
    console.log(`📊 Raw records loaded: ${records.length.toLocaleString()}`);
    
    // Backup the original raw data
    await fs.writeFile(backupPath, JSON.stringify(records, null, 2), 'utf-8');
    console.log(`💾 Raw data backed up to: ${backupPath}`);
    
    // Enhanced deduplication using comprehensive key
    console.log(`🔑 Using comprehensive deduplication key: name + birthDate + deathDate + missingDate + location`);
    
    const uniqueRecords = new Map<string, UkraineLostArmourRecord>();
    let duplicatesRemoved = 0;
    
    console.log(`🔍 Processing records for deduplication...`);
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      // Create comprehensive key for deduplication
      const key = `${record.name || ''}|${record.birthDate || ''}|${record.deathDate || ''}|${record.missingDate || ''}|${record.location || ''}`;
      
      if (uniqueRecords.has(key)) {
        duplicatesRemoved++;
        
        // If we have a duplicate, prefer the one with more information
        const existing = uniqueRecords.get(key)!;
        const current = record;
        
        // Prefer records with more fields populated
        const existingScore = [existing.rank, existing.age, existing.sources, existing.conscription].filter(Boolean).length;
        const currentScore = [current.rank, current.age, current.sources, current.conscription].filter(Boolean).length;
        
        if (currentScore > existingScore) {
          uniqueRecords.set(key, current);
        }
        
      } else {
        uniqueRecords.set(key, record);
      }
      
      // Progress indicator
      if ((i + 1) % 10000 === 0) {
        console.log(`   Processed: ${(i + 1).toLocaleString()}/${records.length.toLocaleString()} (${duplicatesRemoved} duplicates found)`);
      }
    }
    
    const finalUniqueRecords = Array.from(uniqueRecords.values());
    
    console.log(`\n✅ Lost Armour deduplication completed!`);
    console.log(`📊 Results:`);
    console.log(`   Original records: ${records.length.toLocaleString()}`);
    console.log(`   Unique records: ${finalUniqueRecords.length.toLocaleString()}`);
    console.log(`   Duplicates removed: ${duplicatesRemoved.toLocaleString()}`);
    console.log(`   Deduplication rate: ${(duplicatesRemoved / records.length * 100).toFixed(1)}%`);
    
    // Analyze by record type (infer from dates if recordType not present)
    const deathRecords = finalUniqueRecords.filter(r => r.recordType === 'death' || (r.deathDate && r.deathDate !== ''));
    const missingRecords = finalUniqueRecords.filter(r => r.recordType === 'missing' || (r.missingDate && r.missingDate !== '' && (!r.deathDate || r.deathDate === '')));
    
    console.log(`\n📊 By record type:`);
    console.log(`   Deaths: ${deathRecords.length.toLocaleString()}`);
    console.log(`   Missing: ${missingRecords.length.toLocaleString()}`);
    
    // Date range analysis
    const allDates = finalUniqueRecords
      .map(r => r.deathDate || r.missingDate || r.estimatedDeathDate)
      .filter(Boolean)
      .sort();
    
    if (allDates.length > 0) {
      console.log(`\n📅 Date range: ${allDates[0]} to ${allDates[allDates.length - 1]}`);
    }
    
    // Quality analysis
    const withSources = finalUniqueRecords.filter(r => r.sources && r.sources.length > 0);
    const withRank = finalUniqueRecords.filter(r => r.rank && r.rank.length > 0);
    const withAge = finalUniqueRecords.filter(r => r.age && r.age.length > 0);
    
    console.log(`\n📋 Data quality:`);
    console.log(`   Records with sources: ${withSources.length.toLocaleString()} (${(withSources.length / finalUniqueRecords.length * 100).toFixed(1)}%)`);
    console.log(`   Records with rank: ${withRank.length.toLocaleString()} (${(withRank.length / finalUniqueRecords.length * 100).toFixed(1)}%)`);
    console.log(`   Records with age: ${withAge.length.toLocaleString()} (${(withAge.length / finalUniqueRecords.length * 100).toFixed(1)}%)`);
    
    // Save deduplicated data
    await fs.writeFile(outputPath, JSON.stringify(finalUniqueRecords, null, 2), 'utf-8');
    console.log(`\n💾 Deduplicated data saved: ${outputPath}`);
    
    // Generate file size info
    const rawStats = await fs.stat(inputPath);
    const dedupeStats = await fs.stat(outputPath);
    
    console.log(`📁 File sizes:`);
    console.log(`   Raw: ${(rawStats.size / 1024 / 1024).toFixed(1)} MB`);
    console.log(`   Deduplicated: ${(dedupeStats.size / 1024 / 1024).toFixed(1)} MB`);
    console.log(`   Size reduction: ${((1 - dedupeStats.size / rawStats.size) * 100).toFixed(1)}%`);
    
    console.log('\n✅ Ukrainian Lost Armour deduplication completed successfully!');
    
  } catch (error) {
    console.error('❌ Deduplication failed:', error);
    process.exit(1);
  }
}

deduplicateUkraineLostArmour();
