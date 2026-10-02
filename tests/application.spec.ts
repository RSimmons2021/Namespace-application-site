import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/'); await expect(page.getByRole('button', { name: /Launch ship/ })).toBeVisible();
}
const pose = (page: import('@playwright/test').Page) => page.getByTestId('ship-position').getAttribute('data-position');

test('loads a full viewport 3D game with a player ship and five destinations', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox(); expect(bounds?.width).toBe(1440); expect(bounds?.height).toBe(900);
  await expect(page.getByRole('button', { name: /^Autopilot to/ })).toHaveCount(5);
  expect(await canvas.evaluate((e: HTMLCanvasElement) => e.width > 0 && e.height > 0)).toBe(true);
  expect(errors).toEqual([]);
});

test('keyboard controls move and rotate the ship, fire lasers, boost and pause physics', async ({ page }) => {
  await ready(page); const before = await pose(page);
  await page.getByRole('button', { name: /Launch ship/ }).click();
  await expect(page.locator('canvas')).toBeFocused();
  await expect.poll(() => pose(page)).not.toBe(before);
  const rotation = await page.getByTestId('ship-position').getAttribute('data-orientation');
  await page.keyboard.down('d'); await page.waitForTimeout(500); await page.keyboard.up('d');
  await expect.poll(() => page.getByTestId('ship-position').getAttribute('data-orientation')).not.toBe(rotation);
  await page.keyboard.down('Shift');
  await expect.poll(async () => Number(await page.getByTestId('ship-speed').textContent())).toBeGreaterThan(60);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Space'); await expect.poll(async () => Number(await page.getByTestId('ship-shots').textContent())).toBeGreaterThan(0);
  await page.keyboard.press('p'); await expect(page.getByRole('button', { name: 'Resume flight', exact: true }).first()).toBeVisible();
  await page.waitForTimeout(250); const paused = await pose(page); await page.waitForTimeout(350); expect(await pose(page)).toBe(paused);
  await page.keyboard.press('p'); await expect.poll(() => pose(page)).not.toBe(paused);
  await page.keyboard.press('r'); await expect(page.getByRole('button', { name: /Launch ship/ })).toBeVisible();
  expect(JSON.parse((await pose(page))!)).toEqual([0, 0, 95]);
});

