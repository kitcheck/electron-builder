"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const fs_extra_p_1 = require("fs-extra-p");
const json8 = require("json8");
const chalk_1 = require("chalk");
const diff_1 = require("diff");
const assert_1 = require("assert");
const path = require("path");
const __awaiter = require("out/util/awaiter");
function assertThat(actual) {
    return new Assertions(actual);
}
exports.assertThat = assertThat;
function jsonReplacer(key, value) {
    if (value instanceof Map) {
        return [].concat(_toConsumableArray(value));
    }
    return value === undefined ? undefined : value;
}
class Assertions {
    constructor(actual) {
        this.actual = actual;
    }
    isEqualTo(expected) {
        compare(this.actual, expected);
    }
    isNotEqualTo(expected) {
        compare(this.actual, expected, true);
    }
    isNotEmpty() {
        compare(this.actual, "", true);
    }
    isNotNull() {
        compare(this.actual, null, true);
    }
    doesNotMatch(pattern) {
        if (this.actual.match(pattern)) {
            throw new Error(`${ this.actual } matches ${ pattern }`);
        }
    }
    containsAll(expected) {
        compare(this.actual.slice().sort(), Array.from(expected).slice().sort());
    }
    hasProperties(expected) {
        const actual = Object.create(null);
        for (let name of Object.getOwnPropertyNames(this.actual)) {
            if (name in expected) {
                actual[name] = this.actual[name];
            }
        }
        compare(actual, expected);
    }
    isAbsolute() {
        if (!path.isAbsolute(this.actual)) {
            throw new Error(`Path ${ this.actual } is not absolute`);
        }
    }
    isFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield fs_extra_p_1.stat(this.actual);
            if (!info.isFile()) {
                throw new Error(`Path ${ this.actual } is not a file`);
            }
        });
    }
    isDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield fs_extra_p_1.stat(this.actual);
            if (!info.isDirectory()) {
                throw new Error(`Path ${ this.actual } is not a directory`);
            }
        });
    }
    doesNotExist() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_extra_p_1.stat(this.actual);
            } catch (e) {
                return;
            }
            throw new Error(`Path ${ this.actual } must not exist`);
        });
    }
}
function prettyDiff(actual, expected) {
    const diffJson2 = diff_1.diffJson(expected, actual);
    const diff = diffJson2.map(part => {
        if (part.added) {
            return chalk_1.green(part.value.replace(/.+/g, "    - $&"));
        }
        if (part.removed) {
            return chalk_1.red(part.value.replace(/.+/g, "    + $&"));
        }
        return chalk_1.gray(part.value.replace(/.+/g, "    | $&"));
    }).join("");
    return `\n${ diff }\n`;
}
exports.prettyDiff = prettyDiff;
function compare(actual, expected) {
    let not = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (json8.equal(actual, expected) === not) {
        const actualJson = JSON.stringify(actual, jsonReplacer, 2);
        const expectedJson = JSON.stringify(expected, jsonReplacer, 2);
        const stack = new Error().stack;
        throw new assert_1.AssertionError({
            message: `Expected \n${ expectedJson }\n\nis not equal to\n\n${ actualJson }\n\n${ prettyDiff(JSON.parse(expectedJson), JSON.parse(actualJson)) }\n${ stack.split("\n")[3].trim() }`,
            actual: actual,
            expected: expected
        });
    }
}
//# sourceMappingURL=fileAssert.js.map