async function enviarPerguntaParaIA() {
    const inputPergunta = document.getElementById("input-pergunta"); // Ajuste para o seu ID
    const pergunta = inputPergunta.value;

    if (!pergunta.trim()) return;

    // Captura o texto visível da interface mantendo quebras de linha
    const contextoInterface = document.body.innerText;

    try {
        const response = await fetch("/api/ia/perguntar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pergunta: pergunta,
                contextoPagina: contextoInterface
            })
        });

        const data = await response.json();
        
        if (data.resposta) {
            console.log("Resposta da IA:", data.resposta);
            // Renderize a resposta na caixa do chat
        } else {
            console.error("Erro da IA:", data.erro);
        }

    } catch (error) {
        console.error("Erro ao comunicar com a IA:", error);
    }
}
