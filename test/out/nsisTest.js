"use strict";

const out_1 = require("out");
const avaEx_1 = require("./helpers/avaEx");
const packTester_1 = require("./helpers/packTester");
const fs_extra_p_1 = require("fs-extra-p");
const path = require("path");
const bluebird_1 = require("bluebird");
const fileAssert_1 = require("./helpers/fileAssert");
const asar_electron_builder_1 = require("asar-electron-builder");
const asarUtil_1 = require("out/asarUtil");
const expectedContents_1 = require("./helpers/expectedContents");
const wine_1 = require("./helpers/wine");
const __awaiter = require("out/util/awaiter");
const nsisTarget = out_1.Platform.WINDOWS.createTarget(["nsis"]);
avaEx_1.default("one-click", packTester_1.app({
    targets: out_1.Platform.WINDOWS.createTarget(["nsis"], out_1.Arch.ia32),
    devMetadata: {
        build: {}
    }
}, {
    useTempDir: true,
    signed: true,
    packed: context => {
        return doTest(context.outDir, true);
    }
}));
avaEx_1.default.ifDevOrLinuxCi("perMachine, no run after finish", packTester_1.app({
    targets: out_1.Platform.WINDOWS.createTarget(["nsis"], out_1.Arch.ia32),
    devMetadata: {
        build: {
            productName: "TestApp",
            fileAssociations: [{
                ext: "foo",
                name: "Test Foo"
            }],
            nsis: {
                perMachine: true,
                runAfterFinish: false
            }
        }
    }
}, {
    projectDirCreated: projectDir => {
        let headerIconPath = path.join(projectDir, "build", "foo.ico");
        return fs_extra_p_1.copy(packTester_1.getTestAsset("headerIcon.ico"), headerIconPath);
    },
    packed: context => {
        return doTest(context.outDir, false);
    }
}));
function doTest(outDir, perUser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.DO_WINE !== "true") {
            return bluebird_1.Promise.resolve();
        }
        const wine = new wine_1.WineManager();
        yield wine.prepare();
        const driveC = path.join(wine.wineDir, "drive_c");
        const driveCWindows = path.join(wine.wineDir, "drive_c", "windows");
        const perUserTempDir = path.join(wine.userDir, "Temp");
        const walkFilter = it => {
            return it !== driveCWindows && it !== perUserTempDir;
        };
        function listFiles() {
            return asarUtil_1.walk(driveC, null, walkFilter);
        }
        let fsBefore = yield listFiles();
        yield wine.exec(path.join(outDir, "TestApp Setup 1.1.0.exe"), "/S");
        const instDir = perUser ? path.join(wine.userDir, "Local Settings", "Application Data", "Programs") : path.join(driveC, "Program Files");
        const appAsar = path.join(instDir, "TestApp", "1.1.0", "resources", "app.asar");
        fileAssert_1.assertThat(JSON.parse(asar_electron_builder_1.extractFile(appAsar, "package.json").toString())).hasProperties({
            name: "TestApp"
        });
        let fsAfter = yield listFiles();
        let fsChanges = wine_1.diff(fsBefore, fsAfter, driveC);
        fileAssert_1.assertThat(fsChanges.added).isEqualTo(expectedContents_1.nsisPerMachineInstall);
        fileAssert_1.assertThat(fsChanges.deleted).isEqualTo([]);
        const appDataFile = path.join(wine.userDir, "Application Data", "TestApp", "doNotDeleteMe");
        yield fs_extra_p_1.outputFile(appDataFile, "app data must be not removed");
        fsBefore = yield listFiles();
        yield wine.exec(path.join(outDir, "TestApp Setup 1.1.0.exe"), "/S");
        fsAfter = yield listFiles();
        fsChanges = wine_1.diff(fsBefore, fsAfter, driveC);
        fileAssert_1.assertThat(fsChanges.added).isEqualTo([]);
        fileAssert_1.assertThat(fsChanges.deleted).isEqualTo([]);
        yield fileAssert_1.assertThat(appDataFile).isFile();
        yield wine.exec(path.join(outDir, "TestApp Setup 1.1.0.exe"), "/S", "--delete-app-data");
        yield fileAssert_1.assertThat(appDataFile).doesNotExist();
    });
}
avaEx_1.default.ifNotCiOsx("boring", packTester_1.app({
    targets: nsisTarget,
    devMetadata: {
        build: {
            nsis: {
                oneClick: false,
                language: "1031"
            },
            win: {
                legalTrademarks: "My Trademark"
            }
        }
    }
}, { signed: true }));
avaEx_1.default.ifNotCiOsx("boring, only perMachine", packTester_1.app({
    targets: nsisTarget,
    devMetadata: {
        build: {
            nsis: {
                oneClick: false,
                perMachine: true
            }
        }
    }
}));
avaEx_1.default.ifNotCiOsx("installerHeaderIcon", () => {
    let headerIconPath = null;
    return packTester_1.assertPack("test-app-one", {
        targets: nsisTarget,
        effectiveOptionComputed: options => {
            const defines = options[0];
            fileAssert_1.assertThat(defines.HEADER_ICO).isEqualTo(headerIconPath);
            return false;
        }
    }, {
        projectDirCreated: projectDir => {
            headerIconPath = path.join(projectDir, "build", "installerHeaderIcon.ico");
            return fs_extra_p_1.copy(packTester_1.getTestAsset("headerIcon.ico"), headerIconPath);
        }
    });
});
avaEx_1.default.ifNotCiOsx("boring, MUI_HEADER", () => {
    let installerHeaderPath = null;
    return packTester_1.assertPack("test-app-one", {
        targets: nsisTarget,
        devMetadata: {
            build: {
                nsis: {
                    oneClick: false
                }
            }
        },
        effectiveOptionComputed: options => {
            const defines = options[0];
            fileAssert_1.assertThat(defines.MUI_HEADERIMAGE).isEqualTo(null);
            fileAssert_1.assertThat(defines.MUI_HEADERIMAGE_BITMAP).isEqualTo(installerHeaderPath);
            fileAssert_1.assertThat(defines.MUI_HEADERIMAGE_RIGHT).isEqualTo(null);
            return true;
        }
    }, {
        projectDirCreated: projectDir => {
            installerHeaderPath = path.join(projectDir, "build", "installerHeader.bmp");
            return fs_extra_p_1.copy(packTester_1.getTestAsset("installerHeader.bmp"), installerHeaderPath);
        }
    });
});
avaEx_1.default.ifNotCiOsx("boring, MUI_HEADER as option", () => {
    let installerHeaderPath = null;
    return packTester_1.assertPack("test-app-one", {
        targets: out_1.Platform.WINDOWS.createTarget(["nsis"], out_1.Arch.ia32, out_1.Arch.x64),
        devMetadata: {
            build: {
                nsis: {
                    oneClick: false,
                    installerHeader: "foo.bmp"
                }
            }
        },
        effectiveOptionComputed: options => {
            const defines = options[0];
            fileAssert_1.assertThat(defines.MUI_HEADERIMAGE).isEqualTo(null);
            fileAssert_1.assertThat(defines.MUI_HEADERIMAGE_BITMAP).isEqualTo(installerHeaderPath);
            fileAssert_1.assertThat(defines.MUI_HEADERIMAGE_RIGHT).isEqualTo(null);
            return false;
        }
    }, {
        projectDirCreated: projectDir => {
            installerHeaderPath = path.join(projectDir, "foo.bmp");
            return fs_extra_p_1.copy(packTester_1.getTestAsset("installerHeader.bmp"), installerHeaderPath);
        }
    });
});
avaEx_1.default.ifDevOrLinuxCi("custom include", () => packTester_1.assertPack("test-app-one", { targets: nsisTarget }, {
    projectDirCreated: projectDir => fs_extra_p_1.copy(packTester_1.getTestAsset("installer.nsh"), path.join(projectDir, "build", "installer.nsh")),
    packed: context => bluebird_1.Promise.all([fileAssert_1.assertThat(path.join(context.projectDir, "build", "customHeader")).isFile(), fileAssert_1.assertThat(path.join(context.projectDir, "build", "customInit")).isFile(), fileAssert_1.assertThat(path.join(context.projectDir, "build", "customInstall")).isFile()])
}));
avaEx_1.default.ifDevOrLinuxCi("custom script", packTester_1.app({ targets: nsisTarget }, {
    projectDirCreated: projectDir => fs_extra_p_1.copy(packTester_1.getTestAsset("installer.nsi"), path.join(projectDir, "build", "installer.nsi")),
    packed: context => fileAssert_1.assertThat(path.join(context.projectDir, "build", "customInstallerScript")).isFile()
}));
//# sourceMappingURL=nsisTest.js.map