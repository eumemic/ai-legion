import dotenv from "dotenv";
import { GPT_3_5_TURBO } from "../../openai";
import { getPageSummary } from "./web";

dotenv.config();

test.skip(
  "reading and chunking a large page",
  async () => {
    await getPageSummary(
      GPT_3_5_TURBO,
      // GPT_4,
      2000,
      // "https://xenogothic.com/2022/12/23/patchwork-a-reflection/"
      "https://platform.openai.com/docs/guides/completion/inserting-text"
    );
  },
  5 * 60 * 1000
);
