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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4a8 8 0 0 0-6.9 12l-1.1 4 4.1-1A8 8 0 1 0 12 4Z" />
      <path d="M9.3 8.9c.2-.4.4-.4.7-.4h.6c.2 0 .4 0 .5.4l.5 1.5c.1.3 0 .5-.1.7l-.4.5c-.1.1-.2.3-.1.5.3.7 1 1.8 2.2 2.4.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.5v.5c0 .3-.2.5-.4.7-.4.3-1 .5-1.7.3-1-.2-2.4-.8-3.7-2.2-1.6-1.5-2.3-3.1-2.5-4.2-.1-.7.1-1.3.4-1.6Z" />
    </svg>
  `
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

  return Swal.fire({
    confirmButtonText: 'Fechar',
    buttonsStyling: false,
    customClass: {
      popup: 'whatsapp-popup',
      confirmButton: 'whatsapp-popup-confirm',
    },
    html: `
      <div class="whatsapp-modal-shell">
        <span class="whatsapp-modal-badge">Contato rapido</span>
        <h2 class="whatsapp-modal-heading">${title}</h2>
        <div class="whatsapp-modal-card">
          <div class="whatsapp-modal-hero">
            <span class="whatsapp-modal-hero-icon">${renderWhatsAppIconMarkup()}</span>
            <div>
              <strong>${personName}</strong>
              <span>${phone}</span>
            </div>
          </div>
          <div class="whatsapp-modal-detail">${detail}</div>
          ${
            whatsappLink
              ? `<a class="whatsapp-shortcut whatsapp-shortcut-large" href="${whatsappLink}" target="_blank" rel="noopener noreferrer" aria-label="${buttonLabel}">
                  <span class="whatsapp-shortcut-icon">${renderWhatsAppIconMarkup()}</span>
                  <span>${buttonLabel}</span>
                </a>`
              : '<p class="whatsapp-modal-warning">Numero de WhatsApp invalido para redirecionamento.</p>'
          }
        </div>
      </div>
    `,
  })
}
