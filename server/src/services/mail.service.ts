import Mail from 'nodemailer/lib/mailer';
import transporter from '../config/smtp.config';

class MailService {
  public sendMail = async (mailOptions: Mail.Options) => {
    console.log('📤 Sending email with options:', mailOptions);

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent: ', info.response);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
    }
  };
}

const mailService = new MailService();
export { mailService };
