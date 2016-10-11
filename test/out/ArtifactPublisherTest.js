"use strict";

var _this = this;

const avaEx_1 = require("./helpers/avaEx");
const gitHubPublisher_1 = require("out/publish/gitHubPublisher");
const restApiRequest_1 = require("out/publish/restApiRequest");
const path_1 = require("path");
const fileAssert_1 = require("./helpers/fileAssert");
const BintrayPublisher_1 = require("out/publish/BintrayPublisher");
const builder_1 = require("out/builder");
const __awaiter = require("out/util/awaiter");
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function versionNumber() {
    return `${ getRandomInt(0, 99) }.${ getRandomInt(0, 99) }.${ getRandomInt(0, 99) }`;
}
const token = new Buffer("Y2Y5NDdhZDJhYzJlMzg1OGNiNzQzYzcwOWZhNGI0OTk2NWQ4ZDg3Yg==", "base64").toString();
const iconPath = path_1.join(__dirname, "..", "fixtures", "test-app", "build", "icon.icns");
function isApiRateError(e) {
    if (e instanceof restApiRequest_1.HttpError) {
        return e.description != null && e instanceof restApiRequest_1.HttpError && e.description.message != null && e.description.message.indexOf("API rate limit exceeded") !== -1;
    } else {
        return false;
    }
}
function testAndIgnoreApiRate(name, testFunction) {
    avaEx_1.default(name, () => __awaiter(this, void 0, void 0, function* () {
        try {
            yield testFunction();
        } catch (e) {
            if (isApiRateError(e)) {
                console.warn(e.description.message);
            } else {
                throw e;
            }
        }
    }));
}
avaEx_1.default("Bintray upload", () => __awaiter(_this, void 0, void 0, function* () {
    const version = versionNumber();
    const publisher = new BintrayPublisher_1.BintrayPublisher({ user: "actperepo", package: "test", repo: "generic" }, version, { bintrayToken: "5df2cadec86dff91392e4c419540785813c3db15" });
    try {
        const artifactName = `icon-${ version }.icns`;
        yield publisher.upload(iconPath, artifactName);
        yield publisher.upload(iconPath, artifactName);
    } finally {
        yield publisher.deleteRelease();
    }
}));
testAndIgnoreApiRate("GitHub upload", () => __awaiter(_this, void 0, void 0, function* () {
    const publisher = new gitHubPublisher_1.GitHubPublisher("actperepo", "ecb2", versionNumber(), {
        githubToken: token
    });
    try {
        yield publisher.upload(iconPath);
        yield publisher.upload(iconPath);
    } finally {
        yield publisher.deleteRelease();
    }
}));
testAndIgnoreApiRate("prerelease", () => __awaiter(_this, void 0, void 0, function* () {
    const publisher = new gitHubPublisher_1.GitHubPublisher("actperepo", "ecb2", versionNumber(), {
        githubToken: token,
        draft: false,
        prerelease: true
    });
    try {
        yield publisher.upload(iconPath);
        const r = yield publisher.getRelease();
        fileAssert_1.assertThat(r).hasProperties({
            prerelease: true,
            draft: false
        });
    } finally {
        yield publisher.deleteRelease();
    }
}));
testAndIgnoreApiRate("GitHub upload org", () => __awaiter(_this, void 0, void 0, function* () {
    const publisher = new gitHubPublisher_1.GitHubPublisher("builder-gh-test", "darpa", versionNumber(), {
        githubToken: token
    });
    try {
        yield publisher.upload(iconPath);
    } finally {
        yield publisher.deleteRelease();
    }
}));
avaEx_1.default("create publisher", () => __awaiter(_this, void 0, void 0, function* () {
    const packager = {
        metadata: {
            version: "2.0.0"
        },
        devMetadata: {
            repository: "develar/test"
        }
    };
    const publisher = yield builder_1.createPublisher(packager, {
        githubToken: "__test__"
    }, { provider: "github", vPrefixedTagName: false });
    fileAssert_1.assertThat(publisher).hasProperties({
        "owner": "develar",
        "repo": "test",
        "token": "__test__",
        "version": "2.0.0",
        "tag": "2.0.0"
    });
}));
//# sourceMappingURL=ArtifactPublisherTest.js.map