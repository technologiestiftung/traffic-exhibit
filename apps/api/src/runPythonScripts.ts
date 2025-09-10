import { spawn } from "child_process";

export const runPythonScript = (scriptPath: string, args: string[] = []) => {
	return new Promise((resolve, reject) => {
		const python = spawn("python3", [scriptPath, ...args]);
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
