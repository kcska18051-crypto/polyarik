# B2B checkout implementation plan

Goal: согласованная форма юрлица и демонстрационное подтверждение заказа без фиктивной отправки.

Architecture: checkout.js управляет формой, валидацией, черновиком и подтверждением. prototype.js передаёт снимок товаров/расчёта и повторно валидирует перед сохранением. loyalty.js фиксирует только завершённый демонстрационный заказ.

Tech stack: vanilla JS/CSS, Node test runner/jsdom.

- [x] Создать tests/checkout.test.cjs: обязательные поля, РФ/Беларусь, некорректный телефон/почта, изменение корзины, минимум, успешное подтверждение/двойной submit, бонусы/первый заказ. Запустить тесты и увидеть новые падения.
- [x] Создать dist/checkout.js с интерфейсом open({dialog,getOrder,onConfirmed,renderBreakdown,renderScale,renderTerms}) и appendLastOrderLink(container). getOrder возвращает null при недопустимом заказе, иначе {items,pricing}. Использовать DOM textContent и sessionStorage, не отправлять сетевые запросы.
- [x] Подключить checkout.js перед prototype.js на всех HTML и в тестовом fixture; openCheckout передаёт актуальные товары/итоги, renderCart добавляет доступ к последнему подтверждению. Сохранить прежние селекторы разбивки для регрессионных тестов.
- [x] Добавить completeOrder(pricing,number) в loyalty.js: уменьшение баланса, отрицательная запись истории, newCustomer=false, очистка запроса списания; не начислять кэшбэк.
- [x] Добавить адаптивные стили формы/подтверждения в prototype.css; поднять версии ресурсов. Проверить форму браузером на телефоне и десктопе.
- [x] npm test, node --check, git diff --check. Обновить README, сохранить коммит, отправить в main и проверить опубликованный результат.
