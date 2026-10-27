import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

export async function launchBrowser() {
  let playwright;
  if (process.env.PLAYWRIGHT_MODULE) {
    playwright = await import(process.env.PLAYWRIGHT_MODULE);
  } else {
    try {
      playwright = await import('playwright');
    } catch (error) {
      if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
      const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
      playwright = await import(pathToFileURL(join(globalRoot, 'playwright/index.mjs')).href);
    }
  }
  return playwright.chromium.launch({ headless: true });
}

export const baseUrl = process.env.BASE_URL || 'http://localhost:8000';

export function trackErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}
