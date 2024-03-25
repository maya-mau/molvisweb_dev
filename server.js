const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 8080;

const server = http.createServer((req, res) => {
  // Set the path to your file
  const filePath = path.join(__dirname, 'ponatinib_Sep2022.pdb');

  // Read the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Set the appropriate content type
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    // Send the file content as the response
    res.end(data);
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});