"use strict";

var _this = this;

const out_1 = require("out");
const avaEx_1 = require("./helpers/avaEx");
const packTester_1 = require("./helpers/packTester");
const fs_extra_p_1 = require("fs-extra-p");
const path = require("path");
const winPackager_1 = require("out/winPackager");
const bluebird_1 = require("bluebird");
const fileAssert_1 = require("./helpers/fileAssert");
const __awaiter = require("out/util/awaiter");
avaEx_1.default.ifNotCiOsx("win", packTester_1.app({ targets: out_1.Platform.WINDOWS.createTarget(["default", "zip"]) }, { signed: true }));
avaEx_1.default.skip("delta and msi", packTester_1.app({
    targets: out_1.Platform.WINDOWS.createTarget(null, out_1.Arch.ia32),
    devMetadata: {
        build: {
            squirrelWindows: {
                remoteReleases: "https://github.com/develar/__test-app-releases",
                msi: true
            }
        }
    }
}));
avaEx_1.default.ifDevOrWinCi("beta version", packTester_1.app({
    targets: out_1.Platform.WINDOWS.createTarget(["squirrel", "nsis"]),
    devMetadata: {
        version: "3.0.0-beta.2"
    }
}));
avaEx_1.default.ifDevOrWinCi("beta version", packTester_1.app({
    targets: out_1.Platform.WINDOWS.createTarget(["squirrel", "nsis"]),
    devMetadata: {
        version: "3.0.0-beta.2"
    }
}));
avaEx_1.default.ifNotCiOsx("msi as string", t => t.throws(packTester_1.assertPack("test-app-one", packTester_1.platform(out_1.Platform.WINDOWS), {
    projectDirCreated: it => packTester_1.modifyPackageJson(it, data => {
        data.build.win = {
            msi: "false"
        };
    })
}), `msi expected to be boolean value, but string '"false"' was specified`));
avaEx_1.default("detect install-spinner, certificateFile/password", () => {
    let platformPackager = null;
    let loadingGifPath = null;
    return packTester_1.assertPack("test-app-one", {
        targets: out_1.Platform.WINDOWS.createTarget(),
        platformPackagerFactory: (packager, platform, cleanupTasks) => platformPackager = new CheckingWinPackager(packager),
        devMetadata: {
            build: {
                win: {
                    certificatePassword: "pass"
                }
            }
        }
    }, {
        projectDirCreated: it => {
            loadingGifPath = path.join(it, "build", "install-spinner.gif");
            return bluebird_1.Promise.all([fs_extra_p_1.copy(packTester_1.getTestAsset("install-spinner.gif"), loadingGifPath), packTester_1.modifyPackageJson(it, data => {
                data.build.win = {
                    certificateFile: "secretFile",
                    certificatePassword: "mustBeOverridden"
                };
            })]);
        },
        packed: () => {
            fileAssert_1.assertThat(platformPackager.effectiveDistOptions.loadingGif).isEqualTo(loadingGifPath);
            fileAssert_1.assertThat(platformPackager.signOptions.cert).isEqualTo("secretFile");
            fileAssert_1.assertThat(platformPackager.signOptions.password).isEqualTo("pass");
            return bluebird_1.Promise.resolve(null);
        }
    });
});
avaEx_1.default.ifNotCiOsx("icon < 256", t => t.throws(packTester_1.assertPack("test-app-one", packTester_1.platform(out_1.Platform.WINDOWS), {
    projectDirCreated: projectDir => fs_extra_p_1.rename(path.join(projectDir, "build", "incorrect.ico"), path.join(projectDir, "build", "icon.ico"))
}), /Windows icon size must be at least 256x256, please fix ".+/));
avaEx_1.default.ifNotCiOsx("icon not an image", t => t.throws(packTester_1.assertPack("test-app-one", packTester_1.platform(out_1.Platform.WINDOWS), {
    projectDirCreated: projectDir => fs_extra_p_1.outputFile(path.join(projectDir, "build", "icon.ico"), "foo")
}), /Windows icon is not valid ico file, please fix ".+/));
avaEx_1.default.ifOsx("custom icon", () => {
    let platformPackager = null;
    return packTester_1.assertPack("test-app-one", {
        targets: out_1.Platform.WINDOWS.createTarget(),
        platformPackagerFactory: (packager, platform, cleanupTasks) => platformPackager = new CheckingWinPackager(packager)
    }, {
        projectDirCreated: projectDir => bluebird_1.Promise.all([fs_extra_p_1.rename(path.join(projectDir, "build", "icon.ico"), path.join(projectDir, "customIcon.ico")), packTester_1.modifyPackageJson(projectDir, data => {
            data.build.win = {
                icon: "customIcon"
            };
        })]),
        packed: context => __awaiter(_this, void 0, void 0, function* () {
            fileAssert_1.assertThat((yield platformPackager.getIconPath())).isEqualTo(path.join(context.projectDir, "customIcon.ico"));
            return bluebird_1.Promise.resolve();
        })
    });
});
avaEx_1.default.ifNotWindows("ev", t => t.throws(packTester_1.assertPack("test-app-one", {
    targets: out_1.Platform.WINDOWS.createTarget(["dir"]),
    devMetadata: {
        build: {
            win: {
                certificateSubjectName: "ev"
            }
        }
    }
}), /certificateSubjectName supported only on Windows/));
class CheckingWinPackager extends winPackager_1.WinPackager {
    constructor(info) {
        super(info);
    }
    pack(outDir, arch, targets, postAsyncTasks) {
        return __awaiter(this, void 0, void 0, function* () {
            const helperClass = require("out/targets/squirrelWindows").default;
            this.effectiveDistOptions = yield new helperClass(this).computeEffectiveDistOptions();
            yield this.sign(this.computeAppOutDir(outDir, arch));
        });
    }
    packageInDistributableFormat(outDir, appOutDir, arch, targets, promises) {}
    doSign(opts) {
        this.signOptions = opts;
        return bluebird_1.Promise.resolve(null);
    }
}
//# sourceMappingURL=winPackagerTest.js.map