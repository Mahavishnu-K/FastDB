# FastDB - The Conversational Cloud Database

<p align="center">
<strong>Interact with robust, production-grade databases using plain English.</strong>
</p>

<p align="center">
<a href="https://github.com/Mahavishnu-K/FastDB/stargazers"><img src="https://img.shields.io/github/stars/Mahavishnu-K/FastDB?style=social" alt="GitHub stars"></a>
<a href="https://github.com/Mahavishnu-K/FastDB/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
<img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python" alt="Python Version">
<img src="https://img.shields.io/badge/JavaScript-5.x-blue?logo=javascript" alt="JavaScript Version">
<img src="https://img.shields.io/badge/React-18.x-blue?logo=react" alt="React Version">
</p>

---

FastDB is a full-stack, AI-powered database platform that revolutionizes how developers and teams interact with data. It combines the power and reliability of PostgreSQL with a state-of-the-art, self-hosted LLM, allowing you to manage and query your data through a simple, conversational interface.

This repository contains the central backend API server. The complete fastDB ecosystem includes a web console, developer SDKs, and a CLI.

## ✨ The FastDB Ecosystem

FastDB is more than just an API; it's a complete, end-to-end platform for modern data management.

| Component | Repository / Link | Description |
|-----------|-------------------|-------------|
| 🌐 Landing Page | [fastdb-landing](https://github.com/Mahavishnu-K/FastDB-Landing) | A React-based web application for signing up and getting started with `fastdb` [currently private repo]|
| 🐍 Python SDK | [fastdb-python-sdk](https://github.com/Mahavishnu-K/FastDB-python-SDK) | The official Python SDK for integrating fastDB into your Python applications and scripts. |
| ☕ JS/TS SDK | [fastdb-js-sdk](https://github.com/Mahavishnu-K/FastDB-js-SDK) | The official JavaScript/TypeScript SDK for both Node.js backends and frontend applications. |
| 💻 FastDB CLI | [fastdb-cli](https://github.com/Mahavishnu-K/FastDB-CLI) | A command-line interface for managing your fastDB account and databases directly from your terminal. |
| 🧠 Application and API (This Repo) | [FastDB](https://github.com/Mahavishnu-K/FastDB) | The core FastAPI client and server that powers the entire ecosystem. |

## 🚀 Key Features

- **Conversational Interface**: Use plain English to CREATE, INSERT, SELECT, and UPDATE your data. The system intelligently converts your commands into safe, efficient SQL.

- **Secure Multi-Tenancy**: Each user's virtual database is a physically isolated PostgreSQL database, providing maximum security and data isolation.

- **Collaborative Workspaces**: Invite team members to collaborate on your databases with role-based access control (Owner, Editor, Viewer).

- **High-Performance Caching**: A dual-layer "Rapid Cache" (Static History & Normalized Template) bypasses the LLM for repeated queries, providing the speed of a traditional database.

- **Self-Hosted AI**: Powered by a self-hosted Llama 3.1 model running on Ollama, ensuring data privacy, low latency, and zero external API costs.

- **Developer-First SDKs**: Intuitive, idiomatic SDKs for Python and JavaScript/TypeScript with a powerful fluent query builder.

- **Full-Featured Web Console**: A complete React-based UI for managing users, databases, collaboration, and running queries.

## 🏛️ System Architecture

fastDB is built on a modern, scalable, and secure architecture. The backend API acts as the central orchestrator, managing authentication, multi-tenancy, and communication with the self-hosted LLM and the PostgreSQL database cluster.


## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React, Vite, Tailwind CSS | For a modern, fast, and beautiful user interface. |
| **Backend API** | Python, FastAPI, Uvicorn, Nginx | For high-performance, asynchronous API development and secure deployment. |
| **AI Engine** | OpenAI 4.1 API/Ollama, Llama 3.1[self-hosted] | For inference, low-latency, and state-of-the-art NLP-to-SQL translation. |
| **Database** | PostgreSQL, SQLAlchemy | For a robust, reliable, and production-grade relational data foundation. |
| **SDKs** | PyPI (Python), npm (JS/TS) | To serve the two largest developer ecosystems. |
| **Deployment** | Vercel (Frontend), Windows Server (Backend) | For global frontend performance and backend control. |

## 📖 Getting Started (Backend Development)

This repository contains the core fastDB backend server. To get started with development:

### 1. Clone the repository

```bash
git clone https://github.com/Mahavishnu-K/FastDB.git
cd FastDB/server
```

### 2. Set up the environment

Create a Python virtual environment and install the dependencies.

```bash
python -m venv venv
source venv/bin/activate  # On Linux/macOS
.\venv\Scripts\activate   # On Windows
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the server directory and populate it with your database credentials, JWT secret, and LLM configuration. See `.env.example` for the required fields.

### 4. Set up the Database

Ensure you have a running PostgreSQL instance. Then, create the initial tables using Alembic:

```bash
alembic upgrade head
```

### 5. Run the Development Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`, with interactive documentation at `http://localhost:8000/docs`.

## 🤝 Contributing

Contributions are welcome! If you'd like to help improve fastDB, please feel free to fork the repository, make your changes, and submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mahavishnu K** - [Portfolio](https://mahavishnu-k.vercel.app/)

---

<p align="center">
Made with ❤️ for developers who love talking to their databases
</p>
