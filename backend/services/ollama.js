const OLLAMA_URL = "http://localhost:11434/api/generate";

async function perguntarIA(prompt) {
    try {
        const resposta = await fetch(OLLAMA_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen2.5:3b",
                prompt: prompt,
                stream: false
            })
        });

        if (!resposta.ok) {
            throw new Error(
                `Ollama respondeu com erro: ${resposta.status}`
            );
        }

        const dados = await resposta.json();

        return dados.response;

    } catch (erro) {
        console.error("Erro ao conectar com Ollama:", erro);
        throw erro;
    }
}

module.exports = {
    perguntarIA
};