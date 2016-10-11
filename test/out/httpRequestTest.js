"use strict";

const avaEx_1 = require("./helpers/avaEx");
const httpRequest_1 = require("out/util/httpRequest");
const os_1 = require("os");
const crypto_1 = require("crypto");
const fileAssert_1 = require("./helpers/fileAssert");
const path = require("path");
const __awaiter = require("out/util/awaiter");
avaEx_1.default("download to nonexistent dir", () => {
    const tempFile = path.join(os_1.tmpdir(), `${ process.pid }-${ crypto_1.randomBytes(8).toString("hex") }`, Date.now().toString(), "foo.txt");
    return httpRequest_1.download("https://drive.google.com/uc?export=download&id=0Bz3JwZ-jqfRONTkzTGlsMkM2TlE", tempFile).then(() => fileAssert_1.assertThat(tempFile).isFile());
});
//# sourceMappingURL=httpRequestTest.js.map