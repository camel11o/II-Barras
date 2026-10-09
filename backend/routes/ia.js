const express = require("express");
const router = express.Router();

const { perguntarIA } = require("../services/ollama");
const { obterResumoFazenda } = require("../database/consultas");

router.post("/perguntar", async (req, res) => {
    try {
        const { pergunta, contextoPagina } = req.body;

        if (!pergunta || pergunta.trim() === "") {
            return res.status(400).json({ erro: "Digite uma pergunta." });
        }

        // Obtém o banco de dados completo sem limitações
        const dadosCompletosBanco = await obterResumoFazenda(req.app.locals.db);

        const prompt = `
Você é o assistente inteligente e analista especialista da Fazenda II Barras.

SEU OBJETIVO:
Analisar minuciosamente TODOS os dados fornecidos da fazenda (banco de dados SQLite + elementos visíveis na tela HTML) para responder à pergunta do usuário com precisão total.

REGRAS DE ANÁLISE:
1. Responda em português do Brasil com clareza e precisão técnica.
2. Analise todos os registros das tabelas: produção/rebanho, financeiro, pastos e sanatório.
3. Se a pergunta envolver cálculos (ex: total de cabeças, soma financeira, médias de altura de capim), faça a soma exata considerando todos os itens presentes nos dados.
4. Leve em conta os dados exibidos na tela atual do usuário para complementar ou dar contexto ao que ele está vendo no momento.
5. Se algum dado realmente não constar nem no banco e nem na tela, informe claramente qual informação está faltando.
6. Não invente ou altere nenhum valor do sistema.

--------------------------------------------------
DADOS COMPLETOS DA BASE DE DADOS (SQLITE):
${JSON.stringify(dadosCompletosBanco, null, 2)}
--------------------------------------------------

INFORMAÇÕES EXIBIDAS NA TELA ATUAL (HTML/INTERFACE):
${contextoPagina || "Sem dados de tela adicionais."}
--------------------------------------------------

PERGUNTA DO USUÁRIO:
${pergunta}

RESPOSTA DETALHADA:
`;

        const resposta = await perguntarIA(prompt);

        res.json({ resposta: resposta });

    } catch (erro) {
        console.error("Erro na IA:", erro);
        res.status(500).json({
            erro: "Não foi possível consultar a IA.",
            detalhes: erro.message
        });
    }
});

module.exports = router;