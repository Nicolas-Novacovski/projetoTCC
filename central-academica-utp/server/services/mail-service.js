import nodemailer from 'nodemailer'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'

const emailBannerPublicPath = fileURLToPath(new URL('../../public/email-banner.png', import.meta.url))
const emailBannerDistPath = fileURLToPath(new URL('../../dist/email-banner.png', import.meta.url))
const emailBannerPath = existsSync(emailBannerPublicPath) ? emailBannerPublicPath : emailBannerDistPath

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

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
    `Contato da oportunidade: ${contactEmail}`,
    '',
    'Resumo do seu perfil:',
    `Curso: ${profile.course || 'Nao informado'}`,
    `Semestre: ${profile.semester || 'Nao informado'}`,
    `Area desejada: ${profile.desiredArea || 'Nao informada'}`,
    '',
    'Importante: a Central Academica nao realiza sua inscricao na vaga e nao se responsabiliza pelo processo seletivo. Nos apenas encaminhamos as informacoes para voce. Entre em contato com a empresa e acompanhe todas as etapas diretamente com o responsavel pela oportunidade.',
  ].join('\n')

  const safeStudentName = escapeHtml(studentName)
  const safePostTitle = escapeHtml(post.title)
  const safePostSubtitle = escapeHtml(post.subtitle)
  const safeContactEmail = escapeHtml(contactEmail)
  const safeProfileCourse = escapeHtml(profile.course || 'Nao informado')
  const safeProfileSemester = escapeHtml(profile.semester || 'Nao informado')
  const safeProfileDesiredArea = escapeHtml(profile.desiredArea || 'Nao informada')

  const html = `
    <div style="margin:0;background:#f4f8f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#16342b;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dce9e2;">
        <img src="cid:centralAcademicaBanner" alt="Assistente Central Academica Tuiuti" style="display:block;width:100%;height:auto;" />
        <div style="padding:28px;">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Ola, ${safeStudentName}.</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.6;">Seu interesse em uma vaga foi registrado na Central Academica UTP.</p>
          <div style="margin:0 0 22px;padding:18px;border-radius:12px;background:#f2f8f5;border:1px solid #d7e8dd;">
            <p style="margin:0 0 8px;"><strong>Vaga:</strong> ${safePostTitle}</p>
            <p style="margin:0 0 8px;"><strong>Empresa/local:</strong> ${safePostSubtitle}</p>
            <p style="margin:0;"><strong>Contato da oportunidade:</strong> ${safeContactEmail}</p>
          </div>
          <h2 style="margin:0 0 12px;font-size:18px;color:#0b5f33;">Resumo do seu perfil</h2>
          <p style="margin:0 0 6px;"><strong>Curso:</strong> ${safeProfileCourse}</p>
          <p style="margin:0 0 6px;"><strong>Semestre:</strong> ${safeProfileSemester}</p>
          <p style="margin:0 0 22px;"><strong>Area desejada:</strong> ${safeProfileDesiredArea}</p>
          <p style="margin:0;color:#52685e;font-size:14px;line-height:1.6;">Importante: a Central Academica nao realiza sua inscricao na vaga e nao se responsabiliza pelo processo seletivo. Nos apenas encaminhamos as informacoes para voce. Entre em contato com a empresa e acompanhe todas as etapas diretamente com o responsavel pela oportunidade.</p>
        </div>
      </div>
    </div>
  `

  try {
    const bannerContent = readFileSync(emailBannerPath)

    await transporter.sendMail({
      from: env.mail.from,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: 'email-banner.png',
          content: bannerContent,
          cid: 'centralAcademicaBanner',
          contentType: 'image/png',
          contentDisposition: 'inline',
        },
      ],
    })

    return { sent: true, reason: null }
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : 'Falha desconhecida ao enviar e-mail.',
    }
  }
}
