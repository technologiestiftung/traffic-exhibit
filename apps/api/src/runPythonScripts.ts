import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

// Try to find the correct Python path
const possiblePythonPaths = [
	path.join(__dirname, "../venv/bin/python3"),
	path.join(__dirname, "../venv/bin/python"),
	path.join(__dirname, "../venv/Scripts/python.exe"), // Windows
	"python3", // Fallback to system Python
	"python"
];

let PYTHON_PATH = "python3"; // Default fallback

for (const pythonPath of possiblePythonPaths) {
	if (fs.existsSync(pythonPath)) {
		PYTHON_PATH = pythonPath;
		console.log(`Using Python interpreter: ${PYTHON_PATH}`);
		break;
	}
}

if (!fs.existsSync(PYTHON_PATH) && !PYTHON_PATH.startsWith("python")) {
	console.warn(`Python interpreter not found at ${PYTHON_PATH}, falling back to system python3`);
	PYTHON_PATH = "python3";
}

export const runPythonScript = (scriptPath: string, args: string[] = []) => {
	return new Promise((resolve, reject) => {
		const python = spawn(PYTHON_PATH, [scriptPath, ...args]);
		let output = "";
		python.stdout.on("data", (data) => {
			output += data.toString();
		});
		python.on("close", (code) => {
			if (code === 0) {
				resolve(output);
			} else {
				reject(new Error(`Python script failed with code ${code}`));
			}
		});
	});
};

export const startButtonMonitoring = (
	scriptPath: string,
	onButtonStateChange: (isMoving: boolean) => void,
	onError?: (error: Error) => void
): ChildProcess => {
	const python = spawn(PYTHON_PATH, [scriptPath]);
	
	python.stdout.on("data", (data) => {
		const output = data.toString();
		const lines = output.split('\n');
		
		lines.forEach((line: string) => {
			if (line.startsWith('BUTTON_STATE:')) {
				try {
					const jsonData = line.replace('BUTTON_STATE:', '');
					const stateData = JSON.parse(jsonData);
					onButtonStateChange(stateData.is_moving);
				} catch (err) {
					console.error('Failed to parse button state:', err);
				}
			} else if (line.trim()) {
				console.log('Button script:', line);
			}
		});
	});
	
	python.stderr.on("data", (data) => {
		console.error(`Button script error: ${data}`);
	});
	
	python.on("close", (code) => {
		console.log(`Button monitoring script exited with code ${code}`);
		if (code !== 0 && onError) {
			onError(new Error(`Button script failed with code ${code}`));
		}
	});
	
	return python;
};
