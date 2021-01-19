// ==UserScript==
// @name         Two tabuns in one
// @version      0.5
// @description  Taking comments from backup
// @author       stsyn
// @match        https://tabun.everypony.ru/*

// @require      https://github.com/stsyn/derpibooruscripts/raw/master/YouBooru/libs/CreateElement.js
// @downloadURL  https://github.com/stsyn/random-stuff/raw/master/tabun/helloFromBackup.user.js
// @updateURL    https://github.com/stsyn/random-stuff/raw/master/tabun/helloFromBackup.user.js

// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js

// @connect      tabun.andreymal.org
// @grant        unsafeWindow

// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
  'use strict';
  const mirror = 'https://tabun.andreymal.org';
  const modClass = 'not_that_bad_actually';
  const urlPath = location.pathname;
  const isPost = urlPath.match(/\/[a-z0-9_\-]+\//);
  let mirrorContent;

  function HiddenCommentTemplate(stuff) {
    return [
      createElement('a', { name: `comment${stuff.id}` }),
      createElement('div.folding', { dataset: { id: stuff.id } }),
      createElement('div.comment-content', { id: `comment_content_id_${stuff.id}` }, [
        createElement('div.text.current', stuff.content)
      ]),
      createElement('ul.comment-info', [
        createElement('li.comment-author', [
          createElement('a', { href: stuff.authorLink }, [
            createElement('img.comment-avatar', { src: stuff.authorAvatar }),
            stuff.authorName || ''
          ])
        ]),
        createElement('li.comment-date', stuff.time),
        createElement('li.vote.ready', { id: `vote_area_comment_${stuff.id}`, className: stuff.voteClassName }, [
          createElement('div.vote-up', { events: { click: x => {
            x.preventDefault();
            unsafeWindow.ls.vote.vote(stuff.id, unsafeWindow, 1, 'comment');
          }}}),
          createElement('span.vote-count', { id: `vote_total_comment_${stuff.id}` }, stuff.voteCount),
          createElement('div.vote-down', { events: { click: x => {
            x.preventDefault();
            unsafeWindow.ls.vote.vote(stuff.id, unsafeWindow, -1, 'comment');
          }}}),
        ]),
        createElement('li.comment-favourite', [
          createElement('div.favourite', {
            events: { click: x => {
              x.preventDefault();
              unsafeWindow.ls.favourite.toggle(stuff.id, unsafeWindow, 'comment');
            }}}, 'В избранное')
        ]),
        createElement('li.comment-link', [
          createElement('a', { href: `#comment${stuff.id}`, title: 'Ссылка на комментарий' }, [
            createElement('i.icon-synio-link')
          ])
        ]),
        !stuff.parentId ? '' : createElement('li.goto.goto-comment-parent', [
          createElement('a', {
            href: `/comments/${stuff.parentId}`,
            title: 'Ответ на',
            events: { click: x => {
              x.preventDefault();
              unsafeWindow.ls.comments.goToParentComment(stuff.id, stuff.parentId);
            }}}, '↑')
        ]),
        createElement('li.goto.goto-comment-child', [
          createElement('a', { href: '#', title: 'Обратно к ответу' }, '↓')
        ]),
      ])
    ]
  }

  function getPostFromMirror() {
    GM.xmlHttpRequest({
      method: 'GET',
      url: mirror + urlPath,
      onload: response => {
        handleResponse(response.responseText);
        processComments();
      }
    });
  }

  function processComments() {
    Array.from(document.querySelectorAll(`.comment-bad:not(._comment-${modClass}), .comment-deleted:not(._comment-${modClass})`)).forEach(item => {
      if (item.querySelector('.vote')) return;
      const id = parseInt(item.dataset.id);
      const sameComment = mirrorContent.querySelector('#comment' + id);
      const votes = sameComment.querySelector('li.vote').classList;
      let parentId, parentLink;
      if (parentLink = sameComment.querySelector('.goto.goto-comment-parent>a')) {
        parentId = parseInt(parentLink.href.split('#').pop().substring(7));
      }
      votes.remove('vote');
      votes.remove('ready');
      item.classList.add('_comment-' + modClass);
      item.innerHTML = '';
      HiddenCommentTemplate({
        id,
        content: Array.from(sameComment.querySelector('.text').childNodes).map(node => {
          if (node.nodeType === 3) return node.textContent;
          return node;
        }),
        authorAvatar: sameComment.querySelector('.comment-avatar').src,
        authorLink: sameComment.querySelector('.comment-author>a').href,
        authorName: sameComment.querySelector('.comment-author>a:last-child').innerText,
        time: sameComment.querySelector('.comment-date>time').innerText,
        voteCount: sameComment.querySelector('.vote-count').innerText,
        voteClassName: votes.value,
        parentId,
      }).forEach(elem => item.appendChild(elem));
    });
  }

  function handleResponse(response) {
    const parser = new DOMParser();
    mirrorContent = parser.parseFromString(response, 'text/html');
  }

  if (isPost) {
    getPostFromMirror();
  }
})();
