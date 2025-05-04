
const OLLAMA_SCHEME = process.env.OLLAMA_SCHEME || 'http';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = process.env.OLLAMA_PORT || '11434';
const OLLAMA_URL = `${OLLAMA_SCHEME}://${OLLAMA_HOST}:${OLLAMA_PORT}`;
const EMBED_MODEL = 'mxbai-embed-large';
