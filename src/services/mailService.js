const nodemailer = require('nodemailer');
const logger = require('../config/logger.js');
const User = require('../models/User.js');
const {
    aprobacionTemplate,
    devolucionTemplate,
    recordatorioTemplate,
    aplazadoTemplate,
    nuevaSolicitudAdminTemplate
} = require('../utils/mailTemplates.js');

let transporter;

const getTransporter = () => {
    if (!transporter) {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
        if(!SMTP_HOST) {
            throw new Error('SMTP_HOST no esta configurado');
        }
        
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT) || 587,
            secure: false,
            auth: SMTP_USER && SMTP_PASS ? { 
                user: SMTP_USER, 
                pass: SMTP_PASS 
            } : undefined,
            tls: {
                rejectUnauthorized: false 
            },
            requireTLS: true,
            logger: false,
            debug: false
        });
    }
    return transporter;
};

const sendMail = async ({ to, subject, text }) => {
    const mailOptions = {
        from: process.env.MAIL_FROM || 'no-reply@example.com',
        to,
        subject,
        text
    };
    
    try {
        const tx = await getTransporter().sendMail(mailOptions);
        logger.info('Correo enviado exitosamente', { 
            messageId: tx.messageId, 
            to,
            subject 
        });
        return tx;
    } catch (error) {
        logger.error('Error enviando correo', { 
            error: error.message,
            to,
            subject,
            stack: error.stack 
        });
        return null;
    }
};

const sendAprobacion = (user, loan, item) => {
    const template = aprobacionTemplate({
        nombreUsuario: user.nombre,
        itemNombre: item.nombre,
        fechaEstimada: loan.fecha_estimada,
        cantidad: loan.cantidad_prestamo
    });
    return sendMail({ ...template, to: user.email });
};

const sendDevolucion = (user, loan, item) => {
    const template = devolucionTemplate({
        nombreUsuario: user.nombre,
        itemNombre: item.nombre,
        cantidad: loan.cantidad_prestamo
    });
    return sendMail({ ...template, to: user.email });
};

const sendRecordatorio = (user, loan, item) => {
    const template = recordatorioTemplate({
        nombreUsuario: user.nombre,
        itemNombre: item.nombre,
        fechaEstimada: loan.fecha_estimada
    });
    return sendMail({ ...template, to: user.email});
};

const sendAplazado = (user, loan, item) => {
    const template = aplazadoTemplate({
        nombreUsuario: user.nombre,
        itemNombre: item.nombre,
        nuevaFecha: loan.fecha_estimada
    });
    return sendMail({ ...template, to: user.email });
};

const notifyAdminsNewLoan = async (user, loan, item, aula) => {
    try {
        const admins = await User.find({ rol: 'Admin' }).lean();
        
        if (!admins || admins.length === 0) {
            logger.warn('No hay administradores registrados en el sistema para notificar');
            return;
        }

        logger.info(`Notificando nueva solicitud a ${admins.length} administrador(es)`);

        const template = nuevaSolicitudAdminTemplate({
            nombreUsuario: user.nombre,
            emailUsuario: user.email,
            itemNombre: item.nombre,
            cantidad: loan.cantidad_prestamo,
            aulaNombre: aula.nombre,
            fechaSolicitud: loan.fecha_solicitud || new Date()
        });

        const emailPromises = admins.map(admin => {
            logger.info(`Enviando notificación a admin: ${admin.nombre} (${admin.email})`);
            return sendMail({ 
                ...template, 
                to: admin.email 
            });
        });

        const results = await Promise.allSettled(emailPromises);
        
        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.filter(r => r.status === 'rejected' || !r.value).length;
        
        logger.info(`Notificaciones procesadas: ${successful} exitosas, ${failed} fallidas`);

    } catch (error) {
        logger.error('Error notificando a administradores:', error);
    }
};

module.exports = {
    sendMail,
    sendAprobacion,
    sendDevolucion,
    sendRecordatorio,
    sendAplazado,
    notifyAdminsNewLoan
};