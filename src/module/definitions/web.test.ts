import dotenv from "dotenv";
import { GPT_3_5_TURBO } from "../../services/openai";
import { getPageSummary, getSearchResults } from "./web";

dotenv.config();

test.skip(
  "getPageSummary",
  async () => {
    await getPageSummary(
      GPT_3_5_TURBO,
      // GPT_4,
      1000,
      "https://xenogothic.com/2022/12/23/patchwork-a-reflection/"
      // "https://platform.openai.com/docs/guides/completion/inserting-text"
      // "https://actions.github.io/authentication/",
      // "https://en.wikipedia.org/wiki/Technological_singularity"
    );
  },
  5 * 60 * 1000
);

test.skip(
  "getSearchResults",
  async () => {
    const results = await getSearchResults(`"e/acc" explanation and sources`);
    console.log(results?.map((item) => item.title).join("\n"));
  },
  5 * 60 * 1000
);
