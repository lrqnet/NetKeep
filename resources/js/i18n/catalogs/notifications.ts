import { defineMessages } from './define-messages';

export const notificationMessages = defineMessages({
    'notifications.title': {
        en: 'Notifications',
        pt_BR: 'Notificações',
        es: 'Notificaciones',
    },
    'notifications.eyebrow': {
        en: 'Operations',
        pt_BR: 'Operação',
        es: 'Operación',
    },
    'notifications.heading': {
        en: 'Notifications',
        pt_BR: 'Notificações',
        es: 'Notificaciones',
    },
    'notifications.description': {
        en: 'Route operational events through webhook, Telegram, or email and monitor the status of every channel.',
        pt_BR: 'Envie eventos operacionais por webhook, Telegram ou e-mail e acompanhe o estado de cada canal.',
        es: 'Envía eventos operativos por webhook, Telegram o correo y supervisa el estado de cada canal.',
    },
    'notifications.summary.active': {
        en: 'Active channels',
        pt_BR: 'Canais ativos',
        es: 'Canales activos',
    },
    'notifications.summary.paused': {
        en: 'Paused channels',
        pt_BR: 'Canais pausados',
        es: 'Canales pausados',
    },
    'notifications.summary.failed': {
        en: 'Failed last test',
        pt_BR: 'Falha no último teste',
        es: 'Falla en la última prueba',
    },
    'notifications.channels': {
        en: 'Notification channels',
        pt_BR: 'Canais de notificação',
        es: 'Canales de notificación',
    },
    'notifications.channels_description': {
        en: 'Change, failure, recovery, overdue, backup, and update events with worker retries.',
        pt_BR: 'Eventos de mudança, falha, recuperação, atraso, backup e atualização com novas tentativas pelo worker.',
        es: 'Eventos de cambio, falla, recuperación, atraso, respaldo y actualización con reintentos del worker.',
    },
    'notifications.events_count': {
        en: '{{total}} events',
        pt_BR: '{{total}} eventos',
        es: '{{total}} eventos',
    },
    'notifications.test': {
        en: 'Test',
        pt_BR: 'Testar',
        es: 'Probar',
    },
    'notifications.new_channel': {
        en: 'New channel',
        pt_BR: 'Novo canal',
        es: 'Nuevo canal',
    },
    'notifications.type': {
        en: 'Type',
        pt_BR: 'Tipo',
        es: 'Tipo',
    },
    'notifications.channel_type.webhook': {
        en: 'Webhook',
        pt_BR: 'Webhook',
        es: 'Webhook',
    },
    'notifications.channel_type.telegram': {
        en: 'Telegram',
        pt_BR: 'Telegram',
        es: 'Telegram',
    },
    'notifications.channel_type.smtp': {
        en: 'Email / SMTP',
        pt_BR: 'E-mail / SMTP',
        es: 'Correo / SMTP',
    },
    'notifications.webhook_configuration': {
        en: 'Webhook settings',
        pt_BR: 'Configuração do webhook',
        es: 'Configuración del webhook',
    },
    'notifications.telegram_configuration': {
        en: 'Telegram settings',
        pt_BR: 'Configuração do Telegram',
        es: 'Configuración de Telegram',
    },
    'notifications.smtp_configuration': {
        en: 'Email / SMTP settings',
        pt_BR: 'Configuração de e-mail / SMTP',
        es: 'Configuración de correo / SMTP',
    },
    'notifications.webhook_url': {
        en: 'Webhook URL',
        pt_BR: 'URL do webhook',
        es: 'URL del webhook',
    },
    'notifications.webhook_secret': {
        en: 'Webhook HMAC secret',
        pt_BR: 'Segredo HMAC do webhook',
        es: 'Secreto HMAC del webhook',
    },
    'notifications.bot_token': {
        en: 'Bot token',
        pt_BR: 'Token do bot',
        es: 'Token del bot',
    },
    'notifications.chat_id': {
        en: 'Chat ID',
        pt_BR: 'ID do chat',
        es: 'ID del chat',
    },
    'notifications.smtp_server': {
        en: 'SMTP server',
        pt_BR: 'Servidor SMTP',
        es: 'Servidor SMTP',
    },
    'notifications.smtp_port': {
        en: 'SMTP port',
        pt_BR: 'Porta SMTP',
        es: 'Puerto SMTP',
    },
    'notifications.custom_smtp_port_warning': {
        en: 'A custom SMTP port can reach an unexpected service. Only the owner may save it after recent reauthentication and explicit confirmation.',
        pt_BR: 'Uma porta SMTP personalizada pode alcançar um serviço inesperado. Somente o proprietário pode salvá-la após reautenticação recente e confirmação explícita.',
        es: 'Un puerto SMTP personalizado puede alcanzar un servicio inesperado. Solo el propietario puede guardarlo después de una reautenticación reciente y confirmación explícita.',
    },
    'notifications.custom_smtp_port_confirmation': {
        en: 'Type the exact confirmation shown below',
        pt_BR: 'Digite a confirmação exata mostrada abaixo',
        es: 'Escribe la confirmación exacta que se muestra abajo',
    },
    'notifications.encryption': {
        en: 'Encryption',
        pt_BR: 'Criptografia',
        es: 'Cifrado',
    },
    'notifications.direct_tls': {
        en: 'Direct TLS',
        pt_BR: 'TLS direto',
        es: 'TLS directo',
    },
    'notifications.smtp_user': {
        en: 'SMTP username',
        pt_BR: 'Usuário SMTP',
        es: 'Usuario SMTP',
    },
    'notifications.smtp_password': {
        en: 'SMTP password',
        pt_BR: 'Senha SMTP',
        es: 'Contraseña SMTP',
    },
    'notifications.sender': {
        en: 'Sender',
        pt_BR: 'Remetente',
        es: 'Remitente',
    },
    'notifications.recipient': {
        en: 'Recipient',
        pt_BR: 'Destinatário',
        es: 'Destinatario',
    },
    'notifications.create_channel': {
        en: 'Create channel',
        pt_BR: 'Criar canal',
        es: 'Crear canal',
    },
    'notifications.events': {
        en: 'Notification events',
        pt_BR: 'Eventos de notificação',
        es: 'Eventos de notificación',
    },
    'notifications.events_hint': {
        en: 'Select at least one event. All events are selected by default.',
        pt_BR: 'Selecione ao menos um evento. Todos vêm marcados por padrão.',
        es: 'Selecciona al menos un evento. Todos están marcados de forma predeterminada.',
    },
    'notifications.event.change': {
        en: 'Configuration change',
        pt_BR: 'Alteração de configuração',
        es: 'Cambio de configuración',
    },
    'notifications.event.failure': {
        en: 'Collection failure',
        pt_BR: 'Falha de coleta',
        es: 'Falla de recolección',
    },
    'notifications.event.recovery': {
        en: 'Recovery',
        pt_BR: 'Recuperação',
        es: 'Recuperación',
    },
    'notifications.event.overdue': {
        en: 'Overdue collection',
        pt_BR: 'Coleta atrasada',
        es: 'Recolección atrasada',
    },
    'notifications.event.backup': {
        en: 'Full backup',
        pt_BR: 'Backup completo',
        es: 'Respaldo completo',
    },
    'notifications.event.update': {
        en: 'Update',
        pt_BR: 'Atualização',
        es: 'Actualización',
    },
    'notifications.not_tested': {
        en: 'Not tested yet',
        pt_BR: 'Ainda não testado',
        es: 'Aún no probado',
    },
    'notifications.test_succeeded': {
        en: 'Last test succeeded',
        pt_BR: 'Último teste bem-sucedido',
        es: 'Última prueba exitosa',
    },
    'notifications.test_failed_status': {
        en: 'Last test failed',
        pt_BR: 'Último teste com falha',
        es: 'Última prueba fallida',
    },
    'notifications.last_tested_at': {
        en: 'Tested {{date}}',
        pt_BR: 'Testado em {{date}}',
        es: 'Probado el {{date}}',
    },
    'notifications.paused': {
        en: 'Paused',
        pt_BR: 'Pausado',
        es: 'Pausado',
    },
    'notifications.pause': {
        en: 'Pause',
        pt_BR: 'Pausar',
        es: 'Pausar',
    },
    'notifications.activate': {
        en: 'Activate',
        pt_BR: 'Ativar',
        es: 'Activar',
    },
});
