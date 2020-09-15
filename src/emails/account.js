const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'lightyagami@post.com',
        subject: 'Thanks for Joining',
        text: `Welcome to the App, ${name}. let me know how you get along`
    });
}

const sendCacellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'lightyagami@post.com',
        subject: 'Cancellation mail',
        text: `Plz tell us why you left :)`
    });
}

module.exports = {
    sendWelcomeEmail,
    sendCacellationEmail
}