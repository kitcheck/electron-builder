"use strict";

const ava_tf_1 = require("ava-tf");
Object.defineProperties(ava_tf_1.default, {
    "ifNotWindows": {
        get: function () {
            return process.platform === "win32" ? this.skip : this;
        }
    },
    "ifNotCi": {
        get: function () {
            return process.env.CI ? this.skip : this;
        }
    },
    "ifCi": {
        get: function () {
            return process.env.CI ? this : this.skip;
        }
    },
    "ifNotCiOsx": {
        get: function () {
            return process.env.CI && process.platform === "darwin" ? this.skip : this;
        }
    },
    "ifNotTravis": {
        get: function () {
            return process.env.TRAVIS ? this.skip : this;
        }
    },
    "ifOsx": {
        get: function () {
            return process.platform === "darwin" ? this : this.skip;
        }
    },
    "ifDevOrWinCi": {
        get: function () {
            return process.env.CI == null || process.platform === "win32" ? this : this.skip;
        }
    },
    "ifDevOrLinuxCi": {
        get: function () {
            return process.env.CI == null || process.platform === "linux" ? this : this.skip;
        }
    },
    "ifWinCi": {
        get: function () {
            return (process.env.CI || "").toLowerCase() === "true" && process.platform === "win32" ? this : this.skip;
        }
    }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ava_tf_1.default;
//# sourceMappingURL=avaEx.js.map