const nodemailer = require('nodemailer');

//configuration du transporteur SMTP pour GMAIL

const transporter = nodemailer.createTransport({
    service: 'Gmail', //Utilisation de Gmail comme service
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

//FOnction pour envoyer un mail

const sendEmail = async (to, subject, text, html) => {
    try {
        //Creation du contenu de l'email
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to,
            subject,
            text,
            html,
        };

        // Envoi de l'email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email envoyé : %s', info.messageId);
        return { success: true, messageId: info.messageId};
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email : ', error.message);
        return { success: false, error: error.message}
    }
}

module.exports = { sendEmail };