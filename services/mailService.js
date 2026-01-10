const nodemailer = require('nodemailer');
const logger = require('../config/logger.js');
const {
    aprobacionTemplate,
    devolucionTemplate,
    recordatorioTemplate,
    aplazadoTemplate
} = require('../utils/mailTemplates.js');

let transporter;

const getTransporter = () => {
    if (!transporter) {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
        
        if(!SMTP_HOST) {
            logger.warn('SMTP_HOST no configurado - correos deshabilitados');
            return null;
        }
        
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT) || 587,
            secure: false, 
            auth: SMTP_USER && SMTP_PASS ? { 
                user: SMTP_USER, 
                pass: SMTP_PASS 
            } : undefined,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
        });
    }
    return transporter;
};

const sendMail = async ({ to, subject, text }) => {
    const tx = getTransporter();
    
    if (!tx) {
        logger.warn('Transporter no configurado - correo no enviado');
        return;
    }
    
    const mailOptions = {
        from: process.env.MAIL_FROM || 'no-reply@example.com',
        to,
        subject,
        text
    };
    
    try {
        const result = await tx.sendMail(mailOptions);
        logger.info('✅ Correo enviado exitosamente', { 
            messageId: result.messageId, 
            to,
            subject
        });
        return result;
    } catch (error) {
        logger.error('❌ Error enviando correo', { 
            error: error.message,
            code: error.code,
            to,
            subject,
            host: process.env.SMTP_HOST,
            user: process.env.SMTP_USER
        });
        throw error; 
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
                logger.error('Error en sendAprobacion (background):', err.message);
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
                logger.error('Error en sendDevolucion (background):', err.message);
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
                logger.error('Error en sendRecordatorio (background):', err.message);
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
                logger.error('Error en sendAplazado (background):', err.message);
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