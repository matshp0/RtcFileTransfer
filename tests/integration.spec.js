// @ts-check
import { test, expect } from '@playwright/test';
import { createFile, awaitAllDownlads } from './utils';
import fs from 'node:fs'

let inputDir, outputDir;

const files = [{ name: 'test.txt', size: 666666 },
{ name: 'picture.png', size: 999100 },
{ name: 'program.js', size: 1919191 },
]

test.beforeAll(async ({ }, testInfo) => {
  const browser = testInfo.project.name;
  inputDir = `./${browser}/input`;
  outputDir = `./${browser}/output`;
  fs.mkdirSync(inputDir, { recursive: true })
  fs.mkdirSync(outputDir, { recursive: true })

  for (const file of files) {
    await createFile(file.name, inputDir, file.size)
  }
})

test('updload and download files', async ({ page, context }) => {
  await page.goto('/');
  await page.setInputFiles('#file-input', files.map(({ name }) => `${inputDir}/${name}`));
  await page.getByText('Start Transfer').click();
  const url = await page.locator('span.url').innerText();
  const receivePage = await context.newPage();
  await receivePage.goto(url);
  await receivePage.getByRole('button', { name: 'Download files' }).click();
  const receivedFiles = await awaitAllDownlads(receivePage, outputDir);
  expect(receivedFiles).toEqual(files);
});

test.afterAll(async ({ }, testInfo) => {
  const browser = testInfo.project.name;
  fs.rmSync(`./${browser}`, { recursive: true, force: true });
})