test('autopilot flies to Forge, docks into its application chapter, and undocks', async ({ page }) => {
  await ready(page); const before = await pose(page);
  await page.getByRole('button', { name: 'Autopilot to Forge' }).click();
  await expect(page.locator('.flight-course')).toContainText('FORGE');
  await expect.poll(() => pose(page)).not.toBe(before);
  await expect(page.getByRole('region', { name: /^Forge:/ })).toBeVisible({ timeout: 25000 });
  await expect(page).toHaveURL(/#forge$/);
  expect(JSON.parse((await pose(page))!)[2]).toBeLessThan(-80);
  const arrivalPosition = await pose(page), arrivalHeading = await page.getByTestId('ship-position').getAttribute('data-orientation');
  await page.getByRole('button', { name: 'Undock and fly' }).click();
  await expect(page.getByRole('region', { name: /^Forge:/ })).toHaveCount(0);
  await expect(page.locator('canvas')).toBeFocused();
  await expect(page.getByRole('button', { name: /Resume flight/ })).toBeVisible();
  await page.waitForTimeout(350);
  expect(await pose(page)).toBe(arrivalPosition);
  expect(await page.getByTestId('ship-position').getAttribute('data-orientation')).toBe(arrivalHeading);
  await page.getByRole('button', { name: /Resume flight/ }).click();
  await expect(page.locator('canvas')).toBeFocused();
  await expect.poll(() => pose(page)).not.toBe(arrivalPosition);
});

test('planet bookmarks, project tabs, history and application dialog preserve evidence', async ({ page }) => {
  await page.goto('/#nexus');
  await expect(page.getByRole('region', { name: /^Nexus:/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore Agent Lab' })).toHaveAttribute('href', 'https://ai-agent-portal-site.vercel.app');
  await page.getByRole('tab', { name: 'Agent Relay' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Ed25519');
  await page.getByRole('tab', { name: 'Agent Relay' }).press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Agent Lab' })).toBeFocused();
  const opener = page.getByRole('button', { name: 'Read application' }); await opener.focus(); await opener.press('Enter');
  const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
  await dialog.getByRole('link', { name: 'Dev tools', exact: true }).click();
  await dialog.getByRole('tab', { name: 'Agent Lab' }).focus();
  await dialog.getByRole('tab', { name: 'Agent Lab' }).press('ArrowRight');
  await expect(dialog.getByRole('tabpanel')).toContainText('Ed25519');
  await dialog.getByRole('link', { name: 'Why Namespace', exact: true }).click();
  await expect(page.locator('#brief-namespace')).toBeInViewport(); await expect(page).toHaveURL(/#nexus$/);
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Agent Lab' })).toHaveAttribute('aria-selected', 'true');
});

test('all five application chapters are directly bookmarkable', async ({ page }) => {
  for (const name of ['Origin', 'Forge', 'Scale', 'Nexus', 'Signal']) {
    await page.goto(`/#${name.toLowerCase()}`); await expect(page.getByRole('region', { name: new RegExp(`^${name}:`) })).toBeVisible();
  }
});

test('mobile uses the full viewport, touch steering and functional boost buttons', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
  await page.getByRole('button', { name: /Launch ship/ }).click();
  const before = await page.getByTestId('ship-position').getAttribute('data-orientation');
  const touch = await page.context().newCDPSession(page);
  await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 350, id: 1 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 250, y: 310, id: 1 }] });
  await page.waitForTimeout(400);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.getByTestId('ship-position').getAttribute('data-orientation')).not.toBe(before);
  const boost = await page.getByRole('button', { name: 'Hold to boost' }).boundingBox();
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: boost!.x + boost!.width / 2, y: boost!.y + boost!.height / 2, id: 1 }] });
  await expect.poll(async () => Number(await page.getByTestId('ship-speed').textContent())).toBeGreaterThan(60);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.detach();
  await page.getByRole('button', { name: 'Fire blasters', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('ship-shots').textContent())).toBeGreaterThan(0);
  await page.getByRole('button', { name: /Planets/ }).click(); await expect(page.getByRole('button', { name: 'Autopilot to Nexus' })).toBeVisible();
  await page.goto('/#nexus'); await expect(page.getByRole('region', { name: /^Nexus:/ })).toBeInViewport();
  expect(await page.locator('.dossier-scroll').evaluate(e => e.scrollHeight > e.clientHeight)).toBe(true);
});

test('resume download is the actual supplied PDF', async ({ page }) => {
  await page.goto('/'); const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Resume', exact: true }).click()]);
  expect(download.suggestedFilename()).toBe('Richard_Simmons_Resume.pdf');
  expect((await readFile((await download.path())!)).equals(await readFile('docs/Richard_Simmons_Resume_FullStack.pdf'))).toBe(true);
});

test('unavailable WebGL keeps the application and chapters accessible', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto('/'); await expect(page.getByText('This browser couldn’t start 3D rendering.')).toBeVisible();
  await page.keyboard.press('5'); await expect(page.getByRole('region', { name: /^Signal:/ })).toBeVisible();
  await page.getByRole('button', { name: 'Read application' }).click(); await expect(page.getByRole('dialog')).toBeVisible();
});

