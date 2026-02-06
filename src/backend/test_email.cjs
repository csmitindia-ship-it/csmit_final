const nodemailer = require('nodemailer');

async function testEmail() {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'csmitindia@gmail.com',
            pass: 'kjue fgfj pwqy fqvk'
        },
        connectionTimeout: 10000, // 10 seconds
        logger: true,
        debug: true
    });

    try {
        console.log('Attempting to verify connection...');
        await transporter.verify();
        console.log('Connection verified successfully!');

        /* 
        // Optional: Try sending a test email
        const info = await transporter.sendMail({
          from: 'csmitindia@gmail.com',
          to: 'divakarsubramani2005@gmail.com', // Using the email from recent registrations as a test target, or just the sender
          subject: 'Test Email Connectivity',
          text: 'If you receive this, the connection is working.'
        });
        console.log('Message sent: %s', info.messageId);
        */
    } catch (error) {
        console.error('Connection failed:', error);
    }
}

testEmail();
