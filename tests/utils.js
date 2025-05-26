import fs from 'node:fs';
import path from 'node:path';

export const awaitAllDownloads = async (page, dir) => {
  const result = [];
  return new Promise((resolve) => {
    let timeout = null;
    page.on('download', async (download) => {
      const name = download.suggestedFilename();
      const downloadPath = path.join(dir, name)
      download.saveAs(downloadPath)
      const filePath = await download.path();
      const stats = fs.statSync(filePath);
      result.push({ name, size: stats.size });
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => resolve(result), 1000);
    })
  })
}

export const createFile = async (name, dir, size) => {
  fs.open(path.join(dir, name), 'w', (err, fd) => {
    if (err) throw err
    fs.ftruncate(fd, size, (err) => {
      if (err) throw err
      fs.close(fd, (err) => {
        if (err) throw err
      })
    })
  })
}
