"use strict";

const deepAssign_1 = require("../util/deepAssign");
const path = require("path");
const log_1 = require("../util/log");
const platformPackager_1 = require("../platformPackager");
const bluebird_1 = require("bluebird");
const util_1 = require("../util/util");
const fs_extra_p_1 = require("fs-extra-p");
const promise_1 = require("../util/promise");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("../util/awaiter");
class DmgTarget extends platformPackager_1.Target {
    constructor(packager) {
        super("dmg");
        this.packager = packager;
        this.helperDir = path.join(__dirname, "..", "..", "templates", "dmg");
    }
    build(appOutDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const packager = this.packager;
            const appInfo = packager.appInfo;
            log_1.log("Creating DMG");
            const specification = yield this.computeDmgOptions();
            const tempDir = yield packager.getTempFile("dmg");
            const tempDmg = path.join(tempDir, "temp.dmg");
            const backgroundDir = path.join(tempDir, ".background");
            const backgroundFilename = specification.background == null ? null : path.basename(specification.background);
            if (backgroundFilename != null) {
                yield fs_extra_p_1.copy(specification.background, path.join(backgroundDir, backgroundFilename));
            }
            let preallocatedSize = 32 * 1024;
            if (specification.icon != null) {
                const stat = yield util_1.statOrNull(specification.icon);
                if (stat != null) {
                    preallocatedSize += stat.size;
                }
            }
            // allocate space for .DS_Store
            yield fs_extra_p_1.outputFile(path.join(backgroundDir, "DSStorePlaceHolder"), new Buffer(preallocatedSize));
            const volumeName = `${ appInfo.productFilename } ${ appInfo.version }`;
            //noinspection SpellCheckingInspection
            yield util_1.exec("hdiutil", ["create", "-srcfolder", backgroundDir, "-srcfolder", path.join(appOutDir, `${ packager.appInfo.productFilename }.app`), "-volname", volumeName, "-anyowners", "-nospotlight", "-quiet", "-fs", "HFS+", "-fsargs", "-c c=64,a=16,e=16", "-format", "UDRW", tempDmg]);
            const volumePath = path.join("/Volumes", volumeName);
            if ((yield util_1.statOrNull(volumePath)) != null) {
                util_1.debug("Unmounting previous disk image");
                yield detach(volumePath);
            }
            yield attachAndExecute(tempDmg, true, () => __awaiter(this, void 0, void 0, function* () {
                const promises = [specification.background == null ? fs_extra_p_1.remove(`${ volumePath }/.background`) : fs_extra_p_1.unlink(`${ volumePath }/.background/DSStorePlaceHolder`), util_1.exec("ln", ["-s", "/Applications", `${ volumePath }/Applications`])];
                const contents = specification.contents;
                const location = contents.find(it => it.path == null && it.type === "file");
                const applicationsLocation = contents.find(it => it.type === "link" && (it.path === "/Applications" || it.path === "Applications"));
                const window = specification.window;
                const env = Object.assign({}, process.env, {
                    volumePath: volumePath,
                    appFileName: `${ packager.appInfo.productFilename }.app`,
                    appFileX: location.x,
                    appFileY: location.y,
                    APPLICATIONS_LINK_X: applicationsLocation.x,
                    APPLICATIONS_LINK_Y: applicationsLocation.y,
                    iconSize: specification.iconSize || 80,
                    iconTextSize: specification.iconTextSize || 12,
                    windowX: window.x,
                    windowY: window.y,
                    VERSIONER_PERL_PREFER_32_BIT: "true"
                });
                if (specification.icon == null) {
                    delete env.volumeIcon;
                } else {
                    const volumeIcon = `${ volumePath }/.VolumeIcon.icns`;
                    promises.push(fs_extra_p_1.copy(path.resolve(packager.projectDir, specification.icon), volumeIcon));
                    env.volumeIcon = volumeIcon;
                }
                yield bluebird_1.Promise.all(promises);
                if (specification.backgroundColor != null || specification.background == null) {
                    env.backgroundColor = specification.backgroundColor || "#ffffff";
                    env.windowWidth = window.width || 540;
                    env.windowHeight = window.height || 380;
                } else {
                    delete env.backgroundColor;
                    if (window.width == null) {
                        delete env.windowWidth;
                    } else {
                        env.windowWidth = window.width;
                    }
                    if (window.height == null) {
                        delete env.windowHeight;
                    } else {
                        env.windowHeight = window.height;
                    }
                    env.backgroundFilename = backgroundFilename;
                }
                yield util_1.exec("perl", [path.join(this.helperDir, "dmgProperties.pl")], {
                    cwd: this.helperDir,
                    env: env
                });
                yield util_1.exec("sync");
            }));
            const artifactPath = path.join(appOutDir, `${ appInfo.productFilename }-${ appInfo.version }.dmg`);
            //noinspection SpellCheckingInspection
            yield util_1.exec("hdiutil", ["convert", tempDmg, "-format", packager.devMetadata.build.compression === "store" ? "UDRO" : "UDBZ", "-imagekey", "zlib-level=9", "-o", artifactPath]);
            yield util_1.exec("hdiutil", ["internet-enable", "-no", artifactPath]);
            this.packager.dispatchArtifactCreated(artifactPath, `${ appInfo.name }-${ appInfo.version }.dmg`);
        });
    }
    // public to test
    computeDmgOptions() {
        return __awaiter(this, void 0, void 0, function* () {
            const packager = this.packager;
            const specification = deepAssign_1.deepAssign({
                contents: [{
                    "x": 410, "y": 220, "type": "link", "path": "/Applications"
                }, {
                    "x": 130, "y": 220, "type": "file"
                }],
                window: {
                    x: 400,
                    y: 100
                }
            }, Object.assign({}, this.packager.devMetadata.build.osx, packager.devMetadata.build.dmg));
            // appdmg
            const oldPosition = specification.window.position;
            if (oldPosition != null) {
                specification.window.x = oldPosition.x;
                specification.window.y = oldPosition.y;
            }
            const oldSize = specification.window.size;
            if (oldSize != null) {
                specification.window.width = oldSize.width;
                specification.window.height = oldSize.height;
            }
            if (specification["icon-size"] != null) {
                if (specification.iconSize == null) {
                    specification.iconSize = specification["icon-size"];
                }
                log_1.warn("dmg.icon-size is deprecated, please use dmg.iconSize instead");
            }
            if (specification.title != null) {
                log_1.warn("dmg.title is not supported, file issue if need");
            }
            if (!("icon" in specification)) {
                util_1.use((yield packager.getIconPath()), it => {
                    specification.icon = it;
                });
            }
            if (specification["background-color"] != null) {
                if (specification.backgroundColor == null) {
                    specification.backgroundColor = specification["background-color"];
                }
                log_1.warn("dmg.background-color is deprecated, please use dmg.backgroundColor instead");
            }
            if (specification.backgroundColor != null) {
                if (specification.background != null) {
                    throw new Error("Both dmg.backgroundColor and dmg.background are specified — please set the only one");
                }
                specification.backgroundColor = require("parse-color")(specification.backgroundColor).hex;
            }
            if (specification.backgroundColor == null && !("background" in specification)) {
                const resourceList = yield packager.resourceList;
                if (resourceList.indexOf("background.tiff") !== -1) {
                    specification.background = path.join(packager.buildResourcesDir, "background.tiff");
                } else if (resourceList.indexOf("background.png") !== -1) {
                    specification.background = path.join(packager.buildResourcesDir, "background.png");
                } else {
                    specification.background = path.join(this.helperDir, "background.tiff");
                }
            }
            if (specification.format == null) {
                specification.format = packager.devMetadata.build.compression === "store" ? "UDRO" : "UDBZ";
            }
            return specification;
        });
    }
}
exports.DmgTarget = DmgTarget;
function detach(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield util_1.exec("hdiutil", ["detach", name]);
        } catch (e) {
            yield new bluebird_1.Promise((resolve, reject) => {
                setTimeout(() => {
                    util_1.exec("hdiutil", ["detach", "-force", name]).then(resolve).catch(reject);
                }, 1000);
            });
        }
    });
}
function attachAndExecute(dmgPath, readWrite, task) {
    return __awaiter(this, void 0, void 0, function* () {
        //noinspection SpellCheckingInspection
        const args = ["attach", "-noverify", "-noautoopen"];
        if (readWrite) {
            args.push("-readwrite");
        }
        args.push(dmgPath);
        const attachResult = yield util_1.exec("hdiutil", args, { maxBuffer: 1024 * 1024 });
        const deviceResult = attachResult == null ? null : /^(\/dev\/\w+)/.exec(attachResult);
        const device = deviceResult == null || deviceResult.length !== 2 ? null : deviceResult[1];
        if (device == null) {
            throw new Error(`Cannot mount: ${ attachResult }`);
        }
        yield promise_1.executeFinally(task(), () => detach(device));
    });
}
exports.attachAndExecute = attachAndExecute;
//# sourceMappingURL=dmg.js.map