const entries = JSON.parse(document.querySelector('#news-entries').textContent);
const item = new URLSearchParams(location.search).get('item');
const entry = item === null ? entries[0] : entries.find(article => article.id === item);
const isEvent = document.body.hasAttribute('data-event-detail');
const title = entry?.title ?? (isEvent ? 'Статья не найдена' : 'Новость не найдена');
const date = document.querySelector('.detail-date');
const content = document.querySelector('.detail_content_wrapper');

document.title = title + ' — Полярик';
document.querySelector('#pagetitle').textContent = title;
document.querySelector('.breadcrumbs__item[aria-current="page"] .breadcrumbs__item-name').textContent = title;
if (entry) {
  date.dateTime = entry.isoDate;
  date.textContent = entry.date;
  for (const text of entry.body) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    content.querySelector('.news-detail-copy').append(paragraph);
  }
} else {
  date.parentElement.hidden = true;
  content.hidden = true;
}

const related = entries.find(article => article !== entry);
const relatedLink = document.querySelector('.side-news__item-link');
relatedLink.href = (isEvent ? 'event.html' : 'news-detail.html') + '?item=' + encodeURIComponent(related.id);
relatedLink.textContent = related.title;
const relatedDate = document.querySelector('.side-news__item-date');
relatedDate.dateTime = related.isoDate;
relatedDate.textContent = related.date;

if (isEvent) {
  const list = relatedLink.closest('.side-news__list');
  const sample = relatedLink.closest('.side-news__item');
  list.replaceChildren(...entries.filter(article => article !== entry).slice(0, 3).map(article => {
    const row = sample.cloneNode(true);
    const link = row.querySelector('.side-news__item-link');
    link.href = 'event.html?item=' + encodeURIComponent(article.id);
    link.textContent = article.title;
    const time = row.querySelector('time');
    time.dateTime = article.isoDate;
    time.textContent = article.date;
    return row;
  }));
}
