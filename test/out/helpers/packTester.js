"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

const fs_extra_p_1 = require("fs-extra-p");
const fileAssert_1 = require("./fileAssert");
const path = require("path");
const plist_1 = require("plist");
const codeSignData_1 = require("./codeSignData");
const expectedContents_1 = require("./expectedContents");
const out_1 = require("out");
const util_1 = require("out/util/util");
const log_1 = require("out/util/log");
const out_2 = require("out");
const platformPackager_1 = require("out/platformPackager");
const pathSorter = require("path-sort");
const DecompressZip = require("decompress-zip");
const squirrelPack_1 = require("out/targets/squirrelPack");
const util_2 = require("out/util/util");
const config_1 = require("./config");
const deepAssign_1 = require("out/util/deepAssign");
const __awaiter = require("out/util/awaiter");
if (process.env.TRAVIS !== "true") {
    process.env.CIRCLE_BUILD_NUM = 42;
}
const OUT_DIR_NAME = "dist";
let tmpDirCounter = 0;
function appThrows(error, packagerOptions) {
    let checkOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    return t => t.throws(assertPack("test-app-one", packagerOptions, checkOptions), error);
}
exports.appThrows = appThrows;
function app(packagerOptions) {
    let checkOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return () => assertPack("test-app-one", packagerOptions, checkOptions);
}
exports.app = app;
function assertPack(fixtureName, packagerOptions) {
    let checkOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    return __awaiter(this, void 0, void 0, function* () {
        if (checkOptions.signed) {
            packagerOptions = signed(packagerOptions);
        }
        const projectDirCreated = checkOptions.projectDirCreated;
        const useTempDir = process.env.TEST_APP_TMP_DIR != null || checkOptions.useTempDir !== false && (checkOptions.useTempDir || projectDirCreated != null || packagerOptions.devMetadata != null || checkOptions.npmInstallBefore);
        let projectDir = path.join(__dirname, "..", "..", "fixtures", fixtureName);
        const customTmpDir = process.env.TEST_APP_TMP_DIR;
        let dirToDelete = null;
        if (useTempDir) {
            const dir = customTmpDir == null ? path.join(config_1.TEST_DIR, `${ (tmpDirCounter++).toString(16) }`) : path.resolve(customTmpDir);
            if (customTmpDir == null) {
                dirToDelete = dir;
            } else {
                log_1.log(`Custom temp dir used: ${ customTmpDir }`);
            }
            yield fs_extra_p_1.emptyDir(dir);
            yield fs_extra_p_1.copy(projectDir, dir, {
                filter: it => {
                    const basename = path.basename(it);
                    return basename !== OUT_DIR_NAME && basename !== "node_modules" && basename[0] !== ".";
                }
            });
            projectDir = dir;
        }
        try {
            if (projectDirCreated != null) {
                yield projectDirCreated(projectDir);
                if (checkOptions.npmInstallBefore) {
                    yield util_2.spawnNpmProduction("install", projectDir, false);
                }
            }
            if (!useTempDir) {
                dirToDelete = path.join(config_1.TEST_DIR, `${ (tmpDirCounter++).toString(16) }`);
                const devMetadata = packagerOptions.devMetadata;
                if (devMetadata != null && devMetadata.directories != null) {
                    throw new Error("unsupported");
                }
                packagerOptions = deepAssign_1.deepAssign({}, packagerOptions, { devMetadata: { directories: { output: dirToDelete } } });
            }
            const outDir = useTempDir ? path.join(projectDir, OUT_DIR_NAME) : dirToDelete;
            yield packAndCheck(outDir, Object.assign({
                projectDir: projectDir
            }, packagerOptions), checkOptions);
            if (checkOptions.packed != null) {
                function base(platform) {
                    return path.join(outDir, `${ platform.buildConfigurationKey }${ platform === out_1.Platform.MAC ? "" : "-unpacked" }`);
                }
                yield checkOptions.packed({
                    projectDir: projectDir,
                    outDir: outDir,
                    getResources: platform => path.join(base(platform), "resources"),
                    getContent: platform => base(platform)
                });
            }
        } finally {
            if (dirToDelete != null) {
                try {
                    yield fs_extra_p_1.remove(dirToDelete);
                } catch (e) {
                    console.warn(`Cannot delete temporary directory ${ dirToDelete }: ${ e.stack || e }`);
                }
            }
        }
    });
}
exports.assertPack = assertPack;
function getTestAsset(file) {
    return path.join(__dirname, "..", "..", "fixtures", file);
}
exports.getTestAsset = getTestAsset;
function packAndCheck(outDir, packagerOptions, checkOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const packager = new out_1.Packager(packagerOptions);
        const artifacts = new Map();
        packager.artifactCreated(event => {
            fileAssert_1.assertThat(event.file).isAbsolute();
            let list = artifacts.get(event.platform);
            if (list == null) {
                list = [];
                artifacts.set(event.platform, list);
            }
            list.push(event);
        });
        const platformToTarget = yield packager.build();
        if (packagerOptions.platformPackagerFactory != null || packagerOptions.effectiveOptionComputed != null) {
            return;
        }
        c: for (let _ref of packagerOptions.targets) {
            var _ref2 = _slicedToArray(_ref, 2);

            let platform = _ref2[0];
            let archToType = _ref2[1];

            for (let _ref3 of archToType) {
                var _ref4 = _slicedToArray(_ref3, 2);

                let arch = _ref4[0];
                let targets = _ref4[1];

                if (targets.length === 1 && targets[0] === out_1.DIR_TARGET) {
                    continue c;
                }
                const nameToTarget = platformToTarget.get(platform);
                if (platform === out_1.Platform.MAC) {
                    yield checkOsXResult(packager, packagerOptions, checkOptions, artifacts.get(out_1.Platform.MAC));
                } else if (platform === out_1.Platform.LINUX) {
                    yield checkLinuxResult(outDir, packager, checkOptions, artifacts.get(out_1.Platform.LINUX), arch, nameToTarget);
                } else if (platform === out_1.Platform.WINDOWS) {
                    yield checkWindowsResult(packager, checkOptions, artifacts.get(out_1.Platform.WINDOWS), arch, nameToTarget);
                }
            }
        }
    });
}
function checkLinuxResult(outDir, packager, checkOptions, artifacts, arch, nameToTarget) {
    return __awaiter(this, void 0, void 0, function* () {
        const appInfo = packager.appInfo;
        function getExpected() {
            const result = [];
            for (let target of nameToTarget.keys()) {
                if (target === "appimage") {
                    result.push(`${ appInfo.name }-${ appInfo.version }-${ arch === out_1.Arch.x64 ? "x86_64" : out_1.Arch[arch] }.AppImage`);
                } else if (target === "deb") {
                    result.push(`${ appInfo.name }-${ appInfo.version }-${ arch === out_1.Arch.x64 ? "amd64" : out_1.Arch[arch] }.deb`);
                } else {
                    result.push(`TestApp-${ appInfo.version }.${ target }`);
                }
            }
            return result;
        }
        fileAssert_1.assertThat(getFileNames(artifacts)).containsAll(getExpected());
        if (!nameToTarget.has("deb")) {
            return;
        }
        const productFilename = appInfo.productFilename;
        const expectedContents = pathSorter(expectedContents_1.expectedLinuxContents.map(it => {
            if (it === "/opt/TestApp/TestApp") {
                return `/opt/${ productFilename }/${ productFilename }`;
            } else if (it === "/usr/share/applications/TestApp.desktop") {
                return `/usr/share/applications/${ productFilename }.desktop`;
            } else {
                return it.replace(new RegExp("/opt/TestApp/", "g"), `/opt/${ productFilename }/`);
            }
        }));
        const packageFile = `${ outDir }/TestApp-${ appInfo.version }-${ arch === out_1.Arch.ia32 ? "ia32" : arch === out_1.Arch.x64 ? "amd64" : "armv7l" }.deb`;
        fileAssert_1.assertThat((yield getContents(packageFile))).isEqualTo(expectedContents);
        if (arch === out_1.Arch.ia32) {
            fileAssert_1.assertThat((yield getContents(`${ outDir }/TestApp-${ appInfo.version }-i386.deb`))).isEqualTo(expectedContents);
        }
        fileAssert_1.assertThat(parseDebControl((yield util_1.exec("dpkg", ["--info", packageFile])))).hasProperties({
            License: "MIT",
            Homepage: "http://foo.example.com",
            Maintainer: "Foo Bar <foo@example.com>",
            Vendor: "Foo Bar <foo@example.com>",
            Package: "testapp",
            Description: " \n   Test Application (test quite “ #378)",
            Depends: checkOptions == null || checkOptions.expectedDepends == null ? "libappindicator1, libnotify-bin" : checkOptions.expectedDepends,
            Section: "devel"
        });
    });
}
function parseDebControl(info) {
    const regexp = /([\w]+): *(.+\n)([^:\n]+\n)?/g;
    let match;
    const metadata = {};
    info = info.substring(info.indexOf("Package:"));
    while ((match = regexp.exec(info)) !== null) {
        let value = match[2];
        if (match[3] != null) {
            value += match[3];
        }
        if (value[value.length - 1] === "\n") {
            value = value.substring(0, value.length - 1);
        }
        metadata[match[1]] = value;
    }
    return metadata;
}
function checkOsXResult(packager, packagerOptions, checkOptions, artifacts) {
    return __awaiter(this, void 0, void 0, function* () {
        const appInfo = packager.appInfo;
        const packedAppDir = path.join(path.dirname(artifacts[0].file), `${ appInfo.productFilename }.app`);
        const info = plist_1.parse((yield fs_extra_p_1.readFile(path.join(packedAppDir, "Contents", "Info.plist"), "utf8")));
        fileAssert_1.assertThat(info).hasProperties({
            CFBundleDisplayName: appInfo.productName,
            CFBundleIdentifier: "org.electron-builder.testApp",
            LSApplicationCategoryType: "your.app.category.type",
            CFBundleVersion: `${ appInfo.version }.${ process.env.TRAVIS_BUILD_NUMBER || process.env.CIRCLE_BUILD_NUM }`
        });
        if (packagerOptions.cscLink != null) {
            const result = yield util_1.exec("codesign", ["--verify", packedAppDir]);
            fileAssert_1.assertThat(result).doesNotMatch(/is not signed at all/);
        }
        const actualFiles = artifacts.map(it => path.basename(it.file)).sort();
        if (checkOptions != null && checkOptions.expectedContents != null) {
            fileAssert_1.assertThat(actualFiles).isEqualTo(checkOptions.expectedContents);
        } else {
            fileAssert_1.assertThat(actualFiles).isEqualTo([`${ appInfo.productFilename }-${ appInfo.version }-mac.zip`, `${ appInfo.productFilename }-${ appInfo.version }.dmg`].sort());
            fileAssert_1.assertThat(artifacts.map(it => it.artifactName).sort()).isEqualTo([`TestApp-${ appInfo.version }-mac.zip`, `TestApp-${ appInfo.version }.dmg`].sort());
        }
    });
}
function getFileNames(list) {
    return list.map(it => path.basename(it.file));
}
function checkWindowsResult(packager, checkOptions, artifacts, arch, nameToTarget) {
    return __awaiter(this, void 0, void 0, function* () {
        const appInfo = packager.appInfo;
        let squirrel = false;
        const artifactNames = [];
        const expectedFileNames = [];
        const archSuffix = platformPackager_1.getArchSuffix(arch);
        const buildOptions = packager.devMetadata.build.win;
        for (let target of nameToTarget.keys()) {
            if (target === "squirrel") {
                squirrel = true;
                expectedFileNames.push("RELEASES", `${ appInfo.productFilename } Setup ${ appInfo.version }${ archSuffix }.exe`, `${ appInfo.name }-${ squirrelPack_1.convertVersion(appInfo.version) }-full.nupkg`);
                if (buildOptions != null && buildOptions.remoteReleases != null) {
                    expectedFileNames.push(`${ appInfo.name }-${ squirrelPack_1.convertVersion(appInfo.version) }-delta.nupkg`);
                }
                artifactNames.push(`${ appInfo.name }-Setup-${ appInfo.version }${ archSuffix }.exe`);
            } else if (target === "nsis") {
                expectedFileNames.push(`${ appInfo.productFilename } Setup ${ appInfo.version }.exe`);
                artifactNames.push(`${ appInfo.name }-Setup-${ appInfo.version }.exe`);
            } else {
                expectedFileNames.push(`${ appInfo.productFilename }-${ appInfo.version }${ archSuffix }-win.${ target }`);
                artifactNames.push(`${ appInfo.name }-${ appInfo.version }${ archSuffix }-win.${ target }`);
            }
        }
        fileAssert_1.assertThat(getFileNames(artifacts)).containsAll(expectedFileNames);
        if (!squirrel) {
            return;
        }
        fileAssert_1.assertThat(artifacts.map(it => it.artifactName).filter(it => it != null)).containsAll(artifactNames);
        const packageFile = artifacts.find(it => it.file.endsWith("-full.nupkg")).file;
        const unZipper = new DecompressZip(packageFile);
        const fileDescriptors = yield unZipper.getFiles();
        const files = pathSorter(fileDescriptors.map(it => it.path.replace(/\\/g, "/")).filter(it => (!it.startsWith("lib/net45/locales/") || it === "lib/net45/locales/en-US.pak") && !it.endsWith(".psmdcp")));
        const expectedContents = checkOptions == null || checkOptions.expectedContents == null ? expectedContents_1.expectedWinContents : checkOptions.expectedContents;
        fileAssert_1.assertThat(files).isEqualTo(pathSorter(expectedContents.map(it => {
            if (it === "lib/net45/TestApp.exe") {
                if (appInfo.productFilename === "Test App ßW") {
                    return `lib/net45/Test%20App%20%C3%9FW.exe`;
                }
                return `lib/net45/${ encodeURI(appInfo.productFilename).replace(/%5B/g, "[").replace(/%5D/g, "]") }.exe`;
            } else {
                return it;
            }
        })));
        if (checkOptions == null || checkOptions.expectedContents == null) {
            yield unZipper.extractFile(fileDescriptors.filter(it => it.path === "TestApp.nuspec")[0], {
                path: path.dirname(packageFile)
            });
            const expectedSpec = (yield fs_extra_p_1.readFile(path.join(path.dirname(packageFile), "TestApp.nuspec"), "utf8")).replace(/\r\n/g, "\n");
            fileAssert_1.assertThat(expectedSpec).isEqualTo(`<?xml version="1.0"?>
<package xmlns="http://schemas.microsoft.com/packaging/2011/08/nuspec.xsd">
  <metadata>
    <id>TestApp</id>
    <version>${ squirrelPack_1.convertVersion(appInfo.version) }</version>
    <title>${ appInfo.productName }</title>
    <authors>Foo Bar</authors>
    <owners>Foo Bar</owners>
    <iconUrl>https://raw.githubusercontent.com/szwacz/electron-boilerplate/master/resources/windows/icon.ico</iconUrl>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
    <description>Test Application (test quite “ #378)</description>
    <copyright>Copyright © ${ new Date().getFullYear() } Foo Bar</copyright>
    <projectUrl>http://foo.example.com</projectUrl>
  </metadata>
</package>`);
        }
    });
}
function getContents(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield util_1.exec("dpkg", ["--contents", path]);
        return pathSorter(result.split("\n").map(it => it.length === 0 ? null : it.substring(it.indexOf(".") + 1)).filter(it => it != null && !(it.indexOf(`/locales/`) !== -1 || it.indexOf(`/libgcrypt`) !== -1)));
    });
}
function packageJson(task) {
    let isApp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    return projectDir => modifyPackageJson(projectDir, task, isApp);
}
exports.packageJson = packageJson;
function modifyPackageJson(projectDir, task) {
    let isApp = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    return __awaiter(this, void 0, void 0, function* () {
        const file = isApp ? path.join(projectDir, "app", "package.json") : path.join(projectDir, "package.json");
        const data = yield fs_extra_p_1.readJson(file);
        task(data);
        return yield fs_extra_p_1.writeJson(file, data);
    });
}
exports.modifyPackageJson = modifyPackageJson;
function platform(platform) {
    return {
        targets: platform.createTarget()
    };
}
exports.platform = platform;
function signed(packagerOptions) {
    if (process.env.CSC_KEY_PASSWORD == null) {
        log_1.warn("macOS code sign is not tested — CSC_KEY_PASSWORD is not defined");
    } else {
        packagerOptions.cscLink = codeSignData_1.CSC_LINK;
    }
    return packagerOptions;
}
exports.signed = signed;
function getPossiblePlatforms(type) {
    const platforms = [out_1.Platform.fromString(process.platform)];
    if (process.platform === out_1.Platform.MAC.nodeName) {
        if (process.env.LINUX_SKIP == null) {
            platforms.push(out_1.Platform.LINUX);
        }
        if (process.env.CI == null) {
            platforms.push(out_1.Platform.WINDOWS);
        }
    } else if (process.platform === out_1.Platform.LINUX.nodeName && process.env.SKIP_WIN == null) {
        platforms.push(out_1.Platform.WINDOWS);
    }
    return out_2.createTargets(platforms, type);
}
exports.getPossiblePlatforms = getPossiblePlatforms;
function currentPlatform() {
    let dist = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    return {
        targets: out_1.Platform.fromString(process.platform).createTarget(dist ? null : out_1.DIR_TARGET)
    };
}
exports.currentPlatform = currentPlatform;
//# sourceMappingURL=packTester.js.map