# Gerador de Senhas

Projeto sendo desenvolvido na disciplina de DevOps para compreendimento de testes automatizados e versionamento de projetos feitos no GitHub. O projeto é um gerador de senhas personalizadas.

## Funcionalidades

* **Gerador rápido de senhas** — Clica em um botão e gera uma senha sem personalização.
* **Gerador de senhas personalizado** — O usuário escolhe características para compor a senha, como: tamanho, caracteres alfanuméricos ou numéricos.
* **Modo escuro** — A aplicação terá um modo escuro para melhor experiência de usuário.

## Estrutura do Projeto

```
.
├── .github/
│   └── workflow/
│       └── ci.yml
├── src/
│   ├── app
│   ├── index.html
│   └── style.css
├── .gitignore
└── README.md
```

## Como o Código Funciona

O projeto é composto por três frentes principais:

- **`src/index.html`** — Estrutura da interface, contendo os elementos de interação (botões de geração rápida e personalizada, opções de tamanho/tipo de caractere e o alternador de modo escuro).
- **`src/style.css`** — Estilização da aplicação, incluindo os temas claro e escuro.
- **`src/app`** — Lógica da aplicação em JavaScript, responsável por:
  - Gerar senhas aleatórias rápidas (sem personalização);
  - Gerar senhas personalizadas com base nas opções escolhidas pelo usuário (tamanho, uso de caracteres alfanuméricos ou apenas numéricos);
  - Controlar a alternância entre modo claro e modo escuro.
- **`.github/workflow/ci.yml`** — Pipeline de Integração Contínua (CI), responsável por executar os testes automatizados a cada push/pull request, garantindo que novas alterações não quebrem o funcionamento da aplicação.

## Como Executar o Projeto Localmente

### Pré-requisitos

- Ter o [Git](https://git-scm.com/) instalado;
- Ter um navegador web atualizado;
- (Se aplicável) Ter o [Node.js](https://nodejs.org/) e o `npm` instalados, caso o projeto utilize dependências listadas em `package.json`.

### Passo a passo

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/gerador-de-senhas.git
   ```

2. Acesse a pasta do projeto:
   ```bash
   cd gerador-de-senhas
   ```

3. (Se houver dependências) Instale as dependências listadas no `package.json`:
   ```bash
   npm install
   ```

4. Abra o arquivo `src/index.html` no navegador para utilizar a aplicação:
   ```bash
   # Linux
   xdg-open src/index.html

   # Windows
   start src/index.html

   # macOS
   open src/index.html
   ```

5. Pronto! A aplicação estará disponível diretamente no navegador.

## Testes Automatizados

Os testes são executados automaticamente pelo workflow definido em `.github/workflow/ci.yml` a cada alteração enviada ao repositório, garantindo o funcionamento contínuo da aplicação.


## Estratégia de Ramificação

O projeto utiliza a estratégia **Trunk-Based Development (Trunk-Based)**,
tendo a branch `main` como branch principal do projeto.

As alterações são desenvolvidas em branches curtas e específicas,
sendo posteriormente integradas à `main` por meio de Pull Requests.

### Padrão de nomenclatura das branches

| Prefixo | Uso | Exemplo |
|---|---|---|
| `feature/` | Novas funcionalidades | `feature/html-css` |
| `fix/` | Correções de bugs | `fix/erro-senha` |
| `chore/` | Manutenção, configurações e dependências | `chore/config-ci` |

As branches devem ser criadas para uma atividade específica e,
após a conclusão da tarefa e revisão por Pull Request, devem ser
integradas à branch `main`.

### Padrão de commits

Os commits devem utilizar prefixos que indiquem o tipo de alteração:

- `feat:` — nova funcionalidade;
- `fix:` — correção de bug;
- `chore:` — manutenção ou configuração;
- `test:` — criação ou alteração de testes;
- `docs:` — alteração na documentação.

Exemplos:

```text
feat: adiciona gerador de senha
fix: corrige geração de senha numérica
chore: configura pipeline de CI
test: adiciona testes do gerador
docs: atualiza documentação