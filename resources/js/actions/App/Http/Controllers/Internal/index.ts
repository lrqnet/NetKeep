import CaddyDomainController from './CaddyDomainController';
import OxidizedNodesController from './OxidizedNodesController';
import SandboxNodesController from './SandboxNodesController';

const Internal = {
    CaddyDomainController: Object.assign(
        CaddyDomainController,
        CaddyDomainController,
    ),
    OxidizedNodesController: Object.assign(
        OxidizedNodesController,
        OxidizedNodesController,
    ),
    SandboxNodesController: Object.assign(
        SandboxNodesController,
        SandboxNodesController,
    ),
};

export default Internal;
