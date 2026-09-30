# Segundo Lar — site da ONG

Site com quatro páginas em HTML, CSS e JavaScript, servido pelo `server.js` com Node.js.

## Como executar

Na pasta `Projeto1`, abra o CMD e execute:

```cmd
node server.js
```

Depois abra no navegador:

```text
http://localhost:3000
```

- `index.html`: página inicial.
- `projetos.html`: projetos.
- `doacoes.html`: formulário de doação com PIX, débito e crédito.
- `contato.html`: formulário de contato.
- `css/style.css`: estilos.
- `js/doacoes.js` e `js/contato.js`: validações.
- `cprogram/processamento.exe`: programa em C chamado pelo servidor.
- `log/`: recebe um arquivo JSON para cada transação de doação.

O código do benfeitor deve ter exatamente 6 dígitos e o valor deve ser positivo.
