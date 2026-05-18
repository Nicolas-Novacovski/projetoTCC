# Bot de WhatsApp - Central Academica UTP

Bot simples de atendimento com respostas prontas usando `whatsapp-web.js`.

## Como configurar

1. Instale as dependencias:

```powershell
npm install
```

2. Copie o arquivo de ambiente:

```powershell
Copy-Item .env.example .env
```

3. Inicie o bot:

```powershell
npm run dev
```

4. Escaneie o QR Code no terminal usando o WhatsApp.

Se aparecer `spawn EPERM` ao iniciar o navegador, confirme no `.env` o caminho do Chrome ou Edge:

```env
AUTH_CLIENT_ID=central-academica-utp-local
BROWSER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
BROWSER_HEADLESS=false
WHATSAPP_WEB_VERSION=2.3000.1039338618-alpha
```

Por seguranca, o bot inicia em modo seguro. Ele nao responde automaticamente qualquer contato ao conectar. Para ativar uma conversa, a pessoa precisa enviar:

```txt
utp
```

Depois disso, o menu funciona normalmente naquela conversa.

Depois que a pessoa escolher uma opcao do menu, o bot tenta enviar dois botoes clicaveis:

- `Encerrar`
- `Outra opcao`

Se `Encerrar` for selecionado, o bot para de responder aquela conversa. Para iniciar novamente, a pessoa precisa enviar `utp`.

Se os botoes nao funcionarem no WhatsApp Web, o bot envia automaticamente a alternativa em texto:

```txt
1 - Encerrar atendimento
2 - Escolher outra opcao
```

Se quiser liberar somente numeros de teste, preencha `ALLOWED_NUMBERS` no `.env` com DDD + numero, separados por virgula:

```env
ALLOWED_NUMBERS=41999999999,41988888888
```

## Opcoes do bot

- `1` - Achados e Perdidos
- `2` - Caronas
- `3` - Mural Academico
- `4` - Secretaria
- `5` - Falar com a equipe

## Cuidados

Este bot usa automacao do WhatsApp Web, nao a API oficial da Meta. Para teste e prototipo de TCC, evite:

- usar em grupos;
- enviar mensagens em massa;
- deixar rodando sem supervisao;
- usar um numero pessoal principal em producao.

Por padrao, o bot ignora mensagens de grupos.

Caso algum comportamento inesperado aconteca, pare o terminal com `Ctrl+C` e remova a sessao em:

```txt
WhatsApp > Configuracoes > Dispositivos conectados
```
