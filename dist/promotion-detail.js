const offers = JSON.parse(document.querySelector('#promotion-entries').textContent);
const key = new URLSearchParams(location.search).get('offer');
const offer = offers.find(entry => entry.id === key);
const title = offer?.title ?? 'Предложение не найдено';

document.title = title + ' — Полярик';
document.querySelector('#pagetitle').textContent = title;

if (offer) {
  document.querySelector('.promo-lead').textContent = offer.lead;
  document.querySelector('.promo-kind').textContent = offer.kind;
  startCountdown();
  for (const text of offer.body) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    document.querySelector('.promo-description').append(paragraph);
  }
} else {
  for (const selector of ['.promo-kind', '.promo-countdown', '.promo-description', '.proto-promo-detail .goods', '.form-order-block', '.promo-share']) {
    document.querySelector(selector).hidden = true;
  }
}

const requestDialog = document.querySelector('#promo-request-dialog');
document.querySelectorAll('[data-promo-request]').forEach(button => {
  button.addEventListener('click', () => requestDialog.showModal());
});
requestDialog.querySelector('.promo-dialog-close').addEventListener('click', () => requestDialog.close());
requestDialog.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  requestDialog.querySelector('[role="status"]').textContent =
    'Форма проверена. В прототипе сообщение не отправляется.';
});
requestDialog.addEventListener('close', () => {
  requestDialog.querySelector('form').reset();
  requestDialog.querySelector('[role="status"]').textContent = '';
});

function startCountdown() {
  const countdown = document.querySelector('.promo-countdown');
  const deadline = Date.parse(countdown.querySelector('time').dateTime);
  const label = countdown.querySelector('.promo-countdown-label');
  const value = countdown.querySelector('.promo-countdown-value');

  function update() {
    const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (seconds === 0) {
      label.hidden = true;
      value.textContent = 'Акция завершена';
      return false;
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds / 3600) % 24;
    const minutes = Math.floor(seconds / 60) % 60;
    const clock = [hours, minutes, seconds % 60].map(part => String(part).padStart(2, '0')).join(':');
    value.textContent = days + ' дн. ' + clock;
    return true;
  }

  if (update()) {
    const timer = setInterval(() => {
      if (!update()) clearInterval(timer);
    }, 1000);
  }
}

const share = document.querySelector('.promo-share button');
share.addEventListener('click', async () => {
  try {
    const url = new URL(location.href);
    url.hash = '';
    await navigator.clipboard.writeText(url.href);
    share.textContent = 'Ссылка скопирована';
  } catch {
    share.textContent = 'Скопируйте адрес из строки браузера';
  }
});
