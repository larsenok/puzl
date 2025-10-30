const fs = require('fs/promises');
const path = require('path');

const copyDirectory = async (source, destination) => {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, destinationPath);
    }
  }
};

const build = async () => {
  const root = __dirname;
  const sourceDir = path.join(root, 'src');
  const outputDir = path.join(root, 'dist');

  await fs.rm(outputDir, { recursive: true, force: true });
  await copyDirectory(sourceDir, outputDir);

  console.log('Build complete. Files copied to dist/.');
};

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
