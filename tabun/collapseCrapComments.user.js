// ==UserScript==
// @name         Collapse Crap Comments
// @description  Прячет горы стародавних срачей
// @version      0.3
// @author       stsyn
// @include      /https:\/\/tabun\.everypony\..*\/blog\/.*\d+\.html.*/
// @include      /https:\/\/tabun\.andreymal\.org\/blog\/.*\d+\.html.*/
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // от скольки комментариев должно быть в ветке, чтобы ее скрывать
  const commentLimit = 15;

  // замените на false, если вам не нужно принудительное отображение новых комментов
  const alwaysShowNewComments = true;

  // замените на false, если вам не нужно принудительное отображение сегодняшних комментов (НЕ сутки)
  const alwaysShowTodaysComments = true;

  // а сюда не лезь
  const now = new Date();
  const dateString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T`;
  const anchor = (location.hash || '').substring(1);
  function go(container) {
    Array.from(container.childNodes)
      .filter(elem =>
        elem.classList &&
        elem.classList.contains('comment-wrapper') &&
        elem.getElementsByClassName('comment').length + 1 >= commentLimit &&
        !(anchor && elem.querySelector(`a[name="${anchor}"]`)) &&
        !elem.closest('.h-hidden'))
      .forEach(elem => {
        if (
          !(alwaysShowNewComments && elem.querySelector('.comment.comment-new, .comment.comment-current')) &&
          !(alwaysShowTodaysComments && elem.querySelector(`time[datetime*="${dateString}"]`)) &&
          true) {
          Array.from(elem.childNodes)
            .filter(elem =>
              elem.classList &&
              elem.classList.contains('comment-wrapper'))
            .forEach(wrap => wrap.classList.add('h-hidden'))
          elem.getElementsByClassName('folding')[0].classList.add('folded');
        } else {
          go(elem);
        }
    });
  }

  go(document.getElementById('comments'));
  if (anchor && document.querySelector(`a[name="${anchor}"]`)) {
    document.querySelector(`a[name="${anchor}"]`).scrollIntoView();
  }
})();
