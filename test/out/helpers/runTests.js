"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const child_process_1 = require("child_process");
const path = require("path");
const bluebird_1 = require("bluebird");
const fs_extra_p_1 = require("fs-extra-p");
const os_1 = require("os");
const config_1 = require("./config");
const __awaiter = require("../../../out/util/awaiter");
const util = require("../../../out/util/util");
const utilSpawn = util.spawn;
const isEmptyOrSpaces = util.isEmptyOrSpaces;
const downloadElectron = bluebird_1.Promise.promisify(require("electron-download"));
const packager = require("../../../out/packager");
const rootDir = path.join(__dirname, "..", "..", "..");
const testPackageDir = path.join(os_1.tmpdir(), "electron_builder_published");
const testNodeModules = path.join(testPackageDir, "node_modules");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield bluebird_1.Promise.all([deleteOldElectronVersion(), downloadAllRequiredElectronVersions(), fs_extra_p_1.emptyDir(config_1.TEST_DIR), fs_extra_p_1.outputFile(path.join(testPackageDir, "package.json"), `{
      "private": true,
      "version": "1.0.0",
      "name": "test",
      "dependencies": {
        "electron-builder": "file:${ path.posix.join(__dirname.replace(/\\/g, "/"), "..", "..") }"
      }
    }`).then(() => copyDependencies())]);
        yield exec(["install", "--cache-min", "999999999", "--production", rootDir]);
        yield exec(["prune", "--production"]);
        try {
            yield runTests();
        } finally {
            yield fs_extra_p_1.remove(config_1.TEST_DIR);
        }
    });
}
main().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
function deleteOldElectronVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.CI) {
            return;
        }
        const cacheDir = path.join(os_1.homedir(), ".electron");
        try {
            const deletePromises = [];
            for (let file of yield fs_extra_p_1.readdir(cacheDir)) {
                if (file.endsWith(".zip") && !(file.indexOf(config_1.ELECTRON_VERSION) !== -1)) {
                    console.log(`Remove old electron ${ file }`);
                    deletePromises.push(fs_extra_p_1.unlink(path.join(cacheDir, file)));
                }
            }
            return yield bluebird_1.Promise.all(deletePromises);
        } catch (e) {
            if (e.code === "ENOENT") {
                return [];
            } else {
                throw e;
            }
        }
    });
}
function downloadAllRequiredElectronVersions() {
    const downloadPromises = [];
    const platforms = packager.normalizePlatforms(["all"]).map(it => it.nodeName);
    if (process.platform === "darwin") {
        platforms.push("mas");
    }
    for (let platform of platforms) {
        const archs = platform === "mas" || platform === "darwin" ? ["x64"] : platform === "win32" ? ["ia32", "x64"] : ["ia32", "x64", "armv7l"];
        for (let arch of archs) {
            downloadPromises.push(downloadElectron({
                version: config_1.ELECTRON_VERSION,
                arch: arch,
                platform: platform
            }));
        }
    }
    return bluebird_1.Promise.all(downloadPromises);
}
function copyDependencies() {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs_extra_p_1.emptyDir(testNodeModules);
        const devDeps = Object.keys((yield fs_extra_p_1.readJson(path.join(rootDir, "package.json"), "utf-8")).devDependencies);
        const filtered = new Set();
        for (let name of devDeps) {
            filtered.add(path.join(rootDir, "node_modules", name));
        }
        filtered.add(path.join(rootDir, "node_modules", ".bin"));
        return fs_extra_p_1.copy(path.join(rootDir, "node_modules"), testNodeModules, {
            filter: it => {
                if (it.indexOf("node_modules" + path.sep + "babel-") !== -1) {
                    return false;
                }
                return !filtered.has(it);
            }
        });
    });
}
function runTests() {
    const args = [];
    const testFiles = process.env.TEST_FILES;
    args.push(`--concurrency=${ os_1.cpus().length }`);
    const baseDir = path.join("test", "out");
    const baseForLinuxTests = [path.join(baseDir, "ArtifactPublisherTest.js"), path.join(baseDir, "httpRequestTest.js"), path.join(baseDir, "RepoSlugTest.js")];
    let skipWin = false;
    if (!isEmptyOrSpaces(testFiles)) {
        args.push.apply(args, _toConsumableArray(testFiles.split(",").map(it => path.join(baseDir, it.trim() + ".js"))));
        if (process.platform === "linux") {
            args.push.apply(args, baseForLinuxTests);
        }
        console.log(`Test files: ${ args.join(", ") }`);
    } else if (!isEmptyOrSpaces(process.env.CIRCLE_NODE_INDEX)) {
        const circleNodeIndex = parseInt(process.env.CIRCLE_NODE_INDEX, 10);
        if (circleNodeIndex === 0 || circleNodeIndex === 2) {
            skipWin = true;
            args.push(path.join(baseDir, "linuxPackagerTest.js"), path.join(baseDir, "BuildTest.js"), path.join(baseDir, "globTest.js"));
        } else {
            args.push(path.join(baseDir, "winPackagerTest.js"), path.join(baseDir, "nsisTest.js"), path.join(baseDir, "macPackagerTest.js"));
            args.push.apply(args, baseForLinuxTests);
        }
        console.log(`Test files for node ${ circleNodeIndex }: ${ args.join(", ") }`);
    } else if (process.platform === "win32") {
        args.push("test/out/*.js", "!test/out/macPackagerTest.js", "!test/out/linuxPackagerTest.js", "!test/out/CodeSignTest.js", "!test/out/ArtifactPublisherTest.js", "!test/out/httpRequestTest.js");
    } else if (!util.isCi()) {
        args.push("test/out/*.js", "!test/out/ArtifactPublisherTest.js", "!test/out/httpRequestTest.js");
    }
    return utilSpawn(path.join(rootDir, "node_modules", ".bin", "ava"), args, {
        cwd: rootDir,
        env: Object.assign({}, process.env, {
            NODE_PATH: path.join(testNodeModules, "electron-builder"),
            SKIP_WIN: skipWin,
            CSC_IDENTITY_AUTO_DISCOVERY: "false"
        }),
        shell: process.platform === "win32",
        stdio: "inherit"
    });
}
function exec(args) {
    return new bluebird_1.Promise((resolve, reject) => {
        let command = "npm";
        const npmExecPath = process.env.npm_execpath || process.env.NPM_CLI_JS;
        if (npmExecPath != null) {
            args.unshift(npmExecPath);
            command = process.env.npm_node_execpath || process.env.NODE_EXE || "node";
        }
        const effectiveOptions = {
            stdio: ["ignore", "ignore", "inherit"],
            cwd: testPackageDir
        };
        const child = child_process_1.spawn(command, args, effectiveOptions);
        child.on("close", code => {
            if (code === 0) {
                resolve();
            } else {
                try {
                    console.error(fs_extra_p_1.readFileSync(path.join(testPackageDir, "npm-debug.log"), "utf8"));
                } catch (e) {}
                reject(new Error(`${ command } ${ args.join(" ") } exited with code ${ code }`));
            }
        });
        child.on("error", error => {
            reject(new Error(`Failed to start child process: ${ command } ${ args.join(" ") }` + (error.stack || error)));
        });
    });
}
//# sourceMappingURL=runTests.js.map