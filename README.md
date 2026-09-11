# VELQERIX PROXY — teste + SuaUrl

Este pacote já está configurado com o link SuaUrl: https://snet.blog/velqerix

## Teste local
1. Instale Node.js 18+.
2. Abra um terminal nesta pasta.
3. Rode `npm start`.
4. Abra `http://localhost:3000`.
5. Para testar a geração sem depender do SuaUrl, abra `http://localhost:3000/api/start?test=1`.
6. Depois o navegador vai para `/claim` e mostra uma VQ-XXXXXX válida por 3 horas.

## SuaUrl
No SuaUrl, o Link final deve ser a URL pública desta aplicação + `/claim`.
Exemplo: `https://SEU-DOMINIO.com/claim`

O botão do site já aponta para o fluxo `/api/start`, que redireciona para `https://snet.blog/velqerix`.

## Observação
Para o fluxo real funcionar, a SuaUrl precisa voltar para o `/claim` do seu domínio. Se ela não permitir configurar esse retorno, o link curto não consegue concluir o fluxo sozinho.
