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

const EU_TIMEZONE = "Europe/Berlin";
const PROCESSING_START_HOUR = 7; // 7 AM
const PROCESSING_END_HOUR = 18; // 6 PM (inclusive)

function getCurrentHourEU() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: EU_TIMEZONE,
    hour: "numeric",
    hour12: false,
  });
  return parseInt(formatter.format(new Date()), 10);
}

function isWithinProcessingWindow() {
  const hour = getCurrentHourEU();
  return hour >= PROCESSING_START_HOUR && hour <= PROCESSING_END_HOUR;
}

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

// Schedule data processing every hour (between 7am and 6pm EU time)
async function scheduleHourlyProcessing() {
  logger.time(new Date().toISOString());
  logger.info(
    `Starting hourly data processing scheduler (EU ${PROCESSING_START_HOUR}:00–${PROCESSING_END_HOUR}:00)...`,
  );

  const runIfWithinWindow = async () => {
    if (isWithinProcessingWindow()) {
      try {
        await processData();
      } catch (error) {
        console.error(
          `[${new Date().toISOString()}] Scheduled data processing failed:`,
          error,
        );
      }
    } else {
      logger.time(new Date().toISOString());
      logger.info(
        `Skipping run (outside EU ${PROCESSING_START_HOUR}:00–${PROCESSING_END_HOUR}:00, current hour EU: ${getCurrentHourEU()})`,
      );
    }
  };

  // Run once at startup if within window
  await runIfWithinWindow();

  // Run every hour (3600000 milliseconds = 1 hour)
  setInterval(runIfWithinWindow, 3600000);

  logger.time(new Date().toISOString());
  logger.info(
    `Scheduler started. Data will be processed every hour between EU ${PROCESSING_START_HOUR}:00–${PROCESSING_END_HOUR}:00.`,
  );
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
