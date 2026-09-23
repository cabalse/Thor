# Thor
A Electron React application that is running ollama against a locally installed model, ex qwen, trying to play a boardgame.


Work in Progress

In Thor you create a boardgame state by uploading a set of rules, a board definition and the pieces on the board. Thor can kep several games in "memory" and switch between them. When asked to perform a move all the current data for the game is sent to the LM along with instructions on how it should respond. Thor will process the answer, check its validity, ask clearifying questions and then update the interal game state.
This is just a prototype so it aint working very well at the moment.

Note: This project is vibe coded using Claude with what ever LLM that is alrightly priced for the moment. So it is what it is.
