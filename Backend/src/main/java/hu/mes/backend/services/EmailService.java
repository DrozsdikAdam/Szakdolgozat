package hu.mes.backend.services;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Async
    public void sendPasswordResetEmail(String emailTo, String resetLink) {

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            String htmlContent = String.format(
                    """
                            <!DOCTYPE html>
                            <html lang="hu">
                            <head>
                                <meta charset="UTF-8">
                                <title>Jelszó visszaállítás</title>
                            </head>
                            <body style="font-family: sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
                                <div style="max-width: 600px; margin: 20px auto; background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                    <div style="text-align: center; margin-bottom: 30px;">
                                        <h2 style="color: #0f172a;">MES Rendszer</h2>
                                        <p style="color: #64748b;">Gyártásirányítási és Logisztikai Rendszer</p>
                                    </div>

                                    <h3 style="color: #1e293b; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Jelszó visszaállítás</h3>

                                    <p style="font-size: 16px; line-height: 1.6;">Kedves Felhasználó!</p>

                                    <p style="font-size: 16px; line-height: 1.6;">
                                        Érkezett egy kérés a jelszavad visszaállítására. Ha nem te kezdeményezted ezt a kérést, kérjük, hagyd figyelmen kívül ezt az e-mailt.
                                    </p>

                                    <div style="margin: 30px 0; text-align: center;">
                                        <a href="%s" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">
                                            Jelszó visszaállítása
                                        </a>
                                    </div>

                                    <p style="font-size: 16px; line-height: 1.6;">A link 15 percen belül érvényét veszti.</p>

                                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                        <p style="font-size: 14px; color: #94a3b8;">Üdvözlettel,</p>
                                        <p style="font-size: 14px; color: #94a3b8; font-weight: bold; margin: 5px 0 0 0;">MES Rendszer Csapat</p>
                                    </div>

                                    <div style="margin-top: 20px; text-align: center; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                                        <p style="font-size: 12px; color: #cbd5e1; margin: 0;">
                                            Ez egy automatikus e-mail, kérjük, ne válaszoljon erre az e-mailre.
                                        </p>
                                    </div>
                                </div>
                            </body>
                            </html>
                            """,
                    resetLink);
            helper.setTo(emailTo);
            helper.setSubject("MES Rendszer - Jelszó visszaállítás");
            helper.setFrom("noreply@mes.hu");
            helper.setText(htmlContent, true);

            javaMailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", emailTo, e);
        }

    }

}
