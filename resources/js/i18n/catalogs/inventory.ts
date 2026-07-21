import { defineMessages } from './define-messages';

export const inventoryMessages = defineMessages({
    'devices.title': {
        en: 'Devices',
        pt_BR: 'Equipamentos',
        es: 'Equipos',
    },
    'devices.inventory': {
        en: 'Inventory',
        pt_BR: 'Inventário',
        es: 'Inventario',
    },
    'devices.count_description': {
        en: '{{total}} registered nodes. Deletions are logical and never remove history.',
        pt_BR: '{{total}} nós cadastrados. Exclusões são lógicas e nunca removem o histórico.',
        es: '{{total}} nodos registrados. Las eliminaciones son lógicas y nunca borran el historial.',
    },
    'devices.export_csv': {
        en: 'Export CSV',
        pt_BR: 'Exportar CSV',
        es: 'Exportar CSV',
    },
    'devices.import_csv': {
        en: 'Import CSV',
        pt_BR: 'Importar CSV',
        es: 'Importar CSV',
    },
    'devices.search_placeholder': {
        en: 'Search by name, IP or hostname',
        pt_BR: 'Buscar por nome, IP ou hostname',
        es: 'Buscar por nombre, IP o hostname',
    },
    'devices.empty': {
        en: 'No devices found',
        pt_BR: 'Nenhum equipamento encontrado',
        es: 'No se encontraron equipos',
    },
    'devices.empty_hint': {
        en: 'Use the form beside the list or import a CSV.',
        pt_BR: 'Use o formulário ao lado ou importe um CSV.',
        es: 'Usa el formulario junto a la lista o importa un CSV.',
    },
    'devices.device': {
        en: 'Device',
        pt_BR: 'Equipamento',
        es: 'Equipo',
    },
    'devices.model': {
        en: 'Model',
        pt_BR: 'Modelo',
        es: 'Modelo',
    },
    'devices.group_site': {
        en: 'Group / Site',
        pt_BR: 'Grupo / Site',
        es: 'Grupo / Sitio',
    },
    'devices.state': {
        en: 'State',
        pt_BR: 'Estado',
        es: 'Estado',
    },
    'devices.history': {
        en: 'History',
        pt_BR: 'Histórico',
        es: 'Historial',
    },
    'devices.collect_now': {
        en: 'Collect now',
        pt_BR: 'Coletar agora',
        es: 'Recolectar ahora',
    },
    'devices.approve': {
        en: 'Review and approve device',
        pt_BR: 'Revisar e aprovar equipamento',
        es: 'Revisar y aprobar equipo',
    },
    'devices.revoke_approval': {
        en: 'Revoke technical approval',
        pt_BR: 'Revogar aprovação técnica',
        es: 'Revocar aprobación técnica',
    },
    'approval.pending': {
        en: 'Awaiting approval',
        pt_BR: 'Aguardando aprovação',
        es: 'Esperando aprobación',
    },
    'approval.approved': {
        en: 'Approved',
        pt_BR: 'Aprovado',
        es: 'Aprobado',
    },
    'approval.revoked': {
        en: 'Approval revoked',
        pt_BR: 'Aprovação revogada',
        es: 'Aprobación revocada',
    },
    'approval.host_key_changed': {
        en: 'SSH key changed',
        pt_BR: 'Chave SSH alterada',
        es: 'Clave SSH modificada',
    },
    'devices.manual_collection_title': {
        en: 'Confirm manual collection',
        pt_BR: 'Confirmar coleta manual',
        es: 'Confirmar recolección manual',
    },
    'devices.manual_collection_description': {
        en: 'The request enters the NetKeep queue and respects global, site, and device limits.',
        pt_BR: 'A solicitação entra na fila do NetKeep e respeita os limites globais, do site e do equipamento.',
        es: 'La solicitud entra en la cola de NetKeep y respeta los límites globales, del sitio y del equipo.',
    },
    'devices.manual_collection_warning': {
        en: 'Manual collections create a new authentication and traffic load on the device. Avoid repeated requests.',
        pt_BR: 'Coletas manuais criam uma nova autenticação e carga de tráfego no equipamento. Evite solicitações repetidas.',
        es: 'Las recolecciones manuales crean una nueva autenticación y carga de tráfico en el equipo. Evita solicitudes repetidas.',
    },
    'devices.destination': {
        en: 'Destination',
        pt_BR: 'Destino',
        es: 'Destino',
    },
    'devices.transport_driver': {
        en: 'Transport and driver',
        pt_BR: 'Transporte e driver',
        es: 'Transporte y driver',
    },
    'devices.last_collection': {
        en: 'Last collection',
        pt_BR: 'Última coleta',
        es: 'Última recolección',
    },
    'devices.next_allowed': {
        en: 'Next manual request allowed',
        pt_BR: 'Próxima solicitação manual permitida',
        es: 'Próxima solicitud manual permitida',
    },
    'devices.force_collection': {
        en: 'Force with risk',
        pt_BR: 'Forçar com risco',
        es: 'Forzar con riesgo',
    },
    'devices.confirm_collection': {
        en: 'Queue collection',
        pt_BR: 'Enfileirar coleta',
        es: 'Encolar recolección',
    },
    'devices.disable': {
        en: 'Disable',
        pt_BR: 'Desativar',
        es: 'Desactivar',
    },
    'devices.disable_confirm': {
        en: 'Disable {{name}}? Its history will be preserved.',
        pt_BR: 'Desativar {{name}}? O histórico será preservado.',
        es: '¿Desactivar {{name}}? Su historial se conservará.',
    },
    'devices.new': {
        en: 'New device',
        pt_BR: 'Novo equipamento',
        es: 'Nuevo equipo',
    },
    'devices.ip_address': {
        en: 'IP address',
        pt_BR: 'Endereço IP',
        es: 'Dirección IP',
    },
    'devices.port': {
        en: 'Port',
        pt_BR: 'Porta',
        es: 'Puerto',
    },
    'devices.transport': {
        en: 'Transport',
        pt_BR: 'Transporte',
        es: 'Transporte',
    },
    'devices.oxidized_driver': {
        en: 'Oxidized driver',
        pt_BR: 'Driver Oxidized',
        es: 'Driver de Oxidized',
    },
    'devices.oxidized_catalog': {
        en: 'Oxidized {{version}} catalog',
        pt_BR: 'Catálogo do Oxidized {{version}}',
        es: 'Catálogo de Oxidized {{version}}',
    },
    'devices.manufacturer': {
        en: 'Manufacturer',
        pt_BR: 'Fabricante',
        es: 'Fabricante',
    },
    'devices.hardware_model': {
        en: 'Hardware model',
        pt_BR: 'Modelo físico',
        es: 'Modelo físico',
    },
    'devices.credential': {
        en: 'Credential',
        pt_BR: 'Credencial',
        es: 'Credencial',
    },
    'devices.no_profile': {
        en: 'No profile',
        pt_BR: 'Sem perfil',
        es: 'Sin perfil',
    },
    'devices.group': {
        en: 'Group',
        pt_BR: 'Grupo',
        es: 'Grupo',
    },
    'devices.site': {
        en: 'Site',
        pt_BR: 'Site',
        es: 'Sitio',
    },
    'devices.no_site': {
        en: 'No site',
        pt_BR: 'Sem site',
        es: 'Sin sitio',
    },
    'devices.tags': {
        en: 'Tags (one or more)',
        pt_BR: 'Tags (uma ou mais)',
        es: 'Etiquetas (una o más)',
    },
    'devices.add': {
        en: 'Add device',
        pt_BR: 'Adicionar equipamento',
        es: 'Agregar equipo',
    },
    'devices.edit_title': {
        en: 'Edit {{name}}',
        pt_BR: 'Editar {{name}}',
        es: 'Editar {{name}}',
    },
    'devices.edit_description': {
        en: 'Existing secrets are never returned. Leave secret fields blank to preserve their current values.',
        pt_BR: 'Segredos existentes nunca são retornados. Deixe os campos de segredo vazios para preservá-los.',
        es: 'Los secretos existentes nunca se devuelven. Deja los campos de secreto vacíos para conservarlos.',
    },
    'devices.back': {
        en: 'Back',
        pt_BR: 'Voltar',
        es: 'Volver',
    },
    'devices.data': {
        en: 'Device data',
        pt_BR: 'Dados do equipamento',
        es: 'Datos del equipo',
    },
    'devices.hostname': {
        en: 'Hostname',
        pt_BR: 'Hostname',
        es: 'Hostname',
    },
    'devices.credential_profile': {
        en: 'Credential profile',
        pt_BR: 'Perfil de credencial',
        es: 'Perfil de credencial',
    },
    'devices.forbidden': {
        en: 'Your role does not allow device changes.',
        pt_BR: 'Seu papel não permite alterar equipamentos.',
        es: 'Tu rol no permite modificar equipos.',
    },
    'devices.specific_username': {
        en: 'Device-specific username',
        pt_BR: 'Usuário específico',
        es: 'Usuario específico',
    },
    'devices.specific_password': {
        en: 'Device-specific password',
        pt_BR: 'Senha específica',
        es: 'Contraseña específica',
    },
    'devices.new_specific_password': {
        en: 'New device-specific password (already configured)',
        pt_BR: 'Nova senha específica (já configurada)',
        es: 'Nueva contraseña específica (ya configurada)',
    },
    'devices.specific_enable': {
        en: 'Device-specific enable secret',
        pt_BR: 'Enable específico',
        es: 'Enable específico',
    },
    'devices.new_specific_enable': {
        en: 'New enable secret (already configured)',
        pt_BR: 'Novo enable (já configurado)',
        es: 'Nuevo enable (ya configurado)',
    },
    'devices.backup_interval': {
        en: 'Collection interval (seconds)',
        pt_BR: 'Intervalo de coleta (segundos)',
        es: 'Intervalo de recolección (segundos)',
    },
    'devices.timeout': {
        en: 'Timeout (seconds)',
        pt_BR: 'Timeout (segundos)',
        es: 'Tiempo de espera (segundos)',
    },
    'devices.collection_risk_title': {
        en: 'Oxidized collection risk',
        pt_BR: 'Risco de coleta do Oxidized',
        es: 'Riesgo de recolección de Oxidized',
    },
    'devices.collection_risk_description': {
        en: 'Short intervals and long timeouts increase authentication attempts, traffic, and CPU use. Sensitive changes pause collection until a new technical approval.',
        pt_BR: 'Intervalos curtos e timeouts longos aumentam tentativas de autenticação, tráfego e uso de CPU. Alterações sensíveis pausam a coleta até uma nova aprovação técnica.',
        es: 'Los intervalos cortos y tiempos de espera largos aumentan las autenticaciones, el tráfico y el uso de CPU. Los cambios sensibles pausan la recolección hasta una nueva aprobación técnica.',
    },
    'devices.activation_by_approval': {
        en: 'Activation is controlled by technical approval. Saving destination, port, transport, credential, or driver changes pauses collection automatically.',
        pt_BR: 'A ativação é controlada pela aprovação técnica. Salvar alterações de destino, porta, transporte, credencial ou driver pausa a coleta automaticamente.',
        es: 'La activación está controlada por la aprobación técnica. Guardar cambios de destino, puerto, transporte, credencial o driver pausa la recolección automáticamente.',
    },
    'devices.comma_tags': {
        en: 'Comma-separated tags',
        pt_BR: 'Tags separadas por vírgula',
        es: 'Etiquetas separadas por comas',
    },
    'devices.enabled': {
        en: 'Device enabled',
        pt_BR: 'Equipamento ativo',
        es: 'Equipo activo',
    },
    'devices.remove_secrets': {
        en: 'Remove secrets from this device’s backups',
        pt_BR: 'Remover segredos neste equipamento',
        es: 'Eliminar secretos de los respaldos de este equipo',
    },
    'devices.save': {
        en: 'Save changes',
        pt_BR: 'Salvar alterações',
        es: 'Guardar cambios',
    },
    'config.title': {
        en: 'Configuration · {{name}}',
        pt_BR: 'Configuração · {{name}}',
        es: 'Configuración · {{name}}',
    },
    'config.git_history': {
        en: 'Git history',
        pt_BR: 'Histórico Git',
        es: 'Historial Git',
    },
    'config.download': {
        en: 'Download configuration',
        pt_BR: 'Baixar configuração',
        es: 'Descargar configuración',
    },
    'config.versions': {
        en: 'Versions',
        pt_BR: 'Versões',
        es: 'Versiones',
    },
    'config.no_versions': {
        en: 'There are no versions for this device yet.',
        pt_BR: 'Ainda não há versões para este equipamento.',
        es: 'Aún no hay versiones para este equipo.',
    },
    'config.current': {
        en: 'Current configuration',
        pt_BR: 'Configuração atual',
        es: 'Configuración actual',
    },
    'config.current_badge': {
        en: 'current',
        pt_BR: 'atual',
        es: 'actual',
    },
    'config.compare': {
        en: 'Compare',
        pt_BR: 'Comparar',
        es: 'Comparar',
    },
    'config.awaiting_first': {
        en: '# The first collection has not completed yet.',
        pt_BR: '# A primeira coleta ainda não foi concluída.',
        es: '# La primera recolección aún no ha finalizado.',
    },
    'credentials.title': {
        en: 'Credentials',
        pt_BR: 'Credenciais',
        es: 'Credenciales',
    },
    'credentials.secure_access': {
        en: 'Secure access',
        pt_BR: 'Acesso seguro',
        es: 'Acceso seguro',
    },
    'credentials.profiles': {
        en: 'Credential profiles',
        pt_BR: 'Perfis de credenciais',
        es: 'Perfiles de credenciales',
    },
    'credentials.description': {
        en: 'Reusable secrets encrypted at rest. Existing values are never returned to the browser.',
        pt_BR: 'Segredos reutilizáveis, criptografados em repouso. Valores existentes nunca retornam para o navegador.',
        es: 'Secretos reutilizables cifrados en reposo. Los valores existentes nunca se devuelven al navegador.',
    },
    'credentials.empty': {
        en: 'No profiles created',
        pt_BR: 'Nenhum perfil criado',
        es: 'No hay perfiles creados',
    },
    'credentials.empty_hint': {
        en: 'Create a profile to avoid repeating credentials for each device.',
        pt_BR: 'Crie um perfil para não repetir credenciais por equipamento.',
        es: 'Crea un perfil para no repetir credenciales en cada equipo.',
    },
    'credentials.no_username': {
        en: 'No username defined',
        pt_BR: 'Sem usuário definido',
        es: 'Sin usuario definido',
    },
    'credentials.password_badge': {
        en: 'password',
        pt_BR: 'senha',
        es: 'contraseña',
    },
    'credentials.ssh_key_badge': {
        en: 'SSH key',
        pt_BR: 'chave SSH',
        es: 'clave SSH',
    },
    'credentials.device_count': {
        en: '{{total}} devices',
        pt_BR: '{{total}} equipamentos',
        es: '{{total}} equipos',
    },
    'credentials.remove_confirm': {
        en: 'Remove {{name}}?',
        pt_BR: 'Remover {{name}}?',
        es: '¿Eliminar {{name}}?',
    },
    'credentials.new': {
        en: 'New profile',
        pt_BR: 'Novo perfil',
        es: 'Nuevo perfil',
    },
    'credentials.profile_name': {
        en: 'Profile name',
        pt_BR: 'Nome do perfil',
        es: 'Nombre del perfil',
    },
    'credentials.profile_placeholder': {
        en: 'Example: Backbone routers',
        pt_BR: 'Ex.: Routers backbone',
        es: 'Ej.: Routers de backbone',
    },
    'credentials.username': {
        en: 'Username',
        pt_BR: 'Usuário',
        es: 'Usuario',
    },
    'credentials.private_key': {
        en: 'Private SSH key',
        pt_BR: 'Chave SSH privada',
        es: 'Clave SSH privada',
    },
    'credentials.key_passphrase': {
        en: 'Key passphrase',
        pt_BR: 'Passphrase da chave',
        es: 'Frase de contraseña de la clave',
    },
    'credentials.save_encrypted': {
        en: 'Save encrypted',
        pt_BR: 'Salvar com criptografia',
        es: 'Guardar cifrado',
    },
    'catalog.title': {
        en: 'Catalogs',
        pt_BR: 'Catálogos',
        es: 'Catálogos',
    },
    'catalog.description': {
        en: 'Standardize sites, groups, tags, manufacturers and hardware models used by devices.',
        pt_BR: 'Padronize sites, grupos, tags, fabricantes e modelos físicos usados pelos equipamentos.',
        es: 'Estandariza sitios, grupos, etiquetas, fabricantes y modelos físicos usados por los equipos.',
    },
    'catalog.sites': {
        en: 'Sites',
        pt_BR: 'Sites',
        es: 'Sitios',
    },
    'catalog.location': {
        en: 'Location',
        pt_BR: 'Localização',
        es: 'Ubicación',
    },
    'catalog.groups': {
        en: 'Groups',
        pt_BR: 'Grupos',
        es: 'Grupos',
    },
    'catalog.secret_removal_active': {
        en: 'Secret removal enabled',
        pt_BR: 'Remoção de segredos ativa',
        es: 'Eliminación de secretos activada',
    },
    'catalog.full_configuration': {
        en: 'Full configuration',
        pt_BR: 'Configuração completa',
        es: 'Configuración completa',
    },
    'catalog.remove_secrets': {
        en: 'Remove secrets from backups',
        pt_BR: 'Remover segredos nos backups',
        es: 'Eliminar secretos de los respaldos',
    },
    'catalog.tags': {
        en: 'Tags',
        pt_BR: 'Tags',
        es: 'Etiquetas',
    },
    'catalog.color': {
        en: 'Color',
        pt_BR: 'Cor',
        es: 'Color',
    },
    'catalog.manufacturers': {
        en: 'Manufacturers',
        pt_BR: 'Fabricantes',
        es: 'Fabricantes',
    },
    'catalog.official_site': {
        en: 'Official website',
        pt_BR: 'Site oficial',
        es: 'Sitio oficial',
    },
    'catalog.hardware_models': {
        en: 'Hardware models',
        pt_BR: 'Modelos físicos',
        es: 'Modelos físicos',
    },
    'catalog.no_manufacturer': {
        en: 'No manufacturer',
        pt_BR: 'Sem fabricante',
        es: 'Sin fabricante',
    },
    'catalog.suggested_driver': {
        en: 'Suggested Oxidized driver',
        pt_BR: 'Driver Oxidized sugerido',
        es: 'Driver de Oxidized sugerido',
    },
    'catalog.empty': {
        en: 'No items registered.',
        pt_BR: 'Nenhum item cadastrado.',
        es: 'No hay elementos registrados.',
    },
    'catalog.remove_confirm': {
        en: 'Remove {{name}}?',
        pt_BR: 'Remover {{name}}?',
        es: '¿Eliminar {{name}}?',
    },
});
