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
    'devices.configurations': {
        en: 'Configurations',
        pt_BR: 'Configurações',
        es: 'Configuraciones',
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
    'devices.sections': {
        en: 'Device sections',
        pt_BR: 'Seções do equipamento',
        es: 'Secciones del equipo',
    },
    'devices.configuration_tab': {
        en: 'Configuration',
        pt_BR: 'Configuração',
        es: 'Configuración',
    },
    'devices.collections_tab': {
        en: 'Collections',
        pt_BR: 'Coletas',
        es: 'Recolecciones',
    },
    'collections.history': {
        en: 'Collection history',
        pt_BR: 'Histórico de coletas',
        es: 'Historial de recolecciones',
    },
    'collections.details': {
        en: 'Run details',
        pt_BR: 'Detalhes da execução',
        es: 'Detalles de la ejecución',
    },
    'collections.select_run': {
        en: 'Select a run to view its safe timeline.',
        pt_BR: 'Selecione uma execução para ver a timeline segura.',
        es: 'Selecciona una ejecución para ver su línea de tiempo segura.',
    },
    'collections.empty': {
        en: 'No collection runs match these filters.',
        pt_BR: 'Nenhuma coleta corresponde a estes filtros.',
        es: 'Ninguna recolección coincide con estos filtros.',
    },
    'collections.all': {
        en: 'All',
        pt_BR: 'Todos',
        es: 'Todos',
    },
    'collections.status_filter': {
        en: 'Status',
        pt_BR: 'Status',
        es: 'Estado',
    },
    'collections.origin_filter': {
        en: 'Origin',
        pt_BR: 'Origem',
        es: 'Origen',
    },
    'collections.from': {
        en: 'From',
        pt_BR: 'De',
        es: 'Desde',
    },
    'collections.to': {
        en: 'To',
        pt_BR: 'Até',
        es: 'Hasta',
    },
    'collections.apply_filters': {
        en: 'Apply filters',
        pt_BR: 'Aplicar filtros',
        es: 'Aplicar filtros',
    },
    'collections.load_error': {
        en: 'Collection history could not be loaded. Try refreshing it.',
        pt_BR: 'Não foi possível carregar o histórico de coletas. Tente atualizar.',
        es: 'No se pudo cargar el historial de recolecciones. Intenta actualizarlo.',
    },
    'collections.stream_unavailable': {
        en: 'Live updates are reconnecting. Use refresh if the status does not update.',
        pt_BR: 'As atualizações ao vivo estão reconectando. Use atualizar se o status não mudar.',
        es: 'Las actualizaciones en vivo se están reconectando. Usa actualizar si el estado no cambia.',
    },
    'collections.page': {
        en: 'Page {{current}} of {{total}}',
        pt_BR: 'Página {{current}} de {{total}}',
        es: 'Página {{current}} de {{total}}',
    },
    'collections.attempt': {
        en: 'Attempt {{number}}',
        pt_BR: 'Tentativa {{number}}',
        es: 'Intento {{number}}',
    },
    'collections.system_requester': {
        en: 'System',
        pt_BR: 'Sistema',
        es: 'Sistema',
    },
    'collections.origin': {
        en: 'Origin',
        pt_BR: 'Origem',
        es: 'Origen',
    },
    'collections.status_label': {
        en: 'Status',
        pt_BR: 'Status',
        es: 'Estado',
    },
    'collections.requester': {
        en: 'Requested by',
        pt_BR: 'Solicitado por',
        es: 'Solicitado por',
    },
    'collections.attempt_label': {
        en: 'Attempt',
        pt_BR: 'Tentativa',
        es: 'Intento',
    },
    'collections.started': {
        en: 'Started',
        pt_BR: 'Início',
        es: 'Inicio',
    },
    'collections.finished': {
        en: 'Finished',
        pt_BR: 'Término',
        es: 'Fin',
    },
    'collections.duration': {
        en: 'Duration',
        pt_BR: 'Duração',
        es: 'Duración',
    },
    'collections.seconds': {
        en: '{{seconds}} seconds',
        pt_BR: '{{seconds}} segundos',
        es: '{{seconds}} segundos',
    },
    'collections.parent': {
        en: 'Parent run',
        pt_BR: 'Execução anterior',
        es: 'Ejecución anterior',
    },
    'collections.engine_reference': {
        en: 'Engine reference',
        pt_BR: 'Referência do motor',
        es: 'Referencia del motor',
    },
    'collections.timeline': {
        en: 'Timeline',
        pt_BR: 'Timeline',
        es: 'Línea de tiempo',
    },
    'collections.refresh': {
        en: 'Refresh run details',
        pt_BR: 'Atualizar detalhes da execução',
        es: 'Actualizar detalles de la ejecución',
    },
    'collections.diagnostic_title': {
        en: 'Isolated diagnostic',
        pt_BR: 'Diagnóstico isolado',
        es: 'Diagnóstico aislado',
    },
    'collections.diagnostic_warning': {
        en: 'The sandbox performs a new read-only connection and creates a raw trace that may contain full configuration and secrets. The encrypted trace expires after 24 hours. This action is audited and requires a recently confirmed password.',
        pt_BR: 'O sandbox realiza uma nova conexão somente leitura e cria um trace bruto que pode conter configuração completa e segredos. O trace criptografado expira após 24 horas. Esta ação é auditada e exige senha confirmada recentemente.',
        es: 'El sandbox realiza una nueva conexión de solo lectura y crea un trace bruto que puede contener la configuración completa y secretos. El trace cifrado vence después de 24 horas. Esta acción se audita y exige una contraseña confirmada recientemente.',
    },
    'collections.diagnostic_confirmation': {
        en: 'Type DIAGNOSTIC to confirm',
        pt_BR: 'Digite DIAGNOSTIC para confirmar',
        es: 'Escribe DIAGNOSTIC para confirmar',
    },
    'collections.start_diagnostic': {
        en: 'Start diagnostic',
        pt_BR: 'Iniciar diagnóstico',
        es: 'Iniciar diagnóstico',
    },
    'collections.raw_trace': {
        en: 'Protected raw trace',
        pt_BR: 'Trace bruto protegido',
        es: 'Trace bruto protegido',
    },
    'collections.raw_trace_warning': {
        en: 'This trace may reveal device configuration and credentials. View or download it only in a protected environment. Access is reauthenticated, audited, and never cached.',
        pt_BR: 'Este trace pode revelar configuração e credenciais do equipamento. Visualize ou baixe apenas em ambiente protegido. O acesso exige nova autenticação, é auditado e nunca armazenado em cache.',
        es: 'Este trace puede revelar la configuración y credenciales del equipo. Consúltalo o descárgalo solo en un entorno protegido. El acceso se reautentica, se audita y nunca se almacena en caché.',
    },
    'collections.expires': {
        en: 'Expires {{time}}',
        pt_BR: 'Expira em {{time}}',
        es: 'Vence el {{time}}',
    },
    'collections.truncated': {
        en: 'Truncated',
        pt_BR: 'Truncado',
        es: 'Truncado',
    },
    'collections.purged': {
        en: 'Purged',
        pt_BR: 'Expurgado',
        es: 'Purgado',
    },
    'collections.view_trace': {
        en: 'View trace',
        pt_BR: 'Visualizar trace',
        es: 'Ver trace',
    },
    'collections.download_trace': {
        en: 'Download trace',
        pt_BR: 'Baixar trace',
        es: 'Descargar trace',
    },
    'collections.trace_title': {
        en: 'Diagnostic trace · {{name}}',
        pt_BR: 'Trace de diagnóstico · {{name}}',
        es: 'Trace de diagnóstico · {{name}}',
    },
    'collections.trace_truncated_warning': {
        en: 'The trace reached the 5 MiB security limit and was truncated.',
        pt_BR: 'O trace atingiu o limite de segurança de 5 MiB e foi truncado.',
        es: 'El trace alcanzó el límite de seguridad de 5 MiB y fue truncado.',
    },
    'collections.status.queued': {
        en: 'Queued',
        pt_BR: 'Na fila',
        es: 'En cola',
    },
    'collections.status.dispatched': {
        en: 'Dispatched',
        pt_BR: 'Despachado',
        es: 'Despachado',
    },
    'collections.status.running': {
        en: 'Running',
        pt_BR: 'Em execução',
        es: 'En ejecución',
    },
    'collections.status.succeeded': {
        en: 'Succeeded',
        pt_BR: 'Concluído',
        es: 'Completado',
    },
    'collections.status.failed': { en: 'Failed', pt_BR: 'Falhou', es: 'Falló' },
    'collections.status.cooldown': {
        en: 'Cooldown',
        pt_BR: 'Aguardando',
        es: 'En espera',
    },
    'collections.status.cancelled': {
        en: 'Cancelled',
        pt_BR: 'Cancelado',
        es: 'Cancelado',
    },
    'collections.trigger.manual': {
        en: 'Manual',
        pt_BR: 'Manual',
        es: 'Manual',
    },
    'collections.trigger.scheduled': {
        en: 'Scheduled',
        pt_BR: 'Agendada',
        es: 'Programada',
    },
    'collections.trigger.retry': {
        en: 'Retry',
        pt_BR: 'Nova tentativa',
        es: 'Reintento',
    },
    'collections.trigger.model_test': {
        en: 'Model test',
        pt_BR: 'Teste de modelo',
        es: 'Prueba de modelo',
    },
    'collections.trigger.diagnostic': {
        en: 'Diagnostic',
        pt_BR: 'Diagnóstico',
        es: 'Diagnóstico',
    },
    'collections.event.queued': {
        en: 'Request queued',
        pt_BR: 'Solicitação enfileirada',
        es: 'Solicitud en cola',
    },
    'collections.event.dispatched': {
        en: 'Worker dispatched',
        pt_BR: 'Worker acionado',
        es: 'Worker activado',
    },
    'collections.event.target_validation_started': {
        en: 'Target validation started',
        pt_BR: 'Validação do destino iniciada',
        es: 'Validación del destino iniciada',
    },
    'collections.event.target_validation_passed': {
        en: 'Target validation passed',
        pt_BR: 'Destino validado',
        es: 'Destino validado',
    },
    'collections.event.ssh_validation_passed': {
        en: 'SSH host key validated',
        pt_BR: 'Chave SSH validada',
        es: 'Clave SSH validada',
    },
    'collections.event.started': {
        en: 'Collection started',
        pt_BR: 'Coleta iniciada',
        es: 'Recolección iniciada',
    },
    'collections.event.engine_accepted': {
        en: 'Engine accepted the request',
        pt_BR: 'Motor aceitou a solicitação',
        es: 'El motor aceptó la solicitud',
    },
    'collections.event.engine_succeeded': {
        en: 'Engine completed the read',
        pt_BR: 'Motor concluiu a leitura',
        es: 'El motor completó la lectura',
    },
    'collections.event.configuration_stored': {
        en: 'Configuration stored',
        pt_BR: 'Configuração armazenada',
        es: 'Configuración almacenada',
    },
    'collections.event.success': {
        en: 'Run completed successfully',
        pt_BR: 'Execução concluída com sucesso',
        es: 'Ejecución completada correctamente',
    },
    'collections.event.failure': {
        en: 'Run failed',
        pt_BR: 'Execução falhou',
        es: 'La ejecución falló',
    },
    'collections.event.cancelled': {
        en: 'Run cancelled',
        pt_BR: 'Execução cancelada',
        es: 'Ejecución cancelada',
    },
    'collections.event.retry_scheduled': {
        en: 'Retry scheduled',
        pt_BR: 'Nova tentativa agendada',
        es: 'Reintento programado',
    },
    'collections.event.trace_stored': {
        en: 'Encrypted trace stored',
        pt_BR: 'Trace criptografado armazenado',
        es: 'Trace cifrado almacenado',
    },
    'collections.error.authentication_failed': {
        en: 'Authentication failed.',
        pt_BR: 'Falha de autenticação.',
        es: 'Falló la autenticación.',
    },
    'collections.error.connection_refused': {
        en: 'The device refused the connection.',
        pt_BR: 'O equipamento recusou a conexão.',
        es: 'El equipo rechazó la conexión.',
    },
    'collections.error.connection_timeout': {
        en: 'The connection timed out.',
        pt_BR: 'A conexão excedeu o tempo limite.',
        es: 'La conexión agotó el tiempo de espera.',
    },
    'collections.error.collection_timelimit': {
        en: 'The collection exceeded its total time limit.',
        pt_BR: 'A coleta excedeu o limite total de tempo.',
        es: 'La recolección superó el límite total de tiempo.',
    },
    'collections.error.prompt_not_detected': {
        en: 'The expected device prompt was not detected.',
        pt_BR: 'O prompt esperado do equipamento não foi detectado.',
        es: 'No se detectó el prompt esperado del equipo.',
    },
    'collections.error.ssh_host_key_changed': {
        en: 'The SSH host key changed.',
        pt_BR: 'A chave de host SSH mudou.',
        es: 'La clave de host SSH cambió.',
    },
    'collections.error.driver_error': {
        en: 'The selected driver could not complete the read.',
        pt_BR: 'O driver selecionado não concluiu a leitura.',
        es: 'El driver seleccionado no completó la lectura.',
    },
    'collections.error.engine_failure': {
        en: 'The collection engine reported a failure.',
        pt_BR: 'O motor de coleta informou uma falha.',
        es: 'El motor de recolección informó un fallo.',
    },
    'collections.error.sandbox_busy': {
        en: 'The isolated diagnostic sandbox is busy. Try again shortly.',
        pt_BR: 'O sandbox isolado de diagnóstico está ocupado. Tente novamente em instantes.',
        es: 'El sandbox aislado de diagnóstico está ocupado. Inténtalo de nuevo en unos instantes.',
    },
    'collections.error.device_not_collectable': {
        en: 'The device is no longer eligible for collection.',
        pt_BR: 'O equipamento não está mais apto para coleta.',
        es: 'El equipo ya no está habilitado para recolección.',
    },
    'collections.error.device_safety_changed': {
        en: 'Device safety approval changed before collection.',
        pt_BR: 'A aprovação de segurança do equipamento mudou antes da coleta.',
        es: 'La aprobación de seguridad del equipo cambió antes de la recolección.',
    },
    'collections.error.target_validation_failed': {
        en: 'The approved network target could not be validated.',
        pt_BR: 'Não foi possível validar o destino de rede aprovado.',
        es: 'No se pudo validar el destino de red aprobado.',
    },
    'collections.error.engine_rejected': {
        en: 'The collection engine rejected the request.',
        pt_BR: 'O motor de coleta rejeitou a solicitação.',
        es: 'El motor de recolección rechazó la solicitud.',
    },
    'collections.error.engine_reported_failure': {
        en: 'The collection engine reported a failure.',
        pt_BR: 'O motor de coleta informou uma falha.',
        es: 'El motor de recolección informó un fallo.',
    },
    'collections.error.collection_timeout': {
        en: 'The collection exceeded its total time limit.',
        pt_BR: 'A coleta excedeu o limite total de tempo.',
        es: 'La recolección superó el límite total de tiempo.',
    },
    'collections.error.configuration_history_unavailable': {
        en: 'The configuration history storage is temporarily unavailable.',
        pt_BR: 'O armazenamento do histórico de configurações está temporariamente indisponível.',
        es: 'El almacenamiento del historial de configuraciones no está disponible temporalmente.',
    },
    'collections.error.configuration_not_persisted': {
        en: 'The engine finished, but no configuration version could be confirmed.',
        pt_BR: 'O motor terminou, mas nenhuma versão da configuração pôde ser confirmada.',
        es: 'El motor terminó, pero no se pudo confirmar ninguna versión de la configuración.',
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
    'config.view_collections': {
        en: 'View collections',
        pt_BR: 'Ver coletas',
        es: 'Ver recolecciones',
    },
    'config.history_unavailable_title': {
        en: 'Configuration history unavailable',
        pt_BR: 'Histórico de configurações indisponível',
        es: 'Historial de configuraciones no disponible',
    },
    'config.history_unavailable': {
        en: 'NetKeep could not verify the permanent Git history. The device is not considered healthy from this collection until persistence is confirmed.',
        pt_BR: 'O NetKeep não conseguiu verificar o histórico Git permanente. O equipamento não é considerado saudável por esta coleta até a persistência ser confirmada.',
        es: 'NetKeep no pudo verificar el historial Git permanente. El equipo no se considera saludable por esta recolección hasta que se confirme la persistencia.',
    },
    'config.history_unavailable_content': {
        en: '# Configuration content is unavailable until Git history access is restored.',
        pt_BR: '# O conteúdo da configuração fica indisponível até o acesso ao histórico Git ser restaurado.',
        es: '# El contenido de la configuración no está disponible hasta que se restaure el acceso al historial Git.',
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
