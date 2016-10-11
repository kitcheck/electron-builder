"use strict";

var _this = this;

const codeSign_1 = require("out/codeSign");
const fileAssert_1 = require("./helpers/fileAssert");
const avaEx_1 = require("./helpers/avaEx");
const codeSignData_1 = require("./helpers/codeSignData");
const util_1 = require("out/util/util");
const tmp_1 = require("out/util/tmp");
const __awaiter = require("out/util/awaiter");
const tmpDir = new tmp_1.TmpDir();
if (process.env.CSC_KEY_PASSWORD == null) {
    console.warn("Skip keychain-specific tests because CSC_KEY_PASSWORD is not defined");
} else {
    avaEx_1.default.ifOsx("create keychain", () => __awaiter(_this, void 0, void 0, function* () {
        const result = yield codeSign_1.createKeychain(tmpDir, codeSignData_1.CSC_LINK, process.env.CSC_KEY_PASSWORD);
        fileAssert_1.assertThat(result.keychainName).isNotEmpty();
    }));
    avaEx_1.default.ifOsx("create keychain with installers", () => __awaiter(_this, void 0, void 0, function* () {
        const result = yield codeSign_1.createKeychain(tmpDir, codeSignData_1.CSC_LINK, process.env.CSC_KEY_PASSWORD);
        fileAssert_1.assertThat(result.keychainName).isNotEmpty();
    }));
}
avaEx_1.default.ifOsx("remove password from log", () => __awaiter(_this, void 0, void 0, function* () {
    fileAssert_1.assertThat(util_1.removePassword("seq -P foo -B")).isEqualTo("seq -P 2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae (sha256 hash) -B");
    fileAssert_1.assertThat(util_1.removePassword("pass:foo")).isEqualTo("pass:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae (sha256 hash)");
}));
//# sourceMappingURL=CodeSignTest.js.map