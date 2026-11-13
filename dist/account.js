(() => {
const sessionKey = 'polyarik-demo-account';
const demoLogin = 'demo@polyarik.test';
const demoPassword = 'Demo2026';
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
};
let dialog;

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

function signIn(remember) {
  (remember ? localStorage : sessionStorage).setItem(sessionKey, '1');
  if (accountLayout) {
    dialog?.close();
    showAccount();
    document.querySelector('#pagetitle').tabIndex = -1;
    document.querySelector('#pagetitle').focus();
  } else {
    location.href = 'account.html';
  }
}

function createDialog() {
  const modal = document.createElement('dialog');
  modal.className = 'proto-auth-dialog';
  modal.setAttribute('aria-labelledby', 'proto-auth-title');
  modal.innerHTML = [
    '<button type="button" class="proto-auth-close" aria-label="Закрыть окно входа">×</button>',
    '<h2 id="proto-auth-title">Личный кабинет</h2>',
    '<form data-demo-login>',
    '  <div class="proto-auth-field"><label for="auth-login">Логин <span aria-hidden="true">*</span></label><input id="auth-login" autocomplete="username" maxlength="254" required autofocus></div>',
    '  <div class="proto-auth-field"><label for="auth-password">Пароль <span aria-hidden="true">*</span></label><div class="proto-auth-password"><input id="auth-password" type="password" autocomplete="current-password" required><button type="button" data-password-for="auth-password" aria-label="Показать пароль" aria-pressed="false"><svg width="19" height="16" viewBox="0 0 24 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M2 9s4-6 10-6 10 6 10 6-4 6-10 6S2 9 2 9Z"/><circle cx="12" cy="9" r="2.4"/></svg></button></div></div>',
    '  <div class="proto-auth-options"><label class="proto-auth-remember"><input type="checkbox" id="auth-remember">Запомнить меня</label><button class="proto-auth-text-action" type="button" data-auth-recovery>Забыли пароль?</button></div>',
    '  <p class="proto-auth-required"><span aria-hidden="true">*</span> — обязательные поля</p>',
    '  <div class="proto-auth-actions"><button type="submit" class="btn btn-default">Войти</button><a href="registration.html" class="btn btn-transparent-border-color">Регистрация</a></div>',
    '  <p class="proto-auth-demo muted">Демо-доступ: <code>' + demoLogin + '</code> / <code>' + demoPassword + '</code></p>',
    '  <p class="proto-auth-error" role="status"></p>',
    '</form>',
    '<form data-demo-recovery hidden>',
    '  <div class="proto-auth-field"><label for="auth-recovery-email">E-mail <span aria-hidden="true">*</span></label><input id="auth-recovery-email" type="email" autocomplete="email" required></div>',
    '  <div class="proto-auth-actions"><button type="submit" class="btn btn-default">Восстановить пароль</button><button class="proto-auth-text-action" type="button" data-auth-back>Вернуться ко входу</button></div>',
    '  <p class="proto-auth-demo muted" role="status"></p>',
    '</form>'
  ].join('');
  document.body.append(modal);

  const login = modal.querySelector('[data-demo-login]');
  const recovery = modal.querySelector('[data-demo-recovery]');
  const title = modal.querySelector('h2');
  const password = modal.querySelector('#auth-password');
  const username = modal.querySelector('#auth-login');
  const status = login.querySelector('[role="status"]');
  function showRecovery(open) {
    login.hidden = open;
    recovery.hidden = !open;
    title.textContent = open ? 'Восстановление пароля' : 'Личный кабинет';
    (open ? recovery.querySelector('input') : username).focus();
  }
  modal.querySelector('.proto-auth-close').addEventListener('click', () => modal.close());
  modal.querySelector('[data-auth-recovery]').addEventListener('click', () => showRecovery(true));
  modal.querySelector('[data-auth-back]').addEventListener('click', () => showRecovery(false));
  modal.addEventListener('close', () => {
    login.reset();
    recovery.reset();
    login.hidden = false;
    recovery.hidden = true;
    title.textContent = 'Личный кабинет';
    password.type = 'password';
    const toggle = modal.querySelector('[data-password-for]');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', 'Показать пароль');
    status.textContent = '';
    recovery.querySelector('[role="status"]').textContent = '';
  });
  login.addEventListener('input', () => { status.textContent = ''; });
  login.addEventListener('submit', event => {
    event.preventDefault();
    if (username.value.trim().toLowerCase() !== demoLogin || password.value !== demoPassword) {
      status.textContent = 'Для входа в прототип используйте демо-доступ, указанный ниже формы.';
      return;
    }
    signIn(modal.querySelector('#auth-remember').checked);
  });
  recovery.addEventListener('submit', event => {
    event.preventDefault();
    recovery.querySelector('[role="status"]').textContent = 'Восстановление пароля работает в демонстрационном режиме.';
  });
  return modal;
}

function openLogin() {
  dialog ??= createDialog();
  if (!dialog.open) dialog.showModal();
}

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
    signIn(false);
  });
}

addEventListener('pageshow', showAccount);
addEventListener('storage', event => { if (!event.key || event.key === sessionKey || event.key === cancelledOrderKey) showAccount(); });
showAccount();
})();
