const { spawn } = require('child_process');
const path = require('path');
const runPythonScript = () => {
    const scriptPath = path.join(__dirname, './OMRChecker-master/OMRChecker-master', 'main.py');
    const inputPath = path.join(__dirname, './batch01_output');
    // Command to run: 'python3 main.py ./inputs/test'
    console.log('script', scriptPath)
    const python = spawn('python3', [scriptPath, "-i", inputPath]);

    // Capture stdout (standard output)
    python.stdout.on('data', (data) => {
        console.log(`Output: ${data.toString()}`);
    });

    // Capture stderr (standard error)
    python.stderr.on('data', (data) => {
        console.error(`Error: ${data.toString()}`);
    });

    // Handle process exit
    python.on('close', (code) => {
        if (code === 0) {
            console.log('Python script executed successfully.');
        } else {
            console.error(`Python script exited with code ${code}`);
        }
    });
};

// Execute the function
runPythonScript();