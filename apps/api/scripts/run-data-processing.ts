#!/usr/bin/env ts-node

import "dotenv/config";
import { processAllTelraamData } from "../src/data-processing/data-processing";
import { logger } from "../src/logger";

async function main() {
	try {
		logger.info("Starting Telraam data processing...");
		const results = await processAllTelraamData();
		logger.success(`\nProcessing completed successfully!`);
		logger.info(`Total features processed: ${results.length}`);
	} catch (error) {
		logger.error("Processing failed:", error);
		process.exit(1);
	}
}

main();
