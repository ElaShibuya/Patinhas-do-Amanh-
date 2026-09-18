const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile, exec } = require("child_process");

const PORT = 3000;
const publicDir = path.join(__dirname, "public");
const logDir = path.join(__dirname, "log");
const cProgram = path.join(__dirname, "cprogram", "processamento.exe");

// Garante que a pasta de logs exista.
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function contentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    const types = {
        ".html": "text/html; charset=UTF-8",
        ".css": "text/css; charset=UTF-8",
        ".js": "text/javascript; charset=UTF-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon"
    };

    return types[ext] || "application/octet-stream";
}

function serveStaticFile(req, res) {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);

    if (urlPath === "/") {
        urlPath = "/index.html";
    }

    // Remove a barra inicial e monta o caminho dentro de /public.
    const relativePath = urlPath.replace(/^\/+/, "");
    const filePath = path.normalize(path.join(publicDir, relativePath));

    // Impede acesso a arquivos fora da pasta public.
    if (!filePath.startsWith(publicDir)) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=UTF-8" });
        res.end("Acesso negado.");
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=UTF-8" });
            res.end("Página ou arquivo não encontrado.");
            return;
        }

        res.writeHead(200, { "Content-Type": contentType(filePath) });
        res.end(data);
    });
}

function pad2(number) {
    return String(number).padStart(2, "0");
}

function formatDate(date) {
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
}

function formatTime(date) {
    return `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
}

function addBusinessDays(date, quantity) {
    const result = new Date(date);
    let remaining = quantity;

    while (remaining > 0) {
        result.setDate(result.getDate() + 1);
        const day = result.getDay();

        if (day !== 0 && day !== 6) {
            remaining--;
        }
    }

    return result;
}

function paymentData(paymentMethod, value, now) {
    if (paymentMethod === "pix") {
        return {
            metodo: "0",
            descricao: "PIX",
            taxa: 0,
            diasCredito: 0,
            dataCredito: formatDate(now)
        };
    }

    if (paymentMethod === "debito") {
        return {
            metodo: "1",
            descricao: "Débito",
            taxa: 0.01,
            diasCredito: 1,
            dataCredito: formatDate(addBusinessDays(now, 1))
        };
    }

    if (paymentMethod === "credito") {
        return {
            metodo: "2",
            descricao: "Crédito",
            taxa: 0.05,
            diasCredito: 30,
            dataCredito: formatDate(addBusinessDays(now, 30))
        };
    }

    return null;
}

function saveTransactionLog(transaction) {
    const fileName = `${transaction.data_proc}_${transaction.hora_proc}_${transaction.cliente}.json`;
    const filePath = path.join(logDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(transaction, null, 4), "utf8");
    return fileName;
}

const server = http.createServer((req, res) => {
    // Arquivos e páginas do site.
    if (req.method === "GET") {
        serveStaticFile(req, res);
        return;
    }

    // Processamento da doação.
    if (req.method === "POST" && req.url === "/pagto") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const params = new URLSearchParams(body);

            const codigo = (params.get("codigo") || "").trim();
            const valorTexto = (params.get("valor") || "").trim();
            const paymentMethod = params.get("meio");
            const valor = Number(valorTexto);

            if (!/^\d{6}$/.test(codigo)) {
                res.writeHead(400, { "Content-Type": "text/plain; charset=UTF-8" });
                res.end("Código inválido. Digite exatamente 6 números.");
                return;
            }

            if (!Number.isFinite(valor) || valor <= 0) {
                res.writeHead(400, { "Content-Type": "text/plain; charset=UTF-8" });
                res.end("Valor da doação inválido.");
                return;
            }

            const now = new Date();
            const payment = paymentData(paymentMethod, valor, now);

            if (!payment) {
                res.writeHead(400, { "Content-Type": "text/plain; charset=UTF-8" });
                res.end("Método de pagamento inválido.");
                return;
            }

            const valorMdr = valor * payment.taxa;
            const valorLiquido = valor - valorMdr;

            console.log("Código:", codigo);
            console.log("Valor:", valor.toFixed(2));
            console.log("Método:", payment.metodo, `(${payment.descricao})`);

            const transaction = {
                data_proc: formatDate(now),
                hora_proc: formatTime(now),
                cliente: codigo,
                meio_pagamento: payment.descricao,
                codigo_metodo: Number(payment.metodo),
                valor_proc: Number(valor.toFixed(2)),
                taxa_mdr: payment.taxa,
                valor_mdr: Number(valorMdr.toFixed(2)),
                valor_credito: Number(valorLiquido.toFixed(2)),
                data_credito: payment.dataCredito,
                programa_c_executado: false
            };

            // Grava o registro ANTES de chamar o programa C. Assim, mesmo que o .exe
            // não consiga iniciar, a transação não é perdida e o servidor não cai.
            let logFileName;

            try {
                logFileName = saveTransactionLog(transaction);
                console.log("Log gravado:", path.join("log", logFileName));
            } catch (logError) {
                console.error("Erro ao gravar log:", logError);
                res.writeHead(500, { "Content-Type": "text/plain; charset=UTF-8" });
                res.end("Não foi possível gravar o registro da doação.");
                return;
            }

            // Retorna apenas a confirmação para o JavaScript. O navegador
            // permanece na própria página de doações e mostra a mensagem ali.
            res.writeHead(200, { "Content-Type": "application/json; charset=UTF-8" });
            res.end(JSON.stringify({ sucesso: true }));

            // O programa C é executado depois, sem prender a tela do usuário.
            // O resultado dessa execução é registrado apenas no arquivo de log.
            const args = [codigo, valor.toFixed(2), payment.metodo];

            function updateLogAfterC(error, stdout = "", stderr = "") {
                if (error) {
                    console.error("Aviso: o programa C não pôde ser executado:");
                    console.error(error.message || error);
                }

                if (stderr) {
                    console.error("C stderr:", stderr);
                }

                transaction.programa_c_executado = !error;

                if (stdout) {
                    transaction.saida_programa_c = stdout.trim();
                }

                if (error) {
                    transaction.erro_programa_c = error.message || String(error);
                } else {
                    delete transaction.erro_programa_c;
                }

                try {
                    saveTransactionLog(transaction);
                } catch (logError) {
                    console.error("Erro ao atualizar log:", logError);
                }
            }

            try {
                if (process.platform === "win32") {
                    const command = `"${cProgram}" "${args[0]}" "${args[1]}" "${args[2]}"`;
                    exec(command, { cwd: __dirname, windowsHide: true }, updateLogAfterC);
                } else {
                    execFile(cProgram, args, { cwd: __dirname }, updateLogAfterC);
                }
            } catch (spawnError) {
                updateLogAfterC(spawnError);
            }
        });

        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=UTF-8" });
    res.end("Página não encontrada.");
});

server.listen(PORT, () => {
    console.log(`Servidor executando em http://localhost:${PORT}`);
});
