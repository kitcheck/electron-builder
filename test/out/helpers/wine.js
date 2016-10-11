"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

const util_1 = require("out/util/util");
const os_1 = require("os");
const fs_extra_p_1 = require("fs-extra-p");
const path = require("path");
const bluebird_1 = require("bluebird");
const pathSorter = require("path-sort");
const util_2 = require("out/util/util");
const __awaiter = require("out/util/awaiter");
class WineManager {
    prepare() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.env != null) {
                return;
            }
            this.wineDir = path.join(os_1.homedir(), "wine-test");
            const env = process.env;
            const user = env.SUDO_USER || env.LOGNAME || env.USER || env.LNAME || env.USERNAME || (env.HOME === "/root" ? "root" : null);
            if (user == null) {
                throw new Error(`Cannot determinate user name: ${ JSON.stringify(env, null, 2) }`);
            }
            this.userDir = path.join(this.wineDir, "drive_c", "users", user);
            this.winePreparePromise = this.prepareWine(this.wineDir);
            this.env = yield this.winePreparePromise;
        });
    }
    exec() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return util_1.exec("wine", args, { env: this.env });
    }
    prepareWine(wineDir) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs_extra_p_1.emptyDir(wineDir);
            const env = Object.assign({}, process.env, {
                WINEDLLOVERRIDES: "winemenubuilder.exe=d",
                WINEPREFIX: wineDir
            });
            yield util_1.exec("wineboot", ["--init"], { env: env });
            let systemReg = yield fs_extra_p_1.readFile(path.join(wineDir, "system.reg"), "utf8");
            systemReg = systemReg.replace('"CSDVersion"="Service Pack 3"', '"CSDVersion"=" "');
            systemReg = systemReg.replace('"CurrentBuildNumber"="2600"', '"CurrentBuildNumber"="10240"');
            systemReg = systemReg.replace('"CurrentVersion"="5.1"', '"CurrentVersion"="10.0"');
            systemReg = systemReg.replace('"ProductName"="Microsoft Windows XP"', '"ProductName"="Microsoft Windows 10"');
            systemReg = systemReg.replace('"CSDVersion"=dword:00000300', '"CSDVersion"=dword:00000000');
            yield fs_extra_p_1.writeFile(path.join(wineDir, "system.reg"), systemReg);
            const desktopDir = path.join(this.userDir, "Desktop");
            yield bluebird_1.Promise.all([util_2.unlinkIfExists(desktopDir), util_2.unlinkIfExists(path.join(this.userDir, "My Documents")), util_2.unlinkIfExists(path.join(this.userDir, "My Music")), util_2.unlinkIfExists(path.join(this.userDir, "My Pictures")), util_2.unlinkIfExists(path.join(this.userDir, "My Videos"))]);
            yield fs_extra_p_1.ensureDir(desktopDir);
            return env;
        });
    }
}
exports.WineManager = WineManager;
var ChangeType;
(function (ChangeType) {
    ChangeType[ChangeType["ADDED"] = 0] = "ADDED";
    ChangeType[ChangeType["REMOVED"] = 1] = "REMOVED";
    ChangeType[ChangeType["NO_CHANGE"] = 2] = "NO_CHANGE";
})(ChangeType || (ChangeType = {}));
function diff(oldList, newList, rootDir) {
    const delta = {
        added: [],
        deleted: []
    };
    const deltaMap = new Map();
    for (let item of oldList) {
        deltaMap.set(item, ChangeType.REMOVED);
    }
    for (let item of newList) {
        const d = deltaMap.get(item);
        if (d === ChangeType.REMOVED) {
            deltaMap.set(item, ChangeType.NO_CHANGE);
        } else {
            deltaMap.set(item, ChangeType.ADDED);
        }
    }
    for (let _ref of deltaMap.entries()) {
        var _ref2 = _slicedToArray(_ref, 2);

        let item = _ref2[0];
        let changeType = _ref2[1];

        if (changeType === ChangeType.REMOVED) {
            delta.deleted.push(item.substring(rootDir.length + 1));
        } else if (changeType === ChangeType.ADDED) {
            delta.added.push(item.substring(rootDir.length + 1));
        }
    }
    delta.added = pathSorter(delta.added);
    delta.deleted = pathSorter(delta.deleted);
    return delta;
}
exports.diff = diff;
//# sourceMappingURL=wine.js.map