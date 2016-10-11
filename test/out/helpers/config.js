"use strict";

const path = require("path");
const os_1 = require("os");
exports.TEST_DIR = path.join(os_1.tmpdir(), `electron-builder-test-${ process.pid.toString(16) }`);
exports.ELECTRON_VERSION = "1.4.0";
//# sourceMappingURL=config.js.map