"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const metadata_1 = require("../metadata");
const platformPackager_1 = require("../platformPackager");
const util_1 = require("../util/util");
const path = require("path");
const binDownload_1 = require("../util/binDownload");
const fs_extra_p_1 = require("fs-extra-p");
const bluebird_1 = require("bluebird");
const LinuxTargetHelper_1 = require("./LinuxTargetHelper");
const errorMessages = require("../errorMessages");
const template = require("lodash.template");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("../util/awaiter");
const fpmPath = process.platform === "win32" || process.env.USE_SYSTEM_FPM === "true" ? bluebird_1.Promise.resolve("fpm") : downloadFpm();
// can be called in parallel, all calls for the same version will get the same promise - will be downloaded only once
function downloadFpm() {
    const version = process.platform === "darwin" ? "fpm-1.6.3-20150715-2.2.2" : "fpm-1.6.3-2.3.1";
    const osAndArch = process.platform === "darwin" ? "mac" : `linux-x86${ process.arch === "ia32" ? "" : "_64" }`;
    const sha2 = process.platform === "darwin" ? "1b13080ecfd2b6fddb984ed6e1dfcb38cdf5b051a04d609c2a95227ed9a5ecbc" : process.arch === "ia32" ? "b55f25749a27097140171f073466c52e59f733a275fea99e2334c540627ffc62" : "4c6fc529e996f7ff850da2d0bb6c85080e43be672494b14c0c6bdcc03bf57328";
    return binDownload_1.getBin("fpm", version, `https://dl.bintray.com/electron-userland/bin/${ version }-${ osAndArch }.7z`, sha2).then(it => path.join(it, "fpm"));
}
class FpmTarget extends platformPackager_1.TargetEx {
    constructor(name, packager, helper, outDir) {
        super(name);
        this.packager = packager;
        this.helper = helper;
        this.outDir = outDir;
        this.options = Object.assign({}, this.packager.platformSpecificBuildOptions, this.packager.devMetadata.build[this.name]);
        this.scriptFiles = this.createScripts();
        this.desktopEntry = helper.computeDesktopEntry(this.options);
    }
    createScripts() {
        return __awaiter(this, void 0, void 0, function* () {
            const defaultTemplatesDir = path.join(__dirname, "..", "..", "templates", "linux");
            const packager = this.packager;
            const templateOptions = Object.assign({
                // old API compatibility
                executable: packager.appInfo.productFilename
            }, packager.platformSpecificBuildOptions);
            function getResource(value, defaultFile) {
                if (value == null) {
                    return path.join(defaultTemplatesDir, defaultFile);
                }
                return path.resolve(packager.projectDir, value);
            }
            const afterInstallFilePath = writeConfigFile(this.packager.info.tempDirManager, getResource(packager.platformSpecificBuildOptions.afterInstall, "after-install.tpl"), templateOptions);
            const afterRemoveFilePath = writeConfigFile(this.packager.info.tempDirManager, getResource(packager.platformSpecificBuildOptions.afterRemove, "after-remove.tpl"), templateOptions);
            return yield bluebird_1.Promise.all([afterInstallFilePath, afterRemoveFilePath]);
        });
    }
    build(appOutDir, arch) {
        return __awaiter(this, void 0, void 0, function* () {
            const target = this.name;
            const destination = path.join(this.outDir, this.packager.generateName(target, arch, true /* on Linux we use safe name — without space */));
            const scripts = yield this.scriptFiles;
            const packager = this.packager;
            const appInfo = packager.appInfo;
            const projectUrl = yield appInfo.computePackageUrl();
            if (projectUrl == null) {
                throw new Error("Please specify project homepage, see https://github.com/electron-userland/electron-builder/wiki/Options#AppMetadata-homepage");
            }
            const options = this.options;
            let author = options.maintainer;
            if (author == null) {
                const a = appInfo.metadata.author;
                if (a.email == null) {
                    throw new Error(errorMessages.authorEmailIsMissed);
                }
                author = `${ a.name } <${ a.email }>`;
            }
            const synopsis = options.synopsis;
            const args = ["-s", "dir", "-t", target, "--architecture", arch === metadata_1.Arch.ia32 ? "i386" : arch === metadata_1.Arch.x64 ? "amd64" : "armv7l", "--name", appInfo.name, "--force", "--after-install", scripts[0], "--after-remove", scripts[1], "--description", platformPackager_1.smarten(target === "rpm" ? options.description : `${ synopsis || "" }\n ${ options.description }`), "--maintainer", author, "--vendor", options.vendor || author, "--version", appInfo.version, "--package", destination, "--url", projectUrl];
            const packageCategory = options.packageCategory;
            if (packageCategory != null && packageCategory !== null) {
                args.push("--category", packageCategory);
            }
            if (target === "deb") {
                args.push("--deb-compression", options.compression || (packager.devMetadata.build.compression === "store" ? "gz" : "xz"));
            } else if (target === "rpm") {
                // args.push("--rpm-compression", options.compression || (this.devMetadata.build.compression === "store" ? "none" : "xz"))
                args.push("--rpm-os", "linux");
                if (synopsis != null) {
                    args.push("--rpm-summary", platformPackager_1.smarten(synopsis));
                }
            }
            let depends = options.depends;
            if (depends == null) {
                if (target === "deb") {
                    depends = ["libappindicator1", "libnotify-bin"];
                } else {
                    depends = [];
                }
            } else if (!Array.isArray(depends)) {
                if (typeof depends === "string") {
                    depends = [depends];
                } else {
                    throw new Error(`depends must be Array or String, but specified as: ${ depends }`);
                }
            }
            for (let dep of depends) {
                args.push("--depends", dep);
            }
            util_1.use(packager.appInfo.metadata.license || packager.devMetadata.license, it => args.push("--license", it));
            util_1.use(appInfo.buildNumber, it => args.push("--iteration", it));
            util_1.use(options.fpm, it => args.push.apply(args, _toConsumableArray(it)));
            args.push(`${ appOutDir }/=${ LinuxTargetHelper_1.installPrefix }/${ appInfo.productFilename }`);
            for (let mapping of yield this.helper.icons) {
                args.push(mapping.join("=/usr/share/icons/hicolor/"));
            }
            args.push(`${ yield this.desktopEntry }=/usr/share/applications/${ appInfo.productFilename }.desktop`);
            yield util_1.exec((yield fpmPath), args);
            this.packager.dispatchArtifactCreated(destination);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FpmTarget;
function writeConfigFile(tmpDir, templatePath, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = template((yield fs_extra_p_1.readFile(templatePath, "utf8")), {
            // set interpolate explicitly to avoid troubles with templating of installer.nsi.tpl
            interpolate: /<%=([\s\S]+?)%>/g
        })(options);
        const outputPath = yield tmpDir.getTempFile(path.basename(templatePath, ".tpl"));
        yield fs_extra_p_1.outputFile(outputPath, config);
        return outputPath;
    });
}
//# sourceMappingURL=fpm.js.map