function obterResumoFazenda(db) {
    return new Promise((resolve, reject) => {

        const resultado = {
            producao: [],
            financeiro: [],
            pasto: [],
            sanatorio: [],
            rebanho: []
        };

        // Busca TODOS os registros de producao/manejo do rebanho
        db.all("SELECT * FROM producao ORDER BY id DESC", [], (err, producao) => {
            if (err) return reject(err);
            resultado.producao = producao;

            // Busca TODOS os registros financeiros
            db.all("SELECT * FROM financeiro ORDER BY id DESC", [], (err, financeiro) => {
                if (err) return reject(err);
                resultado.financeiro = financeiro;

                // Busca TODOS os registros de pasto/piquetes
                db.all("SELECT * FROM pasto ORDER BY id DESC", [], (err, pasto) => {
                    if (err) return reject(err);
                    resultado.pasto = pasto;

                    // Busca TODOS os registros do sanatório/saúde
                    db.all("SELECT * FROM sanatorio ORDER BY id DESC", [], (err, sanatorio) => {
                        if (err) return reject(err);
                        resultado.sanatorio = sanatorio;

                        // Busca registros da tabela rebanho (se houver dados adicionais)
                        db.all("SELECT * FROM rebanho ORDER BY id DESC", [], (err, rebanho) => {
                            if (err) {
                                // Se a tabela rebanho não for usada, apenas resolve o restante
                                resultado.rebanho = [];
                            } else {
                                resultado.rebanho = rebanho;
                            }
                            
                            resolve(resultado);
                        });
                    });
                });
            });
        });
    });
}

module.exports = {
    obterResumoFazenda
};