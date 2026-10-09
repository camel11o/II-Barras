const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const iaRoutes = require("./routes/ia");

const app = express();

// ======================================================
// CONFIGURAÇÕES
// ======================================================

app.use(cors());
app.use(express.json());
// Habilita a leitura de dados vindos de formulários HTML nativos (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// ======================================================
// BANCO DE DADOS
// ======================================================

const dbPath = path.resolve(__dirname, "fazenda.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao abrir banco de dados:", err.message);
    } else {
        console.log("Banco SQLite conectado com sucesso.");
    }
});

// Disponibiliza o banco para outras rotas
app.locals.db = db;

// ======================================================
// CRIAÇÃO DAS TABELAS
// ======================================================

db.serialize(() => {

    // --------------------------------------------------
    // PRODUÇÃO / CONTROLE DO REBANHO
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS producao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_registro TEXT,
            lote TEXT,
            quantidade_entrada INTEGER DEFAULT 0,
            quantidade_saida INTEGER DEFAULT 0,
            responsavel TEXT,
            observacao TEXT
        )
    `, (err) => {
        if (err) {
            console.error("Erro ao criar tabela producao:", err.message);
        } else {
            console.log("Tabela producao pronta.");
        }
    });

    // --------------------------------------------------
    // FINANCEIRO
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS financeiro (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_registro TEXT,
            tipo TEXT,
            categoria TEXT,
            lote TEXT,
            descricao TEXT,
            valor REAL,
            observacao TEXT
        )
    `, (err) => {
        if (err) {
            console.error("Erro ao criar tabela financeiro:", err.message);
        } else {
            console.log("Tabela financeiro pronta.");
        }
    });

    // --------------------------------------------------
    // PASTO
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS pasto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_registro TEXT,
            piquete TEXT,
            status TEXT,
            lote TEXT,
            qtd_cabecas INTEGER DEFAULT 0,
            altura_capim REAL,
            observacao TEXT
        )
    `, (err) => {
        if (err) {
            console.error("Erro ao criar tabela pasto:", err.message);
        } else {
            console.log("Tabela pasto pronta.");
        }
    });

    // --------------------------------------------------
    // SANITÁRIO / SAÚDE ANIMAL
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS sanatorio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_registro TEXT,
            lote TEXT,
            tipo_manejo TEXT,
            produto TEXT,
            qtd_animais INTEGER DEFAULT 0,
            responsavel TEXT,
            observacao TEXT
        )
    `, (err) => {
        if (err) {
            console.error("Erro ao criar tabela sanatorio:", err.message);
        } else {
            console.log("Tabela sanatorio pronta.");
        }
    });
});

// ======================================================
// ROTAS - PRODUÇÃO / CONTROLE DO REBANHO
// ======================================================

// Buscar registros
app.get("/api/producao", (req, res) => {

    db.all(
        `
        SELECT *
        FROM producao
        ORDER BY id DESC
        `,
        [],
        (err, rows) => {

            if (err) {
                console.error(
                    "Erro ao consultar produção:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao consultar produção.",
                    detalhes: err.message
                });
            }

            res.json(rows);
        }
    );
});

// Salvar registro
app.post("/api/producao", (req, res) => {

    const {
        data_registro,
        lote,
        quantidade_entrada,
        quantidade_saida,
        responsavel,
        observacao
    } = req.body;

    if (!data_registro || !lote) {
        return res.status(400).json({
            erro: "Data e lote são obrigatórios."
        });
    }

    const sql = `
        INSERT INTO producao
        (
            data_registro,
            lote,
            quantidade_entrada,
            quantidade_saida,
            responsavel,
            observacao
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            data_registro,
            lote,
            Number(quantidade_entrada) || 0,
            Number(quantidade_saida) || 0,
            responsavel || "",
            observacao || ""
        ],
        function (err) {

            if (err) {
                console.error(
                    "Erro ao salvar produção:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao salvar produção.",
                    detalhes: err.message
                });
            }

            res.status(201).json({
                sucesso: true,
                id: this.lastID
            });
        }
    );
});

// Excluir registro
app.delete("/api/producao/:id", (req, res) => {

    const id = Number(req.params.id);

    if (!id) {
        return res.status(400).json({
            erro: "ID inválido."
        });
    }

    db.run(
        "DELETE FROM producao WHERE id = ?",
        [id],
        function (err) {

            if (err) {
                console.error(
                    "Erro ao excluir produção:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao excluir produção.",
                    detalhes: err.message
                });
            }

            res.json({
                sucesso: true,
                excluidos: this.changes
            });
        }
    );
});

// ======================================================
// ROTAS - FINANCEIRO
// ======================================================

// Buscar registros financeiros
app.get("/api/financeiro", (req, res) => {

    db.all(
        `
        SELECT *
        FROM financeiro
        ORDER BY id DESC
        `,
        [],
        (err, rows) => {

            if (err) {
                console.error(
                    "Erro ao consultar financeiro:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao consultar financeiro.",
                    detalhes: err.message
                });
            }

            res.json(rows);
        }
    );
});

// Salvar registro financeiro
app.post("/api/financeiro", (req, res) => {

    const {
        data_registro,
        tipo,
        categoria,
        lote,
        descricao,
        valor,
        observacao
    } = req.body;

    const sql = `
        INSERT INTO financeiro
        (
            data_registro,
            tipo,
            categoria,
            lote,
            descricao,
            valor,
            observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            data_registro || "",
            tipo || "",
            categoria || "",
            lote || "",
            descricao || "",
            Number(valor) || 0,
            observacao || ""
        ],
        function (err) {

            if (err) {
                console.error(
                    "Erro ao salvar financeiro:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao salvar registro financeiro.",
                    detalhes: err.message
                });
            }

            res.status(201).json({
                sucesso: true,
                id: this.lastID
            });
        }
    );
});

