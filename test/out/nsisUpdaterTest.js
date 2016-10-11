"use strict";

var _this = this;

const avaEx_1 = require("./helpers/avaEx");
const fileAssert_1 = require("./helpers/fileAssert");
const path = require("path");
const __awaiter = require("out/util/awaiter");
global.__test_app = {
    getVersion: function () {
        return "0.0.1";
    }
};
const NsisUpdaterClass = require("../../nsis-auto-updater/out/nsis-auto-updater/src/nsis-updater").NsisUpdater;
avaEx_1.default("check updates - no versions at all", t => __awaiter(_this, void 0, void 0, function* () {
    const updater = new NsisUpdaterClass();
    updater.setFeedURL({
        user: "actperepo",
        package: "no-versions"
    });
    t.throws(updater.checkForUpdates(), /No latest version, please ensure that/);
}));
avaEx_1.default("cannot find suitable file for version", t => __awaiter(_this, void 0, void 0, function* () {
    const updater = new NsisUpdaterClass();
    updater.setFeedURL({
        user: "actperepo",
        package: "incorrect-file-version"
    });
    t.throws(updater.checkForUpdates(), /Cannot find suitable file for version 1.0.0 in/);
}));
avaEx_1.default("file url", () => __awaiter(_this, void 0, void 0, function* () {
    const updater = new NsisUpdaterClass();
    updater.setFeedURL({
        user: "actperepo",
        package: "TestApp"
    });
    const updateCheckResult = yield updater.checkForUpdates();
    fileAssert_1.assertThat(updateCheckResult.fileInfo).hasProperties({
        url: "https://dl.bintray.com/actperepo/generic/TestApp Setup 1.1.0.exe"
    });
    fileAssert_1.assertThat(path.join((yield updateCheckResult.downloadPromise))).isFile();
}));
//# sourceMappingURL=nsisUpdaterTest.js.map