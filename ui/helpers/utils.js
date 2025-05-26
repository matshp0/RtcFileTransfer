export function getFileSize(bSize){
  if (bSize < 1024) return bSize + ' Bytes';
  if (bSize < 1048576) return (bSize / 1024).toFixed(1) + ' KB';
  if (bSize < 1073741824) return (bSize / 1048576).toFixed(1) + ' MB';
  return (bSize / 1073741824).toFixed(1) + ' GB';
}

export function* generator(iterable){
  const arr = [...iterable];
  for (const item of arr){
    yield item;
  }
}