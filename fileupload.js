const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { convertCsvToJson } = require('./ProcessImagedata');
const { processQuestions } = require('./Generateoutput');

const logWithTimestamp = (message) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
};

const clearImageFiles = (uploadPath) => {
    return new Promise((resolve, reject) => {
        fs.readdir(uploadPath, (err, files) => {
            if (err) return reject(err);

            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
            const imageFiles = files.filter(file =>
                imageExtensions.includes(path.extname(file).toLowerCase())
            );

            const deletePromises = imageFiles.map((file) =>
                fs.promises.unlink(path.join(uploadPath, file))
            );

            Promise.all(deletePromises)
                .then(() => {
                    logWithTimestamp(`Cleared image files from ${uploadPath}`);
                    resolve();
                })
                .catch(reject);
        });
    });
};

const deleteFolder = (folderPath) => {
    return fs.promises.rm(folderPath, { recursive: true, force: true })
        .then(() => logWithTimestamp(`Folder ${folderPath} deleted successfully.`))
        .catch((err) => logWithTimestamp(`Error deleting folder ${folderPath}: ${err.message}`));
};


// Function to run the alignv2 script
const runAlignScript = () => {
    return new Promise((resolve, reject) => {
        const alignv2ScriptPath = path.resolve(__dirname, '../OMRChecker-master/OMRChecker-master/alignv2.py');
        const pythonScript1 = `python3 ${alignv2ScriptPath} ${path.resolve(__dirname, '../OMRChecker-master/OMRChecker-master/ref/ref.jpg')} ${path.resolve(__dirname, '../uploads')} ${path.resolve(__dirname, '../batch01_output')}`;

        logWithTimestamp('Starting alignv2 script...');
        exec(pythonScript1, (error, stdout, stderr) => {
            if (error) {
                logWithTimestamp(`Error executing alignv2 script: ${error.message}`);
                return reject(`Script 1 Error: ${error.message}`);
            }
            if (stderr) {
                logWithTimestamp(`alignv2 script stderr: ${stderr}`);
                return reject(`Script 1 stderr: ${stderr}`);
            }

            logWithTimestamp(`alignv2 script output: ${stdout}`);
            logWithTimestamp('alignv2 script completed successfully.');
            resolve(stdout);
        });
    });
};

// Function to run the main script
const runMainScript = () => {
    return new Promise((resolve, reject) => {
        const mainScriptPath = path.resolve(__dirname, '../OMRChecker-master/OMRChecker-master/main.py');
        const pythonScript3 = `python3 ${mainScriptPath} --inputDir ${path.resolve(__dirname, '../batch01_output')} --outputDir ${path.resolve(__dirname, '../batch01_result')}`;

        logWithTimestamp('Starting main script...');
        exec(pythonScript3, { maxBuffer: 10 * 1024 * 1024 }, (error3, stdout3, stderr3) => {
            if (error3) {
                logWithTimestamp(`Error executing main script: ${error3.message}`);
                return reject(`Script 3 Error: ${error3.message}`);
            }
            if (stderr3) {
                logWithTimestamp(`main script stderr: ${stderr3}`);
                return reject(`Script 3 stderr: ${stderr3}`);
            }

            logWithTimestamp(`main script output: ${stdout3}`);
            logWithTimestamp('main script completed successfully.');
            resolve(stdout3);
        });
    });
};

const runPythonScripts = async () => {
    try {
        // Run the alignv2 script first
        await runAlignScript();
        // After that, run the main script
        await runMainScript();

    } catch (error) {
        logWithTimestamp(`Error running scripts: ${error}`);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter }).any();

const uploadFiles = async (req, res) => {
    const uploadPath = 'uploads/';
    const alignedImages = 'batch01_output/';
    const resultFolder = 'batch01_result';
    const existingFolder = 'outputs/';
    const generatedExcelFolder = 'batch01_result/Results';

    try {
        logWithTimestamp('Starting cleanup process...');
        await clearImageFiles(uploadPath);
        await clearImageFiles(alignedImages);
        await deleteFolder(resultFolder);
        await deleteFolder(existingFolder);

        logWithTimestamp('Cleanup process completed. Starting file upload...');
        upload(req, res, async (err) => {
            if (err) {
                logWithTimestamp(`File upload error: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }

            try {
                const answerKey = req.body?.excelData;
                logWithTimestamp('Files uploaded successfully. Running Python scripts...');

                const pythonOutput = await runPythonScripts();

                logWithTimestamp('Converting CSV to JSON...');
                const jsonData = await convertCsvToJson(generatedExcelFolder);

                logWithTimestamp('Processing questions...');
                const finaloutput = await processQuestions(jsonData, answerKey, 'GS');
                // console.log(finaloutput)
                // logWithTimestamp('Process completed successfully.');
                return res.status(200).json({
                    message: 'Images uploaded and scripts executed successfully!',
                    pythonOutput,
                    files: req.files,
                    finaloutput,
                });
            } catch (pythonError) {
                logWithTimestamp(`Error during script execution: ${pythonError}`);
                return res.status(500).json({ error: `Error executing Python scripts: ${pythonError}` });
            }
        });
    } catch (cleanupError) {
        logWithTimestamp(`Error during cleanup: ${cleanupError.message}`);
        return res.status(500).json({ error: `Failed to complete cleanup: ${cleanupError.message}` });
    }
};

module.exports = { uploadFiles };
