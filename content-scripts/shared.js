const memberId = /members\/(\d*)/.exec(window.location.href)[1];


function scoreToEpithet (score) {
  return score > 0 ? 'good' : score < 3 ? 'awful' : score < 0 ? 'bad' : 'ok'
}

// adjusts last practiced date by +/- days determined by score
function calculateSortScore (lastPracticed, score) {
  return lastPracticed + ((score || 0) * 24*60*60*1000);
}

function practicifySet (el, setId, inList) {
  setId = setId || el.querySelector('a').href.split('sets/')[1];
  el.setAttribute('data-set-id', setId);
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
  el.appendChild(buttons);
  good.addEventListener('click', ev => changePriority(getSetId(ev.target), 2, inList));
  bad.addEventListener('click', ev => changePriority(getSetId(ev.target), -1, inList));
  pin.addEventListener('click', ev => pinSet(getSetId(ev.target), inList));
}

function safeScoreGet (obj) {
  if (typeof obj === 'object' && typeof obj.score === 'number') {
    return obj.score
  }
  return 0
}

function changePriority (setId, amount, inList) {
  chrome.storage.sync.get(setId, map => {
    const valToStore = {}
    valToStore[setId] = {
      score: safeScoreGet(map[setId]) + amount,
      lastPracticed: Date.now()
    };


    const el = document.querySelector(`[data-set-id="${setId}"]`)
    el.setAttribute('data-sort-order', calculateSortScore(valToStore[setId].lastPracticed || 0, valToStore[setId].score));
    el.setAttribute('data-score', scoreToEpithet(valToStore[setId].score));

    inList && sortSets();

    chrome.storage.sync.set(valToStore);
  });
}


function pinSet (setId, inList) {
  chrome.storage.sync.get('pin', map => {
    const pinnedItems = map.pin || [];
    let newPinnedItems;
    if (pinnedItems.includes(setId)) {
      newPinnedItems = pinnedItems.slice();
      newPinnedItems.splice(pinnedItems.indexOf(setId), 1)
    } else {
      pinnedItems.unshift(setId);
      newPinnedItems = pinnedItems
        .filter((id, i) => !pinnedItems.slice(0, i).includes(id))
        .slice(0, 5)
      document.querySelector(`[data-set-id="${setId}"]`)
        .setAttribute('data-is-pinned', '')
    }

    if (inList) {
      document.querySelectorAll('[data-is-pinned]')
        .forEach(el => {
          if(!newPinnedItems.includes(el.dataset.setId)) {
            el.removeAttribute('data-is-pinned');
          }
        })

      sortSets();
    }
    chrome.storage.sync.set({
      pin: newPinnedItems
    });
  });
}

function getSetId (button) {
  return button.parentNode.parentNode.dataset.setId
}