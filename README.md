# AI Legion: an LLM-powered autonomous agent platform

A framework for autonomous agents who can work together to accomplish tasks.

[![Discord](https://img.shields.io/discord/1095770840173383802?label=discord)](https://discord.gg/X9MkUEsEUC)

## Setup

You will need at least Node 10.

```
npm install
```

Rename the `.env.template` file at the root of the project to `.env` and add your secrets to it:

```
OPENAI_API_KEY=... # obtain from https://platform.openai.com/account/api-keys
# optional: keep Google Custom Search instead of the default Parallel Search MCP:
GOOGLE_SEARCH_ENGINE_ID=... # create a custom search engine at https://cse.google.com/cse/all
GOOGLE_API_KEY=... # obtain from https://console.cloud.google.com/apis/credentials
WEB_SEARCH_PROVIDER=... # optionally parallel, google, or none (disable web access)
AGENT_DELAY=... # optionally, a delay in milliseconds following every agent action
```

`searchWeb` and `readPage` use [Parallel Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) when Google credentials are unset. Search uses Fast mode, with no account or API key required. `readPage` returns relevant markdown excerpts; responses are limited to 12,000 characters. Anonymous usage has service quotas, and each MCP operation has a 30-second deadline (plus up to 5 seconds for connection cleanup). Queries and page URLs are sent to Parallel. Each running agent has a separate research session, reused across its search and page calls; restarting creates a new research run.

Existing Google credentials keep Google Custom Search and the browser-based page summarizer. Both Google settings are required for search, including when `WEB_SEARCH_PROVIDER=google` is explicit. Enable the Google Custom Search API for your Google Cloud account, e.g. <https://console.cloud.google.com/apis/library/customsearch.googleapis.com>. `WEB_SEARCH_PROVIDER=parallel` explicitly selects Parallel even with Google credentials present. `WEB_SEARCH_PROVIDER=none` disables both web actions. Provider errors are reported to the agent without switching providers.

## Running

Start the program:

```
npm run start [# of agents] [gpt-3.5-turbo|gpt-4]
```

Interact with the agents through the console. Anything you type will be sent as a message to all agents currently.

## Action errors

After spinning up a new agent, you will often see them make some mistakes which generate errors:

- Trying to use an action before they've asked for `help` on it to know what its parameters are
- Trying to just use a raw text response instead of a correctly-formatted action (or raw text wrapping a code block which contains a valid action)
- Trying to use a multi-line parameter value without wrapping it in the multiline delimiter (`% ff9d7713-0bb0-40d4-823c-5a66de48761b`)

This is a normal period of adjustment as they learn to operate themselves. They generally will learn from these mistakes and recover, although `gpt-3.5-turbo` agents sometimes devolve into endless error loops and can't figure out what the problem is. It's highly advised never to leave an agent unattended, since such infinite loops can eat through your tokens quickly (especially if they're stuck on a high-token-count action such as `writeFile`).

## Agent state

Each agent stores its state under the `.store` directory. Agent 1, for example, has

```
.store/1/memory
.store/1/goals
.store/1/notes
```

You can simply delete any of these things, or the whole agent folder (or the whole `.store`) to selectively wipe whatever state you want between runs. Otherwise, agents will pick up where you left off on restart.

A nice aspect of this is that when you want to debug a problem you ran into with a particular agent, you can delete the events in their memory subsequent to the point where the problem occurred, make changes to the code, and restart them to effectively replay that moment until you've fixed the bug. You can also ask an agent to implement a feature, and once they've done so you can restart, tell them that you've loaded the feature, and ask them to try it out.
