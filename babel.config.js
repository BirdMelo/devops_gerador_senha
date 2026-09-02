/**
 * Configuração do Babel — usada apenas durante os testes (Jest).
 *
 * Os arquivos de src/app usam sintaxe de ES Modules (`export`/`import`),
 * mas o Jest, por padrão, roda em CommonJS puro e não entende essa sintaxe.
 * O preset "@babel/preset-env" transpila `export`/`import` para
 * `module.exports`/`require` na hora de rodar os testes, sem alterar
 * os arquivos originais nem afetar o comportamento no navegador.
 *
 * "targets: { node: 'current' }" diz pro Babel gerar código compatível
 * com a versão do Node instalada, evitando transformações desnecessárias.
 */
module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }]],
};