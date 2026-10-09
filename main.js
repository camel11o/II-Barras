const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

let servidorBackend = null;
let janelaPrincipal = null;

/*
 * Inicia o servidor Node.js / Express
 */
function iniciarBackend() {
    const serverPath = path.join(
        __dirname,
        "backend",
        "server.js"
    );

    servidorBackend = spawn(
        process.execPath,
        [serverPath],
        {
            cwd: path.join(__dirname, "backend"),

            // Permite que o Electron execute o processo como Node.js
            env: {
                ...process.env,
                ELECTRON_RUN_AS_NODE: "1"
            },

            windowsHide: true
        }
    );

    servidorBackend.stdout.on("data", (data) => {
        console.log(`[BACKEND] ${data.toString()}`);
    });

    servidorBackend.stderr.on("data", (data) => {
        console.error(`[BACKEND] ${data.toString()}`);
    });

    servidorBackend.on("error", (erro) => {
        console.error(
            "Erro ao iniciar o backend:",
            erro
        );
    });

    servidorBackend.on("exit", (codigo) => {
        console.log(
            `Backend encerrado. Código: ${codigo}`
        );
    });
}

/*
 * Aguarda o servidor Express ficar disponível
 */
function esperarBackend(callback) {
    const tentarConectar = () => {
        const requisicao = http.get(
            "http://localhost:3000/",
            (resposta) => {

                console.log(
                    "Backend disponível na porta 3000."
                );

                callback();
            }
        );

        requisicao.on("error", () => {
            console.log(
                "Aguardando o backend iniciar..."
            );

            setTimeout(
                tentarConectar,
                300
            );
        });

        requisicao.setTimeout(1000, () => {
            requisicao.destroy();
        });
    };

    tentarConectar();
}

/*
 * Cria a janela principal do aplicativo
 */
function criarJanela() {
    janelaPrincipal = new BrowserWindow({
        width: 1280,
        height: 800,

        minWidth: 900,
        minHeight: 600,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    /*
     * Carrega o sistema através do Express.
     *
     * Isso permite que:
     *
     * /index.html
     * /pasto.html
     * /sanatorio.html
     * /financeiro.html
     * /calculos.html
     * /ia.html
     *
     * sejam acessados corretamente.
     */
    janelaPrincipal.loadURL(
        "http://localhost:3000/"
    );

    /*
     * Abre o DevTools automaticamente
     * somente se você precisar investigar erros.
     *
     * Deixe comentado normalmente.
     */
    // janelaPrincipal.webContents.openDevTools();

    janelaPrincipal.on("closed", () => {
        janelaPrincipal = null;
    });
}

/*
 * Inicialização do aplicativo
 */
app.whenReady().then(() => {

    console.log(
        "Iniciando Fazenda II Barras..."
    );

    iniciarBackend();

    esperarBackend(() => {
        criarJanela();
    });

    /*
     * macOS:
     * recria a janela quando o aplicativo
     * é ativado novamente.
     */
    app.on("activate", () => {

        if (
            BrowserWindow.getAllWindows().length === 0
        ) {
            criarJanela();
        }

    });
});

/*
 * Quando todas as janelas forem fechadas
 */
app.on("window-all-closed", () => {

    if (servidorBackend) {

        console.log(
            "Encerrando backend..."
        );

        servidorBackend.kill();

        servidorBackend = null;
    }

    if (process.platform !== "darwin") {
        app.quit();
    }
});

/*
 * Garante que o backend seja encerrado
 * antes do Electron fechar.
 */
app.on("before-quit", () => {

    if (servidorBackend) {

        console.log(
            "Encerrando servidor backend..."
        );

        servidorBackend.kill();

        servidorBackend = null;
    }

});