// Excluir registro financeiro
app.delete("/api/financeiro/:id", (req, res) => {

    const id = Number(req.params.id);

    db.run(
        "DELETE FROM financeiro WHERE id = ?",
        [id],
        function (err) {

            if (err) {
                console.error(
                    "Erro ao excluir financeiro:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao excluir registro financeiro.",
                    detalhes: err.message
                });
            }

            res.json({
                sucesso: true,
                excluidos: this.changes
            });
        }
    );
});

// ======================================================
// ROTAS - PASTO
// ======================================================

// Buscar registros de pasto
app.get("/api/pasto", (req, res) => {

    db.all(
        `
        SELECT *
        FROM pasto
        ORDER BY id DESC
        `,
        [],
        (err, rows) => {

            if (err) {
                console.error(
                    "Erro ao consultar pasto:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao consultar pasto.",
                    detalhes: err.message
                });
            }

            res.json(rows);
        }
    );
});

// Salvar registro de pasto
app.post("/api/pasto", (req, res) => {

    const {
        data_registro,
        piquete,
        status,
        lote,
        qtd_cabecas,
        altura_capim,
        observacao
    } = req.body;

    const sql = `
        INSERT INTO pasto
        (
            data_registro,
            piquete,
            status,
            lote,
            qtd_cabecas,
            altura_capim,
            observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            data_registro || "",
            piquete || "",
            status || "",
            lote || "",
            Number(qtd_cabecas) || 0,
            Number(altura_capim) || 0,
            observacao || ""
        ],
        function (err) {

            if (err) {
                console.error(
                    "Erro ao salvar pasto:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao salvar registro de pasto.",
                    detalhes: err.message
                });
            }

            res.status(201).json({
                sucesso: true,
                id: this.lastID
            });
        }
    );
});

// Excluir registro de pasto
app.delete("/api/pasto/:id", (req, res) => {

    const id = Number(req.params.id);

    db.run(
        "DELETE FROM pasto WHERE id = ?",
        [id],
        function (err) {

            if (err) {
                console.error(
                    "Erro ao excluir pasto:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao excluir registro de pasto.",
                    detalhes: err.message
                });
            }

            res.json({
                sucesso: true,
                excluidos: this.changes
            });
        }
    );
});

// ======================================================
// ROTAS - SANIDADE ANIMAL
// ======================================================

// Buscar registros
app.get("/api/sanatorio", (req, res) => {

    db.all(
        `
        SELECT *
        FROM sanatorio
        ORDER BY id DESC
        `,
        [],
        (err, rows) => {

            if (err) {
                console.error(
                    "Erro ao consultar sanatório:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao consultar saúde animal.",
                    detalhes: err.message
                });
            }

            res.json(rows);
        }
    );
});

// Salvar registro
app.post("/api/sanatorio", (req, res) => {

    const {
        data_registro,
        lote,
        tipo_manejo,
        produto,
        qtd_animais,
        responsavel,
        observacao
    } = req.body;

    const sql = `
        INSERT INTO sanatorio
        (
            data_registro,
            lote,
            tipo_manejo,
            produto,
            qtd_animais,
            responsavel,
            observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            data_registro || "",
            lote || "",
            tipo_manejo || "",
            produto || "",
            Number(qtd_animais) || 0,
            responsavel || "",
            observacao || ""
        ],
        function (err) {

            if (err) {
                console.error(
                    "Erro ao salvar sanatório:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao salvar registro de saúde.",
                    detalhes: err.message
                });
            }

            res.status(201).json({
                sucesso: true,
                id: this.lastID
            });
        }
    );
});

// Excluir registro
app.delete("/api/sanatorio/:id", (req, res) => {

    const id = Number(req.params.id);

    db.run(
        "DELETE FROM sanatorio WHERE id = ?",
        [id],
        function (err) {

            if (err) {
                console.error(
                    "Erro ao excluir sanatório:",
                    err.message
                );

                return res.status(500).json({
                    erro: "Erro ao excluir registro de saúde.",
                    detalhes: err.message
                });
            }

            res.json({
                sucesso: true,
                excluidos: this.changes
            });
        }
    );
});

// ======================================================
// ARQUIVOS DO FRONTEND
// ======================================================

// Serve os arquivos estáticos da pasta public (CSS, JS, imagens, etc.)
app.use(express.static(path.join(__dirname, "../public")));

// Página principal apontando para public/index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ======================================================
// INTELIGÊNCIA ARTIFICIAL
// ======================================================

app.use("/api/ia", iaRoutes);

// ======================================================
// ROTA DE TESTE
// ======================================================

app.get("/api/status", (req, res) => {

    res.json({
        sistema: "Fazenda II Barras",
        servidor: "online",
        banco: "SQLite",
        ia: "Ollama"
    });
});

// ======================================================
// INICIAR SERVIDOR
// ======================================================

const PORT = 3000;

app.listen(PORT, () => {

    console.log(
        `API rodando internamente na porta ${PORT}`
    );

});