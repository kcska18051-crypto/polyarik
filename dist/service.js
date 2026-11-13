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
