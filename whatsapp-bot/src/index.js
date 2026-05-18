import 'dotenv/config'
import { existsSync } from 'node:fs'
import qrcode from 'qrcode-terminal'
import pkg from 'whatsapp-web.js'
import { getMenuMessage, getOptionReply, menuOptions } from './replies.js'

const { Buttons, Client, List, LocalAuth } = pkg

const botName = process.env.BOT_NAME || 'Assistente Central Academica UTP'
const authClientId = String(process.env.AUTH_CLIENT_ID || 'central-academica-utp').trim()
const ignoreGroups = String(process.env.IGNORE_GROUPS ?? 'true').toLowerCase() !== 'false'
const requireActivation = String(process.env.REQUIRE_ACTIVATION ?? 'true').toLowerCase() !== 'false'
const activationKeyword = String(process.env.ACTIVATION_KEYWORD || 'utp').trim().toLowerCase()
const whatsappWebVersion = String(process.env.WHATSAPP_WEB_VERSION || '2.3000.1039338618-alpha').trim()
const useInteractiveMessages = getBooleanEnv('USE_INTERACTIVE_MESSAGES', false)
const allowedNumbers = new Set(
  String(process.env.ALLOWED_NUMBERS || '')
    .split(',')
    .map((value) => value.replace(/\D/g, ''))
    .filter(Boolean),
)
const activeChats = new Set()
const chatStates = new Map()
const botStartedAt = Math.floor(Date.now() / 1000)

function getBooleanEnv(name, defaultValue) {
  const value = process.env[name]

  if (value === undefined) {
    return defaultValue
  }

  return String(value).trim().toLowerCase() === 'true'
}

function getBrowserExecutablePath() {
  const configuredPath = process.env.BROWSER_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH

  if (configuredPath) {
    return configuredPath
  }

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ]

  return candidates.find((candidate) => existsSync(candidate))
}

