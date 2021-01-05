import http from 'http';
import fs from 'fs';
import path from 'path';
import decodeFile from './decodeFile.cjs';

const host = 'localhost';
const port = process.env.PORT;

//= ============================================================================

const parseFormData = (contentType, content) => {
  const boundaryMatch = contentType.match(/(?:boundary=)(?<boundary>.+)$/);
  const boundary = boundaryMatch?.groups?.boundary;
  if (!boundary) return null;

  const loopContent = (prev, curr) => {
    const name = curr.match(/(?:name=")(?<name>.+?)(?:")/)?.groups?.name;
    if (!name) return prev;
    const data = curr.match(/(?:\r\n\r\n)(?<data>[\S\s]*)(?:\r\n--$)/)?.groups?.data;
    if (!data) return prev;

    const filename = curr.match(/(?:filename=")(?<filename>.*?)(?:")/)?.groups?.filename;
    if (filename) {
      prev.files[name] = {
        filename,
        mimetype: curr.match(/(?:Content-Type:)(?<mimetype>.*?)(?:\r\n)/)?.groups?.mimetype,
        data
      };

      return prev;
    }
    prev.body[name] = data;
    return prev;
  };

  const result = content.split(boundary).reduce(loopContent, { body: {}, files: {} });
  return result;
};

//= ============================================================================

const requestListener = (req, res) => {
  const contentType = req.headers['content-type'] ?? '';
  const isFormData = contentType.includes('multipart/form-data');
  if (req.url !== '/upload' || req.method !== 'POST' || !isFormData) {
    res.writeHead(404);
    res.end();
    return;
  }
  const chunks = [];

  const onEnd = () => {
    const result = parseFormData(contentType, chunks.toString());

    const encryptedFile = result?.files?.encryptedFile;
    const encodeData = result?.body?.encodeData;
    if (!encryptedFile || !encodeData) {
      res.writeHead(400);
      res.end();
      return;
    }

    const tempPath = './temp';
    if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath);

    try {
      const dataEF = decodeFile(encryptedFile.data);
      fs.writeFileSync(path.join(tempPath, encryptedFile.filename.slice(0, -8)), dataEF);

      const dataED = decodeFile(encodeData);
      fs.writeFileSync(path.join(tempPath, 'encodeData.json'), dataED);
    } catch (err) {
      console.error(`Error: ${err}`);
      res.writeHead(400);
      res.end();
      return;
    }

    res.writeHead(204);
    res.end();
  };

  req.on('data', chunk => chunks.push(chunk));
  req.on('error', err => console.error(err));
  req.on('end', onEnd);
};

//= ============================================================================

const server = http.createServer(requestListener);
server.listen(port, host, () => console.info(`Server running at http://${host}:${port}/`));
