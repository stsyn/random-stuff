// ==UserScript==
// @name         Two tabuns in one
// @version      0.9
// @description  Taking comments from backup
// @author       stsyn
// @match        https://tabun.everypony.ru/*
// @match        https://tabun.everypony.info/*
// @match        https://tabun.everypony.online/*
// @match        https://tabun.everypony.me/*
// @match        https://tabun.me/*

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
      createElement('a', { id: `comment${stuff.id}` }),
      createElement('div.comment-content', { id: `comment_content_id_${stuff.id}`, style: 'margin-bottom: 6px;' }, [
        createElement('div.text.current', stuff.content)
      ]),
      createElement('div.comment-info', [
        createElement('span.user-with-avatar.size-1', [
          createElement('a', { href: stuff.authorLink }, [
            createElement('img.avatar', { src: stuff.authorAvatar }),
            createElement('span.nickname', [
              stuff.authorName || ''
            ]),
          ]),
        ]),
        createElement('span.comment-date', [
          createElement('time', { title: stuff.time, itemprop: "dateCreated" /* datetime: does this matter again? */ }, stuff.time),
        ]),
        createElement('div.comment-favourite', { style: "margin:-8px;" }), /* It shall not work anymore, due to backed changes; but "Back to reply" icon would rely on this div */
        createElement('a.comment-link', { href: `#comment${stuff.id}`, title: 'Ссылка на комментарий' }),
        !stuff.parentId ? '' : createElement('a.goto.goto-comment-parent', {
          href: `#comment${stuff.parentId}`,
          title: 'Ответ на',
          events: { click: x => {
            x.preventDefault();
            unsafeWindow.ls.comments.goToParentComment(stuff.id, stuff.parentId);
          }}}, '↑'
        ),
        createElement('div.comment-actions', [
          /*createElement('a.reply-link.link-dotted.active', 'Ответить'),*/
          /* We won't createElement('a.link-dotted.comment-delete'), */
          /* and also won't createElement('a.link-dotted.comment-edit-bw.edit-timeout'):
          /* we can't check if it's possible or not, also don't allow to edit/delete downvoted cringe for historical purposes */
          createElement('div.vote-wrapper', [
            createElement('div.vote', { id: `vote_area_comment_${stuff.id}`, className: stuff.voteClassName }, [
              /* Seems like we don't know if we have voted or not on certain comment, colorize arrows to let us see that */
              /*createElement('div.vote-item.vote-up', { style: 'opacity: .35', events: { click: x => {
                x.preventDefault();
                unsafeWindow.ls.vote.vote(stuff.id, unsafeWindow, 1, 'comment');
              }}}),*/
              createElement('span.vote-count', { id: `vote_total_comment_${stuff.id}`, dataset: {
                target_id: stuff.id, target_type: "comment", count: 69420 /* we don't know actual votes count, so assume there are more than zero */
              }}, '≤' + stuff.voteCount) /* Vote count in deleted comments are inaccurate */
              /*createElement('div.vote-item.vote-down', { style: 'opacity: .35', events: { click: x => {
                x.preventDefault();
                unsafeWindow.ls.vote.vote(stuff.id, unsafeWindow, -1, 'comment');
              }}}),*/
            ]),
          ]),
        ]),
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
