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
  const filePath = path.join(dir, name);
  try {
    const handle = await fs.promises.open(filePath, 'w');
    await handle.truncate(size);
    await handle.close();
  } catch (err) {
    throw err;
  }
}
