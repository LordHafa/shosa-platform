require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');

const PORT = process.env.PORT || 5000;

for (const dir of ['uploads', 'uploads/gallery', 'uploads/profiles']) {
  fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
}

app.listen(PORT, () => {
  console.log(`SHOSA API running on http://localhost:${PORT}/api`);
});

