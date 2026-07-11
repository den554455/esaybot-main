/**
 * generate-icons.js
 *
 * Генерирует все PNG/ICO иконки приложения из мастер-файла
 * public/easy-buddy-master.svg
 *
 * Использование:
 *   node generate-icons.js
 *
 * Зависимости:
 *   npm install sharp png-to-ico --save-dev
 *
 * Требует Node >= 20 (как и сам sharp/png-to-ico в package.json).
 */
const BRAND = {
  name: 'Easy Bot',
  shortName: 'Easy Bot',
  description: 'Запись к мастерам красоты',
  themeColor: '#06FFBF',
  backgroundColor: '#101820',
  // TODO: подставьте реальный домен перед деплоем
  siteUrl: 'https://easybuddy.app',
};

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default ?? pngToIcoModule;
const SRC_SVG = path.join(__dirname, 'public', 'easy-buddy-master.svg');
const OUT_DIR = path.join(__dirname, 'public');

// Density повышает качество рендера SVG -> PNG для мелких размеров
const RENDER_DENSITY = 384;

// ──────────────────────────────────────────────
// Конфигурация всех иконок проекта
// ──────────────────────────────────────────────

// Стандартные PWA / favicon иконки (квадрат, с полями safe-area уже внутри SVG)
const STANDARD_SIZES = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// Apple touch icons (отдельные размеры под iOS)
const APPLE_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180];

// Maskable иконки для Android — с дополнительными отступами (safe zone 80%),
// чтобы при обрезке системой под круг/squircle будди не обрезался
const MASKABLE_SIZES = [192, 512];
const MASKABLE_PADDING_RATIO = 0.1; // 10% с каждой стороны = безопасная зона 80%

async function renderPng(size, outPath, { padding = 0 } = {}) {
  const inner = Math.round(size * (1 - padding * 2));

  const iconBuffer = await sharp(SRC_SVG, { density: RENDER_DENSITY })
    .resize(inner, inner, { fit: 'contain' })
    .png()
    .toBuffer();

  if (padding === 0) {
    fs.writeFileSync(outPath, iconBuffer);
    return;
  }

  // Для maskable иконок — кладём будди в центр прозрачного канваса нужного размера
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png()
    .toFile(outPath);
}

async function generateStandardIcons() {
  console.log('→ Генерация стандартных иконок...');
  for (const size of STANDARD_SIZES) {
    const outPath = path.join(OUT_DIR, `icon-${size}.png`);
    await renderPng(size, outPath);
    console.log(`  ✓ icon-${size}.png`);
  }
}

async function generateAppleIcons() {
  console.log('→ Генерация apple-touch-icon...');
  for (const size of APPLE_SIZES) {
    const outPath = path.join(OUT_DIR, `apple-touch-icon-${size}.png`);
    await renderPng(size, outPath);
    console.log(`  ✓ apple-touch-icon-${size}.png`);
  }
  // Главная apple-touch-icon без суффикса (180x180 — рекомендация Apple)
  await renderPng(180, path.join(OUT_DIR, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png (180x180, default)');
}

async function generateMaskableIcons() {
  console.log('→ Генерация maskable иконок...');
  for (const size of MASKABLE_SIZES) {
    const outPath = path.join(OUT_DIR, `icon-maskable-${size}.png`);
    await renderPng(size, outPath, { padding: MASKABLE_PADDING_RATIO });
    console.log(`  ✓ icon-maskable-${size}.png`);
  }
}

async function generateFavicon() {
  console.log('→ Генерация favicon.ico...');
  const sizes = [16, 32, 48];
  const buffers = [];

  for (const size of sizes) {
    const buf = await sharp(SRC_SVG, { density: RENDER_DENSITY })
      .resize(size, size)
      .png()
      .toBuffer();
    buffers.push(buf);
  }

  const icoBuffer = await pngToIco(buffers);
  fs.writeFileSync(path.join(OUT_DIR, 'favicon.ico'), icoBuffer);
  console.log('  ✓ favicon.ico (16/32/48 multi-size)');

  // Отдельный favicon-32.png, который уже используется в index.html
  await renderPng(32, path.join(OUT_DIR, 'favicon-32.png'));
  console.log('  ✓ favicon-32.png');

  await renderPng(16, path.join(OUT_DIR, 'favicon-16.png'));
  console.log('  ✓ favicon-16.png');

  await fs.promises.copyFile(SRC_SVG, path.join(OUT_DIR, 'favicon.svg'));
  console.log('  ✓ favicon.svg');
}

async function generateSocialPreview() {
  console.log('→ Генерация социального превью (social preview)...');
  // 1280x640 — рекомендация GitHub/OpenGraph для social preview
  const width = 1280;
  const height = 640;

  const iconBuffer = await sharp(SRC_SVG, { density: RENDER_DENSITY })
    .resize(420, 420, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 11, g: 15, b: 20, alpha: 1 }, // тёмный фон, будди светлый — хороший контраст
    },
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT_DIR, 'social-preview.png'));

  console.log('  ✓ social-preview.png (1280x640)');
}

