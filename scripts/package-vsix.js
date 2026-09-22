// scripts/package-vsix.js - Package VS Code extension into .vsix archive without external vsce dependencies
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * // generateVsixManifest generates the standard extension.vsixmanifest file content
 * @param {object} pkg - package.json parsed content
 * @returns {string} XML string for extension.vsixmanifest
 */
function generateVsixManifest(pkg) {
  const publisher = pkg.publisher || "";
  const id = pkg.name || "";
  const version = pkg.version || "0.0.1";
  const displayName = pkg.displayName || id;
  const description = pkg.description || "";
  const engine = (pkg.engines && pkg.engines.vscode) || "^1.85.0";
  const tags = Array.isArray(pkg.keywords) ? pkg.keywords.join(",") : "";
  const categories = Array.isArray(pkg.categories)
    ? pkg.categories.join(",")
    : "Other";
  const repoUrl =
    (pkg.repository &&
      (typeof pkg.repository === "string"
        ? pkg.repository
        : pkg.repository.url)) ||
    "";

  return `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
\t<Metadata>
\t\t<Identity Language="en-US" Id="${id}" Version="${version}" Publisher="${publisher}" />
\t\t<DisplayName>${displayName}</DisplayName>
\t\t<Description xml:space="preserve">${description}</Description>
\t\t<Tags>${tags}</Tags>
\t\t<Categories>${categories}</Categories>
\t\t<GalleryFlags>Public</GalleryFlags>
\t\t<Properties>
\t\t\t<Property Id="Microsoft.VisualStudio.Code.Engine" Value="${engine}" />
\t\t\t<Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="" />
\t\t\t<Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="" />
\t\t\t<Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="workspace" />
\t\t\t<Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value="" />
\t\t\t<Property Id="Microsoft.VisualStudio.Code.EnabledApiProposals" Value="" />
\t\t\t<Property Id="Microsoft.VisualStudio.Code.ExecutesCode" Value="true" />
\t\t\t<Property Id="Microsoft.VisualStudio.Services.Links.Source" Value="${repoUrl}" />
\t\t\t<Property Id="Microsoft.VisualStudio.Services.Links.Getstarted" Value="${repoUrl}" />
\t\t\t<Property Id="Microsoft.VisualStudio.Services.Links.GitHub" Value="${repoUrl}" />
\t\t\t<Property Id="Microsoft.VisualStudio.Services.Links.Support" Value="${repoUrl.replace(/\\.git$/, "")}/issues" />
\t\t\t<Property Id="Microsoft.VisualStudio.Services.Links.Learn" Value="${repoUrl.replace(/\\.git$/, "")}#readme" />
\t\t\t<Property Id="Microsoft.VisualStudio.Services.GitHubFlavoredMarkdown" Value="true" />
\t\t\t<Property Id="Microsoft.VisualStudio.Services.Content.Pricing" Value="Free"/>
\t\t</Properties>
\t\t<License>extension/LICENSE.txt</License>
\t\t<Icon>extension/media/icon.png</Icon>
\t</Metadata>
\t<Installation>
\t\t<InstallationTarget Id="Microsoft.VisualStudio.Code"/>
\t</Installation>
\t<Dependencies/>
\t<Assets>
\t\t<Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
\t\t<Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/readme.md" Addressable="true" />
\t\t<Asset Type="Microsoft.VisualStudio.Services.Content.Changelog" Path="extension/changelog.md" Addressable="true" />
\t\t<Asset Type="Microsoft.VisualStudio.Services.Content.License" Path="extension/LICENSE.txt" Addressable="true" />
\t\t<Asset Type="Microsoft.VisualStudio.Services.Icons.Default" Path="extension/media/icon.png" Addressable="true" />
\t</Assets>
</PackageManifest>`;
}

/**
 * // generateContentTypes generates standard [Content_Types].xml
 * @returns {string} XML string
 */
function generateContentTypes() {
  return `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension=".js" ContentType="application/javascript"/><Default Extension=".json" ContentType="application/json"/><Default Extension=".md" ContentType="text/markdown"/><Default Extension=".png" ContentType="image/png"/><Default Extension=".svg" ContentType="image/svg+xml"/><Default Extension=".txt" ContentType="text/plain"/><Default Extension=".vsixmanifest" ContentType="text/xml"/></Types>`;
}

/**
 * // copyDirectoryRecursively copies src directory to dest directory
 * @param {string} src
 * @param {string} dest
 */
function copyDirectoryRecursively(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursively(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * // buildVsix compiles and packages the extension into a .vsix file
 */
function buildVsix() {
  const rootDir = path.resolve(__dirname, "..");
  const pkgPath = path.join(rootDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  // Ensure production build is up to date
  console.log("Building extension with esbuild...");
  execSync("node esbuild.js --production", { cwd: rootDir, stdio: "inherit" });

  const vsixName = `${pkg.name}-${pkg.version}.vsix`;
  const tempDir = path.join(rootDir, ".vsix-temp");
  const extDir = path.join(tempDir, "extension");

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  fs.mkdirSync(extDir, { recursive: true });

  // 1. Write root manifest files
  fs.writeFileSync(
    path.join(tempDir, "[Content_Types].xml"),
    generateContentTypes(),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(tempDir, "extension.vsixmanifest"),
    generateVsixManifest(pkg),
    "utf-8",
  );

  // 2. Copy extension files
  fs.copyFileSync(pkgPath, path.join(extDir, "package.json"));
  if (fs.existsSync(path.join(rootDir, "README.md"))) {
    fs.copyFileSync(
      path.join(rootDir, "README.md"),
      path.join(extDir, "readme.md"),
    );
  }
  if (fs.existsSync(path.join(rootDir, "README.zh-cn.md"))) {
    fs.copyFileSync(
      path.join(rootDir, "README.zh-cn.md"),
      path.join(extDir, "README.zh-cn.md"),
    );
  }
  if (fs.existsSync(path.join(rootDir, "CHANGELOG.md"))) {
    fs.copyFileSync(
      path.join(rootDir, "CHANGELOG.md"),
      path.join(extDir, "changelog.md"),
    );
  }
  if (fs.existsSync(path.join(rootDir, "LICENSE"))) {
    fs.copyFileSync(
      path.join(rootDir, "LICENSE"),
      path.join(extDir, "LICENSE.txt"),
    );
  }

  copyDirectoryRecursively(
    path.join(rootDir, "dist"),
    path.join(extDir, "dist"),
  );
  copyDirectoryRecursively(
    path.join(rootDir, "media"),
    path.join(extDir, "media"),
  );

  // 3. Create zip (.vsix) archive using native zip
  const vsixPath = path.join(rootDir, vsixName);
  if (fs.existsSync(vsixPath)) {
    fs.unlinkSync(vsixPath);
  }

  console.log(`Packaging ${vsixName}...`);
  execSync(
    `zip -r -q "${vsixPath}" "[Content_Types].xml" extension.vsixmanifest extension`,
    {
      cwd: tempDir,
      stdio: "inherit",
    },
  );

  // Clean temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`Successfully packaged: ${vsixName}`);
}

buildVsix();
