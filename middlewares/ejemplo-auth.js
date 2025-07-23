await registrarAuditoria({
      accion: 'SELECT',
      modulo: 'seguridad',
      tabla: 'permisos',
      id_usuario: usuarioAutenticado?.id_usuario || null,
      details: {
        consulta: 'SELECT * FROM permisos ORDER BY id_permiso',
        token: token || 'Sin token',
        usuario_autenticado: usuarioAutenticado?.usuario || 'Sin usuario autenticado'
      },
      nombre_rol: usuarioAutenticado?.nombre_rol || 'Sistema'
    });