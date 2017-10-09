const setId = /sets\/(\d*)/.exec(window.location.href)[1];
const heading = document.querySelector('h2')
practicifySet(heading, setId);

[...heading.querySelectorAll('button')].slice(0, 2).forEach(button => button.addEventListener('click', () => {
	setTimeout(() => window.location = `/members/${memberId}/sets`, 200);
}))
exposeData(null, heading)