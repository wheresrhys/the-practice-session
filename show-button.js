const memberId = /members\/(\d*)/.exec(window.location.href)[1];

function loadAllSets () {
  const list = document.querySelector('#results .manifest-inventory');
  list.classList.remove('split')
  return fetch(`https://thesession.org/members/${memberId}/sets?format=json`)
    .then(res => res.json())
    .then(res => res.pages)
    .then(pageCount => {
      return Promise.all([...Array(pageCount-1)]
        .map((val, i) => i + 2)
        .map(pageNum =>
          fetch(`https://thesession.org/members/${memberId}/sets?page=${pageNum}&format=json`)
            .then(res => res.json())
            .then(page => {
              list.insertAdjacentHTML('beforeend', page.sets.map(set => `
                 <li class="manifest-item" tabindex="-1">
                <a href="/members/61738/sets/${set.id}">
                <span class="manifest-item-title">
                ${set.name}</span><!-- /.manifest-item-title -->
                </a>
                </li>
              `).join('\n'))
            })
        ))
    })
}

function changePriority (setId, amount) {
  chrome.storage.sync.get(setId, map => {
    const valToStore = {}
    valToStore[setId] = (map[setId] || 0 ) + amount
     document.querySelector(`[data-set-id="${setId}"]`)
      .setAttribute('data-sort-val', valToStore[setId]);

    sortSets();

    chrome.storage.sync.set(valToStore);
  });
}

function pinSet (setId) {
  chrome.storage.sync.get('pin', map => {
    const pinnedItems = map.pin || [];
    pinnedItems.unshift(setId);
    const newPinnedItems = pinnedItems
      .filter((id, i) => !pinnedItems.slice(0, i).includes(id))
      .slice(0, 5)

    document.querySelectorAll('[data-is-pinned]')
      .forEach(el => {
        if(!newPinnedItems.includes(el.dataset.setId)) {
          el.removeAttribute('data-is-pinned');
        }
      })

    document.querySelector(`[data-set-id="${setId}"]`)
      .setAttribute('data-is-pinned', '');

    sortSets();

    chrome.storage.sync.set({
      pin: newPinnedItems
    });
  });
}

function getSetId (button) {
  return button.parentNode.parentNode.dataset.setId
}

function practicifySet (li) {
  const setId = li.querySelector('a').href.split('sets/')[1];
  li.setAttribute('data-set-id', setId);
  const buttons = document.createElement('div');
  const good = document.createElement('button');
  good.textContent = 'nailed it!';
  good.className = 'good';
  const bad = document.createElement('button');
  bad.textContent = 'needs work';
  bad.className = 'bad';
  const pin = document.createElement('button');
  pin.textContent = 'pin to top';
  pin.className = 'pin';
  buttons.appendChild(good);
  buttons.appendChild(bad);
  buttons.appendChild(pin);
  li.appendChild(buttons);
  good.addEventListener('click', ev => changePriority(getSetId(ev.target), -1));
  bad.addEventListener('click', ev => changePriority(getSetId(ev.target), 1));
  pin.addEventListener('click', ev => pinSet(getSetId(ev.target)));
}

async function exposeSortData (pinnedSets, li) {
  const setId = li.dataset.setId;
  const sortVal = await dataPromise(li.dataset.setId, 0);

  li.setAttribute('data-sort-val', sortVal);
  if (pinnedSets.includes(setId)) {
    li.setAttribute('data-is-pinned', '');
  }
}

function dataPromise (key, defaultValue) {
  return new Promise((res, rej) => {
    chrome.storage.sync.get(key, map => {
      res(map[key] || defaultValue);
    })
  })
}

function getPinnedSets () {
  chrome.storage.sync.get('pin', map => {
    console.log(map)
    const pinnedItems = map.pin || [];
    pinnedItems.unshift(setId);
    chrome.storage.sync.set({
      pin: pinnedItems
        .filter((id, i) => !pinnedItems.slice(0, i).includes(id))
        .slice(0, 5)
    });
  });
}

function sortSets (sets) {
  sets = sets || [...document.querySelectorAll('#results .manifest-inventory>li')];
  sets.sort((el1, el2) => {
    const val1 = el1.dataset.sortVal;
    const val2 = el2.dataset.sortVal;
    const isPinned1 = el1.hasAttribute('data-is-pinned');
    const isPinned2 = el2.hasAttribute('data-is-pinned');
    return isPinned1 && !isPinned2 ? -1 : !isPinned1 && isPinned2 ? 1 :
      val1 > val2 ? -1 : val1 < val2 ? 1: 0;
  })
  const list = document.querySelector('#results .manifest-inventory')
  sets.forEach(set => list.appendChild(set));
}

async function initPracticeSession () {
  document.querySelector('.pagination').remove();
  await loadAllSets();
  const sets = [...document.querySelectorAll('#results .manifest-inventory>li')];
  sets.map(practicifySet);
  const pinnedSets = await dataPromise('pin', []);
  await Promise.all(sets.map(exposeSortData.bind(null, pinnedSets)))
  sortSets(sets);
}

function initPracticeSessionButton () {
  const results = document.getElementById('results');
  const button = document.createElement('button');
  button.textContent = 'practice session';
  button.className = 'practice-session__init-button'
  results.insertBefore(button, results.firstElementChild);
  button.addEventListener('click', initPracticeSession)
}

initPracticeSessionButton()
initPracticeSession()