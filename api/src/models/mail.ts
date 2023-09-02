//nodemailer
import nodemailer from 'nodemailer';

//config

export const transporter = nodemailer.createTransport({
    host: 'smtp.tipimail.com',
    port: 25,
    auth: {
        user: 'guillaume.casal@gmail.com',
        pass: 'q3e%ViwiyXK@:Q='
    }
});

//try to send mail
export const sendMail = async (mailOptions: any) => {
    console.log('test mail')
    try {
        await transporter.sendMail(mailOptions);
        console.log('mail sent');
    } catch (error) {
        console.log(error);
    }
}

//mail options
export const mailOptions = {
    from: 'guillaume.casal@gmail.com',
    to: 'amela57290@gmail.com',
    subject: 'test',
    text: 'test'
}

//send mail
export const test = () => sendMail(mailOptions);