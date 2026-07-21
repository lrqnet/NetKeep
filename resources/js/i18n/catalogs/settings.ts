import { defineMessages } from './define-messages';

export const settingsMessages = defineMessages({
    'profile.email_admin_only': {
        en: 'For security, email changes are made by an owner or administrator after reauthentication.',
        pt_BR: 'Por segurança, mudanças de e-mail são feitas por proprietário ou administrador após reautenticação.',
        es: 'Por seguridad, los cambios de correo los realiza un propietario o administrador después de reautenticarse.',
    },
    'settings.title': {
        en: 'Settings',
        pt_BR: 'Preferências',
        es: 'Preferencias',
    },
    'settings.description': {
        en: 'Manage your profile and account settings',
        pt_BR: 'Gerencie seu perfil e as preferências da conta',
        es: 'Administra tu perfil y las preferencias de la cuenta',
    },
    'settings.profile': {
        en: 'Profile',
        pt_BR: 'Perfil',
        es: 'Perfil',
    },
    'settings.security': {
        en: 'Security',
        pt_BR: 'Segurança',
        es: 'Seguridad',
    },
    'settings.appearance': {
        en: 'Appearance',
        pt_BR: 'Aparência',
        es: 'Apariencia',
    },
    'profile.title': {
        en: 'Profile settings',
        pt_BR: 'Configurações do perfil',
        es: 'Configuración del perfil',
    },
    'profile.description': {
        en: 'Update your name and personal language preference',
        pt_BR: 'Atualize seu nome e sua preferência pessoal de idioma',
        es: 'Actualiza tu nombre y tu preferencia personal de idioma',
    },
    'profile.unverified': {
        en: 'Your email address is unverified.',
        pt_BR: 'Seu endereço de e-mail não foi verificado.',
        es: 'Tu correo electrónico no está verificado.',
    },
    'profile.resend': {
        en: 'Click here to resend the verification email.',
        pt_BR: 'Clique aqui para reenviar o e-mail de verificação.',
        es: 'Haz clic aquí para reenviar el correo de verificación.',
    },
    'profile.verification_sent': {
        en: 'A new verification link was sent to your email address.',
        pt_BR: 'Um novo link de verificação foi enviado ao seu e-mail.',
        es: 'Se envió un nuevo enlace de verificación a tu correo.',
    },
    'profile.delete_title': {
        en: 'Delete account',
        pt_BR: 'Excluir conta',
        es: 'Eliminar cuenta',
    },
    'profile.delete_description': {
        en: 'Delete your account and all of its resources',
        pt_BR: 'Exclua sua conta e todos os seus recursos',
        es: 'Elimina tu cuenta y todos sus recursos',
    },
    'profile.warning': {
        en: 'Warning',
        pt_BR: 'Atenção',
        es: 'Advertencia',
    },
    'profile.delete_warning': {
        en: 'Proceed with caution. This action cannot be undone.',
        pt_BR: 'Prossiga com cuidado. Esta ação não pode ser desfeita.',
        es: 'Continúa con cuidado. Esta acción no se puede deshacer.',
    },
    'profile.delete_confirm_title': {
        en: 'Are you sure you want to delete your account?',
        pt_BR: 'Tem certeza de que deseja excluir sua conta?',
        es: '¿Seguro que quieres eliminar tu cuenta?',
    },
    'profile.delete_confirm_description': {
        en: 'After deletion, all account resources and data will be permanently removed. Enter your password to confirm.',
        pt_BR: 'Após a exclusão, todos os recursos e dados da conta serão removidos permanentemente. Informe sua senha para confirmar.',
        es: 'Después de eliminarla, todos los recursos y datos de la cuenta se borrarán permanentemente. Ingresa tu contraseña para confirmar.',
    },
    'security.title': {
        en: 'Security settings',
        pt_BR: 'Configurações de segurança',
        es: 'Configuración de seguridad',
    },
    'security.update_password': {
        en: 'Update password',
        pt_BR: 'Atualizar senha',
        es: 'Actualizar contraseña',
    },
    'security.password_description': {
        en: 'Use a long, random password to keep your account secure',
        pt_BR: 'Use uma senha longa e aleatória para manter sua conta segura',
        es: 'Usa una contraseña larga y aleatoria para mantener tu cuenta segura',
    },
    'security.new_password': {
        en: 'New password',
        pt_BR: 'Nova senha',
        es: 'Nueva contraseña',
    },
    'appearance.title': {
        en: 'Appearance settings',
        pt_BR: 'Configurações de aparência',
        es: 'Configuración de apariencia',
    },
    'appearance.description': {
        en: 'Update the appearance settings for your account',
        pt_BR: 'Atualize as configurações de aparência da sua conta',
        es: 'Actualiza la apariencia de tu cuenta',
    },
    'appearance.light': {
        en: 'Light',
        pt_BR: 'Claro',
        es: 'Claro',
    },
    'appearance.dark': {
        en: 'Dark',
        pt_BR: 'Escuro',
        es: 'Oscuro',
    },
    'appearance.system': {
        en: 'System',
        pt_BR: 'Sistema',
        es: 'Sistema',
    },
    'passkeys.title': {
        en: 'Passkeys',
        pt_BR: 'Chaves de acesso',
        es: 'Claves de acceso',
    },
    'passkeys.description': {
        en: 'Manage passkeys for passwordless sign-in',
        pt_BR: 'Gerencie chaves de acesso para entrar sem senha',
        es: 'Administra claves de acceso para ingresar sin contraseña',
    },
    'passkeys.empty': {
        en: 'No passkeys yet',
        pt_BR: 'Nenhuma chave de acesso ainda',
        es: 'Aún no hay claves de acceso',
    },
    'passkeys.empty_hint': {
        en: 'Add a passkey to sign in without a password',
        pt_BR: 'Adicione uma chave de acesso para entrar sem senha',
        es: 'Agrega una clave de acceso para ingresar sin contraseña',
    },
    'passkeys.added': {
        en: 'Added {{value}}',
        pt_BR: 'Adicionada {{value}}',
        es: 'Agregada {{value}}',
    },
    'passkeys.last_used': {
        en: 'Last used {{value}}',
        pt_BR: 'Último uso {{value}}',
        es: 'Último uso {{value}}',
    },
    'passkeys.remove': {
        en: 'Remove passkey',
        pt_BR: 'Remover chave de acesso',
        es: 'Eliminar clave de acceso',
    },
    'passkeys.remove_confirm': {
        en: 'Remove “{{name}}”? You will no longer be able to use this passkey to sign in.',
        pt_BR: 'Remover “{{name}}”? Você não poderá mais usar esta chave de acesso para entrar.',
        es: '¿Eliminar “{{name}}”? Ya no podrás usar esta clave de acceso para ingresar.',
    },
    'passkeys.removing': {
        en: 'Removing…',
        pt_BR: 'Removendo…',
        es: 'Eliminando…',
    },
    'passkeys.unsupported': {
        en: 'Passkeys are not supported in this browser.',
        pt_BR: 'Este navegador não oferece suporte a chaves de acesso.',
        es: 'Este navegador no admite claves de acceso.',
    },
    'passkeys.add': {
        en: 'Add passkey',
        pt_BR: 'Adicionar chave de acesso',
        es: 'Agregar clave de acceso',
    },
    'passkeys.name': {
        en: 'Passkey name',
        pt_BR: 'Nome da chave de acesso',
        es: 'Nombre de la clave de acceso',
    },
    'passkeys.name_placeholder': {
        en: 'Example: MacBook Pro, iPhone',
        pt_BR: 'Ex.: MacBook Pro, iPhone',
        es: 'Ej.: MacBook Pro, iPhone',
    },
    'passkeys.name_hint': {
        en: 'A name helps you identify this passkey later.',
        pt_BR: 'Um nome ajuda a identificar esta chave de acesso depois.',
        es: 'Un nombre te ayuda a identificar esta clave de acceso más adelante.',
    },
    'passkeys.suggested_name': {
        en: '{{browser}} on {{os}}',
        pt_BR: '{{browser}} em {{os}}',
        es: '{{browser}} en {{os}}',
    },
    'passkeys.register': {
        en: 'Register passkey',
        pt_BR: 'Cadastrar chave de acesso',
        es: 'Registrar clave de acceso',
    },
    'passkeys.registering': {
        en: 'Registering…',
        pt_BR: 'Cadastrando…',
        es: 'Registrando…',
    },
    'passkeys.authenticating': {
        en: 'Authenticating…',
        pt_BR: 'Autenticando…',
        es: 'Autenticando…',
    },
    'passkeys.sign_in': {
        en: 'Sign in with a passkey',
        pt_BR: 'Entrar com chave de acesso',
        es: 'Ingresar con clave de acceso',
    },
    'passkeys.or_email': {
        en: 'Or continue with email',
        pt_BR: 'Ou continue com e-mail',
        es: 'O continúa con correo',
    },
    'two_factor.title': {
        en: 'Two-factor authentication',
        pt_BR: 'Autenticação em dois fatores',
        es: 'Autenticación de dos factores',
    },
    'two_factor.description': {
        en: 'Manage your two-factor authentication settings',
        pt_BR: 'Gerencie as configurações de autenticação em dois fatores',
        es: 'Administra la configuración de autenticación de dos factores',
    },
    'two_factor.enabled_hint': {
        en: 'During sign-in, enter the secure random code generated by the TOTP application on your phone.',
        pt_BR: 'Durante o login, informe o código aleatório seguro gerado pelo aplicativo TOTP no seu telefone.',
        es: 'Durante el ingreso, introduce el código seguro generado por la aplicación TOTP de tu teléfono.',
    },
    'two_factor.disabled_hint': {
        en: 'When enabled, sign-in will require a secure code generated by a TOTP application on your phone.',
        pt_BR: 'Quando ativada, a entrada exigirá um código seguro gerado por um aplicativo TOTP no seu telefone.',
        es: 'Al activarla, el ingreso requerirá un código seguro generado por una aplicación TOTP en tu teléfono.',
    },
    'two_factor.disable': {
        en: 'Disable 2FA',
        pt_BR: 'Desativar 2FA',
        es: 'Desactivar 2FA',
    },
    'two_factor.enable': {
        en: 'Enable 2FA',
        pt_BR: 'Ativar 2FA',
        es: 'Activar 2FA',
    },
    'two_factor.continue_setup': {
        en: 'Continue setup',
        pt_BR: 'Continuar configuração',
        es: 'Continuar configuración',
    },
    'two_factor.recovery_title': {
        en: '2FA recovery codes',
        pt_BR: 'Códigos de recuperação da 2FA',
        es: 'Códigos de recuperación de 2FA',
    },
    'two_factor.recovery_description': {
        en: 'Recovery codes restore access if you lose your 2FA device. Store them in a secure password manager.',
        pt_BR: 'Os códigos recuperam o acesso caso você perca o dispositivo de 2FA. Guarde-os em um gerenciador de senhas seguro.',
        es: 'Los códigos recuperan el acceso si pierdes tu dispositivo de 2FA. Guárdalos en un gestor de contraseñas seguro.',
    },
    'two_factor.view_codes': {
        en: 'View recovery codes',
        pt_BR: 'Ver códigos de recuperação',
        es: 'Ver códigos de recuperación',
    },
    'two_factor.hide_codes': {
        en: 'Hide recovery codes',
        pt_BR: 'Ocultar códigos de recuperação',
        es: 'Ocultar códigos de recuperación',
    },
    'two_factor.regenerate': {
        en: 'Regenerate codes',
        pt_BR: 'Gerar novos códigos',
        es: 'Regenerar códigos',
    },
    'two_factor.codes_label': {
        en: 'Recovery codes',
        pt_BR: 'Códigos de recuperação',
        es: 'Códigos de recuperación',
    },
    'two_factor.loading_codes': {
        en: 'Loading recovery codes',
        pt_BR: 'Carregando códigos de recuperação',
        es: 'Cargando códigos de recuperación',
    },
    'two_factor.codes_warning': {
        en: 'Each recovery code can be used only once and is removed after use. Generate new codes when needed.',
        pt_BR: 'Cada código de recuperação pode ser usado uma única vez e é removido após o uso. Gere novos códigos quando necessário.',
        es: 'Cada código de recuperación puede usarse una sola vez y se elimina después de usarlo. Genera nuevos códigos cuando sea necesario.',
    },
    'two_factor.manual_code': {
        en: 'or enter the code manually',
        pt_BR: 'ou informe o código manualmente',
        es: 'o ingresa el código manualmente',
    },
    'two_factor.back': {
        en: 'Back',
        pt_BR: 'Voltar',
        es: 'Volver',
    },
    'two_factor.enabled_title': {
        en: 'Two-factor authentication enabled',
        pt_BR: 'Autenticação em dois fatores ativada',
        es: 'Autenticación de dos factores activada',
    },
    'two_factor.enabled_description': {
        en: 'Two-factor authentication is enabled. Scan the QR code or enter the setup key in your authenticator app.',
        pt_BR: 'A autenticação em dois fatores está ativada. Escaneie o QR code ou informe a chave no aplicativo autenticador.',
        es: 'La autenticación de dos factores está activada. Escanea el código QR o ingresa la clave en tu aplicación.',
    },
    'two_factor.verify_title': {
        en: 'Verify authentication code',
        pt_BR: 'Verificar código de autenticação',
        es: 'Verificar código de autenticación',
    },
    'two_factor.verify_description': {
        en: 'Enter the 6-digit code from your authenticator app',
        pt_BR: 'Informe o código de 6 dígitos do aplicativo autenticador',
        es: 'Ingresa el código de 6 dígitos de tu aplicación',
    },
    'two_factor.enable_title': {
        en: 'Enable two-factor authentication',
        pt_BR: 'Ativar autenticação em dois fatores',
        es: 'Activar autenticación de dos factores',
    },
    'two_factor.enable_description': {
        en: 'To finish, scan the QR code or enter the setup key in your authenticator app.',
        pt_BR: 'Para concluir, escaneie o QR code ou informe a chave no aplicativo autenticador.',
        es: 'Para finalizar, escanea el código QR o ingresa la clave en tu aplicación.',
    },
    'two_factor.fetch_qr_failed': {
        en: 'Failed to fetch the QR code',
        pt_BR: 'Não foi possível obter o QR code',
        es: 'No se pudo obtener el código QR',
    },
    'two_factor.fetch_key_failed': {
        en: 'Failed to fetch the setup key',
        pt_BR: 'Não foi possível obter a chave de configuração',
        es: 'No se pudo obtener la clave de configuración',
    },
    'two_factor.fetch_codes_failed': {
        en: 'Failed to fetch recovery codes',
        pt_BR: 'Não foi possível obter os códigos de recuperação',
        es: 'No se pudieron obtener los códigos de recuperación',
    },
    'password.show': {
        en: 'Show password',
        pt_BR: 'Mostrar senha',
        es: 'Mostrar contraseña',
    },
    'password.hide': {
        en: 'Hide password',
        pt_BR: 'Ocultar senha',
        es: 'Ocultar contraseña',
    },
    'user_menu.settings': {
        en: 'Settings',
        pt_BR: 'Preferências',
        es: 'Preferencias',
    },
    'user_menu.logout': {
        en: 'Log out',
        pt_BR: 'Sair',
        es: 'Cerrar sesión',
    },
});
