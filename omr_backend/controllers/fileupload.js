const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { convertCsvToJson } = require('./ProcessImagedata');
const { processQuestions } = require('./Generateoutput');

const clearImageFiles = (uploadPath) => {
    return new Promise((resolve, reject) => {
        fs.readdir(uploadPath, (err, files) => {
            if (err) return reject(err);

            // Filter only image files (jpg, png, gif, etc.)
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
            const imageFiles = files.filter(file =>
                imageExtensions.includes(path.extname(file).toLowerCase())
            );

            // Delete only image files
            const deletePromises = imageFiles.map((file) =>
                fs.promises.unlink(path.join(uploadPath, file))
            );

            Promise.all(deletePromises)
                .then(resolve)
                .catch(reject);
        });
    });
};

const deleteFolder = (folderPath) => {
    return fs.promises.rm(folderPath, { recursive: true, force: true })
        .then(() => console.log(`Folder ${folderPath} deleted successfully.`))
        .catch((err) => console.error(`Error deleting folder:`, err));
};

const runPythonScripts = () => {
    return new Promise((resolve, reject) => {
        // Define paths for Python scripts (modify these if needed)
        const alignv2ScriptPath = path.resolve(__dirname, '../OMRChecker-master/OMRChecker-master/alignv2.py');
        const mainScriptPath = path.resolve(__dirname, '../OMRChecker-master/OMRChecker-master/main.py');

        // Construct the Python command for each script
        const pythonScript1 = `python3 ${alignv2ScriptPath} ${path.resolve(__dirname, '../OMRChecker-master/OMRChecker-master/ref/ref.jpg')} ${path.resolve(__dirname, '../uploads')} ${path.resolve(__dirname, '../batch01_output')}`;
        const pythonScript2 = `python3 ${mainScriptPath} -i ${path.resolve(__dirname, '../batch01_output')}`;
        const pythonScript3 = `python3 ${mainScriptPath} --inputDir ${path.resolve(__dirname, '../batch01_output')} --outputDir ${path.resolve(__dirname, '../batch01_result')}`;

        // Execute the first Python script
        exec(pythonScript1, (error, stdout, stderr) => {
            if (error) {
                return reject(`Error executing alignv2.py: ${error.message}`);
            }
            if (stderr) {
                return reject(`Python script stderr: ${stderr}`);
            }

            console.log(stdout);

            // Once the first script completes, run the second one
            exec(pythonScript2, (error2, stdout2, stderr2) => {
                if (error2) {
                    return reject(`Error executing main.py (batch1): ${error2.message}`);
                }
                if (stderr2) {
                    return reject(`Python script stderr (batch1): ${stderr2}`);
                }

                console.log(stdout2);

                // Once the second script completes, run the third one
                exec(pythonScript3, (error3, stdout3, stderr3) => {
                    if (error3) {
                        return reject(`Error executing main.py (batch01_output to batch01_result): ${error3.message}`);
                    }
                    if (stderr3) {
                        return reject(`Python script stderr (batch01_output to batch01_result): ${stderr3}`);
                    }

                    console.log(stdout3);
                    resolve(stdout3);
                });
            });
        });
    });
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folder to save images
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

const upload = multer({ storage, fileFilter }).any(); // Allow unlimited files

const uploadFiles = async (req, res) => {
    const uploadPath = 'uploads/';
    const alignedimages = 'batch01_output/';
    const deletefoldername = 'batch01_result';
    const deleteexistingfolder = 'outputs/'
    const generatedexcelsheet = 'outputs/Results/'

    try {
        await clearImageFiles(uploadPath);
        await clearImageFiles(alignedimages);
        await deleteFolder(deletefoldername);
        await deleteFolder(deleteexistingfolder);

        upload(req, res, async (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            try {
                const answerkey = req.body?.excelData;
                // console.log(answerkey, 'json data')
                const pythonOutput = await runPythonScripts();
                const convertjsondata = await convertCsvToJson(generatedexcelsheet);
                const finaloutput = await processQuestions(convertjsondata, answerkey)
                // console.log(answerkey, answerkey?.length)
                // console.log(convertjsondata?.length, 'convert json data')
                return res.status(200).json({
                    message: 'Images uploaded and scripts executed successfully!',
                    pythonOutput,
                    files: req.files,
                    finaloutput
                });
            }
            catch (pythonError) {
                return res.status(500).json({ error: `Error executing Python scripts: ${pythonError}` });
            }
        });
    } catch (clearError) {
        return res.status(500).json({ error: `Failed to clear folders: ${clearError.message}` });
    }
};


module.exports = { uploadFiles };
