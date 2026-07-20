import { defineMessages } from './define-messages';

export const modelMessages = defineMessages({
    'models.title': {
        en: 'Oxidized models',
        pt_BR: 'Modelos Oxidized',
        es: 'Modelos de Oxidized',
    },
    'models.extensibility': {
        en: 'Extensibility',
        pt_BR: 'Extensibilidade',
        es: 'Extensibilidad',
    },
    'models.description': {
        en: '{{total}} official Oxidized {{version}} drivers, plus guided models and advanced Ruby.',
        pt_BR: '{{total}} drivers oficiais do Oxidized {{version}}, além dos modelos guiados e Ruby avançado.',
        es: '{{total}} drivers oficiales de Oxidized {{version}}, además de modelos guiados y Ruby avanzado.',
    },
    'models.privileged_code': {
        en: 'High-privilege code',
        pt_BR: 'Código com alto privilégio',
        es: 'Código con privilegios elevados',
    },
    'models.safe_mode_active': {
        en: 'Safe mode is active',
        pt_BR: 'O modo seguro está ativo',
        es: 'El modo seguro está activo',
    },
    'models.safe_mode_description': {
        en: 'Guided models are limited to reviewed drivers and constant read-only commands. Arbitrary Ruby is unavailable.',
        pt_BR: 'Modelos guiados são limitados a drivers revisados e comandos constantes somente leitura. Ruby arbitrário está indisponível.',
        es: 'Los modelos guiados están limitados a drivers revisados y comandos constantes de solo lectura. Ruby arbitrario no está disponible.',
    },
    'models.raw_mode_enabled': {
        en: 'Dangerous Ruby mode is enabled',
        pt_BR: 'O modo perigoso de Ruby está habilitado',
        es: 'El modo peligroso de Ruby está habilitado',
    },
    'models.raw_mode_warning': {
        en: 'Ruby models can execute code, open connections and send commands to equipment. The read-only guarantee is conditional while this feature is enabled.',
        pt_BR: 'Modelos Ruby podem executar código, abrir conexões e enviar comandos aos equipamentos. A garantia de somente leitura é condicional enquanto este recurso estiver habilitado.',
        es: 'Los modelos Ruby pueden ejecutar código, abrir conexiones y enviar comandos a los equipos. La garantía de solo lectura es condicional mientras esta función esté habilitada.',
    },
    'models.official_only': {
        en: 'Only the official catalog is active',
        pt_BR: 'Somente o catálogo oficial está ativo',
        es: 'Solo está activo el catálogo oficial',
    },
    'models.official_only_hint': {
        en: 'Create a custom draft when you need device-specific commands.',
        pt_BR: 'Crie um rascunho personalizado quando precisar de comandos específicos.',
        es: 'Crea un borrador personalizado cuando necesites comandos específicos.',
    },
    'models.test_message': {
        en: 'Test: {{message}}',
        pt_BR: 'Teste: {{message}}',
        es: 'Prueba: {{message}}',
    },
    'models.guided': {
        en: 'Guided assistant',
        pt_BR: 'Assistente guiado',
        es: 'Asistente guiado',
    },
    'models.guided_short': {
        en: 'Assistant',
        pt_BR: 'Assistente',
        es: 'Asistente',
    },
    'models.advanced_ruby': {
        en: 'Advanced Ruby',
        pt_BR: 'Ruby avançado',
        es: 'Ruby avanzado',
    },
    'models.test_device_label': {
        en: 'Test device for {{name}}',
        pt_BR: 'Equipamento de teste para {{name}}',
        es: 'Equipo de prueba para {{name}}',
    },
    'models.test_on': {
        en: 'Test on…',
        pt_BR: 'Testar em…',
        es: 'Probar en…',
    },
    'models.publish': {
        en: 'Publish',
        pt_BR: 'Publicar',
        es: 'Publicar',
    },
    'models.new': {
        en: 'New model',
        pt_BR: 'Novo modelo',
        es: 'Nuevo modelo',
    },
    'models.identifier': {
        en: 'Identifier',
        pt_BR: 'Identificador',
        es: 'Identificador',
    },
    'models.reviewed_driver': {
        en: 'Reviewed base driver',
        pt_BR: 'Driver base revisado',
        es: 'Driver base revisado',
    },
    'models.select_reviewed_driver': {
        en: 'Select a reviewed driver',
        pt_BR: 'Selecione um driver revisado',
        es: 'Selecciona un driver revisado',
    },
    'models.select_driver_first': {
        en: 'Select the driver to see its approved read-only commands.',
        pt_BR: 'Selecione o driver para ver seus comandos somente leitura aprovados.',
        es: 'Selecciona el driver para ver sus comandos de solo lectura aprobados.',
    },
    'models.prompt_expression': {
        en: 'Prompt expression',
        pt_BR: 'Expressão do prompt',
        es: 'Expresión del prompt',
    },
    'models.comment_prefix': {
        en: 'Comment prefix',
        pt_BR: 'Prefixo de comentário',
        es: 'Prefijo de comentario',
    },
    'models.post_login_command': {
        en: 'Post-login command',
        pt_BR: 'Comando após login',
        es: 'Comando después del login',
    },
    'models.use_enable': {
        en: 'Use the enable secret when available',
        pt_BR: 'Usar segredo enable quando disponível',
        es: 'Usar el secreto enable cuando esté disponible',
    },
    'models.commands': {
        en: 'Approved read-only commands',
        pt_BR: 'Comandos somente leitura aprovados',
        es: 'Comandos de solo lectura aprobados',
    },
    'models.filters': {
        en: 'Regex filters (one per line)',
        pt_BR: 'Filtros regex (um por linha)',
        es: 'Filtros regex (uno por línea)',
    },
    'models.logout_command': {
        en: 'Logout command',
        pt_BR: 'Comando de saída',
        es: 'Comando de salida',
    },
    'models.ruby_file': {
        en: 'Complete Ruby file',
        pt_BR: 'Arquivo Ruby completo',
        es: 'Archivo Ruby completo',
    },
    'models.save_draft': {
        en: 'Save draft',
        pt_BR: 'Salvar rascunho',
        es: 'Guardar borrador',
    },
    'model_status.draft': {
        en: 'Draft',
        pt_BR: 'Rascunho',
        es: 'Borrador',
    },
    'model_status.published': {
        en: 'Published',
        pt_BR: 'Publicado',
        es: 'Publicado',
    },
    'model_status.error': {
        en: 'Error',
        pt_BR: 'Erro',
        es: 'Error',
    },
});
