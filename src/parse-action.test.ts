import { ActionDictionary } from "./action/action-dictionary";
import { allActionDefinitions } from "./action/definitions";
import parseAction, { Action } from "./parse-action";
import { MULTILINE_DELIMITER } from "./util";

const dict = new ActionDictionary(allActionDefinitions);

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
          "description": "An example parameter for the new action definition."
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

test("missing required parameter", () => {
  expect(assertInvalid("send-message\ntargetAgentId: 0")).toEqual(
    `Missing required parameter \`message\`. Usage:

\`\`\`
send-message
targetAgentId: <the target agent's id>
message: <the content of the message>
\`\`\``
  );
});

test("extra parameter", () => {
  expect(assertInvalid("no-op\nfoo: bar")).toEqual(
    `Extraneous parameter \`foo\`. Usage:

\`\`\`
no-op
\`\`\``
  );
});

describe("quotes", () => {
  test("in-line parameter", () => {
    const action = assertValid(`
send-message
targetAgentId: 0
message: hello, "control"
`);
    expect(action.actionDef.name).toBe("send-message");
    expect(action.parameters).toEqual({
      targetAgentId: "0",
      message: 'hello, "control"',
    });
  });

  test("multi-line parameter", () => {
    const action = assertValid(`
send-message
targetAgentId: 0
message:
${MULTILINE_DELIMITER}
hello, "control"
${MULTILINE_DELIMITER}
`);
    expect(action.actionDef.name).toBe("send-message");
    expect(action.parameters).toEqual({
      targetAgentId: "0",
      message: 'hello, "control"',
    });
  });
});

function assertValid(text: string): Action {
  const result = parseAction(dict, text);
  if (result.type === "error") throw Error(`Parse failed: ${result.message}`);
  return result.action;
}

function assertInvalid(text: string): string {
  const result = parseAction(dict, text);
  if (result.type === "success")
    throw Error(
      `Parse succeeded when it should've failed: ${JSON.stringify(
        result.action,
        null,
        2
      )}`
    );
  return result.message;
}
