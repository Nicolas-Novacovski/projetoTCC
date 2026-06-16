import Swal from 'sweetalert2'

export const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2400,
  timerProgressBar: true,
})

export function showFeatureAlert(title: string, text: string) {
  return Swal.fire({ icon: 'info', title, text, confirmButtonText: 'Entendi' })
}

function buildWhatsAppLink(phone: string, message: string) {
  const digitsOnly = phone.replace(/\D/g, '')

  if (!digitsOnly) {
    return null
  }

  const normalizedPhone =
    digitsOnly.length === 10 || digitsOnly.length === 11
      ? `55${digitsOnly}`
      : digitsOnly

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}

function renderWhatsAppIconMarkup() {
  return `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16.02 3.6C9.1 3.6 3.5 9.1 3.5 15.88c0 2.18.6 4.31 1.72 6.16L3.4 28.4l6.55-1.73a12.72 12.72 0 0 0 6.07 1.54c6.91 0 12.53-5.5 12.53-12.33S22.93 3.6 16.02 3.6Zm0 22.42c-1.92 0-3.78-.52-5.4-1.5l-.38-.23-3.89 1.03 1.04-3.76-.25-.39a10.02 10.02 0 0 1-1.55-5.29c0-5.58 4.68-10.1 10.43-10.1 5.74 0 10.42 4.52 10.42 10.1 0 5.57-4.68 10.14-10.42 10.14Z" />
      <path d="M21.72 18.58c-.31-.15-1.86-.91-2.15-1.02-.29-.1-.5-.15-.71.16-.2.3-.81 1.01-.99 1.22-.18.2-.37.23-.68.08-.31-.15-1.32-.48-2.52-1.54-.93-.82-1.56-1.84-1.74-2.15-.18-.31-.02-.47.14-.63.14-.14.31-.37.46-.55.16-.18.21-.31.31-.52.1-.2.05-.38-.03-.54-.08-.15-.71-1.69-.97-2.31-.25-.6-.51-.52-.71-.53h-.6c-.2 0-.54.08-.82.38-.28.31-1.08 1.05-1.08 2.56 0 1.51 1.11 2.98 1.26 3.18.15.2 2.19 3.32 5.31 4.65.74.32 1.32.51 1.77.65.74.23 1.42.2 1.96.12.6-.09 1.86-.75 2.12-1.47.26-.72.26-1.34.18-1.47-.08-.13-.28-.2-.59-.35Z" />
    </svg>
  `
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

type WhatsAppModalInput = {
  title: string
  personName: string
  phone: string
  detail: string
  buttonLabel: string
  message: string
}

export function showWhatsAppContactModal({
  title,
  personName,
  phone,
  detail,
  buttonLabel,
  message,
}: WhatsAppModalInput) {
  const whatsappLink = buildWhatsAppLink(phone, message)
  const safeTitle = escapeHtml(title)
  const safePersonName = escapeHtml(personName)
  const safePhone = escapeHtml(phone)
  const safeDetail = escapeHtml(detail)
  const safeButtonLabel = escapeHtml(buttonLabel)

  return Swal.fire({
    confirmButtonText: 'Fechar',
    buttonsStyling: false,
    customClass: {
      popup: 'whatsapp-popup',
      confirmButton: 'whatsapp-popup-confirm',
    },
    html: `
      <div class="whatsapp-modal-shell">
        <div class="whatsapp-modal-top">
          <span class="whatsapp-modal-badge">Contato rapido</span>
          <span class="whatsapp-modal-status">WhatsApp</span>
        </div>
        <h2 class="whatsapp-modal-heading">${safeTitle}</h2>
        <div class="whatsapp-modal-card">
          <div class="whatsapp-modal-hero" style="display: flex; align-items: center; gap: 16px;">
            <span class="whatsapp-modal-hero-icon" style="display: flex; flex-shrink: 0;">${renderWhatsAppIconMarkup()}</span>
            <div style="display: flex; flex-direction: column; justify-content: center;">
              <strong style="line-height: 1.2;">${safePersonName}</strong>
              <span style="line-height: 1.2; margin-top: 4px;">${safePhone}</span>
            </div>
          </div>
          <div class="whatsapp-modal-detail">
            <span>Informacoes da carona</span>
            <strong>${safeDetail}</strong>
          </div>
          ${
            whatsappLink
              ? `<a class="whatsapp-shortcut whatsapp-shortcut-large" href="${whatsappLink}" target="_blank" rel="noopener noreferrer" aria-label="${safeButtonLabel}">
                  <span class="whatsapp-shortcut-icon">${renderWhatsAppIconMarkup()}</span>
                  <span>${safeButtonLabel}</span>
                </a>`
              : '<p class="whatsapp-modal-warning">Numero de WhatsApp invalido para redirecionamento.</p>'
          }
        </div>
      </div>
    `,
  })
}