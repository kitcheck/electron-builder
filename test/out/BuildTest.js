"use strict";

var _this = this;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const avaEx_1 = require("./helpers/avaEx");
const packTester_1 = require("./helpers/packTester");
const fs_extra_p_1 = require("fs-extra-p");
const bluebird_1 = require("bluebird");
const path = require("path");
const fileAssert_1 = require("./helpers/fileAssert");
const out_1 = require("out");
const builder_1 = require("out/builder");
const cliOptions_1 = require("out/cliOptions");
const asar_electron_builder_1 = require("asar-electron-builder");
const config_1 = require("./helpers/config");
const __awaiter = require("out/util/awaiter");
avaEx_1.default("cli", () => {
    const yargs = cliOptions_1.createYargs();
    function expected(opt) {
        return Object.assign({
            publish: undefined,
            draft: undefined,
            prerelease: undefined,
            extraMetadata: undefined
        }, opt);
    }
    function parse(input) {
        return builder_1.normalizeOptions(yargs.parse(input.split(" ")));
    }
    fileAssert_1.assertThat(parse("--platform osx")).isEqualTo(expected({ targets: out_1.Platform.MAC.createTarget() }));
    fileAssert_1.assertThat(parse("--platform mac")).isEqualTo(expected({ targets: out_1.Platform.MAC.createTarget() }));
    const all = expected({ targets: new Map([].concat(_toConsumableArray(out_1.Platform.MAC.createTarget(null, out_1.Arch.x64)), _toConsumableArray(out_1.Platform.WINDOWS.createTarget(null, out_1.Arch.x64, out_1.Arch.ia32)), _toConsumableArray(out_1.Platform.LINUX.createTarget(null, out_1.Arch.x64, out_1.Arch.ia32)))) });
    fileAssert_1.assertThat(parse("-owl --x64 --ia32")).isEqualTo(all);
    fileAssert_1.assertThat(parse("-mwl --x64 --ia32")).isEqualTo(all);
    fileAssert_1.assertThat(parse("--dir")).isEqualTo(expected({ targets: out_1.Platform.current().createTarget(out_1.DIR_TARGET) }));
    fileAssert_1.assertThat(parse("--mac --dir")).isEqualTo(expected({ targets: out_1.Platform.MAC.createTarget(out_1.DIR_TARGET) }));
    fileAssert_1.assertThat(parse("--ia32 --dir")).isEqualTo(expected({ targets: out_1.Platform.current().createTarget(out_1.DIR_TARGET, out_1.Arch.ia32) }));
    fileAssert_1.assertThat(parse("--platform linux --dir")).isEqualTo(expected({ targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET) }));
    fileAssert_1.assertThat(parse("--osx")).isEqualTo(expected({ targets: out_1.Platform.MAC.createTarget() }));
    fileAssert_1.assertThat(parse("--arch x64")).isEqualTo(expected({ targets: out_1.Platform.current().createTarget(null, out_1.Arch.x64) }));
    fileAssert_1.assertThat(parse("--ia32 --x64")).isEqualTo(expected({ targets: out_1.Platform.current().createTarget(null, out_1.Arch.x64, out_1.Arch.ia32) }));
    fileAssert_1.assertThat(parse("--linux")).isEqualTo(expected({ targets: out_1.Platform.LINUX.createTarget() }));
    fileAssert_1.assertThat(parse("--win")).isEqualTo(expected({ targets: out_1.Platform.WINDOWS.createTarget() }));
    fileAssert_1.assertThat(parse("-owl")).isEqualTo(expected({ targets: out_1.createTargets([out_1.Platform.MAC, out_1.Platform.WINDOWS, out_1.Platform.LINUX]) }));
    fileAssert_1.assertThat(parse("-l tar.gz:ia32")).isEqualTo(expected({ targets: out_1.Platform.LINUX.createTarget("tar.gz", out_1.Arch.ia32) }));
    fileAssert_1.assertThat(parse("-l tar.gz:x64")).isEqualTo(expected({ targets: out_1.Platform.LINUX.createTarget("tar.gz", out_1.Arch.x64) }));
    fileAssert_1.assertThat(parse("-l tar.gz")).isEqualTo(expected({ targets: out_1.Platform.LINUX.createTarget("tar.gz", out_1.archFromString(process.arch)) }));
    fileAssert_1.assertThat(parse("-w tar.gz:x64")).isEqualTo(expected({ targets: out_1.Platform.WINDOWS.createTarget("tar.gz", out_1.Arch.x64) }));
    function parseExtraMetadata(input) {
        const result = parse(input);
        delete result.targets;
        return result;
    }
    fileAssert_1.assertThat(parseExtraMetadata("--em.foo=bar")).isEqualTo(expected({ extraMetadata: {
            foo: "bar"
        } }));
});
avaEx_1.default("custom buildResources dir", packTester_1.app(allPlatforms(false), {
    projectDirCreated: projectDir => bluebird_1.Promise.all([packTester_1.modifyPackageJson(projectDir, data => {
        data.directories = {
            buildResources: "custom"
        };
    }), fs_extra_p_1.move(path.join(projectDir, "build"), path.join(projectDir, "custom"))])
}));
avaEx_1.default("custom output dir", packTester_1.app(allPlatforms(false), {
    projectDirCreated: packTester_1.packageJson(it => {
        it.directories = {
            output: "customDist",
            app: "."
        };
    }),
    packed: context => __awaiter(_this, void 0, void 0, function* () {
        yield fileAssert_1.assertThat(path.join(context.projectDir, "customDist")).isDirectory();
    })
}));
avaEx_1.default("build in the app package.json", t => t.throws(packTester_1.assertPack("test-app", allPlatforms(), {
    projectDirCreated: it => packTester_1.modifyPackageJson(it, data => {
        data.build = {
            "iconUrl": "bar"
        };
    }, true)
}), /'build' in the application package\.json .+/));
avaEx_1.default("name in the build", packTester_1.appThrows(/'name' in the 'build' is forbidden/, packTester_1.currentPlatform(), { projectDirCreated: packTester_1.packageJson(it => it.build = { "name": "Cool App" }) }));
avaEx_1.default("empty description", t => t.throws(packTester_1.assertPack("test-app", {
    targets: out_1.Platform.LINUX.createTarget(),
    appMetadata: {
        description: ""
    }
}), /Please specify 'description'/));
avaEx_1.default("invalid main in the app package.json", t => t.throws(packTester_1.assertPack("test-app", allPlatforms(false), {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.main = "main.js";
    }, true)
}), /Application entry file "main.js" in the /));
avaEx_1.default("invalid main in the app package.json (no asar)", t => t.throws(packTester_1.assertPack("test-app", allPlatforms(false), {
    projectDirCreated: projectDir => {
        return bluebird_1.Promise.all([packTester_1.modifyPackageJson(projectDir, data => {
            data.main = "main.js";
        }, true), packTester_1.modifyPackageJson(projectDir, data => {
            data.build.asar = false;
        })]);
    }
}), `Application entry file "main.js" does not exist. Seems like a wrong configuration.`));
avaEx_1.default("invalid main in the app package.json (custom asar)", t => t.throws(packTester_1.assertPack("test-app", allPlatforms(false), {
    projectDirCreated: projectDir => {
        return bluebird_1.Promise.all([packTester_1.modifyPackageJson(projectDir, data => {
            data.main = "path/app.asar/main.js";
        }, true), packTester_1.modifyPackageJson(projectDir, data => {
            data.build.asar = false;
        })]);
    }
}), /Application entry file "main.js" in the ("[^"]*") does not exist\. Seems like a wrong configuration\./));
avaEx_1.default("main in the app package.json (no asar)", () => packTester_1.assertPack("test-app", allPlatforms(false), {
    projectDirCreated: projectDir => {
        return bluebird_1.Promise.all([fs_extra_p_1.move(path.join(projectDir, "app", "index.js"), path.join(projectDir, "app", "main.js")), packTester_1.modifyPackageJson(projectDir, data => {
            data.main = "main.js";
        }, true), packTester_1.modifyPackageJson(projectDir, data => {
            data.build.asar = false;
        })]);
    }
}));
avaEx_1.default("main in the app package.json (custom asar)", () => packTester_1.assertPack("test-app", allPlatforms(false), {
    projectDirCreated: projectDir => {
        return bluebird_1.Promise.all([packTester_1.modifyPackageJson(projectDir, data => {
            data.main = "path/app.asar/index.js";
        }, true), packTester_1.modifyPackageJson(projectDir, data => {
            data.build.asar = false;
        })]);
    }
}));
avaEx_1.default("relative index", () => packTester_1.assertPack("test-app", allPlatforms(false), {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.main = "./index.js";
    }, true)
}));
avaEx_1.default.ifDevOrLinuxCi("electron version from electron-prebuilt dependency", packTester_1.app({
    targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET)
}, {
    projectDirCreated: projectDir => bluebird_1.Promise.all([fs_extra_p_1.outputJson(path.join(projectDir, "node_modules", "electron-prebuilt", "package.json"), {
        version: config_1.ELECTRON_VERSION
    }), packTester_1.modifyPackageJson(projectDir, data => {
        delete data.build.electronVersion;
        data.devDependencies = {};
    })])
}));
avaEx_1.default.ifDevOrLinuxCi("electron version from electron dependency", packTester_1.app({
    targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET)
}, {
    projectDirCreated: projectDir => bluebird_1.Promise.all([fs_extra_p_1.outputJson(path.join(projectDir, "node_modules", "electron", "package.json"), {
        version: config_1.ELECTRON_VERSION
    }), packTester_1.modifyPackageJson(projectDir, data => {
        delete data.build.electronVersion;
        data.devDependencies = {};
    })])
}));
avaEx_1.default.ifDevOrLinuxCi("electron version from build", packTester_1.app({
    targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET)
}, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.devDependencies = {};
        data.build.electronVersion = config_1.ELECTRON_VERSION;
    })
}));
avaEx_1.default("www as default dir", () => packTester_1.assertPack("test-app", packTester_1.currentPlatform(), {
    projectDirCreated: projectDir => fs_extra_p_1.move(path.join(projectDir, "app"), path.join(projectDir, "www"))
}));
avaEx_1.default("afterPack", t => {
    const targets = process.env.CI ? out_1.Platform.fromString(process.platform).createTarget(out_1.DIR_TARGET) : packTester_1.getPossiblePlatforms(out_1.DIR_TARGET);
    let called = 0;
    return packTester_1.assertPack("test-app-one", {
        targets: targets,
        devMetadata: {
            build: {
                afterPack: () => {
                    called++;
                    return bluebird_1.Promise.resolve();
                }
            }
        }
    }, {
        packed: () => {
            t.is(called, targets.size);
            return bluebird_1.Promise.resolve();
        }
    });
});
avaEx_1.default.ifDevOrLinuxCi("extra metadata", () => {
    const extraMetadata = {
        foo: {
            bar: 12
        },
        productName: "NewName"
    };
    return packTester_1.assertPack("test-app-one", {
        targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET),
        extraMetadata: extraMetadata
    }, {
        projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
            data.foo = {
                bar: 42,
                existingProp: 22
            };
        }),
        packed: context => __awaiter(_this, void 0, void 0, function* () {
            yield fileAssert_1.assertThat(path.join(context.getContent(out_1.Platform.LINUX), "NewName")).isFile();
            fileAssert_1.assertThat(JSON.parse(asar_electron_builder_1.extractFile(path.join(context.getResources(out_1.Platform.LINUX), "app.asar"), "package.json").toString())).hasProperties({
                foo: {
                    bar: 12,
                    existingProp: 22
                }
            });
        })
    });
});
avaEx_1.default.ifDevOrLinuxCi("extra metadata - two", () => {
    const extraMetadata = {
        productName: "NewName"
    };
    return packTester_1.assertPack("test-app", {
        targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET),
        extraMetadata: extraMetadata
    }, {
        packed: context => __awaiter(_this, void 0, void 0, function* () {
            yield fileAssert_1.assertThat(path.join(context.getContent(out_1.Platform.LINUX), "NewName")).isFile();
        })
    });
});
avaEx_1.default.ifOsx("extra metadata - override icon", t => t.throws((() => {
    const extraMetadata = {
        build: {
            mac: {
                icon: "dev"
            }
        }
    };
    return packTester_1.assertPack("test-app", {
        targets: out_1.Platform.OSX.createTarget(out_1.DIR_TARGET),
        extraMetadata: extraMetadata
    }, {
        packed: context => __awaiter(_this, void 0, void 0, function* () {
            yield fileAssert_1.assertThat(path.join(context.getContent(out_1.Platform.LINUX), "NewName")).isFile();
        })
    });
})(), /ENOENT: no such file or directory/));
avaEx_1.default.ifDevOrLinuxCi("smart unpack", () => {
    return packTester_1.assertPack("test-app-one", {
        targets: out_1.Platform.LINUX.createTarget(out_1.DIR_TARGET)
    }, {
        npmInstallBefore: true,
        projectDirCreated: packTester_1.packageJson(it => {
            it.dependencies = {
                "debug": "^2.2.0",
                "edge-cs": "^1.0.0"
            };
        }),
        packed: context => {
            fileAssert_1.assertThat(JSON.parse(asar_electron_builder_1.extractFile(path.join(context.getResources(out_1.Platform.LINUX), "app.asar"), "node_modules/debug/package.json").toString())).hasProperties({
                name: "debug"
            });
            return bluebird_1.Promise.resolve();
        }
    });
});
avaEx_1.default.ifWinCi("Build MacOS on Windows is not supported", packTester_1.appThrows(/Build for MacOS is supported only on MacOS.+/, packTester_1.platform(out_1.Platform.MAC)));
function allPlatforms() {
    let dist = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    return {
        targets: packTester_1.getPossiblePlatforms(dist ? null : out_1.DIR_TARGET)
    };
}
//# sourceMappingURL=BuildTest.js.map