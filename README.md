# Thor
A Electron React application that is running ollama against a locally installed model, ex qwen, trying to play a boardgame.

## Work in Progress

In Thor, you create a board game state by uploading a set of rules, a board definition and the pieces on the board. Thor can keep several games in "memory" and switch between them. When asked to perform a move all the current data for the game is sent to the LM along with instructions on how it should respond. Thor will process the answer, check its validity, ask clarifying questions and then update the internal game state.
This is just a prototype, so it ain't working very well right now.

Note: This project is vibe coded using Claude with whatever LLM that is alrightly priced for the moment. So it is what it is.

## Installation and running it

Install Ollama and an LLM locally on the machine.
To run the Electron application from development, open it in Visual Studio Code or similar, or just use a prompt and run "npm run electron:dev". This assumes that npm is installed and everything else. Use an AI to set up your environment if you are unsure.