test('game HUD, docking panel and reading dialog have no serious accessibility violations', async ({ page }) => {
  await ready(page);
  for (const view of ['game', 'help', 'mobile', 'nexus', 'brief']) {
    if (view === 'help') { await page.getByRole('button', { name: 'Flight controls' }).click(); await expect(page.getByRole('dialog', { name: 'You have the controls.' })).toBeVisible(); }
    if (view === 'mobile') { await page.getByRole('button', { name: 'Close flight controls' }).click(); await page.setViewportSize({ width: 390, height: 844 }); }
    if (view === 'nexus') { await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/#nexus'); }
    if (view === 'brief') await page.getByRole('button', { name: 'Read application' }).click();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(result.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  }
});


for (const key of ['f', 'Enter', 'NumpadEnter']) {
  test(`number shortcut sets course and ${key} docks only near a planet`, async ({ page }) => {
    await ready(page);
    await page.locator('canvas').focus(); await page.keyboard.press(key);
    await expect(page.locator('.dossier')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Launch ship/ })).toBeVisible();
    await page.keyboard.press('2');
    await expect(page.locator('.flight-course')).toContainText('FORGE');
    await expect.poll(async () => Number((await page.locator('.flight-nearest small').textContent())?.split(' ')[0]), { timeout: 30000, intervals: [100] }).toBeLessThan(47);
    await page.getByRole('button', { name: 'Take control' }).click();
    await expect(page.getByRole('button', { name: /Dock at Forge/ })).toBeVisible();
    await expect(page.locator('.flight-dock kbd')).toHaveText('ENTER');
    await page.keyboard.press(key); await expect(page.getByRole('region', { name: /^Forge:/ })).toBeVisible();
    await expect(page.getByTestId('ship-speed')).toHaveText('000');
    await expect(page).toHaveURL(/#forge$/);
    await page.keyboard.press('Escape'); await expect(page.getByRole('region', { name: /^Forge:/ })).toHaveCount(0);
  });
}

test('reviewers can read the application before launching and keep navigation in reach', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 }); await ready(page);
  const read = page.getByRole('button', { name: 'Read application', exact: true });
  await expect(read).toBeInViewport(); await read.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /I ship the interface/ })).toBeVisible();
  await expect(dialog.locator('.overview-metrics')).toContainText('80%');
  await dialog.getByRole('link', { name: 'Why Namespace', exact: true }).click();
  await expect(page.locator('#brief-namespace')).toBeInViewport();
  await expect(dialog.getByRole('button', { name: 'Close application brief' })).toBeInViewport();
  await expect(dialog.getByRole('link', { name: 'Overview', exact: true })).toBeInViewport();
  await page.keyboard.press('Escape'); await expect(read).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('mobile planets pause flight, Escape closes only the menu, and docked navigation works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page);
  await page.getByRole('button', { name: /Launch ship/ }).click();
  const toggle = page.getByRole('button', { name: /Planets/ }); await toggle.click();
  await expect(page.getByRole('button', { name: 'Autopilot to Origin' })).toBeFocused();
  await page.waitForTimeout(250); const position = await pose(page); await page.waitForTimeout(350); expect(await pose(page)).toBe(position);
  await page.keyboard.press('Escape'); await expect(toggle).toBeFocused();
  await expect(page.getByRole('button', { name: 'Autopilot to Origin' })).not.toBeVisible();
  await expect.poll(() => pose(page)).not.toBe(position);
  await page.goto('/#forge'); await expect(page.getByRole('region', { name: /^Forge:/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fly to Scale' })).toBeInViewport();
  await toggle.click(); await expect(page.getByRole('button', { name: 'Autopilot to Signal' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(toggle).toBeFocused();
  await expect(page.getByRole('region', { name: /^Forge:/ })).toBeVisible(); await expect(page).toHaveURL(/#forge$/);
  await toggle.click(); await page.getByRole('button', { name: 'Autopilot to Nexus' }).click();
  await expect(page.getByRole('region', { name: /^Forge:/ })).toHaveCount(0);
  await expect(page.getByRole('progressbar', { name: 'Flight progress to Nexus' })).toBeVisible();
});

test('guided flight reports real progress and denied docking explains how to recover', async ({ page }) => {
  await ready(page); await page.locator('canvas').focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Fly within 50 m');
  await expect(page.locator('canvas')).toBeFocused();
  await page.getByRole('button', { name: 'Start with shipped work' }).click();
  const progress = page.getByRole('progressbar', { name: 'Flight progress to Forge' });
  await expect(progress).toBeVisible();
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeGreaterThan(5);
  await expect(page.locator('.flight-nearest')).toContainText('DESTINATION');
  await page.getByRole('button', { name: 'Take control' }).click();
  await expect(progress).toHaveCount(0); await expect(page.locator('canvas')).toBeFocused();
  await page.goto('/#signal');
  await expect(page.locator('.dossier-bottom').getByRole('link', { name: 'Email Richard' })).toBeInViewport();
  await expect(page.locator('.dossier-bottom').getByRole('link', { name: 'Email Richard' })).toHaveAttribute('href', 'mailto:richard.simmons.dev@gmail.com');
});


test('email copy acknowledges success and gives a recovery path when clipboard access fails', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#signal');
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.getByText('Email address copied.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('richard.simmons.dev@gmail.com');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Clipboard unavailable'); }; });
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.getByText('Couldn’t copy. Select the email address to copy it.')).toBeVisible();
});


test('closing bookmarked chapters with Undock or Escape keeps the view and touch steering resumes flight', async ({ page }) => {
  for (const [id, method] of [['origin', 'button'], ['nexus', 'escape'], ['signal', 'button']]) {
    await page.goto(`/#${id}`);
    await expect.poll(() => pose(page)).not.toBe('[0,0,95]');
    const position = await pose(page), heading = await page.getByTestId('ship-position').getAttribute('data-orientation');
    if (method === 'escape') await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: 'Undock and fly' }).click();
    await expect(page.getByRole('button', { name: /Resume flight/ })).toBeVisible();
    await expect(page.getByTestId('ship-speed')).toHaveText('000');
    await page.waitForTimeout(350);
    expect(await pose(page)).toBe(position);
    expect(await page.getByTestId('ship-position').getAttribute('data-orientation')).toBe(heading);
    await expect(page.locator('canvas')).toBeFocused();
    await page.keyboard.press('d');
    await expect(page.getByRole('button', { name: /Resume flight/ })).toHaveCount(0);
    await expect.poll(() => pose(page)).not.toBe(position);
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/#forge');
  await expect.poll(() => pose(page)).not.toBe('[0,0,95]');
  await page.getByRole('button', { name: 'Undock and fly' }).click();
  await expect(page.getByRole('button', { name: /Resume flight/ })).toBeVisible();
  const touch = await page.context().newCDPSession(page);
  await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 350, id: 1 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 250, y: 310, id: 1 }] });
  await expect(page.getByRole('button', { name: /Resume flight/ })).toHaveCount(0);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await touch.detach();
  await expect.poll(async () => Number(await page.getByTestId('ship-speed').textContent())).toBeGreaterThan(0);
});