// ──────────────────────────────────────────────
// manifest.json / site.webmanifest
// ──────────────────────────────────────────────

function buildManifestIcons() {
  const icons = STANDARD_SIZES.map((size) => ({
    src: `/icon-${size}.png`,
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose: 'any',
  }));

  const maskable = MASKABLE_SIZES.map((size) => ({
    src: `/icon-maskable-${size}.png`,
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose: 'maskable',
  }));

  return [...icons, ...maskable];
}

function buildManifestObject() {
  return {
    name: BRAND.name,
    short_name: BRAND.shortName,
    description: BRAND.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: BRAND.backgroundColor,
    theme_color: BRAND.themeColor,
    icons: buildManifestIcons(),
  };
}

async function generateManifest() {
  console.log('→ Генерация manifest.json...');
  const manifest = buildManifestObject();
  await fs.promises.writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );
  console.log('  ✓ manifest.json');
}

async function generateWebmanifest() {
  console.log('→ Генерация site.webmanifest...');
  // Те же данные, что и manifest.json — некоторые браузеры/инструменты
  // (например MS Edge tile config) ищут именно файл с расширением .webmanifest
  const manifest = buildManifestObject();
  await fs.promises.writeFile(
    path.join(OUT_DIR, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2) + '\n'
  );
  console.log('  ✓ site.webmanifest');
}

// ──────────────────────────────────────────────
// browserconfig.xml (Windows tiles)
// ──────────────────────────────────────────────

async function generateBrowserconfig() {
  console.log('→ Генерация browserconfig.xml...');

  // Используем уже сгенерированные apple-touch-icon размеры под Windows-плитки,
  // т.к. отдельных mstile-*.png у нас нет — переиспользуем стандартные иконки.
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/icon-72.png"/>
      <square150x150logo src="/icon-152.png"/>
      <square310x310logo src="/icon-384.png"/>
      <wide310x150logo src="/icon-384.png"/>
      <TileColor>${BRAND.themeColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`;

  await fs.promises.writeFile(path.join(OUT_DIR, 'browserconfig.xml'), xml);
  console.log('  ✓ browserconfig.xml');
}

// ──────────────────────────────────────────────
// robots.txt
// ──────────────────────────────────────────────

async function generateRobots() {
  console.log('→ Генерация robots.txt...');

  const disallowed = ['/admin', '/api'];

  const lines = [
    'User-agent: *',
    ...disallowed.map((p) => `Disallow: ${p}`),
    'Allow: /',
    '',
    `Sitemap: ${BRAND.siteUrl}/sitemap.xml`,
    '',
  ];

  await fs.promises.writeFile(path.join(OUT_DIR, 'robots.txt'), lines.join('\n'));
  console.log('  ✓ robots.txt');
}

async function main() {
  console.log('Easy Buddy — генерация иконок из master SVG\n');

  if (!fs.existsSync(SRC_SVG)) {
    console.error(`✗ Не найден исходный файл: ${SRC_SVG}`);
    console.error('  Положите easy-buddy-master.svg в папку public/ и запустите снова.');
    process.exit(1);
  }

  await fs.promises.mkdir(OUT_DIR, { recursive: true });

  try {
    await sharp(SRC_SVG).metadata();
  } catch (error) {
    console.error('\n✗ easy-buddy-master.svg повреждён или не является валидным SVG.');
    console.error(error.message);
    process.exit(1);
  }

  await generateStandardIcons();
  await generateAppleIcons();
  await generateMaskableIcons();
  await generateFavicon();
  await generateSocialPreview();
  await generateManifest();
  await generateWebmanifest();
  await generateBrowserconfig();
  await generateRobots();

  const totalIcons =
  STANDARD_SIZES.length +
  APPLE_SIZES.length +
  MASKABLE_SIZES.length +
  4 + // favicon.ico, favicon-32, favicon-16, favicon.svg
  1 + // social-preview.png
  4;  // manifest.json, site.webmanifest, browserconfig.xml, robots.txt

  console.log('\n────────────────────────────────────');
  console.log(`✓ Создано ${totalIcons} файлов`);
  console.log(`✓ Каталог: ${OUT_DIR}`);
  console.log('────────────────────────────────────');
}

main().catch((err) => {
  console.error('✗ Ошибка генерации иконок:', err);
  process.exit(1);
});
