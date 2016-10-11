"use strict";

const avaEx_1 = require("./helpers/avaEx");
const packTester_1 = require("./helpers/packTester");
const fs_extra_p_1 = require("fs-extra-p");
const path = require("path");
const out_1 = require("out");
const metadata_1 = require("out/metadata");
const __awaiter = require("out/util/awaiter");
avaEx_1.default.ifNotWindows("deb", packTester_1.app({ targets: out_1.Platform.LINUX.createTarget("deb") }));
avaEx_1.default.ifNotWindows("arm deb", packTester_1.app({ targets: out_1.Platform.LINUX.createTarget("deb", metadata_1.Arch.armv7l) }));
avaEx_1.default.ifDevOrLinuxCi("AppImage", packTester_1.app({ targets: out_1.Platform.LINUX.createTarget() }));
avaEx_1.default.ifDevOrLinuxCi("AppImage - default icon", packTester_1.app({ targets: out_1.Platform.LINUX.createTarget("appimage") }, {
    projectDirCreated: projectDir => fs_extra_p_1.remove(path.join(projectDir, "build"))
}));
avaEx_1.default.ifDevOrLinuxCi("targets", packTester_1.app({ targets: out_1.Platform.LINUX.createTarget(["sh", "freebsd", "pacman", "zip", "7z"]) }));
avaEx_1.default.ifDevOrLinuxCi("tar", packTester_1.app({ targets: out_1.Platform.LINUX.createTarget(["tar.xz", "tar.lz", "tar.bz2"]) }));
avaEx_1.default.ifDevOrLinuxCi("rpm and tar.gz", packTester_1.app({ targets: out_1.Platform.LINUX.createTarget(["rpm", "tar.gz"]) }));
avaEx_1.default.ifNotWindows("icons from ICNS", packTester_1.app({ targets: out_1.Platform.LINUX.createTarget() }, {
    projectDirCreated: it => fs_extra_p_1.remove(path.join(it, "build", "icons"))
}));
avaEx_1.default.ifNotWindows("custom depends", packTester_1.app({
    targets: out_1.Platform.LINUX.createTarget("deb"),
    devMetadata: {
        build: {
            deb: {
                depends: ["foo"]
            }
        }
    }
}, {
    expectedDepends: "foo"
}));
avaEx_1.default.ifNotWindows("no-author-email", packTester_1.appThrows(/Please specify author 'email' in .+/, { targets: out_1.Platform.LINUX.createTarget("deb") }, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.author = "Foo";
    })
}));
//# sourceMappingURL=linuxPackagerTest.js.map