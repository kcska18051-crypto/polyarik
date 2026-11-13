const wholesaleForm = document.querySelector('#wholesale-feedback');

wholesaleForm.addEventListener('submit', event => {
  event.preventDefault();
  wholesaleForm.querySelector('[role="status"]').textContent =
    'Форма проверена. В прототипе сообщение не отправляется.';
});

const quiz = document.querySelector('#wholesale-quiz-dialog');
const quizQuestions = [
  {title: 'Какой у вас формат бизнеса?', options: ['Крупная розничная сеть', 'Региональный магазин', 'Интернет-магазин', 'Маркетплейс', 'Оптовая торговля']},
  {title: 'На какую сумму планируете заказ?', options: ['10–30 тыс. ₽', '30–50 тыс. ₽', '50–100 тыс. ₽', '100–150 тыс. ₽', 'Более 150 тыс. ₽']},
  {title: 'Какие товары вас интересуют?', multiple: true, options: ['Шапки и комплекты с хлопковой подкладкой', 'Трикотажные шапки и комплекты', 'Панамы, кепки и бейсболки', 'Перчатки и варежки']},
  {title: 'Что для вас важнее при выборе поставщика?', options: ['Цена и качество', 'Широкий ассортимент', 'Стабильность и скорость поставок', 'Сезонные коллекции']}
];
const questionTitle = quiz.querySelector('h2');
const options = quiz.querySelector('.proto-quiz-options');
const progress = quiz.querySelector('[data-quiz-progress]');
const next = quiz.querySelector('[data-quiz-next]');
const back = quiz.querySelector('[data-quiz-back]');
let answers = [];
let step = 0;

function showQuizStep() {
  const question = quizQuestions[step];
  options.replaceChildren();
  progress.textContent = 'Готово: ' + step * 25 + '%';
  back.hidden = step === 0;
  next.hidden = !question;

  if (!question) {
    questionTitle.textContent = 'Спасибо за ответы';
    const summary = document.createElement('p');
    summary.textContent = 'Для персонального предложения свяжитесь с отделом продаж. Ответы из квиза остаются в предпросмотре.';
    const contact = document.createElement('a');
    contact.className = 'btn btn-default';
    contact.href = '#wholesale-feedback';
    contact.textContent = 'Напишите нам';
    contact.addEventListener('click', () => quiz.close());
    options.append(summary, contact);
    return;
  }

  questionTitle.textContent = question.title;
  next.textContent = step === quizQuestions.length - 1 ? 'Последний шаг' : 'Далее';
  next.disabled = !answers[step]?.length;
  if (question.multiple) {
    const hint = document.createElement('p');
    hint.textContent = 'Выберите один или несколько вариантов';
    options.append(hint);
  }
  for (const value of question.options) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = question.multiple ? 'checkbox' : 'radio';
    input.name = 'answer';
    input.value = value;
    input.checked = answers[step]?.includes(value) ?? false;
    label.append(input, value);
    options.append(label);
  }
}

document.querySelector('[data-quiz-start]').addEventListener('click', () => {
  step = 0;
  answers = [];
  showQuizStep();
  quiz.showModal();
});
quiz.querySelector('.promo-dialog-close').addEventListener('click', () => quiz.close());
options.addEventListener('change', () => {
  answers[step] = [...options.querySelectorAll('input:checked')].map(input => input.value);
  next.disabled = !answers[step].length;
});
back.addEventListener('click', () => {
  step--;
  showQuizStep();
});
quiz.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  if (!quizQuestions[step] || !answers[step]?.length) return;
  step++;
  showQuizStep();
  if (next.hidden) options.querySelector('a').focus();
});
