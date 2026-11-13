const news = document.querySelector('.proto-news-list');
const params = new URLSearchParams(location.search);
const cards = Array.from(news.querySelectorAll('[data-news-card]'));
const pageSize = 6;
const pageCount = Math.ceil(cards.length / pageSize);
const page = Math.min(pageCount, Math.max(1, Number.parseInt(params.get('page'), 10) || 1));
const pagination = news.querySelector('.news-pages');
const controls = news.querySelector('.bottom_nav_wrapper');
const more = news.querySelector('[data-news-more]');
let visibleCount = page * pageSize;

function pageUrl(number) {
  const query = new URLSearchParams();
  if (number > 1) query.set('page', number);
  return query.size ? 'news.html?' + query : 'news.html';
}

function renderCards() {
  const visible = new Set(cards.slice((page - 1) * pageSize, visibleCount));
  cards.forEach(card => { card.hidden = !visible.has(card); });
  more.hidden = visibleCount >= cards.length;
}

for (let number = 1; number <= pageCount; number++) {
  const link = document.createElement('a');
  link.href = pageUrl(number);
  link.textContent = number;
  link.className = 'dark_link rounded3';
  link.setAttribute('aria-label', 'Страница ' + number);
  if (number === page) link.setAttribute('aria-current', 'page');
  pagination.append(link);
}
controls.hidden = pageCount < 2;
more.addEventListener('click', () => {
  const nextCard = cards[visibleCount];
  visibleCount += pageSize;
  renderCards();
  nextCard?.querySelector('.title a')?.focus();
});
renderCards();
