import { defineMessages } from './define-messages';

export const administrationMessages = defineMessages({
    'users.title': { en: 'Users', pt_BR: 'Usuários', es: 'Usuarios' },
    'users.eyebrow': {
        en: 'Access control',
        pt_BR: 'Controle de acesso',
        es: 'Control de acceso',
    },
    'users.heading': {
        en: 'Users and roles',
        pt_BR: 'Usuários e papéis',
        es: 'Usuarios y roles',
    },
    'users.description': {
        en: 'Public registration remains closed. New users join by invitation and can enable TOTP 2FA.',
        pt_BR: 'O registro público permanece fechado. Novas pessoas entram por convite e podem habilitar 2FA TOTP.',
        es: 'El registro público permanece cerrado. Los nuevos usuarios ingresan por invitación y pueden habilitar 2FA TOTP.',
    },
    'users.inactive': { en: 'inactive', pt_BR: 'desativado', es: 'inactivo' },
    'users.last_access': {
        en: 'Last access {{date}}',
        pt_BR: 'Último acesso {{date}}',
        es: 'Último acceso {{date}}',
    },
    'users.never_accessed': {
        en: 'Never signed in',
        pt_BR: 'Nunca acessou',
        es: 'Nunca inició sesión',
    },
    'users.role.owner': {
        en: 'Owner',
        pt_BR: 'Proprietário',
        es: 'Propietario',
    },
    'users.role.admin': {
        en: 'Administrator',
        pt_BR: 'Administrador',
        es: 'Administrador',
    },
    'users.role.operator': {
        en: 'Operator',
        pt_BR: 'Operador',
        es: 'Operador',
    },
    'users.role.viewer': { en: 'Viewer', pt_BR: 'Leitor', es: 'Lector' },
    'users.role_label': {
        en: '{{name}} role',
        pt_BR: 'Papel de {{name}}',
        es: 'Rol de {{name}}',
    },
    'users.locale_label': {
        en: '{{name}} language',
        pt_BR: 'Idioma de {{name}}',
        es: 'Idioma de {{name}}',
    },
    'users.role': { en: 'Role', pt_BR: 'Papel', es: 'Rol' },
    'users.transfer_confirm': {
        en: 'Transfer ownership to {{name}}? Your account will become an administrator.',
        pt_BR: 'Transferir a propriedade para {{name}}? Sua conta passará a administradora.',
        es: '¿Transferir la propiedad a {{name}}? Tu cuenta pasará a ser administradora.',
    },
    'users.make_owner': {
        en: 'Make owner',
        pt_BR: 'Tornar proprietário',
        es: 'Convertir en propietario',
    },
    'users.invite': {
        en: 'Invite user',
        pt_BR: 'Convidar usuário',
        es: 'Invitar usuario',
    },
    'users.send_invite': {
        en: 'Send invitation',
        pt_BR: 'Enviar convite',
        es: 'Enviar invitación',
    },
    'users.invite_hint': {
        en: 'The link uses the secure password reset flow. Configure SMTP under Integrations for automatic delivery.',
        pt_BR: 'O link usa o fluxo seguro de redefinição de senha. Configure SMTP em Integrações para envio automático.',
        es: 'El enlace usa el flujo seguro de restablecimiento de contraseña. Configura SMTP en Integraciones para el envío automático.',
    },
    'users.role.owner_description': {
        en: 'Recovery, updates, and ownership transfer.',
        pt_BR: 'Recuperação, atualizações e transferência.',
        es: 'Recuperación, actualizaciones y transferencia.',
    },
    'users.role.admin_description': {
        en: 'System, credentials, integrations, and models.',
        pt_BR: 'Sistema, credenciais, integrações e modelos.',
        es: 'Sistema, credenciales, integraciones y modelos.',
    },
    'users.role.operator_description': {
        en: 'Devices and collections, without Ruby or secrets.',
        pt_BR: 'Equipamentos e coletas, sem Ruby ou segredos.',
        es: 'Equipos y recolecciones, sin Ruby ni secretos.',
    },
    'users.role.viewer_description': {
        en: 'Dashboard, configurations, and differences.',
        pt_BR: 'Dashboard, configurações e diferenças.',
        es: 'Panel, configuraciones y diferencias.',
    },
    'audit.title': { en: 'Audit', pt_BR: 'Auditoria', es: 'Auditoría' },
    'audit.eyebrow': {
        en: 'Traceability',
        pt_BR: 'Rastreabilidade',
        es: 'Trazabilidad',
    },
    'audit.description': {
        en: 'Administrative and operational actions without storing secret values.',
        pt_BR: 'Ações administrativas e operacionais sem armazenar valores secretos.',
        es: 'Acciones administrativas y operativas sin almacenar valores secretos.',
    },
    'audit.empty': {
        en: 'No events recorded',
        pt_BR: 'Nenhum evento registrado',
        es: 'No hay eventos registrados',
    },
    'audit.technical_code': {
        en: 'Technical code: {{code}}',
        pt_BR: 'Código técnico: {{code}}',
        es: 'Código técnico: {{code}}',
    },
    'audit.action.integration.inventory_created': {
        en: 'Inventory integration created',
        pt_BR: 'Integração de inventário criada',
        es: 'Integración de inventario creada',
    },
    'audit.action.integration.inventory_synced': {
        en: 'Inventory synchronized',
        pt_BR: 'Inventário sincronizado',
        es: 'Inventario sincronizado',
    },
    'audit.action.integration.inventory_failed': {
        en: 'Inventory synchronization failed',
        pt_BR: 'Falha ao sincronizar inventário',
        es: 'Falló la sincronización del inventario',
    },
    'audit.action.notification.channel_created': {
        en: 'Notification channel created',
        pt_BR: 'Canal de notificação criado',
        es: 'Canal de notificación creado',
    },
    'audit.action.notification.channel_tested': {
        en: 'Notification channel tested',
        pt_BR: 'Canal de notificação testado',
        es: 'Canal de notificación probado',
    },
    'audit.action.backup.destination_created': {
        en: 'Backup destination created',
        pt_BR: 'Destino de backup criado',
        es: 'Destino de respaldo creado',
    },
    'audit.action.backup.destination_status_updated': {
        en: 'Backup destination status updated',
        pt_BR: 'Estado do destino de backup atualizado',
        es: 'Estado del destino de respaldo actualizado',
    },
    'audit.action.backup.queued': {
        en: 'Backup queued',
        pt_BR: 'Backup enfileirado',
        es: 'Respaldo en cola',
    },
    'audit.action.backup.git_mirrored': {
        en: 'Git mirror completed',
        pt_BR: 'Espelhamento Git concluído',
        es: 'Espejo Git completado',
    },
    'audit.action.backup.git_failed': {
        en: 'Git mirror failed',
        pt_BR: 'Falha no espelhamento Git',
        es: 'Falló el espejo Git',
    },
    'audit.action.credential.created': {
        en: 'Credential profile created',
        pt_BR: 'Perfil de credencial criado',
        es: 'Perfil de credencial creado',
    },
    'audit.action.credential.updated': {
        en: 'Credential profile updated',
        pt_BR: 'Perfil de credencial atualizado',
        es: 'Perfil de credencial actualizado',
    },
    'audit.action.credential.deleted': {
        en: 'Credential profile removed',
        pt_BR: 'Perfil de credencial removido',
        es: 'Perfil de credencial eliminado',
    },
    'audit.action.update.settings_changed': {
        en: 'Update policy changed',
        pt_BR: 'Política de atualização alterada',
        es: 'Política de actualización modificada',
    },
    'audit.action.update.queued': {
        en: 'Update queued',
        pt_BR: 'Atualização enfileirada',
        es: 'Actualización en cola',
    },
    'audit.action.configuration.exported': {
        en: 'Configuration exported',
        pt_BR: 'Configuração exportada',
        es: 'Configuración exportada',
    },
    'audit.action.system.settings_updated': {
        en: 'System settings updated',
        pt_BR: 'Configurações do sistema atualizadas',
        es: 'Configuración del sistema actualizada',
    },
    'audit.action.model.created': {
        en: 'Custom model created',
        pt_BR: 'Modelo personalizado criado',
        es: 'Modelo personalizado creado',
    },
    'audit.action.model.updated': {
        en: 'Custom model updated',
        pt_BR: 'Modelo personalizado atualizado',
        es: 'Modelo personalizado actualizado',
    },
    'audit.action.model.validation_failed': {
        en: 'Model validation failed',
        pt_BR: 'Falha na validação do modelo',
        es: 'Falló la validación del modelo',
    },
    'audit.action.model.publish_failed': {
        en: 'Model publication failed',
        pt_BR: 'Falha na publicação do modelo',
        es: 'Falló la publicación del modelo',
    },
    'audit.action.model.published': {
        en: 'Custom model published',
        pt_BR: 'Modelo personalizado publicado',
        es: 'Modelo personalizado publicado',
    },
    'audit.action.model.test_queued': {
        en: 'Model test queued',
        pt_BR: 'Teste de modelo enfileirado',
        es: 'Prueba de modelo en cola',
    },
    'audit.action.model.deleted': {
        en: 'Custom model removed',
        pt_BR: 'Modelo personalizado removido',
        es: 'Modelo personalizado eliminado',
    },
    'audit.action.user.locale_updated': {
        en: 'Personal language changed',
        pt_BR: 'Idioma pessoal alterado',
        es: 'Idioma personal modificado',
    },
    'audit.action.device.created': {
        en: 'Device created',
        pt_BR: 'Equipamento criado',
        es: 'Equipo creado',
    },
    'audit.action.device.updated': {
        en: 'Device updated',
        pt_BR: 'Equipamento atualizado',
        es: 'Equipo actualizado',
    },
    'audit.action.device.deleted': {
        en: 'Device disabled',
        pt_BR: 'Equipamento desativado',
        es: 'Equipo desactivado',
    },
    'audit.action.device.collection_requested': {
        en: 'Collection requested',
        pt_BR: 'Coleta solicitada',
        es: 'Recolección solicitada',
    },
    'audit.action.device.approved': {
        en: 'Device approved',
        pt_BR: 'Equipamento aprovado',
        es: 'Equipo aprobado',
    },
    'audit.action.device.approval_invalidated': {
        en: 'Device approval invalidated',
        pt_BR: 'Aprovação do equipamento invalidada',
        es: 'Aprobación del equipo invalidada',
    },
    'audit.action.device.approval_revoked': {
        en: 'Device approval revoked',
        pt_BR: 'Aprovação do equipamento revogada',
        es: 'Aprobación del equipo revocada',
    },
    'audit.action.devices.exported': {
        en: 'Devices exported',
        pt_BR: 'Equipamentos exportados',
        es: 'Equipos exportados',
    },
    'audit.action.devices.imported': {
        en: 'Devices imported',
        pt_BR: 'Equipamentos importados',
        es: 'Equipos importados',
    },
    'audit.action.catalog.created': {
        en: 'Catalog item created',
        pt_BR: 'Item de catálogo criado',
        es: 'Elemento de catálogo creado',
    },
    'audit.action.catalog.deleted': {
        en: 'Catalog item removed',
        pt_BR: 'Item de catálogo removido',
        es: 'Elemento de catálogo eliminado',
    },
    'audit.action.setup.completed': {
        en: 'Setup completed',
        pt_BR: 'Configuração inicial concluída',
        es: 'Configuración inicial completada',
    },
    'audit.action.user.invited': {
        en: 'User invited',
        pt_BR: 'Usuário convidado',
        es: 'Usuario invitado',
    },
    'audit.action.user.updated': {
        en: 'User updated',
        pt_BR: 'Usuário atualizado',
        es: 'Usuario actualizado',
    },
    'audit.action.ownership.transferred': {
        en: 'Ownership transferred',
        pt_BR: 'Propriedade transferida',
        es: 'Propiedad transferida',
    },
    'audit.action.auth.login': {
        en: 'Signed in',
        pt_BR: 'Login realizado',
        es: 'Inicio de sesión realizado',
    },
    'audit.action.auth.logout': {
        en: 'Signed out',
        pt_BR: 'Logout realizado',
        es: 'Cierre de sesión realizado',
    },
    'audit.action.auth.owner_registered': {
        en: 'Initial owner registered',
        pt_BR: 'Proprietário inicial cadastrado',
        es: 'Propietario inicial registrado',
    },
    'audit.action.auth.failed': {
        en: 'Authentication failed',
        pt_BR: 'Falha na autenticação',
        es: 'Falló la autenticación',
    },
    'audit.action.auth.lockout': {
        en: 'Authentication temporarily blocked',
        pt_BR: 'Autenticação temporariamente bloqueada',
        es: 'Autenticación bloqueada temporalmente',
    },
    'audit.action.notification.channel_status_updated': {
        en: 'Notification channel status changed',
        pt_BR: 'Status do canal de notificação alterado',
        es: 'Estado del canal de notificación modificado',
    },
    'audit.action.security.dangerous_feature_changed': {
        en: 'Dangerous feature setting changed',
        pt_BR: 'Configuração de recurso perigoso alterada',
        es: 'Configuración de función peligrosa modificada',
    },
    'system.title': { en: 'System', pt_BR: 'Sistema', es: 'Sistema' },
    'system.heading': {
        en: 'System settings',
        pt_BR: 'Configurações do sistema',
        es: 'Configuración del sistema',
    },
    'system.description': {
        en: 'Identity, domain, and operational defaults for this installation.',
        pt_BR: 'Identidade, domínio e padrões operacionais desta instalação.',
        es: 'Identidad, dominio y valores operativos predeterminados de esta instalación.',
    },
    'system.organization_access': {
        en: 'Organization and access',
        pt_BR: 'Empresa e acesso',
        es: 'Organización y acceso',
    },
    'system.default_language': {
        en: 'Default language',
        pt_BR: 'Idioma padrão',
        es: 'Idioma predeterminado',
    },
    'system.timezone': {
        en: 'Time zone',
        pt_BR: 'Fuso horário',
        es: 'Zona horaria',
    },
    'system.https_domain': {
        en: 'HTTPS domain',
        pt_BR: 'Domínio HTTPS',
        es: 'Dominio HTTPS',
    },
    'system.canonical_url': {
        en: 'Canonical HTTPS URL',
        pt_BR: 'URL HTTPS canônica',
        es: 'URL HTTPS canónica',
    },
    'system.collection_security': {
        en: 'Collection security',
        pt_BR: 'Segurança das coletas',
        es: 'Seguridad de las recolecciones',
    },
    'system.collection_security_description': {
        en: 'Low intervals, high timeouts, retries, and concurrency increase authentications, CPU use, and traffic on network devices. Oxidized executes each dispatched collection and NetKeep enforces the limits below.',
        pt_BR: 'Intervalos baixos, timeouts altos, retries e concorrência aumentam autenticações, uso de CPU e tráfego nos equipamentos. O Oxidized executa cada coleta despachada e o NetKeep aplica os limites abaixo.',
        es: 'Los intervalos bajos, tiempos de espera altos, reintentos y concurrencia aumentan las autenticaciones, el uso de CPU y el tráfico en los equipos. Oxidized ejecuta cada recolección y NetKeep aplica los límites.',
    },
    'system.capacity_fits': {
        en: 'Estimated collection cycle fits the configured interval',
        pt_BR: 'O ciclo estimado de coletas cabe no intervalo configurado',
        es: 'El ciclo estimado cabe en el intervalo configurado',
    },
    'system.capacity_insufficient': {
        en: 'Insufficient collection capacity',
        pt_BR: 'Capacidade de coleta insuficiente',
        es: 'Capacidad de recolección insuficiente',
    },
    'system.capacity_estimate': {
        en: '{{devices}} approved devices require at least {{cycle}} seconds per cycle; the shortest interval is {{interval}} seconds. Site limits and retries can increase this time.',
        pt_BR: '{{devices}} equipamentos aprovados exigem ao menos {{cycle}} segundos por ciclo; o menor intervalo é {{interval}} segundos. Limites por site e retries podem aumentar esse tempo.',
        es: '{{devices}} equipos aprobados requieren al menos {{cycle}} segundos por ciclo; el intervalo más corto es {{interval}} segundos. Los límites por sitio y reintentos pueden aumentar este tiempo.',
    },
    'system.collection_concurrency': {
        en: 'Global collection concurrency',
        pt_BR: 'Concorrência global de coletas',
        es: 'Concurrencia global de recolecciones',
    },
    'system.high_concurrency_confirmation': {
        en: 'Type HIGH CONCURRENCY to confirm',
        pt_BR: 'Digite HIGH CONCURRENCY para confirmar',
        es: 'Escribe HIGH CONCURRENCY para confirmar',
    },
    'risk.normal': { en: 'Normal', pt_BR: 'Normal', es: 'Normal' },
    'risk.warning': { en: 'Warning', pt_BR: 'Atenção', es: 'Advertencia' },
    'risk.critical': {
        en: 'High risk',
        pt_BR: 'Alto risco',
        es: 'Alto riesgo',
    },
    'system.dangerous_features': {
        en: 'Dangerous features',
        pt_BR: 'Recursos perigosos',
        es: 'Funciones peligrosas',
    },
    'system.dangerous_features_description': {
        en: 'These exceptions weaken the safe-mode guarantees. Only the owner can enable them after recent reauthentication and an exact textual confirmation.',
        pt_BR: 'Estas exceções enfraquecem as garantias do modo seguro. Somente o proprietário pode habilitá-las após reautenticação recente e confirmação textual exata.',
        es: 'Estas excepciones debilitan las garantías del modo seguro. Solo el propietario puede habilitarlas después de reautenticarse y confirmar el texto exacto.',
    },
    'system.dangerous.raw_ruby': {
        en: 'Arbitrary Ruby models',
        pt_BR: 'Modelos Ruby arbitrários',
        es: 'Modelos Ruby arbitrarios',
    },
    'system.dangerous.telnet': {
        en: 'Telnet transport',
        pt_BR: 'Transporte Telnet',
        es: 'Transporte Telnet',
    },
    'system.dangerous.http_ip_login': {
        en: 'HTTP login by IP',
        pt_BR: 'Login HTTP por IP',
        es: 'Inicio de sesión HTTP por IP',
    },
    'system.unsafe_http_banner_title': {
        en: 'Dangerous HTTP/IP recovery session',
        pt_BR: 'Sessão perigosa de recuperação por HTTP/IP',
        es: 'Sesión peligrosa de recuperación por HTTP/IP',
    },
    'system.unsafe_http_banner_description': {
        en: 'Traffic and credentials are not protected by HTTPS. This separate session expires after five minutes and cannot be remembered.',
        pt_BR: 'O tráfego e as credenciais não estão protegidos por HTTPS. Esta sessão separada expira em cinco minutos e não pode ser lembrada.',
        es: 'El tráfico y las credenciales no están protegidos por HTTPS. Esta sesión separada expira en cinco minutos y no se puede recordar.',
    },
    'system.dangerous.automatic_updates': {
        en: 'Integrated automatic updates',
        pt_BR: 'Atualizações automáticas integradas',
        es: 'Actualizaciones automáticas integradas',
    },
    'system.dangerous.unreviewed_drivers': {
        en: 'Unreviewed Oxidized drivers',
        pt_BR: 'Drivers Oxidized não revisados',
        es: 'Drivers de Oxidized no revisados',
    },
    'system.dangerous_enabled': {
        en: 'Enabled — safe-mode guarantee is conditional',
        pt_BR: 'Ativo — a garantia do modo seguro é condicional',
        es: 'Activo — la garantía del modo seguro es condicional',
    },
    'system.safe_disabled': {
        en: 'Disabled by safe mode',
        pt_BR: 'Desativado pelo modo seguro',
        es: 'Desactivado por el modo seguro',
    },
    'system.dangerous_confirmation': {
        en: 'Type ENABLE {{feature}} to accept the risk.',
        pt_BR: 'Digite ENABLE {{feature}} para aceitar o risco.',
        es: 'Escribe ENABLE {{feature}} para aceptar el riesgo.',
    },
    'system.domain_hint': {
        en: 'Point DNS to the server. Caddy automatically issues and renews the certificate; HTTP by IP remains available for recovery.',
        pt_BR: 'Aponte o DNS para o servidor. O Caddy emite e renova o certificado automaticamente; HTTP por IP permanece como recuperação.',
        es: 'Apunta el DNS al servidor. Caddy emite y renueva el certificado automáticamente; HTTP por IP permanece disponible para recuperación.',
    },
    'system.new_logo': {
        en: 'New logo',
        pt_BR: 'Nova logo',
        es: 'Nuevo logotipo',
    },
    'system.remove_logo': {
        en: 'Remove current logo',
        pt_BR: 'Remover logo atual',
        es: 'Eliminar logotipo actual',
    },
    'system.defaults_retention': {
        en: 'Defaults and retention',
        pt_BR: 'Padrões e retenção',
        es: 'Valores predeterminados y retención',
    },
    'system.default_interval': {
        en: 'Default collection interval (seconds)',
        pt_BR: 'Intervalo padrão de coleta (segundos)',
        es: 'Intervalo predeterminado de recolección (segundos)',
    },
    'system.default_timeout': {
        en: 'Default timeout (seconds)',
        pt_BR: 'Timeout padrão (segundos)',
        es: 'Tiempo de espera predeterminado (segundos)',
    },
    'system.retention_days': {
        en: 'Full backup retention (days)',
        pt_BR: 'Retenção dos backups completos (dias)',
        es: 'Retención de respaldos completos (días)',
    },
    'system.retention_hint': {
        en: 'Use 0 for permanent retention. This policy applies to full local/S3 archives; Git configuration history is never automatically deleted.',
        pt_BR: 'Use 0 para retenção permanente. Esta política alcança arquivos completos locais/S3; o histórico Git de configurações nunca é apagado automaticamente.',
        es: 'Usa 0 para retención permanente. Esta política se aplica a archivos completos locales/S3; el historial Git de configuraciones nunca se elimina automáticamente.',
    },
    'system.save': {
        en: 'Save settings',
        pt_BR: 'Salvar configurações',
        es: 'Guardar configuración',
    },
    'updates.title': {
        en: 'Updates',
        pt_BR: 'Atualizações',
        es: 'Actualizaciones',
    },
    'updates.eyebrow': {
        en: 'Owner',
        pt_BR: 'Proprietário',
        es: 'Propietario',
    },
    'updates.description': {
        en: 'Detect official releases independently and apply signed updates with an encrypted recovery snapshot.',
        pt_BR: 'Detecte releases oficiais de forma independente e aplique atualizações assinadas com snapshot criptografado de recuperação.',
        es: 'Detecta versiones oficiales de forma independiente y aplica actualizaciones firmadas con una copia cifrada de recuperación.',
    },
    'updates.state': { en: 'Status', pt_BR: 'Estado', es: 'Estado' },
    'updates.current_version': {
        en: 'Current version',
        pt_BR: 'Versão atual',
        es: 'Versión actual',
    },
    'updates.available': {
        en: 'Available',
        pt_BR: 'Disponível',
        es: 'Disponible',
    },
    'updates.available_badge': {
        en: 'Update available',
        pt_BR: 'Atualização disponível',
        es: 'Actualización disponible',
    },
    'updates.sidebar_available': {
        en: 'v{{version}} available',
        pt_BR: 'v{{version}} disponível',
        es: 'v{{version}} disponible',
    },
    'updates.sidebar_open': {
        en: 'Review and update NetKeep',
        pt_BR: 'Revisar e atualizar o NetKeep',
        es: 'Revisar y actualizar NetKeep',
    },
    'updates.status_current': {
        en: 'Up to date',
        pt_BR: 'Atualizado',
        es: 'Actualizado',
    },
    'updates.status_available': {
        en: 'Update available',
        pt_BR: 'Atualização disponível',
        es: 'Actualización disponible',
    },
    'updates.status_checking': {
        en: 'Checking',
        pt_BR: 'Verificando',
        es: 'Verificando',
    },
    'updates.status_unavailable': {
        en: 'Check unavailable',
        pt_BR: 'Consulta indisponível',
        es: 'Consulta no disponible',
    },
    'updates.status_updating': {
        en: 'Updating',
        pt_BR: 'Atualizando',
        es: 'Actualizando',
    },
    'updates.status_reconnecting': {
        en: 'Reconnecting',
        pt_BR: 'Reconectando',
        es: 'Reconectando',
    },
    'updates.status_recovery_required': {
        en: 'Recovery required',
        pt_BR: 'Recuperação necessária',
        es: 'Recuperación necesaria',
    },
    'updates.status_succeeded': {
        en: 'Completed',
        pt_BR: 'Concluída',
        es: 'Completada',
    },
    'updates.status_failed': { en: 'Failed', pt_BR: 'Falhou', es: 'Falló' },
    'updates.last_checked': {
        en: 'Last attempt: {{date}}',
        pt_BR: 'Última tentativa: {{date}}',
        es: 'Último intento: {{date}}',
    },
    'updates.check_failed_title': {
        en: 'The latest check failed',
        pt_BR: 'A última consulta falhou',
        es: 'La última consulta falló',
    },
    'updates.check_failed_description': {
        en: 'NetKeep could not reach GitHub. The last known release result was preserved.',
        pt_BR: 'O NetKeep não conseguiu acessar o GitHub. O último resultado conhecido foi preservado.',
        es: 'NetKeep no pudo acceder a GitHub. Se conservó el último resultado conocido.',
    },
    'updates.last_success_preserved': {
        en: 'Last successful check: {{date}}.',
        pt_BR: 'Última consulta bem-sucedida: {{date}}.',
        es: 'Última consulta exitosa: {{date}}.',
    },
    'updates.major_release': {
        en: 'Major release',
        pt_BR: 'Release principal',
        es: 'Versión principal',
    },
    'updates.compatible_release': {
        en: 'Compatible release',
        pt_BR: 'Release compatível',
        es: 'Versión compatible',
    },
    'updates.rollback_supported': {
        en: 'Compose rollback supported',
        pt_BR: 'Rollback do Compose suportado',
        es: 'Rollback de Compose compatible',
    },
    'updates.released_at': {
        en: 'Published {{date}}',
        pt_BR: 'Publicada em {{date}}',
        es: 'Publicada el {{date}}',
    },
    'updates.release_notes': {
        en: 'View release notes',
        pt_BR: 'Ver notas da release',
        es: 'Ver notas de la versión',
    },
    'updates.updater_offline_title': {
        en: 'Updater agent is unavailable',
        pt_BR: 'O agente de atualização está indisponível',
        es: 'El agente de actualización no está disponible',
    },
    'updates.updater_offline_description': {
        en: 'Detection continues to work, but installation is blocked until the default updater service is healthy.',
        pt_BR: 'A detecção continua funcionando, mas a instalação fica bloqueada até o serviço padrão do updater estar saudável.',
        es: 'La detección sigue funcionando, pero la instalación queda bloqueada hasta que el servicio updater esté operativo.',
    },
    'updates.check_now': {
        en: 'Check now',
        pt_BR: 'Verificar agora',
        es: 'Verificar ahora',
    },
    'updates.update_now': {
        en: 'Update now',
        pt_BR: 'Atualizar agora',
        es: 'Actualizar ahora',
    },
    'updates.host_steps_required': {
        en: 'This release requires external host steps and cannot be installed from the panel.',
        pt_BR: 'Esta release exige etapas externas no host e não pode ser instalada pelo painel.',
        es: 'Esta versión requiere pasos externos en el host y no puede instalarse desde el panel.',
    },
    'updates.not_installable': {
        en: 'This release does not declare support for the installed version.',
        pt_BR: 'Esta release não declara suporte à versão instalada.',
        es: 'Esta versión no declara compatibilidad con la versión instalada.',
    },
    'updates.auto_policy': {
        en: 'Automatic policy',
        pt_BR: 'Política automática',
        es: 'Política automática',
    },
    'updates.auto': {
        en: 'Update automatically',
        pt_BR: 'Atualizar automaticamente',
        es: 'Actualizar automáticamente',
    },
    'updates.auto_hint': {
        en: 'Off by default. Only signed patch and minor releases from the installed major version are eligible.',
        pt_BR: 'Desligada por padrão. Somente releases patch e minor assinadas da versão principal instalada são elegíveis.',
        es: 'Desactivada de forma predeterminada. Solo se admiten versiones patch y minor firmadas de la versión principal instalada.',
    },
    'updates.socket_risk_title': {
        en: 'Host-level update privilege',
        pt_BR: 'Privilégio de atualização no host',
        es: 'Privilegio de actualización en el host',
    },
    'updates.socket_risk_description': {
        en: 'The isolated updater is the only service with Docker socket access, which is equivalent to root on the host. It has no network and accepts only signed official manifests.',
        pt_BR: 'O updater isolado é o único serviço com acesso ao socket Docker, equivalente a root no host. Ele não possui rede e aceita apenas manifestos oficiais assinados.',
        es: 'El updater aislado es el único servicio con acceso al socket Docker, equivalente a root en el host. No tiene red y solo acepta manifiestos oficiales firmados.',
    },
    'updates.accept_risk': {
        en: 'Review and accept the risk in System settings',
        pt_BR: 'Revisar e aceitar o risco nas Configurações do sistema',
        es: 'Revisar y aceptar el riesgo en Configuración del sistema',
    },
    'updates.days': {
        en: 'Allowed days',
        pt_BR: 'Dias permitidos',
        es: 'Días permitidos',
    },
    'updates.day_1': { en: 'Mon', pt_BR: 'Seg', es: 'Lun' },
    'updates.day_2': { en: 'Tue', pt_BR: 'Ter', es: 'Mar' },
    'updates.day_3': { en: 'Wed', pt_BR: 'Qua', es: 'Mié' },
    'updates.day_4': { en: 'Thu', pt_BR: 'Qui', es: 'Jue' },
    'updates.day_5': { en: 'Fri', pt_BR: 'Sex', es: 'Vie' },
    'updates.day_6': { en: 'Sat', pt_BR: 'Sáb', es: 'Sáb' },
    'updates.day_7': { en: 'Sun', pt_BR: 'Dom', es: 'Dom' },
    'updates.window_start': {
        en: 'Window starts',
        pt_BR: 'Início da janela',
        es: 'Inicio de la ventana',
    },
    'updates.window_end': {
        en: 'Window ends',
        pt_BR: 'Fim da janela',
        es: 'Fin de la ventana',
    },
    'updates.timezone_hint': {
        en: 'The window uses the company timezone: {{timezone}}.',
        pt_BR: 'A janela usa o fuso da empresa: {{timezone}}.',
        es: 'La ventana usa la zona horaria de la empresa: {{timezone}}.',
    },
    'updates.save_policy': {
        en: 'Save policy',
        pt_BR: 'Salvar política',
        es: 'Guardar política',
    },
    'updates.backup_destination': {
        en: 'Additional backup destination',
        pt_BR: 'Destino adicional de backup',
        es: 'Destino adicional de respaldo',
    },
    'updates.select_destination': {
        en: 'Select a destination',
        pt_BR: 'Selecione um destino',
        es: 'Selecciona un destino',
    },
    'updates.local_snapshot_only': {
        en: 'Encrypted local recovery snapshot only',
        pt_BR: 'Somente snapshot local criptografado',
        es: 'Solo copia local cifrada de recuperación',
    },
    'updates.destination_hint': {
        en: 'A local encrypted snapshot is always created. This destination receives an additional copy.',
        pt_BR: 'Um snapshot local criptografado sempre é criado. Este destino recebe uma cópia adicional.',
        es: 'Siempre se crea una copia local cifrada. Este destino recibe una copia adicional.',
    },
    'updates.operation_title': {
        en: 'Updating v{{from}} to v{{to}}',
        pt_BR: 'Atualizando v{{from}} para v{{to}}',
        es: 'Actualizando v{{from}} a v{{to}}',
    },
    'updates.step_backup': { en: 'Backup', pt_BR: 'Backup', es: 'Respaldo' },
    'updates.step_validation': {
        en: 'Validation',
        pt_BR: 'Validação',
        es: 'Validación',
    },
    'updates.step_download': {
        en: 'Download',
        pt_BR: 'Download',
        es: 'Descarga',
    },
    'updates.step_application': {
        en: 'Application',
        pt_BR: 'Aplicação',
        es: 'Aplicación',
    },
    'updates.step_restart': {
        en: 'Restart',
        pt_BR: 'Reinício',
        es: 'Reinicio',
    },
    'updates.step_verification': {
        en: 'Verification',
        pt_BR: 'Verificação',
        es: 'Verificación',
    },
    'updates.failed_title': {
        en: 'The update was not completed',
        pt_BR: 'A atualização não foi concluída',
        es: 'La actualización no se completó',
    },
    'updates.failed_description': {
        en: 'NetKeep preserved the encrypted recovery snapshot and restored the previous Compose when supported.',
        pt_BR: 'O NetKeep preservou o snapshot criptografado de recuperação e restaurou o Compose anterior quando suportado.',
        es: 'NetKeep conservó la copia cifrada de recuperación y restauró el Compose anterior cuando era compatible.',
    },
    'updates.recovery_required_title': {
        en: 'Manual recovery is required',
        pt_BR: 'A recuperação manual é necessária',
        es: 'Se requiere recuperación manual',
    },
    'updates.recovery_required_description': {
        en: 'Do not delete volumes or the preserved snapshot. Follow the recovery guide from the host.',
        pt_BR: 'Não exclua volumes nem o snapshot preservado. Siga o guia de recuperação pelo host.',
        es: 'No elimines volúmenes ni la copia conservada. Sigue la guía de recuperación desde el host.',
    },
    'updates.confirm_title': {
        en: 'Confirm NetKeep update',
        pt_BR: 'Confirmar atualização do NetKeep',
        es: 'Confirmar actualización de NetKeep',
    },
    'updates.confirm_description': {
        en: 'Services will restart after all images and signatures have been validated.',
        pt_BR: 'Os serviços serão reiniciados após todas as imagens e assinaturas serem validadas.',
        es: 'Los servicios se reiniciarán después de validar todas las imágenes y firmas.',
    },
    'updates.target_version': {
        en: 'Target version',
        pt_BR: 'Versão de destino',
        es: 'Versión de destino',
    },
    'updates.compatibility': {
        en: 'Compatibility',
        pt_BR: 'Compatibilidade',
        es: 'Compatibilidad',
    },
    'updates.estimated_downtime': {
        en: 'Estimated downtime',
        pt_BR: 'Indisponibilidade estimada',
        es: 'Tiempo de inactividad estimado',
    },
    'updates.minutes': {
        en: 'About {{count}} min',
        pt_BR: 'Cerca de {{count}} min',
        es: 'Aproximadamente {{count}} min',
    },
    'updates.snapshot_title': {
        en: 'Mandatory encrypted snapshot',
        pt_BR: 'Snapshot criptografado obrigatório',
        es: 'Copia cifrada obligatoria',
    },
    'updates.snapshot_description': {
        en: 'Database, configuration history, models, branding and required keys are captured before installation.',
        pt_BR: 'Banco, histórico de configurações, modelos, identidade visual e chaves necessárias são capturados antes da instalação.',
        es: 'La base de datos, el historial de configuraciones, los modelos, la identidad visual y las claves necesarias se capturan antes de la instalación.',
    },
    'updates.type_version': {
        en: 'Type {{version}} to confirm the major update',
        pt_BR: 'Digite {{version}} para confirmar a atualização principal',
        es: 'Escribe {{version}} para confirmar la actualización principal',
    },
    'updates.accept_update_risk': {
        en: 'I understand that services will restart and that I must keep the recovery snapshot and Docker volumes.',
        pt_BR: 'Entendo que os serviços serão reiniciados e que devo preservar o snapshot de recuperação e os volumes Docker.',
        es: 'Entiendo que los servicios se reiniciarán y que debo conservar la copia de recuperación y los volúmenes Docker.',
    },
    'updates.start_update': {
        en: 'Start update',
        pt_BR: 'Iniciar atualização',
        es: 'Iniciar actualización',
    },
});
