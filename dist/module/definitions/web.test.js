"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = require("../../services/openai");
const web_1 = require("./web");
dotenv_1.default.config();
test.skip("getPageSummary", async () => {
    await (0, web_1.getPageSummary)(openai_1.GPT_3_5_TURBO, 
    // GPT_4,
    1000, "https://xenogothic.com/2022/12/23/patchwork-a-reflection/"
    // "https://platform.openai.com/docs/guides/completion/inserting-text"
    // "https://actions.github.io/authentication/",
    // "https://en.wikipedia.org/wiki/Technological_singularity"
    );
}, 5 * 60 * 1000);
test.skip("getSearchResults", async () => {
    const results = await (0, web_1.getSearchResults)(`"e/acc" explanation and sources`);
    console.log(results === null || results === void 0 ? void 0 : results.map((item) => item.title).join("\n"));
}, 5 * 60 * 1000);
