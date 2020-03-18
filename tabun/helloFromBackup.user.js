// ==UserScript==
// @name         Two tabuns in one
// @version      0.1
// @description  Taking comments from backup
// @author       stsyn
// @match        https://tabun.everypony.ru/*

// @require      https://github.com/stsyn/derpibooruscripts/raw/master/YouBooru/libs/CreateElement.js
// @downloadURL  https://github.com/stsyn/random-stuff/raw/master/tabun/helloFromBackup.user.js
// @updateURL    https://github.com/stsyn/random-stuff/raw/master/tabun/helloFromBackup.user.js

// @connect      tabun.andreymal.org
// @grant        unsafeWindow
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
          createElement('div.vote-up', { events: { click: () => unsafeWindow.vote.vote(stuff.id, unsafeWindow, 1, 'comment')}}),
          createElement('span.vote-count', { id: `vote_total_comment_${stuff.id}` }, stuff.voteCount),
          createElement('div.vote-down', { events: { click: () => unsafeWindow.vote.vote(stuff.id, unsafeWindow, -1, 'comment')}}),
        ]),
      ])
    ]
  }

  function getPostFromMirror() {
    GM_xmlhttpRequest({
      method: 'GET',
      url: mirror + urlPath,
      onload: response => {
        handleResponse(response.responseText);
        processComments();
      }
    });
  }

  function processComments() {
    Array.from(document.querySelectorAll(`.comment-bad:not(._comment-${modClass})`)).forEach(item => {
      if (item.querySelector('.vote')) return;
      const id = parseInt(item.dataset.id);
      const sameComment = mirrorContent.querySelector('#comment' + id);
      item.classList.add('_comment-' + modClass);
      item.innerHTML = '';
      HiddenCommentTemplate({
        id,
        content: Array.from(sameComment.querySelector('.text').children),
        authorAvatar: sameComment.querySelector('.comment-avatar').src,
        authorLink: sameComment.querySelector('.comment-author>a').href,
        authorName: sameComment.querySelector('.comment-author>a:last-child').innerText,
        time: sameComment.querySelector('.comment-date>time').innerText,
        voteCount: sameComment.querySelector('.vote-count').innerText,
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
