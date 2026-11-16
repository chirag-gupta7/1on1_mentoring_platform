import smtplib
from email.mime.text import MIMEText

from app.core.config import get_settings
from app.core.logger import logger


async def send_email(to_email: str, subject: str, body: str) -> None:
    settings = get_settings()

    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.info(
            "Email not configured. Would send - To: %s | Subject: %s", to_email, subject
        )
        return

    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
        logger.info("Email sent to %s: %s", to_email, subject)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
