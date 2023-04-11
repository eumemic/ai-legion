# AI Legion: an LLM-powered autonomous agent platform

A framework for autonomous agents who can work together to accomplish tasks.

## Setup

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

## Agent state

Each agent stores its state under the `.store` directory. Agent 1, for example has

```
.store/1/memory
.store/1/goals
.store/1/notes
```

You can simply delete any of these things, or the whole agent folder (or the whole `.store`) to selectively whipe whatever state you want between runs. Otherwise agents will pick up where you left off on restart.

A nice aspect of this is that when you want to debug a problem you ran into with a particular agent, you can delete the events in their memory subsequent to the point where the problem occurred, make changes to the code, and restart them to effectively replay that moment until you've fixed the bug. You can also ask an agent to implement a feature, and once they've done so you can restart, tell them that you've loaded the feature and ask them to try it out.
