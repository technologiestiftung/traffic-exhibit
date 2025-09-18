#!/usr/bin/env ts-node

import 'dotenv/config';
import { processAllTelraamData } from '../src/data-processing/data-processing';

async function main() {
  try {
    console.log('Starting Telraam data processing...');
    const results = await processAllTelraamData();
    console.log(`\nProcessing completed successfully!`);
    console.log(`Total features processed: ${results.length}`);
  } catch (error) {
    console.error('Processing failed:', error);
    process.exit(1);
  }
}

main();
