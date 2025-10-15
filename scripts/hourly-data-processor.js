#!/usr/bin/env node
import { spawn } from 'child_process';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = resolve(__dirname, '..');
const API_DIR = join(PROJECT_ROOT, 'apps', 'api');

// Run data processing
function processData() {
	return new Promise((resolve, reject) => {
		console.log(`[${new Date().toISOString()}] Starting data processing...`);
		
		const process = spawn('npm', ['run', 'process-data'], {
			cwd: API_DIR,
			stdio: 'inherit',
			shell: true
		});

		process.on('close', (code) => {
			if (code === 0) {
				console.log(`[${new Date().toISOString()}] Data processing completed successfully`);
				resolve();
			} else {
				console.error(`[${new Date().toISOString()}] Data processing failed with code ${code}`);
				reject(new Error(`Process exited with code ${code}`));
			}
		});

		process.on('error', (error) => {
			console.error(`[${new Date().toISOString()}] Error running data processing:`, error);
			reject(error);
		});
	});
}

// Schedule data processing every hour
async function scheduleHourlyProcessing() {
	console.log(`[${new Date().toISOString()}] Starting hourly data processing scheduler...`);

	// Run pprocessData every hour (3600000 milliseconds = 1 hour)
	setInterval(async () => {
		try {
			await processData();
		} catch (error) {
			console.error(`[${new Date().toISOString()}] Scheduled data processing failed:`, error);
		}
	}, 3600000); // 1 hour in milliseconds
	
	console.log(`[${new Date().toISOString()}] Scheduler started. Data will be processed every hour.`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
	console.log(`\n[${new Date().toISOString()}] Received SIGINT. Shutting down gracefully...`);
	process.exit(0);
});

process.on('SIGTERM', () => {
	console.log(`\n[${new Date().toISOString()}] Received SIGTERM. Shutting down gracefully...`);
	process.exit(0);
});

// Start the scheduler
scheduleHourlyProcessing().catch((error) => {
	console.error(`[${new Date().toISOString()}] Failed to start scheduler:`, error);
	process.exit(1);
});