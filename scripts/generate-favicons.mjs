import { Buffer } from 'node:buffer';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(resolve(root, 'public/favicon.svg'), 'utf8');
const browser = await chromium.launch({ headless: true });

async function render(size) {
    const context = await browser.newContext({
        viewport: { width: size, height: size },
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.setContent(
        `<style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{display:block;width:100%;height:100%}</style>${source}`,
    );
    const image = await page.screenshot({
        type: 'png',
        omitBackground: true,
    });
    await context.close();

    return image;
}

function createIco(images) {
    const directory = Buffer.alloc(6 + images.length * 16);
    directory.writeUInt16LE(0, 0);
    directory.writeUInt16LE(1, 2);
    directory.writeUInt16LE(images.length, 4);
    let offset = directory.length;

    images.forEach(({ size, image }, index) => {
        const entry = 6 + index * 16;
        directory.writeUInt8(size === 256 ? 0 : size, entry);
        directory.writeUInt8(size === 256 ? 0 : size, entry + 1);
        directory.writeUInt8(0, entry + 2);
        directory.writeUInt8(0, entry + 3);
        directory.writeUInt16LE(1, entry + 4);
        directory.writeUInt16LE(32, entry + 6);
        directory.writeUInt32LE(image.length, entry + 8);
        directory.writeUInt32LE(offset, entry + 12);
        offset += image.length;
    });

    return Buffer.concat([directory, ...images.map(({ image }) => image)]);
}

try {
    const icons = await Promise.all(
        [16, 32, 48].map(async (size) => ({ size, image: await render(size) })),
    );
    const appleTouchIcon = await render(180);

    await writeFile(resolve(root, 'public/favicon.ico'), createIco(icons));
    await writeFile(
        resolve(root, 'public/apple-touch-icon.png'),
        appleTouchIcon,
    );
} finally {
    await browser.close();
}
