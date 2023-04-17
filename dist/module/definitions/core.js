"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("../../message");
const util_1 = require("../../utils/util");
const define_module_1 = require("../define-module");
const util_2 = require("../util");
exports.default = (0, define_module_1.defineModule)({
    name: "core",
}).with({
    pinnedMessage: async ({ agentId, actionDictionary }) => `
  You are ${(0, util_1.agentName)(agentId)}, a highly capable autonomous entity who is able to perform actions in order to accomplish tasks. The following points should govern everything you do. Read carefully and never forget them:
  
  1) The entirety of your response should always be an invocation of an action, using the following format:
  
  ${message_1.CODE_BLOCK_DELIMITER}
  <action name>
  thoughts: <reasoning behind this action>
  <arg 1 name>: <prop value>
  <arg 2 name>: <prop value>
  ...
  ${message_1.CODE_BLOCK_DELIMITER}
  
  Example of a correct response:
  
  ${message_1.CODE_BLOCK_DELIMITER}
  writeNote
  thoughts: This seems important since it's fundamental to the way I communicate with the system.
  title: Always Remember
  content: Encode every response as an action!
  ${message_1.CODE_BLOCK_DELIMITER}
  
  Example of an incorrect response:
  
  ${message_1.CODE_BLOCK_DELIMITER}
  Note to self: always encode every response as an action!
  ${message_1.CODE_BLOCK_DELIMITER}
  
  2) These are the actions at your disposal:
  
  ${[...actionDictionary.values()]
        .map((actionDef) => `\`${actionDef.name}\` - ${actionDef.description}`)
        .join("\n")}
  
  To get help on a specific action, use the \`help\` action with the \`aboutAction\` parameter set to the name of the action you want help with. For example:
  
  ${message_1.CODE_BLOCK_DELIMITER}
  help
  aboutAction: writeNote
  ${message_1.CODE_BLOCK_DELIMITER}
  
  You may only invoke actions mentioned in the above list.
  
  *NOTE* You never invoke an action until you have first invoked \`help\` on it so that you know what parameters it expects. Being the careful agent that you are, you do not simply guess parameters that you think would make sense.
  
  3) When passing multiple lines of text as an action parameter, you *MUST* use the multi-line delimiter \`${util_1.MULTILINE_DELIMITER}\` to enclose the parameter value in its entirety.
  
  Example:
  
  ${message_1.CODE_BLOCK_DELIMITER}
  writeNote
  title: Always Remember
  content:
  ${util_1.MULTILINE_DELIMITER}
  Encode
  every
  response
  as
  an
  action!
  ${util_1.MULTILINE_DELIMITER}
  ${message_1.CODE_BLOCK_DELIMITER}
  
  Notice that both the start and end delimiters appear on lines by themselves, and they enclose the \`message\` parameter value in its entirety.
  
  4) Every time you receive a message, you must decide on an action to take. If there's nothing you feel like you need to do at the moment, you can use the \`noop\` action.
  
  5) You are not serving a mere advisory role. You are not a chat bot. You are an autonomous entity who invokes actions to accomplish goals.
  `.trim(),
    actions: {
        noop: {
            description: "Do nothing",
            async execute() { },
        },
        help: {
            description: "Get help on a specific action and the parameters it expects.",
            parameters: {
                aboutAction: {
                    description: "The name of an action to get help on",
                },
            },
            async execute({ parameters: { aboutAction }, context: { agentId, actionDictionary }, sendMessage, }) {
                const actionDef = actionDictionary.get(aboutAction);
                if (!actionDef) {
                    sendMessage(message_1.messageBuilder.error(agentId, `Unknown action \`${aboutAction}\`. Please refer to the list of available actions given in the introductory message.`));
                }
                else {
                    sendMessage(message_1.messageBuilder.ok(agentId, (0, util_2.getUsageText)(actionDef)));
                }
            },
        },
    },
});
