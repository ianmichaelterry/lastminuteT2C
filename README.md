# Parsons Problem Generator (T2c)

This project is a Parsons problem generator web application. It allows teachers and learners to generate structured Parsons problems using AI (OpenAI GPT models) and download them in a format compatible with the T2b Parsons problem app.

## Features

- **Interactive Front-End**: Web UI for selecting programming language, concepts, and number of problems.
- **AI-Generated Problems**: Uses OpenAI's GPT models to generate Parsons problems tailored to your selections.
- **Downloadable JSON**: Output is compatible with the T2b Parsons problem app (see `t2b/` directory).
- **API Endpoint**: `/generate-problems` endpoint accepts a base64-encoded JSON specification and returns a batch of problems.
- **CORS Support**: Configured to allow requests from any origin.

## Project Structure

```
ASSIGNMENT.md           # Assignment instructions
pyproject.toml          # Project configuration
README.md               # Project documentation (this file)
server.py               # FastAPI server (AI backend)
toy.py                  # Standalone script for generating problems
static/                 # Static files (JS, CSS) for the generator UI
templates/              # HTML templates for the generator UI
t2b/                    # T2b Parsons problem app and example batches
```

## Installation

1. **Clone the repository:**
   ```zsh
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install dependencies using `uv`:**
   ```zsh
   uv pip install -r pyproject.toml
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with the following variables:
   ```env
   OPENAI_API_KEY=<your-openai-api-key>
   OPENAI_API_BASE=https://api.openai.com/v1
   OPENAI_API_MODEL_NAME=gpt-4o
   ```

## Running the Application

1. **Start the server:**
   ```zsh
   uv run uvicorn server:app --reload
   ```

2. **Open your browser and navigate to:**
   - Generator UI: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
   - API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Usage

1. Use the generator UI to select a programming language, concepts, and number of problems.
2. Click "Preview Result" to generate a Parsons problem batch.
3. Copy the generated JSON and save it as a new file (e.g., `batch4.json`) in the `t2b/` directory.
4. In the T2b app, load your new batch by changing the URL, e.g.:
   ```
   https://<your-t2b-app-url>/?specification=batch4.json
   ```

## API Reference

### `GET /generate-problems`

Generates Parsons problems based on the provided query parameter.

#### Query Parameter:
- `specification` (string): A base64-encoded JSON string containing the problem specification. Example structure:
  ```json
  {
    "language": "Python",
    "concepts": {
      "Easy": {"Variable Assignment": true, "Basic Arithmetic": false},
      "Medium": {"Functions": true},
      "Hard": {"Recursion": false}
    },
    "num_problems": 3
  }
  ```

#### Example Request:
```zsh
curl "http://127.0.0.1:8000/generate-problems?specification=$(echo -n '{"language":"Python","concepts":{"Easy":{"Variable Assignment":true},"Medium":{},"Hard":{}},"num_problems":2}' | base64)"
```

## T2b Compatibility

- The generated JSON is compatible with the T2b Parsons problem app in the `t2b/` directory.
- To use a generated batch, save it as a file (e.g., `batch4.json`) in `t2b/` and reference it in the T2b app URL.

## License

MIT License.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Powered by [OpenAI GPT](https://openai.com/)
- Assignment by Adam Smith, UC Santa Cruz