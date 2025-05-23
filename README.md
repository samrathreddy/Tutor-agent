# Multi-Agent Tutoring Bot

A sophisticated AI-powered tutoring assistant that uses a multi-agent architecture to provide specialized tutoring across different subjects.

## Overview

This project implements a "Tutor Agent" that intelligently delegates questions to specialized sub-agents (Math Agent, Physics Agent, etc.) based on the question's domain. Each specialist agent can utilize tools to provide accurate and comprehensive responses, powered by Google's Gemini API.

## Architecture

The system follows principles similar to Google's Agent Development Kit (ADK), featuring:

- **Main Tutor Agent**: Routes questions to the appropriate specialist agent
- **Specialist Agents**: Domain experts that handle subject-specific questions
- **Tools**: Utilities that agents can use to solve problems (calculator, knowledge lookup, etc.)
- **Gemini API Integration**: Providing LLM capabilities for natural language understanding and generation

## Tech Stack

- **Backend**: Python with Flask
- **Frontend**: React
- **API**: Google Gemini
- **Deployment**: Vercel/Railway

## Project Structure

```
tutor-agent/
├── backend/                # Python Flask backend
│   ├── app.py              # Main Flask application entry point
│   ├── run.py              # Contains the endpoints and error handling
│   ├── requirements.txt    # Python dependencies
│   ├── agents/             # Agent implementations
│   │   ├── __init__.py
│   │   ├── tutor_agent.py  # Main tutor agent
│   │   ├── math_agent.py   # Math specialist
│   │   └── physics_agent.py # Physics specialist
│   ├── tools/              # Tools used by agents
│   │   ├── __init__.py
│   │   ├── calculator.py
│   │   └── knowledge_base.py
│   └── utils/              # Utility functions
│       ├── __init__.py
│       └── gemini_client.py # Gemini API wrapper
│
├── frontend/              # React frontend
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── components/
│       ├── App.js
│       └── index.js
│
├── .env.example           # Example environment variables
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- Gemini API key

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python3 -m venv venv (or) python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on `.env.example` and add your Gemini API key

5. Run the backend server:

```bash
python run.py
or
python3 run.py
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm start
```

## Usage

1. Open your browser and navigate to the application
2. Type a question into the chat interface
3. The Tutor Agent will analyze the question and route it to the appropriate specialist
4. The specialist agent will process the question, potentially using tools, and return a response

## Deployment

The application can be deployed using Vercel (frontend) and Railway (backend) following the deployment instructions in the respective documentation.

## Contributing

If you'd like to contribute, please fork the repository and create a pull request with your changes.


## Acknowledgments

- Google's Agent Development Kit (ADK) principles
- Google Gemini API for providing the LLM capabilities
