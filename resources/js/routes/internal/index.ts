import caddy from './caddy';
import oxidized from './oxidized';

const internal = {
    caddy: Object.assign(caddy, caddy),
    oxidized: Object.assign(oxidized, oxidized),
};

export default internal;
