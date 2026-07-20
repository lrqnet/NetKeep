import CaddyDomainController from './CaddyDomainController';
import OxidizedNodesController from './OxidizedNodesController';

const Internal = {
    CaddyDomainController: Object.assign(
        CaddyDomainController,
        CaddyDomainController,
    ),
    OxidizedNodesController: Object.assign(
        OxidizedNodesController,
        OxidizedNodesController,
    ),
};

export default Internal;
