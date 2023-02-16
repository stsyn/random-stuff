// ==UserScript==
// @name         Two tabuns in one
// @version      0.7
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
      createElement('div.comment-content', { id: `comment_content_id_${stuff.id}` }, [
        createElement('div.text.current', stuff.content)
      ]),
      createElement('div.comment-info', { dataset: { id: stuff.id } },
      [
        createElement('a', { href: stuff.authorLink }, [
          createElement('img.comment-avatar', { src: stuff.authorAvatar }),
        ]),
        createElement('a.comment-author', { href: stuff.authorLink, dataset: { /* user_id: we don't know it, does this matter? */ } }, [
          stuff.authorName || ''
        ]),
        createElement('time.comment-date', { title: stuff.time, /* datetime: does this matter again? */ }, stuff.time),
        createElement('a.comment-link', { href: `#comment${stuff.id}`, title: 'Ссылка на комментарий' }),
        !stuff.parentId ? '' : createElement('a.goto.goto-comment-parent', {
          href: `/comments/#comment${stuff.parentId}`,
          title: 'Ответ на',
          events: { click: x => {
            x.preventDefault();
            unsafeWindow.ls.comments.goToParentComment(stuff.id, stuff.parentId);
          }}}, '↑'),
        createElement('div.comment-favourite', [
          createElement('div.favourite.link-dotted', { title: 'Добавится, только если уже нет в избранном',
            events: { click: x => {
              x.preventDefault();
              unsafeWindow.ls.favourite.toggle(stuff.id, unsafeWindow, 'comment');
            }}}, 'В избранное'),
          /* We won't createElement('span.favourite-count'): we can't check favourites count using andreymal's backup */
        ]),
        createElement('div.vote', { id: `vote_area_comment_${stuff.id}`, className: stuff.voteClassName }, [
          /* Seems like we don't know if we have voted or not on certain comment, colorize arrows to let us see that */
          createElement('div.vote-item.vote-up', { style: 'opacity: .35', events: { click: x => {
            x.preventDefault();
            unsafeWindow.ls.vote.vote(stuff.id, unsafeWindow, 1, 'comment');
          }}}),
          createElement('span.vote-count', { id: `vote_total_comment_${stuff.id}`, dataset: {
            target_id: stuff.id, target_type: "comment", count: 69420 /* we don't know actual votes count, so assume there are more than zero */
          }}, '≤' + stuff.voteCount), /* Vote count in deleted comments are inaccurate */
          createElement('div.vote-item.vote-down', { style: 'opacity: .35', events: { click: x => {
            x.preventDefault();
            unsafeWindow.ls.vote.vote(stuff.id, unsafeWindow, -1, 'comment');
          }}}),
        ]),
        createElement('a.reply-link.link-dotted', 'Ответить'),
        /* We won't createElement('a.link-dotted.comment-delete'), */
        /* and also won't createElement('a.link-dotted.comment-edit-bw.edit-timeout'):
        /* we can't check if it's possible or not, also don't allow to edit/delete downvoted cringe for historical purposes */
        createElement('div', { style: 'color: #999' }, '(удалённый коммент)')
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
