const serviceDialog = document.querySelector('#service-request-dialog');
const serviceForm = serviceDialog.querySelector('form');
const serviceStatus = serviceForm.querySelector('[role="status"]');

document.querySelector('[data-service-request]').addEventListener('click', () => serviceDialog.showModal());
serviceDialog.querySelector('.promo-dialog-close').addEventListener('click', () => serviceDialog.close());
serviceForm.addEventListener('submit', event => {
  event.preventDefault();
  serviceStatus.textContent = 'Форма проверена. В прототипе заявка не отправляется.';
});
serviceDialog.addEventListener('close', () => {
  serviceForm.reset();
  serviceStatus.textContent = '';
});

const productionLinks = [...document.querySelectorAll('[data-production]')];
const requestedProduction = new URLSearchParams(location.search).get('type');
const activeProduction = productionLinks.find(link => link.dataset.production === requestedProduction) ?? productionLinks[0];

if (activeProduction !== productionLinks[0]) {
  const current = document.querySelector('.breadcrumbs [aria-current="page"]');
  const parent = document.createElement('a');
  parent.className = 'breadcrumbs__link font_xs';
  parent.href = 'services.html';
  parent.textContent = current.textContent;
  const separator = document.createElement('span');
  separator.setAttribute('aria-hidden', 'true');
  separator.textContent = ' — ';
  current.before(parent, separator);
  current.textContent = activeProduction.textContent.trim();
  document.querySelector('#pagetitle').textContent = current.textContent;
  document.title = current.textContent + ' — Полярик';
}

for (const link of productionLinks) {
  if (link === activeProduction) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
}
for (const panel of document.querySelectorAll('[data-production-panel]')) {
  panel.hidden = panel.dataset.productionPanel !== activeProduction.dataset.production;
}
document.querySelector('#service-request-title').textContent = 'Заявка на ' + activeProduction.textContent.trim().toLowerCase();
