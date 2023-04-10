# GPT-Legion: An AI Agent System

This project serves as a platform where sophisticated autonomous agents can work and communicate with one another to accomplish tasks. The agents are powered by OpenAI and programmed to carry out different actions through an interface based on user instructions.

This project consists of the following components:
- main.ts - handles the initialization of the agents, assigning memories and setting up the action handler and message bus system.
- action-handler.ts - manages the execution of actions taken by agents.
- action-types.ts - defines the types for handler functions.
- agent.ts - defines the structure and behavior of an agent.
- console.ts - provides an interface to interact with the agents via console.
- memory.ts - defines the memory interfaces.
- message-bus.ts - provides mechanisms for agents to send and receive messages.
- message.ts - responsible for message construction.
- parse-action.ts - parses actions taken by agents.
- util.ts - contains utility functions.
- task-queue.ts - provides an implementation of a task queue.

In addition, there are different implementations of memory and message bus systems, such as InMemoryMemory and InMemoryMessageBus.

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