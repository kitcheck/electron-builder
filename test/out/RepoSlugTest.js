"use strict";

const fileAssert_1 = require("./helpers/fileAssert");
const ava_tf_1 = require("ava-tf");
const repositoryInfo_1 = require("out/repositoryInfo");
const __awaiter = require("out/util/awaiter");
ava_tf_1.default("repo slug from TRAVIS_REPO_SLUG", () => {
    const oldValue = process.env.TRAVIS_REPO_SLUG;
    try {
        process.env.TRAVIS_REPO_SLUG = "travis-ci/travis-build";
        const info = repositoryInfo_1.getRepositoryInfo().value();
        fileAssert_1.assertThat(info).hasProperties({
            user: "travis-ci",
            project: "travis-build"
        });
    } finally {
        if (oldValue != null) {
            restoreEnv("TRAVIS_REPO_SLUG", oldValue);
        }
    }
});
function restoreEnv(name, value) {
    if (value != null) {
        process.env[name] = value;
    }
}
ava_tf_1.default("repo slug from APPVEYOR", () => {
    const oldAppveyorAccountName = process.env.APPVEYOR_ACCOUNT_NAME;
    const oldAppveyorProjectName = process.env.APPVEYOR_PROJECT_NAME;
    const travisSlug = process.env.TRAVIS_REPO_SLUG;
    try {
        if (travisSlug != null) {
            delete process.env.TRAVIS_REPO_SLUG;
        }
        process.env.APPVEYOR_ACCOUNT_NAME = "travis-ci";
        process.env.APPVEYOR_PROJECT_NAME = "travis-build";
        const info = repositoryInfo_1.getRepositoryInfo().value();
        fileAssert_1.assertThat(info).hasProperties({
            user: "travis-ci",
            project: "travis-build"
        });
    } finally {
        restoreEnv("APPVEYOR_ACCOUNT_NAME", oldAppveyorAccountName);
        restoreEnv("APPVEYOR_PROJECT_NAME", oldAppveyorProjectName);
        if (travisSlug != null) {
            process.env.TRAVIS_REPO_SLUG = travisSlug;
        }
    }
});
//# sourceMappingURL=RepoSlugTest.js.map