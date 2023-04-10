# GPT-Legion: An AI Agent System

This project serves as a platform where sophisticated autonomous agents can work and communicate with one another to accomplish tasks. The agents are powered by OpenAI and programmed to carry out different actions through an interface based on user instructions.

## Instructions to get started:

1. Install dependencies using the following command:
   `npm install`
2. Start the main program:
   `npm run start`
3. Interact with the agents through the console interface, providing various tasks and responding to messages. Use the `help` action to see available actions for agents.

Regarding agent communication, they utilize a command-like syntax to perform tasks, query information, and interact with one another. To initiate an action, an agent needs to know the action name and its required arguments. The format for an action looks like this:
```
<action name>
<arg 1 name>: <prop value>
<arg 2 name>: <prop value>
...
```

For example, to send a message, an agent would use the following action:
```
send-message
targetAgentId: 0
message: Hello, Control!
```

This structure allows agents to interact in a clear, concise, and structured way, ensuring that communication is seamless.