function normalizeMessage(message) {
  return String(message ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getSenderNumber(message) {
  return String(message.from || '').split('@')[0].replace(/\D/g, '')
}

function isAllowedNumber(message) {
  if (allowedNumbers.size === 0) {
    return false
  }

  return allowedNumbers.has(getSenderNumber(message))
}

function isSystemChat(message) {
  return (
    message.from === 'status@broadcast' ||
    message.from.endsWith('@newsletter') ||
    message.from.endsWith('@broadcast')
  )
}

function getMessageCommand(message) {
  return normalizeMessage(message.selectedButtonId || message.selectedRowId || message.body)
}

async function sendMessageWithFallback(to, content, fallbackText) {
  try {
    await client.sendMessage(to, content)
  } catch (error) {
    console.warn('Nao foi possivel enviar mensagem interativa. Enviando texto simples.', error?.message || error)
    await client.sendMessage(to, fallbackText)
  }
}

async function sendMenu(to) {
  const menuText = getMenuMessage(botName)

  if (!useInteractiveMessages) {
    await client.sendMessage(to, menuText)
    chatStates.set(to, 'menu')
    return
  }

  const listMessage = new List(
    'Escolha uma opcao para continuar o atendimento.',
    'Ver opcoes',
    [
      {
        title: 'Atendimento',
        rows: menuOptions.map((option) => ({
          id: option.id,
          title: `${option.key} - ${option.label}`,
          description: option.description,
        })),
      },
    ],
    botName,
    'Voce tambem pode responder com o numero da opcao.',
  )

  await sendMessageWithFallback(to, listMessage, menuText)
  chatStates.set(to, 'menu')
}

async function sendAfterReplyActions(to) {
  const fallbackText = `*O que deseja fazer agora?*

*[ 1 ]* Continuar atendimento
Voltar para o menu de opcoes.

*[ 2 ]* Encerrar atendimento
Finalizar esta conversa com o assistente.

Responda com 1 ou 2.`

  if (!useInteractiveMessages) {
    await client.sendMessage(to, fallbackText)
    chatStates.set(to, 'after-option')
    return
  }

  const buttonMessage = new Buttons(
    'Atendimento finalizado para esta opcao. Deseja continuar?',
    [
      { id: 'continue_service', body: 'Continuar' },
      { id: 'end_service', body: 'Encerrar' },
    ],
    'Atendimento UTP',
    'Voce pode voltar ao menu ou encerrar o atendimento.',
  )

  await sendMessageWithFallback(
    to,
    buttonMessage,
    fallbackText,
  )
  chatStates.set(to, 'after-option')
}

async function endService(to) {
  activeChats.delete(to)
  chatStates.set(to, 'ended')
  await client.sendMessage(
    to,
    `Atendimento encerrado. Para falar comigo novamente, envie "${activationKeyword}".`,
  )
}

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: authClientId,
  }),
  webVersion: whatsappWebVersion,
  webVersionCache: {
    type: 'remote',
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${whatsappWebVersion}.html`,
  },
  authTimeoutMs: 120000,
  puppeteer: {
    headless: getBooleanEnv('BROWSER_HEADLESS', false),
    acceptInsecureCerts: true,
    executablePath: getBrowserExecutablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
  },
})

client.on('qr', (qr) => {
  console.log('\nEscaneie este QR Code com o WhatsApp para conectar o bot:\n')
  qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
  console.log(`${botName} conectado em modo seguro.`)
  console.log(`O bot so responde apos receber "${activationKeyword}" ou para numeros em ALLOWED_NUMBERS.`)
})

client.on('loading_screen', (percent, message) => {
  console.log(`Carregando WhatsApp Web: ${percent}% ${message}`)
})

client.on('authenticated', () => {
  console.log('Sessao autenticada. Nas proximas execucoes, o QR Code pode nao ser necessario.')
})

client.on('auth_failure', (message) => {
  console.error('Falha ao autenticar a sessao do WhatsApp:', message)
})

client.on('disconnected', (reason) => {
  console.log('Bot desconectado:', reason)
})

client.on('message', async (message) => {
  try {
    if (message.fromMe || isSystemChat(message)) {
      return
    }

    if (message.timestamp && message.timestamp < botStartedAt) {
      return
    }

    const chat = await message.getChat()

    if (ignoreGroups && chat.isGroup) {
      return
    }

    const command = getMessageCommand(message)
    console.log(`Mensagem recebida de ${message.from}: "${command}"`)

    const isActivating = command === activationKeyword || command === `/${activationKeyword}`
    const state = chatStates.get(message.from)

    if (state === 'ended' && !isActivating) {
      console.log(`Mensagem ignorada de ${message.from}. Atendimento encerrado.`)
      return
    }

    const canReply = !requireActivation || isActivating || activeChats.has(message.from) || isAllowedNumber(message)

    if (!canReply) {
      console.log(`Mensagem ignorada de ${message.from}. Aguardando palavra de ativacao "${activationKeyword}".`)
      return
    }

    if (isActivating) {
      activeChats.add(message.from)
      await sendMenu(message.from)
      return
    }

    if (command === 'end_service' || command === 'encerrar' || command === 'encerrar atendimento' || command === '2 - encerrar atendimento') {
      await endService(message.from)
      return
    }

    if (
      command === 'continue_service' ||
      command === 'back_to_menu' ||
      command === 'continuar' ||
      command === 'continuar atendimento' ||
      command === 'outra opcao' ||
      command === '1 - continuar atendimento'
    ) {
      await sendMenu(message.from)
      return
    }

    if (state === 'after-option') {
      if (command === '1') {
        await sendMenu(message.from)
        return
      }

      if (command === '2') {
        await endService(message.from)
        return
      }

      await client.sendMessage(
        message.from,
        `Escolha uma das opcoes para continuar:

*[ 1 ]* Continuar atendimento
*[ 2 ]* Encerrar atendimento`,
      )
      return
    }

    const optionReply = getOptionReply(command)

    if (!optionReply) {
      await client.sendMessage(
        message.from,
        'Nao entendi sua mensagem. Vou te enviar o menu novamente.',
      )
      await sendMenu(message.from)
      return
    }

    await client.sendMessage(message.from, optionReply.text)
    await sendAfterReplyActions(message.from)
  } catch (error) {
    console.error('Erro ao responder mensagem:', error)
  }
})

console.log(`Iniciando ${botName}...`)
console.log('Modo seguro ativo: o bot nao responde contatos automaticamente ao conectar.')
console.log(`Para ativar uma conversa, envie "${activationKeyword}" para o numero conectado.`)

client.initialize().catch((error) => {
  console.error('Nao foi possivel iniciar o navegador do WhatsApp Web.')
  console.error('Verifique se o Chrome ou Edge esta instalado e, se necessario, configure BROWSER_EXECUTABLE_PATH no .env.')
  console.error(error)
  process.exit(1)
})
