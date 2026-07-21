import { defineMessages } from './define-messages';

export const authMessages = defineMessages({
    'auth.name': {
        en: 'Name',
        pt_BR: 'Nome',
        es: 'Nombre',
    },
    'auth.full_name': {
        en: 'Full name',
        pt_BR: 'Nome completo',
        es: 'Nombre completo',
    },
    'auth.email': {
        en: 'Email address',
        pt_BR: 'Endereço de e-mail',
        es: 'Correo electrónico',
    },
    'auth.password': {
        en: 'Password',
        pt_BR: 'Senha',
        es: 'Contraseña',
    },
    'auth.confirm_password': {
        en: 'Confirm password',
        pt_BR: 'Confirmar senha',
        es: 'Confirmar contraseña',
    },
    'auth.current_password': {
        en: 'Current password',
        pt_BR: 'Senha atual',
        es: 'Contraseña actual',
    },
    'auth.strong_password': {
        en: 'Use a strong password',
        pt_BR: 'Use uma senha forte',
        es: 'Usa una contraseña segura',
    },
    'auth.repeat_password': {
        en: 'Repeat the password',
        pt_BR: 'Repita a senha',
        es: 'Repite la contraseña',
    },
    'auth.create_owner_head': {
        en: 'Create owner',
        pt_BR: 'Criar proprietário',
        es: 'Crear propietario',
    },
    'auth.create_owner_title': {
        en: 'Create the first owner',
        pt_BR: 'Crie o primeiro proprietário',
        es: 'Crea el primer propietario',
    },
    'auth.create_owner_description': {
        en: 'This registration is allowed only once and is protected against concurrent attempts.',
        pt_BR: 'Este cadastro é permitido uma única vez e ficará protegido contra concorrência.',
        es: 'Este registro se permite una sola vez y está protegido contra intentos simultáneos.',
    },
    'auth.create_owner': {
        en: 'Create owner',
        pt_BR: 'Criar proprietário',
        es: 'Crear propietario',
    },
    'auth.installation_token': {
        en: 'Server installation token',
        pt_BR: 'Token de instalação do servidor',
        es: 'Token de instalación del servidor',
    },
    'auth.installation_token_placeholder': {
        en: 'Paste the token shown by Docker Compose',
        pt_BR: 'Cole o token exibido pelo Docker Compose',
        es: 'Pega el token mostrado por Docker Compose',
    },
    'auth.installation_token_hint': {
        en: 'On the server, run: docker compose run --rm app php artisan netkeep:installation-token',
        pt_BR: 'No servidor, execute: docker compose run --rm app php artisan netkeep:installation-token',
        es: 'En el servidor, ejecuta: docker compose run --rm app php artisan netkeep:installation-token',
    },
    'auth.installation_started': {
        en: 'Has the installation already started?',
        pt_BR: 'A instalação já foi iniciada?',
        es: '¿La instalación ya comenzó?',
    },
    'auth.sign_in': {
        en: 'Sign in',
        pt_BR: 'Entrar',
        es: 'Ingresar',
    },
    'auth.login_head': {
        en: 'Sign in',
        pt_BR: 'Entrar',
        es: 'Ingresar',
    },
    'auth.login_title': {
        en: 'Sign in to your account',
        pt_BR: 'Entre na sua conta',
        es: 'Ingresa a tu cuenta',
    },
    'auth.login_description': {
        en: 'Enter your email and password to continue',
        pt_BR: 'Informe seu e-mail e senha para continuar',
        es: 'Ingresa tu correo y contraseña para continuar',
    },
    'auth.forgot_password': {
        en: 'Forgot your password?',
        pt_BR: 'Esqueceu sua senha?',
        es: '¿Olvidaste tu contraseña?',
    },
    'auth.remember_me': {
        en: 'Remember me',
        pt_BR: 'Lembrar de mim',
        es: 'Recordarme',
    },
    'auth.no_account': {
        en: 'Don’t have an account?',
        pt_BR: 'Não tem uma conta?',
        es: '¿No tienes una cuenta?',
    },
    'auth.sign_up': {
        en: 'Sign up',
        pt_BR: 'Criar conta',
        es: 'Registrarse',
    },
    'auth.forgot_head': {
        en: 'Forgot password',
        pt_BR: 'Esqueci a senha',
        es: 'Olvidé mi contraseña',
    },
    'auth.forgot_title': {
        en: 'Reset your password',
        pt_BR: 'Redefina sua senha',
        es: 'Restablece tu contraseña',
    },
    'auth.forgot_description': {
        en: 'Enter your email to receive a password reset link',
        pt_BR: 'Informe seu e-mail para receber o link de redefinição',
        es: 'Ingresa tu correo para recibir un enlace de restablecimiento',
    },
    'auth.send_reset_link': {
        en: 'Send reset link',
        pt_BR: 'Enviar link de redefinição',
        es: 'Enviar enlace de restablecimiento',
    },
    'auth.or_return_to': {
        en: 'Or, return to',
        pt_BR: 'Ou, volte para',
        es: 'O vuelve a',
    },
    'auth.back_to_login': {
        en: 'Back to sign in',
        pt_BR: 'Voltar para entrar',
        es: 'Volver al inicio de sesión',
    },
    'auth.reset_head': {
        en: 'Reset password',
        pt_BR: 'Redefinir senha',
        es: 'Restablecer contraseña',
    },
    'auth.reset_title': {
        en: 'Choose a new password',
        pt_BR: 'Escolha uma nova senha',
        es: 'Elige una nueva contraseña',
    },
    'auth.reset_description': {
        en: 'Enter your new password below',
        pt_BR: 'Informe sua nova senha abaixo',
        es: 'Ingresa tu nueva contraseña a continuación',
    },
    'auth.reset_password': {
        en: 'Reset password',
        pt_BR: 'Redefinir senha',
        es: 'Restablecer contraseña',
    },
    'auth.confirm_head': {
        en: 'Confirm password',
        pt_BR: 'Confirmar senha',
        es: 'Confirmar contraseña',
    },
    'auth.confirm_title': {
        en: 'Confirm your password',
        pt_BR: 'Confirme sua senha',
        es: 'Confirma tu contraseña',
    },
    'auth.confirm_description': {
        en: 'This is a secure area of the application. Confirm your password before continuing.',
        pt_BR: 'Esta é uma área segura da aplicação. Confirme sua senha antes de continuar.',
        es: 'Esta es un área segura de la aplicación. Confirma tu contraseña antes de continuar.',
    },
    'auth.confirm_with_passkey': {
        en: 'Confirm with passkey',
        pt_BR: 'Confirmar com chave de acesso',
        es: 'Confirmar con clave de acceso',
    },
    'auth.confirming': {
        en: 'Confirming…',
        pt_BR: 'Confirmando…',
        es: 'Confirmando…',
    },
    'auth.or_confirm_password': {
        en: 'Or confirm with password',
        pt_BR: 'Ou confirme com a senha',
        es: 'O confirma con la contraseña',
    },
    'auth.verify_head': {
        en: 'Email verification',
        pt_BR: 'Verificação de e-mail',
        es: 'Verificación de correo',
    },
    'auth.verify_title': {
        en: 'Verify your email address',
        pt_BR: 'Verifique seu endereço de e-mail',
        es: 'Verifica tu correo electrónico',
    },
    'auth.verify_description': {
        en: 'Verify your email address by clicking the link we just emailed to you.',
        pt_BR: 'Verifique seu endereço de e-mail clicando no link que acabamos de enviar.',
        es: 'Verifica tu correo electrónico haciendo clic en el enlace que acabamos de enviarte.',
    },
    'auth.verification_sent': {
        en: 'A new verification link was sent to the email address used during registration.',
        pt_BR: 'Um novo link de verificação foi enviado ao endereço usado no cadastro.',
        es: 'Se envió un nuevo enlace de verificación al correo utilizado durante el registro.',
    },
    'auth.resend_verification': {
        en: 'Resend verification email',
        pt_BR: 'Reenviar e-mail de verificação',
        es: 'Reenviar correo de verificación',
    },
    'auth.log_out': {
        en: 'Log out',
        pt_BR: 'Sair',
        es: 'Cerrar sesión',
    },
    'auth.two_factor_head': {
        en: 'Two-factor authentication',
        pt_BR: 'Autenticação em dois fatores',
        es: 'Autenticación de dos factores',
    },
    'auth.authentication_code': {
        en: 'Authentication code',
        pt_BR: 'Código de autenticação',
        es: 'Código de autenticación',
    },
    'auth.authentication_code_description': {
        en: 'Enter the authentication code provided by your authenticator application.',
        pt_BR: 'Informe o código fornecido pelo seu aplicativo autenticador.',
        es: 'Ingresa el código proporcionado por tu aplicación de autenticación.',
    },
    'auth.recovery_code': {
        en: 'Recovery code',
        pt_BR: 'Código de recuperação',
        es: 'Código de recuperación',
    },
    'auth.recovery_code_description': {
        en: 'Confirm access to your account by entering one of your emergency recovery codes.',
        pt_BR: 'Confirme o acesso à sua conta informando um dos códigos de recuperação de emergência.',
        es: 'Confirma el acceso a tu cuenta ingresando uno de tus códigos de recuperación de emergencia.',
    },
    'auth.enter_recovery_code': {
        en: 'Enter recovery code',
        pt_BR: 'Informe o código de recuperação',
        es: 'Ingresa el código de recuperación',
    },
    'auth.use_recovery_code': {
        en: 'Use a recovery code',
        pt_BR: 'Usar código de recuperação',
        es: 'Usar un código de recuperación',
    },
    'auth.use_authentication_code': {
        en: 'Use an authentication code',
        pt_BR: 'Usar código de autenticação',
        es: 'Usar un código de autenticación',
    },
    'auth.or_you_can': {
        en: 'or you can',
        pt_BR: 'ou você pode',
        es: 'o puedes',
    },
    'auth.continue': {
        en: 'Continue',
        pt_BR: 'Continuar',
        es: 'Continuar',
    },
});
