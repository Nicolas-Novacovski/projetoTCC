import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

function hasSmtpConfig() {
  return Boolean(env.mail.host && env.mail.user && env.mail.password && env.mail.from)
}

function createTransporter() {
  if (!hasSmtpConfig()) {
    return null
  }

  return nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: {
      user: env.mail.user,
      pass: env.mail.password,
    },
  })
}

export async function sendApplicationEmail({ to, studentName, post, profile, contactEmail }) {
  const transporter = createTransporter()

  if (!transporter || !to) {
    return {
      sent: false,
      reason: 'SMTP nao configurado ou e-mail do aluno nao informado.',
    }
  }

  const subject = `Interesse registrado: ${post.title}`
  const text = [
    `Ola, ${studentName}.`,
    '',
    'Seu interesse em uma vaga foi registrado na Central Academica UTP.',
    '',
    `Vaga: ${post.title}`,
    `Empresa/local: ${post.subtitle}`,
    `Contato para envio do curriculo: ${contactEmail}`,
    '',
    'Resumo do seu perfil:',
    `Curso: ${profile.course || 'Nao informado'}`,
    `Semestre: ${profile.semester || 'Nao informado'}`,
    `Area desejada: ${profile.desiredArea || 'Nao informada'}`,
    `Curriculo cadastrado: ${profile.resumeFileName || 'Nao anexado'}`,
    '',
    'Importante: a Central Academica nao realiza sua inscricao na vaga e nao se responsabiliza pelo processo seletivo. Nos apenas encaminhamos as informacoes para voce. Entre em contato com a empresa, envie seu curriculo quando necessario e acompanhe todas as etapas diretamente com o responsavel pela oportunidade.',
  ].join('\n')

  try {
    await transporter.sendMail({
      from: env.mail.from,
      to,
      subject,
      text,
    })

    return { sent: true, reason: null }
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : 'Falha desconhecida ao enviar e-mail.',
    }
  }
}
