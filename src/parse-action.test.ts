import { parseAction } from "./parsers";

test("case 1", () => {
  checkParsing(`
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
  checkParsing(`
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
  checkParsing(`
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

function checkParsing(text: string) {
  const result = parseAction(text);
  if (result.type === "error") throw Error(`Parse failed: ${result.message}`);
  return result.value;
}
