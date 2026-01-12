const { Resend } = require('resend');
const logger = require('../config/logger.js');

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Función helper para formatear fechas
const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Bogota'
    }).format(new Date(date));
};

// Función base para enviar emails
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        logger.info(`📧 Enviando email a: ${to}`);
        logger.info(`📋 Asunto: ${subject}`);
        
        const { data, error } = await resend.emails.send({
            from: `Sistema de Inventario <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
            to: [to],
            subject,
            text,
            html: html || `<pre>${text}</pre>`
        });

        if (error) {
            throw error;
        }
        
        logger.info(`✅ Email enviado exitosamente a: ${to}`);
        logger.info(`📬 ID: ${data.id}`);
        return { success: true, id: data.id };
    } catch (error) {
        logger.error(`❌ Error enviando email a ${to}:`, {
            error: error.message
        });
        return { success: false, error: error.message };
    }
};

// Enviar email de aprobación
const sendAprobacion = async (user, loan, item) => {
    logger.info(`📨 Preparando email de aprobación para: ${user.email}`);
    
    const subject = '✅ Préstamo Aprobado - Sistema de Inventario';
    
    const text = `
Hola ${user.nombre},

¡Tu préstamo ha sido APROBADO!

📦 Ítem: ${item.nombre}
📊 Cantidad: ${loan.cantidad_prestamo} unidad(es)
📅 Fecha estimada de devolución: ${formatDate(loan.fecha_estimada)}

Por favor, devuelve el ítem antes de la fecha indicada.

---
Sistema de Inventario
Este es un mensaje automático, no responder.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Préstamo Aprobado</h1>
        </div>
        <div class="content">
            <p>Hola <strong>${user.nombre}</strong>,</p>
            <p>¡Tu préstamo ha sido <strong>APROBADO</strong>!</p>
            
            <div class="info-box">
                <p><strong>📦 Ítem:</strong> ${item.nombre}</p>
                <p><strong>📊 Cantidad:</strong> ${loan.cantidad_prestamo} unidad(es)</p>
                <p><strong>📅 Fecha de devolución:</strong> ${formatDate(loan.fecha_estimada)}</p>
            </div>
            
            <p>Por favor, devuelve el ítem antes de la fecha indicada.</p>
        </div>
        <div class="footer">
            <p>Sistema de Inventario</p>
            <p>Este es un mensaje automático, no responder.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return sendEmail({ to: user.email, subject, text, html });
};

// Enviar email de devolución
const sendDevolucion = async (user, loan, item) => {
    logger.info(`📨 Preparando email de devolución para: ${user.email}`);
    
    const subject = '✅ Devolución Registrada - Sistema de Inventario';
    
    const text = `
Hola ${user.nombre},

Hemos registrado la devolución de tu préstamo.

📦 Ítem: ${item.nombre}
📊 Cantidad: ${loan.cantidad_prestamo} unidad(es)
📅 Fecha de devolución: ${formatDate(loan.fecha_retorno)}

¡Gracias por devolver a tiempo!

---
Sistema de Inventario
Este es un mensaje automático, no responder.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Devolución Registrada</h1>
        </div>
        <div class="content">
            <p>Hola <strong>${user.nombre}</strong>,</p>
            <p>Hemos registrado la <strong>devolución</strong> de tu préstamo.</p>
            
            <div class="info-box">
                <p><strong>📦 Ítem:</strong> ${item.nombre}</p>
                <p><strong>📊 Cantidad:</strong> ${loan.cantidad_prestamo} unidad(es)</p>
                <p><strong>📅 Devuelto el:</strong> ${formatDate(loan.fecha_retorno)}</p>
            </div>
            
            <p>¡Gracias por devolver a tiempo!</p>
        </div>
        <div class="footer">
            <p>Sistema de Inventario</p>
            <p>Este es un mensaje automático, no responder.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return sendEmail({ to: user.email, subject, text, html });
};

// Enviar recordatorio
const sendRecordatorio = async (user, loan, item) => {
    logger.info(`📨 Preparando recordatorio para: ${user.email}`);
    
    const subject = '⏰ Recordatorio de Devolución - Sistema de Inventario';
    
    const text = `
Hola ${user.nombre},

Este es un recordatorio de que tu préstamo debe ser devuelto pronto.

📦 Ítem: ${item.nombre}
📊 Cantidad: ${loan.cantidad_prestamo} unidad(es)
📅 Fecha límite: ${formatDate(loan.fecha_estimada)}

Por favor, devuelve el ítem antes de la fecha indicada.

---
Sistema de Inventario
Este es un mensaje automático, no responder.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Recordatorio de Devolución</h1>
        </div>
        <div class="content">
            <p>Hola <strong>${user.nombre}</strong>,</p>
            <p>Este es un <strong>recordatorio</strong> de que tu préstamo debe ser devuelto pronto.</p>
            
            <div class="info-box">
                <p><strong>📦 Ítem:</strong> ${item.nombre}</p>
                <p><strong>📊 Cantidad:</strong> ${loan.cantidad_prestamo} unidad(es)</p>
                <p><strong>📅 Fecha límite:</strong> ${formatDate(loan.fecha_estimada)}</p>
            </div>
            
            <p>Por favor, devuelve el ítem antes de la fecha indicada.</p>
        </div>
        <div class="footer">
            <p>Sistema de Inventario</p>
            <p>Este es un mensaje automático, no responder.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return sendEmail({ to: user.email, subject, text, html });
};

// Enviar email de aplazamiento
const sendAplazado = async (user, loan, item) => {
    logger.info(`📨 Preparando email de aplazamiento para: ${user.email}`);
    
    const subject = '📅 Fecha de Préstamo Actualizada - Sistema de Inventario';
    
    const text = `
Hola ${user.nombre},

La fecha de devolución de tu préstamo ha sido actualizada.

📦 Ítem: ${item.nombre}
📊 Cantidad: ${loan.cantidad_prestamo} unidad(es)
📅 Nueva fecha de devolución: ${formatDate(loan.fecha_estimada)}

Por favor, devuelve el ítem antes de la nueva fecha indicada.

---
Sistema de Inventario
Este es un mensaje automático, no responder.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #9C27B0; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #9C27B0; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Fecha Actualizada</h1>
        </div>
        <div class="content">
            <p>Hola <strong>${user.nombre}</strong>,</p>
            <p>La fecha de devolución de tu préstamo ha sido <strong>actualizada</strong>.</p>
            
            <div class="info-box">
                <p><strong>📦 Ítem:</strong> ${item.nombre}</p>
                <p><strong>📊 Cantidad:</strong> ${loan.cantidad_prestamo} unidad(es)</p>
                <p><strong>📅 Nueva fecha:</strong> ${formatDate(loan.fecha_estimada)}</p>
            </div>
            
            <p>Por favor, devuelve el ítem antes de la nueva fecha indicada.</p>
        </div>
        <div class="footer">
            <p>Sistema de Inventario</p>
            <p>Este es un mensaje automático, no responder.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return sendEmail({ to: user.email, subject, text, html });
};

// Notificar a administradores
const notifyAdminsNewLoan = async (user, loan, item, aula) => {
    logger.info(`📨 Preparando notificación para administradores`);
    
    const User = require('../models/User.js');
    
    try {
        const admins = await User.find({ rol: 'Admin' }).lean();
        
        if (!admins || admins.length === 0) {
            logger.warn('No hay administradores registrados');
            return { success: false, error: 'No admins found' };
        }

        logger.info(`Notificando a ${admins.length} administrador(es)`);

        const subject = '🔔 Nueva Solicitud de Préstamo - Requiere Aprobación';
        
        const text = `
Nueva solicitud de préstamo recibida:

═══════════════════════════════
📋 DETALLES DE LA SOLICITUD
═══════════════════════════════

👤 Solicitante: ${user.nombre}
📧 Email: ${user.email}
📦 Ítem: ${item.nombre}
📊 Cantidad: ${loan.cantidad_prestamo} unidad(es)
📍 Ubicación: ${aula.nombre}
📅 Fecha: ${formatDate(loan.fecha_solicitud || new Date())}

═══════════════════════════════
⚡ ACCIÓN REQUERIDA
═══════════════════════════════

Por favor, ingresa al sistema para revisar y aprobar o rechazar esta solicitud.

🔗 Panel de Administración > Solicitudes Pendientes

═══════════════════════════════

Sistema de Inventario
Este es un mensaje automático, no responder.
        `.trim();

        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #F44336; }
        .action-box { background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border: 2px solid #ffc107; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Nueva Solicitud de Préstamo</h1>
        </div>
        <div class="content">
            <p><strong>Nueva solicitud de préstamo recibida:</strong></p>
            
            <div class="info-box">
                <p><strong>👤 Solicitante:</strong> ${user.nombre}</p>
                <p><strong>📧 Email:</strong> ${user.email}</p>
                <p><strong>📦 Ítem:</strong> ${item.nombre}</p>
                <p><strong>📊 Cantidad:</strong> ${loan.cantidad_prestamo} unidad(es)</p>
                <p><strong>📍 Ubicación:</strong> ${aula.nombre}</p>
                <p><strong>📅 Fecha:</strong> ${formatDate(loan.fecha_solicitud || new Date())}</p>
            </div>
            
            <div class="action-box">
                <p><strong>⚡ ACCIÓN REQUERIDA</strong></p>
                <p>Por favor, ingresa al sistema para revisar y aprobar o rechazar esta solicitud.</p>
                <p><strong>🔗 Panel de Administración > Solicitudes Pendientes</strong></p>
            </div>
        </div>
        <div class="footer">
            <p>Sistema de Inventario</p>
            <p>Este es un mensaje automático, no responder.</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        const results = await Promise.allSettled(
            admins.map(admin => sendEmail({ to: admin.email, subject, text, html }))
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
        const failed = results.length - successful;

        logger.info(`✅ Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`);

        return { success: successful > 0, successful, failed };
    } catch (error) {
        logger.error('Error notificando administradores:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendAprobacion,
    sendDevolucion,
    sendRecordatorio,
    sendAplazado,
    notifyAdminsNewLoan
};