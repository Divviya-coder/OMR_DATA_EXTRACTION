const express = require('express');
const cors = require('cors');  // Import CORS
const fileUploadRouter = require('./routes/multiplefileupload');

const app = express();

// Middleware
app.use(express.json());

// Enable CORS for your frontend running on port 3000
app.use(cors({
    origin: 'http://localhost:3000',  // Allow requests from this frontend origin only
    methods: 'GET,POST,PUT,DELETE',  // Allowed methods
    allowedHeaders: 'Content-Type,Authorization',  // Allowed headers
}));

// File upload route
app.use('/upload', fileUploadRouter);

// Start server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