for (const viewport of [{ width: 844, height: 390 }, { width: 568, height: 320 }]) {
  test(`landscape ${viewport.width}×${viewport.height} keeps all planets and application reading accessible`, async ({ page }) => {
    await page.setViewportSize(viewport); await ready(page);
    const toggle = page.getByRole('button', { name: /Planets/ });
    await expect(toggle).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Autopilot to Signal' })).not.toBeVisible();
    await toggle.click();
    const signal = page.getByRole('button', { name: 'Autopilot to Signal' });
    await signal.scrollIntoViewIfNeeded(); await expect(signal).toBeInViewport();
    const drawer = await page.locator('.flight-map').boundingBox();
    expect(drawer!.y).toBeGreaterThanOrEqual(62);
    expect(drawer!.y + drawer!.height).toBeLessThan(viewport.height - 54);
    await page.keyboard.press('Escape'); await expect(toggle).toBeFocused();
    await page.getByRole('button', { name: 'Read application', exact: true }).click();
    const dialog = page.getByRole('dialog');
    expect((await dialog.locator('.brief-body').boundingBox())!.height).toBeGreaterThan(150);
    await dialog.getByRole('link', { name: 'Products', exact: true }).click();
    const lucid = dialog.getByRole('link', { name: 'Visit Lucid' });
    await expect(lucid).toHaveAttribute('href', 'https://lucid-app.xyz');
    await lucid.scrollIntoViewIfNeeded(); await expect(lucid).toBeInViewport();
    await expect(dialog).not.toContainText(/FocusFi|Ohio|US remote/i);
    await expect(dialog.getByRole('link', { name: 'View site source on GitHub' })).toHaveAttribute('href', 'https://github.com/RSimmons2021/Namespace-application-site');
    await expect(dialog.getByRole('link', { name: 'Resume PDF' })).toBeInViewport();
    await expect(dialog.getByRole('button', { name: 'Close application brief' })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}
