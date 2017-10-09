const setId = /sets\/(\d*)/.exec(window.location.href)[1];
const heading = document.querySelector('h2')
practicifySet(heading, setId)
exposeData(null, heading)