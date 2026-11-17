(() => {
  const sessionKey = 'polyarik-demo-account';
  const requestedKey = 'polyarik-bonus-requested';
  const identityKey = 'polyarik-loyalty-identity';
  const whole = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
  function profile() {
    if (sessionStorage.getItem(sessionKey) !== '1' && localStorage.getItem(sessionKey) !== '1') return null;
    const identity = localStorage.getItem(identityKey) === 'new' ? 'new' : 'demo';
    let saved;
    try { saved = JSON.parse(localStorage.getItem('polyarik-loyalty-' + identity)); } catch {}
    const fallback = identity === 'new'
      ? {newCustomer:true, balance:0, history:[]}
      : {newCustomer:false, balance:1500, history:[{label:'Тестовое начисление для демонстрации', amount:1500}]};
    const data = saved && typeof saved === 'object' ? saved : fallback;
    return {newCustomer:data.newCustomer === true, balance:whole(data.balance), history:Array.isArray(data.history) ? data.history : [], demo:identity === 'demo'};
  }
  function startProfile(identity, reset = false) {
    localStorage.setItem(identityKey, identity === 'new' ? 'new' : 'demo');
    if (identity === 'new' && (reset || !localStorage.getItem('polyarik-loyalty-new'))) localStorage.setItem('polyarik-loyalty-new', JSON.stringify({newCustomer:true, balance:0, history:[]}));
    sessionStorage.removeItem(requestedKey);
  }
  function pricing(subtotal, volumeRate, promoRate) {
    const customer = profile();
    const welcomeRate = customer?.newCustomer && volumeRate + promoRate < 5 ? 5 : 0;
    const rate = welcomeRate || volumeRate + promoRate;
    const discount = Math.round(subtotal * rate) / 100;
    const discountedTotal = Math.round((subtotal - discount) * 100) / 100;
    const bonusLimit = Math.min(customer?.balance || 0, Math.floor(Math.round(discountedTotal * 100) * 30 / 10000));
    const bonusSpent = customer ? Math.min(bonusLimit, whole(sessionStorage.getItem(requestedKey))) : 0;
    return {subtotal, volumeRate:welcomeRate ? 0 : volumeRate, promoRate:welcomeRate ? 0 : promoRate,
      welcomeRate, rate, discount, discountedTotal, bonusLimit, bonusSpent,
      total:Math.round((discountedTotal - bonusSpent) * 100) / 100};
  }
  function setRequestedBonus(value) { sessionStorage.setItem(requestedKey, String(whole(value))); }
  function completeOrder(pricing, number) {
    const customer = profile();
    if (customer) {
      const identity = localStorage.getItem(identityKey) === 'new' ? 'new' : 'demo';
      const history = [...customer.history];
      if (pricing.bonusSpent) history.push({label:'Списание по демонстрационному заказу ' + number, amount:-pricing.bonusSpent});
      localStorage.setItem('polyarik-loyalty-' + identity, JSON.stringify({newCustomer:false, balance:Math.max(0, customer.balance - pricing.bonusSpent), history}));
    }
    sessionStorage.removeItem(requestedKey);
  }
  window.PolyarikLoyalty = {profile, startProfile, pricing, setRequestedBonus, completeOrder};
})();
