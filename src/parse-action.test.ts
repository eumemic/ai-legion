import { Action } from "./action-types";
import parseAction from "./parse-action";

test("case 1", () => {
  assertValid(`
send-message
targetAgentId: 0
message:
% ff9d7713-0bb0-40d4-823c-5a66de48761b
Hello Control, this is Agent 1.
I am sending you a multi-line message.
This is another line.
% ff9d7713-0bb0-40d4-823c-5a66de48761b
  `);
});

test("case 2", () => {
  assertValid(`
send-message
targetAgentId: 0
message:
% ff9d7713-0bb0-40d4-823c-5a66de48761b
Hello Control, this is Agent 1.

Here is a multi-line message:
This is the first line.
This is the second line.
This is the third line.
% ff9d7713-0bb0-40d4-823c-5a66de48761b
    `);
});

test("case 3", () => {
  assertValid(`
write-file
path: ./schema/action-dictionary.json
newContent:
% ff9d7713-0bb0-40d4-823c-5a66de48761b
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Action",
  "oneOf": [
    {
      ... the old content of action-dictionary.json ...
    },
    {
      "title": "NewActionDefinition",
      "description": "This is an example of a new action definition.",
      "properties": {
        "type": {
          "type": "string",
          "const": "new-action-definition"
        },
        "exampleArg": {
          "type": "string",
          "description": "An example argument for the new action definition."
        }
      },
      "required": [
        "type",
        "exampleArg"
      ],
      "additionalProperties": false
    }
  ]
}
% ff9d7713-0bb0-40d4-823c-5a66de48761b
`);
});

test("invalid command name", () => {
  expect(assertInvalid("foo")).toEqual(
    "Unknown action `foo`, please consult `help`."
  );
});

test("missing required argument", () => {
  expect(assertInvalid("send-message\ntargetAgentId: 0")).toEqual(
    `Missing required argument \`message\`. Usage:

\`\`\`
send-message
targetAgentId: <the target agent's id>
message: <the content of the message>
\`\`\``
  );
});

test("extra argument", () => {
  expect(assertInvalid("no-op\nfoo: bar")).toEqual(
    `Extraneous argument \`foo\`. Usage:

\`\`\`
no-op
\`\`\``
  );
});

function assertValid(text: string): Action {
  const result = parseAction(text);
  if (result.type === "error") throw Error(`Parse failed: ${result.message}`);
  return result.value;
}

function assertInvalid(text: string): string {
  const result = parseAction(text);
  if (result.type === "success")
    throw Error(
      `Parse succeeded when it should've failed: ${JSON.stringify(
        result.value,
        null,
        2
      )}`
    );
  return result.message;
}
