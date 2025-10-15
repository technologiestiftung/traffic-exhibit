#!/usr/bin/env node
import { spawn } from "child_process";
import { resolve, join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = resolve(__dirname, "..");
const API_DIR = join(PROJECT_ROOT, "apps", "api");

// Run data processing
function processData() {
  return new Promise((res, reject) => {
    logger.time(new Date().toISOString());
    logger.info(`Starting data processing...`);

    const process = spawn("npm", ["run", "process-data"], {
      cwd: API_DIR,
      stdio: "inherit",
      shell: true,
    });

    process.on("close", (code) => {
      if (code === 0) {
        logger.time(new Date().toISOString());
        logger.success(`Data processing completed successfully`);
        res();
      } else {
        logger.time(new Date().toISOString());
        logger.error(`Data processing failed with code ${code}`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    process.on("error", (error) => {
      logger.time(new Date().toISOString());
      logger.error(`Error running data processing: ${error}`);
      reject(error);
    });
  });
}

// Schedule data processing every hour
async function scheduleHourlyProcessing() {
  logger.time(new Date().toISOString());
  logger.info(`Starting hourly data processing scheduler...`);

  // Run processData every hour (3600000 milliseconds = 1 hour)
  setInterval(async () => {
    try {
      await processData();
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Scheduled data processing failed:`,
        error
      );
    }
  }, 3600000); // 1 hour in milliseconds

  logger.time(new Date().toISOString());
  logger.info(`Scheduler started. Data will be processed every hour.`);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.time(new Date().toISOString());
  logger.info(`Received SIGINT. Shutting down gracefully...`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.time(new Date().toISOString());
  logger.info(`Received SIGTERM. Shutting down gracefully...`);
  process.exit(0);
});

// Start the scheduler
scheduleHourlyProcessing().catch((error) => {
  logger.time(new Date().toISOString());
  logger.error(`Failed to start scheduler: ${error}`);
  process.exit(1);
});
