import './styles.css';

const app = document.createElement('main');
app.id = 'app';

const sceneHost = document.createElement('div');
sceneHost.id = 'scene-canvas-host';
sceneHost.setAttribute('aria-hidden', 'true');

const uiRoot = document.createElement('section');
uiRoot.id = 'ui-root';
uiRoot.setAttribute('aria-live', 'polite');

const status = document.createElement('p');
status.className = 'preparation-status';
status.textContent = '月光虚境正在准备';

uiRoot.append(status);
app.append(sceneHost, uiRoot);
document.body.append(app);
