(() => {
const sessionKey = 'polyarik-demo-account';
const accountLayout = document.querySelector('[data-account-layout]');
const accountGuest = document.querySelector('[data-account-guest]');
const registration = document.querySelector('[data-account-registration]');
const links = [...document.querySelectorAll('[data-account-link]')];
const orderDialog = document.querySelector('[data-order-dialog]');
const cancelledOrderKey = 'polyarik-demo-order-29-cancelled';
const accountViews = {
  home: 'Личный кабинет',
  profile: 'Личные данные',
  orders: 'Мои заказы',
  history: 'История заказов',
  bonuses: 'Бонусы и кэшбэк',
};
document.querySelector('[data-account-menu-toggle]')?.addEventListener('click', event => {
  const button = event.currentTarget;
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(expanded));
  document.querySelector('#account-navigation').classList.toggle('proto-account-nav-open', expanded);
});

function signedIn() {
  return sessionStorage.getItem(sessionKey) === '1' || localStorage.getItem(sessionKey) === '1';
}

function showAccount() {
  const active = signedIn();
  for (const link of links) {
    const label = link.querySelector('.name, .bottom-icons-panel__content-text');
    if (!label && !link.matches('.personal-link, #mobilemenu a')) continue;
    const text = active ? 'Мой кабинет' : (link.matches('[title="Кабинет"]') ? 'Кабинет' : 'Войти');
    if (label) label.textContent = text;
    link.setAttribute('aria-label', text);
  }
  if (!accountLayout) return;
  accountLayout.hidden = !active;
  accountGuest.hidden = active;
  const requested = new URLSearchParams(location.search).get('view');
  const view = Object.hasOwn(accountViews, requested) ? requested : 'home';
  const title = accountViews[view];
  document.querySelector('#pagetitle').textContent = title;
  document.querySelector('[data-account-crumb]').textContent = title;
  document.querySelector('[data-account-parent]').hidden = view === 'home';
  document.title = title + ' — Полярик';
  const cancelled = localStorage.getItem(cancelledOrderKey) === '1';
  renderBonuses();
  accountLayout.querySelector('[data-current-order]').hidden = cancelled;
  accountLayout.querySelector('[data-no-current-order]').hidden = !cancelled;
  accountLayout.querySelector('[data-cancelled-order]').hidden = !cancelled;
  accountLayout.querySelector('[data-order-history-empty]').hidden = cancelled;
  for (const panel of accountLayout.querySelectorAll('[data-account-panel]')) {
    panel.hidden = panel.dataset.accountPanel !== view;
  }
  for (const link of accountLayout.querySelectorAll('[data-account-view]')) {
    if (link.dataset.accountView === view || (view === 'history' && link.dataset.accountView === 'orders')) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

function renderBonuses() {
  const panel = accountLayout.querySelector('[data-account-panel="bonuses"]');
  if (!panel) return;
  const customer = window.PolyarikLoyalty.profile();
  if (!customer) return;
  const money = value => value.toLocaleString('ru-RU') + ' ₽';
  panel.querySelector('[data-bonus-balance]').textContent = money(customer.balance);
  panel.querySelector('[data-bonus-demo]').hidden = !customer.demo;
  panel.querySelector('[data-welcome-status]').textContent = customer.newCustomer
    ? 'На первый заказ компании действует дополнительная скидка 5%. Условия суммирования с другими скидками уточняются.'
    : 'Скидка на первый заказ доступна только новым клиентам. Для следующих заказов действуют скидки за объём и промокоды.';
  const history = panel.querySelector('[data-bonus-history]');
  history.replaceChildren();
  for (const entry of customer.history) {
    const item = document.createElement('li');
    item.textContent = String(entry.label || 'Операция с бонусами') + ': ' + money(Number(entry.amount) || 0);
    history.append(item);
  }
  panel.querySelector('[data-bonus-empty]').hidden = customer.history.length > 0;
}

function signIn(remember, identity = 'demo') {
  window.PolyarikLoyalty.startProfile(identity);
  (remember ? localStorage : sessionStorage).setItem(sessionKey, '1');
  if (accountLayout) {
    showAccount();
    document.querySelector('#pagetitle').tabIndex = -1;
    document.querySelector('#pagetitle').focus();
  } else {
    location.href = 'account.html';
  }
}

function openLogin() { signIn(false); }

document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-password-for]');
  if (toggle) {
    const input = document.getElementById(toggle.dataset.passwordFor);
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(visible));
    toggle.setAttribute('aria-label', visible ? 'Скрыть пароль' : 'Показать пароль');
    return;
  }
  if (event.target.closest('[data-account-open]') || (event.target.closest('[data-account-link]') && !signedIn())) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    document.body.classList.remove('prototype-menu-open');
    openLogin();
  }
});

if (orderDialog) {
  const actions = {
    details: ['Заказ №29 от 15.07.2026', 'Демонстрационный заказ. 1 товар на сумму 1 100 ₽. Оплата по счёту на расчётный счёт. Доставка транспортной компанией; условия согласуются индивидуально.'],
    repeat: ['Повторить заказ №29', 'В демонстрационном заказе нет привязки к товару из каталога. Вы можете собрать новый заказ в каталоге.'],
    cancel: ['Отменить заказ №29?', 'Демонстрационный заказ будет перенесён в историю со статусом «Отменён».'],
  };
  const confirm = orderDialog.querySelector('[data-order-confirm]');
  const catalog = orderDialog.querySelector('[data-order-catalog]');
  accountLayout.addEventListener('click', event => {
    const button = event.target.closest('[data-order-action]');
    if (!button) return;
    const action = button.dataset.orderAction;
    const [title, copy] = actions[action];
    orderDialog.returnValue = '';
    orderDialog.querySelector('h2').textContent = title;
    orderDialog.querySelector('[data-order-dialog-copy]').textContent = copy;
    confirm.hidden = action !== 'cancel';
    catalog.hidden = action !== 'repeat';
    orderDialog.showModal();
  });
  orderDialog.addEventListener('close', () => {
    if (orderDialog.returnValue !== 'cancel-order') return;
    localStorage.setItem(cancelledOrderKey, '1');
    showAccount();
    accountLayout.querySelector('.proto-order-history').focus();
  });
}

document.querySelector('[data-account-logout]')?.addEventListener('click', () => {
  sessionStorage.removeItem(sessionKey);
  localStorage.removeItem(sessionKey);
  sessionStorage.removeItem('polyarik-bonus-requested');
  location.href = 'account.html';
});

if (registration) {
  const password = registration.querySelector('#register-password');
  const confirm = registration.querySelector('#register-confirm');
  registration.addEventListener('input', () => { confirm.setCustomValidity(''); });
  registration.addEventListener('submit', event => {
    event.preventDefault();
    if (password.value !== confirm.value) {
      confirm.setCustomValidity('Пароли должны совпадать.');
      confirm.reportValidity();
      return;
    }
    registration.reset();
    signIn(false, 'new');
  });
}

addEventListener('pageshow', showAccount);
addEventListener('storage', event => { if (!event.key || event.key === sessionKey || event.key === cancelledOrderKey || event.key.startsWith('polyarik-loyalty-')) showAccount(); });
showAccount();
})();
