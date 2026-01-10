const logger = require('../config/logger.js');
const {
    aprobacionTemplate,
    devolucionTemplate,
    recordatorioTemplate,
    aplazadoTemplate
} = require('../utils/mailTemplates.js');


const sendMail = async ({ to, subject, text }) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
        logger.warn('⚠️ RESEND_API_KEY no configurada - correo no enviado');
        logger.info('📧 [SIMULADO] Correo que se enviaría:', { to, subject });
        return;
    }
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.MAIL_FROM || 'Sistema Inventario <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                text: text
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Resend API error: ${error.message || response.statusText}`);
        }

        const result = await response.json();
        
        logger.info('✅ Correo enviado exitosamente via Resend', { 
            id: result.id,
            to,
            subject
        });
        
        return result;
    } catch (error) {
        logger.error('❌ Error enviando correo via Resend', { 
            error: error.message,
            to,
            subject
        });
    }
};

const sendAprobacion = (user, loan, item) => {
    const template = aprobacionTemplate({
        nombreUsuario: user.nombre,
        itemNombre: item.nombre,
        fechaEstimada: loan.fecha_estimada,
        cantidad: loan.cantidad_prestamo
    });
    
    setImmediate(() => {
        sendMail({ ...template, to: user.email })
            .catch(err => {
                logger.error('Error en sendAprobacion:', err?.message);
            });
    });
};

const sendDevolucion = (user, loan, item) => {
    const template = devolucionTemplate({
        nombreUsuario: user.nombre,
        itemNombre: item.nombre,
        cantidad: loan.cantidad_prestamo
    });
    
    setImmediate(() => {
        sendMail({ ...template, to: user.email })
            .catch(err => {
                logger.error('Error en sendDevolucion:', err?.message);
            });
    });
};

const sendRecordatorio = (user, loan, item) => {
    const template = recordatorioTemplate({
        nombreUsuario: user.nombre,
        itemNombre: item.nombre,
        fechaEstimada: loan.fecha_estimada
    });
    
    setImmediate(() => {
        sendMail({ ...template, to: user.email })
            .catch(err => {
                logger.error('Error en sendRecordatorio:', err?.message);
            });
    });
};

const sendAplazado = (user, loan, item) => {
    const template = aplazadoTemplate({
        nombreUsuario: user.nombre,
        itemNombre: item.nombre,
        nuevaFecha: loan.fecha_estimada
    });
    
    setImmediate(() => {
        sendMail({ ...template, to: user.email })
            .catch(err => {
                logger.error('Error en sendAplazado:', err?.message);
            });
    });
};

module.exports = {
    sendMail,
    sendAprobacion,
    sendDevolucion,
    sendRecordatorio,
    sendAplazado
};