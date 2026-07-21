import { defineMessages } from './define-messages';

export const dataProtectionMessages = defineMessages({
    'data_protection.title': {
        en: 'Data protection',
        pt_BR: 'Proteção de dados',
        es: 'Protección de datos',
    },
    'data_protection.eyebrow': {
        en: 'Resilience',
        pt_BR: 'Resiliência',
        es: 'Resiliencia',
    },
    'data_protection.heading': {
        en: 'Data protection',
        pt_BR: 'Proteção de dados',
        es: 'Protección de datos',
    },
    'data_protection.description': {
        en: 'Protect NetKeep history with encrypted local or S3 backups and a private Git mirror.',
        pt_BR: 'Proteja o histórico do NetKeep com backups criptografados locais ou S3 e um espelho Git privado.',
        es: 'Protege el historial de NetKeep con respaldos cifrados locales o S3 y un espejo Git privado.',
    },
    'data_protection.summary.active': {
        en: 'Active destinations',
        pt_BR: 'Destinos ativos',
        es: 'Destinos activos',
    },
    'data_protection.summary.paused': {
        en: 'Paused destinations',
        pt_BR: 'Destinos pausados',
        es: 'Destinos pausados',
    },
    'data_protection.summary.failed': {
        en: 'Last run failed',
        pt_BR: 'Falha na última execução',
        es: 'Falla en la última ejecución',
    },
    'data_protection.destinations': {
        en: 'Backup destinations',
        pt_BR: 'Destinos de proteção',
        es: 'Destinos de protección',
    },
    'data_protection.destinations_description': {
        en: 'Full backups are encrypted before storage. Git destinations must always be private.',
        pt_BR: 'Backups completos são criptografados antes do armazenamento. Destinos Git devem ser sempre privados.',
        es: 'Los respaldos completos se cifran antes de almacenarse. Los destinos Git siempre deben ser privados.',
    },
    'data_protection.destination_type.git': {
        en: 'Git',
        pt_BR: 'Git',
        es: 'Git',
    },
    'data_protection.destination_type.s3': {
        en: 'S3',
        pt_BR: 'S3',
        es: 'S3',
    },
    'data_protection.destination_type.local': {
        en: 'Local',
        pt_BR: 'Local',
        es: 'Local',
    },
    'data_protection.paused': {
        en: 'Paused',
        pt_BR: 'Pausado',
        es: 'Pausado',
    },
    'data_protection.mirror': {
        en: 'Mirror',
        pt_BR: 'Espelhar',
        es: 'Replicar',
    },
    'data_protection.backup': {
        en: 'Backup',
        pt_BR: 'Backup',
        es: 'Respaldo',
    },
    'data_protection.pause': {
        en: 'Pause',
        pt_BR: 'Pausar',
        es: 'Pausar',
    },
    'data_protection.activate': {
        en: 'Activate',
        pt_BR: 'Ativar',
        es: 'Activar',
    },
    'data_protection.not_run': {
        en: 'No runs yet',
        pt_BR: 'Nenhuma execução ainda',
        es: 'Aún no hay ejecuciones',
    },
    'data_protection.run_status.queued': {
        en: 'Queued',
        pt_BR: 'Na fila',
        es: 'En cola',
    },
    'data_protection.run_status.running': {
        en: 'Running',
        pt_BR: 'Em execução',
        es: 'En ejecución',
    },
    'data_protection.run_status.completed': {
        en: 'Last run succeeded',
        pt_BR: 'Última execução concluída',
        es: 'Última ejecución completada',
    },
    'data_protection.run_status.failed': {
        en: 'Last run failed',
        pt_BR: 'Falha na última execução',
        es: 'Falla en la última ejecución',
    },
    'data_protection.last_run_at': {
        en: 'Last activity: {{date}}',
        pt_BR: 'Última atividade: {{date}}',
        es: 'Última actividad: {{date}}',
    },
    'data_protection.archive_size': {
        en: 'Archive size: {{size}} MB',
        pt_BR: 'Tamanho do arquivo: {{size}} MB',
        es: 'Tamaño del archivo: {{size}} MB',
    },
    'data_protection.new_s3': {
        en: 'New S3 destination',
        pt_BR: 'Novo destino S3',
        es: 'Nuevo destino S3',
    },
    'data_protection.s3_endpoint': {
        en: 'S3 endpoint',
        pt_BR: 'Endpoint S3',
        es: 'Endpoint S3',
    },
    'data_protection.s3_bucket': {
        en: 'Bucket',
        pt_BR: 'Bucket',
        es: 'Bucket',
    },
    'data_protection.s3_access_key': {
        en: 'Access key',
        pt_BR: 'Chave de acesso',
        es: 'Clave de acceso',
    },
    'data_protection.s3_secret': {
        en: 'Secret key',
        pt_BR: 'Chave secreta',
        es: 'Clave secreta',
    },
    'data_protection.recovery': {
        en: 'Recovery',
        pt_BR: 'Recuperação',
        es: 'Recuperación',
    },
    'data_protection.recovery_password': {
        en: 'Recovery password',
        pt_BR: 'Senha de recuperação',
        es: 'Contraseña de recuperación',
    },
    'data_protection.age_key': {
        en: 'age key',
        pt_BR: 'Chave age',
        es: 'Clave age',
    },
    'data_protection.recovery_password_min': {
        en: 'Recovery password (min. 16)',
        pt_BR: 'Senha de recuperação (mín. 16)',
        es: 'Contraseña de recuperación (mín. 16)',
    },
    'data_protection.age_recipient': {
        en: 'age recipient',
        pt_BR: 'Destinatário age',
        es: 'Destinatario age',
    },
    'data_protection.save_destination': {
        en: 'Save destination',
        pt_BR: 'Salvar destino',
        es: 'Guardar destino',
    },
    'data_protection.new_git': {
        en: 'New private Git mirror',
        pt_BR: 'Novo espelho Git privado',
        es: 'Nuevo espejo Git privado',
    },
    'data_protection.authentication': {
        en: 'Authentication',
        pt_BR: 'Autenticação',
        es: 'Autenticación',
    },
    'data_protection.https_token_authentication': {
        en: 'HTTPS + token',
        pt_BR: 'HTTPS + token',
        es: 'HTTPS + token',
    },
    'data_protection.ssh_private_key': {
        en: 'SSH + private key',
        pt_BR: 'SSH + chave privada',
        es: 'SSH + clave privada',
    },
    'data_protection.repository_url': {
        en: 'Repository URL',
        pt_BR: 'URL do repositório',
        es: 'URL del repositorio',
    },
    'data_protection.https_token': {
        en: 'Access token',
        pt_BR: 'Token de acesso',
        es: 'Token de acceso',
    },
    'data_protection.private_key': {
        en: 'Private key',
        pt_BR: 'Chave privada',
        es: 'Clave privada',
    },
    'data_protection.mode_hint': {
        en: 'The private key is stored encrypted.',
        pt_BR: 'A chave privada é armazenada criptografada.',
        es: 'La clave privada se almacena cifrada.',
    },
    'data_protection.private_confirmation': {
        en: 'I confirm that this repository is private and intended for sensitive configuration data.',
        pt_BR: 'Confirmo que o repositório é privado e destinado a dados sensíveis de configuração.',
        es: 'Confirmo que el repositorio es privado y está destinado a datos sensibles de configuración.',
    },
    'data_protection.save_mirror': {
        en: 'Save mirror',
        pt_BR: 'Salvar espelho',
        es: 'Guardar espejo',
    },
    'data_protection.local_backup': {
        en: 'Encrypted local backup',
        pt_BR: 'Backup local criptografado',
        es: 'Respaldo local cifrado',
    },
    'data_protection.local_copy': {
        en: 'Local copy',
        pt_BR: 'Cópia local',
        es: 'Copia local',
    },
});
