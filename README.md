# GPT-Legion: An AI Agent System

A framework for autonomous agents who can work together to accomplish tasks.

## Instructions to get started:

Setup:

```
npm install
```

Create a `.env` file at the root of the project and add your secrets to it:

```
#OPENAI_API_KEY=... # obtain from https://platform.openai.com/account/api-keys
# the following are needed for the agent to be able to search the web:
GOOGLE_SEARCH_ENGINE_ID=... # create a custom search engine at https://cse.google.com/cse/all
GOOGLE_API_KEY=... # obtian from https://console.cloud.google.com/apis/credentials
```

Start the program:

```
npm run start [# of agents] [gpt-3.5-turbo|gpt-4]
```

Interact with the agents through the console. Anything you type will be sent as a message to all agents currently.
