"use strict";

var _this = this;

const avaEx_1 = require("./helpers/avaEx");
const packTester_1 = require("./helpers/packTester");
const macPackager_1 = require("out/macPackager");
const fs_extra_p_1 = require("fs-extra-p");
const path = require("path");
const bluebird_1 = require("bluebird");
const fileAssert_1 = require("./helpers/fileAssert");
const out_1 = require("out");
const targetFactory_1 = require("out/targets/targetFactory");
const dmg_1 = require("out/targets/dmg");
const util_1 = require("out/util/util");
const util_2 = require("out/util/util");
const __awaiter = require("out/util/awaiter");
avaEx_1.default.ifOsx("two-package", () => packTester_1.assertPack("test-app", { targets: out_1.createTargets([out_1.Platform.MAC], null, "all") }, { signed: true, useTempDir: true }));
avaEx_1.default.ifOsx("one-package", packTester_1.app(packTester_1.platform(out_1.Platform.MAC), { signed: true }));
function createTargetTest(target, expectedContents) {
    return packTester_1.app({
        targets: out_1.Platform.MAC.createTarget(),
        devMetadata: {
            build: {
                mac: {
                    target: target
                }
            }
        }
    }, {
        useTempDir: true,
        expectedContents: expectedContents,
        signed: target.indexOf("mas") !== -1,
        packed: context => __awaiter(this, void 0, void 0, function* () {
            if (!(target.indexOf("tar.gz") !== -1)) {
                return;
            }
            const tempDir = path.join(context.outDir, util_1.getTempName());
            yield fs_extra_p_1.mkdir(tempDir);
            yield util_2.exec("tar", ["xf", path.join(context.outDir, "mac", "Test App ßW-1.1.0-mac.tar.gz")], { cwd: tempDir });
            yield fileAssert_1.assertThat(path.join(tempDir, "Test App ßW.app")).isDirectory();
        })
    });
}
avaEx_1.default("only zip", createTargetTest(["zip"], ["Test App ßW-1.1.0-mac.zip"]));
avaEx_1.default("tar.gz", createTargetTest(["tar.gz"], ["Test App ßW-1.1.0-mac.tar.gz"]));
avaEx_1.default.ifOsx("invalid target", t => t.throws(createTargetTest(["ttt"], [])(), "Unknown target: ttt"));
if (process.env.CSC_KEY_PASSWORD == null || process.platform !== "darwin") {
    console.warn("Skip mas tests because CSC_KEY_PASSWORD is not defined");
} else {
    avaEx_1.default.ifOsx("mas", createTargetTest(["mas"], ["Test App ßW-1.1.0.pkg"]));
    avaEx_1.default.ifOsx("mas and 7z", createTargetTest(["mas", "7z"], ["Test App ßW-1.1.0-mac.7z", "Test App ßW-1.1.0.pkg"]));
    avaEx_1.default.ifOsx("custom mas", () => {
        let platformPackager = null;
        return packTester_1.assertPack("test-app-one", packTester_1.signed({
            targets: out_1.Platform.MAC.createTarget(),
            platformPackagerFactory: (packager, platform, cleanupTasks) => platformPackager = new CheckingMacPackager(packager),
            devMetadata: {
                build: {
                    mac: {
                        target: ["mas"]
                    },
                    mas: {
                        entitlements: "mas-entitlements file path",
                        entitlementsInherit: "mas-entitlementsInherit file path"
                    }
                }
            }
        }), {
            packed: () => {
                fileAssert_1.assertThat(platformPackager.effectiveSignOptions).hasProperties({
                    entitlements: "mas-entitlements file path",
                    "entitlements-inherit": "mas-entitlementsInherit file path"
                });
                return bluebird_1.Promise.resolve(null);
            }
        });
    });
    avaEx_1.default.ifOsx("entitlements in the package.json", () => {
        let platformPackager = null;
        return packTester_1.assertPack("test-app-one", packTester_1.signed({
            targets: out_1.Platform.MAC.createTarget(),
            platformPackagerFactory: (packager, platform, cleanupTasks) => platformPackager = new CheckingMacPackager(packager),
            devMetadata: {
                build: {
                    mac: {
                        entitlements: "osx-entitlements file path",
                        entitlementsInherit: "osx-entitlementsInherit file path"
                    }
                }
            }
        }), {
            packed: () => {
                fileAssert_1.assertThat(platformPackager.effectiveSignOptions).hasProperties({
                    entitlements: "osx-entitlements file path",
                    "entitlements-inherit": "osx-entitlementsInherit file path"
                });
                return bluebird_1.Promise.resolve();
            }
        });
    });
    avaEx_1.default.ifOsx("entitlements in build dir", () => {
        let platformPackager = null;
        return packTester_1.assertPack("test-app-one", packTester_1.signed({
            targets: out_1.Platform.MAC.createTarget(),
            platformPackagerFactory: (packager, platform, cleanupTasks) => platformPackager = new CheckingMacPackager(packager)
        }), {
            projectDirCreated: projectDir => bluebird_1.Promise.all([fs_extra_p_1.writeFile(path.join(projectDir, "build", "entitlements.mac.plist"), ""), fs_extra_p_1.writeFile(path.join(projectDir, "build", "entitlements.mac.inherit.plist"), "")]),
            packed: context => {
                fileAssert_1.assertThat(platformPackager.effectiveSignOptions).hasProperties({
                    entitlements: path.join(context.projectDir, "build", "entitlements.mac.plist"),
                    "entitlements-inherit": path.join(context.projectDir, "build", "entitlements.mac.inherit.plist")
                });
                return bluebird_1.Promise.resolve();
            }
        });
    });
}
avaEx_1.default.ifOsx("no background", packTester_1.app({
    targets: out_1.Platform.MAC.createTarget("dmg"),
    devMetadata: {
        build: {
            productName: "Test ß",
            dmg: {
                background: null
            }
        }
    }
}, {
    expectedContents: ["Test ß-1.1.0.dmg"],
    packed: context => {
        return dmg_1.attachAndExecute(path.join(context.outDir, "mac/Test ß-1.1.0.dmg"), false, () => {
            return fileAssert_1.assertThat(path.join("/Volumes/Test ß 1.1.0/.background")).doesNotExist();
        });
    }
}));
avaEx_1.default.ifOsx("unset dmg icon", packTester_1.app({
    targets: out_1.Platform.MAC.createTarget("dmg"),
    devMetadata: {
        build: {
            productName: "Test ß No Volume Icon",
            dmg: {
                icon: null
            }
        }
    }
}, {
    expectedContents: ["Test ß No Volume Icon-1.1.0.dmg"],
    packed: context => {
        return dmg_1.attachAndExecute(path.join(context.outDir, "mac/Test ß No Volume Icon-1.1.0.dmg"), false, () => {
            return bluebird_1.Promise.all([fileAssert_1.assertThat(path.join("/Volumes/Test ß No Volume Icon 1.1.0/.background/background.tiff")).isFile(), fileAssert_1.assertThat(path.join("/Volumes/Test ß No Volume Icon 1.1.0/.VolumeIcon.icns")).doesNotExist()]);
        });
    }
}));
avaEx_1.default.ifOsx("no build directory", packTester_1.app(packTester_1.platform(out_1.Platform.MAC), {
    projectDirCreated: projectDir => fs_extra_p_1.remove(path.join(projectDir, "build"))
}));
avaEx_1.default.ifOsx("custom background - old way", () => {
    let platformPackager = null;
    const customBackground = "customBackground.tiff";
    return packTester_1.assertPack("test-app-one", {
        targets: out_1.Platform.MAC.createTarget(),
        platformPackagerFactory: (packager, platform, cleanupTasks) => platformPackager = new CheckingMacPackager(packager)
    }, {
        projectDirCreated: projectDir => bluebird_1.Promise.all([fs_extra_p_1.copy(path.join(__dirname, "..", "..", "templates", "dmg", "background.tiff"), path.join(projectDir, customBackground)), packTester_1.modifyPackageJson(projectDir, data => {
            data.build.osx = {
                background: customBackground,
                icon: "foo.icns"
            };
        })]),
        packed: () => {
            fileAssert_1.assertThat(platformPackager.effectiveDistOptions.background).isEqualTo(customBackground);
            fileAssert_1.assertThat(platformPackager.effectiveDistOptions.icon).isEqualTo("foo.icns");
            return bluebird_1.Promise.resolve(null);
        }
    });
});
avaEx_1.default.ifOsx("custom background - new way", () => {
    let platformPackager = null;
    const customBackground = "customBackground.png";
    return packTester_1.assertPack("test-app-one", {
        targets: out_1.Platform.MAC.createTarget(),
        platformPackagerFactory: (packager, platform, cleanupTasks) => platformPackager = new CheckingMacPackager(packager)
    }, {
        projectDirCreated: projectDir => bluebird_1.Promise.all([fs_extra_p_1.copy(path.join(__dirname, "..", "..", "templates", "dmg", "background.tiff"), path.join(projectDir, customBackground)), packTester_1.modifyPackageJson(projectDir, data => {
            data.build.mac = {
                icon: "customIcon"
            };
            data.build.dmg = {
                background: customBackground,
                icon: "foo.icns"
            };
            data.build.osx = {
                background: null,
                icon: "ignoreMe.icns"
            };
        })]),
        packed: context => __awaiter(_this, void 0, void 0, function* () {
            fileAssert_1.assertThat(platformPackager.effectiveDistOptions.background).isEqualTo(customBackground);
            fileAssert_1.assertThat(platformPackager.effectiveDistOptions.icon).isEqualTo("foo.icns");
            fileAssert_1.assertThat((yield platformPackager.getIconPath())).isEqualTo(path.join(context.projectDir, "customIcon.icns"));
        })
    });
});
avaEx_1.default.ifOsx("disable dmg icon (light), bundleVersion", () => {
    let platformPackager = null;
    return packTester_1.assertPack("test-app-one", {
        targets: out_1.Platform.MAC.createTarget(),
        platformPackagerFactory: (packager, platform, cleanupTasks) => platformPackager = new CheckingMacPackager(packager),
        devMetadata: {
            build: {
                dmg: {
                    icon: null
                },
                mac: {
                    bundleVersion: "50"
                }
            }
        }
    }, {
        packed: () => __awaiter(_this, void 0, void 0, function* () {
            fileAssert_1.assertThat(platformPackager.effectiveDistOptions.icon).isEqualTo(null);
            fileAssert_1.assertThat((yield platformPackager.getIconPath())).isNotEqualTo(null);
            fileAssert_1.assertThat(platformPackager.appInfo.buildVersion).isEqualTo("50");
        })
    });
});
avaEx_1.default.ifOsx("electronDist", packTester_1.appThrows(/ENOENT: no such file or directory/, {
    targets: out_1.Platform.OSX.createTarget(targetFactory_1.DIR_TARGET)
}, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.build.electronDist = "foo";
    })
}));
class CheckingMacPackager extends macPackager_1.default {
    constructor(info) {
        super(info);
    }
    pack(outDir, arch, targets, postAsyncTasks) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            for (let target of targets) {
                if (target.name === "dmg") {
                    this.effectiveDistOptions = yield target.computeDmgOptions();
                    break;
                }
            }
            return yield _super("pack").call(this, outDir, arch, targets, postAsyncTasks);
        });
    }
    doPack(outDir, appOutDir, platformName, arch, customBuildOptions) {
        let postAsyncTasks = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;

        return __awaiter(this, void 0, void 0, function* () {});
    }
    doSign(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.effectiveSignOptions = opts;
        });
    }
    doFlat(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.effectiveFlatOptions = opts;
        });
    }
    packageInDistributableFormat(appOutDir, targets, promises) {}
}
//# sourceMappingURL=macPackagerTest.js.map