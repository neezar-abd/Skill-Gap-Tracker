import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set public folder
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => {
    console.log('Frontend server running at http://localhost:3000');
});
