"use strict";

var _this = this;

const avaEx_1 = require("./helpers/avaEx");
const expectedContents_1 = require("./helpers/expectedContents");
const fs_extra_p_1 = require("fs-extra-p");
const packTester_1 = require("./helpers/packTester");
const bluebird_1 = require("bluebird");
const path = require("path");
const fileAssert_1 = require("./helpers/fileAssert");
const out_1 = require("out");
const pathSorter = require("path-sort");
const asar_electron_builder_1 = require("asar-electron-builder");
const __awaiter = require("out/util/awaiter");
avaEx_1.default.ifDevOrLinuxCi("ignore build resources", packTester_1.app({
    targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET),
    devMetadata: {
        build: {
            asar: false
        }
    }
}, {
    projectDirCreated: projectDir => {
        return fs_extra_p_1.outputFile(path.join(projectDir, "one/build/foo.txt"), "data");
    },
    packed: context => {
        return fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app", "one", "build", "foo.txt")).isFile();
    }
}));
avaEx_1.default.ifDevOrLinuxCi("ignore known ignored files", packTester_1.app({
    targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET),
    devMetadata: {
        build: {
            asar: false
        }
    }
}, {
    projectDirCreated: projectDir => bluebird_1.Promise.all([fs_extra_p_1.outputFile(path.join(projectDir, ".svn", "foo"), "data"), fs_extra_p_1.outputFile(path.join(projectDir, ".git", "foo"), "data"), fs_extra_p_1.outputFile(path.join(projectDir, "foo", "bar", "f.o"), "data"), fs_extra_p_1.outputFile(path.join(projectDir, "node_modules", ".bin", "f.txt"), "data"), fs_extra_p_1.outputFile(path.join(projectDir, "node_modules", ".bin2", "f.txt"), "data")]),
    packed: context => __awaiter(_this, void 0, void 0, function* () {
        yield fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app", ".svn")).doesNotExist();
        yield fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app", ".git")).doesNotExist();
        yield fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app", "foo", "bar", "f.o")).doesNotExist();
        yield fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app", "node_modules", ".bin")).doesNotExist();
        yield fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app", "node_modules", ".bin2")).isDirectory();
    })
}));
avaEx_1.default.ifDevOrLinuxCi("files", packTester_1.app({
    targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET),
    devMetadata: {
        build: {
            asar: false,
            files: ["**/*", "!ignoreMe${/*}"]
        }
    }
}, {
    projectDirCreated: projectDir => {
        return fs_extra_p_1.outputFile(path.join(projectDir, "ignoreMe", "foo"), "data");
    },
    packed: context => {
        return fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app", "ignoreMe")).doesNotExist();
    }
}));
avaEx_1.default.ifDevOrLinuxCi("unpackDir one", packTester_1.app({
    targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET),
    devMetadata: {
        build: {
            asar: {
                unpackDir: "{assets,b2}"
            }
        }
    }
}, {
    projectDirCreated: projectDir => {
        return bluebird_1.Promise.all([fs_extra_p_1.outputFile(path.join(projectDir, "assets", "file"), "data"), fs_extra_p_1.outputFile(path.join(projectDir, "b2", "file"), "data")]);
    },
    packed: context => {
        return bluebird_1.Promise.all([fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app.asar.unpacked", "assets")).isDirectory(), fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app.asar.unpacked", "b2")).isDirectory()]);
    }
}));
avaEx_1.default.ifDevOrLinuxCi("unpackDir", () => {
    return packTester_1.assertPack("test-app", {
        targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET),
        devMetadata: {
            build: {
                asar: {
                    unpackDir: "{assets,b2}"
                }
            }
        }
    }, {
        projectDirCreated: projectDir => {
            return bluebird_1.Promise.all([fs_extra_p_1.outputFile(path.join(projectDir, "app", "assets", "file"), "data"), fs_extra_p_1.outputFile(path.join(projectDir, "app", "b2", "file"), "data")]);
        },
        packed: context => {
            return bluebird_1.Promise.all([fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app.asar.unpacked", "assets")).isDirectory(), fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app.asar.unpacked", "b2")).isDirectory()]);
        }
    });
});
avaEx_1.default.ifNotWindows("link", packTester_1.app({
    targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET)
}, {
    projectDirCreated: projectDir => {
        return fs_extra_p_1.symlink(path.join(projectDir, "index.js"), path.join(projectDir, "foo.js"));
    },
    packed: context => __awaiter(_this, void 0, void 0, function* () {
        fileAssert_1.assertThat(asar_electron_builder_1.statFile(path.join(context.getResources(out_1.Platform.LINUX), "app.asar"), "foo.js", false)).hasProperties({
            link: "index.js"
        });
    })
}));
avaEx_1.default.ifNotCiOsx("ignore node_modules known dev dep", () => {
    const build = {
        asar: false,
        ignore: file => {
            return file === "/ignoreMe";
        }
    };
    return packTester_1.assertPack("test-app-one", {
        targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET),
        devMetadata: {
            build: build
        }
    }, {
        projectDirCreated: projectDir => {
            return bluebird_1.Promise.all([packTester_1.modifyPackageJson(projectDir, data => {
                data.devDependencies = Object.assign({
                    "electron-osx-sign-tf": "*"
                }, data.devDependencies);
            }), fs_extra_p_1.outputFile(path.join(projectDir, "node_modules", "electron-osx-sign-tf", "package.json"), "{}"), fs_extra_p_1.outputFile(path.join(projectDir, "ignoreMe"), "")]);
        },
        packed: context => {
            return bluebird_1.Promise.all([fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app", "node_modules", "electron-osx-sign-tf")).doesNotExist(), fileAssert_1.assertThat(path.join(context.getResources(out_1.Platform.LINUX), "app", "ignoreMe")).doesNotExist()]);
        }
    });
});
avaEx_1.default.ifDevOrLinuxCi("failed peer dep", () => {
    return packTester_1.assertPack("test-app-one", {
        targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET)
    }, {
        npmInstallBefore: true,
        projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
            data.dependencies = {
                "rc-datepicker": "4.0.0",
                "react": "15.2.1",
                "react-dom": "15.2.1"
            };
        })
    });
});
avaEx_1.default("extraResources", () => __awaiter(_this, void 0, void 0, function* () {
    for (let platform of packTester_1.getPossiblePlatforms().keys()) {
        const osName = platform.buildConfigurationKey;
        const winDirPrefix = "lib/net45/resources/";
        yield packTester_1.assertPack("test-app", {
            targets: platform.createTarget(platform === out_1.Platform.WINDOWS ? null : out_1.DIR_TARGET)
        }, {
            projectDirCreated: projectDir => {
                return bluebird_1.Promise.all([packTester_1.modifyPackageJson(projectDir, data => {
                    data.build.extraResources = ["foo", "bar/hello.txt", "bar/${arch}.txt", "${os}/${arch}.txt"];
                    data.build[osName] = {
                        extraResources: ["platformSpecificR"],
                        extraFiles: ["platformSpecificF"]
                    };
                }), fs_extra_p_1.outputFile(path.join(projectDir, "foo/nameWithoutDot"), "nameWithoutDot"), fs_extra_p_1.outputFile(path.join(projectDir, "bar/hello.txt"), "data"), fs_extra_p_1.outputFile(path.join(projectDir, `bar/${ process.arch }.txt`), "data"), fs_extra_p_1.outputFile(path.join(projectDir, `${ osName }/${ process.arch }.txt`), "data"), fs_extra_p_1.outputFile(path.join(projectDir, "platformSpecificR"), "platformSpecificR"), fs_extra_p_1.outputFile(path.join(projectDir, "ignoreMe.txt"), "ignoreMe")]);
            },
            packed: context => __awaiter(this, void 0, void 0, function* () {
                const base = path.join(context.outDir, platform.buildConfigurationKey + `${ platform === out_1.Platform.MAC ? "" : "-unpacked" }`);
                let resourcesDir = path.join(base, "resources");
                if (platform === out_1.Platform.MAC) {
                    resourcesDir = path.join(base, "TestApp.app", "Contents", "Resources");
                }
                yield fileAssert_1.assertThat(path.join(resourcesDir, "foo")).isDirectory();
                yield fileAssert_1.assertThat(path.join(resourcesDir, "foo", "nameWithoutDot")).isFile();
                yield fileAssert_1.assertThat(path.join(resourcesDir, "bar", "hello.txt")).isFile();
                yield fileAssert_1.assertThat(path.join(resourcesDir, "bar", `${ process.arch }.txt`)).isFile();
                yield fileAssert_1.assertThat(path.join(resourcesDir, osName, `${ process.arch }.txt`)).isFile();
                yield fileAssert_1.assertThat(path.join(resourcesDir, "platformSpecificR")).isFile();
                yield fileAssert_1.assertThat(path.join(resourcesDir, "ignoreMe.txt")).doesNotExist();
            }),
            expectedContents: platform === out_1.Platform.WINDOWS ? pathSorter(expectedContents_1.expectedWinContents.concat(winDirPrefix + "bar/hello.txt", winDirPrefix + "bar/x64.txt", winDirPrefix + "foo/nameWithoutDot", winDirPrefix + "platformSpecificR", winDirPrefix + "win/x64.txt")) : null
        });
    }
}));
avaEx_1.default("extraResources - one-package", () => __awaiter(_this, void 0, void 0, function* () {
    for (let platform of [process.platform === "win32" ? out_1.Platform.WINDOWS : out_1.Platform.LINUX]) {
        const osName = platform.buildConfigurationKey;
        const winDirPrefix = "lib/net45/resources/";
        yield packTester_1.assertPack("test-app-one", {
            targets: platform.createTarget(platform === out_1.Platform.WINDOWS ? null : out_1.DIR_TARGET),
            devMetadata: {
                build: {
                    asar: true
                }
            }
        }, {
            projectDirCreated: projectDir => {
                return bluebird_1.Promise.all([packTester_1.modifyPackageJson(projectDir, data => {
                    data.build.extraResources = ["foo", "bar/hello.txt", "bar/${arch}.txt", "${os}/${arch}.txt"];
                    data.build[osName] = {
                        extraResources: ["platformSpecificR"],
                        extraFiles: ["platformSpecificF"]
                    };
                }), fs_extra_p_1.outputFile(path.join(projectDir, "foo/nameWithoutDot"), "nameWithoutDot"), fs_extra_p_1.outputFile(path.join(projectDir, "bar/hello.txt"), "data"), fs_extra_p_1.outputFile(path.join(projectDir, `bar/${ process.arch }.txt`), "data"), fs_extra_p_1.outputFile(path.join(projectDir, `${ osName }/${ process.arch }.txt`), "data"), fs_extra_p_1.outputFile(path.join(projectDir, "platformSpecificR"), "platformSpecificR"), fs_extra_p_1.outputFile(path.join(projectDir, "ignoreMe.txt"), "ignoreMe")]);
            },
            packed: context => __awaiter(this, void 0, void 0, function* () {
                const base = path.join(context.outDir, platform.buildConfigurationKey + `${ platform === out_1.Platform.MAC ? "" : "-unpacked" }`);
                let resourcesDir = path.join(base, "resources");
                if (platform === out_1.Platform.MAC) {
                    resourcesDir = path.join(base, "TestApp.app", "Contents", "Resources");
                }
                const appDir = path.join(resourcesDir, "app");
                yield fileAssert_1.assertThat(path.join(resourcesDir, "foo")).isDirectory();
                yield fileAssert_1.assertThat(path.join(appDir, "foo")).doesNotExist();
                yield fileAssert_1.assertThat(path.join(resourcesDir, "foo", "nameWithoutDot")).isFile();
                yield fileAssert_1.assertThat(path.join(appDir, "foo", "nameWithoutDot")).doesNotExist();
                yield fileAssert_1.assertThat(path.join(resourcesDir, "bar", "hello.txt")).isFile();
                yield fileAssert_1.assertThat(path.join(resourcesDir, "bar", `${ process.arch }.txt`)).isFile();
                yield fileAssert_1.assertThat(path.join(appDir, "bar", `${ process.arch }.txt`)).doesNotExist();
                yield fileAssert_1.assertThat(path.join(resourcesDir, osName, `${ process.arch }.txt`)).isFile();
                yield fileAssert_1.assertThat(path.join(resourcesDir, "platformSpecificR")).isFile();
                yield fileAssert_1.assertThat(path.join(resourcesDir, "ignoreMe.txt")).doesNotExist();
            }),
            expectedContents: platform === out_1.Platform.WINDOWS ? pathSorter(expectedContents_1.expectedWinContents.concat(winDirPrefix + "bar/hello.txt", winDirPrefix + "bar/x64.txt", winDirPrefix + "foo/nameWithoutDot", winDirPrefix + "platformSpecificR", winDirPrefix + "win/x64.txt")) : null
        });
    }
}));
avaEx_1.default.ifDevOrLinuxCi("copy only js files - no asar", packTester_1.appThrows(/Application "package.json" does not exist/, {
    targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET),
    devMetadata: {
        build: {
            "files": ["**/*.js"],
            asar: false
        }
    }
}));
avaEx_1.default.ifDevOrLinuxCi("copy only js files - asar", packTester_1.appThrows(/Application "package.json" in the /, {
    targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET),
    devMetadata: {
        build: {
            "files": ["**/*.js"],
            asar: true
        }
    }
}));
//# sourceMappingURL=globTest.js.map